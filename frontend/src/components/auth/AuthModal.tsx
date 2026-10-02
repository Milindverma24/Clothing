import React, { useState } from 'react';
import { X, Lock, Mail, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { forgotPasswordApi } from '../../services/authApi';

export const AuthModal: React.FC = () => {
  const {
    authModalOpen,
    closeAuthModal,
    authModalView,
    openAuthModal,
    login,
    register,
    loginWithGoogle,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!authModalOpen) return null;

  const handleGoogleAuth = async () => {
    setError(null);
    setLoading(true);
    try {
      // Check if we can do one-click simulated / direct Google flow or backend OAuth redirect
      await loginWithGoogle();
    } catch (err: any) {
      setError(err?.message || 'Google authentication failed');
      setLoading(false);
    }
  };

  const handleQuickDemoCustomer = async () => {
    setError(null);
    setLoading(true);
    try {
      await login('milind@example.com', 'password123');
    } catch (err: any) {
      setError(err?.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoAdmin = async () => {
    setError(null);
    setLoading(true);
    try {
      await login('admin@clothing.com', 'admin123');
    } catch (err: any) {
      setError(err?.message || 'Admin login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (authModalView === 'login') {
      if (!email.trim() || !password) {
        setError('Please enter both email and password.');
        return;
      }
      setLoading(true);
      try {
        await login(email.trim(), password);
      } catch (err: any) {
        setError(err?.message || 'Failed to sign in. Please verify your credentials.');
      } finally {
        setLoading(false);
      }
    } else if (authModalView === 'register') {
      if (!firstName.trim() || !email.trim() || !password) {
        setError('Please complete all required fields.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (!agreeTerms) {
        setError('Please accept our terms of service to continue.');
        return;
      }
      setLoading(true);
      try {
        await register({
          firstName: firstName.trim(),
          lastName: lastName.trim() || undefined,
          email: email.trim(),
          password,
        });
      } catch (err: any) {
        setError(err?.message || 'Registration failed. This email may already be in use.');
      } finally {
        setLoading(false);
      }
    } else if (authModalView === 'forgot') {
      if (!email.trim()) {
        setError('Please enter your email address.');
        return;
      }
      setLoading(true);
      try {
        const msg = await forgotPasswordApi(email.trim());
        setSuccessMsg(msg || 'If an account exists for this email, a reset link has been sent.');
      } catch (err: any) {
        setError(err?.message || 'Could not process request.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-white border border-[#e5e5e5] rounded-3xl p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-5 right-5 w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#f4f4f4] text-[#8a8a8a] hover:text-black transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center gap-2.5 mb-3">
            <img src="/shirt.png" alt="CLOTHING Logo" className="w-8 h-8 object-contain" />
            <span className="font-extrabold text-xl tracking-tight text-black uppercase">
              CLOTHING
            </span>
          </div>
          <h2 className="text-2xl font-extrabold uppercase tracking-tight text-black">
            {authModalView === 'login' && 'Sign In'}
            {authModalView === 'register' && 'Create Account'}
            {authModalView === 'forgot' && 'Reset Password'}
          </h2>
          <p className="text-xs text-[#5e5e5e] mt-1">
            {authModalView === 'login' && 'Welcome back. Sign in to access your orders and wishlist.'}
            {authModalView === 'register' && 'Join for seamless shopping, order tracking, and curated drops.'}
            {authModalView === 'forgot' && 'Enter your email to receive recovery instructions.'}
          </p>
        </div>

        {/* Google OAuth Button (Available for login & register) */}
        {authModalView !== 'forgot' && (
          <div className="space-y-3 mb-5">
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#f8f8f8] hover:bg-[#ebebeb] active:scale-[0.99] border border-[#e5e5e5] rounded-full text-xs font-semibold text-black transition-all"
            >
              {/* Official Google G Icon */}
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

            <div className="relative flex items-center my-4">
              <div className="flex-1 border-t border-[#e5e5e5]" />
              <span className="px-3 text-[10px] uppercase font-bold tracking-widest text-[#8a8a8a] whitespace-nowrap bg-white">
                or with email
              </span>
              <div className="flex-1 border-t border-[#e5e5e5]" />
            </div>
          </div>
        )}

        {/* Error / Success Alerts */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-[#fff2f2] border border-[#fecaca] text-[#b91c1c] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-[#f0fdf4] border border-[#bbf7d0] text-[#15803d] text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {authModalView === 'register' && (
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-black uppercase mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Milind"
                  className="w-full px-3.5 py-2.5 bg-[#f4f4f4] rounded-xl text-xs text-black placeholder:text-[#8a8a8a] focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-black uppercase mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Verma"
                  className="w-full px-3.5 py-2.5 bg-[#f4f4f4] rounded-xl text-xs text-black placeholder:text-[#8a8a8a] focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-black uppercase mb-1">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#8a8a8a] absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-3.5 py-2.5 bg-[#f4f4f4] rounded-xl text-xs text-black placeholder:text-[#8a8a8a] focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>

          {authModalView !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-black uppercase">Password *</label>
                {authModalView === 'login' && (
                  <button
                    type="button"
                    onClick={() => openAuthModal('forgot')}
                    className="text-[11px] text-[#5e5e5e] hover:text-black font-medium transition-colors"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#8a8a8a] absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-[#f4f4f4] rounded-xl text-xs text-black placeholder:text-[#8a8a8a] focus:outline-none focus:ring-2 focus:ring-black"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-[#8a8a8a] hover:text-black"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {authModalView === 'register' && (
            <>
              <div>
                <label className="block text-[11px] font-bold text-black uppercase mb-1">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#8a8a8a] absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-[#f4f4f4] rounded-xl text-xs text-black placeholder:text-[#8a8a8a] focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>

              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  id="agreeTerms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 rounded border-[#e5e5e5] text-black focus:ring-black cursor-pointer"
                />
                <label htmlFor="agreeTerms" className="text-[11px] text-[#5e5e5e] cursor-pointer">
                  I agree to the Storefront Terms & Privacy Policy.
                </label>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-black hover:bg-[#222222] text-white rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? (
              <span>Processing...</span>
            ) : (
              <>
                <span>
                  {authModalView === 'login' && 'Sign In'}
                  {authModalView === 'register' && 'Create Account'}
                  {authModalView === 'forgot' && 'Send Reset Link'}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Demo Fast Fill Pills */}
        {authModalView === 'login' && (
          <div className="mt-4 pt-3 border-t border-[#f4f4f4] flex flex-col sm:flex-row items-center justify-center gap-2">
            <button
              type="button"
              onClick={handleQuickDemoCustomer}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f4f4f4] hover:bg-black hover:text-white text-[11px] font-semibold text-[#5e5e5e] transition-colors"
            >
              <span>👤 Customer (milind@example.com)</span>
            </button>
            <button
              type="button"
              onClick={handleQuickDemoAdmin}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-black text-white hover:bg-[#222222] text-[11px] font-semibold transition-colors"
            >
              <Shield className="w-3 h-3 text-white" />
              <span>🛡️ Admin (admin@clothing.com)</span>
            </button>
          </div>
        )}

        {/* View Switchers */}
        <div className="mt-5 text-center text-xs text-[#5e5e5e]">
          {authModalView === 'login' && (
            <p>
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => openAuthModal('register')}
                className="font-bold text-black hover:underline"
              >
                Create Account
              </button>
            </p>
          )}

          {authModalView === 'register' && (
            <p>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="font-bold text-black hover:underline"
              >
                Sign In
              </button>
            </p>
          )}

          {authModalView === 'forgot' && (
            <p>
              Remember your credentials?{' '}
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="font-bold text-black hover:underline"
              >
                Back to Sign In
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
