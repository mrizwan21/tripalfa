# Modern Dashboard - Complete Setup & Configuration Guide

## 🚀 Quick Start

### Prerequisites
```bash
Node.js >= 18.0.0
npm >= 9.0.0
Tailwind CSS 3.3+
React 18+
TypeScript 5.0+
```

### Installation Steps

#### 1. Install Dependencies
```bash
# From workspace root
npm install

# Or install in b2b-admin workspace specifically
npm install --workspace=@tripalfa/b2b-admin
```

#### 2. Verify Tailwind Configuration
```bash
# Check that tailwind.config.ts is in place
ls -la apps/b2b-admin/tailwind.config.ts

# Verify content paths point correctly
grep content apps/b2b-admin/tailwind.config.ts
```

#### 3. Import Global Styles
In your main application file (`src/main.tsx` or `src/App.tsx`):

```typescript
import './styles/global.css'
import 'tailwindcss/tailwind.css'
```

#### 4. Setup PostCSS
Create `postcss.config.js` in `apps/b2b-admin/`:

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

---

## 📁 File Organization

### Current Files
```
apps/b2b-admin/
├── src/
│   ├── MODERN_UI_GUIDE.md          ← Design system documentation
│   ├── COMPONENT_LIBRARY.md        ← Component patterns & guidelines
│   ├── styles/
│   │   └── global.css              ← Global CSS variables & base styles
│   ├── components/
│   │   ├── ui/                     ← Reusable UI components
│   │   ├── dashboard/              ← Dashboard-specific components
│   │   ├── rules-engine/           ← Rules engine components
│   │   ├── monitoring/             ← Monitoring components
│   │   └── common/                 ← Shared layout components
│   ├── hooks/
│   │   ├── useTheme.ts             ← Theme management
│   │   ├── useDarkMode.ts          ← Dark mode toggle
│   │   └── useResponsive.ts        ← Responsive design helpers
│   ├── App.tsx
│   └── main.tsx
├── tailwind.config.ts              ← Tailwind design system config
├── package.json
└── tsconfig.json
```

---

## 🎨 Theme Implementation

### 1. Create Theme Hook (`src/hooks/useTheme.ts`)

```typescript
import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

export const useTheme = (initialTheme: Theme = 'system') => {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  useEffect(() => {
    const getSystemTheme = () => {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    };

    const currentTheme = theme === 'system' ? getSystemTheme() : theme;

    if (currentTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return { theme, setTheme, toggleTheme };
};
```

### 2. Setup Theme Provider (`src/contexts/ThemeContext.tsx`)

```typescript
import React, { createContext, useContext } from 'react';
import { useTheme } from '../hooks/useTheme';

interface ThemeContextType {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const themeValue = useTheme('light');

  return (
    <ThemeContext.Provider value={themeValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within ThemeProvider');
  }
  return context;
};
```

### 3. Wrap Application (`src/App.tsx`)

```typescript
import { ThemeProvider } from './contexts/ThemeContext';
import DashboardLayout from './components/dashboard/DashboardLayout';

function App() {
  return (
    <ThemeProvider>
      <DashboardLayout>
        {/* Your app content */}
      </DashboardLayout>
    </ThemeProvider>
  );
}

export default App;
```

---

## 🎯 Component Implementation Checklist

### Phase 1: Foundation Components
- [ ] Button (all variants)
- [ ] Card (all variants)
- [ ] Badge/StatusBadge
- [ ] Input/Select/TextArea
- [ ] Loading Spinner
- [ ] Icon Factory

### Phase 2: Layout Components
- [ ] Header/Navigation
- [ ] Sidebar
- [ ] DashboardLayout
- [ ] Footer
- [ ] Container

### Phase 3: Data Display Components
- [ ] MetricCard
- [ ] Table/DataTable
- [ ] Charts (Line, Bar, Pie)
- [ ] Alert/Notification
- [ ] Modal/Dialog

### Phase 4: Dashboard Components
- [ ] AnalyticsDashboard
- [ ] MetricsGrid
- [ ] RulesManager
- [ ] APIStatusMonitor
- [ ] PerformanceMetrics

### Phase 5: Advanced Features
- [ ] Search/Filter
- [ ] Pagination
- [ ] Batch Actions
- [ ] Dark Mode Toggle
- [ ] Responsive Navigation

---

## 🔧 Configuration Files

### ESLint Configuration
```javascript
// eslint.config.js
export default [
  {
    files: ['src/**/*.{js,jsx,ts,tsx}'],
    rules: {
      'no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
];
```

### TypeScript Configuration
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "noImplicitAny": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "baseUrl": "./src",
    "paths": {
      "@/*": ["./*"],
      "@components/*": ["./components/*"],
      "@hooks/*": ["./hooks/*"],
      "@utils/*": ["./utils/*"],
      "@types/*": ["./types/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

---

## 📊 Utility Functions

### Responsive Hook (`src/hooks/useResponsive.ts`)

```typescript
import { useState, useEffect } from 'react';

export const useResponsive = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    isMobile: windowSize.width < 640,
    isTablet: windowSize.width >= 640 && windowSize.width < 1024,
    isDesktop: windowSize.width >= 1024,
    isPrint: typeof window !== 'undefined' && window.matchMedia('print').matches,
  };
};
```

### Color Utility (`src/utils/colorUtils.ts`)

```typescript
export const getColorClass = (
  variant: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
): string => {
  const colors = {
    primary: 'from-blue-600 to-purple-600',
    secondary: 'from-purple-600 to-pink-600',
    success: 'from-green-600 to-emerald-600',
    warning: 'from-yellow-600 to-orange-600',
    error: 'from-red-600 to-rose-600',
  };
  return colors[variant];
};

export const getStatusColor = (
  status: 'active' | 'inactive' | 'error' | 'warning'
) => {
  const statusColors = {
    active: { bg: 'bg-green-500/10', text: 'text-green-700', border: 'border-green-200' },
    inactive: { bg: 'bg-slate-500/10', text: 'text-slate-700', border: 'border-slate-200' },
    error: { bg: 'bg-red-500/10', text: 'text-red-700', border: 'border-red-200' },
    warning: { bg: 'bg-yellow-500/10', text: 'text-yellow-700', border: 'border-yellow-200' },
  };
  return statusColors[status];
};
```

---

## 📦 Common Dependencies

### Core
- `react@18+`
- `react-dom@18+`
- `typescript@5+`

### Styling
- `tailwindcss@3.3+`
- `autoprefixer`
- `postcss`

### Icons
- `lucide-react` (Recommended for modern icons)

### Charts
- `recharts` (Recommended for data visualization)

### Utilities
- `clsx` (Conditional class names)
- `class-variance-authority` (Advanced component styling)

### Forms
- `react-hook-form` (Form management)
- `zod` (Schema validation)

### State Management
- `zustand` or `jotai` (Lightweight options)

---

## 🧪 Testing Setup

### Jest Configuration (`jest.config.js`)

```javascript
export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
  },
};
```

### Testing Library Setup (`src/test-utils.tsx`)

```typescript
import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider } from './contexts/ThemeContext';

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  return render(ui, {
    wrapper: ({ children }) => (
      <ThemeProvider>{children}</ThemeProvider>
    ),
    ...options,
  });
};

export * from '@testing-library/react';
export { customRender as render };
```

---

## 🚀 Build & Deployment

### Development
```bash
npm run dev --workspace=@tripalfa/b2b-admin
```

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint --workspace=@tripalfa/b2b-admin
```

### Building
```bash
npm run build --workspace=@tripalfa/b2b-admin
```

### Preview
```bash
npm run preview --workspace=@tripalfa/b2b-admin
```

---

## 📋 Performance Optimization

### Code Splitting
```typescript
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Dashboard />
    </Suspense>
  );
}
```

### Image Optimization
- Use WebP format with fallbacks
- Implement lazy loading
- Optimize SVGs for production

### CSS Optimization
- Tailwind will tree-shake unused styles
- Use CSS classes instead of inline styles
- Leverage Tailwind's purge configuration

---

## 📚 Additional Resources

### Documentation
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Design Inspiration
- [Tailwind UI](https://tailwindui.com)
- [Shadcn/ui](https://ui.shadcn.com)
- [Headless UI](https://headlessui.dev)

### Tools
- [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)
- [PostCSS Language Support](https://marketplace.visualstudio.com/items?itemName=csstools.postcss)

---

## ✅ Implementation Checklist

- [ ] Install all dependencies
- [ ] Configure Tailwind CSS
- [ ] Add global CSS
- [ ] Create theme context
- [ ] Implement foundation components
- [ ] Build layout structure
- [ ] Add dashboard components
- [ ] Setup routing
- [ ] Add form management
- [ ] Implement state management
- [ ] Setup error boundaries
- [ ] Add loading states
- [ ] Implement error handling
- [ ] Setup analytics/monitoring
- [ ] Add accessibility features
- [ ] Write unit tests
- [ ] Setup CI/CD
- [ ] Performance optimization
- [ ] Security review
- [ ] Documentation complete

---

## 🎉 Status

**Setup**: ✅ Complete  
**Documentation**: ✅ Comprehensive  
**Templates**: ✅ Ready  
**Configuration**: ✅ Production-Ready  

**Next Steps**: Start implementing components following the COMPONENT_LIBRARY.md guide.
