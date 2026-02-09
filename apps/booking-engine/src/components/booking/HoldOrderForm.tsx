import React, { useState, useEffect } from 'react';
import './HoldOrderForm.css';

interface PassengerData {
  title: string;
  given_name: string;
  family_name: string;
  email: string;
  phone_number: string;
  born_on: string;
  gender: string;
}

interface HoldOrderFormProps {
  offerId: string;
  onHoldOrderCreated?: (holdOrder: any) => void;
  onError?: (error: string) => void;
}

const HoldOrderForm: React.FC<HoldOrderFormProps> = ({
  offerId,
  onHoldOrderCreated,
  onError
}) => {
  const [loading, setLoading] = useState(false);
  const [passengers, setPassengers] = useState<PassengerData[]>([
    {
      title: 'mr',
      given_name: '',
      family_name: '',
      email: '',
      phone_number: '',
      born_on: '',
      gender: 'm'
    }
  ]);
  const [customerInfo, setCustomerInfo] = useState({
    customerId: '',
    customerEmail: '',
    customerPhone: ''
  });

  const handlePassengerChange = (index: number, field: string, value: string) => {
    const newPassengers = [...passengers];
    newPassengers[index] = {
      ...newPassengers[index],
      [field]: value
    };
    setPassengers(newPassengers);
  };

  const handleAddPassenger = () => {
    setPassengers([
      ...passengers,
      {
        title: 'mr',
        given_name: '',
        family_name: '',
        email: passengers[0]?.email || '',
        phone_number: passengers[0]?.phone_number || '',
        born_on: '',
        gender: 'm'
      }
    ]);
  };

  const handleRemovePassenger = (index: number) => {
    if (passengers.length > 1) {
      setPassengers(passengers.filter((_, i) => i !== index));
    }
  };

  const handleCustomerInfoChange = (field: string, value: string) => {
    setCustomerInfo({
      ...customerInfo,
      [field]: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!customerInfo.customerId || !customerInfo.customerEmail) {
      onError?.('Customer ID and email are required');
      return;
    }

    if (passengers.some(p => !p.given_name || !p.family_name || !p.born_on)) {
      onError?.('Please complete all passenger information');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/bookings/hold/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          offerId,
          passengers,
          ...customerInfo
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create hold order');
      }

      const result = await response.json();
      onHoldOrderCreated?.(result.data);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to create hold order';
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hold-order-form">
      <h2>Create Hold Order</h2>
      <p className="form-description">
        Hold this flight and pay later. Your booking will be reserved until the payment deadline.
      </p>

      <form onSubmit={handleSubmit}>
        {/* Customer Information */}
        <fieldset>
          <legend>Your Information</legend>

          <div className="form-group">
            <label htmlFor="customerId">Customer ID *</label>
            <input
              id="customerId"
              type="text"
              value={customerInfo.customerId}
              onChange={(e) => handleCustomerInfoChange('customerId', e.target.value)}
              placeholder="Enter your customer ID"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="customerEmail">Email *</label>
            <input
              id="customerEmail"
              type="email"
              value={customerInfo.customerEmail}
              onChange={(e) => handleCustomerInfoChange('customerEmail', e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="customerPhone">Phone Number</label>
            <input
              id="customerPhone"
              type="tel"
              value={customerInfo.customerPhone}
              onChange={(e) => handleCustomerInfoChange('customerPhone', e.target.value)}
              placeholder="+1234567890"
            />
          </div>
        </fieldset>

        {/* Passengers */}
        <fieldset>
          <legend>Passengers ({passengers.length})</legend>

          {passengers.map((passenger, index) => (
            <div key={index} className="passenger-section">
              <div className="passenger-header">
                <h4>Passenger {index + 1}</h4>
                {passengers.length > 1 && (
                  <button
                    type="button"
                    className="btn-remove"
                    onClick={() => handleRemovePassenger(index)}
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Title *</label>
                  <select
                    value={passenger.title}
                    onChange={(e) => handlePassengerChange(index, 'title', e.target.value)}
                    required
                  >
                    <option value="mr">Mr.</option>
                    <option value="ms">Ms.</option>
                    <option value="mrs">Mrs.</option>
                    <option value="mister">Mister</option>
                    <option value="miss">Miss</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Gender *</label>
                  <select
                    value={passenger.gender}
                    onChange={(e) => handlePassengerChange(index, 'gender', e.target.value)}
                    required
                  >
                    <option value="m">Male</option>
                    <option value="f">Female</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>First Name *</label>
                  <input
                    type="text"
                    value={passenger.given_name}
                    onChange={(e) => handlePassengerChange(index, 'given_name', e.target.value)}
                    placeholder="First name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    value={passenger.family_name}
                    onChange={(e) => handlePassengerChange(index, 'family_name', e.target.value)}
                    placeholder="Last name"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Date of Birth *</label>
                  <input
                    type="date"
                    value={passenger.born_on}
                    onChange={(e) => handlePassengerChange(index, 'born_on', e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={passenger.email}
                    onChange={(e) => handlePassengerChange(index, 'email', e.target.value)}
                    placeholder="passenger@email.com"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  value={passenger.phone_number}
                  onChange={(e) => handlePassengerChange(index, 'phone_number', e.target.value)}
                  placeholder="+1234567890"
                  required
                />
              </div>
            </div>
          ))}

          <button
            type="button"
            className="btn-secondary"
            onClick={handleAddPassenger}
          >
            + Add Another Passenger
          </button>
        </fieldset>

        {/* Submit */}
        <div className="form-actions">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Creating Hold Order...' : 'Create Hold Order'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default HoldOrderForm;
