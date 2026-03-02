import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api, setAccessToken, setRefreshToken, queryKeys } from "../lib/api";
import { useQueryClient } from "@tanstack/react-query";
import type { SocialProvider, AuthResponse } from "../lib/socialAuth";
import { Button } from "../components/ui/button";

// Predefined user-friendly error messages to avoid exposing internal details
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  access_denied: "Access was denied. Please try again.",
  invalid_request: "Invalid authentication request. Please try again.",
  invalid_scope: "Invalid scope requested. Please try again.",
  server_error: "Authentication service error. Please try again later.",
  temporarily_unavailable:
    "Authentication service is temporarily unavailable. Please try again later.",
  invalid_grant: "Authentication code expired or invalid. Please try again.",
  unsupported_response_type:
    "Unsupported authentication response. Please try again.",
  unauthorized_client: "Client not authorized. Please contact support.",
};

/**
 * Sanitize and map OAuth error parameters to user-friendly messages
 * Prevents potential information leakage from raw error descriptions
 */
function sanitizeOAuthError(
  errorCode: string | null,
  errorDescription: string | null,
): string {
  // If we have a known error code, return the mapped message
  if (errorCode && AUTH_ERROR_MESSAGES[errorCode]) {
    return AUTH_ERROR_MESSAGES[errorCode];
  }

  // For unknown error codes, return a generic message
  // Never display the raw error description as it may contain sensitive info
  return "Authentication failed. Please try again.";
}

/**
 * Map API error to user-friendly message
 */
function getApiErrorMessage(err: any): string {
  // Check for specific HTTP status codes
  const statusCode = err?.response?.status;

  if (statusCode === 401) {
    return "Authentication failed. Please check your credentials and try again.";
  }
  if (statusCode === 403) {
    return "Access denied. You may not have permission to sign in with this account.";
  }
  if (statusCode === 429) {
    return "Too many authentication attempts. Please try again later.";
  }
  if (statusCode >= 500) {
    return "Authentication service error. Please try again later.";
  }

  // Default generic message - never expose raw error details
  return "Authentication failed. Please try again.";
}

const AuthCallback = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"processing" | "success" | "error">(
    "processing",
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processOAuthCallback = async () => {
      const code = searchParams.get("code");
      const provider = searchParams.get("provider") as SocialProvider | null;
      const errorParam = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");

      if (errorParam) {
        setStatus("error");
        setError(sanitizeOAuthError(errorParam, errorDescription));
        return;
      }

      if (!code || !provider) {
        setStatus("error");
        setError("Invalid authentication parameters");
        return;
      }

      try {
        // Exchange authorization code for tokens via backend
        const response = await api.post<AuthResponse>("/auth/oauth/callback", {
          provider,
          code,
        });

        // Store tokens
        setAccessToken(response.accessToken);
        setRefreshToken(response.refreshToken);

        // Update user query cache
        queryClient.setQueryData(queryKeys.auth.user, response.user);

        setStatus("success");

        // Navigate to home immediately after successful authentication
        navigate("/", { replace: true });
      } catch (err: any) {
        console.error("OAuth callback error:", err);
        setStatus("error");
        setError(getApiErrorMessage(err));
      }
    };

    processOAuthCallback();
  }, [searchParams, navigate, queryClient]);

  if (status === "processing") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-muted to-blue-50 flex flex-col justify-center items-center gap-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(var(--primary))] mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-foreground text-2xl font-semibold tracking-tight">
            Completing sign in...
          </h2>
          <p className="text-muted-foreground mt-2">
            Please wait while we verify your account.
          </p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-muted to-blue-50 flex flex-col justify-center items-center gap-4">
        <div className="text-center max-w-md p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 gap-2">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2 text-2xl font-semibold tracking-tight">
            Sign in Failed
          </h2>
          <p className="text-muted-foreground mb-6">
            {error || "An error occurred during authentication."}
          </p>
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate("/login")}
            className="px-6 py-2 bg-[hsl(var(--primary))] text-background rounded-lg hover:bg-[hsl(var(--primary))/0.9] transition-colors"
          >
            Back to Sign In
          </Button>
        </div>
      </div>
    );
  }

  // Success state - should redirect automatically
  return (
    <div className="min-h-screen bg-gradient-to-br from-muted to-blue-50 flex flex-col justify-center items-center gap-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-foreground text-2xl font-semibold tracking-tight">
          Redirecting...
        </h2>
      </div>
    </div>
  );
};

export default AuthCallback;
