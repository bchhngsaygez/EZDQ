import { APIApplication } from 'discord-api-types/v10';
import { ClientQuest } from './client';
import type {
  AllQuestsResponse,
  QuestTaskConfigType,
  QuestItemState,
  ServerEvent,
  LogLevel,
  CaptchaConfig,
} from '../types';
import { Quest } from './quest';
import { Utils } from './utils';
import { CaptchaSolver } from './captchaSolver';

export type EventCallback = (event: ServerEvent) => void;

export class QuestManager implements Iterable<Quest> {
  private readonly quests = new Map<string, Quest>();
  public readonly client: ClientQuest;
  private isAborted = false;
  private eventEmitter: EventCallback | null = null;
  private captchaConfig: CaptchaConfig | null = null;

  constructor(client: ClientQuest, quests: Quest[] = []) {
    this.client = client;
    quests.forEach((quest) => this.quests.set(quest.id, quest));
  }

  setCaptchaConfig(config?: CaptchaConfig) {
    this.captchaConfig = config || null;
  }

  setEventEmitter(emitter: EventCallback) {
    this.eventEmitter = emitter;
  }

  private emit(event: ServerEvent) {
    if (this.eventEmitter) {
      this.eventEmitter(event);
    }
  }

  private log(message: string, level: LogLevel = 'info') {
    const time = new Date().toLocaleTimeString('vi-VN');
    const safeMsg = Utils.maskToken(message);
    this.emit({
      type: 'log',
      data: {
        id: Math.random().toString(36).substring(2, 9),
        time,
        level,
        message: safeMsg,
      },
    });
  }

  abort() {
    this.isAborted = true;
  }

  static async fromResponse(
    client: ClientQuest,
    response: AllQuestsResponse,
    fetchExcludedQuests = false,
  ): Promise<QuestManager> {
    if (response.quest_enrollment_blocked_until !== null) {
      throw new Error(
        `Đăng ký nhiệm vụ bị tạm khóa đến ${response.quest_enrollment_blocked_until}.`,
      );
    }
    const questManager = new QuestManager(
      client,
      response.quests.map((quest) => Quest.create(quest)),
    );
    if (
      fetchExcludedQuests &&
      Array.isArray(response.excluded_quests) &&
      response.excluded_quests.length > 0
    ) {
      for (const quest of response.excluded_quests) {
        if (quest.id && !questManager.hasQuest(quest.id)) {
          await questManager.addExcludedQuest(quest.id);
        }
      }
    }
    return questManager;
  }

  protected async addExcludedQuest(questId: string) {
    try {
      const response = await this.client.rest.get(`/quests/${questId}`);
      const quest = Quest.create({
        id: questId,
        config: response as any,
        user_status: null,
        targeted_content: 0,
        preview: false,
      });
      this.quests.set(quest.id, quest);
    } catch {
      /* ignore */
    }
  }

  [Symbol.iterator](): IterableIterator<Quest> {
    return this.quests.values();
  }

  get size(): number {
    return this.quests.size;
  }

  list(): Quest[] {
    return Array.from(this.quests.values());
  }

  get(id: string): Quest | undefined {
    return this.quests.get(id);
  }

  hasQuest(id: string): boolean {
    return this.quests.has(id);
  }

  filterQuestsValidToDo(reference: Date = new Date()): Quest[] {
    return this.list().filter(
      (quest) =>
        !quest.isCompleted() &&
        !quest.isExpired(reference) &&
        quest.isStarted(reference),
    );
  }

  filterQuestsValidToRedeem(): Quest[] {
    return this.list().filter(
      (quest) => quest.isCompleted() && !quest.hasClaimedRewards(),
    );
  }

  toItemStates(): QuestItemState[] {
    return this.list().map((quest) => {
      const taskConfig = quest.config.task_config_v2;
      const taskName = (['WATCH_VIDEO', 'WATCH_VIDEO_ON_MOBILE', 'PLAY_ON_DESKTOP', 'PLAY_ON_XBOX', 'PLAY_ON_PLAYSTATION', 'PLAY_ACTIVITY', 'ACHIEVEMENT_IN_ACTIVITY'] as QuestTaskConfigType[]).find(
        (x) => taskConfig.tasks[x] != null,
      ) || 'PLAY_ON_DESKTOP';

      const secondsNeeded = taskConfig.tasks[taskName]?.target || 0;
      const enrolled = quest.isEnrolledQuest();
      const claimed = quest.hasClaimedRewards();
      const completed = quest.isCompleted();
      const rawDone = quest.userStatus?.progress?.[taskName]?.value || 0;
      const secondsDone = (claimed || completed) ? secondsNeeded : rawDone;

      let status: QuestItemState['status'] = 'pending';
      if (claimed || completed) status = 'done';

      const reward = quest.config.rewards_config?.rewards?.[0];
      const rewardName = reward?.messages?.name || undefined;

      return {
        id: quest.id,
        name: quest.config.messages.quest_name,
        application: quest.config.application.name,
        appId: quest.config.application.id,
        icon: quest.config.application.icon
          ? `https://cdn.discordapp.com/app-icons/${quest.config.application.id}/${quest.config.application.icon}.png?size=64`
          : undefined,
        hero: quest.config.assets?.hero,
        task: taskName,
        secondsDone,
        secondsNeeded,
        status,
        enrolled,
        claimed,
        rewardName,
      };
    });
  }

  async acceptQuest(quest: Quest, isAndroid = false): Promise<Quest | undefined> {
    if (this.isAborted) return undefined;
    if (quest.isEnrolledQuest()) {
      return quest;
    }

    const enrollPromise = this.client.rest
      .post(`/quests/${quest.id}/enroll`, {
        body: {
          location: isAndroid ? 12 : 11,
          is_targeted: false,
          metadata_sealed: null,
          traffic_metadata_raw: quest.raw.traffic_metadata_raw,
          traffic_metadata_sealed: quest.raw.traffic_metadata_sealed,
        },
        headers: {
          AndroidRequest: isAndroid ? 'true' : 'false',
        },
      })
      .then((r) => {
        const q = this.get(quest.id) || quest;
        q.updateUserStatus(r as any);
        return q;
      })
      .catch((err) => {
        const msg = (err?.message || String(err)).toLowerCase();
        if (
          msg.includes('already enrolled') ||
          msg.includes('already_enrolled') ||
          err?.code === 50035
        ) {
          const q = this.get(quest.id) || quest;
          if (q.raw.user_status) {
            q.raw.user_status.enrolled_at =
              q.raw.user_status.enrolled_at || new Date().toISOString();
          } else {
            q.updateUserStatus({
              user_id: '',
              quest_id: quest.id,
              enrolled_at: new Date().toISOString(),
              completed_at: null,
              claimed_at: null,
              last_queried_at: new Date().toISOString(),
              progress: {},
            });
          }
          return q;
        }
        throw err;
      });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(
        () =>
          reject(
            new Error(
              'Hết thời gian chờ phản hồi đăng ký từ Discord (quá 15 giây).',
            ),
          ),
        15000,
      );
    });

    return Promise.race([enrollPromise, timeoutPromise]);
  }

  private async sleep(ms: number) {
    const step = 200;
    let elapsed = 0;
    while (elapsed < ms) {
      if (this.isAborted) break;
      await new Promise((r) => setTimeout(r, Math.min(step, ms - elapsed)));
      elapsed += step;
    }
  }

  async redeemQuest(quest: Quest): Promise<void> {
    if (this.isAborted || quest.hasClaimedRewards()) {
      return;
    }
    const name = quest.config.messages.quest_name;
    try {
      const platform = quest.raw.config.rewards_config?.platforms?.[0] ?? 0;
      const res = (await this.client.rest.post(
        `/quests/${quest.id}/claim-reward`,
        {
          body: {
            platform,
            location: 11,
            is_targeted: false,
            metadata_raw: null,
            metadata_sealed: null,
            traffic_metadata_raw: quest.raw.traffic_metadata_raw,
            traffic_metadata_sealed: quest.raw.traffic_metadata_sealed,
          },
        },
      )) as any;

      this.log(`🎁 Đã tự động nhận thưởng nhiệm vụ "${name}"!`, 'success');
      quest.updateUserStatus(res);
      this.emit({
        type: 'quest:done',
        data: { name, id: quest.id, rewardName: quest.config.rewards_config?.rewards?.[0]?.messages?.name },
      });
    } catch (err: any) {
      const message = err?.message || String(err);
      const rawError = err?.rawError || {};
      const isCaptcha =
        Boolean(rawError.captcha_key) ||
        Boolean(rawError.captcha_sitekey) ||
        message.includes('No Description') ||
        message.toLowerCase().includes('captcha');

      if (isCaptcha && this.captchaConfig?.apiKey) {
        this.log(
          `🧩 Nhiệm vụ "${name}" yêu cầu CAPTCHA. Đang tự động giải bằng ${this.captchaConfig.provider.toUpperCase()}...`,
          'info',
        );

        const challenge = {
          sitekey: rawError.captcha_sitekey || 'a9b5df7e-8557-4b71-b844-32b03651fa90',
          rqdata: rawError.captcha_rqdata,
          rqtoken: rawError.captcha_rqtoken,
          service: rawError.captcha_service || 'hcaptcha',
        };

        const solution = await CaptchaSolver.solve(
          this.captchaConfig,
          challenge,
          (msg) => this.log(`[CAPTCHA] ${msg}`, 'info'),
        );

        if (solution) {
          try {
            const platform = quest.raw.config.rewards_config?.platforms?.[0] ?? 0;
            const headers: Record<string, string> = {
              'X-Captcha-Key': solution,
            };
            if (rawError.captcha_rqtoken) {
              headers['X-Captcha-Rqtoken'] = rawError.captcha_rqtoken;
            }

            const retryRes = (await this.client.rest.post(
              `/quests/${quest.id}/claim-reward`,
              {
                headers,
                body: {
                  platform,
                  location: 11,
                  is_targeted: false,
                  metadata_raw: null,
                  metadata_sealed: null,
                  traffic_metadata_raw: quest.raw.traffic_metadata_raw,
                  traffic_metadata_sealed: quest.raw.traffic_metadata_sealed,
                  captcha_key: solution,
                  captcha_rqtoken: rawError.captcha_rqtoken,
                },
              },
            )) as any;

            this.log(`🎉 Đã tự động giải CAPTCHA & nhận thưởng thành công nhiệm vụ "${name}"!`, 'success');
            quest.updateUserStatus(retryRes);
            this.emit({
              type: 'quest:done',
              data: { name, id: quest.id, rewardName: quest.config.rewards_config?.rewards?.[0]?.messages?.name },
            });
            return;
          } catch (retryErr: any) {
            this.log(`⚠️ Gửi lời giải CAPTCHA không thành công: ${retryErr?.message || retryErr}`, 'warn');
          }
        }
      }

      if (isCaptcha) {
        this.log(
          `🛡️ Nhiệm vụ "${name}" đã xong 100%! Discord yêu cầu xác thực Captcha. Bạn hãy mở Discord vào Kho Quà bấm "Nhận quà" (hoặc nhập API key Auto-Captcha để tự động nhận).`,
          'warn',
        );
        this.emit({
          type: 'quest:done',
          data: { name, id: quest.id },
        });
      } else {
        this.log(`⚠️ Không thể tự nhận quà "${name}": ${message}`, 'warn');
        if (quest.isCompleted()) {
          this.emit({
            type: 'quest:done',
            data: { name, id: quest.id },
          });
        } else {
          this.emit({
            type: 'quest:error',
            data: { name, id: quest.id, message: `Chưa hoàn tất 100% trên Discord: ${message}` },
          });
        }
      }
    }
  }

  async doingQuest(quest: Quest): Promise<void> {
    if (this.isAborted) return;
    const questName = quest.config.messages.quest_name;
    const isAndroid =
      Boolean(quest.config.task_config_v2.tasks.WATCH_VIDEO_ON_MOBILE) &&
      !Boolean(quest.config.task_config_v2.tasks.WATCH_VIDEO);

    if (!quest.isEnrolledQuest()) {
      this.log(
        `Đang đăng ký nhiệm vụ "${questName}" (${isAndroid ? 'Android' : 'Desktop'})...`,
        'info',
      );
      try {
        await this.acceptQuest(quest, isAndroid);
        this.log(`Đã đăng ký thành công nhiệm vụ "${questName}".`, 'success');
      } catch (err: any) {
        const message = err?.message || String(err);
        if (message.toLowerCase().includes('already')) {
          this.log(`Nhiệm vụ "${questName}" đã được nhận trước đó.`, 'info');
        } else {
          this.log(`Lỗi khi nhận nhiệm vụ "${questName}": ${message}`, 'error');
          this.emit({
            type: 'quest:error',
            data: { name: questName, id: quest.id, message },
          });
          return;
        }
      }
    }

    const applicationName = quest.config.application.name;
    const taskConfig = quest.config.task_config_v2;
    const taskName = (['WATCH_VIDEO', 'WATCH_VIDEO_ON_MOBILE', 'PLAY_ON_DESKTOP', 'PLAY_ON_XBOX', 'PLAY_ON_PLAYSTATION', 'PLAY_ACTIVITY', 'ACHIEVEMENT_IN_ACTIVITY'] as QuestTaskConfigType[]).find(
      (x) => taskConfig.tasks[x] != null,
    );

    if (!taskName || !taskConfig.tasks[taskName]) {
      this.log(`Nhiệm vụ "${questName}" có cấu hình chưa được hỗ trợ.`, 'warn');
      this.emit({
        type: 'quest:skip',
        data: { name: questName, id: quest.id, reason: 'Chưa hỗ trợ dạng task này' },
      });
      return;
    }

    const secondsNeeded = taskConfig.tasks[taskName].target;
    let secondsDone = quest.userStatus?.progress?.[taskName]?.value ?? 0;

    this.emit({
      type: 'quest:start',
      data: {
        id: quest.id,
        name: questName,
        task: taskName,
        application: applicationName,
        secondsNeeded,
        secondsDone,
        status: 'running',
      },
    });

    switch (taskName) {
      case 'WATCH_VIDEO':
      case 'WATCH_VIDEO_ON_MOBILE':
        await this.doingWatchVideoQuest(quest, questName, secondsNeeded, secondsDone);
        break;
      case 'PLAY_ON_XBOX':
      case 'PLAY_ON_PLAYSTATION':
      case 'PLAY_ON_DESKTOP':
        await this.doingPlayOnPlatformQuest(quest, questName, secondsNeeded, taskName, applicationName);
        break;
      case 'PLAY_ACTIVITY':
        await this.doingPlayActivityQuest(quest, questName, secondsNeeded, taskName, applicationName);
        break;
      case 'ACHIEVEMENT_IN_ACTIVITY':
        await this.doingAchievementInActivityQuest(quest, questName);
        break;
      default:
        this.emit({
          type: 'quest:skip',
          data: { name: questName, id: quest.id, reason: 'Không hỗ trợ' },
        });
        break;
    }
  }

  async doingWatchVideoQuest(
    quest: Quest,
    questName: string,
    secondsNeeded: number,
    secondsDone: number,
  ) {
    const maxFuture = 10;
    const speed = 7;
    const interval = 5;
    const enrolledAt = new Date(quest.userStatus?.enrolled_at || Date.now()).getTime();

    this.log(`Đang giả lập xem video nhiệm vụ: "${questName}"...`, 'info');

    while (!this.isAborted) {
      const maxAllowed = Math.floor((Date.now() - enrolledAt) / 1000) + maxFuture;
      // If enrolled in the past, allow jumping forward safely up to secondsNeeded
      const nextTarget = Math.min(secondsNeeded, Math.max(secondsDone + speed, Math.min(maxAllowed, secondsDone + 30)));
      const timestamp = Math.min(secondsNeeded, nextTarget);

      if (maxAllowed >= timestamp || timestamp === secondsNeeded) {
        try {
          const res = (await this.client.rest.post(
            `/quests/${quest.id}/video-progress`,
            {
              body: {
                timestamp: Math.min(secondsNeeded, timestamp + Math.random()),
              },
            },
          )) as any;

          quest.updateUserStatus(res);
          secondsDone = Math.min(secondsNeeded, timestamp);

          // If Discord already marked completion or timestamp reaches target, snap to 100%
          if (res.completed_at != null || secondsDone >= secondsNeeded) {
            secondsDone = secondsNeeded;
          }

          const currentPercent = Math.min(100, Math.round((secondsDone / secondsNeeded) * 100));

          this.emit({
            type: 'quest:progress',
            data: { name: questName, id: quest.id, secondsDone, secondsNeeded },
          });

          this.log(
            `🎬 Tiến trình xem video "${questName}": ${secondsDone}/${secondsNeeded}s (${currentPercent}%).`,
            currentPercent >= 100 ? 'success' : 'info',
          );

          if (res.completed_at != null || secondsDone >= secondsNeeded) {
            break;
          }
        } catch (err: any) {
          this.log(`Lỗi cập nhật tiến trình video "${questName}": ${err?.message}`, 'warn');
        }
      }

      if (timestamp >= secondsNeeded) break;
      await this.sleep(interval * 1000);
    }

    if (this.isAborted) return;

    try {
      const finalRes = await this.client.rest.post(
        `/quests/${quest.id}/video-progress`,
        { body: { timestamp: secondsNeeded } },
      );
      quest.updateUserStatus(finalRes as any);
    } catch {
      /* ignore */
    }

    // Always emit 100% progress before completing
    this.emit({
      type: 'quest:progress',
      data: { name: questName, id: quest.id, secondsDone: secondsNeeded, secondsNeeded },
    });

    this.log(`✨ Hoàn thành xem video nhiệm vụ "${questName}" (100%)!`, 'success');
    await this.redeemQuest(quest);
  }

  async doingPlayOnPlatformQuest(
    quest: Quest,
    questName: string,
    secondsNeeded: number,
    taskName: string,
    applicationName: string,
  ) {
    const interval = 20;
    this.log(
      `🎮 Bắt đầu giả lập chơi "${applicationName}" cho "${questName}" (${Math.ceil(secondsNeeded / 60)} phút)...`,
      'info',
    );

    let consecutiveErrors = 0;
    let heartbeatCount = 0;
    const initialDone = (quest.userStatus?.progress?.[taskName as QuestTaskConfigType]?.value as number) || 0;
    let lastKnownDone = initialDone;
    // Calculate maximum safety heartbeats allowed (giving up to 4 extra heartbeats = 80 seconds buffer)
    const maxHeartbeats = Math.ceil((secondsNeeded - initialDone) / interval) + 4;

    while (heartbeatCount < maxHeartbeats && !this.isAborted) {
      try {
        const res = await this.client.rest.post(
          `/quests/${quest.id}/heartbeat`,
          {
            body: {
              application_id: quest.config.application.id,
              terminal: false,
            },
          },
        );
        quest.updateUserStatus(res as any);
        consecutiveErrors = 0;
        heartbeatCount++;

        const serverDone = (quest.userStatus?.progress?.[taskName as QuestTaskConfigType]?.value as number) || 0;
        const isActuallyDone = quest.isCompleted() || serverDone >= secondsNeeded;

        // Realistic elapsed progress: first heartbeat records start, subsequent heartbeats add interval
        const elapsedEstimate = Math.max(0, (heartbeatCount - 1) * interval);
        const effectiveDone = Math.max(serverDone, initialDone + elapsedEstimate);

        // Never snap to 100% or secondsNeeded unless Discord server has confirmed completion!
        lastKnownDone = isActuallyDone ? secondsNeeded : Math.min(secondsNeeded - 1, effectiveDone);

        const currentMins = Math.floor(lastKnownDone / 60);
        const totalMins = Math.ceil(secondsNeeded / 60);
        const currentPercent = isActuallyDone ? 100 : Math.min(99, Math.round((lastKnownDone / secondsNeeded) * 100));

        this.log(
          `🕹️ Đã gửi tín hiệu game "${applicationName}". Tiến độ: ${currentMins}/${totalMins} phút (${currentPercent}%).`,
          isActuallyDone ? 'success' : 'info',
        );

        this.emit({
          type: 'quest:progress',
          data: { name: questName, id: quest.id, secondsDone: lastKnownDone, secondsNeeded },
        });

        // ONLY break out when Discord server confirms completion or target reached!
        if (isActuallyDone) {
          break;
        }
      } catch (err: any) {
        const msg = err?.message || String(err);
        if (this.client.isProxyError(err) && this.client.proxyMode === 'auto_github') {
          this.log(`⚠️ Sự cố mạng proxy ("${msg}"). Đang tự động chuyển sang Proxy dự phòng...`, 'warn');
          const rotated = await this.client.rotateToNextProxy(err);
          if (rotated) {
            consecutiveErrors = 0;
            await this.sleep(1500);
            continue;
          }
        }
        consecutiveErrors++;
        this.log(`⚠️ Lỗi gửi tín hiệu "${applicationName}" (${consecutiveErrors}/5): ${msg}`, 'warn');
        if (consecutiveErrors >= 5) {
          this.log(`Dừng nhiệm vụ "${questName}" do lỗi tín hiệu quá 5 lần.`, 'error');
          this.emit({
            type: 'quest:error',
            data: { name: questName, id: quest.id, message: `Lỗi tín hiệu liên tục: ${msg}` },
          });
          return;
        }
      }

      await this.sleep(interval * 1000);
    }

    if (this.isAborted) return;

    // Send terminal heartbeat
    try {
      const res = await this.client.rest.post(
        `/quests/${quest.id}/heartbeat`,
        {
          body: {
            application_id: quest.config.application.id,
            terminal: true,
          },
        },
      );
      quest.updateUserStatus(res as any);
    } catch {
      /* ignore terminal error */
    }

    let finalServerDone = (quest.userStatus?.progress?.[taskName as QuestTaskConfigType]?.value as number) || 0;

    // Safety buffer: If still missing seconds, send 1 final heartbeat after 10s wait
    if (!quest.isCompleted() && finalServerDone < secondsNeeded) {
      this.log(`⏳ Đang gửi thêm tín hiệu chốt để Discord đồng bộ đủ 100%...`, 'info');
      await this.sleep(10000);
      try {
        const extraRes = await this.client.rest.post(
          `/quests/${quest.id}/heartbeat`,
          {
            body: {
              application_id: quest.config.application.id,
              terminal: true,
            },
          },
        );
        quest.updateUserStatus(extraRes as any);
        finalServerDone = (quest.userStatus?.progress?.[taskName as QuestTaskConfigType]?.value as number) || 0;
      } catch {}
    }

    const verifiedDone = quest.isCompleted() || finalServerDone >= secondsNeeded;

    if (!verifiedDone) {
      this.log(`⚠️ Nhiệm vụ "${questName}" chưa đủ 100% trên Discord (${finalServerDone}/${secondsNeeded}s). Hãy chạy lại để cày nốt phần còn thiếu.`, 'warn');
      this.emit({
        type: 'quest:error',
        data: { name: questName, id: quest.id, message: `Chưa đủ 100% thời gian trên Discord (${finalServerDone}/${secondsNeeded}s)` },
      });
      return;
    }

    // Always emit 100% progress before completing
    this.emit({
      type: 'quest:progress',
      data: { name: questName, id: quest.id, secondsDone: secondsNeeded, secondsNeeded },
    });

    this.log(`✨ Hoàn thành chơi game nhiệm vụ "${questName}" (100%)!`, 'success');
    await this.redeemQuest(quest);
  }

  async doingPlayActivityQuest(
    quest: Quest,
    questName: string,
    secondsNeeded: number,
    taskName: string,
    applicationName: string,
  ) {
    const interval = 20;
    const streamKey = 'call:1:1';
    this.log(
      `📞 Giả lập hoạt động thoại "${applicationName}" cho "${questName}" (${Math.ceil(secondsNeeded / 60)} phút)...`,
      'info',
    );

    let consecutiveErrors = 0;
    let heartbeatCount = 0;
    const initialDone = (quest.userStatus?.progress?.[taskName as QuestTaskConfigType]?.value as number) || 0;
    let lastKnownDone = initialDone;
    const maxHeartbeats = Math.ceil((secondsNeeded - initialDone) / interval) + 4;

    while (heartbeatCount < maxHeartbeats && !this.isAborted) {
      try {
        const res = await this.client.rest.post(
          `/quests/${quest.id}/heartbeat`,
          {
            body: { stream_key: streamKey, terminal: false },
          },
        );
        quest.updateUserStatus(res as any);
        consecutiveErrors = 0;
        heartbeatCount++;

        const serverDone = (quest.userStatus?.progress?.[taskName as QuestTaskConfigType]?.value as number) || 0;
        const isActuallyDone = quest.isCompleted() || serverDone >= secondsNeeded;

        const elapsedEstimate = Math.max(0, (heartbeatCount - 1) * interval);
        const effectiveDone = Math.max(serverDone, initialDone + elapsedEstimate);

        lastKnownDone = isActuallyDone ? secondsNeeded : Math.min(secondsNeeded - 1, effectiveDone);

        const currentMins = Math.floor(lastKnownDone / 60);
        const totalMins = Math.ceil(secondsNeeded / 60);
        const currentPercent = isActuallyDone ? 100 : Math.min(99, Math.round((lastKnownDone / secondsNeeded) * 100));

        this.log(
          `📞 Tín hiệu hoạt động "${applicationName}". Tiến độ: ${currentMins}/${totalMins} phút (${currentPercent}%).`,
          isActuallyDone ? 'success' : 'info',
        );

        this.emit({
          type: 'quest:progress',
          data: { name: questName, id: quest.id, secondsDone: lastKnownDone, secondsNeeded },
        });

        if (isActuallyDone) {
          break;
        }
      } catch (err: any) {
        const msg = err?.message || String(err);
        if (this.client.isProxyError(err) && this.client.proxyMode === 'auto_github') {
          this.log(`⚠️ Sự cố mạng proxy ("${msg}"). Đang tự động chuyển sang Proxy dự phòng...`, 'warn');
          const rotated = await this.client.rotateToNextProxy(err);
          if (rotated) {
            consecutiveErrors = 0;
            await this.sleep(1500);
            continue;
          }
        }
        consecutiveErrors++;
        this.log(`⚠️ Lỗi gửi tín hiệu hoạt động (${consecutiveErrors}/5): ${msg}`, 'warn');
        if (consecutiveErrors >= 5) {
          this.log(`Dừng nhiệm vụ "${questName}" do lỗi tín hiệu quá 5 lần.`, 'error');
          this.emit({
            type: 'quest:error',
            data: { name: questName, id: quest.id, message: msg },
          });
          return;
        }
      }

      await this.sleep(interval * 1000);
    }

    if (this.isAborted) return;

    try {
      const res = await this.client.rest.post(
        `/quests/${quest.id}/heartbeat`,
        {
          body: { stream_key: streamKey, terminal: true },
        },
      );
      quest.updateUserStatus(res as any);
    } catch {
      /* ignore */
    }

    let finalServerDone = (quest.userStatus?.progress?.[taskName as QuestTaskConfigType]?.value as number) || 0;

    if (!quest.isCompleted() && finalServerDone < secondsNeeded) {
      this.log(`⏳ Đang gửi thêm tín hiệu chốt để Discord đồng bộ đủ 100%...`, 'info');
      await this.sleep(10000);
      try {
        const extraRes = await this.client.rest.post(
          `/quests/${quest.id}/heartbeat`,
          {
            body: { stream_key: streamKey, terminal: true },
          },
        );
        quest.updateUserStatus(extraRes as any);
        finalServerDone = (quest.userStatus?.progress?.[taskName as QuestTaskConfigType]?.value as number) || 0;
      } catch {}
    }

    const verifiedDone = quest.isCompleted() || finalServerDone >= secondsNeeded;

    if (!verifiedDone) {
      this.log(`⚠️ Nhiệm vụ "${questName}" chưa đủ 100% trên Discord (${finalServerDone}/${secondsNeeded}s).`, 'warn');
      this.emit({
        type: 'quest:error',
        data: { name: questName, id: quest.id, message: `Chưa đủ 100% thời gian trên Discord (${finalServerDone}/${secondsNeeded}s)` },
      });
      return;
    }

    // Always emit 100% progress before completing
    this.emit({
      type: 'quest:progress',
      data: { name: questName, id: quest.id, secondsDone: secondsNeeded, secondsNeeded },
    });

    this.log(`✨ Hoàn thành hoạt động nhiệm vụ "${questName}" (100%)!`, 'success');
    await this.redeemQuest(quest);
  }

  async doingAchievementInActivityQuest(quest: Quest, questName: string) {
    if (this.isAborted) return;
    const applicationId = quest.config.application.id;
    const applicationName = quest.config.application.name;
    const questTarget = quest.config.task_config_v2.tasks.ACHIEVEMENT_IN_ACTIVITY.target;

    this.log(`🔑 Đang cấp quyền Discord Says cho ứng dụng "${applicationName}"...`, 'info');

    const query = new URLSearchParams({
      response_type: 'code',
      client_id: applicationId,
      scope: 'identify applications.commands applications.entitlements',
      state: '',
    });

    try {
      const res2 = (await this.client.rest.post(`/oauth2/authorize`, {
        query,
        body: {
          permissions: '0',
          authorize: true,
          integration_type: 1,
          location_context: {
            guild_id: '10000',
            channel_id: '10000',
            channel_type: 10000,
          },
        },
      })) as Record<string, any>;

      const location = res2?.location;
      let authCode: string | null = null;
      if (location) {
        authCode = new URL(location).searchParams.get('code');
      }

      if (!authCode) {
        throw new Error('Không lấy được mã xác thực OAuth2.');
      }

      const { token, error: authError, activityReferrer } = await Utils.authorizeDiscordSays(
        applicationId,
        quest.id,
        authCode,
        this.client,
      );

      if (authError || !token) {
        throw new Error(`Lỗi xác thực Discord Says: ${authError || 'Token trống'}`);
      }

      const { success, error: progressError } = await Utils.progressDiscordSays(
        applicationId,
        quest.id,
        token,
        questTarget,
        activityReferrer,
      );

      if (progressError || !success) {
        throw new Error(`Lỗi cập nhật tiến trình Discord Says: ${progressError}`);
      }

      // Deauthorize
      try {
        const res3 = (await this.client.rest.get(`/oauth2/tokens`)) as {
          id: string;
          application: APIApplication;
        }[];
        const tokenInfo = res3.find((t) => t.application.id === applicationId);
        if (tokenInfo) {
          await this.client.rest.delete(`/oauth2/tokens/${tokenInfo.id}`);
        }
      } catch {
        /* ignore */
      }

      quest.updateUserStatus({
        user_id: '',
        quest_id: quest.id,
        enrolled_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        claimed_at: null,
        last_queried_at: new Date().toISOString(),
        progress: {},
      });

      this.log(`✨ Hoàn thành thành tựu "${questName}"!`, 'success');
      await this.redeemQuest(quest);
    } catch (err: any) {
      const msg = err?.message || String(err);
      this.log(`Lỗi nhiệm vụ thành tựu "${questName}": ${msg}`, 'error');
      this.emit({
        type: 'quest:error',
        data: { name: questName, id: quest.id, message: msg },
      });
    }
  }
}
