// Cloudflare Pages Function: /api/luot-tai → { "<id tài liệu>": số lượt tải }
export async function onRequestGet({ env }) {
  const out = {};
  if (env.LUOT_TAI) {
    let cursor;
    do {
      const page = await env.LUOT_TAI.list({ cursor });
      await Promise.all(page.keys.map(async k => { out[k.name] = parseInt((await env.LUOT_TAI.get(k.name)) || '0', 10); }));
      cursor = page.list_complete ? undefined : page.cursor;
    } while (cursor);
  }
  return new Response(JSON.stringify(out), {
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=60' },
  });
}
