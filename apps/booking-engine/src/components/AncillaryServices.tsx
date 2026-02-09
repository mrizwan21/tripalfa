/**
 * Ancillary Services Component
 * Displays available ancillary services during booking flow
 */

import React, { useState, useEffect } from 'react';
import './AncillaryServices.css';
import ancillaryServicesApi, {
  Service,
  ServiceSelection,
  ServiceCategory,
  ServiceType
} from '../services/ancillaryServicesApi';

interface AncillaryServicesProps {
  offerId?: string;
  orderId?: string;
  mode: 'booking' | 'post-booking';
  onServicesSelected?: (services: ServiceSelection[], totalAmount: string) => void;
  onClose?: () => void;
}

export const AncillaryServices: React.FC<AncillaryServicesProps> = ({
  offerId,
  orderId,
  mode,
  onServicesSelected,
  onClose
}) => {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [selectedServices, setSelectedServices] = useState<Map<string, ServiceSelection>>(new Map());
  const [selectedCategory, setSelectedCategory] = useState<ServiceType | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalAmount, setTotalAmount] = useState('0.00');
  const [currency, setCurrency] = useState('GBP');

  // Fetch available services on component mount
  useEffect(() => {
    fetchServices();
  }, [offerId, orderId, mode]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);

      let response;
      if (mode === 'booking' && offerId) {
        response = await ancillaryServicesApi.getServicesForBooking(offerId);
      } else if (mode === 'post-booking' && orderId) {
        response = await ancillaryServicesApi.getServicesForOrder(orderId);
      } else {
        throw new Error('Invalid parameters for ancillary services');
      }

      setServices(response.data.services);
      
      const fetchedCategories = await ancillaryServicesApi.getServiceCategories();
      setCategories(fetchedCategories.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch services');
      console.error('Error fetching ancillary services:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceToggle = (service: Service, quantity: number) => {
    const newSelected = new Map(selectedServices);

    if (quantity > 0) {
      newSelected.set(service.id, {
        id: service.id,
        quantity,
        passengerIds: service.passengerIds,
        segmentIds: service.segmentIds
      });
    } else {
      newSelected.delete(service.id);
    }

    setSelectedServices(newSelected);
    calculateTotal(newSelected);
  };

  const calculateTotal = (selected: Map<string, ServiceSelection>) => {
    let total = 0;
    selected.forEach((selection) => {
      const service = services.find(s => s.id === selection.id);
      if (service) {
        const serviceAmount = parseFloat(service.baseAmount || '0');
        total += serviceAmount * selection.quantity;
      }
    });

    setTotalAmount(total.toFixed(2));
  };

  const handleConfirm = async () => {
    try {
      setLoading(true);
      const servicesArray = Array.from(selectedServices.values());

      if (mode === 'booking' && offerId) {
        const result = await ancillaryServicesApi.selectServicesForBooking(offerId, servicesArray);
        setCurrency(result.data.currency);
        setTotalAmount(result.data.totalAmount);
        onServicesSelected?.(servicesArray, result.data.totalAmount);
      } else if (mode === 'post-booking' && orderId) {
        const result = await ancillaryServicesApi.addServicesToOrder(orderId, servicesArray);
        setCurrency(result.data.currency);
        setTotalAmount(result.data.totalAmount);
        onServicesSelected?.(servicesArray, result.data.totalAmount);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm services');
      console.error('Error confirming services:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredServices =
    selectedCategory === 'all'
      ? services
      : services.filter(s => s.type === selectedCategory);

  const getCategoryIcon = (type: ServiceType): string => {
    const icons: Record<ServiceType, string> = {
      baggage: '🧳',
      meal: '🍽️',
      seat: '💺',
      special_request: '♿',
      lounge: '✈️',
      insurance: '🛡️'
    };
    return icons[type] || '📦';
  };

  if (loading && services.length === 0) {
    return (
      <div className="ancillary-services-container">
        <div className="loading">Loading ancillary services...</div>
      </div>
    );
  }

  return (
    <div className="ancillary-services-container">
      <div className="ancillary-services-header">
        <h2>{mode === 'booking' ? 'Add Services' : 'Manage Services'}</h2>
        {onClose && (
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        )}
      </div>

      {error && (
        <div className="error-message">{error}</div>
      )}

      {/* Category Filter */}
      <div className="category-filter">
        <button
          className={`category-btn ${selectedCategory === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('all')}
        >
          All Services
        </button>
        {categories.map(cat => (
          <button
            key={cat.type}
            className={`category-btn ${selectedCategory === cat.type ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.type)}
          >
            <span className="icon">{getCategoryIcon(cat.type)}</span>
            <span className="name">{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Services List */}
      <div className="services-list">
        {filteredServices.length === 0 ? (
          <div className="no-services">No services available in this category</div>
        ) : (
          filteredServices.map(service => {
            const selected = selectedServices.get(service.id);
            const quantity = selected?.quantity || 0;

            return (
              <div key={service.id} className="service-card">
                <div className="service-header">
                  <div className="service-info">
                    <h3>{service.productName}</h3>
                    <p className="description">{service.description}</p>
                    {service.restrictions && (
                      <div className="restrictions">
                        Max: {service.restrictions.maxQuantity} per passenger
                      </div>
                    )}
                  </div>
                  <div className="service-price">
                    <span className="amount">
                      {service.currency} {service.baseAmount}
                    </span>
                    <span className="type">{service.type}</span>
                  </div>
                </div>

                <div className="service-actions">
                  <div className="quantity-selector">
                    <button
                      className="qty-btn"
                      onClick={() => handleServiceToggle(service, Math.max(0, quantity - 1))}
                      disabled={quantity === 0}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="0"
                      max={service.maximumQuantity}
                      value={quantity}
                      onChange={e => 
                        handleServiceToggle(service, Math.min(
                          parseInt(e.target.value) || 0,
                          service.maximumQuantity
                        ))
                      }
                      className="qty-input"
                    />
                    <button
                      className="qty-btn"
                      onClick={() => handleServiceToggle(service, Math.min(
                        quantity + 1,
                        service.maximumQuantity
                      ))}
                      disabled={quantity >= service.maximumQuantity}
                    >
                      +
                    </button>
                  </div>
                  {quantity > 0 && (
                    <div className="service-total">
                      {currency} {(parseFloat(service.baseAmount) * quantity).toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Summary */}
      {selectedServices.size > 0 && (
        <div className="summary">
          <div className="summary-row">
            <span>Services Selected:</span>
            <span>{selectedServices.size}</span>
          </div>
          <div className="summary-row total">
            <span>Total Amount:</span>
            <span>{currency} {totalAmount}</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="actions">
        {onClose && (
          <button
            className="btn btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
        )}
        <button
          className="btn btn-primary"
          onClick={handleConfirm}
          disabled={selectedServices.size === 0 || loading}
        >
          {loading ? 'Processing...' : 'Confirm Services'}
        </button>
      </div>
    </div>
  );
};

export default AncillaryServices;
