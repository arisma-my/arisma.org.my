import { KEMPEN, json, ralat, asalSah, ip, bacaJson, dalamHad, turnstileSah, baris, blok, emelSah, telefonSah, idRawak, esc } from "./util.js";
import { bukaSumbangan } from "./sumbang.js";

/* ---------- GET /api/tetapan ---------- */
export function tetapan(env) {
  return json(
    {
      ok: true,
      buka: bukaSumbangan(env),
      turnstile: env.TURNSTILE_SITEKEY || "",
      min: Number(env.MIN_SUMBANGAN || 10),
      maks: Number(env.MAKS_SUMBANGAN || 30000)
    },
    200,
    { "cache-control": "public, max-age=60" }
  );
}

/* ---------- GET /api/kutipan?kempen=degup2027 ---------- */
export async function kutipan(request, env, ctx) {
  const u = new URL(request.url);
  const kempen = u.searchParams.get("kempen") || "";
  if (!Object.hasOwn(KEMPEN, kempen)) return ralat(404, "tiada");

  const kunciCache = new Request(`${u.origin}/api/kutipan?kempen=${kempen}`);
  const cache = caches.default;
  const ada = await cache.match(kunciCache);
  if (ada) return ada;

  const [dalam, luar] = await env.DB.batch([
    env.DB.prepare("SELECT COALESCE(SUM(amaun_sen),0) AS s, COUNT(*) AS c FROM derma WHERE status = 'berjaya' AND kempen = ?1").bind(kempen),
    env.DB.prepare("SELECT COALESCE(SUM(amaun_sen),0) AS s, COUNT(*) AS c FROM kutipan_luar WHERE kempen = ?1").bind(kempen)
  ]);
  const a = dalam.results[0], b = luar.results[0];
  const sasaran = Number(env["SASARAN_" + kempen.toUpperCase()] || 0);

  const res = json(
    { ok: true, kempen, terkumpul: (a.s + b.s) / 100, sumbangan: a.c + b.c, sasaran },
    200,
    { "cache-control": "public, max-age=60" }
  );
  ctx.waitUntil(cache.put(kunciCache, res.clone()));
  return res;
}

/* ---------- POST /api/taja ---------- */
const MINAT = ["utama", "zonal", "kerusi", "csr"];

export async function hantarTaja(request, env, ctx) {
  if (!asalSah(request, env)) return ralat(403, "asal");
  if (!(await dalamHad(env.HAD_BORANG, "taja:" + ip(request)))) return ralat(429, "had");

  let b;
  try { b = await bacaJson(request); } catch (e) { return ralat(400, "data"); }
  if (!(await turnstileSah(env, b.turnstile, ip(request)))) return ralat(403, "turnstile");

  const r = {
    syarikat: baris(b.syarikat, 160),
    pegawai: baris(b.pegawai, 120),
    jawatan: baris(b.jawatan, 120),
    emel: baris(b.emel, 254).toLowerCase(),
    telefon: baris(b.telefon, 20),
    minat: MINAT.includes(b.minat) ? b.minat : "",
    mesej: blok(b.mesej, 2000)
  };
  if (r.syarikat.length < 2) return ralat(400, "data", "syarikat");
  if (r.pegawai.length < 3) return ralat(400, "data", "pegawai");
  if (!emelSah(r.emel)) return ralat(400, "data", "emel");
  if (!telefonSah(r.telefon)) return ralat(400, "data", "telefon");
  if (!r.minat) return ralat(400, "data", "minat");

  const id = idRawak(8);
  await env.DB.prepare(
    `INSERT INTO taja (id, dicipta, syarikat, pegawai, jawatan, emel, telefon, minat, mesej)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`
  ).bind(id, new Date().toISOString(), r.syarikat, r.pegawai, r.jawatan, r.emel, r.telefon, r.minat, r.mesej).run();

  if (env.RESEND_API_KEY && env.EMEL_DARI && env.EMEL_PENTADBIR) {
    const badan = Object.entries(r).map(([k, v]) => `<p><b>${esc(k)}</b>: ${esc(v).replace(/\n/g, "<br>")}</p>`).join("");
    ctx.waitUntil(
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
        body: JSON.stringify({
          from: env.EMEL_DARI,
          to: [env.EMEL_PENTADBIR],
          reply_to: r.emel,
          subject: `Hasrat penajaan DEGUP: ${r.syarikat}`,
          html: badan
        })
      }).catch(() => {})
    );
  }
  return json({ ok: true });
}
