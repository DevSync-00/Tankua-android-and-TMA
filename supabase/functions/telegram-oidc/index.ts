import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { verifyTelegramOIDC } from './telegram-oidc-verifier.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }

  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const clientId = Deno.env.get('TELEGRAM_OIDC_CLIENT_ID') || '8319181574';

    if (!url || !anonKey || !serviceKey) {
      throw new Error('Telegram OIDC service is not configured on server');
    }

    const { idToken, nonce } = await req.json();
    if (!idToken) {
      throw new Error('Missing idToken in request payload');
    }

    // 1. Verify RS256 JWKS signature and OIDC token claims
    const claims = await verifyTelegramOIDC(idToken, nonce || null, clientId);
    const telegramId = claims.id || Number(claims.sub);
    if (!telegramId) {
      throw new Error('Could not extract valid Telegram user ID from token');
    }

    const email = `telegram-${telegramId}@auth.tankua.app`;
    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
    const publicClient = createClient(url, anonKey, { auth: { persistSession: false } });

    // 2. Generate magiclink token via Admin service-role client
    // (Exchanged directly in memory below without sending an email to synthetic address)
    const { data: link, error: linkError } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        data: {
          telegram_id: String(telegramId),
          provider: 'telegram_oidc',
        },
      },
    });

    if (linkError || !link?.properties?.hashed_token) {
      throw linkError || new Error('Could not create Telegram OIDC session link');
    }

    // 3. Immediately exchange the token_hash for an active session object
    const { data: verified, error: verifyError } = await publicClient.auth.verifyOtp({
      token_hash: link.properties.hashed_token,
      type: 'magiclink',
    });

    if (verifyError || !verified.session?.user?.id) {
      throw verifyError || new Error('Could not verify Telegram OIDC session');
    }

    // 4. Link user profile in DB via service_role RPC function
    const name = claims.name || [claims.given_name, claims.family_name].filter(Boolean).join(' ') || claims.preferred_username || 'Telegram User';
    
    const { error: profileError } = await admin.rpc('link_telegram_oidc_user', {
      p_auth_user_id: verified.session.user.id,
      p_telegram_id: telegramId,
      p_name: name,
      p_username: claims.preferred_username || null,
      p_photo_url: claims.picture || null,
      p_phone_number: claims.phone_number || null,
      p_phone_number_verified: Boolean(claims.phone_number_verified),
      p_sub: claims.sub ? String(claims.sub) : null,
    });

    if (profileError) {
      console.error('[Telegram OIDC Edge Function] Profile RPC error:', profileError);
      throw profileError;
    }

    console.info(JSON.stringify({
      event: 'telegram_oidc_auth_success',
      telegram_id: telegramId,
      phone_verified: Boolean(claims.phone_number_verified),
    }));

    return new Response(
      JSON.stringify({ session: verified.session }),
      { headers: { ...cors, 'content-type': 'application/json' } },
    );
  } catch (error) {
    console.error(JSON.stringify({
      event: 'telegram_oidc_auth_failed',
      reason: error instanceof Error ? error.message : 'Unknown authentication failure',
    }));

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Telegram authentication failed' }),
      {
        status: 400,
        headers: { ...cors, 'content-type': 'application/json' },
      },
    );
  }
});
