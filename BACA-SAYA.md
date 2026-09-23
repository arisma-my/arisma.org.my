# ARISMA — laman web (satu halaman)

## Isi folder
index.html              seluruh laman (gaya + skrip di dalam fail yang sama)
img/                    gambar acara, produk dan logo (logo.png, logo-putih.png, logo-mark*.png)
functions/api/desa.js   kiraan kutipan Desa, auto dari toyyibPay (Cloudflare Pages)

## Yang perlu diubah hanya di satu tempat
Bahagian `TETAPAN` di hujung index.html (cari `var ARISMA =`):
- whatsapp     nombor untuk semua borang dan pesanan kedai
- desa.toyyibpay  pautan bil toyyibPay Yayasan (jumlah terbuka)
- produk       nama, penerangan, harga (null = belum diisi)
- pelatih      tambah {nama, gambar} bila ada kebenaran keluarga

Teks lain bertanda [isi: ...] boleh dicari terus dalam index.html.

## Kutipan Desa auto dari toyyibPay
1. Upload folder ini ke GitHub repo, sambung repo ke Cloudflare Pages.
   (Muat naik seret-lepas di dashboard tidak menjalankan folder functions.)
2. Pages > Settings > Variables:
   TOYYIBPAY_BILLCODES = kod bil Desa (pisah dengan koma jika lebih satu)
   DESA_TAMBAHAN       = kutipan sebelum toyyibPay, dalam RM (pilihan)
3. Laman baca /api/desa, dikemas kini setiap 5 minit.
   Jika /api/desa gagal, laman guna `desa.terkumpul` dalam TETAPAN.

## Sebelum siar
- Kebenaran keluarga untuk gambar pelatih dalam galeri
- Tarikh acara (Maulidur Rasul, Tengku Zafrul, Coffee with YB)
- Harga produk selain Bilis Kopek
