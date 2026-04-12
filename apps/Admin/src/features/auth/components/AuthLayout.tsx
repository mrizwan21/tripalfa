import { ReactNode } from 'react';
import * as Icons from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@tripalfa/ui-components/ui/card';

const { Shield, Activity } = Icons as any;

type AuthLayoutProps = {
  children: ReactNode;
};

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 gap-4">
      {children}
    </div>
  );
}

export function AuthLogo({
  title = 'TripAlfa B2B',
  subtitle = 'Admin Portal',
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-8 flex flex-col items-center gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-foreground text-background shadow-lg mb-4 gap-4">
        <Activity className="h-6 w-6" />
      </div>
      <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
      <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
    </div>
  );
}

export function AuthCardHeader({
  title,
  description,
  icon = Shield,
}: {
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const Icon = icon;
  return (
    <CardHeader className="space-y-0 gap-2 pb-6">
      <div className="flex items-center justify-center mb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>
      <CardTitle className="text-xl font-semibold text-foreground text-center">{title}</CardTitle>
      <CardDescription className="text-sm text-muted-foreground text-center">
        {description}
      </CardDescription>
    </CardHeader>
  );
}

export const AuthCard = {
  Header: ({ children }: { children: ReactNode }) => (
    <div className="space-y-0 gap-2 mb-2">{children}</div>
  ),
  Content: ({
    children,
    className = 'space-y-4 p-6',
  }: {
    children: ReactNode;
    className?: string;
  }) => <div className={className}>{children}</div>,
  Footer: ({
    children,
    className = 'flex flex-col gap-4 pt-2',
  }: {
    children: ReactNode;
    className?: string;
  }) => <div className={className}>{children}</div>,
};

export function AuthFormCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Card className="w-full max-w-md border-border shadow-elevated">
      <AuthCardHeader title={title} description={description} />
      <CardContent className="space-y-4 p-6">{children}</CardContent>
      {footer && <CardFooter className="flex flex-col gap-4 pt-2">{footer}</CardFooter>}
    </Card>
  );
}

export function AuthFooter() {
  return (
    <p className="mt-8 text-xs text-muted-foreground text-center">
      © 2024 TripAlfa. All rights reserved.
    </p>
  );
}
