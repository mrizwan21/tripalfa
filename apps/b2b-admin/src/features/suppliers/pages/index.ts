/**
 * Suppliers Pages
 *
 * This module exports all page components for the suppliers feature:
 * - SuppliersList: List all suppliers with search/filter
 * - SuppliersManagement: Supplier CRUD management page
 * - SupplierGateway: API Gateway configuration for a supplier
 *
 * Usage:
 *
 * import { SupplierGatewayPage } from '@/features/suppliers/pages'
 *
 * // In routing:
 * <Route path="/suppliers/:supplierId/gateway" element={<SupplierGatewayPage />} />
 */

export { default as SuppliersList } from './SuppliersList'
export { SuppliersManagement } from './SuppliersManagement'
export { SupplierGateway, SupplierGatewayPage } from './SupplierGateway'
export type { SupplierGatewayProps } from './SupplierGateway'
