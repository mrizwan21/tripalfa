import * as React from 'react';

export interface FlexProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'row' | 'col';
  wrap?: boolean;
  gap?: 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  align?: 'stretch' | 'start' | 'center' | 'end' | 'baseline';
  grow?: boolean;
  as?: React.ElementType;
}

export const Flex = React.forwardRef<HTMLDivElement, FlexProps>(
  (
    {
      direction = 'row',
      wrap = false,
      gap,
      justify,
      align,
      grow = false,
      as: Comp = 'div',
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const classes = ['flex'];
    if (direction === 'col') classes.push('flex-col');
    if (wrap) classes.push('flex-wrap');
    if (gap) classes.push(`gap-${gap}`);
    if (justify) classes.push(`justify-${justify}`);
    if (align) classes.push(`items-${align}`);
    if (grow) classes.push('flex-grow-1');
    if (className) classes.push(className);

    return (
      <Comp ref={ref} className={classes.join(' ')} {...props}>
        {children}
      </Comp>
    );
  }
);
Flex.displayName = 'Flex';
