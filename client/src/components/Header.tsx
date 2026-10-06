import React from 'react';
import { HelpCircle, Activity, Zap, Globe } from 'lucide-react';
import { BotState } from '../types';
import { Language, translations } from '../i18n';

interface HeaderProps {
  state: BotState;
  customStatusActive: boolean;
  onOpenGuide: () => void;
  lang: Language;
  onToggleLang: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  state,
  customStatusActive,
  onOpenGuide,
  lang,
  onToggleLang,
}) => {
  const t = translations[lang];

  const getStatusBadge = () => {
    switch (state) {
      case 'starting':
        return (
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/25 animate-pulse shadow-sm shadow-amber-500/10">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>{t.statusStarting}</span>
          </span>
        );
      case 'running':
        return (
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 shadow-sm shadow-emerald-500/10">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>{t.statusRunning}</span>
          </span>
        );
      case 'stopping':
        return (
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/25">
            <span className="w-2 h-2 rounded-full bg-rose-400"></span>
            <span>{t.statusStopping}</span>
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/25">
            <span className="w-2 h-2 rounded-full bg-rose-400"></span>
            <span>{t.statusError}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-white/[0.04] text-slate-300 border border-white/[0.08]">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            <span>{t.statusReady}</span>
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.07] bg-[#07090E]/85 backdrop-blur-xl transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/10 text-indigo-400 border border-indigo-500/30 shadow-lg shadow-indigo-500/10">
            <Zap className="w-4.5 h-4.5 text-indigo-400" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
                <span>EZDQ</span>
                <span className="text-indigo-400 font-semibold text-xs px-1.5 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20">
                  WEB
                </span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.05] text-slate-400 border border-white/[0.06] hidden sm:inline-block">
                v2.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden md:block leading-none mt-0.5">
              {t.subtitle}
            </p>
          </div>
        </div>

        {/* Right Actions: Status Pill, Language Switcher, Guide */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Discord Status preview pill */}
          {customStatusActive && (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 shadow-sm shadow-emerald-500/10">
              <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span className="truncate max-w-[200px]">{t.doingQuestStatus}</span>
            </div>
          )}

          {/* Status Badge */}
          {getStatusBadge()}

          {/* Language Switcher (Vector based, No Emoji) */}
          <button
            type="button"
            onClick={onToggleLang}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.15] transition-all min-h-[38px] active:scale-[0.97]"
            title={lang === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
            aria-label="Toggle language"
          >
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-mono text-[11px] font-bold tracking-wider">
              {lang === 'vi' ? 'VIE' : 'ENG'}
            </span>
          </button>

          {/* Guide Button */}
          <button
            type="button"
            onClick={onOpenGuide}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.15] transition-all min-h-[38px] active:scale-[0.97]"
            aria-label={t.guideBtn}
          >
            <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">{t.guideBtn}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
