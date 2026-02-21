import React, { useCallback, useMemo } from 'react'
import { useGatewayForm } from '@/features/suppliers/context/GatewayFormContext'
import { useEnvironmentConfig } from '@/features/suppliers/hooks/useGateway'
import { Environment, AuthenticationType } from '@/services/api-manager/types-gateway'

// ============================================================================
// TYPES
// ============================================================================

export interface AuthenticationFormProps {
  /**
   * Selected environment (determines which config to edit)
   */
  environment: Environment
  /**
   * Available authentication types for current product
   */
  availableAuthTypes?: AuthenticationType[]
  /**
   * Current authentication credentials
   */
  credentials?: Record<string, any>
  /**
   * Callback on credentials change
   */
  onCredentialsChange?: (credentials: Record<string, any>) => void
  /**
   * Disabled state
   */
  disabled?: boolean
  /**
   * Show validation errors
   */
  showErrors?: boolean
  /**
   * Custom CSS class
   */
  className?: string
}

// ============================================================================
// AUTH TYPE FIELD DEFINITIONS
// ============================================================================

const AUTH_TYPE_CONFIGS: Record<AuthenticationType, {
  name: string
  description: string
  fields: Array<{
    name: string
    label: string
    type: 'text' | 'password' | 'email' | 'url' | 'number'
    placeholder: string
    required: boolean
    sensitive?: boolean
    help?: string
  }>
}> = {
  'api-key': {
    name: 'API Key',
    description: 'Simple API key authentication',
    fields: [
      {
        name: 'apiKey',
        label: 'API Key',
        type: 'password',
        placeholder: 'sk_live_xxxxxxxxxxxxx',
        required: true,
        sensitive: true,
        help: 'Your API key for authentication. Keep this secret.',
      },
      {
        name: 'keyLocation',
        label: 'Key Location',
        type: 'text',
        placeholder: 'header or query',
        required: false,
        help: 'Where to send the key: "header" or "query"',
      },
    ],
  },
  'oauth2': {
    name: 'OAuth 2.0',
    description: 'OAuth 2.0 client credentials flow',
    fields: [
      {
        name: 'clientId',
        label: 'Client ID',
        type: 'text',
        placeholder: 'your-client-id',
        required: true,
        help: 'OAuth 2.0 client identifier',
      },
      {
        name: 'clientSecret',
        label: 'Client Secret',
        type: 'password',
        placeholder: 'your-client-secret',
        required: true,
        sensitive: true,
        help: 'OAuth 2.0 client secret. Keep this confidential.',
      },
      {
        name: 'tokenUrl',
        label: 'Token URL',
        type: 'url',
        placeholder: 'https://api.example.com/oauth/token',
        required: true,
        help: 'URL to request access tokens',
      },
      {
        name: 'scopes',
        label: 'Scopes',
        type: 'text',
        placeholder: 'read write',
        required: false,
        help: 'Space-separated list of requested scopes',
      },
    ],
  },
  'jwt': {
    name: 'JWT',
    description: 'JSON Web Token authentication',
    fields: [
      {
        name: 'secret',
        label: 'Secret Key',
        type: 'password',
        placeholder: 'your-secret-key',
        required: true,
        sensitive: true,
        help: 'Secret key for signing JWT tokens',
      },
      {
        name: 'algorithm',
        label: 'Algorithm',
        type: 'text',
        placeholder: 'HS256',
        required: false,
        help: 'JWT signing algorithm (HS256, HS512, RS256, etc)',
      },
    ],
  },
  'bearer': {
    name: 'Bearer Token',
    description: 'Bearer token in Authorization header',
    fields: [
      {
        name: 'token',
        label: 'Bearer Token',
        type: 'password',
        placeholder: 'eyJhbGciOiJIUzI1NiIsI...',
        required: true,
        sensitive: true,
        help: 'Bearer token for authentication',
      },
    ],
  },
  'basic': {
    name: 'Basic Auth',
    description: 'HTTP Basic authentication (username:password)',
    fields: [
      {
        name: 'username',
        label: 'Username',
        type: 'text',
        placeholder: 'username',
        required: true,
        help: 'Username for basic auth',
      },
      {
        name: 'password',
        label: 'Password',
        type: 'password',
        placeholder: 'password',
        required: true,
        sensitive: true,
        help: 'Password for basic auth',
      },
    ],
  },
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const AuthenticationForm: React.FC<AuthenticationFormProps> = ({
  environment,
  availableAuthTypes = ['api-key', 'oauth2', 'jwt', 'bearer', 'basic'],
  credentials,
  onCredentialsChange,
  disabled = false,
  showErrors = true,
  className = '',
}) => {
  const form = useGatewayForm()
  const envConfig = useEnvironmentConfig(environment)

  // Get current environment config
  const envSpecificConfig = form.formData.environments?.find(
    (e) => e.environment === environment
  )

  const currentAuthType = (envSpecificConfig?.authenticationType ||
    'api-key') as AuthenticationType

  const handleAuthTypeChange = useCallback(
    (authType: AuthenticationType) => {
      if (disabled) return

      // Update form with new auth type and empty credentials
      form.updateField(`environments.${environment}.authenticationType`, authType)
      form.updateField(`environments.${environment}.authenticationCredentials`, {})

      onCredentialsChange?.({})
    },
    [disabled, environment, form, onCredentialsChange]
  )

  const handleCredentialChange = useCallback(
    (fieldName: string, value: string) => {
      if (disabled) return

      const currentCreds = envSpecificConfig?.authenticationCredentials || {}
      const updatedCreds = {
        ...currentCreds,
        [fieldName]: value,
      }

      form.updateField(
        `environments.${environment}.authenticationCredentials`,
        updatedCreds
      )

      onCredentialsChange?.(updatedCreds)
    },
    [disabled, environment, envSpecificConfig, form, onCredentialsChange]
  )

  const currentAuthConfig = AUTH_TYPE_CONFIGS[currentAuthType]
  const isProductionEnv = environment === 'production'

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Security Notice for Production */}
      {isProductionEnv && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="font-semibold text-red-900 mb-1">⚠️ Production Environment</h4>
          <p className="text-sm text-red-700">
            Credentials entered here will be encrypted and stored securely. Never share
            credentials with unauthorized users.
          </p>
        </div>
      )}

      {/* Auth Type Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Authentication Type
        </label>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          {availableAuthTypes.map((authType) => {
            const config = AUTH_TYPE_CONFIGS[authType]
            const isSelected = currentAuthType === authType

            return (
              <button
                key={authType}
                onClick={() => handleAuthTypeChange(authType)}
                disabled={disabled}
                className={`
                  p-3 rounded-lg border-2 text-center transition-all
                  ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }
                  ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <p className="font-medium text-sm text-gray-900">{config.name}</p>
                <p className="text-xs text-gray-600 mt-1">{config.description}</p>
                {isSelected && (
                  <p className="text-sm text-blue-600 mt-2">✓ Selected</p>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Credentials Form */}
      {currentAuthConfig && (
        <fieldset disabled={disabled}>
          <legend className="text-sm font-medium text-gray-700 mb-4">
            {currentAuthConfig.name} Credentials
          </legend>

          <div className="space-y-4">
            {currentAuthConfig.fields.map((field) => {
              const fieldValue =
                (envSpecificConfig?.authenticationCredentials || {})[field.name] || ''

              // Special handling for scopes (comma-separated to array)
              let displayValue = fieldValue
              if (field.name === 'scopes' && Array.isArray(fieldValue)) {
                displayValue = fieldValue.join(', ')
              }

              return (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>

                  <input
                    type={field.type}
                    name={field.name}
                    value={displayValue}
                    onChange={(e) => handleCredentialChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    required={field.required}
                    disabled={disabled}
                    className={`
                      w-full px-3 py-2 border rounded-lg text-sm
                      ${
                        field.sensitive
                          ? 'font-mono'
                          : ''
                      }
                      ${
                        disabled
                          ? 'bg-gray-100 cursor-not-allowed'
                          : 'bg-white hover:border-gray-400'
                      }
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                      ${
                        field.type === 'email' ? 'type-email' : ''
                      }
                    `}
                  />

                  {field.help && (
                    <p className="mt-1 text-xs text-gray-600">{field.help}</p>
                  )}

                  {field.sensitive && (
                    <p className="mt-1 text-xs text-amber-600">
                      🔒 This value will be encrypted
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          {/* Credential Summary */}
          <div className="mt-6 p-3 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Summary</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                <strong>Type:</strong> {currentAuthConfig.name}
              </p>
              <p>
                <strong>Fields Configured:</strong>{' '}
                {currentAuthConfig.fields.filter(
                  (f) =>
                    (envSpecificConfig?.authenticationCredentials || {})[
                      f.name
                    ]
                ).length || 0}{' '}
                of {currentAuthConfig.fields.length}
              </p>
              <p>
                <strong>Status:</strong>{' '}
                {currentAuthConfig.fields.every(
                  (f) =>
                    !f.required ||
                    (envSpecificConfig?.authenticationCredentials || {})[f.name]
                ) ? (
                  <span className="text-green-600">✓ Complete</span>
                ) : (
                  <span className="text-red-600">✗ Incomplete</span>
                )}
              </p>
            </div>
          </div>
        </fieldset>
      )}

      {/* Environment-Specific Warnings */}
      <EnvironmentWarnings environment={environment} authType={currentAuthType} />
    </div>
  )
}

// ============================================================================
// ENVIRONMENT WARNINGS COMPONENT
// ============================================================================

interface EnvironmentWarningsProps {
  environment: Environment
  authType: AuthenticationType
}

const EnvironmentWarnings: React.FC<EnvironmentWarningsProps> = ({
  environment,
  authType,
}) => {
  const warnings = useMemo(() => {
    const warns: string[] = []

    if (environment === 'production') {
      warns.push('Credentials will be replicated to production environment')
      if (authType === 'api-key') {
        warns.push('API keys are recommended for production use')
      }
      if (authType === 'basic') {
        warns.push('Consider using stronger authentication for production')
      }
    }

    if (environment === 'staging' && authType === 'bearer') {
      warns.push('Remember to rotate bearer tokens regularly')
    }

    return warns
  }, [environment, authType])

  if (warnings.length === 0) return null

  return (
    <div className="space-y-2">
      {warnings.map((warning, idx) => (
        <div key={idx} className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">ℹ️ {warning}</p>
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// QUICK AUTH SETUP COMPONENT
// ============================================================================

interface QuickAuthSetupProps {
  environment: Environment
  onComplete?: () => void
}

export const QuickAuthSetup: React.FC<QuickAuthSetupProps> = ({
  environment,
  onComplete,
}) => {
  return (
    <div className="space-y-6">
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-2">Quick Authentication Setup</h3>
        <p className="text-sm text-gray-600">
          Follow these steps to quickly configure authentication for {environment}:
        </p>
      </div>

      <ol className="space-y-4">
        <li className="flex gap-4">
          <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
            1
          </span>
          <div>
            <h4 className="font-medium text-gray-900">Choose an auth type</h4>
            <p className="text-sm text-gray-600 mt-1">
              Select the authentication method your API uses
            </p>
          </div>
        </li>

        <li className="flex gap-4">
          <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
            2
          </span>
          <div>
            <h4 className="font-medium text-gray-900">Enter your credentials</h4>
            <p className="text-sm text-gray-600 mt-1">
              Provide the credentials required by your chosen auth type
            </p>
          </div>
        </li>

        <li className="flex gap-4">
          <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
            3
          </span>
          <div>
            <h4 className="font-medium text-gray-900">Test credentials</h4>
            <p className="text-sm text-gray-600 mt-1">
              Use the "Test Credentials" button to verify they work correctly
            </p>
          </div>
        </li>

        <li className="flex gap-4">
          <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
            4
          </span>
          <div>
            <h4 className="font-medium text-gray-900">Save your gateway</h4>
            <p className="text-sm text-gray-600 mt-1">
              Click Save to store your gateway configuration
            </p>
          </div>
        </li>
      </ol>

      {onComplete && (
        <button
          onClick={onComplete}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          I'm Ready to Configure
        </button>
      )}
    </div>
  )
}

// ============================================================================
// CREDENTIALS DISPLAYER (Read-only)
// ============================================================================

interface CredentialsDisplayerProps {
  environment: Environment
  authType: AuthenticationType
  credentials: Record<string, any>
  showSensitive?: boolean
}

export const CredentialsDisplayer: React.FC<CredentialsDisplayerProps> = ({
  environment,
  authType,
  credentials,
  showSensitive = false,
}) => {
  const config = AUTH_TYPE_CONFIGS[authType]

  if (!config) return null

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-gray-900">Current {config.name} Configuration</h4>

      <div className="bg-gray-50 rounded-lg p-3 space-y-2">
        {config.fields.map((field) => {
          const value = credentials[field.name]

          if (!value) return null

          const displayValue =
            field.sensitive && !showSensitive
              ? '●'.repeat(Math.min(12, (value as string).length))
              : value

          return (
            <div key={field.name} className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{field.label}:</span>
              <span className="text-sm font-mono text-gray-900">{displayValue}</span>
            </div>
          )
        })}
      </div>

      <p className="text-xs text-gray-600">
        🔒 Sensitive values are encrypted at rest
      </p>
    </div>
  )
}
