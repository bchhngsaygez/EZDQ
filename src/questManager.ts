import { APIApplication } from 'discord-api-types/v10';
import { ClientQuest } from './client';
import { report } from './events';
import type { AllQuestsResponse, QuestTaskConfigType } from './interface';
import { Quest } from './quest';
import { Utils } from './utils';

export class QuestManager implements Iterable<Quest> {
	private readonly quests = new Map<string, Quest>();
	public readonly client: ClientQuest;
	constructor(client: ClientQuest, quests: Quest[] = []) {
		this.client = client;
		quests.forEach((quest) => this.quests.set(quest.id, quest));
	}

	static async fromResponse(
		client: ClientQuest,
		response: AllQuestsResponse,
		fetchExcludedQuests = false,
	): Promise<QuestManager> {
		if (response.quest_enrollment_blocked_until !== null) {
			throw new Error(
				`Quest enrollment is blocked until ${response.quest_enrollment_blocked_until}.`,
			);
		}
		const questManager = new QuestManager(
			client,
			response.quests.map((quest) => Quest.create(quest)),
		);
		if (fetchExcludedQuests && Array.isArray(response.excluded_quests) && response.excluded_quests.length > 0) {
			console.log(
				`Tìm thấy ${response.excluded_quests.length} nhiệm vụ phụ/bổ sung. Đang nạp chi tiết...`,
			);
			for (const quest of response.excluded_quests) {
				if (quest.id && !questManager.hasQuest(quest.id)) {
					await questManager.addExcludedQuest(quest.id);
				}
			}
		}
		return Promise.resolve(questManager);
	}

	protected addExcludedQuest(questId: string) {
		// fetch quest details and add to quests
		return this.client.rest
			.get(`/quests/${questId}`)
			.then((response) => {
				const quest = Quest.create({
					id: questId,
					config: response as any,
					user_status: null,
					targeted_content: 0,
					preview: false,
				});
				console.log(
					`Đã nạp nhiệm vụ bổ sung: "${quest.config.messages.quest_name}".`,
				);
				this.quests.set(quest.id, quest);
			})
			.catch((err) => {
				console.warn(
					`Không thể lấy chi tiết nhiệm vụ bổ sung "${questId}": ${err.message}`,
				);
			});
	}

	[Symbol.iterator](): IterableIterator<Quest> {
		return this.quests.values();
	}

	get size(): number {
		return this.quests.size;
	}

	list(): Quest[] {
		return Array.from(this.quests.values());
	}

	get(id: string): Quest | undefined {
		return this.quests.get(id);
	}

	upsert(quest: Quest): void {
		this.quests.set(quest.id, quest);
	}

	remove(id: string): boolean {
		return this.quests.delete(id);
	}

	clear(): void {
		this.quests.clear();
	}

	getExpired(date: Date = new Date()): Quest[] {
		return this.list().filter((quest) => quest.isExpired(date));
	}

	getCompleted(): Quest[] {
		return this.list().filter((quest) => quest.isCompleted());
	}

	getClaimable(): Quest[] {
		return this.list().filter(
			(quest) => quest.isCompleted() && !quest.hasClaimedRewards(),
		);
	}

	hasQuest(id: string): boolean {
		return this.quests.has(id);
	}

	filterQuestsValidToDo(reference: Date = new Date()) {
		return this.list().filter(
			(quest) =>
				!quest.isCompleted() &&
				!quest.isExpired(reference) &&
				quest.isStarted(reference),
		);
	}

	filterQuestsValidToRedeem() {
		return this.list().filter(
			(quest) => quest.isCompleted() && !quest.hasClaimedRewards(),
		);
	}

	getApplicationData(ids: string[]) {
		const query = new URLSearchParams();
		ids.forEach((id) => query.append('application_ids', id));
		return this.client.rest.get(`/applications/public`, {
			query,
		}) as Promise<
			{
				// Partial<ApplicationData>
				id: string;
				name: string;
				icon: string;
				description: string;
				executables: {
					os: string;
					name: string;
					is_launcher: boolean;
				}[];
			}[]
		>;
	}

	/**
	 * Enroll in a quest.
	 * @param quest quest to enroll in
	 * @param isAndroid boolean
	 * @warning This API is heavily rate-limited (45 minutes). Use with caution.
	 */
	acceptQuest(quest: Quest, isAndroid = false): Promise<Quest | undefined> {
		if (quest.isEnrolledQuest()) {
			return Promise.resolve(quest);
		}

		const enrollPromise = this.client.rest
			.post(`/quests/${quest.id}/enroll`, {
				body: {
					location: isAndroid ? 12 : 11, // QUEST_HOME_MOBILE : QUEST_HOME_DESKTOP | https://docs.discord.food/resources/quests#quest-content-type
					// location: 19, // QUEST_SHARE_LINK
					is_targeted: false,
					metadata_sealed: null,
					traffic_metadata_raw: quest.raw.traffic_metadata_raw,
					traffic_metadata_sealed: quest.raw.traffic_metadata_sealed,
				},
				headers: {
					AndroidRequest: isAndroid ? 'true' : 'false',
				},
			})
			.then((r) => {
				const q = this.get(quest.id) || quest;
				q.updateUserStatus(r as any);
				return q;
			})
			.catch((err) => {
				const msg = (err?.message || String(err)).toLowerCase();
				if (
					msg.includes('already enrolled') ||
					msg.includes('already_enrolled') ||
					err?.code === 50035
				) {
					const q = this.get(quest.id) || quest;
					if (q.raw.user_status) {
						q.raw.user_status.enrolled_at =
							q.raw.user_status.enrolled_at || new Date().toISOString();
					} else {
						q.updateUserStatus({
							enrolled_at: new Date().toISOString(),
							completed_at: null,
							claimed_at: null,
							progress: {},
						} as any);
					}
					return q;
				}
				throw err;
			});

		const timeoutPromise = new Promise<never>((_, reject) => {
			setTimeout(
				() =>
					reject(
						new Error(
							'Hết thời gian chờ phản hồi đăng ký từ Discord (quá 15 giây).',
						),
					),
				15000,
			);
		});

		return Promise.race([enrollPromise, timeoutPromise]);
	}

	private async timeout(ms: number) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	async redeemQuest(quest: Quest): Promise<void> {
		if (quest.hasClaimedRewards()) {
			return;
		}
		try {
			const platform =
				quest.raw.config.rewards_config?.platforms?.[0] ?? 0;
			const res = (await this.client.rest.post(
				`/quests/${quest.id}/claim-reward`,
				{
					body: {
						platform,
						location: 11, // QUEST_HOME_DESKTOP
						is_targeted: false,
						metadata_raw: null,
						metadata_sealed: null,
						traffic_metadata_raw: quest.raw.traffic_metadata_raw,
						traffic_metadata_sealed:
							quest.raw.traffic_metadata_sealed,
					},
				},
			)) as any;
			console.log(
				`Đã nhận thưởng cho nhiệm vụ "${quest.config.messages.quest_name}"!`,
			);
			quest.updateUserStatus(res);
			report('quest:done', { name: quest.config.messages.quest_name });
		} catch (err: any) {
			const name = quest.config.messages.quest_name;
			const message = err?.message || String(err);
			const rawError = err?.rawError || {};
			if (
				rawError.captcha_key ||
				message.includes('No Description') ||
				message.toLowerCase().includes('captcha')
			) {
				console.log(
					`Nhiệm vụ "${name}" đã hoàn thành! Discord yêu cầu xác thực captcha để nhận thưởng. Bạn hãy vào app Discord bấm "Nhận phần thưởng" nhé.`,
				);
			} else {
				console.warn(`Không thể nhận thưởng cho nhiệm vụ "${name}":`, message);
			}
		}

	}

	async doingQuest(quest: Quest) {
		const questName = quest.config.messages.quest_name;
		const isAndroid =
			Boolean(quest.config.task_config_v2.tasks.WATCH_VIDEO_ON_MOBILE) &&
			!Boolean(quest.config.task_config_v2.tasks.WATCH_VIDEO);
		if (!quest.isEnrolledQuest()) {
			console.log(
				`Đang đăng ký nhiệm vụ "${questName}" (bản ${
					isAndroid ? 'Android' : 'Desktop'
				})...`,
			);
			try {
				await this.acceptQuest(quest, isAndroid);
				console.log(`Đã đăng ký thành công nhiệm vụ "${questName}".`);
			} catch (err: any) {
				const message = err?.message || String(err);
				const isAlreadyEnrolled =
					message.toLowerCase().includes('already enrolled') ||
					message.toLowerCase().includes('already_enrolled');
				if (isAlreadyEnrolled) {
					console.log(
						`Nhiệm vụ "${questName}" đã được đăng ký từ trước. Tiếp tục thực hiện...`,
					);
				} else {
					console.error(
						`Không thể đăng ký nhiệm vụ "${questName}": ${message}`,
					);
					report('quest:error', { name: questName, message });
					return;
				}
			}
		} else {
			console.log(`Đã đăng ký nhiệm vụ "${questName}" trước đó.`);
		}
		const applicationName = quest.config.application.name;
		const taskConfig = quest.config.task_config_v2;
		const taskName = [
			'WATCH_VIDEO',
			'PLAY_ON_DESKTOP',
			'PLAY_ON_XBOX',
			'PLAY_ON_PLAYSTATION',
			'STREAM_ON_DESKTOP',
			'PLAY_ACTIVITY',
			'WATCH_VIDEO_ON_MOBILE',
			'ACHIEVEMENT_IN_ACTIVITY',
		].find(
			(x) => taskConfig.tasks[x as QuestTaskConfigType] != null,
		) as QuestTaskConfigType;

		if (!taskName || !taskConfig.tasks[taskName]) {
			console.warn(
				`Nhiệm vụ "${questName}" không có dạng cấu hình nhiệm vụ được hỗ trợ.`,
			);
			report('quest:skip', {
				name: questName,
				reason: 'Cấu hình nhiệm vụ không được hỗ trợ',
			});
			return;
		}

		const secondsNeeded = taskConfig.tasks[taskName].target;
		let secondsDone = quest.userStatus?.progress?.[taskName]?.value ?? 0;
		report('quest:start', {
			name: questName,
			task: taskName,
			application: applicationName,
			secondsNeeded,
			secondsDone,
		});
		switch (taskName) {
			case 'WATCH_VIDEO':
			case 'WATCH_VIDEO_ON_MOBILE': {
				await this.doingWatchVideoQuest(
					quest,
					questName,
					secondsNeeded,
					secondsDone,
				);
				break;
			}
			case 'PLAY_ON_XBOX':
			case 'PLAY_ON_PLAYSTATION':
			case 'PLAY_ON_DESKTOP': {
				await this.doingPlayOnPlatformQuest(
					quest,
					questName,
					secondsNeeded,
					taskName,
					applicationName,
				);
				break;
			}
			case 'PLAY_ACTIVITY': {
				await this.doingPlayActivityQuest(
					quest,
					questName,
					secondsNeeded,
					taskName,
					applicationName,
				);
				break;
			}
			case 'STREAM_ON_DESKTOP': {
				console.log(
					'Loại nhiệm vụ này không còn hỗ trợ. Hãy mở app Discord trên máy để hoàn thành:',
					questName,
				);
				report('quest:skip', {
					name: questName,
					reason: 'STREAM_ON_DESKTOP không được hỗ trợ',
				});
				break;
			}
			case 'ACHIEVEMENT_IN_ACTIVITY': {
				await this.doingAchievementInActivityQuest(quest, questName);
				break;
			}
			default: {
				console.log(
					'Loại nhiệm vụ không xác định. Hãy mở app Discord trên máy để hoàn thành:',
					questName,
				);
				report('quest:skip', {
					name: questName,
					reason: 'Loại nhiệm vụ không xác định',
				});
			}
		}
	}
	async doingWatchVideoQuest(
		quest: Quest,
		questName: string,
		secondsNeeded: number,
		secondsDone: number,
	) {
		const maxFuture = 10,
			speed = 7,
			interval = 7;
		const enrolledAt = new Date(
			quest.userStatus?.enrolled_at as any,
		).getTime();
		let completed = false;
		let fn = async () => {
			while (true) {
				const maxAllowed =
					Math.floor((Date.now() - enrolledAt) / 1000) + maxFuture;
				const diff = maxAllowed - secondsDone;
				const timestamp = secondsDone + speed;
				if (diff >= speed) {
					const res = (await this.client.rest.post(
						`/quests/${quest.id}/video-progress`,
						{
							body: {
								timestamp: Math.min(
									secondsNeeded,
									timestamp + Math.random(),
								),
							},
						},
					)) as any;
					completed = res.completed_at != null;
					quest.updateUserStatus(res);
					secondsDone = Math.min(secondsNeeded, timestamp);
					report('quest:progress', {
						name: questName,
						secondsDone,
						secondsNeeded,
					});
				}

				if (timestamp >= secondsNeeded) {
					break;
				}
				await this.timeout(interval * 1000);
			}
			if (!completed) {
				const finalRes = await this.client.rest.post(
					`/quests/${quest.id}/video-progress`,
					{
						body: { timestamp: secondsNeeded },
					},
				);
				quest.updateUserStatus(finalRes as any);
			}
			console.log(`Đã hoàn thành nhiệm vụ "${questName}"!`);
			report('quest:done', { name: questName });
			this.client.emitQuestCompleted(quest.id);
			await this.redeemQuest(quest);
		};
		console.log(`Đang giả lập xem video cho: ${questName}.`);
		await fn();
	}

	async doingPlayOnPlatformQuest(
		quest: Quest,
		questName: string,
		secondsNeeded: number,
		taskName: string,
		applicationName: string,
	) {
		const interval = 20;
		console.log(
			`Bắt đầu giả lập chơi "${applicationName}" cho "${questName}" (thời gian: ${Math.ceil(
				secondsNeeded / 60,
			)} phút)...`,
		);
		let consecutiveErrors = 0;
		while (!quest.isCompleted()) {
			const secondsDone =
				(quest.userStatus?.progress?.[taskName]?.value as number) || 0;
			try {
				const res = await this.client.rest.post(
					`/quests/${quest.id}/heartbeat`,
					{
						body: {
							application_id: quest.config.application.id,
							terminal: false,
						},
					},
				);
				quest.updateUserStatus(res as any);
				consecutiveErrors = 0;
				const currentDone =
					(quest.userStatus?.progress?.[taskName]?.value as number) ||
					secondsDone;
				console.log(
					`Đã giả lập game "${applicationName}". Tiến độ: ${Math.floor(
						currentDone / 60,
					)}/${Math.ceil(secondsNeeded / 60)} phút.`,
				);
				report('quest:progress', {
					name: questName,
					secondsDone: currentDone,
					secondsNeeded,
				});
			} catch (err: any) {
				consecutiveErrors++;
				const msg = err?.message || String(err);
				console.warn(
					`[Cảnh báo] Lỗi gửi tín hiệu game "${applicationName}" (${consecutiveErrors}/5): ${msg}`,
				);
				if (consecutiveErrors >= 5) {
					console.error(
						`Dừng nhiệm vụ "${questName}" do lỗi gửi tín hiệu quá 5 lần liên tiếp.`,
					);
					report('quest:error', {
						name: questName,
						message: `Lỗi tín hiệu liên tục: ${msg}`,
					});
					return;
				}
			}
			await new Promise((resolve) =>
				setTimeout(resolve, interval * 1000),
			);
		}
		try {
			const res = await this.client.rest.post(
				`/quests/${quest.id}/heartbeat`,
				{
					body: {
						application_id: quest.config.application.id,
						terminal: true,
					},
				},
			);
			quest.updateUserStatus(res as any);
		} catch {
			/* ignore terminal heartbeat error */
		}
		console.log(`Đã hoàn thành nhiệm vụ "${questName}"!`);
		report('quest:done', { name: questName });
		this.client.emitQuestCompleted(quest.id);
		await this.redeemQuest(quest);
	}
	async doingPlayActivityQuest(
		quest: Quest,
		questName: string,
		secondsNeeded: number,
		taskName: string,
		applicationName: string,
	) {
		const interval = 20;
		const streamKey = 'call:1:1'; // Todo: call:channel_id:user_id | guild:guild_id:channel_id:user_id
		console.log(
			`Bắt đầu giả lập hoạt động "${applicationName}" cho "${questName}" (thời gian: ${Math.ceil(
				secondsNeeded / 60,
			)} phút)...`,
		);
		let consecutiveErrors = 0;
		while (!quest.isCompleted()) {
			const secondsDone =
				(quest.userStatus?.progress?.[taskName]?.value as number) || 0;
			try {
				const res = await this.client.rest.post(
					`/quests/${quest.id}/heartbeat`,
					{
						body: { stream_key: streamKey, terminal: false },
					},
				);
				quest.updateUserStatus(res as any);
				consecutiveErrors = 0;
				const currentDone =
					(quest.userStatus?.progress?.[taskName]?.value as number) ||
					secondsDone;
				console.log(
					`Đã giả lập hoạt động "${applicationName}". Tiến độ: ${Math.floor(
						currentDone / 60,
					)}/${Math.ceil(secondsNeeded / 60)} phút.`,
				);
				report('quest:progress', {
					name: questName,
					secondsDone: currentDone,
					secondsNeeded,
				});
			} catch (err: any) {
				consecutiveErrors++;
				const msg = err?.message || String(err);
				console.warn(
					`[Cảnh báo] Lỗi gửi tín hiệu hoạt động "${applicationName}" (${consecutiveErrors}/5): ${msg}`,
				);
				if (consecutiveErrors >= 5) {
					console.error(
						`Dừng hoạt động "${questName}" do lỗi tín hiệu quá 5 lần liên tiếp.`,
					);
					report('quest:error', {
						name: questName,
						message: `Lỗi tín hiệu liên tục: ${msg}`,
					});
					return;
				}
			}
			await new Promise((resolve) =>
				setTimeout(resolve, interval * 1000),
			);
		}
		try {
			const res = await this.client.rest.post(
				`/quests/${quest.id}/heartbeat`,
				{
					body: { stream_key: streamKey, terminal: true },
				},
			);
			quest.updateUserStatus(res as any);
		} catch {
			/* ignore terminal heartbeat error */
		}
		console.log(`Đã hoàn thành nhiệm vụ "${questName}"!`);
		report('quest:done', { name: questName });
		this.client.emitQuestCompleted(quest.id);
		await this.redeemQuest(quest);
	}
	async doingAchievementInActivityQuest(quest: Quest, questName: string) {
		// 1. Get application ID
		const applicationId = quest.config.application.id;
		const applicationName = quest.config.application.name;
		const questTarget =
			quest.config.task_config_v2.tasks.ACHIEVEMENT_IN_ACTIVITY.target;
		// 2. Authorize
		const query = new URLSearchParams({
			response_type: 'code',
			client_id: applicationId,
			scope: 'identify applications.commands applications.entitlements',
			state: '',
		});
		const res2 = (await this.client.rest.post(`/oauth2/authorize`, {
			query,
			body: {
				permissions: '0',
				authorize: true,
				integration_type: 1,
				location_context: {
					guild_id: '10000',
					channel_id: '10000',
					channel_type: 10000,
				},
			},
		})) as Record<string, any>;
		console.log(`Đã cấp quyền cho ứng dụng ${applicationName}`);
		const location = res2?.location;
		let authCode: string | null = null;
		if (location) {
			authCode = new URL(location).searchParams.get('code');
		}
		if (!authCode) {
			const message = `Không nhận được mã xác thực cho ứng dụng ${applicationName}. Không thể hoàn thành nhiệm vụ.`;
			console.error(message);
			report('quest:error', { name: questName, message });
			return;
		}
		// 3. Complete achievement in activity
		const { token, error: authError, activityReferrer } = await Utils.authorizeDiscordSays(
			applicationId,
			quest.id,
			authCode,
			this.client,
		);
		if (authError || !token) {
			const message = `Không cấp được token từ Discord Says cho ứng dụng ${applicationName}. Không thể hoàn thành nhiệm vụ.`;
			console.error(message, authError);
			report('quest:error', { name: questName, message });
			return;
		}
		const { success, error: progressError } =
			await Utils.progressDiscordSays(
				applicationId,
				quest.id,
				token,
				questTarget,
				activityReferrer,
			);
		if (progressError || !success) {
			const message = `Không gửi được tiến độ tới Discord Says cho ứng dụng ${applicationName}. Không thể hoàn thành nhiệm vụ.`;
			console.error(message, progressError);
			report('quest:error', { name: questName, message });
			return;
		}
		// 4. Deauthorize
		const res3 = (await this.client.rest.get(`/oauth2/tokens`)) as {
			id: string;
			scopes: string[];
			application: APIApplication;
			disclosures: number[];
		}[];
		const tokenInfo = res3.find((t) => t.application.id === applicationId);
		if (tokenInfo) {
			try {
				await this.client.rest.delete(`/oauth2/tokens/${tokenInfo.id}`);
				console.log(`Đã thu hồi quyền của ứng dụng ${applicationName}`);
			} catch (err) {
				console.error(
					`Không thể thu hồi quyền của ứng dụng ${applicationName}.`,
					(err as Error).message,
				);
			}
		}
		if (quest.raw.user_status) {
			quest.raw.user_status.completed_at =
				quest.raw.user_status.completed_at || new Date().toISOString();
		} else {
			quest.updateUserStatus({
				enrolled_at: new Date().toISOString(),
				completed_at: new Date().toISOString(),
				claimed_at: null,
				progress: {},
			} as any);
		}
		console.log(`Đã hoàn thành nhiệm vụ "${questName}"!`);
		report('quest:done', { name: questName });
		this.client.emitQuestCompleted(quest.id);
		await this.redeemQuest(quest);
	}

}
