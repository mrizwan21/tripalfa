import { Link } from 'react-router-dom';
import { Button } from '@tripalfa/ui-components/ui/button';

import * as Icons from 'lucide-react';
import { AuthLayout, AuthLogo, AuthFooter, AuthFormCard } from '../components';

const { ArrowLeft, ExternalLink } = Icons as any;

export default function ForgotPasswordPage() {
  const handleForgotPassword = () => {
    const fusionAuthUrl = import.meta.env.VITE_FUSIONAUTH_URL;
    const clientId = import.meta.env.VITE_FUSIONAUTH_CLIENT_ID;

    if (!fusionAuthUrl || !clientId) {
      console.error('Missing required FusionAuth configuration');
      return;
    }

    const redirectUri = encodeURIComponent(window.location.origin + '/auth/callback');
    window.location.href = `${fusionAuthUrl}/oauth2/enter-email?client_id=${clientId}&redirect_uri=${redirectUri}`;
  };

  return (
    <AuthLayout>
      <AuthLogo title="TripAlfa B2B" subtitle="Admin Portal" />

      <AuthFormCard
        title="Reset your password"
        description="Password reset is handled through FusionAuth for security"
        footer={
          <Link
            to="/auth/login"
            className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Link>
        }
      >
        <p className="text-sm text-muted-foreground text-center">
          Click below to be redirected to FusionAuth where you can reset your password securely.
        </p>

        <Button onClick={handleForgotPassword} className="w-full h-11 text-sm font-medium">
          Reset Password via FusionAuth
          <ExternalLink className="h-4 w-4 ml-2" />
        </Button>
      </AuthFormCard>

      <AuthFooter />
    </AuthLayout>
  );
}
