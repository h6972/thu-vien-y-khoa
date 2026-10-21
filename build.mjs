// Dựng web tĩnh Thư Viện Y Khoa Online vào thư mục dist/ — chạy: node build.mjs
// Không phụ thuộc thư viện ngoài. Nội dung lấy từ content/site.json và content/chuyen-de/*.json
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';

const ROOT = dirname(new URL(import.meta.url).pathname);
const OUT = join(ROOT, 'dist');
const site = JSON.parse(readFileSync(join(ROOT, 'content/site.json'), 'utf8'));
const BASE = (site.url || '').replace(/\/$/, '');

const SPEC = {
  tim: { ten: 'Tim mạch', mau: 'var(--tim)' },
  tieu: { ten: 'Tiêu hoá', mau: 'var(--tieu)' },
  hohap: { ten: 'Hô hấp', mau: 'var(--hohap)' },
  nhiem: { ten: 'Truyền nhiễm', mau: 'var(--nhiem)' },
};
const LOAI = { pdf: ['Bản dịch / PDF', 'PDF'], sotay: ['Sổ tay HTML', 'HTML'], slide: ['Slide', 'PPT'], bai: ['Bài viết', 'DOC'], video: ['Video', '▶'] };

// ---------- đọc & kiểm tra nội dung ----------
const loi = [];
const all = readdirSync(join(ROOT, 'content/chuyen-de')).filter(f => f.endsWith('.json')).map(f => {
  const slug = f.replace(/\.json$/, '');
  let t;
  try { t = JSON.parse(readFileSync(join(ROOT, 'content/chuyen-de', f), 'utf8')); }
  catch (e) { loi.push(`${f}: JSON không hợp lệ (${e.message})`); return null; }
  t.slug = slug;
  if (!SPEC[t.chuyen_khoa]) loi.push(`${f}: chuyen_khoa "${t.chuyen_khoa}" phải là một trong ${Object.keys(SPEC).join(', ')}`);
  for (const k of ['ten_ngan', 'tieu_de', 'tom_tat']) if (!t[k]) loi.push(`${f}: thiếu "${k}"`);
  t.phan = t.phan || []; t.tai_lieu = t.tai_lieu || []; t.diem_chinh = t.diem_chinh || [];
  t.tai_lieu.forEach((d, i) => { if (!d.id) d.id = `${slug}-${i + 1}`; });
  t.phan.forEach(p => { p.yt = ytId(p.youtube); p.moc = (p.moc || []).map(parseMoc).filter(Boolean); });
  t.tong_phut = t.phan.reduce((s, p) => s + (+p.phut || 0), 0);
  return t;
}).filter(Boolean);
const ids = new Set();
all.forEach(t => t.tai_lieu.forEach(d => { if (ids.has(d.id)) loi.push(`Trùng id tài liệu "${d.id}"`); ids.add(d.id); }));
if (loi.length) { console.error('Lỗi nội dung:\n- ' + loi.join('\n- ')); process.exit(1); }

const topics = all.filter(t => !t.an).sort((a, b) => (a.thu_tu ?? 99) - (b.thu_tu ?? 99));

function ytId(v) {
  if (!v) return '';
  const m = String(v).match(/(?:youtu\.be\/|[?&]v=|embed\/|shorts\/|live\/)([\w-]{11})/);
  if (m) return m[1];
  return /^[\w-]{11}$/.test(v) ? v : '';
}
function parseMoc(line) {
  const m = String(line).trim().match(/^((?:\d+:)?\d{1,2}:\d{2})\s+(.+)$/);
  if (!m) return null;
  const s = m[1].split(':').map(Number).reduce((a, x) => a * 60 + x, 0);
  return { t: m[1], s, nhan: m[2] };
}
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const strip = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();

// ---------- khung trang ----------
function page({ title, desc, path, body, nav }) {
  const full = title ? `${title} · ${site.ten}` : site.ten;
  const url = BASE + path;
  const navs = [['/', 'Trang chủ', 'home'], ['/thu-vien/', 'Thư viện', 'thuvien'], ['/gioi-thieu/', 'Giới thiệu', 'gioithieu']];
  return `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(full)}</title>
<meta name="description" content="${esc(desc || site.mo_ta)}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(site.ten)}">
<meta property="og:title" content="${esc(title || site.ten)}">
<meta property="og:description" content="${esc(desc || site.mo_ta)}">
<meta property="og:url" content="${esc(url)}">
<meta name="theme-color" content="#0b6b66">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&family=Newsreader:opsz,wght@6..72,500;6..72,600&family=JetBrains+Mono:wght@500&display=swap">
<link rel="stylesheet" href="/assets/style.css?v=${BUILD}">
</head>
<body>
<header class="top"><div class="wrap">
  <a class="brand" href="/">${LOGO}${esc(site.ten)}</a>
  <nav class="main" aria-label="Điều hướng">${navs.map(([h, t, k]) => `<a href="${h}"${nav === k ? ' aria-current="page"' : ''}>${t}</a>`).join('')}</nav>
</div></header>
<main class="wrap">${body}</main>
<footer><div class="wrap">
  <span>© ${new Date().getFullYear()} ${esc(site.ten)}</span>
  <span>Tài liệu phục vụ mục đích giáo dục cho nhân viên y tế, không thay thế hướng dẫn chính thức và đánh giá lâm sàng.</span>
  ${socials()}
</div></footer>
<script src="/assets/app.js?v=${BUILD}" defer></script>
</body>
</html>`;
}
const BUILD = Date.now().toString(36);
const LOGO = `<svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true"><rect x="1" y="1" width="24" height="24" rx="6" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 14h5l2-5 3 9 2-4h6" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
function socials() {
  const l = [['youtube_kenh', 'YouTube'], ['facebook', 'Facebook'], ['tiktok', 'TikTok']].filter(([k]) => site[k]);
  return l.length ? `<span>${l.map(([k, n]) => `<a href="${esc(site[k])}" target="_blank" rel="noopener">${n}</a>`).join(' · ')}</span>` : '';
}
function follow() {
  const l = [['youtube_kenh', 'YouTube', 'Trọn bộ video bài giảng theo từng loạt'], ['facebook', 'Facebook', 'Bài đăng tóm tắt và thông báo chuyên đề mới'], ['tiktok', 'TikTok', 'Video ngắn ôn nhanh điểm chính']].filter(([k]) => site[k]);
  if (!l.length) return '';
  return `<section><h2>Theo dõi kênh</h2><div class="dl">${l.map(([k, n, m]) => `<a href="${esc(site[k])}" target="_blank" rel="noopener"><span><strong>${n}</strong><small>${m}</small></span><span class="go">Mở</span></a>`).join('')}</div></section>`;
}
function subscribe() {
  return `<section><div class="box">
<h2>Nhận chuyên đề mới qua email</h2>
<p class="lede">Mỗi khi có loạt bài mới, bạn nhận một email ngắn kèm link video và tài liệu.</p>
<form class="sub" data-endpoint="${esc(site.email_apps_script_url || '')}"><label class="sr" for="em">Email</label>
<input id="em" type="email" required autocomplete="email" placeholder="ten@benhvien.vn"><button class="btn" type="submit">Đăng ký</button></form>
<p class="sub-msg" role="status" hidden></p></div></section>`;
}
const specChips = (attr, allLabel) => `<div class="chips" role="group" ${attr}><button class="chip" data-v="all" aria-pressed="true">${allLabel}</button>${Object.entries(SPEC).filter(([k]) => topics.some(t => t.chuyen_khoa === k)).map(([k, v]) => `<button class="chip" data-v="${k}" aria-pressed="false">${v.ten}</button>`).join('')}</div>`;

// ---------- trang chủ ----------
function card(t) {
  const s = SPEC[t.chuyen_khoa];
  return `<a class="card" href="/${t.slug}/" data-spec="${t.chuyen_khoa}" style="--c:${s.mau}">
<div class="band"></div><div class="meta"><span class="tag">${s.ten}</span><span class="num">${t.phan.length} phần${t.tong_phut ? ` · ${t.tong_phut} phút` : ''}</span></div>
<h3>${esc(t.ten_ngan)}</h3><p>${esc(t.tieu_de)}</p></a>`;
}
const home = page({ path: '/', nav: 'home', body: `<div class="hero">
<svg class="trace" viewBox="0 0 400 42" preserveAspectRatio="none" aria-hidden="true"><path d="M0 26H120l8-14 10 26 8-30 9 18h60l6-6 6 6H400" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>
<span class="eyebrow">Bài giảng video · Bản dịch guideline</span>
<h1>Guideline mới, giảng bằng tiếng Việt</h1>
<p class="lede">Mỗi chuyên đề gồm phần tóm tắt, toàn bộ video bài giảng theo phần và link tải bản dịch. Nội dung dành cho bác sĩ, điều dưỡng và sinh viên y khoa, ưu tiên góc nhìn hồi sức cấp cứu.</p>
</div>
<section><div class="row"><h2>Chuyên đề</h2>${specChips('data-filter="#topics" aria-label="Lọc theo chuyên khoa"', 'Tất cả')}</div>
<div class="grid" id="topics">${topics.map(card).join('')}</div><p class="empty" hidden>Chưa có chuyên đề.</p></section>
${subscribe()}` });

// ---------- trang chuyên đề ----------
function topicPage(t) {
  const s = SPEC[t.chuyen_khoa];
  const nhieu = t.phan.length > 1;
  const parts = t.phan.map((p, i) => {
    const ten = (nhieu ? `Phần ${i + 1}: ` : '') + p.ten;
    const video = p.yt
      ? `<div class="video" data-yt="${p.yt}" data-title="${esc(ten)}"><button class="yt-poster" type="button" aria-label="Phát video: ${esc(ten)}"><img src="https://i.ytimg.com/vi/${p.yt}/hqdefault.jpg" alt="" loading="lazy" width="480" height="360"><span class="yt-play"><svg width="22" height="26" viewBox="0 0 16 18"><path d="M0 0l16 9-16 9z"/></svg></span></button></div>`
      : `<div class="video"><div class="yt-empty">Video phần này sắp được cập nhật</div></div>`;
    const moc = p.moc.length ? `<details${i === 0 ? ' open' : ''}><summary>Mốc thời gian (${p.moc.length})</summary><ul class="chap">${p.moc.map(m => `<li><button type="button" data-seek="${m.s}"${p.yt ? '' : ' disabled'}><span class="num">${m.t}</span><span>${esc(m.nhan)}</span></button></li>`).join('')}</ul></details>` : '';
    return `<article class="part" id="phan-${i + 1}">
<div class="part-head"><h3>${esc(ten)}</h3>${p.phut ? `<span class="num">${p.phut} phút</span>` : ''}</div>
${video}
${p.tinh_huong ? `<p class="q"><strong>Tình huống:</strong> ${esc(p.tinh_huong)}</p>` : ''}
${moc}</article>`;
  }).join('');
  const docs = t.tai_lieu.map(d => {
    const l = LOAI[d.loai] || LOAI.pdf;
    const info = `<span><strong>${esc(d.ten)}</strong><small>${l[0]}${d.ghi_chu ? ' · ' + esc(d.ghi_chu) : ''}</small></span>`;
    return d.link
      ? `<a href="/tai/${esc(d.id)}/" target="_blank" rel="noopener">${info}<span class="go">Tải về<span class="count" data-count="${esc(d.id)}" hidden></span></span></a>`
      : `<div class="soon">${info}<span class="go">Sắp có</span></div>`;
  }).join('');
  const gs = site.giscus || {};
  const comments = gs.repo_id && gs.category_id
    ? `<div class="comments" data-repo="${esc(gs.repo)}" data-repo-id="${esc(gs.repo_id)}" data-category="${esc(gs.category)}" data-category-id="${esc(gs.category_id)}"></div>`
    : `<div class="comments-empty">Khung bình luận đang được thiết lập.</div>`;
  const body = `<div class="stack" style="--c:${s.mau}">
<div class="topic-head"><div class="meta"><span class="tag">${s.ten}</span><span class="num">${t.nam || ''} · ${t.phan.length} phần${t.tong_phut ? ` · ${t.tong_phut} phút` : ''}</span></div>
<h1>${esc(t.tieu_de)}</h1><p class="lede">${esc(t.tom_tat)}</p>
<div class="chips">${t.tai_lieu.length ? `<a class="btn" href="#tai-lieu">Tải tài liệu</a>` : ''}${t.playlist ? `<a class="btn ghost" href="${esc(t.playlist)}" target="_blank" rel="noopener">Danh sách phát YouTube</a>` : ''}</div></div>
${t.diem_chinh.length ? `<section><h2>Điểm cần nhớ</h2><ul class="keys">${t.diem_chinh.map(k => `<li>${esc(k)}</li>`).join('')}</ul></section>` : ''}
<section><h2>Video bài giảng</h2>${parts}</section>
${t.tai_lieu.length ? `<section id="tai-lieu"><h2>Tài liệu tải về</h2><div class="dl">${docs}</div></section>` : ''}
<p class="notice">Nguồn: ${esc(t.nguon)}.</p>
<section><h2>Thảo luận</h2>${comments}</section>
${subscribe()}</div>`;
  return page({ title: t.ten_ngan, desc: t.tom_tat.slice(0, 160), path: `/${t.slug}/`, body });
}

// ---------- thư viện ----------
function library() {
  const items = [];
  topics.forEach(t => {
    t.tai_lieu.forEach(d => items.push({ t, ten: d.ten, loai: d.loai in LOAI ? d.loai : 'pdf', phu: (LOAI[d.loai] || LOAI.pdf)[0] + (d.link ? '' : ' · Sắp có'), href: `/${t.slug}/#tai-lieu` }));
    t.phan.forEach((p, i) => items.push({ t, ten: (t.phan.length > 1 ? `Phần ${i + 1}: ` : '') + p.ten, loai: 'video', phu: `Video${p.phut ? ` · ${p.phut} phút` : ''}${p.yt ? '' : ' · Sắp có'}`, href: `/${t.slug}/#phan-${i + 1}`, extra: p.moc.map(m => m.nhan).join(' ') }));
  });
  const kinds = Object.entries(LOAI).filter(([k]) => items.some(x => x.loai === k));
  const rows = items.map(x => {
    const s = SPEC[x.t.chuyen_khoa];
    const text = strip([x.ten, x.t.ten_ngan, x.t.tieu_de, x.t.diem_chinh.join(' '), x.extra || ''].join(' '));
    return `<a href="${x.href}" data-spec="${x.t.chuyen_khoa}" data-kind="${x.loai}" data-text="${esc(text)}" style="--c:${s.mau}"><span class="ic">${LOAI[x.loai][1]}</span><span class="t"><strong>${esc(x.ten)}</strong><small>${esc(x.t.ten_ngan)} · ${esc(x.phu)}</small></span></a>`;
  }).join('');
  return page({ title: 'Thư viện', path: '/thu-vien/', nav: 'thuvien', desc: 'Toàn bộ video bài giảng và bản dịch guideline của Thư Viện Y Khoa Online.', body: `<div class="stack"><span class="eyebrow">Toàn bộ tài liệu</span><h1>Thư viện</h1>
<label class="sr" for="q">Tìm kiếm</label><input id="q" class="search" type="search" placeholder="Tìm: troponin, Ringer lactat, HFNC…">
${specChips('data-lib="s" aria-label="Chuyên khoa"', 'Mọi chuyên khoa')}
<div class="chips" role="group" data-lib="k" aria-label="Loại tài liệu"><button class="chip" data-v="all" aria-pressed="true">Mọi loại</button>${kinds.map(([k, v]) => `<button class="chip" data-v="${k}" aria-pressed="false">${v[0]}</button>`).join('')}</div>
<div class="lib" id="lib">${rows}</div><p class="empty" id="lib-empty" hidden>Không tìm thấy tài liệu phù hợp.</p></div>` });
}

// ---------- giới thiệu, 404 ----------
const about = page({ title: 'Giới thiệu', path: '/gioi-thieu/', nav: 'gioithieu', body: `<div class="stack"><span class="eyebrow">Giới thiệu</span><h1>Về ${esc(site.ten)}</h1>
<p class="lede">${esc(site.ten)} là kênh chia sẻ kiến thức y khoa cho nhân viên y tế. Mỗi guideline quốc tế mới được dịch sang tiếng Việt, tóm tắt thành loạt video bài giảng và kèm tình huống lâm sàng tại hồi sức.</p>
<section><h2>Bản quyền tài liệu</h2><p class="lede">Bản dịch chỉ được chia sẻ khi điều kiện của nhà xuất bản cho phép. Với tài liệu bị hạn chế, trang chỉ đăng tóm tắt và video, kèm thông tin để bạn tìm bản gốc.</p></section>
${follow()}
<section><h2>Đề xuất chuyên đề</h2><p class="lede">Để lại bình luận ở cuối mỗi chuyên đề hoặc nhắn qua trang mạng xã hội của kênh.</p></section></div>` });
const notFound = page({ title: 'Không tìm thấy trang', path: '/404', body: `<div class="stack"><h1>Không tìm thấy trang</h1><p class="lede">Đường link có thể đã đổi. Bạn xem danh sách chuyên đề ở trang chủ hoặc tìm trong thư viện.</p><div class="chips"><a class="btn" href="/">Về trang chủ</a><a class="btn ghost" href="/thu-vien/">Mở thư viện</a></div></div>` });

// ---------- ghi ra dist/ ----------
rmSync(OUT, { recursive: true, force: true });
const put = (p, s) => { const f = join(OUT, p); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, s); };
put('index.html', home);
topics.forEach(t => put(`${t.slug}/index.html`, topicPage(t)));
put('thu-vien/index.html', library());
put('gioi-thieu/index.html', about);
put('404.html', notFound);
mkdirSync(join(OUT, 'assets'), { recursive: true });
copyFileSync(join(ROOT, 'src/style.css'), join(OUT, 'assets/style.css'));
copyFileSync(join(ROOT, 'src/app.js'), join(OUT, 'assets/app.js'));
put('favicon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 26 26"><rect x="1" y="1" width="24" height="24" rx="6" fill="#0b6b66"/><path d="M4 14h5l2-5 3 9 2-4h6" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg>`);

// link tải: Cloudflare Function /tai/<id> đếm lượt rồi chuyển hướng; trang tĩnh dưới đây là dự phòng
const dl = {};
all.forEach(t => t.tai_lieu.forEach(d => { if (d.link) dl[d.id] = d.link; }));
put('downloads.json', JSON.stringify(dl, null, 1));
Object.entries(dl).forEach(([id, link]) => put(`tai/${id}/index.html`, `<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0;url=${esc(link)}"><title>Đang chuyển tới tài liệu…</title><p>Đang chuyển tới tài liệu… <a href="${esc(link)}">Bấm vào đây nếu trang không tự chuyển</a>.</p>`));

const urls = ['/', '/thu-vien/', '/gioi-thieu/', ...topics.map(t => `/${t.slug}/`)];
put('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(u => `<url><loc>${BASE}${u}</loc></url>`).join('')}</urlset>\n`);
put('robots.txt', `User-agent: *\nDisallow: /tai/\nSitemap: ${BASE}/sitemap.xml\n`);

console.log(`Đã dựng ${topics.length} chuyên đề (${all.length - topics.length} đang ẩn), ${Object.keys(dl).length} link tải → dist/`);
