import React, { useState } from 'react';
import {
  CheckCircle2,
  X,
  Github,
  ExternalLink,
  Code2,
  ShieldCheck,
} from 'lucide-react';
import { BackgroundCanvas } from './components/BackgroundCanvas';
import { Header } from './components/Header';
import { StatsOverview } from './components/StatsOverview';
import { TokenSessionCard } from './components/TokenSessionCard';
import { DiscordProfileCard } from './components/DiscordProfileCard';
import { QuestList } from './components/QuestList';
import { ConsoleTerminal } from './components/ConsoleTerminal';
import { GuideModal } from './components/GuideModal';
import { useQuestSocket } from './hooks/useQuestSocket';
import { Language, translations } from './i18n';

export const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('vi');
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const t = translations[lang];

  const {
    state,
    profile,
    quests,
    logs,
    customStatusActive,
    errorMessage,
    notificationEnabled,
    completionBanner,
    toggleNotification,
    dismissCompletionBanner,
    startQuest,
    stopQuest,
    claimQuest,
    clearLogs,
    resetSession,
  } = useQuestSocket();

  const handleToggleLang = () => {
    setLang((prev) => (prev === 'vi' ? 'en' : 'vi'));
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between selection:bg-indigo-500/20 selection:text-white">
      {/* Subtle Refined Background */}
      <BackgroundCanvas />

      {/* Completion Notification Alert / Banner */}
      {completionBanner && (
        <div className="fixed inset-x-4 top-18 z-50 max-w-xl mx-auto animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/90 to-slate-900/90 border border-emerald-500/40 p-4 shadow-2xl backdrop-blur-xl flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="flex-1 pr-2">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                {t.completionBannerTitle}
              </h4>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                {completionBanner}
              </p>
              <div className="mt-2.5 flex items-center gap-2">
                <button
                  onClick={dismissCompletionBanner}
                  className="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-colors"
                >
                  {t.closeBtn}
                </button>
              </div>
            </div>
            <button
              onClick={dismissCompletionBanner}
              className="text-slate-400 hover:text-white transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="relative z-10 flex flex-col flex-1">
        {/* Navigation Header */}
        <Header
          state={state}
          customStatusActive={customStatusActive}
          onOpenGuide={() => setIsGuideOpen(true)}
          lang={lang}
          onToggleLang={handleToggleLang}
        />

        {/* Content */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
          {/* Quick Metrics */}
          <StatsOverview quests={quests} lang={lang} />

          {/* Discord Profile Card */}
          <DiscordProfileCard profile={profile} customStatusActive={customStatusActive} lang={lang} />

          {/* Token & Ephemeral RAM Session Control (with Parallel Mode & Auto CAPTCHA) */}
          <TokenSessionCard
            state={state}
            onStart={startQuest}
            onStop={stopQuest}
            onReset={resetSession}
            errorMessage={errorMessage}
            lang={lang}
            notificationEnabled={notificationEnabled}
            onToggleNotification={toggleNotification}
          />

          {/* Quests Display Board */}
          <QuestList quests={quests} onClaimQuest={claimQuest} lang={lang} />

          {/* Live Terminal Log */}
          <ConsoleTerminal logs={logs} onClear={clearLogs} lang={lang} />
        </main>
      </div>

      {/* Clean Minimalist Open-Source Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] bg-[#07080B]/90 backdrop-blur-md py-6 text-xs text-slate-400">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-4">
          {/* Top Row: Brand, Badges & GitHub Link */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Left: Brand & Open Source Badges */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 sm:gap-2.5">
              <div className="flex items-center gap-2 font-bold text-white tracking-tight">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{t.footerBrand}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-400 border border-white/[0.08]">
                  {t.footerVersion}
                </span>
              </div>

              <span className="hidden sm:inline text-white/20">•</span>

              {/* Badge 1: Open Source Software */}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[11px] font-medium">
                <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                {t.footerOpenSource}
              </span>

              {/* Badge 2: Free to Inspect & Audit */}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[11px] font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                {t.footerFreeToCheck}
              </span>

              {/* Badge 3: No Copyright / Free Forever */}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[11px] font-medium">
                <span className="text-xs">⚖️</span>
                {t.footerNoCopyright}
              </span>
            </div>

            {/* Right: GitHub Repo Button */}
            <a
              href="https://github.com/bchhngsaygez/EZDQ"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 hover:text-white border border-white/[0.1] hover:border-white/20 transition-all shadow-sm group"
            >
              <Github className="w-4 h-4 text-slate-300 group-hover:text-white transition-colors" />
              <span className="font-semibold text-xs">{t.footerGithubBtn}</span>
              <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-slate-300 transition-colors" />
            </a>
          </div>

          {/* Bottom Row: Security / Zero-Persistence note */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-white/[0.04] text-[11px] text-slate-500 text-center sm:text-left">
            <span>{t.footerSecurity}</span>
            <span className="text-slate-600">
              100% Client/RAM-isolated • Zero Tracking • Free & Open Source
            </span>
          </div>
        </div>
      </footer>

      {/* Guide & FAQ Modal */}
      <GuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} lang={lang} />
    </div>
  );
};

export default App;
