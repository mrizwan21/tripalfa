import * as React from 'react';

export interface ModalProps extends React.DialogHTMLAttributes<HTMLDialogElement> {
  width?: string;
  height?: string;
}

export const Modal = React.forwardRef<HTMLDialogElement, ModalProps>(
  ({ width, height, className = '', children, ...props }, ref) => {
    const classes = ['modal'];
    if (className) classes.push(className);

    const dialogRef = React.useRef<HTMLDialogElement>(null);
    const mergedRef = React.useMemo(() => {
      if (typeof ref === 'function')
        return (node: HTMLDialogElement | null) => {
          dialogRef.current = node;
          ref(node);
        };
      if (ref) return ref;
      return dialogRef;
    }, [ref]);

    React.useEffect(() => {
      const dialog = dialogRef.current;
      if (dialog) {
        if (width) dialog.style.setProperty('--_op-modal-width', width);
        if (height) dialog.style.setProperty('--_op-modal-height', height);
      }
    }, [width, height]);

    return (
      <dialog ref={mergedRef} className={classes.join(' ')} {...props}>
        {children}
      </dialog>
    );
  }
);
Modal.displayName = 'Modal';

export interface ModalHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export const ModalHeader = React.forwardRef<HTMLDivElement, ModalHeaderProps>(
  ({ className = '', children, ...props }, ref) => (
    <div ref={ref} className={`modal__header${className ? ` ${className}` : ''}`} {...props}>
      {children}
    </div>
  )
);
ModalHeader.displayName = 'ModalHeader';

export interface ModalBodyProps extends React.HTMLAttributes<HTMLDivElement> {}

export const ModalBody = React.forwardRef<HTMLDivElement, ModalBodyProps>(
  ({ className = '', children, ...props }, ref) => (
    <div ref={ref} className={`modal__body${className ? ` ${className}` : ''}`} {...props}>
      {children}
    </div>
  )
);
ModalBody.displayName = 'ModalBody';

export interface ModalFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export const ModalFooter = React.forwardRef<HTMLDivElement, ModalFooterProps>(
  ({ className = '', children, ...props }, ref) => (
    <div ref={ref} className={`modal__footer${className ? ` ${className}` : ''}`} {...props}>
      {children}
    </div>
  )
);
ModalFooter.displayName = 'ModalFooter';
