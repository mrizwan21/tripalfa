/**
 * Rules Engine Management Interface
 * Modern UI for creating, editing, and managing rules
 */

import React, { useState } from "react";
import * as Icons from "lucide-react";
import { Button } from "@tripalfa/ui-components";

const {
  Plus,
  Edit,
  Trash2,
  Copy,
  Play,
  Pause,
  ChevronDown,
  Filter,
  Search,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Zap,
  Settings,
} = Icons as any;

interface Rule {
  id: string;
  name: string;
  type: "markup" | "commission" | "discount" | "pricing";
  status: "active" | "inactive" | "testing";
  priority: number;
  matchCount: number;
  lastModified: string;
  description: string;
}

interface RulesManagerProps {
  rules?: Rule[];
  onAddRule?: () => void;
  onEditRule?: (rule: Rule) => void;
  onDuplicateRule?: (rule: Rule) => void;
  onDeleteRule?: (rule: Rule) => void;
  onToggleRule?: (rule: Rule) => void;
  canManage?: boolean;
}

export const RulesManager: React.FC<RulesManagerProps> = ({
  rules = [],
  onAddRule,
  onEditRule,
  onDuplicateRule,
  onDeleteRule,
  onToggleRule,
  canManage = true,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string | null>(null);
  const [expandedRule, setExpandedRule] = useState<string | null>(null);
  const [selectedRules, setSelectedRules] = useState<Set<string>>(new Set());

  const filteredRules = rules.filter((rule) => {
    const matchesSearch =
      rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = !filterType || rule.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const getTypeColor = (type: string) => {
    const colors = {
      markup:
        "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900",
      commission:
        "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-900",
      discount:
        "bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900",
      pricing:
        "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900",
    };
    return colors[type as keyof typeof colors] || colors.markup;
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      active: (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900">
          <CheckCircle className="w-3 h-3" />
          Active
        </span>
      ),
      inactive: (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-muted text-foreground border border-border">
          <Pause className="w-3 h-3" />
          Inactive
        </span>
      ),
      testing: (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-900">
          <AlertCircle className="w-3 h-3" />
          Testing
        </span>
      ),
    };
    return badges[status as keyof typeof badges] || badges.inactive;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Rules Engine
          </h1>
          <p className="text-muted-foreground">
            Manage pricing, markup, and commission rules
          </p>
        </div>
        <Button
          variant="outline"
          size="default"
          onClick={onAddRule}
          disabled={!canManage}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg hover:shadow-purple-500/20 transition-all hover:translate-y-[-2px] font-medium"
        >
          <Plus className="w-5 h-5" />
          New Rule
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="bg-card rounded-xl border border-border p-4 flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search rules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Filter Dropdown */}
        <div className="relative">
          <Button
            variant="outline"
            size="default"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-muted text-foreground hover:bg-muted/80 transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filter</span>
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Rules List */}
      <div className="space-y-3">
        {filteredRules.length > 0 ? (
          filteredRules.map((rule) => (
            <div
              key={rule.id}
              className="group bg-card border border-border rounded-xl transition-all duration-300 hover:shadow-lg hover:border-border overflow-hidden"
            >
              {/* Rule Header */}
              <div
                className="p-4 cursor-pointer"
                onClick={() =>
                  setExpandedRule(expandedRule === rule.id ? null : rule.id)
                }
              >
                <div className="flex items-center gap-4">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedRules.has(rule.id)}
                    onChange={(e) => {
                      const newSelected = new Set(selectedRules);
                      if (e.target.checked) {
                        newSelected.add(rule.id);
                      } else {
                        newSelected.delete(rule.id);
                      }
                      setSelectedRules(newSelected);
                    }}
                    className="w-5 h-5 rounded border-border text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />

                  {/* Rule Info */}
                  <div className="flex-1 min-w-0 gap-4">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-foreground truncate">
                        {rule.name}
                      </h3>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold border ${getTypeColor(rule.type)}`}
                      >
                        {rule.type}
                      </span>
                      {getStatusBadge(rule.status)}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {rule.description}
                    </p>
                    <div className="flex gap-6 mt-3 text-xs text-muted-foreground">
                      <span>
                        Priority:{" "}
                        <span className="font-semibold text-foreground">
                          {rule.priority}
                        </span>
                      </span>
                      <span>
                        Matches:{" "}
                        <span className="font-semibold text-foreground">
                          {rule.matchCount.toLocaleString()}
                        </span>
                      </span>
                      <span>
                        Updated:{" "}
                        <span className="font-semibold text-foreground">
                          {rule.lastModified}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="outline"
                      size="default"
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                      title="View"
                    >
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="outline"
                      size="default"
                      disabled={!canManage}
                      className="p-2 hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
                      title="Edit"
                      onClick={(event) => {
                        event.stopPropagation();
                        onEditRule?.(rule);
                      }}
                    >
                      <Edit className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="outline"
                      size="default"
                      disabled={!canManage}
                      className="p-2 hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
                      title="Duplicate"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDuplicateRule?.(rule);
                      }}
                    >
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="outline"
                      size="default"
                      disabled={!canManage}
                      className="p-2 hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
                      title={rule.status === "active" ? "Disable" : "Enable"}
                      onClick={(event) => {
                        event.stopPropagation();
                        onToggleRule?.(rule);
                      }}
                    >
                      {rule.status === "active" ? (
                        <Pause className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <Play className="w-4 h-4 text-muted-foreground" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="default"
                      disabled={!canManage}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDeleteRule?.(rule);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </Button>
                  </div>

                  {/* Expand Toggle */}
                  <ChevronDown
                    className={`w-5 h-5 text-muted-foreground transition-transform ${expandedRule === rule.id ? "rotate-180" : ""}`}
                  />
                </div>
              </div>

              {/* Expanded Details */}
              {expandedRule === rule.id && (
                <div className="border-t border-border p-4 bg-muted/50">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase">
                        Type
                      </p>
                      <p className="text-sm font-medium text-foreground capitalize mt-1">
                        {rule.type}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase">
                        Status
                      </p>
                      <p className="text-sm font-medium text-foreground capitalize mt-1">
                        {rule.status}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase">
                        Match Count
                      </p>
                      <p className="text-sm font-medium text-foreground mt-1">
                        {rule.matchCount.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase">
                        Priority
                      </p>
                      <p className="text-sm font-medium text-foreground mt-1">
                        #{rule.priority}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="default"
                      size="default"
                      disabled={!canManage}
                      className="flex-1 px-4 py-2 rounded-lg text-white hover: transition-colors text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                      onClick={() => onEditRule?.(rule)}
                    >
                      <Edit className="w-4 h-4" />
                      Edit Rule
                    </Button>
                    <Button
                      variant="outline"
                      size="default"
                      disabled={!canManage}
                      className="flex-1 px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted transition-colors text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Zap className="w-4 h-4" />
                      Test
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-card border border-border rounded-xl">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-3">No rules found</p>
            <Button
              variant="default"
              size="default"
              disabled={!canManage}
              className="px-4 py-2 rounded-lg text-white hover: transition-colors text-sm font-medium disabled:opacity-50"
              onClick={onAddRule}
            >
              Create First Rule
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RulesManager;
