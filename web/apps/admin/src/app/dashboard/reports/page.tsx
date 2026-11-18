"use client";

import { useEffect, useState } from "react";
import { CalendarCheck, CreditCard, Download, RefreshCw, TrendingUp, Users } from "lucide-react";
import { Header } from "@/components/header";
import { getAdminReport, type AdminReport, type BookingTrend, type ReportRanking } from "@/lib/queries";
import { Button, Card, CardContent, CardHeader, CardTitle, StatCard, formatCurrency } from "@tankua/ui";

const ranges = [
  { days: 7, label: "Last 7 days" },
  { days: 30, label: "Last 30 days" },
  { days: 183, label: "Last 6 months" },
  { days: 365, label: "Last year" },
];

type ReportState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; report: AdminReport };

function TrendChart({ trends, metric, monthly }: {
  trends: BookingTrend[];
  metric: "revenue" | "bookings";
  monthly: boolean;
}) {
  const isRevenue = metric === "revenue";
  const maximum = Math.max(...trends.map((trend) => trend[metric]), 0);
  const formatDate = new Intl.DateTimeFormat(undefined, {
    month: "short",
    ...(monthly ? { year: "2-digit" } : { day: "numeric" }),
    timeZone: "UTC",
  });

  return (
    <Card>
      <CardHeader><CardTitle>{isRevenue ? "Revenue Trend" : "Bookings Trend"}</CardTitle></CardHeader>
      <CardContent>
        {maximum === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {isRevenue ? "No paid revenue in this period." : "No bookings in this period."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <ul className="flex gap-2" style={{ minWidth: trends.length * 45 }}>
              {trends.map((trend) => {
                const date = formatDate.format(new Date(trend.date));
                const value = isRevenue ? formatCurrency(trend.revenue) : `${trend.bookings.toLocaleString()} bookings`;
                return (
                  <li key={trend.date} className="flex min-w-0 flex-1 flex-col gap-2" title={`${date} · ${value}`}>
                    <div className="flex h-52 items-end" aria-hidden="true">
                      <div
                        className={`w-full rounded-t-lg ${isRevenue ? "bg-primary/80" : "bg-emerald-500/80"}`}
                        style={{ height: `${trend[metric] / maximum * 100}%` }}
                      />
                    </div>
                    <span className="text-center text-xs text-muted-foreground">{date}</span>
                    <span className="sr-only">{value}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Ranking({ title, rows, empty }: { title: string; rows: ReportRanking[]; empty: string }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{empty}</p>
        ) : (
          <ol className="space-y-4">
            {rows.map((row, index) => (
              <li key={row.id} className="flex items-center justify-between gap-3 rounded-xl bg-muted/30 p-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">{index + 1}</span>
                  <div>
                    <p className="text-sm font-medium">{row.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.bookings.toLocaleString()} {row.bookings === 1 ? "booking" : "bookings"}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 text-sm font-semibold text-primary">{formatCurrency(row.revenue)}</span>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

function exportReport(report: AdminReport, days: number) {
  const rows = [
    ["Summary", "Value"],
    ["Paid revenue (ETB)", report.totalRevenue],
    ["Total bookings", report.totalBookings],
    ["New users", report.newUsers],
    ["Average paid booking (ETB)", report.averageBookingValue ?? ""],
    [],
    ["Period start (UTC)", "Bookings", "Paid revenue (ETB)"],
    ...report.trends.map((trend) => [trend.date.slice(0, 10), trend.bookings, trend.revenue]),
    [],
    ["Top destinations", "Bookings", "Paid revenue (ETB)"],
    ...report.topDestinations.map((row) => [row.name, row.bookings, row.revenue]),
    [],
    ["Top providers", "Bookings", "Paid revenue (ETB)"],
    ...report.topProviders.map((row) => [row.name, row.bookings, row.revenue]),
  ];
  const csv = rows.map((row) => row.map((value) => {
    const text = String(value);
    const cell = typeof value === "string" && /^\s*[=+\-@]/.test(text) ? `'${text}` : text;
    return `"${cell.replaceAll('"', '""')}"`;
  }).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `tankua-report-${days}d.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [days, setDays] = useState(183);
  const [reload, setReload] = useState(0);
  const [state, setState] = useState<ReportState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    getAdminReport(days, controller.signal).then((report) => {
      if (!controller.signal.aborted) setState({ status: "ready", report });
    }).catch((error) => {
      if (!controller.signal.aborted) {
        console.error("Error loading admin report", error);
        setState({ status: "error" });
      }
    });
    return () => controller.abort();
  }, [days, reload]);

  const report = state.status === "ready" ? state.report : null;

  return (
    <div className="min-h-screen">
      <Header
        title="Reports"
        subtitle="Analytics and insights"
        actions={
          <div className="flex items-center gap-2">
            <select
              aria-label="Report date range"
              value={days}
              onChange={(event) => {
                setState({ status: "loading" });
                setDays(Number(event.target.value));
              }}
              className="h-9 rounded-lg border border-border bg-background px-3 text-sm"
            >
              {ranges.map((range) => <option key={range.days} value={range.days}>{range.label}</option>)}
            </select>
            <Button variant="outline" size="sm" disabled={!report} onClick={() => report && exportReport(report, days)} leftIcon={<Download className="h-4 w-4" />}>
              Export Report
            </Button>
          </div>
        }
      />

      <div className="space-y-6 p-4 sm:p-6">
        {state.status === "loading" && (
          <p className="flex items-center justify-center gap-2 py-12 text-muted-foreground" role="status">
            <RefreshCw className="h-4 w-4 animate-spin" /> Loading report…
          </p>
        )}
        {state.status === "error" && (
          <Card>
            <CardContent className="space-y-4 py-8 text-center">
              <p role="alert">Unable to load the report.</p>
              <Button variant="outline" onClick={() => {
                setState({ status: "loading" });
                setReload((current) => current + 1);
              }}>Try again</Button>
            </CardContent>
          </Card>
        )}
        {report && (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard title="Paid Revenue" value={formatCurrency(report.totalRevenue)} icon={<CreditCard className="h-6 w-6" />} variant="primary" />
              <StatCard title="Total Bookings" value={report.totalBookings.toLocaleString()} icon={<CalendarCheck className="h-6 w-6" />} />
              <StatCard title="New Users" value={report.newUsers.toLocaleString()} icon={<Users className="h-6 w-6" />} />
              <StatCard title="Avg. Paid Booking" value={report.averageBookingValue === null ? "—" : formatCurrency(report.averageBookingValue)} icon={<TrendingUp className="h-6 w-6" />} />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <TrendChart trends={report.trends} metric="revenue" monthly={days > 30} />
              <TrendChart trends={report.trends} metric="bookings" monthly={days > 30} />
              <Ranking title="Top Destinations" rows={report.topDestinations} empty="No destination bookings in this period." />
              <Ranking title="Top Providers" rows={report.topProviders} empty="No provider bookings in this period." />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
