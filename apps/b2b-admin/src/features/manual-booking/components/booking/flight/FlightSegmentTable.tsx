import { FlightSegment, JourneyType } from '@/features/manual-booking/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface FlightSegmentTableProps {
  segments: FlightSegment[];
  onUpdate: (segments: FlightSegment[]) => void;
  readOnly?: boolean;
}

export function FlightSegmentTable({ segments, onUpdate, readOnly = false }: FlightSegmentTableProps) {
  const addSegment = () => {
    const newSegment: FlightSegment = {
      id: crypto.randomUUID(),
      journey: 'DEP',
      airline: '',
      flightNumber: '',
      departureAirport: '',
      arrivalAirport: '',
      date: new Date(),
      departureTime: '',
      arrivalTime: '',
      terminal: '',
      class: '',
      seat: '',
      stopOver: 0,
      bags: '',
      status: 'HK',
      pnr: '',
    };
    onUpdate([...segments, newSegment]);
  };

  const removeSegment = (id: string) => {
    onUpdate(segments.filter(s => s.id !== id));
  };

  const updateSegment = (id: string, field: keyof FlightSegment, value: any) => {
    const updated = segments.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    );
    onUpdate(updated);
  };

  return (
    <div className="space-y-3">
      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-20">Journey*</TableHead>
              <TableHead className="w-20">Airline*</TableHead>
              <TableHead className="w-20">Flight*</TableHead>
              <TableHead className="w-20">Airport*</TableHead>
              <TableHead className="w-32">Date*</TableHead>
              <TableHead className="w-24">Dep. Time*</TableHead>
              <TableHead className="w-24">Arr. Time*</TableHead>
              <TableHead className="w-20">Terminal</TableHead>
              <TableHead className="w-16">Class*</TableHead>
              <TableHead className="w-16">Seat*</TableHead>
              <TableHead className="w-20">Stop Over</TableHead>
              <TableHead className="w-16">Bags</TableHead>
              <TableHead className="w-16">Status</TableHead>
              <TableHead className="w-24">New PNR</TableHead>
              {!readOnly && <TableHead className="w-12"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {segments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={readOnly ? 14 : 15} className="text-center text-muted-foreground py-8">
                  No flight segments added
                </TableCell>
              </TableRow>
            ) : (
              segments.map((segment) => (
                <TableRow key={segment.id}>
                  <TableCell>
                    {readOnly ? (
                      <span>{segment.journey}</span>
                    ) : (
                      <Select
                        value={segment.journey}
                        onValueChange={(v) => updateSegment(segment.id, 'journey', v as JourneyType)}
                      >
                        <SelectTrigger className="h-8 w-16">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DEP">DEP</SelectItem>
                          <SelectItem value="ARR">ARR</SelectItem>
                          <SelectItem value="TRANSIT">TRANSIT</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                  <TableCell>
                    {readOnly ? segment.airline : (
                      <Input
                        value={segment.airline}
                        onChange={(e) => updateSegment(segment.id, 'airline', e.target.value)}
                        placeholder="LH"
                        className="h-8 w-16"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {readOnly ? segment.flightNumber : (
                      <Input
                        value={segment.flightNumber}
                        onChange={(e) => updateSegment(segment.id, 'flightNumber', e.target.value)}
                        placeholder="542"
                        className="h-8 w-16"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {readOnly ? segment.departureAirport : (
                      <Input
                        value={segment.departureAirport}
                        onChange={(e) => updateSegment(segment.id, 'departureAirport', e.target.value)}
                        placeholder="DXB"
                        className="h-8 w-16"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {readOnly ? (
                      format(segment.date, 'dd MMM yy')
                    ) : (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn("h-8 w-28 justify-start text-left font-normal", !segment.date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-1 h-3 w-3" />
                            {segment.date ? format(segment.date, 'dd MMM yy') : 'Select'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={segment.date}
                            onSelect={(date) => date && updateSegment(segment.id, 'date', date)}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  </TableCell>
                  <TableCell>
                    {readOnly ? segment.departureTime : (
                      <Input
                        type="time"
                        value={segment.departureTime}
                        onChange={(e) => updateSegment(segment.id, 'departureTime', e.target.value)}
                        className="h-8 w-24"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {readOnly ? segment.arrivalTime : (
                      <Input
                        type="time"
                        value={segment.arrivalTime}
                        onChange={(e) => updateSegment(segment.id, 'arrivalTime', e.target.value)}
                        className="h-8 w-24"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {readOnly ? segment.terminal : (
                      <Input
                        value={segment.terminal}
                        onChange={(e) => updateSegment(segment.id, 'terminal', e.target.value)}
                        placeholder="1A"
                        className="h-8 w-16"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {readOnly ? segment.class : (
                      <Input
                        value={segment.class}
                        onChange={(e) => updateSegment(segment.id, 'class', e.target.value)}
                        placeholder="V"
                        className="h-8 w-12"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {readOnly ? segment.seat : (
                      <Input
                        value={segment.seat}
                        onChange={(e) => updateSegment(segment.id, 'seat', e.target.value)}
                        placeholder="C23"
                        className="h-8 w-14"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {readOnly ? segment.stopOver : (
                      <Input
                        type="number"
                        min={0}
                        value={segment.stopOver}
                        onChange={(e) => updateSegment(segment.id, 'stopOver', parseInt(e.target.value) || 0)}
                        className="h-8 w-14"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {readOnly ? segment.bags : (
                      <Input
                        value={segment.bags}
                        onChange={(e) => updateSegment(segment.id, 'bags', e.target.value)}
                        placeholder="2PC"
                        className="h-8 w-14"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {readOnly ? segment.status : (
                      <Input
                        value={segment.status}
                        onChange={(e) => updateSegment(segment.id, 'status', e.target.value)}
                        placeholder="HK"
                        className="h-8 w-12"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {readOnly ? segment.pnr : (
                      <Input
                        value={segment.pnr}
                        onChange={(e) => updateSegment(segment.id, 'pnr', e.target.value)}
                        placeholder="LV78KL"
                        className="h-8 w-20"
                      />
                    )}
                  </TableCell>
                  {!readOnly && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => removeSegment(segment.id)}
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
        <Button variant="outline" size="sm" onClick={addSegment}>
          <Plus className="h-4 w-4 mr-2" />
          Add Segment
        </Button>
      )}
    </div>
  );
}
