import type { ChangeEvent, ReactNode } from "react";
import { CalendarDays, ChevronDown, Clock3, ListChecks, MapPin, Route, Search, Ticket, Wallet } from "lucide-react";
import Link from "next/link";
import { getTripCurrency, type TripCurrency } from "@tankua/ui";
import { tripCurrencies } from "@/lib/trip-currency";

export const initialForm = {
  destinationId: "", summary: "", tripType: "round_trip",
  departureDate: "", departureTime: "06:00", returnDate: "", returnTime: "",
  price: "", currency: "ETB", maxSeats: "", bookingMode: "immediate", minimumInterest: "",
  tourCategory: "", itinerary: "", durationHours: "", transportationType: "",
  difficultyLevel: "easy", inclusions: "", exclusions: "", meetingInstructions: "",
  whatToBring: "", cancellationPolicy: "",
};
export type TripForm = typeof initialForm;
export type Destination = { id: string; name: string; city: string | null; region: string | null; category: string | null };
export type Station = { id: string; name: string; city: string | null; address: string | null; extra_price: number; is_address_pickup: boolean };
export type StationConfig = { selected: boolean; pickupTime: string; extraPrice: string };
export type Options<T> = { data: T[]; error: string | null };

export const sections = [
  { id: "basics", label: "Trip basics" },
  { id: "schedule", label: "Schedule" },
  { id: "pricing", label: "Seats and pricing" },
  { id: "pickup", label: "Pickup stations" },
  { id: "booking", label: "Booking rules" },
  { id: "details", label: "Traveler details" },
];
export const maxInterest = 2_147_483_647;
export const maxSeats = 100;
export const maxSummary = 280;
export const minFares: Record<TripCurrency, number> = { ETB: 100, USD: 0.01 };

const fieldClass = "block min-h-11 w-full min-w-0 rounded-lg border border-input bg-white px-3 py-2.5 text-sm outline-none focus:border-primary aria-[invalid=true]:border-red-500 disabled:bg-stone-50";

type FieldProps = { id: string; label: string; children: ReactNode; hint?: string; error?: string };
function Field({ id, label, children, hint, error }: FieldProps) {
  return (
    <div className="min-w-0 space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-stone-800">{label}</label>
      {children}
      {hint ? <p id={id + "-hint"} className="text-xs text-muted-foreground">{hint}</p> : null}
      {error ? <p id={id + "-error"} className="text-xs font-medium text-red-700">{error}</p> : null}
    </div>
  );
}

function Section({ id, title, icon, children }: { id: string; title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section id={id} tabIndex={-1} aria-labelledby={id + "-title"} className="scroll-mt-32 rounded-xl border border-border bg-white focus:outline-none">
      <div className="flex items-center gap-3 border-b border-stone-100 px-4 py-4 sm:px-6">
        <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100/75 text-amber-900">{icon}</span>
        <h2 id={id + "-title"} className="text-base font-semibold tracking-tight text-stone-950">{title}</h2>
      </div>
      <div className="space-y-4 px-4 py-5 sm:px-6">{children}</div>
    </section>
  );
}

function accessibility(id: string, error?: string, hint?: string) {
  return {
    id,
    name: id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": [hint ? id + "-hint" : "", error ? id + "-error" : ""].filter(Boolean).join(" ") || undefined,
  };
}

type FormFieldsProps = {
  form: TripForm;
  updateField: (field: keyof TripForm, value: string) => void;
  destinations: Options<Destination> | null;
  stations: Options<Station> | null;
  stationConfig: Record<string, StationConfig>;
  updateStation: (station: Station, updates: Partial<StationConfig>) => void;
  missingStationIds: string[];
  removeUnavailableStations: () => void;
  retryOptions: () => void;
  earliestDate: string;
  errors: Record<string, string>;
  saving: boolean;
  search: string;
  setSearch: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
};

const travelerDetails = [
  { field: "itinerary", label: "Itinerary", rows: 4, placeholder: "Add stops, timings, and highlights." },
  { field: "inclusions", label: "What’s included", rows: 3, placeholder: "Transport\nGuide\nEntrance fees", hint: "One item per line." },
  { field: "exclusions", label: "What travelers pay for separately", rows: 3, placeholder: "Meals\nPersonal expenses", hint: "One item per line." },
  { field: "meetingInstructions", label: "Meeting instructions", rows: 3, placeholder: "Where to meet and when to arrive." },
  { field: "whatToBring", label: "What to bring", rows: 2, placeholder: "e.g. ID, water, comfortable shoes" },
  { field: "cancellationPolicy", label: "Cancellation policy", rows: 2, placeholder: "Explain cancellation deadlines and any charges." },
] as const;

export function TripFormFields({
  form, updateField, destinations, stations, stationConfig, updateStation, missingStationIds,
  removeUnavailableStations, retryOptions, earliestDate, errors, saving, search, setSearch, category, setCategory,
}: FormFieldsProps) {
  const query = search.trim().toLocaleLowerCase();
  const categories = Array.from(new Set((destinations?.data ?? []).flatMap((item) => item.category ? [item.category] : []))).sort();
  const filteredDestinations = (destinations?.data ?? []).filter((item) =>
    item.id === form.destinationId || ((!category || item.category === category) &&
      [item.name, item.city, item.region].join(" ").toLocaleLowerCase().includes(query)),
  );
  const selectedCount = stations?.data.filter(({ id }) => stationConfig[id]?.selected).length ?? 0;
  const waitsForInterest = form.bookingMode === "interest";
  const currency = getTripCurrency(form.currency);
  const retry = <button type="button" onClick={retryOptions} className="font-semibold underline">Try again</button>;

  const bind = (field: keyof TripForm, hint?: string) => ({
    ...accessibility(field, errors[field], hint),
    className: fieldClass,
    value: form[field],
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => updateField(field, event.target.value),
  });

  return (
    <fieldset disabled={saving} className="min-w-0 space-y-5">
      <legend className="sr-only">Trip details</legend>
      <Section id="basics" title="Trip basics" icon={<MapPin className="h-4 w-4" />}>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(9rem,0.55fr)]">
          <Field id="destination-search" label="Find a destination">
            <div className="relative">
              <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-stone-400" />
              <input id="destination-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, city, or region" className={fieldClass + " pl-9"} disabled={!destinations || Boolean(destinations.error)} />
            </div>
          </Field>
          <Field id="destination-category" label="Filter by category">
            <select id="destination-category" value={category} onChange={(e) => setCategory(e.target.value)} className={fieldClass} disabled={!destinations || Boolean(destinations.error)}>
              <option value="">All categories</option>
              {categories.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}
            </select>
          </Field>
        </div>
        {destinations?.error ? <p role="alert" className="text-sm text-red-700">{destinations.error} {retry}</p> : null}
        <Field id="destinationId" label="Destination" error={errors.destinationId}>
          <select {...bind("destinationId")} required disabled={!destinations || Boolean(destinations.error)}>
            <option value="">{!destinations ? "Loading destinations…" : filteredDestinations.length ? "Select a destination" : "No matching destinations"}</option>
            {filteredDestinations.map((item) => <option key={item.id} value={item.id}>{[item.name, item.city || item.region].filter(Boolean).join(" · ")}</option>)}
          </select>
        </Field>
        <Field id="summary" label="Traveler summary" hint={form.summary.length + " / " + maxSummary + " characters"} error={errors.summary}>
          <textarea {...bind("summary", "character count")} required rows={3} maxLength={maxSummary} placeholder="Describe the main experience travelers can expect." />
        </Field>
      </Section>

      <Section id="schedule" title="Schedule" icon={<CalendarDays className="h-4 w-4" />}>
        <Field id="tripType" label="Trip type">
          <select {...bind("tripType")}><option value="round_trip">Round trip</option><option value="one_way">One way</option></select>
        </Field>
        <p className="flex items-center gap-2 text-xs font-medium text-stone-600"><Clock3 aria-hidden="true" className="h-4 w-4" /> Ethiopia time (EAT, UTC+3)</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="departureDate" label="Departure date" error={errors.departureDate}><input {...bind("departureDate")} type="date" required min={earliestDate} /></Field>
          <Field id="departureTime" label="Departure time" error={errors.departureTime}><input {...bind("departureTime")} type="time" required /></Field>
          {form.tripType === "round_trip" ? (
            <>
              <Field id="returnDate" label="Return date" error={errors.returnDate}><input {...bind("returnDate")} type="date" required min={form.departureDate || earliestDate} /></Field>
              <Field id="returnTime" label="Return time" error={errors.returnTime}><input {...bind("returnTime")} type="time" required /></Field>
            </>
          ) : <Field id="durationHours" label="Expected travel time (hours)" error={errors.durationHours}>
            <input {...bind("durationHours")} type="number" inputMode="decimal" min="0.5" step="any" required placeholder="e.g. 4.5" />
          </Field>}
        </div>
      </Section>

      <Section id="pricing" title="Seats and pricing" icon={<Wallet className="h-4 w-4" />}>
        <Field id="currency" label="Fare currency" hint="Changing the currency clears the fare and pickup surcharges.">
          <select {...bind("currency", "currency change")}>
            {tripCurrencies.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
          </select>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="maxSeats" label="Seats available" error={errors.maxSeats}><input {...bind("maxSeats")} type="number" inputMode="numeric" required min="1" max={maxSeats} step="1" placeholder="e.g. 24" /></Field>
          <Field id="price" label={`Price per seat (${currency})`} error={errors.price}><input {...bind("price")} type="number" inputMode="decimal" required min={minFares[currency]} step="0.01" placeholder={currency === "USD" ? "e.g. 25" : "e.g. 2500"} /></Field>
        </div>
      </Section>

      <Section id="pickup" title="Pickup stations" icon={<Route className="h-4 w-4" />}>
        {errors.pickup ? <p role="alert" className="text-sm font-medium text-red-700">{errors.pickup}</p> : null}
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <p className="text-muted-foreground" aria-live="polite">{selectedCount} selected</p>
          <Link href="/dashboard/pickup-stations" className="font-semibold text-stone-800 underline decoration-stone-400 underline-offset-4 hover:decoration-stone-950">Manage pickup options</Link>
        </div>
        {!stations ? <p role="status" className="text-sm text-muted-foreground">Loading pickup stations…</p> : null}
        {stations?.error ? <p role="alert" className="text-sm text-red-700">{stations.error} {retry}</p> : null}
        {stations && !stations.error && !stations.data.length ? (
          <p className="rounded-lg border border-dashed border-stone-300 bg-stone-50 p-4 text-sm text-stone-600">Add an active pickup station to publish this trip.</p>
        ) : null}
        {missingStationIds.length ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-stone-700">
            Some stations in this draft are unavailable.{" "}
            <button type="button" className="font-semibold underline" onClick={removeUnavailableStations}>Remove unavailable stations</button>
          </p>
        ) : null}
        {stations?.data.map((station) => {
          const config = stationConfig[station.id];
          const selected = Boolean(config?.selected);
          const timeId = "pickup-time-" + station.id;
          const priceId = "pickup-fee-" + station.id;
          const location = station.is_address_pickup
            ? `Address pickup · ${station.city}`
            : [station.address, station.city].filter(Boolean).join(", ");
          return (
            <div key={station.id} className={"rounded-lg border px-3 py-3 sm:px-4 " + (selected ? "border-amber-300 bg-amber-50/45" : "border-stone-200")}>
              <label className="flex cursor-pointer items-start gap-3">
                <input type="checkbox" checked={selected} onChange={(e) => updateStation(station, { selected: e.target.checked })} className="mt-0.5 h-4 w-4 shrink-0 accent-primary" />
                <span className="min-w-0"><span className="block text-sm font-semibold text-stone-900">{station.name}</span>{location ? <span className="block text-xs text-muted-foreground">{location}</span> : null}</span>
              </label>
              {config?.selected ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2 sm:pl-7">
                  <Field id={timeId} label="Pickup time (EAT)" error={errors[timeId]}>
                    <input {...accessibility(timeId, errors[timeId])} type="time" required value={config.pickupTime} onChange={(e) => updateStation(station, { pickupTime: e.target.value })} className={fieldClass} />
                  </Field>
                  <Field id={priceId} label={`Pickup surcharge (${currency})`} error={errors[priceId]}>
                    <input {...accessibility(priceId, errors[priceId])} type="number" inputMode="decimal" min="0" step="0.01" value={config.extraPrice} onChange={(e) => updateStation(station, { extraPrice: e.target.value })} className={fieldClass} />
                  </Field>
                </div>
              ) : null}
            </div>
          );
        })}
      </Section>

      <Section id="booking" title="Booking rules" icon={<Ticket className="h-4 w-4" />}>
        <fieldset className="grid gap-3 sm:grid-cols-2">
          <legend className="mb-2 text-sm font-medium text-stone-800">When should reservations open?</legend>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 has-[:checked]:border-amber-400 has-[:checked]:bg-amber-50">
            <input type="radio" name="bookingMode" value="immediate" checked={!waitsForInterest} onChange={(e) => updateField("bookingMode", e.target.value)} className="mt-0.5 h-4 w-4 shrink-0 accent-primary" />
            <span><span className="block text-sm font-semibold">Open on publish</span><span className="block text-xs text-muted-foreground">Travelers can reserve seats right away.</span></span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 has-[:checked]:border-amber-400 has-[:checked]:bg-amber-50">
            <input type="radio" name="bookingMode" value="interest" checked={waitsForInterest} onChange={(e) => updateField("bookingMode", e.target.value)} className="mt-0.5 h-4 w-4 shrink-0 accent-primary" />
            <span><span className="block text-sm font-semibold">Set an interest goal</span><span className="block text-xs text-muted-foreground">Reservations open when the goal is reached before departure.</span></span>
          </label>
        </fieldset>
        {waitsForInterest ? (
          <div className="max-w-xs">
            <Field id="minimumInterest" label="Minimum interested travelers" error={errors.minimumInterest}>
              <input {...bind("minimumInterest")} type="number" inputMode="numeric" required min="1" max={maxInterest} step="1" />
            </Field>
          </div>
        ) : null}
        <p className="rounded-lg bg-stone-100 px-3 py-2.5 text-sm text-stone-700">Payment opens after you mark the trip Active.</p>
      </Section>

      <details id="details" className="group scroll-mt-32 rounded-xl border border-border bg-white">
        <summary className="flex cursor-pointer list-none items-center gap-3 rounded-xl px-4 py-4 focus-visible:outline-primary sm:px-6 [&::-webkit-details-marker]:hidden">
          <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100/75 text-amber-900"><ListChecks className="h-4 w-4" /></span>
          <span className="flex-1 text-base font-semibold tracking-tight text-stone-950">Traveler details <span className="ml-1 text-xs font-medium text-muted-foreground">Optional</span></span>
          <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 text-stone-500 group-open:rotate-180" />
        </summary>
        <div className="space-y-4 border-t border-stone-100 px-4 py-5 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="tourCategory" label="Tour category">
              <select {...bind("tourCategory")}><option value="">Select a category</option><option value="day_trip">Day trip</option><option value="weekend">Weekend</option><option value="multi_day">Multi-day</option><option value="holiday">Holiday</option><option value="custom">Custom</option></select>
            </Field>
            <Field id="difficultyLevel" label="Activity level">
              <select {...bind("difficultyLevel")}><option value="easy">Easy</option><option value="moderate">Moderate</option><option value="challenging">Challenging</option></select>
            </Field>
            {form.tripType === "round_trip" ? <Field id="durationHours" label="Duration (hours)" error={errors.durationHours}>
              <input {...bind("durationHours")} type="number" inputMode="decimal" min="0.5" step="any" placeholder="e.g. 8" />
            </Field> : null}
            <Field id="transportationType" label="Transportation"><input {...bind("transportationType")} placeholder="e.g. Air-conditioned minibus" /></Field>
          </div>
          {travelerDetails.map(({ field, label, rows, placeholder, ...rest }) => {
            const hint = "hint" in rest ? rest.hint : undefined;
            return (
              <Field key={field} id={field} label={label} hint={hint}>
                <textarea {...bind(field, hint)} rows={rows} placeholder={placeholder} />
              </Field>
            );
          })}
        </div>
      </details>
    </fieldset>
  );
}
