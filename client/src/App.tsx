import React, { useState } from 'react';
import {
  CheckCircle2,
  X,
  Github,
  ExternalLink,
  Code2,
  ShieldCheck,
  Scale,
  Sparkles,
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
    <div className="relative min-h-screen flex flex-col justify-between selection:bg-indigo-500/25 selection:text-white antialiased font-sans bg-[#050608]">
      {/* Subtle Refined Background */}
      <BackgroundCanvas />

      {/* Completion Notification Alert Toast / Banner */}
      {completionBanner && (
        <div className="fixed inset-x-4 top-20 z-50 max-w-lg mx-auto animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/95 via-slate-900/95 to-indigo-950/95 border border-emerald-500/40 p-4 shadow-2xl backdrop-blur-2xl flex items-start gap-3.5">
            {/* Shimmer accent line */}
            <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-shimmer" />

            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>

            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h4 className="text-sm font-bold text-white tracking-wide">
                  {t.completionBannerTitle}
                </h4>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed break-words">
                {completionBanner}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={dismissCompletionBanner}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/35 text-emerald-300 text-xs font-bold transition-all active:scale-95"
                >
                  {t.closeBtn}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={dismissCompletionBanner}
              className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/[0.06]"
              aria-label="Dismiss completion notification"
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
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 space-y-6">
          {/* Quick Metrics (Bento Grid) */}
          <StatsOverview quests={quests} lang={lang} />

          {/* Discord Gamer Passport Profile Card */}
          <DiscordProfileCard profile={profile} customStatusActive={customStatusActive} lang={lang} />

          {/* Token & Ephemeral RAM Session Command Center */}
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

          {/* Live Studio Terminal Log */}
          <ConsoleTerminal logs={logs} onClear={clearLogs} lang={lang} />
        </main>
      </div>

      {/* Modern Minimalist Open-Source Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] bg-[#07080B]/95 backdrop-blur-xl py-6 text-xs text-slate-400 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-5">
          {/* Top Row: Brand, Badges & GitHub Link */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Left: Brand & Open Source Badges */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 sm:gap-2.5">
              <div className="flex items-center gap-2 font-bold text-white tracking-tight">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{t.footerBrand}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-300 border border-white/[0.08]">
                  {t.footerVersion}
                </span>
              </div>

              <span className="hidden sm:inline text-white/20">•</span>

              {/* Badge 1: Open Source Software */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[11px] font-medium">
                <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                {t.footerOpenSource}
              </span>

              {/* Badge 2: Free to Inspect & Audit */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[11px] font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                {t.footerFreeToCheck}
              </span>

              {/* Badge 3: No Copyright / Free Forever */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[11px] font-medium">
                <Scale className="w-3.5 h-3.5 text-amber-400" />
                {t.footerNoCopyright}
              </span>
            </div>

            {/* Right: GitHub Repo Button */}
            <a
              href="https://github.com/bchhngsaygez/EZDQ"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 hover:text-white border border-white/[0.1] hover:border-white/20 transition-all shadow-sm group active:scale-95"
            >
              <Github className="w-4 h-4 text-slate-300 group-hover:text-white transition-colors" />
              <span className="font-semibold text-xs">{t.footerGithubBtn}</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-colors" />
            </a>
          </div>

          {/* Bottom Row: Security / Zero-Persistence note */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-4 border-t border-white/[0.04] text-[11px] text-slate-500 text-center sm:text-left">
            <span>{t.footerSecurity}</span>
            <span className="text-slate-500 font-mono">
              100% Ephemeral Memory • Zero Database • GPL-3.0 Open Source
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
