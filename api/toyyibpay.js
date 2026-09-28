// Vercel Serverless Function: /api/toyyibpay
// Catat penderma ke tab "Penderma" dalam Google Sheet.
//
// Cara ia berfungsi (penting untuk integriti):
//  - Notis (callback) daripada toyyibPay TIDAK dipercayai. Ia hanya dijadikan isyarat.
//  - Setiap kali, kita tanya toyyibPay sendiri (getBillTransactions) senarai bayaran BERJAYA,
//    dan hantar senarai itu ke Sheet. Sheet buang rekod berulang.
//  - Jadi rekod palsu tidak boleh dimasukkan hanya dengan menghantar notis palsu.
//
// Vercel > Settings > Environment Variables:
//   TOYYIBPAY_BILLCODES  kod bil toyyibPay (dipisah koma)
//   APPS_SCRIPT_URL      pautan Web app Apps Script
//   KUNCI_SKRIP          kunci daripada fungsi tetapkanKunci() dalam Apps Script
//   CRON_SECRET          (pilihan) untuk semakan harian automatik (GET) dengan Vercel Cron
//
// Dalam toyyibPay, letak Callback URL bil: https://arisma.org.my/api/toyyibpay

export default async function handler(req, res) {
  const kodBil = String(process.env.TOYYIBPAY_BILLCODES || "")
    .split(",").map(s => s.trim()).filter(Boolean);
  const skrip = process.env.APPS_SCRIPT_URL;
  const kunci = process.env.KUNCI_SKRIP;

  if (!kodBil.length || !skrip || !kunci) {
    return res.status(200).json({ ok: false, sebab: "belum disambung" });
  }

  if (req.method === "POST") {
    const b = req.body || {};
    if (kodBil.indexOf(String(b.billcode || "")) === -1) {
      return res.status(200).json({ ok: true, abaikan: true });
    }
  } else if (req.method === "GET") {
    const auth = req.headers.authorization || "";
    if (!process.env.CRON_SECRET || auth !== "Bearer " + process.env.CRON_SECRET) {
      return res.status(401).json({ ok: false });
    }
  } else {
    return res.status(405).json({ ok: false });
  }

  const baris = [];
  for (const kod of kodBil) {
    try {
      const r = await fetch("https://toyyibpay.com/index.php/api/getBillTransactions", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ billCode: kod, billpaymentStatus: "1" })
      });
      const data = JSON.parse(await r.text());
      if (!Array.isArray(data)) continue;
      for (const t of data) {
        if (t.billpaymentStatus != null && String(t.billpaymentStatus) !== "1") continue;
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
    } catch (e) {
      // tiada transaksi / bukan JSON; teruskan
    }
  }

  if (!baris.length) return res.status(200).json({ ok: true, dihantar: 0 });

  try {
    const r = await fetch(skrip, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kunci, tindakan: "penderma", baris }),
      redirect: "follow"
    });
    const j = JSON.parse(await r.text());
    return res.status(200).json({ ok: !!j.ok, dihantar: baris.length, baru: j.baru });
  } catch (e) {
    return res.status(200).json({ ok: false, sebab: "sheet tidak dapat dihubungi" });
  }
}
