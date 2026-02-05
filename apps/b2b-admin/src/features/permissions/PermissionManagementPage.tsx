import React, { useState } from 'react';
import {
  Box,
  Button,
  Paper,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  FormControlLabel,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton
} from '@mui/material';
import {
  Security as SecurityIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
}

// Mock roles data
const mockRoles: Role[] = [
  {
    id: '1',
    name: 'Super Admin',
    description: 'Full system access with all permissions',
    permissions: ['company:*:manage', 'users:*:manage', 'settings:*:manage'],
    isActive: true,
    createdAt: '2024-01-01'
  },
  {
    id: '2',
    name: 'Admin',
    description: 'Administrative access with limited permissions',
    permissions: ['company:*:view', 'company:*:update', 'users:*:view'],
    isActive: true,
    createdAt: '2024-01-15'
  },
  {
    id: '3',
    name: 'B2B Agent',
    description: 'B2B partner access for bookings',
    permissions: ['bookings:*:create', 'bookings:*:view', 'reports:*:view'],
    isActive: true,
    createdAt: '2024-02-01'
  }
];

interface PermissionManagementPageProps { }

const PermissionManagementPage: React.FC<PermissionManagementPageProps> = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [roles, setRoles] = useState<Role[]>(mockRoles);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Create Role Dialog State
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    isActive: true
  });

  const handleOpenCreateDialog = () => {
    setNewRole({ name: '', description: '', isActive: true });
    setCreateDialogOpen(true);
  };

  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
  };

  const handleCreateRole = () => {
    if (!newRole.name.trim()) {
      setSnackbar({ open: true, message: 'Role name is required', severity: 'error' });
      return;
    }

    const role: Role = {
      id: String(roles.length + 1),
      name: newRole.name,
      description: newRole.description,
      permissions: [],
      isActive: newRole.isActive,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setRoles([...roles, role]);
    setSnackbar({ open: true, message: `Role "${role.name}" created successfully!`, severity: 'success' });
    setCreateDialogOpen(false);
  };

  const handleDeleteRole = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (window.confirm(`Are you sure you want to delete the role "${role?.name}"?`)) {
      setRoles(roles.filter(r => r.id !== roleId));
      setSnackbar({ open: true, message: 'Role deleted successfully', severity: 'success' });
    }
  };

  const handleRefresh = () => {
    setSnackbar({ open: true, message: 'Roles refreshed', severity: 'success' });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SecurityIcon />
        Permission Management
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        Welcome, {user?.name || 'Guest'}! You are logged in as {user?.role || 'Unknown'}.
      </Alert>

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3 }}>
        <Tab label="Roles" />
        <Tab label="Permissions" />
        <Tab label="Audit Logs" />
      </Tabs>

      <Paper sx={{ p: 3 }}>
        {activeTab === 0 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Role Management
                </Typography>
                <Typography color="text.secondary">
                  Manage user roles and their associated permissions.
                </Typography>
              </Box>
              <Box>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  sx={{ mr: 1 }}
                  onClick={handleOpenCreateDialog}
                >
                  Create Role
                </Button>
                <Button variant="outlined" startIcon={<RefreshIcon />} onClick={handleRefresh}>
                  Refresh
                </Button>
              </Box>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Role Name</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Permissions</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {roles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell>
                        <Typography fontWeight="medium">{role.name}</Typography>
                      </TableCell>
                      <TableCell>{role.description}</TableCell>
                      <TableCell>
                        <Chip
                          label={`${role.permissions.length} permissions`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={role.isActive ? 'Active' : 'Inactive'}
                          size="small"
                          color={role.isActive ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell>{role.createdAt}</TableCell>
                      <TableCell align="right">
                        <IconButton size="small" color="primary">
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDeleteRole(role.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {activeTab === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Permission Catalog
            </Typography>
            <Typography color="text.secondary">
              View and manage system permissions.
            </Typography>
          </Box>
        )}

        {activeTab === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Audit Logs
            </Typography>
            <Typography color="text.secondary">
              Track permission changes and access attempts.
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Create Role Dialog */}
      <Dialog open={createDialogOpen} onClose={handleCloseCreateDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Role</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Role Name"
              fullWidth
              required
              value={newRole.name}
              onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
              placeholder="e.g., Travel Agent"
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={newRole.description}
              onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
              placeholder="Describe the purpose and scope of this role..."
            />
            <FormControlLabel
              control={
                <Switch
                  checked={newRole.isActive}
                  onChange={(e) => setNewRole({ ...newRole, isActive: e.target.checked })}
                />
              }
              label="Active"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateRole}>
            Create Role
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PermissionManagementPage;