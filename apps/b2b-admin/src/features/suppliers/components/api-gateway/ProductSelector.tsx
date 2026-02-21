import React, { useState, useCallback, useMemo } from 'react'
import { useGatewayForm } from '@/features/suppliers/context/GatewayFormContext'
import { useProductSchema } from '@/features/suppliers/hooks/useGateway'

// ============================================================================
// TYPES
// ============================================================================

export type ProductType = 'hotel' | 'flight' | 'car' | 'transfer' | 'activity' | 'custom'

export interface ProductOption {
  id: ProductType
  name: string
  description: string
  icon?: string
  category: 'accommodation' | 'transportation' | 'activities' | 'other'
  endpoints?: number
  supportedAuthTypes?: string[]
}

export interface ProductSelectorProps {
  /**
   * Callback when product selection changes
   */
  onProductChange?: (productId: ProductType) => void
  /**
   * Show product details
   */
  showDetails?: boolean
  /**
   * Allow multiple product selection
   */
  multiSelect?: boolean
  /**
   * Disabled state
   */
  disabled?: boolean
  /**
   * Custom CSS class
   */
  className?: string
}

// ============================================================================
// AVAILABLE PRODUCTS
// ============================================================================

const AVAILABLE_PRODUCTS: Record<ProductType, ProductOption> = {
  hotel: {
    id: 'hotel',
    name: 'Hotel Management',
    description: 'Hotel inventory, rates, and booking management',
    category: 'accommodation',
    icon: '🏨',
    endpoints: 12,
    supportedAuthTypes: ['api-key', 'oauth2'],
  },
  flight: {
    id: 'flight',
    name: 'Flight Management',
    description: 'Flight search, pricing, and booking operations',
    category: 'transportation',
    icon: '✈️',
    endpoints: 8,
    supportedAuthTypes: ['api-key', 'bearer'],
  },
  car: {
    id: 'car',
    name: 'Car Rental',
    description: 'Car rental availability and reservations',
    category: 'transportation',
    icon: '🚗',
    endpoints: 6,
    supportedAuthTypes: ['api-key', 'jwt'],
  },
  transfer: {
    id: 'transfer',
    name: 'Transfer Services',
    description: 'Ground transportation and transfer bookings',
    category: 'transportation',
    icon: '🚐',
    endpoints: 5,
    supportedAuthTypes: ['api-key', 'bearer'],
  },
  activity: {
    id: 'activity',
    name: 'Activities & Tours',
    description: 'Activity listings, availability, and bookings',
    category: 'activities',
    icon: '🎭',
    endpoints: 7,
    supportedAuthTypes: ['api-key', 'oauth2'],
  },
  custom: {
    id: 'custom',
    name: 'Custom Integration',
    description: 'Define custom product type and endpoints',
    category: 'other',
    icon: '⚙️',
    endpoints: 0,
    supportedAuthTypes: ['api-key', 'oauth2', 'jwt', 'bearer', 'basic'],
  },
}

// ============================================================================
// PRODUCT SELECTOR COMPONENT
// ============================================================================

export const ProductSelector: React.FC<ProductSelectorProps> = ({
  onProductChange,
  showDetails = false,
  multiSelect = false,
  disabled = false,
  className = '',
}) => {
  const form = useGatewayForm()
  const [selectedProducts, setSelectedProducts] = useState<ProductType[]>([])

  // This would come from form data in real usage
  const currentProduct = form.formData.productConfigs?.[0]?.productId as ProductType | undefined

  const handleProductSelect = useCallback(
    (productId: ProductType) => {
      if (disabled) return

      if (multiSelect) {
        setSelectedProducts((prev) =>
          prev.includes(productId)
            ? prev.filter((p) => p !== productId)
            : [...prev, productId]
        )
      } else {
        setSelectedProducts([productId])
      }

      // Update form data with selected product
      form.updateField('productConfigs', [
        {
          productId,
          endpoints: [],
        },
      ])

      onProductChange?.(productId)
    },
    [disabled, multiSelect, onProductChange, form]
  )

  const products = useMemo(
    () =>
      Object.values(AVAILABLE_PRODUCTS).sort((a, b) =>
        a.name.localeCompare(b.name)
      ),
    []
  )

  const groupedByCategory = useMemo(
    () =>
      products.reduce(
        (acc, product) => {
          if (!acc[product.category]) {
            acc[product.category] = []
          }
          acc[product.category].push(product)
          return acc
        },
        {} as Record<string, ProductOption[]>
      ),
    [products]
  )

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Selected Products Summary */}
      {multiSelect && selectedProducts.length > 0 && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">
            Selected Products ({selectedProducts.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {selectedProducts.map((productId) => {
              const product = AVAILABLE_PRODUCTS[productId]
              return (
                <div
                  key={productId}
                  className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm"
                >
                  <span>{product.icon}</span>
                  <span>{product.name}</span>
                  <button
                    onClick={() => handleProductSelect(productId)}
                    className="ml-1 hover:text-blue-900 font-bold"
                  >
                    ×
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Products Grid */}
      {Object.entries(groupedByCategory).map(([category, categoryProducts]) => (
        <div key={category}>
          <h3 className="text-sm font-semibold text-gray-700 uppercase mb-3">
            {category.replace(/_/g, ' ')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryProducts.map((product) => {
              const isSelected =
                selectedProducts.includes(product.id) ||
                (!multiSelect && currentProduct === product.id)

              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  isSelected={isSelected}
                  disabled={disabled}
                  onSelect={() => handleProductSelect(product.id)}
                  showDetails={showDetails}
                />
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// PRODUCT CARD COMPONENT
// ============================================================================

interface ProductCardProps {
  product: ProductOption
  isSelected: boolean
  disabled: boolean
  onSelect: () => void
  showDetails: boolean
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isSelected,
  disabled,
  onSelect,
  showDetails,
}) => {
  const { schema, loading } = useProductSchema(product.id)

  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      className={`
        text-left p-4 rounded-lg border-2 transition-all
        ${
          isSelected
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-200 hover:border-blue-300'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {/* Product Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          {product.icon && <span className="text-2xl">{product.icon}</span>}
          <div>
            <h4 className="font-semibold text-gray-900">{product.name}</h4>
            <p className="text-sm text-gray-600 mt-1">{product.description}</p>
          </div>
        </div>
        {isSelected && (
          <span className="text-lg">
            ✓
          </span>
        )}
      </div>

      {/* Product Stats */}
      <div className="flex gap-3 text-xs">
        {product.endpoints !== undefined && (
          <div className="flex items-center gap-1 text-gray-600">
            <span>📡</span>
            <span>{product.endpoints} endpoints</span>
          </div>
        )}
        {product.supportedAuthTypes && product.supportedAuthTypes.length > 0 && (
          <div className="flex items-center gap-1 text-gray-600">
            <span>🔐</span>
            <span>{product.supportedAuthTypes.length} auth types</span>
          </div>
        )}
      </div>

      {/* Product Details (Expandable) */}
      {showDetails && (
        <ProductCardDetails product={product} schema={schema} loading={loading} />
      )}
    </button>
  )
}

// ============================================================================
// PRODUCT CARD DETAILS COMPONENT
// ============================================================================

interface ProductCardDetailsProps {
  product: ProductOption
  schema?: any
  loading: boolean
}

const ProductCardDetails: React.FC<ProductCardDetailsProps> = ({
  product,
  schema,
  loading,
}) => {
  return (
    <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
      {/* Authentication Types */}
      {product.supportedAuthTypes && (
        <div>
          <h5 className="text-xs font-medium text-gray-700 mb-2">
            Supported Auth Types
          </h5>
          <div className="flex flex-wrap gap-1">
            {product.supportedAuthTypes.map((authType) => (
              <span
                key={authType}
                className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
              >
                {authType}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Endpoints Count */}
      {product.endpoints !== undefined && (
        <div>
          <h5 className="text-xs font-medium text-gray-700 mb-2">
            Endpoints Available
          </h5>
          <p className="text-sm text-gray-600">{product.endpoints} total endpoints</p>
        </div>
      )}

      {/* Schema Status */}
      {loading && (
        <div className="text-xs text-gray-600">Loading schema information...</div>
      )}
      {schema && !loading && (
        <div>
          <h5 className="text-xs font-medium text-gray-700 mb-2">
            Schema Information
          </h5>
          <p className="text-xs text-gray-600">
            {schema.endpoints?.length || 0} endpoints configured
          </p>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// DROPDOWN VARIANT
// ============================================================================

interface ProductDropdownProps {
  /**
   * Current selected product
   */
  selectedProduct?: ProductType
  /**
   * Callback on product selection
   */
  onProductChange?: (productId: ProductType) => void
  /**
   * Placeholder text
   */
  placeholder?: string
  /**
   * Disabled state
   */
  disabled?: boolean
  /**
   * Error message
   */
  error?: string
}

export const ProductDropdown: React.FC<ProductDropdownProps> = ({
  selectedProduct,
  onProductChange,
  placeholder = 'Select a product...',
  disabled = false,
  error,
}) => {
  const [isOpen, setIsOpen] = React.useState(false)

  const selectedProductData = selectedProduct
    ? AVAILABLE_PRODUCTS[selectedProduct]
    : null

  return (
    <div className="relative inline-block w-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-4 py-2 text-left bg-white border rounded-lg
          flex items-center justify-between
          ${error ? 'border-red-300' : 'border-gray-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'}
        `}
      >
        <div className="flex items-center gap-2">
          {selectedProductData ? (
            <>
              {selectedProductData.icon && (
                <span className="text-lg">{selectedProductData.icon}</span>
              )}
              <span>{selectedProductData.name}</span>
            </>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </div>
        <span className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          {Object.values(AVAILABLE_PRODUCTS).map((product) => (
            <button
              key={product.id}
              onClick={() => {
                onProductChange?.(product.id)
                setIsOpen(false)
              }}
              className={`
                w-full text-left px-4 py-3 border-b hover:bg-gray-50 last:border-b-0
                flex items-center gap-2
                ${selectedProduct === product.id ? 'bg-blue-50' : ''}
              `}
            >
              {product.icon && <span className="text-lg">{product.icon}</span>}
              <div className="flex-1">
                <p className="font-medium text-gray-900">{product.name}</p>
                <p className="text-xs text-gray-600">{product.description}</p>
              </div>
              {selectedProduct === product.id && (
                <span className="text-blue-600">✓</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}

// ============================================================================
// PRODUCT SELECTOR WITH SCHEMA VIEWER
// ============================================================================

export const ProductSelectorWithSchema: React.FC<ProductSelectorProps & {
  selectedProduct?: ProductType
}> = (props) => {
  const { selectedProduct, ...otherProps } = props
  const { schema, loading } = useProductSchema(selectedProduct || 'hotel')

  return (
    <div className="space-y-6">
      <ProductSelector {...otherProps} />

      {selectedProduct && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-3">
            {AVAILABLE_PRODUCTS[selectedProduct]?.name || 'Custom Product'} Schema
          </h4>

          {loading ? (
            <p className="text-gray-600">Loading schema...</p>
          ) : schema ? (
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-700">
                  <strong>Endpoints:</strong> {schema.endpoints?.length || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-700">
                  <strong>Auth Types:</strong> {schema.authTypes?.join(', ') || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-700">
                  <strong>Required Parameters:</strong>
                </p>
                {schema.requiredParams && schema.requiredParams.length > 0 ? (
                  <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                    {schema.requiredParams.map((param: string, idx: number) => (
                      <li key={idx}>{param}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-600">None</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-gray-600">No schema available</p>
          )}
        </div>
      )}
    </div>
  )
}
