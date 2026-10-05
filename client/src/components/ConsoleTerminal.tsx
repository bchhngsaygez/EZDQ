import React, { useState, useRef, useEffect } from 'react';
import {
  Terminal as TerminalIcon,
  Search,
  Trash2,
  Download,
  ArrowDown,
} from 'lucide-react';
import { LogEntry, LogLevel } from '../types';
import { Language, translations } from '../i18n';

interface ConsoleTerminalProps {
  logs: LogEntry[];
  onClear: () => void;
  lang: Language;
}

export const ConsoleTerminal: React.FC<ConsoleTerminalProps> = ({ logs, onClear, lang }) => {
  const t = translations[lang];
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<'all' | LogLevel>('all');
  const [autoScroll, setAutoScroll] = useState(true);

  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (autoScroll) {
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter((log) => {
    if (levelFilter !== 'all' && log.level !== levelFilter) return false;
    if (searchTerm.trim()) {
      return log.message.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return true;
  });

  const handleDownload = () => {
    const content = logs.map((l) => `[${l.time}] [${l.level.toUpperCase()}] ${l.message}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `autoquest-log-${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getBadgeStyle = (level: LogLevel) => {
    switch (level) {
      case 'system':
        return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
      case 'success':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'warn':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'error':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      default:
        return 'text-slate-400 bg-white/[0.04] border-white/[0.06]';
    }
  };

  return (
    <div className="rounded-2xl p-4 sm:p-5 glass-panel border border-white/[0.07] overflow-hidden flex flex-col">
      {/* Top Window Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-white/[0.06] mb-3">
        <div className="flex items-center gap-2.5">
          <TerminalIcon className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-white">{t.terminalTitle}</h3>
          <span className="text-[11px] px-2 py-0.2 rounded bg-white/[0.04] text-slate-400 font-mono">
            {logs.length} {t.terminalLines}
          </span>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t.searchLogsPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-2.5 py-1 rounded-lg bg-[#080A0E] border border-white/[0.08] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-32 sm:w-40 font-sans"
            />
          </div>

          {/* Level Filter */}
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value as any)}
            className="px-2 py-1 rounded-lg bg-[#080A0E] border border-white/[0.08] text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">{t.filterAll}</option>
            <option value="system">{t.filterSystem}</option>
            <option value="info">{t.filterInfo}</option>
            <option value="success">{t.filterSuccess}</option>
            <option value="warn">{t.filterWarn}</option>
            <option value="error">{t.filterError}</option>
          </select>

          {/* Auto-scroll */}
          <button
            type="button"
            onClick={() => setAutoScroll(!autoScroll)}
            className={`p-1 rounded-lg border transition-colors ${
              autoScroll
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                : 'bg-white/[0.03] text-slate-400 border-white/[0.06] hover:text-white'
            }`}
            title={t.autoScrollTitle}
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>

          {/* Clear */}
          <button
            type="button"
            onClick={onClear}
            className="p-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-slate-400 hover:text-rose-400 transition-colors"
            title={t.clearLogsTitle}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Download */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={logs.length === 0}
            className="p-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-slate-400 hover:text-emerald-400 transition-colors disabled:opacity-30"
            title={t.downloadLogsTitle}
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Output */}
      <div className="rounded-xl bg-[#06070A] border border-white/[0.04] p-3.5 h-64 sm:h-72 overflow-y-auto font-mono text-xs text-slate-300 select-text">
        {filteredLogs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-600 font-sans text-xs">
            {logs.length === 0 ? t.emptyLogs : '...'}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-2 hover:bg-white/[0.02] py-0.5 px-1 rounded transition-colors">
                <span className="text-slate-500 select-none shrink-0 text-[11px]">
                  [{log.time}]
                </span>
                <span className={`px-1 rounded text-[10px] font-bold border uppercase shrink-0 ${getBadgeStyle(log.level)}`}>
                  {log.level === 'system' ? 'SYS' : log.level === 'success' ? 'OK' : log.level === 'error' ? 'ERR' : log.level === 'warn' ? 'WARN' : 'INFO'}
                </span>
                <span className="text-slate-200 break-all leading-relaxed">{log.message}</span>
              </div>
            ))}
            <div ref={terminalEndRef} />
          </div>
        )}
      </div>
    </div>
  );
};
