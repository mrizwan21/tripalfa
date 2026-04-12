import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";

export const CHART_REVENUE_COLOR = "hsl(var(--primary))";
export const CHART_BOOKINGS_COLOR = "hsl(var(--success))";
export const CHART_GRID_COLOR = "hsl(var(--border))";
export const CHART_TICK_COLOR = "hsl(var(--muted-foreground))";

export const data = [
  { name: "Jan", revenue: 4500, bookings: 2400 },
  { name: "Feb", revenue: 5200, bookings: 2800 },
  { name: "Mar", revenue: 4800, bookings: 2600 },
  { name: "Apr", revenue: 6100, bookings: 3200 },
  { name: "May", revenue: 7200, bookings: 3800 },
  { name: "Jun", revenue: 6800, bookings: 3500 },
  { name: "Jul", revenue: 8100, bookings: 4200 },
  { name: "Aug", revenue: 8500, bookings: 4500 },
  { name: "Sep", revenue: 7800, bookings: 4100 },
  { name: "Oct", revenue: 9200, bookings: 4800 },
  { name: "Nov", revenue: 9800, bookings: 5100 },
  { name: "Dec", revenue: 10500, bookings: 5500 },
];

export const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const getDotClass = (dataKey: string) => {
      return dataKey === "revenue" ? "bg-primary" : "bg-emerald-500";
    };

    return (
      <div className="bg-popover p-4 rounded-xl shadow-xl border border-border">
        <p className="text-sm font-semibold text-foreground mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className={`h-2 w-2 rounded-full ${getDotClass(entry.dataKey)}`}
            />
            <span className="text-muted-foreground capitalize">
              {entry.dataKey}:
            </span>
            <span className="font-semibold text-foreground">
              {entry.dataKey === "revenue"
                ? `$${entry.value.toLocaleString()}`
                : entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function Overview() {
  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{
            top: 10,
            right: 10,
            left: 0,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor={CHART_REVENUE_COLOR}
                stopOpacity={0.3}
              />
              <stop
                offset="95%"
                stopColor={CHART_REVENUE_COLOR}
                stopOpacity={0}
              />
            </linearGradient>
            <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor={CHART_BOOKINGS_COLOR}
                stopOpacity={0.3}
              />
              <stop
                offset="95%"
                stopColor={CHART_BOOKINGS_COLOR}
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke={CHART_GRID_COLOR}
          />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: CHART_TICK_COLOR, fontSize: 12 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: CHART_TICK_COLOR, fontSize: 12 }}
            tickFormatter={(value) => `$${value / 1000}k`}
            dx={-10}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke={CHART_REVENUE_COLOR}
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorRevenue)"
            animationDuration={1500}
            animationEasing="ease-out"
          />
          <Area
            type="monotone"
            dataKey="bookings"
            stroke={CHART_BOOKINGS_COLOR}
            strokeWidth={2}
            strokeDasharray="5 5"
            fillOpacity={1}
            fill="url(#colorBookings)"
            animationDuration={1500}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-primary" />
          <span className="text-sm text-muted-foreground">Revenue</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-emerald-500" />
          <span className="text-sm text-muted-foreground">Bookings</span>
        </div>
      </div>
    </div>
  );
}
