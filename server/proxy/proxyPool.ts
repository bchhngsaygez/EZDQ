import { ProxyAgent, Client, request } from 'undici';
import { LogLevel } from '../types';

/**
 * Tier 0: Elite, pre-verified live proxy sources (updated every 15-30 min, <250KB total)
 * Extremely fast to download (~200ms) with >95% live success rate.
 */
export const ELITE_SOURCES = [
  'https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/http.txt',
  'https://raw.githubusercontent.com/prxchk/proxy-list/main/http.txt',
  'https://raw.githubusercontent.com/sunny9577/proxy-scraper/master/generated/http_proxies.txt',
];

/**
 * Secondary massive GitHub proxy repositories (30+ repos, 200k+ total proxies for deep background fallback)
 */
export const SECONDARY_SOURCES = [
  'https://raw.githubusercontent.com/roosterkid/openproxylist/main/HTTPS_RAW.txt',
  'https://raw.githubusercontent.com/proxifly/free-proxy-list/main/proxies/protocols/http/data.txt',
  'https://raw.githubusercontent.com/TheSpeedX/SOCKS-List/master/http.txt',
  'https://raw.githubusercontent.com/Zaeem20/FREE_PROXIES_LIST/master/http.txt',
  'https://raw.githubusercontent.com/Zaeem20/FREE_PROXIES_LIST/master/https.txt',
  'https://raw.githubusercontent.com/officialputuid/KangProxy/KangProxy/Http/Http.txt',
  'https://raw.githubusercontent.com/officialputuid/KangProxy/KangProxy/Https/Https.txt',
  'https://raw.githubusercontent.com/vakhov/fresh-proxy-list/master/http.txt',
  'https://raw.githubusercontent.com/vakhov/fresh-proxy-list/master/https.txt',
  'https://raw.githubusercontent.com/clarketm/proxy-list/master/proxy-list-raw.txt',
  'https://raw.githubusercontent.com/im-notify/free-proxy-list/main/http.txt',
  'https://raw.githubusercontent.com/hendrikbgr/Free-Proxy-Repo/master/proxy_list.txt',
  'https://raw.githubusercontent.com/mertguvencli/http-proxy-list/main/proxy-list/data.txt',
  'https://raw.githubusercontent.com/yemast/proxy-list/main/proxies/http.txt',
  'https://raw.githubusercontent.com/jetkai/proxy-list/main/online-proxies/txt/proxies-http.txt',
  'https://raw.githubusercontent.com/rdavydov/proxy-list/main/proxies/http.txt',
  'https://raw.githubusercontent.com/zevtyardt/proxy-list/main/http.txt',
  'https://raw.githubusercontent.com/ErcinDedeoglu/proxies/main/proxies/http.txt',
  'https://raw.githubusercontent.com/Anonym0usWork1221/Free-Proxies/master/proxy_files/http_proxies.txt',
  'https://raw.githubusercontent.com/MrMarble/proxy-list/master/all.txt',
  'https://raw.githubusercontent.com/mmpx12/proxy-list/master/http.txt',
  'https://raw.githubusercontent.com/mmpx12/proxy-list/master/https.txt',
  'https://raw.githubusercontent.com/B4RC0DE-TM/proxy-list/main/HTTP.txt',
  'https://raw.githubusercontent.com/ObcbO/getproxy/master/http.txt',
  'https://raw.githubusercontent.com/ObcbO/getproxy/master/https.txt',
  'https://raw.githubusercontent.com/andigwandi/free-proxy/main/proxy_list.txt',
  'https://raw.githubusercontent.com/HyperBeats/proxy-list/main/http.txt',
  'https://raw.githubusercontent.com/MuRongPIG/Proxy-Master/main/http.txt',
];

export interface ProxyTestResult {
  proxyUrl: string;
  latency: number;
  testedAt: number;
}

/**
 * Detects whether an error is caused by a proxy connection timeout, network reset, invalid HTML response, or Cloudflare rate limit
 */
export function isProxyError(err: any): boolean {
  if (!err) return false;
  const msg = String(err.message ?? err ?? '').toLowerCase();
  const code = String(err.code ?? '').toLowerCase();
  const name = String(err.name ?? '').toLowerCase();
  const status = Number(err.status || err.statusCode || (typeof err.code === 'number' ? err.code : 0));

  return (
    name.includes('connecttimeouterror') ||
    name.includes('socketerror') ||
    code.includes('und_err_connect_timeout') ||
    code.includes('und_err_socket') ||
    code.includes('und_err_headers_timeout') ||
    code.includes('und_err_body_timeout') ||
    code.includes('econnreset') ||
    code.includes('econnrefused') ||
    code.includes('etimedout') ||
    code.includes('ehostunreach') ||
    code.includes('enetunreach') ||
    msg.includes('connect timeout') ||
    msg.includes('socket hang up') ||
    msg.includes('proxy response') ||
    msg.includes('proxy error') ||
    msg.includes('connection reset') ||
    msg.includes('ratelimiterror[/quests/@me]') ||
    msg.includes('rate limit') ||
    msg.includes('unexpected token') ||
    msg.includes('not valid json') ||
    msg.includes('<!doctype') ||
    msg.includes('bad gateway') ||
    msg.includes('service unavailable') ||
    msg.includes('gateway timeout') ||
    status === 407 ||
    status === 429 ||
    status === 502 ||
    status === 503 ||
    status === 504
  );
}

/**
 * Factory helper to construct ProxyAgent with enforced connection timeout
 */
export function createProxyAgent(proxyUrl: string, connectTimeout = 5000): ProxyAgent {
  return new ProxyAgent({
    uri: proxyUrl,
    clientFactory: (origin, opts) =>
      new Client(origin, {
        ...opts,
        connect: { timeout: connectTimeout },
      }),
  });
}

export class ProxyPoolManager {
  private static instance: ProxyPoolManager;
  private eliteProxies: string[] = [];
  private secondaryProxies: string[] = [];
  private lastEliteScraped = 0;
  private lastSecondaryScraped = 0;
  private isScrapingSecondary = false;
  private isReplenishing = false;
  private failedProxies = new Set<string>();

  // Standby verified proxy pool waiting in memory
  private standbyPool: ProxyTestResult[] = [];
  // Currently active proxy in use
  private activeProxy: ProxyTestResult | null = null;

  private constructor() {}

  public static getInstance(): ProxyPoolManager {
    if (!ProxyPoolManager.instance) {
      ProxyPoolManager.instance = new ProxyPoolManager();
    }
    return ProxyPoolManager.instance;
  }

  public getStandbyCount(): number {
    return this.standbyPool.length;
  }

  public getActiveProxy(): string | null {
    return this.activeProxy?.proxyUrl || null;
  }

  /**
   * Background pre-warm on server boot: loads lists and prepares a standby pool
   */
  public async prewarm(): Promise<void> {
    try {
      await this.scrapeElite();
      await this.fillStandbyPool(4);
      this.scrapeSecondaryInBackground();
    } catch {
      /* ignore background prewarm failure */
    }
  }

  /**
   * Scrapes Tier 0 elite sources in ~200-400ms
   */
  public async scrapeElite(onLog?: (msg: string, level: LogLevel) => void, forceRefresh = false): Promise<string[]> {
    const now = Date.now();
    if (!forceRefresh && this.eliteProxies.length > 30 && now - this.lastEliteScraped < 10 * 60 * 1000) {
      return this.eliteProxies;
    }

    if (onLog) {
      onLog(`⚡ [Proxy Engine] Đang lấy danh sách proxy phản hồi nhanh từ GitHub...`, 'info');
    }

    const set = new Set<string>();
    const ipPortRegex = /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?):([1-9][0-9]{0,4})\b/g;

    const fetches = ELITE_SOURCES.map(async (url) => {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(2500) });
        if (!res.ok) return;
        const text = await res.text();
        let match: RegExpExecArray | null;
        const localRegex = new RegExp(ipPortRegex.source, 'g');
        while ((match = localRegex.exec(text)) !== null) {
          const entry = match[0];
          const port = parseInt(match[1], 10);
          if (port > 0 && port <= 65535 && !entry.startsWith('10.') && !entry.startsWith('192.168.') && !entry.startsWith('127.')) {
            set.add(`http://${entry}`);
          }
        }
      } catch {
        /* ignore */
      }
    });

    await Promise.allSettled(fetches);

    if (set.size > 0) {
      this.eliteProxies = Array.from(set).sort(() => Math.random() - 0.5);
      this.lastEliteScraped = now;
    }

    return this.eliteProxies;
  }

  /**
   * Scrapes massive 30+ secondary repos lazily in background
   */
  public scrapeSecondaryInBackground(): void {
    if (this.isScrapingSecondary) return;
    const now = Date.now();
    if (this.secondaryProxies.length > 500 && now - this.lastSecondaryScraped < 30 * 60 * 1000) return;

    this.isScrapingSecondary = true;
    (async () => {
      try {
        const set = new Set<string>();
        const ipPortRegex = /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?):([1-9][0-9]{0,4})\b/g;

        const fetches = SECONDARY_SOURCES.map(async (url) => {
          try {
            const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
            if (!res.ok) return;
            const text = await res.text();
            let match: RegExpExecArray | null;
            const localRegex = new RegExp(ipPortRegex.source, 'g');
            while ((match = localRegex.exec(text)) !== null) {
              const entry = match[0];
              const port = parseInt(match[1], 10);
              if (port > 0 && port <= 65535 && !entry.startsWith('10.') && !entry.startsWith('192.168.') && !entry.startsWith('127.')) {
                set.add(`http://${entry}`);
              }
            }
          } catch {}
        });

        await Promise.allSettled(fetches);
        if (set.size > 0) {
          this.secondaryProxies = Array.from(set).sort(() => Math.random() - 0.5);
          this.lastSecondaryScraped = Date.now();
        }
      } finally {
        this.isScrapingSecondary = false;
      }
    })().catch(() => {});
  }

  /**
   * Fast health-check single proxy with strict Discord Gateway JSON validation
   * Rejects any proxy returning HTML, captive portals, Cloudflare blocks, or non-200 status.
   */
  public async testProxy(proxyUrl: string, timeoutMs = 2500): Promise<ProxyTestResult | null> {
    const start = Date.now();
    let agent: ProxyAgent | null = null;
    try {
      agent = createProxyAgent(proxyUrl, timeoutMs);

      const res = await request('https://discord.com/api/v10/gateway', {
        dispatcher: agent,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(timeoutMs + 400),
      });

      if (res.statusCode === 200) {
        const contentType = (res.headers['content-type'] as string) || '';
        if (contentType.toLowerCase().includes('application/json')) {
          const bodyText = await res.body.text();
          if (bodyText.includes('gateway.discord.gg')) {
            const data = JSON.parse(bodyText);
            if (data && typeof data.url === 'string' && data.url.includes('discord')) {
              return {
                proxyUrl,
                latency: Date.now() - start,
                testedAt: Date.now(),
              };
            }
          }
        }
      }
      await res.body.dump().catch(() => {});
      return null;
    } catch {
      return null;
    } finally {
      if (agent) {
        agent.destroy().catch(() => {});
      }
    }
  }

  /**
   * Races candidates concurrently using Promise.any. Returns the instant the first responds with verified Discord JSON!
   */
  private async raceCandidates(candidates: string[], timeoutMs = 2500): Promise<ProxyTestResult | null> {
    if (!candidates.length) return null;

    try {
      const promises = candidates.map(async (candidate) => {
        const res = await this.testProxy(candidate, timeoutMs);
        if (res) return res;
        this.failedProxies.add(candidate);
        throw new Error();
      });

      return await Promise.any(promises);
    } catch {
      return null;
    }
  }

  /**
   * Replenishes the standby pool in background with targetCount working proxies
   */
  public async fillStandbyPool(targetCount = 5, onLog?: (msg: string, level: LogLevel) => void): Promise<void> {
    if (this.isReplenishing) return;
    this.isReplenishing = true;

    try {
      if (this.eliteProxies.length === 0) {
        await this.scrapeElite();
      }

      let allCandidates = [
        ...this.eliteProxies.filter((p) => !this.failedProxies.has(p)),
        ...this.secondaryProxies.filter((p) => !this.failedProxies.has(p)),
      ];

      let offset = 0;
      const batchSize = 35;

      while (this.standbyPool.length < targetCount && offset < allCandidates.length) {
        const batch = allCandidates.slice(offset, offset + batchSize);
        offset += batchSize;
        if (!batch.length) break;

        try {
          const winner = await this.raceCandidates(batch, 2200);
          if (winner && !this.standbyPool.some((p) => p.proxyUrl === winner.proxyUrl)) {
            this.standbyPool.push(winner);
          }
        } catch {
          /* continue to next batch */
        }
      }

      if (onLog && this.standbyPool.length > 0) {
        onLog(`🛡️ [Proxy Standby] Đã chuẩn bị sẵn ${this.standbyPool.length} proxy dự phòng trong bộ nhớ RAM`, 'info');
      }
    } finally {
      this.isReplenishing = false;
    }
  }

  /**
   * Finds fastest working proxy for session initialization
   */
  public async findWorkingProxy(onLog?: (msg: string, level: LogLevel) => void): Promise<ProxyTestResult | null> {
    // 1. If we have verified proxies ready in standby pool, take the top one immediately (0ms)!
    if (this.standbyPool.length > 0) {
      const top = this.standbyPool.shift()!;
      this.activeProxy = top;
      if (onLog) {
        onLog(
          `⚡ [Proxy Ready] Sử dụng ngay proxy dự phòng: ${top.proxyUrl} (Độ trễ: ${top.latency}ms | Còn ${this.standbyPool.length} proxy chờ sẵn)`,
          'success',
        );
      }
      // Replenish standby pool in background
      this.fillStandbyPool(4).catch(() => {});
      return top;
    }

    if (onLog) {
      onLog(`🔎 [Proxy Check] Đang kiểm tra song song các proxy tốc độ cao tới Discord API...`, 'info');
    }

    // 2. Ensure elite list is loaded
    await this.scrapeElite(onLog);

    const availableElite = this.eliteProxies.filter((p) => !this.failedProxies.has(p));
    const allPool = [
      ...availableElite,
      ...this.secondaryProxies.filter((p) => !this.failedProxies.has(p)),
    ];

    if (!allPool.length) {
      if (onLog) {
        onLog(`⚠️ [Proxy] Không có proxy khả dụng, tự động chuyển về kết nối trực tiếp (Direct)...`, 'warn');
      }
      return null;
    }

    // 3. Race in multi-batches of 40 in parallel
    const batchSizes = [40, 40, 40];
    let offset = 0;

    for (let bIndex = 0; bIndex < batchSizes.length; bIndex++) {
      const count = batchSizes[bIndex];
      const batch = allPool.slice(offset, offset + count);
      offset += count;
      if (!batch.length) break;

      const winner = await this.raceCandidates(batch, 2200);
      if (winner) {
        this.activeProxy = winner;
        if (onLog) {
          onLog(
            `🚀 [Proxy Sống] Kết nối thành công qua Proxy: ${winner.proxyUrl} (Độ trễ: ${winner.latency}ms)`,
            'success',
          );
        }
        // Trigger background replenishment to fill standby pool
        this.fillStandbyPool(4).catch(() => {});
        this.scrapeSecondaryInBackground();
        return winner;
      }
    }

    // 4. Fallback if no proxy responded
    if (onLog) {
      onLog(
        `⚠️ [Proxy Timeout] Các proxy công cộng đang phản hồi chậm, tự động kết nối trực tiếp (Direct IP) để bắt đầu ngay!`,
        'warn',
      );
    }
    return null;
  }

  /**
   * Auto-failover: Rotates to the next verified proxy from standby pool when an error occurs.
   * If all standby proxies are dead or empty, automatically re-scrapes fresh list from GitHub!
   */
  public async rotateProxy(
    reason?: string,
    onLog?: (msg: string, level: LogLevel) => void,
  ): Promise<ProxyTestResult | null> {
    if (this.activeProxy) {
      this.failedProxies.add(this.activeProxy.proxyUrl);
    }

    const friendlyReason = reason || 'Connect Timeout / Network Error';

    // 1. Try to pop a ready proxy from the standby pool
    while (this.standbyPool.length > 0) {
      const candidate = this.standbyPool.shift()!;
      // Fast sanity check: make sure it wasn't marked failed
      if (this.failedProxies.has(candidate.proxyUrl)) continue;

      this.activeProxy = candidate;
      if (onLog) {
        onLog(
          `🔄 [Proxy Failover] Phát hiện sự cố mạng (${friendlyReason}), tự động chuyển sang Proxy dự phòng: ${candidate.proxyUrl} (Độ trễ: ${candidate.latency}ms | Còn ${this.standbyPool.length} proxy dự phòng)`,
          'warn',
        );
      }

      // Trigger background replenishment so standby pool remains stocked
      this.fillStandbyPool(4).catch(() => {});
      return candidate;
    }

    // 2. All pre-tested standby proxies are exhausted or died! Re-scrape fresh lists from GitHub!
    if (onLog) {
      onLog(
        `🔄 [Proxy Quét Lại] Toàn bộ proxy dự phòng đã hết hoặc mất kết nối, đang tự động cào danh sách mới từ GitHub...`,
        'warn',
      );
    }

    // Reset failedProxies if too many have accumulated (>1500)
    if (this.failedProxies.size > 1500) {
      this.failedProxies.clear();
    }

    // Invalidate old scrape cache to force fresh pull
    this.lastEliteScraped = 0;
    await this.scrapeElite(onLog, true);

    const freshCandidates = [
      ...this.eliteProxies.filter((p) => !this.failedProxies.has(p)),
      ...this.secondaryProxies.filter((p) => !this.failedProxies.has(p)),
    ];

    if (freshCandidates.length > 0) {
      // Test first 45 fresh candidates
      let winner = await this.raceCandidates(freshCandidates.slice(0, 45), 2200);
      if (!winner && freshCandidates.length > 45) {
        winner = await this.raceCandidates(freshCandidates.slice(45, 90), 2200);
      }

      if (winner) {
        this.activeProxy = winner;
        if (onLog) {
          onLog(
            `🚀 [Proxy Mới] Đã tìm thấy proxy sống mới từ GitHub: ${winner.proxyUrl} (Độ trễ: ${winner.latency}ms)`,
            'success',
          );
        }
        this.fillStandbyPool(4).catch(() => {});
        return winner;
      }
    }

    // 3. Last resort fallback to Direct IP
    if (onLog) {
      onLog(
        `⚠️ [Proxy Direct] Đã quét các danh sách mới nhưng không có proxy nào phản hồi, tự động chuyển sang kết nối trực tiếp (Direct IP)!`,
        'warn',
      );
    }
    this.activeProxy = null;
    return null;
  }

  public markFailed(proxyUrl: string) {
    this.failedProxies.add(proxyUrl);
    if (this.activeProxy?.proxyUrl === proxyUrl) {
      this.activeProxy = null;
    }
    this.standbyPool = this.standbyPool.filter((p) => p.proxyUrl !== proxyUrl);
  }
}
