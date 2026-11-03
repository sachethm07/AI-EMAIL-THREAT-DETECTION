import React, { useState, useEffect } from 'react';
import {
  Mail,
  Upload,
  FileCode,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowRight,
  Info,
} from 'lucide-react';
import { api } from '../api';

export default function SubmitView({ onAnalysisComplete }) {
  const [mode, setMode] = useState('paste'); // 'paste' | 'upload'
  const [rawText, setRawText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [samples, setSamples] = useState([]);
  const [selectedSample, setSelectedSample] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Load samples from backend
  useEffect(() => {
    api.getSamples()
      .then((data) => {
        setSamples(data || []);
      })
      .catch((err) => {
        console.warn('Could not load samples:', err);
      });
  }, []);

  const handleSelectSample = (sample) => {
    setSelectedSample(sample);
    setRawText(sample.raw);
    setMode('paste');
    setError(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File exceeds 5 MB limit.');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      let result;
      if (mode === 'paste') {
        if (!rawText.trim()) {
          throw new Error('Please enter or paste raw email content.');
        }
        result = await api.analyzeText(rawText);
      } else {
        if (!selectedFile) {
          throw new Error('Please select an .eml or email file to upload.');
        }
        result = await api.analyzeFile(selectedFile);
      }

      if (onAnalysisComplete) {
        onAnalysisComplete(result.id);
      }
    } catch (err) {
      setError(err.message || 'Analysis failed. Check your email content or network connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
          <Mail className="w-3.5 h-3.5" />
          Forensic Threat Ingestion
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Analyze Suspicious Email
        </h1>
        <p className="text-sm text-slate-400 max-w-xl mx-auto">
          Submit raw RFC 5322 email headers and message bodies or upload an .eml file for multi-factor machine learning and technical indicator evaluation.
        </p>
      </div>

      {/* Preset Academic Demonstrations */}
      {samples.length > 0 && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              1-Click Threat Demonstration Scenarios
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {samples.map((s) => {
              const isSelected = selectedSample?.id === s.id;
              const typeColor =
                s.type === 'Legitimate'
                  ? 'border-emerald-500/40 text-emerald-400 bg-emerald-950/30'
                  : s.type === 'Spam'
                  ? 'border-yellow-500/40 text-yellow-400 bg-yellow-950/30'
                  : s.type === 'Phishing'
                  ? 'border-amber-500/40 text-amber-400 bg-amber-950/30'
                  : 'border-rose-500/40 text-rose-400 bg-rose-950/30';

              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSelectSample(s)}
                  className={`text-left p-3 rounded-lg border transition text-xs flex flex-col justify-between ${
                    isSelected
                      ? 'border-cyan-500 bg-cyan-950/40 shadow-sm'
                      : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${typeColor}`}>
                        {s.type}
                      </span>
                    </div>
                    <div className="font-semibold text-slate-200 line-clamp-1">{s.title}</div>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{s.description}</p>
                  </div>
                  <span className="text-[10px] text-cyan-400 mt-2 font-medium flex items-center gap-1">
                    Load into parser &rarr;
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Input Selection Tabs & Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="flex border-b border-slate-800 bg-slate-950/60">
          <button
            type="button"
            onClick={() => setMode('paste')}
            className={`flex-1 py-3 px-4 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition ${
              mode === 'paste'
                ? 'border-cyan-500 text-cyan-400 bg-slate-900/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-4 h-4" />
            Paste Raw Email Text
          </button>
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`flex-1 py-3 px-4 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition ${
              mode === 'upload'
                ? 'border-cyan-500 text-cyan-400 bg-slate-900/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            Upload .eml File
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {mode === 'paste' ? (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-medium text-slate-300">
                  RFC 5322 Email Message (Headers + Body):
                </label>
                {rawText && (
                  <button
                    type="button"
                    onClick={() => {
                      setRawText('');
                      setSelectedSample(null);
                    }}
                    className="text-slate-500 hover:text-slate-300 transition text-[11px]"
                  >
                    Clear Input
                  </button>
                )}
              </div>
              <textarea
                rows={14}
                value={rawText}
                onChange={(e) => {
                  setRawText(e.target.value);
                  setSelectedSample(null);
                }}
                placeholder="From: Security Alerts <alerts@bank.top>&#10;To: customer@company.com&#10;Subject: URGENT: Account Suspension Notice&#10;Date: Thu, 29 Oct 2026 12:00:00 +0000&#10;Authentication-Results: mx.bank.top; spf=fail; dkim=none&#10;&#10;Please verify your account immediately at http://bank-update.top/login"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-800 rounded-xl p-8 text-center hover:border-slate-700 transition bg-slate-950/40">
                <Upload className="w-10 h-10 text-cyan-400 mx-auto mb-3" />
                <h4 className="text-sm font-semibold text-slate-200">
                  Select or drag .eml email file
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Standard RFC 5322 message files supported up to 5 MB.
                </p>
                <input
                  type="file"
                  id="email-file"
                  accept=".eml,.txt,message/rfc822"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="email-file"
                  className="mt-4 inline-block px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer transition border border-slate-700"
                >
                  Choose File
                </label>
              </div>

              {selectedFile && (
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="font-mono text-slate-300">{selectedFile.name}</span>
                    <span className="text-slate-500">
                      ({Math.round(selectedFile.size / 1024)} KB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="text-rose-400 hover:text-rose-300 text-xs"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Privacy & Safe Sandbox Guarantee */}
          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex items-start gap-2.5 text-xs text-slate-400">
            <Lock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-300">Safe Ingestion Protocol: </span>
              All submitted emails are parsed strictly in memory. Embedded links are never crawled or accessed over the network, and attachments are processed strictly for filenames, MIME types, and cryptographic hashes (SHA-256/MD5) without execution.
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || (mode === 'paste' ? !rawText.trim() : !selectedFile)}
              className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                  Performing Threat Dissection...
                </>
              ) : (
                <>
                  Execute Forensic Analysis
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
