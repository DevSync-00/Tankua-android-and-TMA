"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Wallet,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  CreditCard,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Building2,
  RefreshCw,
} from "lucide-react";
import { Header } from "@/components/header";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, StatCard, formatCurrency } from "@tankua/ui";
import { getEarningsSummary, getProviderBookings, type EarningsSummary } from "@/lib/queries";

export default function EarningsPage() {
  const router = useRouter();
  const [providerId, setProviderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [earningsData, setEarningsData] = useState<EarningsSummary | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState("30d");
  const [earningsByDestination, setEarningsByDestination] = useState<Array<{ destination: string; earnings: number; bookings: number }>>([]);
  const [earningsByTrip, setEarningsByTrip] = useState<Array<{ tripId: string; destination: string; date: string; earnings: number; bookings: number }>>([]);
  const [breakdownView, setBreakdownView] = useState<"destination" | "trip">("destination");

  useEffect(() => {
    loadProviderSession();
  }, []);

  useEffect(() => {
    if (providerId) {
      loadEarningsData();
    }
  }, [providerId, timeRange]);

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
    } catch (err) {
      console.error("Failed to load provider session", err);
      router.replace("/login");
    }
  };

  const loadEarningsData = async () => {
    if (!providerId) return;
    
    setLoading(true);
    try {
      const summary = await getEarningsSummary(providerId);
      setEarningsData(summary);

      // Load recent bookings as transactions
      const { bookings } = await getProviderBookings(providerId, {
        limit: 20,
        status: undefined,
      });

      const transactionList = bookings
        .filter(b => b.payment_status === 'paid')
        .map(b => ({
          id: b.id.substring(0, 8),
          type: "earning" as const,
          description: `Booking ${b.id.substring(0, 8)} - ${b.trip?.destination?.name || b.destination_name || 'Trip'}`,
          amount: b.total_price,
          date: new Date(b.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          status: b.status === 'completed' ? 'completed' : 'pending',
        }))
        .slice(0, 10);

      setTransactions(transactionList);

      // Calculate earnings by destination
      const destinationMap = new Map<string, { earnings: number; bookings: number }>();
      bookings
        .filter(b => b.payment_status === 'paid')
        .forEach(b => {
          const destName = b.trip?.destination?.name || b.destination_name || 'Unknown';
          const existing = destinationMap.get(destName) || { earnings: 0, bookings: 0 };
          destinationMap.set(destName, {
            earnings: existing.earnings + b.total_price,
            bookings: existing.bookings + 1,
          });
        });
      
      setEarningsByDestination(
        Array.from(destinationMap.entries())
          .map(([destination, data]) => ({ destination, ...data }))
          .sort((a, b) => b.earnings - a.earnings)
      );

      // Calculate earnings by trip
      const tripMap = new Map<string, { tripId: string; destination: string; date: string; earnings: number; bookings: number }>();
      bookings
        .filter(b => b.payment_status === 'paid' && b.trip)
        .forEach(b => {
          const tripId = b.trip!.id;
          const destName = b.trip!.destination?.name || b.destination_name || 'Unknown';
          const tripDate = b.trip!.departure_date || b.created_at;
          const existing = tripMap.get(tripId) || { tripId, destination: destName, date: tripDate, earnings: 0, bookings: 0 };
          tripMap.set(tripId, {
            ...existing,
            earnings: existing.earnings + b.total_price,
            bookings: existing.bookings + 1,
          });
        });
      
      setEarningsByTrip(
        Array.from(tripMap.values())
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 20) // Top 20 trips
      );
    } catch (error) {
      console.error("Error loading earnings data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header 
        title="Earnings" 
        subtitle={loading ? "Loading earnings..." : "Track your revenue and payouts"}
        actions={
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadEarningsData}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />}>
              Export
            </Button>
            <Button size="sm" leftIcon={<Wallet className="h-4 w-4" />}>
              Request Payout
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : earningsData ? (
          <>
            {/* Stats */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Earnings"
                value={formatCurrency(earningsData.totalEarnings)}
                changeLabel="all time"
                icon={<Wallet className="h-6 w-6" />}
                variant="primary"
              />
              <StatCard
                title="This Month"
                value={formatCurrency(earningsData.monthlyData[earningsData.monthlyData.length - 1]?.earnings || 0)}
                changeLabel="this month"
                icon={<TrendingUp className="h-6 w-6" />}
              />
              <StatCard
                title="Pending"
                value={formatCurrency(earningsData.pendingPayout)}
                changeLabel="to be paid"
                icon={<Clock className="h-6 w-6" />}
              />
              <StatCard
                title="Last Payout"
                value={formatCurrency(earningsData.lastPayout)}
                changeLabel={earningsData.lastPayoutDate 
                  ? new Date(earningsData.lastPayoutDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : 'No payouts yet'}
                icon={<CheckCircle2 className="h-6 w-6" />}
              />
            </div>
          </>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">No earnings data available</p>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        {earningsData && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Transactions */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Transactions</CardTitle>
                <div className="flex items-center gap-2">
                  <Button 
                    variant={timeRange === "7d" ? "default" : "ghost"} 
                    size="sm"
                    onClick={() => setTimeRange("7d")}
                  >
                    7D
                  </Button>
                  <Button 
                    variant={timeRange === "30d" ? "default" : "ghost"} 
                    size="sm"
                    onClick={() => setTimeRange("30d")}
                  >
                    30D
                  </Button>
                  <Button 
                    variant={timeRange === "90d" ? "default" : "ghost"} 
                    size="sm"
                    onClick={() => setTimeRange("90d")}
                  >
                    90D
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No transactions yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        transaction.type === "earning" 
                          ? "bg-emerald-500/10 text-emerald-500"
                          : transaction.type === "payout"
                          ? "bg-blue-500/10 text-blue-500"
                          : "bg-red-500/10 text-red-500"
                      }`}>
                        {transaction.type === "earning" ? (
                          <ArrowUpRight className="h-5 w-5" />
                        ) : transaction.type === "payout" ? (
                          <Wallet className="h-5 w-5" />
                        ) : (
                          <TrendingDown className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{transaction.description}</p>
                        <p className="text-xs text-muted-foreground">{transaction.id} • {transaction.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        transaction.amount > 0 ? "text-emerald-600" : "text-foreground"
                      }`}>
                        {transaction.amount > 0 ? "+" : ""}{formatCurrency(Math.abs(transaction.amount))}
                      </p>
                      <Badge 
                        variant={transaction.status === "completed" ? "success" : "warning"} 
                        className="text-xs"
                      >
                        {transaction.status}
                      </Badge>
                      </div>
                    </div>
                  ))}
                </div>
                )}
              </CardContent>
            </Card>

            {/* Payout History & Bank Info */}
            <div className="space-y-6">
              {/* Bank Account */}
              <Card>
                <CardHeader>
                  <CardTitle>Bank Account</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-stone-950">
                    <div className="flex items-center justify-between mb-6">
                      <Building2 className="h-8 w-8" />
                      <span className="text-sm opacity-70">Primary</span>
                    </div>
                    <p className="text-lg font-mono tracking-wider mb-2">•••• •••• •••• 4521</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs opacity-70">Account Holder</p>
                        <p className="font-medium">Provider Account</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs opacity-70">Bank</p>
                        <p className="font-medium">CBE</p>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full mt-4">
                    Update Bank Details
                  </Button>
                </CardContent>
              </Card>

              {/* Payout History */}
              <Card>
                <CardHeader>
                  <CardTitle>Payout History</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {earningsData.lastPayout > 0 ? (
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                      <div>
                        <p className="font-medium text-sm">{formatCurrency(earningsData.lastPayout)}</p>
                        <p className="text-xs text-muted-foreground">
                          {earningsData.lastPayoutDate 
                            ? new Date(earningsData.lastPayoutDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                            : 'N/A'}
                        </p>
                      </div>
                      <Badge variant="success">Completed</Badge>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      <p>No payout history yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Earnings Breakdown */}
        {earningsData && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Earnings Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-3 gap-6">
                  <div className="p-6 bg-muted/30 rounded-xl text-center">
                    <p className="text-sm text-muted-foreground mb-2">Gross Earnings</p>
                    <p className="text-3xl font-bold">{formatCurrency(earningsData.totalEarnings)}</p>
                    <p className="text-sm text-muted-foreground mt-1">All time</p>
                  </div>
                  <div className="p-6 bg-muted/30 rounded-xl text-center">
                    <p className="text-sm text-muted-foreground mb-2">Platform Fee (5%)</p>
                    <p className="text-3xl font-bold text-red-500">-{formatCurrency(Math.round(earningsData.totalEarnings * 0.05))}</p>
                    <p className="text-sm text-muted-foreground mt-1">Service fee</p>
                  </div>
                  <div className="p-6 bg-primary/10 rounded-xl text-center">
                    <p className="text-sm text-muted-foreground mb-2">Net Earnings</p>
                    <p className="text-3xl font-bold text-primary">{formatCurrency(Math.round(earningsData.totalEarnings * 0.95))}</p>
                    <p className="text-sm text-muted-foreground mt-1">Your earnings</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Earnings Breakdown</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant={breakdownView === "destination" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setBreakdownView("destination")}
                  >
                    By Destination
                  </Button>
                  <Button
                    variant={breakdownView === "trip" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setBreakdownView("trip")}
                  >
                    By Trip
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {breakdownView === "destination" ? (
                  earningsByDestination.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No earnings by destination yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {earningsByDestination.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{item.destination}</p>
                              <p className="text-xs text-muted-foreground">{item.bookings} booking{item.bookings !== 1 ? 's' : ''}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-emerald-600">{formatCurrency(item.earnings)}</p>
                            <p className="text-xs text-muted-foreground">
                              {((item.earnings / (earningsData?.totalEarnings || 1)) * 100).toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  earningsByTrip.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No earnings by trip yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto">
                      {earningsByTrip.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                              <Building2 className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{item.destination}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • {item.bookings} booking{item.bookings !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-emerald-600">{formatCurrency(item.earnings)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

