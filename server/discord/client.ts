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
      while (attempt < 2) {
        attempt++;
        if (currentProxyAgent) {
          (init as any).dispatcher = currentProxyAgent;
        }

        try {
          return await DefaultRestOptions.makeRequest(url, init);
        } catch (err: any) {
          if (attempt === 1 && currentProxyMode === 'auto_github' && isProxyError(err)) {
            if (rotateHandler) {
              const rotated = await rotateHandler(err);
              if (rotated) {
                continue; // Retry request immediately with next proxy
              }
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
    if (this.proxyAgent) {
      try {
        await this.proxyAgent.destroy();
      } catch {
        /* ignore */
      }
      this.proxyAgent = undefined;
    }
    try {
      await this.clearCustomStatus();
    } catch {
      /* ignore */
    }
    try {
      await this.websocketManager.destroy();
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
   * Sets via both Gateway Presence and REST User Settings
   */
  async setDoingQuestStatus(
    statusText = Constants.DEFAULT_CUSTOM_STATUS,
  ): Promise<boolean> {
    let success = false;

    // 1. Gateway Presence Update (Realtime across all connected clients)
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

    // 2. REST API /users/@me/settings (Persistent Discord custom status)
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
   * Clear or reset custom status on Discord
   */
  async clearCustomStatus(): Promise<void> {
    try {
      await this.websocketManager.send(0, {
        op: GatewayOpcodes.PresenceUpdate,
        d: {
          since: null,
          activities: [],
          status: PresenceUpdateStatus.Online,
          afk: false,
        },
      });
    } catch {
      /* ignore */
    }

    try {
      await this.rest.patch('/users/@me/settings', {
        body: {
          custom_status: null,
        },
      });
    } catch {
      /* ignore */
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


