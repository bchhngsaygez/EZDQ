import { GatewayDispatchEvents } from 'discord-api-types/v10';
import { WebSocket } from 'ws';
import { ClientQuest } from './discord/client';
import { QuestManager } from './discord/questManager';
import { ServerEvent, LogLevel, CaptchaConfig, ProxyConfig } from './types';
import { Utils } from './discord/utils';
import { Constants } from './discord/constants';
import { ProxyPoolManager } from './proxy/proxyPool';

export class UserSession {
  public readonly id: string;
  private token: string;
  private client: ClientQuest | null = null;
  private ws: WebSocket | null = null;
  private state: 'idle' | 'starting' | 'running' | 'stopping' | 'error' = 'idle';
  private setStatus: boolean;
  private parallel: boolean;
  private captchaConfig?: CaptchaConfig;
  private proxyConfig?: ProxyConfig;
  private isDestroyed = false;

  constructor(
    id: string,
    token: string,
    ws: WebSocket,
    setStatus = true,
    parallel = true,
    captcha?: CaptchaConfig,
    proxy?: ProxyConfig,
  ) {
    this.id = id;
    this.token = token;
    this.ws = ws;
    this.setStatus = setStatus;
    this.parallel = parallel;
    this.captchaConfig = captcha;
    this.proxyConfig = proxy;
  }

  setWs(ws: WebSocket) {
    this.ws = ws;
  }

  send(event: ServerEvent) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(event));
      } catch {
        /* ignore */
      }
    }
  }

  private log(message: string, level: LogLevel = 'info') {
    const time = new Date().toLocaleTimeString('vi-VN');
    const safeMsg = Utils.maskToken(message);
    this.send({
      type: 'log',
      data: {
        id: Math.random().toString(36).substring(2, 9),
        time,
        level,
        message: safeMsg,
      },
    });
  }

  private setState(state: typeof this.state, message?: string) {
    this.state = state;
    this.send({
      type: 'state',
      data: { state, message },
    });
  }

  async start(): Promise<void> {
    if (this.state === 'running' || this.state === 'starting') return;
    this.setState('starting');
    this.log('🚀 Khởi tạo phiên kết nối Discord (RAM-only)...', 'system');

    try {
      let proxyUrl: string | undefined = undefined;
      const proxyMode =
        this.proxyConfig?.mode ||
        (process.env.AUTO_GITHUB_PROXY === 'true' || process.env.RENDER ? 'auto_github' : 'none');

      if (proxyMode === 'custom' && this.proxyConfig?.customUrl) {
        const custom = this.proxyConfig.customUrl.trim();
        const sanitized = custom.replace(/:[^:]*@/, ':***@');
        this.log(`🌐 [Proxy Custom] Đang kiểm tra proxy riêng: ${sanitized}...`, 'info');
        const testRes = await ProxyPoolManager.getInstance().testProxy(custom, 4000);
        if (testRes) {
          proxyUrl = custom;
          this.log(`✅ [Proxy Custom] Kết nối thành công tới proxy riêng (Độ trễ: ${testRes.latency}ms)`, 'success');
        } else {
          this.log(`⚠️ [Proxy Custom] Không thể kết nối tới proxy riêng hoặc bị chặn, chuyển sang kết nối trực tiếp...`, 'warn');
        }
      } else if (proxyMode === 'auto_github') {
        const found = await ProxyPoolManager.getInstance().findWorkingProxy((msg, lvl) => this.log(msg, lvl));
        if (found) {
          proxyUrl = found.proxyUrl;
        }
      }

      this.client = new ClientQuest(this.token, proxyUrl, proxyMode);
      this.client.onLog = (msg, lvl) => this.log(msg, lvl);

      this.client.once(GatewayDispatchEvents.Ready, async ({ data }) => {
        if (this.isDestroyed) return;

        let avatarUrl = undefined;
        if (data.user.avatar) {
          const isAnimated = data.user.avatar.startsWith('a_');
          const ext = isAnimated ? 'gif' : 'png';
          avatarUrl = `https://cdn.discordapp.com/avatars/${data.user.id}/${data.user.avatar}.${ext}?size=128`;
        }

        const profile = {
          id: data.user.id,
          username: data.user.username,
          global_name: data.user.global_name || data.user.username,
          avatar: data.user.avatar || undefined,
          avatarUrl,
        };

        this.send({ type: 'login', data: profile });
        this.setState('running');
        this.log(`✅ Đã đăng nhập tài khoản: @${data.user.username}`, 'success');

        // Set Discord Custom Status if requested
        if (this.setStatus) {
          try {
            const statusText = Constants.DEFAULT_CUSTOM_STATUS;
            await this.client?.setDoingQuestStatus(statusText);
            this.send({
              type: 'status_update',
              data: { text: statusText, active: true },
            });
            this.log(`🏷️ Đã cập nhật trạng thái Discord: "${statusText}"`, 'success');
          } catch (e: any) {
            this.log(`⚠️ Không thể đặt trạng thái: ${e?.message}`, 'warn');
          }
        }

        try {
          this.log('🔍 Đang quét danh sách nhiệm vụ Discord...', 'info');
          const questManager = await this.client!.fetchQuests(false);
          questManager.setEventEmitter((evt) => this.send(evt));
          if (this.captchaConfig) {
            questManager.setCaptchaConfig(this.captchaConfig);
            this.log(`🧩 Đã kích hoạt giải CAPTCHA tự động bằng nhà cung cấp: ${this.captchaConfig.provider.toUpperCase()}`, 'info');
          }

          const allQuests = questManager.toItemStates();
          this.send({
            type: 'quests_loaded',
            data: { total: allQuests.length, quests: allQuests },
          });

          // Redeem already completed quests
          const toRedeem = questManager.filterQuestsValidToRedeem();
          if (toRedeem.length > 0) {
            this.log(
              `🎁 Phát hiện ${toRedeem.length} nhiệm vụ đã hoàn thành từ trước. Đang nhận quà...`,
              'info',
            );
            for (const q of toRedeem) {
              if (this.isDestroyed) break;
              await questManager.redeemQuest(q);
              await new Promise((r) => setTimeout(r, 1500));
            }
          }

          const validQuests = questManager.filterQuestsValidToDo();
          if (validQuests.length === 0) {
            this.log('🎉 Không còn nhiệm vụ nào cần làm.', 'success');
            await this.stop();
            this.send({
              type: 'finish',
              data: { message: 'Tất cả nhiệm vụ đã hoàn tất hoặc không có nhiệm vụ mới!' },
            });
            return;
          }

          this.log(`📋 Tìm thấy ${validQuests.length} nhiệm vụ có thể thực hiện.`, 'info');

          // Phase 1: Sequential enrollment with rate-limit protection
          this.log('--- [Giai đoạn 1] Đăng ký các nhiệm vụ chưa nhận ---', 'system');
          for (const q of validQuests) {
            if (this.isDestroyed) break;
            const qName = q.config.messages.quest_name;
            if (!q.isEnrolledQuest()) {
              const isAndroid =
                Boolean(q.config.task_config_v2.tasks.WATCH_VIDEO_ON_MOBILE) &&
                !Boolean(q.config.task_config_v2.tasks.WATCH_VIDEO);

              this.log(`Đang đăng ký "${qName}" (${isAndroid ? 'Android' : 'Desktop'})...`, 'info');
              try {
                await questManager.acceptQuest(q, isAndroid);
                this.log(`Đăng ký thành công "${qName}".`, 'success');
                await new Promise((r) => setTimeout(r, 2500));
              } catch (err: any) {
                const msg = err?.message || String(err);
                if (msg.toLowerCase().includes('ratelimit') || err?.status === 429) {
                  this.log(
                    `⏳ [RateLimit Discord] Bạn đang bị giới hạn nhận nhiệm vụ mới qua API (~45 phút).`,
                    'warn',
                  );
                  this.log(
                    `💡 Mẹo: Hãy mở app Discord và bấm "Nhận nhiệm vụ" thủ công cho "${qName}", bot sẽ tự động cày tiếp ngay!`,
                    'info',
                  );
                  this.send({
                    type: 'quest:skip',
                    data: {
                      name: qName,
                      id: q.id,
                      reason: 'Bị giới hạn API Discord (hãy bấm Nhận trên app Discord)',
                    },
                  });
                } else {
                  this.log(`Không thể đăng ký "${qName}": ${msg}`, 'warn');
                }
              }
            } else {
              this.log(`Nhiệm vụ "${qName}" đã đăng ký từ trước.`, 'info');
            }
          }

          if (this.isDestroyed) return;

          // Phase 2: Execute enrolled quests
          const executable = validQuests.filter((q) => q.isEnrolledQuest());
          if (executable.length === 0) {
            this.log(
              '⚠️ Chưa có nhiệm vụ nào sẵn sàng (do giới hạn tần suất đăng ký của Discord).',
              'warn',
            );
            this.log(
              '👉 Hãy mở Discord và bấm "Nhận nhiệm vụ" rồi bấm Bắt đầu lại trên web!',
              'info',
            );
            await this.stop();
            this.send({
              type: 'finish',
              data: { message: 'Cần nhận nhiệm vụ trên app Discord trước.' },
            });
            return;
          }

          if (this.parallel) {
            this.log(
              `⚡ [Chế độ Song Song] Đang tiến hành làm đồng thời ${executable.length} nhiệm vụ...`,
              'system',
            );
            const tasks = executable.map(async (quest, index) => {
              if (index > 0) {
                await new Promise((r) => setTimeout(r, index * 1500));
              }
              return questManager.doingQuest(quest);
            });
            await Promise.allSettled(tasks);
          } else {
            this.log(
              `🔄 [Chế độ Tuần Tự] Đang tiến hành làm lần lượt từng nhiệm vụ (${executable.length} nhiệm vụ)...`,
              'system',
            );
            for (const quest of executable) {
              if (this.isDestroyed) break;
              await questManager.doingQuest(quest);
            }
          }

          if (!this.isDestroyed) {
            let completedCount = 0;
            let remainingCount = 0;
            if (this.client) {
              try {
                const freshManager = await this.client.fetchQuests();
                const freshQuests = freshManager.list().filter((q) => !q.isExpired() && q.isStarted());
                completedCount = freshQuests.filter((q) => q.isCompleted() || q.hasClaimedRewards()).length;
                remainingCount = freshQuests.length - completedCount;
              } catch {
                completedCount = executable.filter((q) => q.isCompleted() || q.hasClaimedRewards()).length;
                remainingCount = Math.max(0, validQuests.length - completedCount);
              }
            } else {
              completedCount = executable.filter((q) => q.isCompleted() || q.hasClaimedRewards()).length;
              remainingCount = Math.max(0, validQuests.length - completedCount);
            }

            await this.stop();

            if (remainingCount === 0) {
              this.log('🏆 Tất cả nhiệm vụ đã hoàn thành xong 100%!', 'success');
              this.send({
                type: 'finish',
                data: { message: `Đã hoàn tất tất cả ${completedCount} nhiệm vụ xuất sắc!` },
              });
            } else {
              this.log(
                `🏁 Đã hoàn tất đợt cày nhiệm vụ (${completedCount} nhiệm vụ đã xong, còn ${remainingCount} nhiệm vụ chưa xong hoặc bị giới hạn API).`,
                'info',
              );
              this.send({
                type: 'finish',
                data: {
                  message: `Đã hoàn thành ${completedCount} nhiệm vụ (còn ${remainingCount} nhiệm vụ chưa xong hoặc cần nhận trên Discord).`,
                },
              });
            }
          }
        } catch (err: any) {
          const msg = err?.message || String(err);
          if (msg.includes('RateLimitError') || msg.includes('429')) {
            this.log(
              '🚫 [Discord RateLimit - Chặn IP Host]: Dải IP của server host (Render/Cloud) đang bị Discord giới hạn tần suất truy cập /quests/@me.',
              'error',
            );
            this.log(
              '💡 Cách khắc phục: Chạy app trực tiếp trên máy tính cá nhân (Localhost) để dùng IP sạch, hoặc cấu hình biến môi trường PROXY_URL.',
              'warn',
            );
          } else {
            this.log(`Lỗi khi xử lý nhiệm vụ: ${msg}`, 'error');
          }
          await this.stop();
          this.setState('error', msg);
        }
      });

      await this.client.connect();
    } catch (err: any) {
      const msg = err?.message || String(err);
      this.log(`Lỗi kết nối Discord: ${msg}`, 'error');
      this.setState('error', msg);
    }
  }

  async stop(): Promise<void> {
    if (this.state === 'idle') return;
    this.setState('stopping');
    this.log('🛑 Đang dừng phiên làm nhiệm vụ...', 'info');

    if (this.client?.questManager) {
      this.client.questManager.abort();
    }

    if (this.client) {
      try {
        await Promise.race([
          this.client.clearCustomStatus(),
          new Promise((r) => setTimeout(r, 4000)),
        ]);
        this.send({
          type: 'status_update',
          data: { text: '', active: false },
        });
      } catch {
        /* ignore */
      }

      try {
        await Promise.race([
          this.client.destroy(),
          new Promise((r) => setTimeout(r, 3000)),
        ]);
      } catch {
        /* ignore */
      }
    }

    this.client = null;
    this.setState('idle');
    this.log('Đã dừng an toàn. Phiên về trạng thái sẵn sàng.', 'system');
  }

  async claimQuest(questId: string): Promise<void> {
    if (!this.client?.questManager) {
      this.log('Chưa có kết nối nào đang chạy để nhận thưởng.', 'warn');
      return;
    }
    const quest = this.client.questManager.get(questId);
    if (!quest) {
      this.log(`Không tìm thấy nhiệm vụ ID ${questId}.`, 'warn');
      return;
    }
    await this.client.questManager.redeemQuest(quest);
  }

  destroy() {
    this.isDestroyed = true;
    this.token = ''; // Scrub in-memory token string
    if (this.client) {
      this.client.questManager?.abort();
      this.client.clearCustomStatus().catch(() => {});
      this.client.destroy().catch(() => {});
      this.client = null;
    }
    this.ws = null;
    this.state = 'idle';
  }
}

export class SessionManager {
  private static instance: SessionManager;
  private sessions = new Map<string, UserSession>();

  private constructor() {}

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  createSession(
    id: string,
    token: string,
    ws: WebSocket,
    setStatus = true,
    parallel = true,
    captcha?: CaptchaConfig,
    proxy?: ProxyConfig,
  ): UserSession {
    // If existing session exists for this socket/id, destroy old one
    if (this.sessions.has(id)) {
      this.destroySession(id);
    }
    const session = new UserSession(id, token, ws, setStatus, parallel, captcha, proxy);
    this.sessions.set(id, session);
    return session;
  }

  getSession(id: string): UserSession | undefined {
    return this.sessions.get(id);
  }

  destroySession(id: string) {
    const session = this.sessions.get(id);
    if (session) {
      session.destroy();
      this.sessions.delete(id);
    }
  }

  destroyAll() {
    for (const [id, session] of this.sessions.entries()) {
      session.destroy();
      this.sessions.delete(id);
    }
  }
}
