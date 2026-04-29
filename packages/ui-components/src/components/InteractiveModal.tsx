import * as React from "react";
import { cn } from "../lib/utils";
import {
  X,
  AlertCircle,
  CheckCircle,
  Info,
  HelpCircle,
  AlertTriangle,
} from "lucide-react";

export type InteractiveModalVariant =
  | "super-admin"
  | "sub-agency"
  | "b2b"
  | "b2c"
  | "danger"
  | "warning"
  | "success"
  | "info";
export type InteractiveModalSize =
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "fullscreen";
export type InteractiveModalPosition =
  | "center"
  | "top"
  | "bottom"
  | "left"
  | "right";

export interface InteractiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  variant?: InteractiveModalVariant;
  size?: InteractiveModalSize;
  position?: InteractiveModalPosition;
  showHeader?: boolean;
  showCloseButton?: boolean;
  icon?: React.ReactNode;
  subtitle?: string;
  showFooter?: boolean;
  primaryAction?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
    variant?: "primary" | "secondary" | "danger" | "success";
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
  };
  tertiaryAction?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
  };
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
  preventScroll?: boolean;
  showOverlay?: boolean;
  className?: string;
  overlayClassName?: string;
  containerClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
}

const variantConfigs = {
  "super-admin": {
    bgColor: "bg-white",
    textColor: "text-near-black",
    borderColor: "border-near-black",
    headerBg: "bg-near-black",
    iconColor: "text-apple-blue",
    overlay: "bg-black/40",
  },
  "sub-agency": {
    bgColor: "bg-white",
    textColor: "text-near-black",
    borderColor: "border-near-black",
    headerBg: "bg-apple-blue",
    iconColor: "text-apple-blue",
    overlay: "bg-black/30",
  },
  b2b: {
    bgColor: "bg-near-black",
    textColor: "text-white",
    borderColor: "border-white/10",
    headerBg: "bg-dark-surface-1",
    iconColor: "text-apple-blue",
    overlay: "bg-black/60",
  },
  b2c: {
    bgColor: "bg-white",
    textColor: "text-near-black",
    borderColor: "border-near-black",
    headerBg: "bg-near-black",
    iconColor: "text-apple-blue",
    overlay: "bg-black/40",
  },
  danger: {
    bgColor: "bg-white",
    textColor: "text-near-black",
    borderColor: "border-near-black",
    headerBg: "bg-near-black/5",
    iconColor: "text-near-black",
    overlay: "bg-black/40",
  },
  warning: {
    bgColor: "bg-white",
    textColor: "text-near-black",
    borderColor: "border-near-black",
    headerBg: "bg-near-black/5",
    iconColor: "text-near-black",
    overlay: "bg-black/40",
  },
  success: {
    bgColor: "bg-white",
    textColor: "text-near-black",
    borderColor: "border-apple-blue",
    headerBg: "bg-apple-blue/5",
    iconColor: "text-apple-blue",
    overlay: "bg-black/40",
  },
  info: {
    bgColor: "bg-white",
    textColor: "text-near-black",
    borderColor: "border-apple-blue/20",
    headerBg: "bg-apple-blue",
    iconColor: "text-apple-blue",
    overlay: "bg-black/40",
  },
};

const sizeConfigs = {
  xs: {
    width: "max-w-xs",
    padding: "p-4",
    headerPadding: "px-4 py-3",
    bodyPadding: "px-4 py-3",
    footerPadding: "px-4 py-3",
  },
  sm: {
    width: "max-w-sm",
    padding: "p-5",
    headerPadding: "px-5 py-4",
    bodyPadding: "px-5 py-4",
    footerPadding: "px-5 py-4",
  },
  md: {
    width: "max-w-md",
    padding: "p-6",
    headerPadding: "px-6 py-5",
    bodyPadding: "px-6 py-5",
    footerPadding: "px-6 py-5",
  },
  lg: {
    width: "max-w-lg",
    padding: "p-7",
    headerPadding: "px-7 py-6",
    bodyPadding: "px-7 py-6",
    footerPadding: "px-7 py-6",
  },
  xl: {
    width: "max-w-xl",
    padding: "p-8",
    headerPadding: "px-8 py-7",
    bodyPadding: "px-8 py-7",
    footerPadding: "px-8 py-7",
  },
  fullscreen: {
    width: "max-w-full h-full",
    padding: "p-0",
    headerPadding: "px-8 py-6",
    bodyPadding: "px-8 py-6",
    footerPadding: "px-8 py-6",
  },
};

const positionConfigs = {
  center: "items-center justify-center",
  top: "items-start justify-center pt-8",
  bottom: "items-end justify-center pb-8",
  left: "items-center justify-start pl-8",
  right: "items-center justify-end pr-8",
};

const defaultIcons: Record<string, React.ReactNode> = {
  danger: <AlertCircle className="h-5 w-5" />,
  warning: <AlertTriangle className="h-5 w-5" />,
  success: <CheckCircle className="h-5 w-5" />,
  info: <Info className="h-5 w-5" />,
  help: <HelpCircle className="h-5 w-5" />,
};

export const InteractiveModal = React.forwardRef<
  HTMLDivElement,
  InteractiveModalProps
>(
  (
    {
      isOpen,
      onClose,
      title,
      children,
      variant = "super-admin",
      size = "md",
      position = "center",
      showHeader = true,
      showCloseButton = true,
      icon,
      subtitle,
      showFooter = false,
      primaryAction,
      secondaryAction,
      tertiaryAction,
      closeOnOverlayClick = true,
      closeOnEsc = true,
      preventScroll = true,
      showOverlay = true,
      className,
      overlayClassName,
      containerClassName,
      headerClassName,
      bodyClassName,
      footerClassName,
      ariaLabel,
      ariaLabelledBy,
      ariaDescribedBy,
    },
    ref
  ) => {
    const modalRef = React.useRef<HTMLDivElement>(null);
    const config = variantConfigs[variant];
    const sizeConfig = sizeConfigs[size];
    const positionConfig = positionConfigs[position];

    // Handle ESC key press
    React.useEffect(() => {
      const handleEsc = (event: KeyboardEvent) => {
        if (closeOnEsc && event.key === "Escape" && isOpen) {
          onClose();
        }
      };
      if (isOpen) {
        document.addEventListener("keydown", handleEsc);
        if (preventScroll) {
          document.body.style.overflow = "hidden";
        }
      }
      return () => {
        document.removeEventListener("keydown", handleEsc);
        if (preventScroll) {
          document.body.style.overflow = "";
        }
      };
    }, [isOpen, closeOnEsc, onClose, preventScroll]);

    // Handle overlay click
    const handleOverlayClick = (event: React.MouseEvent) => {
      if (closeOnOverlayClick && event.target === event.currentTarget) {
        onClose();
      }
    };

    // Determine icon to display
    const getIcon = () => {
      if (icon) return icon;
      if (variant in defaultIcons) return defaultIcons[variant as keyof typeof defaultIcons];
      return null;
    };

    if (!isOpen) return null;

    const modalContent = (
      <div
        ref={modalRef}
        className={cn(
          config.bgColor,
          config.textColor,
          config.borderColor,
          sizeConfig.width,
          size !== "fullscreen" && "rounded-xl border shadow-apple",
          size === "fullscreen" && "h-screen rounded-none",
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
      >
        {/* Header */}
        {showHeader && (
          <div
            className={cn(
              "border-b",
              config.borderColor,
              config.headerBg,
              sizeConfig.headerPadding,
              "flex items-center justify-between",
              headerClassName
            )}
          >
            <div className="flex items-center gap-3">
              {getIcon() && (
                <span className={cn(config.iconColor, "flex-shrink-0")}>
                  {getIcon()}
                </span>
              )}
              <div>
                {title && (
                  <h3 className="text-lg font-semibold leading-tight">
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p className="text-sm opacity-70 mt-0.5">{subtitle}</p>
                )}
              </div>
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className={cn(
                  "p-1 rounded-md transition-colors",
                  "hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-offset-2",
                  variant === "b2b"
                    ? "focus:ring-white/20"
                    : "focus:ring-black/20"
                )}
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div
          className={cn(
            sizeConfig.bodyPadding,
            "overflow-y-auto",
            size === "fullscreen" && "flex-1",
            bodyClassName
          )}
        >
          {children}
        </div>

        {/* Footer */}
        {showFooter && (primaryAction || secondaryAction || tertiaryAction) && (
          <div
            className={cn(
              "border-t",
              config.borderColor,
              config.headerBg,
              sizeConfig.footerPadding,
              "flex items-center justify-between gap-3",
              footerClassName
            )}
          >
            <div className="flex items-center gap-2">
              {tertiaryAction && (
                <button
                  onClick={tertiaryAction.onClick}
                  disabled={tertiaryAction.disabled}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                    "text-near-black hover:text-near-black hover:bg-near-black",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {tertiaryAction.label}
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              {secondaryAction && (
                <button
                  onClick={secondaryAction.onClick}
                  disabled={secondaryAction.disabled}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-md transition-colors",
                    "border border-near-black text-near-black hover:bg-near-black",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {secondaryAction.label}
                </button>
              )}
              {primaryAction && (
                <button
                  onClick={primaryAction.onClick}
                  disabled={primaryAction.disabled || primaryAction.loading}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-md transition-colors",
                    "text-white",
                    primaryAction.variant === "danger" &&
                      "bg-near-black hover:bg-near-black",
                    primaryAction.variant === "success" &&
                      "bg-apple-blue hover:bg-apple-blue",
                    (!primaryAction.variant ||
                      primaryAction.variant === "primary") &&
                      "bg-apple-blue hover:bg-apple-blue",
                    primaryAction.variant === "secondary" &&
                      "bg-near-black hover:bg-near-black",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "flex items-center gap-2"
                  )}
                >
                  {primaryAction.loading && (
                    <svg
                      className="animate-spin h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                  )}
                  {primaryAction.label}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );

    return (
      <div
        className={cn(
          "fixed inset-0 z-50 flex",
          positionConfig,
          showOverlay && config.overlay,
          overlayClassName
        )}
        onClick={handleOverlayClick}
        ref={ref}
      >
        {modalContent}
      </div>
    );
  }
);

InteractiveModal.displayName = "InteractiveModal";

// Hook for using the modal
export function useInteractiveModal() {
  const [isOpen, setIsOpen] = React.useState(false);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen((prev) => !prev);

  return {
    isOpen,
    open,
    close,
    toggle,
    modalProps: {
      isOpen,
      onClose: close,
    },
  };
}