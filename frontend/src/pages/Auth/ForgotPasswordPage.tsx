import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle2, AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { forgotPasswordApi } from '../../services/authApi';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await forgotPasswordApi(email.trim());
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || 'Could not process request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white border border-[#e5e5e5] rounded-3xl p-8 sm:p-10 shadow-sm">
        <div className="mb-6">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5e5e5e] hover:text-black transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sign In</span>
          </Link>
        </div>

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
            Reset Password
          </h1>
          <p className="text-xs text-[#5e5e5e] mt-1.5">
            Enter the email associated with your account and we will send you a secure link to reset your password.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-[#fff2f2] border border-[#fecaca] text-[#b91c1c] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {submitted ? (
          <div className="p-6 rounded-2xl bg-[#f0fdf4] border border-[#bbf7d0] text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-[#16a34a] mx-auto" />
            <h3 className="font-bold text-sm text-black">Check Your Inbox</h3>
            <p className="text-xs text-[#4b5563] leading-relaxed">
              If an account is associated with <strong>{email}</strong>, we have sent instructions to reset your password.
            </p>
            <div className="pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-black uppercase tracking-wider hover:underline"
              >
                <span>Return to Sign In</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-black uppercase mb-1">
                Account Email
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-black hover:bg-[#222222] text-white rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? (
                <span>Sending Instructions...</span>
              ) : (
                <>
                  <span>Send Reset Link</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
