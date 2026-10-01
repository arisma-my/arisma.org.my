/* ARISMA Foundation: bahasa, menu, video, penjejak kutipan */
(function () {
  "use strict";
  var akar = document.documentElement;

  function tetapBahasa(b) {
    b = b === "en" ? "en" : "ms";
    akar.setAttribute("data-b", b);
    akar.setAttribute("lang", b);
    try { localStorage.setItem("bahasa", b); } catch (e) {}
    document.dispatchEvent(new CustomEvent("bahasa", { detail: b }));
  }
  var mula = "ms";
  try { mula = localStorage.getItem("bahasa") || "ms"; } catch (e) {}
  var q = new URLSearchParams(location.search).get("lang");
  if (q === "en" || q === "ms") mula = q;
  tetapBahasa(mula);

  window.T = function (ms, en) { return akar.getAttribute("data-b") === "en" ? en : ms; };

  var bb = document.getElementById("bahasa");
  if (bb) bb.addEventListener("click", function () { tetapBahasa(akar.getAttribute("data-b") === "en" ? "ms" : "en"); });

  // Menu mudah alih
  var mb = document.getElementById("menuBtn"), nav = document.getElementById("nav");
  if (mb && nav) {
    mb.addEventListener("click", function () {
      var buka = mb.getAttribute("aria-expanded") !== "true";
      mb.setAttribute("aria-expanded", String(buka));
      nav.classList.toggle("buka", buka);
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) { mb.setAttribute("aria-expanded", "false"); nav.classList.remove("buka"); }
    });
  }

  // Video logo: sembunyi jika fail tiada; hormati "kurangkan gerakan"
  var v = document.getElementById("intro");
  if (v) {
    var fig = v.closest("figure"), ulang = document.getElementById("ulang");
    var sembunyi = function () { if (fig) fig.hidden = true; };
    v.addEventListener("error", sembunyi, true);
    Array.prototype.forEach.call(v.querySelectorAll("source"), function (s) { s.addEventListener("error", sembunyi); });
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { v.removeAttribute("autoplay"); v.pause(); v.controls = true; }
    v.addEventListener("ended", function () { if (ulang) ulang.hidden = false; });
    if (ulang) ulang.addEventListener("click", function () { v.currentTime = 0; v.play(); ulang.hidden = true; });
  }

  // Penjejak kutipan
  function rm(n) { return "RM " + Math.round(n).toLocaleString("en-MY"); }
  Array.prototype.forEach.call(document.querySelectorAll("[data-penjejak]"), function (el) {
    fetch("/api/kutipan?kempen=" + encodeURIComponent(el.getAttribute("data-penjejak")))
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (j) {
        if (!j || !j.ok || !j.sasaran) return;
        var pct = Math.max(0, Math.min(100, (j.terkumpul / j.sasaran) * 100));
        el.querySelector("[data-jumlah]").textContent = rm(j.terkumpul);
        el.querySelector("[data-sasaran]").textContent = rm(j.sasaran);
        el.querySelector("[data-peratus]").textContent = (pct > 0 && pct < 10 ? pct.toFixed(1) : Math.round(pct)) + "%";
        var bar = el.querySelector("[role=progressbar]");
        bar.setAttribute("aria-valuenow", String(Math.round(pct)));
        el.hidden = false;
        requestAnimationFrame(function () { bar.firstElementChild.style.width = pct + "%"; });
      })
      .catch(function () {});
  });

  Array.prototype.forEach.call(document.querySelectorAll("[data-tahun]"), function (e) { e.textContent = new Date().getFullYear(); });
})();
