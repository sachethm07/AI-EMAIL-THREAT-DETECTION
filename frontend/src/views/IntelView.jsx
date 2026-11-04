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

  // AbuseIPDB API Key modal state
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [savingKey, setSavingKey] = useState(false);
  const [keyError, setKeyError] = useState(null);
  const [keySuccess, setKeySuccess] = useState(null);

  // SMTP modal state
  const [showSmtpModal, setShowSmtpModal] = useState(false);
  const [smtpForm, setSmtpForm] = useState({
    smtp_host: '',
    smtp_port: 587,
    smtp_user: '',
    smtp_password: '',
    alert_from: '',
    alert_to: '',
  });
  const [savingSmtp, setSavingSmtp] = useState(false);
  const [smtpError, setSmtpError] = useState(null);
  const [smtpSuccess, setSmtpSuccess] = useState(null);

  // IMAP modal state
  const [showImapModal, setShowImapModal] = useState(false);
  const [imapForm, setImapForm] = useState({
    imap_enabled: true,
    imap_host: '',
    imap_user: '',
    imap_password: '',
    imap_poll_seconds: 120,
  });
  const [savingImap, setSavingImap] = useState(false);
  const [imapError, setImapError] = useState(null);
  const [imapSuccess, setImapSuccess] = useState(null);

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

  const handleSaveKey = async (e) => {
    e.preventDefault();
    setKeyError(null);
    setKeySuccess(null);
    if (!apiKeyInput.trim()) {
      setKeyError('Please paste your AbuseIPDB API key.');
      return;
    }
    setSavingKey(true);
    try {
      const res = await api.saveAbuseIpDbKey(apiKeyInput.trim());
      setKeySuccess(res.message || 'Key verified and saved!');
      fetchSystemData();
      setTimeout(() => setShowKeyModal(false), 1600);
    } catch (err) {
      setKeyError(err.message || 'Verification failed. Please check the key.');
    } finally {
      setSavingKey(false);
    }
  };

  const handleSaveSmtp = async (e) => {
    e.preventDefault();
    setSmtpError(null);
    setSmtpSuccess(null);
    if (!smtpForm.smtp_host.trim()) {
      setSmtpError('Please enter the SMTP host server.');
      return;
    }
    setSavingSmtp(true);
    try {
      const res = await api.saveSmtpConfig(smtpForm);
      setSmtpSuccess(res.message || 'SMTP dispatcher configuration saved!');
      fetchSystemData();
      setTimeout(() => setShowSmtpModal(false), 1600);
    } catch (err) {
      setSmtpError(err.message || 'Failed to save SMTP configuration.');
    } finally {
      setSavingSmtp(false);
    }
  };

  const handleSaveImap = async (e) => {
    e.preventDefault();
    setImapError(null);
    setImapSuccess(null);
    if (!imapForm.imap_host.trim()) {
      setImapError('Please enter the IMAP host server.');
      return;
    }
    setSavingImap(true);
    try {
      const res = await api.saveImapConfig(imapForm);
      setImapSuccess(res.message || 'IMAP collector configuration saved!');
      fetchSystemData();
      setTimeout(() => setShowImapModal(false), 1600);
    } catch (err) {
      setImapError(err.message || 'Failed to save IMAP configuration.');
    } finally {
      setSavingImap(false);
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

                          <div className="flex items-center gap-2 flex-wrap">
                            {item.id === 'abuseipdb' && (
                              <button
                                onClick={() => {
                                  setShowKeyModal(true);
                                  setKeyError(null);
                                  setKeySuccess(null);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition flex items-center gap-1.5"
                                title="Configure and verify your free AbuseIPDB API Key"
                              >
                                <Zap className="w-3.5 h-3.5" />
                                {isConfigured ? 'Update Key' : 'Configure Key'}
                              </button>
                            )}
                            {item.id === 'smtp' && (
                              <button
                                onClick={() => {
                                  setShowSmtpModal(true);
                                  setSmtpError(null);
                                  setSmtpSuccess(null);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold transition flex items-center gap-1.5"
                                title="Configure SMTP Threat Alert Dispatcher"
                              >
                                <Mail className="w-3.5 h-3.5" />
                                {isConfigured ? 'Update SMTP' : 'Configure SMTP'}
                              </button>
                            )}
                            {item.id === 'imap' && (
                              <button
                                onClick={() => {
                                  setShowImapModal(true);
                                  setImapError(null);
                                  setImapSuccess(null);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 text-xs font-semibold transition flex items-center gap-1.5"
                                title="Configure IMAP Suspicious Mailbox Collector"
                              >
                                <Zap className="w-3.5 h-3.5" />
                                {isConfigured ? 'Update IMAP' : 'Configure IMAP'}
                              </button>
                            )}
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

      {/* AbuseIPDB Key Configuration Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-400">
              <ShieldAlert className="w-5 h-5" />
              <h3 className="font-bold text-base text-white">Configure AbuseIPDB API Key</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              AbuseIPDB provides <strong>1,000 free IP threat reputation checks per day</strong>. When configured, SentinMail checks suspicious relay IPs and Tor exit nodes automatically.
            </p>

            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <p className="font-semibold text-slate-300">How to get your free key (1 minute):</p>
              <ol className="list-decimal list-inside space-y-0.5 text-slate-400 font-mono">
                <li>Register free at <a href="https://www.abuseipdb.com/register" target="_blank" rel="noreferrer" className="text-cyan-400 underline">abuseipdb.com/register</a></li>
                <li>Go to <strong>Account &rarr; API &rarr; Create Key</strong></li>
                <li>Paste your API key below and click Verify</li>
              </ol>
            </div>

            {keyError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-lg text-xs">
                {keyError}
              </div>
            )}
            {keySuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs">
                {keySuccess}
              </div>
            )}

            <form onSubmit={handleSaveKey} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">AbuseIPDB Secret API Key:</label>
                <input
                  type="password"
                  placeholder="Paste your 80-character API key here..."
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowKeyModal(false)}
                  disabled={savingKey}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingKey}
                  className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5"
                >
                  {savingKey ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      Verifying Key...
                    </>
                  ) : (
                    'Verify & Save Key'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SMTP Configuration Modal */}
      {showSmtpModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-amber-400">
              <Mail className="w-5 h-5" />
              <h3 className="font-bold text-base text-white">Configure SMTP Threat Alert Dispatcher</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              When configured, SentinMail immediately dispatches automated security notification emails to your response team whenever a <strong>High</strong> or <strong>Critical</strong> severity payload is classified.
            </p>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Quick Presets:</span>
              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setSmtpForm({ ...smtpForm, smtp_host: 'smtp.gmail.com', smtp_port: 587 })}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition"
                >
                  Gmail (587)
                </button>
                <button
                  type="button"
                  onClick={() => setSmtpForm({ ...smtpForm, smtp_host: 'smtp.office365.com', smtp_port: 587 })}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition"
                >
                  Outlook / O365 (587)
                </button>
                <button
                  type="button"
                  onClick={() => setSmtpForm({ ...smtpForm, smtp_host: 'localhost', smtp_port: 1025 })}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition"
                >
                  Local Dev / Test (1025)
                </button>
              </div>
            </div>

            {smtpError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-lg text-xs">
                {smtpError}
              </div>
            )}
            {smtpSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs">
                {smtpSuccess}
              </div>
            )}

            <form onSubmit={handleSaveSmtp} className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-slate-400 mb-1 font-semibold">SMTP Server Host:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. smtp.gmail.com"
                    value={smtpForm.smtp_host}
                    onChange={(e) => setSmtpForm({ ...smtpForm, smtp_host: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-amber-500 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Port:</label>
                  <input
                    type="number"
                    value={smtpForm.smtp_port}
                    onChange={(e) => setSmtpForm({ ...smtpForm, smtp_port: parseInt(e.target.value) || 587 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-amber-500 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Account / Username:</label>
                  <input
                    type="text"
                    placeholder="e.g. alerts@company.org"
                    value={smtpForm.smtp_user}
                    onChange={(e) => setSmtpForm({ ...smtpForm, smtp_user: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-amber-500 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Password / App Password:</label>
                  <input
                    type="password"
                    placeholder="App password or token"
                    value={smtpForm.smtp_password}
                    onChange={(e) => setSmtpForm({ ...smtpForm, smtp_password: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-amber-500 font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Alert Recipient (To Email):</label>
                <input
                  type="email"
                  placeholder="e.g. soc-lead@company.org"
                  value={smtpForm.alert_to}
                  onChange={(e) => setSmtpForm({ ...smtpForm, alert_to: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-amber-500 font-mono text-xs"
                />
              </div>

              <p className="text-[11px] text-slate-400 pt-1">
                Tip: For personal Gmail accounts, generate a 16-character <strong>App Password</strong> in Google Account Settings &rarr; Security &rarr; 2-Step Verification.
              </p>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSmtpModal(false)}
                  disabled={savingSmtp}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSmtp}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5"
                >
                  {savingSmtp ? 'Saving...' : 'Save & Enable SMTP'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IMAP Configuration Modal */}
      {showImapModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-purple-400">
              <Zap className="w-5 h-5" />
              <h3 className="font-bold text-base text-white">Configure IMAP Suspicious Mailbox Collector</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              When enabled, a background worker polls your dedicated security reporting mailbox (e.g. <code>phishing-report@company.org</code>) and ingests unread RFC 5322 messages automatically.
            </p>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Quick Presets:</span>
              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setImapForm({ ...imapForm, imap_host: 'imap.gmail.com' })}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition"
                >
                  Gmail (imap.gmail.com)
                </button>
                <button
                  type="button"
                  onClick={() => setImapForm({ ...imapForm, imap_host: 'outlook.office365.com' })}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition"
                >
                  Outlook / O365
                </button>
              </div>
            </div>

            {imapError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-lg text-xs">
                {imapError}
              </div>
            )}
            {imapSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs">
                {imapSuccess}
              </div>
            )}

            <form onSubmit={handleSaveImap} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">IMAP Server Host:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. imap.gmail.com"
                  value={imapForm.imap_host}
                  onChange={(e) => setImapForm({ ...imapForm, imap_host: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-purple-500 font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Mailbox Username:</label>
                  <input
                    type="text"
                    placeholder="e.g. phishing@company.org"
                    value={imapForm.imap_user}
                    onChange={(e) => setImapForm({ ...imapForm, imap_user: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-purple-500 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Password / App Password:</label>
                  <input
                    type="password"
                    placeholder="App password or token"
                    value={imapForm.imap_password}
                    onChange={(e) => setImapForm({ ...imapForm, imap_password: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-purple-500 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 items-center">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Poll Frequency (Seconds):</label>
                  <input
                    type="number"
                    min={10}
                    max={3600}
                    value={imapForm.imap_poll_seconds}
                    onChange={(e) => setImapForm({ ...imapForm, imap_poll_seconds: parseInt(e.target.value) || 120 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-purple-500 font-mono text-xs"
                  />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="imap-enabled-check"
                    checked={imapForm.imap_enabled}
                    onChange={(e) => setImapForm({ ...imapForm, imap_enabled: e.target.checked })}
                    className="rounded border-slate-800 text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="imap-enabled-check" className="text-slate-300 font-semibold cursor-pointer">
                    Enable Background Ingestion
                  </label>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowImapModal(false)}
                  disabled={savingImap}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingImap}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5"
                >
                  {savingImap ? 'Saving...' : 'Save & Enable IMAP'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
