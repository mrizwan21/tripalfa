import { useState } from 'react';
import { useAuth } from '../../contexts/useAuth';

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();

  const handleLogin = async () => {
    try {
      setError('');
      await login(email, password);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Invalid credentials');
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-lg shadow-apple border border-near-black">
      <div className="text-center mb-8">
        <div className="h-12 w-12 rounded-lg bg-apple-blue flex items-center justify-center mx-auto mb-4">
          <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-near-black">Super Admin Portal</h2>
        <p className="text-near-black mt-2">Sign in to manage platform tenants and configurations</p>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-near-black/5 border border-near-black/20 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-near-black mb-1">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="admin@tripalfa.com"
            className="w-full px-4 py-3 border border-near-black rounded-lg focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-transparent transition"
            disabled={isLoading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-near-black mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="••••••••"
            className="w-full px-4 py-3 border border-near-black rounded-lg focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-transparent transition"
            disabled={isLoading}
          />
        </div>
        <button
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full bg-apple-blue hover:bg-apple-blue text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </div>

      <div className="mt-8 pt-6 border-t border-near-black text-center text-sm text-near-black">
        <p>Use your super admin credentials provided by the platform team.</p>
        <p className="mt-1">Contact support if you need access.</p>
      </div>
    </div>
  );
};
