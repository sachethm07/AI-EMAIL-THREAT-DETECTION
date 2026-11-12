import React, { useState } from 'react';
import { Sparkles, Lock, Mail, Eye, EyeOff, ArrowRight, ArrowLeft, AlertCircle, CheckCircle2, Terminal } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import iconSvg from '../assets/sentinmail-icon.svg';

export default function LoginPage({ onNavigateSignup, onNavigateDashboard, onNavigateTerms, onLoginSuccess }) {
  const { login, quickDemoLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      if (onLoginSuccess) {
        onLoginSuccess();
      } else if (onNavigateDashboard) {
        onNavigateDashboard();
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickLogin = async (role) => {
    setError(null);
    setSubmitting(true);
    try {
      await quickDemoLogin(role);
      if (onLoginSuccess) {
        onLoginSuccess();
      } else if (onNavigateDashboard) {
        onNavigateDashboard();
      }
    } catch (err) {
      setError(err.message || 'Demo authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-12rem)] flex flex-col justify-center items-center py-6 px-4 sm:px-6">
      <div className="w-full max-w-md space-y-6">
        {/* Back to Home Link */}
        <button
          onClick={onNavigateDashboard}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 font-medium transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Live Dashboard
        </button>

        {/* Card Container */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md relative overflow-hidden">
          {/* Subtle Cyber Glow Header Effect */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500"></div>

          {/* Header */}
          <div className="text-center space-y-2 mb-6">
            <div className="w-14 h-14 mx-auto flex items-center justify-center filter drop-shadow-[0_4px_12px_rgba(128,53,245,0.35)]">
              <img src={iconSvg} alt="SentinMail Icon" className="w-14 h-14 object-contain" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Analyst Console Sign In
            </h1>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Authenticate to access email threat detection models, routing telemetry, and evidence verification.
            </p>
          </div>

          {/* 1-Click Academic Demo Credentials Card */}
          <div className="bg-slate-950/80 border border-cyan-900/50 rounded-xl p-3.5 mb-6 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-cyan-300">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Instant 1-Click Access</span>
              </div>
              <span className="text-[10px] font-mono uppercase bg-cyan-950 text-cyan-400 px-1.5 py-0.2 rounded border border-cyan-800/60">
                Evaluation
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                disabled={submitting}
                className="p-2.5 rounded-lg bg-cyan-600/15 hover:bg-cyan-600/25 border border-cyan-500/30 text-cyan-300 font-medium transition text-left flex flex-col justify-between"
              >
                <span className="font-bold text-[11px] uppercase tracking-wider text-cyan-200">Admin Role</span>
                <span className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">admin@sentinmail.org</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('analyst')}
                disabled={submitting}
                className="p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700 text-slate-300 font-medium transition text-left flex flex-col justify-between"
              >
                <span className="font-bold text-[11px] uppercase tracking-wider text-slate-200">Analyst Role</span>
                <span className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">analyst@sentinmail.org</span>
              </button>
            </div>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Analyst / Organization Email:
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="analyst@sentinmail.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono transition"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Password:
                </label>
                <span className="text-[10px] text-slate-500">
                  (Default demo pass: AdminPassword123!)
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-10 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded bg-slate-950 border-slate-800 text-cyan-500 focus:ring-0"
                />
                <span>Persist token in local storage</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting || !email.trim() || !password}
              className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition flex items-center justify-center gap-2 mt-2"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Forensic Console</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Navigation to Signup */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center text-xs text-slate-400 space-y-2">
            <div>
              Don't have an analyst account yet?{' '}
              <button
                type="button"
                onClick={onNavigateSignup}
                className="text-cyan-400 font-bold hover:text-cyan-300 underline underline-offset-2 transition"
              >
                Create Account / Sign Up
              </button>
            </div>
            {onNavigateTerms && (
              <div className="text-[11px] text-slate-500">
                Platform usage is governed by the{' '}
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
          <Terminal className="w-3.5 h-3.5 text-slate-600" />
          <span>JWT Bearer Auth &bull; Bcrypt Salted Hashes &bull; Zero External Telemetry</span>
        </div>
      </div>
    </div>
  );
}
