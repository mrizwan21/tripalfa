import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";

const data = [
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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-xl shadow-xl border border-slate-200">
        <p className="text-sm font-semibold text-slate-900 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-slate-500 capitalize">{entry.dataKey}:</span>
            <span className="font-semibold text-slate-900">
              {entry.dataKey === "revenue" ? `$${entry.value.toLocaleString()}` : entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function Overview() {
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
              <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#e2e8f0"
          />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748b", fontSize: 12 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748b", fontSize: 12 }}
            tickFormatter={(value) => `$${value / 1000}k`}
            dx={-10}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#4f46e5"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorRevenue)"
            animationDuration={1500}
            animationEasing="ease-out"
          />
          <Area
            type="monotone"
            dataKey="bookings"
            stroke="#10b981"
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
          <div className="h-3 w-3 rounded-full bg-indigo-500" />
          <span className="text-sm text-slate-600">Revenue</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-emerald-500" />
          <span className="text-sm text-slate-600">Bookings</span>
        </div>
      </div>
    </div>
  );
}
