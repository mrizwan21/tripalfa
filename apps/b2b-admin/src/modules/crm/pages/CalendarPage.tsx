import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../../shared/lib/api';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  User,
  AlertCircle,
  Trash2,
  Edit2,
} from '@tripalfa/ui-components/icons';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/optics';
import { Button } from '@/components/optics';
import { Badge } from '@/components/optics';
import { StatusBadge } from '@tripalfa/ui-components';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/optics';
import { cn } from '@tripalfa/shared-utils/utils';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  type: 'MEETING' | 'REMINDER' | 'TASK_DUE' | 'BOOKING_DEADLINE' | 'CALL' | 'EMAIL';
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  location?: string;
  attendees?: {
    id: string;
    name: string;
    email: string;
    status: 'ACCEPTED' | 'DECLINED' | 'TENTATIVE';
  }[];
  relatedTo?: {
    type: 'BOOKING' | 'CONTACT' | 'COMPANY' | 'OPPORTUNITY';
    id: string;
    name: string;
  };
  reminders?: number[]; // minutes before event
}

interface CalendarDay {
  date: Date;
  events: CalendarEvent[];
  isCurrentMonth: boolean;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    type: 'MEETING' as const,
    startTime: new Date().toISOString().slice(0, 16),
    endTime: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
  });

  const { data: events, isLoading, refetch } = useQuery<CalendarEvent[]>({
    queryKey: ['calendar-events', currentDate.toISOString().split('T')[0]],
    queryFn: async () => {
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
        .toISOString()
        .split('T')[0];
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
        .toISOString()
        .split('T')[0];
      const response = await api.get(
        `/crm/calendar?start=${monthStart}&end=${monthEnd}`
      );
      return response.data;
    },
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: typeof newEvent) => {
      const response = await api.post('/crm/calendar', data);
      return response.data;
    },
    onSuccess: () => {
      refetch();
      setIsCreateOpen(false);
      setNewEvent({
        title: '',
        description: '',
        type: 'MEETING',
        startTime: new Date().toISOString().slice(0, 16),
        endTime: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
      });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/crm/calendar/${id}`);
    },
    onSuccess: () => {
      refetch();
    },
  });

  const getDaysInMonth = (date: Date): CalendarDay[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: CalendarDay[] = [];

    // Add previous month's days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date,
        events: [],
        isCurrentMonth: false,
      });
    }

    // Add current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];
      const dayEvents =
        events?.filter(
          (e) => e.startTime.split('T')[0] === dateStr
        ) || [];
      days.push({
        date,
        events: dayEvents,
        isCurrentMonth: true,
      });
    }

    // Add next month's days
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date,
        events: [],
        isCurrentMonth: false,
      });
    }

    return days;
  };

  const getEventTypeStatus = (type: string): 'primary' | 'info' | 'warning' | 'success' | 'default' => {
    const statusMap = {
      MEETING: 'info' as const,
      REMINDER: 'warning' as const,
      TASK_DUE: 'warning' as const,
      BOOKING_DEADLINE: 'primary' as const,
      CALL: 'info' as const,
      EMAIL: 'success' as const,
    };
    return statusMap[type as keyof typeof statusMap] || 'default';
  };

  const monthDays = getDaysInMonth(currentDate);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const today = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="action-row">
        <div>
          <h1 className="text-page-title">Calendar</h1>
          <p className="text-caption mt-1">
            Schedule meetings, reminders, and track important dates
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus size={18} />
          New Event
        </Button>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('month')}
              >
                Month
              </Button>
              <Button
                variant={viewMode === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('week')}
              >
                Week
              </Button>
              <Button
                variant={viewMode === 'day' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('day')}
              >
                Day
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={previousMonth}
              >
                <ChevronLeft size={16} />
              </Button>
              <div className="w-40 text-center font-semibold">
                {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={nextMonth}
              >
                <ChevronRight size={16} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={today}
              >
                Today
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Grid */}
      {viewMode === 'month' && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="text-center font-semibold text-sm text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}

              {monthDays.map((day, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'min-h-32 border rounded-lg p-2 cursor-pointer hover:bg-muted/50 transition-colors',
                    'border-gray-200',
                    !day.isCurrentMonth && 'bg-muted/30 text-muted-foreground',
                    day.isCurrentMonth &&
                      day.date.toDateString() === new Date().toDateString() &&
                      'bg-blue-50 border-blue-200'
                  )}
                  onClick={() => setSelectedDate(day.date)}
                >
                  <div className="font-semibold text-sm mb-2">
                    {day.date.getDate()}
                  </div>
                  <div className="space-y-1">
                    {day.events.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className={cn(
                          'text-xs px-2 py-1 rounded truncate cursor-pointer hover:opacity-80',
                          'bg-muted text-muted-foreground'
                        )}
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    ))}
                    {day.events.length > 3 && (
                      <div className="text-xs text-muted-foreground px-2">
                        +{day.events.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Events List */}
      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>
                {selectedDate.toLocaleDateString('default', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
              <Button variant="ghost" onClick={() => setSelectedDate(null)}>
                ✕
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {monthDays
              .find((d) => d.date.toDateString() === selectedDate.toDateString())
              ?.events.map((event) => (
                <Card key={event.id} className="border">
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{event.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {event.description}
                          </p>
                        </div>
                        <StatusBadge status={getEventTypeStatus(event.type)} label={event.type} size="sm" />
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span>
                            {new Date(event.startTime).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                            {' - '}
                            {new Date(event.endTime).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span>{event.location}</span>
                          </div>
                        )}
                      </div>

                      {event.attendees && event.attendees.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Attendees:</p>
                          <div className="flex flex-wrap gap-2">
                            {event.attendees.map((attendee) => (
                              <Badge
                                key={attendee.id}
                                variant="outline"
                                className="text-xs"
                              >
                                <User className="w-3 h-3 mr-1" />
                                {attendee.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end gap-2 pt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            deleteEventMutation.mutate(event.id)
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </CardContent>
        </Card>
      )}

      {/* Create Event Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Calendar Event</DialogTitle>
            <DialogDescription>
              Schedule a new meeting, task, or reminder
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label htmlFor="calendar-event-title" className="text-sm font-medium">Title</label>
              <input
                id="calendar-event-title"
                name="calendar-event-title"
                type="text"
                placeholder="Event title"
                value={newEvent.title}
                onChange={(e) =>
                  setNewEvent((prev) => ({ ...prev, title: e.target.value }))
                }
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>

            <div>
              <label htmlFor="calendar-event-description" className="text-sm font-medium">Description</label>
              <textarea
                id="calendar-event-description"
                name="calendar-event-description"
                placeholder="Event description (optional)"
                value={newEvent.description}
                onChange={(e) =>
                  setNewEvent((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>

            <div>
              <label htmlFor="calendar-event-type" className="text-sm font-medium">Type</label>
              <select
                id="calendar-event-type"
                name="calendar-event-type"
                value={newEvent.type}
                onChange={(e) =>
                  setNewEvent((prev) => ({
                    ...prev,
                    type: e.target.value as typeof newEvent.type,
                  }))
                }
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="MEETING">Meeting</option>
                <option value="CALL">Call</option>
                <option value="REMINDER">Reminder</option>
                <option value="TASK_DUE">Task Due</option>
                <option value="BOOKING_DEADLINE">Booking Deadline</option>
                <option value="EMAIL">Email</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="calendar-event-start" className="text-sm font-medium">Start Time</label>
                <input
                  id="calendar-event-start"
                  name="calendar-event-start"
                  type="datetime-local"
                  value={newEvent.startTime}
                  onChange={(e) =>
                    setNewEvent((prev) => ({
                      ...prev,
                      startTime: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
              </div>

              <div>
                <label htmlFor="calendar-event-end" className="text-sm font-medium">End Time</label>
                <input
                  id="calendar-event-end"
                  name="calendar-event-end"
                  type="datetime-local"
                  value={newEvent.endTime}
                  onChange={(e) =>
                    setNewEvent((prev) => ({
                      ...prev,
                      endTime: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => createEventMutation.mutate(newEvent)}
              disabled={!newEvent.title || createEventMutation.isPending}
            >
              Create Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
