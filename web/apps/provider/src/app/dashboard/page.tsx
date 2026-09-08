"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  CalendarCheck, 
  Wallet, 
  Users,
  TrendingUp,
  Star,
  Clock,
  MapPin,
  ArrowRight,
  MoreHorizontal,
  Plus,
  ChevronRight,
  Bus,
  RefreshCw,
} from "lucide-react";
import { Header } from "@/components/header";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Avatar, StatCard, formatCurrency } from "@tankua/ui";
import {
  getProviderStats,
  getUpcomingTrips,
  getRecentBookings,
  getRecentReviews,
  type ProviderStats,
  type UpcomingTrip,
  type RecentBooking,
  type RecentReview,
} from "@/lib/queries";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [stats, setStats] = useState<ProviderStats | null>(null);
  const [upcomingTrips, setUpcomingTrips] = useState<UpcomingTrip[]>([]);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [recentReviews, setRecentReviews] = useState<RecentReview[]>([]);

  useEffect(() => {
    loadProviderSession();
  }, [router]);

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
      loadDashboardData(id);
    } catch (err) {
      console.error("Failed to load provider session", err);
      router.replace("/login");
    }
  };

  const loadDashboardData = async (id: string) => {
    setLoading(true);
    try {
      const [statsData, tripsData, bookingsData, reviewsData] = await Promise.all([
        getProviderStats(id),
        getUpcomingTrips(id, 3),
        getRecentBookings(id, 4),
        getRecentReviews(id, 3),
      ]);

      setStats(statsData);
      setUpcomingTrips(tripsData);
      setRecentBookings(bookingsData);
      setRecentReviews(reviewsData);
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      title: "Today's Bookings",
      value: stats?.todayBookings?.toString() || "0",
      change: stats?.bookingsChange || 0,
      changeLabel: "vs yesterday",
      icon: <CalendarCheck className="h-6 w-6" />,
      variant: "primary" as const,
    },
    {
      title: "This Month's Earnings",
      value: formatCurrency(stats?.monthlyEarnings || 0),
      change: stats?.earningsChange || 0,
      changeLabel: "vs last month",
      icon: <Wallet className="h-6 w-6" />,
    },
    {
      title: "Active Trips",
      value: stats?.activeTrips?.toString() || "0",
      change: 0,
      changeLabel: "ongoing",
      icon: <Bus className="h-6 w-6" />,
    },
    {
      title: "Average Rating",
      value: stats?.averageRating?.toFixed(1) || "0.0",
      change: 0, // Rating change not calculated for now
      changeLabel: "this month",
      icon: <Star className="h-6 w-6" />,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header 
          title="Dashboard" 
          subtitle="Loading your dashboard..."
        />
        <div className="p-6 flex items-center justify-center">
          <div className="flex items-center gap-3 text-muted-foreground">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Loading dashboard data...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header 
        title="Dashboard" 
        subtitle="Welcome back! Here's your business overview."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => providerId && loadDashboardData(providerId)}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Trip
            </Button>
          </div>
        }
      />

      <div className="portal-content">
        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsCards.map((stat, index) => (
            <StatCard
              key={index}
              title={stat.title}
              value={stat.value}
              change={stat.change}
              changeLabel={stat.changeLabel}
              icon={stat.icon}
              variant={stat.variant || "default"}
            />
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Upcoming Trips */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Upcoming Trips</CardTitle>
              <Link href="/dashboard/trips">
                <Button variant="ghost" size="sm">
                  View All
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingTrips.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No upcoming trips</p>
                  <Link href="/dashboard/trips/new">
                    <Button className="mt-4" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Trip
                    </Button>
                  </Link>
                </div>
              ) : (
                upcomingTrips.map((trip) => (
                  <div key={trip.id} className="p-4 bg-muted/50 rounded-xl border border-border hover:border-primary/50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-foreground">{trip.destination}</h4>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CalendarCheck className="h-4 w-4" />
                            {trip.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {trip.time}
                          </span>
                        </div>
                      </div>
                      <Badge variant={trip.status === "confirmed" || trip.status === "upcoming" ? "success" : "warning"}>
                        {trip.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Avatar name={trip.driver} size="sm" />
                          <span className="text-sm">{trip.driver}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{trip.vehicle}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {trip.passengers}/{trip.capacity}
                        </span>
                        <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${(trip.passengers / trip.capacity) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Recent Bookings */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Bookings</CardTitle>
              <Link href="/dashboard/bookings">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentBookings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No bookings yet</p>
                </div>
              ) : (
                recentBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                    <Avatar name={booking.customer} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm truncate">{booking.customer}</p>
                        <Badge 
                          variant={booking.status === "confirmed" ? "success" : "warning"} 
                          className="text-xs"
                        >
                          {booking.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-muted-foreground">
                          {booking.destination} • {booking.seats} seats
                        </p>
                        <p className="text-xs font-semibold text-primary">
                          {formatCurrency(booking.amount)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Reviews */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Reviews</CardTitle>
              <Link href="/dashboard/reviews">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentReviews.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Star className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No reviews yet</p>
                </div>
              ) : (
                recentReviews.map((review, index) => (
                <div key={index} className="p-4 bg-muted/30 rounded-xl">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Avatar name={review.customer} size="sm" />
                      <div>
                        <p className="font-medium text-sm">{review.customer}</p>
                        <p className="text-xs text-muted-foreground">{review.trip} • {review.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-[#D4A017] text-[#D4A017]" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground italic">"{review.comment}"</p>
                </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <Link href="/dashboard/trips/new">
                <button className="w-full p-6 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all text-left group">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Plus className="h-6 w-6 text-primary" />
                  </div>
                  <p className="font-semibold">Create Trip</p>
                  <p className="text-sm text-muted-foreground mt-1">Schedule new trip</p>
                </button>
              </Link>
              
              <Link href="/dashboard/drivers/new">
                <button className="w-full p-6 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all text-left group">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition-colors">
                    <Users className="h-6 w-6 text-emerald-500" />
                  </div>
                  <p className="font-semibold">Add Driver</p>
                  <p className="text-sm text-muted-foreground mt-1">Expand your team</p>
                </button>
              </Link>
              
              <Link href="/dashboard/vehicles/new">
                <button className="w-full p-6 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all text-left group">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
                    <Bus className="h-6 w-6 text-blue-500" />
                  </div>
                  <p className="font-semibold">Add Vehicle</p>
                  <p className="text-sm text-muted-foreground mt-1">Register vehicle</p>
                </button>
              </Link>
              
              <Link href="/dashboard/earnings">
                <button className="w-full p-6 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all text-left group">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4 group-hover:bg-amber-500/20 transition-colors">
                    <Wallet className="h-6 w-6 text-amber-500" />
                  </div>
                  <p className="font-semibold">View Earnings</p>
                  <p className="text-sm text-muted-foreground mt-1">Track revenue</p>
                </button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

