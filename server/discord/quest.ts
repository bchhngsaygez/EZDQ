import type { QuestData, QuestUserStatus } from '../types';

export class Quest {
  private readonly data: QuestData;

  private constructor(data: QuestData) {
    this.data = data;
  }

  static create(data: QuestData): Quest {
    return new Quest(data);
  }

  get id() {
    return this.data.id;
  }

  get config() {
    return this.data.config;
  }

  get userStatus() {
    return this.data.user_status;
  }

  get targetedContent() {
    return this.data.targeted_content;
  }

  get preview(): boolean {
    return this.data.preview;
  }

  get raw() {
    return this.data;
  }

  isExpired(reference: Date = new Date()): boolean {
    if (!this.data.config?.expires_at) return false;
    return reference.getTime() > new Date(this.data.config.expires_at).getTime();
  }

  isStarted(reference: Date = new Date()): boolean {
    if (!this.data.config?.starts_at) return true;
    return reference.getTime() >= new Date(this.data.config.starts_at).getTime();
  }

  isCompleted(): boolean {
    if (Boolean(this.userStatus?.completed_at)) return true;
    if (Boolean(this.userStatus?.claimed_at)) return true;

    // Check if task progress reached or exceeded target
    const tasks = this.data.config?.task_config_v2?.tasks;
    const progress = this.data.user_status?.progress;
    if (tasks && progress) {
      for (const [taskName, taskConfig] of Object.entries(tasks)) {
        const val = (progress as any)[taskName]?.value;
        const target = (taskConfig as any)?.target;
        if (typeof val === 'number' && typeof target === 'number' && target > 0 && val >= target) {
          return true;
        }
      }
    }

    return false;
  }

  isEnrolledQuest(): boolean {
    return Boolean(this.userStatus?.enrolled_at);
  }

  hasClaimedRewards(): boolean {
    return Boolean(this.userStatus?.claimed_at);
  }

  updateUserStatus(userStatus: QuestUserStatus | null) {
    this.data.user_status = userStatus;
  }
}
