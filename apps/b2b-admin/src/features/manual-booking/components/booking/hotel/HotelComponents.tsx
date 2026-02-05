import { HotelBooking, HotelCustomerCosting, HotelSupplierCosting } from '@/features/manual-booking/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CalendarIcon, Hotel, Plus, Trash2, Users, Building2 } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface HotelBookingCardProps {
  booking: HotelBooking;
  onUpdate: (booking: HotelBooking) => void;
  readOnly?: boolean;
}

export function HotelBookingCard({ booking, onUpdate, readOnly = false }: HotelBookingCardProps) {
  const updateField = (field: keyof HotelBooking, value: any) => {
    const updated = { ...booking, [field]: value };
    // Recalculate total nights
    if (field === 'checkIn' || field === 'checkOut') {
      updated.totalNights = differenceInDays(updated.checkOut, updated.checkIn);
    }
    onUpdate(updated);
  };

  if (readOnly) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Hotel className="h-4 w-4" />
            Hotel Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Hotel Name</p>
              <p className="font-medium">{booking.hotelName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Confirmation #</p>
              <p className="font-medium">{booking.confirmationNumber}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Check-in</p>
              <p className="font-medium">{format(booking.checkIn, 'dd MMM yyyy')}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Check-out</p>
              <p className="font-medium">{format(booking.checkOut, 'dd MMM yyyy')}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Room Type</p>
              <p className="font-medium">{booking.roomType}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">No. of Rooms</p>
              <p className="font-medium">{booking.numberOfRooms}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Rate/Night</p>
              <p className="font-medium">{booking.ratePerNight.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Nights</p>
              <p className="font-medium">{booking.totalNights}</p>
            </div>
          </div>
          {booking.specialRequests && (
            <div>
              <p className="text-xs text-muted-foreground">Special Requests</p>
              <p className="text-sm">{booking.specialRequests}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Hotel className="h-4 w-4" />
          Hotel Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2 col-span-2">
            <Label>Hotel Name</Label>
            <Input
              value={booking.hotelName}
              onChange={(e) => updateField('hotelName', e.target.value)}
              placeholder="Hotel Name"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Confirmation #</Label>
            <Input
              value={booking.confirmationNumber || ''}
              onChange={(e) => updateField('confirmationNumber', e.target.value)}
              placeholder="Confirmation #"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Meal Plan</Label>
            <Select
              value={booking.mealPlan}
              onValueChange={(v) => updateField('mealPlan', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RO">Room Only (RO)</SelectItem>
                <SelectItem value="BB">Bed & Breakfast (BB)</SelectItem>
                <SelectItem value="HB">Half Board (HB)</SelectItem>
                <SelectItem value="FB">Full Board (FB)</SelectItem>
                <SelectItem value="AI">All Inclusive (AI)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Check-in</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(booking.checkIn, 'dd MMM yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={booking.checkIn}
                  onSelect={(date) => date && updateField('checkIn', date)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="space-y-2">
            <Label>Check-out</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(booking.checkOut, 'dd MMM yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={booking.checkOut}
                  onSelect={(date) => date && updateField('checkOut', date)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="space-y-2">
            <Label>Room Type</Label>
            <Input
              value={booking.roomType}
              onChange={(e) => updateField('roomType', e.target.value)}
              placeholder="Deluxe Room"
            />
          </div>
          
          <div className="space-y-2">
            <Label>No. of Rooms</Label>
            <Input
              type="number"
              min={1}
              value={booking.numberOfRooms}
              onChange={(e) => updateField('numberOfRooms', parseInt(e.target.value) || 1)}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Rate/Night</Label>
            <Input
              type="number"
              min={0}
              value={booking.ratePerNight}
              onChange={(e) => updateField('ratePerNight', parseFloat(e.target.value) || 0)}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Total Nights</Label>
            <Input
              value={booking.totalNights}
              disabled
              className="bg-muted"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>Special Requests</Label>
          <Textarea
            value={booking.specialRequests || ''}
            onChange={(e) => updateField('specialRequests', e.target.value)}
            placeholder="Any special requests..."
            rows={2}
          />
        </div>
      </CardContent>
    </Card>
  );
}

interface HotelCustomerCostingTableProps {
  costing: HotelCustomerCosting[];
  onUpdate: (costing: HotelCustomerCosting[]) => void;
  readOnly?: boolean;
}

export function HotelCustomerCostingTable({ costing, onUpdate, readOnly = false }: HotelCustomerCostingTableProps) {
  const addRow = () => {
    const newRow: HotelCustomerCosting = {
      roomNumber: costing.length + 1,
      guestName: '',
      roomRate: 0,
      taxes: 0,
      markup: 0,
      serviceCharge: 0,
      netCost: 0,
    };
    onUpdate([...costing, newRow]);
  };

  const removeRow = (roomNumber: number) => {
    const updated = costing
      .filter(c => c.roomNumber !== roomNumber)
      .map((c, index) => ({ ...c, roomNumber: index + 1 }));
    onUpdate(updated);
  };

  const updateRow = (roomNumber: number, field: keyof HotelCustomerCosting, value: number | string) => {
    const updated = costing.map(c => {
      if (c.roomNumber !== roomNumber) return c;
      const updatedRow = { ...c, [field]: value };
      updatedRow.netCost = updatedRow.roomRate + updatedRow.taxes + updatedRow.markup + updatedRow.serviceCharge;
      return updatedRow;
    });
    onUpdate(updated);
  };

  const totals = costing.reduce(
    (acc, c) => ({
      roomRate: acc.roomRate + c.roomRate,
      taxes: acc.taxes + c.taxes,
      markup: acc.markup + c.markup,
      serviceCharge: acc.serviceCharge + c.serviceCharge,
      netCost: acc.netCost + c.netCost,
    }),
    { roomRate: 0, taxes: 0, markup: 0, serviceCharge: 0, netCost: 0 }
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4" />
          Customer Costing
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-hidden">
          <Table className="costing-table">
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Room #</TableHead>
                <TableHead>Guest Name</TableHead>
                <TableHead className="w-24 text-right">Room Rate</TableHead>
                <TableHead className="w-24 text-right">Taxes</TableHead>
                <TableHead className="w-24 text-right">Markup</TableHead>
                <TableHead className="w-24 text-right">Svc Charge</TableHead>
                <TableHead className="w-24 text-right">Net Cost</TableHead>
                {!readOnly && <TableHead className="w-12"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {costing.map((row) => (
                <TableRow key={row.roomNumber}>
                  <TableCell>{row.roomNumber}</TableCell>
                  <TableCell>
                    {readOnly ? row.guestName : (
                      <Input
                        value={row.guestName}
                        onChange={(e) => updateRow(row.roomNumber, 'guestName', e.target.value)}
                        placeholder="Guest Name"
                        className="h-8"
                      />
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {readOnly ? row.roomRate.toFixed(2) : (
                      <Input
                        type="number"
                        value={row.roomRate}
                        onChange={(e) => updateRow(row.roomNumber, 'roomRate', parseFloat(e.target.value) || 0)}
                        className="h-8 text-right"
                      />
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {readOnly ? row.taxes.toFixed(2) : (
                      <Input
                        type="number"
                        value={row.taxes}
                        onChange={(e) => updateRow(row.roomNumber, 'taxes', parseFloat(e.target.value) || 0)}
                        className="h-8 text-right"
                      />
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {readOnly ? row.markup.toFixed(2) : (
                      <Input
                        type="number"
                        value={row.markup}
                        onChange={(e) => updateRow(row.roomNumber, 'markup', parseFloat(e.target.value) || 0)}
                        className="h-8 text-right"
                      />
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {readOnly ? row.serviceCharge.toFixed(2) : (
                      <Input
                        type="number"
                        value={row.serviceCharge}
                        onChange={(e) => updateRow(row.roomNumber, 'serviceCharge', parseFloat(e.target.value) || 0)}
                        className="h-8 text-right"
                      />
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">{row.netCost.toFixed(2)}</TableCell>
                  {!readOnly && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => removeRow(row.roomNumber)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={2} className="font-semibold">Total</TableCell>
                <TableCell className="text-right font-semibold">{totals.roomRate.toFixed(2)}</TableCell>
                <TableCell className="text-right font-semibold">{totals.taxes.toFixed(2)}</TableCell>
                <TableCell className="text-right font-semibold">{totals.markup.toFixed(2)}</TableCell>
                <TableCell className="text-right font-semibold">{totals.serviceCharge.toFixed(2)}</TableCell>
                <TableCell className="text-right font-semibold">{totals.netCost.toFixed(2)}</TableCell>
                {!readOnly && <TableCell></TableCell>}
              </TableRow>
            </TableBody>
          </Table>
        </div>
        {!readOnly && (
          <Button variant="outline" size="sm" onClick={addRow} className="mt-3">
            <Plus className="h-4 w-4 mr-2" />
            Add Room
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

interface HotelSupplierCostingTableProps {
  costing: HotelSupplierCosting[];
  onUpdate: (costing: HotelSupplierCosting[]) => void;
  readOnly?: boolean;
}

export function HotelSupplierCostingTable({ costing, onUpdate, readOnly = false }: HotelSupplierCostingTableProps) {
  const addRow = () => {
    const newRow: HotelSupplierCosting = {
      roomNumber: costing.length + 1,
      guestName: '',
      roomRate: 0,
      taxes: 0,
      commission: 0,
      netCost: 0,
    };
    onUpdate([...costing, newRow]);
  };

  const removeRow = (roomNumber: number) => {
    const updated = costing
      .filter(c => c.roomNumber !== roomNumber)
      .map((c, index) => ({ ...c, roomNumber: index + 1 }));
    onUpdate(updated);
  };

  const updateRow = (roomNumber: number, field: keyof HotelSupplierCosting, value: number | string) => {
    const updated = costing.map(c => {
      if (c.roomNumber !== roomNumber) return c;
      const updatedRow = { ...c, [field]: value };
      updatedRow.netCost = updatedRow.roomRate + updatedRow.taxes - updatedRow.commission;
      return updatedRow;
    });
    onUpdate(updated);
  };

  const totals = costing.reduce(
    (acc, c) => ({
      roomRate: acc.roomRate + c.roomRate,
      taxes: acc.taxes + c.taxes,
      commission: acc.commission + c.commission,
      netCost: acc.netCost + c.netCost,
    }),
    { roomRate: 0, taxes: 0, commission: 0, netCost: 0 }
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Supplier Costing
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-hidden">
          <Table className="costing-table">
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Room #</TableHead>
                <TableHead>Guest Name</TableHead>
                <TableHead className="w-24 text-right">Room Rate</TableHead>
                <TableHead className="w-24 text-right">Taxes</TableHead>
                <TableHead className="w-24 text-right">Commission</TableHead>
                <TableHead className="w-24 text-right">Net Cost</TableHead>
                {!readOnly && <TableHead className="w-12"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {costing.map((row) => (
                <TableRow key={row.roomNumber}>
                  <TableCell>{row.roomNumber}</TableCell>
                  <TableCell>
                    {readOnly ? row.guestName : (
                      <Input
                        value={row.guestName}
                        onChange={(e) => updateRow(row.roomNumber, 'guestName', e.target.value)}
                        placeholder="Guest Name"
                        className="h-8"
                      />
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {readOnly ? row.roomRate.toFixed(2) : (
                      <Input
                        type="number"
                        value={row.roomRate}
                        onChange={(e) => updateRow(row.roomNumber, 'roomRate', parseFloat(e.target.value) || 0)}
                        className="h-8 text-right"
                      />
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {readOnly ? row.taxes.toFixed(2) : (
                      <Input
                        type="number"
                        value={row.taxes}
                        onChange={(e) => updateRow(row.roomNumber, 'taxes', parseFloat(e.target.value) || 0)}
                        className="h-8 text-right"
                      />
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {readOnly ? row.commission.toFixed(2) : (
                      <Input
                        type="number"
                        value={row.commission}
                        onChange={(e) => updateRow(row.roomNumber, 'commission', parseFloat(e.target.value) || 0)}
                        className="h-8 text-right"
                      />
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">{row.netCost.toFixed(2)}</TableCell>
                  {!readOnly && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => removeRow(row.roomNumber)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={2} className="font-semibold">Total</TableCell>
                <TableCell className="text-right font-semibold">{totals.roomRate.toFixed(2)}</TableCell>
                <TableCell className="text-right font-semibold">{totals.taxes.toFixed(2)}</TableCell>
                <TableCell className="text-right font-semibold">{totals.commission.toFixed(2)}</TableCell>
                <TableCell className="text-right font-semibold">{totals.netCost.toFixed(2)}</TableCell>
                {!readOnly && <TableCell></TableCell>}
              </TableRow>
            </TableBody>
          </Table>
        </div>
        {!readOnly && (
          <Button variant="outline" size="sm" onClick={addRow} className="mt-3">
            <Plus className="h-4 w-4 mr-2" />
            Add Room
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
