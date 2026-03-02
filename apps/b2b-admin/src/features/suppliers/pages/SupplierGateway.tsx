import React, { useState, useCallback } from "react";
import { GatewayFormProvider } from "@/features/suppliers/context/GatewayFormContext";
import { GatewayForm } from "../components/api-gateway/GatewayForm";
import { GatewayHealthStatus } from "../components/api-gateway/GatewayHealthStatus";

import { Button } from "@tripalfa/ui-components/ui/button";

type Environment = "development" | "staging" | "production";

type SupplierAPIGatewayFormData = {
  environments: any[];
  activeEnvironment?: Environment;
  globalHeaders?: any[];
  globalQueryParameters?: any[];
  productConfigs?: any[];
  geographyRoutings?: any[];
  channelRoutings?: any[];
  allowDevelopment?: boolean;
  requireStagingApproval?: boolean;
  requireProductionApproval?: boolean;
  [key: string]: any;
};

type GatewayConfig = {
  id?: string;
  activeEnvironment?: Environment;
  environments?: Record<string, any>;
  globalConfiguration?: {
    globalHeaders?: any[];
    globalQueryParameters?: any[];
    productConfigs?: any[];
    geographyRoutings?: any[];
    channelRoutings?: any[];
  };
  environmentManagement?: {
    allowDevelopment?: boolean;
    requireStagingApproval?: boolean;
    requireProductionApproval?: boolean;
  };
  [key: string]: any;
};

/**
 * Convert SupplierAPIGateway to SupplierAPIGatewayFormData for form context
 */
function convertToFormData(
  gateway?: Partial<GatewayConfig>,
): Partial<SupplierAPIGatewayFormData> | undefined {
  if (!gateway) return undefined;

  return {
    environments: Object.entries(gateway.environments || {}).map(
      ([env, config]) => ({
        environment: env as Environment,
        isActive: config?.isActive || false,
        baseUrl: config?.baseUrl || "",
        apiVersion: config?.apiVersion,
        authenticationType: config?.authentication?.type || "api-key",
        authenticationCredentials: config?.authentication?.credentials || {},
        headers: config?.headers || [],
        queryParameters: config?.queryParameters || [],
        endpoints: config?.endpoints || [],
        timeout: config?.settings?.timeout || 10000,
        maxRetries: config?.settings?.retryPolicy?.maxRetries || 3,
        rateLimit: config?.settings?.rateLimit,
        requiresSSL: config?.settings?.requiresSSL || true,
        monitoringEnabled: config?.monitoring?.enabled || false,
      }),
    ),
    activeEnvironment: gateway.activeEnvironment,
    globalHeaders: gateway.globalConfiguration?.globalHeaders || [],
    globalQueryParameters:
      gateway.globalConfiguration?.globalQueryParameters || [],
    productConfigs:
      gateway.globalConfiguration?.productConfigs?.map((pc) => ({
        productId: pc.productId,
        endpoints: pc.endpoints,
      })) || [],
    geographyRoutings: gateway.globalConfiguration?.geographyRoutings || [],
    channelRoutings: gateway.globalConfiguration?.channelRoutings || [],
    allowDevelopment: gateway.environmentManagement?.allowDevelopment || true,
    requireStagingApproval:
      gateway.environmentManagement?.requireStagingApproval || false,
    requireProductionApproval:
      gateway.environmentManagement?.requireProductionApproval || true,
  };
}

// ============================================================================
// TYPES
// ============================================================================

export interface SupplierGatewayProps {
  /**
   * Supplier ID from route params
   */
  supplierId: string;
  /**
   * Initial gateway data (for edit mode)
   */
  initialGateway?: Partial<GatewayConfig>;
  /**
   * Callback when gateway is created/updated
   */
  onSave?: (gateway: GatewayConfig) => void;
  /**
   * Callback when user navigates back
   */
  onBack?: () => void;
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export const SupplierGateway: React.FC<SupplierGatewayProps> = ({
  supplierId,
  initialGateway,
  onSave,
  onBack,
}) => {
  const isEditMode = !!initialGateway;
  const [activeTab, setActiveTab] = useState<"configuration" | "health">(
    "configuration",
  );
  const [gatewayId, setGatewayId] = useState<string | null>(
    initialGateway?.id || null,
  );

  const handleSave = useCallback(
    async (config: GatewayConfig) => {
      try {
        // Update gateway ID after save (for health monitoring)
        if (!gatewayId && config.id) {
          setGatewayId(config.id);
        }

        onSave?.(config);
      } catch (error) {
        console.error("Failed to save gateway configuration:", error);
        throw error;
      }
    },
    [gatewayId, onSave],
  );

  const handleCancel = useCallback(() => {
    onBack?.();
  }, [onBack]);

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4 gap-2">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                API Gateway
              </h1>
              <p className="text-muted-foreground mt-1">
                <span className="font-mono">{supplierId}</span>
                {isEditMode && (
                  <span className="ml-2 text-blue-600">(Edit Mode)</span>
                )}
              </p>
            </div>
            {onBack && (
              <Button
                onClick={onBack}
                className="px-4 py-2 text-foreground border border-border rounded-lg hover:bg-muted"
              >
                ← Back
              </Button>
            )}
          </div>

          {/* Info Banner */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              {isEditMode
                ? "📝 You are editing an existing gateway configuration"
                : "✨ Set up a new API Gateway to manage your supplier integrations"}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            <Button
              onClick={() => setActiveTab("configuration")}
              className={`
                px-1 py-4 font-medium text-sm border-b-2 transition-all
                ${
                  activeTab === "configuration"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }
              `}
            >
              Configuration
            </Button>
            {gatewayId && (
              <Button
                onClick={() => setActiveTab("health")}
                className={`
                  px-1 py-4 font-medium text-sm border-b-2 transition-all
                  ${
                    activeTab === "health"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }
                `}
              >
                Health Status
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "configuration" && (
          <GatewayFormProvider
            initialFormData={convertToFormData(initialGateway)}
          >
            <GatewayForm
              supplierId={supplierId}
              initialData={convertToFormData(initialGateway)}
              onSubmit={handleSave}
              onCancel={handleCancel}
              className="max-w-4xl"
            />
          </GatewayFormProvider>
        )}

        {activeTab === "health" && gatewayId && (
          <GatewayHealthStatus
            gatewayId={gatewayId}
            refreshInterval={30000}
            showDetails={true}
          />
        )}

        {activeTab === "health" && !gatewayId && (
          <div className="p-6 text-center border-2 border-dashed border-border rounded-lg">
            <p className="text-muted-foreground mb-3">No gateway configured</p>
            <p className="text-sm text-muted-foreground">
              Save a configuration first to view health status
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// SUPPLIER GATEWAY PAGE WITH PROVIDER
// ============================================================================

/**
 * Wrapper component that includes the GatewayFormProvider context
 * Use this component in your routing
 */
export const SupplierGatewayPage: React.FC<SupplierGatewayProps> = (props) => {
  return (
    <GatewayFormProvider
      initialFormData={convertToFormData(props.initialGateway)}
    >
      <SupplierGateway {...props} />
    </GatewayFormProvider>
  );
};

export default SupplierGatewayPage;
