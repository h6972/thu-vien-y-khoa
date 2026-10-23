// Dùng chung cho API bình luận (Cloudflare D1, binding tên "DB")
export const SCHEMA = `CREATE TABLE IF NOT EXISTS binh_luan (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trang TEXT NOT NULL,
  ten TEXT NOT NULL,
  noi_dung TEXT NOT NULL,
  tao_luc INTEGER NOT NULL,
  trang_thai TEXT NOT NULL DEFAULT 'cho',
  ip_hash TEXT,
  tra_loi TEXT,
  tra_loi_luc INTEGER
)`;

let ready = false;
export async function db(env) {
  if (!env.DB) return null;
  if (!ready) {
    await env.DB.prepare(SCHEMA).run();
    await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_bl_trang ON binh_luan (trang, trang_thai, tao_luc)').run();
    ready = true;
  }
  return env.DB;
}

export function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extra },
  });
}

export async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

// so sánh mật khẩu không lộ thời gian
export async function isAdmin(request, env) {
  const pw = env.ADMIN_PASSWORD;
  if (!pw) return false;
  const got = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!got) return false;
  const [a, b] = await Promise.all([sha256(got), sha256(pw)]);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export const clean = (s, max) => String(s ?? '').replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, max);
export const validSlug = s => /^[a-z0-9-]{1,60}$/.test(s);
