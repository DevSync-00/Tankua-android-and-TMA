export interface TelegramOIDCClaims {
  id: number;
  sub: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  preferred_username?: string;
  picture?: string;
  phone_number?: string;
  phone_number_verified?: boolean;
  iss?: string;
  aud?: string;
  exp?: number;
  nonce?: string;
}

interface JWK {
  kty: string;
  alg: string;
  use: string;
  kid: string;
  n: string;
  e: string;
}

interface JWKS {
  keys: JWK[];
}

let jwksCache: { keys: JWK[]; fetchedAt: number } | null = null;
const JWKS_TTL_MS = 3600 * 1000; // 1 hour

async function fetchJWKS(): Promise<JWKS> {
  const now = Date.now();
  if (jwksCache && now - jwksCache.fetchedAt < JWKS_TTL_MS) {
    return jwksCache;
  }
  const response = await fetch('https://oauth.telegram.org/.well-known/jwks.json');
  if (!response.ok) {
    throw new Error(`Failed to fetch Telegram JWKS (HTTP ${response.status})`);
  }
  const data = (await response.json()) as JWKS;
  jwksCache = { keys: data.keys, fetchedAt: now };
  return data;
}

function base64UrlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '=='.slice(0, (4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function verifyTelegramOIDC(
  idToken: string,
  expectedNonce: string | null,
  expectedClientId: string,
): Promise<TelegramOIDCClaims> {
  if (!idToken) {
    throw new Error('id_token is required');
  }

  const parts = idToken.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format');
  }

  const [headerB64, payloadB64, signatureB64] = parts;
  const headerJson = new TextDecoder().decode(base64UrlDecode(headerB64));
  const payloadJson = new TextDecoder().decode(base64UrlDecode(payloadB64));

  let header: { alg: string; kid: string; typ?: string };
  let claims: TelegramOIDCClaims;

  try {
    header = JSON.parse(headerJson);
    claims = JSON.parse(payloadJson);
  } catch {
    throw new Error('Invalid JSON in token header or payload');
  }

  if (header.alg !== 'RS256') {
    throw new Error(`Unsupported algorithm: ${header.alg}`);
  }

  // Fetch JWKS and locate matching key
  const jwks = await fetchJWKS();
  const matchingKey = jwks.keys.find((k) => k.kid === header.kid);
  if (!matchingKey) {
    // Retry once with fresh cache on kid miss
    jwksCache = null;
    const freshJwks = await fetchJWKS();
    const freshKey = freshJwks.keys.find((k) => k.kid === header.kid);
    if (!freshKey) {
      throw new Error(`Public key with kid '${header.kid}' not found in Telegram JWKS`);
    }
  }

  const targetKey = matchingKey || jwks.keys[0];

  // Import CryptoKey for RSASSA-PKCS1-v1_5 SHA-256
  const cryptoKey = await crypto.subtle.importKey(
    'jwk',
    {
      kty: targetKey.kty,
      n: targetKey.n,
      e: targetKey.e,
      alg: 'RS256',
      ext: true,
    },
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  );

  const dataToVerify = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const signatureBytes = base64UrlDecode(signatureB64);

  const isValid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    signatureBytes,
    dataToVerify,
  );

  if (!isValid) {
    throw new Error('Invalid Telegram OIDC token signature');
  }

  // Validate standard OIDC claims
  if (claims.iss !== 'https://oauth.telegram.org') {
    throw new Error(`Invalid issuer: ${claims.iss}`);
  }

  if (claims.aud !== expectedClientId) {
    throw new Error(`Invalid audience: ${claims.aud} (expected ${expectedClientId})`);
  }

  const nowSec = Math.floor(Date.now() / 1000);
  if (claims.exp && claims.exp < nowSec) {
    throw new Error('Telegram OIDC token has expired');
  }

  // Nonce & Replay protection: if nonce is present in claims, verify match
  if (expectedNonce && claims.nonce && claims.nonce !== expectedNonce) {
    throw new Error('Telegram OIDC token nonce mismatch');
  }

  if (!claims.id && !claims.sub) {
    throw new Error('Token payload missing user identifier (id/sub)');
  }

  return claims;
}
