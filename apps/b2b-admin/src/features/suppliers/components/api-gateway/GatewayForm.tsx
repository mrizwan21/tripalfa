import React, { useState, useCallback } from "react";
import { useGatewayForm } from "@/features/suppliers/context/GatewayFormContext";
import { EnvironmentSelector } from "./EnvironmentSelector";
import { ProductSelector } from "./ProductSelector";
import { AuthenticationForm } from "./AuthenticationForm";
import { EndpointConfigurator } from "./EndpointConfigurator";
import { RoutingConfigurator } from "./RoutingConfigurator";

import { Button } from "@tripalfa/ui-components/ui/button";

type SupplierAPIGatewayFormData = {
  selectedEnvironment?: string;
  selectedProducts?: string[];
  selectedAuthType?: string;
  environments?: any[];
  activeEnvironment?: string;
  geographyRoutings?: any[];
  channelRoutings?: any[];
  notes?: string;
  tags?: string[];
  endpoints?: any[];
};

type GatewayConfig = Record<string, any>;

// ============================================================================
// TYPES
// ============================================================================

// Specific section identifiers for better type safety
export type GatewayFormSection =
  | "environment"
  | "products"
  | "authentication"
  | "endpoints"
  | "routing"
  | "summary";

// Completion status for each section
export type SectionCompletionStatus = Record<GatewayFormSection, boolean>;

// Form submission state
export type FormSubmissionState =
  | "idle"
  | "validating"
  | "submitting"
  | "success"
  | "error";

// More precise initial data type - only allow specific fields that make sense for initialization
export type GatewayFormInitialData = Pick<
  Partial<SupplierAPIGatewayFormData>,
  | "selectedEnvironment"
  | "selectedProducts"
  | "selectedAuthType"
  | "environments"
  | "activeEnvironment"
  | "geographyRoutings"
  | "channelRoutings"
  | "notes"
  | "tags"
>;

export interface GatewayFormProps {
  /**
   * Initial gateway configuration (optional) - restricted to sensible initialization fields
   */
  initialData?: GatewayFormInitialData;
  /**
   * Supplier ID (required for API calls and health monitoring)
   */
  supplierId: string;
  /**
   * Callback when form is submitted successfully
   */
  onSubmit?: (config: GatewayConfig) => Promise<void>;
  /**
   * Callback when form submission fails
   */
  onSubmitError?: (error: Error) => void;
  /**
   * Callback when form is cancelled
   */
  onCancel?: () => void;
  /**
   * Read-only mode - disables all form interactions
   */
  readOnly?: boolean;
  /**
   * Custom CSS class for the root container
   */
  className?: string;
  /**
   * Whether to show the configuration summary section
   */
  showSummary?: boolean;
  /**
   * Whether to auto-expand sections as they become available
   */
  autoExpandSections?: boolean;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const GatewayForm: React.FC<GatewayFormProps> = ({
  initialData,
  supplierId,
  onSubmit,
  onSubmitError,
  onCancel,
  readOnly = false,
  className = "",
  showSummary = true,
  autoExpandSections = false,
}) => {
  const form = useGatewayForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionState, setSubmissionState] =
    useState<FormSubmissionState>("idle");
  const [expandedSections, setExpandedSections] =
    useState<SectionCompletionStatus>({
      environment: true,
      products: true,
      authentication: false,
      endpoints: false,
      routing: false,
      summary: false,
    });

  // Calculate completion percentage
  const completionSteps = {
    environment: !!form.formData.selectedEnvironment,
    products: (form.formData.selectedProducts?.length || 0) > 0,
    authentication: !!form.formData.selectedAuthType,
    endpoints: (form.formData.endpoints?.length || 0) > 0,
    routing:
      (form.formData.geographyRoutings?.length || 0) > 0 ||
      (form.formData.channelRoutings?.length || 0) > 0,
  };

  const completedSteps = Object.values(completionSteps).filter(Boolean).length;
  const totalSteps = Object.values(completionSteps).length;
  const completionPercent = Math.round((completedSteps / totalSteps) * 100);

  const toggleSection = useCallback((section: GatewayFormSection) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  }, []);

  const handleSubmit = useCallback(async () => {
    setSubmissionState("validating");

    // Validate form before submission
    const isValid = await form.validateForm();
    if (!isValid) {
      setSubmissionState("idle");
      return;
    }

    setSubmissionState("submitting");
    setIsSubmitting(true);

    try {
      if (onSubmit) {
        await onSubmit(form.formData as unknown as GatewayConfig);
      }
      setSubmissionState("success");
      form.setSuccessMessage("Gateway configuration saved successfully");
    } catch (error) {
      const errorObj =
        error instanceof Error
          ? error
          : new Error("Failed to save configuration");
      setSubmissionState("error");
      form.setErrorMessage(errorObj.message);
      onSubmitError?.(errorObj);
    } finally {
      setIsSubmitting(false);
    }
  }, [form, onSubmit, onSubmitError]);

  const handleCancel = useCallback(() => {
    form.resetForm();
    onCancel?.();
  }, [form, onCancel]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            API Gateway Configuration
          </h2>
          <p className="text-muted-foreground mt-1">
            Supplier: <span className="font-mono">{supplierId}</span>
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-blue-600">
            {completionPercent}%
          </div>
          <p className="text-sm text-muted-foreground">
            {completedSteps} of {totalSteps} sections complete
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${completionPercent}%` }}
        />
      </div>

      {/* Messages */}
      {form.messages.success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800">{form.messages.success}</p>
        </div>
      )}

      {form.messages.error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{form.messages.error}</p>
        </div>
      )}

      {/* Sections */}
      <div className="space-y-4">
        {/* Environment Section */}
        <CollapsibleSection
          title="Environment"
          icon="🌍"
          isExpanded={expandedSections.environment}
          onToggle={() => toggleSection("environment")}
          isComplete={completionSteps.environment}
          hasError={!!form.errors.selectedEnvironment}
        >
          <EnvironmentSelector disabled={readOnly} />
        </CollapsibleSection>

        {/* Products Section */}
        <CollapsibleSection
          title="Products"
          icon="📦"
          isExpanded={expandedSections.products}
          onToggle={() => toggleSection("products")}
          isComplete={completionSteps.products}
          hasError={!!form.errors.selectedProducts}
        >
          <ProductSelector disabled={readOnly} />
        </CollapsibleSection>

        {/* Authentication Section */}
        <CollapsibleSection
          title="Authentication"
          icon="🔐"
          isExpanded={expandedSections.authentication}
          onToggle={() => toggleSection("authentication")}
          isComplete={completionSteps.authentication}
          hasError={!!form.errors.selectedAuthType}
        >
          <AuthenticationForm
            environment={form.activeEnvironment}
            disabled={readOnly}
          />
        </CollapsibleSection>

        {/* Endpoints Section */}
        {completionSteps.products && (
          <CollapsibleSection
            title="Endpoints"
            icon="🔗"
            isExpanded={expandedSections.endpoints}
            onToggle={() => toggleSection("endpoints")}
            isComplete={completionSteps.endpoints}
            hasError={!!form.errors.endpoints}
          >
            <EndpointConfigurator
              supplierId={supplierId}
              environment={form.activeEnvironment}
              disabled={readOnly}
            />
          </CollapsibleSection>
        )}

        {/* Routing Section */}
        <CollapsibleSection
          title="Smart Routing"
          icon="🛣️"
          isExpanded={expandedSections.routing}
          onToggle={() => toggleSection("routing")}
          isComplete={completionSteps.routing}
        >
          <RoutingConfigurator disabled={readOnly} />
        </CollapsibleSection>

        {/* Summary Section */}
        {completedSteps === totalSteps && (
          <CollapsibleSection
            title="Configuration Summary"
            icon="✅"
            isExpanded={expandedSections.summary}
            onToggle={() => toggleSection("summary")}
            isComplete={true}
          >
            <ConfigurationSummary
              config={form.formData}
              supplierId={supplierId}
            />
          </CollapsibleSection>
        )}
      </div>

      {/* Actions */}
      {!readOnly && (
        <div className="flex gap-3 justify-end pt-6 border-t">
          <Button
            onClick={handleCancel}
            disabled={isSubmitting || !form.isDirty}
            className="px-6 py-3 border border-border rounded-lg text-foreground hover:bg-muted disabled:opacity-50"
          >
            Cancel Changes
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting || !form.isDirty || completedSteps < totalSteps
            }
            className={`
              px-6 py-3 rounded-lg text-white font-medium
              ${
                isSubmitting || !form.isDirty || completedSteps < totalSteps
                  ? "bg-muted-foreground cursor-not-allowed opacity-50"
                  : "bg-blue-600 hover:bg-blue-700"
              }
            `}
          >
            {isSubmitting ? (
              <>
                <span className="inline-block animate-spin mr-2">⟳</span>
                Saving...
              </>
            ) : (
              "Save Configuration"
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// COLLAPSIBLE SECTION COMPONENT
// ============================================================================

interface CollapsibleSectionProps {
  title: string;
  icon?: string;
  isExpanded: boolean;
  onToggle: () => void;
  isComplete: boolean;
  hasError?: boolean;
  children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  isExpanded,
  onToggle,
  isComplete,
  hasError,
  children,
}) => {
  return (
    <div
      className={`border rounded-lg overflow-hidden ${hasError ? "border-red-300 bg-red-50" : "border-border"}`}
    >
      <Button
        onClick={onToggle}
        className={`
          w-full px-6 py-4 flex items-center justify-between
          ${isExpanded ? "bg-muted border-b" : "hover:bg-muted"}
          transition-colors
        `}
      >
        <div className="flex items-center gap-3">
          {icon && <span className="text-xl">{icon}</span>}
          <span className="font-semibold text-foreground">{title}</span>
          {isComplete && <span className="ml-2 text-green-600">✓</span>}
          {hasError && <span className="ml-2 text-red-600">✕</span>}
        </div>
        <span
          className={`
            text-muted-foreground transition-transform
            ${isExpanded ? "rotate-180" : ""}
          `}
        >
          ▼
        </span>
      </Button>

      {isExpanded && <div className="px-6 py-4 bg-card">{children}</div>}
    </div>
  );
};

// ============================================================================
// CONFIGURATION SUMMARY COMPONENT
// ============================================================================

interface ConfigurationSummaryProps {
  config: Partial<SupplierAPIGatewayFormData>;
  supplierId: string;
}

const ConfigurationSummary: React.FC<ConfigurationSummaryProps> = ({
  config,
  supplierId,
}) => {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Environment Summary */}
        <SummaryCard
          title="Environment"
          icon="🌍"
          items={[
            {
              label: "Selected",
              value:
                config.selectedEnvironment?.charAt(0).toUpperCase() +
                (config.selectedEnvironment?.slice(1) || ""),
            },
            {
              label: "Timeout",
              value: "30s", // Default timeout
            },
          ]}
        />

        {/* Products Summary */}
        <SummaryCard
          title="Products"
          icon="📦"
          items={[
            {
              label: "Count",
              value: config.selectedProducts?.length || 0,
            },
            {
              label: "Products",
              value: config.selectedProducts?.join(", ") || "None",
            },
          ]}
        />

        {/* Authentication Summary */}
        <SummaryCard
          title="Authentication"
          icon="🔐"
          items={[
            {
              label: "Type",
              value:
                config.selectedAuthType?.charAt(0).toUpperCase() +
                (config.selectedAuthType?.slice(1) || ""),
            },
            {
              label: "Status",
              value: "Configured",
            },
          ]}
        />

        {/* Endpoints Summary */}
        <SummaryCard
          title="Endpoints"
          icon="🔗"
          items={[
            {
              label: "Configured",
              value: config.endpoints?.length || 0,
            },
            {
              label: "Status",
              value:
                config.endpoints && config.endpoints.length > 0
                  ? "Ready"
                  : "Pending",
            },
          ]}
        />

        {/* Routing Summary */}
        <SummaryCard
          title="Geography Routing"
          icon="🗺️"
          items={[
            {
              label: "Rules",
              value: config.geographyRoutings?.length || 0,
            },
            {
              label: "Status",
              value:
                config.geographyRoutings && config.geographyRoutings.length > 0
                  ? "Active"
                  : "None",
            },
          ]}
        />

        {/* Channel Routing Summary */}
        <SummaryCard
          title="Channel Routing"
          icon="📱"
          items={[
            {
              label: "Rules",
              value: config.channelRoutings?.length || 0,
            },
            {
              label: "Status",
              value:
                config.channelRoutings && config.channelRoutings.length > 0
                  ? "Active"
                  : "None",
            },
          ]}
        />
      </div>

      {/* Configuration Details */}
      <div className="p-4 bg-muted rounded-lg border border-border">
        <h4 className="font-semibold text-foreground mb-3">
          Configuration Details
        </h4>
        <div className="space-y-2 text-sm">
          <DetailRow label="Supplier ID" value={supplierId} />
          <DetailRow
            label="Environment"
            value={config.selectedEnvironment || "N/A"}
          />
          <DetailRow
            label="Selected Products"
            value={config.selectedProducts?.join(", ") || "None"}
          />
          <DetailRow
            label="Total Endpoints"
            value={config.endpoints?.length.toString() || "0"}
          />
          <DetailRow
            label="Geography Rules"
            value={config.geographyRoutings?.length.toString() || "0"}
          />
          <DetailRow
            label="Channel Rules"
            value={config.channelRoutings?.length.toString() || "0"}
          />
        </div>
      </div>

      {/* Ready to Save */}
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-green-800 font-medium">
          ✓ Configuration is complete
        </p>
        <p className="text-green-700 text-sm mt-1">
          All required sections have been filled. Click "Save Configuration" to
          proceed.
        </p>
      </div>
    </div>
  );
};

// ============================================================================
// SUMMARY CARD COMPONENT
// ============================================================================

interface SummaryCardProps {
  title: string;
  icon?: string;
  items: Array<{ label: string; value: string | number }>;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, icon, items }) => {
  return (
    <div className="p-4 bg-muted border border-border rounded-lg">
      <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
        {icon && <span>{icon}</span>}
        {title}
      </h4>
      <div className="space-y-2">
        {items.map((item, index) => (
          <DetailRow
            key={index}
            label={item.label}
            value={item.value.toString()}
          />
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// DETAIL ROW COMPONENT
// ============================================================================

interface DetailRowProps {
  label: string;
  value: string;
}

const DetailRow: React.FC<DetailRowProps> = ({ label, value }) => (
  <div className="flex justify-between gap-4">
    <span className="text-muted-foreground">{label}:</span>
    <span className="font-mono text-foreground font-medium">{value}</span>
  </div>
);
