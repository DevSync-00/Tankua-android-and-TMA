export const announcementFields = {
  destination: "Destination",
  summary: "Summary",
  departureDate: "Departure date (YYYY-MM-DD)",
  departureTime: "Departure time (HH:mm EAT)",
  returnDate: "Return date (YYYY-MM-DD)",
  returnTime: "Return time (HH:mm EAT)",
  price: "Per-person fare",
  currency: "Currency (ETB or USD)",
  maxSeats: "Number of seats",
  itinerary: "Itinerary",
  inclusions: "Included items",
  exclusions: "Separate costs",
  meetingInstructions: "Meeting instructions",
} as const;

export type AnnouncementField = keyof typeof announcementFields;
export type AnnouncementDraft = Partial<Record<AnnouncementField, string>>;
export const maxAnnouncementLength = 4000;

const date = /^\d{4}-\d{2}-\d{2}$/;
const time = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export function parseAnnouncementDraft(value: unknown): AnnouncementDraft {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid draft");
  const draft: AnnouncementDraft = {};
  for (const key of Object.keys(announcementFields) as AnnouncementField[]) {
    const field = (value as Record<string, unknown>)[key];
    if (field == null) continue;
    if (typeof field !== "string") throw new Error("Invalid draft field");
    const content = field.trim();
    if (!content || content.length > (key === "summary" ? 280 : 1200)) continue;
    if (key.endsWith("Date") && (!date.test(content) || new Date(content + "T00:00:00Z").toJSON()?.slice(0, 10) !== content)) continue;
    if (key.endsWith("Time") && !time.test(content)) continue;
    if (key === "currency" && content !== "ETB" && content !== "USD") continue;
    if (key === "price" && (!/^\d{1,9}(?:\.\d{1,2})?$/.test(content) || Number(content) <= 0)) continue;
    if (key === "maxSeats" && (!/^\d{1,3}$/.test(content) || Number(content) < 1 || Number(content) > 100)) continue;
    draft[key] = content;
  }
  return draft;
}
