import React, { useState } from 'react';
import {
  Copy,
  Check,
  BookOpen,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Terminal,
  Monitor,
  KeyRound,
  FileCode,
} from 'lucide-react';
import { Language, translations } from '../i18n';

interface GuideViewProps {
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

export const GuideView: React.FC<GuideViewProps> = ({ lang }) => {
  const t = translations[lang];
  const [copied, setCopied] = useState(false);

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(TOKEN_SNIPPET);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title & Introduction */}
      <div className="rounded-2xl bg-[#090B10] border border-white/[0.08] p-5 sm:p-6 shadow-xl flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
          <BookOpen className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            {t.guideModalTitle}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            {t.guideModalSubtitle}
          </p>
        </div>
      </div>

      {/* 3 Steps Guide to Extract Token */}
      <div className="rounded-2xl bg-[#090B10] border border-white/[0.08] p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            {t.guideStep1Title}
          </h3>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Step 1 */}
          <div className="p-4 rounded-xl bg-[#050608] border border-white/[0.06] flex flex-col justify-between">
            <div>
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 font-mono text-xs font-bold flex items-center justify-center mb-2.5">
                01
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white mb-1">
                <Monitor className="w-3.5 h-3.5 text-indigo-400" />
                <span>Discord Web</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
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

          {/* Step 2 */}
          <div className="p-4 rounded-xl bg-[#050608] border border-white/[0.06] flex flex-col justify-between">
            <div>
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 font-mono text-xs font-bold flex items-center justify-center mb-2.5">
                02
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white mb-1">
                <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                <span>DevTools Console</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t.guideStep1_2}
              </p>
            </div>
            <span className="mt-3 text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.05] text-slate-400 border border-white/[0.08] w-fit">
              F12 / Ctrl+Shift+I
            </span>
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-xl bg-[#050608] border border-white/[0.06] flex flex-col justify-between">
            <div>
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 font-mono text-xs font-bold flex items-center justify-center mb-2.5">
                03
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white mb-1">
                <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                <span>Auto Copy</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t.guideStep1_3}
              </p>
            </div>
            <span className="mt-3 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 w-fit">
              Direct to Clipboard
            </span>
          </div>
        </div>

        {/* Snippet Code Box */}
        <div className="relative rounded-2xl bg-[#050608] border border-white/[0.08] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#090B10] border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-mono text-slate-300">
                Console Token Extraction Script
              </span>
            </div>
            <button
              type="button"
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

          <div className="p-4 overflow-x-auto max-h-56 scrollbar-thin">
            <pre className="text-xs font-mono leading-relaxed text-slate-300">
              {TOKEN_SNIPPET}
            </pre>
          </div>
        </div>

        <p className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5" />
          {t.tokenClipboardNotice}
        </p>
      </div>

      {/* Discord 429 Rate-Limit Mitigation */}
      <div className="rounded-2xl bg-amber-500/[0.05] border border-amber-500/20 p-5 sm:p-6 space-y-3">
        <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
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

      {/* Security Commitment (Zero Persistence) */}
      <div className="rounded-2xl bg-[#090B10] border border-white/[0.08] p-5 sm:p-6 space-y-3">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{t.securityModalTitle}</span>
        </div>
        <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside pl-1 leading-relaxed">
          <li>{t.securityModalDesc2}</li>
          <li>{t.securityModalDesc3}</li>
          <li>{t.securityModalDesc4}</li>
        </ul>
      </div>
    </div>
  );
};
