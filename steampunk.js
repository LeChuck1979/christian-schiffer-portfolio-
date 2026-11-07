/* =========================================================
   STEAMPUNK – Schiffers Dechiffrier-Apparat
   Die Website als dampfbetriebene Maschine.
   Inhalte kommen aus content.js (window.SITE).
   ========================================================= */
(function () {
  "use strict";
  var S = window.SITE;
  var main = document.getElementById("sp-main");
  var where = document.getElementById("sp-where");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var MASCOT = "graphics/themes/steampunk-maskottchen.webp";
  var SVGNS = "http://www.w3.org/2000/svg";

  /* ---------- Speicher ---------- */
  function load(key, fallback) { try { var v = localStorage.getItem("cs-steampunk-" + key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; } }
  function save(key, val) { try { localStorage.setItem("cs-steampunk-" + key, JSON.stringify(val)); } catch (e) {} }
  var soundOn = load("ton", true);
  var visited = load("besucht", {});
  var druck = load("druck", 0);

  /* ---------- Die sechs Kammern ---------- */
  var KAMMERN = [
    { id: "journalismus", nr: "I",   name: "Journalismus", sub: "Das Archiv",         word: "ARCHIV" },
    { id: "werkstatt",    nr: "II",  name: "KI-Werkstatt", sub: "Die Werkstatt",      word: "WERKST." },
    { id: "buehne",       nr: "III", name: "Bühne",        sub: "Das Varieté",        word: "BÜHNE" },
    { id: "erfinder",     nr: "IV",  name: "Über mich",    sub: "Der Erfinder",       word: "ERFINDER" },
    { id: "orden",        nr: "V",   name: "Preise",       sub: "Die Ordensvitrine",  word: "ORDEN" },
    { id: "rohrpost",     nr: "VI",  name: "Kontakt",      sub: "Die Rohrpost",       word: "ROHRPOST" }
  ];
  function kammerIndex(id) { for (var i = 0; i < KAMMERN.length; i++) if (KAMMERN[i].id === id) return i; return -1; }

  /* =========================================================
     Geräusche – alles live erzeugt, keine Tondateien
     ========================================================= */
  var ctx = null, noiseBuf = null;
  function audio() {
    if (!soundOn) return null;
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  function noise(a) {
    if (!noiseBuf) {
      noiseBuf = a.createBuffer(1, a.sampleRate * 1.5, a.sampleRate);
      var d = noiseBuf.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    var s = a.createBufferSource(); s.buffer = noiseBuf; s.loop = true; return s;
  }
  function env(a, g, t, attack, peak, dur) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }
  function tone(freq, start, dur, type, vol, slideTo) {
    var a = audio(); if (!a) return;
    var o = a.createOscillator(), g = a.createGain(), t = a.currentTime + (start || 0);
    o.type = type || "sine"; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    env(a, g, t, 0.005, vol || 0.08, dur);
    o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + dur + 0.05);
  }
  function hissAt(start, dur, vol, filterType, freq, freqTo) {
    var a = audio(); if (!a) return;
    var n = noise(a), f = a.createBiquadFilter(), g = a.createGain(), t = a.currentTime + (start || 0);
    f.type = filterType || "highpass"; f.frequency.setValueAtTime(freq || 2200, t);
    if (freqTo) f.frequency.exponentialRampToValueAtTime(freqTo, t + dur);
    env(a, g, t, Math.min(0.04, dur / 4), vol || 0.1, dur);
    n.connect(f); f.connect(g); g.connect(a.destination); n.start(t); n.stop(t + dur + 0.05);
  }
  function bell(start, f0, vol) {
    [1, 2.76, 5.4, 8.93].forEach(function (m, i) { tone(f0 * m, start, 1.6 / (i + 1), "sine", (vol || 0.07) / (i + 1)); });
  }
  var sfx = {
    tick: function () { hissAt(0, 0.025, 0.12, "bandpass", 3200); },
    ratchet: function (n) { for (var i = 0; i < (n || 5); i++) { hissAt(i * 0.045, 0.02, 0.16, "bandpass", 2600 + Math.random() * 900); tone(1400, i * 0.045, 0.015, "square", 0.012); } },
    telegraph: function () { bell(0, 988, 0.06); bell(0.24, 988, 0.06); },
    clank: function () { tone(120, 0, 0.35, "triangle", 0.16, 70); hissAt(0, 0.12, 0.12, "lowpass", 900); tone(620, 0, 0.25, "sine", 0.03); },
    hiss: function (dur) { hissAt(0, dur || 0.7, 0.07, "highpass", 2600, 4200); },
    chuff: function (i) { hissAt(i || 0, 0.18, 0.13, "bandpass", 700, 300); },
    whistle: function (len) {
      var L = len || 1.4;
      [740, 932, 1175].forEach(function (f) { tone(f * 0.92, 0, L, "triangle", 0.035, f); });
      hissAt(0, L, 0.05, "bandpass", 1300);
    },
    whoosh: function () { hissAt(0, 0.7, 0.12, "bandpass", 300, 3200); },
    clack: function () { hissAt(0, 0.03, 0.2, "highpass", 1800); tone(1900, 0, 0.02, "square", 0.02); tone(180, 0.015, 0.06, "triangle", 0.06); },
    drawer: function () { hissAt(0, 0.32, 0.09, "lowpass", 380, 900); tone(140, 0.3, 0.12, "triangle", 0.1, 90); },
    kling: function () { bell(0, 1568, 0.05); tone(2349, 0.02, 0.4, "sine", 0.02); },
    paper: function () { hissAt(0, 0.12, 0.05, "highpass", 3000); hissAt(0.1, 0.1, 0.04, "highpass", 4000); }
  };

  var soundBtn = document.getElementById("sp-sound");
  function paintSound() {
    document.getElementById("sp-sound-label").textContent = soundOn ? "Ton an" : "Ton aus";
    soundBtn.setAttribute("aria-pressed", soundOn ? "true" : "false");
    soundBtn.classList.toggle("is-off", !soundOn);
  }
  soundBtn.addEventListener("click", function () { soundOn = !soundOn; save("ton", soundOn); paintSound(); if (soundOn) sfx.telegraph(); });
  paintSound();

  /* ---------- Hilfsfunktionen ---------- */
  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === "class") n.className = attrs[k];
      else if (k === "text") n.textContent = attrs[k];
      else if (k === "html") n.innerHTML = attrs[k];
      else n.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return n;
  }
  function svg(tag, attrs, children) {
    var n = document.createElementNS(SVGNS, tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    (children || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }
  function p(text, cls) { return el("p", { text: text, class: cls || "" }); }
  function ext(url, text, cls) { return el("a", { href: url, target: "_blank", rel: "noopener noreferrer", class: cls, text: text }); }
  function roman(n) { return ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"][n] || String(n); }

  /* ---------- Dampfwölkchen ---------- */
  var steamBox = document.querySelector(".sp-steam");
  function puff(x, y, n, big) {
    if (reduce) return;
    if (steamBox.childElementCount > 60) return;
    for (var i = 0; i < (n || 5); i++) {
      var s = el("i", { class: "sp-puff" + (big ? " sp-puff--big" : "") });
      var size = (big ? 46 : 22) + Math.random() * (big ? 44 : 22);
      s.style.left = (x - size / 2 + (Math.random() - 0.5) * (big ? 60 : 18)) + "px";
      s.style.top = (y - size / 2) + "px";
      s.style.width = s.style.height = size + "px";
      s.style.setProperty("--dx", ((Math.random() - 0.5) * (big ? 120 : 50)).toFixed(0) + "px");
      s.style.setProperty("--dy", (-(big ? 120 : 50) - Math.random() * (big ? 160 : 70)).toFixed(0) + "px");
      s.style.animationDuration = (0.9 + Math.random() * 0.8).toFixed(2) + "s";
      s.style.animationDelay = (Math.random() * 0.15).toFixed(2) + "s";
      steamBox.appendChild(s);
      s.addEventListener("animationend", function () { this.remove(); });
    }
  }
  function puffFrom(node, n, big) { var r = node.getBoundingClientRect(); puff(r.left + r.width / 2, r.top + r.height / 3, n, big); }
  document.addEventListener("pointerdown", function (e) {
    if (e.button !== 0) return;
    if (e.target.closest && e.target.closest("input, textarea, .sp-dial, .sp-key-morse")) return;
    puff(e.clientX, e.clientY, 4);
  });

  /* ---------- Hinweiszettel ---------- */
  function toast(text, actions) {
    var old = document.querySelector(".sp-toast"); if (old) old.remove();
    var t = el("div", { class: "sp-toast", role: "status" }, [p(text)]);
    if (actions) t.appendChild(el("div", { class: "sp-toast__actions" }, actions));
    document.body.appendChild(t);
    if (!actions) setTimeout(function () { t.classList.add("is-gone"); setTimeout(function () { t.remove(); }, 500); }, 3600);
    return t;
  }

  /* =========================================================
     Zahnräder
     ========================================================= */
  function gearPath(teeth, rRoot, rTip, holes) {
    var d = "", step = Math.PI * 2 / teeth;
    for (var i = 0; i < teeth; i++) {
      var a0 = i * step;
      [[0, rRoot], [0.16, rTip], [0.44, rTip], [0.6, rRoot]].forEach(function (pt, j) {
        var a = a0 + pt[0] * step;
        d += (i === 0 && j === 0 ? "M" : "L") + (pt[1] * Math.cos(a)).toFixed(2) + " " + (pt[1] * Math.sin(a)).toFixed(2) + " ";
      });
    }
    d += "Z ";
    function circ(cx, cy, r) { return "M" + (cx - r).toFixed(2) + " " + cy.toFixed(2) + " a" + r + " " + r + " 0 1 0 " + (2 * r) + " 0 a" + r + " " + r + " 0 1 0 " + (-2 * r) + " 0 "; }
    var hn = holes || 5;
    for (var h = 0; h < hn; h++) { var ha = h * Math.PI * 2 / hn; d += circ(rRoot * 0.55 * Math.cos(ha), rRoot * 0.55 * Math.sin(ha), rRoot * 0.22); }
    d += circ(0, 0, rRoot * 0.12);
    return d;
  }
  var gears = []; // { node, ratio, phase }
  function gearSet(defs, viewBox, cls) {
    var defsEl = svg("defs", {}, [
      svg("linearGradient", { id: "spBrass" + cls, x1: "0", y1: "0", x2: "1", y2: "1" }, [
        svg("stop", { offset: "0", "stop-color": "#6b4a1f" }), svg("stop", { offset: ".25", "stop-color": "#e6c47a" }),
        svg("stop", { offset: ".5", "stop-color": "#8a6128" }), svg("stop", { offset: ".78", "stop-color": "#f0d48a" }),
        svg("stop", { offset: "1", "stop-color": "#6b4a1f" })
      ]),
      svg("linearGradient", { id: "spCopper" + cls, x1: "0", y1: "0", x2: "1", y2: "1" }, [
        svg("stop", { offset: "0", "stop-color": "#5a2a12" }), svg("stop", { offset: ".35", "stop-color": "#d98a55" }),
        svg("stop", { offset: ".65", "stop-color": "#8e4421" }), svg("stop", { offset: "1", "stop-color": "#e8a477" })
      ])
    ]);
    var root = svg("svg", { viewBox: viewBox, class: cls, "aria-hidden": "true" }, [defsEl]);
    var first = null;
    defs.forEach(function (g, i) {
      var pitch = g.teeth * 3;
      var shape = svg("path", { d: gearPath(g.teeth, pitch - 4, pitch + 5, g.holes), fill: "url(#sp" + (g.copper ? "Copper" : "Brass") + cls + ")", stroke: "#2a1a0c", "stroke-width": "1.5", "fill-rule": "evenodd" });
      var hub = svg("circle", { r: String(Math.max(5, pitch * 0.2)), fill: "none", stroke: "#2a1a0c", "stroke-width": "2", opacity: ".55" });
      var grp = svg("g", { class: "sp-gear" }, [shape, hub]);
      var holder = svg("g", { transform: "translate(" + g.x + " " + g.y + ")" }, [grp]);
      root.appendChild(holder);
      var entry = { node: grp, ratio: 1, phase: 0, teeth: g.teeth };
      if (i === 0) { first = entry; }
      else {
        var prev = gears[gears.length - 1], pd = defs[i - 1];
        var dir = Math.atan2(g.y - pd.y, g.x - pd.x) * 180 / Math.PI;
        entry.ratio = -prev.ratio * prev.teeth / g.teeth;
        var stepPrev = 360 / prev.teeth, stepMe = 360 / g.teeth;
        // Phase so wählen, dass ein Zahn genau in die Lücke des Nachbarn greift
        var prevToothAtDir = dir - 0.3 * stepPrev; // Drehung des Vorgängers, bei der ein Zahn genau auf der Verbindungslinie steht
        var baseAngle = (prevToothAtDir - prev.phase) / prev.ratio;
        entry.phase = (dir + 180 - 0.8 * stepMe) - entry.ratio * baseAngle;
      }
      gears.push(entry);
      grp.addEventListener("click", function () { spinBoost += 220; sfx.ratchet(7); });
    });
    return root;
  }
  var gearAngle = 0, spinBoost = 0, running = load("laeuft", false), lastT = 0;
  function gearLoop(t) {
    var dt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 0; lastT = t;
    if (!reduce) {
      if (running) gearAngle += dt * 14;
      if (spinBoost > 0) { var b = Math.min(spinBoost, dt * 520); gearAngle += b; spinBoost -= b; }
    }
    var a = gearAngle + (reduce ? 0 : window.scrollY * 0.22);
    for (var i = 0; i < gears.length; i++) {
      var g = gears[i]; if (!g.node.isConnected) continue;
      g.node.setAttribute("transform", "rotate(" + (a * g.ratio + g.phase).toFixed(2) + ")");
    }
    requestAnimationFrame(gearLoop);
  }

  /* =========================================================
     Manometer „Wissensdruck“
     ========================================================= */
  var gaugeCount = 0;
  function gauge(size) {
    var ticks = [], nums = [], gid = "spG" + (++gaugeCount);
    for (var i = 0; i <= 10; i++) {
      var a = (-135 + i * 27) * Math.PI / 180, x1 = 70 + 49 * Math.sin(a), y1 = 70 - 49 * Math.cos(a), x2 = 70 + 56 * Math.sin(a), y2 = 70 - 56 * Math.cos(a);
      ticks.push(svg("line", { x1: x1.toFixed(1), y1: y1.toFixed(1), x2: x2.toFixed(1), y2: y2.toFixed(1), stroke: "#2a1a0c", "stroke-width": i % 5 === 0 ? "2.4" : "1.4" }));
      if (i % 2 === 0) { var t = svg("text", { x: (70 + 39 * Math.sin(a)).toFixed(1), y: (70 - 39 * Math.cos(a) + 3.5).toFixed(1), "text-anchor": "middle", class: "sp-gauge__num" }); t.textContent = String(i); nums.push(t); }
    }
    function arcPath(from, to, r) {
      var a1 = (-135 + from * 27) * Math.PI / 180, a2 = (-135 + to * 27) * Math.PI / 180;
      return "M" + (70 + r * Math.sin(a1)).toFixed(1) + " " + (70 - r * Math.cos(a1)).toFixed(1) + " A" + r + " " + r + " 0 0 1 " + (70 + r * Math.sin(a2)).toFixed(1) + " " + (70 - r * Math.cos(a2)).toFixed(1);
    }
    var label = svg("text", { x: "70", y: "116", "text-anchor": "middle", class: "sp-gauge__label" }); label.textContent = "WISSENSDRUCK";
    var unit = svg("text", { x: "70", y: "99", "text-anchor": "middle", class: "sp-gauge__unit" }); unit.textContent = "bar";
    var needle = svg("g", { class: "sp-gauge__needle" }, [
      svg("path", { d: "M70 22 L73.5 72 L66.5 72 Z", fill: "#8e1f14" }),
      svg("path", { d: "M68 72 L72 72 L71 86 L69 86 Z", fill: "#2a1a0c" })
    ]);
    var s = svg("svg", { viewBox: "0 0 140 140", class: "sp-gauge", width: String(size), height: String(size), "aria-hidden": "true" }, [
      svg("circle", { cx: "70", cy: "70", r: "68", fill: "url(#" + gid + "b)", stroke: "#2a1a0c", "stroke-width": "2" }),
      svg("defs", {}, [svg("radialGradient", { id: gid + "b", cx: ".35", cy: ".3", r: ".9" }, [svg("stop", { offset: "0", "stop-color": "#f6dd9c" }), svg("stop", { offset: ".55", "stop-color": "#b7883c" }), svg("stop", { offset: "1", "stop-color": "#5d3f17" })]),
        svg("radialGradient", { id: gid + "f", cx: ".45", cy: ".4", r: ".7" }, [svg("stop", { offset: "0", "stop-color": "#fbf1d8" }), svg("stop", { offset: "1", "stop-color": "#dcc28e" })])]),
      svg("circle", { cx: "70", cy: "70", r: "60", fill: "#2a1a0c" }),
      svg("circle", { cx: "70", cy: "70", r: "58", fill: "url(#" + gid + "f)" }),
      svg("path", { d: arcPath(8, 10, 52.5), stroke: "#a3261a", "stroke-width": "7", fill: "none" }),
      svg("path", { d: arcPath(0, 8, 52.5), stroke: "#6f8f6a", "stroke-width": "2", fill: "none", opacity: ".7" })
    ].concat(ticks, nums, [label, unit, needle,
      svg("circle", { cx: "70", cy: "70", r: "7", fill: "url(#" + gid + "b)", stroke: "#2a1a0c", "stroke-width": "1.5" }),
      svg("ellipse", { cx: "55", cy: "45", rx: "26", ry: "14", fill: "#fff", opacity: ".18", transform: "rotate(-30 55 45)" })
    ]));
    return s;
  }
  function paintGauges() {
    var deg = -135 + Math.min(100, druck) * 2.7;
    Array.prototype.forEach.call(document.querySelectorAll(".sp-gauge__needle"), function (n) { n.style.transform = "rotate(" + deg.toFixed(1) + "deg)"; });
    Array.prototype.forEach.call(document.querySelectorAll(".sp-gauge-read"), function (n) { n.textContent = (druck / 10).toFixed(1).replace(".", ",") + " bar"; });
  }
  var overShown = false;
  function bump(n) {
    if (druck >= 100) return;
    druck = Math.min(100, druck + n); save("druck", druck); paintGauges();
    if (druck >= 100 && !overShown) setTimeout(overpressure, 500);
  }
  function overpressure() {
    overShown = true;
    sfx.whistle(1.8);
    Array.prototype.forEach.call(document.querySelectorAll(".sp-gauge"), function (g) { g.classList.add("is-over"); if (g.getBoundingClientRect().width) puffFrom(g, 14, true); });
    var go1 = el("button", { type: "button", class: "sp-btn", text: "Druck ablassen: Christian schreiben" });
    var go2 = el("button", { type: "button", class: "sp-btn sp-btn--ghost", text: "Weiterlesen" });
    var t = toast("Überdruck im Kessel! Sie wissen jetzt genug, um Christian zu buchen.", [go1, go2]);
    function release(target) {
      t.remove(); sfx.hiss(1.2); druck = 60; save("druck", druck); paintGauges();
      Array.prototype.forEach.call(document.querySelectorAll(".sp-gauge"), function (g) { g.classList.remove("is-over"); });
      overShown = false;
      if (target) go(target);
    }
    go1.addEventListener("click", function () { release("rohrpost"); });
    go2.addEventListener("click", function () { release(null); });
  }

  /* =========================================================
     Maschinentelegraf (Navigation)
     ========================================================= */
  var dialHandle = null, dialSectors = [], dialSvg = null, dialValue = 0;
  function sectorPath(i, r1, r2) {
    var a1 = (-90 + i * 30) * Math.PI / 180, a2 = (-60 + i * 30) * Math.PI / 180;
    function pt(r, a) { return (150 + r * Math.sin(a)).toFixed(1) + " " + (160 - r * Math.cos(a)).toFixed(1); }
    return "M" + pt(r1, a1) + " L" + pt(r2, a1) + " A" + r2 + " " + r2 + " 0 0 1 " + pt(r2, a2) + " L" + pt(r1, a2) + " A" + r1 + " " + r1 + " 0 0 0 " + pt(r1, a1) + " Z";
  }
  function buildDial() {
    var parts = [
      svg("defs", {}, [
        svg("linearGradient", { id: "spDialBrass", x1: "0", y1: "0", x2: "1", y2: "1" }, [svg("stop", { offset: "0", "stop-color": "#6b4a1f" }), svg("stop", { offset: ".3", "stop-color": "#e6c47a" }), svg("stop", { offset: ".55", "stop-color": "#8a6128" }), svg("stop", { offset: ".8", "stop-color": "#f0d48a" }), svg("stop", { offset: "1", "stop-color": "#6b4a1f" })]),
        svg("radialGradient", { id: "spDialFace", cx: ".5", cy: "1", r: "1" }, [svg("stop", { offset: "0", "stop-color": "#fbf1d8" }), svg("stop", { offset: "1", "stop-color": "#d9bd86" })])
      ]),
      svg("path", { d: "M8 160 A142 142 0 0 1 292 160 L292 172 L8 172 Z", fill: "url(#spDialBrass)", stroke: "#2a1a0c", "stroke-width": "2" }),
      svg("path", { d: "M22 160 A128 128 0 0 1 278 160 Z", fill: "url(#spDialFace)", stroke: "#2a1a0c", "stroke-width": "1.5" })
    ];
    for (var r = 0; r < 9; r++) { var ra = (-80 + r * 20) * Math.PI / 180; parts.push(svg("circle", { cx: (150 + 135 * Math.sin(ra)).toFixed(1), cy: (160 - 135 * Math.cos(ra)).toFixed(1), r: "2.6", fill: "#f6dd9c", stroke: "#4a3214", "stroke-width": "1" })); }
    KAMMERN.forEach(function (k, i) {
      var sec = svg("path", { d: sectorPath(i, 46, 126), class: "sp-dial__sector", "data-i": String(i) });
      dialSectors.push(sec); parts.push(sec);
      var a = (-75 + i * 30);
      var numT = svg("text", { x: "150", y: String(160 - 92), transform: "rotate(" + a + " 150 160)", "text-anchor": "middle", class: "sp-dial__num" }); numT.textContent = k.nr;
      parts.push(numT);
    });
    for (var b = 0; b <= 6; b++) { var ba = (-90 + b * 30) * Math.PI / 180; parts.push(svg("line", { x1: (150 + 46 * Math.sin(ba)).toFixed(1), y1: (160 - 46 * Math.cos(ba)).toFixed(1), x2: (150 + 127 * Math.sin(ba)).toFixed(1), y2: (160 - 127 * Math.cos(ba)).toFixed(1), stroke: "#2a1a0c", "stroke-width": "1.2" })); }
    // Herstellerschild unter dem Drehpunkt, damit Hebel und Achse es nie verdecken
    var maker = svg("text", { x: "150", y: "190.4", "text-anchor": "middle", class: "sp-dial__maker" }); maker.textContent = "SCHIFFER & CO · MÜNCHEN";
    parts.push(svg("rect", { x: "68", y: "181", width: "164", height: "13", rx: "2", fill: "url(#spDialBrass)", stroke: "#2a1a0c", "stroke-width": "1" }), maker);
    dialHandle = svg("g", { class: "sp-dial__handle" }, [
      svg("rect", { x: "146", y: "18", width: "8", height: "142", rx: "3", fill: "url(#spDialBrass)", stroke: "#2a1a0c", "stroke-width": "1.5" }),
      svg("path", { d: "M150 30 l-9 16 h18 z", fill: "#8e1f14", stroke: "#2a1a0c", "stroke-width": "1.2" }),
      svg("rect", { x: "138", y: "2", width: "24", height: "22", rx: "9", fill: "#5a2614", stroke: "#2a1a0c", "stroke-width": "1.5" }),
      svg("rect", { x: "142", y: "5", width: "6", height: "15", rx: "3", fill: "#fff", opacity: ".2" })
    ]);
    parts.push(dialHandle);
    parts.push(svg("circle", { cx: "150", cy: "160", r: "17", fill: "url(#spDialBrass)", stroke: "#2a1a0c", "stroke-width": "2" }));
    parts.push(svg("line", { x1: "141", y1: "160", x2: "159", y2: "160", stroke: "#2a1a0c", "stroke-width": "2.5", transform: "rotate(35 150 160)" }));
    dialSvg = svg("svg", { viewBox: "0 0 300 196", class: "sp-dial", role: "slider", tabindex: "0", "aria-label": "Maschinentelegraf: Kammer wählen", "aria-valuemin": "1", "aria-valuemax": "6" }, parts);

    var dragging = false, live = 0, moved = false;
    function angleFrom(e) {
      var r = dialSvg.getBoundingClientRect();
      var px = r.left + r.width * 150 / 300, py = r.top + r.height * 160 / 196;
      var a = Math.atan2(e.clientX - px, py - e.clientY) * 180 / Math.PI;
      return Math.max(-88, Math.min(88, a));
    }
    function idxFor(a) { return Math.max(0, Math.min(5, Math.floor((a + 90) / 30))); }
    dialSvg.addEventListener("pointerdown", function (e) {
      dragging = true; moved = false; dialSvg.setPointerCapture(e.pointerId);
      var a = angleFrom(e); live = idxFor(a); setHandle(a, true); sfx.tick(); e.preventDefault();
    });
    dialSvg.addEventListener("pointermove", function (e) {
      if (!dragging) return; moved = true;
      var a = angleFrom(e), i = idxFor(a);
      if (i !== live) { live = i; sfx.ratchet(1); highlight(i); }
      setHandle(a, true);
    });
    function end() {
      if (!dragging) return; dragging = false;
      commit(live);
    }
    dialSvg.addEventListener("pointerup", end);
    dialSvg.addEventListener("pointercancel", end);
    dialSvg.addEventListener("keydown", function (e) {
      var i = dialValue;
      if (e.key === "ArrowRight" || e.key === "ArrowUp") i = Math.min(5, i + 1);
      else if (e.key === "ArrowLeft" || e.key === "ArrowDown") i = Math.max(0, i - 1);
      else if (e.key === "Home") i = 0; else if (e.key === "End") i = 5;
      else return;
      e.preventDefault(); if (i !== dialValue) { sfx.ratchet(1); commit(i); }
    });
    return dialSvg;
  }
  function setHandle(angle, instant) {
    if (!dialHandle) return;
    dialHandle.style.transition = instant || reduce ? "none" : "";
    dialHandle.style.transform = "rotate(" + angle.toFixed(1) + "deg)";
  }
  function highlight(i) { dialSectors.forEach(function (s, j) { s.classList.toggle("is-on", j === i); }); }
  function setDial(i) {
    dialValue = i; highlight(i); setHandle(-75 + i * 30, false);
    if (dialSvg) { dialSvg.setAttribute("aria-valuenow", String(i + 1)); dialSvg.setAttribute("aria-valuetext", "Kammer " + KAMMERN[i].nr + ": " + KAMMERN[i].name); }
  }
  function commit(i) {
    setDial(i);
    var target = KAMMERN[i].id;
    if (target !== current) { sfx.telegraph(); go(target); }
  }

  /* =========================================================
     Steuerstand (links) – wird einmal gebaut und bleibt stehen
     ========================================================= */
  var stand = null, navLinks = [], chamberBox = null, machine = null;
  function buildMachine() {
    var nav = el("nav", { class: "sp-nav", "aria-label": "Kammern der Maschine" });
    var ol = el("ol");
    KAMMERN.forEach(function (k) {
      var a = el("a", { href: "#" + k.id, class: "sp-navplate" }, [
        el("span", { class: "sp-bulb", "aria-hidden": "true" }),
        el("span", { class: "sp-navplate__nr", text: k.nr }),
        el("span", { class: "sp-navplate__txt" }, [el("strong", { text: k.name }), el("em", { text: k.sub })])
      ]);
      a.addEventListener("click", function () { if (current !== k.id) { sfx.telegraph(); } });
      navLinks.push(a); ol.appendChild(el("li", {}, [a]));
    });
    nav.appendChild(ol);

    var gaugeWrap = el("div", { class: "sp-standgauge" }, [gauge(132), el("span", { class: "sp-gauge-read", text: "" })]);
    var g1 = { x: 66 + 78 * Math.cos(0.45), y: 70 + 78 * Math.sin(0.45) };
    var gearsSvg = gearSet([
      { teeth: 16, x: 66, y: 70, holes: 5 },
      { teeth: 10, x: g1.x, y: g1.y, holes: 4, copper: true },
      { teeth: 7, x: g1.x + 51 * Math.cos(-1.0), y: g1.y + 51 * Math.sin(-1.0), holes: 3 }
    ], "8 10 190 140", "sp-gears");

    stand = el("aside", { class: "sp-stand", "aria-label": "Steuerstand" }, [
      el("div", { class: "sp-stand__plate", text: "Maschinentelegraf" }),
      buildDial(),
      el("p", { class: "sp-stand__hint", text: "Hebel drehen oder unten wählen" }),
      nav,
      el("div", { class: "sp-stand__works" }, [gaugeWrap, gearsSvg])
    ]);
    chamberBox = el("section", { class: "sp-chamber", "aria-live": "off" });
    machine = el("div", { class: "sp-machine" }, [stand, chamberBox]);
    return machine;
  }

  /* =========================================================
     Bausteine
     ========================================================= */
  function head(k) {
    return el("div", { class: "sp-head" }, [
      el("span", { class: "sp-head__nr", text: "Kammer " + k.nr }),
      el("h1", { class: "sp-head__title", text: k.name, tabindex: "-1" }),
      el("span", { class: "sp-head__sub", text: k.sub })
    ]);
  }
  function paper(children, cls) { return el("div", { class: "sp-paper " + (cls || "") }, children); }
  function sectionTitle(text) { return el("h2", { class: "sp-h2" }, [el("span", { text: text })]); }
  function nextButton(i) {
    if (i >= KAMMERN.length - 1) return el("div", { class: "sp-next" }, [el("a", { class: "sp-btn", href: "#start", text: "Zurück zum Kessel" })]);
    var k = KAMMERN[i + 1];
    var a = el("a", { class: "sp-btn", href: "#" + k.id }, ["Weiter zu Kammer " + k.nr + ": " + k.name, el("span", { class: "sp-btn__arrow", "aria-hidden": "true", text: "▸" })]);
    a.addEventListener("click", function () { sfx.telegraph(); });
    return el("div", { class: "sp-next" }, [a]);
  }

  /* ---------- Kammer I: Archiv ---------- */
  var kammer = {};
  function indexCard(it, i) {
    return el("article", { class: "sp-card", style: "--tilt:" + ((i % 3) - 1) * 0.6 + "deg" }, [
      it.tag ? el("span", { class: "sp-stamp", text: it.tag }) : null,
      el("h3", { text: it.titel }),
      p(it.text),
      it.link ? ext(it.link, (it.linkText || "Ansehen") + " →", "sp-card__link") : null
    ]);
  }
  kammer.journalismus = function (k, i) {
    var w = el("div", {}, [head(k), paper([p(S.journalismusIntro)], "sp-paper--intro")]);
    var groups = S.journalismus.concat([{ titel: "Bücher", books: true, intro: "Manche Themen brauchen mehr als einen Artikel oder eine Sendung – sie brauchen ein ganzes Buch." }]);
    w.appendChild(sectionTitle("Der Karteischrank"));
    w.appendChild(p("Jede Schublade ein Fachgebiet. Einfach eine aufziehen.", "sp-note"));
    var cab = el("div", { class: "sp-cabinet", role: "tablist", "aria-label": "Schubladen des Archivs" });
    var out = el("div", { class: "sp-drawer-out", role: "tabpanel", id: "sp-drawer-panel", tabindex: "-1" });
    var tabs = groups.map(function (g, gi) {
      var b = el("button", { type: "button", role: "tab", id: "sp-drawer-" + gi, class: "sp-drawer", "aria-controls": "sp-drawer-panel", "aria-selected": "false", tabindex: "-1" }, [
        el("span", { class: "sp-drawer__label" }, [el("small", { text: "Fach " + roman(gi + 1) }), g.titel]),
        el("span", { class: "sp-drawer__handle", "aria-hidden": "true" })
      ]);
      b.addEventListener("click", function () { open(gi, true); });
      b.addEventListener("keydown", function (e) {
        var n = null;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") n = (gi + 1) % groups.length;
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") n = (gi + groups.length - 1) % groups.length;
        if (n !== null) { e.preventDefault(); tabs[n].focus(); open(n, true); }
      });
      cab.appendChild(b); return b;
    });
    var opened = {};
    function open(gi, user) {
      tabs.forEach(function (b, j) { b.setAttribute("aria-selected", j === gi ? "true" : "false"); b.setAttribute("tabindex", j === gi ? "0" : "-1"); });
      out.setAttribute("aria-labelledby", "sp-drawer-" + gi);
      out.innerHTML = "";
      var g = groups[gi];
      out.appendChild(p(g.intro, "sp-drawer-out__intro"));
      if (g.books) {
        out.appendChild(el("div", { class: "sp-shelf" }, S.buecher.map(function (b) {
          return el("figure", { class: "sp-book" }, [
            b.cover ? el("div", { class: "sp-book__cover" }, [el("img", { src: b.cover, alt: "Buchcover: " + b.titel, loading: "lazy" })])
              : el("div", { class: "sp-book__cover sp-book__secret" }, [el("span", { class: "sp-seal", text: "CS" }), el("span", { text: "Streng geheim" })]),
            el("figcaption", {}, [el("strong", { text: b.titel }), el("span", { text: b.untertitel }), el("em", { text: b.verlag })])
          ]);
        })));
      } else {
        out.appendChild(el("div", { class: "sp-cards" }, g.items.map(indexCard)));
      }
      out.classList.remove("is-new"); void out.offsetWidth; out.classList.add("is-new");
      if (user) { sfx.drawer(); if (!opened[gi]) { opened[gi] = true; bump(2); } }
    }
    w.appendChild(cab); w.appendChild(out); open(0, false);
    w.appendChild(nextButton(i));
    return w;
  };

  /* ---------- Kammer II: Werkstatt ---------- */
  function blueprintDrawing() {
    // kleine technische Zeichnung: Glühbirne mit Zahnrad und Maßlinien
    return svg("svg", { viewBox: "0 0 220 200", class: "sp-blueprint__drawing", "aria-hidden": "true" }, [
      svg("circle", { cx: "90", cy: "80", r: "46", fill: "none", stroke: "currentColor", "stroke-width": "2" }),
      svg("path", { d: "M70 122 h40 v18 h-40 z M74 140 h32 v10 h-32 z M80 150 h20 v8 h-20 z", fill: "none", stroke: "currentColor", "stroke-width": "2" }),
      svg("path", { d: "M78 118 C78 96 72 92 80 80 C86 70 94 70 100 80 C108 92 102 96 102 118", fill: "none", stroke: "currentColor", "stroke-width": "1.5", "stroke-dasharray": "4 3" }),
      svg("path", { d: gearPath(9, 18, 25, 3), transform: "translate(170 140)", fill: "none", stroke: "currentColor", "stroke-width": "1.6", "fill-rule": "evenodd" }),
      svg("path", { d: "M30 80 h-14 M30 20 v120 M44 34 l-14 -14 l-14 14", fill: "none", stroke: "currentColor", "stroke-width": "1" }),
      svg("path", { d: "M44 175 h92 M44 168 v14 M136 168 v14", fill: "none", stroke: "currentColor", "stroke-width": "1" }),
      svg("text", { x: "90", y: "194", "text-anchor": "middle", class: "sp-blueprint__dim" }, []),
      svg("path", { d: "M136 80 L170 118", fill: "none", stroke: "currentColor", "stroke-width": "1", "stroke-dasharray": "2 3" })
    ]);
  }
  kammer.werkstatt = function (k, i) {
    var W = S.workshops;
    var draw = blueprintDrawing(); draw.querySelector("text").textContent = "Idee ⟷ Anwendung";
    var w = el("div", {}, [head(k)]);
    w.appendChild(el("div", { class: "sp-blueprint" }, [
      el("p", { class: "sp-blueprint__kicker", text: "Bauplan Nr. 2 · Maßstab 1 : 1 · Blatt 1 von 1" }),
      el("h2", { text: W.titel }),
      draw
    ].concat(W.text.map(function (t) { return p(t); }))));
    w.appendChild(el("figure", { class: "sp-tube" }, [
      el("span", { class: "sp-tube__horn", "aria-hidden": "true" }),
      el("blockquote", {}, [p("„" + W.zitat + "“")]),
      el("figcaption", { text: "Christian, durchs Sprachrohr" })
    ]));
    w.appendChild(el("div", { class: "sp-portholes" }, W.fotos.map(function (f, fi) {
      return el("div", { class: "sp-porthole" }, [el("img", { src: f, alt: fi === 0 ? "Workshop-Szene: Teilnehmende arbeiten an Laptops" : "Workshop-Szene: Gruppe probiert KI-Werkzeuge aus", loading: "lazy" })]);
    })));
    w.appendChild(sectionTitle("Betriebsstufe wählen"));
    w.appendChild(p("Ein Druck auf eine Taste öffnet eine E-Mail mit der passenden Anfrage.", "sp-note"));
    var small = function (f) { return /90/.test(f) ? "90 Min." : /Woche/.test(f) ? "1 Woche" : /Tag/.test(f) ? "1 Tag" : "Format"; };
    var dauer = function (f) { return /90/.test(f) ? 0 : /Tag/.test(f) ? 1 : /Woche/.test(f) ? 2 : 3; };
    var formate = W.formate.slice().sort(function (a, b) { return dauer(a) - dauer(b); });
    var keys = el("div", { class: "sp-keys" }, formate.map(function (f) {
      var a = el("a", { class: "sp-key", href: "mailto:" + S.email + "?subject=" + encodeURIComponent("Workshop-Anfrage: " + f) }, [
        el("span", { class: "sp-key__cap" }, [el("em", { text: small(f) }), el("strong", { text: f.replace("90-Minuten-", "").replace(/seminar$/i, "\u00ADseminar") })])
      ]);
      a.addEventListener("pointerdown", function () { sfx.clack(); });
      a.addEventListener("keydown", function (e) { if (e.key === "Enter") sfx.clack(); });
      a.addEventListener("click", function () { bump(2); });
      return a;
    }));
    w.appendChild(keys);
    w.appendChild(nextButton(i));
    return w;
  };

  /* ---------- Kammer III: Varieté ---------- */
  kammer.buehne = function (k, i) {
    var w = el("div", {}, [head(k)]);
    w.appendChild(paper([el("h2", { class: "sp-paper__title", text: "Vorhang auf!" }), p(S.talksIntro)], "sp-paper--intro"));
    w.appendChild(sectionTitle("Heute auf dem Spielplan"));
    w.appendChild(el("div", { class: "sp-bills" }, S.talks.map(function (t, ti) {
      var bill = el("article", { class: "sp-bill", style: "--tilt:" + (ti % 2 ? 0.9 : -0.8) + "deg" }, [
        el("span", { class: "sp-bill__pin", "aria-hidden": "true" }),
        el("p", { class: "sp-bill__kicker", text: "Vorstellung Nr. " + roman(ti + 1) }),
        el("p", { class: "sp-bill__tag", text: t.tag }),
        el("h3", { text: t.titel }),
        el("span", { class: "sp-bill__rule", "aria-hidden": "true" }),
        p(t.text),
        t.link ? ext(t.link, "Ansehen", "sp-ticket") : null
      ]);
      return bill;
    })));
    w.appendChild(sectionTitle("Aus dem Fotoalbum"));
    var stage = el("div", { class: "sp-stage" }, [
      el("div", { class: "sp-stage__photos" }, S.talkFotos.map(function (f) { return el("div", { class: "sp-frame" }, [el("img", { src: f, alt: "Christian Schiffer auf der Bühne", loading: "lazy" })]); })),
      el("span", { class: "sp-curtain sp-curtain--l", "aria-hidden": "true" }),
      el("span", { class: "sp-curtain sp-curtain--r", "aria-hidden": "true" }),
      el("span", { class: "sp-stage__valance", "aria-hidden": "true" })
    ]);
    w.appendChild(stage);
    if ("IntersectionObserver" in window && !reduce) {
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { stage.classList.add("is-open"); sfx.whoosh(); io.disconnect(); } }); }, { threshold: 0.35 });
      io.observe(stage);
    } else stage.classList.add("is-open");
    w.appendChild(nextButton(i));
    return w;
  };

  /* ---------- Kammer IV: Der Erfinder ---------- */
  kammer.erfinder = function (k, i) {
    var w = el("div", {}, [head(k)]);
    var img = el("img", { src: S.portrait, alt: "Porträt von Christian Schiffer" });
    var loupe = el("span", { class: "sp-loupe", "aria-hidden": "true" });
    loupe.style.backgroundImage = "url('" + S.portrait + "')";
    var cameo = el("div", { class: "sp-cameo" }, [el("div", { class: "sp-cameo__glass" }, [img, loupe])]);
    var usedLoupe = false;
    function moveLoupe(e) {
      var r = cameo.querySelector(".sp-cameo__glass").getBoundingClientRect();
      var x = e.clientX - r.left, y = e.clientY - r.top;
      if (x < 0 || y < 0 || x > r.width || y > r.height) { cameo.classList.remove("is-looking"); return; }
      cameo.classList.add("is-looking");
      var z = 2.2, L = loupe.offsetWidth || 130;
      loupe.style.left = (x - L / 2) + "px"; loupe.style.top = (y - L / 2) + "px";
      loupe.style.backgroundSize = (r.width * z) + "px " + (r.height * z) + "px";
      loupe.style.backgroundPosition = (-(x * z - L / 2)) + "px " + (-(y * z - L / 2)) + "px";
      if (!usedLoupe) { usedLoupe = true; bump(2); sfx.tick(); }
    }
    cameo.addEventListener("pointermove", moveLoupe);
    cameo.addEventListener("pointerdown", moveLoupe);
    cameo.addEventListener("pointerleave", function () { cameo.classList.remove("is-looking"); });
    var age = new Date().getFullYear() - S.since;
    var dl = el("dl", { class: "sp-patent__list" });
    [["Gegenstand", "Ein Erklärer"], ["Gattung", "Journalist, Autor, Speaker, Moderator, Trainer"], ["Baujahr", S.since + " (seit " + age + " Jahren in Betrieb)"], ["Standort", S.city], ["Betriebsart", "analytisch, humorvoll, bei Bedarf unbequem"]].forEach(function (row) {
      dl.appendChild(el("dt", { text: row[0] })); dl.appendChild(el("dd", { text: row[1] }));
    });
    w.appendChild(el("div", { class: "sp-inventor" }, [
      el("div", { class: "sp-inventor__pic" }, [cameo, el("p", { class: "sp-note sp-note--center", text: "Mit der Lupe drüberfahren: Farbe statt Sepia." })]),
      el("div", { class: "sp-paper sp-patent" }, [
        el("p", { class: "sp-patent__kicker", text: "Patentschrift Nr. " + S.since }),
        el("h2", { class: "sp-paper__title", text: S.name }),
        dl,
        p(S.steckbrief),
        el("blockquote", { class: "sp-patent__quote" }, [p("„" + S.zitat + "“")]),
        el("span", { class: "sp-patent__seal", "aria-hidden": "true", text: "geprüft" })
      ])
    ]));
    w.appendChild(sectionTitle("Aus der Betriebsanleitung"));
    w.appendChild(paper(S.bio.map(function (b) { return p(b); }), "sp-paper--bio"));
    w.appendChild(sectionTitle("Eingegangene Telegramme"));
    w.appendChild(el("div", { class: "sp-telegrams" }, S.zeugen.map(function (z) {
      var strips = (z.text.match(/[^.!?]+[.!?]*/g) || [z.text]).map(function (s) { s = s.trim(); return el("span", { class: "sp-telegram__strip", text: s.replace(/[.!?]$/, "").toUpperCase() + " STOP" }); });
      var t = el("article", { class: "sp-telegram", tabindex: "0", "aria-label": "Telegramm von " + z.name + ", " + z.rolle + ": " + z.text }, [
        el("div", { class: "sp-telegram__head", "aria-hidden": "true" }, [el("span", { text: "Telegramm" }), el("span", { text: "Telegraphenamt München" })]),
        el("p", { class: "sp-telegram__from", "aria-hidden": "true" }, ["Von: ", el("b", { text: z.name }), " · " + z.rolle]),
        el("p", { class: "sp-telegram__body", "aria-hidden": "true" }, strips)
      ]);
      t.addEventListener("click", function () { sfx.ratchet(9); t.classList.remove("is-tapped"); void t.offsetWidth; t.classList.add("is-tapped"); });
      return t;
    })));
    w.appendChild(nextButton(i));
    return w;
  };

  /* ---------- Kammer V: Ordensvitrine ---------- */
  var RIBBONS = [
    ["#7a1f1f", "#e8c66a", "#7a1f1f"], ["#1f3f6b", "#efe2bd", "#1f3f6b"], ["#2f5a3a", "#e8c66a", "#2f5a3a"],
    ["#5a1f4a", "#efe2bd", "#5a1f4a"], ["#7a4a1f", "#1f1a14", "#7a4a1f"], ["#1f1a14", "#c9473a", "#1f1a14"]
  ];
  kammer.orden = function (k, i) {
    var w = el("div", {}, [head(k)]);
    w.appendChild(paper([p("Zwölf Auszeichnungen, von 2012 bis heute. Hinter Glas, aber nicht verstaubt: Ein Klick, und der Orden schwingt.")], "sp-paper--intro"));
    var list = el("ol", { class: "sp-medals" }, S.preise.map(function (pr, pi) {
      var rib = RIBBONS[pi % RIBBONS.length];
      var metal = pi < 3 ? "gold" : pi % 3 === 0 ? "silver" : pi % 3 === 1 ? "bronze" : "gold";
      var medal = el("button", { type: "button", class: "sp-medal sp-medal--" + metal, "aria-label": pr.jahr + ": " + pr.preis + " für „" + pr.werk + "“. Orden schwingen lassen" }, [
        el("span", { class: "sp-medal__ribbon", style: "--r1:" + rib[0] + ";--r2:" + rib[1] + ";--r3:" + rib[2] }),
        el("span", { class: "sp-medal__disc" }, [el("span", { text: String(pr.jahr) })])
      ]);
      var swung = false;
      medal.addEventListener("click", function () {
        medal.classList.remove("is-swinging"); void medal.offsetWidth; medal.classList.add("is-swinging"); sfx.kling();
        if (!swung) { swung = true; bump(1); }
      });
      return el("li", { class: "sp-medalbox" }, [medal, el("div", { class: "sp-medal__plate" }, [el("strong", { text: pr.preis }), el("span", { text: "für „" + pr.werk + "“" })])]);
    }));
    w.appendChild(el("div", { class: "sp-vitrine" }, [el("p", { class: "sp-vitrine__sign", text: "Ordenssammlung · bitte nicht klopfen" }), list, el("span", { class: "sp-vitrine__glare", "aria-hidden": "true" })]));
    w.appendChild(nextButton(i));
    return w;
  };

  /* ---------- Kammer VI: Rohrpost & Morsetaste ---------- */
  var MORSE = { ".-": "A", "-...": "B", "-.-.": "C", "-..": "D", ".": "E", "..-.": "F", "--.": "G", "....": "H", "..": "I", ".---": "J", "-.-": "K", ".-..": "L", "--": "M", "-.": "N", "---": "O", ".--.": "P", "--.-": "Q", ".-.": "R", "...": "S", "-": "T", "..-": "U", "...-": "V", ".--": "W", "-..-": "X", "-.--": "Y", "--..": "Z",
    ".-.-": "Ä", "---.": "Ö", "..--": "Ü", "-----": "0", ".----": "1", "..---": "2", "...--": "3", "....-": "4", ".....": "5", "-....": "6", "--...": "7", "---..": "8", "----.": "9" };
  kammer.rohrpost = function (k, i) {
    var w = el("div", {}, [head(k)]);
    w.appendChild(paper([
      p("Für Anfragen zu Vorträgen, Moderationen, Workshops oder journalistischen Aufträgen am besten per Rohrpost – also per E-Mail."),
      p(S.phoneNote, "sp-small")
    ], "sp-paper--intro"));

    // Rohrpost-Station
    var capsule = el("span", { class: "sp-capsule", "aria-hidden": "true" });
    var send = el("a", { class: "sp-btn sp-btn--big", href: "mailto:" + S.email }, ["Kapsel abschicken", el("span", { class: "sp-btn__arrow", "aria-hidden": "true", text: "▴" })]);
    send.addEventListener("click", function (e) {
      if (reduce || station.classList.contains("is-sent")) return;
      e.preventDefault();
      station.classList.add("is-sent"); sfx.whoosh(); bump(3);
      setTimeout(function () { puffFrom(tube, 8, true); sfx.chuff(); }, 450);
      setTimeout(function () { window.location.href = send.href; }, 900);
      setTimeout(function () { station.classList.remove("is-sent"); }, 2600);
    });
    var tube = el("div", { class: "sp-tube-pipe", "aria-hidden": "true" }, [capsule, el("span", { class: "sp-tube-pipe__cap" })]);
    var station = el("div", { class: "sp-station" }, [
      el("div", { class: "sp-station__form sp-paper" }, [
        el("p", { class: "sp-station__label", text: "Empfänger" }),
        el("p", { class: "sp-station__addr" }, [el("a", { href: "mailto:" + S.email, text: S.email })]),
        el("p", { class: "sp-station__label", text: "Inhalt" }),
        p("Ihre Anfrage. Gern mit Datum, Ort und worum es gehen soll."),
        send
      ]),
      tube
    ]);
    w.appendChild(station);

    w.appendChild(sectionTitle("Weitere Leitungen"));
    w.appendChild(el("div", { class: "sp-lines" }, S.socials.map(function (s) {
      var a = ext(s.url, s.name, "sp-line");
      a.addEventListener("click", function () { sfx.ratchet(3); });
      return a;
    })));

    // Morsetaste
    w.appendChild(sectionTitle("Oder einfach morsen"));
    var tape = el("output", { class: "sp-tape", "aria-live": "polite" });
    var pending = el("span", { class: "sp-tape__pending" });
    var lamp = el("span", { class: "sp-lamp", "aria-hidden": "true" });
    var key = el("button", { type: "button", class: "sp-key-morse", "aria-label": "Morsetaste. Gedrückt halten: kurz ist ein Punkt, lang ein Strich." }, [
      el("span", { class: "sp-key-morse__base" }), el("span", { class: "sp-key-morse__post" }),
      el("span", { class: "sp-key-morse__lever" }, [el("span", { class: "sp-key-morse__knob" })])
    ]);
    var text = "", sym = "", downAt = 0, osc = null, gain = null, letterTimer = null, wordTimer = null, usedMorse = false;
    function paintTape() { tape.textContent = text.slice(-28) || " "; tape.appendChild(pending); pending.textContent = sym.replace(/\./g, "·").replace(/-/g, "–"); }
    function press() {
      if (downAt) return;
      downAt = performance.now(); clearTimeout(letterTimer); clearTimeout(wordTimer);
      key.classList.add("is-down"); lamp.classList.add("is-on");
      var a = audio();
      if (a) { osc = a.createOscillator(); gain = a.createGain(); osc.type = "sine"; osc.frequency.value = 640; gain.gain.setValueAtTime(0.0001, a.currentTime); gain.gain.exponentialRampToValueAtTime(0.09, a.currentTime + 0.01); osc.connect(gain); gain.connect(a.destination); osc.start(); }
    }
    function release() {
      if (!downAt) return;
      var len = performance.now() - downAt; downAt = 0;
      key.classList.remove("is-down"); lamp.classList.remove("is-on");
      if (osc && ctx) { var t = ctx.currentTime; gain.gain.cancelScheduledValues(t); gain.gain.setValueAtTime(gain.gain.value || 0.09, t); gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.03); osc.stop(t + 0.05); osc = null; }
      sym += len < 220 ? "." : "-";
      if (!usedMorse) { usedMorse = true; bump(3); }
      paintTape();
      letterTimer = setTimeout(function () {
        text += MORSE[sym] || "?"; sym = ""; paintTape();
        if (/SOS$/.test(text)) { setTimeout(function () { sfx.telegraph(); toast("Funkspruch empfangen! Hilfe naht – schreiben Sie an " + S.email + "."); }, 300); }
        wordTimer = setTimeout(function () { if (text && text.slice(-1) !== " ") { text += " "; paintTape(); } }, 1100);
      }, 650);
    }
    key.addEventListener("pointerdown", function (e) { e.preventDefault(); key.setPointerCapture(e.pointerId); press(); });
    key.addEventListener("pointerup", release);
    key.addEventListener("pointercancel", release);
    key.addEventListener("keydown", function (e) { if ((e.key === " " || e.key === "Enter") && !e.repeat) { e.preventDefault(); press(); } else if (e.key === " " || e.key === "Enter") e.preventDefault(); });
    key.addEventListener("keyup", function (e) { if (e.key === " " || e.key === "Enter") { e.preventDefault(); release(); } });
    key.addEventListener("click", function (e) { e.preventDefault(); });
    var clear = el("button", { type: "button", class: "sp-btn sp-btn--ghost sp-btn--small", text: "Streifen abreißen" });
    clear.addEventListener("click", function () { text = ""; sym = ""; paintTape(); sfx.paper(); });
    paintTape();
    w.appendChild(el("div", { class: "sp-morse" }, [
      el("div", { class: "sp-morse__desk" }, [key, lamp]),
      el("div", { class: "sp-morse__side" }, [
        el("p", { class: "sp-station__label", text: "Ihr Funkspruch" }),
        tape,
        el("p", { class: "sp-note", html: "Kurz drücken = Punkt, lang drücken = Strich. Wer <b>· · · – – – · · ·</b> funkt, bekommt Antwort." }),
        clear
      ])
    ]));
    w.appendChild(nextButton(i));
    return w;
  };

  /* =========================================================
     Der Kessel (Startseite)
     ========================================================= */
  function startScreen() {
    var lever = el("button", { type: "button", class: "sp-lever", "aria-label": "Hebel ziehen und die Maschine anwerfen" }, [
      el("span", { class: "sp-lever__slot", "aria-hidden": "true" }),
      el("span", { class: "sp-lever__arm", "aria-hidden": "true" }, [el("span", { class: "sp-lever__knob" })])
    ]);
    var startY = null, pulled = false;
    function fire() {
      if (pulled) return; pulled = true;
      lever.classList.add("is-down"); sfx.ratchet(6);
      running = true; save("laeuft", true);
      setTimeout(function () { sfx.chuff(0); sfx.chuff(0.22); sfx.chuff(0.44); puffFrom(mascotBtn, 10, true); puffFrom(lever, 8, true); hero.classList.add("is-rumbling"); }, 260);
      setTimeout(function () { sfx.whistle(1.1); }, 620);
      setTimeout(function () { go(KAMMERN[0].id); }, reduce ? 300 : 1300);
    }
    lever.addEventListener("click", fire);
    lever.addEventListener("pointerdown", function (e) { startY = e.clientY; });
    lever.addEventListener("pointermove", function (e) { if (startY !== null && e.clientY - startY > 40) { startY = null; fire(); } });
    lever.addEventListener("pointerup", function () { startY = null; });

    var mascotBtn = el("button", { type: "button", class: "sp-hero__mascot", "aria-label": "Maskottchen pfeifen lassen" }, [el("img", { src: MASCOT, alt: "" })]);
    mascotBtn.addEventListener("click", function () { sfx.whistle(0.7); var r = mascotBtn.getBoundingClientRect(); puff(r.left + r.width * 0.72, r.top + r.height * 0.62, 9, true); mascotBtn.classList.remove("is-hop"); void mascotBtn.offsetWidth; mascotBtn.classList.add("is-hop"); });

    var quick = el("p", { class: "sp-hero__quick" }, ["Oder direkt zu: "]);
    KAMMERN.forEach(function (k, ki) { if (ki) quick.appendChild(document.createTextNode(" · ")); quick.appendChild(el("a", { href: "#" + k.id, text: k.name })); });

    var hero = el("section", { class: "sp-hero" }, [
      el("div", { class: "sp-hero__inner" }, [
        el("p", { class: "sp-hero__patent", text: "Patent Nr. " + S.since + " · " + S.city }),
        el("h1", { class: "sp-hero__name", tabindex: "-1" }, ["Christian", el("br"), "Schiffer"]),
        el("p", { class: "sp-hero__sub", text: "und sein Dechiffrier-Apparat" }),
        el("ul", { class: "sp-hero__roles" }, S.roles.map(function (r) {
          var ziel = { Journalist: "journalismus", Autor: "journalismus", Speaker: "buehne", Trainer: "werkstatt" }[r] || "journalismus";
          var a = el("a", { href: "#" + ziel, text: r });
          if (r === "Autor") a.addEventListener("click", function () {
            // Autor: im Archiv gleich die Bücher-Schublade aufziehen
            var n = S.journalismus.length, tries = 0;
            (function warte() {
              var d = document.getElementById("sp-drawer-" + n);
              if (d && location.hash === "#journalismus") { if (d.getAttribute("aria-selected") !== "true") d.click(); return; }
              if (++tries < 40) setTimeout(warte, 100);
            })();
          });
          return el("li", {}, [a]);
        })),
        el("p", { class: "sp-hero__tagline", text: S.tagline.join(" · ") }),
        el("div", { class: "sp-hero__start" }, [
          lever,
          el("div", { class: "sp-hero__startlabel" }, [el("strong", { text: "Kessel anheizen" }), el("span", { text: "Hebel ziehen und die Maschine anwerfen" })])
        ]),
        quick
      ]),
      mascotBtn
    ]);
    return hero;
  }

  /* =========================================================
     Navigation & Kammerwechsel
     ========================================================= */
  var current = null, readTo = {};
  var doors = document.querySelector(".sp-doors");
  function shut(swap) {
    if (reduce) { swap(); return; }
    doors.classList.remove("is-open"); doors.classList.add("is-closing");
    setTimeout(function () { sfx.clank(); }, 260);
    setTimeout(function () {
      swap();
      doors.classList.remove("is-closing"); doors.classList.add("is-open");
      sfx.hiss(0.6);
      setTimeout(function () { doors.classList.remove("is-open"); }, 600);
    }, 560);
  }
  function go(name) { if (location.hash.slice(1) !== name) location.hash = name; else render(name); }
  function render(name) {
    var idx = kammerIndex(name);
    if (idx < 0) name = "start";
    if (name === current) return;
    var prev = current; current = name;
    var oldToast = document.querySelector(".sp-toast"); if (oldToast && !oldToast.querySelector("button")) oldToast.remove();
    function swap() {
      main.innerHTML = "";
      if (name === "start") {
        document.body.classList.add("on-start");
        where.textContent = "";
        main.appendChild(startScreen());
        machine = null; stand = null; chamberBox = null; navLinks = []; dialSectors = []; gears = [];
      } else {
        document.body.classList.remove("on-start");
        if (!machine || !machine.isConnected) { navLinks = []; dialSectors = []; gears = []; main.appendChild(buildMachine()); }
        var k = KAMMERN[idx];
        chamberBox.innerHTML = "";
        chamberBox.appendChild(kammer[k.id](k, idx));
        chamberBox.setAttribute("aria-label", "Kammer " + k.nr + ": " + k.name);
        navLinks.forEach(function (a, j) {
          a.classList.toggle("is-here", j === idx);
          a.classList.toggle("is-done", !!visited[KAMMERN[j].id] && j !== idx);
          if (j === idx) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
        });
        setDial(idx);
        where.textContent = "Kammer " + k.nr + " · " + k.sub;
        if (!visited[k.id]) { visited[k.id] = true; save("besucht", visited); setTimeout(function () { bump(10); }, 700); }
      }
      paintGauges();
      window.scrollTo(0, 0);
      var h = main.querySelector("h1");
      if (h && prev !== null) h.focus({ preventScroll: true });
    }
    if (prev === null) swap(); else shut(swap);
  }
  window.addEventListener("hashchange", function () { render(location.hash.slice(1) || "start"); });

  // Lesen erhöht den Druck: wer eine Kammer bis unten liest, bekommt etwas dazu
  window.addEventListener("scroll", function () {
    if (!current || current === "start" || readTo[current]) return;
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 160) { readTo[current] = true; bump(4); }
  }, { passive: true });

  document.getElementById("sp-top-gauge").appendChild(gauge(38));
  render(location.hash.slice(1) || "start");
  requestAnimationFrame(gearLoop);
})();
