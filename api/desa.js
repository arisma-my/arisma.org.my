// Vercel Serverless Function: /api/desa
// Jumlahkan semua bayaran berjaya bagi bil toyyibPay Desa ARISMA,
// campur kutipan luar (tunai / bank) daripada tab "Tetapan" dalam Google Sheet.
//
// Vercel > Settings > Environment Variables:
//   TOYYIBPAY_BILLCODES  kod bil toyyibPay, dipisah koma jika lebih dari satu (cth. "abc123,xyz789")
//   APPS_SCRIPT_URL      (pilihan) untuk baca "kutipan_luar" daripada Sheet
//   DESA_TAMBAHAN        (pilihan) sandaran jika Sheet tidak dapat dibaca, dalam RM
//
// getBillTransactions tidak memerlukan secret key, jadi tiada rahsia disimpan di sini.

async function kutipanLuar() {
  const url = process.env.APPS_SCRIPT_URL;
  if (!url) return null;
  try {
    const r = await fetch(url, { redirect: "follow" });
    const j = JSON.parse(await r.text());
    const n = parseFloat(String((j.tetapan || {}).kutipan_luar || "").replace(/[^0-9.]/g, ""));
    return isNaN(n) ? null : n;
  } catch (e) {
    return null;
  }
}

export default async function handler(req, res) {
  const codes = String(process.env.TOYYIBPAY_BILLCODES || "")
    .split(",").map(s => s.trim()).filter(Boolean);

  let total = 0, count = 0;
  for (const code of codes) {
    try {
      const r = await fetch("https://toyyibpay.com/index.php/api/getBillTransactions", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ billCode: code, billpaymentStatus: "1" })
      });
      const data = JSON.parse(await r.text());
      if (Array.isArray(data)) {
        for (const t of data) {
          // Pertahanan berlapis: walaupun sudah ditapis oleh toyyibPay, buang apa-apa yang jelas bukan "berjaya".
          if (t.billpaymentStatus != null && String(t.billpaymentStatus) !== "1") continue;
          const amt = parseFloat(t.billpaymentAmount);
          if (!isNaN(amt)) { total += amt; count++; }
        }
      }
    } catch (e) {
      // toyyibPay pulangkan teks bukan JSON bila tiada transaksi; abaikan
    }
  }

  const luar = await kutipanLuar();
  total += luar != null ? luar : (parseFloat(process.env.DESA_TAMBAHAN || "0") || 0);

  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
  res.status(200).json({
    terkumpul: Math.round(total * 100) / 100,
    penderma: count,
    dikemaskini: new Date().toISOString()
  });
}
