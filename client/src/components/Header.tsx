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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            {t.statusStarting}
          </span>
        );
      case 'running':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            {t.statusRunning}
          </span>
        );
      case 'stopping':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
            {t.statusStopping}
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
            {t.statusError}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white/[0.04] text-slate-300 border border-white/[0.08]">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            {t.statusReady}
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.06] bg-[#0A0B0E]/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-discord-blurple/20 text-indigo-400 border border-discord-blurple/30">
            <Zap className="w-4 h-4 text-discord-blurple" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-white tracking-tight">
                AutoQuest <span className="text-indigo-400 font-medium">Web</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/[0.06] text-slate-400 border border-white/[0.06]">
                v2.0
              </span>
            </div>
          </div>
        </div>

        {/* Right Actions: Language Switcher, Status Pill, Guide */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Discord Status preview */}
          {customStatusActive && (
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.doingQuestStatus}</span>
            </div>
          )}

          {/* Status Badge */}
          {getStatusBadge()}

          {/* Language Switcher */}
          <button
            onClick={onToggleLang}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all"
            title="Đổi ngôn ngữ / Switch language"
          >
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span>{lang === 'vi' ? '🇻🇳 VN' : '🇺🇸 EN'}</span>
          </button>

          {/* Guide Button */}
          <button
            onClick={onOpenGuide}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">{t.guideBtn}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
