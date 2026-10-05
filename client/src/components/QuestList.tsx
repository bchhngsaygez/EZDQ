import React, { useState } from 'react';
import {
  Gamepad2,
  Video,
  Monitor,
  Gift,
  CheckCircle2,
  Clock,
  Layers,
  Flame,
} from 'lucide-react';
import { QuestItemState, QuestTaskConfigType } from '../types';
import { Language, translations } from '../i18n';

interface QuestListProps {
  quests: QuestItemState[];
  onClaimQuest: (questId: string) => void;
  lang: Language;
}

export const QuestList: React.FC<QuestListProps> = ({ quests, onClaimQuest, lang }) => {
  const t = translations[lang];
  const [filter, setFilter] = useState<'all' | 'running' | 'done' | 'skip'>('all');

  const getTaskIcon = (task: QuestTaskConfigType) => {
    switch (task) {
      case 'WATCH_VIDEO':
      case 'WATCH_VIDEO_ON_MOBILE':
        return <Video className="w-3.5 h-3.5 text-indigo-400" />;
      case 'PLAY_ON_DESKTOP':
        return <Monitor className="w-3.5 h-3.5 text-slate-300" />;
      case 'PLAY_ON_XBOX':
      case 'PLAY_ON_PLAYSTATION':
        return <Gamepad2 className="w-3.5 h-3.5 text-emerald-400" />;
      case 'PLAY_ACTIVITY':
      case 'ACHIEVEMENT_IN_ACTIVITY':
        return <Flame className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <Gamepad2 className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getTaskLabel = (task: QuestTaskConfigType) => {
    if (lang === 'en') {
      switch (task) {
        case 'WATCH_VIDEO':
          return 'Watch Video';
        case 'WATCH_VIDEO_ON_MOBILE':
          return 'Watch Video (Mobile)';
        case 'PLAY_ON_DESKTOP':
          return 'Play on Desktop';
        case 'PLAY_ON_XBOX':
          return 'Play on Xbox';
        case 'PLAY_ON_PLAYSTATION':
          return 'Play on PlayStation';
        case 'PLAY_ACTIVITY':
          return 'Voice Activity';
        case 'ACHIEVEMENT_IN_ACTIVITY':
          return 'Discord Says Achievement';
        default:
          return 'Discord Quest';
      }
    }
    switch (task) {
      case 'WATCH_VIDEO':
        return 'Xem video';
      case 'WATCH_VIDEO_ON_MOBILE':
        return 'Xem video (Mobile)';
      case 'PLAY_ON_DESKTOP':
        return 'Chơi game trên PC';
      case 'PLAY_ON_XBOX':
        return 'Chơi trên Xbox';
      case 'PLAY_ON_PLAYSTATION':
        return 'Chơi trên PlayStation';
      case 'PLAY_ACTIVITY':
        return 'Hoạt động phòng thoại';
      case 'ACHIEVEMENT_IN_ACTIVITY':
        return 'Thành tựu Discord Says';
      default:
        return 'Nhiệm vụ Discord';
    }
  };

  const filteredQuests = quests.filter((q) => {
    if (filter === 'running') return q.status === 'running';
    if (filter === 'done') return q.status === 'done' || q.claimed;
    if (filter === 'skip') return q.status === 'skip' || q.status === 'error';
    return true;
  });

  return (
    <div className="rounded-2xl p-5 sm:p-6 glass-panel border border-white/[0.07] mb-8">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-white/[0.06]">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            {t.questBoardTitle}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">{t.questBoardSubtitle}</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#080A0E] border border-white/[0.06]">
          {[
            { id: 'all', label: t.tabAll, count: quests.length },
            { id: 'running', label: t.tabRunning, count: quests.filter((q) => q.status === 'running').length },
            { id: 'done', label: t.tabDone, count: quests.filter((q) => q.status === 'done' || q.claimed).length },
            { id: 'skip', label: t.tabRateLimit, count: quests.filter((q) => q.status === 'skip' || q.status === 'error').length },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id as any)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                filter === item.id
                  ? 'bg-white/[0.1] text-white font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              <span>{item.label}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/[0.06] text-slate-400">
                {item.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Quest Cards Grid */}
      {filteredQuests.length === 0 ? (
        <div className="py-10 text-center">
          <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-2 text-slate-500">
            <Gamepad2 className="w-6 h-6" />
          </div>
          <h4 className="text-xs font-semibold text-slate-300">{t.emptyQuestsTitle}</h4>
          <p className="text-xs text-slate-500 mt-0.5 max-w-sm mx-auto">{t.emptyQuestsDesc}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredQuests.map((quest) => {
            const need = quest.secondsNeeded || 0;
            const done = quest.secondsDone || 0;
            const pct = need > 0 ? Math.min(100, Math.round((done / need) * 100)) : quest.status === 'done' ? 100 : 0;
            const isFinished = quest.status === 'done' || quest.claimed;

            return (
              <div
                key={quest.id}
                className="rounded-xl p-4 glass-card border border-white/[0.06] flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Icon + Title + Status */}
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] overflow-hidden flex items-center justify-center shrink-0">
                        {quest.icon ? (
                          <img
                            src={quest.icon}
                            alt={quest.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          getTaskIcon(quest.task)
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white line-clamp-1">
                          {quest.name}
                        </h4>
                        <span className="text-xs text-slate-400 font-normal line-clamp-1">
                          {quest.application}
                        </span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0">
                      {isFinished ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          {t.badgeDone}
                        </span>
                      ) : quest.status === 'running' ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
                          {t.badgeRunning}
                        </span>
                      ) : quest.status === 'skip' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          <Clock className="w-3 h-3" />
                          {t.badgeRateLimit}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-white/[0.04] text-slate-400">
                          {t.badgePending}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Task Meta Pill */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/[0.03] text-[11px] text-slate-300 border border-white/[0.05]">
                      {getTaskIcon(quest.task)}
                      {getTaskLabel(quest.task)}
                    </span>
                    {quest.rewardName && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/[0.03] text-[11px] text-slate-300 border border-white/[0.05] line-clamp-1">
                        <Gift className="w-3 h-3 text-indigo-400" />
                        {quest.rewardName}
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress Bar & Actions */}
                <div className="pt-2 border-t border-white/[0.04]">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>
                      {need > 0
                        ? `${Math.floor(done / 60)} / ${Math.ceil(need / 60)} ${t.minutesUnit}`
                        : `${pct}%`}
                    </span>
                    <span className="font-semibold text-slate-200">{pct}%</span>
                  </div>

                  {/* Clean Minimalist Progress Bar */}
                  <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isFinished ? 'bg-emerald-400' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  {/* Claim Button */}
                  {isFinished && !quest.claimed && (
                    <div className="mt-2.5">
                      <button
                        type="button"
                        onClick={() => onClaimQuest(quest.id)}
                        className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Gift className="w-3.5 h-3.5" />
                        <span>{t.claimRewardBtn}</span>
                      </button>
                    </div>
                  )}

                  {/* Rate limit hint */}
                  {quest.status === 'skip' && (
                    <div className="mt-2 p-1.5 rounded bg-amber-500/[0.06] border border-amber-500/15 text-[11px] text-amber-300/90 leading-tight">
                      💡 {t.rateLimitHint}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
