import { ProxyAgent, request } from 'undici';
import { LogLevel } from '../types';

/**
 * High-priority, frequently verified GitHub proxy sources (updated every 15-30 min)
 */
export const HIGH_PRIORITY_SOURCES = [
  'https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/http.txt',
  'https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/all.txt',
  'https://raw.githubusercontent.com/prxchk/proxy-list/main/http.txt',
  'https://raw.githubusercontent.com/sunny9577/proxy-scraper/master/generated/http_proxies.txt',
  'https://raw.githubusercontent.com/roosterkid/openproxylist/main/HTTPS_RAW.txt',
  'https://raw.githubusercontent.com/proxifly/free-proxy-list/main/proxies/protocols/http/data.txt',
  'https://raw.githubusercontent.com/proxifly/free-proxy-list/main/proxies/all/data.txt',
];

/**
 * Secondary massive GitHub proxy repositories (200k+ total proxies for deep fallback)
 */
export const SECONDARY_SOURCES = [
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

export const ALL_PROXY_SOURCES = [...HIGH_PRIORITY_SOURCES, ...SECONDARY_SOURCES];

export interface ProxyTestResult {
  proxyUrl: string;
  latency: number;
}

export class ProxyPoolManager {
  private static instance: ProxyPoolManager;
  private cachedProxies: string[] = [];
  private lastScraped = 0;
  private readonly cacheTTL = 15 * 60 * 1000; // 15 minutes TTL in RAM
  private failedProxies = new Set<string>();
  private activeProxyUrl: string | null = null;

  private constructor() {}

  public static getInstance(): ProxyPoolManager {
    if (!ProxyPoolManager.instance) {
      ProxyPoolManager.instance = new ProxyPoolManager();
    }
    return ProxyPoolManager.instance;
  }

  /**
   * Scrapes proxies from 30+ GitHub raw lists in parallel, prioritizing verified fresh sources
   */
  public async scrapeGitHub(onLog?: (msg: string, level: LogLevel) => void): Promise<string[]> {
    const now = Date.now();
    if (this.cachedProxies.length > 100 && now - this.lastScraped < this.cacheTTL) {
      if (onLog) {
        onLog(
          `⚡ [Proxy Cache] Tái sử dụng ${this.cachedProxies.length.toLocaleString('vi-VN')} proxy từ bộ nhớ RAM`,
          'info',
        );
      }
      return this.cachedProxies;
    }

    if (onLog) {
      onLog(
        `🌐 [Proxy Scraper] Đang quét proxy từ ${ALL_PROXY_SOURCES.length} kho lưu trữ GitHub công khai...`,
        'info',
      );
    }

    const ipPortRegex = /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?):([1-9][0-9]{0,4})\b/g;

    const parseFromText = (text: string, set: Set<string>) => {
      let match: RegExpExecArray | null;
      const localRegex = new RegExp(ipPortRegex.source, 'g');
      while ((match = localRegex.exec(text)) !== null) {
        const entry = match[0];
        const port = parseInt(match[1], 10);
        if (port > 0 && port <= 65535) {
          if (!entry.startsWith('10.') && !entry.startsWith('192.168.') && !entry.startsWith('127.')) {
            set.add(`http://${entry}`);
          }
        }
      }
    };

    const highPrioritySet = new Set<string>();
    const secondarySet = new Set<string>();
    let successfulSources = 0;

    // Fetch all sources concurrently
    const allFetches = ALL_PROXY_SOURCES.map(async (url) => {
      const isHighPriority = HIGH_PRIORITY_SOURCES.includes(url);
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(4500) });
        if (!res.ok) return;
        const text = await res.text();
        parseFromText(text, isHighPriority ? highPrioritySet : secondarySet);
        successfulSources++;
      } catch {
        /* ignore fetch failure */
      }
    });

    await Promise.allSettled(allFetches);

    // Prioritized list: High-priority (randomized) first, followed by secondary (randomized)
    const highList = Array.from(highPrioritySet).sort(() => Math.random() - 0.5);
    const secondaryList = Array.from(secondarySet).sort(() => Math.random() - 0.5);

    this.cachedProxies = [...highList, ...secondaryList];
    this.lastScraped = now;

    if (onLog) {
      onLog(
        `✅ [Proxy Scraper] Đã thu thập thành công ${this.cachedProxies.length.toLocaleString('vi-VN')} proxy (${highList.length.toLocaleString('vi-VN')} chất lượng cao) từ ${successfulSources}/${ALL_PROXY_SOURCES.length} repo GitHub!`,
        'success',
      );
    }

    return this.cachedProxies;
  }

  /**
   * Health-check a single proxy candidate against Discord API
   */
  public async testProxy(proxyUrl: string, timeoutMs = 2500): Promise<ProxyTestResult | null> {
    const start = Date.now();
    let agent: ProxyAgent | null = null;
    try {
      agent = new ProxyAgent({
        uri: proxyUrl,
        connect: { timeout: timeoutMs },
      });

      const res = await request('https://discord.com/api/v10/gateway', {
        dispatcher: agent,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
        },
        signal: AbortSignal.timeout(timeoutMs + 400),
      });

      // Status 200 confirms gateway reachable & IP is not blocked by Cloudflare/Discord
      if (res.statusCode === 200) {
        await res.body.dump();
        return {
          proxyUrl,
          latency: Date.now() - start,
        };
      }
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
   * Find fastest working proxy from the pool using high-concurrency micro-batches
   */
  public async findWorkingProxy(
    onLog?: (msg: string, level: LogLevel) => void,
    batchSize = 25,
    maxBatches = 5,
  ): Promise<ProxyTestResult | null> {
    const pool = await this.scrapeGitHub(onLog);
    if (!pool.length) return null;

    if (onLog) {
      onLog(`🔎 [Proxy Check] Đang kiểm tra kết nối tới Discord API để tìm proxy tốc độ cao...`, 'info');
    }

    // Filter out previously failed proxies
    const available = pool.filter((p) => !this.failedProxies.has(p));
    let offset = 0;

    for (let batchIdx = 0; batchIdx < maxBatches; batchIdx++) {
      const batch = available.slice(offset, offset + batchSize);
      if (!batch.length) break;
      offset += batchSize;

      try {
        const testPromises = batch.map(async (candidate) => {
          const result = await this.testProxy(candidate, 2200);
          if (result) return result;
          this.failedProxies.add(candidate);
          throw new Error('Unresponsive');
        });

        // Promise.any returns the fastest responding proxy in the batch
        const winner = await Promise.any(testPromises);
        this.activeProxyUrl = winner.proxyUrl;

        if (onLog) {
          onLog(
            `🚀 [Proxy Engine] Kích hoạt Proxy GitHub thành công: ${winner.proxyUrl} (Độ trễ: ${winner.latency}ms)`,
            'success',
          );
        }
        return winner;
      } catch {
        // Entire batch failed, continue to next batch
      }
    }

    if (onLog) {
      onLog(
        `⚠️ [Proxy Warning] Đã thử ${offset} proxy từ GitHub nhưng không có proxy nào phản hồi kịp. Tự động kết nối trực tiếp (Direct)...`,
        'warn',
      );
    }
    return null;
  }

  /**
   * Mark current proxy as dead so next rotation skips it
   */
  public markFailed(proxyUrl: string) {
    this.failedProxies.add(proxyUrl);
    if (this.activeProxyUrl === proxyUrl) {
      this.activeProxyUrl = null;
    }
  }

  public getActiveProxy(): string | null {
    return this.activeProxyUrl;
  }
}
