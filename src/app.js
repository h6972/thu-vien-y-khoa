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

  // --- Bình luận Giscus ---
  var gc = document.querySelector('.comments[data-repo-id]');
  if (gc) {
    var s = document.createElement('script');
    s.src = 'https://giscus.app/client.js'; s.async = true; s.crossOrigin = 'anonymous';
    var a = { repo: gc.dataset.repo, 'repo-id': gc.dataset.repoId, category: gc.dataset.category, 'category-id': gc.dataset.categoryId,
      mapping: 'pathname', strict: '1', 'reactions-enabled': '1', 'emit-metadata': '0', 'input-position': 'top',
      theme: 'preferred_color_scheme', lang: 'vi', loading: 'lazy' };
    Object.keys(a).forEach(function (k) { s.setAttribute('data-' + k, a[k]); });
    gc.appendChild(s);
  }
})();
