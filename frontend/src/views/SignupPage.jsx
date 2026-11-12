import React, { useState } from 'react';
import { UserPlus, Lock, Mail, User, Eye, EyeOff, ArrowRight, ArrowLeft, AlertCircle, CheckCircle2, ShieldCheck, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import iconSvg from '../assets/sentinmail-icon.svg';

export default function SignupPage({ onNavigateLogin, onNavigateDashboard, onNavigateTerms, onSignupSuccess }) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('analyst'); // 'analyst' | 'viewer'
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Password validation checks
  const isLengthValid = password.length >= 8;
  const hasNumberOrSymbol = /[0-9!@#$%^&*(),.?":{}|<>]/.test(password);
  const isMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify your confirmation password.');
      return;
    }

    if (!agreeTerms) {
      setError('You must review and agree to the Terms and Conditions to create an account.');
      return;
    }

    setSubmitting(true);
    try {
      await register(name.trim(), email.trim(), password, role, true, '2026-11-v1');
      if (onSignupSuccess) {
        onSignupSuccess();
      } else if (onNavigateDashboard) {
        onNavigateDashboard();
      }
    } catch (err) {
      setError(err.message || 'Registration failed. The email address may already be registered or invalid.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-12rem)] flex flex-col justify-center items-center py-6 px-4 sm:px-6">
      <div className="w-full max-w-lg space-y-6">
        {/* Back Link */}
        <button
          onClick={onNavigateDashboard}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 font-medium transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Live Dashboard
        </button>

        {/* Card Container */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md relative overflow-hidden">
          {/* Cyan Glow Top Border */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500"></div>

          {/* Header */}
          <div className="text-center space-y-2 mb-6">
            <div className="w-14 h-14 mx-auto flex items-center justify-center filter drop-shadow-[0_4px_12px_rgba(128,53,245,0.35)]">
              <img src={iconSvg} alt="SentinMail Icon" className="w-14 h-14 object-contain" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Create Analyst Account
            </h1>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Join the SentinMail email threat detection and forensic intelligence platform.
            </p>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Full Name */}
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                Full Name / Analyst Identity:
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Rivera (SOC Lead)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                Analyst / Institutional Email:
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@university.edu or analyst@company.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono transition"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Must be a valid RFC format email (e.g. .org, .edu, .com).
              </p>
            </div>

            {/* Role Selection Cards */}
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                Select Platform Role / Permission Tier:
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <div
                  onClick={() => setRole('analyst')}
                  className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                    role === 'analyst'
                      ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-200">Threat Analyst</span>
                    <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      role === 'analyst' ? 'border-cyan-400 bg-cyan-400' : 'border-slate-600'
                    }`}>
                      {role === 'analyst' && <Check className="w-2.5 h-2.5 text-slate-950 font-bold" />}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Full analysis: submit emails, view ML scores, inspect IoCs, and generate reports.
                  </p>
                </div>

                <div
                  onClick={() => setRole('viewer')}
                  className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                    role === 'viewer'
                      ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-200">Forensic Auditor</span>
                    <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      role === 'viewer' ? 'border-cyan-400 bg-cyan-400' : 'border-slate-600'
                    }`}>
                      {role === 'viewer' && <Check className="w-2.5 h-2.5 text-slate-950 font-bold" />}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Read-only access: review cases, telemetry graphs, and verify evidence integrity.
                  </p>
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                Password:
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-10 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Requirements Checklist */}
              {password.length > 0 && (
                <div className="flex items-center gap-3 mt-1.5 text-[10px]">
                  <span className={`flex items-center gap-1 ${isLengthValid ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <CheckCircle2 className="w-3 h-3" /> 8+ Characters
                  </span>
                  <span className={`flex items-center gap-1 ${hasNumberOrSymbol ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <CheckCircle2 className="w-3 h-3" /> Number or Symbol
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-slate-300 font-medium">
                  Confirm Password:
                </label>
                {confirmPassword.length > 0 && (
                  <span className={`text-[10px] font-semibold ${isMatch ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {isMatch ? '✓ Passwords match' : '⚠ Passwords do not match'}
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full bg-slate-950 border rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 font-mono transition ${
                    confirmPassword.length > 0 && !isMatch
                      ? 'border-amber-500/70 focus:border-amber-500 focus:ring-amber-500'
                      : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500'
                  }`}
                />
              </div>
            </div>

            {/* Terms and Conditions Required Checkbox */}
            <div className="pt-2 pb-1 border-t border-slate-800/60">
              <label
                htmlFor="terms-agreement-checkbox"
                className="flex items-start gap-2.5 cursor-pointer text-slate-300 dark:text-slate-300 text-[11px] leading-relaxed select-none"
              >
                <input
                  id="terms-agreement-checkbox"
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  required
                  aria-required="true"
                  className="mt-0.5 w-4 h-4 rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-2 focus:ring-cyan-500/50 focus:outline-none shrink-0 transition cursor-pointer"
                />
                <span>
                  I have read, understood, and agree to the{' '}
                  <button
                    type="button"
                    onClick={onNavigateTerms}
                    className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 font-semibold transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400 rounded px-0.5"
                    title="Review the complete SentinMail Terms and Conditions"
                  >
                    Terms and Conditions
                  </button>
                  , including my warranty of authorized email submission, acceptable forensic use, and decision-support scoring limits.
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || !name.trim() || !email.trim() || !isLengthValid || !isMatch || !agreeTerms}
              className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition flex items-center justify-center gap-2 mt-4"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                  <span>Registering Analyst Profile...</span>
                </>
              ) : (
                <>
                  <span>Create Account & Launch Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Navigation to Sign In */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center text-xs text-slate-400">
            Already have an analyst account?{' '}
            <button
              type="button"
              onClick={onNavigateLogin}
              className="text-cyan-400 font-bold hover:text-cyan-300 underline underline-offset-2 transition"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
