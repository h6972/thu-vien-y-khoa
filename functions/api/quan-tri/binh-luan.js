// Quản trị bình luận (cần header Authorization: Bearer <ADMIN_PASSWORD>)
// GET  /api/quan-tri/binh-luan?trang_thai=cho|duyet|an  → danh sách + số lượng mỗi trạng thái
// POST /api/quan-tri/binh-luan {hanh_dong: duyet|an|xoa|tra_loi, id, noi_dung?}
import { db, json, isAdmin, clean } from '../../../lib/binh-luan-db.js';

const TT = ['cho', 'duyet', 'an'];

export async function onRequestGet({ request, env }) {
  if (!env.ADMIN_PASSWORD) return json({ loi: 'Chưa đặt mật khẩu quản trị (biến ADMIN_PASSWORD).' }, 503);
  if (!(await isAdmin(request, env))) return json({ loi: 'Sai mật khẩu.' }, 401);
  const D = await db(env);
  if (!D) return json({ loi: 'Chưa gắn cơ sở dữ liệu D1 (binding DB).' }, 503);
  const tt = new URL(request.url).searchParams.get('trang_thai') || 'cho';
  if (!TT.includes(tt)) return json({ loi: 'Trạng thái không hợp lệ.' }, 400);
  const [{ results }, dem] = await Promise.all([
    D.prepare('SELECT id, trang, ten, noi_dung, tao_luc, trang_thai, tra_loi, tra_loi_luc FROM binh_luan WHERE trang_thai = ? ORDER BY tao_luc DESC LIMIT 300').bind(tt).all(),
    D.prepare('SELECT trang_thai, COUNT(*) AS n FROM binh_luan GROUP BY trang_thai').all(),
  ]);
  const so = { cho: 0, duyet: 0, an: 0 };
  dem.results.forEach(r => { so[r.trang_thai] = r.n; });
  return json({ ds: results, so });
}

export async function onRequestPost({ request, env }) {
  if (!env.ADMIN_PASSWORD) return json({ loi: 'Chưa đặt mật khẩu quản trị (biến ADMIN_PASSWORD).' }, 503);
  if (!(await isAdmin(request, env))) return json({ loi: 'Sai mật khẩu.' }, 401);
  const D = await db(env);
  if (!D) return json({ loi: 'Chưa gắn cơ sở dữ liệu D1 (binding DB).' }, 503);
  let b;
  try { b = await request.json(); } catch { return json({ loi: 'Dữ liệu không hợp lệ.' }, 400); }
  const id = Number(b.id);
  if (!Number.isInteger(id) || id < 1) return json({ loi: 'Thiếu mã bình luận.' }, 400);

  if (b.hanh_dong === 'duyet' || b.hanh_dong === 'an') {
    await D.prepare('UPDATE binh_luan SET trang_thai = ? WHERE id = ?').bind(b.hanh_dong, id).run();
  } else if (b.hanh_dong === 'xoa') {
    await D.prepare('DELETE FROM binh_luan WHERE id = ?').bind(id).run();
  } else if (b.hanh_dong === 'tra_loi') {
    const nd = clean(b.noi_dung, 4000);
    // trả lời cũng tự duyệt bình luận gốc; nội dung rỗng = xoá trả lời
    await D.prepare("UPDATE binh_luan SET tra_loi = ?, tra_loi_luc = ?, trang_thai = 'duyet' WHERE id = ?")
      .bind(nd || null, nd ? Date.now() : null, id).run();
  } else {
    return json({ loi: 'Hành động không hợp lệ.' }, 400);
  }
  return json({ ok: true });
}
