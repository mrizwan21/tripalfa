import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { ZodError } from 'zod'
import {
  SupplierAPIGatewayFormData,
  Environment,
  EnvironmentSpecificGateway,
} from '@/services/api-manager/types-gateway'
import {
  validateGatewayForm,
  validateEnvironmentConfig,
  validateEndpoint,
  formatValidationErrors,
} from '../utils/gatewayValidation'

// ============================================================================
// TYPES
// ============================================================================

export interface FormFieldError {
  field: string
  message: string
}

export interface GatewayFormState {
  // Form data
  formData: Partial<SupplierAPIGatewayFormData>

  // Validation state
  errors: Record<string, string>
  fieldErrors: FormFieldError[]

  // UI state
  isDirty: boolean
  isSaving: boolean
  saveError: string | null
  successMessage: string | null

  // Environment state
  activeEnvironment: Environment
  expandedSections: Record<string, boolean>

  // Component visibility
  showAdvanced: boolean
  showProductConfigs: boolean

  // Messages
  messages: {
    success: string | null
    error: string | null
  }
}

export interface GatewayFormContextType extends GatewayFormState {
  // Data mutation
  setFormData: (data: Partial<SupplierAPIGatewayFormData>) => void
  updateFormData: (data: Partial<SupplierAPIGatewayFormData>) => void
  updateField: (field: string, value: unknown) => void
  updateEnvironmentConfig: (env: Environment, config: EnvironmentSpecificGateway) => void
  addEnvironment: (environment: Environment) => void
  removeEnvironment: (environment: Environment) => void

  // Validation
  validateForm: () => boolean
  validateEnvironment: (environment: Environment) => boolean
  validateEndpoint: (endpointId: string) => boolean
  clearErrors: () => void
  clearFieldError: (field: string) => void

  // Form control
  resetForm: (initialData?: Partial<SupplierAPIGatewayFormData>) => void
  setActiveEnvironment: (env: Environment) => void
  toggleSection: (section: string) => void
  toggleAdvanced: () => void
  toggleProductConfigs: () => void

  // UI control
  setSaveError: (error: string | null) => void
  setSuccessMessage: (message: string | null) => void
  setErrorMessage: (error: string | null) => void
  clearMessages: () => void

  // Lifecycle
  markDirty: () => void
  markClean: () => void
  setSaving: (saving: boolean) => void
}

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const GatewayFormContext = createContext<GatewayFormContextType | undefined>(undefined)

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

interface GatewayFormProviderProps {
  children: ReactNode
  initialFormData?: Partial<SupplierAPIGatewayFormData>
  onSave?: (formData: Partial<SupplierAPIGatewayFormData>) => Promise<void>
}

export const GatewayFormProvider: React.FC<GatewayFormProviderProps> = ({
  children,
  initialFormData,
  onSave,
}) => {
  // =========================================================================
  // STATE MANAGEMENT
  // =========================================================================

  const [formData, setFormData] = useState<Partial<SupplierAPIGatewayFormData>>(
    initialFormData || {
      environments: [],
      activeEnvironment: 'development',
      globalHeaders: [],
      globalQueryParameters: [],
      productConfigs: [],
      geographyRoutings: [],
      channelRoutings: [],
      allowDevelopment: true,
      requireStagingApproval: false,
      requireProductionApproval: true,
    }
  )

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [fieldErrors, setFieldErrors] = useState<FormFieldError[]>([])
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [activeEnvironment, setActiveEnvironment] = useState<Environment>('development')
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    environments: true,
    endpoints: true,
    routing: false,
    advanced: false,
  })
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showProductConfigs, setShowProductConfigs] = useState(false)

  // =========================================================================
  // DATA MUTATION HANDLERS
  // =========================================================================

  const updateFormData = useCallback(
    (newData: Partial<SupplierAPIGatewayFormData>) => {
      setFormData((prev) => ({ ...prev, ...newData }))
      setIsDirty(true)
      setSaveError(null)
    },
    []
  )

  const updateField = useCallback((field: string, value: unknown) => {
    setFormData((prev) => {
      const keys = field.split('.')
      const updated = { ...prev }
      let current: any = updated

      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...(current[keys[i]] || {}) }
        current = current[keys[i]]
      }

      current[keys[keys.length - 1]] = value
      return updated
    })
    setIsDirty(true)
    setSaveError(null)
  }, [])

  const updateEnvironmentConfig = useCallback(
    (env: Environment, config: EnvironmentSpecificGateway) => {
      setFormData((prev) => {
        const environments = prev.environments || []
        const envIndex = environments.findIndex((e) => e.environment === env)

        // Convert EnvironmentSpecificGateway to form data structure
        const formConfig = {
          environment: config.environment,
          isActive: config.isActive,
          baseUrl: config.baseUrl,
          apiVersion: config.apiVersion,
          authenticationType: config.authentication.type,
          authenticationCredentials: config.authentication.credentials,
          headers: config.headers,
          queryParameters: config.queryParameters,
          endpoints: config.endpoints,
          timeout: config.settings.timeout,
          maxRetries: config.settings.retryPolicy.maxRetries,
          rateLimit: config.settings.rateLimit,
          requiresSSL: config.settings.requiresSSL,
          monitoringEnabled: config.monitoring.enabled,
        }

        if (envIndex >= 0) {
          const updated = [...environments]
          updated[envIndex] = formConfig
          return { ...prev, environments: updated }
        }

        return { ...prev, environments: [...environments, formConfig] }
      })
      setIsDirty(true)
      setSaveError(null)
    },
    []
  )

  const addEnvironment = useCallback((environment: Environment) => {
    setFormData((prev) => {
      const environments = prev.environments || []
      if (!environments.find((e) => e.environment === environment)) {
        return {
          ...prev,
          environments: [
            ...environments,
            {
              environment,
              isActive: true,
              baseUrl: '',
              apiVersion: '1.0',
              authenticationType: 'api-key',
              authenticationCredentials: {},
              headers: [],
              queryParameters: [],
              endpoints: [],
              timeout: environment === 'production' ? 15000 : 30000,
              maxRetries: environment === 'production' ? 3 : 5,
              requiresSSL: environment !== 'development',
              monitoringEnabled: environment !== 'development',
            },
          ],
        }
      }
      return prev
    })
    setIsDirty(true)
  }, [])

  const removeEnvironment = useCallback((environment: Environment) => {
    setFormData((prev) => {
      const environments = prev.environments || []
      const filtered = environments.filter((e) => e.environment !== environment)
      return {
        ...prev,
        environments: filtered,
        activeEnvironment: filtered.length > 0 ? filtered[0].environment : 'development',
      }
    })
    setIsDirty(true)
  }, [])

  // =========================================================================
  // VALIDATION HANDLERS
  // =========================================================================

  const validateForm = useCallback((): boolean => {
    const result = validateGatewayForm(formData)

    if (!result.success) {
      const newErrors = formatValidationErrors(result.error.issues)
      setErrors(newErrors)
      setFieldErrors(
        result.error.issues.map((error) => ({
          field: error.path.join('.'),
          message: error.message,
        }))
      )
      return false
    }

    setErrors({})
    setFieldErrors([])
    return true
  }, [formData])

  const validateEnvironment = useCallback((environment: Environment): boolean => {
    const env = formData.environments?.find((e) => e.environment === environment)
    if (!env) return false

    const result = validateEnvironmentConfig(env, environment)
    return result.success
  }, [formData])

  const validateEndpoint = useCallback((endpointId: string): boolean => {
    const env = formData.environments?.find((e) => e.environment === activeEnvironment)
    const endpoint = env?.endpoints?.find((ep: any) => ep.id === endpointId)

    if (!endpoint) return false

    return true // Placeholder validation - endpoint exists
  }, [formData, activeEnvironment])

  const clearErrors = useCallback(() => {
    setErrors({})
    setFieldErrors([])
  }, [])

  const clearFieldError = useCallback((field: string) => {
    setErrors((prev) => {
      const updated = { ...prev }
      delete updated[field]
      return updated
    })
    setFieldErrors((prev) => prev.filter((e) => e.field !== field))
  }, [])

  // =========================================================================
  // FORM CONTROL HANDLERS
  // =========================================================================

  const resetForm = useCallback((initialData?: Partial<SupplierAPIGatewayFormData>) => {
    setFormData(
      initialData || {
        environments: [],
        activeEnvironment: 'development',
        globalHeaders: [],
        globalQueryParameters: [],
        productConfigs: [],
        geographyRoutings: [],
        channelRoutings: [],
        allowDevelopment: true,
        requireStagingApproval: false,
        requireProductionApproval: true,
      }
    )
    setErrors({})
    setFieldErrors([])
    setIsDirty(false)
    setSaveError(null)
    setSuccessMessage(null)
  }, [])

  const toggleSection = useCallback((section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }, [])

  // =========================================================================
  // UI CONTROL HANDLERS
  // =========================================================================

  const clearMessages = useCallback(() => {
    setSaveError(null)
    setSuccessMessage(null)
  }, [])

  const markDirty = useCallback(() => setIsDirty(true), [])
  const markClean = useCallback(() => setIsDirty(false), [])

  // =========================================================================
  // STATE OBJECT
  // =========================================================================

  const state: GatewayFormContextType = {
    // Form data
    formData,
    setFormData: updateFormData,
    updateFormData,
    updateField,
    updateEnvironmentConfig,
    addEnvironment,
    removeEnvironment,

    // Validation
    errors,
    fieldErrors,
    validateForm,
    validateEnvironment,
    validateEndpoint,
    clearErrors,
    clearFieldError,

    // UI state
    isDirty,
    isSaving,
    saveError,
    successMessage,
    activeEnvironment,
    showAdvanced,
    showProductConfigs,
    expandedSections,

    // Messages
    messages: {
      success: successMessage,
      error: saveError,
    },

    // Form control
    resetForm,
    setActiveEnvironment,
    toggleSection,
    toggleAdvanced: () => setShowAdvanced((prev) => !prev),
    toggleProductConfigs: () => setShowProductConfigs((prev) => !prev),

    // Message control
    setSaveError,
    setSuccessMessage,
    setErrorMessage: setSaveError,
    clearMessages,

    // Lifecycle
    markDirty,
    markClean,
    setSaving: setIsSaving,
  }

  return <GatewayFormContext.Provider value={state}>{children}</GatewayFormContext.Provider>
}

// ============================================================================
// CUSTOM HOOK FOR USING CONTEXT
// ============================================================================

export const useGatewayForm = (): GatewayFormContextType => {
  const context = useContext(GatewayFormContext)
  if (!context) {
    throw new Error('useGatewayForm must be used within GatewayFormProvider')
  }
  return context
}

// ============================================================================
// SPECIALIZED HOOKS
// ============================================================================

export const useGatewayFormState = () => {
  const { formData, isDirty, isSaving, errors, saveError, successMessage } = useGatewayForm()
  return { formData, isDirty, isSaving, errors, saveError, successMessage }
}

export const useGatewayFormActions = () => {
  const {
    updateField,
    updateFormData,
    resetForm,
    validateForm,
    clearErrors,
    markDirty,
    setSaveError,
    setSuccessMessage,
  } = useGatewayForm()
  return {
    updateField,
    updateFormData,
    resetForm,
    validateForm,
    clearErrors,
    markDirty,
    setSaveError,
    setSuccessMessage,
  }
}

export const useGatewayEnvironmentEditor = () => {
  const {
    activeEnvironment,
    setActiveEnvironment,
    updateEnvironmentConfig,
    addEnvironment,
    removeEnvironment,
    validateEnvironment,
  } = useGatewayForm()
  return {
    activeEnvironment,
    setActiveEnvironment,
    updateEnvironmentConfig,
    addEnvironment,
    removeEnvironment,
    validateEnvironment,
  }
}
