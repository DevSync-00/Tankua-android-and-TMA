"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Route,
  Plus,
  Search,
  Calendar,
  MapPin,
  Users,
  Edit,
  Trash2,
  RefreshCw,
  Copy,
  Share2,
} from "lucide-react";
import { Header } from "@/components/header";
import { Card, CardContent, Button, Badge, buttonVariants, cn, formatCurrency, ConfirmDialog, InlineBanner } from "@tankua/ui";
import { getProviderTrips, updateTripStatus, deleteTrip, type TripDetails } from "@/lib/queries";
import { canCloseOutTrip, needsCloseout } from "@/lib/trip-closeout";

const tripStatuses = {
  collecting_interest: { label: "Collecting interest", variant: "warning" },
  upcoming: { label: "Upcoming", variant: "secondary" },
  active: { label: "Active", variant: "success" },
  ongoing: { label: "Ongoing", variant: "warning" },
  completed: { label: "Completed", variant: "secondary" },
  cancelled: { label: "Cancelled", variant: "destructive" },
} as const;

function TripStatus({ trip }: { trip: TripDetails }) {
  const status = tripStatuses[trip.status as keyof typeof tripStatuses];
  const interestClosed = trip.closeout_reason === "interest_goal_missed" ||
    (trip.status === "collecting_interest" && Date.parse(trip.departure_date) <= Date.now());
  const closeout = needsCloseout(trip);

  return (
    <div className="space-y-1">
      <Badge variant={closeout ? "warning" : status?.variant ?? "secondary"} dot={Boolean(status)}>
        {interestClosed ? "Interest goal missed" : closeout ? "Needs closeout" : status?.label ?? trip.status}
      </Badge>
      {trip.minimum_interest !== null && (
        <p className="text-xs text-muted-foreground">
          {trip.interest_count.toLocaleString()} / {trip.minimum_interest.toLocaleString()} interested
        </p>
      )}
    </div>
  );
}

export default function TripsPage() {
  const router = useRouter();
  const [providerId, setProviderId] = useState<string | null>(null);
  const [trips, setTrips] = useState<TripDetails[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deletingTripId, setDeletingTripId] = useState<string | null>(null);
  const [activatingTripId, setActivatingTripId] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ message: string; variant: "success" | "error" | "info" } | null>(null);

  useEffect(() => {
    const loadProviderAndTrips = async () => {
      const stored = localStorage.getItem("provider_user");
      if (!stored) {
        router.replace("/login");
        return;
      }

      try {
        const parsed = JSON.parse(stored);
        const id = parsed?.provider_id || parsed?.provider?.id;
        if (!id) {
          router.replace("/login");
          return;
        }

        setProviderId(id);
        await fetchTrips(id);
      } catch (err) {
        console.error("Failed to load provider session", err);
        setError("Could not load your provider session. Please sign in again.");
        setLoading(false);
      }
    };

    loadProviderAndTrips();
  }, [router]);

  const fetchTrips = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { trips } = await getProviderTrips(id);
      setTrips(trips);
    } catch (err) {
      console.error("Failed to load trips", err);
      setError("Could not load trips. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filteredTrips = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return trips.filter((trip) => {
      const destinationName =
        trip.destination?.name || "Destination";
      const matchesSearch = destinationName.toLowerCase().includes(query);
      const matchesStatus = statusFilter === "all"
        || (statusFilter === "closeout" && needsCloseout(trip))
        || (statusFilter === "past" && ["completed", "cancelled"].includes(trip.status))
        || trip.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [trips, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const bookableTrips = trips.filter((trip) => trip.minimum_interest === null || trip.interest_count >= trip.minimum_interest);
    const totalSeats = bookableTrips.reduce((sum, t) => sum + (t.max_seats || 0), 0);
    const bookedSeats = bookableTrips.reduce(
      (sum, t) => sum + Math.max(0, (t.max_seats || 0) - (t.available_seats || 0)),
      0
    );
    const scheduledCount = trips.filter((trip) => ["upcoming", "active", "ongoing"].includes(trip.status) && !needsCloseout(trip)).length;
    const closeoutCount = trips.filter((trip) => needsCloseout(trip)).length;
    const occupancy = totalSeats ? Math.round((bookedSeats / totalSeats) * 100) : 0;

    return { totalSeats, bookedSeats, scheduledCount, closeoutCount, occupancy };
  }, [trips]);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const timeZone = "Africa/Addis_Ababa";
    return {
      date: date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", timeZone }),
      time: `${date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", timeZone })} EAT`,
    };
  };

  const handleEdit = (tripId: string) => {
    router.push(`/dashboard/trips/${tripId}/edit`);
  };

  const handleDelete = (tripId: string) => {
    setDeleteConfirmId(tripId);
  };

  const executeDelete = async () => {
    if (!deleteConfirmId) return;
    setDeletingTripId(deleteConfirmId);
    try {
      const result = await deleteTrip(deleteConfirmId);
      if (result.success) {
        if (providerId) {
          await fetchTrips(providerId);
        }
        setBanner({ message: "Trip deleted successfully", variant: "success" });
      } else {
        setBanner({ message: result.error || "Failed to delete trip", variant: "error" });
      }
    } catch (err) {
      console.error(err);
      setBanner({ message: "Failed to delete trip. Please try again.", variant: "error" });
    } finally {
      setDeletingTripId(null);
      setDeleteConfirmId(null);
    }
  };

  const activateTrip = async (tripId: string) => {
    setActivatingTripId(tripId);
    try {
      const result = await updateTripStatus(tripId, "active", "upcoming");
      if (result.success) {
        if (providerId) {
          await fetchTrips(providerId);
        }
        setBanner({ message: "Trip activated. Travelers can now pay for their reservations.", variant: "success" });
      } else {
        setBanner({ message: result.error || "Could not activate this trip.", variant: "error" });
      }
    } catch (err) {
      console.error("Error activating trip:", err);
      setBanner({ message: "Could not activate this trip. Please try again.", variant: "error" });
    } finally {
      setActivatingTripId(null);
    }
  };

  const renderActivateButton = (trip: TripDetails) => {
    if (canCloseOutTrip(trip)) {
      return <Link href={`/dashboard/trips/${trip.id}/closeout`} className="rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-muted">
        {needsCloseout(trip) ? "Close out" : "Trip progress"}
      </Link>;
    }
    if (["completed", "cancelled"].includes(trip.status)) {
      return <Link href={`/dashboard/trips/${trip.id}/closeout`} className="rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-muted">Past trip details</Link>;
    }
    const canActivate = trip.status === "upcoming" && Date.parse(trip.departure_date) > Date.now();
    if (!canActivate) return null;

    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => activateTrip(trip.id)}
        disabled={activatingTripId !== null}
        isLoading={activatingTripId === trip.id}
      >
        Activate Trip
      </Button>
    );
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Trips"
        subtitle={
          loading
            ? undefined
            : `${filteredTrips.length} ${filteredTrips.length === 1 ? "trip" : "trips"}`
        }
        actions={
          <div className="flex max-w-full flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw className="h-4 w-4" />}
              onClick={() => providerId && fetchTrips(providerId)}
              isLoading={loading}
            >
              Refresh
            </Button>
            <Link href="/dashboard/trips/bulk" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}>
              <Copy aria-hidden="true" className="size-4" />
              Bulk create
            </Link>
            <Link href="/dashboard/trips/new" className={cn(buttonVariants({ size: "sm" }), "gap-2 shadow-none hover:shadow-none")}>
              <Plus aria-hidden="true" className="size-4" />
              Create trip
            </Link>
          </div>
        }
      />

      <div className="portal-content">
        {banner && (
          <InlineBanner
            message={banner.message}
            variant={banner.variant}
            onDismiss={() => setBanner(null)}
          />
        )}
        {/* Filters */}
        <div className="portal-toolbar">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              aria-label="Search trips"
              placeholder="Search trips"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-11 pr-4 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter trips by status"
            className="h-11 px-4 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="all">All statuses</option>
            <option value="closeout">Needs closeout ({stats.closeoutCount})</option>
            <option value="past">Past trips</option>
            {Object.entries(tripStatuses).map(([value, status]) => (
              <option key={value} value={value}>{status.label}</option>
            ))}
          </select>
        </div>

        <dl aria-label="Trip summary" className="portal-metrics grid grid-cols-2 rounded-xl border border-border bg-card xl:grid-cols-4">
          {[
            ["Scheduled or ongoing", stats.scheduledCount],
            ["Total seats", stats.totalSeats],
            ["Booked seats", stats.bookedSeats],
            ["Occupancy", `${stats.occupancy}%`],
          ].map(([label, value]) => (
            <div key={label} className="p-3.5 sm:p-4">
              <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
              <dd className="mt-2 text-xl font-semibold tabular-nums tracking-tight">{loading && !trips.length ? "—" : value}</dd>
            </div>
          ))}
        </dl>

        {/* Error / Empty / Loading states */}
        {error && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-destructive">{error}</p>
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<RefreshCw className="h-4 w-4" />}
                  onClick={() => providerId && fetchTrips(providerId)}
                >
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {!error && !loading && filteredTrips.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center space-y-2">
              {searchQuery || statusFilter !== "all" ? (
                <>
                  <p className="font-medium">No trips match these filters</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("");
                      setStatusFilter("all");
                    }}
                  >
                    Clear filters
                  </Button>
                </>
              ) : (
                <>
                  <p className="font-medium">No trips yet</p>
                  <p className="text-sm text-muted-foreground">
                    Create your first trip from Tankua destinations to get started.
                  </p>
                  <div className="flex justify-center">
                    <Link href="/dashboard/trips/new">
                      <Button size="sm" leftIcon={<Route className="h-4 w-4" />}>
                        Create a Trip
                      </Button>
                    </Link>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {loading && !trips.length ? (
          <div role="status" className="rounded-xl border border-border bg-card px-4 py-7 text-sm text-muted-foreground sm:px-5">
            Loading trips…
          </div>
        ) : null}
        {/* Trips Table */}
        {filteredTrips.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            {/* Mobile Card View */}
            <div className="lg:hidden divide-y divide-border">
              {filteredTrips.map((trip) => {
                const destinationName = trip.destination?.name || "Destination";
                const { date, time } = formatDateTime(trip.departure_date);
                const capacity = trip.max_seats || 0;
                const booked = Math.max(0, capacity - (trip.available_seats || 0));

                return (
                  <div key={trip.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{destinationName}</p>
                          <p className="text-xs text-muted-foreground">
                            {trip.id} • {trip.trip_type === "round_trip" ? "Round Trip" : "One Way"}
                          </p>
                        </div>
                      </div>
                      <TripStatus trip={trip} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div>
                        <p className="text-sm">{date}</p>
                        <p className="text-xs text-muted-foreground">{time}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <div>
                        <p className="font-semibold text-sm">{formatCurrency(trip.price, trip.currency)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {booked}/{capacity}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {renderActivateButton(trip)}
                        <Link href={`/dashboard/trips/${trip.id}/promotion`} className={buttonVariants({ variant: "ghost", size: "sm", className: "min-h-10 gap-1.5" })}>
                          <Share2 className="h-4 w-4" aria-hidden="true" /> Promote
                        </Link>
                        {Date.parse(trip.departure_date) > Date.now() ? <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(trip.id)}
                            title="Edit Trip"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDelete(trip.id)}
                            disabled={deletingTripId === trip.id}
                            title="Delete Trip"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </> : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Destination</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date & Time</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Price</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Capacity</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="text-left py-4 px-6"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTrips.map((trip) => {
                    const destinationName = trip.destination?.name || "Destination";
                    const { date, time } = formatDateTime(trip.departure_date);
                    const capacity = trip.max_seats || 0;
                    const booked = Math.max(0, capacity - (trip.available_seats || 0));
                    const occupancy = capacity ? (booked / capacity) * 100 : 0;

                    return (
                      <tr key={trip.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <MapPin className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-sm truncate max-w-[200px]">{destinationName}</p>
                              <p className="text-xs text-muted-foreground">
                                {trip.id} • {trip.trip_type === "round_trip" ? "Round Trip" : "One Way"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm">{date}</p>
                              <p className="text-xs text-muted-foreground">{time}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <p className="font-semibold text-sm">{formatCurrency(trip.price, trip.currency)}</p>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{booked}/{capacity}</span>
                            <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary rounded-full"
                                style={{ width: `${occupancy}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <TripStatus trip={trip} />
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1">
                            {renderActivateButton(trip)}
                            <Link href={`/dashboard/trips/${trip.id}/promotion`} className={buttonVariants({ variant: "ghost", size: "sm", className: "min-h-10 gap-1.5" })}>
                              <Share2 className="h-4 w-4" aria-hidden="true" /> Promote
                            </Link>
                            {Date.parse(trip.departure_date) > Date.now() ? <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleEdit(trip.id)}
                                title="Edit Trip"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => handleDelete(trip.id)}
                                disabled={deletingTripId === trip.id}
                                title="Delete Trip"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </> : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        ) : null}
      </div>

      <ConfirmDialog
        isOpen={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
        title="Delete Trip"
        description="Are you sure you want to delete this trip schedule? Passenger bookings associated with this trip may be affected."
        confirmText="Delete Trip"
        cancelText="Cancel"
        variant="danger"
        onConfirm={executeDelete}
      />
    </div>
  );
}

