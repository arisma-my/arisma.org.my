# CLAUDE.md: arisma.org.my (laman Akademi ARISMA)

Laman satu halaman untuk Akademi Remaja Islam Autisma. Entiti berasingan daripada laman ARISMA Foundation (arismafoundation.org.my). Rujuk `BACA-SAYA.md` untuk gambaran penuh dan cara menyambung Google Sheet.

## Bahasa
- Semua teks pengunjung dan nota dalaman dalam Bahasa Melayu.

## Aliran kerja (WAJIB)
1. Jangan push terus ke `main`. Buat branch, buka PR.
2. Untuk perubahan besar, guna Plan mode dahulu dan tunggu persetujuan.
3. Pengguna menyemak dalam chat, kemudian pengguna sendiri yang merge. Claude tidak merge.
4. `main` dihantar automatik ke Cloudflare (Worker `arisma-website`). Setiap merge terus jadi siaran langsung.
5. Satu PR, satu tujuan. Jangan campur kebersihan/keselamatan dengan perubahan kandungan.

## Seni bina ringkas
- `index.html`: seluruh laman (CSS + JS dalam satu fail). Nilai asal ialah sandaran; nilai Google Sheet mengatasinya bagi ruang yang diisi.
- `src/index.js`: Worker Cloudflare untuk `/api/*`. Selain itu, fail statik dihidang terus.
- `apps-script/Code.gs`: kod Google Sheet. Ditampal dalam Sheet, TIDAK dihidang.
- `img/`: gambar. `_headers`: pengepala keselamatan dan cache. `robots.txt`, `sitemap.xml`: SEO.

## Peraturan
- Sheet menang atas `index.html` untuk perkara dalam senarai `BACA-SAYA.md`. Jangan ubah di dua tempat.
- Jangan letak rahsia, kunci, token atau data peribadi dalam repo. Pembolehubah rahsia (`APPS_SCRIPT_URL`, `KUNCI_SKRIP`, dll.) ditetapkan di Cloudflare sahaja.
- Fail yang TIDAK dihidang disenaraikan dalam `.assetsignore`. Fail dalaman baharu (nota, skrip) mesti ditambah di situ.
- `wrangler.jsonc`: `workers_dev: false` dan `preview_urls: true` dipasangkan dengan sengaja. `preview_urls` mesti kekal `true` supaya PR boleh dipratonton. Jangan tukar ke `false` tanpa bertanya pengguna.
- `wrangler.jsonc`: blok `"previews": {}` mesti kekal (walaupun kosong) kerana Workers Builds guna `wrangler preview` (beta) untuk branch bukan-main dan akan gagal tanpanya.
- `_headers`: `/img/*` dicache 7 hari. **Bila ganti gambar, guna nama fail baharu**, jangan timpa nama lama.
- HSTS: `max-age=31536000` sahaja. Jangan tambah `includeSubDomains` atau `preload` tanpa arahan pengguna (subdomain perlu disemak dahulu).
- CSP sedang dalam mod `Report-Only`. Menukar kepada penguatkuasaan ialah PR berasingan, selepas amaran di konsol pelayar dibersihkan.
- Jika `index.html` diubah, semak paparan mudah alih (lebar telefon) dan `arisma.org.my/?semak`.
- Gambar dan nama pelatih memerlukan kebenaran keluarga sebelum disiarkan.

## Entiti (teks footer)
- Akademi dikendalikan oleh WIBARISMA Sdn. Bhd. (201001043903 / 927831-W).
- Yayasan ARISMA (PPAB-29/2014), iaitu ARISMA Foundation, hanya sebagai penerima sumbangan. Sumbangan dibuat di arismafoundation.org.my/sumbang/.

## Perkara tertunggak
- Buang sepenuhnya Desa ARISMA, toyyibPay, `api/` (sisa Vercel) dan tab Sheet "Penderma".
- Semua butang Sumbang menuju `https://arismafoundation.org.my/sumbang/`.
- Semak sama ada WIBARISMA dinyatakan sebagai pengendali dan Yayasan sebagai penerima sumbangan dalam footer.
