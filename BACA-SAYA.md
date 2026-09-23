# ARISMA — laman web (satu halaman)

## Isi folder
index.html         seluruh laman (gaya + skrip di dalam fail yang sama)
img/                gambar acara, produk dan logo (logo.png, logo-putih.png, logo-mark*.png)
api/desa.js         kiraan kutipan Desa, auto dari toyyibPay (Vercel Serverless Function)

## Yang perlu diubah hanya di satu tempat
Bahagian `TETAPAN` di hujung index.html (cari `var ARISMA =`):
- whatsapp        nombor untuk semua borang dan pesanan kedai
- desa.buka       false = kutipan dalam talian belum dibuka; tukar ke true bila toyyibPay sedia
- desa.toyyibpay  pautan bil toyyibPay Yayasan (jumlah terbuka)
- produk          nama, penerangan, harga (null = belum diisi)
- pelatih         tambah {nama, gambar} bila ada kebenaran keluarga

Teks lain bertanda [isi: ...] boleh dicari terus dalam index.html.

## Pasang di Vercel
1. Upload folder ini ke repo GitHub, sambung repo tu ke projek Vercel
   (drag-and-drop di dashboard pun boleh, tapi GitHub lebih senang untuk update lain kali).
2. Vercel kesan index.html + img/ sebagai fail statik, dan api/desa.js sebagai
   serverless function secara automatik — tiada config tambahan diperlukan.
3. Project > Settings > Environment Variables, tambah:
   TOYYIBPAY_BILLCODES = kod bil Desa (pisah dengan koma jika lebih satu)
   DESA_TAMBAHAN       = kutipan sebelum toyyibPay, dalam RM (pilihan)
4. Project > Settings > Domains, tambah arisma.org.my.
   Vercel akan bagi rekod DNS (A ke 76.76.21.21, atau CNAME cname.vercel-dns.com untuk www).
5. Domain kekal didaftar di iWHOST, tapi DNS-nya di Cloudflare — masukkan rekod
   di langkah 4 tu terus dalam Cloudflare DNS > Records. PENTING: tukar Proxy
   status kepada "DNS only" (awan kelabu), bukan "Proxied" (awan oren), atau
   Vercel akan gagal sahkan domain / isukan SSL.

Laman baca /api/desa, dikemas kini setiap 5 minit. Jika /api/desa gagal, laman
guna nilai `desa.terkumpul` dalam TETAPAN sebagai sandaran.

## Sebelum siar
- Kebenaran keluarga untuk gambar pelatih dalam galeri
- Tarikh acara (Maulidur Rasul, Tengku Zafrul, Coffee with YB)
- Harga produk selain Bilis Kopek
