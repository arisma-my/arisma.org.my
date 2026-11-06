/** @OnlyCurrentDoc */
/**
 * ARISMA — otak laman web (Google Apps Script)
 *
 * Tampal seluruh fail ini dalam Google Sheet anda:
 *   Extensions > Apps Script > padam kod asal > tampal > Save.
 * Kemudian ikut langkah dalam BACA-SAYA.md.
 *
 * Prinsip keselamatan:
 *  - doGet HANYA memulangkan tab awam (senarai TAB_AWAM). Tab lain tidak pernah keluar.
 *  - Tiada doPost: Sheet ini tidak menerima data daripada luar.
 *  - Pelatih hanya keluar jika lajur "kebenaran" = ya.
 */

var TAB_AWAM = ['Tetapan', 'Produk', 'Pengajar', 'Pelatih', 'Acara'];

/* ================= Sediakan Sheet (jalankan SEKALI) ================= */
function sediakanSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  buatTab_(ss, 'Tetapan', ['Kunci', 'Nilai', 'Penerangan'], [
    ['umur', '', 'Julat umur pelatih'],
    ['waktu', '', 'Hari dan waktu program'],
    ['yuran', '', 'Yuran bulanan'],
    ['bilangan_pengajar', '', 'Cth: 4 tenaga pengajar sepenuh masa']
  ]);

  buatTab_(ss, 'Produk', ['id', 'nama', 'keterangan', 'harga', 'gambar', 'warna', 'utama', 'posisi'], [
    ['bilis', 'Bilis Kopek', '200 g, siap dikopek.', '18', 'img/produk_bilis.jpg', '#BFE3F2', 'ya', ''],
    ['kerepek', 'Kerepek', 'Pelbagai perisa. Nyatakan pilihan dalam WhatsApp.', '', 'img/produk_kerepek.jpg', '#F3CD55', '', ''],
    ['cendawan', 'Cendawan', 'Dari rumah cendawan ARISMA.', '', 'img/produk_cendawan.jpg', '#EFE6D6', '', ''],
    ['coklat', 'Biskut Double Chocolate Chip', 'Dibakar di dapur akademi.', '', 'img/produk_chocchip.jpg', '#8A5A3B', '', ''],
    ['tart', 'Tart Nanas', 'Jem nanas atas pastri lembut.', '', '', '#F0A93B', '', ''],
    ['jus', 'Jus Nanas', 'Perahan segar.', '', 'img/produk_jus.jpg', '#FFE27A', '', '50% 85%'],
    ['kacang', 'Kacang', 'Kudapan klasik untuk tetamu.', '', '', '#C99562', '', '']
  ]);

  buatTab_(ss, 'Pengajar', ['nama', 'jawatan', 'gambar', 'papar'], [
    ['Encik Farouq', 'Pembantu Guru', '', 'ya']
  ]);

  buatTab_(ss, 'Pelatih', ['nama', 'gambar', 'kebenaran'], []);

  buatTab_(ss, 'Acara', ['id', 'tab', 'tajuk', 'tarikh_papar', 'tarikh_iso'], [
    ['mr', 'Maulidur Rasul', '', '', ''],
    ['rh', 'Rutin harian', '', '', ''],
    ['pr', 'Ke pasar raya', '', '', ''],
    ['rc', 'Rumah cendawan', '', '', ''],
    ['je', 'Jualan & ekspo', '', '', ''],
    ['al', 'Aktiviti luar', '', '', ''],
    ['tz', 'Tengku Zafrul', '', '', ''],
    ['cw', 'Coffee with YB', '', '', ''],
    ['bl', 'Bubur Lambuk', '', '25 Mac 2025', ''],
    ['ag', 'Taman Agro', '', '10 November 2018', '']
  ]);

  var pertama = ss.getSheetByName('Sheet1') || ss.getSheetByName('Sheet 1');
  if (pertama && ss.getSheets().length > 1 && pertama.getLastRow() === 0) ss.deleteSheet(pertama);
}

/* ================= GET: kandungan awam ================= */
function doGet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hasil = { dikemaskini: new Date().toISOString() };

  var tetapan = {};
  bacaBaris_(ss, 'Tetapan').forEach(function (r) {
    if (r.kunci) tetapan[r.kunci] = r.nilai;
  });
  hasil.tetapan = tetapan;

  hasil.produk = bacaBaris_(ss, 'Produk');

  hasil.pengajar = bacaBaris_(ss, 'Pengajar').filter(function (r) {
    return ya_(r.papar);
  }).map(function (r) {
    return { nama: r.nama, jawatan: r.jawatan, gambar: r.gambar };
  });

  // Pelatih: hanya yang ada kebenaran keluarga. Lajur kebenaran tidak dihantar keluar.
  hasil.pelatih = bacaBaris_(ss, 'Pelatih').filter(function (r) {
    return ya_(r.kebenaran);
  }).map(function (r) {
    return { nama: r.nama, gambar: r.gambar };
  });

  hasil.acara = bacaBaris_(ss, 'Acara');

  return json_(hasil);
}

/* ================= Bantuan ================= */
function buatTab_(ss, nama, lajur, baris) {
  var sheet = ss.getSheetByName(nama);
  if (sheet && sheet.getLastRow() > 0) return; // jangan timpa data sedia ada
  if (!sheet) sheet = ss.insertSheet(nama);
  sheet.appendRow(lajur);
  sheet.setFrozenRows(1);
  baris.forEach(function (b) { sheet.appendRow(b); });
}

function bacaBaris_(ss, nama) {
  var sheet = ss.getSheetByName(nama);
  if (!sheet || sheet.getLastRow() < 2) return [];
  var v = sheet.getDataRange().getDisplayValues();
  var kepala = v[0].map(function (h) {
    return String(h).trim().toLowerCase().replace(/\s+/g, '_');
  });
  var hasil = [];
  for (var i = 1; i < v.length; i++) {
    var o = {}, kosong = true;
    for (var j = 0; j < kepala.length; j++) {
      if (!kepala[j]) continue;
      var nilai = String(v[i][j]).trim();
      o[kepala[j]] = nilai;
      if (nilai) kosong = false;
    }
    if (!kosong) hasil.push(o);
  }
  return hasil;
}

function ya_(v) {
  return /^(ya|yes|y|true|1)$/i.test(String(v == null ? '' : v).trim());
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
