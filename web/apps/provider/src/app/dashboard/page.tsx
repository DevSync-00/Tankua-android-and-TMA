"use client";

import { useCallback, useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Bus,
  CalendarDays,
  ChevronRight,
  Layers3,
  MapPin,
  Plus,
  RefreshCw,
  Route,
  Star,
  Ticket,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, Badge, Button, buttonVariants, cn, formatCurrency, formatCurrencyTotals } from "@tankua/ui";
import { Header } from "@/components/header";
import {
  getProviderStats,
  getRecentBookings,
  getRecentReviews,
  getUpcomingTrips,
  type ProviderStats,
  type RecentBooking,
  type RecentReview,
  type UpcomingTrip,
} from "@/lib/queries";

const departureDate = new Intl.DateTimeFormat("en-ET", {
  weekday: "short", month: "short", day: "numeric", year: "numeric",
  timeZone: "Africa/Addis_Ababa",
});
const departureTime = new Intl.DateTimeFormat("en-ET", {
  hour: "numeric", minute: "2-digit", timeZone: "Africa/Addis_Ababa",
});

const quickActions = [
  { label: "Manage pickup stations", href: "/dashboard/pickup-stations", icon: MapPin },
  { label: "Create trips in bulk", href: "/dashboard/trips/bulk", icon: Layers3 },
  { label: "Add a driver", href: "/dashboard/drivers/new", icon: Users },
  { label: "Add a vehicle", href: "/dashboard/vehicles/new", icon: Bus },
];

type DashboardData = {
  stats: ProviderStats | null;
  trips: UpcomingTrip[] | null;
  bookings: RecentBooking[] | null;
  reviews: RecentReview[] | null;
};

function SectionLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex shrink-0 items-center gap-1 rounded-sm text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {children}
      <ChevronRight aria-hidden="true" className="size-4" />
    </Link>
  );
}

function Metric({
  href, label, value, comparison, icon: Icon,
}: {
  href: string; label: string; value: string | number; comparison?: string; icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className="group block min-w-0 p-3.5 transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:p-4"
    >
      <p className="flex items-start gap-2 text-xs font-semibold text-muted-foreground sm:items-center sm:text-sm">
        <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 sm:mt-0" />
        <span>{label}</span>
      </p>
      <p className="mt-2 break-words text-lg font-semibold tabular-nums tracking-tight sm:text-xl">{value}</p>
      {comparison ? <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">{comparison}</p> : null}
    </Link>
  );
}

function formatComparison(change: number | undefined, period: string) {
  return change === undefined ? undefined : `${change > 0 ? "+" : ""}${change}% vs ${period}`;
}

function DepartureTime({ dateTime, className }: { dateTime: string; className?: string }) {
  const date = new Date(dateTime);
  return (
    <time dateTime={dateTime} className={className}>
      {departureDate.format(date)} · {departureTime.format(date)} EAT
    </time>
  );
}

function getTripLabel(status: string) {
  if (status === "active") return "Payment open";
  if (status === "collecting_interest") return "Collecting interest";
  return "Reservations open";
}

function getBookingLabel(booking: RecentBooking) {
  if (booking.status === "cancelled") return "Cancelled";
  if (booking.paymentStatus === "paid") return "Paid";
  if (booking.paymentStatus === "refunded") return "Refunded";
  if (booking.paymentStatus === "pending") {
    const upcoming = booking.tripStatus === "upcoming"
      && booking.departureDate !== null
      && Date.parse(booking.departureDate) > Date.now();
    return upcoming ? "Awaiting activation" : "Payment pending";
  }
  return "Payment status unavailable";
}

function TripSchedule({ trips }: { trips: UpcomingTrip[] | null }) {
  const [nextTrip, ...laterTrips] = trips ?? [];
  const collectingInterest = nextTrip?.status === "collecting_interest";
  const seatsOrInterest = collectingInterest ? nextTrip.interestCount : nextTrip?.passengers;
  const goal = collectingInterest ? nextTrip.minimumInterest : nextTrip?.capacity;
  return (
    <section aria-labelledby="departure-heading" className="min-w-0 overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-4 sm:px-5">
        <h2 id="departure-heading" className="text-lg font-semibold tracking-tight">Upcoming departures</h2>
        <SectionLink href="/dashboard/trips">All trips</SectionLink>
      </div>
      {nextTrip ? (
        <>
          <div className="portal-next-trip px-4 py-5 text-white sm:px-5 sm:py-6">
            <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-4">
              <div className="min-w-0">
                <h3 className="break-words text-2xl font-semibold tracking-tight sm:text-[1.75rem]">{nextTrip.destination}</h3>
                <p className="mt-2 flex items-start gap-2 text-sm text-[#d7e5d9]">
                  <CalendarDays aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                  <DepartureTime dateTime={nextTrip.departureDate} />
                </p>
              </div>
              <span className="rounded-full border border-white/25 px-2.5 py-1 text-xs font-semibold text-white">
                {getTripLabel(nextTrip.status)}
              </span>
            </div>
            <div className="mt-5 max-w-xs">
              <p className="text-sm font-medium text-[#e5eee5]">
                {seatsOrInterest}{goal ? ` of ${goal}` : ""} {collectingInterest ? "seats pledged" : "seats booked"}
              </p>
              {goal && goal > 0 ? (
                <progress
                  className="portal-seat-progress mt-2 block w-full"
                  value={seatsOrInterest}
                  max={goal}
                  aria-label={collectingInterest ? "Interest toward the trip minimum" : "Seats booked"}
                />
              ) : null}
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
              <Link
                href={`/dashboard/trips/${nextTrip.id}/edit`}
                className={cn(buttonVariants({ size: "sm", variant: "secondary" }), "gap-2 shadow-none hover:shadow-none")}
              >
                {nextTrip.status === "upcoming" ? "Review activation" : "Manage trip"}
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              {nextTrip.status === "upcoming" ? (
                <p className="text-xs text-[#d7e5d9]">Activation opens payments for reservations.</p>
              ) : null}
            </div>
          </div>
          {laterTrips.length ? (
            <ul className="divide-y divide-border px-4 sm:px-5">
              {laterTrips.map((trip) => (
                <li key={trip.id}>
                  <Link
                    href={`/dashboard/trips/${trip.id}/edit`}
                    className="group flex items-center gap-3 rounded-md py-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground group-hover:bg-accent group-hover:text-accent-foreground">
                      <CalendarDays aria-hidden="true" className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="block break-words text-sm font-semibold group-hover:underline">{trip.destination}</span>
                      <DepartureTime dateTime={trip.departureDate} className="text-xs text-muted-foreground" />
                    </div>
                    <span className="max-w-[6rem] text-right text-xs font-medium text-muted-foreground sm:max-w-none">
                      {getTripLabel(trip.status)}
                    </span>
                    <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      ) : (
        <div className="px-4 py-7 sm:px-5">
          <Route aria-hidden="true" className="mb-3 size-5 text-primary" />
          <p className="text-sm font-semibold">{trips === null ? "Couldn’t load departures" : "No departures scheduled"}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {trips === null ? "Refresh the overview to try again." : "Create a trip to start taking reservations or collecting interest."}
          </p>
          {trips !== null ? <div className="mt-3"><SectionLink href="/dashboard/trips/new">Create a trip</SectionLink></div> : null}
        </div>
      )}
    </section>
  );
}

function RecentBookings({ bookings }: { bookings: RecentBooking[] | null }) {
  return (
    <section aria-labelledby="bookings-heading" className="min-w-0 rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-4 sm:px-5">
        <h2 id="bookings-heading" className="text-lg font-semibold tracking-tight">Recent bookings</h2>
        <SectionLink href="/dashboard/bookings">All bookings</SectionLink>
      </div>
      {bookings?.length ? (
        <ul className="divide-y divide-border border-t border-border px-4 sm:px-5">
          {bookings.map((booking) => (
            <li key={booking.id} className="flex items-start gap-3 py-3.5">
              <Avatar name={booking.customer} size="sm" className="shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="break-words text-sm font-semibold">{booking.customer}</p>
                <p className="mt-1 break-words text-xs text-muted-foreground">{booking.destination} · {booking.seats} {booking.seats === 1 ? "seat" : "seats"}</p>
                <p className="mt-1 text-xs text-muted-foreground">{booking.time}</p>
              </div>
              <div className="max-w-[48%] shrink-0 text-right">
                <p className="text-sm font-semibold tabular-nums">{formatCurrency(booking.amount, booking.currency)}</p>
                <Badge
                  variant={booking.paymentStatus === "paid" && booking.status !== "cancelled" ? "success" : "secondary"}
                  className={cn(
                    "mt-1 max-w-full justify-end px-2 leading-snug",
                    (booking.paymentStatus !== "paid" || booking.status === "cancelled") && "bg-muted text-foreground",
                  )}
                >
                  {getBookingLabel(booking)}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="border-t border-border px-4 py-7 sm:px-5">
          <p className="text-sm font-semibold">{bookings === null ? "Couldn’t load bookings" : "No recent bookings"}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {bookings === null ? "Refresh the overview to try again." : "New reservations and their payment status will appear here."}
          </p>
        </div>
      )}
    </section>
  );
}

function Reviews({ reviews }: { reviews: RecentReview[] | null }) {
  return (
    <section aria-labelledby="reviews-heading" className="min-w-0 rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-4 sm:px-5">
        <h2 id="reviews-heading" className="text-lg font-semibold tracking-tight">Recent reviews</h2>
        <SectionLink href="/dashboard/reviews">All reviews</SectionLink>
      </div>
      {reviews?.length ? (
        <ul className="divide-y divide-border border-t border-border px-4 sm:px-5">
          {reviews.map((review) => (
            <li key={review.id} className="py-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{review.customer}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{review.trip} · {review.date}</p>
                </div>
                {review.rating !== null ? (
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-accent px-2 py-1 text-xs font-semibold text-accent-foreground">
                    <Star aria-hidden="true" className="size-3.5 fill-current" />
                    {review.rating}/5
                  </span>
                ) : null}
              </div>
              {review.comment ? <p className="mt-2.5 break-words text-sm text-muted-foreground">{review.comment}</p> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="border-t border-border px-4 py-8 text-sm text-muted-foreground sm:px-5">
          {reviews === null ? "Recent reviews are unavailable." : "Traveler reviews will appear here."}
        </p>
      )}
    </section>
  );
}

function DashboardSkeleton() {
  return (
    <div role="status">
      <span className="sr-only">Loading overview…</span>
      <div aria-hidden="true" className="space-y-6 motion-safe:animate-pulse">
        <div className="h-24 rounded-xl border border-border bg-muted" />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
          <div className="h-52 rounded-xl border border-border bg-muted sm:h-72" />
          <div className="h-44 rounded-xl border border-border bg-muted sm:h-56" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [providerId, setProviderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [data, setData] = useState<DashboardData>({ stats: null, trips: null, bookings: null, reviews: null });

  const loadDashboard = useCallback(async (id: string) => {
    setLoading(true);
    const [stats, trips, bookings, reviews] = await Promise.allSettled([
      getProviderStats(id),
      getUpcomingTrips(id, 4),
      getRecentBookings(id, 4),
      getRecentReviews(id, 2),
    ]);
    setData((previous) => ({
      stats: stats.status === "fulfilled" ? stats.value : previous.stats,
      trips: trips.status === "fulfilled" ? trips.value : previous.trips,
      bookings: bookings.status === "fulfilled" ? bookings.value : previous.bookings,
      reviews: reviews.status === "fulfilled" ? reviews.value : previous.reviews,
    }));
    setHasLoadError([stats, trips, bookings, reviews].some((result) => result.status === "rejected"));
    setLoading(false);
  }, []);

  useEffect(() => {
    try {
      const session = JSON.parse(localStorage.getItem("provider_user") || "null");
      const id = session?.provider_id || session?.provider?.id;
      if (typeof id === "string" && id) {
        setProviderId(id);
        void loadDashboard(id);
        return;
      }
    } catch (error) {
      console.error("Failed to read provider session", error);
    }
    router.replace("/login");
  }, [loadDashboard, router]);

  const { stats, trips, bookings, reviews } = data;
  const initialLoading = loading && !stats && !trips && !bookings && !reviews;

  return (
    <>
      <Header
        title="Overview"
        subtitle="Departures, bookings and trip sales"
        actions={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-2 border border-border bg-card"
              disabled={loading || !providerId}
              aria-label="Refresh overview"
              onClick={() => { if (providerId) void loadDashboard(providerId); }}
            >
              <RefreshCw aria-hidden="true" className={cn("size-4", loading && "motion-safe:animate-spin")} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Link href="/dashboard/trips/new" className={cn(buttonVariants({ size: "sm" }), "gap-2 shadow-none hover:shadow-none")}>
              <Plus aria-hidden="true" className="size-4" />
              Create trip
            </Link>
          </div>
        }
      />
      <div className="portal-content" aria-busy={loading}>
        {initialLoading ? (
          <DashboardSkeleton />
        ) : (
          <>
            {hasLoadError ? (
              <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                Some overview information is unavailable. Refresh to try again.
              </p>
            ) : null}
            <section aria-label="Performance summary" className="portal-metrics grid grid-cols-2 overflow-hidden rounded-xl border border-border bg-card xl:grid-cols-4">
              <Metric href="/dashboard/trips" label="Active trips" value={stats?.activeTrips ?? "—"} icon={Bus} />
              <Metric
                href="/dashboard/bookings"
                label="Today’s bookings"
                value={stats?.todayBookings ?? "—"}
                comparison={formatComparison(stats?.bookingsChange, "yesterday")}
                icon={Ticket}
              />
              <Metric
                href="/dashboard/earnings"
                label="Trip sales this month"
                value={stats?.monthlyEarnings == null ? "—" : formatCurrencyTotals(stats.monthlyEarnings)}
                comparison={formatComparison(stats?.earningsChange, "last month")}
                icon={Wallet}
              />
              <Metric href="/dashboard/reviews" label="Average rating" value={stats?.averageRating?.toFixed(1) ?? "—"} icon={Star} />
            </section>
            <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
              <TripSchedule trips={trips} />
              <RecentBookings bookings={bookings} />
            </div>
            <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
              <section aria-labelledby="actions-heading" className="rounded-xl border border-border bg-card">
                <h2 id="actions-heading" className="px-4 py-4 text-lg font-semibold tracking-tight sm:px-5">Quick actions</h2>
                <ul className="grid gap-px overflow-hidden rounded-b-xl border-t border-border bg-border sm:grid-cols-2">
                  {quickActions.map(({ href, label, icon: Icon }) => (
                    <li key={href} className="min-w-0 bg-card">
                      <Link
                        href={href}
                        className="group flex h-full items-center gap-3 px-4 py-3.5 transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-5"
                      >
                        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-primary group-hover:bg-accent">
                          <Icon aria-hidden="true" className="size-4" />
                        </span>
                        <span className="min-w-0 flex-1 text-sm font-semibold">{label}</span>
                        <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
              <Reviews reviews={reviews} />
            </div>
          </>
        )}
      </div>
    </>
  );
}

