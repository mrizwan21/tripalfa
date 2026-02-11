import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, Calendar, MapPin, Users } from 'lucide-react';

interface RequestChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (changeRequest: {
    reasonForChange: string;
    newDepartureDate?: string;
    newReturnDate?: string;
    newRoute?: string;
    newAdultPassengers?: number;
    newChildPassengers?: number;
    additionalNotes?: string;
    priority?: string;
  }) => Promise<void>;
  bookingDetails?: {
    departureCity?: string;
    arrivalCity?: string;
    departureDate?: string;
    returnDate?: string;
    passengers?: { adults: number; children: number };
  };
  isLoading?: boolean;
}

const CHANGE_REASONS = [
  { value: 'date_change', label: 'Change Travel Dates' },
  { value: 'route_change', label: 'Change Route/Destination' },
  { value: 'passenger_change', label: 'Passenger Count Change' },
  { value: 'price_negotiation', label: 'Price Negotiation' },
  { value: 'schedule_conflict', label: 'Schedule Conflict' },
  { value: 'other', label: 'Other Reason' },
];

export const RequestChangeModal = ({
  isOpen,
  onClose,
  onSubmit,
  bookingDetails,
  isLoading = false,
}: RequestChangeModalProps) => {
  const [formData, setFormData] = useState({
    reasonForChange: '',
    newDepartureDate: '',
    newReturnDate: '',
    newRoute: '',
    newAdultPassengers: '',
    newChildPassengers: '',
    additionalNotes: '',
    priority: 'medium',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.reasonForChange.trim()) {
      newErrors.reasonForChange = 'Please select a reason for change';
    }

    if (formData.newAdultPassengers && parseInt(formData.newAdultPassengers) < 0) {
      newErrors.passengers = 'Passenger count cannot be negative';
    }

    if (formData.newDepartureDate) {
      const depDate = new Date(formData.newDepartureDate);
      if (depDate < new Date()) {
        newErrors.departureDate = 'New departure date cannot be in the past';
      }
    }

    if (formData.newReturnDate && formData.newDepartureDate) {
      const depDate = new Date(formData.newDepartureDate);
      const retDate = new Date(formData.newReturnDate);
      if (retDate < depDate) {
        newErrors.returnDate = 'Return date must be after departure date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field
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
      await onSubmit({
        reasonForChange: formData.reasonForChange,
        newDepartureDate: formData.newDepartureDate || undefined,
        newReturnDate: formData.newReturnDate || undefined,
        newRoute: formData.newRoute || undefined,
        newAdultPassengers: formData.newAdultPassengers ? parseInt(formData.newAdultPassengers) : undefined,
        newChildPassengers: formData.newChildPassengers ? parseInt(formData.newChildPassengers) : undefined,
        additionalNotes: formData.additionalNotes || undefined,
        priority: formData.priority,
      });

      setSubmitted(true);
      setTimeout(() => {
        setFormData({
          reasonForChange: '',
          newDepartureDate: '',
          newReturnDate: '',
          newRoute: '',
          newAdultPassengers: '',
          newChildPassengers: '',
          additionalNotes: '',
          priority: 'medium',
        });
        setSubmitted(false);
        onClose();
      }, 2000);
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : 'Submission failed' });
    }
  };

  if (submitted) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <div className="text-center py-8">
            <div className="mb-4 text-4xl">✅</div>
            <h3 className="text-lg font-semibold text-green-900 mb-2">Request Submitted!</h3>
            <p className="text-sm text-green-700">
              Your change request has been submitted. You'll receive a confirmation email shortly.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Booking Change</DialogTitle>
          <DialogDescription>
            Submit a request to change your booking details. Our team will review and provide
            updated pricing.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Booking Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-3">Current Booking</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {bookingDetails?.departureCity && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span>{bookingDetails.departureCity} → {bookingDetails.arrivalCity}</span>
                </div>
              )}
              {bookingDetails?.departureDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>{new Date(bookingDetails.departureDate).toLocaleDateString()}</span>
                </div>
              )}
              {bookingDetails?.passengers && (
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>
                    {bookingDetails.passengers.adults} Adult(s), {bookingDetails.passengers.children} Child(ren)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Reason for Change */}
          <div>
            <Label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Change *
            </Label>
            <Select value={formData.reasonForChange} onValueChange={(val) => handleChange('reasonForChange', val)}>
              <SelectTrigger id="reason" className={errors.reasonForChange ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select reason for change" />
              </SelectTrigger>
              <SelectContent>
                {CHANGE_REASONS.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.reasonForChange && (
              <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> {errors.reasonForChange}
              </p>
            )}
          </div>

          {/* Change Options */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-medium text-gray-900">What would you like to change?</h4>

            {/* New Departure Date */}
            <div>
              <Label htmlFor="newDeparture" className="block text-sm font-medium text-gray-700 mb-2">
                New Departure Date (Optional)
              </Label>
              <Input
                id="newDeparture"
                type="date"
                value={formData.newDepartureDate}
                onChange={(e) => handleChange('newDepartureDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className={errors.departureDate ? 'border-red-500' : ''}
              />
              {errors.departureDate && (
                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> {errors.departureDate}
                </p>
              )}
            </div>

            {/* New Return Date */}
            <div>
              <Label htmlFor="newReturn" className="block text-sm font-medium text-gray-700 mb-2">
                New Return Date (Optional)
              </Label>
              <Input
                id="newReturn"
                type="date"
                value={formData.newReturnDate}
                onChange={(e) => handleChange('newReturnDate', e.target.value)}
                min={formData.newDepartureDate || new Date().toISOString().split('T')[0]}
                className={errors.returnDate ? 'border-red-500' : ''}
              />
              {errors.returnDate && (
                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> {errors.returnDate}
                </p>
              )}
            </div>

            {/* New Route */}
            <div>
              <Label htmlFor="newRoute" className="block text-sm font-medium text-gray-700 mb-2">
                New Route (e.g., NYC→LAX) (Optional)
              </Label>
              <Input
                id="newRoute"
                placeholder="Departure City → Arrival City"
                value={formData.newRoute}
                onChange={(e) => handleChange('newRoute', e.target.value)}
              />
            </div>

            {/* Passenger Count */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="adults" className="block text-sm font-medium text-gray-700 mb-2">
                  New Adult Passengers (Optional)
                </Label>
                <Input
                  id="adults"
                  type="number"
                  min="0"
                  value={formData.newAdultPassengers}
                  onChange={(e) => handleChange('newAdultPassengers', e.target.value)}
                  placeholder="Number of adults"
                />
              </div>
              <div>
                <Label htmlFor="children" className="block text-sm font-medium text-gray-700 mb-2">
                  New Child Passengers (Optional)
                </Label>
                <Input
                  id="children"
                  type="number"
                  min="0"
                  value={formData.newChildPassengers}
                  onChange={(e) => handleChange('newChildPassengers', e.target.value)}
                  placeholder="Number of children"
                />
              </div>
            </div>

            {errors.passengers && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> {errors.passengers}
              </p>
            )}
          </div>

          {/* Priority */}
          <div>
            <Label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
              Priority Level *
            </Label>
            <Select value={formData.priority} onValueChange={(val) => handleChange('priority', val)}>
              <SelectTrigger id="priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low - Flexible timing</SelectItem>
                <SelectItem value="medium">Medium - Normal timing</SelectItem>
                <SelectItem value="high">High - Urgent</SelectItem>
                <SelectItem value="urgent">Urgent - ASAP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Additional Notes */}
          <div>
            <Label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              placeholder="Provide any additional context about your change request..."
              value={formData.additionalNotes}
              onChange={(e) => handleChange('additionalNotes', e.target.value)}
              rows={3}
            />
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
          <DialogFooter className="flex gap-2 justify-end border-t pt-4">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
