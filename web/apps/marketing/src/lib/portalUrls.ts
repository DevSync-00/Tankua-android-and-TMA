const DEFAULT_PROVIDER_URL = "https://provider.tankua.co";
const DEFAULT_ADMIN_URL = "https://admin.tankua.co";

const normalizeBaseUrl = (value: string | undefined, fallback: string) => {
  if (!value || typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
};

/** Production cutover: legacy env may still point at provider.tankua.et */
const coerceProviderProductionHost = (url: string) =>
  url.replace(/^https?:\/\/provider\.tankua\.et(?=$|[/:])/i, "https://provider.tankua.co");

export const providerPortalUrl = coerceProviderProductionHost(
  normalizeBaseUrl(process.env.NEXT_PUBLIC_PROVIDER_URL, DEFAULT_PROVIDER_URL)
);

export const providerRegisterUrl = `${providerPortalUrl}/register`;

export const adminPortalUrl = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_ADMIN_URL,
  DEFAULT_ADMIN_URL
);
