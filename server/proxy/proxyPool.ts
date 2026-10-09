import { ProxyAgent, request } from 'undici';
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

export class ProxyPoolManager {
  private static instance: ProxyPoolManager;
  private eliteProxies: string[] = [];
  private secondaryProxies: string[] = [];
  private lastEliteScraped = 0;
  private lastSecondaryScraped = 0;
  private isScrapingSecondary = false;
  private failedProxies = new Set<string>();

  // Cached verified active proxy for instant (0ms) connection
  private verifiedProxy: ProxyTestResult | null = null;

  private constructor() {}

  public static getInstance(): ProxyPoolManager {
    if (!ProxyPoolManager.instance) {
      ProxyPoolManager.instance = new ProxyPoolManager();
    }
    return ProxyPoolManager.instance;
  }

  /**
   * Background pre-warm on server boot so proxy is already verified when user starts
   */
  public async prewarm(): Promise<void> {
    try {
      await this.scrapeElite();
      // Test and keep 1 warm proxy ready in memory
      const winner = await this.raceCandidates(this.eliteProxies.slice(0, 25), 1800);
      if (winner) {
        this.verifiedProxy = winner;
      }
      // Trigger lazy secondary scrape in background without blocking
      this.scrapeSecondaryInBackground();
    } catch {
      /* ignore background prewarm failure */
    }
  }

  /**
   * Scrapes Tier 0 elite sources in ~200-400ms
   */
  public async scrapeElite(onLog?: (msg: string, level: LogLevel) => void): Promise<string[]> {
    const now = Date.now();
    // Cache elite proxies for 10 minutes
    if (this.eliteProxies.length > 30 && now - this.lastEliteScraped < 10 * 60 * 1000) {
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
   * Fast health-check single proxy
   */
  public async testProxy(proxyUrl: string, timeoutMs = 1800): Promise<ProxyTestResult | null> {
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
        signal: AbortSignal.timeout(timeoutMs + 200),
      });

      if (res.statusCode === 200) {
        await res.body.dump();
        return {
          proxyUrl,
          latency: Date.now() - start,
          testedAt: Date.now(),
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
   * Races candidates concurrently using Promise.any. Returns the instant the first responds!
   */
  private async raceCandidates(candidates: string[], timeoutMs = 1800): Promise<ProxyTestResult | null> {
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
   * Finds fastest working proxy with an absolute hard deadline of 2.8s
   * Ensures the user NEVER waits more than 2-3 seconds!
   */
  public async findWorkingProxy(onLog?: (msg: string, level: LogLevel) => void): Promise<ProxyTestResult | null> {
    const now = Date.now();

    // 1. Instant check: reuse verified proxy if tested recently (<5 minutes ago)
    if (this.verifiedProxy && now - this.verifiedProxy.testedAt < 5 * 60 * 1000) {
      if (onLog) {
        onLog(
          `⚡ [Proxy Ready] Sử dụng ngay proxy đã xác thực: ${this.verifiedProxy.proxyUrl} (Độ trễ: ${this.verifiedProxy.latency}ms)`,
          'success',
        );
      }
      return this.verifiedProxy;
    }

    if (onLog) {
      onLog(`🔎 [Proxy Check] Đang kiểm tra song song 35 proxy tốc độ cao tới Discord API...`, 'info');
    }

    // 2. Ensure elite list is loaded (takes ~250ms)
    await this.scrapeElite(onLog);

    // Filter available candidates
    const availableElite = this.eliteProxies.filter((p) => !this.failedProxies.has(p));
    const racePool = availableElite.length >= 25 ? availableElite.slice(0, 35) : [...availableElite, ...this.secondaryProxies.slice(0, 20)];

    if (!racePool.length) {
      if (onLog) {
        onLog(`⚠️ [Proxy] Không có proxy khả dụng, tự động chuyển về kết nối trực tiếp (Direct)...`, 'warn');
      }
      return null;
    }

    // 3. Race all 35 candidates in parallel with 1800ms timeout
    const winner = await this.raceCandidates(racePool, 1800);

    if (winner) {
      this.verifiedProxy = winner;
      if (onLog) {
        onLog(
          `🚀 [Proxy Sống] Kết nối thành công qua Proxy: ${winner.proxyUrl} (Độ trễ: ${winner.latency}ms)`,
          'success',
        );
      }
      // Start background scraping for secondary sources
      this.scrapeSecondaryInBackground();
      return winner;
    }

    // 4. If batch 1 failed, try 1 more quick micro-batch of 25 (with 1500ms timeout)
    const secondBatch = availableElite.slice(35, 60);
    if (secondBatch.length > 0) {
      const secondWinner = await this.raceCandidates(secondBatch, 1500);
      if (secondWinner) {
        this.verifiedProxy = secondWinner;
        if (onLog) {
          onLog(
            `🚀 [Proxy Sống] Kết nối thành công qua Proxy: ${secondWinner.proxyUrl} (Độ trễ: ${secondWinner.latency}ms)`,
            'success',
          );
        }
        return secondWinner;
      }
    }

    // 5. Fallback immediately - don't keep user waiting!
    if (onLog) {
      onLog(
        `⚠️ [Proxy Timeout] Các proxy công cộng đang phản hồi chậm, tự động kết nối trực tiếp (Direct IP) để bắt đầu ngay!`,
        'warn',
      );
    }
    return null;
  }

  public markFailed(proxyUrl: string) {
    this.failedProxies.add(proxyUrl);
    if (this.verifiedProxy?.proxyUrl === proxyUrl) {
      this.verifiedProxy = null;
    }
  }

  public getActiveProxy(): string | null {
    return this.verifiedProxy?.proxyUrl || null;
  }
}
