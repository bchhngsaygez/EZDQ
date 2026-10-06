# EZDQ — Easy Discord Quest (Web Platform)

<p align="center">
  <b>EZDQ (Easy Discord Quest) Web</b>: Giao diện Minimalist Dark tinh tế, hỗ trợ Song ngữ (Tiếng Việt / English), làm nhiều quest cùng lúc (Parallel Mode), tích hợp tự động giải CAPTCHA (CapSolver / 2Captcha / Anti-Captcha), bảo mật RAM-only tuyệt đối và tự động cập nhật trạng thái Discord.
</p>

---

## Những Điểm Cải Tiến Vượt Trội

### 1. Hỗ Trợ Song Ngữ (Tiếng Việt 🇻🇳 & English 🇺🇸)
- Nút chuyển đổi ngôn ngữ nhanh chóng ngay trên thanh điều hướng.
- Toàn bộ giao diện, trạng thái, nhật ký và modal hướng dẫn đều hỗ trợ đầy đủ 2 ngôn ngữ.

### 2. Làm Nhiều Nhiệm Vụ Cùng Lúc (Chế Độ Song Song / Parallel Mode)
- **Cày đồng thời nhiều quest:** Tự động chạy song song tất cả các nhiệm vụ khả dụng thay vì phải chờ từng quest hoàn thành.
- **Hệ thống giãn cách thông minh (Staggered Offsets):** Tự động lệch nhịp gửi tín hiệu 1.5s giữa các nhiệm vụ để tránh trùng lặp nhịp tim và không kích hoạt Rate-Limit của Discord.
- Tùy chọn chuyển đổi linh hoạt giữa chế độ **Song song** (mặc định) và **Tuần tự**.

### 3. Tự Động Giải CAPTCHA Khi Nhận Thưởng (Auto-Solve CAPTCHA - Tùy Chọn)
- Khi hoàn thành 100% tiến độ nhiệm vụ, một số quest yêu cầu xác thực hCaptcha để nhận thưởng.
- **Hỗ trợ 3 nhà cung cấp giải CAPTCHA hàng đầu:**
  - **CapSolver** (Khuyên dùng cho Discord hCaptcha)
  - **2Captcha**
  - **Anti-Captcha**
- **Tính năng hoàn toàn tùy chọn (Optional):**
  - Nếu có API Key: Bot tự động gửi giải CAPTCHA và nhận quà ngay lập tức.
  - Nếu không có: Bot vẫn cày xong 100% tiến độ và thông báo bạn mở app Discord nhận quà thủ công.
  - **Bảo mật API Key:** API Key giải CAPTCHA cũng được lưu tạm trong RAM và tự xóa sạch khi tải lại/đóng trang!

### 5. Bảo Mật Phiên Tuyệt Đối (Zero Persistence — Bay Màu Khi Reload)
- **Không lưu trữ bất kỳ dữ liệu nào:** Token Discord và API Key CAPTCHA không bao giờ được ghi vào `localStorage`, `sessionStorage`, `cookies`, hay ổ cứng.
- Token chỉ tồn tại trong bộ nhớ RAM của phiên duyệt hiện tại.
- Khi người dùng **tắt trình duyệt, đóng tab hoặc bấm F5 (Reload)**, dữ liệu tự hủy ngay lập tức không để lại bất kỳ dấu vết nào.
- Nút **" Xóa RAM"** giúp xóa ngay lập tức khỏi bộ nhớ chỉ với 1 click.
- Tự động mã hóa/che token trong toàn bộ hệ thống log (`[TOKEN_PROTECTED]`).

### 6. Tự Động Đặt Trạng Thái Discord
- Tự động cập nhật Custom Status của tài khoản Discord qua cả **Gateway WebSocket** và **REST API User Settings**.
- Tự động xóa trạng thái khi hoàn tất hoặc bấm Dừng.
- Có thể tùy chỉnh trang thái lúc làm quest tùy thích

---

## 🛠️ Hướng Dẫn Cài Đặt & Khởi Chạy

Yêu cầu môi trường: **Node.js >= 20** (hoặc Docker).

### Cách 1: Chạy trực tiếp (Local hoặc VPS)

```bash
# 1. Cài đặt các thư viện cần thiết
npm install

# 2. Build ứng dụng (biên dịch React client & TypeScript server)
npm run build

# 3. Khởi chạy máy chủ Web
npm start
```

Mở trình duyệt và truy cập: **`http://localhost:3000`** (hoặc `http://<IP-VPS>:3000`).

*(Tùy chọn đổi cổng: `$env:PORT=3001; npm start` trên PowerShell hoặc `PORT=3001 npm start` trên Linux).*

---

### Cách 2: Chạy chế độ phát triển (Development)

```bash
npm run dev
```

---

### Cách 3: Chạy bằng Docker / Docker Compose

```bash
docker compose up -d --build
```

---

## Hướng Dẫn Lấy Token Discord Cá Nhân

1. Mở Discord trên trình duyệt web (Chrome, Edge, Brave...) tại [discord.com/app](https://discord.com/app).
2. Nhấn phím **F12** (hoặc `Ctrl + Shift + I`) để mở **Developer Tools**.
3. Chuyển sang thẻ **Console**.
4. Dán đoạn mã sau và nhấn **Enter**:

```javascript
window.webpackChunkdiscord_app.push([
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
window.webpackChunkdiscord_app.pop();
console.log('%cĐã sao chép token vào Clipboard!', 'color: #5865F2; font-size: 20px;');
```

5. Token đã nằm sẵn trong Clipboard, bạn chỉ cần vào **AutoQuest Web** và bấm nút **"Dán"**.

---

## Xử Lý Khi Gặp RateLimit 429

- Discord giới hạn mỗi tài khoản chỉ nhận được 1 quest mới qua API mỗi ~45 phút.
- Khi gặp thông báo này, bạn chỉ cần mở Discord lên và bấm **"Nhận nhiệm vụ" (Accept Quest)** bằng tay cho các nhiệm vụ muốn làm, sau đó quay lại AutoQuest Web bấm **Bắt đầu cày quest** là bot sẽ cày xong ngay lập tức!

---

## Giấy Phép (License)

Dự án được phân phối theo giấy phép **GPL-3.0 License**. Chi tiết xem tại file `LICENSE`.
