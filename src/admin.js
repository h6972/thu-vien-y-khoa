// Trang /quan-tri/ — duyệt, ẩn, xoá, trả lời bình luận
(function () {
  var KEY = 'tvyk-admin';
  var login = document.getElementById('adm-login'), msg = document.getElementById('adm-msg');
  var main = document.getElementById('adm-main'), list = document.getElementById('adm-list');
  var tabs = document.getElementById('adm-tabs');
  var pw = '', tt = 'cho';
  try { pw = sessionStorage.getItem(KEY) || ''; } catch (e) {}

  function say(t) { msg.textContent = t; msg.hidden = !t; }
  function api(method, body, q) {
    return fetch('/api/quan-tri/binh-luan' + (q || ''), {
      method: method,
      headers: { 'authorization': 'Bearer ' + pw, 'content-type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    }).then(function (r) { return r.json().then(function (d) { if (!r.ok) throw new Error(d.loi || 'Lỗi ' + r.status); return d; }); });
  }

  function load() {
    say('Đang tải…');
    api('GET', null, '?trang_thai=' + tt).then(function (d) {
      try { sessionStorage.setItem(KEY, pw); } catch (e) {}
      login.hidden = true; main.hidden = false; say('');
      tabs.querySelectorAll('[data-tt]').forEach(function (b) {
        b.setAttribute('aria-pressed', b.dataset.tt === tt ? 'true' : 'false');
        b.querySelector('.num').textContent = '(' + (d.so[b.dataset.tt] || 0) + ')';
      });
      list.innerHTML = '';
      if (!d.ds.length) { list.appendChild(TVYK.el('li', 'empty', 'Không có bình luận nào ở mục này.')); return; }
      d.ds.forEach(function (c) { list.appendChild(row(c)); });
    }).catch(function (e) {
      say(e.message);
      if (/mật khẩu/i.test(e.message)) { pw = ''; try { sessionStorage.removeItem(KEY); } catch (x) {} login.hidden = false; main.hidden = true; }
    });
  }

  function act(body, done) {
    api('POST', body).then(function () { if (done) done(); load(); }).catch(function (e) { say(e.message); });
  }

  function row(c) {
    var li = TVYK.renderComment(c);
    var where = TVYK.el('a', 'cmt-where', '/' + c.trang + '/');
    where.href = '/' + c.trang + '/#binh-luan'; where.target = '_blank'; where.rel = 'noopener';
    li.insertBefore(where, li.firstChild);
    var bar = TVYK.el('div', 'chips');
    function btn(label, fn, ghost) { var b = TVYK.el('button', 'btn' + (ghost ? ' ghost' : ''), label); b.type = 'button'; b.onclick = fn; bar.appendChild(b); }
    if (c.trang_thai !== 'duyet') btn('Duyệt', function () { act({ hanh_dong: 'duyet', id: c.id }); });
    if (c.trang_thai !== 'an') btn('Ẩn', function () { act({ hanh_dong: 'an', id: c.id }); }, true);
    btn(c.tra_loi ? 'Sửa trả lời' : 'Trả lời', function () { box.hidden = !box.hidden; if (!box.hidden) ta.focus(); }, true);
    btn('Xoá', function () { if (window.confirm('Xoá hẳn bình luận này?')) act({ hanh_dong: 'xoa', id: c.id }); }, true);
    li.appendChild(bar);
    var box = TVYK.el('div', 'adm-reply'); box.hidden = true;
    var ta = TVYK.el('textarea'); ta.rows = 3; ta.value = c.tra_loi || ''; ta.placeholder = 'Trả lời với tên Thư Viện Y Khoa Online (để trống rồi lưu = xoá trả lời)';
    ta.setAttribute('aria-label', 'Nội dung trả lời');
    var save = TVYK.el('button', 'btn', 'Lưu trả lời (tự duyệt bình luận)'); save.type = 'button';
    save.onclick = function () { act({ hanh_dong: 'tra_loi', id: c.id, noi_dung: ta.value }); };
    box.appendChild(ta); box.appendChild(save);
    li.appendChild(box);
    return li;
  }

  login.addEventListener('submit', function (e) { e.preventDefault(); pw = document.getElementById('adm-pw').value; load(); });
  tabs.addEventListener('click', function (e) {
    var b = e.target.closest('[data-tt]'); if (b) { tt = b.dataset.tt; load(); }
  });
  document.getElementById('adm-out').onclick = function () {
    pw = ''; try { sessionStorage.removeItem(KEY); } catch (e) {}
    main.hidden = true; login.hidden = false; say('Đã đăng xuất.');
  };
  if (pw) load();
})();
