import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useState } from 'react';
import axios from 'axios';
import { z } from 'zod';
const roleSchema = z.object({
  name: z.string().min(2, 'Role name is required'),
  description: z.string().optional(),
  permissions: z.array(z.number()).optional(),
});

export interface Role {
  id: number;
  name: string;
  description?: string;
  permissions: number[];
}

const fetchRoles = async () => {
  const { data } = await axios.get<Role[]>('/api/roles');
  return data;
};

const addRole = async (role: Omit<Role, 'id'>) => {
  const { data } = await axios.post<Role>('/api/roles', role);
  return data;
};

const updateRole = async ({ id, ...role }: Partial<Role> & { id: number }) => {
  const { data } = await axios.put<Role>(`/api/roles/${id}`, role);
  return data;
};

const deleteRole = async (id: number) => {
  await axios.delete(`/api/roles/${id}`);
};

export default function RolesListPage() {
  const queryClient = useQueryClient();
  const { data: roles = [], isLoading } = useQuery('roles', fetchRoles);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', permissions: [] as number[] });
  const [formError, setFormError] = useState<string | null>(null);

  const deleteMutation = useMutation(deleteRole, {
    onSuccess: () => queryClient.invalidateQueries('roles'),
  });

  const addMutation = useMutation(addRole, {
    onSuccess: () => {
      queryClient.invalidateQueries('roles');
      setShowModal(false);
    },
  });

  const updateMutation = useMutation(updateRole, {
    onSuccess: () => {
      queryClient.invalidateQueries('roles');
      setShowModal(false);
    },
  });

  const handleDelete = (id: number) => {
    if (window.confirm('Delete this role?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const result = roleSchema.safeParse(form);
    if (!result.success) {
      setFormError(result.error.errors[0].message);
      return;
    }
    if (selectedRole) {
      updateMutation.mutate({ id: selectedRole.id, ...result.data } as any);
    } else {
      addMutation.mutate(result.data as any);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Roles</h1>
      {isLoading ? (
        <div className="flex items-center gap-2 text-gray-500">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /></svg>
          Loading roles...
        </div>
      ) : roles.length === 0 ? (
        <div className="text-gray-500">No roles found.</div>
      ) : (
        <table className="min-w-full border rounded shadow">
          <thead className="bg-gray-50">
            <tr>
              <th className="border px-4 py-2 text-left">Name</th>
              <th className="border px-4 py-2 text-left">Description</th>
              <th className="border px-4 py-2 text-left">Permissions</th>
              <th className="border px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {roles.map(role => (
              <tr key={role.id} className="hover:bg-gray-100 transition-colors">
                <td className="border px-4 py-2">{role.name}</td>
                <td className="border px-4 py-2">{role.description}</td>
                <td className="border px-4 py-2">{role.permissions.length}</td>
                <td className="border px-4 py-2">
                  <button
                    className="text-blue-600 hover:underline mr-2 focus:outline-none focus:ring focus:ring-blue-300 px-2 py-1 rounded" onClick={() => { setSelectedRole(role); setForm({ name: role.name, description: role.description || '', permissions: role.permissions, }); setShowModal(true); }} aria-label={`Edit role ${role.name}`} >Edit</button> <button className="text-red-600 hover:underline focus:outline-none focus:ring focus:ring-red-300 px-2 py-1 rounded"
                    onClick={() => handleDelete(role.id)}
                    aria-label={`Delete role ${role.name}`}
                  >Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <button
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-300"
        onClick={() => {
          setSelectedRole(null);
          setForm({ name: '', description: '', permissions: [] });
          setShowModal(true);
        }}
        aria-label="Add new role"
      >Add Role</button>
      {/* Modal for add/edit role with Zod validation */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 transition-opacity duration-200">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 relative animate-fade-in" role="dialog" aria-modal="true">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 focus:outline-none"
              onClick={() => setShowModal(false)}
              aria-label="Close modal"
            >
              <svg width="24" height="24" viewBox="0 0 24 24"><path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            </button>
            <h2 className="text-xl font-bold mb-4">{selectedRole ? 'Edit Role' : 'Add Role'}</h2>
            <form onSubmit={handleSubmit}>
              <label htmlFor="name" className="block mb-2 font-medium">Role Name</label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleInputChange}
                className="w-full border px-2 py-1 mb-2 rounded focus:ring focus:ring-blue-300"
                required
                aria-invalid={!!formError}
                aria-describedby="role-name-error"
              />
              <label htmlFor="description" className="block mb-2 font-medium">Description</label>
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleInputChange}
                className="w-full border px-2 py-1 mb-2 rounded focus:ring focus:ring-blue-300"
              />
              {/* Permissions field can be expanded later */}
              {formError && (
                <div id="role-name-error" className="text-red-600 mb-2" role="alert">{formError}</div>
              )}
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 focus:outline-none focus:ring focus:ring-gray-400"
                  onClick={() => setShowModal(false)}
                >Cancel</button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-300"
                >{selectedRole ? 'Save' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
