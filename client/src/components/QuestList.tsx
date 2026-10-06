import React, { useState } from 'react';
import {
  Gamepad2,
  Gift,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { Quest } from '../types';
import { Language, translations } from '../i18n';

interface QuestListProps {
  quests: Quest[];
  onClaimQuest?: (questId: string) => void;
  lang: Language;
}

export const QuestList: React.FC<QuestListProps> = ({ quests, lang }) => {
  const t = translations[lang];
  const [activeFilter, setActiveFilter] = useState<'all' | 'running' | 'done' | 'available'>('all');

  const filteredQuests = quests.filter((q) => {
    if (activeFilter === 'running') return q.status === 'running';
    if (activeFilter === 'done') return q.status === 'done' || q.status === 'claimed';
    if (activeFilter === 'available') return q.status === 'pending' || q.status === 'available';
    return true;
  });

  const runningCount = quests.filter((q) => q.status === 'running').length;
  const doneCount = quests.filter((q) => q.status === 'done' || q.status === 'claimed').length;
  const availableCount = quests.filter((q) => q.status === 'pending' || q.status === 'available').length;

  return (
    <div className="space-y-4">
      {/* Filter Tabs & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            {t.questBoardTitle}
          </h3>
          <span className="text-xs font-mono text-slate-500">
            ({quests.length})
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 shrink-0 ${
              activeFilter === 'all'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                : 'bg-white/[0.03] text-slate-400 border-white/[0.07] hover:text-white'
            }`}
          >
            <span>{t.tabAll}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/10 font-mono">
              {quests.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('running')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 shrink-0 ${
              activeFilter === 'running'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                : 'bg-white/[0.03] text-slate-400 border-white/[0.07] hover:text-white'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{t.tabRunning}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/10 font-mono">
              {runningCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('available')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 shrink-0 ${
              activeFilter === 'available'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                : 'bg-white/[0.03] text-slate-400 border-white/[0.07] hover:text-white'
            }`}
          >
            <span>{lang === 'vi' ? 'Sẵn sàng' : 'Available'}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/10 font-mono">
              {availableCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('done')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 shrink-0 ${
              activeFilter === 'done'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                : 'bg-white/[0.03] text-slate-400 border-white/[0.07] hover:text-white'
            }`}
          >
            <span>{t.tabDone}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/10 font-mono">
              {doneCount}
            </span>
          </button>
        </div>
      </div>

      {/* Quest Grid */}
      {filteredQuests.length === 0 ? (
        <div className="rounded-2xl bg-[#090B10] border border-white/[0.07] p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-500 mx-auto">
            <Gamepad2 className="w-6 h-6 text-slate-400" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">
              {t.emptyQuestsTitle}
            </h4>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
              {t.emptyQuestsDesc}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredQuests.map((quest) => {
            const isDone = quest.status === 'done' || quest.status === 'claimed';
            const isRunning = quest.status === 'running';
            const isRateLimit = quest.status === 'error' && quest.reason?.includes('429');

            const targetSeconds = quest.secondsNeeded || 900;
            const currentSeconds = isDone ? targetSeconds : (quest.secondsDone || 0);
            const percent = isDone
              ? 100
              : targetSeconds > 0
              ? Math.min(100, Math.max(0, Math.round((currentSeconds / targetSeconds) * 100)))
              : 0;
            const durationMinutes = Math.ceil(targetSeconds / 60);

            const iconUrl = quest.icon;
            const gameTitle = quest.application || 'Discord Quest';
            const questTitle = quest.name;
            const rewardName = quest.rewardName;

            return (
              <div
                key={quest.id}
                className="rounded-2xl bg-[#090B10] border border-white/[0.08] hover:border-white/[0.14] p-4 transition-all shadow-md group relative overflow-hidden"
              >
                {/* Active progress accent line at top */}
                {isRunning && (
                  <div
                    className="absolute top-0 left-0 h-0.5 bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-300"
                    style={{ width: `${percent}%` }}
                  />
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left: Thumbnail & Quest Details */}
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    {/* Game Avatar/Icon */}
                    <div className="w-12 h-12 rounded-xl bg-white/[0.05] border border-white/[0.08] overflow-hidden shrink-0 flex items-center justify-center relative">
                      {iconUrl ? (
                        <img
                          src={iconUrl}
                          alt={gameTitle}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Gamepad2 className="w-6 h-6 text-indigo-400" />
                      )}
                    </div>

                    {/* Titles */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 truncate">
                          {gameTitle}
                        </span>
                        <span className="text-white/20 text-xs">•</span>
                        <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {durationMinutes} {t.minutesUnit}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white truncate mt-0.5 group-hover:text-indigo-300 transition-colors">
                        {questTitle}
                      </h4>

                      {/* Reward chip */}
                      {rewardName && (
                        <div className="text-[11px] text-amber-300/90 flex items-center gap-1 mt-0.5">
                          <Gift className="w-3 h-3 text-amber-400 shrink-0" />
                          <span className="truncate">{rewardName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Status Pill & Action */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/[0.05]">
                    {/* Status Pill */}
                    {isDone ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-xs font-bold font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>100% DONE</span>
                      </span>
                    ) : isRunning ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-xs font-bold font-mono">
                        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                        <span>{percent}% RUNNING</span>
                      </span>
                    ) : isRateLimit ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/25 text-xs font-bold">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        <span>RATE LIMIT</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/[0.04] text-slate-400 border border-white/[0.08] text-xs font-medium">
                        <span>{t.badgePending}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress Bar (Visible when running or pending) */}
                {!isDone && (
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span>Progress</span>
                      <span className="font-bold text-white">{percent}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isRunning
                            ? 'bg-gradient-to-r from-indigo-500 to-emerald-400 shimmer-bar'
                            : 'bg-white/20'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Rate Limit Advice Card */}
      <div className="rounded-xl bg-[#090B10] border border-white/[0.06] p-3 text-xs text-slate-400 flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <span className="leading-relaxed">
          {t.rateLimitHint}
        </span>
      </div>
    </div>
  );
};
