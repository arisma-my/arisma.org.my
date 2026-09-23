/* Cloudflare Pages Function: /api/desa
   Jumlahkan semua bayaran berjaya bagi bil toyyibPay Desa ARISMA.

   Tetapkan dalam Cloudflare > Pages > projek > Settings > Variables:
     TOYYIBPAY_BILLCODES  kod bil toyyibPay, dipisah koma jika lebih dari satu (cth. "abc123,xyz789")
     DESA_TAMBAHAN        (pilihan) kutipan sebelum toyyibPay, dalam RM (cth. "35000")

   getBillTransactions tidak memerlukan secret key, jadi tiada rahsia disimpan di sini.
   Hasil disimpan dalam cache 5 minit supaya toyyibPay tidak dipanggil setiap kali laman dibuka. */

const CACHE_SECONDS = 300;

export async function onRequestGet({ request, env, waitUntil }) {
  const cache = caches.default;
  const key = new Request(new URL("/api/desa", request.url).toString());
  const hit = await cache.match(key);
  if (hit) return hit;

  const codes = String(env.TOYYIBPAY_BILLCODES || "")
    .split(",").map(s => s.trim()).filter(Boolean);

  let total = 0, count = 0;
  for (const code of codes) {
    try {
      const res = await fetch("https://toyyibpay.com/index.php/api/getBillTransactions", {
        method: "POST",
        body: new URLSearchParams({ billCode: code, billpaymentStatus: "1" })
      });
      const data = JSON.parse(await res.text());
      if (Array.isArray(data)) {
        for (const t of data) {
          const amt = parseFloat(t.billpaymentAmount);
          if (!isNaN(amt)) { total += amt; count++; }
        }
      }
    } catch (e) {
      // toyyibPay pulangkan teks bukan JSON bila tiada transaksi; abaikan
    }
  }

  total += parseFloat(env.DESA_TAMBAHAN || "0") || 0;

  const out = new Response(JSON.stringify({
    terkumpul: Math.round(total * 100) / 100,
    penderma: count,
    dikemaskini: new Date().toISOString()
  }), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": `public, max-age=${CACHE_SECONDS}`
    }
  });
  waitUntil(cache.put(key, out.clone()));
  return out;
}
