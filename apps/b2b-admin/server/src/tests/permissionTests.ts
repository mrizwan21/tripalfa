/**
 * Permission System Tests
 * Simple test suite for the permission management system
 */

import { 
  PermissionUtils, 
  PermissionCategory, 
  PermissionAction, 
  PermissionResource,
  PermissionError,
  PermissionErrorType
} from '../types/permissions.js';
import { 
  requirePermission, 
  requireAdminAccess,
  requireSuperAdminAccess,
  requireCompanyAccess,
  requireB2BAccess,
  requireViewerAccess
} from '../middleware/permissionMiddleware.js';

// Simple test runner
function runTests() {
  console.log('\n🧪 Permission System Tests\n');

  // Test 1: PermissionUtils.getRolePermissions
  console.log('Testing PermissionUtils.getRolePermissions...');
  
  const superAdminPermissions = PermissionUtils.getRolePermissions('SUPER_ADMIN');
  if (!superAdminPermissions.includes('company:companies:manage')) {
    throw new Error('SUPER_ADMIN should have company:companies:manage permission');
  }
  console.log('✅ SUPER_ADMIN permissions correct');

  const adminPermissions = PermissionUtils.getRolePermissions('ADMIN');
  if (!adminPermissions.includes('company:companies:manage')) {
    throw new Error('ADMIN should have company:companies:manage permission');
  }
  console.log('✅ ADMIN permissions correct');

  const b2bPermissions = PermissionUtils.getRolePermissions('B2B');
  if (!b2bPermissions.includes('company:companies:view')) {
    throw new Error('B2B should have company:companies:view permission');
  }
  console.log('✅ B2B permissions correct');

  const viewerPermissions = PermissionUtils.getRolePermissions('VIEWER');
  if (!viewerPermissions.includes('company:companies:view')) {
    throw new Error('VIEWER should have company:companies:view permission');
  }
  console.log('✅ VIEWER permissions correct');

  const unknownPermissions = PermissionUtils.getRolePermissions('UNKNOWN');
  if (unknownPermissions.length !== 0) {
    throw new Error('UNKNOWN role should have no permissions');
  }
  console.log('✅ UNKNOWN role permissions correct');

  // Test 2: PermissionUtils.hasAnyPermission
  console.log('\nTesting PermissionUtils.hasAnyPermission...');
  
  const userPermissions = ['company:companies:view', 'company:departments:manage'];
  const requiredPermissions = ['company:companies:manage', 'company:departments:manage'];
  
  const hasPermission = PermissionUtils.hasAnyPermission(userPermissions, requiredPermissions);
  if (!hasPermission) {
    throw new Error('User should have at least one required permission');
  }
  console.log('✅ hasAnyPermission works correctly');

  // Test 3: PermissionUtils.buildPermission
  console.log('\nTesting PermissionUtils.buildPermission...');
  
  const permission = PermissionUtils.buildPermission(
    PermissionCategory.COMPANY,
    PermissionResource.COMPANY,
    PermissionAction.MANAGE
  );
  if (permission !== 'company:company:manage') {
    throw new Error(`Expected 'company:company:manage', got '${permission}'`);
  }
  console.log('✅ buildPermission works correctly');

  // Test 4: PermissionError
  console.log('\nTesting PermissionError...');
  
  const error = new PermissionError(
    PermissionErrorType.ACCESS_DENIED,
    'Test error message',
    ['required:permission'],
    ['user:permission']
  );

  if (error.type !== PermissionErrorType.ACCESS_DENIED) {
    throw new Error('PermissionError type should be ACCESS_DENIED');
  }
  if (error.message !== 'Test error message') {
    throw new Error('PermissionError message should be "Test error message"');
  }
  if (error.requiredPermissions[0] !== 'required:permission') {
    throw new Error('PermissionError requiredPermissions should contain "required:permission"');
  }
  if (error.userPermissions[0] !== 'user:permission') {
    throw new Error('PermissionError userPermissions should contain "user:permission"');
  }
  console.log('✅ PermissionError works correctly');

  // Test 5: Permission Categories and Actions
  console.log('\nTesting Permission Categories and Actions...');
  
  const categories = Object.values(PermissionCategory);
  if (!categories.includes(PermissionCategory.COMPANY)) {
    throw new Error('Should have company category');
  }
  if (!categories.includes(PermissionCategory.DEPARTMENT)) {
    throw new Error('Should have department category');
  }
  if (!categories.includes(PermissionCategory.KYC)) {
    throw new Error('Should have kyc category');
  }
  console.log('✅ Permission categories correct');

  const actions = Object.values(PermissionAction);
  if (!actions.includes(PermissionAction.VIEW)) {
    throw new Error('Should have view action');
  }
  if (!actions.includes(PermissionAction.MANAGE)) {
    throw new Error('Should have manage action');
  }
  if (!actions.includes(PermissionAction.CREATE)) {
    throw new Error('Should have create action');
  }
  console.log('✅ Permission actions correct');

  const resources = Object.values(PermissionResource);
  if (!resources.includes(PermissionResource.COMPANY)) {
    throw new Error('Should have company resource');
  }
  if (!resources.includes(PermissionResource.DEPARTMENT)) {
    throw new Error('Should have department resource');
  }
  if (!resources.includes(PermissionResource.KYC_DOCUMENT)) {
    throw new Error('Should have kyc_document resource');
  }
  if (!resources.includes(PermissionResource.VIRTUAL_CARD)) {
    throw new Error('Should have virtual_card resource');
  }
  console.log('✅ Permission resources correct');

  // Test 6: Permission Matrix Validation
  console.log('\nTesting Permission Matrix Validation...');
  
  // Check SUPER_ADMIN has all permissions
  const superAdminPerms = PermissionUtils.getRolePermissions('SUPER_ADMIN');
  if (!superAdminPerms.includes('company:companies:manage')) {
    throw new Error('SUPER_ADMIN should have company:companies:manage');
  }
  if (!superAdminPerms.includes('company:departments:manage')) {
    throw new Error('SUPER_ADMIN should have company:departments:manage');
  }
  if (!superAdminPerms.includes('company:kyc:documents:manage')) {
    throw new Error('SUPER_ADMIN should have company:kyc:documents:manage');
  }
  if (!superAdminPerms.includes('company:virtual_card:cards:manage')) {
    throw new Error('SUPER_ADMIN should have company:virtual_card:cards:manage');
  }
  console.log('✅ SUPER_ADMIN has all required permissions');

  // Check ADMIN has management permissions
  const adminPerms = PermissionUtils.getRolePermissions('ADMIN');
  if (!adminPerms.includes('company:companies:manage')) {
    throw new Error('ADMIN should have company:companies:manage');
  }
  if (!adminPerms.includes('company:departments:manage')) {
    throw new Error('ADMIN should have company:departments:manage');
  }
  if (!adminPerms.includes('company:kyc:documents:manage')) {
    throw new Error('ADMIN should have company:kyc:documents:manage');
  }
  if (!adminPerms.includes('company:virtual_card:cards:manage')) {
    throw new Error('ADMIN should have company:virtual_card:cards:manage');
  }
  console.log('✅ ADMIN has all required permissions');

  // Check B2B has view permissions
  const b2bPerms = PermissionUtils.getRolePermissions('B2B');
  if (!b2bPerms.includes('company:companies:view')) {
    throw new Error('B2B should have company:companies:view');
  }
  if (!b2bPerms.includes('company:departments:view')) {
    throw new Error('B2B should have company:departments:view');
  }
  if (!b2bPerms.includes('company:kyc:documents:view')) {
    throw new Error('B2B should have company:kyc:documents:view');
  }
  if (!b2bPerms.includes('company:virtual_card:cards:view')) {
    throw new Error('B2B should have company:virtual_card:cards:view');
  }
  console.log('✅ B2B has all required permissions');

  // Check VIEWER has only view permissions
  const viewerPerms = PermissionUtils.getRolePermissions('VIEWER');
  if (!viewerPerms.includes('company:companies:view')) {
    throw new Error('VIEWER should have company:companies:view');
  }
  if (!viewerPerms.includes('company:departments:view')) {
    throw new Error('VIEWER should have company:departments:view');
  }
  if (!viewerPerms.includes('company:kyc:documents:view')) {
    throw new Error('VIEWER should have company:kyc:documents:view');
  }
  if (!viewerPerms.includes('company:virtual_card:cards:view')) {
    throw new Error('VIEWER should have company:virtual_card:cards:view');
  }
  
  // Check VIEWER doesn't have management permissions
  if (viewerPerms.includes('company:companies:manage')) {
    throw new Error('VIEWER should not have company:companies:manage');
  }
  if (viewerPerms.includes('company:departments:manage')) {
    throw new Error('VIEWER should not have company:departments:manage');
  }
  if (viewerPerms.includes('company:kyc:documents:manage')) {
    throw new Error('VIEWER should not have company:kyc:documents:manage');
  }
  if (viewerPerms.includes('company:virtual_card:cards:manage')) {
    throw new Error('VIEWER should not have company:virtual_card:cards:manage');
  }
  console.log('✅ VIEWER has only view permissions');

  console.log('\n🎉 All permission tests passed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  try {
    runTests();
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

export { runTests };