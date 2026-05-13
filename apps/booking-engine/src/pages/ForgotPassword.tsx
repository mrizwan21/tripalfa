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
      <div className="min-h-screen bg-gradient-to-br from-[#003b95] to-[#002a6e] flex flex-col justify-center py-12 sm:px-6 lg:px-8 gap-4">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100 gap-2">
              <Mail className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-white">
              Check your email
            </h2>
            <p className="mt-2 text-center text-sm text-white/80">
              We sent a password reset link to
            </p>
            <p className="text-sm font-medium text-white mt-1">{email}</p>
          </div>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full max-w-md">
          <Card className="bg-white rounded-xl border border-gray-100 shadow-xl shadow-black/5 ring-1 ring-gray-200/60 p-8 sm:p-10">
            <p className="text-sm text-gray-500 text-center">
              Click the link in the email to reset your password. The link
              expires in 24 hours.
            </p>

            <div className="mt-6">
              <Button
                type="button"
                variant="outline"
                className="w-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200"
                onClick={() => setEmailSent(false)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Didn't receive? Resend email
              </Button>
            </div>

            <div className="mt-4">
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 text-sm text-[#003b95] hover:text-[#002a6e] font-medium transition-colors"
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
    <div className="min-h-screen bg-gradient-to-br from-[#003b95] to-[#002a6e] flex flex-col justify-center py-12 sm:px-6 lg:px-8 gap-4">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-2xl font-bold tracking-tight text-white">
          Forgot password?
        </h2>
        <p className="mt-2 text-center text-sm text-white/80">
          No worries, we'll send you reset instructions.
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
                  className="h-12 rounded-xl border border-gray-200 bg-white hover:border-gray-300 focus:border-[#003b95] focus:ring-2 focus:ring-[#003b95]/10 px-4 pl-10 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-200"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            {error && (
              <div className="mt-1.5 text-xs text-red-600 font-medium">
                {error}
              </div>
            )}

            <div>
              <Button
                type="submit"
                variant="primary"
                className="w-full bg-[#003b95] text-white rounded-lg px-6 py-2.5 font-semibold text-sm shadow-md hover:bg-[#002a6e] hover:shadow-lg active:scale-[0.98] transition-all duration-200"
                isLoading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Send Reset Link"}
              </Button>
            </div>

            <div className="text-center">
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 text-sm text-[#003b95] hover:text-[#002a6e] font-medium transition-colors"
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
