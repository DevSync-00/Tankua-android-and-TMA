"use client";

import { useState, useEffect } from "react";
import {
  CalendarCheck,
  Search,
  Filter,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Users,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { Header } from "@/components/header";
import { Card, CardContent, Button, Badge, Avatar, Input, formatCurrency } from "@tankua/ui";
import { getBookings, updateBookingStatus, type BookingDetails } from "@/lib/queries";

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingDetails[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [paymentFilter, setPaymentFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    loadBookings();
  }, [page, statusFilter, paymentFilter]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const result = await getBookings({
        limit,
        offset: (page - 1) * limit,
        status: statusFilter || undefined,
        paymentStatus: paymentFilter || undefined,
      });
      setBookings(result.bookings);
      setTotal(result.total);
    } catch (error) {
      console.error("Error loading bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    const success = await updateBookingStatus(id, { status: newStatus });
    if (success) {
      loadBookings();
    }
  };

  const totalPages = Math.ceil(total / limit);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge variant="success" dot>Confirmed</Badge>;
      case "pending":
        return <Badge variant="warning" dot>Pending</Badge>;
      case "cancelled":
        return <Badge variant="destructive" dot>Cancelled</Badge>;
      case "completed":
        return <Badge variant="default" dot>Completed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge variant="success">Paid</Badge>;
      case "pending":
        return <Badge variant="warning">Pending</Badge>;
      case "refunded":
        return <Badge variant="destructive">Refunded</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Bookings"
        subtitle={`Manage ${total.toLocaleString()} bookings`}
        actions={
          <Button variant="outline" size="sm" onClick={loadBookings}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      <div className="p-4 sm:p-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-border rounded-lg bg-background text-sm"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => {
              setPaymentFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-border rounded-lg bg-background text-sm"
          >
            <option value="">All Payments</option>
            <option value="pending">Payment Pending</option>
            <option value="paid">Paid</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        {/* Bookings Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-12">
                <CalendarCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No bookings found</p>
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="lg:hidden divide-y divide-border">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Avatar name={booking.user?.name || "User"} size="sm" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{booking.user?.name || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground truncate">{booking.user?.phone_number}</p>
                          </div>
                        </div>
                        {getStatusBadge(booking.status)}
                      </div>
                      <div>
                        <p className="font-medium text-sm truncate">
                          {booking.trip?.destination?.name || booking.destination_name || "Unknown Destination"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {booking.trip?.departure_date ? formatDate(booking.trip.departure_date) : "No date"} • {booking.seats} seats
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <span className="truncate">
                          {typeof booking.pickup_station === 'object' && booking.pickup_station?.name 
                            ? booking.pickup_station.name 
                            : booking.pickup_station?.stationName || "Not selected"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <div>
                          <p className="font-semibold text-sm">{formatCurrency(booking.total_price)}</p>
                          {getPaymentBadge(booking.payment_status)}
                        </div>
                        <div className="flex items-center gap-1">
                          {booking.status === "pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50"
                                onClick={() => handleStatusUpdate(booking.id, "confirmed")}
                                title="Confirm"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={() => handleStatusUpdate(booking.id, "cancelled")}
                                title="Cancel"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Trip Details
                      </th>
                      <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Pickup
                      </th>
                      <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking) => (
                      <tr
                        key={booking.id}
                        className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <Avatar name={booking.user?.name || "User"} size="sm" />
                            <div>
                              <p className="font-medium text-sm">{booking.user?.name || "Unknown"}</p>
                              <p className="text-xs text-muted-foreground">
                                {booking.user?.phone_number}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div>
                            <p className="font-medium text-sm truncate max-w-[200px]">
                              {booking.trip?.destination?.name || booking.destination_name || "Unknown Destination"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {booking.trip?.departure_date
                                ? formatDate(booking.trip.departure_date)
                                : "No date"} • {booking.seats} seats
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="truncate max-w-[120px]">
                              {typeof booking.pickup_station === 'object' && booking.pickup_station?.name 
                                ? booking.pickup_station.name 
                                : booking.pickup_station?.stationName || "Not selected"}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div>
                            <p className="font-semibold text-sm">{formatCurrency(booking.total_price)}</p>
                            {getPaymentBadge(booking.payment_status)}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          {getStatusBadge(booking.status)}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1">
                            {booking.status === "pending" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50"
                                  onClick={() => handleStatusUpdate(booking.id, "confirmed")}
                                  title="Confirm"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                  onClick={() => handleStatusUpdate(booking.id, "cancelled")}
                                  title="Cancel"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground text-center sm:text-left">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} bookings
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


