import React, { useState, useEffect } from 'react';
import {
  Radio,
  Plus,
  Trash2,
  Search,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Server,
  Database,
  Cpu,
  ExternalLink,
  HelpCircle,
  RefreshCw,
  Globe,
  Mail,
  Zap,
  Info,
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function IntelView() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('iocs'); // 'iocs' | 'integrations'

  // IoCs state
  const [iocs, setIocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Add form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    type: 'ip',
    value: '',
    severity: 'high',
    source: 'Manual Forensic Analyst Submission',
  });
  const [addError, setAddError] = useState(null);
  const [addSuccess, setAddSuccess] = useState(null);

  // Integrations state
  const [systemData, setSystemData] = useState(null);
  const [systemLoading, setSystemLoading] = useState(false);
  const [systemError, setSystemError] = useState(null);

  const fetchIocs = async () => {
    setLoading(true);
    try {
      const data = await api.getIocs();
      setIocs(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemData = async () => {
    setSystemLoading(true);
    setSystemError(null);
    try {
      const data = await api.getSystemIntegrations();
      setSystemData(data);
    } catch (err) {
      setSystemError(err.message || 'Failed to query system integration status.');
    } finally {
      setSystemLoading(false);
    }
  };

  useEffect(() => {
    fetchIocs();
  }, []);

  useEffect(() => {
    if (activeTab === 'integrations' && !systemData) {
      fetchSystemData();
    }
  }, [activeTab]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setAddError(null);
    setAddSuccess(null);
    if (!formData.value.trim()) {
      setAddError('Please enter an indicator value.');
      return;
    }
    try {
      await api.addIoc(formData.type, formData.value.trim(), formData.severity, formData.source);
      setAddSuccess(`Added ${formData.type} ${formData.value} to blocklist.`);
      setFormData({ type: 'ip', value: '', severity: 'high', source: 'Manual Forensic Analyst Submission' });
      fetchIocs();
      setTimeout(() => setShowAddModal(false), 1200);
    } catch (err) {
      setAddError(err.message || 'Failed to add indicator.');
    }
  };

  const handleDelete = async (type, value) => {
    if (!window.confirm(`Remove ${type} "${value}" from blocklist?`)) return;
    try {
      await api.deleteIoc(type, value);
      setIocs((prev) => prev.filter((item) => !(item.type === type && item.value === value)));
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const filteredIocs = iocs.filter((ioc) => {
    const matchesSearch = !searchTerm || ioc.value?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !typeFilter || ioc.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header & Main Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-950 border border-cyan-800/60 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Radio className="w-3.5 h-3.5" />
            Threat Intelligence & Service Connector Hub
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {activeTab === 'iocs' ? 'Indicators of Compromise (IoC) Blocklist' : 'External Intelligence & Service Connectors'}
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl mt-1">
            {activeTab === 'iocs'
              ? 'Maintain local threat intelligence feeds. Ingested emails are cross-referenced in real-time against these high-conviction IPs, domains, and malware hashes.'
              : 'Inspect live connection states of local analysis engines, machine learning pipelines, and optional external threat intelligence APIs.'}
          </p>
        </div>

        {/* Tab switch buttons */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('iocs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'iocs'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            IoC Blocklist ({iocs.length})
          </button>
          <button
            onClick={() => setActiveTab('integrations')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'integrations'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            Integrations & APIs
          </button>
        </div>
      </div>

      {/* TAB 1: IoCs */}
      {activeTab === 'iocs' && (
        <div className="space-y-4">
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto bg-slate-900 border border-slate-800 p-2 rounded-xl">
              {['', 'ip', 'domain', 'url', 'hash', 'email'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono uppercase transition ${
                    typeFilter === t
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {t || 'All Types'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search indicator values..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              {user?.role === 'admin' && (
                <button
                  onClick={() => {
                    setShowAddModal(true);
                    setAddError(null);
                    setAddSuccess(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs shadow-lg shadow-cyan-500/20 transition flex items-center gap-2 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  Add IoC
                </button>
              )}
            </div>
          </div>

          {/* IoCs List Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 font-mono uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Indicator Type</th>
                    <th className="py-3 px-4">Indicator Value</th>
                    <th className="py-3 px-4">Severity Tier</th>
                    <th className="py-3 px-4">Intel Attribution / Source</th>
                    {user?.role === 'admin' && <th className="py-3 px-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-slate-500">
                        Loading indicators...
                      </td>
                    </tr>
                  ) : filteredIocs.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-slate-500 font-sans">
                        No matching threat indicators found in the database.
                      </td>
                    </tr>
                  ) : (
                    filteredIocs.map((ioc, idx) => {
                      const severityColor =
                        ioc.severity === 'high'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          : ioc.severity === 'medium'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : 'bg-blue-500/20 text-blue-300 border-blue-500/30';

                      return (
                        <tr key={idx} className="hover:bg-slate-800/30 transition">
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 uppercase font-bold text-[10px]">
                              {ioc.type}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-200 break-all">
                            {ioc.value}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${severityColor}`}>
                              {ioc.severity}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-400 font-sans text-xs">
                            {ioc.source || 'Threat Intel Feed'}
                          </td>
                          {user?.role === 'admin' && (
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleDelete(ioc.type, ioc.value)}
                                className="p-1 text-slate-500 hover:text-rose-400 transition"
                                title="Remove indicator"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: External Integrations & Connectors */}
      {activeTab === 'integrations' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Live status audit of local intelligence engines and optional third-party security APIs.
            </span>
            <button
              onClick={fetchSystemData}
              disabled={systemLoading}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${systemLoading ? 'animate-spin' : ''}`} />
              Refresh Status
            </button>
          </div>

          {systemError && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{systemError}</span>
            </div>
          )}

          {systemLoading && !systemData ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              Querying engine and API connector statuses...
            </div>
          ) : systemData ? (
            <div className="space-y-6">
              {/* Core Local Engines Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Database Engine */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="w-5 h-5 text-cyan-400" />
                      <h3 className="font-semibold text-slate-100 text-sm">Storage Engine</h3>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase">
                      Connected
                    </span>
                  </div>
                  <div className="text-xs space-y-1.5">
                    <div className="flex justify-between text-slate-400">
                      <span>Engine:</span>
                      <span className="font-mono text-slate-200">{systemData.database?.engine}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Target:</span>
                      <span className="font-mono text-slate-200 truncate max-w-xs">{systemData.database?.location}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-800">
                      {systemData.database?.note}
                    </p>
                  </div>
                </div>

                {/* ML Engine */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-5 h-5 text-indigo-400" />
                      <h3 className="font-semibold text-slate-100 text-sm">AI / ML Threat Classifier</h3>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                      systemData.ml_engine?.exists
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                    }`}>
                      {systemData.ml_engine?.status}
                    </span>
                  </div>
                  <div className="text-xs space-y-1.5">
                    <div className="flex justify-between text-slate-400">
                      <span>Pipeline:</span>
                      <span className="font-mono text-slate-200">{systemData.ml_engine?.algorithm}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Classes:</span>
                      <span className="font-mono text-slate-200">{systemData.ml_engine?.classes?.join(', ')}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-800">
                      Trained on: {systemData.ml_engine?.training_dataset}
                    </p>
                  </div>
                </div>
              </div>

              {/* External Services & Connectors List */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                  <Server className="w-4 h-4 text-cyan-400" />
                  External Intelligence & Dispatch Connectors
                </h3>

                <div className="space-y-3">
                  {systemData.integrations?.map((item) => {
                    const isConfigured = item.configured;
                    return (
                      <div
                        key={item.id}
                        className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3 hover:border-slate-700 transition"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            {item.id === 'abuseipdb' && <ShieldAlert className="w-5 h-5 text-rose-400" />}
                            {item.id === 'geoip_mmdb' && <Globe className="w-5 h-5 text-cyan-400" />}
                            {item.id === 'geoip_api' && <ExternalLink className="w-5 h-5 text-sky-400" />}
                            {item.id === 'smtp' && <Mail className="w-5 h-5 text-amber-400" />}
                            {item.id === 'imap' && <Zap className="w-5 h-5 text-purple-400" />}
                            <div>
                              <h4 className="font-bold text-slate-100 text-xs sm:text-sm">{item.name}</h4>
                              <span className="text-[10px] text-slate-400 font-mono uppercase">{item.category}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                isConfigured
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                              }`}
                            >
                              {item.status}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-300">
                          {item.description}
                        </p>

                        {/* Graceful Fallback Notice */}
                        <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800/80 text-xs flex items-start gap-2">
                          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <span className="font-semibold text-slate-300">Graceful Local Behavior:</span>
                            <p className="text-slate-400 text-[11px]">{item.fallback}</p>
                          </div>
                        </div>

                        {/* Setup Documentation Collapsible / Visible */}
                        <div className="pt-2 border-t border-slate-800/60">
                          <details className="text-xs group">
                            <summary className="cursor-pointer text-slate-400 hover:text-cyan-400 font-semibold flex items-center gap-1 select-none">
                              <HelpCircle className="w-3.5 h-3.5" />
                              <span>How to configure this integration (Environment Variables & Setup Guide)</span>
                            </summary>
                            <div className="mt-2.5 p-3.5 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 whitespace-pre-line leading-relaxed">
                              {item.setup_guide}
                            </div>
                          </details>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-white">Add Threat Intelligence Indicator</h3>

            {addError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-lg text-xs">
                {addError}
              </div>
            )}
            {addSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs">
                {addSuccess}
              </div>
            )}

            <form onSubmit={handleAdd} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Indicator Type:</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="ip">IP Address (IPv4 / IPv6)</option>
                  <option value="domain">Domain Name / Host</option>
                  <option value="url">Malicious URL</option>
                  <option value="hash">File Hash (SHA-256)</option>
                  <option value="email">Attacker Email Address</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Indicator Value:</label>
                <input
                  type="text"
                  placeholder="e.g. 185.220.101.4 or evil-domain.top"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Severity Rating:</label>
                <select
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="high">High Severity (Active Threat)</option>
                  <option value="medium">Medium Severity (Suspicious / Bulletproof)</option>
                  <option value="low">Low Severity (Informational / Watchlist)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Source / Attribution Context:</label>
                <input
                  type="text"
                  placeholder="e.g. SOC Incident 4482 / Phishing Feed"
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
                >
                  Save Indicator
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
