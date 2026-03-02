import React, { useMemo } from "react";
import { useGatewayForm } from "@/features/suppliers/context/GatewayFormContext";
import { useEnvironmentConfig } from "@/features/suppliers/hooks/useGateway";

import { Button } from "@tripalfa/ui-components/ui/button";

type Environment = "development" | "staging" | "production";

// ============================================================================
// TYPES
// ============================================================================

export interface EnvironmentSelectorProps {
  /**
   * Callback when environment is selected
   */
  onEnvironmentChange?: (environment: Environment) => void;
  /**
   * Show status indicators
   */
  showStatus?: boolean;
  /**
   * Show configuration details
   */
  showDetails?: boolean;
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
// ENVIRONMENT SELECTOR COMPONENT
// ============================================================================

export const EnvironmentSelector: React.FC<EnvironmentSelectorProps> = ({
  onEnvironmentChange,
  showStatus = true,
  showDetails = false,
  disabled = false,
  className = "",
}) => {
  const form = useGatewayForm();

  // Get configurations for each environment
  const devConfig = useEnvironmentConfig("development");
  const stagingConfig = useEnvironmentConfig("staging");
  const prodConfig = useEnvironmentConfig("production");

  const environments: Array<{
    id: Environment;
    name: string;
    description: string;
    config: ReturnType<typeof useEnvironmentConfig>;
    badge?: string;
  }> = useMemo(
    () => [
      {
        id: "development",
        name: "Development",
        description: "Dev server with permissive settings",
        config: devConfig,
        badge: "DEV",
      },
      {
        id: "staging",
        name: "Staging",
        description: "Testing environment before production",
        config: stagingConfig,
        badge: "STAGING",
      },
      {
        id: "production",
        name: "Production",
        description: "Live production environment",
        config: prodConfig,
        badge: "PROD",
      },
    ],
    [devConfig, stagingConfig, prodConfig],
  );

  const handleEnvironmentChange = (env: Environment) => {
    if (!disabled) {
      form.setActiveEnvironment(env);
      onEnvironmentChange?.(env);
    }
  };

  const isEnvironmentConfigured = (env: Environment): boolean => {
    return (
      form.formData.environments?.some((e) => e.environment === env) || false
    );
  };

  const getEnvironmentStatus = (
    env: Environment,
  ): "configured" | "missing" | "invalid" => {
    const envConfig = form.formData.environments?.find(
      (e) => e.environment === env,
    );

    if (!envConfig) return "missing";

    // Check if required fields are filled
    const hasBaseUrl = envConfig.baseUrl && envConfig.baseUrl.trim() !== "";
    const hasCredentials =
      envConfig.authenticationCredentials &&
      Object.keys(envConfig.authenticationCredentials).length > 0;
    const hasEndpoints = envConfig.endpoints && envConfig.endpoints.length > 0;

    if (!hasBaseUrl) return "invalid";
    if (env !== "development" && !hasCredentials) return "invalid";
    if (env !== "development" && !hasEndpoints) return "invalid";

    return "configured";
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Environment Tabs/Buttons */}
      <div className="flex gap-2 border-b border-border">
        {environments.map((env) => {
          const isActive = form.activeEnvironment === env.id;
          const status = getEnvironmentStatus(env.id);
          const isConfigured = status === "configured";

          return (
            <Button
              key={env.id}
              onClick={() => handleEnvironmentChange(env.id)}
              disabled={disabled}
              className={`
                relative px-4 py-3 text-sm font-medium transition-colors
                ${
                  isActive
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-muted-foreground hover:text-foreground"
                }
                ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              `}
              title={
                disabled ? "This environment cannot be modified" : undefined
              }
            >
              <div className="flex items-center gap-2">
                <span>{env.name}</span>

                {/* Badge */}
                {env.badge && (
                  <span
                    className={`
                      px-2 py-0.5 text-xs font-semibold rounded-full
                      ${
                        env.id === "development"
                          ? "bg-blue-100 text-blue-800"
                          : env.id === "staging"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-red-100 text-red-800"
                      }
                    `}
                  >
                    {env.badge}
                  </span>
                )}

                {/* Status Indicator */}
                {showStatus && (
                  <span
                    className={`
                      inline-block w-2 h-2 rounded-full
                      ${
                        status === "configured"
                          ? "bg-green-500"
                          : status === "invalid"
                            ? "bg-red-500"
                            : "bg-muted"
                      }
                    `}
                    title={
                      status === "configured"
                        ? "Environment configured"
                        : status === "invalid"
                          ? "Configuration incomplete"
                          : "Not yet configured"
                    }
                  />
                )}
              </div>
            </Button>
          );
        })}
      </div>

      {/* Environment Details Panel */}
      {showDetails && (
        <div className="bg-muted rounded-lg p-4 border border-border">
          <div className="space-y-4">
            {environments.map((env) => (
              <div
                key={env.id}
                className={`pb-4 border-b last:border-b-0 ${
                  form.activeEnvironment === env.id ? "block" : "hidden"
                }`}
              >
                {/* Environment Title & Description */}
                <div className="mb-4">
                  <h3 className="font-semibold text-foreground text-xl font-semibold tracking-tight">
                    {env.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {env.description}
                  </p>
                </div>

                {/* Configuration Requirements */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground">
                    Security & Performance
                  </h4>
                  <ul className="text-sm space-y-2">
                    <li className="flex items-center gap-2">
                      {env.config.requiresSSL ? (
                        <span className="text-green-600">✓</span>
                      ) : (
                        <span className="text-muted-foreground">○</span>
                      )}
                      <span>
                        SSL/TLS{" "}
                        {env.config.requiresSSL ? "Required" : "Optional"}
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      {env.config.requiresApproval ? (
                        <span className="text-red-600">●</span>
                      ) : (
                        <span className="text-muted-foreground">○</span>
                      )}
                      <span>
                        Manual Approval{" "}
                        {env.config.requiresApproval ? "Required" : "Optional"}
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      {env.config.requiresMonitoring ? (
                        <span className="text-green-600">✓</span>
                      ) : (
                        <span className="text-muted-foreground">○</span>
                      )}
                      <span>
                        Monitoring{" "}
                        {env.config.requiresMonitoring
                          ? "Required"
                          : "Optional"}
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Performance Settings */}
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-medium text-foreground">
                    Performance Limits
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-card p-2 rounded">
                      <p className="text-muted-foreground">Timeout</p>
                      <p className="font-semibold text-foreground">
                        {env.config.timeout || 15000}ms
                      </p>
                    </div>
                    <div className="bg-card p-2 rounded">
                      <p className="text-muted-foreground">Rate Limit</p>
                      <p className="font-semibold text-foreground">
                        {env.config.rateLimit
                          ? `${env.config.rateLimit} req/s`
                          : "Unlimited"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Configuration Status */}
                <div className="mt-4">
                  <EnvironmentConfigurationStatus
                    environment={env.id}
                    status={getEnvironmentStatus(env.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Environment Selection Summary */}
      {!showDetails && form.formData.environments && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {environments.map((env) => {
            const status = getEnvironmentStatus(env.id);
            const isActive = form.activeEnvironment === env.id;

            return (
              <div
                key={env.id}
                className={`
                  p-3 rounded-lg border-2 transition-all cursor-pointer
                  ${
                    isActive
                      ? "border-blue-500 bg-blue-50"
                      : "border-border hover:border-border"
                  }
                  ${disabled ? "opacity-50 cursor-not-allowed" : ""}
                `}
                onClick={() => handleEnvironmentChange(env.id)}
                role="button"
                tabIndex={disabled ? -1 : 0}
                onKeyDown={(e) => {
                  if (!disabled && (e.key === "Enter" || e.key === " ")) {
                    handleEnvironmentChange(env.id);
                  }
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-foreground">{env.name}</h4>
                  <span
                    className={`
                      text-xs px-2 py-1 rounded-full font-semibold
                      ${
                        status === "configured"
                          ? "bg-green-100 text-green-700"
                          : status === "invalid"
                            ? "bg-red-100 text-red-700"
                            : "bg-muted text-muted-foreground"
                      }
                    `}
                  >
                    {status === "configured"
                      ? "✓ Ready"
                      : status === "invalid"
                        ? "✗ Incomplete"
                        : "○ Empty"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {env.description}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// ENVIRONMENT CONFIGURATION STATUS COMPONENT
// ============================================================================

interface EnvironmentConfigurationStatusProps {
  environment: Environment;
  status: "configured" | "missing" | "invalid";
}

const EnvironmentConfigurationStatus: React.FC<
  EnvironmentConfigurationStatusProps
> = ({ environment, status }) => {
  const statusMessages = {
    configured: {
      title: "Configuration Complete",
      description: "All required fields are configured",
      color: "bg-green-50 border-green-200 text-green-700",
    },
    invalid: {
      title: "Configuration Incomplete",
      description: "Some required fields are missing or invalid",
      color: "bg-red-50 border-red-200 text-red-700",
    },
    missing: {
      title: "Not Yet Configured",
      description: "No configuration found for this environment",
      color: "bg-muted border-border text-foreground",
    },
  };

  const message = statusMessages[status];

  return (
    <div className={`p-2 rounded border ${message.color}`}>
      <p className="text-xs font-medium">{message.title}</p>
      <p className="text-xs opacity-80">{message.description}</p>
    </div>
  );
};

// ============================================================================
// TAB-BASED VARIANT
// ============================================================================

export const EnvironmentSelectorTabs: React.FC<EnvironmentSelectorProps> = (
  props,
) => {
  return <EnvironmentSelector {...props} showDetails={true} />;
};

// ============================================================================
// INLINE VARIANT (For use within forms)
// ============================================================================

export const EnvironmentSelectorInline: React.FC<
  Omit<EnvironmentSelectorProps, "showStatus">
> = (props) => {
  return (
    <EnvironmentSelector {...props} showStatus={true} showDetails={false} />
  );
};
