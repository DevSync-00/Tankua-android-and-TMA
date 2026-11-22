import { useState, type FormEvent } from "react";
import { ArrowDown, ChevronDown, FileText } from "lucide-react";
import { Button } from "@tankua/ui";
import { supabase } from "@/lib/supabase";
import { announcementFields, maxAnnouncementLength, parseAnnouncementDraft, type AnnouncementDraft, type AnnouncementField } from "@/lib/trip-announcement";
import { initialForm, type Destination, type TripForm } from "./trip-form-fields";

const normalize = (text: string) => text.normalize("NFKC").trim().toLocaleLowerCase();
const required: AnnouncementField[] = ["destination", "departureDate", "departureTime", "price", "currency", "maxSeats"];

export function AnnouncementDraftPanel({ form, destinations, apply, disabled }: {
  form: TripForm;
  destinations: Destination[];
  apply: (updates: Partial<TripForm>) => void;
  disabled: boolean;
}) {
  const [text, setText] = useState("");
  const [draft, setDraft] = useState<AnnouncementDraft | null>(null);
  const [excluded, setExcluded] = useState<AnnouncementField[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const matches = draft?.destination ? destinations.filter((destination) => normalize(destination.name) === normalize(draft.destination!)) : [];
  const fields = Object.entries(draft ?? {}) as [AnnouncementField, string][];
  const missing = required.filter((key) => !draft?.[key] || (key === "destination" && matches.length !== 1));
  const canApplyFare = Boolean(draft?.price && draft.currency) && !form.price &&
    (form.currency === initialForm.currency || form.currency === draft?.currency);
  function canApply(key: AnnouncementField) {
    if (key === "destination") return !form.destinationId && matches.length === 1;
    if (key === "currency" || key === "price") return canApplyFare;
    if (key === "departureTime") return !form.departureDate && form.departureTime === initialForm.departureTime;
    if ((key === "returnTime" || key === "returnDate") && form.tripType !== "round_trip") return false;
    return !form[key];
  }

  async function generate(event: FormEvent) {
    event.preventDefault();
    if (busy || !text.trim()) return;
    setBusy(true);
    setError("");
    setNotice("");
    setDraft(null);
    setExcluded([]);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sign in again to draft a trip.");
      const response = await fetch("/api/trip-announcement", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Couldn’t prepare a draft.");
      setDraft(parseAnnouncementDraft(result.draft));
      setNotice("Draft ready. Choose the details you want to add.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Couldn’t prepare a draft.");
    } finally {
      setBusy(false);
    }
  }

  function applyDraft() {
    const updates: Partial<TripForm> = {};
    for (const [key, value] of fields) {
      if (excluded.includes(key) || !canApply(key)) continue;
      if ((key === "price" || key === "currency") && (excluded.includes("price") || excluded.includes("currency"))) continue;
      if (key === "destination") updates.destinationId = matches[0].id;
      else updates[key] = value;
    }
    if (!Object.keys(updates).length) return;
    if (updates.departureDate && !updates.departureTime && form.departureTime === initialForm.departureTime) updates.departureTime = "";
    apply(updates);
    setDraft(null);
    setNotice("Selected details added. Check the schedule, fare and pickup before publishing.");
  }

  const hasSelection = fields.some(([key]) => !excluded.includes(key) && canApply(key));
  return (
    <details className="group mb-5 max-w-3xl rounded-xl border border-border bg-card px-4 sm:px-6">
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 rounded-md py-3 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
        <FileText className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
        <span className="min-w-0 flex-1"><strong className="block">Start from an announcement</strong>
          <span className="mt-0.5 block text-sm text-muted-foreground">Prepare a draft from Amharic or English text.</span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-primary group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="border-t border-border pb-5 pt-4">
      <form onSubmit={generate} className="space-y-3">
        <label htmlFor="announcement" className="block text-sm font-medium">Trip announcement</label>
        <textarea id="announcement" dir="auto" rows={4} maxLength={maxAnnouncementLength} value={text} disabled={busy || disabled}
          className="block w-full rounded-lg border border-input bg-background px-3 py-2.5 text-base focus-visible:outline-primary"
          onChange={(event) => { setText(event.target.value); setDraft(null); setNotice(""); setError(""); }} />
        <Button type="submit" isLoading={busy} disabled={disabled || !text.trim()}>{busy ? "Reading announcement…" : "Prepare draft"}</Button>
      </form>
      {error && <p className="mt-3 text-sm text-red-800" role="alert">{error}</p>}
      <div className="mt-3 text-sm text-muted-foreground" role="status">{notice}</div>
      {draft && (
        <div className="mt-3 space-y-3 border-t border-border pt-4">
          <h3 className="font-semibold">Review suggested details</h3>
          {fields.length > 0 && <ul className="divide-y divide-border rounded-lg border border-border">
            {fields.map(([key, value]) => (
              <li key={key}>
                <label className="flex min-h-11 items-start gap-3 px-3 py-2.5 text-sm">
                  <input type="checkbox" className="mt-1 accent-primary" checked={canApply(key) && !excluded.includes(key)} disabled={!canApply(key) || disabled}
                    onChange={(event) => {
                      const keys: AnnouncementField[] = key === "price" || key === "currency" ? ["price", "currency"] : [key];
                      setExcluded(event.target.checked ? excluded.filter((item) => !keys.includes(item)) : [...excluded, ...keys]);
                    }} />
                  <span className="min-w-0"><span className="block font-medium">{announcementFields[key]}</span>
                    <span dir="auto" className="block whitespace-pre-wrap break-words text-muted-foreground">{value}</span>
                    {!canApply(key) && <span className="block text-xs text-muted-foreground">Check this field in the trip form.</span>}
                  </span>
                </label>
              </li>
            ))}
          </ul>}
          {missing.length > 0 && <p className="text-sm text-muted-foreground">Needs your input · {missing.map((key) => announcementFields[key]).join(", ")}</p>}
          <p className="text-sm text-muted-foreground">Choose pickup stations and booking rules in the trip form.</p>
          <Button type="button" disabled={disabled || !hasSelection} onClick={applyDraft}>Add selected details <ArrowDown className="ml-1 h-4 w-4" aria-hidden="true" /></Button>
        </div>
      )}
      </div>
    </details>
  );
}
