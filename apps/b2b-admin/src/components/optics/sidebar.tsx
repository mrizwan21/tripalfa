import * as React from 'react';
export interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
  collapsed?: boolean;
}
export const Sidebar = React.forwardRef<HTMLElement, SidebarProps>(
  ({ collapsed, className = '', ...props }, ref) => (
    <aside
      ref={ref}
      className={`flex h-full flex-col border-r bg-background ${collapsed ? 'w-16' : 'w-64'} ${className}`}
      {...props}
    />
  )
);
Sidebar.displayName = 'Sidebar';
export const SidebarHeader = ({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`border-b p-4 ${className}`} {...props} />
);
export const SidebarContent = ({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`flex-1 overflow-y-auto p-4 ${className}`} {...props} />
);
export const SidebarFooter = ({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`border-t p-4 ${className}`} {...props} />
);
export const SidebarGroup = ({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => <div className={`space-y-2 ${className}`} {...props} />;
export const SidebarGroupLabel = ({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`text-xs font-medium text-muted-foreground ${className}`} {...props} />
);
export const SidebarMenu = ({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLUListElement>) => (
  <ul className={`space-y-1 ${className}`} {...props} />
);
export const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.LiHTMLAttributes<HTMLLIElement>
>((props, ref) => <li ref={ref} {...props} />);
export const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className = '', ...props }, ref) => (
  <button
    ref={ref}
    className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground ${className}`}
    {...props}
  />
));
