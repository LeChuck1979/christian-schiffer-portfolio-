/* =========================================================
   PLÜSCH – der Plüschwald
   Fell zum Streicheln (mit Spuren und Geräusch), Taschen mit
   Reißverschluss, ein Vorhang aus Samt und ein kitzliges Mikro.
   Inhalte kommen aus content.js (window.SITE).
   ========================================================= */
(function () {
  "use strict";
  var S = window.SITE;
  var main = document.getElementById("pl-main");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var MASCOT = "graphics/themes/pluesch-maskottchen.webp";
  var PX_PER_M = 3780; // 96 px pro Zoll
  var canHover = window.matchMedia("(hover: hover)").matches;

  /* ---------- Speicher ---------- */
  function load(k, f) { try { var v = localStorage.getItem("cs-pluesch-" + k); return v ? JSON.parse(v) : f; } catch (e) { return f; } }
  function save(k, v) { try { localStorage.setItem("cs-pluesch-" + k, JSON.stringify(v)); } catch (e) {} }
  var soundOn = load("sound", true);
  var meter = load("meter", 0);
  var reached = load("meilensteine", {});

  /* ---------- Hilfsfunktionen ---------- */
  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === "class") n.className = attrs[k];
      else if (k === "text") n.textContent = attrs[k];
      else if (k === "html") n.innerHTML = attrs[k];
      else if (k.slice(0, 2) === "on") n.addEventListener(k.slice(2), attrs[k]);
      else n.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return n;
  }
  var SVGNS = "http://www.w3.org/2000/svg";
  function use(id, cls, color) {
    var s = document.createElementNS(SVGNS, "svg");
    s.setAttribute("class", cls || ""); s.setAttribute("aria-hidden", "true"); s.setAttribute("focusable", "false");
    if (color) s.style.color = color;
    var u = document.createElementNS(SVGNS, "use"); u.setAttribute("href", "#" + id); s.appendChild(u);
    return s;
  }
  function knopf(cls) { return el("i", { class: "pl-knopf " + (cls || ""), "aria-hidden": "true" }); }
  function outLink(url, text, cls) {
    return el("a", { href: url, target: "_blank", rel: "noopener noreferrer", class: cls || "pl-pill" }, [text, use("pl-i-pfeil", "pl-pill__arrow")]);
  }
  function fmtM(px) { return (px / PX_PER_M).toFixed(1).replace(".", ","); }
  var toastBox = document.querySelector(".pl-toast"), toastTimer = null;
  function toast(text) {
    toastBox.textContent = text; toastBox.classList.add("on");
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { toastBox.classList.remove("on"); }, 3400);
  }

  /* =========================================================
     KLANG – alles live erzeugt, nichts aus Dateien
     ========================================================= */
  var ac = null, out = null, brown = null, white = null, rustle = null, purr = null;
  function audio() {
    if (!soundOn) return null;
    if (!ac) {
      try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
      setupAudio();
    }
    if (ac.state === "suspended") ac.resume();
    return ac;
  }
  function noiseBuffer(seconds, kind) {
    var len = Math.floor(ac.sampleRate * seconds), buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0), last = 0, i;
    for (i = 0; i < len; i++) {
      var w = Math.random() * 2 - 1;
      if (kind === "brown") { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w * 0.6;
    }
    var fade = Math.floor(ac.sampleRate * 0.03);
    for (i = 0; i < fade; i++) { var k = i / fade; d[i] *= k; d[len - 1 - i] *= k; }
    return buf;
  }
  function setupAudio() {
    out = ac.createGain(); out.gain.value = 1;
    var comp = ac.createDynamicsCompressor(); comp.threshold.value = -20; comp.ratio.value = 4;
    out.connect(comp); comp.connect(ac.destination);
    brown = noiseBuffer(4, "brown"); white = noiseBuffer(1.5, "white");

    // Rascheln: braunes Rauschen, weich gefiltert, Lautstärke folgt dem Zeiger
    var src = ac.createBufferSource(); src.buffer = brown; src.loop = true;
    var hp = ac.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 170;
    var lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 900; lp.Q.value = 0.4;
    var g = ac.createGain(); g.gain.value = 0;
    src.connect(hp); hp.connect(lp); lp.connect(g); g.connect(out); src.start();
    rustle = { gain: g, lp: lp, on: false };

    // Schnurren: tiefes Rauschen, 23-mal pro Sekunde ein- und ausgeblendet
    var src2 = ac.createBufferSource(); src2.buffer = brown; src2.loop = true;
    var lp2 = ac.createBiquadFilter(); lp2.type = "lowpass"; lp2.frequency.value = 240;
    var am = ac.createGain(); am.gain.value = 0.5;
    var lfo = ac.createOscillator(); lfo.frequency.value = 23;
    var depth = ac.createGain(); depth.gain.value = 0.5;
    lfo.connect(depth); depth.connect(am.gain);
    var pg = ac.createGain(); pg.gain.value = 0;
    src2.connect(lp2); lp2.connect(am); am.connect(pg); pg.connect(out);
    src2.start(0, 1.7); lfo.start();
    purr = { gain: pg, on: false };
  }

  // Kalimba-artiger Zupfton
  var SCALE = [293.66, 329.63, 369.99, 440, 493.88, 587.33, 659.25, 739.99, 880, 987.77, 1174.66, 1318.51];
  var lastNote = 0;
  function pluck(f, vol, when) {
    var a = audio(); if (!a) return;
    var t = a.currentTime + (when || 0);
    var g = a.createGain(), lp = a.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 2600;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.07, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
    [[1, 1], [2.005, 0.2], [5.4, 0.035]].forEach(function (p) {
      var o = a.createOscillator(), og = a.createGain();
      o.type = "sine"; o.frequency.value = f * p[0]; og.gain.value = p[1];
      o.connect(og); og.connect(lp); o.start(t); o.stop(t + 1.6);
    });
    lp.connect(g); g.connect(out);
  }
  function note(i) {
    var now = performance.now(); if (now - lastNote < 50) return; lastNote = now;
    pluck(SCALE[((i % SCALE.length) + SCALE.length) % SCALE.length], 0.055);
  }
  function burst(o) {
    var a = audio(); if (!a) return;
    var t = a.currentTime + (o.when || 0);
    var s = a.createBufferSource(); s.buffer = o.brown ? brown : white;
    var f = a.createBiquadFilter(); f.type = o.type || "bandpass"; f.Q.value = o.q || 1;
    f.frequency.setValueAtTime(o.f1, t); f.frequency.exponentialRampToValueAtTime(o.f2 || o.f1, t + o.dur);
    var g = a.createGain(); g.gain.setValueAtTime(0.0001, t);
    if (o.ticks) {
      for (var x = 0; x < o.dur; x += o.ticks) {
        var v = o.vol * (0.6 + Math.random() * 0.4);
        g.gain.setValueAtTime(v, t + x); g.gain.exponentialRampToValueAtTime(v * 0.06, t + x + o.ticks * 0.75);
      }
      g.gain.setValueAtTime(0.0001, t + o.dur);
    } else {
      g.gain.exponentialRampToValueAtTime(o.vol, t + o.dur * (o.attack || 0.3));
      g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    }
    s.connect(f); f.connect(g); g.connect(out);
    s.start(t, Math.random() * 0.8); s.stop(t + o.dur + 0.05);
  }
  var sfx = {
    chime: function () { [587.33, 739.99, 880, 1174.66].forEach(function (f, i) { pluck(f, 0.06, i * 0.11); }); },
    giggle: function () {
      var a = audio(); if (!a) return;
      var base = 640 + Math.random() * 120;
      for (var i = 0; i < 5; i++) {
        var t = a.currentTime + i * 0.085, o = a.createOscillator(), g = a.createGain(), f = base * (1 - i * 0.04);
        o.type = "triangle";
        o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 1.35, t + 0.035); o.frequency.exponentialRampToValueAtTime(f * 0.92, t + 0.07);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.04, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.075);
        o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.09);
      }
    },
    zip: function (open) { burst({ dur: 0.42, f1: open ? 1500 : 3200, f2: open ? 3400 : 1500, q: 2.2, vol: 0.12, ticks: 0.017 }); },
    snip: function () { burst({ dur: 0.04, f1: 4200, type: "highpass", vol: 0.1, attack: 0.1 }); burst({ when: 0.12, dur: 0.04, f1: 4600, type: "highpass", vol: 0.1, attack: 0.1 }); },
    plop: function () {
      var a = audio(); if (!a) return;
      var t = a.currentTime, o = a.createOscillator(), g = a.createGain();
      o.type = "sine"; o.frequency.setValueAtTime(520, t); o.frequency.exponentialRampToValueAtTime(160, t + 0.13);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.11, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.2);
    },
    whoosh: function () { burst({ brown: true, dur: 1.1, f1: 300, f2: 1400, type: "lowpass", q: 0.7, vol: 0.18, attack: 0.45 }); },
    leaves: function () { burst({ dur: 0.32, f1: 2600, f2: 1800, q: 0.9, vol: 0.05, ticks: 0.028 }); }
  };

  var soundBtn = document.getElementById("pl-sound");
  function paintSound() {
    soundBtn.setAttribute("aria-pressed", soundOn ? "true" : "false");
    soundBtn.querySelector("use").setAttribute("href", soundOn ? "#pl-i-ton" : "#pl-i-tonaus");
    soundBtn.querySelector("span").textContent = soundOn ? "Ton an" : "Ton aus";
    if (!soundOn && ac) ac.suspend();
  }
  soundBtn.addEventListener("click", function () {
    soundOn = !soundOn; save("sound", soundOn); paintSound();
    if (soundOn) { audio(); sfx.chime(); }
  });
  paintSound();

  // Erste Berührung schaltet den Ton frei (Browser-Regel)
  var unlocked = false;
  function unlock() {
    if (unlocked) return; unlocked = true;
    audio(); wake();
  }
  ["pointerdown", "keydown", "touchend"].forEach(function (ev) { document.addEventListener(ev, unlock, { passive: true }); });

  // Alles mit data-note spielt beim Drüberfahren einen Ton
  document.addEventListener("pointerover", function (e) {
    var t = e.target.closest && e.target.closest("[data-note]");
    if (!t || (e.relatedTarget && t.contains(e.relatedTarget))) return;
    note(+t.getAttribute("data-note"));
    t.classList.remove("is-plucked"); void t.offsetWidth; t.classList.add("is-plucked");
  });
  document.addEventListener("focusin", function (e) { var t = e.target.closest && e.target.closest("[data-note]"); if (t) note(+t.getAttribute("data-note")); });

  /* =========================================================
     FELL – Streichelspuren wie auf Samt
     ========================================================= */
  var cv = document.querySelector(".pl-velvet"), g2 = cv.getContext("2d");
  var W = 0, H = 0, DPR = 1, marks = [], running = false, lastFur = 0;
  var NAP = { x: 0.55, y: 0.835 };   // Der Flor liegt nach rechts unten
  var LIFE = 9000;                    // so lange braucht das Fell, um sich wieder aufzurichten
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2); W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    g2.setTransform(DPR, 0, 0, DPR, 0, 0); kick();
  }
  window.addEventListener("resize", resize); resize();

  function addStroke(x1, y1, x2, y2, w) {
    var dx = x2 - x1, dy = y2 - y1, len = Math.sqrt(dx * dx + dy * dy);
    if (len < 0.8) return 0;
    if (len > 260) return 0; // Sprung, kein Streicheln
    marks.push({ x1: x1, y1: y1, x2: x2, y2: y2, w: w, s: (dx * NAP.x + dy * NAP.y) / len, nx: -dy / len, ny: dx / len, j: Math.random() * 3 - 1.5, t: performance.now() });
    if (marks.length > 1800) marks.splice(0, marks.length - 1800);
    kick(); return len;
  }
  function kick() { if (!running) { running = true; requestAnimationFrame(frame); } }
  var LV = 7;
  function frame(now) {
    g2.clearRect(0, 0, W, H);
    while (marks.length && now - marks[0].t > LIFE) marks.shift();
    var sx = window.scrollX, sy = window.scrollY, P = {}, i;
    function seg(key, a, b, c, d) { var p = P[key] || (P[key] = new Path2D()); p.moveTo(a, b); p.lineTo(c, d); }
    for (i = 0; i < marks.length; i++) {
      var m = marks[i], age = (now - m.t) / LIFE;
      var a = age < 0.3 ? 1 : Math.pow(1 - (age - 0.3) / 0.7, 1.2);
      var y1 = m.y1 - sy, y2 = m.y2 - sy;
      if ((y1 < -60 && y2 < -60) || (y1 > H + 60 && y2 > H + 60)) continue;
      var x1 = m.x1 - sx, x2 = m.x2 - sx;
      var str = (0.4 + 0.6 * Math.abs(m.s)) * a, lv = Math.min(LV - 1, Math.floor(str * LV));
      if (lv < 0) continue;
      var tone = m.s >= 0 ? "L" : "D";
      seg(tone + lv + "|" + m.w, x1, y1, x2, y2);
      for (var k = -2; k <= 2; k++) {
        var o = k * 0.19 * m.w + m.j;
        seg("f" + tone + lv, x1 + m.nx * o, y1 + m.ny * o, x2 + m.nx * o, y2 + m.ny * o);
      }
    }
    g2.lineCap = "round"; g2.lineJoin = "round";
    Object.keys(P).forEach(function (k) {
      var fiber = k.charAt(0) === "f", tone = fiber ? k.charAt(1) : k.charAt(0);
      var lv = parseInt(fiber ? k.slice(2) : k.slice(1), 10), al = (lv + 1) / LV;
      var rgb = tone === "L" ? "222,240,168" : "14,32,10", base = tone === "L" ? 0.55 : 0.5;
      if (fiber) {
        g2.setLineDash([3, 2.5, 1.5, 4]); g2.lineWidth = 1.1;
        g2.strokeStyle = "rgba(" + rgb + "," + (al * base * 0.9).toFixed(3) + ")"; g2.stroke(P[k]);
        g2.setLineDash([]);
      } else {
        var w = +k.split("|")[1];
        g2.lineWidth = w * 1.35; g2.strokeStyle = "rgba(" + rgb + "," + (al * base * 0.35).toFixed(3) + ")"; g2.stroke(P[k]);
        g2.lineWidth = w * 0.75; g2.strokeStyle = "rgba(" + rgb + "," + (al * base * 0.6).toFixed(3) + ")"; g2.stroke(P[k]);
      }
    });
    if (rustle && rustle.on && performance.now() - lastFur > 90) { rustle.on = false; rustle.gain.gain.setTargetAtTime(0, ac.currentTime, 0.1); }
    if (marks.length || (rustle && rustle.on)) requestAnimationFrame(frame);
    else { running = false; g2.clearRect(0, 0, W, H); }
  }

  function rustleAt(v, touch) {
    var a = audio(); if (!a || !rustle) return;
    var vol = Math.min(0.26, Math.max(0, v - 0.05) * 0.14) * (touch ? 0.7 : 1) * (0.8 + Math.random() * 0.4);
    rustle.gain.gain.setTargetAtTime(vol, a.currentTime, 0.035);
    rustle.lp.frequency.setTargetAtTime(650 + Math.min(v, 3) * 520, a.currentTime, 0.06);
    rustle.on = true; lastFur = performance.now(); kick();
  }

  /* Meter: wie viel Plüsch wurde gestreichelt? */
  var meterEls = [document.getElementById("pl-meter"), document.getElementById("pl-meter-foot")];
  var meterDirty = false;
  var MILESTONES = [
    [1, "Ein Meter Plüsch. Das Moos sagt danke."],
    [5, "Fünf Meter gestreichelt. Irgendwo schnurrt jetzt ein Baum."],
    [20, "20 Meter! Du bist offiziell im Kuschelverein."],
    [50, "50 Meter Plüsch. Das ist mehr, als die meisten Teddys im Leben abbekommen."],
    [100, "100 Meter. Christian ist beeindruckt und ein kleines bisschen besorgt."]
  ];
  function paintMeter() { meterEls.forEach(function (n) { if (n) n.textContent = fmtM(meter); }); }
  function meterAdd(px) {
    meter += px; meterDirty = true;
    MILESTONES.forEach(function (ms) { if (!reached[ms[0]] && meter >= ms[0] * PX_PER_M) { reached[ms[0]] = true; save("meilensteine", reached); toast(ms[1]); sfx.chime(); } });
  }
  setInterval(function () { if (meterDirty) { paintMeter(); save("meter", Math.round(meter)); meterDirty = false; } }, 400);
  paintMeter();

  var last = null;
  function onMove(cx, cy, w, target, touch) {
    var px = cx + window.scrollX, py = cy + window.scrollY, now = performance.now();
    if (last && now - last.t < 140) {
      var len = addStroke(last.x, last.y, px, py, w);
      var fur = !(target && target.closest && target.closest(".pl-solid, .pl-top, .design-switch"));
      if (fur && len) { rustleAt(len / Math.max(8, now - last.t), touch); meterAdd(len); }
    }
    last = { x: px, y: py, t: now };
  }
  document.addEventListener("pointermove", function (e) { if (e.pointerType === "touch") return; onMove(e.clientX, e.clientY, 28, e.target, false); }, { passive: true });
  document.addEventListener("touchstart", function () { last = null; }, { passive: true });
  document.addEventListener("touchmove", function (e) { var t = e.touches[0]; if (t) onMove(t.clientX, t.clientY, 42, e.target, true); }, { passive: true });

  /* Ins Fell klicken: es wächst etwas */
  var sproutLayer = document.querySelector(".pl-sprouts");
  var SPROUTS = [["pl-pilz", "#B2562E"], ["pl-pilz", "#C4632F"], ["pl-blatt", "#D9A23A"], ["pl-eichel", null], ["pl-blatt", "#56703A"], ["pl-herz", "#B2562E"]];
  var sproutN = 0;
  document.addEventListener("click", function (e) {
    if (e.target.closest(".pl-solid, a, button, input, .pl-top, .design-switch, .pl-foot")) return;
    if (window.getSelection && String(window.getSelection())) return;
    var kind = SPROUTS[sproutN++ % SPROUTS.length];
    var sp = el("span", { class: "pl-sprout" }, [use(kind[0], "", kind[1])]);
    sp.style.left = e.pageX + "px"; sp.style.top = e.pageY + "px";
    sp.style.setProperty("--r", (Math.random() * 24 - 12).toFixed(1) + "deg");
    sproutLayer.appendChild(sp);
    while (sproutLayer.children.length > 30) sproutLayer.removeChild(sproutLayer.firstChild);
    sfx.plop();
  });

  /* =========================================================
     DAS MASKOTTCHEN
     ========================================================= */
  var mascot = {}, awake = false;
  var LINES = [
    "Hihi, das kitzelt!",
    "Genau da. Weiter so.",
    "Gegen den Strich? Frech.",
    "Ich bin übrigens ein Mikrofon. Nur flauschiger.",
    "Christian ist gerade unterwegs. Ich halte die Stellung.",
    "Schnurrr …",
    "Psst: Unten in den Taschen steckt sein ganzer Journalismus.",
    "Wenn du ins Fell klickst, wachsen Pilze. Ehrlich."
  ];
  var lineN = 0;
  function say(text, ms) {
    if (!mascot.bubble) return;
    mascot.bubble.textContent = text; mascot.bubble.classList.add("on");
    clearTimeout(mascot.bt); mascot.bt = setTimeout(function () { mascot.bubble.classList.remove("on"); }, ms || 3200);
  }
  function wake() {
    if (awake || !mascot.btn) return; awake = true;
    mascot.wrap.classList.remove("is-sleepy");
    say("Oh! Hallo. Ich war kurz eingenickt.", 3000);
  }
  function hop(cls) {
    var b = mascot.body; b.classList.remove("is-hop", "is-squish"); void b.offsetWidth; b.classList.add(cls || "is-hop");
  }
  function hearts() {
    if (reduce) return;
    for (var i = 0; i < 9; i++) {
      var h = el("span", { class: "pl-float" }, [use(i % 3 ? "pl-herz" : "pl-blatt", "", i % 2 ? "#B2562E" : "#D9A23A")]);
      h.style.left = (30 + Math.random() * 40) + "%"; h.style.top = (20 + Math.random() * 30) + "%";
      h.style.setProperty("--dx", (Math.random() * 160 - 80).toFixed(0) + "px");
      h.style.animationDelay = (Math.random() * 0.3).toFixed(2) + "s";
      mascot.wrap.appendChild(h);
      setTimeout(function (x) { x.remove(); }.bind(null, h), 1800);
    }
  }
  function buildMascot() {
    var bubble = el("p", { class: "pl-bubble pl-solid", role: "status", "aria-live": "polite", text: "" });
    var body = el("span", { class: "pl-mascot__body" }, [
      el("img", { src: MASCOT, alt: "", width: "495", height: "760", draggable: "false" }),
      el("i", { class: "pl-blush pl-blush--l" }), el("i", { class: "pl-blush pl-blush--r" })
    ]);
    var btn = el("button", { type: "button", class: "pl-mascot pl-solid", "aria-label": "Das Plüsch-Mikro kitzeln" }, [
      body, el("span", { class: "pl-zzz", "aria-hidden": "true" }, [el("b", { text: "z" }), el("b", { text: "z" }), el("b", { text: "z" })])
    ]);
    var wrap = el("div", { class: "pl-mascotwrap is-sleepy" }, [bubble, btn]);
    mascot = { wrap: wrap, btn: btn, body: body, bubble: bubble, tickle: 0, lastT: 0, lastGiggle: 0, maxed: 0, lx: null, ly: null };

    btn.addEventListener("pointermove", function (e) {
      var now = performance.now();
      if (mascot.lx !== null && now - mascot.lastT < 140) {
        var d = Math.hypot(e.clientX - mascot.lx, e.clientY - mascot.ly);
        mascot.tickle = Math.min(1, mascot.tickle + d * 0.0019);
        meterAdd(d * 0.5);
      }
      mascot.lx = e.clientX; mascot.ly = e.clientY; mascot.lastT = now;
    });
    btn.addEventListener("pointerleave", function () { mascot.lx = null; });
    btn.addEventListener("click", function () {
      unlock();
      mascot.tickle = Math.min(1, mascot.tickle + 0.3);
      sfx.giggle(); hop("is-hop");
      say(LINES[lineN++ % LINES.length]);
    });
    setInterval(function () {
      var now = performance.now(), moving = now - mascot.lastT < 160;
      if (!moving) mascot.tickle = Math.max(0, mascot.tickle - 0.035);
      body.style.setProperty("--blush", mascot.tickle.toFixed(3));
      if (purr && soundOn) {
        var want = moving ? 0.05 + mascot.tickle * 0.16 : 0;
        if (want > 0 || purr.on) { purr.gain.gain.setTargetAtTime(want, ac.currentTime, 0.12); purr.on = want > 0; }
      }
      if (moving && mascot.tickle > 0.35 && now - mascot.lastGiggle > 1500) {
        mascot.lastGiggle = now; sfx.giggle(); hop("is-squish");
        say(mascot.tickle > 0.7 ? "Hihihi, aufhören! Nein, nicht aufhören." : LINES[lineN++ % LINES.length], 2400);
      }
      if (mascot.tickle >= 0.97 && now - mascot.maxed > 9000) {
        mascot.maxed = now; hearts(); sfx.chime(); say("Okay, okay, ich ergebe mich!", 2600);
      }
    }, 100);
    // Wer lange nichts tut, bekommt einen Tipp
    setTimeout(function () { if (!awake) say("Zzz … streichel ruhig übers Fell, dann wach ich auf.", 4200); }, 2600);
    return wrap;
  }

  /* =========================================================
     DIE BEREICHE
     ========================================================= */
  var NAV = [
    { id: "journalismus", name: "Journalismus", icon: "pl-i-mic", c: "#B2562E" },
    { id: "werkstatt", name: "KI-Werkstatt", icon: "pl-i-schere", c: "#D9A23A" },
    { id: "buehne", name: "Bühne", icon: "pl-i-buehne", c: "#56703A" },
    { id: "ueber-mich", name: "Über mich", icon: "pl-i-ich", c: "#6E4A31" },
    { id: "preise", name: "Preise", icon: "pl-i-stern", c: "#8C3E1E" },
    { id: "kontakt", name: "Kontakt", icon: "pl-i-brief", c: "#2F4A36" }
  ];
  var nav = document.querySelector(".pl-nav");
  NAV.forEach(function (n, i) {
    nav.appendChild(el("a", { class: "pl-badge", href: "#" + n.id, "data-note": String(i * 2 + 3), "data-sec": n.id }, [
      el("span", { class: "pl-badge__patch", style: "--c:" + n.c }, [use(n.icon, "pl-badge__icon")]),
      el("span", { class: "pl-badge__label", text: n.name })
    ]));
  });

  function head(title, sub, color) {
    return el("div", { class: "pl-sechead" }, [
      el("div", { class: "pl-ribbon pl-solid", style: color ? "--c:" + color : "" }, [el("h2", { text: title })]),
      sub ? el("p", { class: "pl-sechead__sub pl-solid", text: sub }) : null
    ]);
  }
  function card(children, cls) {
    return el("div", { class: "pl-card pl-solid " + (cls || "") }, [knopf("pl-knopf--l"), knopf("pl-knopf--r")].concat(children));
  }

  /* ---------- Kopf ---------- */
  function nameSvg() {
    var s = document.createElementNS(SVGNS, "svg");
    s.setAttribute("viewBox", "0 0 620 236"); s.setAttribute("class", "pl-name__svg"); s.setAttribute("aria-hidden", "true");
    s.innerHTML =
      '<text x="6" y="100" class="pl-name__l1">Christian</text>' +
      '<text x="6" y="210" class="pl-name__l2">Schiffer</text>';
    return el("h1", { class: "pl-name" }, [el("span", { class: "pl-sr", text: S.name }), s]);
  }
  function treeline() {
    var items = [
      ["pl-tanne", "#2F4A36", 1], ["pl-pilz", "#B2562E", 0.55], ["pl-tanne", "#56703A", 0.78], ["pl-busch", "#3E5B33", 0.7],
      ["pl-tanne", "#24382A", 1.15], ["pl-eichel", null, 0.42], ["pl-tanne", "#4A6A36", 0.85], ["pl-pilz", "#C4632F", 0.45],
      ["pl-tanne", "#2F4A36", 0.95], ["pl-busch", "#56703A", 0.6], ["pl-tanne", "#3E5B33", 1.2], ["pl-pilz", "#B2562E", 0.6],
      ["pl-tanne", "#56703A", 0.8], ["pl-tanne", "#24382A", 1.05]
    ];
    return el("div", { class: "pl-treeline", "aria-hidden": "true" }, items.map(function (t, i) {
      return el("span", { class: "pl-tree pl-solid pl-tree--" + t[0].slice(3), style: "--s:" + t[2], "data-note": String(i) }, [use(t[0], "", t[1])]);
    }));
  }
  function hero() {
    var wakeBtn = el("button", { type: "button", class: "pl-btn pl-btn--big pl-solid", "data-note": "8" }, [use("pl-i-ton", "pl-btn__icon"), el("span", { text: "Plüsch aufwecken" })]);
    wakeBtn.addEventListener("click", function () {
      if (!soundOn) { soundOn = true; save("sound", true); paintSound(); }
      audio(); wake(); sfx.chime(); hop("is-hop");
      wakeBtn.querySelector("span").textContent = "Wach! Jetzt streicheln";
      say("Guten Morgen! Streich mal übers Fell, das mag ich.", 3400);
    });
    return el("section", { class: "pl-sec pl-hero", id: "oben" }, [
      el("div", { class: "pl-hero__in" }, [
        el("div", { class: "pl-hero__text" }, [
          el("p", { class: "pl-kicker pl-solid", text: "Willkommen im Plüschwald" }),
          nameSvg(),
          el("ul", { class: "pl-tapes", "aria-label": "Was ich mache" }, S.roles.map(function (r, i) {
            var ziel = { Journalist: "journalismus", Autor: "journalismus", Speaker: "buehne", Trainer: "werkstatt" }[r] || "journalismus";
            var a = el("a", { class: "pl-tape__link", href: "#" + ziel, text: r });
            if (r === "Autor") a.addEventListener("click", function (e) {
              // Autor: gleich die Bücher-Tasche aufziehen und hinscrollen
              var bag = Array.prototype.filter.call(document.querySelectorAll(".pl-pocket"), function (x) { var h = x.querySelector("h3"); return h && h.textContent.trim() === "Bücher"; })[0];
              if (!bag) return;
              e.preventDefault();
              if (!bag.classList.contains("is-open")) bag.querySelector(".pl-zip").click();
              history.replaceState(null, "", "#journalismus");
              bag.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
            });
            return el("li", { class: "pl-tape pl-solid", "data-note": String(i + 4) }, [a]);
          })),
          card(S.tagline.map(function (t) { return el("p", { text: t }); }), "pl-tagline"),
          el("div", { class: "pl-hero__cta" }, [
            wakeBtn,
            el("a", { class: "pl-btn pl-btn--ghost pl-solid", href: "#journalismus", "data-note": "5" }, [el("span", { text: "Lieber gleich lesen" }), use("pl-i-pfeil", "pl-btn__icon pl-btn__icon--down")])
          ]),
          el("p", { class: "pl-hint pl-solid", html: "<b>Streich mal übers Fell.</b> Mit dem Strich wird es hell, dagegen dunkel. Und wer ins Fell klickt, lässt Pilze wachsen." })
        ]),
        buildMascot()
      ]),
      treeline()
    ]);
  }

  /* ---------- Journalismus: Taschen mit Reißverschluss ---------- */
  var POCKET_COLORS = ["rust", "forest", "bark", "moss", "mustard"];
  function pocket(title, intro, count, items, i, open) {
    var id = "pl-tasche-" + i;
    var zip = el("button", { type: "button", class: "pl-zip", "aria-expanded": "false", "aria-controls": id }, [
      el("span", { class: "pl-zip__track", "aria-hidden": "true" }, [el("span", { class: "pl-zip__gap" }), el("span", { class: "pl-zip__pull" })]),
      el("span", { class: "pl-zip__hint", text: "Aufziehen" }),
      el("span", { class: "pl-sr", text: title })
    ]);
    var front = el("div", { class: "pl-pocket__front" }, [
      el("h3", { text: title }),
      intro ? el("p", { text: intro }) : null,
      el("span", { class: "pl-pocket__count", text: count })
    ]);
    var body = el("div", { class: "pl-pocket__body", id: id }, [el("div", { class: "pl-pocket__inner" }, [el("div", { class: "pl-pocket__grid" }, items)])]);
    var p = el("div", { class: "pl-pocket pl-solid pl-pocket--" + POCKET_COLORS[i % POCKET_COLORS.length] }, [zip, front, body]);
    function set(o, quiet) {
      p.classList.toggle("is-open", o); zip.setAttribute("aria-expanded", o ? "true" : "false");
      zip.querySelector(".pl-zip__hint").textContent = o ? "Zuziehen" : "Aufziehen";
      body.inert = !o;
      if (!quiet) sfx.zip(o);
    }
    zip.addEventListener("click", function () { set(!p.classList.contains("is-open")); });
    front.addEventListener("click", function () { set(!p.classList.contains("is-open")); });
    set(!!open, true);
    return p;
  }
  function item(it) {
    return card([
      it.tag ? el("span", { class: "pl-label", text: it.tag }) : null,
      el("h4", { text: it.titel }),
      el("p", { text: it.text }),
      it.link ? outLink(it.link, it.linkText || "Ansehen") : null
    ], "pl-item");
  }
  function books() {
    var list = S.buecher.map(function (b) {
      if (!b.cover) {
        var secret = el("button", { type: "button", class: "pl-book pl-book--secret pl-solid" }, [
          el("span", { class: "pl-book__sewn", "aria-hidden": "true" }),
          el("strong", { text: b.titel }),
          el("span", { text: "Noch zugenäht. " + b.verlag + "." })
        ]);
        secret.addEventListener("click", function () {
          sfx.snip(); secret.classList.remove("is-wiggle"); void secret.offsetWidth; secret.classList.add("is-wiggle");
          toast("Psst. Daran wird noch genäht.");
        });
        return secret;
      }
      return el("figure", { class: "pl-book pl-solid" }, [
        el("div", { class: "pl-book__sleeve" }, [el("img", { src: b.cover, alt: "Buchcover: " + b.titel, loading: "lazy" })]),
        el("figcaption", {}, [el("strong", { text: b.titel }), el("span", { text: b.untertitel }), el("small", { text: b.verlag })])
      ]);
    });
    return list;
  }
  function journalismus() {
    var pockets = S.journalismus.map(function (g, i) {
      return pocket(g.titel, g.intro, g.items.length + (g.items.length === 1 ? " Stück drin" : " Stücke drin"), g.items.map(item), i, i === 0);
    });
    pockets.push(pocket("Bücher", "Zwei Sachbücher sind schon draußen, das dritte liegt noch auf dem Nähtisch.", S.buecher.length + " Bücher drin", books(), S.journalismus.length, false));
    return el("section", { class: "pl-sec pl-sec--olive", id: "journalismus" }, [
      head("Journalismus", "Was ich im Unterholz ausgrabe", "#B2562E"),
      el("div", { class: "pl-wrap" }, [
        card([el("p", { class: "pl-lead", text: S.journalismusIntro })], "pl-intro"),
        el("p", { class: "pl-note pl-solid", text: "Fünf Taschen, alles drin. Einfach den Reißverschluss aufziehen." }),
        el("div", { class: "pl-pockets" }, pockets)
      ])
    ]);
  }

  /* ---------- KI-Werkstatt: Stickrahmen und Schnittmuster ---------- */
  function photo(src, alt, i) {
    return el("figure", { class: "pl-photo pl-solid", style: "--rot:" + (i % 2 ? 2.2 : -1.8) + "deg" }, [
      el("i", { class: "pl-pin", "aria-hidden": "true" }),
      el("img", { src: src, alt: alt, loading: "lazy" })
    ]);
  }
  function werkstatt() {
    var w = S.workshops;
    var patterns = w.formate.map(function (f, i) {
      return el("li", { class: "pl-pattern pl-solid", "data-note": String(i * 2 + 5) }, [
        el("span", { class: "pl-pattern__nr", text: "Schnittmuster Nr. " + (i + 1) }),
        el("strong", { text: f }),
        el("span", { class: "pl-pattern__cut", "aria-hidden": "true" }, [use("pl-schere", "pl-pattern__scissors")])
      ]);
    });
    patterns.forEach(function (p) { p.addEventListener("pointerenter", function () { if (!reduce) sfx.snip(); }); });
    return el("section", { class: "pl-sec", id: "werkstatt" }, [
      head("KI-Werkstatt", "Zuschneiden, ausprobieren, selber machen", "#B07F22"),
      el("div", { class: "pl-wrap pl-werk" }, [
        el("figure", { class: "pl-hoop pl-solid", "data-note": "9" }, [
          el("span", { class: "pl-hoop__screw", "aria-hidden": "true" }),
          el("blockquote", {}, [el("p", { text: "„" + w.zitat + "“" })]),
          el("figcaption", { text: "Christian Schiffer" })
        ]),
        card([
          el("h3", { class: "pl-h3", text: w.titel }),
          w.text.map(function (t) { return el("p", { text: t }); })
        ].reduce(function (a, b) { return a.concat(b); }, []), "pl-werk__text"),
        el("div", { class: "pl-werk__formats" }, [
          el("p", { class: "pl-note pl-solid", text: "Drei Formate zum Zuschneiden" }),
          el("ul", { class: "pl-patterns" }, patterns)
        ]),
        el("div", { class: "pl-photos" }, w.fotos.map(function (f, i) { return photo(f, "Workshop mit Christian Schiffer, Foto " + (i + 1), i); }))
      ])
    ]);
  }

  /* ---------- Bühne: Samtvorhang und Eintrittskarten ---------- */
  function buehne() {
    var stageBtn = el("button", { type: "button", class: "pl-btn pl-btn--small pl-solid pl-stage__btn" }, [el("span", { text: "Vorhang zu" })]);
    var stage = el("div", { class: "pl-stage pl-solid" }, [
      el("div", { class: "pl-stage__in" }, [
        card([el("p", { class: "pl-lead", text: S.talksIntro })], "pl-stage__intro"),
        el("div", { class: "pl-photos pl-photos--stage" }, S.talkFotos.map(function (f, i) { return photo(f, "Christian Schiffer auf der Bühne, Foto " + (i + 1), i + 1); }))
      ]),
      el("span", { class: "pl-curtain pl-curtain--l", "aria-hidden": "true" }),
      el("span", { class: "pl-curtain pl-curtain--r", "aria-hidden": "true" }),
      el("span", { class: "pl-valance", "aria-hidden": "true" }),
      stageBtn
    ]);
    function setStage(open, quiet) {
      stage.classList.toggle("is-open", open);
      stageBtn.querySelector("span").textContent = open ? "Vorhang zu" : "Vorhang auf";
      if (!quiet) sfx.whoosh();
    }
    stageBtn.addEventListener("click", function () { setStage(!stage.classList.contains("is-open")); });
    if (reduce || !("IntersectionObserver" in window)) setStage(true, true);
    else {
      setStage(false, true);
      var io = new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { io.disconnect(); setTimeout(function () { setStage(true, !unlocked); }, 350); }
      }, { threshold: 0.35 });
      io.observe(stage);
    }
    var tickets = S.talks.map(function (t, i) {
      return el("article", { class: "pl-ticketwrap pl-solid" }, [
        el("div", { class: "pl-ticket" }, [
          el("div", { class: "pl-ticket__stub" }, [el("span", { text: "Auftritt" }), el("b", { text: String(i + 1) })]),
          el("div", { class: "pl-ticket__body" }, [
            el("span", { class: "pl-label pl-label--inline", text: t.tag }),
            el("h4", { text: t.titel }),
            el("p", { text: t.text }),
            t.link ? outLink(t.link, "Ansehen") : null
          ])
        ])
      ]);
    });
    return el("section", { class: "pl-sec pl-sec--dark", id: "buehne" }, [
      head("Bühne", "Talks, Panels und Moderation", "#B2562E"),
      el("div", { class: "pl-wrap" }, [stage, el("div", { class: "pl-tickets" }, tickets)])
    ]);
  }

  /* ---------- Über mich ---------- */
  function ueber() {
    var zeugen = S.zeugen.map(function (z, i) {
      var tag = el("figure", { class: "pl-hang pl-solid", style: "--d:" + (i * 0.4) + "s" }, [
        el("span", { class: "pl-hang__thread", "aria-hidden": "true" }),
        use("pl-blatt", "pl-hang__leaf", ["#D9A23A", "#7C9A4A", "#B2562E"][i % 3]),
        el("blockquote", {}, [el("p", { text: "„" + z.text + "“" })]),
        el("figcaption", {}, [el("strong", { text: z.name }), el("span", { text: z.rolle })])
      ]);
      tag.addEventListener("pointerenter", function () {
        tag.classList.remove("is-swing"); void tag.offsetWidth; tag.classList.add("is-swing"); sfx.leaves();
      });
      return tag;
    });
    return el("section", { class: "pl-sec pl-sec--rust", id: "ueber-mich" }, [
      head("Über mich", "Wer hier im Wald wohnt", "#6E4A31"),
      el("div", { class: "pl-wrap pl-about" }, [
        el("div", { class: "pl-about__left" }, [
          el("figure", { class: "pl-frame pl-solid" }, [
            use("pl-schleife", "pl-frame__bow", "#D9A23A"),
            el("img", { src: S.portrait, alt: "Porträt von Christian Schiffer", loading: "lazy" })
          ]),
          el("div", { class: "pl-nametag pl-solid" }, [
            el("p", { class: "pl-nametag__hello", text: "Hallo, ich bin" }),
            el("p", { class: "pl-nametag__name", text: S.name }),
            el("dl", { class: "pl-nametag__facts" }, [
              el("dt", { text: "Heimatwald" }), el("dd", { text: S.city }),
              el("dt", { text: "Baujahr" }), el("dd", { text: String(S.since) }),
              el("dt", { text: "Beruf" }), el("dd", { text: S.roles.join(", ") })
            ]),
            el("p", { text: S.steckbrief })
          ])
        ]),
        el("div", { class: "pl-about__right" }, [
          el("blockquote", { class: "pl-pennant pl-solid" }, [el("p", { text: S.zitat })]),
          card(S.bio.map(function (b) { return el("p", { text: b }); }), "pl-bio")
        ])
      ]),
      el("div", { class: "pl-wrap" }, [
        el("p", { class: "pl-note pl-solid pl-note--center", text: "Was man im Wald so über ihn flüstert" }),
        el("div", { class: "pl-branch" }, [el("span", { class: "pl-branch__wood", "aria-hidden": "true" }), el("div", { class: "pl-hangs" }, zeugen)])
      ])
    ]);
  }

  /* ---------- Preise: Ehrenabzeichen ---------- */
  var BADGE = ["rust", "mustard", "moss", "cream", "bark", "forest"];
  function preise() {
    return el("section", { class: "pl-sec", id: "preise" }, [
      head("Preise", "Zwölf Ehrenabzeichen für die Schärpe", "#8C3E1E"),
      el("div", { class: "pl-wrap" }, [
        el("div", { class: "pl-sash pl-solid" }, [
          el("p", { class: "pl-sash__hint", text: canHover ? "Fahr mal mit der Maus über die Abzeichen. Hörst du's?" : "Tipp mal auf die Abzeichen. Hörst du's?" }),
          el("ol", { class: "pl-awards" }, S.preise.map(function (p, i) {
            return el("li", { class: "pl-award" }, [
              el("span", { class: "pl-award__badge pl-award__badge--" + BADGE[i % BADGE.length], "data-note": String(11 - (i % 12)) }, [
                use("pl-i-stern", "pl-award__star"), el("b", { text: String(p.jahr) })
              ]),
              el("span", { class: "pl-award__text" }, [el("strong", { text: p.preis }), el("em", { text: p.werk })])
            ]);
          }))
        ])
      ])
    ]);
  }

  /* ---------- Kontakt: Post in den Wald ---------- */
  function kontakt() {
    return el("section", { class: "pl-sec pl-sec--dark", id: "kontakt" }, [
      head("Kontakt", "Post in den Wald", "#2F4A36"),
      el("div", { class: "pl-wrap pl-contact" }, [
        el("div", { class: "pl-envelope pl-solid" }, [
          el("span", { class: "pl-envelope__flap", "aria-hidden": "true" }),
          el("div", { class: "pl-letter" }, [
            el("p", { class: "pl-letter__hi", text: "Für Anfragen zu Vorträgen, Moderationen, Workshops oder journalistischen Aufträgen:" }),
            el("a", { class: "pl-letter__mail", href: "mailto:" + S.email, "data-note": "7" }, [S.email]),
            el("a", { class: "pl-btn pl-btn--big", href: "mailto:" + S.email, "data-note": "9" }, [use("pl-i-brief", "pl-btn__icon"), el("span", { text: "E-Mail schreiben" })]),
            el("p", { class: "pl-letter__small", text: S.phoneNote })
          ]),
          el("span", { class: "pl-stamp", "aria-hidden": "true" }, [use("pl-eichel", ""), el("small", { text: "Waldpost" })])
        ]),
        el("div", { class: "pl-socials" }, [
          el("p", { class: "pl-note pl-solid", text: "Oder per Knopfdruck:" }),
          el("ul", {}, S.socials.map(function (s, i) {
            return el("li", {}, [el("a", { class: "pl-social pl-solid", href: s.url, target: "_blank", rel: "noopener noreferrer", "data-note": String(i * 2 + 2) }, [
              knopf("pl-knopf--big pl-knopf--" + ["rust", "mustard", "moss", "bark"][i % 4]), el("span", { text: s.name })
            ])]);
          }))
        ])
      ])
    ]);
  }

  /* ---------- Zusammenbauen ---------- */
  [hero(), journalismus(), werkstatt(), buehne(), ueber(), preise(), kontakt()].forEach(function (s) { main.appendChild(s); });

  // Aktiven Bereich im Kopf markieren
  if ("IntersectionObserver" in window) {
    var badges = Array.prototype.slice.call(nav.querySelectorAll(".pl-badge"));
    var secIO = new IntersectionObserver(function (en) {
      en.forEach(function (e) {
        if (!e.isIntersecting) return;
        badges.forEach(function (b) { if (b.getAttribute("data-sec") === e.target.id) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current"); });
        var cur = nav.querySelector('[aria-current="true"]');
        if (nav.scrollWidth > nav.clientWidth) nav.scrollTo({ left: cur ? cur.offsetLeft - 40 : 0, behavior: reduce ? "auto" : "smooth" });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    document.querySelectorAll(".pl-sec[id]").forEach(function (s) { secIO.observe(s); });
  }

  // Faden oben: näht sich beim Scrollen weiter
  var thread = document.querySelector(".pl-thread"), tick = false;
  function paintThread() {
    tick = false;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    thread.style.setProperty("--p", (max > 0 ? Math.min(1, window.scrollY / max) : 0).toFixed(4));
  }
  window.addEventListener("scroll", function () { if (!tick) { tick = true; requestAnimationFrame(paintThread); } }, { passive: true });
  paintThread();

  // Direkt verlinkter Bereich (z. B. pluesch.html#preise)
  if (location.hash && location.hash.length > 1 && location.hash.indexOf("design-") < 0) {
    var target = document.getElementById(location.hash.slice(1));
    if (target) setTimeout(function () { target.scrollIntoView(); }, 60);
  }
  window.addEventListener("pagehide", function () { save("meter", Math.round(meter)); });
})();
