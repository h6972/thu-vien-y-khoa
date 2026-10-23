# Hướng dẫn vận hành web Thư Viện Y Khoa Online

Web là trang tĩnh, dựng bằng `node build.mjs` (không cần cài thư viện), chạy trên **Cloudflare Pages**.
Nội dung nằm trong thư mục `content/`: mỗi chuyên đề là 1 file `content/chuyen-de/<mã>.json`, cài đặt chung ở `content/site.json`.
Tên file chính là đường link: `udmi5.json` → `tenmien/udmi5/`. Link tới từng phần: `tenmien/udmi5/#phan-2`.

---

## 1. Đưa web lên Cloudflare Pages (làm 1 lần, ~10 phút)

1. Vào https://dash.cloudflare.com → đăng ký / đăng nhập.
2. Menu trái **Compute (Workers & Pages)** → **Create** → tab **Pages** → **Connect to Git** → chọn GitHub, cho phép truy cập repo `thu-vien-y-khoa`.
3. Ở màn hình cấu hình build:
   - Project name: `thu-vien-y-khoa` (thành địa chỉ `thu-vien-y-khoa.pages.dev`)
   - Production branch: `main`
   - Framework preset: **None**
   - Build command: `node build.mjs`
   - Build output directory: `dist`
4. Bấm **Save and Deploy**. Khoảng 1 phút sau web chạy ở `https://thu-vien-y-khoa.pages.dev`.

Từ đây, mỗi lần nội dung trên GitHub thay đổi (Claude đẩy code, hoặc anh sửa qua trang quản trị), Cloudflare tự dựng lại trong khoảng 1 phút.

## 2. Bật bộ đếm lượt tải (~3 phút)

1. Cloudflare → **Storage & Databases** → **KV** → **Create a namespace** → đặt tên `luot-tai`.
2. Vào project Pages `thu-vien-y-khoa` → **Settings** → **Bindings** → **Add** → **KV namespace**:
   - Variable name: `LUOT_TAI` (viết đúng chữ hoa)
   - KV namespace: `luot-tai`
3. Vào tab **Deployments** → bấm **Retry deployment** ở bản mới nhất để áp dụng.

Số lượt tải hiện dưới nút "Tải về" khi tài liệu có ít nhất 1 lượt. Chưa làm bước này thì nút tải vẫn chạy bình thường, chỉ không đếm.

## 3. Bật bình luận (không cần đăng nhập, ~5 phút)

Người xem chỉ gõ tên và nội dung; bình luận **chờ anh duyệt** mới hiện trên web.

1. Cloudflare → **Storage & Databases** → **D1 SQL Database** → **Create** → đặt tên `binh-luan` → Create. (Không cần tạo bảng, web tự tạo.)
2. Project Pages `thu-vien-y-khoa` → **Settings** → **Bindings** → **Add** → **D1 database**:
   - Variable name: `DB` (viết hoa)
   - D1 database: `binh-luan`
3. Vẫn trong **Settings** → **Variables and Secrets** → **Add** → kiểu **Secret**:
   - Variable name: `ADMIN_PASSWORD`
   - Value: mật khẩu quản trị anh tự đặt (dài, khó đoán; không gửi cho ai, kể cả Claude)
4. Tab **Deployments** → **Retry deployment** ở bản mới nhất.

**Duyệt bình luận:** mở `thuvienykhoa.online/quan-tri/` → nhập mật khẩu → tab **Chờ duyệt**:
- **Duyệt**: hiện lên web · **Ẩn**: gỡ khỏi web nhưng giữ lại · **Xoá**: xoá hẳn
- **Trả lời**: trả lời hiện dưới bình luận với tên "Thư Viện Y Khoa Online" (lưu trả lời = tự duyệt luôn)

Chống spam có sẵn: ô bẫy ẩn, chặn gửi quá nhanh, tối đa 5 bình luận/10 phút mỗi người.

## 4. Đăng ký email bằng Google Sheet (~5 phút)

1. Tạo Google Sheet mới, đặt tên ví dụ "Đăng ký Thư Viện Y Khoa".
2. Menu **Tiện ích mở rộng → Apps Script** → xoá code mẫu → dán toàn bộ nội dung file `docs/apps-script-dang-ky-email.gs` → bấm Lưu.
3. **Triển khai → Tùy chọn triển khai mới** → biểu tượng bánh răng → **Ứng dụng web**:
   - Thực thi với tư cách: **Tôi**
   - Người có quyền truy cập: **Bất kỳ ai**
   → **Triển khai** → cấp quyền khi được hỏi.
4. Chép **URL ứng dụng web** (dạng `https://script.google.com/macros/s/.../exec`) → dán vào **Cài đặt chung → URL Apps Script nhận email**.

Email đăng ký sẽ vào trang tính `DangKy`, tự bỏ qua email trùng.

## 5. Trang quản trị Pages CMS (sửa nội dung bằng trình duyệt, kể cả trên điện thoại)

1. Vào https://app.pagescms.org → **Sign in with GitHub** → cho phép truy cập repo `thu-vien-y-khoa`.
2. Chọn repo `h6972/thu-vien-y-khoa`, nhánh `main`.
3. Menu trái có 2 mục:
   - **Chuyên đề**: mở từng chuyên đề để dán link YouTube, link Drive, sửa tóm tắt, mốc thời gian…
   - **Cài đặt chung**: tên web, link mạng xã hội, URL Apps Script.
4. Sửa xong bấm **Save**. Cloudflare tự dựng lại web sau khoảng 1 phút.

Lưu ý khi sửa:
- **Link YouTube**: dán nguyên link video (`https://youtu.be/...` hoặc `https://www.youtube.com/watch?v=...`) hoặc chỉ ID 11 ký tự.
- **Link Google Drive**: chia sẻ file ở chế độ **Bất kỳ ai có đường liên kết – Người xem** rồi dán link.
- **Mã tài liệu** (`id`): đặt 1 lần, không đổi về sau, vì bộ đếm lượt tải dựa vào mã này.
- **Ẩn chuyên đề**: bật khi chưa muốn công khai (hiện chuyên đề Cúm 2026 đang ẩn).
- Chuyên khoa mới (ví dụ Thận, Thần kinh): nhờ Claude thêm, vì cần thêm màu và nhãn trong code.

## 6. Gắn tên miền riêng (khi đã mua)

- **Mua ở Cloudflare Registrar** (khuyên dùng): project Pages → **Custom domains** → **Set up a domain** → nhập tên miền → xác nhận. Xong.
- **Mua ở nơi khác** (Mắt Bão, PA Vietnam, Namecheap…): thêm tên miền vào Cloudflare (gói Free), đổi nameserver tại nơi mua sang 2 nameserver Cloudflare cung cấp, chờ kích hoạt, rồi làm như trên.
- Sau đó sửa **Cài đặt chung → Địa chỉ web** thành tên miền mới (dùng cho sitemap và link chia sẻ).

## Link dùng trong bài đăng

| Mục đích | Link |
|---|---|
| Trang chuyên đề (thay `[LINK_PLAYLIST]` hoặc link bio TikTok) | `tenmien/udmi5/` |
| Nhảy thẳng tới 1 phần | `tenmien/udmi5/#phan-3` |
| Khu tải tài liệu (thay `[LINK_BAN_DICH]`) | `tenmien/udmi5/#tai-lieu` |

Dẫn người xem qua trang chuyên đề thay vì link Drive trực tiếp, để vừa đếm được lượt tải vừa giữ người xem ở lại xem các phần khác.
