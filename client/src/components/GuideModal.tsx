import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  HelpCircle,
  Lightbulb,
  ExternalLink,
  Lock,
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

  if (!isOpen) return null;

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(TOKEN_SNIPPET);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl max-h-[88vh] overflow-y-auto rounded-2xl glass-panel border border-white/[0.1] p-5 sm:p-7 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 mb-5">
          <div className="p-2 rounded-xl bg-white/[0.04] text-indigo-400 border border-white/[0.08]">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white">{t.guideModalTitle}</h3>
            <p className="text-xs text-slate-400">{t.guideModalSubtitle}</p>
          </div>
        </div>

        {/* Section 1: How to get token */}
        <div className="mb-5 space-y-2.5">
          <h4 className="text-xs sm:text-sm font-semibold text-white">
            1. {t.guideStep1Title}
          </h4>
          <ol className="text-xs text-slate-300 space-y-1.5 list-decimal list-inside pl-1 leading-relaxed">
            <li>
              {t.guideStep1_1}{' '}
              <a
                href="https://discord.com/app"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 hover:underline inline-flex items-center gap-1 font-medium"
              >
                discord.com/app <ExternalLink className="w-3 h-3" />
              </a>
            </li>
            <li>{t.guideStep1_2}</li>
            <li>{t.guideStep1_3}</li>
          </ol>

          {/* Script Box */}
          <div className="relative rounded-xl bg-[#06070A] border border-white/[0.08] p-3 text-xs font-mono text-slate-300 overflow-x-auto">
            <button
              onClick={handleCopySnippet}
              className="absolute top-2 right-2 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1 transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? t.copiedCodeBtn : t.copyCodeBtn}</span>
            </button>
            <pre className="pr-20 text-[11px] leading-relaxed text-slate-400">{TOKEN_SNIPPET}</pre>
          </div>
          <p className="text-[11px] text-emerald-400 font-medium">
            {t.tokenClipboardNotice}
          </p>
        </div>

        {/* Section 2: Rate Limit Discord & Fix */}
        <div className="mb-5 p-3.5 rounded-xl bg-amber-500/[0.06] border border-amber-500/15 space-y-1.5">
          <h4 className="text-xs sm:text-sm font-semibold text-amber-300 flex items-center gap-1.5">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            {t.rateLimitTitle}
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">{t.rateLimitDesc}</p>
          <div className="text-xs text-amber-200/90 pl-2.5 border-l-2 border-amber-400/30 space-y-0.5">
            <p>{t.rateLimitStep1}</p>
            <p>{t.rateLimitStep2}</p>
            <p>{t.rateLimitStep3}</p>
          </div>
        </div>

        {/* Section 3: Zero Persistence Security */}
        <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1.5">
          <h4 className="text-xs sm:text-sm font-semibold text-slate-200 flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-indigo-400" />
            {t.securityModalTitle}
          </h4>
          <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside pl-1">
            <li>{t.securityModalDesc2}</li>
            <li>{t.securityModalDesc3}</li>
            <li>{t.securityModalDesc4}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
