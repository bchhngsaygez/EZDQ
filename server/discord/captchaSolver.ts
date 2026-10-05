import { fetch } from 'undici';

export interface CaptchaConfig {
  provider: 'capsolver' | '2captcha' | 'anticaptcha';
  apiKey: string;
}

export interface CaptchaChallenge {
  sitekey: string;
  rqdata?: string;
  rqtoken?: string;
  service?: string;
}

export class CaptchaSolver {
  /**
   * Solve hCaptcha for Discord Quests
   */
  public static async solve(
    config: CaptchaConfig,
    challenge: CaptchaChallenge,
    onLog?: (msg: string) => void,
  ): Promise<string | null> {
    const key = (config.apiKey || '').trim();
    if (!key) return null;

    const log = (msg: string) => {
      if (onLog) onLog(msg);
    };

    try {
      switch (config.provider) {
        case 'capsolver':
          return await CaptchaSolver.solveWithCapSolver(key, challenge, log);
        case '2captcha':
          return await CaptchaSolver.solveWith2Captcha(key, challenge, log);
        case 'anticaptcha':
          return await CaptchaSolver.solveWithAntiCaptcha(key, challenge, log);
        default:
          return null;
      }
    } catch (err: any) {
      log(`Lỗi khi giải CAPTCHA (${config.provider}): ${err?.message || String(err)}`);
      return null;
    }
  }

  // --- CapSolver API ---
  private static async solveWithCapSolver(
    apiKey: string,
    challenge: CaptchaChallenge,
    log: (msg: string) => void,
  ): Promise<string | null> {
    log('Đang gửi yêu cầu giải hCaptcha tới CapSolver...');

    const taskPayload: Record<string, any> = {
      type: 'HCaptchaTurboTask',
      websiteURL: 'https://discord.com',
      websiteKey: challenge.sitekey,
    };

    if (challenge.rqdata) {
      taskPayload.enterprisePayload = { rqdata: challenge.rqdata };
    }

    const createRes = (await fetch('https://api.capsolver.com/createTask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientKey: apiKey,
        task: taskPayload,
      }),
    }).then((r) => r.json())) as any;

    if (createRes.errorId !== 0 && createRes.errorCode) {
      throw new Error(`CapSolver error: ${createRes.errorDescription || createRes.errorCode}`);
    }

    const taskId = createRes.taskId;
    if (!taskId) {
      if (createRes.solution?.gRecaptchaResponse) {
        return createRes.solution.gRecaptchaResponse;
      }
      throw new Error('Không nhận được taskId từ CapSolver.');
    }

    // Poll for solution (up to 45s)
    log(`Đang đợi kết quả từ CapSolver (Task: ${taskId})...`);
    for (let i = 0; i < 25; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const resultRes = (await fetch('https://api.capsolver.com/getTaskResult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientKey: apiKey,
          taskId,
        }),
      }).then((r) => r.json())) as any;

      if (resultRes.status === 'ready') {
        const token = resultRes.solution?.gRecaptchaResponse || resultRes.solution?.token;
        if (token) {
          log('CapSolver đã giải xong CAPTCHA thành công!');
          return token;
        }
      } else if (resultRes.status === 'failed') {
        throw new Error(resultRes.errorDescription || 'CapSolver giải thất bại.');
      }
    }

    throw new Error('Hết thời gian chờ phản hồi giải CAPTCHA từ CapSolver.');
  }

  // --- 2Captcha API ---
  private static async solveWith2Captcha(
    apiKey: string,
    challenge: CaptchaChallenge,
    log: (msg: string) => void,
  ): Promise<string | null> {
    log('Đang gửi yêu cầu giải hCaptcha tới 2Captcha...');

    const taskPayload: Record<string, any> = {
      type: 'HCaptchaTaskProxyless',
      websiteURL: 'https://discord.com',
      websiteKey: challenge.sitekey,
    };

    if (challenge.rqdata) {
      taskPayload.data = challenge.rqdata;
    }

    const createRes = (await fetch('https://api.2captcha.com/createTask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientKey: apiKey,
        task: taskPayload,
      }),
    }).then((r) => r.json())) as any;

    if (createRes.errorId !== 0 && createRes.errorDescription) {
      throw new Error(`2Captcha error: ${createRes.errorDescription}`);
    }

    const taskId = createRes.taskId;
    if (!taskId) {
      throw new Error('Không nhận được taskId từ 2Captcha.');
    }

    log(`Đang đợi kết quả từ 2Captcha (Task: ${taskId})...`);
    for (let i = 0; i < 25; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      const resultRes = (await fetch('https://api.2captcha.com/getTaskResult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientKey: apiKey,
          taskId,
        }),
      }).then((r) => r.json())) as any;

      if (resultRes.status === 'ready') {
        const token = resultRes.solution?.gRecaptchaResponse || resultRes.solution?.token;
        if (token) {
          log('2Captcha đã giải xong CAPTCHA thành công!');
          return token;
        }
      } else if (resultRes.errorId && resultRes.errorId !== 0) {
        throw new Error(resultRes.errorDescription || '2Captcha giải thất bại.');
      }
    }

    throw new Error('Hết thời gian chờ từ 2Captcha.');
  }

  // --- AntiCaptcha API ---
  private static async solveWithAntiCaptcha(
    apiKey: string,
    challenge: CaptchaChallenge,
    log: (msg: string) => void,
  ): Promise<string | null> {
    log('Đang gửi yêu cầu giải hCaptcha tới Anti-Captcha...');

    const taskPayload: Record<string, any> = {
      type: 'HCaptchaTaskProxyless',
      websiteURL: 'https://discord.com',
      websiteKey: challenge.sitekey,
    };

    if (challenge.rqdata) {
      taskPayload.enterprisePayload = { rqdata: challenge.rqdata };
    }

    const createRes = (await fetch('https://api.anti-captcha.com/createTask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientKey: apiKey,
        task: taskPayload,
      }),
    }).then((r) => r.json())) as any;

    if (createRes.errorId !== 0) {
      throw new Error(`AntiCaptcha error: ${createRes.errorDescription}`);
    }

    const taskId = createRes.taskId;
    log(`Đang đợi kết quả từ Anti-Captcha (Task: ${taskId})...`);
    for (let i = 0; i < 25; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      const resultRes = (await fetch('https://api.anti-captcha.com/getTaskResult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientKey: apiKey,
          taskId,
        }),
      }).then((r) => r.json())) as any;

      if (resultRes.status === 'ready') {
        const token = resultRes.solution?.gRecaptchaResponse;
        if (token) {
          log('Anti-Captcha đã giải xong CAPTCHA thành công!');
          return token;
        }
      } else if (resultRes.errorId && resultRes.errorId !== 0) {
        throw new Error(resultRes.errorDescription || 'AntiCaptcha giải thất bại.');
      }
    }

    throw new Error('Hết thời gian chờ từ Anti-Captcha.');
  }
}
