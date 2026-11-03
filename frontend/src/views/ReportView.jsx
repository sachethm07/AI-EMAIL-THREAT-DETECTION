import React, { useState, useEffect } from 'react';
import { ArrowLeft, Printer, Download, CheckCircle2, ShieldAlert, FileText, Lock } from 'lucide-react';
import { api } from '../api';

export default function ReportView({ caseId, onBack }) {
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCase(caseId)
      .then((data) => setCaseData(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [caseId]);

  if (loading || !caseData) {
    return (
      <div className="p-12 text-center text-xs text-slate-400 font-mono">
        Compiling formal forensic report...
      </div>
    );
  }

  const handleDownloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(caseData, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `Forensic_Report_${caseId}.json`);
    dlAnchorElem.click();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Action Header - hidden when printing */}
      <div className="print:hidden flex items-center justify-between border-b border-slate-800 pb-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 font-semibold transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Case Detail
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadJson}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white transition"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            Export JSON
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md transition"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / Save as PDF
          </button>
        </div>
      </div>

      {/* Formal Forensic Report Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-slate-100 print:bg-white print:text-black print:border-none print:shadow-none print:p-0 space-y-6">
        {/* Document Header */}
        <div className="border-b border-slate-800 print:border-black pb-4 flex justify-between items-start">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-cyan-400 print:text-blue-700 font-bold mb-1">
              SentinMail Digital Forensics Laboratory
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white print:text-black">
              Email Threat & Forensic Intelligence Investigation Report
            </h1>
            <p className="text-xs text-slate-400 print:text-gray-600 mt-1 font-mono">
              Document Ref: SENTIN-CASE-{caseData.id?.slice(0, 16)} &bull; ISO/IEC 27037 Forensic Adherence
            </p>
          </div>
          <div className="text-right font-mono text-xs text-slate-400 print:text-gray-600">
            <div>Date: {caseData.created_at ? new Date(caseData.created_at).toLocaleDateString() : '-'}</div>
            <div>Analyst: {caseData.created_by || 'system'}</div>
          </div>
        </div>

        {/* Executive Summary Table */}
        <div className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-400 print:text-black border-b border-slate-800 print:border-gray-300 pb-1">
            1. Executive Investigation Summary
          </h2>
          <table className="w-full text-xs text-left border-collapse">
            <tbody>
              <tr className="border-b border-slate-800 print:border-gray-200">
                <th className="py-2 px-3 bg-slate-950/60 print:bg-gray-100 font-semibold w-1/4">Subject</th>
                <td className="py-2 px-3 font-medium text-slate-200 print:text-black">{caseData.subject}</td>
              </tr>
              <tr className="border-b border-slate-800 print:border-gray-200">
                <th className="py-2 px-3 bg-slate-950/60 print:bg-gray-100 font-semibold">Sender (From)</th>
                <td className="py-2 px-3 font-mono text-slate-200 print:text-black">{caseData.from}</td>
              </tr>
              <tr className="border-b border-slate-800 print:border-gray-200">
                <th className="py-2 px-3 bg-slate-950/60 print:bg-gray-100 font-semibold">Final Verdict</th>
                <td className="py-2 px-3 font-bold uppercase text-amber-400 print:text-black">
                  {caseData.verdict} ({caseData.level} Risk, Score: {caseData.score}/100)
                </td>
              </tr>
              <tr className="border-b border-slate-800 print:border-gray-200">
                <th className="py-2 px-3 bg-slate-950/60 print:bg-gray-100 font-semibold">Classification Model</th>
                <td className="py-2 px-3 font-mono text-slate-300 print:text-black">
                  {caseData.ml?.label} ({caseData.ml?.confidence ? Math.round(caseData.ml.confidence * 100) : 0}% confidence) &mdash; {caseData.ml?.source}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Explainable Factor Breakdown */}
        <div className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-400 print:text-black border-b border-slate-800 print:border-gray-300 pb-1">
            2. Explainable Threat Score Factors
          </h2>
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-950/80 print:bg-gray-100 font-mono text-[11px]">
              <tr>
                <th className="py-2 px-3">Evaluated Signal</th>
                <th className="py-2 px-3">Contributed Score</th>
                <th className="py-2 px-3">Signal Dissection Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 print:divide-gray-200">
              {(caseData.factors || []).map((f, i) => (
                <tr key={i}>
                  <td className="py-2 px-3 font-medium text-slate-200 print:text-black">{f.name}</td>
                  <td className="py-2 px-3 font-mono font-bold text-amber-400 print:text-black">+{f.points} / {f.max}</td>
                  <td className="py-2 px-3 text-slate-400 print:text-black">{f.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Authentication Analysis */}
        <div className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-400 print:text-black border-b border-slate-800 print:border-gray-300 pb-1">
            3. Authentication Headers (SPF, DKIM, DMARC)
          </h2>
          <div className="grid grid-cols-3 gap-3 text-xs">
            {Object.entries(caseData.authentication || {}).map(([k, v]) => (
              <div key={k} className="p-3 bg-slate-950/60 print:bg-gray-50 border border-slate-800 print:border-gray-300 rounded-lg">
                <span className="text-[10px] font-mono uppercase text-slate-400 print:text-gray-600 block">{k}</span>
                <span className="font-mono font-bold text-sm uppercase text-slate-200 print:text-black">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Routing Route & Network Context */}
        <div className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-400 print:text-black border-b border-slate-800 print:border-gray-300 pb-1">
            4. Routing Relay Path & Approximate Geolocation
          </h2>
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-950/80 print:bg-gray-100 font-mono text-[11px]">
              <tr>
                <th className="py-2 px-3">Hop</th>
                <th className="py-2 px-3">Relay IP</th>
                <th className="py-2 px-3">Approximate City & Country</th>
                <th className="py-2 px-3">Network / ASN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 print:divide-gray-200 font-mono text-[11px]">
              {(caseData.hops || []).map((h) => (
                <tr key={h.order}>
                  <td className="py-2 px-3 text-slate-400 print:text-black">#{h.order}</td>
                  <td className="py-2 px-3 font-bold text-slate-200 print:text-black">{h.ip}</td>
                  <td className="py-2 px-3 text-slate-300 print:text-black">
                    {h.geo?.city || '-'}, {h.geo?.country || 'Unknown'}
                  </td>
                  <td className="py-2 px-3 text-slate-400 print:text-black">{h.geo?.org || h.geo?.asn || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[10px] text-slate-400 print:text-gray-600 italic">
            * Geolocation reflects intermediate transport relays and mail exchange servers. Does not prove the sender's physical identity or origin.
          </p>
        </div>

        {/* Indicators of Compromise */}
        <div className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-400 print:text-black border-b border-slate-800 print:border-gray-300 pb-1">
            5. Consolidated Indicators of Compromise (IoCs)
          </h2>
          <div className="grid grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <span className="font-bold text-slate-400 print:text-black block mb-1">IP Addresses:</span>
              <p className="text-slate-300 print:text-black break-all">
                {caseData.iocs?.ip?.join(', ') || 'None'}
              </p>
            </div>
            <div>
              <span className="font-bold text-slate-400 print:text-black block mb-1">Domains:</span>
              <p className="text-slate-300 print:text-black break-all">
                {caseData.iocs?.domain?.join(', ') || 'None'}
              </p>
            </div>
            <div>
              <span className="font-bold text-slate-400 print:text-black block mb-1">Extracted URLs:</span>
              <p className="text-slate-300 print:text-black break-all">
                {caseData.iocs?.url?.join(', ') || 'None'}
              </p>
            </div>
            <div>
              <span className="font-bold text-slate-400 print:text-black block mb-1">File Hashes (SHA-256):</span>
              <p className="text-slate-300 print:text-black break-all">
                {caseData.iocs?.hash?.join(', ') || 'None'}
              </p>
            </div>
          </div>
        </div>

        {/* Cryptographic Chain of Custody */}
        <div className="space-y-2 pt-2 border-t border-slate-800 print:border-gray-300">
          <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-400 print:text-black border-b border-slate-800 print:border-gray-300 pb-1">
            6. Evidence Cryptographic Integrity & Hash Chain
          </h2>
          <div className="text-[11px] font-mono space-y-1">
            <div>Chain Head Hash: <strong className="text-emerald-400 print:text-black break-all">{caseData.evidence?.chain_head}</strong></div>
            <div>Collection Timestamp: {caseData.evidence?.collected_at} by {caseData.evidence?.collected_by}</div>
          </div>
          <p className="text-[11px] text-slate-400 print:text-gray-600 mt-4 leading-relaxed">
            <strong>Decision-Support Disclaimer:</strong> This forensic report is intended for incident response decision support. Automated heuristics and classification models provide threat probabilities and should be verified by a trained forensic analyst.
          </p>
        </div>
      </div>
    </div>
  );
}
