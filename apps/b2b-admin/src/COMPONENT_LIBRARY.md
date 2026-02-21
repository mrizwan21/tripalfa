# Modern Component Library - Implementation Guide

## Overview
This document provides comprehensive guidance for implementing components using the modern design system defined in `MODERN_UI_GUIDE.md`.

## Component Architecture

### Directory Structure
```
src/components/
├── ui/                          # Reusable UI components
│   ├── buttons/
│   │   ├── Button.tsx
│   │   ├── Button.styles.ts
│   │   └── types.ts
│   ├── cards/
│   │   ├── Card.tsx
│   │   ├── MetricCard.tsx
│   │   └── types.ts
│   ├── badges/
│   │   ├── Badge.tsx
│   │   ├── StatusBadge.tsx
│   │   └── types.ts
│   ├── inputs/
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   └── SearchInput.tsx
│   ├── modals/
│   │   ├── Modal.tsx
│   │   ├── ConfirmDialog.tsx
│   │   └── types.ts
│   ├── tables/
│   │   ├── Table.tsx
│   │   ├── DataTable.tsx
│   │   └── types.ts
│   └── icons/
│       └── IconFactory.tsx
│
├── dashboard/                   # Dashboard-specific components
│   ├── AnalyticsDashboard.tsx
│   ├── DashboardLayout.tsx
│   ├── MetricsGrid.tsx
│   ├── charts/
│   │   ├── LineChart.tsx
│   │   ├── BarChart.tsx
│   │   ├── PieChart.tsx
│   │   └── ChartContainer.tsx
│   └── sections/
│       ├── HeaderSection.tsx
│       ├── SidebarNavigation.tsx
│       └── StatsSection.tsx
│
├── rules-engine/                # Rules Engine components
│   ├── RulesManager.tsx
│   ├── RulesList.tsx
│   ├── RuleDetail.tsx
│   ├── RuleForm.tsx
│   ├── RuleTypeFilter.tsx
│   └── RuleBatchActions.tsx
│
├── monitoring/                  # Monitoring components
│   ├── APIStatusMonitor.tsx
│   ├── EndpointStatusCard.tsx
│   ├── HealthIndicator.tsx
│   ├── PerformanceMetrics.tsx
│   └── AlertsList.tsx
│
└── common/                      # Shared layout components
    ├── Header.tsx
    ├── Sidebar.tsx
    ├── Footer.tsx
    ├── ThemeToggle.tsx
    └── Navigation.tsx
```

---

## Design Patterns

### 1. **Button Component Pattern**

```typescript
// types.ts
export interface ButtonProps {
  /**
   * Button variant - determines the visual style
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  
  /**
   * Button size - controls padding and font size
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Full width button
   * @default false
   */
  fullWidth?: boolean;
  
  /**
   * Loading state
   * @default false
   */
  isLoading?: boolean;
  
  /**
   * Disabled state
   * @default false
   */
  disabled?: boolean;
  
  /**
   * Icon to display before label
   */
  iconBefore?: React.ReactNode;
  
  /**
   * Icon to display after label
   */
  iconAfter?: React.ReactNode;
  
  /**
   * Click handler
   */
  onClick?: () => void;
  
  /**
   * Button content
   */
  children: React.ReactNode;
}

// Button.tsx
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  disabled = false,
  iconBefore,
  iconAfter,
  onClick,
  children,
  ...props
}) => {
  const baseClasses = 'font-semibold transition-smooth focus:outline-none focus:ring-2';
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg hover:shadow-purple-500/20 hover:translate-y-[-2px] focus:ring-blue-400',
    secondary: 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600 focus:ring-slate-400',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-900 focus:ring-blue-400',
    ghost: 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:ring-slate-400',
    danger: 'bg-red-600 text-white hover:bg-red-700 hover:shadow-lg hover:shadow-red-500/20 focus:ring-red-400',
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  return (
    <button
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        inline-flex items-center justify-center gap-2
        rounded-lg
      `}
      disabled={disabled || isLoading}
      onClick={onClick}
      {...props}
    >
      {isLoading && <Spinner className="w-4 h-4" />}
      {!isLoading && iconBefore && iconBefore}
      {children}
      {!isLoading && iconAfter && iconAfter}
    </button>
  );
};
```

### 2. **Card Component Pattern**

```typescript
// types.ts
export interface CardProps {
  variant?: 'default' | 'gradient' | 'glass';
  interactive?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

// Card.tsx
export const Card: React.FC<CardProps> = ({
  variant = 'default',
  interactive = false,
  onClick,
  children,
  className = '',
}) => {
  const variantClasses = {
    default: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700',
    gradient: 'bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-200 dark:border-blue-900',
    glass: 'glass dark:glass-dark border border-white/20 dark:border-slate-700/50',
  };
  
  return (
    <div
      className={`
        rounded-xl p-6
        ${variantClasses[variant]}
        ${interactive ? 'cursor-pointer hover:shadow-lg hover:translate-y-[-2px] transition-smooth' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
```

### 3. **Status Badge Pattern**

```typescript
// types.ts
export interface StatusBadgeProps {
  status: 'success' | 'warning' | 'error' | 'pending' | 'info';
  label: string;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

// StatusBadge.tsx
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  icon,
  size = 'md',
}) => {
  const statusClasses = {
    success: 'bg-green-500/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900',
    warning: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-900',
    error: 'bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900',
    pending: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900',
    info: 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-900',
  };
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };
  
  return (
    <span className={`
      inline-flex items-center gap-1.5
      rounded-full
      font-semibold
      transition-smooth
      ${statusClasses[status]}
      ${sizeClasses[size]}
    `}>
      {icon && <span>{icon}</span>}
      {label}
    </span>
  );
};
```

### 4. **Metric Card Pattern**

```typescript
// types.ts
export interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
  unit?: string;
  color?: 'blue' | 'purple' | 'green' | 'red' | 'yellow';
}

// MetricCard.tsx
export const MetricCard: React.FC<MetricCardProps> = ({
  icon,
  title,
  value,
  change,
  unit,
  color = 'blue',
}) => {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    green: 'bg-green-500/10 text-green-600 dark:text-green-400',
    red: 'bg-red-500/10 text-red-600 dark:text-red-400',
    yellow: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  };
  
  return (
    <Card variant="gradient">
      <div className="flex items-start justify-between mb-4 group">
        <div className={`
          w-12 h-12 rounded-lg flex items-center justify-center
          ${colorClasses[color]}
          group-hover:scale-110 transition-transform
        `}>
          {icon}
        </div>
        {change && (
          <div className={`
            text-sm font-semibold
            ${change.type === 'increase' ? 'text-green-600' : 'text-red-600'}
          `}>
            {change.type === 'increase' ? '↑' : '↓'} {change.value}%
          </div>
        )}
      </div>
      
      <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
        {title}
      </h3>
      
      <div className="flex items-baseline gap-2">
        <p className="text-3xl font-bold text-slate-900 dark:text-white">
          {value}
        </p>
        {unit && (
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {unit}
          </span>
        )}
      </div>
    </Card>
  );
};
```

---

## Implementation Guidelines

### Color Usage
- **Primary**: Action buttons, primary links, active states
- **Secondary**: Accents, secondary actions, highlights
- **Success**: Positive indicators, completed actions
- **Warning**: Caution indicators, pending states
- **Error**: Error states, destructive actions

### Spacing
- Use consistent spacing from the scale: `0.25rem`, `0.5rem`, `1rem`, `1.5rem`, `2rem`, etc.
- Apply padding/margin in multiples for visual rhythm

### Typography Hierarchy
- **h1**: Page titles
- **h2**: Section titles
- **h3**: Subsection titles
- **p**: Body text
- **small**: Helper text, labels

### Animations
- Use `transition-smooth` for standard interactions (300ms)
- Use `transition-smooth-fast` for quick feedback (150ms)
- Avoid excessive animations on frequently rendered elements

### Accessibility
- Always include focus rings on interactive elements
- Use semantic HTML
- Maintain sufficient color contrast
- Include ARIA labels where needed

### Responsive Design
- Mobile-first approach
- Default styles for mobile
- Use Tailwind breakpoints: `sm`, `md`, `lg`, `xl`, `2xl`

---

## Component Usage Examples

### Button Examples
```typescript
// Primary button with icon
<Button
  variant="primary"
  size="md"
  iconBefore={<PlusIcon />}
>
  Create New Rule
</Button>

// Loading button
<Button isLoading variant="primary">
  Saving...
</Button>

// Outline button
<Button variant="outline" onClick={handleCancel}>
  Cancel
</Button>
```

### Card Examples
```typescript
// Default card
<Card>
  <h3>Card Title</h3>
  <p>Card content goes here</p>
</Card>

// Interactive card
<Card interactive onClick={handleClick}>
  <MetricCard
    icon={<TrendingUpIcon />}
    title="Total Revenue"
    value="$45,231"
    change={{ value: 12.5, type: 'increase' }}
    color="green"
  />
</Card>
```

### Badge Examples
```typescript
// Status badge
<StatusBadge
  status="success"
  label="Active"
  icon={<CheckCircleIcon className="w-3 h-3" />}
/>

// Warning badge
<StatusBadge
  status="warning"
  label="Pending"
  icon={<AlertIcon className="w-3 h-3" />}
/>
```

---

## Performance Considerations

1. **Memoization**: Wrap components in `React.memo()` if they receive stable props
2. **Lazy Loading**: Use `React.lazy()` for large components
3. **Code Splitting**: Keep component files focused and small
4. **CSS-in-JS**: Minimize runtime style calculations

---

## Testing Recommendations

1. **Unit Tests**: Test component props and state changes
2. **Visual Tests**: Use tools like Chromatic for design consistency
3. **Accessibility Tests**: Use axe or similar tools
4. **Integration Tests**: Test component interactions

---

## Documentation Requirements

Each component should include:
- Clear PropTypes/TypeScript types
- Usage examples
- Variant demonstrations
- Accessibility notes
- Performance considerations

---

**Status**: ✅ Architecture Ready  
**Components**: 15+ Implemented  
**Testing**: Full Coverage  
**Documentation**: Complete
