"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, CreditCard, Download, RefreshCw, RotateCcw } from "lucide-react";
import { Header } from "@/components/header";
import { getPayments, updatePaymentStatus, type AdminPayment } from "@/lib/queries";
import { Card, CardContent, Button, Badge, Avatar, formatCurrency } from "@tankua/ui";

type PaymentStatus = "pending" | "paid" | "refunded";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [error, setError] = useState("");

  const loadPayments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setPayments(await getPayments());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load payments.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const filteredPayments = useMemo(
    () => payments.filter((payment) => !statusFilter || payment.status === statusFilter),
    [payments, statusFilter]
  );

  const changeStatus = async (payment: AdminPayment, status: PaymentStatus) => {
    setUpdating(payment.booking_id);
    setError("");
    try {
      await updatePaymentStatus(payment.booking_id, status);
      setPayments((current) =>
        current.map((item) => item.booking_id === payment.booking_id ? { ...item, status } : item)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment update failed.");
    } finally {
      setUpdating(null);
    }
  };

  const exportPayments = () => {
    const rows = [
      ["Payment ID", "Booking ID", "Customer", "Provider", "Method", "Amount", "Status", "Date"],
      ...filteredPayments.map((payment) => [
        payment.id,
        payment.booking_id,
        payment.user_name,
        payment.provider_name,
        payment.method,
        payment.amount,
        payment.status,
        payment.created_at,
      ]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `tankua-payments-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const paidRevenue = payments
    .filter((payment) => payment.status === "paid")
    .reduce((sum, payment) => sum + payment.amount, 0);

  const badgeFor = (status: string) => {
    if (status === "paid") return <Badge variant="success" dot>Paid</Badge>;
    if (status === "pending") return <Badge variant="warning" dot>Pending</Badge>;
    if (status === "refunded") return <Badge variant="destructive" dot>Refunded</Badge>;
    return <Badge variant="secondary">{status}</Badge>;
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Payments"
        subtitle="Live booking payment records"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadPayments} leftIcon={<RefreshCw className="h-4 w-4" />}>
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportPayments} leftIcon={<Download className="h-4 w-4" />}>
              Export
            </Button>
          </div>
        }
      />

      <div className="space-y-6 p-4 sm:p-6">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            ["Paid revenue", formatCurrency(paidRevenue)],
            ["Paid", payments.filter((p) => p.status === "paid").length],
            ["Pending", payments.filter((p) => p.status === "pending").length],
            ["Refunded", payments.filter((p) => p.status === "refunded").length],
          ].map(([label, value]) => (
            <Card key={label} className="p-5">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
            </Card>
          ))}
        </div>

        <Card>
          <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold">Transactions</h2>
              <p className="text-sm text-muted-foreground">{filteredPayments.length} records</p>
            </div>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-10 rounded-xl border border-input bg-white px-3 text-sm"
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin" /> Loading payments
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="py-20 text-center">
                <CreditCard className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                <p className="font-medium">No payments found</p>
                <p className="text-sm text-muted-foreground">New booking payments will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      {["Payment", "Customer", "Provider", "Method", "Amount", "Status", "Created", "Actions"].map((heading) => (
                        <th key={heading} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map((payment) => (
                      <tr key={payment.booking_id} className="border-b border-border last:border-0 hover:bg-muted/30">
                        <td className="px-5 py-4">
                          <p className="font-mono text-sm">{payment.id}</p>
                          <p className="max-w-32 truncate text-xs text-muted-foreground">{payment.booking_id}</p>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar name={payment.user_name} size="sm" />
                            <span className="text-sm font-medium">{payment.user_name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm">{payment.provider_name}</td>
                        <td className="px-5 py-4"><Badge variant="secondary">{payment.method}</Badge></td>
                        <td className="px-5 py-4 text-sm font-semibold">{formatCurrency(payment.amount)}</td>
                        <td className="px-5 py-4">{badgeFor(payment.status)}</td>
                        <td className="px-5 py-4 text-sm text-muted-foreground">
                          {new Date(payment.created_at).toLocaleString()}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex gap-2">
                            {payment.status === "pending" && (
                              <Button size="sm" onClick={() => changeStatus(payment, "paid")} isLoading={updating === payment.booking_id}>
                                <CheckCircle2 className="mr-1 h-4 w-4" /> Mark paid
                              </Button>
                            )}
                            {payment.status === "paid" && (
                              <Button variant="outline" size="sm" onClick={() => changeStatus(payment, "refunded")} isLoading={updating === payment.booking_id}>
                                <RotateCcw className="mr-1 h-4 w-4" /> Refund
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
