import React from 'react';
import { Target, PlayCircle, CheckCircle2, Clock, Zap } from 'lucide-react';
import { QuestItemState } from '../types';
import { Language, translations } from '../i18n';

interface StatsOverviewProps {
  quests: QuestItemState[];
  lang: Language;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ quests, lang }) => {
  const t = translations[lang];
  const total = quests.length;
  const running = quests.filter((q) => q.status === 'running').length;
  const completed = quests.filter((q) => q.status === 'done' || q.claimed).length;

  const savedMinutes = quests
    .filter((q) => q.status === 'done' || q.claimed)
    .reduce((acc, q) => acc + Math.ceil((q.secondsNeeded || 900) / 60), 0);

  const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const stats = [
    {
      label: t.statTotal,
      value: total,
      subValue: total > 0 ? `${completionPct}% completed` : undefined,
      icon: Target,
      accentColor: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10 border-indigo-500/20',
      ambientGlow: 'from-indigo-500/5 to-transparent',
    },
    {
      label: t.statRunning,
      value: running,
      subValue: running > 0 ? 'Active heartbeat' : undefined,
      icon: PlayCircle,
      accentColor: 'text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/20',
      ambientGlow: 'from-amber-500/5 to-transparent',
      isLive: running > 0,
    },
    {
      label: t.statCompleted,
      value: completed,
      subValue: completed > 0 ? 'Claimed rewards' : undefined,
      icon: CheckCircle2,
      accentColor: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20',
      ambientGlow: 'from-emerald-500/5 to-transparent',
    },
    {
      label: t.statTimeSaved,
      value: savedMinutes > 0 ? `${savedMinutes} ${t.minutesUnit}` : `0 ${t.minutesUnit}`,
      subValue: savedMinutes > 0 ? 'AFK automated' : undefined,
      icon: Clock,
      accentColor: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10 border-cyan-500/20',
      ambientGlow: 'from-cyan-500/5 to-transparent',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {stats.map((s, idx) => {
        const Icon = s.icon;
        return (
          <div
            key={idx}
            className="group relative rounded-2xl p-4 sm:p-5 glass-panel border border-white/[0.07] hover:border-white/[0.18] transition-all duration-300 hover:-translate-y-0.5 overflow-hidden shadow-lg shadow-black/20"
          >
            {/* Ambient Background Gradient */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${s.ambientGlow} pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity`}
            />

            <div className="relative z-10 flex items-start justify-between">
              <div>
                <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                  {s.label}
                  {s.isLive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                  )}
                </p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                    {s.value}
                  </h3>
                </div>
                {s.subValue && (
                  <p className="text-[11px] text-slate-400 mt-1 font-medium flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5 text-indigo-400" />
                    <span>{s.subValue}</span>
                  </p>
                )}
              </div>

              {/* Icon Container */}
              <div
                className={`p-2.5 rounded-xl border ${s.bgColor} shadow-sm group-hover:scale-105 transition-transform duration-200 shrink-0`}
              >
                <Icon className={`w-5 h-5 ${s.accentColor}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
