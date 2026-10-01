/* Halaman Sumbang */
(function () {
  "use strict";
  var f = document.getElementById("borangSumbang");
  if (!f) return;
  var mesej = document.getElementById("mesej"), btn = document.getElementById("hantar");
  var tutup = document.getElementById("tutup"), memuat = document.getElementById("memuat");
  var lainNilai = document.getElementById("amaunLainNilai");
  var tsId = null, had = { min: 10, maks: 30000 };

  var k = new URLSearchParams(location.search).get("kempen");
  if (k) { var r = f.querySelector('input[name="kempen"][value="' + k.replace(/[^a-z0-9]/g, "") + '"]'); if (r) r.checked = true; }

  function jenisId() {
    var syarikat = f.querySelector('input[name="jenis"]:checked').value === "syarikat";
    document.getElementById("labelIndividu").hidden = syarikat;
    document.getElementById("labelSyarikat").hidden = !syarikat;
    document.getElementById("labelNamaIndividu").hidden = syarikat;
    document.getElementById("labelNamaSyarikat").hidden = !syarikat;
  }
  f.addEventListener("change", function (e) {
    if (e.target.name === "pilihan") {
      lainNilai.disabled = e.target.value !== "lain";
      if (!lainNilai.disabled) lainNilai.focus();
    }
    if (e.target.name === "jenis") jenisId();
  });
  jenisId();

  fetch("/api/tetapan")
    .then(function (r) { return r.json(); })
    .then(function (j) {
      memuat.hidden = true;
      if (!j.buka) { tutup.hidden = false; return; }
      had.min = j.min; had.maks = j.maks;
      lainNilai.min = j.min; lainNilai.max = j.maks;
      document.getElementById("hadMin").textContent = "RM" + j.min;
      document.getElementById("hadMaks").textContent = "RM" + Number(j.maks).toLocaleString("en-MY");
      f.hidden = false;
      return Borang.turnstile(document.getElementById("ts"), j.turnstile).then(function (id) { tsId = id; });
    })
    .catch(function () { memuat.hidden = true; tutup.hidden = false; });

  function tunjuk(teks, jenis) { mesej.textContent = teks; mesej.className = "mesej " + (jenis || "ralat"); }

  f.addEventListener("submit", function (e) {
    e.preventDefault();
    Borang.tanda(f);
    var pilihan = f.querySelector('input[name="pilihan"]:checked');
    var amaun = pilihan && pilihan.value === "lain" ? Number(lainNilai.value) : Number(pilihan && pilihan.value);
    if (!amaun || amaun < had.min || amaun > had.maks) {
      Borang.tanda(f, pilihan && pilihan.value === "lain" ? "amaunLain" : "pilihan");
      return tunjuk(window.T("Masukkan amaun antara RM" + had.min + " dan RM" + had.maks + ".", "Enter an amount between RM" + had.min + " and RM" + had.maks + "."));
    }
    if (!f.reportValidity()) return;
    var token = Borang.token(tsId);
    if (!token) return tunjuk(Borang.mesej("turnstile"));

    var data = {
      kempen: f.querySelector('input[name="kempen"]:checked').value,
      amaun: Math.round(amaun * 100) / 100,
      jenis: f.querySelector('input[name="jenis"]:checked').value,
      nama: f.nama.value, no_id: f.no_id.value, alamat: f.alamat.value,
      emel: f.emel.value, telefon: f.telefon.value,
      setuju: f.setuju.checked, turnstile: token
    };
    btn.disabled = true;
    tunjuk(window.T("Menyediakan pembayaran…", "Preparing payment…"), "ok");
    Borang.hantar("/api/sumbang", data).then(function (j) {
      if (j.ok && /^https:\/\/(dev\.)?toyyibpay\.com\/[A-Za-z0-9]+$/.test(j.url)) { location.assign(j.url); return; }
      btn.disabled = false;
      Borang.reset(tsId);
      Borang.tanda(f, j.medan);
      tunjuk(Borang.mesej(j.kod));
    });
  });
})();
