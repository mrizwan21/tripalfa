import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { BookingDetails, BookingStatus } from '@/features/manual-booking/types';
import { format } from 'date-fns';
import { Calendar, Clock, FileText, Hash } from 'lucide-react';

interface BookingDetailsCardProps {
  title: string;
  details: BookingDetails;
  variant?: 'old' | 'new';
}

const statusColors: Record<BookingStatus, string> = {
  pending: 'status-pending',
  confirmed: 'status-confirmed',
  issued: 'status-issued',
  cancelled: 'status-cancelled',
  amended: 'bg-purple-100 text-purple-800',
  reissued: 'bg-blue-100 text-blue-800',
};

export function BookingDetailsCard({ title, details, variant = 'new' }: BookingDetailsCardProps) {
  const isOld = variant === 'old';
  
  return (
    <Card className={isOld ? 'border-muted bg-muted/30' : 'border-primary/20'}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          {isOld ? (
            <span className="h-2 w-2 rounded-full bg-muted-foreground" />
          ) : (
            <span className="h-2 w-2 rounded-full bg-primary" />
          )}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Booking Ref</p>
              <p className="font-medium">{details.bookingRef}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Invoice</p>
              <p className="font-medium">{details.invoice}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Supplier Ref</p>
              <p className="font-medium">{details.supplierRef}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Date & Time</p>
              <p className="font-medium">
                {format(details.date, 'dd MMM yyyy')} | {details.time}
              </p>
            </div>
          </div>
        </div>
        
        <div className="pt-2">
          <Badge className={`status-badge ${statusColors[details.status]}`}>
            {details.status.charAt(0).toUpperCase() + details.status.slice(1)}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
