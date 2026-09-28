/** @OnlyCurrentDoc */
/**
 * ARISMA — otak laman web (Google Apps Script)
 *
 * Tampal seluruh fail ini dalam Google Sheet anda:
 *   Extensions > Apps Script > padam kod asal > tampal > Save.
 * Kemudian ikut langkah dalam BACA-SAYA.md.
 *
 * Prinsip keselamatan:
 *  - doGet HANYA memulangkan tab awam (senarai TAB_AWAM). Tab "Penderma" tidak pernah keluar.
 *  - doPost hanya terima permintaan yang membawa KUNCI rahsia (disimpan dalam Script Properties).
 *  - Pelatih hanya keluar jika lajur "kebenaran" = ya.
 */

var TAB_AWAM = ['Tetapan', 'Produk', 'Pengajar', 'Pelatih', 'Acara'];
var TAB_PENDERMA = 'Penderma';
var LAJUR_PENDERMA = ['No. rujukan', 'Tarikh bayaran', 'Nama', 'Emel', 'Telefon', 'Jumlah (RM)', 'Bil', 'Dicatat pada'];

/* ================= Sediakan Sheet (jalankan SEKALI) ================= */
function sediakanSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  buatTab_(ss, 'Tetapan', ['Kunci', 'Nilai', 'Penerangan'], [
    ['sasaran_desa', '2000000', 'Sasaran kutipan Desa ARISMA (RM)'],
    ['kutipan_luar', '0', 'Kutipan di luar toyyibPay (tunai / bank), ditambah pada jumlah dalam talian (RM)'],
    ['buka_desa', 'tidak', 'ya = papar butang sumbang dan bar progress. tidak = "akan dibuka tidak lama lagi"'],
    ['pautan_toyyibpay', '', 'Pautan bil toyyibPay Desa (mesti bermula https://toyyibpay.com/)'],
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

  buatTab_(ss, TAB_PENDERMA, LAJUR_PENDERMA, []);

  var pertama = ss.getSheetByName('Sheet1') || ss.getSheetByName('Sheet 1');
  if (pertama && ss.getSheets().length > 1 && pertama.getLastRow() === 0) ss.deleteSheet(pertama);
}

/* ================= Jana kunci rahsia (jalankan SEKALI) ================= */
function tetapkanKunci() {
  var props = PropertiesService.getScriptProperties();
  if (props.getProperty('KUNCI')) {
    Logger.log('Kunci sudah wujud. Untuk menukar, padam "KUNCI" dalam Project Settings > Script Properties.');
    return;
  }
  var kunci = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  props.setProperty('KUNCI', kunci);
  Logger.log('KUNCI_SKRIP = ' + kunci);
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

/* ================= POST: catat penderma (dari Vercel sahaja) ================= */
function doPost(e) {
  var body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ ok: false, sebab: 'bentuk data salah' });
  }

  var kunci = PropertiesService.getScriptProperties().getProperty('KUNCI');
  if (!kunci || body.kunci !== kunci) {
    return json_({ ok: false, sebab: 'tidak dibenarkan' });
  }
  if (body.tindakan !== 'penderma' || !Array.isArray(body.baris)) {
    return json_({ ok: false, sebab: 'tindakan tidak dikenali' });
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(TAB_PENDERMA);
    if (!sheet) {
      sheet = ss.insertSheet(TAB_PENDERMA);
      sheet.appendRow(LAJUR_PENDERMA);
      sheet.setFrozenRows(1);
    }

    // Kunci unik: no. rujukan; jika kosong, gabungan bil + tarikh + nama + jumlah.
    var ada = {};
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      ada[kunciBaris_(data[i][0], data[i][6], data[i][1], data[i][2], data[i][5])] = true;
    }

    var baru = 0;
    var sekarang = new Date().toISOString();
    body.baris.forEach(function (b) {
      var k = kunciBaris_(b.rujukan, b.bil, b.tarikh, b.nama, b.jumlah);
      if (ada[k]) return;
      ada[k] = true;
      // Awalan ' supaya Sheets tidak tafsir teks sebagai formula (cth. nama bermula =).
      sheet.appendRow([
        selamat_(b.rujukan), selamat_(b.tarikh), selamat_(b.nama), selamat_(b.emel),
        selamat_(b.telefon), Number(b.jumlah) || 0, selamat_(b.bil), sekarang
      ]);
      baru++;
    });

    return json_({ ok: true, baru: baru, diterima: body.baris.length });
  } finally {
    lock.releaseLock();
  }
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

function kunciBaris_(rujukan, bil, tarikh, nama, jumlah) {
  var r = String(rujukan == null ? '' : rujukan).trim();
  if (r) return 'r:' + r;
  return ['g', bil, tarikh, nama, Number(jumlah) || 0].join('|');
}

function selamat_(v) {
  var t = String(v == null ? '' : v);
  return /^[=+\-@]/.test(t) ? "'" + t : t;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
