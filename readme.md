# AutoQuest — Tự động làm nhiệm vụ Discord trên máy tính (Bản GUI)

**AutoQuest** là ứng dụng desktop Windows chạy **100% local** trên máy tính, sở hữu **giao diện đồ họa (GUI) tiếng Việt** trực quan, giúp tự động hoá việc đăng ký và hoàn thành các **Discord Quests** đang mở. Bạn chỉ cần nhập token, bấm **Bắt đầu**, ứng dụng sẽ tự động xử lý và cập nhật tiến trình theo thời gian thực.

> [!CAUTION]
> **Khuyến cáo an toàn.** Việc tự động hoá trên tài khoản người dùng có thể vi phạm
> [Điều khoản dịch vụ của Discord](https://discord.com/terms). Khuyến khích sử dụng trên **tài khoản phụ** và **tự chịu trách nhiệm** về rủi ro tài khoản.

---

## 🌟 Tính năng nổi bật

- 🖥️ **Giao diện hiện đại, dễ dùng:** Không cần cấu hình file `.env` hay cài đặt môi trường phức tạp. Nhập token và chạy ngay chỉ với 1 click.
- ⚡ **Tự động làm nhiều loại nhiệm vụ:**
  - `WATCH_VIDEO` / `WATCH_VIDEO_ON_MOBILE`: Tự động giả lập xem video hoàn thành nhanh.
  - `PLAY_ON_DESKTOP` / `PLAY_ON_XBOX` / `PLAY_ON_PLAYSTATION`: Tự động gửi tín hiệu giả lập chơi game trên PC/Console đủ thời lượng yêu cầu.
  - `PLAY_ACTIVITY` / `ACHIEVEMENT_IN_ACTIVITY`: Tự động hoàn thành các nhiệm vụ hoạt động và thành tựu trong Discord.
- 🎁 **Tự động nhận quà (Claim Rewards):** Tự động nhận thưởng ngay sau khi làm xong hoặc nhận thưởng cho các quest đã hoàn thành trước đó.
- 🛡️ **Xử lý giới hạn tần suất thông minh (Anti-RateLimit):** Tự động kiểm soát tần suất gọi API, không làm treo ứng dụng khi Discord giới hạn lượt nhận quest mới.
- 🔒 **Bảo mật token:** Token được mã hoá an toàn bằng khóa bảo mật của Windows (DPAPI), không lưu mật mã dưới dạng văn bản thô.
- 🔔 **Hỗ trợ Discord Webhook:** Tùy chọn gửi thông báo tự động về kênh Discord của bạn khi hoàn thành mỗi nhiệm vụ.

---

## 1. Hướng dẫn sử dụng (File chạy ngay không cần cài đặt)

Bạn có thể tải file chạy trực tiếp từ mục **Releases** trên GitHub hoặc tự đóng gói từ mã nguồn:

- **Tải trực tiếp:** Tải phiên bản mới nhất tại [AutoQuest Releases](https://github.com/tiendung-c/AutoQuest/releases) (file `AutoQuest-1.0.0-x64-portable.exe`).
- **Tự đóng gói:** Chạy `npm run build`, file `.exe` sẽ được tạo trong thư mục `release/`.

**Các bước sử dụng:**
1. Khởi chạy file **`AutoQuest-1.0.0-x64-portable.exe`**.
2. Nếu Windows SmartScreen hiển thị cảnh báo file mới build, chọn: **More info** → **Run anyway**.
3. Dán **Token Discord** của bạn vào ô nhập (hỗ trợ nút **Dán** tự động trích xuất token từ clipboard).
4. *(Tuỳ chọn)* Nhập **Webhook URL** nếu muốn nhận thông báo khi làm xong quest.
5. Bấm **Bắt đầu** và theo dõi tiến trình thực hiện ở danh sách nhiệm vụ và khung nhật ký.
6. Bấm **Dừng** bất cứ lúc nào nếu muốn tạm dừng.

---

## 2. Cách lấy token Discord cá nhân

> [!WARNING]
> **Bảo mật tài khoản:** Token đại diện cho quyền truy cập tài khoản của bạn. Tuyệt đối không chia sẻ token cho người khác. Nếu nghi ngờ lộ token, hãy đổi mật khẩu Discord ngay để vô hiệu hoá token cũ.

Cách lấy token qua trình duyệt (Chrome, Edge, Brave...):

1. Truy cập [discord.com/app](https://discord.com/app) và đăng nhập tài khoản Discord.
2. Bấm phím **F12** (hoặc `Ctrl + Shift + I`) để mở Công cụ cho nhà phát triển (DevTools).
3. Chuyển sang tab **Console** .
4. Dán script vào
```window.webpackChunkdiscord_app.push([
	[Symbol()],
	{},
	req => {
		if (!req.c) return;
		for (let m of Object.values(req.c)) {
			try {
				if (!m.exports || m.exports === window) continue;
				if (m.exports?.getToken) return copy(m.exports.getToken());
				for (let ex in m.exports) {
					if (m.exports?.[ex]?.getToken && m.exports[ex][Symbol.toStringTag] !== 'IntlMessagesProxy') return copy(m.exports[ex].getToken());
				}
			} catch {}
		}
	},
]);
```
window.webpackChunkdiscord_app.pop();
console.log('%cWorked!', 'font-size: 50px');
console.log(`%cYou now have your token in the clipboard!`, 'font-size: 16px');


---

## 3. Các loại nhiệm vụ được hỗ trợ

| Loại nhiệm vụ | Cơ chế xử lý |
| :--- | :--- |
| `WATCH_VIDEO` / `WATCH_VIDEO_ON_MOBILE` | Giả lập xem video tiến độ nhanh |
| `PLAY_ON_DESKTOP` | Giả lập chơi game trên máy tính (Heartbeat định kỳ) |
| `PLAY_ON_XBOX` / `PLAY_ON_PLAYSTATION` | Giả lập chơi game trên Console |
| `PLAY_ACTIVITY` | Giả lập hoạt động cuộc gọi thoại |
| `ACHIEVEMENT_IN_ACTIVITY` | Cấp quyền và xác nhận hoàn thành thành tựu |
| `STREAM_ON_DESKTOP` | *Không hỗ trợ tự động (cần mở Discord chia sẻ màn hình thủ công)* |

---

## 4. Xử lý các tình huống thường gặp

- **Bị giới hạn nhận quest (`RateLimit`):** Discord giới hạn mỗi tài khoản chỉ được nhận 1 quest mới qua API mỗi ~45 phút. Khi gặp thông báo này, bạn chỉ cần mở Discord lên và bấm **"Nhận nhiệm vụ" (Accept Quest)** cho các nhiệm vụ muốn làm, sau đó bấm **Bắt đầu** lại trên AutoQuest là bot sẽ cày tiếp ngay lập tức.
- **Yêu cầu Captcha khi nhận thưởng:** Một số nhiệm vụ Discord yêu cầu xác minh Captcha khi bấm nhận thưởng. Với các nhiệm vụ này, bot đã hoàn thành 100% tiến độ, bạn chỉ cần vào mục Gift Inventory (Kho quà) trên Discord bấm nút Nhận phần thưởng để giải captcha và nhận quà.
- **Token không hợp lệ:** Kiểm tra lại token Discord đã copy đúng định dạng chưa (gồm 3 đoạn ngăn cách bởi dấu chấm).

---

## 5. Dành cho lập trình viên (Chạy từ mã nguồn)

Yêu cầu: **Node.js 20+**, môi trường Windows 64-bit.

```powershell
# Cài đặt các thư viện phụ thuộc
npm install

# Chạy ứng dụng ở chế độ phát triển (Development)
npm run dev

# Đóng gói ứng dụng thành file portable .exe
npm run build
```

Các lệnh tiện ích khác:
- `npm run build:bot`: Biên dịch TypeScript cho lõi bot.
- `npm run icon`: Tự động tạo lại bộ icon ứng dụng (`resources/`).
- `npm run clean`: Dọn dẹp các thư mục build tạm thời.

---

## 6. Giấy phép

Dự án được phân phối dưới giấy phép **GPL-3.0 License**. Chi tiết xem tại file `LICENSE`.

