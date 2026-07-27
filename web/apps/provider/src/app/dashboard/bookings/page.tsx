"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Filter, 
  Calendar,
  ChevronDown,
  MoreHorizontal,
  Eye,
  CheckCircle2,
  XCircle,
  Download,
  Phone,
  RefreshCw,
} from "lucide-react";
import { Header } from "@/components/header";
import { Card, CardContent, Button, Badge, Avatar, formatCurrency } from "@tankua/ui";
import { getProviderBookings, updateBookingStatus, type BookingDetails } from "@/lib/queries";

export default function BookingsPage() {
  const router = useRouter();
  const [providerId, setProviderId] = useState<string | null>(null);
  const [bookings, setBookings] = useState<BookingDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [dateRangeFilter, setDateRangeFilter] = useState<{ start: string; end: string } | null>(null);
  const [destinationFilter, setDestinationFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const [totalBookings, setTotalBookings] = useState(0);
  const [destinations, setDestinations] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    loadProviderSession();
  }, [router]);

  const loadDestinations = () => {
    // Extract unique destinations from bookings
    const uniqueDestinations = new Map<string, { id: string; name: string }>();
    
    bookings.forEach((booking) => {
      const destinationName = booking.trip?.destination?.name || booking.destination_name;
      const destinationId = booking.trip?.destination?.id || booking.destination_id;
      
      if (destinationName && destinationId) {
        if (!uniqueDestinations.has(destinationId)) {
          uniqueDestinations.set(destinationId, {
            id: destinationId,
            name: destinationName,
          });
        }
      }
    });
    
    setDestinations(Array.from(uniqueDestinations.values()));
  };

  useEffect(() => {
    // Reload destinations when bookings change
    if (bookings.length > 0) {
      loadDestinations();
    }
  }, [bookings]);

  const loadProviderSession = () => {
    try {
      const stored = localStorage.getItem("provider_user");
      if (!stored) {
        router.replace("/login");
        return;
      }

      const parsed = JSON.parse(stored);
      const id = parsed?.provider_id || parsed?.provider?.id;
      
      if (!id) {
        router.replace("/login");
        return;
      }

      setProviderId(id);
      loadBookings(id);
    } catch (err) {
      console.error("Failed to load provider session", err);
      router.replace("/login");
    }
  };

  const loadBookings = async (id: string) => {
    setLoading(true);
    try {
      const result = await getProviderBookings(id, {
        limit: 100, // Load more bookings
      });
      setBookings(result.bookings);
      setTotalBookings(result.total);
    } catch (error) {
      console.error("Error loading bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "TBD";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return { date: "TBD", time: "" };
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
    };
  };

  const filteredBookings = bookings.filter((booking) => {
    const customerName = booking.user?.name || "Unknown";
    const destinationName = booking.trip?.destination?.name || booking.destination_name || "Unknown";
    const bookingId = booking.id.substring(0, 8).toLowerCase();
    
    const matchesSearch = 
      customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookingId.includes(searchQuery.toLowerCase()) ||
      destinationName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
    const matchesPayment = paymentFilter === "all" || booking.payment_status === paymentFilter;
    
    const matchesDestination = destinationFilter === "all" || 
      destinationName === destinationFilter;
    
    let matchesDate = true;
    if (dateRangeFilter?.start && dateRangeFilter?.end) {
      const bookingDate = booking.trip?.departure_date || booking.created_at;
      const bookingDateObj = new Date(bookingDate);
      const startDate = new Date(dateRangeFilter.start);
      const endDate = new Date(dateRangeFilter.end);
      endDate.setHours(23, 59, 59, 999); // Include entire end date
      matchesDate = bookingDateObj >= startDate && bookingDateObj <= endDate;
    }
    
    return matchesSearch && matchesStatus && matchesPayment && matchesDestination && matchesDate;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge variant="success" dot>Confirmed</Badge>;
      case "pending":
        return <Badge variant="warning" dot>Pending</Badge>;
      case "cancelled":
        return <Badge variant="destructive" dot>Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPaymentBadge = (paymentStatus: string) => {
    switch (paymentStatus) {
      case "paid":
        return <Badge variant="success">Paid</Badge>;
      case "pending":
        return <Badge variant="warning">Pending</Badge>;
      case "refunded":
        return <Badge variant="default">Refunded</Badge>;
      default:
        return <Badge>{paymentStatus}</Badge>;
    }
  };

  const toggleSelectAll = () => {
    if (selectedBookings.length === filteredBookings.length) {
      setSelectedBookings([]);
    } else {
      setSelectedBookings(filteredBookings.map((b) => b.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedBookings.includes(id)) {
      setSelectedBookings(selectedBookings.filter((b) => b !== id));
    } else {
      setSelectedBookings([...selectedBookings, id]);
    }
  };

  const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
    try {
      const result = await updateBookingStatus(bookingId, { status: newStatus });
      if (result.success) {
        if (providerId) {
          await loadBookings(providerId);
        }
      } else {
        alert(result.error || "Failed to update booking status");
      }
    } catch (err) {
      console.error("Error updating booking status:", err);
      alert("Failed to update booking status. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header 
          title="Bookings" 
          subtitle="Loading bookings..."
        />
        <div className="p-6 flex items-center justify-center">
          <div className="flex items-center gap-3 text-muted-foreground">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Loading bookings...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header 
        title="Bookings" 
        subtitle={`${totalBookings} total bookings`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => providerId && loadBookings(providerId)}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />}>
              Export
            </Button>
          </div>
        }
      />

      <div className="p-4 sm:p-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by customer, booking ID, or destination..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-11 pr-4 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-11 px-4 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="h-11 px-4 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="all">All Payments</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="refunded">Refunded</option>
            </select>
            <Button 
              variant="outline" 
              leftIcon={<Filter className="h-4 w-4" />}
              onClick={() => setShowFilters(!showFilters)}
            >
              More Filters
            </Button>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Destination
                </label>
                <select
                  value={destinationFilter}
                  onChange={(e) => setDestinationFilter(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="all">All Destinations</option>
                  {destinations.map((dest) => (
                    <option key={dest.id} value={dest.name}>
                      {dest.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Start Date
                </label>
                <input
                  type="date"
                  value={dateRangeFilter?.start || ""}
                  onChange={(e) => setDateRangeFilter({
                    ...dateRangeFilter || { start: "", end: "" },
                    start: e.target.value
                  })}
                  className="w-full h-11 px-4 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  End Date
                </label>
                <input
                  type="date"
                  value={dateRangeFilter?.end || ""}
                  onChange={(e) => setDateRangeFilter({
                    ...dateRangeFilter || { start: "", end: "" },
                    end: e.target.value
                  })}
                  className="w-full h-11 px-4 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>
            {(dateRangeFilter?.start || dateRangeFilter?.end || destinationFilter !== "all") && (
              <div className="mt-4 flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDateRangeFilter(null);
                    setDestinationFilter("all");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Total Bookings</p>
            <p className="text-2xl font-bold mt-1">{totalBookings}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Confirmed</p>
            <p className="text-2xl font-bold mt-1 text-emerald-600">
              {bookings.filter((b) => b.status === "confirmed").length}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Pending Payment</p>
            <p className="text-2xl font-bold mt-1 text-amber-600">
              {bookings.filter((b) => b.payment_status === "pending").length}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="text-2xl font-bold mt-1 text-primary">
              {formatCurrency(bookings.filter((b) => b.payment_status === "paid").reduce((acc, b) => acc + b.total_price, 0))}
            </p>
          </Card>
        </div>

        {/* Bookings Table */}
        <Card>
          <CardContent className="p-0">
            {/* Mobile Card View */}
            <div className="lg:hidden divide-y divide-border">
              {filteredBookings.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <p>No bookings found</p>
                </div>
              ) : (
                filteredBookings.map((booking) => {
                  const customerName = booking.user?.name || "Unknown";
                  const destinationName = booking.trip?.destination?.name || booking.destination_name || "Unknown";
                  const tripDate = booking.trip?.departure_date ? formatDate(booking.trip.departure_date) : formatDate(booking.created_at);
                  const phone = booking.user?.phone_number || "";
                  
                  return (
                    <div key={booking.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Avatar name={customerName} size="sm" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{customerName}</p>
                            <p className="text-xs text-muted-foreground truncate">{booking.id.substring(0, 8)}</p>
                          </div>
                        </div>
                        {getStatusBadge(booking.status)}
                      </div>
                      <div>
                        <p className="font-medium text-sm truncate">{destinationName}</p>
                        <p className="text-xs text-muted-foreground mt-1">{tripDate}</p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <div>
                          <p className="text-xs text-muted-foreground">Seats</p>
                          <p className="text-sm font-medium mt-1">{booking.seats}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Amount</p>
                          <p className="font-semibold text-sm mt-1">{formatCurrency(booking.total_price)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Payment</p>
                          <div className="mt-1">{getPaymentBadge(booking.payment_status)}</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                        {phone && (
                          <a href={`tel:${phone}`} className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-muted">
                            <Phone className="h-4 w-4" />
                          </a>
                        )}
                        {booking.status === "pending" && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-emerald-500 hover:text-emerald-600"
                              onClick={() => handleStatusUpdate(booking.id, "confirmed")}
                              title="Confirm Booking"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-red-500 hover:text-red-600"
                              onClick={() => handleStatusUpdate(booking.id, "cancelled")}
                              title="Cancel Booking"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              {filteredBookings.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <p>No bookings found</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left py-4 px-4">
                        <input
                          type="checkbox"
                          checked={selectedBookings.length === filteredBookings.length && filteredBookings.length > 0}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
                        />
                      </th>
                      <th className="text-left py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Customer</th>
                      <th className="text-left py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Destination</th>
                      <th className="text-left py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trip Date</th>
                      <th className="text-left py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Seats</th>
                      <th className="text-left py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</th>
                      <th className="text-left py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="text-left py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Payment</th>
                      <th className="text-left py-4 px-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map((booking) => {
                      const customerName = booking.user?.name || "Unknown";
                      const destinationName = booking.trip?.destination?.name || booking.destination_name || "Unknown";
                      const tripDate = booking.trip?.departure_date ? formatDate(booking.trip.departure_date) : formatDate(booking.created_at);
                      const phone = booking.user?.phone_number || "";
                      
                      return (
                        <tr key={booking.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="py-4 px-4">
                            <input
                              type="checkbox"
                              checked={selectedBookings.includes(booking.id)}
                              onChange={() => toggleSelect(booking.id)}
                              className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
                            />
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <Avatar name={customerName} size="sm" />
                              <div>
                                <p className="font-medium text-sm">{customerName}</p>
                                <p className="text-xs text-muted-foreground">{booking.id.substring(0, 8)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-sm truncate max-w-[180px]">{destinationName}</p>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-sm">{tripDate}</p>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-sm font-medium">{booking.seats}</p>
                          </td>
                          <td className="py-4 px-4">
                            <p className="font-semibold text-sm">{formatCurrency(booking.total_price)}</p>
                          </td>
                          <td className="py-4 px-4">
                            {getStatusBadge(booking.status)}
                          </td>
                          <td className="py-4 px-4">
                            {getPaymentBadge(booking.payment_status)}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              {phone && (
                                <a href={`tel:${phone}`} className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-muted">
                                  <Phone className="h-4 w-4" />
                                </a>
                              )}
                              {booking.status === "pending" && (
                                <>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-emerald-500 hover:text-emerald-600"
                                    onClick={() => handleStatusUpdate(booking.id, "confirmed")}
                                    title="Confirm Booking"
                                  >
                                    <CheckCircle2 className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-red-500 hover:text-red-600"
                                    onClick={() => handleStatusUpdate(booking.id, "cancelled")}
                                    title="Cancel Booking"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

