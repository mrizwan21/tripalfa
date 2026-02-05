declare module '@tripalfa/shared-types' {
  export interface Tenant {
    id: string;
    name: string;
    active: boolean;
  }

  export interface SuperAdminNotification {
    id: string;
    tenantId: string;
    type: string;
    message: string;
    createdAt: string;
  }
}
