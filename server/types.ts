export interface AllQuestsResponse {
  quests: QuestData[];
  excluded_quests: Partial<QuestData>[];
  quest_enrollment_blocked_until: string | null;
}

export type Snowflake = string;

export interface QuestData {
  id: Snowflake;
  config: QuestConfig;
  user_status: QuestUserStatus | null;
  targeted_content: number;
  preview: boolean;
  traffic_metadata_raw?: string;
  traffic_metadata_sealed?: string;
}

export interface QuestConfig {
  id: Snowflake;
  config_version: number;
  starts_at: string;
  expires_at: string;
  features: number;
  application: QuestApplication;
  assets: QuestAssets;
  colors: QuestGradient;
  messages: QuestMessages;
  rewards_config: QuestRewardsConfig;
  video_metadata?: QuestVideoMetadata;
  cosponsor_metadata?: QuestCosponsorMetadata;
  task_config_v2: {
    tasks: Record<QuestTaskConfigType, { type: QuestTaskConfigType; target: number }>;
  };
}

export interface QuestApplication {
  id: Snowflake;
  name: string;
  icon: string | null;
  link?: string;
}

export interface QuestAssets {
  hero: string;
  quest_bar_hero: string;
  game_tile: string;
  logotype: string;
}

export interface QuestGradient {
  primary: string;
  secondary: string;
}

export interface QuestMessages {
  quest_name: string;
  game_title: string;
  game_publisher: string;
}

export interface QuestRewardsConfig {
  assignment_method: number;
  rewards: {
    sku_id: Snowflake;
    asset: string;
    asset_video: string | null;
    messages: {
      name: string;
      name_with_article: string;
      redemption_instructions_by_platform: Record<string, string>;
    };
  }[];
  platforms: number[];
}

export interface QuestVideoMetadata {
  video_id: string;
  messages: {
    video_title: string;
  };
}

export interface QuestCosponsorMetadata {
  name: string;
  logotype: string;
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

export interface QuestUserStatus {
  user_id: Snowflake;
  quest_id: Snowflake;
  enrolled_at: string | null;
  completed_at: string | null;
  claimed_at: string | null;
  last_queried_at: string;
  progress: Partial<Record<QuestTaskConfigType, { value: number }>>;
}

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

export interface CaptchaConfig {
  provider: 'capsolver' | '2captcha' | 'anticaptcha';
  apiKey: string;
}

export type ServerEvent =
  | { type: 'state'; data: { state: 'idle' | 'starting' | 'running' | 'stopping' | 'error'; message?: string } }
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
