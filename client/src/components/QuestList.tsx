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
  Lightbulb,
  Sparkles,
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
          return 'Play on PC';
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
    <div className="rounded-3xl p-5 sm:p-7 glass-panel border border-white/[0.08] mb-8 shadow-2xl shadow-black/20">
      {/* Header & Filter Tabs Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/[0.06]">
        <div>
          <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2 tracking-tight">
            <Layers className="w-5 h-5 text-indigo-400" />
            <span>{t.questBoardTitle}</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">{t.questBoardSubtitle}</p>
        </div>

        {/* Filter Pills with Badge Counters */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#06080D] border border-white/[0.08] overflow-x-auto">
          {[
            { id: 'all', label: t.tabAll, count: quests.length },
            { id: 'running', label: t.tabRunning, count: quests.filter((q) => q.status === 'running').length },
            { id: 'done', label: t.tabDone, count: quests.filter((q) => q.status === 'done' || q.claimed).length },
            { id: 'skip', label: t.tabRateLimit, count: quests.filter((q) => q.status === 'skip' || q.status === 'error').length },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                filter === item.id
                  ? 'bg-indigo-600/30 text-white border border-indigo-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <span>{item.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  filter === item.id
                    ? 'bg-indigo-500 text-white font-bold'
                    : 'bg-white/[0.06] text-slate-400'
                }`}
              >
                {item.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Quest Cards Grid */}
      {filteredQuests.length === 0 ? (
        <div className="py-14 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mx-auto mb-3 text-slate-500">
            <Gamepad2 className="w-7 h-7" />
          </div>
          <h4 className="text-sm font-bold text-slate-300">{t.emptyQuestsTitle}</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
            {t.emptyQuestsDesc}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredQuests.map((quest) => {
            const need = quest.secondsNeeded || 0;
            const done = quest.secondsDone || 0;
            const pct = need > 0 ? Math.min(100, Math.round((done / need) * 100)) : quest.status === 'done' ? 100 : 0;
            const isFinished = quest.status === 'done' || quest.claimed;

            return (
              <div
                key={quest.id}
                className="group relative rounded-2xl p-4 sm:p-5 glass-card border border-white/[0.07] hover:border-white/[0.18] flex flex-col justify-between transition-all duration-200"
              >
                <div>
                  {/* Top Bar: Icon + Game & Quest Title + Status Pill */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] overflow-hidden flex items-center justify-center shrink-0 shadow-md">
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
                        <h4 className="text-sm font-bold text-white line-clamp-1 group-hover:text-indigo-200 transition-colors">
                          {quest.name}
                        </h4>
                        <span className="text-xs text-slate-400 font-medium line-clamp-1">
                          {quest.application}
                        </span>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <div className="shrink-0">
                      {isFinished ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{t.badgeDone}</span>
                        </span>
                      ) : quest.status === 'running' ? (
                        <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping"></span>
                          <span>{t.badgeRunning}</span>
                        </span>
                      ) : quest.status === 'skip' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/25">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span>{t.badgeRateLimit}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/[0.04] text-slate-400 border border-white/[0.06]">
                          <span>{t.badgePending}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Task Meta Badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-3.5">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] text-[11px] font-medium text-slate-300 border border-white/[0.06]">
                      {getTaskIcon(quest.task)}
                      <span>{getTaskLabel(quest.task)}</span>
                    </span>
                    {quest.rewardName && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 text-[11px] font-semibold text-indigo-300 border border-indigo-500/20 line-clamp-1">
                        <Gift className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{quest.rewardName}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress Bar & Actions */}
                <div className="pt-3 border-t border-white/[0.06]">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                    <span className="font-mono text-[11px]">
                      {need > 0
                        ? `${Math.floor(done / 60)} / ${Math.ceil(need / 60)} ${t.minutesUnit}`
                        : `${pct}%`}
                    </span>
                    <span className="font-mono font-bold text-slate-200">{pct}%</span>
                  </div>

                  {/* High Quality Progress Bar with Shimmer */}
                  <div className="relative w-full h-2 rounded-full bg-white/[0.08] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isFinished
                          ? 'bg-emerald-400'
                          : 'bg-gradient-to-r from-indigo-500 via-indigo-400 to-purple-500 shimmer-bar'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  {/* Claim Reward Button */}
                  {isFinished && !quest.claimed && (
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => onClaimQuest(quest.id)}
                        className="w-full py-2 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
                      >
                        <Sparkles className="w-3.5 h-3.5 fill-current" />
                        <span>{t.claimRewardBtn}</span>
                      </button>
                    </div>
                  )}

                  {/* Rate Limit Advice Card (No Emoji) */}
                  {quest.status === 'skip' && (
                    <div className="mt-2.5 p-2 rounded-xl bg-amber-500/[0.08] border border-amber-500/20 text-[11px] text-amber-200/90 leading-relaxed flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{t.rateLimitHint}</span>
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
