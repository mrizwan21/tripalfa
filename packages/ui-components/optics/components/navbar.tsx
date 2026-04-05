import * as React from 'react';

export interface NavbarProps extends React.HTMLAttributes<HTMLElement> {}

export const Navbar = React.forwardRef<HTMLElement, NavbarProps>(
  ({ className = '', children, ...props }, ref) => {
    const classes = ['navbar'];
    if (className) classes.push(className);

    return (
      <nav ref={ref} className={classes.join(' ')} {...props}>
        {children}
      </nav>
    );
  }
);
Navbar.displayName = 'Navbar';

export interface NavbarBrandProps extends React.HTMLAttributes<HTMLDivElement> {}

export const NavbarBrand = React.forwardRef<HTMLDivElement, NavbarBrandProps>(
  ({ className = '', children, ...props }, ref) => (
    <div ref={ref} className={`navbar__brand${className ? ` ${className}` : ''}`} {...props}>
      {children}
    </div>
  )
);
NavbarBrand.displayName = 'NavbarBrand';

export interface NavbarNavProps extends React.HTMLAttributes<HTMLUListElement> {}

export const NavbarNav = React.forwardRef<HTMLUListElement, NavbarNavProps>(
  ({ className = '', children, ...props }, ref) => (
    <ul ref={ref} className={`navbar__nav${className ? ` ${className}` : ''}`} {...props}>
      {children}
    </ul>
  )
);
NavbarNav.displayName = 'NavbarNav';
