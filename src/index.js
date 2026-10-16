// Cloudflare Worker: gantikan tiga fungsi Vercel (api/kandungan.js, api/desa.js, api/toyyibpay.js).
// index.html dan img/ dihidang oleh Cloudflare sendiri. Kod ini hanya jalan untuk alamat /api/...
//
// Cloudflare > Workers > arisma-website > Settings > Variables and Secrets:
//   APPS_SCRIPT_URL      pautan Web app Apps Script (berakhir /exec)
//   KUNCI_SKRIP          (Secret) kunci daripada tetapkanKunci() dalam Apps Script
//   TOYYIBPAY_BILLCODES  kod bil toyyibPay, dipisah koma (kemudian, bila toyyibPay dibuka)
//   DESA_TAMBAHAN        (pilihan) sandaran jika Sheet tidak dapat dibaca, dalam RM
//   CRON_SECRET          (pilihan) untuk semakan penderma secara GET

const TOYYIB = "https://toyyibpay.com/index.php/api/getBillTransactions";

function json(data, cacheSeconds = 0, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": cacheSeconds ? "public, max-age=" + cacheSeconds : "no-store"
    }
  });
}

// Simpan jawapan sementara supaya Sheet dan toyyibPay tidak dipanggil setiap kali ada pelawat.
async function cached(request, ctx, seconds, produce) {
  const u = new URL(request.url);
  u.search = "";
  const key = new Request(u.toString());
  const cache = caches.default;
  const hit = await cache.match(key);
  if (hit) return hit;
  const { data, simpan } = await produce();
  const res = json(data, simpan ? seconds : 0);
  if (simpan) ctx.waitUntil(cache.put(key, res.clone()));
  return res;
}

async function ambilSheet(env) {
  const ctl = new AbortController();
  const tm = setTimeout(() => ctl.abort(), 9000);
  try {
    const r = await fetch(env.APPS_SCRIPT_URL, { redirect: "follow", signal: ctl.signal });
    return JSON.parse(await r.text());
  } finally {
    clearTimeout(tm);
  }
}

function senaraiBil(env) {
  return String(env.TOYYIBPAY_BILLCODES || "").split(",").map(s => s.trim()).filter(Boolean);
}

// Tanya toyyibPay sendiri senarai bayaran BERJAYA. Notis (callback) tidak dipercayai.
async function transaksiBerjaya(kod) {
  try {
    const r = await fetch(TOYYIB, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ billCode: kod, billpaymentStatus: "1" })
    });
    const data = JSON.parse(await r.text());
    if (!Array.isArray(data)) return [];
    return data.filter(t => t.billpaymentStatus == null || String(t.billpaymentStatus) === "1");
  } catch (e) {
    return []; // toyyibPay pulangkan teks bukan JSON bila tiada transaksi
  }
}

// /api/kandungan
function kandungan(request, env, ctx) {
  if (!env.APPS_SCRIPT_URL) return json({ ok: false, sebab: "belum disambung" });
  return cached(request, ctx, 120, async () => {
    try {
      const j = await ambilSheet(env);
      return { data: { ok: true, ...j }, simpan: true };
    } catch (e) {
      return { data: { ok: false, sebab: "tidak dapat dibaca" }, simpan: false };
    }
  });
}

// /api/desa
async function kutipanLuar(env) {
  if (!env.APPS_SCRIPT_URL) return null;
  try {
    const j = await ambilSheet(env);
    const n = parseFloat(String((j.tetapan || {}).kutipan_luar || "").replace(/[^0-9.]/g, ""));
    return isNaN(n) ? null : n;
  } catch (e) {
    return null;
  }
}

function desa(request, env, ctx) {
  return cached(request, ctx, 300, async () => {
    let total = 0, count = 0;
    for (const kod of senaraiBil(env)) {
      for (const t of await transaksiBerjaya(kod)) {
        const amt = parseFloat(t.billpaymentAmount);
        if (!isNaN(amt)) { total += amt; count++; }
      }
    }
    const luar = await kutipanLuar(env);
    total += luar != null ? luar : (parseFloat(env.DESA_TAMBAHAN || "0") || 0);
    return {
      data: {
        terkumpul: Math.round(total * 100) / 100,
        penderma: count,
        dikemaskini: new Date().toISOString()
      },
      simpan: true
    };
  });
}

// /api/toyyibpay
async function toyyibpay(request, env) {
  const kodBil = senaraiBil(env);
  if (!kodBil.length || !env.APPS_SCRIPT_URL || !env.KUNCI_SKRIP) {
    return json({ ok: false, sebab: "belum disambung" });
  }

  if (request.method === "POST") {
    let b = {};
    try {
      const tipe = request.headers.get("content-type") || "";
      b = tipe.includes("json") ? await request.json() : Object.fromEntries(await request.formData());
    } catch (e) {}
    if (!kodBil.includes(String(b.billcode || ""))) return json({ ok: true, abaikan: true });
  } else if (request.method === "GET") {
    const auth = request.headers.get("authorization") || "";
    if (!env.CRON_SECRET || auth !== "Bearer " + env.CRON_SECRET) return json({ ok: false }, 0, 401);
  } else {
    return json({ ok: false }, 0, 405);
  }

  const baris = [];
  for (const kod of kodBil) {
    for (const t of await transaksiBerjaya(kod)) {
      baris.push({
        rujukan: t.billpaymentInvoiceNo || "",
        tarikh: t.billPaymentDate || "",
        nama: t.billTo || "",
        emel: t.billEmail || "",
        telefon: t.billPhone || "",
        jumlah: parseFloat(t.billpaymentAmount) || 0,
        bil: kod
      });
    }
  }
  if (!baris.length) return json({ ok: true, dihantar: 0 });

  try {
    const r = await fetch(env.APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kunci: env.KUNCI_SKRIP, tindakan: "penderma", baris }),
      redirect: "follow"
    });
    const j = JSON.parse(await r.text());
    return json({ ok: !!j.ok, dihantar: baris.length, baru: j.baru });
  } catch (e) {
    return json({ ok: false, sebab: "sheet tidak dapat dihubungi" });
  }
}

export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);
    if (pathname === "/api/kandungan") return kandungan(request, env, ctx);
    if (pathname === "/api/desa") return desa(request, env, ctx);
    if (pathname === "/api/toyyibpay") return toyyibpay(request, env);
    if (pathname.startsWith("/api/")) return json({ ok: false, sebab: "tiada" }, 0, 404);
    return env.ASSETS.fetch(request); // selain /api/, hidang fail statik
  }
};
