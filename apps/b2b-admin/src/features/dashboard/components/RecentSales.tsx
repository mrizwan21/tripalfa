import { Avatar, AvatarFallback, AvatarImage } from "@tripalfa/ui-components/ui/avatar";
import { motion } from "framer-motion";

const sales = [
  {
    id: 1,
    name: "Olivia Martin",
    email: "olivia.martin@email.com",
    amount: "$1,999.00",
    initials: "OM",
    color: "from-indigo-500 to-violet-600",
  },
  {
    id: 2,
    name: "Jackson Lee",
    email: "jackson.lee@email.com",
    amount: "$1,499.00",
    initials: "JL",
    color: "from-emerald-500 to-teal-600",
  },
  {
    id: 3,
    name: "Isabella Nguyen",
    email: "isabella.nguyen@email.com",
    amount: "$899.00",
    initials: "IN",
    color: "from-amber-500 to-orange-600",
  },
  {
    id: 4,
    name: "William Chen",
    email: "william.chen@email.com",
    amount: "$2,499.00",
    initials: "WC",
    color: "from-rose-500 to-pink-600",
  },
  {
    id: 5,
    name: "Sofia Rodriguez",
    email: "sofia.rodriguez@email.com",
    amount: "$1,299.00",
    initials: "SR",
    color: "from-blue-500 to-cyan-600",
  },
];

export function RecentSales() {
  return (
    <div className="space-y-4">
      {sales.map((sale, index) => (
        <motion.div
          key={sale.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1, duration: 0.3 }}
          className="flex items-center gap-4 group cursor-pointer"
        >
          <Avatar className="h-11 w-11 border-2 border-white shadow-md">
            <AvatarFallback
              className={`bg-gradient-to-br ${sale.color} text-white text-sm font-bold`}
            >
              {sale.initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
              {sale.name}
            </p>
            <p className="text-xs text-slate-500 truncate">{sale.email}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-slate-900">{sale.amount}</p>
            <p className="text-xs text-emerald-600 font-medium">+Completed</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
