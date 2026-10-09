export type Language = 'vi' | 'en';

export const translations = {
  vi: {
    // Header
    brand: 'EZDQ',
    subtitle: 'Tự động làm Discord Quests trên nền tảng Web',
    statusReady: 'Sẵn sàng',
    statusStarting: 'Đang kết nối...',
    statusRunning: 'Đang cày nhiệm vụ',
    statusStopping: 'Đang dừng...',
    statusError: 'Có lỗi xảy ra',
    guideBtn: 'Hướng dẫn',
    doingQuestStatus: 'Doing Quest ✔ • ezdisquest.nx.kg',

    // Stats Overview
    statTotal: 'Tổng nhiệm vụ',
    statRunning: 'Đang thực hiện',
    statCompleted: 'Đã hoàn thành',
    statTimeSaved: 'Thời gian tiết kiệm',
    minutesUnit: 'phút',

    // Security Banner
    securityTitle: 'Bảo mật phiên tuyệt đối (Zero Persistence):',
    securityDesc:
      'Token và API Key chỉ lưu tạm trong bộ nhớ RAM của phiên duyệt hiện tại. Đóng tab hoặc bấm F5 (reload), toàn bộ dữ liệu tự hủy ngay lập tức không để lại dấu vết.',

    // Token & Session Card
    tokenLabel: 'Token Discord của bạn',
    tokenPlaceholder: 'Dán token Discord (dạng xxx.yyy.zzz)...',
    tokenValid: 'Định dạng hợp lệ ✔',
    tokenInvalid: 'Chưa đúng chuẩn 3 đoạn',
    pasteBtn: 'Dán',
    clearBtn: 'Xóa RAM',
    showToken: 'Hiện',
    hideToken: 'Ẩn',
    pastedToast: 'Đã dán token thành công!',
    clearedToast: 'Đã xóa sạch token khỏi bộ nhớ RAM.',
    emptyTokenError: 'Vui lòng nhập Token Discord.',
    invalidTokenError: 'Token cần có định dạng 3 đoạn xxx.yyy.zzz.',

    // Options
    customStatusToggle: "Đổi trạng thái Discord thành:",
    parallelModeToggle: 'Làm nhiều quest cùng lúc (Song Song)',
    parallelModeDesc: 'Chạy đồng thời tất cả nhiệm vụ để rút ngắn tối đa thời gian hoàn thành.',
    notificationToggle: 'Thông báo & Chuông khi hoàn thành',
    notificationDesc: 'Tự động gửi thông báo màn hình và phát chuông khi tất cả quest hoàn tất',
    notificationGranted: 'Đã bật thông báo',
    notificationDenied: 'Trình duyệt đang chặn thông báo',
    completionNotificationTitle: 'EZDQ — Hoàn thành tất cả nhiệm vụ!',
    completionNotificationBody: 'Tất cả nhiệm vụ Discord của bạn đã hoàn thành xuất sắc!',
    completionBannerTitle: '🎉 Tất Cả Nhiệm Vụ Đã Hoàn Thành!',
    completionBannerDesc: 'Hệ thống đã tự động hoàn tất và nhận quà cho tất cả các nhiệm vụ. Bạn có thể đóng trang web an toàn!',
    closeBtn: 'Đóng',

    // Advanced & Captcha Solver
    advancedSettings: 'Cài đặt nâng cao & Auto CAPTCHA (Tùy chọn)',
    captchaEnable: 'Tự động giải CAPTCHA khi nhận thưởng (Optional)',
    captchaProvider: 'Nhà cung cấp CAPTCHA',
    captchaApiKey: 'API Key giải CAPTCHA',
    captchaApiKeyPlaceholder: 'Dán API Key nhà cung cấp (CapSolver / 2Captcha / Anti-Captcha)...',
    captchaHint: 'Nếu không nhập API key, bot vẫn cày 100% tiến độ và bạn có thể vào app Discord nhận quà thủ công.',

    // Proxy Settings
    proxySectionTitle: 'Định tuyến Proxy & Vượt RateLimit Cloudflare',
    proxyModeAuto: '⚡ Auto GitHub Proxy Pool',
    proxyModeAutoDesc: 'Tự động cào & xoay vòng proxy sống từ 30+ repo GitHub để không bao giờ bị dính RateLimit.',
    proxyModeDirect: '🌐 Kết nối Trực tiếp (Direct IP)',
    proxyModeDirectDesc: 'Dùng IP máy chủ gốc (thích hợp nhất khi chạy local trên máy tính cá nhân).',
    proxyModeCustom: '🛠️ Proxy Tùy Chỉnh (Custom)',
    proxyModeCustomDesc: 'Sử dụng proxy HTTP/HTTPS riêng của bạn.',
    proxyCustomPlaceholder: 'http://user:pass@ip:port hoặc http://ip:port',
    proxyRepoCountBadge: '30+ GitHub Repos Live',


    // Action Buttons
    startBtn: 'BẮT ĐẦU CÀY QUEST',
    startingBtn: 'Đang xử lý...',
    stopBtn: 'DỪNG LẠI',

    // Profile Card
    verifiedAccount: 'Tài khoản đã xác thực',
    onlineStatus: 'Trực tuyến',
    copyId: 'Sao chép ID',
    copiedId: 'Đã chép!',

    // Quests Board
    questBoardTitle: 'Danh sách nhiệm vụ',
    questBoardSubtitle: 'Theo dõi tiến trình và trạng thái các nhiệm vụ theo thời gian thực',
    tabAll: 'Tất cả',
    tabRunning: 'Đang chạy',
    tabDone: 'Đã xong',
    tabRateLimit: 'Rate Limit',
    emptyQuestsTitle: 'Không có nhiệm vụ nào',
    emptyQuestsDesc: 'Nhập Token Discord và bấm "Bắt đầu cày quest" để quét danh sách nhiệm vụ.',
    badgeRunning: 'Đang chạy',
    badgeDone: 'Đã xong',
    badgeRateLimit: 'Rate Limit',
    badgePending: 'Chờ thực hiện',
    claimRewardBtn: 'Nhận phần thưởng',
    rateLimitHint: 'Mở app Discord, bấm "Nhận nhiệm vụ" rồi bấm Bắt đầu lại trên web để hoàn thành.',

    // Terminal
    terminalTitle: 'Nhật ký hệ thống (Live Logs)',
    terminalLines: 'dòng',
    searchLogsPlaceholder: 'Tìm kiếm log...',
    filterAll: 'Tất cả mức độ',
    filterSystem: 'Hệ thống [SYS]',
    filterInfo: 'Thông tin [INFO]',
    filterSuccess: 'Thành công [OK]',
    filterWarn: 'Cảnh báo [WARN]',
    filterError: 'Lỗi [ERR]',
    autoScrollTitle: 'Tự động cuộn',
    clearLogsTitle: 'Xóa nhật ký',
    downloadLogsTitle: 'Tải file nhật ký (.txt)',
    emptyLogs: 'Chưa có nhật ký ghi nhận. Nhập token và bắt đầu.',

    // Guide Modal
    guideModalTitle: 'Hướng dẫn sử dụng & Bảo mật',
    guideModalSubtitle: 'Cách lấy token, giải quyết rate-limit và chính sách an toàn',
    guideStep1Title: 'Cách lấy token Discord trong 10 giây',
    guideStep1_1: 'Mở Discord trên trình duyệt web tại',
    guideStep1_2: 'Nhấn phím F12 (hoặc Ctrl + Shift + I) để mở Developer Tools.',
    guideStep1_3: 'Chuyển sang tab Console, dán đoạn mã bên dưới rồi nhấn Enter:',
    copyCodeBtn: 'Sao chép mã',
    copiedCodeBtn: 'Đã chép!',
    tokenClipboardNotice: '✔ Token sẽ tự động được sao chép vào Clipboard. Bạn chỉ cần sang EZDQ bấm "Dán".',
    rateLimitTitle: 'Cách xử lý khi bị giới hạn (Rate-Limit 429)',
    rateLimitDesc: 'Discord giới hạn mỗi tài khoản chỉ nhận được 1 quest mới qua API mỗi ~45 phút. Cách khắc phục:',
    rateLimitStep1: '1. Mở app Discord (hoặc trang web Discord).',
    rateLimitStep2: '2. Vào mục Quests (Nhiệm vụ) bấm "Nhận nhiệm vụ" (Accept Quest) bằng tay.',
    rateLimitStep3: '3. Quay lại EZDQ Web bấm "Bắt đầu cày quest", bot sẽ cày tiếp ngay lập tức!',
    securityModalTitle: 'Cam kết bảo mật tuyệt đối (Ephemeral In-Memory)',
    securityModalDesc1: 'EZDQ Web hoạt động với nguyên tắc Zero-Persistence:',
    securityModalDesc2: 'Token & API Key chỉ lưu trong RAM tạm thời.',
    securityModalDesc3: 'Đóng tab, thoát trình duyệt hoặc F5 (reload), toàn bộ dữ liệu biến mất hoàn toàn.',
    securityModalDesc4: 'Không bao giờ ghi vào database, ổ cứng, cookie hay LocalStorage.',

    // Footer
    footerBrand: 'EZDQ Web',
    footerVersion: 'v2.0',
    footerOpenSource: 'Phần mềm mã nguồn mở (Open Source)',
    footerFreeToCheck: 'Tự do kiểm tra & minh bạch mã nguồn',
    footerNoCopyright: 'GPL-3.0 License • Miễn phí vĩnh viễn • No Copyright',
    footerGithubBtn: 'Mã nguồn GitHub',
    footerSecurity: 'Bảo mật RAM phiên • Tự xóa token khi đóng/tải lại trang',
  },

  en: {
    // Header
    brand: 'EZDQ',
    subtitle: 'Automate Discord Quests on the Web',
    statusReady: 'Ready',
    statusStarting: 'Connecting...',
    statusRunning: 'Doing Quests',
    statusStopping: 'Stopping...',
    statusError: 'Error Occurred',
    guideBtn: 'Guide',
    doingQuestStatus: 'Doing Quest ✔ • ezdisquest.nx.kg',

    // Stats Overview
    statTotal: 'Total Quests',
    statRunning: 'In Progress',
    statCompleted: 'Completed',
    statTimeSaved: 'Time Saved',
    minutesUnit: 'mins',

    // Security Banner
    securityTitle: 'Zero-Persistence Ephemeral Security:',
    securityDesc:
      'Tokens and API Keys are stored strictly in session RAM. Closing the tab or pressing F5 (reload) purges all sensitive data instantly with zero trace.',

    // Token & Session Card
    tokenLabel: 'Your Discord Token',
    tokenPlaceholder: 'Paste your Discord token (format xxx.yyy.zzz)...',
    tokenValid: 'Valid Format ✔',
    tokenInvalid: 'Needs 3 segments',
    pasteBtn: 'Paste',
    clearBtn: 'Clear RAM',
    showToken: 'Show',
    hideToken: 'Hide',
    pastedToast: 'Token pasted successfully!',
    clearedToast: 'Token scrubbed from RAM memory.',
    emptyTokenError: 'Please enter your Discord Token.',
    invalidTokenError: 'Token must follow the 3-segment format: xxx.yyy.zzz.',

    // Options
    customStatusToggle: 'Set Discord custom status to:',
    parallelModeToggle: 'Run multiple quests concurrently (Parallel)',
    parallelModeDesc: 'Run all available quests at the same time to save maximum time.',
    notificationToggle: 'Notify & Chime upon completion',
    notificationDesc: 'Send desktop notification and audio chime when all quests finish',
    notificationGranted: 'Notifications enabled',
    notificationDenied: 'Notifications blocked by browser',
    completionNotificationTitle: 'EZDQ — All Quests Completed!',
    completionNotificationBody: 'All your Discord quests have finished successfully!',
    completionBannerTitle: '🎉 All Quests Completed!',
    completionBannerDesc: 'The system has automated and redeemed all available quests. You can safely close this page!',
    closeBtn: 'Close',

    // Advanced & Captcha Solver
    advancedSettings: 'Advanced Settings & Auto CAPTCHA (Optional)',
    captchaEnable: 'Auto-solve CAPTCHA when claiming rewards (Optional)',
    captchaProvider: 'CAPTCHA Provider',
    captchaApiKey: 'CAPTCHA API Key',
    captchaApiKeyPlaceholder: 'Paste provider API Key (CapSolver / 2Captcha / Anti-Captcha)...',
    captchaHint: 'Optional. If left blank, you can still claim completed quests manually inside Discord.',

    // Proxy Settings
    proxySectionTitle: 'Proxy Routing & Cloudflare Bypass',
    proxyModeAuto: '⚡ Auto GitHub Proxy Pool',
    proxyModeAutoDesc: 'Automatically scrapes & rotates live proxies from 30+ GitHub repos to avoid RateLimit.',
    proxyModeDirect: '🌐 Direct Connection (Direct IP)',
    proxyModeDirectDesc: 'Use server origin IP (recommended when running on local machine).',
    proxyModeCustom: '🛠️ Custom Proxy (Custom)',
    proxyModeCustomDesc: 'Use your own HTTP/HTTPS proxy.',
    proxyCustomPlaceholder: 'http://user:pass@ip:port or http://ip:port',
    proxyRepoCountBadge: '30+ GitHub Repos Live',


    // Action Buttons
    startBtn: 'START AUTO QUEST',
    startingBtn: 'Processing...',
    stopBtn: 'STOP',

    // Profile Card
    verifiedAccount: 'Authenticated Account',
    onlineStatus: 'Online',
    copyId: 'Copy ID',
    copiedId: 'Copied!',

    // Quests Board
    questBoardTitle: 'Quests Dashboard',
    questBoardSubtitle: 'Monitor real-time progress and status of all Discord quests',
    tabAll: 'All',
    tabRunning: 'Running',
    tabDone: 'Completed',
    tabRateLimit: 'Rate Limited',
    emptyQuestsTitle: 'No Quests Available',
    emptyQuestsDesc: 'Enter your Discord Token and click "Start Auto Quest" to scan for available quests.',
    badgeRunning: 'Running',
    badgeDone: 'Claimed',
    badgeRateLimit: 'Rate Limit',
    badgePending: 'Pending',
    claimRewardBtn: 'Claim Reward',
    rateLimitHint: 'Open Discord app, click "Accept Quest", then restart AutoQuest Web.',

    // Terminal
    terminalTitle: 'System Console (Live Logs)',
    terminalLines: 'lines',
    searchLogsPlaceholder: 'Search logs...',
    filterAll: 'All Levels',
    filterSystem: 'System [SYS]',
    filterInfo: 'Info [INFO]',
    filterSuccess: 'Success [OK]',
    filterWarn: 'Warning [WARN]',
    filterError: 'Error [ERR]',
    autoScrollTitle: 'Auto Scroll',
    clearLogsTitle: 'Clear Console',
    downloadLogsTitle: 'Export Log (.txt)',
    emptyLogs: 'No logs recorded yet. Enter token and start.',

    // Guide Modal
    guideModalTitle: 'User Guide & Security',
    guideModalSubtitle: 'How to extract token, bypass rate-limits, and security policies',
    guideStep1Title: 'How to get your Discord Token in 10 seconds',
    guideStep1_1: 'Open Discord in your browser at',
    guideStep1_2: 'Press F12 (or Ctrl + Shift + I) to open Developer Tools.',
    guideStep1_3: 'Switch to the Console tab, paste the code below, and press Enter:',
    copyCodeBtn: 'Copy Script',
    copiedCodeBtn: 'Copied!',
    tokenClipboardNotice: '✔ Token will be automatically copied to your clipboard. Click "Paste" on EZDQ.',
    rateLimitTitle: 'How to bypass Discord Rate-Limit (429)',
    rateLimitDesc: 'Discord limits accounts to enrolling in 1 quest per ~45 minutes via API. To bypass:',
    rateLimitStep1: '1. Open the Discord app or website.',
    rateLimitStep2: '2. Go to Quests and click "Accept Quest" manually.',
    rateLimitStep3: '3. Return to EZDQ Web and click "Start Auto Quest" to finish immediately!',
    securityModalTitle: 'Zero-Persistence Security Guarantee',
    securityModalDesc1: 'EZDQ Web operates under strict in-memory principles:',
    securityModalDesc2: 'Tokens & API keys are kept strictly in session RAM.',
    securityModalDesc3: 'Closing tab or pressing F5 immediately wipes all data with zero trace.',
    securityModalDesc4: 'Never saved to database, disk, cookies, or LocalStorage.',

    // Footer
    footerBrand: 'EZDQ Web',
    footerVersion: 'v2.0',
    footerOpenSource: 'Open Source Software',
    footerFreeToCheck: '100% Free to inspect & audit',
    footerNoCopyright: 'GPL-3.0 License • Free forever • No Copyright',
    footerGithubBtn: 'GitHub Repository',
    footerSecurity: 'Ephemeral RAM Security • Token purges instantly on tab close/reload',
  },
};
