import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { OfflineChangeRequest } from '@tripalfa/shared-types';
import { AlertCircle, Check } from 'lucide-react';

interface PricingSubmissionFormProps {
  request: OfflineChangeRequest;
  onSubmit: (baseFare: number, taxes: number, fees: number, notes?: string) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const PricingSubmissionForm = ({
  request,
  onSubmit,
  onCancel,
  isLoading = false,
}: PricingSubmissionFormProps) => {
  const [formData, setFormData] = useState({
    newBaseFare: request.requestedChanges?.newBaseFare || 0,
    newTaxes: request.requestedChanges?.newTaxes || 0,
    newFees: request.requestedChanges?.newFees || 0,
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  // Calculate price differences
  const originalTotal =
    (request.originalBooking?.baseFare || 0) +
    (request.originalBooking?.taxes || 0) +
    (request.originalBooking?.fees || 0);
  const newTotal = formData.newBaseFare + formData.newTaxes + formData.newFees;
  const totalDifference = newTotal - originalTotal;
  const percentageDifference = ((totalDifference / originalTotal) * 100).toFixed(2);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.newBaseFare < 0) {
      newErrors.baseFare = 'Base fare cannot be negative';
    }
    if (formData.newTaxes < 0) {
      newErrors.taxes = 'Taxes cannot be negative';
    }
    if (formData.newFees < 0) {
      newErrors.fees = 'Fees cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: string, value: number | string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData.newBaseFare, formData.newTaxes, formData.newFees, formData.notes);
      setSubmitted(true);
      setTimeout(() => {
        onCancel();
      }, 2000);
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : 'Submission failed' });
    }
  };

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <div className="flex justify-center mb-3">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-green-900 mb-2">Pricing Submitted Successfully</h3>
        <p className="text-green-700">The pricing update has been recorded in the system.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Original vs New Prices */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-3">Price Comparison</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-blue-700 font-medium">Original Price</p>
            <p className="text-lg font-bold text-blue-900">
              ${originalTotal.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-blue-700 font-medium">New Price</p>
            <p className="text-lg font-bold text-blue-900">
              ${newTotal.toFixed(2)}
            </p>
          </div>
        </div>
        <div className={`mt-3 p-3 rounded-lg ${
          totalDifference >= 0 
            ? 'bg-red-50 border border-red-200' 
            : 'bg-green-50 border border-green-200'
        }`}>
          <p className={`text-sm font-medium ${
            totalDifference >= 0 ? 'text-red-700' : 'text-green-700'
          }`}>
            Difference: ${Math.abs(totalDifference).toFixed(2)} ({percentageDifference}%)
          </p>
          {totalDifference >= 0 && (
            <p className="text-xs text-red-600 mt-1">⚠ Customer will pay MORE</p>
          )}
          {totalDifference < 0 && (
            <p className="text-xs text-green-600 mt-1">✓ Customer will pay LESS</p>
          )}
        </div>
      </div>

      {/* Base Fare */}
      <div>
        <Label htmlFor="newBaseFare" className="block text-sm font-medium text-gray-700 mb-2">
          New Base Fare
        </Label>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-sm">Original:</span>
            <span className="text-gray-900 font-medium">
              ${request.originalBooking?.baseFare?.toFixed(2) || '0.00'}
            </span>
          </div>
          <Input
            id="newBaseFare"
            type="number"
            step="0.01"
            min="0"
            value={formData.newBaseFare}
            onChange={(e) => handleChange('newBaseFare', parseFloat(e.target.value) || 0)}
            className={errors.baseFare ? 'border-red-500' : ''}
          />
          {errors.baseFare && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" /> {errors.baseFare}
            </p>
          )}
        </div>
      </div>

      {/* Taxes */}
      <div>
        <Label htmlFor="newTaxes" className="block text-sm font-medium text-gray-700 mb-2">
          New Taxes
        </Label>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-sm">Original:</span>
            <span className="text-gray-900 font-medium">
              ${request.originalBooking?.taxes?.toFixed(2) || '0.00'}
            </span>
          </div>
          <Input
            id="newTaxes"
            type="number"
            step="0.01"
            min="0"
            value={formData.newTaxes}
            onChange={(e) => handleChange('newTaxes', parseFloat(e.target.value) || 0)}
            className={errors.taxes ? 'border-red-500' : ''}
          />
          {errors.taxes && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" /> {errors.taxes}
            </p>
          )}
        </div>
      </div>

      {/* Fees */}
      <div>
        <Label htmlFor="newFees" className="block text-sm font-medium text-gray-700 mb-2">
          New Fees
        </Label>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-sm">Original:</span>
            <span className="text-gray-900 font-medium">
              ${request.originalBooking?.fees?.toFixed(2) || '0.00'}
            </span>
          </div>
          <Input
            id="newFees"
            type="number"
            step="0.01"
            min="0"
            value={formData.newFees}
            onChange={(e) => handleChange('newFees', parseFloat(e.target.value) || 0)}
            className={errors.fees ? 'border-red-500' : ''}
          />
          {errors.fees && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" /> {errors.fees}
            </p>
          )}
        </div>
      </div>

      {/* Notes */}
      <div>
        <Label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
          Internal Notes (Optional)
        </Label>
        <Textarea
          id="notes"
          placeholder="Add any notes about this pricing adjustment (internal use only)"
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          rows={3}
        />
        <p className="text-xs text-gray-500 mt-1">
          These notes will be visible only to staff members
        </p>
      </div>

      {/* Error Message */}
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-900">Submission Error</p>
            <p className="text-sm text-red-700">{errors.submit}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button 
          type="submit"
          className="bg-blue-600 hover:bg-blue-700"
          disabled={isLoading}
        >
          {isLoading ? 'Submitting...' : 'Submit Pricing'}
        </Button>
      </div>
    </form>
  );
};
