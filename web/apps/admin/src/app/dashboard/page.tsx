"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  CalendarCheck, 
  CreditCard, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  MoreHorizontal,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  Filter,
  RefreshCw,
} from "lucide-react";
import { Header } from "@/components/header";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Avatar, StatCard, formatCurrency } from "@tankua/ui";
import {
  getDashboardStats,
  getRecentBookings,
  getTopProviders,
  getTopDestinations,
  getBookingTrends,
  getRevenueAnalytics,
  type DashboardStats,
  type RecentBooking,
  type TopProvider,
  type TopDestination,
} from "@/lib/queries";

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState("30d");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [topProviders, setTopProviders] = useState<TopProvider[]>([]);
  const [topDestinations, setTopDestinations] = useState<TopDestination[]>([]);
  const [bookingTrends, setBookingTrends] = useState<Array<{ date: string; bookings: number; revenue: number }>>([]);
  const [revenueAnalytics, setRevenueAnalytics] = useState<{
    totalRevenue: number;
    monthlyRevenue: number;
    averageBookingValue: number;
    revenueByStatus: Array<{ status: string; revenue: number }>;
  } | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsData, bookingsData, providersData, destinationsData, trendsData, revenueData] = await Promise.all([
        getDashboardStats(),
        getRecentBookings(5),
        getTopProviders(4),
        getTopDestinations(4),
        getBookingTrends(30),
        getRevenueAnalytics(),
      ]);

      setStats(statsData);
      setRecentBookings(bookingsData);
      setTopProviders(providersData);
      setTopDestinations(destinationsData);
      setBookingTrends(trendsData);
      setRevenueAnalytics(revenueData);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge variant="success" dot>Confirmed</Badge>;
      case "pending":
        return <Badge variant="warning" dot>Pending</Badge>;
      case "cancelled":
        return <Badge variant="destructive" dot>Cancelled</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const statsCards = [
    {
      title: "Total Users",
      value: stats?.totalUsers?.toLocaleString() || "0",
      change: stats?.usersChange || 0,
      changeLabel: "vs last month",
      icon: <Users className="h-6 w-6" />,
    },
    {
      title: "Active Bookings",
      value: stats?.totalBookings?.toLocaleString() || "0",
      change: stats?.bookingsChange || 0,
      changeLabel: "vs last month",
      icon: <CalendarCheck className="h-6 w-6" />,
    },
    {
      title: "Revenue (Total)",
      value: formatCurrency(stats?.totalRevenue || 0),
      change: 0, // Revenue change not calculated for total (all time)
      changeLabel: "all time",
      icon: <CreditCard className="h-6 w-6" />,
    },
    {
      title: "Active Providers",
      value: stats?.totalProviders?.toString() || "0",
      change: stats?.providersChange || 0,
      changeLabel: "vs last month",
      icon: <Building2 className="h-6 w-6" />,
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
        subtitle={`Welcome back! Here's what's happening with Tankua.`}
        actions={
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadDashboardData}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Time range filter */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant={timeRange === "7d" ? "default" : "ghost"} 
              size="sm"
              onClick={() => setTimeRange("7d")}
            >
              7 Days
            </Button>
            <Button 
              variant={timeRange === "30d" ? "default" : "ghost"} 
              size="sm"
              onClick={() => setTimeRange("30d")}
            >
              30 Days
            </Button>
            <Button 
              variant={timeRange === "90d" ? "default" : "ghost"} 
              size="sm"
              onClick={() => setTimeRange("90d")}
            >
              90 Days
            </Button>
          </div>
          <Button variant="outline" size="sm" leftIcon={<Filter className="h-4 w-4" />}>
            Filter
          </Button>
        </div>

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
              variant={index === 2 ? "primary" : "default"}
            />
          ))}
        </div>

        {/* Charts and Tables */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Bookings */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Bookings</CardTitle>
              <Button variant="ghost" size="sm">View All</Button>
            </CardHeader>
            <CardContent>
              {recentBookings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No bookings yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Booking</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Destination</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Provider</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentBookings.map((booking) => (
                        <tr key={booking.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <Avatar name={booking.user?.name || "User"} size="sm" />
                              <div>
                                <p className="font-medium text-sm">{booking.user?.name || "Unknown"}</p>
                                <p className="text-xs text-muted-foreground">{booking.id.substring(0, 8)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-sm truncate max-w-[150px]">{booking.destination}</p>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-sm text-muted-foreground">{booking.provider}</p>
                          </td>
                          <td className="py-4 px-4">
                            <p className="font-medium text-sm">{formatCurrency(booking.amount)}</p>
                          </td>
                          <td className="py-4 px-4">
                            {getStatusBadge(booking.status)}
                          </td>
                          <td className="py-4 px-4">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Providers */}
          <Card>
            <CardHeader>
              <CardTitle>Top Providers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {topProviders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No providers yet</p>
                </div>
              ) : (
                topProviders.map((provider, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 rounded-xl bg-muted/50">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{provider.name}</p>
                      <p className="text-xs text-muted-foreground">{provider.bookings} trips</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm text-primary">{formatCurrency(provider.revenue)}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span>★</span>
                        <span>{provider.rating.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Analytics Section */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Booking Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Booking Trends (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              {bookingTrends.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No booking data available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total Bookings</span>
                    <span className="font-semibold">{bookingTrends.reduce((sum, t) => sum + t.bookings, 0)}</span>
                  </div>
                  <div className="space-y-2">
                    {bookingTrends.slice(-7).map((trend, index) => {
                      const maxBookings = Math.max(...bookingTrends.map(t => t.bookings), 1);
                      const percentage = (trend.bookings / maxBookings) * 100;
                      return (
                        <div key={index} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                              {new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                            <span className="font-medium">{trend.bookings} bookings</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Revenue Analytics */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              {revenueAnalytics ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/30 rounded-xl">
                      <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                      <p className="text-2xl font-bold">{formatCurrency(revenueAnalytics.totalRevenue)}</p>
                    </div>
                    <div className="p-4 bg-primary/10 rounded-xl">
                      <p className="text-sm text-muted-foreground mb-1">This Month</p>
                      <p className="text-2xl font-bold text-primary">{formatCurrency(revenueAnalytics.monthlyRevenue)}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-xl">
                    <p className="text-sm text-muted-foreground mb-1">Average Booking Value</p>
                    <p className="text-2xl font-bold">{formatCurrency(revenueAnalytics.averageBookingValue)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-3">Revenue by Status</p>
                    <div className="space-y-2">
                      {revenueAnalytics.revenueByStatus.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                          <span className="text-sm capitalize">{item.status}</span>
                          <span className="font-semibold text-sm">{formatCurrency(item.revenue)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No revenue data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Popular Destinations */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Popular Destinations</CardTitle>
              <Button variant="ghost" size="sm">View All</Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {topDestinations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No destinations yet</p>
                </div>
              ) : (
                topDestinations.map((destination, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/50 transition-colors">
                    <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                      <MapPin className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{destination.name}</p>
                      <p className="text-xs text-muted-foreground">{destination.region} Region</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">{destination.bookings.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">trips</p>
                    </div>
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
              <button className="p-6 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all text-left group">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition-colors">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                </div>
                <p className="font-semibold">Approve Providers</p>
                <p className="text-sm text-muted-foreground mt-1">Review pending</p>
              </button>
              
              <button className="p-6 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all text-left group">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4 group-hover:bg-amber-500/20 transition-colors">
                  <Clock className="h-6 w-6 text-amber-500" />
                </div>
                <p className="font-semibold">Process Payouts</p>
                <p className="text-sm text-muted-foreground mt-1">View pending</p>
              </button>
              
              <button className="p-6 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all text-left group">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
                  <MapPin className="h-6 w-6 text-blue-500" />
                </div>
                <p className="font-semibold">Add Destination</p>
                <p className="text-sm text-muted-foreground mt-1">Expand catalog</p>
              </button>
              
              <button className="p-6 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all text-left group">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-4 group-hover:bg-red-500/20 transition-colors">
                  <XCircle className="h-6 w-6 text-red-500" />
                </div>
                <p className="font-semibold">Support Tickets</p>
                <p className="text-sm text-muted-foreground mt-1">View open</p>
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

