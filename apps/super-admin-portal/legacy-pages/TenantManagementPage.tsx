import React, { useState, useEffect } from "react";
import { fetchTenants, createTenant, updateTenant, deleteTenant } from "../services/tenantService";
import type { Tenant } from "../services/tenantService";
import { Button, Card, FormField } from "@tripalfa/ui-components";
import { Plus, Users, Globe, Trash2, Edit, ChevronDown } from "lucide-react";

const TenantManagementPage = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [provisionModalOpen, setProvisionModalOpen] = useState(false);
  const [editingTenantId, setEditingTenantId] = useState<string | null>(null);
  const [newTenantData, setNewTenantData] = useState({ name: "", domain: "", type: "b2b", creditLimit: 5000 });

  useEffect(() => {
    const loadTenants = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchTenants();
        setTenants(data);
      } catch (error) {
        console.error("Failed to fetch tenants:", error);
        setError("Failed to load tenants. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    loadTenants();
  }, []);

  const columns = [
    { id: "name", header: "Tenant Name", accessor: "name" },
    { id: "domain", header: "Domain", accessor: "domain" },
    { id: "type", header: "Type", accessor: "type" },
    { id: "status", header: "Status", accessor: "status" },
    { id: "creditLimit", header: "Credit Limit", accessor: (row: Tenant) => `$${row.creditLimit.toLocaleString()}` },
    {
      id: "actions",
      header: "Actions",
      cell: (tenant: Tenant) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => handleEditTenant(tenant)}>
            <Edit className="h-4 w-4 mr-1" /> Edit
          </Button>
          <Button size="sm" variant="secondary" className="text-near-black border-red-300 hover:bg-light-gray/5" onClick={() => handleDeleteTenant(tenant.id)}>
            <Trash2 className="h-4 w-4 mr-1" /> Delete
          </Button>
        </div>
      ),
    },
  ];

  const handleProvisionTenant = async () => {
    try {
      if (editingTenantId) {
        const updatedTenant = await updateTenant(editingTenantId, newTenantData);
        setTenants(tenants.map(t => t.id === editingTenantId ? updatedTenant : t));
        alert(`Tenant ${updatedTenant.name} updated successfully!`);
      } else {
        const newTenant = await createTenant(newTenantData);
        setTenants([...tenants, newTenant]);
        alert(`Tenant ${newTenant.name} created successfully!`);
      }
      setProvisionModalOpen(false);
      setNewTenantData({ name: "", domain: "", type: "b2b", creditLimit: 5000 });
      setEditingTenantId(null);
    } catch (error) {
      console.error("Failed to save tenant:", error);
      alert(`Failed to save tenant: ${(error as Error).message}`);
    }
  };

  const handleEditTenant = (tenant: Tenant) => {
    setNewTenantData({ name: tenant.name, domain: tenant.domain, type: tenant.type, creditLimit: tenant.creditLimit });
    setEditingTenantId(tenant.id);
    setProvisionModalOpen(true);
  };

  const handleDeleteTenant = async (id: string) => {
    if (confirm("Are you sure you want to delete this tenant?")) {
      try {
        await deleteTenant(id);
        setTenants(tenants.filter(tenant => tenant.id !== id));
        alert("Tenant deleted successfully!");
      } catch (error) {
        console.error("Failed to delete tenant:", error);
        alert(`Failed to delete tenant: ${(error as Error).message}`);
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tenant Management</h2>
          <p className="text-near-black mt-0.5">Manage all agency tenants in the platform</p>
        </div>
        <Button onClick={() => { setNewTenantData({ name: "", domain: "", type: "b2b", creditLimit: 5000 }); setProvisionModalOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Provision Tenant
        </Button>
      </div>

      <Card className="p-6">
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-apple-blue"></div>
          </div>
        ) : error ? (
          <div className="text-near-black p-4 bg-near-black/5 rounded-lg">
            {error}
            <Button onClick={() => window.location.reload()} className="mt-2">Retry</Button>
          </div>
        ) : tenants.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-near-black">No tenants found</p>
            <Button onClick={() => setProvisionModalOpen(true)} className="mt-4">Create First Tenant</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-black/5">
              <thead className="bg-near-black">
                <tr>
                  {columns.map(column => (
                    <th key={column.id} className="px-6 py-3 text-left text-xs font-medium text-near-black uppercase tracking-wider">
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-black/5">
                {tenants.map(tenant => (
                  <tr key={tenant.id}>
                    {columns.map(column => {
                      let value;
                      if (column.accessor) {
                        value = typeof column.accessor === 'function' ? column.accessor(tenant) : tenant[column.accessor as keyof typeof tenant];
                      } else if (column.cell) {
                        value = column.cell(tenant);
                      } else {
                        value = '';
                      }
                      return (
                        <td key={`${tenant.id}-${column.id}`} className="px-6 py-4 whitespace-nowrap text-sm text-near-black">
                          {value}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Tenant Hierarchy Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-apple-blue" /> Agency Hierarchy
          </h3>
          <div className="space-y-2">
            {['Global Travel Corp', 'Sunset Vacations', 'Corporate Solutions Ltd'].map(agency => (
              <div key={agency} className="flex items-center justify-between p-3 bg-near-black rounded-lg">
                <div className="flex items-center gap-3">
                  <ChevronDown className="h-4 w-4 text-near-black cursor-pointer" />
                  <span className="font-medium">{agency}</span>
                </div>
                <span className="text-sm text-near-black">3 sub-agencies</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Globe className="h-5 w-5 text-apple-blue" /> Domain Management
          </h3>
          <div className="space-y-4">
            {tenants.map(tenant => (
              <div key={tenant.id} className="flex items-center justify-between p-3 bg-near-black rounded-lg">
                <div>
                  <p className="font-medium">{tenant.domain}</p>
                  <p className="text-sm text-near-black">SSL: Active · DNS: Verified</p>
                </div>
                <Button size="sm" variant="outline">Manage DNS</Button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Provision Tenant Modal */}
      {provisionModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-apple w-full max-w-lg">
            <div className="p-6 border-b border-near-black flex items-center justify-between">
              <h3 className="font-bold text-lg text-near-black">
                {editingTenantId ? 'Edit Tenant' : 'Provision New Tenant'}
              </h3>
              <button onClick={() => { setProvisionModalOpen(false); setNewTenantData({ name: "", domain: "", type: "b2b", creditLimit: 5000 }); }} className="text-near-black hover:text-near-black text-2xl leading-none">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-4">
                <FormField label="Tenant Name" type="text" value={newTenantData.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTenantData({...newTenantData, name: e.target.value})} placeholder="Enter company name" required />
                <FormField label="Domain" type="text" value={newTenantData.domain} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTenantData({...newTenantData, domain: e.target.value})} placeholder="yourcompany.travelportal.com" required description="Custom domain for the tenant's portal" />
                <FormField label="Tenant Type" type="select" value={newTenantData.type} onChange={(value: string) => setNewTenantData({...newTenantData, type: value})} options={[
                  { value: "b2b", label: "B2B Travel Agency" },
                  { value: "b2c", label: "B2C Online Travel Agency" },
                  { value: "corporate", label: "Corporate Travel Desk" }
                ]} />
                <FormField label="Credit Limit ($)" type="number" value={newTenantData.creditLimit} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTenantData({...newTenantData, creditLimit: Number(e.target.value)})} min="1000" step="500" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setProvisionModalOpen(false)} className="px-4 py-2 border border-near-black rounded-md text-sm text-near-black hover:bg-light-gray">Cancel</button>
                <button onClick={handleProvisionTenant} className="px-4 py-2 bg-apple-blue text-white rounded-md text-sm font-medium hover:bg-apple-blue">
                  {editingTenantId ? 'Update Tenant' : 'Provision Tenant'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantManagementPage;
