"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Building2, Download, RefreshCw, Wallet } from "lucide-react";
import { Header } from "@/components/header";
import { getProviderPayoutBalances, type ProviderPayoutBalance } from "@/lib/queries";
import { Card, CardContent, Button, Avatar, formatCurrency } from "@tankua/ui";

export default function PayoutsPage() {
  const [balances, setBalances] = useState<ProviderPayoutBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadBalances = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setBalances(await getProviderPayoutBalances());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load payout balances.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBalances();
  }, [loadBalances]);

  const totals = useMemo(
    () => balances.reduce(
      (sum, item) => ({
        gross: sum.gross + item.gross_amount,
        fees: sum.fees + item.platform_fee,
        payable: sum.payable + item.payable_amount,
      }),
      { gross: 0, fees: 0, payable: 0 }
    ),
    [balances]
  );

  const exportBalances = () => {
    const rows = [
      ["Provider", "Paid bookings", "Gross", "Platform fee", "Payable"],
      ...balances.map((balance) => [
        balance.provider_name,
        balance.booking_count,
        balance.gross_amount,
        balance.platform_fee,
        balance.payable_amount,
      ]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${value}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `tankua-payout-balances-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Payouts"
        subtitle="Provider balances calculated from paid bookings"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadBalances} leftIcon={<RefreshCw className="h-4 w-4" />}>
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportBalances} leftIcon={<Download className="h-4 w-4" />}>
              Export
            </Button>
          </div>
        }
      />

      <div className="space-y-6 p-4 sm:p-6">
        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          These are live payable balances. A payout is not marked as sent until a dedicated payout ledger and bank-transfer confirmation are connected.
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ["Gross paid bookings", totals.gross],
            ["Tankua fee (5%)", totals.fees],
            ["Provider payable", totals.payable],
          ].map(([label, amount]) => (
            <Card key={label} className="p-5">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight">{formatCurrency(Number(amount))}</p>
            </Card>
          ))}
        </div>

        <Card>
          <div className="border-b border-border p-5">
            <h2 className="font-semibold">Provider balances</h2>
            <p className="text-sm text-muted-foreground">{balances.length} providers with paid bookings</p>
          </div>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin" /> Calculating balances
              </div>
            ) : balances.length === 0 ? (
              <div className="py-20 text-center">
                <Wallet className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                <p className="font-medium">No payable balances</p>
                <p className="text-sm text-muted-foreground">Paid, confirmed bookings will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      {["Provider", "Paid bookings", "Gross", "Tankua fee", "Payable"].map((heading) => (
                        <th key={heading} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {balances.map((balance) => (
                      <tr key={balance.provider_id} className="border-b border-border last:border-0 hover:bg-muted/30">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar name={balance.provider_name} size="sm" />
                            <div>
                              <p className="text-sm font-medium">{balance.provider_name}</p>
                              <p className="max-w-40 truncate text-xs text-muted-foreground">{balance.provider_id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm">{balance.booking_count}</td>
                        <td className="px-5 py-4 text-sm">{formatCurrency(balance.gross_amount)}</td>
                        <td className="px-5 py-4 text-sm text-muted-foreground">{formatCurrency(balance.platform_fee)}</td>
                        <td className="px-5 py-4 text-sm font-semibold">{formatCurrency(balance.payable_amount)}</td>
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
