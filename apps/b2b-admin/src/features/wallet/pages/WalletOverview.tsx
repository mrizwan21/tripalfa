import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowRight, Wallet, CreditCard, RefreshCw, Download, TrendingUp, TrendingDown, Zap, Settings, ChevronRight, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@tripalfa/ui-components/ui/card";
import { Button } from "@tripalfa/ui-components/ui/button";
import { Badge } from "@tripalfa/ui-components/ui/badge";
import { PaymentService, VirtualCardData } from "../../../services/PaymentService";
import { cn } from "@tripalfa/shared-utils/utils";

export default function WalletOverview() {
  const [virtualCards, setVirtualCards] = useState<VirtualCardData[]>([]);
  const [cardStats, setCardStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadWalletData = async () => {
      try {
        setLoading(true);
        const [cards, stats] = await Promise.all([
          PaymentService.getVirtualCards(),
          PaymentService.getVirtualCardStats()
        ]);
        setVirtualCards(cards);
        setCardStats(stats);
      } catch (err) {
        console.error('Error loading wallet data:', err);
        setError('Failed to load wallet data');
      } finally {
        setLoading(false);
      }
    };

    loadWalletData();
  }, []);

  // Mock transactions for now - can be replaced with actual transaction data from PaymentService
  const transactions = [
    { id: "TRX-9821", type: "Deposit", amount: "+$5,000.00", date: "Today, 09:41 AM", status: "Completed", sender: "Admin Top-up" },
    { id: "TRX-9820", type: "Payment", amount: "-$124.50", date: "Yesterday, 2:30 PM", status: "Completed", sender: "Hotel Booking #892" },
    { id: "TRX-9819", type: "Payment", amount: "-$850.00", date: "Feb 10, 2026", status: "Completed", sender: "Flight Booking #891" },
    { id: "TRX-9818", type: "Refund", amount: "+$200.00", date: "Feb 09, 2026", status: "Processing", sender: "Refund #889" },
    { id: "TRX-9817", type: "Payment", amount: "-$430.20", date: "Feb 08, 2026", status: "Failed", sender: "Hotel Booking #880" },
  ];

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completed":
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">Completed</Badge>;
      case "Processing":
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30">Processing</Badge>;
      case "Failed":
        return <Badge variant="outline" className="bg-rose-500/10 text-rose-400 border-rose-500/30">Failed</Badge>;
      default:
        return <Badge variant="outline" className="bg-slate-500/10 text-slate-400 border-slate-500/30">{status}</Badge>;
    }
  };

  // Get transaction icon
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "Deposit":
        return <ArrowRight className="h-4 w-4" />;
      case "Refund":
        return <RefreshCw className="h-4 w-4" />;
      default:
        return <ArrowUpRight className="h-4 w-4" />;
    }
  };

  // Get transaction icon styles
  const getTransactionStyles = (type: string) => {
    switch (type) {
      case "Deposit":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30";
      case "Refund":
        return "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30";
      default:
        return "bg-rose-500/10 text-rose-400 border border-rose-500/30";
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
      
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <Wallet className="h-7 w-7 text-cyan-400" />
            Wallet & Credits
          </h2>
          <p className="text-sm text-cyan-400/60 mt-1">Manage your agency balance and view transaction history.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="h-9 gap-2 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/5 hover:border-cyan-500/40 bg-transparent">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button size="sm" className="h-9 gap-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white shadow-lg shadow-cyan-500/25">
            <Wallet className="h-4 w-4" />
            <span>Add Funds</span>
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Virtual Card - Balance Display */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#0a0e17] via-[#111827] to-[#0a0e17] p-6 text-white shadow-lg border border-cyan-500/20"
        >
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 opacity-50" />
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-cyan-500/20 blur-2xl rounded-full" />
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-24 h-24 bg-purple-500/20 blur-xl rounded-full" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-cyan-400" />
                <span className="text-xs font-mono text-slate-400">**** 4242</span>
              </div>
              <Badge className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border-cyan-500/30 text-xs">Active</Badge>
            </div>
            
            <div className="mb-4">
              <p className="text-xs text-slate-400 uppercase tracking-wide">Current Balance</p>
              <p className="text-3xl font-bold tracking-tight gradient-text">$42,931.50</p>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase text-slate-500 font-semibold tracking-wider">Agency ID</p>
                <p className="text-sm font-mono text-cyan-400">TRIP-8821-X</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-cyan-400">
                <Zap className="h-3 w-3" />
                Verified
              </div>
            </div>
          </div>
        </motion.div>

        {/* Credits Used */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="h-full border-cyan-500/10 bg-gradient-to-br from-[#111827]/80 to-[#0a0e17]/90 hover:border-cyan-500/30 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                Credits Used (mtd)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">$12,450</span>
                <span className="flex items-center text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  <TrendingUp className="h-3 w-3 mr-0.5" />
                  +14%
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">vs $10,920 last month</p>
              
              {/* Mini Bar Chart */}
              <div className="h-12 mt-4 flex items-end justify-between gap-1">
                {[30, 45, 25, 60, 75, 50, 80].map((height, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: 0.3 + i * 0.05, duration: 0.3 }}
                    className="flex-1 bg-gradient-to-t from-cyan-500/50 to-purple-500/50 rounded-sm hover:from-cyan-500/70 hover:to-purple-500/70 transition-colors" 
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pending Refunds */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="h-full border-cyan-500/10 bg-gradient-to-br from-[#111827]/80 to-[#0a0e17]/90 hover:border-cyan-500/30 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-amber-400" />
                Pending Refunds
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">3</span>
                <span className="text-xs text-slate-500">requests</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Total value: <span className="text-amber-400">$450.00</span></p>
              <Button variant="outline" size="sm" className="w-full mt-4 h-8 text-xs border-amber-500/20 text-amber-400 hover:bg-amber-500/5 hover:border-amber-500/40 bg-transparent">
                Resolve Requests
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-5"
        >
          <Card className="border-cyan-500/10 bg-gradient-to-br from-[#111827]/80 to-[#0a0e17]/90">
            <CardHeader className="pb-3 border-b border-cyan-500/10">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-cyan-400" />
                    Recent Transactions
                  </CardTitle>
                  <CardDescription className="text-xs mt-1 text-slate-400">Most recent 5 transactions from your wallet</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-xs h-8 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/5">
                  View All
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-cyan-500/10">
                {transactions.map((transaction, index) => (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                    className="flex items-center justify-between py-4 first:pt-0 last:pb-0 hover:bg-cyan-500/5 transition-colors -mx-6 px-6"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", getTransactionStyles(transaction.type))}>
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{transaction.sender}</p>
                        <p className="text-xs text-slate-400">{transaction.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className={cn(
                          "text-sm font-semibold",
                          transaction.type === 'Deposit' || transaction.type === 'Refund' 
                            ? 'text-emerald-400' 
                            : 'text-white'
                        )}>
                          {transaction.amount}
                        </p>
                        {getStatusBadge(transaction.status)}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Wallet Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2"
        >
          <Card className="border-cyan-500/10 bg-gradient-to-br from-[#111827]/80 to-[#0a0e17]/90 h-full">
            <CardHeader className="pb-3 border-b border-cyan-500/10">
              <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                <Settings className="h-4 w-4 text-purple-400" />
                Wallet Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {/* Low Balance Alert */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Low Balance Alert</span>
                <button className="relative h-5 w-9 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full cursor-pointer transition-colors shadow-lg shadow-cyan-500/25">
                  <span className="absolute top-1 right-1 h-3 w-3 bg-white rounded-full shadow-sm transition-transform" />
                </button>
              </div>
              
              {/* Auto-Topup */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Auto-Topup</span>
                <button className="relative h-5 w-9 bg-slate-700 rounded-full cursor-pointer transition-colors hover:bg-slate-600">
                  <span className="absolute top-1 left-1 h-3 w-3 bg-white rounded-full shadow-sm transition-transform" />
                </button>
              </div>

              {/* Transaction Notifications */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Transaction Alerts</span>
                <button className="relative h-5 w-9 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full cursor-pointer transition-colors shadow-lg shadow-cyan-500/25">
                  <span className="absolute top-1 right-1 h-3 w-3 bg-white rounded-full shadow-sm transition-transform" />
                </button>
              </div>

              {/* Linked Payment Method */}
              <div className="pt-4 mt-4 border-t border-cyan-500/10">
                <p className="text-xs text-slate-400 mb-3 uppercase tracking-wider">Linked Payment Method</p>
                <div className="flex items-center gap-3 p-3 border border-cyan-500/20 rounded-xl bg-cyan-500/5 hover:border-cyan-500/40 transition-colors cursor-pointer">
                  <div className="h-8 w-10 bg-gradient-to-br from-slate-700 to-slate-800 rounded flex items-center justify-center border border-slate-600">
                    <span className="text-[6px] text-white font-bold">VISA</span>
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-mono text-slate-300">**** 5599</span>
                    <p className="text-[10px] text-slate-500">Expires 12/28</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
