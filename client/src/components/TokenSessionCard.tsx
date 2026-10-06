import React, { useState } from 'react';
import {
  KeyRound,
  Eye,
  EyeOff,
  ClipboardPaste,
  Trash2,
  Play,
  Square,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Cpu,
  Puzzle,
  AlertTriangle,
  Info,
  Bell,
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
    <div className="rounded-2xl p-5 sm:p-6 glass-panel border border-white/[0.07] mb-8">
      {/* Security Ephemeral Notice */}
      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-5">
        <ShieldCheck className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
        <div className="text-xs text-slate-300 leading-relaxed">
          <span className="font-semibold text-white">{t.securityTitle}</span> {t.securityDesc}
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="mb-4 px-3.5 py-2 rounded-xl text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 flex items-center gap-2">
          <Info className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="mb-4 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium bg-rose-500/10 text-rose-300 border border-rose-500/20 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
          <div className="flex-1">{errorMessage}</div>
        </div>
      )}

      {/* Main Token Input */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs sm:text-sm font-semibold text-slate-200 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-indigo-400" />
              {t.tokenLabel}
            </label>
            {token && (
              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                  isValidFormat
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}
              >
                {isValidFormat ? t.tokenValid : t.tokenInvalid}
              </span>
            )}
          </div>

          <div className="relative flex items-center">
            <input
              type={showToken ? 'text' : 'password'}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              disabled={isBusy}
              placeholder={t.tokenPlaceholder}
              autoComplete="off"
              spellCheck="false"
              className="w-full px-3.5 py-3 pr-28 rounded-xl bg-[#080A0E] border border-white/[0.08] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono transition-all"
            />

            {/* In-field Quick Actions */}
            <div className="absolute right-1.5 flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                title={showToken ? t.hideToken : t.showToken}
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={handlePaste}
                disabled={isBusy}
                className="p-1.5 rounded-lg text-indigo-400 hover:text-indigo-300 hover:bg-white/[0.06] transition-colors"
                title={t.pasteBtn}
              >
                <ClipboardPaste className="w-4 h-4" />
              </button>
              {token && !isBusy && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-white/[0.06] transition-colors"
                  title={t.clearBtn}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Toggles Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
          {/* Custom Status Toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-300 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/[0.02]">
            <input
              type="checkbox"
              checked={setStatus}
              onChange={(e) => setSetStatus(e.target.checked)}
              disabled={isBusy}
              className="w-4 h-4 rounded bg-slate-900 border-white/20 text-indigo-600 focus:ring-0 cursor-pointer accent-indigo-600"
            />
            <span className="flex items-center gap-1.5 flex-wrap">
              <span>{t.customStatusToggle}</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium text-xs">
                {t.doingQuestStatus}
              </span>
            </span>
          </label>

          {/* Parallel Multi-Quest Mode Toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-300 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/[0.02]">
            <input
              type="checkbox"
              checked={parallel}
              onChange={(e) => setParallel(e.target.checked)}
              disabled={isBusy}
              className="w-4 h-4 rounded bg-slate-900 border-white/20 text-indigo-600 focus:ring-0 cursor-pointer accent-indigo-600"
            />
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-medium text-white">{t.parallelModeToggle}</span>
            </span>
          </label>

          {/* Completion Notification Alert & Sound Toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-300 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/[0.02]">
            <input
              type="checkbox"
              checked={notificationEnabled}
              onChange={(e) => onToggleNotification(e.target.checked)}
              disabled={isBusy}
              className="w-4 h-4 rounded bg-slate-900 border-white/20 text-indigo-600 focus:ring-0 cursor-pointer accent-indigo-600"
            />
            <span className="flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-medium text-white">{t.notificationToggle}</span>
            </span>
          </label>
        </div>

        {/* Advanced Settings Accordion (Auto CAPTCHA Solver) */}
        <div className="border-t border-white/[0.06] pt-3">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between w-full py-1 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Puzzle className="w-3.5 h-3.5 text-indigo-400" />
              {t.advancedSettings}
            </span>
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showAdvanced && (
            <div className="mt-3 p-3.5 rounded-xl bg-[#090A0E] border border-white/[0.06] space-y-3 animate-fade-in">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={enableCaptcha}
                  onChange={(e) => setEnableCaptcha(e.target.checked)}
                  disabled={isBusy}
                  className="w-4 h-4 rounded bg-slate-900 border-white/20 text-indigo-600 focus:ring-0 cursor-pointer accent-indigo-600"
                />
                <span className="font-medium text-white">{t.captchaEnable}</span>
              </label>

              {enableCaptcha && (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">{t.captchaProvider}</label>
                    <select
                      value={captchaProvider}
                      onChange={(e) => setCaptchaProvider(e.target.value as any)}
                      disabled={isBusy}
                      className="w-full px-3 py-2 rounded-lg bg-[#11131A] border border-white/[0.08] text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="capsolver">CapSolver (Khuyên dùng cho Discord hCaptcha)</option>
                      <option value="2captcha">2Captcha</option>
                      <option value="anticaptcha">Anti-Captcha</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">{t.captchaApiKey}</label>
                    <div className="relative flex items-center">
                      <input
                        type={showCaptchaKey ? 'text' : 'password'}
                        value={captchaApiKey}
                        onChange={(e) => setCaptchaApiKey(e.target.value)}
                        disabled={isBusy}
                        placeholder={t.captchaApiKeyPlaceholder}
                        autoComplete="off"
                        spellCheck="false"
                        className="w-full px-3 py-2 pr-10 rounded-lg bg-[#11131A] border border-white/[0.08] text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCaptchaKey(!showCaptchaKey)}
                        className="absolute right-2 p-1 text-slate-500 hover:text-white"
                      >
                        {showCaptchaKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-normal">{t.captchaHint}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Buttons Row */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={handleStart}
            disabled={isBusy || !token.trim()}
            className={`w-full sm:flex-1 py-3 px-5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              isBusy || !token.trim()
                ? 'bg-white/[0.04] text-slate-500 cursor-not-allowed border border-white/[0.05]'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 hover:scale-[1.01] active:scale-[0.99]'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{isBusy ? t.startingBtn : t.startBtn}</span>
          </button>

          {isBusy && (
            <button
              type="button"
              onClick={onStop}
              className="w-full sm:w-auto py-3 px-5 rounded-xl font-bold text-sm bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
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
