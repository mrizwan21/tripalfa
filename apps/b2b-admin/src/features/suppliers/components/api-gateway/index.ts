/**
 * API Gateway Components
 *
 * This module exports all components for the API Gateway feature:
 * - EnvironmentSelector: Choose deployment environment (dev/staging/prod)
 * - ProductSelector: Select products to integrate
 * - AuthenticationForm: Configure authentication credentials
 * - EndpointConfigurator: Manage API endpoints
 * - RoutingConfigurator: Set up geography/channel routing
 * - GatewayForm: Main orchestrator form
 * - GatewayHealthStatus: Real-time gateway health monitoring
 *
 * Usage:
 *
 * // Standalone component usage:
 * import { GatewayForm } from '@/features/suppliers/components/api-gateway'
 * import { GatewayFormProvider } from '@/features/suppliers/context/GatewayFormContext'
 *
 * <GatewayFormProvider>
 *   <GatewayForm supplierId={id} onSubmit={handleSubmit} />
 * </GatewayFormProvider>
 *
 * // Page usage:
 * import { SupplierGatewayPage } from '@/features/suppliers/pages'
 *
 * // In routing:
 * <Route path="/suppliers/:supplierId/gateway" element={<SupplierGatewayPage />} />
 */

export { EnvironmentSelector } from "./EnvironmentSelector";
export type { EnvironmentSelectorProps } from "./EnvironmentSelector";

export { ProductSelector } from "./ProductSelector";
export type { ProductSelectorProps } from "./ProductSelector";

export { AuthenticationForm } from "./AuthenticationForm";
export type { AuthenticationFormProps } from "./AuthenticationForm";

export { EndpointConfigurator } from "./EndpointConfigurator";
export type { EndpointConfiguratorProps } from "./EndpointConfigurator";

export { RoutingConfigurator } from "./RoutingConfigurator";
export type { RoutingConfiguratorProps } from "./RoutingConfigurator";

export { GatewayForm } from "./GatewayForm";
export type { GatewayFormProps } from "./GatewayForm";

export { GatewayHealthStatus } from "./GatewayHealthStatus";
export type {
  GatewayHealthStatusProps,
  HealthCheckResult,
} from "./GatewayHealthStatus";
