/**
 * SupplierBadge Component
 * =======================
 * Displays supplier source information for hotels and flights.
 * Shows the supplier name, match confidence, and verification status.
 *
 * Used to indicate which supplier(s) provide data for a canonical entity.
 */

import React from "react";
import {
  CheckCircle2,
  AlertCircle,
  Database,
  Zap,
  ShieldCheck,
} from "lucide-react";

export interface SupplierMapping {
  id: string;
  supplierId: string;
  supplierName: string;
  supplierCode: string;
  supplierType: string;
  supplierHotelId?: string;
  supplierHotelCode?: string;
  matchType: "auto" | "manual" | "giata";
  matchConfidence: number | null;
  matchVerifiedAt: string | null;
  lastSyncedAt: string | null;
  syncStatus: "pending" | "synced" | "error";
  isActive: boolean;
}

interface SupplierBadgeProps {
  suppliers: SupplierMapping[];
  variant?: "compact" | "full" | "minimal";
  showConfidence?: boolean;
  className?: string;
}

// Supplier brand colors
const SUPPLIER_COLORS: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  hotelbeds: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
  },
  liteapi: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  innstant: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
  },
  duffel: {
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-200",
  },
  amadeus: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  giata: {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
  },
  default: {
    bg: "bg-gray-50",
    text: "text-gray-700",
    border: "border-gray-200",
  },
};

// Match type labels
const MATCH_TYPE_LABELS: Record<
  string,
  { label: string; icon: React.ReactNode }
> = {
  auto: { label: "Auto-matched", icon: <Zap size={10} /> },
  manual: { label: "Verified", icon: <CheckCircle2 size={10} /> },
  giata: { label: "GIATA Verified", icon: <ShieldCheck size={10} /> },
};

export function SupplierBadge({
  suppliers,
  variant = "compact",
  showConfidence = true,
  className = "",
}: SupplierBadgeProps) {
  if (!suppliers || suppliers.length === 0) {
    return null;
  }

  const getSupplierColor = (code: string) => {
    return SUPPLIER_COLORS[code.toLowerCase()] || SUPPLIER_COLORS.default;
  };

  const getMatchTypeInfo = (type: string) => {
    return MATCH_TYPE_LABELS[type] || MATCH_TYPE_LABELS.auto;
  };

  const formatConfidence = (confidence: number | null) => {
    if (confidence === null) return null;
    return `${Math.round(confidence * 100)}%`;
  };

  if (variant === "minimal") {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {suppliers.slice(0, 3).map((supplier, idx) => {
          const colors = getSupplierColor(supplier.supplierCode);
          return (
            <span
              key={supplier.id || idx}
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${colors.bg} ${colors.text} ${colors.border} border`}
            >
              {supplier.supplierCode}
            </span>
          );
        })}
        {suppliers.length > 3 && (
          <span className="text-[9px] font-bold text-gray-400">
            +{suppliers.length - 3}
          </span>
        )}
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={`flex flex-wrap items-center gap-2 ${className}`}>
        <span className="flex items-center gap-1 text-[9px] font-black text-gray-400 uppercase tracking-widest">
          <Database size={10} /> Sources
        </span>
        {suppliers.map((supplier, idx) => {
          const colors = getSupplierColor(supplier.supplierCode);
          const matchInfo = getMatchTypeInfo(supplier.matchType);

          return (
            <div
              key={supplier.id || idx}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${colors.bg} ${colors.text} ${colors.border} border`}
            >
              <span className="text-[10px] font-black uppercase tracking-wider">
                {supplier.supplierName}
              </span>
              {supplier.matchType === "giata" && (
                <ShieldCheck size={10} className="text-green-600" />
              )}
              {showConfidence && supplier.matchConfidence !== null && (
                <span className="text-[8px] font-bold opacity-70">
                  {formatConfidence(supplier.matchConfidence)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Full variant
  return (
    <div className={`bg-gray-50 rounded-2xl p-4 space-y-3 ${className}`}>
      <div className="flex items-center gap-2">
        <Database size={14} className="text-gray-400" />
        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
          Data Sources ({suppliers.length})
        </span>
      </div>

      <div className="space-y-2">
        {suppliers.map((supplier, idx) => {
          const colors = getSupplierColor(supplier.supplierCode);
          const matchInfo = getMatchTypeInfo(supplier.matchType);

          return (
            <div
              key={supplier.id || idx}
              className={`flex items-center justify-between p-3 rounded-xl ${colors.bg} ${colors.border} border`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-lg ${colors.text} bg-white/50 flex items-center justify-center font-black text-xs uppercase`}
                >
                  {supplier.supplierCode.slice(0, 2)}
                </div>
                <div>
                  <p className={`text-sm font-black ${colors.text}`}>
                    {supplier.supplierName}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-1 text-[9px] font-bold text-gray-500">
                      {matchInfo.icon}
                      {matchInfo.label}
                    </span>
                    {supplier.supplierHotelId && (
                      <span className="text-[8px] font-mono text-gray-400">
                        ID: {supplier.supplierHotelId}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right">
                {showConfidence && supplier.matchConfidence !== null && (
                  <div className="flex items-center gap-1">
                    <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${supplier.matchConfidence >= 0.9 ? "bg-green-500" : supplier.matchConfidence >= 0.7 ? "bg-yellow-500" : "bg-red-400"}`}
                        style={{ width: `${supplier.matchConfidence * 100}%` }}
                      />
                    </div>
                    <span className="text-[9px] font-bold text-gray-500">
                      {formatConfidence(supplier.matchConfidence)}
                    </span>
                  </div>
                )}
                {supplier.syncStatus === "synced" && (
                  <span className="flex items-center gap-1 text-[9px] font-bold text-green-600 mt-1">
                    <CheckCircle2 size={10} /> Synced
                  </span>
                )}
                {supplier.syncStatus === "error" && (
                  <span className="flex items-center gap-1 text-[9px] font-bold text-red-500 mt-1">
                    <AlertCircle size={10} /> Sync Error
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Compact inline badge for cards
export function SupplierBadgeInline({
  suppliers,
}: {
  suppliers: SupplierMapping[];
}) {
  if (!suppliers || suppliers.length === 0) return null;

  return (
    <div className="flex items-center gap-1">
      {suppliers.slice(0, 2).map((supplier, idx) => {
        const colors =
          SUPPLIER_COLORS[supplier.supplierCode.toLowerCase()] ||
          SUPPLIER_COLORS.default;
        return (
          <span
            key={supplier.id || idx}
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${colors.bg} ${colors.text}`}
          >
            {supplier.supplierCode}
            {supplier.matchType === "giata" && <ShieldCheck size={8} />}
          </span>
        );
      })}
      {suppliers.length > 2 && (
        <span className="text-[8px] font-bold text-gray-400">
          +{suppliers.length - 2}
        </span>
      )}
    </div>
  );
}

export default SupplierBadge;
