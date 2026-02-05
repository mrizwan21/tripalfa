import { describe, it, expect } from '@jest/globals';
import { hasRolePermission } from '../../middleware/permissionMiddleware.js';

describe('Permission Middleware', () => {
  describe('hasRolePermission', () => {
    it('should return true for admin role with any permission', () => {
      expect(hasRolePermission('admin', 'view_customers')).toBe(true);
      expect(hasRolePermission('admin', 'create_booking')).toBe(true);
      expect(hasRolePermission('admin', 'nonexistent_permission')).toBe(true);
    });

    it('should return correct permissions for agent role', () => {
      // Agent should NOT have customer permissions
      expect(hasRolePermission('agent', 'view_customers')).toBe(false);
      expect(hasRolePermission('agent', 'create_customer')).toBe(false);

      // Agent should have booking permissions
      expect(hasRolePermission('agent', 'create_booking')).toBe(true);
      expect(hasRolePermission('agent', 'search_bookings')).toBe(true);

      // Agent should have supplier permissions
      expect(hasRolePermission('agent', 'view_suppliers')).toBe(true);
      expect(hasRolePermission('agent', 'create_supplier')).toBe(true);
    });

    it('should return correct permissions for supervisor role', () => {
      // Supervisor should have customer permissions
      expect(hasRolePermission('supervisor', 'view_customers')).toBe(true);
      expect(hasRolePermission('supervisor', 'create_customer')).toBe(true);

      // Supervisor should have supplier permissions
      expect(hasRolePermission('supervisor', 'view_suppliers')).toBe(true);
      expect(hasRolePermission('supervisor', 'create_supplier')).toBe(true);
    });

    it('should return correct permissions for manager role', () => {
      // Manager should have customer permissions
      expect(hasRolePermission('manager', 'view_customers')).toBe(true);
      expect(hasRolePermission('manager', 'create_customer')).toBe(true);

      // Manager should have supplier permissions
      expect(hasRolePermission('manager', 'view_suppliers')).toBe(true);
      expect(hasRolePermission('manager', 'create_supplier')).toBe(true);
    });

    it('should return false for unknown roles', () => {
      expect(hasRolePermission('unknown', 'view_customers')).toBe(false);
      expect(hasRolePermission('', 'create_booking')).toBe(false);
    });

    it('should return false for unknown permissions', () => {
      expect(hasRolePermission('agent', 'unknown_permission')).toBe(false);
      expect(hasRolePermission('supervisor', 'nonexistent')).toBe(false);
    });
  });
});