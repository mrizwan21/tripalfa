import React, { useState, useCallback, useMemo } from "react";
import { useGatewayForm } from "@/features/suppliers/context/GatewayFormContext";
import { Button } from "@tripalfa/ui-components/ui/button";

import {
  useGatewayTest,
  useProductSchema,
} from "@/features/suppliers/hooks/useGateway";

type Environment = "development" | "staging" | "production";

// ============================================================================
// TYPES
// ============================================================================

export interface EndpointConfiguratorProps {
  /**
   * Supplier ID for API calls
   */
  supplierId: string;
  /**
   * Gateway ID for testing
   */
  gatewayId?: string;
  /**
   * Selected environment
   */
  environment: Environment;
  /**
   * Selected product
   */
  product?: string;
  /**
   * Callback when endpoints change
   */
  onEndpointsChange?: (endpoints: any[]) => void;
  /**
   * Disabled state
   */
  disabled?: boolean;
  /**
   * Custom CSS class
   */
  className?: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const EndpointConfigurator: React.FC<EndpointConfiguratorProps> = ({
  supplierId,
  gatewayId,
  environment,
  product = "hotel",
  onEndpointsChange,
  disabled = false,
  className = "",
}) => {
  const form = useGatewayForm();
  const { schema, loading: schemaLoading } = useProductSchema(product);
  const {
    testEndpoint,
    testing,
    result: testResult,
  } = useGatewayTest(supplierId, gatewayId || "");

  const [selectedEndpointId, setSelectedEndpointId] = useState<string | null>(
    null,
  );
  const [isAddingEndpoint, setIsAddingEndpoint] = useState(false);
  const [editingEndpointId, setEditingEndpointId] = useState<string | null>(
    null,
  );

  // Get current environment config
  const envConfig = form.formData.environments?.find(
    (e) => e.environment === environment,
  );
  const endpoints = envConfig?.endpoints || [];

  // Handle add endpoint
  const handleAddEndpoint = useCallback(() => {
    setIsAddingEndpoint(true);
    setSelectedEndpointId(null);
  }, []);

  // Handle endpoint save
  const handleEndpointSave = useCallback(
    (endpointData: any) => {
      if (!gatewayId) {
        // For new gateways, just update form state
        const updatedEndpoints = editingEndpointId
          ? endpoints.map((e: any) =>
              e.id === editingEndpointId ? { ...e, ...endpointData } : e,
            )
          : [
              ...endpoints,
              {
                id: `endpoint-${Date.now()}`,
                ...endpointData,
              },
            ];

        form.updateField(
          `environments.${environment}.endpoints`,
          updatedEndpoints,
        );
        onEndpointsChange?.(updatedEndpoints);
      }

      setEditingEndpointId(null);
      setIsAddingEndpoint(false);
    },
    [
      endpoints,
      environment,
      editingEndpointId,
      form,
      gatewayId,
      onEndpointsChange,
    ],
  );

  // Handle endpoint delete
  const handleEndpointDelete = useCallback(
    (endpointId: string) => {
      const updatedEndpoints = endpoints.filter(
        (e: any) => e.id !== endpointId,
      );
      form.updateField(
        `environments.${environment}.endpoints`,
        updatedEndpoints,
      );
      onEndpointsChange?.(updatedEndpoints);
      setSelectedEndpointId(null);
    },
    [endpoints, environment, form, onEndpointsChange],
  );

  const categorizedEndpoints = useMemo(() => {
    return {
      configured: endpoints.filter((e: any) => e.configured),
      unconfigured: endpoints.filter((e: any) => !e.configured),
    };
  }, [endpoints]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Add Endpoint Button */}
      {!isAddingEndpoint && !editingEndpointId && (
        <Button
          onClick={handleAddEndpoint}
          disabled={disabled}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          + Add Custom Endpoint
        </Button>
      )}

      {/* Add/Edit Endpoint Form */}
      {(isAddingEndpoint || editingEndpointId) && (
        <EndpointForm
          environment={environment}
          endpoint={
            editingEndpointId
              ? endpoints.find((e: any) => e.id === editingEndpointId)
              : undefined
          }
          onSave={handleEndpointSave}
          onCancel={() => {
            setIsAddingEndpoint(false);
            setEditingEndpointId(null);
          }}
          disabled={disabled}
        />
      )}

      {/* Product Schema Endpoints */}
      {schema && schema.endpoints && schema.endpoints.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-foreground">
            Available {product} Endpoints
          </h4>
          <p className="text-sm text-muted-foreground">
            {schema.endpoints.length} endpoints available for {product}. Enable
            these to make them available for this gateway.
          </p>

          <div className="space-y-2">
            {schema.endpoints.map((endpoint: any) => (
              <EndpointChecklistItem
                key={endpoint.id}
                endpoint={endpoint}
                isEnabled={endpoints.some((e: any) => e.id === endpoint.id)}
                onEnable={() => {
                  const newEndpoint = {
                    id: endpoint.id,
                    name: endpoint.name,
                    method: endpoint.method,
                    url: endpoint.url,
                    timeout: 5000,
                    configured: false,
                  };
                  form.updateField(`environments.${environment}.endpoints`, [
                    ...endpoints,
                    newEndpoint,
                  ]);
                  onEndpointsChange?.([...endpoints, newEndpoint]);
                }}
                onDisable={() => handleEndpointDelete(endpoint.id)}
                onConfigure={() => setEditingEndpointId(endpoint.id)}
                disabled={disabled}
              />
            ))}
          </div>
        </div>
      )}

      {/* Configured Endpoints */}
      {categorizedEndpoints.configured.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-foreground">
            Configured Endpoints ({categorizedEndpoints.configured.length})
          </h4>

          <div className="space-y-2">
            {categorizedEndpoints.configured.map((endpoint: any) => (
              <EndpointCard
                key={endpoint.id}
                endpoint={endpoint}
                isSelected={selectedEndpointId === endpoint.id}
                onSelect={() => setSelectedEndpointId(endpoint.id)}
                onEdit={() => setEditingEndpointId(endpoint.id)}
                onDelete={() => handleEndpointDelete(endpoint.id)}
                onTest={
                  gatewayId ? () => testEndpoint(endpoint.id, {}) : undefined
                }
                testLoading={testing}
                testResult={testResult}
                disabled={disabled}
              />
            ))}
          </div>
        </div>
      )}

      {/* Unconfigured Endpoints */}
      {categorizedEndpoints.unconfigured.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-foreground">
            Unconfigured Endpoints ({categorizedEndpoints.unconfigured.length})
          </h4>
          <p className="text-sm text-amber-600">
            ⚠️ These endpoints need configuration before they can be used
          </p>

          <div className="space-y-2">
            {categorizedEndpoints.unconfigured.map((endpoint: any) => (
              <EndpointCard
                key={endpoint.id}
                endpoint={endpoint}
                isSelected={selectedEndpointId === endpoint.id}
                onSelect={() => setSelectedEndpointId(endpoint.id)}
                onEdit={() => setEditingEndpointId(endpoint.id)}
                onDelete={() => handleEndpointDelete(endpoint.id)}
                incomplete={true}
                disabled={disabled}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {endpoints.length === 0 && !isAddingEndpoint && (
        <div className="p-8 text-center border-2 border-dashed border-border rounded-lg">
          <p className="text-muted-foreground mb-3">
            No endpoints configured yet
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Add endpoints from the {product} product schema or create custom
            endpoints
          </p>
          <Button
            onClick={handleAddEndpoint}
            disabled={disabled}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create First Endpoint
          </Button>
        </div>
      )}

      {/* Summary */}
      {endpoints.length > 0 && (
        <EndpointSummary
          total={endpoints.length}
          configured={categorizedEndpoints.configured.length}
          testing={testing}
        />
      )}
    </div>
  );
};

// ============================================================================
// ENDPOINT FORM COMPONENT
// ============================================================================

interface EndpointFormProps {
  environment: Environment;
  endpoint?: any;
  onSave: (endpointData: any) => void;
  onCancel: () => void;
  disabled: boolean;
}

const EndpointForm: React.FC<EndpointFormProps> = ({
  environment,
  endpoint,
  onSave,
  onCancel,
  disabled,
}) => {
  const [formData, setFormData] = useState(
    endpoint || {
      name: "",
      method: "GET",
      url: "",
      timeout: 5000,
      retryPolicy: {
        maxRetries: 3,
        backoffMultiplier: 2,
        initialDelay: 100,
      },
      cacheEnabled: false,
      cacheTTL: 300,
    },
  );

  return (
    <div className="p-4 bg-muted border border-border rounded-lg space-y-4">
      <h4 className="font-medium text-foreground">
        {endpoint ? "Edit" : "Add"} Endpoint
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Get Available Hotels"
            disabled={disabled}
            className="w-full px-3 py-2 border border-border bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Method */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            HTTP Method
          </label>
          <select
            value={formData.method}
            onChange={(e) =>
              setFormData({ ...formData, method: e.target.value })
            }
            disabled={disabled}
            className="w-full px-3 py-2 border border-border bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="PATCH">PATCH</option>
            <option value="DELETE">DELETE</option>
          </select>
        </div>

        {/* URL */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            URL Path
          </label>
          <input
            type="text"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            placeholder="/api/v1/hotels/search"
            disabled={disabled}
            className="w-full px-3 py-2 border border-border bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          />
        </div>

        {/* Timeout */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Timeout (ms)
          </label>
          <input
            type="number"
            value={formData.timeout}
            onChange={(e) =>
              setFormData({ ...formData, timeout: parseInt(e.target.value) })
            }
            min={1000}
            max={60000}
            disabled={disabled}
            className="w-full px-3 py-2 border border-border bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Retry Policy */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Max Retries
          </label>
          <input
            type="number"
            value={formData.retryPolicy.maxRetries}
            onChange={(e) =>
              setFormData({
                ...formData,
                retryPolicy: {
                  ...formData.retryPolicy,
                  maxRetries: parseInt(e.target.value),
                },
              })
            }
            min={0}
            max={10}
            disabled={disabled}
            className="w-full px-3 py-2 border border-border bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Cache */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            <input
              type="checkbox"
              checked={formData.cacheEnabled}
              onChange={(e) =>
                setFormData({ ...formData, cacheEnabled: e.target.checked })
              }
              disabled={disabled}
              className="rounded"
            />
            <span className="text-sm font-medium text-muted-foreground">
              Enable Caching
            </span>
          </label>
          {formData.cacheEnabled && (
            <input
              type="number"
              value={formData.cacheTTL}
              onChange={(e) =>
                setFormData({ ...formData, cacheTTL: parseInt(e.target.value) })
              }
              min={10}
              placeholder="TTL (seconds)"
              disabled={disabled}
              className="w-full px-3 py-2 border border-border bg-background rounded-lg mt-2 text-sm"
            />
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end pt-4 border-t">
        <Button
          onClick={onCancel}
          disabled={disabled}
          className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-sm font-medium"
        >
          Cancel
        </Button>
        <Button
          onClick={() => onSave(formData)}
          disabled={disabled || !formData.name || !formData.url}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {endpoint ? "Update" : "Add"} Endpoint
        </Button>
      </div>
    </div>
  );
};

// ============================================================================
// ENDPOINT CARD COMPONENT
// ============================================================================

interface EndpointCardProps {
  endpoint: any;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onTest?: () => void;
  testLoading?: boolean;
  testResult?: any;
  incomplete?: boolean;
  disabled: boolean;
}

const EndpointCard: React.FC<EndpointCardProps> = ({
  endpoint,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onTest,
  testLoading = false,
  testResult,
  incomplete = false,
  disabled,
}) => {
  return (
    <div
      onClick={onSelect}
      className={`
        p-4 rounded-lg border-2 cursor-pointer transition-all
        ${isSelected ? "border-blue-500 bg-blue-50" : "border-border hover:border-border"}
        ${incomplete ? "opacity-75" : ""}
      `}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 gap-4">
          <h4 className="font-medium text-foreground">{endpoint.name}</h4>
          <p className="text-xs text-muted-foreground mt-1 font-mono">
            {endpoint.method} {endpoint.url}
          </p>
        </div>
        <div className="flex gap-1">
          {incomplete && (
            <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs font-medium">
              Incomplete
            </span>
          )}
          <span
            className={`px-2 py-1 rounded text-xs font-medium text-white ${
              endpoint.method === "GET"
                ? "bg-blue-600"
                : endpoint.method === "POST"
                  ? "bg-green-600"
                  : endpoint.method === "PUT"
                    ? "bg-yellow-600"
                    : endpoint.method === "DELETE"
                      ? "bg-red-600"
                      : "bg-muted-foreground"
            }`}
          >
            {endpoint.method}
          </span>
        </div>
      </div>

      <div className="text-xs text-muted-foreground space-y-2 mb-3">
        <p>⏱️ Timeout: {endpoint.timeout}ms</p>
        <p>🔄 Retries: {endpoint.retryPolicy?.maxRetries || 0}</p>
        {endpoint.cacheEnabled && <p>💾 Caching: {endpoint.cacheTTL}s TTL</p>}
      </div>

      <div className="flex gap-2 justify-end pt-2 border-t">
        {onTest && (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onTest();
            }}
            disabled={disabled || testLoading}
            className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200"
          >
            {testLoading ? "⏳ Testing..." : "✓ Test"}
          </Button>
        )}
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          disabled={disabled}
          className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
        >
          Edit
        </Button>
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          disabled={disabled}
          className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200"
        >
          Delete
        </Button>
      </div>
    </div>
  );
};

// ============================================================================
// ENDPOINT CHECKLIST ITEM COMPONENT
// ============================================================================

interface EndpointChecklistItemProps {
  endpoint: any;
  isEnabled: boolean;
  onEnable: () => void;
  onDisable: () => void;
  onConfigure: () => void;
  disabled: boolean;
}

const EndpointChecklistItem: React.FC<EndpointChecklistItemProps> = ({
  endpoint,
  isEnabled,
  onEnable,
  onDisable,
  onConfigure,
  disabled,
}) => {
  return (
    <div className="flex items-center gap-3 p-3 bg-background border border-border rounded-lg hover:border-border">
      <input
        type="checkbox"
        checked={isEnabled}
        onChange={isEnabled ? onDisable : onEnable}
        disabled={disabled}
        className="w-4 h-4 rounded cursor-pointer"
      />
      <div className="flex-1 gap-4">
        <p className="text-sm font-medium text-foreground">{endpoint.name}</p>
        <p className="text-xs text-muted-foreground font-mono">
          {endpoint.method} {endpoint.url}
        </p>
      </div>
      {isEnabled && (
        <Button
          onClick={onConfigure}
          disabled={disabled}
          className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
        >
          Configure
        </Button>
      )}
    </div>
  );
};

// ============================================================================
// ENDPOINT SUMMARY COMPONENT
// ============================================================================

interface EndpointSummaryProps {
  total: number;
  configured: number;
  testing: boolean;
}

const EndpointSummary: React.FC<EndpointSummaryProps> = ({
  total,
  configured,
  testing,
}) => {
  const percentage = Math.round((configured / total) * 100);

  return (
    <div className="p-4 bg-muted border border-border rounded-lg">
      <div className="flex items-center justify-between mb-2 gap-2">
        <h4 className="text-sm font-medium text-foreground">
          Configuration Progress
        </h4>
        <span className="text-sm font-bold text-blue-600">{percentage}%</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        {configured} of {total} endpoints configured
        {testing && " (testing in progress)"}
      </p>
    </div>
  );
};
