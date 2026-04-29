import React, { useState, useEffect } from "react";
import { Button, Card, Badge } from "@tripalfa/ui-components";
import {
  Building2,
  Users,
  Plane,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
} from "lucide-react";
import {
  statsApi,
  type PlatformStats,
  type Tenant,
  type User,
} from "../lib/api";
interface DashboardStats {
  tenants: {
    total: number;
    active: number;
    suspended: number;
    inactive: number;
  };
  themes: { total: number };
  users: { total: number };
  suppliers: { total: number };
}
const DashboardPage = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTenants, setRecentTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    loadDashboardData();
  }, []);
  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, tenantsData] = await Promise.all([
        statsApi.get(),
        tenantApi.list({ limit: 5, status: "ACTIVE" }),
      ]);
      setStats(statsData);
      setRecentTenants(tenantsData.data);
    } catch (err) {
      console.error("Failed to load dashboard:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };
  const statCards = [
    {
      title: "Total Tenants",
      value: stats?.tenants.total || 0,
      change: stats?.tenants.active || 0,
      icon: <Building2 className="h-6 w-6" />,
      color: "text-apple-blue",
      bgColor: "bg-light-gray",
      trend: "up",
    },
    {
      title: "Active Users",
      value: stats?.users.total || 0,
      change: "+12%",
      icon: <Users className="h-6 w-6" />,
      color: "text-apple-blue",
      bgColor: "bg-apple-blue",
      trend: "up",
    },
    {
      title: "Suppliers",
      value: stats?.suppliers.total || 0,
      change: "+5%",
      icon: <Plane className="h-6 w-6" />,
      color: "text-apple-blue",
      bgColor: "bg-light-gray",
      trend: "up",
    },
    {
      title: "Themes",
      value: stats?.themes.total || 0,
      change: stats?.tenants.total
        ? `${Math.round((stats.themes.total / stats.tenants.total) * 100)}%`
        : "0%",
      icon: <CreditCard className="h-6 w-6" />,
      color: "text-near-black",
      bgColor: "bg-near-black/5",
      trend: "neutral",
    },
  ];
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        {" "}
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-apple-blue" />{" "}
      </div>
    );
  }
  if (error) {
    return (
      <Card className="p-8 text-center">
        {" "}
        <AlertTriangle className="h-12 w-12 mx-auto text-near-black/60 mb-4" />{" "}
        <p className="text-near-black">{error}</p>{" "}
        <Button onClick={loadDashboardData} className="mt-4">
          {" "}
          Retry{" "}
        </Button>{" "}
      </Card>
    );
  }
  return (
    <div className="space-y-6">
      {" "}
      <div>
        {" "}
        <h2 className="text-2xl font-bold text-near-black">
          Super Admin Dashboard
        </h2>{" "}
        <p className="text-near-black mt-0.5">
          Platform overview and key metrics
        </p>{" "}
      </div>{" "}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {" "}
        {statCards.map((card) => (
          <Card key={card.title} className="p-6">
            {" "}
            <div className="flex items-center justify-between">
              {" "}
              <div className={`p-3 rounded-lg ${card.bgColor}`}>
                {" "}
                <div className={card.color}>{card.icon}</div>{" "}
              </div>{" "}
              <div className="flex items-center gap-1 text-sm">
                {" "}
                {card.trend === "up" ? (
                  <TrendingUp className="h-4 w-4 text-apple-blue" />
                ) : card.trend === "down" ? (
                  <TrendingDown className="h-4 w-4 text-near-black" />
                ) : null}{" "}
                <span
                  className={
                    card.trend === "up"
                      ? "text-apple-blue"
                      : card.trend === "down"
                        ? "text-near-black"
                        : "text-near-black"
                  }
                >
                  {" "}
                  {card.change}{" "}
                </span>{" "}
              </div>{" "}
            </div>{" "}
            <div className="mt-4">
              {" "}
              <p className="text-2xl font-bold text-near-black">
                {card.value}
              </p>{" "}
              <p className="text-sm text-near-black">{card.title}</p>{" "}
            </div>{" "}
          </Card>
        ))}{" "}
      </div>{" "}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {" "}
        <Card className="p-6">
          {" "}
          <div className="flex items-center justify-between mb-4">
            {" "}
            <h3 className="font-bold text-lg">Recent Tenants</h3>{" "}
            <Button variant="outline" size="sm">
              {" "}
              View All{" "}
            </Button>{" "}
          </div>{" "}
          <div className="space-y-3">
            {" "}
            {recentTenants.length === 0 ? (
              <p className="text-near-black text-center py-4">
                No tenants found
              </p>
            ) : (
              recentTenants.map((tenant) => (
                <div
                  key={tenant.id}
                  className="flex items-center justify-between p-3 bg-near-black rounded-lg"
                >
                  {" "}
                  <div className="flex items-center gap-3">
                    {" "}
                    <div className="w-10 h-10 rounded-lg bg-apple-blue/10 flex items-center justify-center">
                      {" "}
                      <Building2 className="h-5 w-5 text-apple-blue" />{" "}
                    </div>{" "}
                    <div>
                      {" "}
                      <p className="font-medium">{tenant.name}</p>{" "}
                      <p className="text-sm text-near-black">
                        {tenant.agentCode}
                      </p>{" "}
                    </div>{" "}
                  </div>{" "}
                  <Badge
                    variant={
                      tenant.status === "ACTIVE" ? "success" : "secondary"
                    }
                  >
                    {" "}
                    {tenant.status}{" "}
                  </Badge>{" "}
                </div>
              ))
            )}{" "}
          </div>{" "}
        </Card>{" "}
        <Card className="p-6">
          {" "}
          <div className="flex items-center justify-between mb-4">
            {" "}
            <h3 className="font-bold text-lg">System Status</h3>{" "}
          </div>{" "}
          <div className="space-y-3">
            {" "}
            {[
              { name: "API Services", status: "operational", uptime: "99.9%" },
              { name: "Database", status: "operational", uptime: "99.9%" },
              {
                name: "GDS Connections",
                status: "operational",
                uptime: "98.5%",
              },
              { name: "Payment Gateway", status: "degraded", uptime: "95.2%" },
            ].map((service) => (
              <div
                key={service.name}
                className="flex items-center justify-between p-3 bg-near-black rounded-lg"
              >
                {" "}
                <div className="flex items-center gap-3">
                  {" "}
                  <div
                    className={`w-2 h-2 rounded-full ${service.status === "operational" ? "bg-apple-blue" : "bg-apple-blue"}`}
                  />{" "}
                  <div>
                    {" "}
                    <p className="font-medium">{service.name}</p>{" "}
                    <p className="text-sm text-near-black">
                      Uptime: {service.uptime}
                    </p>{" "}
                  </div>{" "}
                </div>{" "}
                <Badge
                  variant={
                    service.status === "operational" ? "success" : "warning"
                  }
                >
                  {" "}
                  {service.status}{" "}
                </Badge>{" "}
              </div>
            ))}{" "}
          </div>{" "}
        </Card>{" "}
      </div>{" "}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {" "}
        <Card className="p-6 lg:col-span-2">
          {" "}
          <div className="flex items-center justify-between mb-4">
            {" "}
            <h3 className="font-bold text-lg">Platform Activity</h3>{" "}
            <select className="text-sm border rounded-lg px-3 py-1">
              {" "}
              <option>Last 7 days</option> <option>Last 30 days</option>{" "}
              <option>Last 90 days</option>{" "}
            </select>{" "}
          </div>{" "}
          <div className="h-48 flex items-center justify-center border-2 border-dashed border-near-black rounded-lg">
            {" "}
            <div className="text-center text-near-black">
              {" "}
              <Activity className="h-8 w-8 mx-auto mb-2 text-near-black" />{" "}
              <p>Activity chart placeholder</p>{" "}
            </div>{" "}
          </div>{" "}
        </Card>{" "}
        <Card className="p-6">
          {" "}
          <h3 className="font-bold text-lg mb-4">Quick Actions</h3>{" "}
          <div className="space-y-2">
            {" "}
            <Button variant="outline" className="w-full justify-start">
              {" "}
              <Plus className="h-4 w-4 mr-2" /> Add New Tenant{" "}
            </Button>{" "}
            <Button variant="outline" className="w-full justify-start">
              {" "}
              <Users className="h-4 w-4 mr-2" /> Add Staff Member{" "}
            </Button>{" "}
            <Button variant="outline" className="w-full justify-start">
              {" "}
              <Plane className="h-4 w-4 mr-2" /> Configure Suppliers{" "}
            </Button>{" "}
            <Button variant="outline" className="w-full justify-start">
              {" "}
              <DollarSign className="h-4 w-4 mr-2" /> Revenue Rules{" "}
            </Button>{" "}
          </div>{" "}
        </Card>{" "}
      </div>{" "}
    </div>
  );
};
export default DashboardPage;
