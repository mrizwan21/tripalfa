import React from 'react';
import { Booking } from '../../../../types';
import { Building2, FileText, Code } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/Card';

interface SupplierInfoSectionProps {
  booking: Booking;
}

/**
 * SupplierInfoSection Component
 * Displays supplier/vendor information including name, confirmation numbers, and PNR
 * @testid booking-supplier-info
 */
export const SupplierInfoSection: React.FC<SupplierInfoSectionProps> = ({ booking }) => {
  return (
    <Card className="h-full" data-testid="booking-supplier-info">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Supplier Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Supplier Name */}
          <div className="flex items-start gap-4">
            <div className="p-2 bg-secondary rounded-lg">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-text-tertiary">Supplier</p>
              <p className="text-sm font-semibold" data-testid="supplier-name">
                {booking.supplierInfo.name}
              </p>
            </div>
          </div>

          {/* Confirmation Number */}
          {booking.supplierInfo.confirmationNumber && (
            <div className="flex items-start gap-4">
              <div className="p-2 bg-secondary rounded-lg">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-text-tertiary">Confirmation</p>
                <p className="text-sm font-mono" data-testid="supplier-confirmation">
                  {booking.supplierInfo.confirmationNumber}
                </p>
              </div>
            </div>
          )}

          {/* PNR */}
          {booking.supplierInfo.pnr && (
            <div className="flex items-start gap-4">
              <div className="p-2 bg-secondary rounded-lg">
                <Code className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-text-tertiary">PNR</p>
                <p className="text-sm font-mono" data-testid="supplier-pnr">
                  {booking.supplierInfo.pnr}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SupplierInfoSection;
