import * as React from "react";
import { cn } from "../lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { AlertCircle, CheckCircle, AlertTriangle, Info, X } from "lucide-react";

export type StatusAlertStatus = "success" | "error" | "warning" | "info";
export type StatusAlertVariant = "b2b" | "b2c" | "admin";
export type StatusAlertDensity = "compact" | "normal" | "comfortable";

export interface StatusAlertProps
  extends VariantProps<typeof alertVariants> {
  variant?: StatusAlertVariant;
  status: StatusAlertStatus;
  title?: string;
  message: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  containerClassName?: string;
  children?: React.ReactNode;
}

const alertVariants = cva(
  "relative flex items-start gap-4 border rounded-lg transition-colors",
  {
    variants: {
      status: {
        success: "bg-apple-blue/10 border-apple-blue/20 text-apple-blue",
        error: "bg-near-black/10 border-near-black/20 text-near-black",
        warning: "bg-apple-blue/10 border-apple-blue/20 text-apple-blue",
        info: "bg-apple-blue/10 border-apple-blue/20 text-apple-blue",
      },
      density: {
        compact: "p-3",
        normal: "p-4",
        comfortable: "p-6",
      },
    },
    defaultVariants: {
      status: "info",
      density: "normal",
    },
  }
);

const densityStyles = {
  compact: { title: "text-xs font-bold", message: "text-xs", icon: "h-4 w-4" },
  normal: { title: "text-sm font-bold", message: "text-sm", icon: "h-5 w-5" },
  comfortable: { title: "text-base font-bold", message: "text-base", icon: "h-6 w-6" },
};

const getIcon = (status: StatusAlertStatus) => {
  const iconClass = "h-full w-full";
  switch (status) {
    case "success":
      return <CheckCircle className={iconClass} />;
    case "error":
      return <AlertCircle className={iconClass} />;
    case "warning":
      return <AlertTriangle className={iconClass} />;
    case "info":
    default:
      return <Info className={iconClass} />;
  }
};

const getStatusColor = (status: StatusAlertStatus) => {
  switch (status) {
    case "success":
      return "text-apple-blue";
    case "error":
      return "text-near-black";
    case "warning":
      return "text-apple-blue";
    case "info":
    default:
      return "text-apple-blue";
  }
};

export const StatusAlert = React.forwardRef<
  HTMLDivElement,
  StatusAlertProps
>(
  (
    {
      status = "info",
      title,
      message,
      dismissible = false,
      onDismiss,
      icon,
      action,
      variant = "b2b",
      density = "normal",
      containerClassName,
      children,
    },
    ref
  ) => {
    const [isDismissed, setIsDismissed] = React.useState(false);
    const styles = densityStyles[density || "normal"];

    const handleDismiss = () => {
      setIsDismissed(true);
      onDismiss?.();
    };

    if (isDismissed) {
      return null;
    }

    return (
      <div
        ref={ref}
        className={cn(alertVariants({ status, density }), containerClassName)}
        role="alert"
      >
        {/* Icon */}
        <div
          className={cn(
            styles.icon,
            "flex-shrink-0 mt-0.5",
            getStatusColor(status)
          )}
        >
          {icon || getIcon(status)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className={cn(styles.title, "mb-1")}>
              {title}
            </h3>
          )}
          <p className={cn(styles.message, title && "text-current/80")}>
            {message}
          </p>

          {/* Action Button */}
          {action && (
            <button
              onClick={action.onClick}
              className={cn(
                "mt-2 font-semibold text-sm underline transition-opacity hover:opacity-70",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                status === "success" && "focus-visible:ring-apple-blue",
                status === "error" && "focus-visible:ring-near-black",
                status === "warning" && "focus-visible:ring-apple-blue",
                status === "info" && "focus-visible:ring-apple-blue"
              )}
            >
              {action.label}
            </button>
          )}

          {children}
        </div>

        {/* Dismiss Button */}
        {dismissible && (
          <button
            onClick={handleDismiss}
            className={cn(
              "flex-shrink-0 p-1 rounded-lg transition-colors",
              status === "success" && "hover:bg-apple-blue/10",
              status === "error" && "hover:bg-near-black/10",
              status === "warning" && "hover:bg-apple-blue/10",
              status === "info" && "hover:bg-apple-blue/10"
            )}
            aria-label="Dismiss alert"
          >
            <X className={cn(styles.icon, "opacity-60 hover:opacity-100")} />
          </button>
        )}
      </div>
    );
  }
);

StatusAlert.displayName = "StatusAlert";
