import { useState } from 'react';
import { Shield, Users, Plus, Edit2, Trash2, Check, X, Eye } from 'lucide-react';
import { cn } from '../lib/utils';
import { Layout } from '../components/Layout';

const PERMISSIONS = [
  { key: 'booking:view', label: 'View Bookings', module: 'Booking' },
  { key: 'booking:create', label: 'Create Bookings', module: 'Booking' },
  { key: 'booking:edit', label: 'Edit Bookings', module: 'Booking' },
  { key: 'booking:cancel', label: 'Cancel Bookings', module: 'Booking' },
  { key: 'booking:authorize', label: 'Authorize Bookings', module: 'Booking' },
  { key: 'booking:issue', label: 'Issue Tickets', module: 'Booking' },
  { key: 'booking:refund', label: 'Process Refunds', module: 'Booking' },
  { key: 'booking:import-pnr', label: 'Import PNR', module: 'Booking' },
  { key: 'booking:void', label: 'Void Tickets', module: 'Booking' },
  { key: 'booking:reissue', label: 'Reissue Tickets', module: 'Booking' },
  { key: 'finance:view-transactions', label: 'View Transactions', module: 'Finance' },
  { key: 'finance:process-payments', label: 'Process Payments', module: 'Finance' },
  { key: 'finance:manage-credit', label: 'Manage Credit', module: 'Finance' },
  { key: 'finance:view-reports', label: 'View Financial Reports', module: 'Finance' },
  { key: 'finance:export-data', label: 'Export Financial Data', module: 'Finance' },
  { key: 'finance:manage-wallet', label: 'Manage Wallet', module: 'Finance' },
  { key: 'client:view', label: 'View Clients', module: 'Client' },
  { key: 'client:create', label: 'Create Clients', module: 'Client' },
  { key: 'client:edit', label: 'Edit Clients', module: 'Client' },
  { key: 'client:delete', label: 'Delete Clients', module: 'Client' },
  { key: 'client:export', label: 'Export Client Data', module: 'Client' },
  { key: 'client:view-pii', label: 'View PII Data', module: 'Client' },
  { key: 'supplier:view', label: 'View Suppliers', module: 'Supplier' },
  { key: 'supplier:create', label: 'Create Suppliers', module: 'Supplier' },
  { key: 'supplier:edit', label: 'Edit Suppliers', module: 'Supplier' },
  { key: 'supplier:manage-contracts', label: 'Manage Contracts', module: 'Supplier' },
  { key: 'reports:view', label: 'View Reports', module: 'Reports' },
  { key: 'reports:export', label: 'Export Reports', module: 'Reports' },
  { key: 'reports:create-custom', label: 'Create Custom Reports', module: 'Reports' },
  { key: 'reports:audit-log', label: 'View Audit Logs', module: 'Reports' },
  { key: 'admin:manage-users', label: 'Manage Users', module: 'Admin' },
  { key: 'admin:manage-roles', label: 'Manage Roles', module: 'Admin' },
  { key: 'admin:manage-settings', label: 'Manage Settings', module: 'Admin' },
  { key: 'admin:view-audit-logs', label: 'View Audit Logs', module: 'Admin' },
  { key: 'admin:manage-tenants', label: 'Manage Tenants', module: 'Admin' },
  { key: 'admin:provision-database', label: 'Provision Database', module: 'Admin' },
];

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Record<string, boolean>;
  userCount: number;
  isActive: boolean;
}

const DEFAULT_ROLES: Role[] = [
  {
    id: 'role-admin',
    name: 'Admin',
    description: 'Full system access with all permissions',
    permissions: Object.fromEntries(PERMISSIONS.map(p => [p.key, true])),
    userCount: 3,
    isActive: true
  },
  {
    id: 'role-sales',
    name: 'Sales Executive',
    description: 'Sales team member with booking and client access',
    permissions: {
      'booking:view': true,
      'booking:create': true,
      'booking:edit': true,
      'client:view': true,
      'client:create': true,
      'client:edit': true,
      'reports:view': true
    },
    userCount: 8,
    isActive: true
  }
];

export default function RolePermissionPage() {
  const [roles, setRoles] = useState<Role[]>(DEFAULT_ROLES);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPermissions, setEditingPermissions] = useState(false);
  const [tempPermissions, setTempPermissions] = useState<Record<string, boolean>>({});

  const handleSelectRole = (role: Role) => {
    setSelectedRole(role);
    setTempPermissions({ ...role.permissions });
    setEditingPermissions(false);
  };

  const handleTogglePermission = (key: string) => {
    if (!editingPermissions) return;
    setTempPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <Layout>
      <div className="max-w-[1550px] mx-auto pb-20 px-6 pt-8 animate-fade">
        <div className="flex items-end justify-between border-b border-black/5 pb-10">
          <div>
            <h1 className="text-4xl font-bold text-black leading-tight">Role Permissions</h1>
            <p className="text-sm font-medium text-black/40">Configure hierarchical access control matrices.</p>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="px-8 py-3 bg-black text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-xl">Create New Role</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mt-12">
          <div className="bg-white rounded-[2rem] border border-black/5 overflow-hidden shadow-sm">
            <div className="p-8 border-b border-black/5 bg-black/[0.01] text-[10px] font-bold uppercase tracking-widest text-black/40">System Roles</div>
            <div className="divide-y divide-black/5">
              {roles.map(role => (
                <button key={role.id} onClick={() => handleSelectRole(role)} className={cn("w-full p-8 text-left transition-all hover:bg-black/[0.02]", selectedRole?.id === role.id && "bg-black/[0.03] border-l-4 border-black")}>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold text-black">{role.name}</h4>
                    <span className={cn("px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest border", role.isActive ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200")}>{role.isActive ? 'Active' : 'Inactive'}</span>
                  </div>
                  <p className="text-[10px] font-medium text-black/40 uppercase tracking-widest leading-relaxed">{role.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedRole ? (
              <div className="bg-white rounded-[2.5rem] border border-black/5 p-12 shadow-sm">
                <div className="flex justify-between items-center mb-12">
                  <div>
                    <h2 className="text-2xl font-bold text-black">{selectedRole.name}</h2>
                    <p className="text-xs font-bold text-black/20 uppercase tracking-widest mt-1">Permission Matrix</p>
                  </div>
                  <button onClick={() => setEditingPermissions(!editingPermissions)} className="px-6 py-2.5 bg-black text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg">{editingPermissions ? 'Commit Changes' : 'Edit Matrix'}</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {PERMISSIONS.map(perm => (
                    <button key={perm.key} onClick={() => handleTogglePermission(perm.key)} className={cn("p-6 rounded-2xl border-2 transition-all text-left group", tempPermissions[perm.key] ? "border-black bg-black text-white" : "border-black/5 hover:border-black/20")}>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-1">{perm.module}</p>
                          <p className="text-sm font-bold">{perm.label}</p>
                        </div>
                        {tempPermissions[perm.key] ? <Check size={18} /> : <X size={18} className="opacity-10 group-hover:opacity-100" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-24 bg-black/[0.01] rounded-[2.5rem] border border-black/5 border-dashed">
                <Shield size={64} className="text-black/5 mb-6" />
                <p className="text-[10px] font-bold text-black/20 uppercase tracking-widest">Select a role to inspect matrix.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
