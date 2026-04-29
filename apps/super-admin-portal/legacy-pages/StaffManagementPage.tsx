import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  FormField,
  Badge,
  InteractiveModal,
  TabNavigator,
  TabItem,
  Checkbox,
} from "@tripalfa/ui-components";
import {
  Plus,
  Edit,
  Trash2,
  UserCog,
  Key,
  Shield,
  Users,
  Mail,
  Phone,
  Building,
  Save,
} from "lucide-react";
import {
  fetchStaffMembers,
  createStaffMember,
  updateStaffMember,
  deleteStaffMember,
  type StaffMember,
  fetchRoles,
  createRole,
  type Role,
} from "../services/staffService";
const PermissionCategories = [
  {
    category: "Tenant",
    permissions: [
      {
        id: "tenant:read",
        name: "View Tenants",
        description: "View tenant list and details",
      },
      {
        id: "tenant:write",
        name: "Manage Tenants",
        description: "Create and edit tenants",
      },
      {
        id: "tenant:delete",
        name: "Delete Tenants",
        description: "Delete tenants",
      },
      {
        id: "tenant:manage-access",
        name: "Manage Access",
        description: "Configure tenant access and features",
      },
    ],
  },
  {
    category: "Staff",
    permissions: [
      {
        id: "staff:read",
        name: "View Staff",
        description: "View staff members",
      },
      {
        id: "staff:write",
        name: "Manage Staff",
        description: "Create and edit staff",
      },
      {
        id: "staff:delete",
        name: "Delete Staff",
        description: "Remove staff members",
      },
    ],
  },
  {
    category: "Roles",
    permissions: [
      {
        id: "role:read",
        name: "View Roles",
        description: "View roles and permissions",
      },
      {
        id: "role:write",
        name: "Manage Roles",
        description: "Create and edit roles",
      },
      { id: "role:delete", name: "Delete Roles", description: "Delete roles" },
    ],
  },
  {
    category: "Suppliers",
    permissions: [
      {
        id: "supplier:read",
        name: "View Suppliers",
        description: "View supplier list",
      },
      {
        id: "supplier:write",
        name: "Manage Suppliers",
        description: "Configure suppliers",
      },
      {
        id: "supplier:delete",
        name: "Delete Suppliers",
        description: "Delete suppliers",
      },
    ],
  },
  {
    category: "Revenue",
    permissions: [
      {
        id: "revenue:read",
        name: "View Revenue",
        description: "View revenue reports",
      },
      {
        id: "revenue:write",
        name: "Manage Revenue Rules",
        description: "Configure revenue rules",
      },
      { id: "tax:read", name: "View Tax Rules", description: "View tax rules" },
      {
        id: "tax:write",
        name: "Manage Tax Rules",
        description: "Configure tax rules",
      },
      {
        id: "markup:read",
        name: "View Markup Rules",
        description: "View markup rules",
      },
      {
        id: "markup:write",
        name: "Manage Markup Rules",
        description: "Configure markup rules",
      },
    ],
  },
  {
    category: "System",
    permissions: [
      {
        id: "config:read",
        name: "View Config",
        description: "View system config",
      },
      {
        id: "config:write",
        name: "Manage Config",
        description: "Configure system settings",
      },
      { id: "theme:read", name: "View Themes", description: "View themes" },
      {
        id: "theme:write",
        name: "Manage Themes",
        description: "Configure themes",
      },
      {
        id: "settings:read",
        name: "View Settings",
        description: "View settings",
      },
      {
        id: "settings:write",
        name: "Manage Settings",
        description: "Modify settings",
      },
    ],
  },
  {
    category: "Reports",
    permissions: [
      { id: "report:read", name: "View Reports", description: "View reports" },
      {
        id: "audit:read",
        name: "View Audit Logs",
        description: "View audit trail",
      },
    ],
  },
];
const StaffManagementPage = () => {
  const [activeTab, setActiveTab] = useState<string>("staff");
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [staffFormData, setStaffFormData] = useState({
    name: "",
    email: "",
    role: "AGENT",
    isActive: true,
  });
  const [roleFormData, setRoleFormData] = useState({
    name: "",
    description: "",
    permissions: [] as string[],
  });
  const tabs: TabItem[] = [
    {
      id: "staff",
      label: "Staff Members",
      icon: <Users className="h-4 w-4" />,
    },
    {
      id: "roles",
      label: "Roles & Permissions",
      icon: <Key className="h-4 w-4" />,
    },
  ];
  useEffect(() => {
    loadData();
  }, []);
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [staffData, rolesData] = await Promise.all([
        fetchStaffMembers(),
        fetchRoles(),
      ]);
      setStaffMembers(staffData);
      setRoles(rolesData);
    } catch (err) {
      console.error("Failed to load data:", err);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };
  const handleCreateStaff = async () => {
    try {
      if (editingStaff) {
        const updated = await updateStaffMember(editingStaff.id, staffFormData);
        setStaffMembers(
          staffMembers.map((s) => (s.id === editingStaff.id ? updated : s)),
        );
      } else {
        const created = await createStaffMember(staffFormData);
        setStaffMembers([...staffMembers, created]);
      }
      setIsStaffModalOpen(false);
      setEditingStaff(null);
      resetStaffForm();
    } catch (err) {
      console.error("Failed to save staff:", err);
      alert(`Failed to save: ${(err as Error).message}`);
    }
  };
  const handleDeleteStaff = async (id: string) => {
    if (!confirm("Delete this staff member?")) return;
    try {
      await deleteStaffMember(id);
      setStaffMembers(staffMembers.filter((s) => s.id !== id));
    } catch (err) {
      console.error("Failed to delete staff:", err);
      alert(`Failed to delete: ${(err as Error).message}`);
    }
  };
  const handleCreateRole = async () => {
    try {
      if (editingRole) {
        const updated = await updateRole(editingRole.id, roleFormData);
        setRoles(roles.map((r) => (r.id === editingRole.id ? updated : r)));
      } else {
        const created = await createRole(roleFormData);
        setRoles([...roles, created]);
      }
      setIsRoleModalOpen(false);
      setEditingRole(null);
      resetRoleForm();
    } catch (err) {
      console.error("Failed to save role:", err);
      alert(`Failed to save: ${(err as Error).message}`);
    }
  };
  const handleDeleteRole = async (id: string) => {
    if (!confirm("Delete this role?")) return;
    try {
      await deleteRole(id);
      setRoles(roles.filter((r) => r.id !== id));
    } catch (err) {
      console.error("Failed to delete role:", err);
      alert(`Failed to delete: ${(err as Error).message}`);
    }
  };
  const resetStaffForm = () => {
    setStaffFormData({ name: "", email: "", role: "AGENT", isActive: true });
  };
  const resetRoleForm = () => {
    setRoleFormData({ name: "", description: "", permissions: [] });
  };
  const openStaffModal = (staff?: StaffMember) => {
    if (staff) {
      setEditingStaff(staff);
      setStaffFormData({
        name: staff.name,
        email: staff.email,
        role: staff.role,
        isActive: true,
      });
    } else {
      setEditingStaff(null);
      resetStaffForm();
    }
    setIsStaffModalOpen(true);
  };
  const openRoleModal = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      setRoleFormData({
        name: role.name,
        description: role.description || "",
        permissions: role.permissions,
      });
    } else {
      setEditingRole(null);
      resetRoleForm();
    }
    setIsRoleModalOpen(true);
  };
  const togglePermission = (permissionId: string) => {
    setRoleFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter((p) => p !== permissionId)
        : [...prev.permissions, permissionId],
    }));
  };
  return (
    <div className="space-y-6">
      {" "}
      <div className="flex items-center justify-between">
        {" "}
        <div>
          {" "}
          <h2 className="text-2xl font-bold text-near-black">
            Staff & Access Control
          </h2>{" "}
          <p className="text-near-black mt-0.5">
            Manage staff members, roles, and permissions
          </p>{" "}
        </div>{" "}
      </div>{" "}
      <TabNavigator
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        variant="underline"
      />{" "}
      {activeTab === "staff" && (
        <div className="space-y-4">
          {" "}
          <div className="flex justify-end">
            {" "}
            <Button onClick={() => openStaffModal()}>
              {" "}
              <Plus className="h-4 w-4 mr-2" /> Add Staff Member{" "}
            </Button>{" "}
          </div>{" "}
          <Card className="overflow-hidden">
            {" "}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                {" "}
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-apple-blue" />{" "}
              </div>
            ) : error ? (
              <div className="p-8 text-center text-near-black">{error}</div>
            ) : staffMembers.length === 0 ? (
              <div className="p-8 text-center text-near-black">
                {" "}
                <Users className="h-12 w-12 mx-auto text-near-black mb-2" />{" "}
                <p>No staff members found</p>{" "}
                <Button onClick={() => openStaffModal()} className="mt-4">
                  {" "}
                  Add First Staff Member{" "}
                </Button>{" "}
              </div>
            ) : (
              <div className="overflow-x-auto">
                {" "}
                <table className="min-w-full divide-y divide-black/5">
                  {" "}
                  <thead className="bg-near-black">
                    {" "}
                    <tr>
                      {" "}
                      <th className="px-6 py-3 text-left text-xs font-medium text-near-black uppercase">
                        Name
                      </th>{" "}
                      <th className="px-6 py-3 text-left text-xs font-medium text-near-black uppercase">
                        Email
                      </th>{" "}
                      <th className="px-6 py-3 text-left text-xs font-medium text-near-black uppercase">
                        Role
                      </th>{" "}
                      <th className="px-6 py-3 text-left text-xs font-medium text-near-black uppercase">
                        Status
                      </th>{" "}
                      <th className="px-6 py-3 text-right text-xs font-medium text-near-black uppercase">
                        Actions
                      </th>{" "}
                    </tr>{" "}
                  </thead>{" "}
                  <tbody className="bg-white divide-y divide-black/5">
                    {" "}
                    {staffMembers.map((staff) => (
                      <tr key={staff.id}>
                        {" "}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {" "}
                          <div className="flex items-center gap-3">
                            {" "}
                            <div className="w-8 h-8 rounded-full bg-apple-blue/10 flex items-center justify-center">
                              {" "}
                              <span className="text-apple-blue font-medium text-sm">
                                {" "}
                                {staff.name.charAt(0).toUpperCase()}{" "}
                              </span>{" "}
                            </div>{" "}
                            <span className="font-medium">
                              {staff.name}
                            </span>{" "}
                          </div>{" "}
                        </td>{" "}
                        <td className="px-6 py-4 whitespace-nowrap text-near-black">
                          {staff.email}
                        </td>{" "}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {" "}
                          <Badge variant="outline">{staff.role}</Badge>{" "}
                        </td>{" "}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {" "}
                          <Badge
                            variant={staff.isActive ? "success" : "secondary"}
                          >
                            {" "}
                            {staff.isActive ? "Active" : "Inactive"}{" "}
                          </Badge>{" "}
                        </td>{" "}
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          {" "}
                          <div className="flex justify-end gap-2">
                            {" "}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openStaffModal(staff)}
                            >
                              {" "}
                              <Edit className="h-4 w-4" />{" "}
                            </Button>{" "}
                            <Button
                              size="sm"
                              variant="secondary"
                              className="text-near-black border-red-300"
                              onClick={() => handleDeleteStaff(staff.id)}
                            >
                              {" "}
                              <Trash2 className="h-4 w-4" />{" "}
                            </Button>{" "}
                          </div>{" "}
                        </td>{" "}
                      </tr>
                    ))}{" "}
                  </tbody>{" "}
                </table>{" "}
              </div>
            )}{" "}
          </Card>{" "}
        </div>
      )}{" "}
      {activeTab === "roles" && (
        <div className="space-y-4">
          {" "}
          <div className="flex justify-end">
            {" "}
            <Button onClick={() => openRoleModal()}>
              {" "}
              <Plus className="h-4 w-4 mr-2" /> Add Role{" "}
            </Button>{" "}
          </div>{" "}
          <Card className="p-6">
            {" "}
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              {" "}
              <Key className="h-5 w-5 text-apple-blue" /> Role Management{" "}
            </h3>{" "}
            {roles.length === 0 ? (
              <div className="text-center py-8 text-near-black">
                {" "}
                <Key className="h-12 w-12 mx-auto text-near-black mb-2" />{" "}
                <p>No custom roles found</p>{" "}
              </div>
            ) : (
              <div className="overflow-x-auto">
                {" "}
                <table className="min-w-full divide-y divide-black/5">
                  {" "}
                  <thead className="bg-near-black">
                    {" "}
                    <tr>
                      {" "}
                      <th className="px-6 py-3 text-left text-xs font-medium text-near-black uppercase">
                        Role
                      </th>{" "}
                      <th className="px-6 py-3 text-left text-xs font-medium text-near-black uppercase">
                        Permissions
                      </th>{" "}
                      <th className="px-6 py-3 text-right text-xs font-medium text-near-black uppercase">
                        Actions
                      </th>{" "}
                    </tr>{" "}
                  </thead>{" "}
                  <tbody className="bg-white divide-y divide-black/5">
                    {" "}
                    {roles.map((role) => (
                      <tr key={role.id}>
                        {" "}
                        <td className="px-6 py-4 whitespace-nowrap font-medium">
                          {role.name}
                        </td>{" "}
                        <td className="px-6 py-4">
                          {" "}
                          <div className="flex flex-wrap gap-1">
                            {" "}
                            {role.permissions.slice(0, 5).map((p) => (
                              <Badge
                                key={p}
                                variant="outline"
                                className="text-xs"
                              >
                                {" "}
                                {p}{" "}
                              </Badge>
                            ))}{" "}
                            {role.permissions.length > 5 && (
                              <Badge variant="secondary" className="text-xs">
                                {" "}
                                +{role.permissions.length - 5} more{" "}
                              </Badge>
                            )}{" "}
                          </div>{" "}
                        </td>{" "}
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          {" "}
                          <div className="flex justify-end gap-2">
                            {" "}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openRoleModal(role)}
                            >
                              {" "}
                              <Edit className="h-4 w-4" />{" "}
                            </Button>{" "}
                            <Button
                              size="sm"
                              variant="secondary"
                              className="text-near-black border-red-300"
                              onClick={() => handleDeleteRole(role.id)}
                            >
                              {" "}
                              <Trash2 className="h-4 w-4" />{" "}
                            </Button>{" "}
                          </div>{" "}
                        </td>{" "}
                      </tr>
                    ))}{" "}
                  </tbody>{" "}
                </table>{" "}
              </div>
            )}{" "}
          </Card>{" "}
          <Card className="p-6">
            {" "}
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              {" "}
              <Shield className="h-5 w-5 text-apple-blue" /> Permission
              Reference{" "}
            </h3>{" "}
            <div className="space-y-6">
              {" "}
              {PermissionCategories.map((category) => (
                <div key={category.category}>
                  {" "}
                  <h4 className="font-medium text-near-black mb-2">
                    {category.category}
                  </h4>{" "}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {" "}
                    {category.permissions.map((perm) => (
                      <div
                        key={perm.id}
                        className="flex items-start gap-2 p-2 bg-near-black rounded"
                      >
                        {" "}
                        <Checkbox
                          checked={roleFormData.permissions.includes(perm.id)}
                          onChange={() => togglePermission(perm.id)}
                        />{" "}
                        <div>
                          {" "}
                          <p className="font-medium text-sm">
                            {perm.name}
                          </p>{" "}
                          <p className="text-xs text-near-black">
                            {perm.description}
                          </p>{" "}
                        </div>{" "}
                      </div>
                    ))}{" "}
                  </div>{" "}
                </div>
              ))}{" "}
            </div>{" "}
          </Card>{" "}
        </div>
      )}{" "}
      <InteractiveModal
        isOpen={isStaffModalOpen}
        onClose={() => {
          setIsStaffModalOpen(false);
          setEditingStaff(null);
          resetStaffForm();
        }}
        title={editingStaff ? "Edit Staff Member" : "Add Staff Member"}
        variant="super-admin"
        size="md"
      >
        {" "}
        <div className="space-y-4">
          {" "}
          <FormField
            label="Full Name"
            type="text"
            value={staffFormData.name}
            onChange={(e) =>
              setStaffFormData({ ...staffFormData, name: e.target.value })
            }
            placeholder="Enter full name"
            required
          />{" "}
          <FormField
            label="Email"
            type="email"
            value={staffFormData.email}
            onChange={(e) =>
              setStaffFormData({ ...staffFormData, email: e.target.value })
            }
            placeholder="staff@example.com"
            required
          />{" "}
          <FormField
            label="Role"
            type="select"
            value={staffFormData.role}
            onChange={(value) =>
              setStaffFormData({ ...staffFormData, role: value })
            }
            options={[
              { value: "ADMIN", label: "Administrator" },
              { value: "MANAGER", label: "Manager" },
              { value: "AGENT", label: "Agent" },
              { value: "SUPPORT", label: "Support" },
              { value: "FINANCE", label: "Finance" },
            ]}
          />{" "}
          <div className="flex justify-end gap-3 pt-4">
            {" "}
            <Button
              variant="outline"
              onClick={() => {
                setIsStaffModalOpen(false);
                setEditingStaff(null);
                resetStaffForm();
              }}
            >
              {" "}
              Cancel{" "}
            </Button>{" "}
            <Button onClick={handleCreateStaff}>
              {editingStaff ? "Update" : "Create"}
            </Button>{" "}
          </div>{" "}
        </div>{" "}
      </InteractiveModal>{" "}
      <InteractiveModal
        isOpen={isRoleModalOpen}
        onClose={() => {
          setIsRoleModalOpen(false);
          setEditingRole(null);
          resetRoleForm();
        }}
        title={editingRole ? "Edit Role" : "Create Role"}
        variant="super-admin"
        size="lg"
      >
        {" "}
        <div className="space-y-4">
          {" "}
          <FormField
            label="Role Name"
            type="text"
            value={roleFormData.name}
            onChange={(e) =>
              setRoleFormData({ ...roleFormData, name: e.target.value })
            }
            placeholder="e.g., Sales Manager"
            required
          />{" "}
          <FormField
            label="Description"
            type="text"
            value={roleFormData.description}
            onChange={(e) =>
              setRoleFormData({ ...roleFormData, description: e.target.value })
            }
            placeholder="Brief description of this role"
          />{" "}
          <div>
            {" "}
            <label className="block text-sm font-medium text-near-black mb-2">
              Permissions
            </label>{" "}
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {" "}
              {PermissionCategories.map((category) => (
                <div key={category.category}>
                  {" "}
                  <h4 className="font-medium text-sm text-near-black mb-2">
                    {category.category}
                  </h4>{" "}
                  <div className="grid grid-cols-1 gap-1">
                    {" "}
                    {category.permissions.map((perm) => (
                      <label
                        key={perm.id}
                        className="flex items-center gap-2 p-2 hover:bg-light-gray rounded cursor-pointer"
                      >
                        {" "}
                        <Checkbox
                          checked={roleFormData.permissions.includes(perm.id)}
                          onChange={() => togglePermission(perm.id)}
                        />{" "}
                        <span className="text-sm">{perm.name}</span>{" "}
                      </label>
                    ))}{" "}
                  </div>{" "}
                </div>
              ))}{" "}
            </div>{" "}
          </div>{" "}
          <div className="flex justify-end gap-3 pt-4">
            {" "}
            <Button
              variant="outline"
              onClick={() => {
                setIsRoleModalOpen(false);
                setEditingRole(null);
                resetRoleForm();
              }}
            >
              {" "}
              Cancel{" "}
            </Button>{" "}
            <Button onClick={handleCreateRole}>
              {editingRole ? "Update" : "Create"}
            </Button>{" "}
          </div>{" "}
        </div>{" "}
      </InteractiveModal>{" "}
    </div>
  );
};
export default StaffManagementPage;
