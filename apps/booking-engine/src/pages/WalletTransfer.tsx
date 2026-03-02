import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TripLogerLayout } from "../components/layout/TripLogerLayout";
import { fetchWallets, api } from "../lib/api";
import { formatCurrency } from "@tripalfa/ui-components";
import {
  ArrowLeftRight,
  Wallet,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { useTenantRuntime } from "@/components/providers/TenantRuntimeProvider";
import {
  getExchangeRate as getCurrencyExchangeRate,
  updateExchangeRates,
} from "../lib/currency";

type WalletAccount = Record<string, any>;

export default function WalletTransfer() {
  const navigate = useNavigate();
  const { config: runtimeConfig } = useTenantRuntime();
  const [accounts, setAccounts] = useState<WalletAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const [fromCurrency, setFromCurrency] = useState("");
  const [toCurrency, setToCurrency] = useState("");
  const [amount, setAmount] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetchWallets()
      .then((res) => {
        setAccounts(res || []);
        if (res && res.length >= 2) {
          setFromCurrency(res[0].currency);
          setToCurrency(res[1].currency);
        }
      })
      .finally(() => setLoading(false));

    updateExchangeRates().catch((error) => {
      console.warn(
        "Failed to refresh exchange rates for wallet transfer:",
        error,
      );
    });
  }, []);

  const getExchangeRate = () => {
    if (!fromCurrency || !toCurrency) return 0;
    return getCurrencyExchangeRate(fromCurrency, toCurrency);
  };

  const estimatedReceive = amount ? Number(amount) * getExchangeRate() : 0;
  const sourceAccount = accounts.find((a) => a.currency === fromCurrency);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!runtimeConfig.features.walletEnabled) return;
    if (!amount || Number(amount) <= 0) return;

    setSubmitting(true);
    setStatus("idle");

    try {
      await api.post("/wallet/transfer", {
        from: fromCurrency,
        to: toCurrency,
        amount: Number(amount),
      });

      setStatus("success");
      setMsg(
        `Successfully transferred ${formatCurrency(Number(amount), fromCurrency)} to ${toCurrency}`,
      );
      setTimeout(() => navigate("/wallet"), 3000);
    } catch (err: any) {
      setStatus("error");
      setMsg(err.message || "Transfer failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return null; // or spinner

  if (!runtimeConfig.features.walletEnabled) {
    return (
      <TripLogerLayout>
        <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center px-4 gap-2">
          <div className="bg-card rounded-[2rem] border border-border shadow-sm p-8 text-center w-full max-w-xl">
            <h1 className="text-2xl font-black text-foreground mb-2">
              Wallet Disabled
            </h1>
            <p className="text-sm font-bold text-muted-foreground mb-6">
              Wallet transfer is currently disabled by your admin settings.
            </p>
            <Button
              onClick={() => navigate("/")}
              className="h-11 px-6 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-xl"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </TripLogerLayout>
    );
  }

  return (
    <TripLogerLayout>
      <div className="p-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-purple-50">
              <ArrowLeftRight className="w-5 h-5 text-purple-600" />
            </div>
            <h1 className="text-xl font-semibold text-foreground">
              Internal Transfer
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Move funds between your accounts
          </p>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <form onSubmit={submit} className="space-y-5">
            {/* Account Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  From
                </label>
                <select
                  id="transfer-from-currency"
                  name="transfer-from-currency"
                  value={fromCurrency}
                  onChange={(e) => setFromCurrency(e.target.value)}
                  className="w-full h-11 px-3 border border-border rounded-lg text-sm"
                >
                  {accounts.map((a) => (
                    <option key={a.currency} value={a.currency}>
                      {a.currency} •{" "}
                      {formatCurrency(a.currentBalance, a.currency)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  To
                </label>
                <select
                  id="transfer-to-currency"
                  name="transfer-to-currency"
                  value={toCurrency}
                  onChange={(e) => setToCurrency(e.target.value)}
                  className="w-full h-11 px-3 border border-border rounded-lg text-sm"
                >
                  {accounts
                    .filter((a) => a.currency !== fromCurrency)
                    .map((a) => (
                      <option key={a.currency} value={a.currency}>
                        {a.currency} •{" "}
                        {formatCurrency(a.currentBalance, a.currency)}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Amount Input */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Amount to Transfer
              </label>
              <div className="relative">
                <input
                  id="transfer-amount"
                  name="transfer-amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  max={sourceAccount?.currentBalance}
                  className="w-full h-12 pl-4 pr-12 border border-border rounded-lg text-lg font-medium"
                  required
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                  {fromCurrency}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Max:{" "}
                {formatCurrency(
                  sourceAccount?.currentBalance || 0,
                  fromCurrency,
                )}
              </p>
            </div>

            {/* Exchange Rate Info */}
            <div className="bg-muted rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between text-sm gap-2">
                <span className="text-muted-foreground">Exchange Rate</span>
                <span className="font-medium text-foreground">
                  1 {fromCurrency} ≈ {getExchangeRate().toFixed(4)} {toCurrency}
                </span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground">
                  You will receive
                </span>
                <span className="font-semibold text-lg text-purple-600">
                  {formatCurrency(estimatedReceive, toCurrency)}
                </span>
              </div>
            </div>

            {/* Status Messages */}
            {status !== "idle" && (
              <div
                className={`p-3 rounded-lg flex items-center gap-2 text-sm ${status === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
              >
                {status === "success" ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <AlertCircle size={16} />
                )}
                {msg}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={
                submitting ||
                !amount ||
                Number(amount) > (sourceAccount?.currentBalance || 0)
              }
              className="w-full h-11 bg-foreground hover:bg-foreground/90 text-background rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
              ) : (
                "Confirm Transfer"
              )}
            </Button>
          </form>
        </div>
      </div>
    </TripLogerLayout>
  );
}
