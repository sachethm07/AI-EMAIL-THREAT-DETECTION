import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Mail,
  Activity,
  Search,
  ExternalLink,
  RefreshCw,
  TrendingUp,
  Radio,
  FileText,
  Filter,
  Server,
  Cpu,
  Globe,
  Sparkles,
  Clock,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Database,
} from 'lucide-react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import HopMap from '../components/HopMap';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement
);

/**
 * Animated number counter hook with cubic ease-out and prefers-reduced-motion check
 */
function useCountUp(endValue, duration = 1100) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const end = typeof endValue === 'number' && !isNaN(endValue) ? endValue : 0;

    // Respect user's motion preference
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCount(end);
      return;
    }

    if (end === 0) {
      setCount(0);
      return;
    }

    let startTimestamp = null;
    let animationFrameId;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic: 1 - (1 - t)^3
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(end * easeOut));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [endValue, duration]);

  return count;
}

export default function DashboardView({ onSelectCase, onNavigateSubmit }) {
  const { user, quickDemoLogin } = useAuth();
  const { isDark } = useTheme();
  const [stats, setStats] = useState(null);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterLevel, setFilterLevel] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, casesData] = await Promise.all([
        api.getStats(),
        api.getCases({ limit: 15, level: filterLevel || undefined, q: searchQuery || undefined }),
      ]);
      setStats(statsData);
      setCases(casesData?.items || []);
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Error loading dashboard telemetry:', err);
      setError(err.message || 'Unable to connect to SentinMail backend service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterLevel, searchQuery]);

  const total = stats?.total || 0;
  const critical = stats?.by_level?.Critical || 0;
  const high = stats?.by_level?.High || 0;
  const medium = stats?.by_level?.Medium || 0;
  const low = stats?.by_level?.Low || 0;

  const maliciousCount = (stats?.by_verdict?.malicious || 0) + (stats?.by_verdict?.phishing || 0);
  const threatRate = total > 0 ? Math.round((maliciousCount / total) * 100) : 0;

  // Animated values
  const animatedTotal = useCountUp(total, 900);
  const animatedCritical = useCountUp(critical, 900);
  const animatedThreatRate = useCountUp(threatRate, 1000);
  const animatedLow = useCountUp(low, 900);

  // Chart data: Risk levels doughnut in laboratory styling
  const riskChartData = useMemo(() => ({
    labels: ['Critical', 'High', 'Medium', 'Low'],
    datasets: [
      {
        data: [critical, high, medium, low],
        backgroundColor: [
          '#f43f5e', // Critical (Red)
          '#f59e0b', // High (Amber)
          '#eab308', // Medium (Yellow)
          '#10b981', // Low (Emerald)
        ],
        hoverBackgroundColor: ['#fb7185', '#fbbf24', '#fde047', '#34d399'],
        borderColor: isDark ? '#130e23' : '#ffffff',
        borderWidth: 3,
        hoverOffset: 6,
      },
    ],
  }), [critical, high, medium, low, isDark]);

  // Chart data: 7-day trend with electric violet & lavender bars
  const trendLabels = useMemo(() => (stats?.last_7_days || []).map((d) => d.date?.slice(5) || ''), [stats]);
  const trendCounts = useMemo(() => (stats?.last_7_days || []).map((d) => d.count || 0), [stats]);

  const trendChartData = useMemo(() => ({
    labels: trendLabels.length ? trendLabels : ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Today'],
    datasets: [
      {
        label: 'Payloads Ingested',
        data: trendCounts.length ? trendCounts : [0, 0, 0, 0, 0, 0, total],
        backgroundColor: 'rgba(139, 92, 246, 0.75)',
        hoverBackgroundColor: '#a855f7',
        borderColor: '#8b5cf6',
        borderWidth: 1,
        borderRadius: 5,
        maxBarThickness: 32,
      },
    ],
  }), [trendLabels, trendCounts, total]);

  // Extract map points for global activity map
  const mapHops = useMemo(() => (stats?.map_points || []).map((pt, i) => ({
    order: i + 1,
    ip: `Relay Node ${pt.city || 'Transit'}`,
    geo: {
      lat: pt.lat,
      lon: pt.lon,
      city: pt.city,
      country: 'Observed Relay Hub',
      org: `${pt.count} observed routing hops`,
      source: 'Forensic Header Telemetry',
    },
  })), [stats]);

  return (
    <div className="space-y-6">
      {/* Hero: SOC Live Command Center / Violet Cyber Laboratory Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#140e28] via-[#1a1236] to-[#120a22] border border-[#2e2354] p-6 shadow-2xl shadow-violet-950/30 moving-gradient-hero">
        {/* Subtle Cyber Grid Background Texture */}
        <div className="absolute inset-0 cyber-grid-pattern opacity-40 pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-950/80 border border-violet-500/40 text-violet-300 text-xs font-semibold tracking-wider uppercase font-mono shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/80" />
                Live SOC Command Center // Forensic Lab
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#18122d] border border-violet-900/40 text-violet-300/80 text-[11px] font-mono">
                <Clock className="w-3 h-3 text-violet-400" />
                {lastRefreshed ? `Sync: ${lastRefreshed}` : 'Connecting...'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Email Threat Detection & Forensics Station
            </h1>

            <p className="text-xs sm:text-sm text-violet-200/70 max-w-2xl leading-relaxed">
              Autonomous RFC 5322 packet parsing, linguistic deception detection, cryptographic evidence chain verification, and global routing hop telemetry.
            </p>
          </div>

          {/* Right Section: Tactical Radar Sweep Widget + Actions */}
          <div className="flex items-center gap-4 self-start lg:self-auto shrink-0">
            {/* Tactical Radar Sweep Widget */}
            <div className="hidden sm:flex items-center gap-3 bg-[#0d0918]/80 border border-violet-800/40 px-3.5 py-2.5 rounded-xl shadow-inner backdrop-blur-sm">
              <div className="relative w-11 h-11 rounded-full bg-[#160f2b] border border-violet-500/40 flex items-center justify-center overflow-hidden">
                {/* Concentric rings */}
                <div className="absolute inset-1.5 rounded-full border border-violet-500/20" />
                <div className="absolute inset-3.5 rounded-full border border-violet-500/30" />
                {/* Crosshairs */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-[1px] bg-violet-500/20" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-full w-[1px] bg-violet-500/20" />
                </div>
                {/* Rotating Conic Radar Sweep Beam */}
                <div
                  className="radar-scanner absolute inset-0 rounded-full"
                  style={{
                    background:
                      'conic-gradient(from 0deg, transparent 0deg, transparent 270deg, rgba(139, 92, 246, 0.15) 310deg, rgba(168, 85, 247, 0.75) 360deg)',
                  }}
                />
                {/* Center Core Dot */}
                <div className="relative z-10 w-2 h-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/80" />
              </div>
              <div className="text-left font-mono">
                <div className="text-[10px] text-violet-400 uppercase tracking-widest font-semibold flex items-center gap-1">
                  <Radio className="w-3 h-3 text-cyan-400" />
                  Telemetry
                </div>
                <div className="text-xs font-bold text-white tracking-tight">Active Sensor</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={onNavigateSubmit}
                className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-cyan-500/25 transition-all duration-200 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none"
              >
                <Mail className="w-4 h-4" />
                Analyze New Email
              </button>

              <button
                onClick={loadData}
                disabled={loading}
                className="p-2.5 rounded-xl bg-[#1d1538] hover:bg-violet-900/40 text-violet-200 border border-violet-700/40 transition-all duration-200 hover:border-violet-500/60 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
                title="Refresh forensic metrics"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Backend Error State (Honest unavailable notification) */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center justify-between flex-wrap gap-3 shadow-lg">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <span className="font-bold text-rose-200">Backend Communication Warning: </span>
              {error}
              {error.toLowerCase().includes('sign in') && (
                <span className="text-slate-300 block sm:inline sm:ml-1 mt-0.5 sm:mt-0">
                  — Click <strong>1-Click Demo</strong> or <strong>Sign In</strong> at the top to access full analyst privileges.
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {error.toLowerCase().includes('sign in') && (
              <button
                onClick={async () => {
                  try {
                    await quickDemoLogin('admin');
                    await loadData();
                  } catch (e) {
                    console.error(e);
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition text-xs shadow-sm"
              >
                1-Click Demo Login
              </button>
            )}
            <button
              onClick={loadData}
              className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 font-semibold transition"
            >
              Retry Connection
            </button>
          </div>
        </div>
      )}

      {/* Animated Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Evaluated */}
        <div className="bg-[#130e23] border border-[#2b204e] rounded-xl p-5 shadow-lg shadow-violet-950/20 transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-500/50 hover:shadow-violet-950/40 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-violet-300/80 uppercase tracking-wider font-mono">
              Total Ingested
            </span>
            <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20 group-hover:border-violet-500/40 transition">
              <Mail className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-white tracking-tight">
              {animatedTotal}
            </span>
            <span className="text-xs text-violet-300/60 font-mono">cases</span>
          </div>
          <div className="mt-2 pt-2 border-t border-[#231a3f] flex items-center justify-between text-[11px] text-violet-300/70">
            <span>Archived investigations</span>
            <span className="text-emerald-400 font-mono flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Hashed
            </span>
          </div>
        </div>

        {/* Card 2: Critical Threats */}
        <div
          className={`bg-[#130e23] border rounded-xl p-5 shadow-lg transition-all duration-300 hover:-translate-y-0.5 group ${
            critical > 0
              ? 'border-rose-500/40 shadow-rose-950/30 ring-1 ring-rose-500/20'
              : 'border-[#2b204e] hover:border-rose-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-300/90 uppercase tracking-wider font-mono">
              Critical Threats
            </span>
            <div className="p-2 rounded-lg bg-rose-500/15 text-rose-400 border border-rose-500/30 group-hover:scale-105 transition">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-rose-400 tracking-tight">
              {animatedCritical}
            </span>
            <span className="text-xs text-rose-400/80 font-medium font-mono">Score ≥ 75</span>
          </div>
          <div className="mt-2 pt-2 border-t border-[#231a3f] flex items-center justify-between text-[11px] text-violet-300/70">
            <span>Exploits & active attacks</span>
            <span className={`font-mono font-bold ${critical > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-500'}`}>
              {critical > 0 ? 'Action Required' : '0 Pending'}
            </span>
          </div>
        </div>

        {/* Card 3: Deceptive Ratio */}
        <div className="bg-[#130e23] border border-[#2b204e] rounded-xl p-5 shadow-lg shadow-violet-950/20 transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-500/40 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-300/90 uppercase tracking-wider font-mono">
              Deceptive Ratio
            </span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:border-amber-500/40 transition">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-amber-400 tracking-tight">
              {animatedThreatRate}%
            </span>
            <span className="text-xs text-amber-300/70 font-mono">deceptive traffic</span>
          </div>
          <div className="mt-2 pt-2 border-t border-[#231a3f] space-y-1">
            <div className="flex justify-between text-[11px] text-violet-300/70">
              <span>Phishing / Malicious share</span>
              <span className="font-mono text-slate-300">{maliciousCount}/{total}</span>
            </div>
            <div className="w-full bg-[#1e1638] rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-amber-400 h-1.5 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${Math.min(threatRate, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 4: Clean / Legitimate */}
        <div className="bg-[#130e23] border border-[#2b204e] rounded-xl p-5 shadow-lg shadow-violet-950/20 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-500/40 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-300/90 uppercase tracking-wider font-mono">
              Clean / Verified
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:border-emerald-500/40 transition">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-emerald-400 tracking-tight">
              {animatedLow}
            </span>
            <span className="text-xs text-emerald-400/80 font-medium font-mono">Score &lt; 25</span>
          </div>
          <div className="mt-2 pt-2 border-t border-[#231a3f] flex items-center justify-between text-[11px] text-violet-300/70">
            <span>Passed authenticity checks</span>
            <span className="text-emerald-400 font-mono font-medium">SPF/DKIM OK</span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Row: 3 Laboratory Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Threat Risk Classification (Doughnut) */}
        <div className="bg-[#130e23] border border-[#2b204e] rounded-xl p-5 shadow-lg shadow-violet-950/20 flex flex-col justify-between transition-all duration-300 hover:border-violet-500/40">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-violet-400" />
                Risk Severity Spectrum
              </h3>
              <span className="text-[11px] font-mono text-violet-300/60 uppercase">
                {total} cases
              </span>
            </div>
            <p className="text-xs text-violet-200/60 mb-4">
              Classification of investigated emails by forensic threat index
            </p>

            <div className="relative h-52 flex items-center justify-center">
              {total > 0 ? (
                <>
                  <Doughnut
                    data={riskChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      animation: {
                        animateScale: true,
                        animateRotate: true,
                        duration: 1100,
                      },
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          backgroundColor: isDark ? '#16102a' : '#ffffff',
                          titleColor: isDark ? '#c4b5fd' : '#475569',
                          bodyColor: isDark ? '#f1edfa' : '#0f172a',
                          borderColor: isDark ? '#4a387d' : '#e2e8f0',
                          borderWidth: 1,
                          padding: 10,
                          boxPadding: 4,
                          callbacks: {
                            label: (ctx) => ` ${ctx.label}: ${ctx.raw} cases`,
                          },
                        },
                      },
                      cutout: '72%',
                    }}
                  />
                  {/* Inner Donut Center Content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                    <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white tracking-tight">
                      {total}
                    </span>
                    <span className="text-[10px] uppercase font-mono text-violet-700 dark:text-violet-300/70 tracking-wider">
                      Payloads
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-center text-xs text-slate-500 py-8">
                  <Database className="w-8 h-8 text-violet-900/40 mx-auto mb-2" />
                  No telemetry recorded yet.
                </div>
              )}
            </div>
          </div>

          {/* Custom Formatted Legend Strip */}
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#231a3f] mt-2 text-xs font-mono">
            <div className="flex items-center justify-between p-1.5 rounded bg-[#17112c] border border-rose-500/20">
              <span className="flex items-center gap-1.5 text-rose-300 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> Critical
              </span>
              <span className="font-bold text-white text-[11px]">{critical}</span>
            </div>
            <div className="flex items-center justify-between p-1.5 rounded bg-[#17112c] border border-amber-500/20">
              <span className="flex items-center gap-1.5 text-amber-300 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> High
              </span>
              <span className="font-bold text-white text-[11px]">{high}</span>
            </div>
            <div className="flex items-center justify-between p-1.5 rounded bg-[#17112c] border border-yellow-500/20">
              <span className="flex items-center gap-1.5 text-yellow-300 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-yellow-500" /> Medium
              </span>
              <span className="font-bold text-white text-[11px]">{medium}</span>
            </div>
            <div className="flex items-center justify-between p-1.5 rounded bg-[#17112c] border border-emerald-500/20">
              <span className="flex items-center gap-1.5 text-emerald-300 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Low
              </span>
              <span className="font-bold text-white text-[11px]">{low}</span>
            </div>
          </div>
        </div>

        {/* Column 2: 7-Day Activity Trend (Bar Chart) */}
        <div className="bg-[#130e23] border border-[#2b204e] rounded-xl p-5 shadow-lg shadow-violet-950/20 flex flex-col justify-between transition-all duration-300 hover:border-violet-500/40">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                Forensic Intake Timeline
              </h3>
              <span className="text-[11px] font-mono text-violet-300/60 uppercase">
                7-Day Activity
              </span>
            </div>
            <p className="text-xs text-violet-200/60 mb-4">
              Daily frequency of analyzed email artifacts across the lab
            </p>

            <div className="h-52 flex items-center justify-center">
              <Bar
                data={trendChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  animation: { duration: 1100, easing: 'easeOutQuart' },
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      backgroundColor: isDark ? '#16102a' : '#ffffff',
                      titleColor: isDark ? '#c4b5fd' : '#475569',
                      bodyColor: isDark ? '#f1edfa' : '#0f172a',
                      borderColor: isDark ? '#4a387d' : '#e2e8f0',
                      borderWidth: 1,
                      padding: 10,
                      callbacks: {
                        label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw} emails`,
                      },
                    },
                  },
                  scales: {
                    x: {
                      ticks: { color: isDark ? '#a78bfa' : '#64748b', font: { size: 10, family: 'monospace' } },
                      grid: { display: false },
                    },
                    y: {
                      ticks: {
                        color: isDark ? '#a78bfa' : '#64748b',
                        font: { size: 10, family: 'monospace' },
                        precision: 0,
                      },
                      grid: { color: isDark ? 'rgba(139, 92, 246, 0.08)' : 'rgba(148, 163, 184, 0.2)' },
                    },
                  },
                }}
              />
            </div>
          </div>

          <div className="pt-3 border-t border-[#231a3f] mt-2 flex items-center justify-between text-xs text-violet-300/70 font-mono">
            <span>Continuous Ingestion Engine</span>
            <span className="text-cyan-400 font-semibold">Active Monitoring</span>
          </div>
        </div>

        {/* Column 3: Verdict Breakdown & Top Relay Geo */}
        <div className="bg-[#130e23] border border-[#2b204e] rounded-xl p-5 shadow-lg shadow-violet-950/20 flex flex-col justify-between transition-all duration-300 hover:border-violet-500/40">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Radio className="w-4 h-4 text-violet-400" />
                AI Verdict Distribution
              </h3>
              <span className="text-[11px] font-mono text-violet-300/60 uppercase">
                ML Pipeline
              </span>
            </div>
            <p className="text-xs text-violet-200/60 mb-4">
              Calibrated model predictions & heuristic detection rules
            </p>

            <div className="space-y-3">
              {[
                { label: 'Legitimate', count: stats?.by_verdict?.legitimate || 0, color: 'bg-emerald-500', text: 'text-emerald-400', barBg: 'bg-emerald-950/40' },
                { label: 'Spam', count: stats?.by_verdict?.spam || 0, color: 'bg-yellow-500', text: 'text-yellow-400', barBg: 'bg-yellow-950/40' },
                { label: 'Phishing', count: stats?.by_verdict?.phishing || 0, color: 'bg-amber-500', text: 'text-amber-400', barBg: 'bg-amber-950/40' },
                { label: 'Malicious', count: stats?.by_verdict?.malicious || 0, color: 'bg-rose-500', text: 'text-rose-400', barBg: 'bg-rose-950/40' },
              ].map((item) => {
                const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
                return (
                  <div key={item.label} className="text-xs space-y-1">
                    <div className="flex justify-between items-center font-mono">
                      <span className="text-slate-200 font-medium">{item.label}</span>
                      <span className={`font-bold ${item.text}`}>{item.count} ({pct}%)</span>
                    </div>
                    <div className={`w-full ${item.barBg} rounded-full h-1.5 overflow-hidden border border-slate-800/60`}>
                      <div
                        className={`${item.color} h-1.5 rounded-full transition-all duration-700 ease-out`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-[#231a3f] mt-4 text-[11px] text-violet-300/70 space-y-1">
            <div className="font-semibold text-slate-300 flex items-center gap-1 font-mono">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              Observed Origin/Relay Countries:
            </div>
            <div className="font-mono text-slate-300 truncate">
              {(stats?.top_countries || []).slice(0, 3).map((c) => `${c.country || 'Unknown'} (${c.count})`).join(', ') || 'No public geolocation records'}
            </div>
          </div>
        </div>
      </div>

      {/* Global Intermediate Relay Hop Map */}
      <HopMap hops={mapHops} title="Global Observed Intermediate Mail Relays & Transit Infrastructure" />

      {/* Recent Forensic Investigations Table Card */}
      <div className="bg-[#130e23] border border-[#2b204e] rounded-xl overflow-hidden shadow-xl shadow-violet-950/20 transition-all duration-300 hover:border-violet-500/40">
        {/* Table Filter & Search Header */}
        <div className="p-4 border-b border-[#2b204e] bg-[#16102a] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm tracking-wide">Recent Threat Investigations</h3>
              <p className="text-[11px] text-violet-300/60 font-mono">
                Showing {cases.length} forensic investigation records
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Risk Tier Filter Pills */}
            <div className="flex items-center bg-[#0d0918] rounded-lg p-1 border border-[#2b204e] text-xs font-mono">
              {['', 'Critical', 'High', 'Medium', 'Low'].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setFilterLevel(lvl)}
                  className={`px-3 py-1 rounded-md transition-all duration-200 text-xs ${
                    filterLevel === lvl
                      ? 'bg-violet-600 text-white font-bold shadow-sm shadow-violet-900/50'
                      : 'text-violet-300/70 hover:text-white hover:bg-violet-950/40'
                  }`}
                >
                  {lvl || 'All Tiers'}
                </button>
              ))}
            </div>

            {/* Live Search Input */}
            <div className="relative flex-1 md:w-64">
              <Search className="w-3.5 h-3.5 text-violet-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search subject or sender..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0d0918] border border-[#2b204e] rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-violet-400/50 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition font-mono"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
                >
                  &times;
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0e091b] border-b border-[#2b204e] text-violet-300/70 font-mono uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4">Subject & Email Header</th>
                <th className="py-3 px-4">Sender Address</th>
                <th className="py-3 px-4">Risk Level</th>
                <th className="py-3 px-4">Score</th>
                <th className="py-3 px-4">AI Verdict</th>
                <th className="py-3 px-4">Analyzed</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#231a3f]/70 font-sans">
              {loading && cases.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-10 text-center text-violet-300/60 font-mono">
                    <div className="w-7 h-7 border-2 border-violet-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Querying forensic investigation archive...
                  </td>
                </tr>
              ) : cases.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-violet-300/60">
                    <div className="max-w-sm mx-auto space-y-2">
                      <FileText className="w-8 h-8 text-violet-400/40 mx-auto" />
                      <p className="font-semibold text-slate-300 text-sm">No Matching Investigations Found</p>
                      <p className="text-xs text-violet-300/60">
                        {searchQuery || filterLevel
                          ? 'Try clearing your search query or tier filters to show archived records.'
                          : 'No email messages analyzed yet. Submit an RFC 5322 payload to generate the first forensic report.'}
                      </p>
                      <button
                        onClick={searchQuery || filterLevel ? () => { setSearchQuery(''); setFilterLevel(''); } : onNavigateSubmit}
                        className="mt-3 px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition inline-flex items-center gap-1.5"
                      >
                        {searchQuery || filterLevel ? 'Clear Search & Filters' : 'Analyze First Email'}
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                cases.map((c) => {
                  const badgeColor =
                    c.level === 'Critical'
                      ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                      : c.level === 'High'
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      : c.level === 'Medium'
                      ? 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30'
                      : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-violet-950/25 transition-colors duration-150 cursor-pointer group"
                      onClick={() => onSelectCase(c.id)}
                    >
                      <td className="py-3 px-4 font-medium text-slate-200 max-w-xs truncate group-hover:text-cyan-300 transition-colors">
                        {c.subject || '(No Subject Line)'}
                      </td>
                      <td className="py-3 px-4 text-violet-200/80 font-mono text-[11px] max-w-xs truncate">
                        {c.from || 'Unknown Sender'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase font-mono ${badgeColor}`}>
                          {c.level}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-extrabold text-white">
                        <span className={c.score >= 75 ? 'text-rose-400' : c.score >= 50 ? 'text-amber-400' : 'text-slate-200'}>
                          {c.score}
                        </span>
                        <span className="text-slate-500 text-[10px]">/100</span>
                      </td>
                      <td className="py-3 px-4 capitalize font-medium text-slate-300">
                        {c.verdict}
                      </td>
                      <td className="py-3 px-4 text-violet-300/60 font-mono text-[11px]">
                        {c.created_at ? new Date(c.created_at).toLocaleString() : '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCase(c.id);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#20173c] hover:bg-cyan-500 hover:text-slate-950 text-violet-200 transition font-semibold text-xs border border-violet-800/40"
                        >
                          <Eye className="w-3 h-3" />
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
