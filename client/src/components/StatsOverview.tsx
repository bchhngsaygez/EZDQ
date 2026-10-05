import React from 'react';
import { Target, PlayCircle, CheckCircle2, Clock } from 'lucide-react';
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

  const stats = [
    {
      label: t.statTotal,
      value: total,
      icon: Target,
      iconColor: 'text-indigo-400',
    },
    {
      label: t.statRunning,
      value: running,
      icon: PlayCircle,
      iconColor: 'text-amber-400',
    },
    {
      label: t.statCompleted,
      value: completed,
      icon: CheckCircle2,
      iconColor: 'text-emerald-400',
    },
    {
      label: t.statTimeSaved,
      value: savedMinutes > 0 ? `${savedMinutes} ${t.minutesUnit}` : `0 ${t.minutesUnit}`,
      icon: Clock,
      iconColor: 'text-slate-300',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {stats.map((s, idx) => {
        const Icon = s.icon;
        return (
          <div
            key={idx}
            className="rounded-2xl p-4 sm:p-5 glass-panel border border-white/[0.06] hover:border-white/[0.12] transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400 mb-1">{s.label}</p>
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {s.value}
                </h3>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                <Icon className={`w-5 h-5 ${s.iconColor}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
