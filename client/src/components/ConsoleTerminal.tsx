import React, { useState, useRef, useEffect } from 'react';
import {
  Terminal as TerminalIcon,
  Search,
  Trash2,
  Download,
  ArrowDown,
  X,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  SlidersHorizontal,
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
    const header = [
      '================================================================',
      'EZDQ Web - Session Activity Logs',
      `Exported: ${new Date().toISOString()}`,
      `Total Log Entries: ${logs.length}`,
      '================================================================\n',
    ].join('\n');

    const content = logs
      .map((l) => `[${l.time}] [${l.level.toUpperCase().padEnd(7)}] ${l.message}`)
      .join('\n');

    const fullText = `${header}${content}\n\n=== End of Log ===`;
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ezdq-logs-${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.log`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getBadgeConfig = (level: LogLevel) => {
    switch (level) {
      case 'system':
        return {
          icon: SlidersHorizontal,
          text: 'SYS',
          className: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/25',
        };
      case 'success':
        return {
          icon: CheckCircle2,
          text: 'SUCCESS',
          className: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
        };
      case 'warn':
        return {
          icon: AlertTriangle,
          text: 'WARN',
          className: 'text-amber-400 bg-amber-500/10 border-amber-500/25',
        };
      case 'error':
        return {
          icon: AlertCircle,
          text: 'ERROR',
          className: 'text-rose-400 bg-rose-500/10 border-rose-500/25',
        };
      default:
        return {
          icon: Info,
          text: 'INFO',
          className: 'text-indigo-300 bg-indigo-500/10 border-indigo-500/25',
        };
    }
  };

  return (
    <div className="rounded-2xl glass-panel border border-white/[0.08] overflow-hidden flex flex-col shadow-2xl transition-all">
      {/* Studio macOS-style Window Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-[#090B10]/95 border-b border-white/[0.07]">
        {/* Left: Window Dots & Title */}
        <div className="flex items-center gap-3">
          {/* Mac Controls */}
          <div className="flex items-center gap-1.5 shrink-0" aria-hidden="true">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 border border-rose-600/50 inline-block transition-transform hover:scale-110" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 border border-amber-600/50 inline-block transition-transform hover:scale-110" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 border border-emerald-600/50 inline-block transition-transform hover:scale-110" />
          </div>

          <div className="h-4 w-px bg-white/10" />

          {/* Terminal Title */}
          <div className="flex items-center gap-2">
            <TerminalIcon className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="text-xs sm:text-sm font-bold text-white tracking-wide">
              {t.terminalTitle}
            </span>
          </div>

          {/* Line Counter Badge */}
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/[0.05] text-slate-400 border border-white/[0.08]">
            {logs.length} {t.terminalLines}
          </span>
        </div>

        {/* Right: Controls Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder={t.searchLogsPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-7 py-1.5 rounded-xl bg-[#050608] border border-white/[0.1] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 w-32 sm:w-44 font-sans transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2 text-slate-500 hover:text-white p-0.5"
                title="Clear filter"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Log Level Select */}
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-xl bg-[#050608] border border-white/[0.1] text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer transition-all"
          >
            <option value="all">{t.filterAll}</option>
            <option value="system">{t.filterSystem}</option>
            <option value="info">{t.filterInfo}</option>
            <option value="success">{t.filterSuccess}</option>
            <option value="warn">{t.filterWarn}</option>
            <option value="error">{t.filterError}</option>
          </select>

          {/* Auto-scroll Toggle */}
          <button
            type="button"
            onClick={() => setAutoScroll(!autoScroll)}
            className={`p-2 rounded-xl border transition-all flex items-center justify-center ${
              autoScroll
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/35 hover:bg-indigo-500/30'
                : 'bg-white/[0.04] text-slate-400 border-white/[0.08] hover:text-white hover:bg-white/[0.08]'
            }`}
            title={t.autoScrollTitle}
            aria-label="Toggle auto scroll"
          >
            <ArrowDown className={`w-3.5 h-3.5 ${autoScroll ? 'animate-bounce' : ''}`} />
          </button>

          {/* Clear Button */}
          <button
            type="button"
            onClick={onClear}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-rose-500/15 border border-white/[0.08] hover:border-rose-500/30 text-slate-400 hover:text-rose-400 transition-all flex items-center justify-center"
            title={t.clearLogsTitle}
            aria-label="Clear logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Download Button */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={logs.length === 0}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-emerald-500/15 border border-white/[0.08] hover:border-emerald-500/30 text-slate-400 hover:text-emerald-300 transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center"
            title={t.downloadLogsTitle}
            aria-label="Download logs"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Viewport */}
      <div className="bg-[#050609] p-4 h-64 sm:h-76 overflow-y-auto font-mono text-xs text-slate-300 select-text scrollbar-thin">
        {filteredLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 font-sans text-xs gap-2">
            <TerminalIcon className="w-8 h-8 text-slate-700 stroke-[1.5]" />
            <p>{logs.length === 0 ? t.emptyLogs : 'No logs matching current filter'}</p>
            <div className="text-[11px] font-mono text-slate-600 flex items-center gap-1.5 mt-1">
              <span>ezdq:~$</span>
              <span className="w-2 h-3.5 bg-indigo-500/60 inline-block animate-pulse" />
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredLogs.map((log) => {
              const badge = getBadgeConfig(log.level);
              return (
                <div
                  key={log.id}
                  className="flex items-start gap-2.5 py-1 px-1.5 rounded-lg hover:bg-white/[0.03] transition-colors leading-relaxed group"
                >
                  {/* Timestamp */}
                  <span className="text-slate-500 select-none shrink-0 text-[11px] pt-0.5 group-hover:text-slate-400">
                    [{log.time}]
                  </span>

                  {/* Level Pill */}
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border uppercase shrink-0 tracking-wider ${badge.className}`}
                  >
                    {badge.text}
                  </span>

                  {/* Log Content */}
                  <span className="text-slate-200 break-all flex-1 selection:bg-indigo-500/30">
                    {log.message}
                  </span>
                </div>
              );
            })}
            <div ref={terminalEndRef} />
          </div>
        )}
      </div>
    </div>
  );
};
