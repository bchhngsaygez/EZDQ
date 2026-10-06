import React, { useState } from 'react';
import {
  Copy,
  Check,
  ShieldCheck,
  Radio,
  User,
  Sparkles,
} from 'lucide-react';
import { DiscordProfile } from '../types';
import { Language, translations } from '../i18n';

interface DiscordProfileCardProps {
  profile: DiscordProfile | null;
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

  if (!profile) {
    return (
      <div className="rounded-2xl bg-[#090B10] border border-white/[0.07] p-4 text-center">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-500 shrink-0">
            <User className="w-5 h-5 text-slate-400" />
          </div>
          <div className="text-left flex-1 min-w-0">
            <div className="text-xs font-semibold text-white">
              {lang === 'vi' ? 'Chưa kết nối tài khoản' : 'No Account Linked'}
            </div>
            <div className="text-[11px] text-slate-500 truncate mt-0.5">
              {lang === 'vi'
                ? 'Dán Token Discord bên dưới để kết nối'
                : 'Paste your Discord token below to sync'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const avatarUrl = profile.avatar
    ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png?size=128`
    : `https://cdn.discordapp.com/embed/avatars/${parseInt(profile.discriminator || '0', 10) % 5}.png`;

  const handleCopyId = () => {
    navigator.clipboard.writeText(profile.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl bg-[#090B10] border border-white/[0.08] p-4 space-y-3.5 shadow-lg relative overflow-hidden">
      {/* Top Profile Summary */}
      <div className="flex items-center gap-3">
        {/* Avatar with Status Ring */}
        <div className="relative shrink-0">
          <img
            src={avatarUrl}
            alt={profile.username}
            className="w-12 h-12 rounded-xl object-cover ring-2 ring-indigo-500/30"
          />
          <span
            className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#090B10]"
            title={t.onlineStatus}
          />
        </div>

        {/* Identity Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm text-white truncate">
              {profile.global_name || profile.username}
            </span>
            <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
            {profile.premium_type && profile.premium_type > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-pink-500/20 text-pink-300 border border-pink-500/30 flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5" />
                Nitro
              </span>
            )}
          </div>
          <div className="text-xs text-slate-400 font-mono truncate">
            @{profile.username}
          </div>
        </div>

        {/* 1-Click Copy ID Button */}
        <button
          type="button"
          onClick={handleCopyId}
          className={`px-2.5 py-1 rounded-xl text-xs font-mono font-medium border transition-all flex items-center gap-1 shrink-0 ${
            copied
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              : 'bg-white/[0.04] text-slate-400 hover:text-white border-white/[0.08] hover:bg-white/[0.08]'
          }`}
          title={t.copyId}
          aria-label="Copy User ID"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-300" />
              <span>{t.copiedId}</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>ID</span>
            </>
          )}
        </button>
      </div>

      {/* Live Custom Status Chip */}
      {customStatusActive ? (
        <div className="rounded-xl bg-emerald-500/[0.08] border border-emerald-500/20 px-3 py-2 flex items-center gap-2.5">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider block">
              Discord Activity Status
            </span>
            <span className="text-xs font-semibold text-emerald-200 truncate block">
              Doing Quest ✔ • https://ezdisquest.nx.kg/
            </span>
          </div>
        </div>
      ) : (
        <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] px-3 py-1.5 flex items-center gap-2 text-[11px] text-slate-500">
          <Radio className="w-3.5 h-3.5 text-slate-600" />
          <span>Status broadcast standby</span>
        </div>
      )}
    </div>
  );
};
