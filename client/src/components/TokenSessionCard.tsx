import React, { useState } from 'react';
import {
  KeyRound,
  Play,
  Square,
  Clipboard,
  Trash2,
  Eye,
  EyeOff,
  Cpu,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Puzzle,
  AlertTriangle,
  Info,
  Bell,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { BotState, CaptchaConfig } from '../types';
import { Language, translations } from '../i18n';

interface TokenSessionCardProps {
  state: BotState;
  onStart: (token: string, setStatus: boolean, parallel: boolean, captcha?: CaptchaConfig) => void;
  onStop: () => void;
  onReset: () => void;
  errorMessage: string | null;
  lang: Language;
  notificationEnabled: boolean;
  onToggleNotification: (enabled: boolean) => void;
}

export const TokenSessionCard: React.FC<TokenSessionCardProps> = ({
  state,
  onStart,
  onStop,
  onReset,
  errorMessage,
  lang,
  notificationEnabled,
  onToggleNotification,
}) => {
  const t = translations[lang];

  // Pure in-memory state: Never written to localStorage, sessionStorage or cookies!
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [setStatus, setSetStatus] = useState(true);
  const [parallel, setParallel] = useState(true);

  // Auto CAPTCHA settings (Optional)
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [enableCaptcha, setEnableCaptcha] = useState(false);
  const [captchaProvider, setCaptchaProvider] = useState<'capsolver' | '2captcha' | 'anticaptcha'>('capsolver');
  const [captchaApiKey, setCaptchaApiKey] = useState('');
  const [showCaptchaKey, setShowCaptchaKey] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isBusy = state === 'starting' || state === 'running' || state === 'stopping';

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) {
        showToast('Clipboard trống.');
        return;
      }
      const match = text.match(/[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{20,}/);
      const clean = match ? match[0] : text.trim();
      setToken(clean);
      showToast(t.pastedToast);
    } catch {
      showToast('Vui lòng cấp quyền clipboard hoặc dán thủ công.');
    }
  };

  const handleClear = () => {
    setToken('');
    setCaptchaApiKey('');
    onReset();
    showToast(t.clearedToast);
  };

  const isValidFormat = token.trim().split('.').length >= 3;

  const handleStart = () => {
    if (!token.trim()) {
      showToast(t.emptyTokenError);
      return;
    }
    if (!isValidFormat) {
      showToast(t.invalidTokenError);
      return;
    }

    const captchaConfig: CaptchaConfig | undefined =
      enableCaptcha && captchaApiKey.trim()
        ? {
            provider: captchaProvider,
            apiKey: captchaApiKey.trim(),
          }
        : undefined;

    onStart(token.trim(), setStatus, parallel, captchaConfig);
  };

  return (
    <div className="rounded-3xl p-5 sm:p-7 glass-panel border border-white/[0.08] mb-8 shadow-2xl shadow-black/30">
      {/* Zero Persistence Security Assurance Banner */}
      <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-500/20 mb-6">
        <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="text-xs text-slate-300 leading-relaxed">
          <span className="font-bold text-white text-sm block mb-0.5">
            {t.securityTitle}
          </span>
          {t.securityDesc}
        </div>
      </div>

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="mb-4 px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-500/15 text-indigo-200 border border-indigo-500/30 flex items-center gap-2 animate-fade-in shadow-lg">
          <Info className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Error Feedback */}
      {errorMessage && (
        <div className="mb-4 px-4 py-3 rounded-xl text-xs sm:text-sm font-medium bg-rose-500/15 text-rose-200 border border-rose-500/30 flex items-start gap-2.5 animate-fade-in">
          <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
          <div className="flex-1 leading-relaxed">{errorMessage}</div>
        </div>
      )}

      {/* Token Input Section */}
      <div className="space-y-5">
        <div>
          {/* Label + Validation Status */}
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs sm:text-sm font-bold text-slate-200 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-indigo-400" />
              <span>{t.tokenLabel}</span>
            </label>
            {token.trim() && (
              <span
                className={`text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 transition-all ${
                  isValidFormat
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                }`}
              >
                {isValidFormat ? (
                  <>
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{t.tokenValid}</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3 h-3" />
                    <span>{t.tokenInvalid}</span>
                  </>
                )}
              </span>
            )}
          </div>

          {/* Input Box with Integrated Action Toolbar */}
          <div className="relative flex items-center">
            <input
              type={showToken ? 'text' : 'password'}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              disabled={isBusy}
              placeholder={t.tokenPlaceholder}
              autoComplete="off"
              spellCheck="false"
              className="w-full px-4 py-3 pr-28 rounded-2xl bg-[#06080D] border border-white/[0.1] focus:border-indigo-500 text-xs sm:text-sm text-white placeholder-slate-600 font-mono transition-all duration-200 focus:ring-2 focus:ring-indigo-500/20"
            />

            {/* In-field Action Buttons */}
            <div className="absolute right-2 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                disabled={!token}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/[0.06] transition-colors disabled:opacity-30 disabled:pointer-events-none"
                title={showToken ? t.hideToken : t.showToken}
                aria-label={showToken ? t.hideToken : t.showToken}
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={handlePaste}
                disabled={isBusy}
                className="px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5 transition-all active:scale-[0.97]"
                title={t.pasteBtn}
              >
                <Clipboard className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.pasteBtn}</span>
              </button>

              <button
                type="button"
                onClick={handleClear}
                disabled={isBusy || (!token && !captchaApiKey)}
                className="p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-white/[0.06] transition-colors disabled:opacity-30 disabled:pointer-events-none"
                title={t.clearBtn}
                aria-label={t.clearBtn}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 3 Core Toggles Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          {/* 1. Custom Status Toggle */}
          <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.12] cursor-pointer transition-all">
            <input
              type="checkbox"
              checked={setStatus}
              onChange={(e) => setSetStatus(e.target.checked)}
              disabled={isBusy}
              className="mt-0.5 w-4 h-4 rounded bg-slate-900 border-white/20 text-indigo-600 focus:ring-0 cursor-pointer accent-indigo-600 shrink-0"
            />
            <div className="flex-1">
              <span className="text-xs font-bold text-white block">
                {t.customStatusToggle}
              </span>
              <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-medium text-[11px] border border-emerald-500/20 break-all">
                {t.doingQuestStatus}
              </span>
            </div>
          </label>

          {/* 2. Parallel Multi-Quest Mode Toggle */}
          <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.12] cursor-pointer transition-all">
            <input
              type="checkbox"
              checked={parallel}
              onChange={(e) => setParallel(e.target.checked)}
              disabled={isBusy}
              className="mt-0.5 w-4 h-4 rounded bg-slate-900 border-white/20 text-indigo-600 focus:ring-0 cursor-pointer accent-indigo-600 shrink-0"
            />
            <div className="flex-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                <span>{t.parallelModeToggle}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                {t.parallelModeDesc}
              </p>
            </div>
          </label>

          {/* 3. Completion Notification & Chime Toggle */}
          <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.12] cursor-pointer transition-all">
            <input
              type="checkbox"
              checked={notificationEnabled}
              onChange={(e) => onToggleNotification(e.target.checked)}
              disabled={isBusy}
              className="mt-0.5 w-4 h-4 rounded bg-slate-900 border-white/20 text-indigo-600 focus:ring-0 cursor-pointer accent-indigo-600 shrink-0"
            />
            <div className="flex-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                <Bell className="w-3.5 h-3.5 text-amber-400" />
                <span>{t.notificationToggle}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                {t.notificationDesc}
              </p>
            </div>
          </label>
        </div>

        {/* Advanced Settings Accordion (Auto CAPTCHA Solver) */}
        <div className="border-t border-white/[0.06] pt-3">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between w-full py-2 text-xs font-bold text-slate-300 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2">
              <Puzzle className="w-4 h-4 text-indigo-400" />
              <span>{t.advancedSettings}</span>
            </span>
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showAdvanced && (
            <div className="mt-3 p-4 rounded-2xl bg-[#06080D] border border-white/[0.08] space-y-4 animate-fade-in">
              <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs text-slate-200 font-semibold">
                <input
                  type="checkbox"
                  checked={enableCaptcha}
                  onChange={(e) => setEnableCaptcha(e.target.checked)}
                  disabled={isBusy}
                  className="w-4 h-4 rounded bg-slate-900 border-white/20 text-indigo-600 focus:ring-0 cursor-pointer accent-indigo-600"
                />
                <span>{t.captchaEnable}</span>
              </label>

              {enableCaptcha && (
                <div className="space-y-3.5 pt-1">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      {t.captchaProvider}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        { id: 'capsolver', name: 'CapSolver', badge: 'Recommended' },
                        { id: '2captcha', name: '2Captcha', badge: 'Fast' },
                        { id: 'anticaptcha', name: 'Anti-Captcha', badge: 'Standard' },
                      ].map((prov) => (
                        <button
                          key={prov.id}
                          type="button"
                          onClick={() => setCaptchaProvider(prov.id as any)}
                          disabled={isBusy}
                          className={`p-2.5 rounded-xl text-left border transition-all ${
                            captchaProvider === prov.id
                              ? 'bg-indigo-500/15 border-indigo-500 text-white font-bold'
                              : 'bg-white/[0.03] border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.06]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs">{prov.name}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/[0.08] text-slate-400">
                              {prov.badge}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      {t.captchaApiKey}
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type={showCaptchaKey ? 'text' : 'password'}
                        value={captchaApiKey}
                        onChange={(e) => setCaptchaApiKey(e.target.value)}
                        disabled={isBusy}
                        placeholder={t.captchaApiKeyPlaceholder}
                        autoComplete="off"
                        spellCheck="false"
                        className="w-full px-4 py-2.5 pr-10 rounded-xl bg-[#090C14] border border-white/[0.08] text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCaptchaKey(!showCaptchaKey)}
                        className="absolute right-2.5 p-1 text-slate-400 hover:text-white"
                        aria-label="Toggle API Key visibility"
                      >
                        {showCaptchaKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {t.captchaHint}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hero Execution Action Buttons */}
        <div className="pt-3 flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={handleStart}
            disabled={isBusy || !token.trim()}
            className={`w-full sm:flex-1 py-3.5 px-6 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all duration-200 shadow-xl min-h-[50px] ${
              isBusy || !token.trim()
                ? 'bg-white/[0.04] text-slate-500 cursor-not-allowed border border-white/[0.06]'
                : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:scale-[0.98]'
            }`}
          >
            {isBusy ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>{t.startingBtn}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4.5 h-4.5 text-indigo-200 fill-current" />
                <span>{t.startBtn}</span>
              </>
            )}
          </button>

          {isBusy && (
            <button
              type="button"
              onClick={onStop}
              className="w-full sm:w-auto py-3.5 px-6 rounded-2xl font-bold text-sm sm:text-base bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] min-h-[50px]"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>{t.stopBtn}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
