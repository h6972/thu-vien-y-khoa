// GET  /api/binh-luan?trang=<slug>  → bình luận đã duyệt của trang
// POST /api/binh-luan  {trang, ten, noi_dung, web (bẫy spam), t (thời điểm mở form)} → lưu ở trạng thái chờ duyệt
import { db, json, sha256, clean, validSlug } from '../../lib/binh-luan-db.js';

export async function onRequestGet({ request, env }) {
  const D = await db(env);
  if (!D) return json({ bat: false, ds: [] });
  const trang = new URL(request.url).searchParams.get('trang') || '';
  if (!validSlug(trang)) return json({ loi: 'Trang không hợp lệ' }, 400);
  const { results } = await D.prepare(
    "SELECT id, ten, noi_dung, tao_luc, tra_loi, tra_loi_luc FROM binh_luan WHERE trang = ? AND trang_thai = 'duyet' ORDER BY tao_luc ASC LIMIT 500"
  ).bind(trang).all();
  return json({ bat: true, ds: results });
}

export async function onRequestPost({ request, env }) {
  const D = await db(env);
  if (!D) return json({ loi: 'Khung bình luận chưa được bật.' }, 503);
  let body;
  try { body = await request.json(); } catch { return json({ loi: 'Dữ liệu không hợp lệ.' }, 400); }

  const trang = clean(body.trang, 60);
  const ten = clean(body.ten, 60);
  const noi_dung = clean(body.noi_dung, 2000);
  if (!validSlug(trang)) return json({ loi: 'Trang không hợp lệ.' }, 400);
  if (ten.length < 2) return json({ loi: 'Bạn nhập tên (ít nhất 2 ký tự) nhé.' }, 400);
  if (noi_dung.length < 3) return json({ loi: 'Nội dung bình luận còn trống.' }, 400);

  // Chống spam: ô bẫy phải trống, form phải mở ít nhất 3 giây; với máy tự động thì giả vờ thành công
  const elapsed = Date.now() - Number(body.t || 0);
  if (body.web || !(elapsed > 3000)) return json({ ok: true });

  const ip = request.headers.get('cf-connecting-ip') || 'khong-ro';
  const ip_hash = (await sha256(ip + '|' + (env.ADMIN_PASSWORD || 'tvyk'))).slice(0, 32);
  const since = Date.now() - 10 * 60 * 1000;
  const { n } = await D.prepare('SELECT COUNT(*) AS n FROM binh_luan WHERE ip_hash = ? AND tao_luc > ?').bind(ip_hash, since).first();
  if (n >= 5) return json({ loi: 'Bạn gửi hơi nhiều, vui lòng thử lại sau ít phút.' }, 429);

  await D.prepare("INSERT INTO binh_luan (trang, ten, noi_dung, tao_luc, trang_thai, ip_hash) VALUES (?, ?, ?, ?, 'cho', ?)")
    .bind(trang, ten, noi_dung, Date.now(), ip_hash).run();
  return json({ ok: true });
}
