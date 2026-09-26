'use strict';

const api = window.autoquest;

const el = (id) => document.getElementById(id);

const ui = {
	token: el('token'),
	webhook: el('webhook'),
	remember: el('remember'),
	autoScroll: el('autoScroll'),
	btnStart: el('btnStart'),
	btnStop: el('btnStop'),
	btnSave: el('btnSave'),
	btnPaste: el('btnPaste'),
	btnToggleToken: el('btnToggleToken'),
	btnClearLog: el('btnClearLog'),
	btnSaveLog: el('btnSaveLog'),
	btnOpenFolder: el('btnOpenFolder'),
	status: el('status'),
	statusText: el('statusText'),
	console: el('console'),
	questList: el('questList'),
	emptyState: el('emptyState'),
	questCounter: el('questCounter'),
	toast: el('toast'),
};

const STATE_TEXT = {
	idle: 'Sẵn sàng',
	starting: 'Đang kết nối…',
	running: 'Đang chạy',
	stopping: 'Đang dừng…',
	error: 'Có lỗi',
};

let state = 'idle';
let logText = '';
const quests = new Map();
const questOrder = [];

/* ---------------- helpers ---------------- */

let toastTimer = null;
function toast(message, isError = false) {
	ui.toast.textContent = message;
	ui.toast.classList.toggle('error', isError);
	ui.toast.classList.add('show');
	clearTimeout(toastTimer);
	toastTimer = setTimeout(() => ui.toast.classList.remove('show'), 2600);
}

function setState(next, extra = {}) {
	state = next;
	ui.status.dataset.state = next;
	ui.statusText.textContent = extra.username
		? `Đang chạy · @${extra.username}`
		: STATE_TEXT[next] || next;
	const busy = next === 'starting' || next === 'running' || next === 'stopping';
	ui.btnStart.disabled = busy;
	ui.btnStop.disabled = !busy;
	ui.token.disabled = busy;
	ui.webhook.disabled = busy;
	if (next === 'idle') {
		ui.statusText.textContent = STATE_TEXT.idle;
	}
}

function appendLog(line, stream) {
	logText += `${line}\n`;
	if (logText.length > 2 * 1024 * 1024) logText = logText.slice(-1024 * 1024);
	const div = document.createElement('div');
	div.className = 'log-line';
	const body = line.slice(line.indexOf(']') + 1).trimStart();
	if (stream === 'stderr') {
		div.classList.add('stderr');
	} else if (stream === 'system') {
		div.classList.add('system');
	} else if (/hoàn thành nhiệm vụ|Đã đăng nhập/i.test(body)) {
		div.classList.add('ok');
	} else if (/lỗi|không thể|failed/i.test(body)) {
		div.classList.add('warn');
	}
	div.textContent = line;
	ui.console.appendChild(div);
	while (ui.console.childElementCount > 1200) {
		ui.console.removeChild(ui.console.firstChild);
	}
	if (ui.autoScroll.checked) ui.console.scrollTop = ui.console.scrollHeight;
}

/* ---------------- quests ---------------- */

const TASK_LABEL = {
	WATCH_VIDEO: 'Xem video',
	WATCH_VIDEO_ON_MOBILE: 'Xem video (mobile)',
	PLAY_ON_DESKTOP: 'Chơi trên PC',
	PLAY_ON_XBOX: 'Chơi trên Xbox',
	PLAY_ON_PLAYSTATION: 'Chơi trên PlayStation',
	PLAY_ACTIVITY: 'Hoạt động trong game',
	ACHIEVEMENT_IN_ACTIVITY: 'Thành tựu trong game',
};

const STATUS_LABEL = {
	running: 'Đang chạy',
	done: 'Xong',
	error: 'Lỗi',
	skip: 'Bỏ qua',
};

function updateCounter() {
	const done = questOrder.filter(
		(name) => quests.get(name)?.status === 'done',
	).length;
	ui.questCounter.textContent = `${done} / ${questOrder.length}`;
}

function renderQuests() {
	ui.questList.querySelectorAll('.quest').forEach((n) => n.remove());
	if (questOrder.length === 0) {
		ui.questList.appendChild(ui.emptyState);
		ui.emptyState.style.display = '';
		updateCounter();
		return;
	}
	ui.emptyState.style.display = 'none';
	for (const name of questOrder) {
		const q = quests.get(name);
		const need = q.secondsNeeded || 0;
		const done = q.secondsDone || 0;
		const pct = q.secondsNeeded
			? Math.min(100, Math.round((done / need) * 100))
			: q.status === 'done'
				? 100
				: 0;
		const node = document.createElement('div');
		node.className = 'quest';
		node.dataset.status = q.status;
		const taskLabel = TASK_LABEL[q.task] || q.task || 'Nhiệm vụ';
		const badge = q.status === 'running' ? STATUS_LABEL.running : STATUS_LABEL[q.status] || '';
		node.innerHTML = `
			<div class="quest-top">
				<span class="quest-name"></span>
				<span class="quest-badge">${badge}</span>
			</div>
			<div class="bar"><i style="width:${pct}%"></i></div>
			<div class="quest-meta">
				<span class="q-task">${taskLabel}${
					q.application ? ` · ${q.application}` : ''
				}</span>
				<span class="q-pct">${
					need ? `${Math.floor(done / 60)}/${Math.ceil(need / 60)} phút` : `${pct}%`
				}</span>
			</div>
		`;
		node.querySelector('.quest-name').textContent = name;
		ui.questList.appendChild(node);
	}
	updateCounter();
}

function upsertQuest(name, patch) {
	if (!name) return;
	if (!quests.has(name)) {
		questOrder.push(name);
		quests.set(name, { status: 'running', secondsDone: 0, secondsNeeded: 0 });
	}
	Object.assign(quests.get(name), patch);
	renderQuests();
}

function handleEvent(evt) {
	const d = evt.data || {};
	switch (evt.type) {
		case 'login':
			setState('running', { username: d.username });
			appendLog(`[system] Đã đăng nhập thành công: @${d.username}`, 'system');
			break;
		case 'quests':
			if (!d.total) appendLog('[system] Không có nhiệm vụ nào đang mở.', 'system');
			break;
		case 'quest:start':
			upsertQuest(d.name, {
				status: 'running',
				task: d.task,
				application: d.application,
				secondsNeeded: d.secondsNeeded,
				secondsDone: d.secondsDone,
			});
			break;
		case 'quest:progress':
			upsertQuest(d.name, {
				secondsDone: d.secondsDone,
				secondsNeeded: d.secondsNeeded,
			});
			break;
		case 'quest:done': {
			const q = quests.get(d.name) || { secondsNeeded: 0 };
			upsertQuest(d.name, {
				status: 'done',
				secondsDone: q.secondsNeeded || q.secondsDone,
			});
			break;
		}
		case 'quest:skip':
			upsertQuest(d.name, { status: 'skip' });
			break;
		case 'quest:error':
			upsertQuest(d.name, { status: 'error' });
			break;
		case 'finish':
			appendLog('[system] Hoàn tất toàn bộ nhiệm vụ.', 'system');
			break;
		case 'fatal':
			appendLog(`[system] Lỗi: ${d.message || 'không rõ'}`, 'system');
			break;
		default:
			break;
	}
}

/* ---------------- actions ---------------- */

function validate() {
	const token = ui.token.value.trim();
	if (!token) {
		toast('Bạn chưa nhập token Discord.', true);
		ui.token.focus();
		return false;
	}
	if (token.split('.').length < 3) {
		ui.token.classList.add('invalid');
		toast('Token không hợp lệ (cần dạng xxx.yyy.zzz).', true);
		return false;
	}
	ui.token.classList.remove('invalid');
	return true;
}

function collect() {
	return {
		token: ui.token.value.trim(),
		webhook: ui.webhook.value.trim(),
		remember: ui.remember.checked,
	};
}

async function saveConfig(quiet = false) {
	const result = await api.saveConfig(collect());
	if (result.ok) {
		if (!quiet) toast('Đã lưu cấu hình.');
	} else {
		toast(`Không lưu được: ${result.message}`, true);
	}
}

ui.btnStart.addEventListener('click', async () => {
	if (!validate()) return;
	await saveConfig(true);
	questOrder.length = 0;
	quests.clear();
	ui.console.innerHTML = '';
	logText = '';
	renderQuests();
	const result = await api.start(collect());
	if (!result.ok) {
		toast(result.message, true);
		setState('idle');
	} else {
		toast('Đã bắt đầu...');
		setState('starting');
	}
});

ui.btnStop.addEventListener('click', async () => {
	await api.stop();
	toast('Đang dừng...');
});

ui.btnSave.addEventListener('click', () => saveConfig(false));

ui.btnPaste.addEventListener('click', async () => {
	const text = (await api.readClipboard()) || '';
	const guess = text.match(/[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{20,}/);
	ui.token.value = guess ? guess[0] : text.trim();
	ui.token.classList.toggle(
		'invalid',
		ui.token.value.length > 0 && ui.token.value.split('.').length < 3,
	);
	if (ui.token.value) toast('Đã dán token.');
});

ui.btnToggleToken.addEventListener('click', () => {
	const isHidden = ui.token.type === 'password';
	ui.token.type = isHidden ? 'text' : 'password';
	ui.btnToggleToken.textContent = isHidden ? 'Ẩn' : 'Hiện';
});

ui.btnClearLog.addEventListener('click', () => {
	ui.console.innerHTML = '';
	logText = '';
});

ui.btnSaveLog.addEventListener('click', async () => {
	const result = await api.saveLog(logText);
	if (result.ok) toast('Đã lưu nhật ký.');
});

ui.btnOpenFolder.addEventListener('click', () => api.openDataFolder());

el('linkTerms').addEventListener('click', (e) => {
	e.preventDefault();
	api.openExternal('https://discord.com/terms');
});
/* ---------------- init ---------------- */

api.onLog((payload) => appendLog(payload.line, payload.stream));
api.onEvent(handleEvent);
api.onState((payload) => setState(payload.state, payload));

(async function init() {
	const cfg = await api.getConfig();
	ui.token.value = cfg.token || '';
	ui.webhook.value = cfg.webhook || '';
	ui.remember.checked = cfg.remember !== false;
	setState(cfg.state || 'idle');
	appendLog('[system] Sẵn sàng. Nhập token rồi bấm "Bắt đầu".', 'system');
})();
