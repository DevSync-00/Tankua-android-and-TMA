"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Header } from "@/components/header";
import { Badge, Button, Card, formatCurrency } from "@tankua/ui";
import { getProviderBookings, getProviderTrip, type BookingDetails, type TripDetails } from "@/lib/queries";
import { canCloseOutTrip, needsCloseout, tripEndTime } from "@/lib/trip-closeout";
import { parseTripTime } from "@/lib/trip-schedule";
import { supabase } from "@/lib/supabase";

const timeFormat = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Addis_Ababa",
});
const dateLabel = (time: number) => Number.isFinite(time) ? timeFormat.format(time) + " EAT" : "Unavailable";
type Action = "departed" | "delay" | "complete" | "did_not_run";

export default function TripCloseoutPage() {
  const { id } = useParams<{ id: string }>();
  const [trip, setTrip] = useState<TripDetails | null>(null);
  const [bookings, setBookings] = useState<BookingDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [action, setAction] = useState<Action | "">("");
  const [reason, setReason] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      const session = JSON.parse(localStorage.getItem("provider_user") || "null");
      const providerId = session?.provider_id || session?.provider?.id;
      if (!providerId) throw new Error("Sign in to view this trip.");
      const [tripResult, manifest] = await Promise.all([
        getProviderTrip(providerId, id), getProviderBookings(providerId, { tripId: id }),
      ]);
      if (tripResult.error || !tripResult.trip) throw new Error(tripResult.error || "Trip unavailable.");
      setTrip(tripResult.trip as TripDetails);
      setBookings(manifest.bookings);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not load this trip.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [id]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!action || pending) return;
    const revised = action === "delay" ? parseTripTime(date, time) : null;
    if (action === "delay" && !revised) {
      setError("Choose a valid revised date and time.");
      return;
    }
    setError("");
    setMessage("");
    setPending(true);
    try {
      const { error: rpcError } = await supabase.rpc("closeout_provider_trip", {
        p_trip_id: id, p_action: action, p_reason: action === "did_not_run" ? reason : null,
        p_revised_end: revised?.toISOString() ?? null,
      });
      if (rpcError) throw new Error(rpcError.message);
      setMessage(action === "complete" ? "Trip completed." : action === "did_not_run"
        ? "Trip cancelled. Paid bookings were sent for refund review." : "Trip schedule updated.");
      setAction("");
      await load();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not save this trip.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Header title="Trip closeout" actions={<Link href="/dashboard/trips" className="text-sm font-semibold hover:underline">Back to trips</Link>} />
      <div className="portal-content">
        {error ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}
        {message ? <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p> : null}
        {loading ? <p role="status">Loading trip and bookings…</p> : null}
        {trip ? (
          <>
            <Card className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">Trip schedule</h2>
                <Badge variant={needsCloseout(trip) ? "warning" : "secondary"}>
                  {needsCloseout(trip) ? "Needs closeout" : trip.closeout_reason === "interest_goal_missed" ? "Interest goal missed" : trip.status}
                </Badge>
              </div>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div><dt className="text-muted-foreground">Departure</dt><dd>{dateLabel(Date.parse(trip.departure_date))}</dd></div>
                <div><dt className="text-muted-foreground">{trip.revised_end_at ? "Revised end time" : "Scheduled end time"}</dt><dd>{dateLabel(tripEndTime(trip))}</dd></div>
                {trip.closed_at && <div><dt className="text-muted-foreground">Closed</dt><dd>{dateLabel(Date.parse(trip.closed_at))}</dd></div>}
              </dl>
              {canCloseOutTrip(trip) ? (
                <form onSubmit={submit} className="space-y-4 border-t pt-4">
                  <label className="block text-sm font-semibold">Trip action
                    <select value={action} onChange={event => setAction(event.target.value as Action | "")} className="mt-1 block w-full max-w-sm rounded-lg border p-2">
                      <option value="">Choose an action</option>
                      {trip.status !== "ongoing" && <option value="departed">Confirm departure</option>}
                      <option value="delay">Record a delay</option>
                      {needsCloseout(trip) && <option value="complete">Mark completed</option>}
                      <option value="did_not_run">Mark as did not run</option>
                    </select>
                  </label>
                  {action === "delay" ? <div className="grid max-w-md gap-3 sm:grid-cols-2">
                    <label className="text-sm">Revised end date<input required type="date" value={date} onChange={event => setDate(event.target.value)} className="mt-1 block w-full rounded-lg border p-2" /></label>
                    <label className="text-sm">Revised end time (EAT)<input required type="time" value={time} onChange={event => setTime(event.target.value)} className="mt-1 block w-full rounded-lg border p-2" /></label>
                  </div> : null}
                  {action === "did_not_run" ? <label className="block text-sm">Reason shared with travelers
                    <textarea required maxLength={500} value={reason} onChange={event => setReason(event.target.value)} className="mt-1 block w-full rounded-lg border p-2" />
                  </label> : null}
                  <Button type="submit" disabled={!action} isLoading={pending}>Save trip outcome</Button>
                </form>
              ) : ["completed", "cancelled"].includes(trip.status) ? (
                <Link href={"/dashboard/trips/new?copy=" + id} className="inline-block text-sm font-semibold underline">Duplicate as new trip</Link>
              ) : null}
            </Card>
            <Card>
              <h2 className="mb-4 text-lg font-semibold">Bookings and payments</h2>
              {!bookings.length ? <p className="text-sm text-muted-foreground">No reservations for this trip.</p> : (
                <ul className="divide-y">
                  {bookings.map(booking => (
                    <li key={booking.id} className="flex flex-wrap justify-between gap-3 py-3 text-sm">
                      <div><strong>{booking.user?.name || booking.id.slice(0, 8)}</strong><p>{booking.seats} {booking.seats === 1 ? "seat" : "seats"}</p></div>
                      <div className="text-right">{formatCurrency(booking.total_price, booking.currency)}<p className="capitalize">{booking.status} · {booking.payment_status}</p></div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </>
        ) : null}
      </div>
    </>
  );
}

