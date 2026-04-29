import React from "react";

interface TableBodyStateProps {
  loading?: boolean;
  isEmpty?: boolean;
  colSpan?: number;
  loadingMessage?: string;
  emptyMessage?: string;
  type?: "empty" | "loading";
  title?: string;
  description?: string;
  children?: React.ReactNode;
}

export function TableBodyState({
  loading,
  isEmpty,
  colSpan = 1,
  loadingMessage = "Loading...",
  emptyMessage = "No data found",
  type,
  title,
  description,
  children,
}: TableBodyStateProps) {
  const isLoadingState = type === "loading" || loading;
  const isEmptyState = type === "empty" || isEmpty;

  if (isLoadingState) {
    return (
      <tr>
        <td colSpan={colSpan} className="px-6 py-12 text-center text-near-black/40">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-apple-blue mx-auto mb-4" />
          <p className="text-sm font-medium">{title || loadingMessage}</p>
          {description && (
            <p className="text-xs text-near-black/30 mt-1">{description}</p>
          )}
        </td>
      </tr>
    );
  }

  if (isEmptyState) {
    return (
      <tr>
        <td colSpan={colSpan} className="px-6 py-12 text-center text-near-black/40">
          <p className="text-sm font-medium">{title || emptyMessage}</p>
          {description && (
            <p className="text-xs text-near-black/30 mt-1">{description}</p>
          )}
        </td>
      </tr>
    );
  }

  return <>{children}</>;
}