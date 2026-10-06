import { Client, APIGatewayBotInfo } from '@discordjs/core';
import { RequestInit } from 'undici';
import { REST, DefaultRestOptions, ResponseLike } from '@discordjs/rest';
import { WebSocketManager, WebSocketShard } from '@discordjs/ws';
import { GatewaySendPayload, GatewayOpcodes, PresenceUpdateStatus } from 'discord-api-types/v10';
import { QuestManager } from './questManager';
import { AllQuestsResponse, UserProfile } from '../types';
import { Constants } from './constants';
import { Utils } from './utils';

async function makeRequest(
  url: string,
  init: RequestInit,
): Promise<ResponseLike> {
  if (init.headers) {
    init.headers = Utils.makeHeaders(init.headers as any);
  }
  return DefaultRestOptions.makeRequest(url, init);
}

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
  private isDestroyed = false;

  constructor(token: string) {
    if (!token) {
      throw new Error('Token Discord là bắt buộc.');
    }
    const cleanToken = token.trim();
    const rest = new REST({
      version: '10',
      makeRequest,
      rejectOnRateLimit: (info: any) => {
        return info.retryAfter > 15000;
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
    this.websocketManager = gateway;
    gateway.on('error', () => null);
  }

  async connect(): Promise<void> {
    await Utils.updateLatestBuildVersion();
    await this.websocketManager.connect();
  }

  async destroy(): Promise<void> {
    if (this.isDestroyed) return;
    this.isDestroyed = true;
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
    const response = (await this.rest.get('/quests/@me')) as AllQuestsResponse;
    const manager = await QuestManager.fromResponse(
      this,
      response,
      fetchExcludedQuests,
    );
    this.questManager = manager;
    return manager;
  }
}
