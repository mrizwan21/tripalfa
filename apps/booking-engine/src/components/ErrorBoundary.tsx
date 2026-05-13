import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Home, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const is404 = this.state.error?.message?.includes('404') || 
                    this.state.error?.message?.toLowerCase().includes('not found');

      if (is404) {
        return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50/50 px-4">
            <div className="text-center space-y-6 max-w-lg">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-[#003b95] to-[#002a6e] flex items-center justify-center shadow-lg">
                <AlertTriangle size={40} className="text-white" />
              </div>
              <div className="space-y-2">
                <h1 className="text-8xl font-black text-[#003b95] tracking-tighter leading-none">
                  404
                </h1>
                <p className="text-2xl font-bold text-[#1d1d1f]">Page Not Found</p>
              </div>
              <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
                Sorry, we couldn't find the page you're looking for. It might have been moved, removed, or never existed.
              </p>
              <div className="w-16 h-1 bg-gradient-to-r from-[#003b95] to-[#002a6e] rounded-full mx-auto" />
              <a
                href="/"
                className="inline-flex items-center gap-2 bg-[#003b95] text-white rounded-lg px-8 py-3 font-semibold text-sm shadow-md hover:bg-[#002a6e] transition-all duration-200 hover:scale-[1.02]"
              >
                <Home size={18} />
                Back to Home
              </a>
            </div>
          </div>
        );
      }

      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-red-50/50 px-4">
          <div className="text-center space-y-6 max-w-lg">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg">
              <AlertTriangle size={40} className="text-white" />
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-gray-900">Something went wrong</h1>
              <p className="text-lg text-gray-600">An unexpected error occurred</p>
            </div>
            <div className="bg-white rounded-lg p-4 text-left shadow-sm border border-gray-200">
              <p className="text-sm font-mono text-red-600 break-words">
                {this.state.error?.message || 'Unknown error'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={this.handleReset}
                className="inline-flex items-center gap-2 bg-gray-900 text-white rounded-lg px-6 py-3 font-semibold text-sm shadow-md hover:bg-gray-800 transition-all duration-200"
              >
                Try Again
              </button>
              <a
                href="/"
                className="inline-flex items-center gap-2 bg-[#003b95] text-white rounded-lg px-6 py-3 font-semibold text-sm shadow-md hover:bg-[#002a6e] transition-all duration-200"
              >
                <Home size={18} />
                Back to Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
