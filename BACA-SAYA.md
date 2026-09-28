# ARISMA — laman web (satu halaman)

## Isi folder
index.html               seluruh laman (gaya + skrip dalam satu fail)
img/                     gambar acara, produk dan logo
api/kandungan.js         bawa kandungan dari Google Sheet ke laman (cache 2 minit)
api/desa.js              jumlah kutipan Desa = toyyibPay + kutipan luar dari Sheet
api/toyyibpay.js         catat penderma ke Sheet (tidur sehingga toyyibPay disambung)
apps-script/Code.gs      "otak" Google Sheet — ditampal dalam Sheet, BUKAN di-upload ke Vercel

## Konsep: Google Sheet ialah tempat kandungan diubah
Ubah di Sheet, laman ikut dalam ~2 minit. Tiada kod perlu disentuh.

| Tab Sheet | Mengawal                                                              | Awam? |
|-----------|-----------------------------------------------------------------------|-------|
| Tetapan   | sasaran Desa, kutipan luar, suis buka Desa, pautan toyyibPay, umur, waktu, yuran, bilangan pengajar | ya |
| Produk    | nama, keterangan, harga, gambar, warna (Kedai)                         | ya    |
| Pengajar  | nama, jawatan, gambar; hanya baris `papar = ya` keluar                  | ya    |
| Pelatih   | nama, gambar; hanya baris `kebenaran = ya` keluar                       | ya    |
| Acara     | nama tab, tajuk, tarikh (`tarikh_papar`), susunan (`tarikh_iso`)        | ya    |
| Penderma  | direkod automatik. TIDAK PERNAH dihantar ke laman                       | TIDAK |

Peraturan penting:
- Apa sahaja dalam tab awam boleh dilihat sesiapa yang buka laman. Jangan letak maklumat peribadi di situ.
- `tarikh_iso` format 2026-08-26. Acara bertarikh disusun terbaru dahulu; yang kosong duduk selepasnya.
- Gambar: `img/nama.jpg` (fail dalam folder img) atau pautan `https://...`. Gambar baharu masih perlu dimuat naik bersama kod.
- Jika Sheet tidak dapat dibaca, laman guna kandungan asal dalam index.html. Laman tidak akan rosak.
- Butang sumbang hanya keluar jika `buka_desa = ya` DAN pautan bermula `https://toyyibpay.com/`.
- Hanya orang yang dipercayai patut diberi akses EDIT kepada Sheet ini.

## Sambung Sheet (sekali sahaja)
1. Google Drive > New > Google Sheets. Namakan "ARISMA Laman".
2. Extensions > Apps Script. Padam kod asal, tampal seluruh apps-script/Code.gs, Save.
3. Pilih fungsi `sediakanSheet` > Run. Beri kebenaran (jika ada amaran "belum disahkan":
   Advanced > Go to project). Tab-tab akan tercipta dengan contoh data.
4. Pilih fungsi `tetapkanKunci` > Run. Buka Execution log, salin nilai `KUNCI_SKRIP = ...`.
5. Deploy > New deployment > Web app. Execute as: Me. Who has access: Anyone. Deploy.
   Salin URL (berakhir /exec). Jika ubah Code.gs kemudian: Deploy > Manage deployments > edit > New version.
6. Vercel > Settings > Environment Variables, tambah:
   APPS_SCRIPT_URL = URL langkah 5
   KUNCI_SKRIP     = kunci langkah 4
   Kemudian Redeploy.

## Bila kutipan dalam talian dibuka (selepas toyyibPay disahkan)
1. Env Vars: TOYYIBPAY_BILLCODES = kod bil Desa.
2. toyyibPay > bil > Callback URL = https://arisma.org.my/api/toyyibpay
3. Tab Tetapan: isi pautan_toyyibpay, tukar buka_desa kepada ya.
4. Integriti: nombor dalam laman datang terus dari toyyibPay, bukan dari notis yang boleh dipalsukan.
   Untuk semakan harian automatik, tambah CRON_SECRET (rentetan rawak) dalam Env Vars dan fail vercel.json:
   {"crons":[{"path":"/api/toyyibpay","schedule":"0 20 * * *"}]}

## Pasang di Vercel
Repo GitHub > sambung ke projek Vercel. index.html + img/ dihidang sebagai fail statik,
api/*.js sebagai fungsi. Domain: tambah arisma.org.my di Vercel, masukkan rekod DNS yang diberi
dalam Cloudflare DNS dengan Proxy status "DNS only" (awan kelabu).

## Sebelum siar
- Kebenaran keluarga untuk setiap gambar pelatih
- Tarikh acara, harga produk, umur / waktu / yuran (semua kini diisi dalam Sheet)
