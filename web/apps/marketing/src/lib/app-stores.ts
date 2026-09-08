/** Same targets as `/download` — update here to keep navbar + landing in sync. */
export const APP_STORE_URL = "https://apps.apple.com/app/tankua";
export const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.tankua.app";

/** Relative path shown when we can't infer iOS/Android (desktop, bots). */
export const DOWNLOAD_PAGE_PATH = "/download";

export function getPreferredStoreUrl(userAgent?: string): string {
  if (typeof window === "undefined") return DOWNLOAD_PAGE_PATH;
  const ua = userAgent ?? navigator.userAgent ?? "";
  if (/iPad|iPhone|iPod/i.test(ua)) return APP_STORE_URL;
  if (/Android/i.test(ua)) return PLAY_STORE_URL;
  return DOWNLOAD_PAGE_PATH;
}
