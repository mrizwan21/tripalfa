import { 
  Permission, 
  Role, 
  PermissionCategory, 
  PermissionAction, 
  PermissionResource,
  PermissionContext,
  PermissionResponse,
  PermissionMatrixEntry,
  AuditLogEntry,
  PermissionSummary,
  ApiResponse,
  PermissionValidationRequest,
  RoleCreationRequest,
  PermissionCreationRequest
} from '../types/permissions';

// Mock data for development
const mockPermissions: Permission[] = [
  {
    id: 'company:companies:manage',
    category: PermissionCategory.COMPANY,
    resource: PermissionResource.COMPANY,
    action: PermissionAction.MANAGE,
    description: 'Full management access to company operations',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'company:departments:manage',
    category: PermissionCategory.DEPARTMENT,
    resource: PermissionResource.DEPARTMENT,
    action: PermissionAction.MANAGE,
    description: 'Full management access to department operations',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'company:kyc:documents:manage',
    category: PermissionCategory.KYC,
    resource: PermissionResource.KYC_DOCUMENT,
    action: PermissionAction.MANAGE,
    description: 'Full management access to KYC document operations',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'company:virtual_card:cards:manage',
    category: PermissionCategory.VIRTUAL_CARD,
    resource: PermissionResource.VIRTUAL_CARD,
    action: PermissionAction.MANAGE,
    description: 'Full management access to virtual card operations',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

const mockRoles: Role[] = [
  {
    id: 'SUPER_ADMIN',
    name: 'SUPER_ADMIN',
    description: 'Super Admin with full access to all company management features',
    permissions: [
      'company:companies:manage',
      'company:departments:manage',
      'company:kyc:documents:manage',
      'company:virtual_card:cards:manage'
    ],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'ADMIN',
    name: 'ADMIN',
    description: 'Admin with management and review capabilities',
    permissions: [
      'company:companies:view',
      'company:companies:update',
      'company:departments:view',
      'company:departments:create',
      'company:kyc:documents:view',
      'company:kyc:documents:verify',
      'company:virtual_card:cards:view',
      'company:virtual_card:transactions:view'
    ],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'B2B',
    name: 'B2B',
    description: 'B2B User with operational access to company features',
    permissions: [
      'company:companies:view',
      'company:departments:view',
      'company:kyc:documents:view',
      'company:kyc:documents:create',
      'company:virtual_card:cards:view',
      'company:virtual_card:cards:create'
    ],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'VIEWER',
    name: 'VIEWER',
    description: 'Viewer role with read-only access to company management',
    permissions: [
      'company:companies:view',
      'company:departments:view',
      'company:kyc:documents:view',
      'company:virtual_card:cards:view'
    ],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

const mockAuditLogs: AuditLogEntry[] = [
  {
    id: '1',
    timestamp: '2024-01-01T10:00:00Z',
    userId: 'user123',
    action: 'VIEW',
    resource: 'company:companies:manage',
    result: 'GRANTED',
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  },
  {
    id: '2',
    timestamp: '2024-01-01T10:05:00Z',
    userId: 'user456',
    action: 'CREATE',
    resource: 'company:departments:manage',
    result: 'DENIED',
    ipAddress: '192.168.1.2',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  }
];

export class PermissionService {
  private static API_BASE = '/api/permissions';

  /**
   * Get all available permissions
   */
  static async getAllPermissions(): Promise<ApiResponse<Permission[]>> {
    try {
      // In production, this would make an API call
      // return await api.get(`${this.API_BASE}/available`);
      
      // For now, return mock data
      return {
        success: true,
        data: mockPermissions,
        message: 'Permissions loaded successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        error: 'Failed to load permissions'
      };
    }
  }

  /**
   * Get all available roles
   */
  static async getAllRoles(): Promise<ApiResponse<Role[]>> {
    try {
      // In production, this would make an API call
      // return await api.get(`${this.API_BASE}/roles`);
      
      // For now, return mock data
      return {
        success: true,
        data: mockRoles,
        message: 'Roles loaded successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        error: 'Failed to load roles'
      };
    }
  }

  /**
   * Get permission matrix for all roles
   */
  static async getPermissionMatrix(): Promise<ApiResponse<PermissionMatrixEntry[]>> {
    try {
      // In production, this would make an API call
      // return await api.get(`${this.API_BASE}/role-matrix`);
      
      // For now, return mock data
      const matrix: PermissionMatrixEntry[] = mockRoles.map(role => ({
        role: role.name,
        permissions: role.permissions,
        categories: role.permissions.map(p => {
          const parts = p.split(':');
          return parts[0] as PermissionCategory;
        }).filter((category, index, arr) => arr.indexOf(category) === index)
      }));

      return {
        success: true,
        data: matrix,
        message: 'Permission matrix loaded successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        error: 'Failed to load permission matrix'
      };
    }
  }

  /**
   * Get audit logs
   */
  static async getAuditLogs(): Promise<ApiResponse<{ auditLog: AuditLogEntry[] }>> {
    try {
      // In production, this would make an API call
      // return await api.get(`${this.API_BASE}/audit`);
      
      // For now, return mock data
      return {
        success: true,
        data: { auditLog: mockAuditLogs },
        message: 'Audit logs loaded successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: { auditLog: [] },
        error: 'Failed to load audit logs'
      };
    }
  }

  /**
   * Validate user permissions
   */
  static async validatePermissions(request: PermissionValidationRequest): Promise<ApiResponse<PermissionResponse>> {
    try {
      // In production, this would make an API call
      // return await api.post(`${this.API_BASE}/validate`, request);
      
      // For now, return mock validation
      const granted = request.permissions.every(permission => 
        mockRoles.find(r => r.name === 'SUPER_ADMIN')?.permissions.includes(permission)
      );

      return {
        success: true,
        data: {
          granted,
          reason: granted ? 'All permissions granted' : 'Insufficient permissions',
          requiredPermissions: request.permissions,
          userPermissions: mockRoles.find(r => r.name === 'SUPER_ADMIN')?.permissions || []
        },
        message: granted ? 'Permissions validated successfully' : 'Permission validation failed'
      };
    } catch (error) {
      return {
        success: false,
        data: {
          granted: false,
          reason: 'Validation failed',
          requiredPermissions: request.permissions,
          userPermissions: []
        },
        error: 'Failed to validate permissions'
      };
    }
  }

  /**
   * Create a new role
   */
  static async createRole(roleData: RoleCreationRequest): Promise<ApiResponse<Role>> {
    try {
      // In production, this would make an API call
      // return await api.post(`${this.API_BASE}/roles`, roleData);
      
      // For now, return mock creation
      const newRole: Role = {
        id: `role_${Date.now()}`,
        name: roleData.name,
        description: roleData.description,
        permissions: roleData.permissions,
        isActive: roleData.isActive,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      mockRoles.push(newRole);

      return {
        success: true,
        data: newRole,
        message: 'Role created successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: {} as Role,
        error: 'Failed to create role'
      };
    }
  }

  /**
   * Update an existing role
   */
  static async updateRole(roleId: string, roleData: Partial<Role>): Promise<ApiResponse<Role>> {
    try {
      // In production, this would make an API call
      // return await api.put(`${this.API_BASE}/roles/${roleId}`, roleData);
      
      // For now, return mock update
      const roleIndex = mockRoles.findIndex(r => r.id === roleId);
      if (roleIndex === -1) {
        return {
          success: false,
          data: {} as Role,
          error: 'Role not found'
        };
      }

      mockRoles[roleIndex] = {
        ...mockRoles[roleIndex],
        ...roleData,
        updatedAt: new Date().toISOString()
      };

      return {
        success: true,
        data: mockRoles[roleIndex],
        message: 'Role updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: {} as Role,
        error: 'Failed to update role'
      };
    }
  }

  /**
   * Delete a role
   */
  static async deleteRole(roleId: string): Promise<ApiResponse<{ success: boolean }>> {
    try {
      // In production, this would make an API call
      // return await api.delete(`${this.API_BASE}/roles/${roleId}`);
      
      // For now, return mock deletion
      const roleIndex = mockRoles.findIndex(r => r.id === roleId);
      if (roleIndex === -1) {
        return {
          success: false,
          data: { success: false },
          error: 'Role not found'
        };
      }

      mockRoles.splice(roleIndex, 1);

      return {
        success: true,
        data: { success: true },
        message: 'Role deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: { success: false },
        error: 'Failed to delete role'
      };
    }
  }

  /**
   * Create a new permission
   */
  static async createPermission(permissionData: PermissionCreationRequest): Promise<ApiResponse<Permission>> {
    try {
      // In production, this would make an API call
      // return await api.post(`${this.API_BASE}/permissions`, permissionData);
      
      // For now, return mock creation
      const newPermission: Permission = {
        id: `${permissionData.category}:${permissionData.resource}:${permissionData.action}`,
        category: permissionData.category,
        resource: permissionData.resource,
        action: permissionData.action,
        description: permissionData.description,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      mockPermissions.push(newPermission);

      return {
        success: true,
        data: newPermission,
        message: 'Permission created successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: {} as Permission,
        error: 'Failed to create permission'
      };
    }
  }

  /**
   * Get permission summary
   */
  static async getPermissionSummary(): Promise<ApiResponse<PermissionSummary>> {
    try {
      // In production, this would make an API call
      // return await api.get(`${this.API_BASE}/summary`);
      
      // For now, return mock summary
      const summary: PermissionSummary = {
        totalRoles: mockRoles.length,
        totalPermissions: mockPermissions.length,
        activeRoles: mockRoles.filter(r => r.isActive).length,
        inactiveRoles: mockRoles.filter(r => !r.isActive).length,
        permissionDistribution: {
          [PermissionCategory.COMPANY]: mockPermissions.filter(p => p.category === PermissionCategory.COMPANY).length,
          [PermissionCategory.DEPARTMENT]: mockPermissions.filter(p => p.category === PermissionCategory.DEPARTMENT).length,
          [PermissionCategory.DESIGNATION]: mockPermissions.filter(p => p.category === PermissionCategory.DESIGNATION).length,
          [PermissionCategory.COST_CENTER]: mockPermissions.filter(p => p.category === PermissionCategory.COST_CENTER).length,
          [PermissionCategory.KYC]: mockPermissions.filter(p => p.category === PermissionCategory.KYC).length,
          [PermissionCategory.VIRTUAL_CARD]: mockPermissions.filter(p => p.category === PermissionCategory.VIRTUAL_CARD).length
        },
        lastUpdated: new Date().toISOString()
      };

      return {
        success: true,
        data: summary,
        message: 'Permission summary loaded successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: {} as PermissionSummary,
        error: 'Failed to load permission summary'
      };
    }
  }

  /**
   * Get user permissions
   */
  static async getUserPermissions(userId: string): Promise<ApiResponse<{ permissions: string[] }>> {
    try {
      // In production, this would make an API call
      // return await api.get(`${this.API_BASE}/user/${userId}`);
      
      // For now, return mock data
      const userRole = mockRoles.find(r => r.name === 'SUPER_ADMIN');
      
      return {
        success: true,
        data: { permissions: userRole?.permissions || [] },
        message: 'User permissions loaded successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: { permissions: [] },
        error: 'Failed to load user permissions'
      };
    }
  }

  /**
   * Bulk validate permissions
   */
  static async bulkValidatePermissions(requests: PermissionValidationRequest[]): Promise<ApiResponse<PermissionResponse[]>> {
    try {
      // In production, this would make an API call
      // return await api.post(`${this.API_BASE}/bulk-validate`, requests);
      
      // For now, return mock validation
      const results = requests.map(request => {
        const granted = request.permissions.every(permission => 
          mockRoles.find(r => r.name === 'SUPER_ADMIN')?.permissions.includes(permission)
        );

        return {
          granted,
          reason: granted ? 'All permissions granted' : 'Insufficient permissions',
          requiredPermissions: request.permissions,
          userPermissions: mockRoles.find(r => r.name === 'SUPER_ADMIN')?.permissions || []
        };
      });

      return {
        success: true,
        data: results,
        message: 'Bulk permission validation completed'
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        error: 'Failed to validate permissions'
      };
    }
  }

  /**
   * Get available permission categories
   */
  static async getCategories(): Promise<ApiResponse<PermissionCategory[]>> {
    try {
      return {
        success: true,
        data: Object.values(PermissionCategory),
        message: 'Categories loaded successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        error: 'Failed to load categories'
      };
    }
  }

  /**
   * Get available permission actions
   */
  static async getActions(): Promise<ApiResponse<PermissionAction[]>> {
    try {
      return {
        success: true,
        data: Object.values(PermissionAction),
        message: 'Actions loaded successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        error: 'Failed to load actions'
      };
    }
  }

  /**
   * Get available permission resources
   */
  static async getResources(): Promise<ApiResponse<PermissionResource[]>> {
    try {
      return {
        success: true,
        data: Object.values(PermissionResource),
        message: 'Resources loaded successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        error: 'Failed to load resources'
      };
    }
  }

  /**
   * Test permission checks
   */
  static async testPermissions(testData: any): Promise<ApiResponse<any>> {
    try {
      // In production, this would make an API call
      // return await api.post(`${this.API_BASE}/test`, testData);
      
      // For now, return mock test result
      return {
        success: true,
        data: {
          testResult: 'success',
          testData: testData,
          timestamp: new Date().toISOString()
        },
        message: 'Permission test completed successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: {},
        error: 'Failed to test permissions'
      };
    }
  }
}