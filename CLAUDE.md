# Thư Viện Y Khoa Online — ghi chú cho Claude

Web tĩnh tiếng Việt của kênh Thư Viện Y Khoa Online. Tập hợp các loạt video bài giảng guideline (repo video: h6972/video-y), tóm tắt, link tải bản dịch trên Google Drive.

## Cấu trúc
- `build.mjs` — bộ dựng không phụ thuộc thư viện: đọc `content/`, ghi `dist/`. Chạy `node build.mjs`. Lỗi nội dung → thoát mã 1 kèm danh sách lỗi.
- `content/site.json` — cài đặt chung (url, mạng xã hội, URL Apps Script email).
- `content/chuyen-de/<slug>.json` — 1 chuyên đề; slug = đường dẫn `/<slug>/`. Trường: `ten_ngan, tieu_de, chuyen_khoa (tim|tieu|hohap|nhiem|hoisuc|noitiet), nam, thu_tu, an, nguon, tom_tat, diem_chinh[], playlist, tai_lieu[{id,ten,loai(pdf|sotay|slide|bai),link,ghi_chu}], phan[{ten,youtube,phut,tinh_huong,moc["mm:ss Nhãn"]}]`.
- `src/style.css`, `src/app.js` — CSS và JS phía trình duyệt (vanilla), được copy vào `dist/assets/`.
- `functions/` — Cloudflare Pages Functions: `/tai/<id>` đếm lượt (KV binding `LUOT_TAI`) rồi 302 tới Drive; `/api/luot-tai` trả JSON số lượt; `/api/binh-luan` (đọc bình luận đã duyệt / gửi bình luận chờ duyệt) và `/api/quan-tri/binh-luan` (duyệt, ẩn, xoá, trả lời; header `Authorization: Bearer <ADMIN_PASSWORD>`). Bình luận lưu ở D1 binding `DB`, bảng `binh_luan` tự tạo; code dùng chung ở `lib/binh-luan-db.js`.
- `src/admin.js` + trang `/quan-tri/` (noindex) — giao diện duyệt bình luận.
- `.pages.yml` — cấu hình Pages CMS; khi thêm/đổi trường trong JSON phải cập nhật file này.
- `HUONG-DAN.md` — hướng dẫn tiếng Việt cho chủ web (Cloudflare, KV, D1 bình luận, Apps Script, Pages CMS, tên miền).

## Thêm chuyên đề mới (quy trình thường gặp)
1. Lấy dữ liệu từ tài liệu nguồn và bài đăng Facebook/YouTube đã soạn (mốc thời gian lấy từ phần "⏱️ Mốc thời gian").
2. Tạo `content/chuyen-de/<slug>.json` (slug ngắn, không dấu, ví dụ `kdigo2026`), `thu_tu` tiếp theo, `id` tài liệu dạng `<slug>-ban-dich`.
3. Để trống `youtube`/`link` nếu chưa có — web hiện "sắp cập nhật"/"Sắp có"; chủ web tự dán link qua Pages CMS.
4. `node build.mjs` để kiểm tra, rồi commit + push lên `main` (Cloudflare tự dựng).
5. Chuyên khoa mới: thêm vào `SPEC` trong build.mjs, token màu trong style.css (cả 2 theme) và options trong `.pages.yml`.

## Lưu ý
- Không đổi `id` tài liệu đã đăng (bộ đếm KV dựa vào id).
- Bản quyền: chỉ điền `link` bản dịch khi điều kiện nhà xuất bản cho phép (ATS 2026 đang chờ kiểm tra).
- Không ghi tên cá nhân của chủ web trên trang; chỉ dùng thương hiệu "Thư Viện Y Khoa Online".
- Giữ giọng văn: tiếng Việt chuyên môn, ngắn gọn, không emoji trên web.
