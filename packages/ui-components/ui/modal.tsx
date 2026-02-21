'use client';

// Admin Panel - Modal & Dialog Components
import { Fragment, ReactNode, useEffect } from 'react';
import { X, AlertTriangle, CheckCircle, Info, AlertCircle } from 'lucide-react';
import { cn } from '@tripalfa/shared-utils';

// ============================================================================
// Modal Component
// ============================================================================

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  children: ReactNode;
  footer?: ReactNode;
  closeOnOverlay?: boolean;
  showCloseButton?: boolean;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[95vw]',
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  children,
  footer,
  closeOnOverlay = true,
  showCloseButton = true,
}: ModalProps): React.ReactElement | null {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeOnOverlay ? onClose : undefined}
      />

      {/* Modal */}
      <div
        className={cn(
          'relative w-full animate-scale-in rounded-lg bg-white shadow-xl dark:bg-secondary-900',
          sizeClasses[size],
          'max-h-[90vh] overflow-hidden'
        )}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between border-b p-4 dark:border-secondary-700">
            <div>
              {title && (
                <h2 className="text-lg font-semibold text-secondary-900 dark:text-white">
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-1 text-sm text-secondary-500">{description}</p>
              )}
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="rounded-lg p-1 text-secondary-400 hover:bg-secondary-100 hover:text-secondary-500 dark:hover:bg-secondary-800"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="max-h-[calc(90vh-8rem)] overflow-y-auto p-4">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 border-t p-4 dark:border-secondary-700">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Confirm Dialog
// ============================================================================

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'info' | 'warning' | 'danger';
  loading?: boolean;
}

const typeConfig = {
  info: {
    icon: Info,
    iconBg: 'bg-primary-100 dark:bg-primary-900/30',
    iconColor: 'text-primary-600',
    buttonClass: 'btn-primary',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-warning-100 dark:bg-warning-900/30',
    iconColor: 'text-warning-600',
    buttonClass: 'bg-warning-600 text-white hover:bg-warning-700',
  },
  danger: {
    icon: AlertCircle,
    iconBg: 'bg-error-100 dark:bg-error-900/30',
    iconColor: 'text-error-600',
    buttonClass: 'btn-danger',
  },
};

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  type = 'info',
  loading = false,
}: ConfirmDialogProps): React.ReactElement {
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" showCloseButton={false}>
      <div className="flex flex-col items-center text-center">
        <div className={cn('rounded-full p-3', config.iconBg)}>
          <Icon className={cn('h-6 w-6', config.iconColor)} />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-secondary-900 dark:text-white">
          {title}
        </h3>
        <p className="mt-2 text-sm text-secondary-500">{message}</p>
        <div className="mt-6 flex w-full gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="btn-outline flex-1"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn('btn flex-1', config.buttonClass)}
          >
            {loading ? 'Loading...' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ============================================================================
// Alert Banner
// ============================================================================

interface AlertProps {
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message: string;
  onClose?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const alertConfig = {
  info: {
    icon: Info,
    bg: 'bg-primary-50 dark:bg-primary-900/20',
    border: 'border-primary-200 dark:border-primary-800',
    iconColor: 'text-primary-600',
    textColor: 'text-primary-800 dark:text-primary-200',
  },
  success: {
    icon: CheckCircle,
    bg: 'bg-success-50 dark:bg-success-900/20',
    border: 'border-success-200 dark:border-success-800',
    iconColor: 'text-success-600',
    textColor: 'text-success-800 dark:text-success-200',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-warning-50 dark:bg-warning-900/20',
    border: 'border-warning-200 dark:border-warning-800',
    iconColor: 'text-warning-600',
    textColor: 'text-warning-800 dark:text-warning-200',
  },
  error: {
    icon: AlertCircle,
    bg: 'bg-error-50 dark:bg-error-900/20',
    border: 'border-error-200 dark:border-error-800',
    iconColor: 'text-error-600',
    textColor: 'text-error-800 dark:text-error-200',
  },
};

export function Alert({ type = 'info', title, message, onClose, action }: AlertProps): React.ReactElement {
  const config = alertConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border p-4',
        config.bg,
        config.border
      )}
    >
      <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', config.iconColor)} />
      <div className="flex-1">
        {title && (
          <h4 className={cn('font-medium', config.textColor)}>{title}</h4>
        )}
        <p className={cn('text-sm', config.textColor, title && 'mt-1')}>
          {message}
        </p>
        {action && (
          <button
            onClick={action.onClick}
            className={cn(
              'mt-2 text-sm font-medium underline-offset-2 hover:underline',
              config.textColor
            )}
          >
            {action.label}
          </button>
        )}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className={cn('flex-shrink-0 rounded p-1 hover:bg-black/5', config.textColor)}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// ============================================================================
// Slide Over Panel
// ============================================================================

interface SlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  position?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const slideOverSizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export function SlideOver({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  position = 'right',
  size = 'md',
}: SlideOverProps): React.ReactElement | null {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          'relative ml-auto flex h-full w-full flex-col bg-white shadow-xl dark:bg-secondary-900',
          slideOverSizes[size],
          position === 'right' ? 'animate-slide-in' : 'mr-auto ml-0'
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b p-4 dark:border-secondary-700">
          <div>
            {title && (
              <h2 className="text-lg font-semibold text-secondary-900 dark:text-white">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1 text-sm text-secondary-500">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-secondary-400 hover:bg-secondary-100 hover:text-secondary-500 dark:hover:bg-secondary-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 border-t p-4 dark:border-secondary-700">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
