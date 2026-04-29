export type Permission =
  | "tenant:read"
  | "tenant:write"
  | "tenant:delete"
  | "tenant:manage-access"
  | "staff:read"
  | "staff:write"
  | "staff:delete"
  | "role:read"
  | "role:write"
  | "role:delete"
  | "supplier:read"
  | "supplier:write"
  | "supplier:delete"
  | "revenue:read"
  | "revenue:write"
  | "revenue:delete"
  | "tax:read"
  | "tax:write"
  | "tax:delete"
  | "markup:read"
  | "markup:write"
  | "markup:delete"
  | "commission:read"
  | "commission:write"
  | "commission:delete"
  | "config:read"
  | "config:write"
  | "config:delete"
  | "payment:read"
  | "payment:write"
  | "payment:delete"
  | "theme:read"
  | "theme:write"
  | "theme:delete"
  | "booking:read"
  | "booking:write"
  | "booking:delete"
  | "report:read"
  | "audit:read"
  | "settings:read"
  | "settings:write";

export type RoleType = "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "AGENT" | "SUPPORT";

export interface Role {
  id: string;
  name: string;
  type: RoleType;
  permissions: Permission[];
  description?: string;
  isSystem?: boolean;
}

export interface TenantHierarchyNode {
  id: string;
  name: string;
  type: "MASTER_AGENCY" | "SUB_AGENT" | "INDIVIDUAL_AGENT";
  status: "ACTIVE" | "SUSPENDED" | "ARCHIVED";
  children?: TenantHierarchyNode[];
  domain?: string;
  creditLimit?: number;
  agentCode?: string;
  parentId?: string;
}