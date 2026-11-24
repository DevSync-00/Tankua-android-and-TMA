"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CircleCheck, MapPin } from "lucide-react";
import { Header } from "@/components/header";
import { Button, Card, ConfirmDialog, getTripCurrency } from "@tankua/ui";
import { createTrip, getProviderTrip } from "@/lib/queries";
import { supabase } from "@/lib/supabase";
import { getTripDateParts, parseTripTime } from "@/lib/trip-schedule";
import { tripMoneyPattern } from "@/lib/trip-currency";
import { AnnouncementDraftPanel } from "./announcement-draft";
import {
  initialForm, maxInterest, maxSeats, maxSummary, minFares, sections, TripFormFields,
  type Destination, type Options, type Station, type StationConfig, type TripForm,
} from "./trip-form-fields";

type Draft = { form: TripForm; stations: Record<string, StationConfig> };
const draftPrefix = "tankua-provider-trip-draft:v1:";
const clockPattern = /^([01]\d|2[0-3]):[0-5]\d$/;
const fareFormat = new Intl.NumberFormat("en-ET", { maximumFractionDigits: 2 });
const dateFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Africa/Addis_Ababa", weekday: "short", day: "numeric", month: "short", year: "numeric",
});

function readDraft(key: string): Draft | null {
  try {
    const stored = sessionStorage.getItem(key);
    if (!stored) return null;
    const draft = JSON.parse(stored) as Partial<Draft>;
    const form = { ...initialForm };
    for (const field of Object.keys(initialForm) as Array<keyof TripForm>) {
      const value = draft.form?.[field];
      if (typeof value === "string") form[field] = value;
    }
    form.currency = getTripCurrency(form.currency);
    const stations = Object.fromEntries(
      Object.entries(draft.stations ?? {}).filter(([, config]) => config &&
        typeof config.selected === "boolean" && typeof config.pickupTime === "string" && typeof config.extraPrice === "string"),
    );
    return { form, stations };
  } catch {
    return null;
  }
}

function sectionLinks() {
  return sections.map(({ id, label }) => (
    <li key={id}><a href={"#" + id} className="block rounded-sm font-medium text-stone-700 hover:underline focus-visible:outline-primary">{label}</a></li>
  ));
}

function normalizeLines(value: string) {
  return value.split("\n").map((line) => line.trim()).filter(Boolean);
}

export default function NewTripPage() {
  const router = useRouter();
  const [providerId, setProviderId] = useState("");
  const [copyId, setCopyId] = useState("");
  const [form, setForm] = useState<TripForm>(initialForm);
  const [stationConfig, setStationConfig] = useState<Record<string, StationConfig>>({});
  const [destinations, setDestinations] = useState<Options<Destination> | null>(null);
  const [stations, setStations] = useState<Options<Station> | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [reload, setReload] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const publishing = useRef(false);
  const errorSummary = useRef<HTMLDivElement>(null);
  const draftKey = providerId ? draftPrefix + providerId + (copyId ? ":" + copyId : "") : "";

  const isRoundTrip = form.tripType === "round_trip";
  const currency = getTripCurrency(form.currency);
  const waitsForInterest = form.bookingMode === "interest";
  const departure = parseTripTime(form.departureDate, form.departureTime);
  const returnAt = isRoundTrip ? parseTripTime(form.returnDate, form.returnTime) : null;
  const earliestDate = getTripDateParts(new Date().toISOString()).date;
  const selectedDestination = destinations?.data.find(({ id }) => id === form.destinationId);
  const selectedStations = (stations?.data ?? []).filter(({ id }) => stationConfig[id]?.selected);
  const missingStationIds = stations && !stations.error ? Object.keys(stationConfig).filter((id) =>
    stationConfig[id].selected && !stations.data.some((station) => station.id === id),
  ) : [];
  const hasDraft = (Object.keys(initialForm) as Array<keyof TripForm>).some((field) => form[field] !== initialForm[field])
    || Object.values(stationConfig).some((config) => config.selected);

  useEffect(() => {
    let mounted = true;
    async function initialize() { try {
      const session = JSON.parse(localStorage.getItem("provider_user") || "null");
      const id = session?.provider_id || session?.provider?.id;
      if (!id) {
        router.replace("/login");
        return;
      }
      const sourceId = new URLSearchParams(window.location.search).get("copy");
      const copy = sourceId && /^[0-9a-f-]{36}$/i.test(sourceId) ? sourceId : "";
      const draft = readDraft(draftPrefix + id + (copy ? ":" + copy : ""));
      if (draft) {
        setForm(draft.form);
        setStationConfig(draft.stations);
      } else if (copy) {
        const { trip, stations: links, error } = await getProviderTrip(id, copy);
        if (!mounted) return;
        if (!trip) setSaveError(error || "Could not copy that trip.");
        else {
          setForm({ ...initialForm, destinationId: trip.destination_id || "", summary: trip.summary || "",
            tripType: trip.trip_type === "one_way" ? "one_way" : "round_trip",
            departureTime: getTripDateParts(trip.departure_date).time || initialForm.departureTime,
            returnTime: getTripDateParts(trip.return_date || "").time,
            price: String(trip.price ?? ""), currency: getTripCurrency(trip.currency), maxSeats: String(trip.max_seats ?? ""),
            bookingMode: trip.minimum_interest == null ? "immediate" : "interest", itinerary: trip.itinerary || "",
            tourCategory: trip.tour_category || "", durationHours: trip.duration_minutes ? String(trip.duration_minutes / 60) : "",
            transportationType: trip.transportation_type || "", difficultyLevel: trip.difficulty_level || "easy",
            inclusions: (trip.inclusions ?? []).join("\n"), exclusions: (trip.exclusions ?? []).join("\n"),
            meetingInstructions: trip.meeting_instructions || "", whatToBring: trip.what_to_bring || "",
            cancellationPolicy: trip.cancellation_policy || "",
          });
          setStationConfig(Object.fromEntries(links.map(link => [link.station_id, {
            selected: true, pickupTime: link.pickup_time, extraPrice: String(link.extra_price ?? 0),
          }])));
        }
      }
      setCopyId(copy);
      setProviderId(id);
    } catch {
      router.replace("/login");
    } }
    void initialize();
    return () => { mounted = false; };
  }, [router]);

  useEffect(() => {
    if (!providerId) return;
    const controller = new AbortController();
    const loadDestinations = async () => {
      const { data, error } = await supabase.from("destinations").select("id,name,city,region,category").order("name")
        .abortSignal(controller.signal);
      if (!controller.signal.aborted) setDestinations({ data: data ?? [], error: error ? "Destinations could not be loaded." : null });
    };
    const loadStations = async () => {
      const { data, error } = await supabase.from("pickup_stations").select("id,name,city,address,extra_price,is_address_pickup")
        .eq("provider_id", providerId).eq("is_active", true).order("name").abortSignal(controller.signal);
      if (!controller.signal.aborted) setStations({ data: data ?? [], error: error ? "Pickup stations could not be loaded." : null });
    };

    void loadDestinations();
    void loadStations();
    return () => controller.abort();
  }, [providerId, reload]);

  useEffect(() => {
    if (!draftKey) return;
    try {
      if (hasDraft) sessionStorage.setItem(draftKey, JSON.stringify({ form, stations: stationConfig }));
      else sessionStorage.removeItem(draftKey);
      setDraftSaved(hasDraft);
    } catch {
      setDraftSaved(false);
    }
  }, [draftKey, form, hasDraft, stationConfig]);

  useEffect(() => {
    if (saveError) errorSummary.current?.focus();
  }, [saveError]);

  function clearErrors(...fields: string[]) {
    setErrors((current) => {
      if (!fields.some((field) => current[field])) return current;
      const next = { ...current };
      for (const field of fields) delete next[field];
      return next;
    });
    setSaveError("");
  }

  function updateField(field: keyof TripForm, value: string) {
    if (field === "currency") {
      if (value === currency) return;
      setForm((current) => ({ ...current, currency: getTripCurrency(value), price: "" }));
      setStationConfig((current) => Object.fromEntries(
        Object.entries(current).map(([id, config]) => [id, { ...config, extraPrice: "" }]),
      ));
      clearErrors("price", ...Object.keys(stationConfig).map((id) => "pickup-fee-" + id));
      return;
    }
    setForm((current) => ({ ...current, [field]: value }));
    if (field === "departureTime") clearErrors(field, "departureDate", "returnTime");
    else if (field === "departureDate" || field === "returnDate") clearErrors(field, "returnTime");
    else clearErrors(field);
  }

  function updateStation(station: Station, updates: Partial<StationConfig>) {
    setStationConfig((current) => ({
      ...current,
      [station.id]: {
        ...(current[station.id] ?? {
          selected: false,
          pickupTime: form.departureTime,
          extraPrice: currency === "ETB" ? String(station.extra_price ?? 0) : "",
        }),
        ...updates,
      },
    }));
    clearErrors("pickup", "pickup-time-" + station.id, "pickup-fee-" + station.id);
  }

  function retryOptions() {
    setStations(null);
    setDestinations(null);
    setReload((current) => current + 1);
  }

  function removeUnavailableStations() {
    setStationConfig((current) => Object.fromEntries(Object.entries(current).filter(([id]) => !missingStationIds.includes(id))));
    clearErrors("pickup");
  }

  function clearDraft() {
    setForm(initialForm);
    setStationConfig({});
    setSearch("");
    setCategory("");
    setErrors({});
    setSaveError("");
    document.getElementById("basics")?.focus();
  }

  async function publishTrip(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!providerId || publishing.current) return;
    setSaveError("");

    const issues: Record<string, string> = {};
    const summary = form.summary.trim();
    const price = Number(form.price);
    const seats = Number(form.maxSeats);
    const minimumInterest = Number(form.minimumInterest);
    const duration = Number(form.durationHours);
    const durationMinutes = Math.round(duration * 60);

    if (!selectedDestination) issues.destinationId = "Choose a destination.";
    if (!summary || summary.length > maxSummary) issues.summary = "Enter a summary of up to 280 characters.";
    if (!form.departureDate) issues.departureDate = "Choose a departure date.";
    else if (!departure) issues.departureTime = "Enter a valid departure date and time.";
    else if (departure.getTime() <= Date.now()) issues.departureDate = "Choose a future departure.";
    if (isRoundTrip) {
      if (!form.returnDate) issues.returnDate = "Choose a return date.";
      else if (!returnAt) issues.returnTime = "Enter a valid return date and time.";
      else if (departure && returnAt <= departure) issues.returnTime = "Choose a return time after departure.";
    }

    if (!Number.isInteger(seats) || seats < 1 || seats > maxSeats) issues.maxSeats = "Enter a whole number from 1 to 100.";
    if (!Number.isFinite(price) || price < minFares[currency] || !tripMoneyPattern.test(form.price)) {
      issues.price = `Enter at least ${currency} ${minFares[currency]}, with up to two decimal places.`;
    }
    if (!selectedStations.length) issues.pickup = "Select at least one active pickup station.";
    else if (missingStationIds.length) issues.pickup = "Remove the unavailable stations from this draft.";

    for (const { id } of selectedStations) {
      const { pickupTime, extraPrice } = stationConfig[id];
      if (!clockPattern.test(pickupTime)) issues["pickup-time-" + id] = "Enter a pickup time.";
      if (extraPrice && (!tripMoneyPattern.test(extraPrice) || !Number.isFinite(Number(extraPrice)))) {
        issues["pickup-fee-" + id] = "Enter a nonnegative amount with up to two decimal places.";
      }
    }

    if (waitsForInterest && (!Number.isInteger(minimumInterest) || minimumInterest < 1 || minimumInterest > maxInterest)) {
      issues.minimumInterest = "Enter a positive whole number up to 2,147,483,647.";
    } else if (waitsForInterest && Number.isInteger(seats) && minimumInterest > seats) {
      issues.minimumInterest = "The seat goal can't be more than the trip's seats.";
    }
    if ((!isRoundTrip || form.durationHours) && (!Number.isFinite(duration) || duration < 0.5 || durationMinutes > maxInterest)) {
      issues.durationHours = "Enter a duration of at least 0.5 hours.";
    }

    setErrors(issues);
    const firstIssue = Object.keys(issues)[0];
    if (firstIssue || !departure) {
      requestAnimationFrame(() => {
        const field = document.getElementById(firstIssue);
        const details = field?.closest("details");
        if (details) details.open = true;
        if (field?.matches(":disabled")) {
          document.getElementById("basics")?.focus();
        } else {
          field?.focus();
        }
      });
      return;
    }

    publishing.current = true;
    setSaving(true);
    let published = false;
    try {
      const result = await createTrip({
        provider_id: providerId,
        destination_id: form.destinationId,
        trip_type: form.tripType,
        departure_date: departure.toISOString(),
        return_date: returnAt?.toISOString(),
        price,
        currency,
        max_seats: seats,
        minimum_interest: waitsForInterest ? minimumInterest : undefined,
        summary,
        tour_category: form.tourCategory || undefined,
        itinerary: form.itinerary.trim() || undefined,
        duration_minutes: form.durationHours ? durationMinutes : undefined,
        transportation_type: form.transportationType.trim() || undefined,
        difficulty_level: form.difficultyLevel || undefined,
        inclusions: normalizeLines(form.inclusions),
        exclusions: normalizeLines(form.exclusions),
        meeting_instructions: form.meetingInstructions.trim() || undefined,
        what_to_bring: form.whatToBring.trim() || undefined,
        cancellation_policy: form.cancellationPolicy.trim() || undefined,
        pickup_stations: selectedStations.map(({ id }) => ({
          station_id: id,
          pickup_time: stationConfig[id].pickupTime,
          extra_price: Number(stationConfig[id].extraPrice || 0),
        })),
      });

      if (!result.success) {
        setSaveError(result.error || "The trip could not be published. Try again.");
        return;
      }
      published = true;
      try {
        sessionStorage.removeItem(draftKey);
      } catch {
        // Publishing succeeds independently of browser storage.
      }
      router.replace("/dashboard/trips");
    } catch {
      setSaveError("The trip could not be published. Try again.");
    } finally {
      if (!published) {
        publishing.current = false;
        setSaving(false);
      }
    }
  }

  const bookingLabel = waitsForInterest
    ? (Number(form.minimumInterest) > 0 ? "Seat goal: " + form.minimumInterest : "Collecting interest")
    : "Opens on publish";
  const preview = [
    ["Departure", departure ? dateFormat.format(departure) + " · " + form.departureTime + " EAT" : "Choose date and time"],
    ...(returnAt ? [["Return", dateFormat.format(returnAt) + " · " + form.returnTime + " EAT"]] : []),
    ["Seats", form.maxSeats || "—"],
    ["Per seat", form.price && Number.isFinite(Number(form.price)) ? currency + " " + fareFormat.format(Number(form.price)) : "—"],
  ];

  return (
    <>
      <Header title="Create a trip" subtitle="Set the schedule, pickup stations, and booking rules." actions={
        <Link href="/dashboard/trips/bulk" className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-semibold text-primary hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          Bulk schedule <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
        </Link>
      } />
      {!providerId ? (
        <div className="portal-content" role="status">Loading the trip form…</div>
      ) : (
        <div className="portal-content">
          {saveError ? (
            <div ref={errorSummary} role="alert" tabIndex={-1} className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{saveError}</div>
          ) : null}

          <AnnouncementDraftPanel form={form} destinations={destinations?.data ?? []} disabled={saving} apply={(updates) => {
            setForm((current) => ({ ...current, ...updates }));
            setErrors((current) => Object.fromEntries(Object.entries(current).filter(([field]) => !(field in updates))));
          }} />
          <form noValidate onSubmit={publishTrip} aria-busy={saving} className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_19rem] xl:gap-6">
            <nav aria-label="Trip form sections" className="rounded-xl border bg-white px-4 py-3 xl:hidden">
              <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs">
                {sectionLinks()}
                <li><a href="#review" className="block rounded-sm font-semibold text-stone-900 hover:underline focus-visible:outline-primary">Trip preview</a></li>
              </ul>
            </nav>
            <TripFormFields {...{ form, updateField, destinations, stations, stationConfig, updateStation, missingStationIds,
              removeUnavailableStations, retryOptions, earliestDate, errors, saving, search, setSearch, category, setCategory }} />
            <aside id="review" tabIndex={-1} aria-label="Trip review" className="min-w-0 scroll-mt-40 space-y-4 focus:outline-none xl:sticky xl:top-32">
              <Card className="overflow-hidden rounded-xl border border-border bg-card p-0 shadow-none">
                <div className="portal-next-trip px-5 py-4 text-white">
                  <h2 className="text-sm font-medium text-[#d7e5d9]">Traveler preview</h2>
                  <p className="mt-1 break-words text-xl font-semibold tracking-tight">{selectedDestination?.name || "Choose a destination"}</p>
                  <p className="mt-1.5 text-xs text-[#d7e5d9]">{isRoundTrip ? "Round trip" : "One way"} · {bookingLabel}</p>
                </div>
                <div className="space-y-4 p-5">
                  {form.summary && <p dir="auto" className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">{form.summary}</p>}
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-3 text-sm">
                    {preview.map(([label, value]) => (
                      <div key={label} className={label === "Departure" || label === "Return" ? "col-span-2" : "min-w-0"}>
                        <dt className="text-xs text-muted-foreground">{label}</dt>
                        <dd className="break-words font-medium">{value}</dd>
                      </div>
                    ))}
                    <div className="col-span-2 flex gap-2.5 border-t border-stone-100 pt-3">
                      <MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <div><dt className="text-xs text-muted-foreground">Pickup</dt><dd className="break-words font-medium">{selectedStations.length ? selectedStations.map((station) => station.name).join(", ") : "Choose a station"}</dd></div>
                    </div>
                  </dl>
                  <Button type="submit" isLoading={saving} className="w-full">{saving ? "Publishing…" : "Publish trip"}</Button>
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 text-xs">
                    <Link href="/dashboard/trips" className="font-semibold text-stone-700 hover:underline">Back to trips</Link>
                    {hasDraft ? <button type="button" onClick={() => setConfirmClear(true)} disabled={saving} className="font-semibold text-stone-600 hover:underline">Clear draft</button> : null}
                  </div>
                  {draftSaved ? <p className="flex items-center gap-1.5 text-xs text-stone-600"><CircleCheck aria-hidden="true" className="h-4 w-4 text-emerald-700" /> Draft saved in this tab</p> : null}
                </div>
              </Card>
              <nav aria-label="Trip form sections" className="hidden rounded-xl border bg-white px-5 py-4 xl:block">
                <ul className="space-y-2.5 text-sm">{sectionLinks()}</ul>
              </nav>
            </aside>
          </form>
        </div>
      )}
      <ConfirmDialog
        isOpen={confirmClear}
        onOpenChange={setConfirmClear}
        onConfirm={clearDraft}
        title="Clear this trip draft?"
        description="The fields and pickup selections in this tab will be cleared."
        confirmText="Clear draft"
        variant="danger"
      />
    </>
  );
}
