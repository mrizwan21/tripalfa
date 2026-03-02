import { Button } from "@tripalfa/ui-components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@tripalfa/ui-components/ui/card";
import { Input } from "@tripalfa/ui-components/ui/input";
import { Label } from "@tripalfa/ui-components/ui/label";
import { Link } from "react-router-dom";
import * as Icons from "lucide-react";
import { useState, FormEvent } from "react";
import { toast } from "sonner";
import api from "@/shared/lib/api";

const { Activity, ArrowLeft, Mail, Loader2 } = Icons as any;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setEmailSent(true);
      toast.success("Password reset link sent! Check your email.");
    } catch (error: any) {
      console.error("Forgot password failed", error);
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to send reset link";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 gap-4">
        <div className="mb-8 flex flex-col items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600 shadow-lg mb-4 gap-4">
            <Mail className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">
            Check your email
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            We sent a password reset link to
          </p>
          <p className="text-sm font-medium text-foreground mt-1">{email}</p>
        </div>

        <Card className="w-full max-w-md border-border shadow-elevated">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center">
              Click the link in the email to reset your password. The link
              expires in 24 hours.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pt-2">
            <Link
              to="/auth/forgot-password"
              className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setEmailSent(false)}
            >
              <ArrowLeft className="h-4 w-4" />
              Didn't receive? Resend email
            </Link>
            <Link
              to="/auth/login"
              className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Link>
          </CardFooter>
        </Card>

        <p className="mt-8 text-xs text-muted-foreground text-center">
          © 2024 TripAlfa. All rights reserved.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 gap-4">
      {/* Logo Section */}
      <div className="mb-8 flex flex-col items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-foreground text-background shadow-lg mb-4 gap-4">
          <Activity className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-semibold text-foreground">TripAlfa B2B</h1>
        <p className="text-sm text-muted-foreground mt-1">Admin Portal</p>
      </div>

      {/* Forgot Password Card */}
      <Card className="w-full max-w-md border-border shadow-elevated">
        <CardHeader className="space-y-0 gap-2 pb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-10 w-10 rounded-full bg-muted/60 flex items-center justify-center gap-2">
              <Mail className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
          <CardTitle className="text-xl font-semibold text-foreground">
            Forgot password?
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            No worries, we'll send you reset instructions.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 p-6">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-foreground"
              >
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@organization.com"
                required
                className="h-11"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4 pt-2">
            <Button
              type="submit"
              className="w-full h-11 text-sm font-medium"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Reset Link"
              )}
            </Button>

            <Link
              to="/auth/login"
              className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Link>
          </CardFooter>
        </form>
      </Card>

      {/* Footer */}
      <p className="mt-8 text-xs text-muted-foreground text-center">
        © 2024 TripAlfa. All rights reserved.
      </p>
    </div>
  );
}
