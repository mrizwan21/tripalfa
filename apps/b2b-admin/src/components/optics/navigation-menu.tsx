import * as React from 'react';
export interface NavigationMenuProps extends React.HTMLAttributes<HTMLElement> {}
export const NavigationMenu = React.forwardRef<HTMLElement, NavigationMenuProps>(
  ({ className = '', ...props }, ref) => (
    <nav
      ref={ref}
      className={`relative z-10 flex max-w-max flex-1 items-center justify-center ${className}`}
      {...props}
    />
  )
);
NavigationMenu.displayName = 'NavigationMenu';
export const NavigationMenuList = React.forwardRef<
  HTMLUListElement,
  React.HTMLAttributes<HTMLUListElement>
>(({ className = '', ...props }, ref) => (
  <ul
    ref={ref}
    className={`group flex flex-1 list-none items-center justify-center space-x-1 ${className}`}
    {...props}
  />
));
NavigationMenuList.displayName = 'NavigationMenuList';
export const NavigationMenuItem = React.forwardRef<
  HTMLLIElement,
  React.LiHTMLAttributes<HTMLLIElement>
>((props, ref) => <li ref={ref} {...props} />);
NavigationMenuItem.displayName = 'NavigationMenuItem';
export const NavigationMenuLink = React.forwardRef<
  HTMLAnchorElement,
  React.AnchorHTMLAttributes<HTMLAnchorElement>
>(({ className = '', ...props }, ref) => (
  <a
    ref={ref}
    className={`group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground ${className}`}
    {...props}
  />
));
NavigationMenuLink.displayName = 'NavigationMenuLink';
