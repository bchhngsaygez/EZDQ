import React from 'react';
import {
  Zap,
  Terminal as TerminalIcon,
  BookOpen,
  Volume2,
  VolumeX,
  Github,
  Gamepad2,
  ExternalLink,
} from 'lucide-react';
import { QuestState } from '../types';
import { Language, translations } from '../i18n';

export type WorkspaceTab = 'quests' | 'terminal' | 'guide';

interface HeaderProps {
  state: QuestState;
  activeTab: WorkspaceTab;
  onTabChange: (tab: WorkspaceTab) => void;
  logCount: number;
  notificationEnabled: boolean;
  onToggleNotification: (enabled: boolean) => void;
  lang: Language;
  onToggleLang: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  state,
  activeTab,
  onTabChange,
  logCount,
  notificationEnabled,
  onToggleNotification,
  lang,
  onToggleLang,
}) => {
  const t = translations[lang];

  const getStatusBadge = () => {
    switch (state) {
      case 'running':
        return {
          label: t.statusRunning,
          color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
          dot: 'bg-emerald-400 animate-ping',
        };
      case 'starting':
        return {
          label: t.statusStarting,
          color: 'text-amber-400 bg-amber-500/10 border-amber-500/25',
          dot: 'bg-amber-400 animate-pulse',
        };
      case 'stopping':
        return {
          label: t.statusStopping,
          color: 'text-rose-400 bg-rose-500/10 border-rose-500/25',
          dot: 'bg-rose-400 animate-pulse',
        };
      case 'error':
        return {
          label: t.statusError,
          color: 'text-rose-400 bg-rose-500/10 border-rose-500/25',
          dot: 'bg-rose-400',
        };
      default:
        return {
          label: t.statusReady,
          color: 'text-slate-400 bg-white/[0.04] border-white/[0.08]',
          dot: 'bg-slate-400',
        };
    }
  };

  const status = getStatusBadge();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.07] bg-[#050609]/90 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand & Live Status */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
            <Zap className="w-5 h-5 fill-current" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white">
                EZDQ
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/[0.06] text-slate-400 border border-white/[0.08]">
                Studio v2.5
              </span>
            </div>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              Discord Quests Automation Engine
            </span>
          </div>

          {/* Live Status Pill */}
          <div
            className={`hidden md:inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold border ${status.color} transition-all ml-2`}
          >
            <span className="relative flex h-2 w-2">
              <span
                className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${status.dot}`}
              />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${status.dot}`} />
            </span>
            <span>{status.label}</span>
          </div>
        </div>

        {/* Central Workspace Tab Navigation */}
        <nav className="flex items-center p-1 rounded-2xl bg-[#090B10] border border-white/[0.07] text-xs font-medium">
          {/* Quests Tab */}
          <button
            type="button"
            onClick={() => onTabChange('quests')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-xl transition-all ${
              activeTab === 'quests'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>{lang === 'vi' ? 'Nhiệm vụ' : 'Missions'}</span>
          </button>

          {/* Terminal Tab */}
          <button
            type="button"
            onClick={() => onTabChange('terminal')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-xl transition-all ${
              activeTab === 'terminal'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <TerminalIcon className="w-3.5 h-3.5" />
            <span>{lang === 'vi' ? 'Nhật ký' : 'Terminal'}</span>
            {logCount > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  activeTab === 'terminal'
                    ? 'bg-white/20 text-white'
                    : 'bg-white/[0.08] text-slate-400'
                }`}
              >
                {logCount}
              </span>
            )}
          </button>

          {/* Guide Tab */}
          <button
            type="button"
            onClick={() => onTabChange('guide')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-xl transition-all ${
              activeTab === 'guide'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{t.guideBtn}</span>
          </button>
        </nav>

        {/* Quick Tools & Repo Link */}
        <div className="flex items-center gap-2">
          {/* Audio Chime Notification Toggle */}
          <button
            type="button"
            onClick={() => onToggleNotification(!notificationEnabled)}
            className={`p-2 rounded-xl border transition-all ${
              notificationEnabled
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20'
                : 'bg-white/[0.03] text-slate-500 border-white/[0.06] hover:text-slate-300 hover:bg-white/[0.06]'
            }`}
            title={
              notificationEnabled
                ? lang === 'vi'
                  ? 'Đang bật chuông thông báo'
                  : 'Audio notifications active'
                : lang === 'vi'
                  ? 'Chuông thông báo đang tắt'
                  : 'Audio notifications muted'
            }
            aria-label="Toggle notifications audio"
          >
            {notificationEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>

          {/* Language Switcher */}
          <button
            type="button"
            onClick={onToggleLang}
            className="px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] text-xs font-mono font-bold text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
            title={lang === 'vi' ? 'Chuyển sang tiếng Anh' : 'Switch to Vietnamese'}
          >
            <span>{lang === 'vi' ? 'VIE' : 'ENG'}</span>
          </button>

          {/* GitHub Repo Link */}
          <a
            href="https://github.com/bchhngsaygez/EZDQ"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] text-slate-400 hover:text-white transition-all hidden sm:flex items-center"
            title="GitHub Repository"
            aria-label="GitHub Repository"
          >
            <Github className="w-4 h-4" />
          </a>
        </div>
      </div>
    </header>
  );
};
