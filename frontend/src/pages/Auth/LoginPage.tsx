import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login, loginWithGoogle, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const redirectPath = queryParams.get('redirect') || '/account';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already authenticated, redirect immediately
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, redirectPath]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please provide your email and password.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate(redirectPath, { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Invalid email or password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(err?.message || 'Google sign-in failed');
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await login('milind@example.com', 'password123');
      navigate(redirectPath, { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Demo sign-in failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoAdminLogin = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await login('admin@clothing.com', 'admin123');
      navigate('/admin', { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Admin sign-in failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white border border-[#e5e5e5] rounded-3xl p-8 sm:p-10 shadow-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4 group" aria-label="Nova Home">
            <img src="/shirt.png" alt="Nova Logo" className="w-8 h-8 object-contain" />
            <img
              src="/nova-calligraphy.png"
              srcSet="/nova-calligraphy.png 1x, /nova-calligraphy@2x.png 2x"
              alt="Nova"
              className="h-8 w-auto object-contain"
            />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-black">
            {redirectPath.startsWith('/admin') ? 'Admin Sign In' : 'Welcome Back'}
          </h1>
          <p className="text-xs text-[#5e5e5e] mt-1.5">
            {redirectPath.startsWith('/admin')
              ? 'Administrator credentials required to access the management atelier.'
              : 'Sign in to access your saved wishlist, orders, and addresses.'}
          </p>
        </div>

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#f8f8f8] hover:bg-[#ececec] border border-[#e5e5e5] rounded-full text-xs font-semibold text-black transition-all active:scale-[0.99] mb-5"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
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
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="relative flex items-center my-6">
          <div className="flex-1 border-t border-[#e5e5e5]" />
          <span className="px-3 text-[10px] uppercase font-bold tracking-widest text-[#8a8a8a] whitespace-nowrap bg-white">
            or sign in with email
          </span>
          <div className="flex-1 border-t border-[#e5e5e5]" />
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-[#fff2f2] border border-[#fecaca] text-[#b91c1c] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-black uppercase mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#8a8a8a] absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-[#f4f4f4] rounded-xl text-xs text-black placeholder:text-[#8a8a8a] focus:outline-none focus:ring-2 focus:ring-black transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-black uppercase">Password</label>
              <Link
                to="/forgot-password"
                className="text-[11px] text-[#5e5e5e] hover:text-black font-medium transition-colors"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#8a8a8a] absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-[#f4f4f4] rounded-xl text-xs text-black placeholder:text-[#8a8a8a] focus:outline-none focus:ring-2 focus:ring-black transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-2.5 text-[#8a8a8a] hover:text-black transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 py-3.5 bg-black hover:bg-[#222222] text-white rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
          >
            {submitting ? (
              <span>Signing in...</span>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-2">
          <button
            type="button"
            onClick={handleDemoLogin}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f4f4f4] hover:bg-black hover:text-white text-[11px] font-semibold text-[#5e5e5e] transition-colors"
          >
            <span>👤 Customer (milind@example.com)</span>
          </button>
          <button
            type="button"
            onClick={handleDemoAdminLogin}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-black text-white hover:bg-[#222222] text-[11px] font-semibold transition-colors"
          >
            <Shield className="w-3 h-3 text-white" />
            <span>🛡️ Admin (admin@clothing.com)</span>
          </button>
        </div>

        <div className="mt-6 pt-5 border-t border-[#f4f4f4] text-center text-xs text-[#5e5e5e]">
          Don't have an account yet?{' '}
          <Link
            to={`/register${redirectPath !== '/account' ? `?redirect=${encodeURIComponent(redirectPath)}` : ''}`}
            className="font-bold text-black hover:underline"
          >
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
};
