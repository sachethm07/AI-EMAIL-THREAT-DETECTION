import React from 'react';
import { Shield, ShieldAlert, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function ScoreGauge({ score = 0, level = 'Low', verdict = 'legitimate', size = 'normal' }) {
  const getColors = (lvl) => {
    switch (lvl?.toLowerCase()) {
      case 'critical':
        return {
          bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
          gauge: '#f43f5e',
          text: 'text-rose-400',
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          icon: ShieldAlert,
        };
      case 'high':
        return {
          bg: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
          gauge: '#f97316',
          text: 'text-orange-400',
          badge: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
          icon: AlertTriangle,
        };
      case 'medium':
        return {
          bg: 'bg-sky-500/10 border-sky-500/30 text-sky-400',
          gauge: '#0284c7',
          text: 'text-sky-400',
          badge: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
          icon: AlertTriangle,
        };
      default:
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          gauge: '#10b981',
          text: 'text-emerald-400',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          icon: ShieldCheck,
        };
    }
  };

  const c = getColors(level);
  const Icon = c.icon;

  // Circumference calculation for circular gauge
  const radius = size === 'large' ? 44 : 32;
  const stroke = size === 'large' ? 8 : 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border ${c.bg}`}>
      <div className="relative flex items-center justify-center">
        <svg className={size === 'large' ? 'w-28 h-28 -rotate-90' : 'w-20 h-20 -rotate-90'}>
          <circle
            cx={size === 'large' ? '56' : '40'}
            cy={size === 'large' ? '56' : '40'}
            r={radius}
            stroke="currentColor"
            strokeWidth={stroke}
            fill="transparent"
            className="text-slate-200 dark:text-slate-800 transition-colors"
          />
          <circle
            cx={size === 'large' ? '56' : '40'}
            cy={size === 'large' ? '56' : '40'}
            r={radius}
            stroke={c.gauge}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className={`font-bold font-mono tracking-tight ${size === 'large' ? 'text-3xl' : 'text-xl'} ${c.text}`}>
            {score}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">/ 100</span>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Icon className={`w-5 h-5 ${c.text}`} />
          <span className={`px-2 py-0.5 text-xs font-semibold rounded-md border ${c.badge}`}>
            {level?.toUpperCase()} RISK
          </span>
          <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 capitalize font-mono">
            {verdict}
          </span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          {score >= 75
            ? 'Critical malicious indicators detected. High probability of deceptive threat or exploit.'
            : score >= 50
            ? 'High-risk anomalies, spoofing indicators, or credential harvesting signals present.'
            : score >= 25
            ? 'Medium risk: promotional/spam attributes or minor header inconsistency found.'
            : 'Low risk: headers, content, and authentication pass baseline security heuristics.'}
        </p>
      </div>
    </div>
  );
}
