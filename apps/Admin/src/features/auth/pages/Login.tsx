import { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@tripalfa/ui-components/ui/button';

import * as Icons from 'lucide-react';
import { toast } from 'sonner';
import api from '@/shared/lib/api';
import { AuthLayout, AuthLogo, AuthFooter, AuthFormCard } from '../components';
import { useAccessControl } from '@/contexts/AccessControlContext';

const { ArrowRight, Loader2, Shield } = Icons as any;

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setSession } = useAccessControl();
  const [isLoading, setIsLoading] = useState(false);
  const [isExchanging, setIsExchanging] = useState(false);

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      exchangeCodeForTokens(code);
    }
  }, [searchParams]);

  const initiateLogin = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/auth/fusionauth/login?userType=B2B');
      if (response.data?.authUrl) {
        window.location.href = response.data.authUrl;
      }
    } catch (error: any) {
      console.error('Failed to initiate login:', error);
      toast.error('Failed to start login. Please try again.');
      setIsLoading(false);
    }
  };

  const exchangeCodeForTokens = async (code: string) => {
    setIsExchanging(true);
    try {
      const response = await api.post('/auth/fusionauth/exchange', { code });

      if (response.data?.accessToken) {
        const meResponse = await api.get('/auth/fusionauth/me', {
          headers: { Authorization: `Bearer ${response.data.accessToken}` },
        });

        const user = meResponse.data?.data;

        setSession({
          token: response.data.accessToken,
          user: user || null,
          permissions: user?.permissions || [],
        });

        toast.success('Login successful!');
        navigate('/');
      }
    } catch (error: any) {
      console.error('Token exchange failed:', error);
      toast.error('Login failed. Please try again.');
      navigate('/auth/login', { replace: true });
    } finally {
      setIsExchanging(false);
    }
  };

  if (isExchanging) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Completing login...</p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <AuthLogo title="TripAlfa B2B" subtitle="Admin Portal" />

      <AuthFormCard
        title="Sign in with FusionAuth"
        description="Use your organization credentials to access the admin portal"
        footer={
          <>
            <Link
              to="/auth/forgot-password"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
            >
              Having trouble signing in?
            </Link>

            <p className="text-xs text-center text-muted-foreground">
              By signing in, you agree to our{' '}
              <a href="#" className="text-foreground hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-foreground hover:underline">
                Privacy Policy
              </a>
            </p>
          </>
        }
      >
        <Button
          onClick={initiateLogin}
          disabled={isLoading}
          className="w-full h-11 text-sm font-medium"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Redirecting to FusionAuth...
            </>
          ) : (
            <>
              Sign in with FusionAuth
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </AuthFormCard>

      <AuthFooter />
    </AuthLayout>
  );
}
