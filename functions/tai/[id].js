// Cloudflare Pages Function: /tai/<id> → đếm lượt tải (KV "LUOT_TAI", nếu đã gắn) rồi chuyển tới Google Drive
export async function onRequestGet({ params, env, request }) {
  const id = String(params.id || '').replace(/\/$/, '');
  let map = {};
  try {
    const res = await env.ASSETS.fetch(new URL('/downloads.json', request.url));
    if (res.ok) map = await res.json();
  } catch (_) { /* dùng map rỗng */ }
  const link = map[id];
  if (!link) {
    return new Response('Không tìm thấy tài liệu này. Bạn quay lại trang chuyên đề để lấy link mới nhé.', {
      status: 404, headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  }
  const bot = /bot|crawl|spider|facebookexternalhit|preview/i.test(request.headers.get('user-agent') || '');
  if (env.LUOT_TAI && !bot) {
    try {
      const n = parseInt((await env.LUOT_TAI.get(id)) || '0', 10);
      await env.LUOT_TAI.put(id, String(n + 1));
    } catch (_) { /* không chặn việc tải nếu đếm lỗi */ }
  }
  return Response.redirect(link, 302);
}
