import * as React from 'react';

export interface ContentHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const ContentHeader = React.forwardRef<HTMLDivElement, ContentHeaderProps>(
  ({ title, subtitle, actions, className = '', ...props }, ref) => {
    const classes = ['content-header'];
    if (className) classes.push(className);

    return (
      <div ref={ref} className={classes.join(' ')} {...props}>
        <div className="content-header__text">
          <h2 className="content-header__title">{title}</h2>
          {subtitle && <p className="content-header__subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="content-header__actions">{actions}</div>}
      </div>
    );
  }
);
ContentHeader.displayName = 'ContentHeader';
