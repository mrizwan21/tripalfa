import React, { ReactNode } from "react";
import { Plus, Download, Filter, Search } from "lucide-react";
interface PageContainerProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
  showSearch?: boolean;
  onSearch?: (value: string) => void;
  showFilter?: boolean;
  onFilterClick?: () => void;
  showAddButton?: boolean;
  onAddClick?: () => void;
  showExportButton?: boolean;
  onExportClick?: () => void;
}
const PageContainer: React.FC<PageContainerProps> = ({
  title,
  subtitle,
  children,
  actions,
  showSearch = false,
  onSearch,
  showFilter = false,
  onFilterClick,
  showAddButton = false,
  onAddClick,
  showExportButton = false,
  onExportClick,
}) => {
  return (
    <div className="space-y-6">
      {" "}
      {/* Header */}{" "}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {" "}
        <div>
          {" "}
          <h1 className="text-2xl font-bold text-near-black">{title}</h1>{" "}
          {subtitle && <p className="text-near-black mt-1">{subtitle}</p>}{" "}
        </div>{" "}
        <div className="flex flex-wrap items-center gap-3">
          {" "}
          {/* Search */}{" "}
          {showSearch && (
            <div className="relative">
              {" "}
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-near-black" />{" "}
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 border border-near-black rounded-lg focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-transparent text-sm"
                onChange={(e) => onSearch?.(e.target.value)}
              />{" "}
            </div>
          )}{" "}
          {/* Filter button */}{" "}
          {showFilter && (
            <button
              onClick={onFilterClick}
              className="inline-flex items-center gap-2 px-4 py-2 border border-near-black rounded-lg text-near-black hover:bg-light-gray text-sm font-medium"
            >
              {" "}
              <Filter className="h-4 w-4" /> Filter{" "}
            </button>
          )}{" "}
          {/* Export button */}{" "}
          {showExportButton && (
            <button
              onClick={onExportClick}
              className="inline-flex items-center gap-2 px-4 py-2 border border-near-black rounded-lg text-near-black hover:bg-light-gray text-sm font-medium"
            >
              {" "}
              <Download className="h-4 w-4" /> Export{" "}
            </button>
          )}{" "}
          {/* Add button */}{" "}
          {showAddButton && (
            <button
              onClick={onAddClick}
              className="inline-flex items-center gap-2 px-4 py-2 bg-apple-blue text-white rounded-lg hover:bg-apple-blue text-sm font-medium"
            >
              {" "}
              <Plus className="h-4 w-4" /> Add New{" "}
            </button>
          )}{" "}
          {/* Custom actions */} {actions}{" "}
        </div>{" "}
      </div>{" "}
      {/* Content */}{" "}
      <div className="bg-white rounded-xl border border-near-black shadow-sm overflow-hidden">
        {" "}
        {children}{" "}
      </div>{" "}
    </div>
  );
};
export default PageContainer;
