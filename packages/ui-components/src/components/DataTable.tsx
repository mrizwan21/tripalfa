import * as React from "react";
import { cn } from "../lib/utils";
import type {
  DataTableVariant,
  DataTableLayout,
  DataTableDensity,
  DataTableInformationDensity,
  ColumnDefinition,
  SortConfig,
  BulkAction,
  DataTableProps,
} from "./DataTable/types";

export type {
  DataTableVariant,
  DataTableLayout,
  DataTableDensity,
  DataTableInformationDensity,
  ColumnDefinition,
  SortConfig,
  BulkAction,
  DataTableProps,
};

export const DataTable = <T,>({
  data = [],
  columns,
  variant = "b2b-dense",
  layout = "table",
  density = "normal",
  informationDensity = "standard",
  features = {
    bulkActions: false,
    inlineEditing: false,
    visualSummary: false,
    export: false,
    sorting: true,
    pagination: true,
    rowSelection: false,
    search: false,
    filters: false,
  },
  sortConfig,
  onSortChange,
  selectedRows = new Set(),
  onSelectionChange,
  rowKey = (_: T, index: number) => index,
  bulkActions = [],
  page = 1,
  pageSize = 20,
  totalItems,
  onPageChange,
  onPageSizeChange,
  onEdit,
  editMode = "single",
  onBatchEdit,
  isLoading = false,
  loadingMessage = "Loading data...",
  isEmpty = false,
  emptyState,
  actions,
  searchValue,
  onSearchChange,
  filters,
  className,
  containerClassName,
  headerClassName,
  rowClassName,
  cellClassName,
  onRowClick,
  summaryRenderer,
}: DataTableProps<T>) => {
  // Edit state management
  const [editingCell, setEditingCell] = React.useState<{
    rowKey: string | number;
    columnKey: string;
    value: any;
  } | null>(null);
  const [editValue, setEditValue] = React.useState<any>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [validationError, setValidationError] = React.useState<string | null>(
    null
  );
  const [batchEdits, setBatchEdits] = React.useState<
    Map<string, Map<string, any>>
  >(new Map());

  // Get variant-specific styles
  const getVariantStyles = () => {
    switch (variant) {
      case "b2b-dense":
        return {
          container:
            "bg-white rounded-large border border-black/5 shadow-apple overflow-hidden",
          header: "bg-filter-bg border-b border-black/5",
          headerCell:
            "px-6 py-4 text-[12px] font-semibold text-black/50 tracking-tight",
          row: "border-b border-black/5 hover:bg-near-black/[0.02] transition-colors",
          cell: "px-6 py-4 text-[13px] font-medium text-near-black",
          selectedRow: "bg-apple-blue/5",
          editingCell: "bg-apple-blue/10 border border-apple-blue",
          bulkActionsBar: "bg-apple-blue/5 border-b border-apple-blue/20",
        };
      case "b2c-card":
        return {
          container: "bg-transparent",
          header: "bg-transparent border-b border-black/10",
          headerCell: "px-4 py-3 text-sm font-semibold text-near-black",
          row: "bg-white rounded-lg border border-black/5 shadow-sm hover:shadow-apple transition-shadow",
          cell: "px-4 py-3 text-sm text-near-black",
          selectedRow: "border-apple-blue border-2",
          editingCell: "bg-apple-blue border border-apple-blue/30",
          bulkActionsBar: "bg-apple-blue border-b border-apple-blue/20",
        };
      case "admin-complex":
        return {
          container: "bg-white rounded-md border border-near-black shadow-sm",
          header: "bg-near-black border-b border-near-black",
          headerCell:
            "px-4 py-3 text-xs font-semibold text-near-black tracking-tight",
          row: "border-b border-near-black hover:bg-near-black",
          cell: "px-4 py-3 text-sm text-near-black",
          selectedRow: "bg-apple-blue",
          editingCell: "bg-apple-blue border border-apple-blue/30",
          bulkActionsBar: "bg-near-black border-b border-near-black",
        };
      default:
        return {
          container: "bg-white rounded-lg border border-near-black",
          header: "bg-near-black border-b border-near-black",
          headerCell:
            "px-6 py-3 text-left text-xs font-medium text-near-black tracking-tight",
          row: "border-b border-near-black hover:bg-near-black",
          cell: "px-6 py-4 text-sm text-near-black",
          selectedRow: "bg-apple-blue",
          editingCell: "bg-apple-blue border border-apple-blue/30",
          bulkActionsBar: "bg-near-black border-b border-near-black",
        };
    }
  };

  // Get density-specific styles
  const getDensityStyles = () => {
    switch (density) {
      case "compact":
        return {
          container: "text-xs",
          headerCell: "py-2",
          cell: "py-2",
        };
      case "expanded":
        return {
          container: "text-base",
          headerCell: "py-6",
          cell: "py-6",
        };
      default:
        return {
          container: "text-sm",
          headerCell: "py-4",
          cell: "py-4",
        };
    }
  };

  const variantStyles = getVariantStyles();
  const densityStyles = getDensityStyles();

  // Handle row selection
  const handleRowSelection = (key: string | number) => {
    if (!onSelectionChange) return;
    const newSelectedRows = new Set(selectedRows);
    if (newSelectedRows.has(key)) {
      newSelectedRows.delete(key);
    } else {
      newSelectedRows.add(key);
    }
    onSelectionChange(newSelectedRows);
  };

  // Handle select all
  const handleSelectAll = () => {
    if (!onSelectionChange || !features.rowSelection) return;
    if (selectedRows.size === data.length) {
      onSelectionChange(new Set());
    } else {
      const allKeys = data.map((item, index) => rowKey(item, index));
      onSelectionChange(new Set(allKeys));
    }
  };

  // Handle sort
  const handleSort = (key: string) => {
    if (!onSortChange || !features.sorting) return;
    if (!sortConfig || sortConfig.key !== key) {
      onSortChange({ key, direction: "asc" });
    } else if (sortConfig.direction === "asc") {
      onSortChange({ key, direction: "desc" });
    } else {
      onSortChange(null);
    }
  };

  // Inline editing handlers
  const startEditing = (
    rowKey: string | number,
    columnKey: string,
    value: any
  ) => {
    if (!features.inlineEditing) return;
    setEditingCell({ rowKey, columnKey, value });
    setEditValue(value);
    setValidationError(null);
  };

  const cancelEditing = () => {
    setEditingCell(null);
    setEditValue(null);
    setValidationError(null);
  };

  const saveEdit = async () => {
    if (!editingCell || !onEdit) return;
    const column = columns.find((col) => col.key === editingCell.columnKey);
    if (!column) return;
    // Validate
    if (column.validate) {
      const error = column.validate(
        editValue,
        data.find((item, idx) => rowKey(item, idx) === editingCell.rowKey)!
      );
      if (error) {
        setValidationError(error);
        return;
      }
    }
    setIsSaving(true);
    try {
      const index = data.findIndex(
        (item, idx) => rowKey(item, idx) === editingCell.rowKey
      );
      if (index !== -1) {
        await onEdit(data[index], editingCell.columnKey, editValue, index);
      }
      setEditingCell(null);
      setEditValue(null);
      setValidationError(null);
    } catch (error) {
      console.error("Failed to save edit:", error);
      setValidationError("Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle batch edit
  const handleBatchEdit = async () => {
    if (!onBatchEdit || batchEdits.size === 0) return;
    const updates: Array<{ item: T; field: string; value: any; index: number }> =
      [];
    batchEdits.forEach((columnEdits, rowKeyStr) => {
      const rowIndex = data.findIndex(
        (item, idx) => String(rowKey(item, idx)) === rowKeyStr
      );
      if (rowIndex !== -1) {
        columnEdits.forEach((value, columnKey) => {
          updates.push({
            item: data[rowIndex],
            field: columnKey,
            value,
            index: rowIndex,
          });
        });
      }
    });
    if (updates.length > 0) {
      setIsSaving(true);
      try {
        await onBatchEdit(updates);
        setBatchEdits(new Map());
      } catch (error) {
        console.error("Failed to save batch edits:", error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  // Get cell edit value
  const getCellEditValue = (rowKey: string | number, columnKey: string) => {
    if (editMode === "batch") {
      return batchEdits.get(String(rowKey))?.get(columnKey);
    }
    return editingCell?.rowKey === rowKey && editingCell.columnKey === columnKey
      ? editValue
      : undefined;
  };

  // Handle cell value change
  const handleCellValueChange = (
    rowKey: string | number,
    columnKey: string,
    value: any
  ) => {
    if (editMode === "batch") {
      const newBatchEdits = new Map(batchEdits);
      if (!newBatchEdits.has(String(rowKey))) {
        newBatchEdits.set(String(rowKey), new Map());
      }
      newBatchEdits.get(String(rowKey))!.set(columnKey, value);
      setBatchEdits(newBatchEdits);
    } else {
      setEditValue(value);
    }
  };

  // Render editable cell
  const renderEditableCell = (
    item: T,
    index: number,
    column: ColumnDefinition<T>,
    isEditing: boolean
  ) => {
    const key = rowKey(item, index);
    const currentValue = getCellEditValue(key, column.key);
    if (isEditing && column.editComponent) {
      return column.editComponent({
        value: currentValue !== undefined ? currentValue : column.cell(item, index),
        onChange: (value: any) => handleCellValueChange(key, column.key, value),
        item,
        index,
        column,
      });
    }
    if (isEditing) {
      return (
        <input
          type="text"
          value={
            currentValue !== undefined
              ? currentValue
              : String(column.cell(item, index))
          }
          onChange={(e) =>
            handleCellValueChange(key, column.key, e.target.value)
          }
          className="w-full px-2 py-1 border border-near-black rounded focus:outline-none focus:ring-2 focus:ring-apple-blue"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") saveEdit();
            if (e.key === "Escape") cancelEditing();
          }}
        />
      );
    }
    return column.cell(item, index);
  };

  // Render bulk actions bar
  const renderBulkActionsBar = () => {
    if (!features.bulkActions || selectedRows.size === 0) return null;
    return (
      <div
        className={cn(
          "flex items-center justify-between p-3",
          variantStyles.bulkActionsBar
        )}
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">
            {selectedRows.size} item{selectedRows.size !== 1 ? "s" : ""} selected
          </span>
          <div className="flex items-center gap-2">
            {bulkActions.map((action: BulkAction<T>, index: number) => (
              <button
                key={index}
                onClick={() => action.onClick(selectedRows, data)}
                disabled={action.disabled}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5",
                  action.variant === "danger" && "bg-near-black text-white hover:bg-near-black",
                  action.variant === "success" && "bg-apple-blue text-white hover:bg-apple-blue",
                  action.variant === "secondary" && "bg-near-black text-near-black hover:bg-near-black",
                  (!action.variant || action.variant === "primary") && "bg-apple-blue text-white hover:bg-apple-blue",
                  action.disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                {action.icon && <span>{action.icon}</span>}
                {action.label}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => onSelectionChange?.(new Set())}
          className="text-sm text-near-black hover:text-near-black"
        >
          Clear selection
        </button>
      </div>
    );
  };

  // Render enhanced pagination
  const renderPagination = () => {
    if (
      !features.pagination ||
      totalItems === undefined ||
      totalItems <= pageSize
    )
      return null;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startItem = (page - 1) * pageSize + 1;
    const endItem = Math.min(page * pageSize, totalItems);
    return (
      <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-black/5 gap-4">
        <div className="text-sm text-black/50">
          Showing {startItem} to {endItem} of {totalItems} entries
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange?.(page - 1)}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm border border-black/10 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black/5 flex items-center gap-1"
          >
            ← Previous
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange?.(page + 1)}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-sm border border-black/10 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black/5 flex items-center gap-1"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Main render
  return (
    <div
      className={cn(
        "data-table",
        variantStyles.container,
        densityStyles.container,
        className
      )}
    >
      {/* Bulk actions bar */}
      {renderBulkActionsBar()}
      {/* Table container */}
      <div className={cn("overflow-x-auto", containerClassName)}>
        <table className="w-full">
          {/* Table header */}
          <thead className={cn(variantStyles.header, headerClassName)}>
            <tr>
              {features.rowSelection && (
                <th className="w-12 px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === data.length && data.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 rounded border-near-black text-apple-blue focus:ring-apple-blue"
                  />
                </th>
              )}
              {columns.map((column: ColumnDefinition<T>) => (
                <th
                  key={column.key}
                  className={cn(
                    variantStyles.headerCell,
                    densityStyles.headerCell,
                    column.align === "center" && "text-center",
                    column.align === "right" && "text-right",
                    column.className
                  )}
                  style={{ width: column.width }}
                >
                  <div className="flex items-center gap-1">
                    <span>{column.header}</span>
                    {features.sorting && column.sortable && (
                      <button
                        onClick={() => handleSort(column.key)}
                        className="ml-1 text-near-black hover:text-near-black"
                      >
                        {sortConfig?.key === column.key ? (
                          sortConfig.direction === "asc" ? (
                            "↑"
                          ) : (
                            "↓"
                          )
                        ) : (
                          "↕"
                        )}
                      </button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          {/* Table body */}
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={columns.length + (features.rowSelection ? 1 : 0)}
                  className="px-6 py-12 text-center"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-apple-blue border-t-transparent"></div>
                    <p className="text-sm text-near-black">{loadingMessage}</p>
                  </div>
                </td>
              </tr>
            ) : isEmpty ? (
              <tr>
                <td
                  colSpan={columns.length + (features.rowSelection ? 1 : 0)}
                  className="px-6 py-12 text-center"
                >
                  {emptyState || (
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-12 w-12 rounded-full bg-near-black flex items-center justify-center">
                        <svg
                          className="h-6 w-6 text-near-black"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      <p className="text-sm text-near-black">
                        No data available
                      </p>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              data.map((item: T, index: number) => {
                const key = rowKey(item, index);
                const isSelected = selectedRows.has(key);
                const isEditingRow = editingCell?.rowKey === key;
                return (
                  <tr
                    key={key}
                    className={cn(
                      variantStyles.row,
                      isSelected && variantStyles.selectedRow,
                      typeof rowClassName === "function"
                        ? rowClassName(item, index)
                        : rowClassName,
                      onRowClick && "cursor-pointer"
                    )}
                    onClick={() => onRowClick?.(item, index)}
                  >
                    {features.rowSelection && (
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleRowSelection(key)}
                          className="h-4 w-4 rounded border-near-black text-apple-blue focus:ring-apple-blue"
                        />
                      </td>
                    )}
                    {columns.map((column: ColumnDefinition<T>) => {
                      const isEditingCell =
                        isEditingRow && editingCell?.columnKey === column.key;
                      return (
                        <td
                          key={column.key}
                          className={cn(
                            variantStyles.cell,
                            densityStyles.cell,
                            isEditingCell && variantStyles.editingCell,
                            column.align === "center" && "text-center",
                            column.align === "right" && "text-right",
                            cellClassName
                          )}
                        >
                          {renderEditableCell(
                            item,
                            index,
                            column,
                            isEditingCell
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      {renderPagination()}
    </div>
  );
};