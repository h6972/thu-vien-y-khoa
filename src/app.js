// Thư Viện Y Khoa Online — script phía trình duyệt (không phụ thuộc thư viện)
(function () {
  // --- Lọc chuyên đề trên trang chủ ---
  document.querySelectorAll('[data-filter]').forEach(function (group) {
    var target = document.querySelector(group.getAttribute('data-filter'));
    group.addEventListener('click', function (e) {
      var b = e.target.closest('[data-v]'); if (!b) return;
      group.querySelectorAll('[data-v]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      var v = b.getAttribute('data-v'), shown = 0;
      target.querySelectorAll('[data-spec]').forEach(function (c) {
        var ok = v === 'all' || c.getAttribute('data-spec') === v;
        c.hidden = !ok; if (ok) shown++;
      });
      var empty = target.parentNode.querySelector('.empty'); if (empty) empty.hidden = shown > 0;
    });
  });

  // --- Thư viện: tìm kiếm + lọc ---
  var lib = document.getElementById('lib');
  if (lib) {
    var state = { s: 'all', k: 'all', q: '' };
    var draw = function () {
      var q = state.q.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase(), n = 0;
      lib.querySelectorAll('a').forEach(function (a) {
        var ok = (state.s === 'all' || a.dataset.spec === state.s) && (state.k === 'all' || a.dataset.kind === state.k) && (!q || a.dataset.text.indexOf(q) > -1);
        a.hidden = !ok; if (ok) n++;
      });
      document.getElementById('lib-empty').hidden = n > 0;
    };
    document.getElementById('q').addEventListener('input', function (e) { state.q = e.target.value; draw(); });
    document.querySelectorAll('[data-lib]').forEach(function (g) {
      g.addEventListener('click', function (e) {
        var b = e.target.closest('[data-v]'); if (!b) return;
        g.querySelectorAll('[data-v]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        state[g.getAttribute('data-lib')] = b.getAttribute('data-v'); draw();
      });
    });
  }

  // --- Video YouTube: chỉ tải khi người xem bấm ---
  function play(box, start) {
    var id = box.getAttribute('data-yt'); if (!id) return;
    var f = document.createElement('iframe');
    f.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&start=' + (start || 0);
    f.title = box.getAttribute('data-title') || 'Video bài giảng';
    f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    f.allowFullscreen = true;
    box.innerHTML = ''; box.appendChild(f);
  }
  document.querySelectorAll('.yt-poster').forEach(function (b) {
    b.addEventListener('click', function () { play(b.closest('.video'), 0); });
  });
  document.querySelectorAll('[data-seek]').forEach(function (b) {
    b.addEventListener('click', function () {
      var part = b.closest('.part'); var box = part.querySelector('.video');
      play(box, +b.getAttribute('data-seek'));
      part.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // --- Lượt tải (Cloudflare KV) ---
  var counters = document.querySelectorAll('[data-count]');
  if (counters.length) {
    fetch('/api/luot-tai').then(function (r) { return r.ok ? r.json() : {}; }).then(function (m) {
      counters.forEach(function (el) {
        var n = m[el.getAttribute('data-count')];
        if (n) { el.textContent = Number(n).toLocaleString('vi-VN') + ' lượt tải'; el.hidden = false; }
      });
    }).catch(function () {});
  }

  // --- Đăng ký email (Google Apps Script) ---
  document.querySelectorAll('form.sub').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = f.parentNode.querySelector('.sub-msg'), url = f.getAttribute('data-endpoint');
      var email = f.querySelector('input[type=email]').value.trim();
      msg.hidden = false;
      if (!url) { msg.textContent = 'Chức năng đăng ký đang được thiết lập, bạn quay lại sau nhé.'; return; }
      msg.textContent = 'Đang gửi…';
      fetch(url, { method: 'POST', mode: 'no-cors', body: new URLSearchParams({ email: email, trang: location.pathname }) })
        .then(function () { msg.textContent = 'Đã đăng ký. Cảm ơn bạn!'; f.reset(); })
        .catch(function () { msg.textContent = 'Chưa gửi được, bạn kiểm tra kết nối rồi thử lại.'; });
    });
  });

  // --- Bình luận (Cloudflare D1, không cần đăng nhập) ---
  document.querySelectorAll('.cmt[data-trang]').forEach(function (box) {
    var trang = box.getAttribute('data-trang');
    var list = box.querySelector('.cmt-list'), count = box.querySelector('.cmt-count');
    var form = box.querySelector('.cmt-form'), msg = box.querySelector('.cmt-msg');
    var opened = Date.now();
    var KEY = 'tvyk-ten';
    try { var saved = localStorage.getItem(KEY); if (saved) form.ten.value = saved; } catch (e) {}

    function load() {
      fetch('/api/binh-luan?trang=' + encodeURIComponent(trang)).then(function (r) { return r.json(); }).then(function (d) {
        if (!d.bat) { count.textContent = 'Khung bình luận đang được thiết lập.'; form.hidden = true; return; }
        list.innerHTML = '';
        d.ds.forEach(function (c) { list.appendChild(TVYK.renderComment(c)); });
        count.textContent = d.ds.length ? d.ds.length + ' bình luận' : 'Chưa có bình luận. Bạn hãy là người đầu tiên.';
      }).catch(function () { count.textContent = 'Chưa tải được bình luận.'; });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ten = form.ten.value.trim(), nd = form.noi_dung.value.trim();
      msg.hidden = false;
      if (ten.length < 2) { msg.textContent = 'Bạn nhập tên (ít nhất 2 ký tự) nhé.'; form.ten.focus(); return; }
      if (nd.length < 3) { msg.textContent = 'Nội dung bình luận còn trống.'; form.noi_dung.focus(); return; }
      var btn = form.querySelector('button[type=submit]'); btn.disabled = true;
      msg.textContent = 'Đang gửi…';
      fetch('/api/binh-luan', { method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ trang: trang, ten: ten, noi_dung: nd, web: form.web.value, t: opened }) })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
        .then(function (x) {
          if (x.ok) {
            msg.textContent = 'Đã gửi. Bình luận sẽ hiển thị sau khi được duyệt. Cảm ơn bạn!';
            form.noi_dung.value = '';
            try { localStorage.setItem(KEY, ten); } catch (e) {}
          } else msg.textContent = x.d.loi || 'Chưa gửi được, bạn thử lại nhé.';
        })
        .catch(function () { msg.textContent = 'Chưa gửi được, bạn kiểm tra kết nối rồi thử lại.'; })
        .then(function () { btn.disabled = false; });
    });
    load();
  });
})();

// Dùng chung cho trang chuyên đề và trang quản trị
var TVYK = {
  time: function (ms) {
    try { return new Date(ms).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    catch (e) { return ''; }
  },
  el: function (tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; },
  renderComment: function (c) {
    var li = TVYK.el('li', 'cmt-item');
    var head = TVYK.el('div', 'cmt-head');
    head.appendChild(TVYK.el('strong', null, c.ten));
    head.appendChild(TVYK.el('time', null, TVYK.time(c.tao_luc)));
    li.appendChild(head);
    li.appendChild(TVYK.el('p', 'cmt-body', c.noi_dung));
    if (c.tra_loi) {
      var r = TVYK.el('div', 'cmt-reply');
      var rh = TVYK.el('div', 'cmt-head');
      rh.appendChild(TVYK.el('strong', null, 'Thư Viện Y Khoa Online'));
      rh.appendChild(TVYK.el('span', 'cmt-badge', 'Trả lời'));
      r.appendChild(rh);
      r.appendChild(TVYK.el('p', 'cmt-body', c.tra_loi));
      li.appendChild(r);
    }
    return li;
  }
};
