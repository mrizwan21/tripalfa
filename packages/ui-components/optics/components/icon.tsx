import * as React from 'react';
import type { LucideIcon } from 'lucide-react';

export interface IconProps extends React.HTMLAttributes<HTMLElement> {
  name?: string;
  size?: 'small' | 'medium' | 'large' | number;
  as?: React.ElementType;
  icon?: React.ComponentType<any>;
  animated?: boolean;
}

export const Icon = React.forwardRef<HTMLElement, IconProps>(
  (
    {
      name,
      size,
      as: Comp = 'span',
      icon: IconComponent,
      animated = true,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const classes = ['op-icon'];
    if (typeof size === 'string') {
      classes.push(`op-icon--${size}`);
    }
    if (className) classes.push(className);

    const style =
      typeof size === 'number' ? { ...props.style, '--icon-size': `${size}px` } : props.style;

    return (
      <Comp ref={ref} className={classes.join(' ')} style={style} {...props}>
        {children ||
          (IconComponent && <IconComponent size={typeof size === 'number' ? size : undefined} />) ||
          (name && <i className="material-symbols-outlined">{name}</i>)}
      </Comp>
    );
  }
);
Icon.displayName = 'Icon';
