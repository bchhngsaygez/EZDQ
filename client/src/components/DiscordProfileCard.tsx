import React, { useState } from 'react';
import { User, Copy, Check, ShieldCheck, Activity } from 'lucide-react';
import { UserProfile } from '../types';
import { Language, translations } from '../i18n';

interface DiscordProfileCardProps {
  profile: UserProfile | null;
  customStatusActive: boolean;
  lang: Language;
}

export const DiscordProfileCard: React.FC<DiscordProfileCardProps> = ({
  profile,
  customStatusActive,
  lang,
}) => {
  const t = translations[lang];
  const [copied, setCopied] = useState(false);

  if (!profile) return null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(profile.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative rounded-2xl p-4 sm:p-5 glass-panel border border-white/[0.08] mb-6 overflow-hidden shadow-xl shadow-black/20">
      {/* Background Subtle Blur Accent */}
      <div className="absolute top-0 right-0 w-64 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left Side: Avatar + Details */}
        <div className="flex items-center gap-3.5">
          {/* Avatar with Online Pulse Ring */}
          <div className="relative shrink-0">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.username}
                className="w-12 h-12 rounded-2xl border-2 border-white/10 object-cover shadow-md"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-white/[0.06] border-2 border-white/10 flex items-center justify-center text-slate-300">
                <User className="w-6 h-6" />
              </div>
            )}
            {/* Live Online Badge */}
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-[#07090E]"></span>
            </span>
          </div>

          {/* User Meta */}
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-extrabold text-white text-base tracking-tight">
                {profile.global_name || profile.username}
              </h4>
              <span className="text-xs text-slate-400 font-mono">@{profile.username}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              {/* Status Indicator */}
              {customStatusActive ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/25">
                  <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
                  <span>{t.doingQuestStatus}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/[0.04] text-slate-300 border border-white/[0.06]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>{t.onlineStatus}</span>
                </span>
              )}

              {/* Copy ID Button */}
              <button
                type="button"
                onClick={handleCopyId}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] transition-all active:scale-[0.97]"
                title={t.copyId}
                aria-label={t.copyId}
              >
                <span>ID: {profile.id.slice(0, 6)}...{profile.id.slice(-4)}</span>
                {copied ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3 text-slate-400" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Security Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-300 self-start sm:self-center">
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          <span>{t.verifiedAccount}</span>
        </div>
      </div>
    </div>
  );
};
