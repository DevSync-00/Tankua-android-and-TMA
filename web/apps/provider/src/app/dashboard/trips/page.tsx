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
  Eye,
  RefreshCw,
  Copy,
} from "lucide-react";
import { Header } from "@/components/header";
import { Card, CardContent, Button, Badge, formatCurrency, ConfirmDialog, InlineBanner } from "@tankua/ui";
import { getProviderTrips, updateTripStatus, deleteTrip, type TripDetails } from "@/lib/queries";

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
      const matchesStatus = statusFilter === "all" || trip.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [trips, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const totalSeats = trips.reduce((sum, t) => sum + (t.max_seats || 0), 0);
    const bookedSeats = trips.reduce(
      (sum, t) => sum + Math.max(0, (t.max_seats || 0) - (t.available_seats || 0)),
      0
    );
    const upcomingCount = trips.filter((t) => t.status === "upcoming" || t.status === "ongoing").length;
    const occupancy = totalSeats ? Math.round((bookedSeats / totalSeats) * 100) : 0;

    return { totalSeats, bookedSeats, upcomingCount, occupancy };
  }, [trips]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "upcoming":
      case "ongoing":
        return (
          <Badge variant={status === "ongoing" ? "warning" : "success"} dot>
            {status === "ongoing" ? "Ongoing" : "Upcoming"}
          </Badge>
        );
      case "completed":
        return <Badge variant="secondary" dot>Completed</Badge>;
      case "cancelled":
        return <Badge variant="destructive" dot>Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }),
      time: date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
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

  const handleStatusChange = async (tripId: string, newStatus: 'upcoming' | 'ongoing' | 'completed' | 'cancelled') => {
    try {
      const result = await updateTripStatus(tripId, newStatus);
      if (result.success) {
        if (providerId) {
          await fetchTrips(providerId);
        }
        setBanner({ message: `Trip status updated to ${newStatus}`, variant: "success" });
      } else {
        setBanner({ message: result.error || "Failed to update trip status", variant: "error" });
      }
    } catch (err) {
      console.error("Error updating trip status:", err);
      setBanner({ message: "Failed to update trip status. Please try again.", variant: "error" });
    }
  };

  return (
    <div className="min-h-screen">
      <Header
        title="My Trips"
        subtitle={
          loading
            ? "Loading trips..."
            : `${filteredTrips.length} trips${statusFilter !== "all" ? ` • ${statusFilter}` : ""}`
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw className="h-4 w-4" />}
              onClick={() => providerId && fetchTrips(providerId)}
              isLoading={loading}
            >
              Refresh
            </Button>
            <Link href="/dashboard/trips/bulk">
              <Button variant="outline" size="sm" leftIcon={<Copy className="h-4 w-4" />}>
                Bulk Create
              </Button>
            </Link>
            <Link href="/dashboard/trips/new">
              <Button size="sm" leftIcon={<Plus className="h-4 w-4" />}>
                Create Trip
              </Button>
            </Link>
          </div>
        }
      />

      <div className="p-4 sm:p-6 space-y-6">
        {banner && (
          <InlineBanner
            message={banner.message}
            variant={banner.variant}
            onClose={() => setBanner(null)}
          />
        )}
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search trips..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-11 pr-4 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-11 px-4 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="all">All Status</option>
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Upcoming / Ongoing</p>
            <p className="text-2xl font-bold mt-1">{stats.upcomingCount}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Total Seats</p>
            <p className="text-2xl font-bold mt-1">{stats.totalSeats}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Booked Seats</p>
            <p className="text-2xl font-bold mt-1 text-primary">{stats.bookedSeats}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Occupancy Rate</p>
            <p className="text-2xl font-bold mt-1 text-emerald-600">
              {stats.occupancy}%
            </p>
          </Card>
        </div>

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
            </CardContent>
          </Card>
        )}

        {/* Trips Table */}
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
                      {getStatusBadge(trip.status)}
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
                        <p className="font-semibold text-sm">{formatCurrency(trip.price)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {booked}/{capacity}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => router.push(`/dashboard/trips/${trip.id}`)}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
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
                          <p className="font-semibold text-sm">{formatCurrency(trip.price)}</p>
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
                          {getStatusBadge(trip.status)}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => router.push(`/dashboard/trips/${trip.id}`)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
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

