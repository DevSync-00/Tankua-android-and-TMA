// Payment Gateway Configuration
// Chapa secret key: set EXPO_PUBLIC_CHAPA_SECRET_KEY (or legacy EXPO_PUBLIC_CHAPA_API_KEY)

const resolveChapaApiKey = () => {
  const secret = process.env.EXPO_PUBLIC_CHAPA_SECRET_KEY?.trim();
  const legacy = process.env.EXPO_PUBLIC_CHAPA_API_KEY?.trim();
  return secret || legacy || '';
};

const CHAPA_PLACEHOLDER = 'CHk_test_xxxxxxxxxxxxx';

const resolveHttpsUrl = (value, fallback) => {
  const url = value?.trim();
  if (!url || url.includes('your-backend.com') || !/^https:\/\//i.test(url)) {
    return fallback;
  }
  return url;
};

export const isChapaKeyConfigured = (key = resolveChapaApiKey()) => {
  if (!key || typeof key !== 'string') return false;
  const trimmed = key.trim();
  if (!trimmed) return false;
  if (trimmed.includes('xxxxx')) return false;
  if (trimmed === CHAPA_PLACEHOLDER) return false;
  if (trimmed === 'your_chapa_api_key_here') return false;
  return true;
};

export const PAYMENT_CONFIG = {
  chapa: {
    apiKey: resolveChapaApiKey() || CHAPA_PLACEHOLDER,
    baseUrl: 'https://api.chapa.co/v1',
  },

  callbacks: {
    // Chapa requires https return/callback URLs (custom schemes are rejected)
    returnUrl: resolveHttpsUrl(process.env.EXPO_PUBLIC_CHAPA_RETURN_URL, 'https://chapa.co'),
    webhook: resolveHttpsUrl(process.env.EXPO_PUBLIC_WEBHOOK_URL, 'https://chapa.co'),
  },
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SUCCESS: 'success',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

export const PAYMENT_METHODS = {
  CHAPA: 'chapa',
};
