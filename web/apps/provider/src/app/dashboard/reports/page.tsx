"use client";

import { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  CreditCard,
  CalendarCheck,
  Download,
} from "lucide-react";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, StatCard, formatCurrency } from "@tankua/ui";

const monthlyData = [
  { month: "Aug", revenue: 125000, bookings: 34, trips: 8 },
  { month: "Sep", revenue: 145000, bookings: 42, trips: 10 },
  { month: "Oct", revenue: 168000, bookings: 48, trips: 12 },
  { month: "Nov", revenue: 189000, bookings: 56, trips: 14 },
  { month: "Dec", revenue: 234000, bookings: 72, trips: 18 },
  { month: "Jan", revenue: 215000, bookings: 65, trips: 16 },
];

const tripPerformance = [
  { destination: "Lalibela Heritage", trips: 45, revenue: 560000, avgOccupancy: 94 },
  { destination: "Lake Tana Monasteries", trips: 32, revenue: 234000, avgOccupancy: 87 },
  { destination: "Debre Damo", trips: 18, revenue: 189000, avgOccupancy: 78 },
  { destination: "Abuna Yemata Guh", trips: 12, revenue: 167000, avgOccupancy: 92 },
];

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState("6m");

  const totalRevenue = monthlyData.reduce((sum, m) => sum + m.revenue, 0);
  const totalBookings = monthlyData.reduce((sum, m) => sum + m.bookings, 0);
  const totalTrips = monthlyData.reduce((sum, m) => sum + m.trips, 0);

  return (
    <div className="min-h-screen">
      <Header
        title="Reports"
        subtitle="Analyze your business performance"
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
              Export
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Revenue"
            value={formatCurrency(totalRevenue)}
            change={15}
            changeLabel="vs last period"
            icon={<CreditCard className="h-6 w-6" />}
            variant="primary"
          />
          <StatCard
            title="Total Bookings"
            value={totalBookings.toString()}
            change={12}
            changeLabel="vs last period"
            icon={<CalendarCheck className="h-6 w-6" />}
          />
          <StatCard
            title="Trips Completed"
            value={totalTrips.toString()}
            change={8}
            changeLabel="vs last period"
            icon={<TrendingUp className="h-6 w-6" />}
          />
          <StatCard
            title="Avg. Occupancy"
            value="88%"
            change={5}
            changeLabel="vs last period"
            icon={<Users className="h-6 w-6" />}
          />
        </div>

        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between gap-2">
              {monthlyData.map((data) => (
                <div key={data.month} className="flex-1 flex flex-col items-center gap-2">
                  <div 
                    className="w-full bg-primary/80 rounded-t-lg transition-all hover:bg-primary"
                    style={{ height: `${(data.revenue / 250000) * 200}px` }}
                  />
                  <span className="text-xs text-muted-foreground">{data.month}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Trip Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Trip Performance by Destination</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Destination</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trips</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Revenue</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Avg Occupancy</th>
                  </tr>
                </thead>
                <tbody>
                  {tripPerformance.map((trip, index) => (
                    <tr key={index} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-4 px-6">
                        <p className="font-medium text-sm">{trip.destination}</p>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm">{trip.trips} trips</p>
                      </td>
                      <td className="py-4 px-6">
                        <p className="font-semibold text-sm text-primary">{formatCurrency(trip.revenue)}</p>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${trip.avgOccupancy}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{trip.avgOccupancy}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

