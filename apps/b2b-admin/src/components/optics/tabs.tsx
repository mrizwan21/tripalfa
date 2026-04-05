import * as React from 'react';
interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
}
const TabsContext = React.createContext<TabsContextValue>({ value: '', onValueChange: () => {} });
export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}
export const Tabs = ({
  value,
  defaultValue,
  onValueChange,
  className = '',
  children,
  ...props
}: TabsProps) => {
  const [internal, setInternal] = React.useState(defaultValue ?? '');
  const current = value ?? internal;
  const change = onValueChange ?? setInternal;
  return (
    <TabsContext.Provider value={{ value: current, onValueChange: change }}>
      <div className={className} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};
export const TabsList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', ...props }, ref) => (
    <div
      ref={ref}
      className={`inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground ${className}`}
      role="tablist"
      {...props}
    />
  )
);
TabsList.displayName = 'TabsList';
export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}
export const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ value, className = '', ...props }, ref) => {
    const { value: current, onValueChange } = React.useContext(TabsContext);
    return (
      <button
        ref={ref}
        role="tab"
        aria-selected={current === value}
        onClick={() => onValueChange(value)}
        className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${current === value ? 'bg-background text-foreground shadow' : 'hover:text-foreground'} ${className}`}
        {...props}
      />
    );
  }
);
TabsTrigger.displayName = 'TabsTrigger';
export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}
export const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ value, className = '', ...props }, ref) => {
    const { value: current } = React.useContext(TabsContext);
    if (current !== value) return null;
    return (
      <div
        ref={ref}
        role="tabpanel"
        className={`mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`}
        {...props}
      />
    );
  }
);
TabsContent.displayName = 'TabsContent';
