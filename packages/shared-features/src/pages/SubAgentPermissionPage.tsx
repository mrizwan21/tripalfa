import { useState } from 'react';
import { Shield, Users, Plus, Edit2, Check, X, AlertCircle, Info } from 'lucide-react';
import { cn } from '../lib/utils';
import { ProfileLayout } from './ProfilePage';

interface SubAgentPermission {
  key: string;
  label: string;
  description: string;
  category: string;
  requiresDependency?: string;
}

interface SubAgentRole {
  id: string;
  name: string;
  description: string;
  permissions: Record<string, boolean>;
  userCount: number;
  isActive: boolean;
}

const SUB_AGENT_PERMISSIONS: SubAgentPermission[] = [
  {
    key: 'canManageBranches',
    label: 'Manage Branches / B2B2B',
    description: 'If selected, the B2B user can create multiple branches of his sub agency, also if he is given with the distributor rights they can create multiple agencies and associate the branches with them.',
    category: 'Branch & Agency Management'
  },
  {
    key: 'canManageUsers',
    label: 'Manage Users',
    description: 'By selecting this option, the travel agent is giving the subagent rights to create multiple users under his sub agency, the rights and access of the users will be decided by the subagent at his dashboard only.',
    category: 'User Management'
  },
  {
    key: 'canManageRoles',
    label: 'Manage Roles',
    description: 'With this option the subagent will have the option to choose the roles for his user.',
    category: 'User Management'
  },
  {
    key: 'canManageMarkups',
    label: 'Manage Markups & Commissions',
    description: 'If the X host wants to provide the rights to his subagent for managing his own markups then this check box needs to be selected, otherwise the subagent will not have the option to add his own markup.',
    category: 'Financial Management'
  },
  {
    key: 'canManageCreditCards',
    label: 'Manage Credit Card',
    description: 'Allow sub-agent to manage credit card details and payment methods for transactions.',
    category: 'Financial Management'
  },
  {
    key: 'canAccessGDSTerminal',
    label: 'GDS Terminal',
    description: 'X host can provide the GDS terminal access to the subagent for direct GDS operations and booking management.',
    category: 'GDS Access'
  },
  {
    key: 'canImportPNR',
    label: 'Import PNR from GDS',
    description: 'X host can provide the rights to the subagent to import the PNRs created on GDS. For this the subagent should also have the access of the GDS terminal.',
    category: 'GDS Access',
    requiresDependency: 'canAccessGDSTerminal'
  },
  {
    key: 'canAllowAutoTicket',
    label: 'Allow Auto Ticket',
    description: 'This feature will allow the auto ticketing activated for the subagent search and book process also, if the auto ticketing is activated at the company level.',
    category: 'Booking Operations'
  },
  {
    key: 'canAccessIITFare',
    label: 'IIT Fares',
    description: 'Provide access to IIT (Inclusive Tour) fares for the subagent booking operations.',
    category: 'Booking Operations'
  },
  {
    key: 'canManageSupplierCreds',
    label: 'Manage Supplier Credentials',
    description: 'This feature will allow the subagent to add their own suppliers in the B2B dashboard.',
    category: 'Supplier & Payment Management'
  },
  {
    key: 'canManagePGCreds',
    label: 'Manage PG Details',
    description: 'Allow sub-agent to manage Payment Gateway details for processing transactions.',
    category: 'Supplier & Payment Management'
  },
  {
    key: 'showLogoOnDashboard',
    label: 'B2B Logo on B2B Dashboard',
    description: 'This feature will allow the display of the B2B logo on the B2B dashboard when the user will login.',
    category: 'Branding & Display'
  }
];

const DEFAULT_SUB_AGENT_ROLES: SubAgentRole[] = [
  {
    id: 'role-sub-admin',
    name: 'Sub-Agent Admin',
    description: 'Full sub-agent access with all permissions including branches, users, markups, GDS terminal, and supplier management',
    permissions: SUB_AGENT_PERMISSIONS.reduce((acc, p) => ({ ...acc, [p.key]: true }), {}),
    userCount: 3,
    isActive: true
  },
  {
    id: 'role-sales-manager',
    name: 'Sales Manager',
    description: 'Can manage users, roles, and view bookings. No access to financial settings or GDS operations.',
    permissions: {
      canManageUsers: true,
      canManageRoles: true,
      canManageBranches: true,
      showLogoOnDashboard: true
    },
    userCount: 8,
    isActive: true
  }
];

const CATEGORY_GROUPS = SUB_AGENT_PERMISSIONS.reduce((acc, perm) => {
  if (!acc[perm.category]) {
    acc[perm.category] = [];
  }
  acc[perm.category].push(perm);
  return acc;
}, {} as Record<string, SubAgentPermission[]>);

export default function SubAgentPermissionPage() {
  const [roles, setRoles] = useState<SubAgentRole[]>(DEFAULT_SUB_AGENT_ROLES);
  const [selectedRole, setSelectedRole] = useState<SubAgentRole | null>(null);
  const [editingPermissions, setEditingPermissions] = useState(false);
  const [tempPermissions, setTempPermissions] = useState<Record<string, boolean>>({});

  const handleSelectRole = (role: SubAgentRole) => {
    setSelectedRole(role);
    setTempPermissions({ ...role.permissions });
    setEditingPermissions(false);
  };

  const handleTogglePermission = (key: string) => {
    if (!editingPermissions) return;
    
    // Simple toggle logic for demo
    setTempPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSavePermissions = () => {
    if (!selectedRole) return;
    
    const updatedRoles = roles.map(r =>
      r.id === selectedRole.id
        ? { ...r, permissions: tempPermissions }
        : r
    );
    
    setRoles(updatedRoles);
    setSelectedRole({ ...selectedRole, permissions: tempPermissions });
    setEditingPermissions(false);
  };

  return (
    <ProfileLayout>
      <div className="max-w-[1550px] mx-auto pb-20 px-6 pt-8">
        <div className="mb-8 flex items-end justify-between border-b border-black/10 pb-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold text-black leading-none">
              Sub-Agent <span className="text-apple-blue">Permissions</span>
            </h1>
            <p className="text-xs font-bold text-black/20 uppercase tracking-widest">
              Hierarchical access control for secondary tenants
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-12">
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-black/5 bg-black/[0.01]">
                <h2 className="text-sm font-bold text-black uppercase tracking-widest flex items-center gap-3">
                  <Shield size={18} className="text-apple-blue" />
                  Access Profiles
                </h2>
              </div>
              <div className="divide-y divide-black/5">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => handleSelectRole(role)}
                    className={cn(
                      "w-full p-8 text-left hover:bg-black/[0.01] transition-all",
                      selectedRole?.id === role.id && "bg-black/[0.02] border-l-4 border-l-apple-blue"
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-sm font-bold text-black">{role.name}</h3>
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[9px] font-bold border uppercase",
                        role.isActive ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-600 border-red-200"
                      )}>
                        {role.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-[10px] text-black/40 mb-6 font-medium">{role.description}</p>
                    <div className="flex items-center justify-between text-[10px] font-bold text-black/20 uppercase tracking-widest">
                      <span>{role.userCount} users</span>
                      <span className="text-apple-blue">
                        {Object.values(role.permissions || {}).filter(Boolean).length}/{SUB_AGENT_PERMISSIONS.length} rights
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-black/5 shadow-sm overflow-hidden min-h-[600px]">
            {selectedRole ? (
              <div className="flex flex-col h-full">
                <div className="p-10 border-b border-black/5 bg-black/[0.01] flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-black">{selectedRole.name}</h2>
                    <p className="text-[10px] font-bold text-black/20 uppercase tracking-widest mt-1">Configuration Matrix</p>
                  </div>
                  <div className="flex items-center gap-4">
                    {editingPermissions ? (
                      <button onClick={handleSavePermissions} className="px-8 py-3 bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-xl">Save Changes</button>
                    ) : (
                      <button onClick={() => setEditingPermissions(true)} className="px-8 py-3 bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:scale-105 transition-all">Edit Rights</button>
                    )}
                  </div>
                </div>

                <div className="p-10 space-y-12">
                  {Object.entries(CATEGORY_GROUPS).map(([category, perms]) => (
                    <div key={category} className="space-y-6">
                      <h3 className="text-[10px] font-bold text-black/20 uppercase tracking-widest border-l-4 border-apple-blue pl-4">{category}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {perms.map((perm) => {
                          const isEnabled = tempPermissions[perm.key] || false;
                          return (
                            <div
                              key={perm.key}
                              onClick={() => handleTogglePermission(perm.key)}
                              className={cn(
                                "p-6 rounded-2xl border transition-all cursor-pointer",
                                isEnabled ? "bg-black text-apple-blue border-transparent shadow-xl" : "bg-black/[0.02] border-black/5 hover:bg-black/[0.04]"
                              )}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold uppercase tracking-tight">{perm.label}</span>
                                {isEnabled ? <Check size={16} /> : <X size={16} className="opacity-20" />}
                              </div>
                              <p className={cn("text-[10px] font-medium leading-relaxed", isEnabled ? "text-white/40" : "text-black/30")}>
                                {perm.description}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-48 text-center bg-black/[0.01]">
                <Shield size={64} className="text-black/5 mb-6" />
                <h3 className="text-sm font-bold text-black uppercase tracking-widest">Select an access profile</h3>
                <p className="text-[10px] font-bold text-black/20 uppercase tracking-widest mt-2">To configure hierarchical permissions</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProfileLayout>
  );
}
