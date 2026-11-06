# ARISMA — laman web (satu halaman)

Kemas kini terakhir: 6 November 2026. Laman ini dihoskan di **Cloudflare** (Worker `arisma-website`), bukan Vercel.

Laman ini ialah laman **Akademi**. Sumbangan dibuat di laman ARISMA Foundation (`arismafoundation.org.my/sumbang/`), bukan di sini.

## Isi repo
| Fail / folder        | Fungsi |
|----------------------|--------|
| `index.html`         | Seluruh laman (gaya + skrip dalam satu fail) |
| `img/`               | Gambar acara, produk dan logo |
| `src/index.js`       | Worker Cloudflare: melayan `/api/kandungan` sahaja. Selain itu, fail statik dihidang terus |
| `wrangler.jsonc`     | Arahan kepada Cloudflare: nama Worker, fail Worker, folder statik, tetapan pratonton |
| `.assetsignore`      | Fail yang TIDAK dihidang kepada pengunjung (kod `src/`, `apps-script/`, nota ini, `CLAUDE.md`, `.git/`) |
| `_headers`           | Pengepala keselamatan pelayar dan cache gambar |
| `robots.txt`, `sitemap.xml` | Untuk enjin carian |
| `CLAUDE.md`          | Peraturan kerja untuk Claude Code (aliran PR dan peraturan repo) |
| `apps-script/Code.gs`| "Otak" Google Sheet. Ditampal dalam Sheet, BUKAN dimuat naik ke hosting |

Setiap kali fail di repo GitHub berubah (branch `main`), Cloudflare membina dan menyiarkan semula secara automatik. Ambil masa seminit dua.

## Konsep: Google Sheet ialah tempat kandungan diubah
Ubah di Sheet "ARISMA Website", laman ikut dalam ~2 minit. Tiada kod perlu disentuh.

| Tab Sheet | Mengawal | Awam? |
|-----------|----------|-------|
| Tetapan   | umur, waktu, yuran, bilangan pengajar | ya |
| Produk    | nama, keterangan, harga, gambar, warna (Kiosk) | ya |
| Pengajar  | nama, jawatan, gambar; hanya baris `papar = ya` keluar | ya |
| Pelatih   | nama, gambar; hanya baris `kebenaran = ya` keluar | ya |
| Acara     | nama tab, tajuk, tarikh (`tarikh_papar`), susunan (`tarikh_iso`) | ya |

### Sheet atau index.html? Yang mana menang?
`index.html` mengandungi nilai **asal** (sandaran). Bila Sheet dapat dibaca, **nilai Sheet mengatasi nilai asal**, tetapi hanya untuk ruang yang anda isi. Ruang yang **kosong** di Sheet tidak memadam nilai asal.
Kesimpulan: jika mahu ubah sesuatu yang ada dalam senarai di atas, ubah di **Sheet sahaja**. Jangan ubah di dua tempat.
Perkara yang hanya ada dalam `index.html` (tidak boleh diubah dari Sheet): teks di footer, nombor telefon, nombor pendaftaran syarikat, dan teks bahagian lain.

Peraturan penting:
- Apa sahaja dalam tab awam boleh dilihat sesiapa yang buka laman. Jangan letak maklumat peribadi atau rahsia di situ.
- `tarikh_iso` format 2026-08-26. Acara bertarikh disusun terbaru dahulu; yang kosong duduk selepasnya.
- Gambar: `img/nama.jpg` (fail dalam folder `img`) atau pautan `https://...`. Gambar baharu masih perlu dimuat naik ke GitHub. Gambar dicache 7 hari, jadi bila mengganti gambar, guna nama fail baharu.
- Jika Sheet tidak dapat dibaca, laman guna kandungan asal dalam `index.html`. Laman tidak akan rosak.
- Hanya orang yang dipercayai patut diberi akses EDIT kepada Sheet.

### Ruang kosong disorok
Bahagian yang belum diisi (pelatih, umur/waktu/yuran, tarikh acara, bilangan pengajar) **tidak dipaparkan kepada pengunjung**. Harga produk yang kosong menunjukkan "Tanya harga di WhatsApp".
Untuk melihat apa yang masih perlu diisi, buka `arisma.org.my/?semak`. Ruang kosong akan keluar berwarna kuning.

## Sumbangan
Semua butang **Sumbang** menuju terus ke `https://arismafoundation.org.my/sumbang/`. Sumbangan diterima oleh Yayasan ARISMA (PPAB-29/2014) melalui laman ARISMA Foundation. Laman Akademi tidak lagi mengutip, merekod atau memaparkan jumlah sumbangan, dan tiada data penderma disimpan di sini. Jika pautan Foundation berubah, ubah di `index.html` (cari `arismafoundation.org.my`).

## Cloudflare: di mana benda-benda
- **Worker**: Cloudflare > Workers & Pages > `arisma-website`.
- **Pembolehubah rahsia** (Settings > Variables and secrets, bahagian PALING ATAS, jenis Secret):
  `APPS_SCRIPT_URL` (URL Web app Apps Script, berakhir `/exec`).
  Jangan isi di bahagian "Builds", kerana Worker tidak nampak nilai di situ.
- **Domain**: `arisma.org.my` disambung ke Worker (tab Domains). `www.arisma.org.my` dialih ke `arisma.org.my` melalui Rules > Redirect Rules.
- **DNS**: Cloudflare > Domains > `arisma.org.my` > DNS. Nameserver domain ditetapkan di iWHOST kepada `ace.ns.cloudflare.com` dan `nina.ns.cloudflare.com`. Hanya pemegang akaun iWHOST boleh menukarnya.
- **Sijil SSL**: automatik. Always Use HTTPS dihidupkan.

## Sambung Sheet (jika perlu buat semula)
1. Google Drive > New > Google Sheets.
2. Extensions > Apps Script. Padam kod asal, tampal seluruh `apps-script/Code.gs`, Save.
3. Pilih fungsi `sediakanSheet` > Run. Beri kebenaran. Tab-tab tercipta dengan contoh data.
4. Deploy > New deployment > Web app. Execute as: Me. Who has access: Anyone. Salin URL (berakhir `/exec`).
   Jika ubah `Code.gs` kemudian: Deploy > Manage deployments > edit > New version.
5. Masukkan `APPS_SCRIPT_URL` di Cloudflare (lihat di atas). Selepas menyimpan, Worker dihantar semula automatik.
6. Uji: buka `arisma.org.my/api/kandungan`. Patut keluar `{"ok":true,...`.

### Jika Sheet lama masih ada tab/baris daripada versi sebelum ini
Selepas `Code.gs` baharu ditampal dan di-deploy sebagai New version, bersihkan secara manual (tidak berbahaya jika dibiar, tetapi tidak lagi digunakan):
- Padam tab **Penderma**.
- Padam baris `sasaran_desa`, `kutipan_luar`, `buka_desa`, `pautan_toyyibpay` dalam tab Tetapan.
- Apps Script > Project Settings > Script Properties: padam `KUNCI`.
- Cloudflare > Variables and secrets: padam `KUNCI_SKRIP`, `TOYYIBPAY_BILLCODES`, `DESA_TAMBAHAN`, `CRON_SECRET` jika ada.

## Akaun dan akses (elakkan bergantung pada seorang)
Simpan senarai ini dalam dokumen "00 BACA DULU" dan pastikan sekurang-kurangnya dua orang boleh mengakses setiap satu:
- iWHOST (pendaftaran domain, renew setiap tahun)
- Cloudflare (hosting + DNS), emel: arismasales@gmail.com
- GitHub (`arisma-my`)
- Google Sheet "ARISMA Website" + Apps Script
- Google Search Console (`arisma.org.my`)

Akaun sumbangan (CHIP) diurus di projek ARISMA Foundation, bukan di sini.

## Sebelum siar / semak berkala
- Kebenaran keluarga untuk setiap gambar dan nama pelatih.
- Isi tarikh acara, harga produk dan bilangan pengajar dalam Sheet (`/?semak` menunjukkan apa yang tinggal).
- Sahkan nombor telefon dan jawatan di footer.
