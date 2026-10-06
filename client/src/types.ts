export type BotState = 'idle' | 'starting' | 'running' | 'stopping' | 'error';

export type LogLevel = 'info' | 'success' | 'warn' | 'error' | 'system';

export interface LogEntry {
  id: string;
  time: string;
  level: LogLevel;
  message: string;
}

export interface UserProfile {
  id: string;
  username: string;
  global_name?: string;
  avatar?: string;
  avatarUrl?: string;
}

export type QuestTaskConfigType =
  | 'WATCH_VIDEO'
  | 'WATCH_VIDEO_ON_MOBILE'
  | 'PLAY_ON_DESKTOP'
  | 'PLAY_ON_XBOX'
  | 'PLAY_ON_PLAYSTATION'
  | 'PLAY_ACTIVITY'
  | 'ACHIEVEMENT_IN_ACTIVITY'
  | 'STREAM_ON_DESKTOP';

export interface QuestItemState {
  id: string;
  name: string;
  application: string;
  appId?: string;
  icon?: string;
  hero?: string;
  task: QuestTaskConfigType;
  secondsDone: number;
  secondsNeeded: number;
  status: 'pending' | 'running' | 'done' | 'skip' | 'error';
  reason?: string;
  rewardName?: string;
  enrolled: boolean;
  claimed: boolean;
}

export type Quest = QuestItemState;

export type ServerEvent =
  | { type: 'state'; data: { state: BotState; message?: string } }
  | { type: 'login'; data: UserProfile }
  | { type: 'status_update'; data: { text: string; active: boolean } }
  | { type: 'quests_loaded'; data: { total: number; quests: QuestItemState[] } }
  | { type: 'quest:start'; data: Partial<QuestItemState> & { name: string } }
  | { type: 'quest:progress'; data: { name: string; id: string; secondsDone: number; secondsNeeded: number } }
  | { type: 'quest:done'; data: { name: string; id: string; rewardName?: string } }
  | { type: 'quest:skip'; data: { name: string; id: string; reason: string } }
  | { type: 'quest:error'; data: { name: string; id: string; message: string } }
  | { type: 'finish'; data: { message: string } }
  | { type: 'log'; data: LogEntry }
  | { type: 'error'; data: { message: string } };

export interface CaptchaConfig {
  provider: 'capsolver' | '2captcha' | 'anticaptcha';
  apiKey: string;
}

export type ClientMessage =
  | {
      type: 'START';
      token: string;
      setStatus?: boolean;
      parallel?: boolean;
      captcha?: CaptchaConfig;
    }
  | { type: 'STOP' }
  | { type: 'CLAIM'; questId: string };
