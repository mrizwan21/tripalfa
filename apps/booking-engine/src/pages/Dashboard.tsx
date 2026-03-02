import React, { useEffect, useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { formatCurrency } from "@tripalfa/ui-components";
import { listBookings, listDocuments, fetchWallets } from "../lib/api";
import {
  BarChart,
  Calendar,
  CreditCard,
  FileText,
  Gift,
  Bell,
} from "lucide-react";
import PageHeader from "../components/layout/PageHeader";
import { useNavigate } from "react-router-dom";
import {
  DEFAULT_CONTENT_CONFIG,
  loadTenantContentConfig,
} from "../lib/tenantContentConfig";

/**
 * Lightweight dashboard: summary cards + simple SVG charts using mock-api data.
 * This is intended as a first iteration — we can replace charts with a charting
 * library (e.g. Chart.js, Recharts) if you want richer visuals.
 */

export default function Dashboard(): React.JSX.Element {
  const navigate = useNavigate();
  const [summary, setSummary] = useState({
    total: 0,
    flights: 0,
    hotels: 0,
    cars: 0,
  });
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [dashboardContent, setDashboardContent] = useState(
    DEFAULT_CONTENT_CONFIG.dashboard,
  );

  useEffect(() => {
    (async () => {
      try {
        const bResp: any = await listBookings();
        const items: any[] = Array.isArray(bResp.items) ? bResp.items : bResp;
        const flights = items.filter((i) => i.product === "flight").length;
        const hotels = items.filter((i) => i.product === "hotel").length;
        const cars = items.filter((i) => i.product === "car").length;
        setSummary({ total: items.length, flights, hotels, cars });
        setRecentBookings(items.slice(0, 5));
      } catch {
        setSummary({ total: 0, flights: 0, hotels: 0, cars: 0 });
      }

      try {
        const w = await fetchWallets();
        // Use fetched wallets or fallback to default USD wallet for demo/testing
        if (!w || w.length === 0) {
          setWallets([
            {
              id: "default-usd-wallet",
              currency: "USD",
              currentBalance: 2500.0,
              status: "active",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ]);
        } else {
          setWallets(w);
        }
      } catch {
        // Fallback to default wallet on error
        setWallets([
          {
            id: "default-usd-wallet",
            currency: "USD",
            currentBalance: 2500.0,
            status: "active",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]);
      }

      try {
        const docs = await listDocuments();
        setDocuments(docs || []);
      } catch {
        setDocuments([]);
      }

      try {
        const contentConfig = await loadTenantContentConfig();
        setDashboardContent(contentConfig.dashboard);
      } catch {
        setDashboardContent(DEFAULT_CONTENT_CONFIG.dashboard);
      }
    })();
  }, []);

  const chartData = [
    {
      label: dashboardContent.chart.flights,
      value: summary.flights,
      color: "hsl(var(--primary))",
    },
    {
      label: dashboardContent.chart.hotels,
      value: summary.hotels,
      color: "hsl(var(--secondary))",
    },
    {
      label: dashboardContent.chart.cars,
      value: summary.cars,
      color: "hsl(var(--accent))",
    },
  ];
  const maxVal = Math.max(1, ...chartData.map((c) => c.value));

  return (
    <div className="p-6 container">
      <PageHeader
        title={dashboardContent.title}
        subtitle={dashboardContent.subtitle}
        actions={
          <>
            <Button variant="outline" onClick={() => navigate("/loyalty")}>
              <Gift className="mr-2 h-4 w-4" />
              {dashboardContent.actions.loyalty}
            </Button>
            <Button variant="outline" onClick={() => navigate("/alerts")}>
              <Bell className="mr-2 h-4 w-4" />
              {dashboardContent.actions.alerts}
            </Button>
            <Button variant="outline" onClick={() => navigate("/bookings")}>
              <Calendar className="mr-2 h-4 w-4" />
              {dashboardContent.actions.bookings}
            </Button>
            <Button onClick={() => navigate("/wallet")}>
              <CreditCard className="mr-2 h-4 w-4" />
              {dashboardContent.actions.wallet}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
        <Card className="p-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-xs text-muted-foreground">
                {dashboardContent.cards.totalBookings}
              </div>
              <div className="text-xl font-semibold mt-0.5">
                {summary.total}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {dashboardContent.cards.flights}: {summary.flights} •{" "}
                {dashboardContent.cards.hotels}: {summary.hotels} •{" "}
                {dashboardContent.cards.cars}: {summary.cars}
              </div>
            </div>
            <div className="p-2 rounded bg-blue-50">
              <BarChart className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-3">
          <div className="text-xs text-muted-foreground">
            {dashboardContent.cards.walletSnapshot}
          </div>
          <div className="mt-1.5 space-y-1.5">
            {wallets.length === 0 ? (
              <div className="text-xs text-muted-foreground">
                {dashboardContent.cards.noWallets}
              </div>
            ) : (
              wallets.map((w) => (
                <div
                  key={w.currency}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="text-xs">{w.currency}</div>
                  <div className="text-sm font-medium">
                    {formatCurrency(w.currentBalance || 0)}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="mt-2 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/wallet")}
            >
              {dashboardContent.cards.viewWallet}
            </Button>
            <Button variant="ghost" size="sm">
              {dashboardContent.cards.topUps}
            </Button>
          </div>
        </Card>

        <Card className="p-3">
          <div className="text-xs text-muted-foreground">
            {dashboardContent.cards.documents}
          </div>
          <div className="mt-1.5">
            <div className="text-xl font-semibold">{documents.length}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {dashboardContent.cards.documentsHint}
            </div>
          </div>
          <div className="mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/profile#documents")}
            >
              {dashboardContent.cards.manageDocuments}
            </Button>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card className="p-3 lg:col-span-2">
          <div className="section-header mb-2">
            <div>
              <div className="section-title text-sm">
                {dashboardContent.chart.title}
              </div>
              <div className="text-xs text-muted-foreground">
                {dashboardContent.chart.subtitle}
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              {dashboardContent.chart.snapshot}
            </div>
          </div>

          <div className="mt-2">
            <div className="w-full h-28">
              <svg viewBox="0 0 300 100" className="w-full h-full">
                {chartData.map((c, idx) => {
                  const barW = 60;
                  const gap = 20;
                  const x = idx * (barW + gap) + 20;
                  const barH = Math.round((c.value / maxVal) * 70);
                  const y = 90 - barH;
                  return (
                    <g key={c.label}>
                      <rect
                        x={x}
                        y={y}
                        width={barW}
                        height={barH}
                        rx="6"
                        fill={c.color}
                        opacity={0.95}
                      />
                      <text
                        x={x + barW / 2}
                        y={95}
                        fontSize="10"
                        fill="hsl(var(--muted-foreground))"
                        textAnchor="middle"
                      >
                        {c.label}
                      </text>
                      <text
                        x={x + barW / 2}
                        y={y - 6}
                        fontSize="11"
                        fill="hsl(var(--foreground))"
                        textAnchor="middle"
                        fontWeight={600}
                      >
                        {c.value}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="section-header">
            <div>
              <div className="section-title">
                {dashboardContent.recentBookings.title}
              </div>
              <div className="text-xs text-muted-foreground">
                {dashboardContent.recentBookings.subtitle}
              </div>
            </div>
          </div>

          <div className="mt-3 space-y-2">
            {recentBookings.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                {dashboardContent.recentBookings.empty}
              </div>
            ) : (
              recentBookings.map((b) => (
                <div
                  key={b.bookingId || b.id}
                  onClick={() =>
                    navigate(`/booking-card/${b.id || b.bookingId}`)
                  }
                  className="flex items-center justify-between p-2 rounded hover:bg-muted cursor-pointer transition-colors gap-2"
                >
                  <div>
                    <div className="font-medium">
                      {b.product?.toUpperCase() ||
                        dashboardContent.recentBookings.bookingFallback}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {dashboardContent.recentBookings.idPrefix}{" "}
                      {b.bookingId || b.id}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {formatCurrency(b.total?.amount || b.total || 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {b.status || b.paymentStatus || ""}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
