import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useLogin, useOAuthCallback } from "../lib/hooks";
import type { SocialProvider } from "../lib/socialAuth";

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mutation = useLogin();
  const oauthCallback = useOAuthCallback();
  const isLoading = mutation.isPending || oauthCallback.isPending;
  const [error, setError] = useState<string | null>(null);

  // Handle OAuth callback on mount
  React.useEffect(() => {
    const code = searchParams.get("code");
    const provider = searchParams.get("provider") as SocialProvider | null;

    if (code && provider) {
      oauthCallback.mutate(
        { provider, code },
        {
          onError: (err: any) => {
            console.error("OAuth callback error:", err);
            setError(err?.message || "Social login failed. Please try again.");
          },
        },
      );
    }
  }, [searchParams, oauthCallback]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);
    const email = (fd.get("email") as string) || "";
    const password = (fd.get("password") as string) || "";

    mutation.mutate(
      { email, password },
      {
        onSuccess: () => {
          navigate("/", { replace: true });
        },
        onError: (err: any) => {
          console.error("Login error:", err);
          setError(err?.message || "Login failed");
        },
      },
    );
  };

  const handleSocialLogin = (provider: SocialProvider) => {
    // Build OAuth URL based on provider
    const redirectUrl = `${window.location.origin}/auth/callback?provider=${provider}`;
    let authUrl = "";

    switch (provider) {
      case "google":
        const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
        authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${encodeURIComponent(redirectUrl)}&response_type=code&scope=openid%20profile%20email&access_type=offline`;
        break;
      case "facebook":
        const fbAppId = import.meta.env.VITE_FACEBOOK_APP_ID || "";
        authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${fbAppId}&redirect_uri=${encodeURIComponent(redirectUrl)}&response_type=code&scope=email,public_profile`;
        break;
      case "apple":
        const appleClientId = import.meta.env.VITE_APPLE_CLIENT_ID || "";
        authUrl = `https://appleid.apple.com/auth/authorize?client_id=${appleClientId}&redirect_uri=${encodeURIComponent(redirectUrl)}&response_type=code&scope=name%20email&response_mode=form_post`;
        break;
    }

    if (authUrl) {
      window.location.href = authUrl;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#003b95] to-[#002a6e] flex flex-col justify-center py-12 sm:px-6 lg:px-8 gap-4">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-bold tracking-tight text-white">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-white/80">
          Or{" "}
          <Link
            to="/register"
            className="text-[#4da1ff] hover:text-[#80baff] font-medium text-sm transition-colors"
          >
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full max-w-md">
        <Card className="bg-white rounded-xl border border-gray-100 shadow-xl shadow-black/5 ring-1 ring-gray-200/60 p-8 sm:p-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="email" className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Email address</Label>
              <div className="mt-2 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10 gap-2">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  data-testid="login-email"
                  className="h-12 rounded-xl border border-gray-200 bg-white hover:border-gray-300 focus:border-[#003b95] focus:ring-2 focus:ring-[#003b95]/10 px-4 pl-10 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-200"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Password</Label>
              <div className="mt-2 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10 gap-2">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  data-testid="login-password"
                  className="h-12 rounded-xl border border-gray-200 bg-white hover:border-gray-300 focus:border-[#003b95] focus:ring-2 focus:ring-[#003b95]/10 px-4 pl-10 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-200"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            {error && (
              <div className="mt-1.5 text-xs text-red-600 font-medium">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-[#003b95] focus:ring-[#003b95]"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-700 font-medium"
                >
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  className="text-[#003b95] hover:text-[#002a6e] font-medium text-sm transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                variant="primary"
                className="w-full bg-[#003b95] text-white rounded-lg px-6 py-2.5 font-semibold text-sm shadow-md hover:bg-[#002a6e] hover:shadow-lg active:scale-[0.98] transition-all duration-200"
                isLoading={isLoading}
                data-testid="login-submit"
              >
                Sign in
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center gap-2">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm gap-4">
                <span className="px-2 bg-white text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <Button
                variant="outline"
                className="w-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200"
                onClick={() => handleSocialLogin("google")}
                disabled={isLoading}
                title="Sign in with Google"
              >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </Button>
              <Button
                variant="outline"
                className="w-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200"
                onClick={() => handleSocialLogin("facebook")}
                disabled={isLoading}
                title="Sign in with Facebook"
              >
                <svg
                  className="h-5 w-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </Button>
              <Button
                variant="outline"
                className="w-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200"
                onClick={() => handleSocialLogin("apple")}
                disabled={isLoading}
                title="Sign in with Apple"
              >
                <svg
                  className="h-5 w-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
                Apple
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;
