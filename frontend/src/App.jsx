import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import Navbar from './components/Navbar';
import DashboardView from './views/DashboardView';
import SubmitView from './views/SubmitView';
import CaseDetailView from './views/CaseDetailView';
import ReportView from './views/ReportView';
import CasesView from './views/CasesView';
import IntelView from './views/IntelView';
import LoginPage from './views/LoginPage';
import SignupPage from './views/SignupPage';
import { ShieldCheck, Info, Sparkles, LogIn, UserPlus } from 'lucide-react';
import iconSvg from './assets/sentinmail-icon.svg';

function MainApp() {
  const { user, loading, quickDemoLogin } = useAuth();
  const { isDark } = useTheme();
  const [currentView, setView] = useState('dashboard');
  const [selectedCaseId, setSelectedCaseId] = useState(null);

  const handleSelectCase = (caseId) => {
    setSelectedCaseId(caseId);
    setView('case_detail');
  };

  const handleOpenReport = (caseId) => {
    setSelectedCaseId(caseId);
    setView('report');
  };

  const handleAnalysisComplete = (newCaseId) => {
    setSelectedCaseId(newCaseId);
    setView('case_detail');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-xs font-mono text-violet-500 dark:text-violet-300/70 tracking-wider uppercase">Initializing SentinMail Engine...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] flex flex-col selection:bg-violet-500/30 selection:text-violet-200 transition-colors duration-200">
      <Navbar
        currentView={currentView}
        setView={setView}
        onSelectCase={handleSelectCase}
      />

      {/* Guest Evaluation Banner if not logged in and not already on auth pages */}
      {!user && currentView !== 'login' && currentView !== 'signup' && (
        <div className="bg-gradient-to-r from-violet-100 via-purple-50 to-slate-100 dark:from-[#17102b] dark:via-[#120c22] dark:to-[#0c0915] border-b border-violet-200 dark:border-violet-900/40 px-4 py-2.5 transition-colors">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-violet-950 dark:text-violet-200">
              <Sparkles className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
              <span>
                <strong className="text-violet-900 dark:text-violet-100">Guest Evaluation Mode:</strong> You are browsing in read-only guest mode. Sign in or register an analyst account to submit email payloads.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setView('login')}
                className="px-2.5 py-1 rounded-md bg-white dark:bg-[#18122d] hover:bg-violet-50 dark:hover:bg-violet-950/60 text-violet-800 dark:text-violet-200 border border-violet-200 dark:border-violet-800/40 font-semibold transition text-[11px] flex items-center gap-1 shadow-sm"
              >
                <LogIn className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                Sign In
              </button>
              <button
                onClick={() => setView('signup')}
                className="px-2.5 py-1 rounded-md bg-violet-100 dark:bg-[#20173c] hover:bg-violet-200 dark:hover:bg-violet-900/50 text-violet-900 dark:text-violet-200 border border-violet-300 dark:border-violet-700/50 font-semibold transition text-[11px] flex items-center gap-1 shadow-sm"
              >
                <UserPlus className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                Sign Up
              </button>
              <button
                onClick={() => quickDemoLogin('admin')}
                className="px-3 py-1 rounded-md bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition whitespace-nowrap shadow-sm text-[11px]"
              >
                1-Click Demo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'login' && (
          <LoginPage
            onNavigateSignup={() => setView('signup')}
            onNavigateDashboard={() => setView('dashboard')}
            onLoginSuccess={() => setView('dashboard')}
          />
        )}

        {currentView === 'signup' && (
          <SignupPage
            onNavigateLogin={() => setView('login')}
            onNavigateDashboard={() => setView('dashboard')}
            onSignupSuccess={() => setView('dashboard')}
          />
        )}

        {currentView === 'dashboard' && (
          <DashboardView
            onSelectCase={handleSelectCase}
            onNavigateSubmit={() => {
              if (!user) {
                setView('login');
              } else {
                setView('analyze');
              }
            }}
          />
        )}

        {currentView === 'analyze' && (
          user ? (
            <SubmitView onAnalysisComplete={handleAnalysisComplete} />
          ) : (
            <LoginPage
              onNavigateSignup={() => setView('signup')}
              onNavigateDashboard={() => setView('dashboard')}
              onLoginSuccess={() => setView('analyze')}
            />
          )
        )}

        {currentView === 'cases' && (
          <CasesView onSelectCase={handleSelectCase} />
        )}

        {currentView === 'intel' && <IntelView />}

        {currentView === 'case_detail' && (
          <CaseDetailView
            caseId={selectedCaseId}
            onBack={() => setView('dashboard')}
            onOpenReport={handleOpenReport}
          />
        )}

        {currentView === 'report' && (
          <ReportView
            caseId={selectedCaseId}
            onBack={() => setView('case_detail')}
          />
        )}
      </main>

      {/* Global Forensic Notice Footer */}
      <footer className="border-t border-slate-200 dark:border-[#231a3f] bg-slate-50/90 dark:bg-[#0c0915]/95 py-6 text-xs text-slate-500 dark:text-violet-300/60 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={iconSvg} alt="SentinMail" className="w-4 h-4 object-contain" />
            <span className="font-semibold text-slate-700 dark:text-violet-200">SentinMail Decision-Support Platform</span>
            <span>&bull;</span>
            <span className="text-slate-500 dark:text-violet-300/70">AI Threat Detection & Forensic Geolocation</span>
          </div>
          <div className="text-center md:text-right text-[11px] text-slate-400 dark:text-violet-300/50 max-w-md">
            This platform is an investigative decision-support system. Geolocation and threat scores indicate contextual network anomalies and should not be treated as conclusive attribution without corroborating investigation.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
