import React, { useState } from 'react';
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
          />

          {/* Quests Display Board */}
          <QuestList quests={quests} onClaimQuest={claimQuest} lang={lang} />

          {/* Live Terminal Log */}
          <ConsoleTerminal logs={logs} onClear={clearLogs} lang={lang} />
        </main>
      </div>

      {/* Clean Minimalist Footer */}
      <footer className="relative z-10 border-t border-white/[0.05] bg-[#07080B]/90 py-5 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>{t.footerVersion}</span>
          </div>
          <div className="text-slate-400">
            <span>{t.footerSecurity}</span>
          </div>
        </div>
      </footer>

      {/* Guide & FAQ Modal */}
      <GuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} lang={lang} />
    </div>
  );
};

export default App;
