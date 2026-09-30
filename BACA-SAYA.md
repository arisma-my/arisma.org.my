# ARISMA — laman web (satu halaman)

Kemas kini terakhir: 30 September 2026. Laman ini dihoskan di **Cloudflare** (Worker `arisma-website`), bukan Vercel.

## Isi repo
| Fail / folder        | Fungsi |
|----------------------|--------|
| `index.html`         | Seluruh laman (gaya + skrip dalam satu fail) |
| `img/`               | Gambar acara, produk dan logo |
| `src/index.js`       | Worker Cloudflare: melayan `/api/kandungan`, `/api/desa`, `/api/toyyibpay`. Selain itu, fail statik dihidang terus |
| `wrangler.jsonc`     | Arahan kepada Cloudflare: nama Worker, fail Worker, folder statik |
| `.assetsignore`      | Fail yang TIDAK dihidang kepada pengunjung (kod `api/`, `src/`, `apps-script/`, nota ini) |
| `_headers`           | Tetapan keselamatan pelayar (nosniff, Referrer-Policy, X-Frame-Options, Permissions-Policy) |
| `apps-script/Code.gs`| "Otak" Google Sheet. Ditampal dalam Sheet, BUKAN dimuat naik ke hosting |
| `api/*.js`           | Versi lama untuk Vercel. Tidak digunakan lagi; boleh dipadam bila Vercel sudah ditutup |

Setiap kali fail di repo GitHub berubah (branch `main`), Cloudflare membina dan menyiarkan semula secara automatik. Ambil masa seminit dua.

## Konsep: Google Sheet ialah tempat kandungan diubah
Ubah di Sheet "ARISMA Website", laman ikut dalam ~2 minit. Tiada kod perlu disentuh.

| Tab Sheet | Mengawal | Awam? |
|-----------|----------|-------|
| Tetapan   | sasaran Desa, kutipan luar, suis buka Desa, pautan toyyibPay, umur, waktu, yuran, bilangan pengajar | ya |
| Produk    | nama, keterangan, harga, gambar, warna (Kedai) | ya |
| Pengajar  | nama, jawatan, gambar; hanya baris `papar = ya` keluar | ya |
| Pelatih   | nama, gambar; hanya baris `kebenaran = ya` keluar | ya |
| Acara     | nama tab, tajuk, tarikh (`tarikh_papar`), susunan (`tarikh_iso`) | ya |
| Penderma  | direkod automatik. TIDAK PERNAH dihantar ke laman | TIDAK |

### Sheet atau index.html? Yang mana menang?
`index.html` mengandungi nilai **asal** (sandaran). Bila Sheet dapat dibaca, **nilai Sheet mengatasi nilai asal**, tetapi hanya untuk ruang yang anda isi. Ruang yang **kosong** di Sheet tidak memadam nilai asal.
Kesimpulan: jika mahu ubah sesuatu yang ada dalam senarai di atas, ubah di **Sheet sahaja**. Jangan ubah di dua tempat.
Perkara yang hanya ada dalam `index.html` (tidak boleh diubah dari Sheet): teks di footer, nombor telefon, nombor pendaftaran syarikat, dan teks bahagian lain.

Peraturan penting:
- Apa sahaja dalam tab awam boleh dilihat sesiapa yang buka laman. Jangan letak maklumat peribadi atau rahsia di situ.
- `tarikh_iso` format 2026-08-26. Acara bertarikh disusun terbaru dahulu; yang kosong duduk selepasnya.
- Gambar: `img/nama.jpg` (fail dalam folder `img`) atau pautan `https://...`. Gambar baharu masih perlu dimuat naik ke GitHub.
- Jika Sheet tidak dapat dibaca, laman guna kandungan asal dalam `index.html`. Laman tidak akan rosak.
- Butang sumbang hanya keluar jika `buka_desa = ya` DAN pautan bermula `https://toyyibpay.com/`.
- Hanya orang yang dipercayai patut diberi akses EDIT kepada Sheet.

### Ruang kosong disorok
Bahagian yang belum diisi (pelatih, umur/waktu/yuran, tarikh acara, bilangan pengajar) **tidak dipaparkan kepada pengunjung**. Harga produk yang kosong menunjukkan "Tanya harga di WhatsApp".
Untuk melihat apa yang masih perlu diisi, buka `arisma.org.my/?semak`. Ruang kosong akan keluar berwarna kuning.

## Cloudflare: di mana benda-benda
- **Worker**: Cloudflare > Workers & Pages > `arisma-website`.
- **Pembolehubah rahsia** (Settings > Variables and secrets, bahagian PALING ATAS, jenis Secret):
  `APPS_SCRIPT_URL` (URL Web app Apps Script, berakhir `/exec`) dan `KUNCI_SKRIP` (kunci dalam Apps Script: Project Settings > Script Properties > `KUNCI`).
  Jangan isi di bahagian "Builds", kerana Worker tidak nampak nilai di situ.
- **Domain**: `arisma.org.my` disambung ke Worker (tab Domains). `www.arisma.org.my` dialih ke `arisma.org.my` melalui Rules > Redirect Rules.
- **DNS**: Cloudflare > Domains > `arisma.org.my` > DNS. Nameserver domain ditetapkan di iWHOST kepada `ace.ns.cloudflare.com` dan `nina.ns.cloudflare.com`. Hanya pemegang akaun iWHOST boleh menukarnya.
- **Sijil SSL**: automatik. Always Use HTTPS dihidupkan.

## Sambung Sheet (jika perlu buat semula)
1. Google Drive > New > Google Sheets.
2. Extensions > Apps Script. Padam kod asal, tampal seluruh `apps-script/Code.gs`, Save.
3. Pilih fungsi `sediakanSheet` > Run. Beri kebenaran. Tab-tab tercipta dengan contoh data.
4. Pilih fungsi `tetapkanKunci` > Run. Buka Execution log, salin `KUNCI_SKRIP = ...`.
5. Deploy > New deployment > Web app. Execute as: Me. Who has access: Anyone. Salin URL (berakhir `/exec`).
   Jika ubah `Code.gs` kemudian: Deploy > Manage deployments > edit > New version.
6. Masukkan `APPS_SCRIPT_URL` dan `KUNCI_SKRIP` di Cloudflare (lihat di atas). Selepas menyimpan, Worker dihantar semula automatik.
7. Uji: buka `arisma.org.my/api/kandungan`. Patut keluar `{"ok":true,...`.

## Bila kutipan dalam talian dibuka (selepas toyyibPay disahkan)
1. Cloudflare > Variables and secrets, tambah `TOYYIBPAY_BILLCODES` = kod bil Desa (pisah dengan koma jika lebih daripada satu).
2. toyyibPay > bil > Callback URL = `https://arisma.org.my/api/toyyibpay`.
3. Sheet, tab Tetapan: isi `pautan_toyyibpay`, kemudian tukar `buka_desa` kepada `ya`.
4. Integriti: nombor dalam laman datang terus dari toyyibPay (Worker bertanya semula kepada toyyibPay), bukan daripada notis yang boleh dipalsukan.
5. Belum ada semakan harian automatik. Rekod penderma di Sheet bergantung pada notis (callback) toyyibPay. Bar progress tidak terjejas kerana ia tidak bergantung pada rekod itu.

## Akaun dan akses (elakkan bergantung pada seorang)
Simpan senarai ini dalam dokumen "00 BACA DULU" dan pastikan sekurang-kurangnya dua orang boleh mengakses setiap satu:
- iWHOST (pendaftaran domain, renew setiap tahun)
- Cloudflare (hosting + DNS), emel: arismasales@gmail.com
- GitHub (`arisma-my`)
- Google Sheet "ARISMA Website" + Apps Script
- toyyibPay (akaun Yayasan)

## Sebelum siar / semak berkala
- Kebenaran keluarga untuk setiap gambar dan nama pelatih.
- Isi tarikh acara, harga produk dan bilangan pengajar dalam Sheet (`/?semak` menunjukkan apa yang tinggal).
- Sahkan nombor telefon dan jawatan di footer.
