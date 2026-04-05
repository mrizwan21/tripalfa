import axios, { AxiosInstance } from 'axios';

// FusionAuth configuration
const FUSIONAUTH_URL = process.env.FUSIONAUTH_URL || 'http://localhost:9011';
const FUSIONAUTH_API_KEY = process.env.FUSIONAUTH_API_KEY || '';

// Application IDs
const FUSIONAUTH_B2B_APP_ID = process.env.FUSIONAUTH_B2B_APP_ID || 'b2b-admin-app';
const FUSIONAUTH_B2C_APP_ID = process.env.FUSIONAUTH_B2C_APP_ID || 'b2c-booking-app';

/**
 * Permission interface
 */
export interface Permission {
  id?: string;
  name: string;
  description?: string;
  isDefault?: boolean;
}

/**
 * Role interface
 */
export interface Role {
  id?: string;
  name: string;
  description?: string;
  isDefault?: boolean;
  isSuperRole?: boolean;
  permissions?: Permission[];
}

/**
 * Comprehensive Role Management Service for FusionAuth
 */
export class FusionAuthRoleService {
  private static instance: FusionAuthRoleService;
  private client: AxiosInstance;

  private constructor() {
    this.client = axios.create({
      baseURL: FUSIONAUTH_URL,
      headers: {
        Authorization: FUSIONAUTH_API_KEY,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
  }

  static getInstance(): FusionAuthRoleService {
    if (!FusionAuthRoleService.instance) {
      FusionAuthRoleService.instance = new FusionAuthRoleService();
    }
    return FusionAuthRoleService.instance;
  }

  /**
   * Get all roles for an application
   */
  async getApplicationRoles(applicationId: string): Promise<Role[]> {
    try {
      const response = await this.client.get(`/api/application/${applicationId}`);
      return response.data.application?.roles || [];
    } catch (error: unknown) {
      console.error(
        '[FusionAuth] Failed to get application roles:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      return [];
    }
  }

  /**
   * Create a new role
   */
  async createRole(applicationId: string, role: Role): Promise<Role | null> {
    try {
      // Get current application
      const appResponse = await this.client.get(`/api/application/${applicationId}`);
      const existingRoles = appResponse.data.application?.roles || [];

      // Check if role already exists
      const existingRole = existingRoles.find((r: Role) => r.name === role.name);
      if (existingRole) {
        return existingRole;
      }

      // Add new role
      const response = await this.client.patch(`/api/application/${applicationId}`, {
        application: {
          roles: [
            ...existingRoles,
            {
              name: role.name,
              description: role.description || `${role.name} role`,
              isDefault: role.isDefault || false,
              isSuperRole: role.isSuperRole || false,
            },
          ],
        },
      });

      const createdRole = response.data.application?.roles?.find((r: Role) => r.name === role.name);

      return createdRole || null;
    } catch (error: unknown) {
      console.error(
        '[FusionAuth] Failed to create role:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw new Error((error as any).response?.data?.message || 'Failed to create role');
    }
  }

  /**
   * Update a role
   */
  async updateRole(
    applicationId: string,
    roleName: string,
    updates: Partial<Role>
  ): Promise<Role | null> {
    try {
      const appResponse = await this.client.get(`/api/application/${applicationId}`);
      const existingRoles = appResponse.data.application?.roles || [];

      const roleIndex = existingRoles.findIndex((r: Role) => r.name === roleName);
      if (roleIndex === -1) {
        throw new Error('Role not found');
      }

      const updatedRoles = [...existingRoles];
      updatedRoles[roleIndex] = {
        ...updatedRoles[roleIndex],
        ...updates,
      };

      const response = await this.client.patch(`/api/application/${applicationId}`, {
        application: {
          roles: updatedRoles,
        },
      });

      return (
        response.data.application?.roles?.find(
          (r: Role) => r.name === (updates.name || roleName)
        ) || null
      );
    } catch (error: unknown) {
      console.error(
        '[FusionAuth] Failed to update role:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw new Error((error as any).response?.data?.message || 'Failed to update role');
    }
  }

  /**
   * Delete a role
   */
  async deleteRole(applicationId: string, roleName: string): Promise<void> {
    try {
      const appResponse = await this.client.get(`/api/application/${applicationId}`);
      const existingRoles = appResponse.data.application?.roles || [];

      const updatedRoles = existingRoles.filter((r: Role) => r.name !== roleName);

      await this.client.patch(`/api/application/${applicationId}`, {
        application: {
          roles: updatedRoles,
        },
      });
    } catch (error: unknown) {
      console.error(
        '[FusionAuth] Failed to delete role:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw new Error((error as any).response?.data?.message || 'Failed to delete role');
    }
  }

  /**
   * Get role by name
   */
  async getRoleByName(applicationId: string, roleName: string): Promise<Role | null> {
    try {
      const roles = await this.getApplicationRoles(applicationId);
      return roles.find(r => r.name === roleName) || null;
    } catch (error: unknown) {
      console.error(
        '[FusionAuth] Failed to get role:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      return null;
    }
  }

  /**
   * Assign role to user
   */
  async assignRoleToUser(userId: string, applicationId: string, roleName: string): Promise<void> {
    try {
      const userResponse = await this.client.get(`/api/user/${userId}`);
      const registrations = userResponse.data.user?.registrations || [];

      const registration = registrations.find((r: any) => r.applicationId === applicationId);

      if (!registration) {
        // Register user to application with role
        await this.client.post(`/api/user/registration/${userId}`, {
          registration: {
            applicationId,
            roles: [roleName],
          },
        });
      } else {
        // Update existing registration
        const currentRoles = registration.roles || [];
        if (!currentRoles.includes(roleName)) {
          await this.client.put(`/api/user/registration/${userId}`, {
            registration: {
              applicationId,
              roles: [...currentRoles, roleName],
            },
          });
        }
      }
    } catch (error: unknown) {
      console.error(
        '[FusionAuth] Failed to assign role:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw new Error((error as any).response?.data?.message || 'Failed to assign role');
    }
  }

  /**
   * Remove role from user
   */
  async removeRoleFromUser(userId: string, applicationId: string, roleName: string): Promise<void> {
    try {
      const userResponse = await this.client.get(`/api/user/${userId}`);
      const registrations = userResponse.data.user?.registrations || [];

      const registration = registrations.find((r: any) => r.applicationId === applicationId);

      if (registration) {
        const currentRoles = registration.roles || [];
        const updatedRoles = currentRoles.filter((r: string) => r !== roleName);

        await this.client.put(`/api/user/registration/${userId}`, {
          registration: {
            applicationId,
            roles: updatedRoles,
          },
        });
      }
    } catch (error: unknown) {
      console.error(
        '[FusionAuth] Failed to remove role:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw new Error((error as any).response?.data?.message || 'Failed to remove role');
    }
  }

  /**
   * Get user roles for application
   */
  async getUserRoles(userId: string, applicationId: string): Promise<string[]> {
    try {
      const userResponse = await this.client.get(`/api/user/${userId}`);
      const registrations = userResponse.data.user?.registrations || [];

      const registration = registrations.find((r: any) => r.applicationId === applicationId);

      return registration?.roles || [];
    } catch (error: unknown) {
      console.error(
        '[FusionAuth] Failed to get user roles:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      return [];
    }
  }

  /**
   * Check if user has role
   */
  async userHasRole(userId: string, applicationId: string, roleName: string): Promise<boolean> {
    try {
      const roles = await this.getUserRoles(userId, applicationId);
      return roles.includes(roleName);
    } catch (error: unknown) {
      return false;
    }
  }

  /**
   * Check if user has any of the specified roles
   */
  async userHasAnyRole(
    userId: string,
    applicationId: string,
    roleNames: string[]
  ): Promise<boolean> {
    try {
      const roles = await this.getUserRoles(userId, applicationId);
      return roleNames.some(role => roles.includes(role));
    } catch (error: unknown) {
      return false;
    }
  }

  /**
   * Check if user has all specified roles
   */
  async userHasAllRoles(
    userId: string,
    applicationId: string,
    roleNames: string[]
  ): Promise<boolean> {
    try {
      const roles = await this.getUserRoles(userId, applicationId);
      return roleNames.every(role => roles.includes(role));
    } catch (error: unknown) {
      return false;
    }
  }

  /**
   * Initialize default roles for B2B application
   */
  async initializeB2BRoles(): Promise<void> {
    const roles: Role[] = [
      {
        name: 'super_admin',
        description: 'Super administrator with full access',
        isSuperRole: true,
        isDefault: false,
      },
      {
        name: 'admin',
        description: 'Administrator with elevated access',
        isSuperRole: false,
        isDefault: false,
      },
      {
        name: 'manager',
        description: 'Manager with team management access',
        isSuperRole: false,
        isDefault: false,
      },
      {
        name: 'employee',
        description: 'Regular employee',
        isSuperRole: false,
        isDefault: true,
      },
    ];

    for (const role of roles) {
      try {
        await this.createRole(FUSIONAUTH_B2B_APP_ID, role);
      } catch (error: unknown) {
        // Role might already exist, continue
      }
    }
  }

  /**
   * Initialize default roles for B2C application
   */
  async initializeB2CRoles(): Promise<void> {
    const roles: Role[] = [
      {
        name: 'premium_user',
        description: 'Premium user with additional features',
        isSuperRole: false,
        isDefault: false,
      },
      {
        name: 'user',
        description: 'Regular user',
        isSuperRole: false,
        isDefault: true,
      },
    ];

    for (const role of roles) {
      try {
        await this.createRole(FUSIONAUTH_B2C_APP_ID, role);
      } catch (error: unknown) {
        // Role might already exist, continue
      }
    }
  }

  /**
   * Get B2B application ID
   */
  getB2BApplicationId(): string {
    return FUSIONAUTH_B2B_APP_ID;
  }

  /**
   * Get B2C application ID
   */
  getB2CApplicationId(): string {
    return FUSIONAUTH_B2C_APP_ID;
  }
}

export const fusionAuthRoleService = FusionAuthRoleService.getInstance();
