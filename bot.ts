import { GatewayDispatchEvents } from 'discord-api-types/v10';
import { ClientQuest } from './src/client';
import { report } from './src/events';

const token = (process.env.TOKEN || '').trim();

if (!token) {
	report('fatal', { message: 'Thieu TOKEN. Hay nhap token trong GUI.' });
	process.exit(1);
}

let finished = false;

const client = new ClientQuest(token);

async function shutdown(code: number) {
	if (finished) return;
	finished = true;
	try {
		await client.destroy();
	} catch {
		/* ignore */
	}
	setTimeout(() => process.exit(code), 150);
}

client.once(GatewayDispatchEvents.Ready, async ({ data }) => {
	report('login', {
		id: data.user.id,
		username: data.user.username,
	});
	console.log(`Đã đăng nhập: @${data.user.username}`);

	try {
		console.log('Đang quét danh sách nhiệm vụ trên Discord...');
		await client.fetchQuests(false);

		// Kiểm tra và tự động nhận thưởng cho các nhiệm vụ đã hoàn thành từ trước nhưng chưa nhận thưởng
		const questsToRedeem = client.questManager!.filterQuestsValidToRedeem();
		if (questsToRedeem.length > 0) {
			console.log(
				`Tìm thấy ${questsToRedeem.length} nhiệm vụ đã hoàn thành nhưng chưa nhận thưởng. Đang nhận thưởng...`,
			);
			for (const quest of questsToRedeem) {
				await client.questManager!.redeemQuest(quest);
				await new Promise((resolve) => setTimeout(resolve, 1500));
			}
		}

		const questsValid = client.questManager!.filterQuestsValidToDo();
		report('quests', { total: questsValid.length });
		console.log(
			`Tìm thấy ${questsValid.length} nhiệm vụ hợp lệ có thể thực hiện.`,
		);

		if (questsValid.length === 0) {
			console.log('Không có nhiệm vụ nào cần làm.');
			report('finish', {});
			await shutdown(0);
			return;
		}

		// Giai đoạn 1: Đăng ký các nhiệm vụ chưa nhận một cách tuần tự (tránh rate-limit 429)
		console.log('--- [Giai đoạn 1] Kiểm tra & Đăng ký nhiệm vụ ---');
		for (const quest of questsValid) {
			const questName = quest.config.messages.quest_name;
			if (!quest.isEnrolledQuest()) {
				const isAndroid =
					Boolean(quest.config.task_config_v2.tasks.WATCH_VIDEO_ON_MOBILE) &&
					!Boolean(quest.config.task_config_v2.tasks.WATCH_VIDEO);
				console.log(
					`Đang đăng ký nhiệm vụ "${questName}" (bản ${
						isAndroid ? 'Android' : 'Desktop'
					})...`,
				);
				try {
					await client.questManager!.acceptQuest(quest, isAndroid);
					console.log(`Đã đăng ký thành công nhiệm vụ "${questName}".`);
					// Giãn cách 2.5 giây giữa các lượt đăng ký để bảo đảm an toàn với Discord API
					await new Promise((resolve) => setTimeout(resolve, 2500));
				} catch (err: any) {
					const message = err?.message || String(err);
					if (message.toLowerCase().includes('ratelimit') || err?.status === 429) {
						console.warn(
							`[Giới hạn Discord] Tài khoản đang bị Discord giới hạn nhận nhiệm vụ mới qua API (còn ~45 phút).`,
						);
						console.log(
							`💡 Gợi ý: Hãy mở Discord lên bấm "Nhận nhiệm vụ" ("Accept Quest") cho "${questName}", bot sẽ tự động làm nhiệm vụ này ngay!`,
						);
						report('quest:skip', {
							name: questName,
							reason: 'Bị giới hạn API Discord (hãy bấm Nhận trên app Discord)',
						});
					} else {
						console.warn(
							`Không thể đăng ký nhiệm vụ "${questName}": ${message}`,
						);
						report('quest:error', { name: questName, message });
					}
				}
			} else {
				console.log(`Nhiệm vụ "${questName}" đã được nhận trước đó.`);
			}
		}

		// Lọc ra các nhiệm vụ sẵn sàng để chạy (đã được đăng ký)
		const executableQuests = questsValid.filter((q) => q.isEnrolledQuest());
		if (executableQuests.length === 0) {
			console.log(
				'Không có nhiệm vụ nào sẵn sàng để thực hiện (các nhiệm vụ còn lại chưa được nhận do giới hạn tần suất API của Discord).',
			);
			console.log(
				'👉 Bạn chỉ cần vào Discord bấm "Nhận nhiệm vụ" ("Accept Quest") cho nhiệm vụ cần làm, sau đó bấm "Bắt đầu" lại trên AutoQuest là bot sẽ cày xong ngay!',
			);
			report('finish', {});
			await shutdown(0);
			return;
		}


		// Giai đoạn 2: Bắt đầu thực hiện các nhiệm vụ (giãn cách khởi động để không trùng nhịp heartbeat)
		console.log(`--- [Giai đoạn 2] Bắt đầu thực hiện ${executableQuests.length} nhiệm vụ ---`);
		const tasks = executableQuests.map(async (quest, index) => {
			if (index > 0) {
				await new Promise((resolve) => setTimeout(resolve, index * 1500));
			}
			return client.questManager!.doingQuest(quest);
		});

		await Promise.allSettled(tasks);
		report('finish', {});
		console.log('Đã xử lý xong tất cả nhiệm vụ. Đang đóng kết nối...');
		await shutdown(0);

	} catch (err: any) {
		const message = err?.message || String(err);
		report('fatal', { message });
		console.error('Lỗi khi xử lý nhiệm vụ:', message);
		await shutdown(1);
	}
});

process.on('unhandledRejection', (reason) => {
	console.error('[Lỗi] Promise bị từ chối không xử lý:', reason);
});

process.on('uncaughtException', (error) => {
	console.error('Lỗi không mong đợi:', error.message);
});

process.on('SIGINT', () => void shutdown(0));
process.on('SIGTERM', () => void shutdown(0));

client.connect().catch((err: any) => {
	const message = err?.message || String(err);
	report('fatal', { message });
	console.error('Lỗi kết nối:', message);
	void shutdown(1);
});
