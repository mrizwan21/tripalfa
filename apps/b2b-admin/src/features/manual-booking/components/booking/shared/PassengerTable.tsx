import { Passenger } from '@/features/manual-booking/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Plus, Trash2 } from 'lucide-react';

interface PassengerTableProps {
  passengers: Passenger[];
  onUpdate: (passengers: Passenger[]) => void;
  readOnly?: boolean;
}

export function PassengerTable({ passengers, onUpdate, readOnly = false }: PassengerTableProps) {
  const addPassenger = () => {
    const newPassenger: Passenger = {
      id: crypto.randomUUID(),
      pNo: passengers.length + 1,
      ticketNumber: '',
      name: '',
      type: 'ADT',
    };
    onUpdate([...passengers, newPassenger]);
  };

  const removePassenger = (id: string) => {
    const updated = passengers
      .filter(p => p.id !== id)
      .map((p, index) => ({ ...p, pNo: index + 1 }));
    onUpdate(updated);
  };

  const updatePassenger = (id: string, field: keyof Passenger, value: string) => {
    const updated = passengers.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    );
    onUpdate(updated);
  };

  return (
    <div className="space-y-3">
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-16">P No.</TableHead>
              <TableHead>Ticket Number</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="w-24">Type</TableHead>
              {!readOnly && <TableHead className="w-16"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {passengers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={readOnly ? 4 : 5} className="text-center text-muted-foreground py-8">
                  No passengers added
                </TableCell>
              </TableRow>
            ) : (
              passengers.map((passenger) => (
                <TableRow key={passenger.id}>
                  <TableCell className="font-medium">{passenger.pNo}</TableCell>
                  <TableCell>
                    {readOnly ? (
                      <span>{passenger.ticketNumber}</span>
                    ) : (
                      <Input
                        value={passenger.ticketNumber}
                        onChange={(e) => updatePassenger(passenger.id, 'ticketNumber', e.target.value)}
                        placeholder="176-4401 786 543"
                        className="h-8"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {readOnly ? (
                      <span>{passenger.name} - {passenger.type}</span>
                    ) : (
                      <Input
                        value={passenger.name}
                        onChange={(e) => updatePassenger(passenger.id, 'name', e.target.value)}
                        placeholder="Passenger Name"
                        className="h-8"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {readOnly ? (
                      <span>{passenger.type}</span>
                    ) : (
                      <Select
                        value={passenger.type}
                        onValueChange={(value) => updatePassenger(passenger.id, 'type', value)}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ADT">ADT</SelectItem>
                          <SelectItem value="CHD">CHD</SelectItem>
                          <SelectItem value="INF">INF</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                  {!readOnly && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => removePassenger(passenger.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {!readOnly && (
        <Button variant="outline" size="sm" onClick={addPassenger}>
          <Plus className="h-4 w-4 mr-2" />
          Add Passenger
        </Button>
      )}
    </div>
  );
}
