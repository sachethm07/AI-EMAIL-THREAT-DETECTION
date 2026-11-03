import React, { useState, useEffect } from 'react';
import { FolderArchive, Search, Filter, ExternalLink, RefreshCw, FileText } from 'lucide-react';
import { api } from '../api';

export default function CasesView({ onSelectCase }) {
  const [cases, setCases] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [skip, setSkip] = useState(0);
  const limit = 20;

  const loadCases = async () => {
    setLoading(true);
    try {
      const res = await api.getCases({
        level: filterLevel || undefined,
        q: searchQuery || undefined,
        skip,
        limit,
      });
      setCases(res.items || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, [filterLevel, searchQuery, skip]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-950 border border-cyan-800/60 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <FolderArchive className="w-3.5 h-3.5" />
            Forensic Case Repository
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Investigation History Archive
          </h1>
          <p className="text-xs text-slate-400 max-w-xl mt-1">
            Search, filter, and review historical email forensic dossiers, threat scores, and evidence chains.
          </p>
        </div>

        <button
          onClick={loadCases}
          className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition self-start sm:self-auto"
          title="Refresh table"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-xs">
          {['', 'Critical', 'High', 'Medium', 'Low'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => {
                setFilterLevel(lvl);
                setSkip(0);
              }}
              className={`px-3 py-1.5 rounded-md transition ${
                filterLevel === lvl
                  ? 'bg-slate-800 text-cyan-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {lvl || 'All Severities'}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search subject or sender..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSkip(0);
            }}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Cases Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 font-mono uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4">Subject Line</th>
                <th className="py-3 px-4">Sender Address</th>
                <th className="py-3 px-4">Threat Level</th>
                <th className="py-3 px-4">Risk Score</th>
                <th className="py-3 px-4">Verdict</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500">
                    Loading forensic cases...
                  </td>
                </tr>
              ) : cases.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500">
                    No cases match the selected search criteria.
                  </td>
                </tr>
              ) : (
                cases.map((c) => {
                  const badgeColor =
                    c.level === 'Critical'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      : c.level === 'High'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : c.level === 'Medium'
                      ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-800/40 transition cursor-pointer"
                      onClick={() => onSelectCase(c.id)}
                    >
                      <td className="py-3 px-4 font-semibold text-slate-200 max-w-xs truncate">
                        {c.subject || '(No Subject Line)'}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400 max-w-xs truncate">
                        {c.from || 'Unknown'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${badgeColor}`}>
                          {c.level}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-200">
                        {c.score}/100
                      </td>
                      <td className="py-3 px-4 capitalize text-slate-300 font-medium">
                        {c.verdict}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                        {c.created_at ? new Date(c.created_at).toLocaleString() : '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCase(c.id);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-cyan-600 text-slate-300 hover:text-white transition font-medium"
                        >
                          View Details
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination summary */}
        <div className="p-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span>
            Showing <strong className="text-slate-200">{cases.length}</strong> of <strong className="text-slate-200">{total}</strong> total cases
          </span>
          <div className="flex gap-2">
            <button
              disabled={skip === 0}
              onClick={() => setSkip(Math.max(0, skip - limit))}
              className="px-3 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 transition"
            >
              Previous
            </button>
            <button
              disabled={skip + limit >= total}
              onClick={() => setSkip(skip + limit)}
              className="px-3 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 transition"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
