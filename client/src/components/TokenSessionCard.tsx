import React, { useState } from 'react';
import {
  KeyRound,
  ClipboardPaste,
  Trash2,
  Eye,
  EyeOff,
  Sparkles,
  Square,
  AlertCircle,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  CheckCircle2,
  Bot,
} from 'lucide-react';
import { QuestState } from '../types';
import { Language, translations } from '../i18n';

interface TokenSessionCardProps {
  state: QuestState;
  onStart: (token: string, setStatus: boolean, parallel: boolean, captchaApiKey?: string) => void;
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
  errorMessage,
  lang,
  notificationEnabled,
  onToggleNotification,
}) => {
  const t = translations[lang];

  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [setStatus, setSetStatus] = useState(true);
  const [parallel, setParallel] = useState(true);

  // CAPTCHA Solver states
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [enableCaptcha, setEnableCaptcha] = useState(false);
  const [captchaProvider, setCaptchaProvider] = useState<'capsolver' | '2captcha' | 'anticaptcha'>('capsolver');
  const [captchaApiKey, setCaptchaApiKey] = useState('');
  const [showCaptchaKey, setShowCaptchaKey] = useState(false);

  const [inputError, setInputError] = useState<string | null>(null);

  const isBusy = state === 'starting' || state === 'running';

  const validateTokenFormat = (tok: string) => {
    const parts = tok.trim().split('.');
    return parts.length === 3 && parts.every((p) => p.length > 0);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setToken(text.trim());
        setInputError(null);
      }
    } catch {
      // Clipboard permission blocked
    }
  };

  const handleClear = () => {
    setToken('');
    setCaptchaApiKey('');
    setInputError(null);
  };

  const handleStart = () => {
    const trimmed = token.trim();
    if (!trimmed) {
      setInputError(t.emptyTokenError);
      return;
    }
    if (!validateTokenFormat(trimmed)) {
      setInputError(t.invalidTokenError);
      return;
    }
    setInputError(null);

    const effectiveApiKey = enableCaptcha && captchaApiKey.trim() ? captchaApiKey.trim() : undefined;
    onStart(trimmed, setStatus, parallel, effectiveApiKey);
  };

  const isTokenFormatValid = token.trim() ? validateTokenFormat(token) : null;

  return (
    <div className="rounded-2xl bg-[#090B10] border border-white/[0.08] p-4 sm:p-5 space-y-4 shadow-xl">
      {/* Header & Token Input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
            <span>{t.tokenLabel}</span>
          </label>

          {/* Validation Status Pill */}
          {token.trim() && (
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full border transition-all ${
                isTokenFormatValid
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-semibold'
                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
              }`}
            >
              {isTokenFormatValid ? t.tokenValid : t.tokenInvalid}
            </span>
          )}
        </div>

        {/* Input Field with Quick Actions */}
        <div className="relative flex items-center">
          <input
            type={showToken ? 'text' : 'password'}
            value={token}
            onChange={(e) => {
              setToken(e.target.value);
              if (inputError) setInputError(null);
            }}
            placeholder={t.tokenPlaceholder}
            disabled={isBusy}
            spellCheck="false"
            autoComplete="off"
            className="w-full pl-3.5 pr-24 py-2.5 rounded-xl bg-[#050608] border border-white/[0.1] text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 disabled:opacity-50 transition-all"
          />

          <div className="absolute right-1.5 flex items-center gap-1">
            {/* Show/Hide */}
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all"
              title={showToken ? t.hideToken : t.showToken}
              aria-label="Toggle token visibility"
            >
              {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>

            {/* Paste */}
            <button
              type="button"
              onClick={handlePaste}
              disabled={isBusy}
              className="px-2 py-1 rounded-lg text-xs font-semibold bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-slate-200 hover:text-white transition-all flex items-center gap-1 disabled:opacity-30"
              title={t.pasteBtn}
            >
              <ClipboardPaste className="w-3 h-3 text-indigo-400" />
              <span className="hidden sm:inline">{t.pasteBtn}</span>
            </button>

            {/* Clear */}
            {token && !isBusy && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                title={t.clearBtn}
                aria-label="Scrub token from RAM"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Validation or System Error */}
        {(inputError || errorMessage) && (
          <div className="rounded-xl bg-rose-500/10 border border-rose-500/25 p-2.5 text-xs text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-tight">{inputError || errorMessage}</span>
          </div>
        )}
      </div>

      {/* Engine Toggles (Modern Switches) */}
      <div className="space-y-2.5 pt-1">
        {/* Toggle 1: Custom Status */}
        <div
          onClick={() => !isBusy && setSetStatus(!setStatus)}
          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
            setStatus
              ? 'bg-indigo-500/[0.06] border-indigo-500/30'
              : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'
          }`}
        >
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>{t.customStatusToggle}</span>
            </div>
            <div className="text-[11px] text-emerald-400 font-mono truncate mt-0.5">
              Doing Quest ✔ • ezdisquest.nx.kg
            </div>
          </div>
          <div
            className={`toggle-switch ${
              setStatus ? 'bg-indigo-600 toggle-switch-active' : 'bg-slate-700'
            }`}
          >
            <span className="toggle-switch-thumb" />
          </div>
        </div>

        {/* Toggle 2: Parallel Mode */}
        <div
          onClick={() => !isBusy && setParallel(!parallel)}
          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
            parallel
              ? 'bg-indigo-500/[0.06] border-indigo-500/30'
              : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'
          }`}
        >
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-white">
              {t.parallelModeToggle}
            </div>
            <div className="text-[11px] text-slate-400 truncate mt-0.5">
              {t.parallelModeDesc}
            </div>
          </div>
          <div
            className={`toggle-switch ${
              parallel ? 'bg-indigo-600 toggle-switch-active' : 'bg-slate-700'
            }`}
          >
            <span className="toggle-switch-thumb" />
          </div>
        </div>

        {/* Toggle 3: Completion Audio & Push Notification */}
        <div
          onClick={() => onToggleNotification(!notificationEnabled)}
          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
            notificationEnabled
              ? 'bg-indigo-500/[0.06] border-indigo-500/30'
              : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'
          }`}
        >
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-white">
              {t.notificationToggle}
            </div>
            <div className="text-[11px] text-slate-400 truncate mt-0.5">
              {t.notificationDesc}
            </div>
          </div>
          <div
            className={`toggle-switch ${
              notificationEnabled ? 'bg-indigo-600 toggle-switch-active' : 'bg-slate-700'
            }`}
          >
            <span className="toggle-switch-thumb" />
          </div>
        </div>
      </div>

      {/* Auto CAPTCHA Solver Accordion */}
      <div className="rounded-xl border border-white/[0.07] bg-[#050608] overflow-hidden">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-white/[0.03] transition-all"
        >
          <div className="flex items-center gap-2">
            <Bot className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-xs font-bold text-slate-300">
              {t.advancedSettings}
            </span>
            {enableCaptcha && captchaApiKey.trim() && (
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ACTIVE
              </span>
            )}
          </div>
          {showAdvanced ? (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          )}
        </button>

        {showAdvanced && (
          <div className="p-3.5 border-t border-white/[0.06] space-y-3 bg-[#07090D]">
            {/* Enable switch */}
            <div
              onClick={() => setEnableCaptcha(!enableCaptcha)}
              className="flex items-center justify-between cursor-pointer"
            >
              <span className="text-xs text-slate-300 font-medium">
                {t.captchaEnable}
              </span>
              <div
                className={`toggle-switch ${
                  enableCaptcha ? 'bg-indigo-600 toggle-switch-active' : 'bg-slate-700'
                }`}
              >
                <span className="toggle-switch-thumb" />
              </div>
            </div>

            {enableCaptcha && (
              <div className="space-y-3 pt-2">
                {/* Provider selection pills */}
                <div>
                  <div className="text-[11px] font-medium text-slate-400 mb-1.5">
                    {t.captchaProvider}:
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'capsolver', label: 'CapSolver' },
                      { id: '2captcha', label: '2Captcha' },
                      { id: 'anticaptcha', label: 'Anti-Captcha' },
                    ].map((prov) => (
                      <button
                        key={prov.id}
                        type="button"
                        onClick={() => setCaptchaProvider(prov.id as any)}
                        className={`py-1 px-2 rounded-lg text-xs font-semibold border transition-all ${
                          captchaProvider === prov.id
                            ? 'bg-indigo-600 text-white border-indigo-500'
                            : 'bg-white/[0.03] text-slate-400 border-white/[0.07] hover:text-white'
                        }`}
                      >
                        {prov.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* API Key Input */}
                <div>
                  <div className="text-[11px] font-medium text-slate-400 mb-1">
                    {t.captchaApiKey}:
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type={showCaptchaKey ? 'text' : 'password'}
                      value={captchaApiKey}
                      onChange={(e) => setCaptchaApiKey(e.target.value)}
                      placeholder={t.captchaApiKeyPlaceholder}
                      className="w-full pl-3 pr-8 py-1.5 rounded-lg bg-[#050608] border border-white/[0.09] text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCaptchaKey(!showCaptchaKey)}
                      className="absolute right-2 text-slate-400 hover:text-white"
                    >
                      {showCaptchaKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Primary Hero Trigger Button */}
      {!isBusy ? (
        <button
          type="button"
          onClick={handleStart}
          disabled={!token.trim()}
          className={`w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm tracking-wide transition-all shadow-xl flex items-center justify-center gap-2 ${
            !token.trim()
              ? 'bg-white/[0.05] text-slate-500 border border-white/[0.06] cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/40 shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-[1.01] active:scale-[0.98]'
          }`}
        >
          <Sparkles className="w-4 h-4 text-indigo-200 fill-current" />
          <span>{t.startBtn}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={onStop}
          className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm tracking-wide bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          <Square className="w-4 h-4 fill-current text-rose-400" />
          <span>{t.stopBtn}</span>
        </button>
      )}

      {/* Ephemeral Memory Security Footnote */}
      <div className="pt-1 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span>RAM Ephemeral Memory • Auto-purged on close</span>
      </div>
    </div>
  );
};
