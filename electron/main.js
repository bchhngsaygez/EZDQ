'use strict';

const {
	app,
	BrowserWindow,
	ipcMain,
	dialog,
	shell,
	Menu,
	safeStorage,
	clipboard,
} = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { spawn } = require('node:child_process');

const EVENT_MARKER = '\u0001AQEVENT\u0001';
const MAX_LOG_BUFFER = 2 * 1024 * 1024;

let mainWindow = null;
let child = null;
let childState = 'idle';
let logBuffer = '';

const configPath = () => path.join(app.getPath('userData'), 'config.json');

function readConfig() {
	const base = { token: '', webhook: '', remember: true };
	try {
		const raw = fs.readFileSync(configPath(), 'utf8');
		const parsed = JSON.parse(raw);
		let token = '';
		if (parsed.tokenEnc) {
			try {
				const buf = Buffer.from(parsed.tokenEnc, 'base64');
				token = safeStorage.isEncryptionAvailable()
					? safeStorage.decryptString(buf)
					: buf.toString('utf8');
			} catch {
				token = '';
			}
		}
		return {
			token,
			webhook: typeof parsed.webhook === 'string' ? parsed.webhook : '',
			remember: parsed.remember !== false,
		};
	} catch {
		return base;
	}
}

function writeConfig({ token, webhook, remember }) {
	const payload = { webhook: webhook || '', remember: remember !== false };
	if (remember && token) {
		const buf = safeStorage.isEncryptionAvailable()
			? safeStorage.encryptString(token)
			: Buffer.from(token, 'utf8');
		payload.tokenEnc = buf.toString('base64');
	}
	fs.mkdirSync(path.dirname(configPath()), { recursive: true });
	fs.writeFileSync(configPath(), JSON.stringify(payload, null, 2), 'utf8');
}

function send(channel, payload) {
	if (mainWindow && !mainWindow.isDestroyed()) {
		mainWindow.webContents.send(channel, payload);
	}
}

function setState(state, extra = {}) {
	childState = state;
	send('state', { state, ...extra });
}

function pushLog(stream, line) {
	const stamped = `[${new Date().toLocaleTimeString('vi-VN')}] ${line}`;
	logBuffer += `${stamped}\n`;
	if (logBuffer.length > MAX_LOG_BUFFER) {
		logBuffer = logBuffer.slice(-MAX_LOG_BUFFER);
	}
	send('log', { stream, line: stamped });
}

function handleLine(stream, raw) {
	const line = raw.replace(/\u0007/g, '').replace(/\s+$/, '');
	if (!line) return;
	if (line.includes(EVENT_MARKER)) {
		const payload = line.slice(line.indexOf(EVENT_MARKER) + EVENT_MARKER.length);
		try {
			const parsed = JSON.parse(payload);
			if (parsed.type === 'login') {
				setState('running', { username: parsed.data.username });
			}
			if (parsed.type === 'fatal') {
				setState('error', { message: parsed.data.message });
			}
			send('event', parsed);
			return;
		} catch {
			/* fall through to raw log */
		}
	}
	pushLog(stream, line);
}

function attachPipe(pipe, stream) {
	let buffer = '';
	pipe.setEncoding('utf8');
	pipe.on('data', (chunk) => {
		buffer += chunk;
		let idx;
		while ((idx = buffer.indexOf('\n')) !== -1) {
			handleLine(stream, buffer.slice(0, idx));
			buffer = buffer.slice(idx + 1);
		}
	});
	pipe.on('end', () => {
		if (buffer.trim()) handleLine(stream, buffer);
		buffer = '';
	});
}

function stopChild(silent = false) {
	if (!child) return;
	const proc = child;
	child = null;
	if (process.platform === 'win32') {
		spawn('taskkill', ['/pid', String(proc.pid), '/T', '/F'], {
			windowsHide: true,
		});
	} else {
		proc.kill('SIGKILL');
	}
	if (!silent) setState('stopping');
}

function startChild(config) {
	if (child) return { ok: false, message: 'Tiến trình đang chạy.' };
	const entry = path.join(__dirname, 'bot', 'bot.js');
	if (!fs.existsSync(entry)) {
		return {
			ok: false,
			message: 'Không tìm thấy mã lõi. Hãy chạy: npm run build:bot',
		};
	}
	const token = (config.token || '').trim();
	if (!token) {
		return { ok: false, message: 'Bạn chưa nhập token Discord.' };
	}
	if (token.split('.').length < 3) {
		return {
			ok: false,
			message: 'Token không hợp lệ. Token phải có dạng xxx.yyy.zzz.',
		};
	}

	logBuffer = '';
	pushLog('system', '=== Bắt đầu phiên làm nhiệm vụ mới ===');
	setState('starting');

	const env = {
		...process.env,
		ELECTRON_RUN_AS_NODE: '1',
		ELECTRON_NO_ATTACH_CONSOLE: '1',
		TOKEN: token,
	};
	if (config.webhook && config.webhook.trim()) {
		env.WEBHOOK_URL = config.webhook.trim();
	} else {
		delete env.WEBHOOK_URL;
	}

	try {
		child = spawn(process.execPath, [entry], {
			env,
			windowsHide: true,
			stdio: ['ignore', 'pipe', 'pipe'],
		});
	} catch (err) {
		child = null;
		setState('error', { message: err.message });
		return { ok: false, message: `Không khởi động được: ${err.message}` };
	}

	attachPipe(child.stdout, 'stdout');
	attachPipe(child.stderr, 'stderr');

	child.on('error', (err) => {
		pushLog('stderr', `Lỗi tiến trình: ${err.message}`);
	});

	child.on('exit', (code, signal) => {
		child = null;
		if (childState === 'stopping') {
			pushLog('system', 'Đã dừng thủ công.');
			setState('idle');
			return;
		}
		pushLog(
			'system',
			`Tiến trình kết thúc (mã ${code ?? 'null'}${
				signal ? `, tín hiệu ${signal}` : ''
			}).`,
		);
		setState(code === 0 ? 'idle' : 'error', {
			message: code === 0 ? undefined : `Tiến trình thoát với mã ${code}.`,
		});
	});

	return { ok: true };
}

function createWindow() {
	mainWindow = new BrowserWindow({
		width: 1040,
		height: 760,
		minWidth: 480,
		minHeight: 480,
		show: false,
		backgroundColor: '#0b0d13',
		autoHideMenuBar: true,
		title: 'AutoQuest',
		icon: app.isPackaged
			? path.join(process.resourcesPath, 'icon.ico')
			: path.join(__dirname, '..', 'resources', 'icon.ico'),
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
			contextIsolation: true,
			nodeIntegration: false,
			sandbox: true,
			spellcheck: false,
		},
	});

	Menu.setApplicationMenu(null);
	mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

	mainWindow.once('ready-to-show', () => mainWindow.show());
	mainWindow.on('closed', () => {
		mainWindow = null;
	});

	mainWindow.webContents.setWindowOpenHandler(({ url }) => {
		if (/^https?:\/\//i.test(url)) shell.openExternal(url);
		return { action: 'deny' };
	});
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
	app.quit();
} else {
	app.on('second-instance', () => {
		if (mainWindow) {
			if (mainWindow.isMinimized()) mainWindow.restore();
			mainWindow.focus();
		}
	});

	app.whenReady().then(() => {
		createWindow();
		app.on('activate', () => {
			if (BrowserWindow.getAllWindows().length === 0) createWindow();
		});
	});

	app.on('window-all-closed', () => app.quit());
	app.on('before-quit', () => stopChild(true));
}

ipcMain.handle('config:get', () => {
	const cfg = readConfig();
	return { ...cfg, state: childState, version: app.getVersion(), electron: process.versions.electron };
});

ipcMain.handle('config:save', (_e, config) => {
	try {
		writeConfig({
			token: config.token,
			webhook: config.webhook,
			remember: config.remember,
		});
		return { ok: true };
	} catch (err) {
		return { ok: false, message: err.message };
	}
});

ipcMain.handle('bot:start', (_e, config) => startChild(config || {}));
ipcMain.handle('bot:stop', () => {
	stopChild();
	return { ok: true };
});
ipcMain.handle('bot:state', () => ({ state: childState }));

ipcMain.handle('clipboard:read', () => clipboard.readText());
ipcMain.handle('clipboard:write', (_e, text) => {
	clipboard.writeText(String(text || ''));
	return { ok: true };
});
ipcMain.handle('shell:open', (_e, url) => {
	if (/^https?:\/\//i.test(String(url))) shell.openExternal(url);
	return { ok: true };
});
ipcMain.handle('shell:open-data-folder', () => {
	shell.openPath(app.getPath('userData'));
	return { ok: true };
});
ipcMain.handle('log:save', async (_e, content) => {
	const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
	const result = await dialog.showSaveDialog(mainWindow, {
		title: 'Lưu nhật ký',
		defaultPath: path.join(app.getPath('desktop'), `autoquest-${stamp}.log`),
		filters: [{ name: 'Nhật ký', extensions: ['log', 'txt'] }],
	});
	if (result.canceled || !result.filePath) return { ok: false };
	fs.writeFileSync(result.filePath, content || logBuffer, 'utf8');
	return { ok: true, filePath: result.filePath };
});
