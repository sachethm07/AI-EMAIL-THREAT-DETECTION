import React, { useState } from 'react';
import {
  ShieldAlert,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  KeyRound,
  ShieldCheck,
  Terminal,
  Sparkles,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import iconSvg from '../assets/sentinmail-icon.svg';

export default function AdminLoginPage({
  onNavigateAnalyst,
  onNavigateDashboard,
  onNavigateTerms,
  onLoginSuccess,
}) {
  const { login, logout, quickDemoLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const profile = await login(email.trim(), password);
      // Strictly enforce that only Administrator accounts can authenticate through this portal
      if (profile.role !== 'admin') {
        logout();
        setError(
          `Access Denied: Your account role is "${profile.role}". The Administrator Security Console is strictly restricted to administrator credentials. Please sign in via the Threat Analyst Portal.`
        );
        return;
      }
      if (onLoginSuccess) {
        onLoginSuccess();
      } else if (onNavigateDashboard) {
        onNavigateDashboard();
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify administrator credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickAdminLogin = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await quickDemoLogin('admin');
      if (onLoginSuccess) {
        onLoginSuccess();
      } else if (onNavigateDashboard) {
        onNavigateDashboard();
      }
    } catch (err) {
      setError(err.message || 'Administrator demo authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-12rem)] flex flex-col justify-center items-center py-6 px-4 sm:px-6">
      <div className="w-full max-w-md space-y-6">
        {/* Back Link */}
        <div className="flex items-center justify-between">
          <button
            onClick={onNavigateDashboard}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 font-medium transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Live Dashboard
          </button>

          <button
            onClick={onNavigateAnalyst}
            className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-semibold transition"
          >
            <User className="w-3.5 h-3.5" />
            Switch to Analyst Login &rarr;
          </button>
        </div>

        {/* Portal Separation Switcher Tabs */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={onNavigateAnalyst}
            className="py-2 px-3 rounded-lg text-slate-400 hover:text-slate-200 transition flex items-center justify-center gap-1.5"
          >
            <User className="w-3.5 h-3.5 text-cyan-400" />
            <span>Threat Analyst</span>
          </button>

          <button
            type="button"
            className="py-2 px-3 rounded-lg bg-gradient-to-r from-rose-900/50 to-amber-900/40 text-amber-300 border border-amber-500/30 shadow-sm flex items-center justify-center gap-1.5 font-bold cursor-default"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>Administrator</span>
          </button>
        </div>

        {/* Card Container */}
        <div className="bg-slate-900/95 border border-rose-900/40 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md relative overflow-hidden">
          {/* Crimson & Amber Administrative Glow Header */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-600 via-amber-500 to-red-600"></div>

          {/* Header */}
          <div className="text-center space-y-2 mb-6">
            <div className="w-14 h-14 mx-auto flex items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500/20 to-amber-500/20 border border-rose-500/40 p-2 shadow-lg shadow-rose-950/40">
              <KeyRound className="w-7 h-7 text-amber-400" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-500/15 border border-rose-500/30 text-rose-300">
              <Lock className="w-3 h-3 text-rose-400" />
              Restricted // Root Tier Access
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-white">
              Administrator Security Console
            </h1>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Privileged authentication for platform administrators, security leads, and SOC directors.
            </p>
          </div>

          {/* 1-Click Admin Demo Access Card */}
          <div className="bg-slate-950/80 border border-rose-900/40 rounded-xl p-3.5 mb-6 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-rose-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Instant 1-Click Admin Access</span>
              </div>
              <span className="text-[10px] font-mono uppercase bg-rose-950/80 text-rose-300 px-1.5 py-0.2 rounded border border-rose-800/60 font-semibold">
                Root Role
              </span>
            </div>

            <button
              type="button"
              onClick={handleQuickAdminLogin}
              disabled={submitting}
              className="w-full p-2.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/30 text-rose-200 font-medium transition text-left flex items-center justify-between group"
            >
              <div className="flex flex-col">
                <span className="font-bold text-[11px] uppercase tracking-wider text-amber-300">
                  Platform Administrator
                </span>
                <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                  admin@sentinmail.org &bull; Full Privileges
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-rose-400 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* Admin Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Administrator Email Address:
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="admin@sentinmail.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 font-mono transition"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Master Administrative Password:
                </label>
                <span className="text-[10px] text-slate-500 font-mono">
                  (Default: AdminPassword123!)
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter administrator password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-10 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 font-mono transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || !email.trim() || !password}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs shadow-lg shadow-rose-900/30 transition flex items-center justify-center gap-2 mt-2"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Verifying Administrative Authority...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Authenticate Administrator Session</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Navigation to Analyst Login */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center text-xs text-slate-400 space-y-2">
            <div>
              Not a system administrator?{' '}
              <button
                type="button"
                onClick={onNavigateAnalyst}
                className="text-cyan-400 font-bold hover:text-cyan-300 underline underline-offset-2 transition"
              >
                Go to Threat Analyst Sign In
              </button>
            </div>

            {onNavigateTerms && (
              <div className="text-[11px] text-slate-500">
                Administrative session is audited under the{' '}
                <button
                  type="button"
                  onClick={onNavigateTerms}
                  className="text-slate-400 hover:text-cyan-300 underline underline-offset-2 transition"
                >
                  Terms and Conditions
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Security Disclaimers Badge */}
        <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-2 font-mono">
          <Terminal className="w-3.5 h-3.5 text-rose-500/70" />
          <span>Restricted Portal &bull; Role-Enforced Authorization &bull; Immutable Audit Logging</span>
        </div>
      </div>
    </div>
  );
}
