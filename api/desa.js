// Vercel Serverless Function: /api/desa
// Jumlahkan semua bayaran berjaya bagi bil toyyibPay Desa ARISMA.
//
// Tetapkan dalam Vercel > Project > Settings > Environment Variables:
//   TOYYIBPAY_BILLCODES  kod bil toyyibPay, dipisah koma jika lebih dari satu (cth. "abc123,xyz789")
//   DESA_TAMBAHAN        (pilihan) kutipan sebelum toyyibPay, dalam RM (cth. "35000")
//
// getBillTransactions tidak memerlukan secret key, jadi tiada rahsia disimpan di sini.

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
          const amt = parseFloat(t.billpaymentAmount);
          if (!isNaN(amt)) { total += amt; count++; }
        }
      }
    } catch (e) {
      // toyyibPay pulangkan teks bukan JSON bila tiada transaksi; abaikan
    }
  }

  total += parseFloat(process.env.DESA_TAMBAHAN || "0") || 0;

  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
  res.status(200).json({
    terkumpul: Math.round(total * 100) / 100,
    penderma: count,
    dikemaskini: new Date().toISOString()
  });
}
