import * as React from 'react';

export interface ConfirmDialogProps extends React.DialogHTMLAttributes<HTMLDialogElement> {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  variant?: 'default' | 'danger';
}

export const ConfirmDialog = React.forwardRef<HTMLDialogElement, ConfirmDialogProps>(
  (
    {
      title,
      message,
      confirmLabel = 'Confirm',
      cancelLabel = 'Cancel',
      onConfirm,
      onCancel,
      variant = 'default',
      className = '',
      ...props
    },
    ref
  ) => {
    const classes = ['confirm-dialog'];
    if (className) classes.push(className);

    return (
      <dialog ref={ref} className={classes.join(' ')} {...props}>
        <div className="confirm-dialog__content">
          <h3 className="confirm-dialog__title">{title}</h3>
          <p className="confirm-dialog__message">{message}</p>
          <div className="confirm-dialog__actions">
            <button className="btn" onClick={onCancel}>
              {cancelLabel}
            </button>
            <button
              className={`btn${variant === 'danger' ? ' btn--destructive' : ' btn--primary'}`}
              onClick={onConfirm}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </dialog>
    );
  }
);
ConfirmDialog.displayName = 'ConfirmDialog';
