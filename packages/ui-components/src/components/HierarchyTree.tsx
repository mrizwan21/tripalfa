import * as React from "react";
import { useState } from "react";
import { ChevronRight, ChevronDown, Building2, Users, User, MoreHorizontal, Plus } from "lucide-react";

export interface HierarchyTreeNode {
  id: string;
  name: string;
  type: "MASTER_AGENCY" | "SUB_AGENT" | "INDIVIDUAL_AGENT";
  status: "ACTIVE" | "SUSPENDED" | "ARCHIVED";
  children?: HierarchyTreeNode[];
  domain?: string;
  creditLimit?: number;
  agentCode?: string;
  [key: string]: unknown;
}

export interface HierarchyTreeProps {
  nodes: HierarchyTreeNode[];
  selectedId?: string | null;
  onNodeSelect?: (node: HierarchyTreeNode) => void;
  onNodeEdit?: (node: HierarchyTreeNode) => void;
  onNodeDelete?: (node: HierarchyTreeNode) => void;
  onNodeAddChild?: (parentNode: HierarchyTreeNode) => void;
  showActions?: boolean;
  showAddChild?: boolean;
  variant?: "default" | "compact" | "detailed";
  className?: string;
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-apple-blue/10 text-apple-blue",
  SUSPENDED: "bg-near-black/10 text-near-black",
  ARCHIVED: "bg-near-black text-near-black",
};

const typeIcons: Record<string, React.ReactNode> = {
  MASTER_AGENCY: <Building2 className="h-4 w-4 text-apple-blue" />,
  SUB_AGENT: <Users className="h-4 w-4 text-apple-blue" />,
  INDIVIDUAL_AGENT: <User className="h-4 w-4 text-apple-blue" />,
};

interface TreeNodeProps {
  node: HierarchyTreeNode;
  level: number;
  selectedId?: string | null;
  onNodeSelect?: (node: HierarchyTreeNode) => void;
  onNodeEdit?: (node: HierarchyTreeNode) => void;
  onNodeDelete?: (node: HierarchyTreeNode) => void;
  onNodeAddChild?: (parentNode: HierarchyTreeNode) => void;
  showActions: boolean;
  showAddChild: boolean;
  variant: "default" | "compact" | "detailed";
}

function TreeNode({
  node,
  level,
  selectedId,
  onNodeSelect,
  onNodeEdit,
  onNodeDelete,
  onNodeAddChild,
  showActions,
  showAddChild,
  variant,
}: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId === node.id;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleSelect = () => {
    onNodeSelect?.(node);
  };

  return (
    <div className="select-none">
      <div
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors
          ${isSelected ? "bg-apple-blue/10 border border-apple-blue" : "hover:bg-near-black border border-transparent"}
          ${variant === "compact" ? "px-2 py-1.5" : ""}
        `}
        style={{ paddingLeft: `${level * 24 + 12}px` }}
        onClick={handleSelect}
      >
        <button
          onClick={handleToggle}
          className={`p-0.5 rounded hover:bg-near-black transition-colors ${!hasChildren ? "invisible" : ""}`}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4 text-near-black" />
            ) : (
              <ChevronRight className="h-4 w-4 text-near-black" />
            )
          ) : (
            <span className="w-4" />
          )}
        </button>

        {typeIcons[node.type] || <Building2 className="h-4 w-4 text-near-black" />}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`font-medium truncate ${variant === "detailed" ? "text-sm" : "text-sm"}`}>
              {node.name}
            </span>
            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${statusColors[node.status] || statusColors.ARCHIVED}`}>
              {node.status}
            </span>
          </div>

          {variant === "detailed" && (
            <div className="flex items-center gap-3 mt-0.5 text-xs text-near-black">
              {node.agentCode && <span>Code: {node.agentCode}</span>}
              {node.domain && <span>{node.domain}</span>}
              {node.creditLimit !== undefined && <span>Credit: ${node.creditLimit.toLocaleString()}</span>}
              {hasChildren && <span>{node.children!.length} sub-agencies</span>}
            </div>
          )}
        </div>

        {variant === "default" && hasChildren && (
          <span className="text-xs text-near-black">{node.children!.length}</span>
        )}

        {showActions && (
          <div className="flex items-center gap-1">
            {showAddChild && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNodeAddChild?.(node);
                }}
                className="p-1 rounded hover:bg-near-black transition-colors"
                title="Add sub-agency"
              >
                <Plus className="h-3.5 w-3.5 text-near-black" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNodeEdit?.(node);
              }}
              className="p-1 rounded hover:bg-near-black transition-colors"
              title="Edit"
            >
              <MoreHorizontal className="h-3.5 w-3.5 text-near-black" />
            </button>
          </div>
        )}
      </div>

      {hasChildren && isExpanded && (
        <div>
          {node.children!.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              selectedId={selectedId}
              onNodeSelect={onNodeSelect}
              onNodeEdit={onNodeEdit}
              onNodeDelete={onNodeDelete}
              onNodeAddChild={onNodeAddChild}
              showActions={showActions}
              showAddChild={showAddChild}
              variant={variant}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function HierarchyTree({
  nodes,
  selectedId,
  onNodeSelect,
  onNodeEdit,
  onNodeDelete,
  onNodeAddChild,
  showActions = true,
  showAddChild = true,
  variant = "default",
  className = "",
}: HierarchyTreeProps) {
  if (nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-near-black">
        <Building2 className="h-12 w-12 mb-2 text-near-black" />
        <p className="text-sm">No agencies found</p>
      </div>
    );
  }

  return (
    <div className={`space-y-1 ${className}`}>
      {nodes.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          level={0}
          selectedId={selectedId}
          onNodeSelect={onNodeSelect}
          onNodeEdit={onNodeEdit}
          onNodeDelete={onNodeDelete}
          onNodeAddChild={onNodeAddChild}
          showActions={showActions}
          showAddChild={showAddChild}
          variant={variant}
        />
      ))}
    </div>
  );
}