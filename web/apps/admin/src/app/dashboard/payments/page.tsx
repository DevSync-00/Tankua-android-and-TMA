"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, CreditCard, Download, RefreshCw, RotateCcw } from "lucide-react";
import { Header } from "@/components/header";
import { getPayments, updatePaymentStatus, type AdminPayment } from "@/lib/queries";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, Button, Badge, Avatar, formatCurrency, formatCurrencyTotals, sumByCurrency } from "@tankua/ui";

type PaymentStatus = "pending" | "paid" | "refunded";
type CloseoutRefund = { id: string; booking_id: string; amount: number; currency: string; reason: string };

export default function PaymentsPage() {
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [error, setError] = useState("");
  const [refunds, setRefunds] = useState<CloseoutRefund[]>([]);
  const [selectedRefund, setSelectedRefund] = useState<CloseoutRefund | null>(null);
  const [refundReference, setRefundReference] = useState("");

  const loadPayments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [paymentRows, refundRows] = await Promise.all([
        getPayments(),
        supabase.from("refunds").select("id,booking_id,amount,currency,reason")
          .or('reason.like."Trip closeout:*",reason.like."Traveler cancellation:*"').in("status", ["pending", "approved", "processing"])
          .order("created_at", { ascending: true }),
      ]);
      setPayments(paymentRows);
      if (refundRows.error) throw new Error(refundRows.error.message);
      setRefunds(refundRows.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load payments.");
    } finally {
      setLoading(false);
    }
  }, []);

  async function recordRefund(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedRefund || !refundReference.trim() || updating) return;
    setUpdating(selectedRefund.booking_id);
    setError("");
    try {
      const result = await supabase.rpc("record_closeout_refund", {
        p_refund_id: selectedRefund.id, p_reference: refundReference.trim(),
      });
      if (result.error) throw new Error(result.error.message);
      setSelectedRefund(null);
      setRefundReference("");
      await loadPayments();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not record the refund.");
    } finally {
      setUpdating(null);
    }
  }

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
      ["Payment ID", "Booking ID", "Customer", "Provider", "Method", "Amount", "Currency", "Status", "Date"],
      ...filteredPayments.map((payment) => [
        payment.id,
        payment.booking_id,
        payment.user_name,
        payment.provider_name,
        payment.method,
        payment.amount,
        payment.currency,
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

  const paidRevenue = sumByCurrency(payments.filter((payment) => payment.status === "paid"), (payment) => payment.amount);

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
        {refunds.length > 0 && <Card>
          <h2 className="text-lg font-semibold">Refunds to send</h2>
          <ul className="mt-3 divide-y">
            {refunds.map(refund => <li key={refund.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
              <span>Booking {refund.booking_id.slice(0, 8)} · {formatCurrency(refund.amount, refund.currency)} · <span className="text-muted-foreground">{refund.reason.startsWith("Traveler cancellation") ? "Traveler cancelled" : "Trip closeout"}</span></span>
              <Button size="sm" variant="outline" onClick={() => { setSelectedRefund(refund); setRefundReference(""); }}>Record refund sent</Button>
            </li>)}
          </ul>
          {selectedRefund && <form className="mt-4 space-y-3" onSubmit={recordRefund}>
            <label className="block text-sm">Refund reference for booking {selectedRefund.booking_id.slice(0, 8)}
              <input required maxLength={200} value={refundReference} onChange={event => setRefundReference(event.target.value)} className="mt-1 block rounded-lg border p-2" />
            </label>
            <p className="text-sm text-muted-foreground">Enter the reference after sending the refund in the original currency.</p>
            <Button type="submit" isLoading={updating === selectedRefund.booking_id}>Save refund record</Button>
          </form>}
        </Card>}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            ["Paid revenue", formatCurrencyTotals(paidRevenue)],
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
                        <td className="px-5 py-4 text-sm font-semibold">{formatCurrency(payment.amount, payment.currency)}</td>
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
                            {payment.status === "paid" && !refunds.some(refund => refund.booking_id === payment.booking_id) && (
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
