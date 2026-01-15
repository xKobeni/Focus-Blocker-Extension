import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Shield } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import { initiateGoogleLogin, getToken } from '../services/authService';
import { postTokenToExtension } from '../services/extensionService';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const { login, isLoading, error: storeError } = useAuthStore();
  const error = localError || storeError;

  useEffect(() => {
    // Check for OAuth error from URL
    const oauthError = searchParams.get('error');
    if (oauthError) {
      setTimeout(() => {
        setLocalError(
          oauthError === 'google_authentication_failed' 
            ? 'Google authentication failed. Please try again.' 
            : 'Authentication failed. Please try again.'
        );
      }, 0);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!email || !password) {
      setLocalError('Email and password are required');
      return;
    }

    try {
      await login({ email, password });
      
      // Send token to extension (single send to avoid rate limiting)
      const token = getToken();
      if (token) {
        // Send once - extension will request if needed
        postTokenToExtension(token);
        console.log('✅ Token sent to extension');
      }
      
      // Navigate to home on successful login
      navigate('/home');
    } catch (err) {
      // Error is already set in the store
      console.error('Login failed:', err);
    }
  };

  const handleGoogleLogin = () => {
    initiateGoogleLogin();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-slate-200 hover:text-white">
            <Shield className="w-5 h-5 text-emerald-400" />
            <span className="font-semibold">AI Focus Blocker</span>
          </Link>
          <h1 className="text-2xl font-semibold mt-4">Welcome back</h1>
          <p className="text-slate-400 mt-1">Sign in to continue your focus streak.</p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-8 shadow-xl">

        {error && (
          <div className="mb-4 rounded-md bg-red-900/60 border border-red-700 px-3 py-2 text-sm text-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 pr-10 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed px-3 py-2 text-sm font-medium text-white transition-colors"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-slate-900/70 text-slate-400">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="mt-4 w-full flex items-center justify-center gap-3 rounded-md bg-white hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed px-3 py-2 text-sm font-medium text-gray-900 transition-colors border border-gray-300"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-emerald-500 hover:text-emerald-400 font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  </div>
  );
}

export default LoginPage;

