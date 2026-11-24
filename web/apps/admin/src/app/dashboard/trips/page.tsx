"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowRightLeft, ArrowUp, Bus, History, RefreshCw, Star, X, AlertTriangle } from "lucide-react";
import { Header } from "@/components/header";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  InlineBanner,
  formatCurrencyTotals,
  formatDate,
} from "@tankua/ui";
import {
  getHandoverTrips,
  getProviders,
  getTripHandoverPreview,
  getTripHandovers,
  handOverTrip,
  setFeaturedTrips,
  type HandoverRevenuePolicy,
  type HandoverTrip,
  type Provider,
  type TripHandoverPreview,
  type TripHandoverRecord,
} from "@/lib/queries";

type BannerState = { message: string; variant: "success" | "error" | "info" } | null;

const statusVariant: Record<string, "success" | "warning" | "secondary" | "default"> = {
  active: "success",
  upcoming: "default",
  collecting_interest: "warning",
  ongoing: "default",
  completed: "secondary",
};

const statusLabel = (status: string) => status.replace(/_/g, " ");

const departure = (date: string | null) =>
  date ? formatDate(date, { month: "short", day: "numeric", year: "numeric" }) : "No date";

export default function TripsPage() {
  const [trips, setTrips] = useState<HandoverTrip[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [handovers, setHandovers] = useState<TripHandoverRecord[]>([]);
  const [providerFilter, setProviderFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<BannerState>(null);
  const [selectedTrip, setSelectedTrip] = useState<HandoverTrip | null>(null);
  const [savingFeatured, setSavingFeatured] = useState(false);

  // Featured trips come from the unfiltered list so the order is complete.
  const [allTrips, setAllTrips] = useState<HandoverTrip[]>([]);
  const featured = useMemo(
    () => allTrips.filter((trip) => trip.featuredRank !== null).sort((a, b) => (a.featuredRank ?? 0) - (b.featuredRank ?? 0)),
    [allTrips],
  );
  const canFeature = (trip: HandoverTrip) =>
    ["upcoming", "active", "collecting_interest"].includes(trip.status)
    && Boolean(trip.departure_date) && Date.parse(trip.departure_date as string) > Date.now();
  const featuredIds = featured.map((trip) => trip.id);

  const saveFeatured = async (ids: string[], message: string) => {
    setSavingFeatured(true);
    try {
      await setFeaturedTrips(ids);
      setBanner({ message, variant: "success" });
      await load();
    } catch (error) {
      setBanner({ message: error instanceof Error ? error.message : "Could not update featured trips.", variant: "error" });
    } finally {
      setSavingFeatured(false);
    }
  };
  const feature = (trip: HandoverTrip) => {
    if (featuredIds.length >= 12) {
      setBanner({ message: "Feature at most 12 trips. Take one down first.", variant: "error" });
      return;
    }
    saveFeatured([...featuredIds, trip.id], trip.destination + " is now featured on the homepage.");
  };
  const takeDown = (trip: HandoverTrip) =>
    saveFeatured(featuredIds.filter((id) => id !== trip.id), trip.destination + " was taken down from the homepage.");
  const move = (index: number, delta: number) => {
    const ids = [...featuredIds];
    const target = index + delta;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    saveFeatured(ids, "Featured order updated.");
  };

  const load = async () => {
    setLoading(true);
    try {
      const [tripList, everyTrip, providerResult, history] = await Promise.all([
        getHandoverTrips({ providerId: providerFilter || undefined }),
        providerFilter ? getHandoverTrips() : Promise.resolve(null),
        getProviders({ limit: 500 }),
        getTripHandovers(),
      ]);
      setTrips(tripList);
      setAllTrips(everyTrip ?? tripList);
      setProviders(providerResult.providers);
      setHandovers(history);
    } catch (error) {
      setBanner({ message: error instanceof Error ? error.message : "Could not load trips.", variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [providerFilter]);

  return (
    <div className="min-h-screen">
      <Header
        title="Trips"
        subtitle="Choose the homepage's featured trips and hand trips over to providers"
        actions={
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      <div className="p-4 sm:p-6 space-y-6">
        {banner && <InlineBanner message={banner.message} variant={banner.variant} onDismiss={() => setBanner(null)} />}

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <label htmlFor="trip-provider-filter" className="text-sm text-muted-foreground">Provider</label>
          <select
            id="trip-provider-filter"
            value={providerFilter}
            onChange={(event) => setProviderFilter(event.target.value)}
            className="px-3 py-2 border border-border rounded-lg bg-background text-sm sm:w-72"
          >
            <option value="">All providers</option>
            {providers.map((provider) => (
              <option key={provider.id} value={provider.id}>{provider.name}</option>
            ))}
          </select>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" /> Featured on the homepage
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Shown first on tankua.et, in this order. Empty spots are filled with the newest trips, and featured trips drop off by themselves once they depart.
            </p>
          </CardHeader>
          <CardContent className="p-0">
            {featured.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-muted-foreground">
                No trips are featured yet, so the homepage shows the newest ones. Use Feature on a trip below.
              </p>
            ) : (
              <ol className="divide-y divide-border">
                {featured.map((trip, index) => (
                  <li key={trip.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 sm:px-6">
                    <span className="text-sm font-semibold text-muted-foreground w-6">{index + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{trip.destination}</p>
                      <p className="text-sm text-muted-foreground">
                        {departure(trip.departure_date)} · {trip.provider?.name ?? "No provider"}
                        {!canFeature(trip) ? " · no longer open, hidden from the homepage" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => move(index, -1)} disabled={savingFeatured || index === 0} aria-label={"Move " + trip.destination + " up"}>
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => move(index, 1)} disabled={savingFeatured || index === featured.length - 1} aria-label={"Move " + trip.destination + " down"}>
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => takeDown(trip)} disabled={savingFeatured}>
                        Take down
                      </Button>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trips</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : trips.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No trips found</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {trips.map((trip) => (
                  <div key={trip.id} className="flex flex-col lg:flex-row lg:items-center gap-3 p-4 sm:px-6">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold truncate">{trip.destination}</p>
                        <Badge variant={statusVariant[trip.status] ?? "default"} className="capitalize">
                          {statusLabel(trip.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {departure(trip.departure_date)} · {trip.provider?.name ?? "No provider"}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground lg:w-48">
                      <span className="font-medium text-foreground">{trip.bookings}</span> bookings ·{" "}
                      <span className="font-medium text-foreground">{trip.paidBookings}</span> paid
                    </div>
                    <div className="flex items-center gap-2">
                      {trip.featuredRank !== null ? (
                        <Badge variant="gold">Featured #{featured.findIndex((item) => item.id === trip.id) + 1}</Badge>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => feature(trip)}
                          disabled={savingFeatured || !canFeature(trip)}
                          title={canFeature(trip) ? undefined : "Only upcoming, open trips can be featured"}
                          leftIcon={<Star className="h-4 w-4" />}
                        >
                          Feature
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedTrip(trip)}
                        leftIcon={<ArrowRightLeft className="h-4 w-4" />}
                      >
                        Hand over
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" /> Recent handovers
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {handovers.length === 0 ? (
              <p className="text-center py-10 text-sm text-muted-foreground">No trips have been handed over yet.</p>
            ) : (
              <div className="divide-y divide-border">
                {handovers.map((record) => (
                  <div key={record.id} className="p-4 sm:px-6 text-sm space-y-1">
                    <p>
                      <span className="font-semibold">{record.trip?.destinations?.name ?? "Trip"}</span>
                      {" "}({departure(record.trip?.departure_date ?? null)}):{" "}
                      {record.from_provider?.name ?? "No provider"} → <span className="font-semibold">{record.to_provider?.name ?? "Unknown"}</span>
                    </p>
                    <p className="text-muted-foreground">
                      {record.bookings_moved} bookings, {record.paid_bookings} paid ({formatCurrencyTotals(record.paid_totals)}).{" "}
                      {record.revenue_policy === "platform_retains" ? "Tankua kept the revenue already collected." : "Provider receives the revenue."}{" "}
                      {formatDate(record.created_at, { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                    {record.note && <p className="text-muted-foreground italic">“{record.note}”</p>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedTrip && (
        <HandoverDialog
          trip={selectedTrip}
          providers={providers}
          onClose={() => setSelectedTrip(null)}
          onDone={(message) => {
            setSelectedTrip(null);
            setBanner({ message, variant: "success" });
            load();
          }}
        />
      )}
    </div>
  );
}

function HandoverDialog({
  trip,
  providers,
  onClose,
  onDone,
}: {
  trip: HandoverTrip;
  providers: Provider[];
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const [preview, setPreview] = useState<TripHandoverPreview | null>(null);
  const [targetId, setTargetId] = useState("");
  const [policy, setPolicy] = useState<HandoverRevenuePolicy>("platform_retains");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const targets = useMemo(
    () => providers.filter((provider) => provider.status === "active" && provider.id !== trip.provider?.id),
    [providers, trip.provider?.id],
  );
  const target = targets.find((provider) => provider.id === targetId);

  useEffect(() => {
    let cancelled = false;
    getTripHandoverPreview(trip.id)
      .then((result) => { if (!cancelled) setPreview(result); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : "Could not load this trip."); });
    return () => { cancelled = true; };
  }, [trip.id]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape" && !submitting) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, submitting]);

  const paidTotals = preview ? formatCurrencyTotals(preview.paid_totals) : "";
  const hasPaid = (preview?.paid_bookings ?? 0) > 0;

  const submit = async () => {
    if (!target || !preview) return;
    setSubmitting(true);
    setError("");
    try {
      const result = await handOverTrip({ tripId: trip.id, toProviderId: target.id, revenuePolicy: policy, note });
      onDone(
        `${trip.destination} now belongs to ${result.to_provider_name}: ${result.bookings_moved} bookings moved` +
          (result.stations_copied ? `, ${result.stations_copied} pickup points copied.` : "."),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Handover failed. Nothing was changed.");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="handover-title">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle id="handover-title">Hand over {trip.destination}</CardTitle>
            <button onClick={onClose} disabled={submitting} className="text-muted-foreground hover:text-foreground" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground">
            {departure(trip.departure_date)} · currently {trip.provider?.name ?? "no provider"}
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && <InlineBanner message={error} variant="error" onDismiss={() => setError("")} />}

          {!preview ? (
            !error && (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )
          ) : (
            <>
              <section className="space-y-2">
                <h3 className="text-sm font-semibold">What moves</h3>
                <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <li className="rounded-xl border border-border p-3"><p className="text-xl font-bold">{preview.bookings}</p><p className="text-muted-foreground">bookings</p></li>
                  <li className="rounded-xl border border-border p-3"><p className="text-xl font-bold">{preview.paid_bookings}</p><p className="text-muted-foreground">paid</p></li>
                  <li className="rounded-xl border border-border p-3"><p className="text-xl font-bold">{preview.reviews}</p><p className="text-muted-foreground">reviews</p></li>
                  <li className="rounded-xl border border-border p-3"><p className="text-xl font-bold">{preview.pickup_points}</p><p className="text-muted-foreground">pickup points</p></li>
                </ul>
                <p className="text-xs text-muted-foreground">
                  Pickup points are copied into the provider&apos;s account, or matched to identical ones they already have. The trip&apos;s other details stay as they are.
                </p>
              </section>

              {preview.payments_in_progress > 0 && (
                <div className="flex gap-2 p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-sm">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                  <p>
                    {preview.payments_in_progress} payment(s) are still in checkout. If they complete after the handover,
                    that revenue counts as the provider&apos;s.
                  </p>
                </div>
              )}

              <section className="space-y-2">
                <label htmlFor="handover-target" className="text-sm font-semibold">Hand over to</label>
                <select
                  id="handover-target"
                  value={targetId}
                  onChange={(event) => setTargetId(event.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-background"
                >
                  <option value="">Choose an active provider…</option>
                  {targets.map((provider) => (
                    <option key={provider.id} value={provider.id}>{provider.name}</option>
                  ))}
                </select>
                {targets.length === 0 && (
                  <p className="text-xs text-muted-foreground">No other active providers. Approve or activate one first.</p>
                )}
              </section>

              {hasPaid && (
                <fieldset className="space-y-2">
                  <legend className="text-sm font-semibold mb-2">Revenue already collected ({paidTotals})</legend>
                  {([
                    ["platform_retains", "Tankua keeps it", "Use when the provider was paid separately, for example a vehicle rental. The paid bookings still show on their account, but not in their earnings."],
                    ["provider_receives", "Provider receives it", "The paid bookings count toward their earnings and are paid out like any other booking."],
                  ] as const).map(([value, title, description]) => (
                    <label
                      key={value}
                      className={`flex gap-3 p-3 rounded-xl border cursor-pointer ${policy === value ? "border-primary bg-primary/5" : "border-border"}`}
                    >
                      <input
                        type="radio"
                        name="handover-policy"
                        value={value}
                        checked={policy === value}
                        onChange={() => setPolicy(value)}
                        className="mt-1"
                      />
                      <span>
                        <span className="block text-sm font-medium">{title}</span>
                        <span className="block text-xs text-muted-foreground">{description}</span>
                      </span>
                    </label>
                  ))}
                  <p className="text-xs text-muted-foreground">Bookings paid after the handover always count as the provider&apos;s.</p>
                </fieldset>
              )}

              <section className="space-y-2">
                <label htmlFor="handover-note" className="text-sm font-semibold">Note (optional)</label>
                <textarea
                  id="handover-note"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  maxLength={1000}
                  rows={2}
                  placeholder="e.g. Pilot trip; vehicle rental paid in cash on Dec 12"
                  className="w-full px-4 py-2 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-background text-sm"
                />
              </section>

              {target && (
                <p className="text-sm rounded-xl bg-muted/50 p-3">
                  {preview.bookings} bookings and {preview.reviews} reviews will move to <strong>{target.name}</strong>
                  {hasPaid && (policy === "platform_retains"
                    ? <>. Tankua keeps the {paidTotals} already collected.</>
                    : <>. {target.name} will be owed the {paidTotals} already collected.</>)}
                  {!hasPaid && "."} {target.name}&apos;s owner gets a notification.
                </p>
              )}
            </>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={onClose} disabled={submitting}>Cancel</Button>
            <Button onClick={submit} disabled={!target || !preview || submitting} isLoading={submitting}>
              {target ? `Hand over to ${target.name}` : "Hand over"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
