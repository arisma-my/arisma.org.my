// Cloudflare Worker: melayan satu laluan sahaja, /api/kandungan (kandungan daripada Google Sheet).
// index.html dan img/ dihidang oleh Cloudflare sendiri. Kod ini hanya jalan untuk alamat /api/...
//
// Cloudflare > Workers > arisma-website > Settings > Variables and Secrets:
//   APPS_SCRIPT_URL      pautan Web app Apps Script (berakhir /exec)

function json(data, cacheSeconds = 0, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": cacheSeconds ? "public, max-age=" + cacheSeconds : "no-store"
    }
  });
}

// Simpan jawapan sementara supaya Sheet tidak dipanggil setiap kali ada pelawat.
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

export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);
    if (pathname === "/api/kandungan") return kandungan(request, env, ctx);
    if (pathname.startsWith("/api/")) return json({ ok: false, sebab: "tiada" }, 0, 404);
    return env.ASSETS.fetch(request); // selain /api/, hidang fail statik
  }
};
