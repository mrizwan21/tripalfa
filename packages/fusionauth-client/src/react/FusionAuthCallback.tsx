/**
 * FusionAuth Callback Component
 * Handles OAuth callback from FusionAuth
 */

import React, { useEffect, useState } from 'react';
import { useFusionAuth } from './FusionAuthContext.js';

interface FusionAuthCallbackProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  loadingComponent?: React.ReactNode;
  errorComponent?: (error: string) => React.ReactNode;
}

export function FusionAuthCallback({
  onSuccess,
  onError,
  loadingComponent,
  errorComponent,
}: FusionAuthCallbackProps) {
  const { handleCallback } = useFusionAuth();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const processCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const errorParam = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');

        if (errorParam) {
          throw new Error(errorDescription || errorParam);
        }

        if (!code) {
          throw new Error('No authorization code found in callback URL');
        }

        const result = await handleCallback(code, state || undefined);

        if (result.success) {
          // Clear URL parameters
          window.history.replaceState({}, document.title, window.location.pathname);
          onSuccess?.();
        } else {
          throw new Error(result.error || 'Authentication failed');
        }
      } catch (err: any) {
        const errorMessage = err.message || 'Authentication failed';
        setError(errorMessage);
        onError?.(errorMessage);
      } finally {
        setIsProcessing(false);
      }
    };

    processCallback();
  }, [handleCallback, onSuccess, onError]);

  if (isProcessing) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }

    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Completing authentication...</p>
        </div>
      </div>
    );
  }

  if (error) {
    if (errorComponent) {
      return <>{errorComponent(error)}</>;
    }

    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md p-6">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2">Authentication Failed</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => window.location.href = '/auth/login'}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return null;
}