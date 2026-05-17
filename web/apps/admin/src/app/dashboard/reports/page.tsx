"use client";

import { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  CreditCard,
  CalendarCheck,
  Download,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, StatCard, formatCurrency } from "@tankua/ui";

const monthlyData = [
  { month: "Aug", revenue: 1250000, bookings: 234, users: 890 },
  { month: "Sep", revenue: 1450000, bookings: 289, users: 1023 },
  { month: "Oct", revenue: 1680000, bookings: 345, users: 1234 },
  { month: "Nov", revenue: 1890000, bookings: 412, users: 1456 },
  { month: "Dec", revenue: 2340000, bookings: 523, users: 1789 },
  { month: "Jan", revenue: 2150000, bookings: 487, users: 2034 },
];

const topDestinations = [
  { name: "Lalibela Heritage", bookings: 1234, revenue: 4560000 },
  { name: "Lake Tana Monasteries", bookings: 892, revenue: 2340000 },
  { name: "Debre Damo", bookings: 567, revenue: 1890000 },
  { name: "Abuna Yemata Guh", bookings: 445, revenue: 1670000 },
  { name: "Gondar Castles", bookings: 389, revenue: 1230000 },
];

const topProviders = [
  { name: "Abyssinia Tours", bookings: 456, revenue: 2340000, rating: 4.9 },
  { name: "Lalibela Pilgrimage", bookings: 389, revenue: 1890000, rating: 4.8 },
  { name: "Tigray Heritage", bookings: 312, revenue: 1560000, rating: 4.7 },
  { name: "Holy Land Travels", bookings: 278, revenue: 1230000, rating: 4.8 },
];

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState("6m");

  const currentMonth = monthlyData[monthlyData.length - 1];
  const previousMonth = monthlyData[monthlyData.length - 2];
  const revenueChange = ((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue * 100).toFixed(1);
  const bookingsChange = ((currentMonth.bookings - previousMonth.bookings) / previousMonth.bookings * 100).toFixed(1);

  return (
    <div className="min-h-screen">
      <Header
        title="Reports"
        subtitle="Analytics and insights"
        actions={
          <div className="flex items-center gap-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="h-9 px-3 rounded-lg border border-border bg-background text-sm"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="6m">Last 6 months</option>
              <option value="1y">Last year</option>
            </select>
            <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />}>
              Export Report
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Stats Overview */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Revenue"
            value={formatCurrency(monthlyData.reduce((sum, m) => sum + m.revenue, 0))}
            change={parseFloat(revenueChange)}
            changeLabel="vs last month"
            icon={<CreditCard className="h-6 w-6" />}
            variant="primary"
          />
          <StatCard
            title="Total Bookings"
            value={monthlyData.reduce((sum, m) => sum + m.bookings, 0).toLocaleString()}
            change={parseFloat(bookingsChange)}
            changeLabel="vs last month"
            icon={<CalendarCheck className="h-6 w-6" />}
          />
          <StatCard
            title="Total Users"
            value={currentMonth.users.toLocaleString()}
            change={12}
            changeLabel="vs last month"
            icon={<Users className="h-6 w-6" />}
          />
          <StatCard
            title="Avg. Booking Value"
            value={formatCurrency(Math.round(currentMonth.revenue / currentMonth.bookings))}
            change={5}
            changeLabel="vs last month"
            icon={<TrendingUp className="h-6 w-6" />}
          />
        </div>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Revenue Chart Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-between gap-2">
                {monthlyData.map((data, index) => (
                  <div key={data.month} className="flex-1 flex flex-col items-center gap-2">
                    <div 
                      className="w-full bg-primary/80 rounded-t-lg transition-all hover:bg-primary"
                      style={{ height: `${(data.revenue / 2500000) * 200}px` }}
                    />
                    <span className="text-xs text-muted-foreground">{data.month}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Bookings Chart Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Bookings Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-between gap-2">
                {monthlyData.map((data, index) => (
                  <div key={data.month} className="flex-1 flex flex-col items-center gap-2">
                    <div 
                      className="w-full bg-emerald-500/80 rounded-t-lg transition-all hover:bg-emerald-500"
                      style={{ height: `${(data.bookings / 600) * 200}px` }}
                    />
                    <span className="text-xs text-muted-foreground">{data.month}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tables Section */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Top Destinations */}
          <Card>
            <CardHeader>
              <CardTitle>Top Destinations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {topDestinations.map((destination, index) => (
                <div key={destination.name} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{destination.name}</p>
                      <p className="text-xs text-muted-foreground">{destination.bookings} bookings</p>
                    </div>
                  </div>
                  <p className="font-semibold text-sm text-primary">{formatCurrency(destination.revenue)}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Top Providers */}
          <Card>
            <CardHeader>
              <CardTitle>Top Providers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {topProviders.map((provider, index) => (
                <div key={provider.name} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{provider.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {provider.bookings} bookings • ★ {provider.rating}
                      </p>
                    </div>
                  </div>
                  <p className="font-semibold text-sm text-emerald-600">{formatCurrency(provider.revenue)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

