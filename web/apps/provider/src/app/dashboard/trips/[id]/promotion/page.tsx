"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowUpRight, Check, Copy, RefreshCw } from "lucide-react";
import { Button, Card, InlineBanner, buttonVariants, tripPromotionChannels, type TripPromotionChannel } from "@tankua/ui";
import { Header } from "@/components/header";
import { supabase } from "@/lib/supabase";

type Counts = { channel: TripPromotionChannel; visits: number; reservations: number; paid_bookings: number };
type Departure = {
  departure_date: string | null;
  status: string;
  available_seats: number;
  destination: { name: string } | null;
};

const departureFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Africa/Addis_Ababa", weekday: "short", day: "numeric", month: "short", year: "numeric",
  hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});
const marketingUrl = process.env.NEXT_PUBLIC_MARKETING_URL || "https://www.tankua.co";

export default function TripPromotionPage() {
  const { id } = useParams<{ id: string }>();
  const [attempt, setAttempt] = useState(0);
  const [report, setReport] = useState<{ id: string; departure: Departure; counts: Counts[] } | null>(null);
  const [pending, setPending] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<TripPromotionChannel | null>(null);
  const [manual, setManual] = useState<TripPromotionChannel | null>(null);
  const [notice, setNotice] = useState("");
  const manualLink = useRef<HTMLInputElement>(null);
  const tripUrl = new URL(`/tours/${encodeURIComponent(id)}`, marketingUrl);

  useEffect(() => {
    const controller = new AbortController();
    setPending(true);
    setError("");
    async function load() {
      const [trip, stats] = await Promise.all([
        supabase.from("trips").select("departure_date,status,available_seats,destination:destinations(name)").eq("id", id).abortSignal(controller.signal).maybeSingle(),
        supabase.rpc("get_trip_promotion", { p_trip_id: id }).abortSignal(controller.signal),
      ]);
      if (controller.signal.aborted) return;
      if (stats.error || trip.error || !trip.data) {
        const unavailable = stats.error?.code === "42501" || (!trip.data && !trip.error);
        setError(unavailable ? "This departure is unavailable in your provider account." : "Promotion results couldn’t load. Try again.");
      } else {
        setReport({ id, departure: trip.data as unknown as Departure, counts: stats.data as Counts[] });
      }
      setPending(false);
    }
    void load();
    return () => controller.abort();
  }, [attempt, id]);

  useEffect(() => {
    if (!manual) return;
    manualLink.current?.focus();
    manualLink.current?.select();
  }, [manual]);

  function channelUrl(channel: TripPromotionChannel) {
    const link = new URL(tripUrl);
    link.searchParams.set("channel", channel);
    return link.toString();
  }

  async function copyChannel(channel: TripPromotionChannel, label: string) {
    setCopied(null);
    setManual(null);
    try {
      await navigator.clipboard.writeText(channelUrl(channel));
      setCopied(channel);
      setNotice(`${label} link copied.`);
    } catch {
      setManual(channel);
      setNotice(`Select and copy the ${label} link below.`);
    }
  }

  const currentReport = report?.id === id ? report : null;
  const departure = currentReport?.departure;
  const future = departure?.departure_date && Date.parse(departure.departure_date) > Date.now();
  const shareable = future && departure && ["active", "upcoming", "collecting_interest"].includes(departure.status);
  const status = !shareable ? "Closed" : departure.status === "collecting_interest" ? "Planned departure" :
    departure.available_seats < 1 ? "Sold out" : departure.status === "upcoming" ? "Reservations open" : "Booking open";

  return (
    <>
      <Header title="Promote a departure" subtitle="Share the trip and see which links lead to bookings." />
      <div className="portal-content space-y-5">
        {pending && !currentReport && <p role="status" className="text-sm text-muted-foreground">Loading departure…</p>}
        {error && <InlineBanner variant="error" message={error} />}
        {error && !currentReport && <Button variant="outline" onClick={() => setAttempt((value) => value + 1)}>Try again</Button>}
        {departure && (
          <>
            <div className="portal-next-trip flex flex-wrap items-end justify-between gap-5 rounded-xl px-5 py-5 text-white sm:px-7">
              <div>
                <p className="text-sm text-[#d7e5d9]">{status}</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight">{departure.destination?.name || "Scheduled departure"}</h2>
                {departure.departure_date && <time dateTime={departure.departure_date} className="mt-2 block text-sm text-[#d7e5d9]">
                  {departureFormat.format(new Date(departure.departure_date))} EAT
                </time>}
              </div>
              <a href={tripUrl.toString()} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-md border border-white/40 px-3 text-sm font-semibold hover:bg-white/10 focus-visible:outline-white">
                View public trip <ArrowUpRight size={16} aria-hidden="true" />
              </a>
            </div>
            <Card className="rounded-xl border-border p-0 shadow-none">
              <section aria-labelledby="promotion-channels" aria-busy={pending}>
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-7">
                  <div>
                    <h2 id="promotion-channels" className="text-lg font-semibold">Channel links</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{shareable ? "Copy the link for the channel where you plan to share." : "Results remain available for this closed departure."}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setAttempt((value) => value + 1)} disabled={pending}>
                    <RefreshCw className="mr-1.5 h-4 w-4" aria-hidden="true" />{pending ? "Refreshing…" : "Refresh"}
                  </Button>
                </div>
                <ul className="divide-y divide-border border-t border-border">
                  {tripPromotionChannels.map(({ id: channel, label }) => {
                    const totals = currentReport.counts.find((count) => count.channel === channel);
                    return (
                      <li key={channel} className="px-5 py-4 sm:px-7">
                        <div className="grid items-center gap-3 sm:grid-cols-[minmax(6rem,1fr)_minmax(0,2.5fr)_auto]">
                          <h3 className="font-semibold">{label}</h3>
                          <dl className="grid grid-cols-3 gap-2 text-sm">
                            {[
                              ["Visits", totals?.visits ?? 0],
                              ["Reservations", totals?.reservations ?? 0],
                              ["Paid bookings", totals?.paid_bookings ?? 0],
                            ].map(([name, value]) => (
                              <div key={name}><dt className="text-xs text-muted-foreground">{name}</dt><dd className="mt-0.5 text-base font-semibold tabular-nums">{value.toLocaleString()}</dd></div>
                            ))}
                          </dl>
                          {shareable && <button type="button" aria-label={`Copy ${label} link`} onClick={() => copyChannel(channel, label)}
                            className={buttonVariants({ variant: "outline", size: "sm", className: "min-h-11 justify-self-start gap-2 sm:justify-self-end" })}>
                            {copied === channel ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
                            {copied === channel ? "Copied" : "Copy link"}
                          </button>}
                        </div>
                        {manual === channel && <input ref={manualLink} readOnly className="mt-3 w-full rounded-md border border-input bg-background px-3 py-2 text-base" value={channelUrl(channel)} aria-label={`${label} link`} onFocus={(event) => event.currentTarget.select()} />}
                      </li>
                    );
                  })}
                </ul>
                <p className="border-t border-border px-5 py-3 text-xs leading-relaxed text-muted-foreground sm:px-7">
                  Visits count once per browser tab session. Paid bookings are reservations with a recorded payment, excluding refunds.
                </p>
              </section>
            </Card>
          </>
        )}
        <p role="status" className="sr-only">{notice}</p>
      </div>
    </>
  );
}
