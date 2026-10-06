import React from 'react';
import { Gamepad2, PlayCircle, CheckCircle2, Clock, Zap } from 'lucide-react';
import { Quest } from '../types';
import { Language, translations } from '../i18n';

interface StatsOverviewProps {
  quests: Quest[];
  lang: Language;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ quests, lang }) => {
  const t = translations[lang];

  const total = quests.length;
  const running = quests.filter((q) => q.status === 'running').length;
  const completed = quests.filter((q) => q.status === 'done' || q.status === 'claimed').length;

  // Calculate estimated time saved
  const timeSavedMinutes = quests.reduce((acc, q) => {
    if (q.status === 'done' || q.status === 'claimed') {
      const minutes = Math.ceil((q.secondsNeeded || 900) / 60);
      return acc + minutes;
    }
    return acc;
  }, 0);

  return (
    <div className="w-full rounded-2xl bg-[#090B10] border border-white/[0.07] p-3 sm:p-4 shadow-lg">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.06]">
        {/* Metric 1: Total */}
        <div className="flex items-center gap-3 pt-2 sm:pt-0 sm:px-3 first:pt-0 first:px-0">
          <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center text-slate-300 shrink-0">
            <Gamepad2 className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {t.statTotal}
            </div>
            <div className="text-xl sm:text-2xl font-black text-white font-mono leading-tight mt-0.5">
              {total}
            </div>
          </div>
        </div>

        {/* Metric 2: In Progress */}
        <div className="flex items-center gap-3 pt-2 sm:pt-0 sm:px-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <PlayCircle className={`w-5 h-5 ${running > 0 ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>{t.statRunning}</span>
              {running > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              )}
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono leading-tight mt-0.5">
              {running}
            </div>
          </div>
        </div>

        {/* Metric 3: Completed */}
        <div className="flex items-center gap-3 pt-2 sm:pt-0 sm:px-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {t.statCompleted}
            </div>
            <div className="text-xl sm:text-2xl font-black text-white font-mono leading-tight mt-0.5">
              {completed}
            </div>
          </div>
        </div>

        {/* Metric 4: Time Saved */}
        <div className="flex items-center gap-3 pt-2 sm:pt-0 sm:px-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <span>{t.statTimeSaved}</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
                AFK
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-300 font-mono leading-tight mt-0.5">
              {timeSavedMinutes} <span className="text-xs font-normal text-slate-400">{t.minutesUnit}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
