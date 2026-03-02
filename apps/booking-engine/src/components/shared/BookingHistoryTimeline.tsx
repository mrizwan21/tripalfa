import React from "react";
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  CreditCard,
  User,
  FileText,
  Key,
} from "lucide-react";
import { cn } from "@tripalfa/ui-components";

export interface HistoryEvent {
  id: string;
  action: string;
  date: string;
  type: "system" | "payment" | "modification" | "alert" | "document" | "login";
  description: string;
  user?: string;
}

interface BookingHistoryTimelineProps {
  events: HistoryEvent[];
  className?: string;
}

const getEventIcon = (type: HistoryEvent["type"]) => {
  switch (type) {
    case "payment":
      return <CreditCard className="w-4 h-4" />;
    case "modification":
      return <User className="w-4 h-4" />;
    case "alert":
      return <AlertCircle className="w-4 h-4" />;
    case "document":
      return <FileText className="w-4 h-4" />;
    case "login":
      return <Key className="w-4 h-4" />;
    case "system":
    default:
      return <CheckCircle2 className="w-4 h-4" />;
  }
};

const getEventColor = (type: HistoryEvent["type"]) => {
  switch (type) {
    case "payment":
      return "bg-green-100 text-green-600 border-green-200";
    case "modification":
      return "bg-blue-100 text-blue-600 border-blue-200";
    case "alert":
      return "bg-red-100 text-red-600 border-red-200";
    case "document":
      return "bg-purple-100 text-purple-600 border-purple-200";
    case "login":
      return "bg-yellow-100 text-yellow-600 border-yellow-200";
    case "system":
    default:
      return "bg-muted text-muted-foreground border-border";
  }
};

export const BookingHistoryTimeline: React.FC<BookingHistoryTimelineProps> = ({
  events,
  className,
}) => {
  if (!events.length) {
    return (
      <div className="text-center py-8 text-[var(--color-text-tertiary)]">
        No history events found.
      </div>
    );
  }

  return (
    <div
      className={cn(
        "space-y-8 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-[var(--color-border-light)] hover:before:bg-[var(--color-border-hover)] before:transition-colors",
        className,
      )}
    >
      {events.map((event, index) => (
        <div key={event.id || index} className="relative pl-12 group">
          {/* Icon Marker */}
          <div
            className={cn(
              "absolute left-0 top-1 w-10 h-10 rounded-full border-4 border-white shadow-sm flex items-center justify-center z-10 transition-transform group-hover:scale-110",
              getEventColor(event.type),
            )}
          >
            {getEventIcon(event.type)}
          </div>

          {/* Content Card */}
          <div className="bg-white p-4 rounded-lg border border-[var(--color-border-light)] shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-1 gap-4">
              <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">
                {event.action}
              </h4>
              <span className="text-xs text-[var(--color-text-tertiary)] flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(event.date).toLocaleString()}
              </span>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-2">
              {event.description}
            </p>
            {event.user && (
              <div className="flex items-center gap-2 text-xs text-[var(--color-text-tertiary)] border-t border-[var(--color-border-light)] pt-2 mt-2">
                <User className="w-3 h-3" />
                <span>
                  Action by:{" "}
                  <span className="font-medium text-[var(--color-text-primary)]">
                    {event.user}
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
