import * as React from 'react';
export interface MenubarProps extends React.HTMLAttributes<HTMLDivElement> {}
export const Menubar = React.forwardRef<HTMLDivElement, MenubarProps>(
  ({ className = '', ...props }, ref) => (
    <div
      ref={ref}
      className={`flex h-9 items-center space-x-1 rounded-md border bg-background p-1 shadow-sm ${className}`}
      {...props}
    />
  )
);
Menubar.displayName = 'Menubar';
export const MenubarItem = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className = '', ...props }, ref) => (
  <button
    ref={ref}
    className={`px-2 py-1 text-sm rounded-sm hover:bg-accent ${className}`}
    {...props}
  />
));
MenubarItem.displayName = 'MenubarItem';
