import React, { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { api } from "../lib/api";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await api.post("/auth/forgot-password", { email });
      setEmailSent(true);
    } catch (err: any) {
      console.error("Forgot password error:", err);
      setError(err?.message || "Failed to send reset link. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-muted to-blue-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 gap-4">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100 gap-2">
              <Mail className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-foreground">
              Check your email
            </h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              We sent a password reset link to
            </p>
            <p className="text-sm font-medium text-foreground mt-1">{email}</p>
          </div>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <Card className="p-8 sm:p-10">
            <p className="text-sm text-muted-foreground text-center">
              Click the link in the email to reset your password. The link
              expires in 24 hours.
            </p>

            <div className="mt-6">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setEmailSent(false)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Didn't receive? Resend email
              </Button>
            </div>

            <div className="mt-4">
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted to-blue-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 gap-4">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-foreground">
          Forgot password?
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          No worries, we'll send you reset instructions.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="p-8 sm:p-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="email">Email address</Label>
              <div className="mt-2 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10 gap-2">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                </div>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="pl-10"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Send Reset Link"}
              </Button>
            </div>

            <div className="text-center">
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
