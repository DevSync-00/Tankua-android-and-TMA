import type { TripPromotionChannel } from "@tankua/ui";

export const TELEGRAM_MINI_APP_URL =
  process.env.NEXT_PUBLIC_TELEGRAM_MINI_APP_URL ??
  "https://t.me/tankua_tma_bot";

export function getTelegramTripUrl(tripId: string, channel?: TripPromotionChannel | null) {
  const url = new URL(TELEGRAM_MINI_APP_URL);
  url.searchParams.set("startapp", channel ? `trip_${tripId}_${channel}` : `trip_${tripId}`);
  return url.toString();
}
