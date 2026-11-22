export const TELEGRAM_MINI_APP_URL =
  process.env.NEXT_PUBLIC_TELEGRAM_MINI_APP_URL ??
  "https://t.me/tankua_tma_bot";

export function getTelegramTripUrl(tripId: string) {
  const url = new URL(TELEGRAM_MINI_APP_URL);
  url.searchParams.set("startapp", `trip_${tripId}`);
  return url.toString();
}
