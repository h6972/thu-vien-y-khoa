/**
 * Nhận email đăng ký từ web Thư Viện Y Khoa Online và ghi vào Google Sheet.
 * Cách cài: xem HUONG-DAN.md, mục "Đăng ký email".
 * Sheet cần có trang tính tên "DangKy" (script sẽ tự tạo nếu chưa có).
 */
function doPost(e) {
  var email = String((e.parameter && e.parameter.email) || '').trim().toLowerCase();
  var trang = String((e.parameter && e.parameter.trang) || '');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return ContentService.createTextOutput('invalid');
  }
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('DangKy') || ss.insertSheet('DangKy');
  if (sh.getLastRow() === 0) sh.appendRow(['Thời gian', 'Email', 'Trang đăng ký']);
  var lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    var existing = sh.getLastRow() > 1 ? sh.getRange(2, 2, sh.getLastRow() - 1, 1).getValues().flat() : [];
    if (existing.indexOf(email) === -1) sh.appendRow([new Date(), email, trang]);
  } finally {
    lock.releaseLock();
  }
  return ContentService.createTextOutput('ok');
}
