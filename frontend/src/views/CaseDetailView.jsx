import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  Download,
  FileText,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  Lock,
  Globe,
  Paperclip,
  Link as LinkIcon,
  HelpCircle,
  Hash,
  Fingerprint,
  Cpu,
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import ScoreGauge from '../components/ScoreGauge';
import HopMap from '../components/HopMap';

export default function CaseDetailView({ caseId, onBack, onOpenReport }) {
  const { user } = useAuth();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [downloadingEml, setDownloadingEml] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  useEffect(() => {
    setLoading(true);
    setVerifyResult(null);
    api.getCase(caseId)
      .then((data) => {
        setCaseData(data);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load case investigation.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [caseId]);

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadEml = async (e) => {
    if (e) e.preventDefault();
    setDownloadingEml(true);
    try {
      await api.downloadRawEml(caseId);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2500);
    } catch (err) {
      alert('Unable to download .eml file: ' + err.message);
    } finally {
      setDownloadingEml(false);
    }
  };

  const handleVerifyChain = async () => {
    setVerifying(true);
    try {
      const res = await api.verifyEvidence(caseId);
      setVerifyResult(res);
    } catch (err) {
      setVerifyResult({ valid: false, problems: [err.message] });
    } finally {
      setVerifying(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this case investigation record?')) return;
    try {
      await api.deleteCase(caseId);
      if (onBack) onBack();
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-slate-400 font-mono">Dissecting forensic email artifacts...</p>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-rose-400 text-sm">{error || 'Case not found.'}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-lg bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const authMechs = caseData.authentication || { spf: 'none', dkim: 'none', dmarc: 'none' };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top action & navigation bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 font-semibold transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Overview
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadEml}
            disabled={downloadingEml}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition disabled:opacity-50 ${
              downloadSuccess
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
            }`}
            title="Download RFC 5322 raw email source (.eml)"
          >
            {downloadSuccess ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Downloaded .eml</span>
              </>
            ) : downloadingEml ? (
              <>
                <Download className="w-3.5 h-3.5 text-cyan-400 animate-bounce" />
                <span>Downloading...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Download Original .eml</span>
              </>
            )}
          </button>

          <button
            onClick={() => onOpenReport && onOpenReport(caseId)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md transition"
          >
            <FileText className="w-3.5 h-3.5" />
            Forensic Report
          </button>

          {user?.role === 'admin' && (
            <button
              onClick={handleDelete}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-900/50 transition"
              title="Delete Case (Admin)"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Primary Case Header Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60">
                CASE #{caseData.id?.slice(0, 12)}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {caseData.created_at ? new Date(caseData.created_at).toUTCString() : ''}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {caseData.subject || '(No Subject Line)'}
            </h1>
          </div>

          <div className="shrink-0">
            <ScoreGauge
              score={caseData.score}
              level={caseData.level}
              verdict={caseData.verdict}
              size="normal"
            />
          </div>
        </div>

        {/* Metadata summary grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase font-mono mb-1">From Header</span>
            <span className="font-mono text-slate-200 break-all">{caseData.from || 'Not provided'}</span>
          </div>
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase font-mono mb-1">Sender Domain</span>
            <span className="font-mono text-cyan-400">{caseData.from_domain || 'Unknown'}</span>
          </div>
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase font-mono mb-1">ML Model Source</span>
            <span className="font-mono text-slate-300 capitalize">{caseData.ml?.source || 'Trained Model'}</span>
          </div>
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase font-mono mb-1">Investigating Analyst</span>
            <span className="font-mono text-slate-300">{caseData.created_by || 'system'}</span>
          </div>
        </div>
      </div>

      {/* Explainable Factor Points Breakdown */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Fingerprint className="w-5 h-5 text-cyan-400" />
            <h3 className="font-semibold text-slate-100 text-sm">
              Explainable Risk Score Factor Contribution
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-slate-200">
            Total Threat Score: {caseData.score}/100
          </span>
        </div>
        <p className="text-xs text-slate-400">
          Every point in the score is explicitly attributed to a deterministic signal or machine-learning confidence factor.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {(caseData.factors || []).map((f, i) => (
            <div
              key={i}
              className="p-3 bg-slate-950/80 rounded-lg border border-slate-800/80 flex items-start justify-between gap-3 text-xs"
            >
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-200">{f.name}</span>
                  <span
                    className={`font-mono font-bold ${
                      f.points > 0 ? 'text-amber-400' : 'text-slate-500'
                    }`}
                  >
                    +{f.points} / {f.max} pts
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">{f.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Authentication & NLP row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SPF, DKIM, DMARC Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="font-semibold text-slate-100 text-sm">
                Email Authentication Verification
              </h3>
              <p className="text-[11px] text-slate-400">SPF, DKIM, and DMARC record parsing</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { name: 'SPF', val: authMechs.spf, desc: 'Sender IP authorization' },
              { name: 'DKIM', val: authMechs.dkim, desc: 'Cryptographic body signature' },
              { name: 'DMARC', val: authMechs.dmarc, desc: 'Domain alignment policy' },
            ].map((m) => {
              const isPass = m.val === 'pass';
              const isFail = ['fail', 'softfail', 'permerror'].includes(m.val);
              const color = isPass
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : isFail
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                : 'bg-slate-800/50 border-slate-700 text-slate-400';

              return (
                <div key={m.name} className={`p-3 rounded-xl border ${color} text-center`}>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">{m.name}</span>
                  <span className="font-mono font-bold text-sm uppercase mt-0.5 block">{m.val || 'NONE'}</span>
                  <span className="text-[10px] text-slate-500 mt-1 block leading-tight">{m.desc}</span>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>
              <strong>Decision-Support Context:</strong> SPF/DKIM/DMARC verify domain alignment, not benign intent. Attackers routinely purchase legitimate domains with 100% passing SPF/DKIM records.
            </span>
          </div>
        </div>

        {/* NLP & Psychological Deception Triggers */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-semibold text-slate-100 text-sm">
                NLP Linguistic & Urgency Cues
              </h3>
              <p className="text-[11px] text-slate-400">
                Extracted psychological pressure tactics ({caseData.language?.points || 0}/10 language score)
              </p>
            </div>
          </div>

          {Object.keys(caseData.language?.categories || {}).length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 bg-slate-950/50 rounded-xl border border-slate-800/60">
              No prominent urgency or credential manipulation lexicon detected.
            </div>
          ) : (
            <div className="space-y-2.5">
              {Object.entries(caseData.language.categories).map(([cat, matches]) => (
                <div key={cat} className="p-2.5 bg-slate-950/70 rounded-lg border border-slate-800/80 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-300">
                      {cat}
                    </span>
                    <span className="text-[10px] font-mono text-amber-400">
                      {matches.length} triggers
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {matches.map((m, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[11px] font-mono"
                      >
                        "{m}"
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Header Anomalies & Sender Spoofing Audit */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
        <h3 className="font-semibold text-slate-100 text-sm flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-rose-400" />
          Sender Field & Header Anomaly Dissection
        </h3>

        {(caseData.header_anomalies || []).length === 0 ? (
          <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800/60 text-xs text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Sender headers are aligned: From domain, Reply-To, and Return-Path match.</span>
          </div>
        ) : (
          <div className="space-y-2">
            {caseData.header_anomalies.map((anom, i) => (
              <div
                key={i}
                className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-start justify-between text-xs text-rose-300"
              >
                <div>
                  <span className="font-mono font-bold text-[11px] uppercase mr-2 px-1.5 py-0.5 bg-rose-950/80 rounded border border-rose-800/60">
                    {anom.code}
                  </span>
                  <span>{anom.detail}</span>
                </div>
                <span className="font-mono text-rose-400 font-bold shrink-0 ml-2">
                  +{anom.points} pts
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* URL & Link Forensics */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-100 text-sm flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-cyan-400" />
            Extracted URLs & Typosquatting Inspection
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {caseData.urls?.length || 0} links found
          </span>
        </div>

        {(!caseData.urls || caseData.urls.length === 0) ? (
          <p className="text-xs text-slate-500 p-4 text-center bg-slate-950/40 rounded-lg border border-slate-800">
            No hyperlinks found in message body.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Destination URL</th>
                  <th className="py-2.5 px-3">Registered Domain</th>
                  <th className="py-2.5 px-3">Forensic Flags</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {caseData.urls.map((u, i) => (
                  <tr key={i} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-mono text-slate-200 break-all max-w-sm">
                      {u.url}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-cyan-400">
                      {u.registered_domain || u.host || '-'}
                    </td>
                    <td className="py-2.5 px-3">
                      {u.flags?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {u.flags.map((f, fi) => (
                            <span
                              key={fi}
                              className="px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[10px]"
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-emerald-400 text-[11px] flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> No anomalies
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Safe Attachment Metadata Inspector */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-100 text-sm flex items-center gap-2">
            <Paperclip className="w-5 h-5 text-cyan-400" />
            Safe Attachment Inspector (Metadata & Static Hashes Only)
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {caseData.attachments?.length || 0} files
          </span>
        </div>

        {(!caseData.attachments || caseData.attachments.length === 0) ? (
          <p className="text-xs text-slate-500 p-4 text-center bg-slate-950/40 rounded-lg border border-slate-800">
            No file attachments attached to this message.
          </p>
        ) : (
          <div className="space-y-3">
            {caseData.attachments.map((att, i) => (
              <div
                key={i}
                className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200 font-mono">{att.filename}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-mono">
                      {att.size} bytes
                    </span>
                    <span className="text-slate-500 text-[11px] font-mono">{att.content_type}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                    <span>SHA-256: {att.sha256}</span>
                    <button
                      onClick={() => handleCopy(att.sha256, `hash-${i}`)}
                      className="p-1 hover:text-white"
                      title="Copy SHA-256"
                    >
                      {copiedKey === `hash-${i}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {att.flags?.length > 0 ? (
                    att.flags.map((f, fi) => (
                      <span
                        key={fi}
                        className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold uppercase"
                      >
                        {f}
                      </span>
                    ))
                  ) : (
                    <span className="text-emerald-400 text-xs flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Clean metadata
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Routing Hops & Geolocation Map */}
      <HopMap hops={caseData.hops || []} />

      {/* Extracted Indicators of Compromise (IoCs) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hash className="w-5 h-5 text-cyan-400" />
            <h3 className="font-semibold text-slate-100 text-sm">
              Extracted Indicators of Compromise (IoCs)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">Ready for blocklist ingestion or SIEM export</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {['ip', 'domain', 'url', 'hash'].map((type) => {
            const items = caseData.iocs?.[type] || [];
            return (
              <div key={type} className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block mb-2">
                  {type}s ({items.length})
                </span>
                {items.length === 0 ? (
                  <span className="text-slate-600 text-[11px]">None extracted</span>
                ) : (
                  <div className="space-y-1 max-h-36 overflow-y-auto font-mono text-[11px]">
                    {items.map((val, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-1 p-1 rounded bg-slate-900 text-slate-300 hover:text-white"
                      >
                        <span className="truncate">{val}</span>
                        <button
                          onClick={() => handleCopy(val, `${type}-${idx}`)}
                          className="p-0.5 text-slate-500 hover:text-cyan-400 shrink-0"
                          title="Copy IoC"
                        >
                          {copiedKey === `${type}-${idx}` ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Evidence Integrity & Tamper-Evident Hash Chain */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-semibold text-slate-100 text-sm">
                Cryptographic Evidence Chain of Custody
              </h3>
              <p className="text-[11px] text-slate-400">
                SHA-256 hash chaining ensures digital artifacts cannot be modified without detection.
              </p>
            </div>
          </div>

          <button
            onClick={handleVerifyChain}
            disabled={verifying}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 text-xs font-semibold transition flex items-center gap-1.5 self-start sm:self-auto"
          >
            {verifying ? 'Validating Hashes...' : 'Verify Cryptographic Chain'}
          </button>
        </div>

        {/* Verification Result Banner */}
        {verifyResult && (
          <div
            className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
              verifyResult.valid
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {verifyResult.valid ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>Evidence Integrity Confirmed:</strong> Every forensic item and the original message payload match their recorded SHA-256 hashes with zero tampering.
                </span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>
                  <strong>Evidence Integrity Compromised:</strong> {verifyResult.problems?.join('; ') || 'Chain hash mismatch.'}
                </span>
              </>
            )}
          </div>
        )}

        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 text-xs space-y-2 font-mono">
          <div className="flex justify-between items-center text-slate-400 text-[11px]">
            <span>Collected by: <strong className="text-slate-200">{caseData.evidence?.collected_by || 'analyst'}</strong></span>
            <span>Collected at: <strong className="text-slate-200">{caseData.evidence?.collected_at}</strong></span>
          </div>
          <div className="text-[11px] text-slate-400 break-all">
            <span>Chain Head Hash: </span>
            <span className="text-emerald-400">{caseData.evidence?.chain_head}</span>
          </div>
          <div className="divide-y divide-slate-800/50 pt-2 text-[10px]">
            {(caseData.evidence?.items || []).map((item, idx) => (
              <div key={idx} className="py-1.5 flex justify-between items-center">
                <span className="text-slate-300 uppercase">{item.type} {item.name ? `(${item.name})` : ''}</span>
                <span className="text-slate-500">{item.sha256}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
