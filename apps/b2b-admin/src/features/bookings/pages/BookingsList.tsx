import { useEffect, useMemo, useState, useCallback } from "react"
import { DataTable } from "@tripalfa/ui-components/ui/data-table"
import { columns, Booking } from "./columns"
import { AdminBooking } from "../types"
import api from "@/shared/lib/api"
import { Loader2, Calendar, Filter, RefreshCw, Search, X, ChevronDown, ChevronUp } from "lucide-react"
import { Input } from "@tripalfa/ui-components/ui/input"
import { Button } from "@tripalfa/ui-components/ui/button"
import { Label } from "@tripalfa/ui-components/ui/label"
import { Badge } from "@tripalfa/ui-components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@tripalfa/ui-components/ui/select"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@tripalfa/shared-utils/utils"

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState<boolean>(false)
  const [showFilters, setShowFilters] = useState(true)
  const [filters, setFilters] = useState({
    reference: "",
    email: "",
    status: "",
    fromDate: "",
    toDate: "",
    minAmount: "",
    maxAmount: "",
    pnr: "",
    phone: "",
    supplier: "",
    channel: "",
    quick: "",
    kind: "",
  })

  const applyLocalFilters = useCallback(
    (records: Booking[]) => {
      return records.filter((b) => {
        if (filters.reference && !b.reference.toLowerCase().includes(filters.reference.toLowerCase())) return false
        if (filters.email && !b.userEmail.toLowerCase().includes(filters.email.toLowerCase())) return false
        if (filters.status && b.status !== filters.status) return false

        if (filters.fromDate) {
          const from = new Date(filters.fromDate)
          if (Number.isFinite(from.getTime()) && new Date(b.createdAt) < from) return false
        }

        if (filters.toDate) {
          const to = new Date(filters.toDate)
          if (Number.isFinite(to.getTime()) && new Date(b.createdAt) > to) return false
        }

        if (filters.minAmount && b.amount < Number(filters.minAmount)) return false
        if (filters.maxAmount && b.amount > Number(filters.maxAmount)) return false

        if (filters.pnr && !(b.pnr || b.reference).toLowerCase().includes(filters.pnr.toLowerCase())) return false
        if (filters.phone && !(b.phone ?? "").toLowerCase().includes(filters.phone.toLowerCase())) return false
        if (filters.supplier && !(b.supplier ?? "").toLowerCase().includes(filters.supplier.toLowerCase())) return false
        if (filters.channel && !(b.channel ?? "").toLowerCase().includes(filters.channel.toLowerCase())) return false
        if (filters.kind && (b.kind ?? "other") !== filters.kind) return false

        if (filters.quick) {
          const q = filters.quick.toLowerCase()
          const haystack = [
            b.reference,
            b.pnr ?? "",
            b.userEmail,
            b.phone ?? "",
            b.supplier ?? "",
            b.channel ?? "",
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
          if (!haystack.includes(q)) return false
        }

        return true
      })
    },
    [filters]
  )

  const fetchBookings = useCallback(
    async (currentFilters: typeof filters, signal?: AbortSignal) => {
      try {
        setLoading(true)
        setError(null)
        const params: Record<string, string | number> = { limit: 100 }

        if (currentFilters.reference) params.reference = currentFilters.reference
        if (currentFilters.email) params.email = currentFilters.email
        if (currentFilters.status) params.status = currentFilters.status
        if (currentFilters.fromDate) params.fromDate = currentFilters.fromDate
        if (currentFilters.toDate) params.toDate = currentFilters.toDate
        if (currentFilters.minAmount) params.minAmount = currentFilters.minAmount
        if (currentFilters.maxAmount) params.maxAmount = currentFilters.maxAmount
        if (currentFilters.pnr) params.pnr = currentFilters.pnr
        if (currentFilters.phone) params.phone = currentFilters.phone
        if (currentFilters.supplier) params.supplier = currentFilters.supplier
        if (currentFilters.channel) params.channel = currentFilters.channel
        if (currentFilters.quick) params.q = currentFilters.quick
        if (currentFilters.kind) params.kind = currentFilters.kind

        const res = await api.get("/admin/bookings", {
          params,
          signal,
        })

        const raw = (res.data?.data as AdminBooking[]) || (res.data?.bookings as AdminBooking[]) || []
        const normalized: Booking[] = raw.map((b) => {
          const typeRaw = String(b.type ?? b.productType ?? b.bookingType ?? b.category ?? b.kind ?? "").toLowerCase()
          const kind: Booking["kind"] = typeRaw.includes("flight") || typeRaw.includes("air")
            ? "flight"
            : typeRaw.includes("hotel")
              ? "hotel"
              : "other"

          return {
            id: String(b.id ?? b.bookingRef ?? b.reference ?? `tmp-${Math.random().toString(36).slice(2)}`),
            reference: b.reference ?? b.bookingRef ?? "N/A",
            status: (b.status as Booking["status"]) ?? "pending",
            userEmail: b.userEmail ?? b.customerEmail ?? "unknown",
            amount: Number(b.amount ?? b.totalAmount ?? 0),
            currency: b.currency ?? "USD",
            createdAt: b.createdAt ?? b.issuedDate ?? new Date().toISOString(),
            pnr: b.pnr ?? b.reference ?? b.bookingRef ?? "",
            phone: b.phone ?? b.customerPhone ?? "",
            supplier: b.supplier ?? b.provider ?? "",
            channel: b.channel ?? b.source ?? "",
            kind,
            onHold: Boolean(b.onHold ?? b.isOnHold ?? (b.status ?? "").toLowerCase() === "hold"),
          }
        })

        setBookings(normalized)
      } catch (err: unknown) {
        if (!(err instanceof Error && err.name === "CanceledError")) {
          console.error("Failed to load bookings", err)
          setError("Unable to load bookings. Showing empty state.")
          setBookings([])
        }
      } finally {
        setLoading(false)
        setIsSearching(false)
      }
    },
    []
  )

  useEffect(() => {
    const controller = new AbortController()
    const timeout = setTimeout(() => {
      setIsSearching(true)
      fetchBookings(filters, controller.signal)
    }, 350)

    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [fetchBookings, filters])

  const filteredData = useMemo(() => applyLocalFilters(bookings), [applyLocalFilters, bookings])

  const handleReset = () => {
    setFilters({
      reference: "",
      email: "",
      status: "",
      fromDate: "",
      toDate: "",
      minAmount: "",
      maxAmount: "",
      pnr: "",
      phone: "",
      supplier: "",
      channel: "",
      quick: "",
      kind: "",
    })
  }

  const activeFilterCount = Object.values(filters).filter(v => v !== "").length

  return (
    <div className="container mx-auto py-8 relative">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Calendar className="h-8 w-8 text-cyan-400" />
            Bookings
          </h1>
          <p className="text-cyan-400/60 mt-1">Manage and track all bookings</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
            {filteredData.length} bookings
          </Badge>
        </div>
      </motion.div>

      {/* Error Alert */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-4"
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-cyan-400/50" />
          <Input
            placeholder="Quick search across all fields..."
            value={filters.quick}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters((prev) => ({ ...prev, quick: e.target.value }))}
            className="pl-12 h-12 bg-cyan-500/5 border-cyan-500/20 text-white placeholder:text-slate-500 focus:border-cyan-500/40 focus:ring-cyan-500/20 rounded-xl"
          />
          {filters.quick && (
            <button
              onClick={() => setFilters((prev) => ({ ...prev, quick: "" }))}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-cyan-400"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </motion.div>

      {/* Filters Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-6"
      >
        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-400 transition-colors mb-4"
        >
          <Filter className="h-4 w-4" />
          Advanced Filters
          {activeFilterCount > 0 && (
            <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30 text-xs">
              {activeFilterCount} active
            </Badge>
          )}
          {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {/* Filter Grid */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="rounded-xl border border-cyan-500/10 bg-gradient-to-br from-[#111827]/80 to-[#0a0e17]/90 p-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="reference" className="text-slate-400 text-xs uppercase tracking-wider">Reference</Label>
                    <Input
                      id="reference"
                      placeholder="e.g., BK-12345"
                      value={filters.reference}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters((prev) => ({ ...prev, reference: e.target.value }))}
                      className="bg-cyan-500/5 border-cyan-500/20 text-white placeholder:text-slate-500 focus:border-cyan-500/40"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-400 text-xs uppercase tracking-wider">Email</Label>
                    <Input
                      id="email"
                      placeholder="customer@example.com"
                      value={filters.email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters((prev) => ({ ...prev, email: e.target.value }))}
                      className="bg-cyan-500/5 border-cyan-500/20 text-white placeholder:text-slate-500 focus:border-cyan-500/40"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-400 text-xs uppercase tracking-wider">Status</Label>
                    <Select
                      value={filters.status}
                      onValueChange={(value: string) => setFilters((prev) => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger className="bg-cyan-500/5 border-cyan-500/20 text-white">
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#111827] border-cyan-500/20">
                        <SelectItem value="">All</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-400 text-xs uppercase tracking-wider">Type</Label>
                    <Select
                      value={filters.kind}
                      onValueChange={(value: string) => setFilters((prev) => ({ ...prev, kind: value }))}
                    >
                      <SelectTrigger className="bg-cyan-500/5 border-cyan-500/20 text-white">
                        <SelectValue placeholder="All types" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#111827] border-cyan-500/20">
                        <SelectItem value="">All</SelectItem>
                        <SelectItem value="flight">Flight</SelectItem>
                        <SelectItem value="hotel">Hotel</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fromDate" className="text-slate-400 text-xs uppercase tracking-wider">From date</Label>
                    <Input
                      id="fromDate"
                      type="date"
                      value={filters.fromDate}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters((prev) => ({ ...prev, fromDate: e.target.value }))}
                      className="bg-cyan-500/5 border-cyan-500/20 text-white focus:border-cyan-500/40"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="toDate" className="text-slate-400 text-xs uppercase tracking-wider">To date</Label>
                    <Input
                      id="toDate"
                      type="date"
                      value={filters.toDate}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters((prev) => ({ ...prev, toDate: e.target.value }))}
                      className="bg-cyan-500/5 border-cyan-500/20 text-white focus:border-cyan-500/40"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minAmount" className="text-slate-400 text-xs uppercase tracking-wider">Min amount</Label>
                    <Input
                      id="minAmount"
                      type="number"
                      min="0"
                      value={filters.minAmount}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters((prev) => ({ ...prev, minAmount: e.target.value }))}
                      className="bg-cyan-500/5 border-cyan-500/20 text-white placeholder:text-slate-500 focus:border-cyan-500/40"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxAmount" className="text-slate-400 text-xs uppercase tracking-wider">Max amount</Label>
                    <Input
                      id="maxAmount"
                      type="number"
                      min="0"
                      value={filters.maxAmount}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters((prev) => ({ ...prev, maxAmount: e.target.value }))}
                      className="bg-cyan-500/5 border-cyan-500/20 text-white placeholder:text-slate-500 focus:border-cyan-500/40"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pnr" className="text-slate-400 text-xs uppercase tracking-wider">PNR</Label>
                    <Input
                      id="pnr"
                      placeholder="PNR/locator"
                      value={filters.pnr}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters((prev) => ({ ...prev, pnr: e.target.value }))}
                      className="bg-cyan-500/5 border-cyan-500/20 text-white placeholder:text-slate-500 focus:border-cyan-500/40"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-slate-400 text-xs uppercase tracking-wider">Phone</Label>
                    <Input
                      id="phone"
                      placeholder="Contact number"
                      value={filters.phone}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters((prev) => ({ ...prev, phone: e.target.value }))}
                      className="bg-cyan-500/5 border-cyan-500/20 text-white placeholder:text-slate-500 focus:border-cyan-500/40"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supplier" className="text-slate-400 text-xs uppercase tracking-wider">Supplier</Label>
                    <Input
                      id="supplier"
                      placeholder="Supplier/provider"
                      value={filters.supplier}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters((prev) => ({ ...prev, supplier: e.target.value }))}
                      className="bg-cyan-500/5 border-cyan-500/20 text-white placeholder:text-slate-500 focus:border-cyan-500/40"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="channel" className="text-slate-400 text-xs uppercase tracking-wider">Channel</Label>
                    <Input
                      id="channel"
                      placeholder="e.g., B2B, API, Web"
                      value={filters.channel}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters((prev) => ({ ...prev, channel: e.target.value }))}
                      className="bg-cyan-500/5 border-cyan-500/20 text-white placeholder:text-slate-500 focus:border-cyan-500/40"
                    />
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    disabled={loading}
                    className="border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/5 hover:border-cyan-500/40 bg-transparent"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset Filters
                  </Button>
                  {(loading || isSearching) && (
                    <div className="flex items-center gap-2 text-sm text-cyan-400">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating...
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Data Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-xl border border-cyan-500/10 bg-gradient-to-br from-[#111827]/80 to-[#0a0e17]/90 overflow-hidden"
      >
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-20 text-cyan-400">
            <Loader2 className="h-6 w-6 animate-spin" />
            Loading bookings...
          </div>
        ) : (
          <DataTable columns={columns} data={filteredData} searchKey="reference" />
        )}
      </motion.div>
    </div>
  )
}
