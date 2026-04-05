import * as React from 'react';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  size?: 'small' | 'medium' | 'large';
  initials?: string;
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ src, alt, size, initials, className = '', ...props }, ref) => {
    const classes = ['avatar'];
    if (size) classes.push(`avatar--${size}`);
    if (className) classes.push(className);

    return (
      <div ref={ref} className={classes.join(' ')} {...props}>
        {src ? (
          <img className="avatar__image" src={src} alt={alt || ''} />
        ) : (
          <span className="avatar__initials">{initials || '?'}</span>
        )}
      </div>
    );
  }
);
Avatar.displayName = 'Avatar';
