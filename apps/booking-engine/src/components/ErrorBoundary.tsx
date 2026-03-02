import React, { ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);

    // Log to error tracking service in production
    if (process.env.NODE_ENV === "production") {
      // TODO: Send to error tracking service
    }
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }

      return (
        <Card className="m-6 p-8 border-2 border-red-200 bg-red-50">
          <div className="flex gap-4">
            <div className="flex-shrink-0 gap-4">
              <AlertTriangle className="h-12 w-12 text-red-600" />
            </div>
            <div className="flex-1 gap-4">
              <h2 className="text-xl font-bold text-red-900 mb-2 text-2xl font-semibold tracking-tight">
                Something went wrong
              </h2>
              <p className="text-red-700 mb-4">
                {this.state.error.message || "An unexpected error occurred"}
              </p>
              <details className="mb-4 text-sm text-red-700">
                <summary className="cursor-pointer font-bold mb-2">
                  Error details
                </summary>
                <pre className="mt-2 overflow-auto bg-red-100 p-3 rounded text-xs">
                  {this.state.error.stack}
                </pre>
              </details>
              <Button
                onClick={this.reset}
                className="hover: text-white rounded-lg"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}
