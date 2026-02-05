import { SupplierDetails } from '@/features/manual-booking/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Building2, Mail, Phone, User } from 'lucide-react';

interface SupplierDetailsCardProps {
  details: SupplierDetails;
  onUpdate: (details: SupplierDetails) => void;
  readOnly?: boolean;
}

export function SupplierDetailsCard({ details, onUpdate, readOnly = false }: SupplierDetailsCardProps) {
  const updateField = (field: keyof SupplierDetails, value: string) => {
    onUpdate({ ...details, [field]: value });
  };

  if (readOnly) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Supplier Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Supplier Name</p>
              <p className="font-medium">{details.supplierName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Supplier ID</p>
              <p className="font-medium">{details.supplierId}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Contact Name</p>
              <p className="font-medium">{details.contactName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Contact Mode</p>
              <p className="font-medium capitalize">{details.contactMode}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="font-medium">{details.contactEmail}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Supplier Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="supplierName">Supplier Name</Label>
            <Input
              id="supplierName"
              value={details.supplierName}
              onChange={(e) => updateField('supplierName', e.target.value)}
              placeholder="Duffel"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="supplierId">Supplier ID</Label>
            <Input
              id="supplierId"
              value={details.supplierId}
              onChange={(e) => updateField('supplierId', e.target.value)}
              placeholder="AM123456"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="contactName">Contact Name</Label>
            <Input
              id="contactName"
              value={details.contactName}
              onChange={(e) => updateField('contactName', e.target.value)}
              placeholder="Support Team"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="contactMode">Contact Mode</Label>
            <Select
              value={details.contactMode}
              onValueChange={(value) => updateField('contactMode', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="phone">Phone</SelectItem>
                <SelectItem value="api">API</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="contactEmail">Contact Email</Label>
            <Input
              id="contactEmail"
              type="email"
              value={details.contactEmail}
              onChange={(e) => updateField('contactEmail', e.target.value)}
              placeholder="support@supplier.com"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="contactPhone">Contact Phone (Optional)</Label>
            <Input
              id="contactPhone"
              value={details.contactPhone || ''}
              onChange={(e) => updateField('contactPhone', e.target.value)}
              placeholder="+1 234 567 8900"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
