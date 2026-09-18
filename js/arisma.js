/* ARISMA — skrip kongsi untuk laman akademi dan laman Yayasan.
   Setiap blok menyemak dahulu sama ada elemennya ada dalam laman,
   supaya fail yang sama boleh dipakai walaupun laman itu tiada kedai
   atau tiada borang tertentu. */
(function(){
  "use strict";

  var WA = "60122290403";
  function openWA(text){
    window.open("https://wa.me/" + WA + "?text=" + encodeURIComponent(text), "_blank", "noopener");
  }

  /* ---------- Tahun dalam footer ---------- */
  var yr = document.getElementById("yr");
  if(yr){ yr.textContent = new Date().getFullYear(); }

  /* ---------- Menu mudah alih ---------- */
  var nav = document.getElementById("nav"),
      menuBtn = document.getElementById("menuBtn");
  if(nav && menuBtn){
    menuBtn.addEventListener("click", function(){
      var open = nav.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", open);
    });
    nav.addEventListener("click", function(e){
      if(e.target.tagName === "A"){
        nav.classList.remove("open");
        menuBtn.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- Saiz teks, tiga peringkat ---------- */
  var tBtn = document.getElementById("textSize");
  if(tBtn){
    var sizes = ["1.0625rem","1.1875rem","1.3125rem"], si = 0;
    tBtn.addEventListener("click", function(){
      si = (si + 1) % sizes.length;
      document.documentElement.style.setProperty("--fs", sizes[si]);
      tBtn.setAttribute("aria-label", si === sizes.length - 1 ? "Kembalikan saiz teks asal" : "Besarkan saiz teks");
    });
  }

  /* ---------- Kedai ARISMA (laman akademi sahaja) ---------- */
  var shelf = document.getElementById("shelf");
  if(shelf){
    var products = [
      {id:"bawang", name:"Kerepek Bawang", desc:"Rangup dan masin sedikit, sesuai untuk minum petang.", fill:"f-bawang"},
      {id:"pisang", name:"Kerepek Pisang", desc:"Hirisan pisang yang digoreng hingga keemasan.", fill:"f-pisang"},
      {id:"kacang", name:"Kacang", desc:"Kudapan klasik untuk tetamu dan perjalanan.", fill:"f-kacang"},
      {id:"tart", name:"Tart Nanas", desc:"Jem nanas di atas pastri lembut. Pilihan musim perayaan.", fill:"f-tart"},
      {id:"coklat", name:"Biskut Coklat Cip", desc:"Biskut rangup dengan cip coklat dalam setiap gigitan.", fill:"f-coklat"},
      {id:"jus", name:"Jus Nanas", desc:"Minuman nanas yang segar dan manis.", fill:"f-jus", bottle:true}
    ];
    var qty = {};
    products.forEach(function(p){
      qty[p.id] = 0;
      var el = document.createElement("article");
      el.className = "item";
      el.innerHTML =
        '<div class="stage"><div class="jar' + (p.bottle ? ' bottle' : '') + '" aria-hidden="true">' +
          '<div class="lid"></div><div class="body"><div class="fill ' + p.fill + '"></div></div>' +
          '<div class="label"><small>ARISMA</small>' + p.name + '</div></div></div>' +
        '<h3>' + p.name + '</h3><p class="desc">' + p.desc + '</p>' +
        '<p class="price">RM <span class="isi">[isi harga]</span></p>' +
        '<div class="qty" role="group" aria-label="Kuantiti ' + p.name + '">' +
          '<button type="button" data-id="' + p.id + '" data-d="-1" aria-label="Kurangkan ' + p.name + '">\u2212</button>' +
          '<output id="q-' + p.id + '">0</output>' +
          '<button type="button" data-id="' + p.id + '" data-d="1" aria-label="Tambah ' + p.name + '">+</button></div>';
      shelf.appendChild(el);
    });

    var sum = document.getElementById("orderSum"),
        orderBtn = document.getElementById("orderBtn");

    function chosen(){ return products.filter(function(p){ return qty[p.id] > 0; }); }

    function render(){
      if(!sum || !orderBtn) return;
      var c = chosen(), n = c.reduce(function(a,p){ return a + qty[p.id]; }, 0);
      if(!n){
        sum.textContent = "Belum ada produk dipilih.";
        orderBtn.disabled = true;
        return;
      }
      sum.innerHTML = "<b>" + n + " item</b> \u00b7 " + c.map(function(p){ return qty[p.id] + "\u00d7 " + p.name; }).join(", ");
      orderBtn.disabled = false;
    }

    shelf.addEventListener("click", function(e){
      var b = e.target.closest("button[data-id]");
      if(!b) return;
      var id = b.dataset.id;
      qty[id] = Math.max(0, Math.min(99, qty[id] + Number(b.dataset.d)));
      document.getElementById("q-" + id).textContent = qty[id];
      render();
    });

    if(orderBtn){
      orderBtn.addEventListener("click", function(){
        var lines = chosen().map(function(p){ return "- " + p.name + " \u00d7 " + qty[p.id]; });
        openWA("Assalamualaikum ARISMA, saya ingin membuat tempahan:\n" + lines.join("\n") + "\n\nNama:\nAlamat / cara ambil:");
      });
    }
  }

  /* ---------- Borang, dihantar melalui WhatsApp ---------- */
  function handle(formId, msgId, build){
    var f = document.getElementById(formId),
        msg = document.getElementById(msgId);
    if(!f || !msg) return;
    var original = msg.textContent;
    f.addEventListener("submit", function(e){
      e.preventDefault();
      var missing = Array.prototype.filter.call(f.querySelectorAll("[required]"), function(i){ return !i.value.trim(); });
      if(missing.length){
        msg.className = "err";
        msg.textContent = "Sila isi: " + missing.map(function(i){
          var l = f.querySelector('label[for="' + i.id + '"]');
          return l ? l.textContent.trim() : i.name;
        }).join(", ") + ".";
        missing[0].focus();
        return;
      }
      msg.className = "hint";
      msg.textContent = original;
      openWA(build(f.elements));
    });
  }

  /* Pendaftaran pelatih — laman akademi */
  handle("enquiryForm", "e-msg", function(x){
    return "Assalamualaikum ARISMA, saya ingin bertanya tentang pendaftaran.\n\nNama: " + x.parent.value +
      "\nTelefon: " + x.phone.value + "\nNama anak: " + x.child.value +
      (x.age.value ? "\nUmur anak: " + x.age.value : "") +
      (x.bias.checked ? "\nSaya ingin tahu tentang biasiswa ARISMA." : "") +
      (x.note.value ? "\n\nTentang anak saya:\n" + x.note.value : "");
  });

  /* Sukarelawan dan lawatan — laman akademi */
  handle("visitForm", "v-msg", function(x){
    return "Assalamualaikum ARISMA, saya ingin mengatur " + x.type.value.toLowerCase() + ".\n\nNama: " + x.name.value +
      (x.org.value ? "\nOrganisasi: " + x.org.value : "") +
      (x.size.value ? "\nBilangan: " + x.size.value : "") +
      (x.date.value ? "\nTarikh cadangan: " + x.date.value : "") +
      (x.note.value ? "\n\n" + x.note.value : "");
  });

  /* Penajaan dan CSR — laman Yayasan */
  handle("giveForm", "g-msg", function(x){
    return "Assalamualaikum Yayasan ARISMA, saya ingin bertanya tentang sumbangan.\n\nNama: " + x.name.value +
      "\nTelefon: " + x.phone.value +
      (x.org.value ? "\nOrganisasi: " + x.org.value : "") +
      "\nJenis sumbangan: " + x.type.value +
      (x.note.value ? "\n\n" + x.note.value : "");
  });

  /* ---------- Salin nombor akaun ---------- */
  Array.prototype.forEach.call(document.querySelectorAll("button.copy"), function(b){
    var toast = b.parentNode.querySelector(".toast");
    b.addEventListener("click", function(){
      var t = b.dataset.copy;
      (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function(){
        if(toast) toast.textContent = "Disalin: " + t;
      }, function(){
        if(toast) toast.textContent = "Salin secara manual: " + t;
      });
    });
  });

})();
/* ============================================================
   MUNCUL PERLAHAN SEMASA SKROL
   Tampal blok ini di HUJUNG fail js/arisma.js, iaitu SELEPAS
   baris terakhir yang berbunyi:   })();
   ============================================================ */
(function(){
  "use strict";

  // Jika pengunjung meminta gerakan minimum, jangan buat apa-apa.
  if(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if(!("IntersectionObserver" in window)) return;

  // Pilih elemen yang patut muncul perlahan.
  var pilih = [
    ".sec-head", ".prog", ".aut", ".fact", ".give",
    ".person", ".gal figure", ".contact", ".vm-block",
    ".form-card", ".agro", ".hero-shot", ".xlink-row", ".creds"
  ].join(",");

  var item = document.querySelectorAll(pilih);
  if(!item.length) return;

  // Tandakan dokumen supaya CSS tahu JS hidup.
  document.documentElement.classList.add("reveal-on");

  Array.prototype.forEach.call(item, function(el, i){
    el.classList.add("reveal");
    // Sedikit lengah berturutan supaya kad tidak muncul serentak.
    el.style.transitionDelay = (Math.min(i % 6, 5) * 70) + "ms";
  });

  var pemerhati = new IntersectionObserver(function(masuk){
    masuk.forEach(function(e){
      if(e.isIntersecting){
        e.target.classList.add("seen");
        pemerhati.unobserve(e.target);
      }
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

  Array.prototype.forEach.call(item, function(el){ pemerhati.observe(el); });
})();
