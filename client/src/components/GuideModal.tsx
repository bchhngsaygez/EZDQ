import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  BookOpen,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Terminal,
  Monitor,
  KeyRound,
} from 'lucide-react';
import { Language, translations } from '../i18n';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

const TOKEN_SNIPPET = `window.webpackChunkdiscord_app.push([
  [Symbol()],
  {},
  req => {
    if (!req.c) return;
    for (let m of Object.values(req.c)) {
      try {
        if (!m.exports || m.exports === window) continue;
        if (m.exports?.getToken) return copy(m.exports.getToken());
        for (let ex in m.exports) {
          if (m.exports?.[ex]?.getToken && m.exports[ex][Symbol.toStringTag] !== 'IntlMessagesProxy') return copy(m.exports[ex].getToken());
        }
      } catch {}
    }
  },
]);
window.webpackChunkdiscord_app.pop();
console.log('%cToken copied to clipboard!', 'color: #5865F2; font-size: 20px;');`;

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose, lang }) => {
  const t = translations[lang];
  const [copied, setCopied] = useState(false);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(TOKEN_SNIPPET);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="guide-modal-title"
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl glass-panel border border-white/[0.12] p-5 sm:p-7 shadow-2xl scrollbar-thin"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button (Touch target 44x44px minimum) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-6 pr-12">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h3 id="guide-modal-title" className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {t.guideModalTitle}
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              {t.guideModalSubtitle}
            </p>
          </div>
        </div>

        {/* Section 1: 3-Step Guide to Get Token */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              {t.guideStep1Title}
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Step 1 Card */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex flex-col justify-between">
              <div>
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 font-mono text-xs font-bold flex items-center justify-center mb-2.5">
                  01
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-white mb-1">
                  <Monitor className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Discord Web</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {t.guideStep1_1}
                </p>
              </div>
              <a
                href="https://discord.com/app"
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:underline"
              >
                discord.com/app <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Step 2 Card */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex flex-col justify-between">
              <div>
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 font-mono text-xs font-bold flex items-center justify-center mb-2.5">
                  02
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-white mb-1">
                  <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                  <span>DevTools Console</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {t.guideStep1_2}
                </p>
              </div>
              <span className="mt-3 text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.05] text-slate-400 border border-white/[0.08] w-fit">
                F12 / Ctrl+Shift+I
              </span>
            </div>

            {/* Step 3 Card */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex flex-col justify-between">
              <div>
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 font-mono text-xs font-bold flex items-center justify-center mb-2.5">
                  03
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-white mb-1">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Auto Copy</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {t.guideStep1_3}
                </p>
              </div>
              <span className="mt-3 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 w-fit">
                Auto in Clipboard
              </span>
            </div>
          </div>

          {/* Snippet Terminal Box */}
          <div className="relative rounded-2xl bg-[#050609] border border-white/[0.09] overflow-hidden shadow-inner">
            {/* Snippet Header */}
            <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#090B10] border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                <span className="text-[11px] font-mono text-slate-400 ml-2">
                  Console Script (Auto-Extract Token)
                </span>
              </div>
              <button
                onClick={handleCopySnippet}
                className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  copied
                    ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/30'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 active:scale-95'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? t.copiedCodeBtn : t.copyCodeBtn}</span>
              </button>
            </div>

            {/* Code */}
            <div className="p-4 overflow-x-auto max-h-48 scrollbar-thin">
              <pre className="text-[11px] font-mono leading-relaxed text-slate-300">
                {TOKEN_SNIPPET}
              </pre>
            </div>
          </div>

          <p className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" />
            {t.tokenClipboardNotice}
          </p>
        </div>

        {/* Section 2: Rate Limit Notice */}
        <div className="mb-6 p-4 rounded-2xl bg-amber-500/[0.05] border border-amber-500/20 space-y-2">
          <div className="flex items-center gap-2 text-amber-300 font-bold text-xs sm:text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{t.rateLimitTitle}</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {t.rateLimitDesc}
          </p>
          <div className="mt-2 text-xs text-amber-200/90 pl-3 border-l-2 border-amber-400/40 space-y-1">
            <p>{t.rateLimitStep1}</p>
            <p>{t.rateLimitStep2}</p>
            <p>{t.rateLimitStep3}</p>
          </div>
        </div>

        {/* Section 3: Ephemeral Security Commitment */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07] space-y-2">
          <div className="flex items-center gap-2 text-white font-bold text-xs sm:text-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{t.securityModalTitle}</span>
          </div>
          <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside pl-1 leading-relaxed">
            <li>{t.securityModalDesc2}</li>
            <li>{t.securityModalDesc3}</li>
            <li>{t.securityModalDesc4}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
