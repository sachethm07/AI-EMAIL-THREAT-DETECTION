import React from 'react';
import { Shield, Mail, Database, Activity, Cpu, LogOut, User, Sparkles, FolderArchive, Radio, LogIn, UserPlus, Sun, Moon, KeyRound, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import AlertDropdown from './AlertDropdown';
import logoDarkSvg from '../assets/sentinmail-logo-dark.svg';
import logoLightSvg from '../assets/sentinmail-logo.svg';
import iconSvg from '../assets/sentinmail-icon.svg';

export default function Navbar({ currentView, setView, onSelectCase }) {
  const { user, logout, quickDemoLogin } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'analyze', label: 'Analyze Threat', icon: Mail },
    { id: 'cases', label: 'Investigations', icon: FolderArchive },
    { id: 'intel', label: 'Threat Intel', icon: Radio },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[var(--nav-bg)] backdrop-blur-md border-b border-[var(--nav-border)] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand with SentinMail Vector SVG */}
          <div
            className="flex items-center gap-3 cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-lg py-1 px-1 -ml-1 transition"
            onClick={() => setView('dashboard')}
            title="SentinMail - Live Forensic Intelligence Dashboard"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setView('dashboard');
            }}
          >
            {/* Desktop / Tablet: Full Wordmark Logo SVG (Adaptive Vector: light vs dark) */}
            <img
              src={isDark ? logoDarkSvg : logoLightSvg}
              alt="SentinMail - Email Threat Intelligence"
              className="hidden sm:block h-10 w-auto object-contain transition-all duration-200 group-hover:scale-[1.02] filter drop-shadow-[0_2px_8px_rgba(128,53,245,0.2)]"
            />

            {/* Mobile View (<640px): Compact Shield Icon + Sharp Wordmark */}
            <div className="flex sm:hidden items-center gap-2">
              <img
                src={iconSvg}
                alt="SentinMail Icon"
                className="w-9 h-9 object-contain shrink-0 filter drop-shadow-[0_2px_6px_rgba(128,53,245,0.25)]"
              />
              <div className="flex flex-col">
                <span className="font-extrabold tracking-tight text-base text-slate-900 dark:text-white leading-tight">
                  Sentin<span className="text-cyan-600 dark:text-cyan-400">Mail</span>
                </span>
                <span className="text-[9px] text-violet-700 dark:text-violet-300/70 font-mono tracking-wider uppercase -mt-0.5">
                  Threat Intel
                </span>
              </div>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setView(item.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    isActive
                      ? 'bg-violet-500/15 text-violet-900 dark:text-violet-200 border border-violet-500/35 shadow-sm shadow-violet-950/20'
                      : 'text-slate-600 dark:text-violet-300/70 hover:text-slate-950 dark:hover:text-white hover:bg-violet-100 dark:hover:bg-violet-950/30'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-600 dark:text-cyan-400' : 'text-violet-600 dark:text-violet-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right section: System Badges, Theme Toggle, Alerts, User Profile */}
          <div className="flex items-center gap-2.5">
            {/* System Status Badges */}
            <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono">
              <span
                onClick={() => setView('intel')}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-[#140e28] border border-slate-200 dark:border-[#2b204e] text-emerald-700 dark:text-emerald-400 cursor-pointer hover:border-emerald-500/50 transition"
                title="View AI / ML model & active pipeline"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                ML Engine
              </span>
              <span
                onClick={() => setView('intel')}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-[#140e28] border border-slate-200 dark:border-[#2b204e] text-cyan-700 dark:text-cyan-400 cursor-pointer hover:border-cyan-500/50 transition"
                title="View database & service connectors"
              >
                <Database className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                SQLite/Mongo
              </span>
            </div>

            {/* Accessible Theme Toggle (Light / Dark) */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#140e28] dark:hover:bg-[#1a1236] border border-slate-200 dark:border-[#2b204e] text-slate-700 dark:text-violet-300 hover:text-slate-950 dark:hover:text-cyan-300 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 flex items-center justify-center relative group"
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              role="switch"
              aria-checked={isDark}
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 group-hover:rotate-45" />
              ) : (
                <Moon className="w-4 h-4 text-violet-700 transition-transform duration-300 group-hover:-rotate-12" />
              )}
              <span className="sr-only">
                {isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              </span>
            </button>

            {/* Alert dropdown */}
            <AlertDropdown onSelectCase={onSelectCase} />

            {/* User Profile / Quick demo button */}
            {user ? (
              <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200 dark:border-[#2b204e]">
                <div className="hidden sm:block text-right">
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">{user.name || user.email}</div>
                  <div className="flex items-center justify-end gap-1 text-[10px]">
                    <span className="px-1.5 py-0.2 rounded bg-violet-100 dark:bg-[#1a1236] text-cyan-700 dark:text-cyan-400 border border-violet-200 dark:border-violet-800/40 capitalize font-mono">
                      {user.role}
                    </span>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="p-2 rounded-lg bg-slate-100 dark:bg-[#140e28] border border-slate-200 dark:border-[#2b204e] text-slate-600 dark:text-violet-300 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-300 dark:hover:border-rose-900/50 transition"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setView('login')}
                  className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition border ${
                    currentView === 'login'
                      ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/40 shadow-sm'
                      : 'text-slate-700 dark:text-violet-200 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-violet-950/40 border-slate-200 dark:border-[#2b204e]'
                  }`}
                  title="Threat Analyst & Auditor Workspace Sign In"
                >
                  <LogIn className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  <span>Analyst Sign In</span>
                </button>

                <button
                  onClick={() => setView('admin_login')}
                  className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition border ${
                    currentView === 'admin_login'
                      ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/40 shadow-sm'
                      : 'text-amber-800 dark:text-amber-300 hover:text-amber-950 dark:hover:text-amber-200 hover:bg-amber-50 dark:hover:bg-amber-950/30 border-amber-300/60 dark:border-amber-700/40'
                  }`}
                  title="Restricted Administrator Security Console"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Admin Portal</span>
                </button>

                <button
                  onClick={() => setView('signup')}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-violet-100 dark:bg-[#1d1538] hover:bg-violet-200 dark:hover:bg-violet-900/40 text-violet-900 dark:text-violet-200 border border-violet-200 dark:border-violet-700/40 transition"
                >
                  <UserPlus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Sign Up
                </button>

                <button
                  onClick={() => quickDemoLogin('analyst')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/25 transition"
                  title="Instant 1-Click Analyst Evaluation"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Quick Demo</span>
                  <span className="md:hidden">Demo</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden border-t border-slate-200 dark:border-[#231a3f] py-2 gap-1 overflow-x-auto items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                  isActive
                    ? 'bg-violet-500/15 text-violet-900 dark:text-violet-200 border border-violet-500/35'
                    : 'text-slate-600 dark:text-violet-300/70 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-600 dark:text-cyan-400' : 'text-violet-600 dark:text-violet-400'}`} />
                {item.label}
              </button>
            );
          })}

          {!user && (
            <div className="flex items-center gap-1 pl-2 border-l border-slate-200 dark:border-[#231a3f] shrink-0">
              <button
                onClick={() => setView('login')}
                className={`px-2.5 py-1 text-xs rounded-lg whitespace-nowrap ${
                  currentView === 'login' ? 'bg-violet-500/15 text-cyan-600 dark:text-cyan-300 border border-violet-500/30' : 'text-slate-600 dark:text-violet-300/70'
                }`}
              >
                Analyst
              </button>
              <button
                onClick={() => setView('admin_login')}
                className={`px-2.5 py-1 text-xs rounded-lg whitespace-nowrap ${
                  currentView === 'admin_login' ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30' : 'text-amber-700 dark:text-amber-300'
                }`}
              >
                Admin
              </button>
              <button
                onClick={() => setView('signup')}
                className={`px-2.5 py-1 text-xs rounded-lg whitespace-nowrap ${
                  currentView === 'signup' ? 'bg-violet-500/15 text-cyan-600 dark:text-cyan-300 border border-violet-500/30' : 'text-slate-600 dark:text-violet-300/70'
                }`}
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
