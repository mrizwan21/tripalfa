import * as React from 'react';

export interface BreadcrumbsProps extends React.HTMLAttributes<HTMLElement> {
  items: Array<{ label: string; href?: string }>;
}

export const Breadcrumbs = React.forwardRef<HTMLElement, BreadcrumbsProps>(
  ({ items, className = '', ...props }, ref) => {
    const classes = ['breadcrumbs'];
    if (className) classes.push(className);

    return (
      <nav ref={ref} className={classes.join(' ')} aria-label="Breadcrumb" {...props}>
        <ol className="breadcrumbs__list">
          {items.map((item, index) => (
            <li key={index} className="breadcrumbs__item">
              {item.href ? (
                <a className="breadcrumbs__link" href={item.href}>
                  {item.label}
                </a>
              ) : (
                <span className="breadcrumbs__current">{item.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    );
  }
);
Breadcrumbs.displayName = 'Breadcrumbs';
