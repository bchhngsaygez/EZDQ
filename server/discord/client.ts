import { Client, APIGatewayBotInfo } from '@discordjs/core';
import { RequestInit, ProxyAgent } from 'undici';
import { REST, DefaultRestOptions, ResponseLike, RESTEvents } from '@discordjs/rest';
import { WebSocketManager, WebSocketShard } from '@discordjs/ws';
import { GatewaySendPayload, GatewayOpcodes, PresenceUpdateStatus } from 'discord-api-types/v10';
import { QuestManager } from './questManager';
import { AllQuestsResponse, UserProfile } from '../types';
import { Constants } from './constants';
import { Utils } from './utils';
import { createProxyAgent, isProxyError, ProxyPoolManager } from '../proxy/proxyPool';

const originalSend = WebSocketShard.prototype.send;
WebSocketShard.prototype.send = async function (payload: GatewaySendPayload) {
  if (payload.op === GatewayOpcodes.Identify) {
    payload.d = {
      token: payload.d.token,
      properties: {
        ...Constants.Properties,
        is_fast_connect: false,
        gateway_connect_reasons: 'AppSkeleton',
      },
      capabilities: 0,
      presence: payload.d.presence,
      compress: payload.d.compress,
      client_state: {
        guild_versions: {},
      },
    } as any;
  }
  return originalSend.call(this, payload);
};

export class ClientQuest extends Client {
  public questManager: QuestManager | null = null;
  public websocketManager: WebSocketManager;
  public readonly token: string;
  public onLog?: (message: string, level: 'info' | 'warn' | 'error' | 'success' | 'system') => void;
  public proxyUrl?: string;
  public proxyMode: 'auto_github' | 'none' | 'custom' = 'none';
  private proxyAgent?: ProxyAgent;
  private isDestroyed = false;
  private onProxyAgentUpdated?: (agent?: ProxyAgent) => void;
  public originalCustomStatus: any = undefined;

  constructor(
    token: string,
    proxyUrl?: string,
    proxyMode: 'auto_github' | 'none' | 'custom' = 'none',
  ) {
    if (!token) {
      throw new Error('Token Discord là bắt buộc.');
    }
    const cleanToken = token.trim();
    let currentProxyMode = proxyMode;
    let currentProxyAgent: ProxyAgent | undefined = undefined;

    if (proxyUrl) {
      try {
        currentProxyAgent = createProxyAgent(proxyUrl, 5000);
      } catch {
        currentProxyAgent = undefined;
      }
    }

    let rotateHandler: ((err: any) => Promise<boolean>) | null = null;

    const restMakeRequest = async (url: string, init: RequestInit): Promise<ResponseLike> => {
      if (init.headers) {
        init.headers = Utils.makeHeaders(init.headers as any);
      }

      let attempt = 0;
      while (attempt < 3) {
        attempt++;
        if (currentProxyAgent) {
          (init as any).dispatcher = currentProxyAgent;
        } else {
          delete (init as any).dispatcher;
        }

        try {
          return await DefaultRestOptions.makeRequest(url, init);
        } catch (err: any) {
          if (attempt < 3 && currentProxyMode === 'auto_github' && isProxyError(err)) {
            if (rotateHandler) {
              await rotateHandler(err);
              continue; // Retry request immediately with next proxy
            }
          }
          throw err;
        }
      }
      throw new Error('Yêu cầu thất bại sau khi đổi proxy.');
    };

    const rest = new REST({
      version: '10',
      makeRequest: restMakeRequest,
      rejectOnRateLimit: (info: any) => {
        // Allow waiting up to 60 seconds automatically before rejecting
        return info.retryAfter > 60000;
      },
    }).setToken(cleanToken);

    const gateway = new WebSocketManager({
      token: cleanToken,
      intents: 0,
      rest,
      readyTimeout: 120_000,
    });

    gateway.fetchGatewayInformation = (): Promise<APIGatewayBotInfo> => {
      return Promise.resolve({
        url: 'wss://gateway.discord.gg',
        shards: 1,
        session_start_limit: {
          total: 1000,
          remaining: 1000,
          reset_after: 14400000,
          max_concurrency: 1,
        },
      });
    };

    super({ rest, gateway });
    this.token = cleanToken;
    this.proxyUrl = proxyUrl;
    this.proxyMode = proxyMode;
    this.proxyAgent = currentProxyAgent;
    this.websocketManager = gateway;
    gateway.on('error', () => null);

    this.onProxyAgentUpdated = (agent?: ProxyAgent) => {
      currentProxyAgent = agent;
    };

    rotateHandler = async (err: any) => {
      const res = await this.rotateToNextProxy(err);
      currentProxyAgent = this.proxyAgent;
      return res;
    };

    rest.on(RESTEvents.RateLimited, (info: any) => {
      const waitSec = Math.ceil(info.timeToReset / 1000);
      const route = info.route || 'Discord API';
      if (this.onLog) {
        this.onLog(
          `⏳ [RateLimit Discord] Endpoint ${route} đang bị giới hạn IP, tự động chờ ${waitSec}s rồi thử lại...`,
          'warn',
        );
      }
    });
  }

  async connect(): Promise<void> {
    await Utils.updateLatestBuildVersion();
    await this.websocketManager.connect();
  }

  async destroy(): Promise<void> {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    // 1. Clear/revert custom status FIRST while proxyAgent and gateway are still 100% active
    try {
      await Promise.race([
        this.clearCustomStatus(),
        new Promise((r) => setTimeout(r, 3500)),
      ]);
    } catch {
      /* ignore */
    }

    // 2. Destroy proxy agent
    if (this.proxyAgent) {
      try {
        await this.proxyAgent.destroy();
      } catch {
        /* ignore */
      }
      this.proxyAgent = undefined;
    }

    // 3. Destroy websocket manager with safety timeout
    try {
      await Promise.race([
        this.websocketManager.destroy(),
        new Promise((r) => setTimeout(r, 2500)),
      ]);
    } catch {
      /* ignore */
    }
  }

  async fetchCurrentUser(): Promise<UserProfile> {
    const user = (await this.rest.get('/users/@me')) as any;
    let avatarUrl = undefined;
    if (user.avatar) {
      const isAnimated = user.avatar.startsWith('a_');
      const ext = isAnimated ? 'gif' : 'png';
      avatarUrl = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}?size=128`;
    }
    return {
      id: user.id,
      username: user.username,
      global_name: user.global_name || user.username,
      avatar: user.avatar,
      avatarUrl,
    };
  }

  /**
   * Set custom status on Discord: "Doing Quest ✔ • https://ezdisquest.nx.kg/"
   * Backs up the original custom status first so it can be restored when finished!
   */
  async setDoingQuestStatus(
    statusText = Constants.DEFAULT_CUSTOM_STATUS,
  ): Promise<boolean> {
    let success = false;

    // 1. Fetch and remember the user's original custom status if not fetched yet
    if (this.originalCustomStatus === undefined) {
      try {
        const settings = (await this.rest.get('/users/@me/settings')) as any;
        this.originalCustomStatus = settings?.custom_status ?? null;
      } catch {
        this.originalCustomStatus = null;
      }
    }

    // 2. Gateway Presence Update (Realtime across all connected clients)
    try {
      await this.websocketManager.send(0, {
        op: GatewayOpcodes.PresenceUpdate,
        d: {
          since: null,
          activities: [
            {
              name: 'Custom Status',
              type: 4,
              state: statusText,
            },
          ],
          status: PresenceUpdateStatus.Online,
          afk: false,
        },
      });
      success = true;
    } catch (err: any) {
      // Gateway presence may silently fail if shard is reconnecting
    }

    // 3. REST API /users/@me/settings (Persistent Discord custom status)
    try {
      await this.rest.patch('/users/@me/settings', {
        body: {
          custom_status: {
            text: statusText,
            emoji_name: '✔',
          },
        },
      });
      success = true;
    } catch (err: any) {
      // Settings endpoint can sometimes return 400/403 on specific tokens
    }

    return success;
  }

  /**
   * Revert custom status back to user's original status or clear it completely
   */
  async clearCustomStatus(): Promise<void> {
    const original = this.originalCustomStatus;

    // 1. Gateway Presence Update
    try {
      if (original && original.text) {
        await this.websocketManager.send(0, {
          op: GatewayOpcodes.PresenceUpdate,
          d: {
            since: null,
            activities: [
              {
                name: 'Custom Status',
                type: 4,
                state: original.text,
              },
            ],
            status: PresenceUpdateStatus.Online,
            afk: false,
          },
        });
      } else {
        await this.websocketManager.send(0, {
          op: GatewayOpcodes.PresenceUpdate,
          d: {
            since: null,
            activities: [],
            status: PresenceUpdateStatus.Online,
            afk: false,
          },
        });
      }
    } catch {
      /* ignore */
    }

    // 2. REST API /users/@me/settings
    try {
      if (original && (original.text || original.emoji_name)) {
        await this.rest.patch('/users/@me/settings', {
          body: {
            custom_status: {
              text: original.text || '',
              emoji_id: original.emoji_id || null,
              emoji_name: original.emoji_name || null,
              expires_at: original.expires_at || null,
            },
          },
        });
        if (this.onLog) {
          this.onLog(`🔄 Đã khôi phục trạng thái Discord ban đầu: "${original.text || ''}"`, 'info');
        }
      } else {
        // Clear status completely
        await this.rest.patch('/users/@me/settings', {
          body: {
            custom_status: null,
          },
        });
        if (this.onLog) {
          this.onLog('🧹 Đã xóa trạng thái làm nhiệm vụ trên Discord.', 'info');
        }
      }
    } catch {
      // Fallback: Some Discord client versions accept empty fields
      try {
        await this.rest.patch('/users/@me/settings', {
          body: {
            custom_status: {
              text: null,
              emoji_id: null,
              emoji_name: null,
              expires_at: null,
            },
          },
        });
      } catch {
        /* ignore */
      }
    }
  }

  async fetchQuests(fetchExcludedQuests = false): Promise<QuestManager> {
    try {
      const response = (await this.rest.get('/quests/@me')) as AllQuestsResponse;
      const manager = await QuestManager.fromResponse(
        this,
        response,
        fetchExcludedQuests,
      );
      this.questManager = manager;
      return manager;
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes('RateLimitError') || err?.status === 429) {
        throw new Error(
          `RateLimitError[/quests/@me]: IP của máy chủ host (Render/Cloud) đang bị Discord giới hạn tần suất. Khắc phục: Chạy trên máy cá nhân (Localhost) hoặc cấu hình PROXY_URL.`
        );
      }
      throw err;
    }
  }

  public setProxy(newProxyUrl?: string) {
    this.proxyUrl = newProxyUrl;
    if (this.proxyAgent) {
      try {
        this.proxyAgent.destroy();
      } catch {}
      this.proxyAgent = undefined;
    }

    if (newProxyUrl) {
      try {
        this.proxyAgent = createProxyAgent(newProxyUrl, 5000);
      } catch {
        this.proxyAgent = undefined;
      }
    }
    this.onProxyAgentUpdated?.(this.proxyAgent);
  }

  public async rotateToNextProxy(errorOrReason?: any): Promise<boolean> {
    const reason = errorOrReason?.message || String(errorOrReason || 'Lỗi mạng');
    const newProxy = await ProxyPoolManager.getInstance().rotateProxy(reason, this.onLog);
    if (newProxy) {
      this.setProxy(newProxy.proxyUrl);
      return true;
    } else {
      this.setProxy(undefined);
      return false;
    }
  }

  public isProxyError(err: any): boolean {
    return isProxyError(err);
  }
}


