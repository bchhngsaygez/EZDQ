import React, { useState } from 'react';
import { User, Copy, Check, ShieldCheck } from 'lucide-react';
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
    <div className="rounded-2xl p-4 glass-panel border border-white/[0.08] mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {/* Avatar with Status Dot */}
        <div className="relative shrink-0">
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.username}
              className="w-11 h-11 rounded-full border border-white/10 object-cover"
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-slate-300">
              <User className="w-5 h-5" />
            </div>
          )}
          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#090A0E]" />
        </div>

        {/* User Info */}
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-white text-sm">
              {profile.global_name || profile.username}
            </h4>
            <span className="text-xs text-slate-400">@{profile.username}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-1">
            {customStatusActive ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                {t.doingQuestStatus}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-white/[0.04] text-slate-400">
                {t.onlineStatus}
              </span>
            )}

            <button
              type="button"
              onClick={handleCopyId}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono text-slate-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
              title={t.copyId}
            >
              <span>ID: {profile.id.slice(0, 8)}...</span>
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-slate-400">
        <ShieldCheck className="w-4 h-4 text-indigo-400" />
        <span>{t.verifiedAccount}</span>
      </div>
    </div>
  );
};
