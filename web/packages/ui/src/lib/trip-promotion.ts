export const tripPromotionChannels = [
  { id: "telegram", label: "Telegram" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "instagram", label: "Instagram" },
] as const;

export type TripPromotionChannel = (typeof tripPromotionChannels)[number]["id"];

export function getTripPromotionChannel(value: string | null): TripPromotionChannel | null {
  return tripPromotionChannels.find(({ id }) => id === value)?.id ?? null;
}
