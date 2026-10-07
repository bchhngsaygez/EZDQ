import express from 'express';
import cors from 'cors';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { WebSocketServer, WebSocket } from 'ws';
import { SessionManager } from './sessionManager';
import { ClientMessage } from './types';
import { ProxyAgent, setGlobalDispatcher } from 'undici';

// Support HTTP/HTTPS/SOCKS proxy for bypassing Cloudflare/Render datacenter rate limits
const proxyUrl = process.env.PROXY_URL || process.env.HTTP_PROXY || process.env.HTTPS_PROXY;
if (proxyUrl) {
  try {
    const proxyAgent = new ProxyAgent(proxyUrl);
    setGlobalDispatcher(proxyAgent);
    const sanitized = proxyUrl.replace(/:[^:]*@/, ':***@');
    console.log(`[Proxy] Outgoing HTTP requests routed via proxy: ${sanitized}`);
  } catch (err: any) {
    console.error(`[Proxy Error] Could not initialize ProxyAgent: ${err?.message}`);
  }
}

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

app.use(cors());
app.use(express.json());

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

const sessionManager = SessionManager.getInstance();

// Health check endpoint for VPS/Host/Docker
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    app: 'AutoQuest Web',
    version: '2.0.0',
    time: new Date().toISOString(),
    ramSessionOnly: true,
  });
});

// Serve frontend static files if built
const publicDir = path.resolve(__dirname, '../../dist/public');
const localDistPublic = path.resolve(__dirname, '../public');

let staticPath = '';
if (fs.existsSync(publicDir)) {
  staticPath = publicDir;
} else if (fs.existsSync(localDistPublic)) {
  staticPath = localDistPublic;
}

if (staticPath) {
  app.use(express.static(staticPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/ws')) {
      return next();
    }
    res.sendFile(path.join(staticPath, 'index.html'));
  });
} else {
  app.get('/', (_req, res) => {
    res.send(`
      <div style="font-family: sans-serif; text-align: center; padding: 40px; background: #0b0d13; color: #fff; min-height: 100vh;">
        <h1>AutoQuest Web Server</h1>
        <p>Máy chủ backend đang hoạt động trên cổng ${PORT}.</p>
        <p>Vui lòng chạy <code>npm run dev:client</code> trong môi trường dev hoặc <code>npm run build</code> để tạo giao diện người dùng.</p>
      </div>
    `);
  });
}

// WebSocket Connection Handler
wss.on('connection', (ws: WebSocket, req) => {
  const socketId = Math.random().toString(36).substring(2, 12);

  ws.on('message', async (raw) => {
    try {
      const msg: ClientMessage = JSON.parse(raw.toString());

      if (msg.type === 'START') {
        const token = (msg.token || '').trim();
        if (!token) {
          ws.send(JSON.stringify({
            type: 'error',
            data: { message: 'Bạn chưa nhập token Discord.' },
          }));
          return;
        }

        if (token.split('.').length < 3) {
          ws.send(JSON.stringify({
            type: 'error',
            data: { message: 'Token không hợp lệ. Phải có định dạng 3 phần: xxx.yyy.zzz' },
          }));
          return;
        }

        const session = sessionManager.createSession(
          socketId,
          token,
          ws,
          msg.setStatus !== false,
          msg.parallel !== false,
          msg.captcha,
        );
        await session.start();
      } else if (msg.type === 'STOP') {
        const session = sessionManager.getSession(socketId);
        if (session) {
          await session.stop();
        }
      } else if (msg.type === 'CLAIM') {
        const session = sessionManager.getSession(socketId);
        if (session && msg.questId) {
          await session.claimQuest(msg.questId);
        }
      }
    } catch (err: any) {
      ws.send(JSON.stringify({
        type: 'error',
        data: { message: `Lỗi xử lý yêu cầu: ${err?.message}` },
      }));
    }
  });

  // Ephemeral security: When browser tab closes, reloads, or disconnects,
  // immediately destroy the session, stop Discord client, and wipe token from RAM!
  ws.on('close', () => {
    sessionManager.destroySession(socketId);
  });

  ws.on('error', () => {
    sessionManager.destroySession(socketId);
  });
});

// Graceful shutdown
const shutdown = () => {
  console.log('Shutting down server, purging all active RAM sessions...');
  sessionManager.destroyAll();
  server.close(() => {
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Cổng ${PORT} hiện đang bị chiếm dụng bởi một tiến trình khác!`);
    console.error(`💡 Cách khắc phục nhanh:`);
    console.error(`   1. Giải phóng cổng 3000 bằng PowerShell:`);
    console.error(`      Get-Process -Id (Get-NetTCPConnection -LocalPort ${PORT}).OwningProcess | Stop-Process -Force`);
    console.error(`   2. Hoặc chạy trên cổng khác:`);
    console.error(`      $env:PORT=3001; npm start\n`);
    process.exit(1);
  } else {
    console.error('Lỗi máy chủ:', err);
  }
});

server.listen(PORT, HOST, () => {
  console.log(`\n======================================================`);
  console.log(`🌟 AutoQuest Web đã sẵn sàng!`);
  console.log(`🚀 Chạy tại: http://localhost:${PORT}`);
  console.log(`🔒 Bảo mật: Phiên chạy trong RAM, tự xoá khi đóng/tải lại`);
  console.log(`======================================================\n`);
});
