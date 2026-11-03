import React, { useState, useEffect, useRef } from 'react';
import { Bell, ShieldAlert, Check, ExternalLink } from 'lucide-react';
import { api } from '../api';

export default function AlertDropdown({ onSelectCase }) {
  const [alerts, setAlerts] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  const fetchAlerts = async () => {
    try {
      const data = await api.getAlerts(false, 15);
      setAlerts(data || []);
      setUnreadCount((data || []).filter((a) => !a.read).length);
    } catch (e) {
      // ignore if unauthenticated
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkRead = async (e, id) => {
    e.stopPropagation();
    try {
      await api.markAlertRead(id);
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition"
        title="Security Alerts"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-rose-500 text-white text-[11px] font-bold rounded-full animate-pulse shadow-md">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span className="font-semibold text-xs text-slate-200">Security Threat Alerts</span>
            </div>
            <span className="text-[11px] text-slate-400">
              {unreadCount} unread
            </span>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
            {alerts.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No high-risk threat alerts recorded.
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => {
                    if (onSelectCase) onSelectCase(alert.case_id);
                    setIsOpen(false);
                  }}
                  className={`p-3 text-xs cursor-pointer transition hover:bg-slate-800/70 flex items-start gap-3 ${
                    !alert.read ? 'bg-slate-800/30' : 'opacity-70'
                  }`}
                >
                  <span
                    className={`mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 uppercase ${
                      alert.level === 'Critical'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {alert.level}
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-200 truncate">
                      {alert.subject || '(No Subject)'}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                      <span>Score: <strong className="text-slate-200">{alert.score}/100</strong></span>
                      <span>&bull;</span>
                      <span className="capitalize">{alert.verdict}</span>
                    </div>
                  </div>

                  {!alert.read && (
                    <button
                      onClick={(e) => handleMarkRead(e, alert.id)}
                      className="p-1 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded"
                      title="Mark as read"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
