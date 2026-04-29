import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import { LoginForm } from '../components/auth/LoginForm';

const LoginPage = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/');
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-apple-blue"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4">
      <LoginForm />
      <div className="mt-8 text-center text-near-black text-sm">
        <p>© {new Date().getFullYear()} TripAlfa Super Admin Portal. All rights reserved.</p>
        <p className="mt-1">Version 1.0.0</p>
      </div>
    </div>
  );
};

export default LoginPage;
