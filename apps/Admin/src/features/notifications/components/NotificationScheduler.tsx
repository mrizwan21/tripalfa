import React, { useState, useCallback } from "react";
import * as Icons from "lucide-react";

import { Button } from "@tripalfa/ui-components/ui/button";

const { Clock, Repeat, Calendar, AlertCircle, CheckCircle } = Icons as any;

type ScheduleFrequency = "once" | "daily" | "weekly" | "monthly";

type ScheduledNotification = {
  id: string;
  templateId: string;
  recipients: any[];
  variables: Record<string, any>;
  scheduledFor: Date | string;
  frequency: ScheduleFrequency;
  frequencyConfig?: {
    interval: number;
    unit: "days" | "weeks" | "months";
    endDate?: Date;
    maxOccurrences?: number;
  };
  status: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  createdBy?: string;
};

// ============================================================================
// NOTIFICATION SCHEDULER
// ============================================================================

export interface NotificationSchedulerProps {
  notification?: Partial<ScheduledNotification>;
  onSchedule?: (notification: ScheduledNotification) => Promise<void>;
  onCancel?: () => void;
  disabled?: boolean;
}

export const NotificationScheduler: React.FC<NotificationSchedulerProps> = ({
  notification,
  onSchedule,
  onCancel,
  disabled = false,
}) => {
  const [scheduledFor, setScheduledFor] = useState(
    notification?.scheduledFor
      ? new Date(notification.scheduledFor).toISOString().split("T")[0]
      : "",
  );
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [frequency, setFrequency] = useState<ScheduleFrequency>(
    notification?.frequency || "once",
  );
  const [endDate, setEndDate] = useState("");
  const [maxOccurrences, setMaxOccurrences] = useState("1");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSchedule = useCallback(async () => {
    if (!scheduledFor) return;

    const scheduleDateTime = new Date(`${scheduledFor}T${scheduledTime}`);

    setIsSubmitting(true);
    try {
      await onSchedule?.({
        id: notification?.id || `sched-${Date.now()}`,
        templateId: notification?.templateId || "",
        recipients: notification?.recipients || [],
        variables: notification?.variables || {},
        scheduledFor: scheduleDateTime,
        frequency,
        frequencyConfig:
          frequency !== "once"
            ? {
                interval: 1,
                unit: "days" as const,
                endDate: endDate ? new Date(endDate) : undefined,
                maxOccurrences: parseInt(maxOccurrences) || undefined,
              }
            : undefined,
        status: "scheduled",
        createdAt: notification?.createdAt || new Date(),
        updatedAt: new Date(),
        createdBy: "current-user",
      } as ScheduledNotification);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    scheduledFor,
    scheduledTime,
    frequency,
    endDate,
    maxOccurrences,
    notification,
    onSchedule,
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          Schedule Notification
        </h2>
        <p className="text-muted-foreground mt-1">
          Set up automatic sending with frequency rules
        </p>
      </div>

      {/* Date & Time */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2 text-xl font-semibold tracking-tight">
          <Calendar size={18} />
          Schedule Date & Time
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Date
            </label>
            <input
              type="date"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
              disabled={disabled}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Time
            </label>
            <input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              disabled={disabled}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Frequency */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2 text-xl font-semibold tracking-tight">
          <Repeat size={18} />
          Frequency
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(["once", "daily", "weekly", "monthly"] as const).map((freq) => (
            <Button
              key={freq}
              onClick={() => setFrequency(freq)}
              className={`
                p-3 rounded-lg border-2 font-medium capitalize transition-all
                ${
                  frequency === freq
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-muted-foreground/50 text-foreground"
                }
              `}
              disabled={disabled}
            >
              {freq}
            </Button>
          ))}
        </div>
      </div>

      {/* Recurrence Options */}
      {frequency !== "once" && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 space-y-4">
          <h3 className="font-semibold text-foreground text-xl font-semibold tracking-tight">
            Recurrence Options
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Max Occurrences
              </label>
              <input
                type="number"
                value={maxOccurrences}
                onChange={(e) => setMaxOccurrences(e.target.value)}
                disabled={disabled}
                min="1"
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                End Date (Optional)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={disabled}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <CheckCircle size={20} className="text-green-600 mt-0.5" />
          <div>
            <p className="font-medium text-green-900">Schedule Summary</p>
            <p className="text-sm text-green-700 mt-1">
              Notification will be sent{" "}
              {frequency === "once" ? "once" : `${frequency}`} starting{" "}
              {scheduledFor &&
                `on ${new Date(scheduledFor).toLocaleDateString()}`}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-4 border-t">
        <Button
          onClick={onCancel}
          disabled={disabled}
          className="px-4 py-2 border border-border rounded-lg hover:bg-muted/40 text-foreground"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSchedule}
          disabled={isSubmitting || !scheduledFor}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
        >
          {isSubmitting ? "Scheduling..." : "Schedule Notification"}
        </Button>
      </div>
    </div>
  );
};

export default NotificationScheduler;
