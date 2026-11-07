/* =========================================================
   KNETE – die Website als Knetwerkstatt zum Anfassen
   Inhalte kommen aus content.js (window.SITE).
   Oben liegt ein Klumpen Knete, den man ziehen, drücken und
   mit Ausstechformen in Form bringen kann. Jede Form führt
   in ein Kapitel.
   ========================================================= */
(function () {
  "use strict";
  var S = window.SITE;
  var main = document.getElementById("kn-main");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var MASCOT = "graphics/themes/knete-maskottchen.webp";
  var TEXTURE = "graphics/knete/textur.webp";
  var INK = "#1F2B52";

  /* ---------- Speicher ---------- */
  function load(key, fallback) { try { var v = localStorage.getItem("cs-knete-" + key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; } }
  function save(key, val) { try { localStorage.setItem("cs-knete-" + key, JSON.stringify(val)); } catch (e) {} }
  var soundOn = load("sound", true);

  /* =========================================================
     Töne: alles live erzeugt, nichts aus Dateien
     ========================================================= */
  var ac = null, noiseBuf = null, master = null;
  function audio() {
    if (!soundOn) return null;
    if (!ac) {
      try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
      master = ac.createGain(); master.gain.value = 0.9; master.connect(ac.destination);
      noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
      var d = noiseBuf.getChannelData(0), last = 0;
      for (var i = 0; i < d.length; i++) { last = last * 0.6 + (Math.random() * 2 - 1) * 0.4; d[i] = last * 1.6; }
    }
    if (ac.state === "suspended") ac.resume();
    return ac;
  }
  function blip(freq, to, dur, vol, type, start) {
    var a = audio(); if (!a) return;
    var t = a.currentTime + (start || 0);
    var o = a.createOscillator(), g = a.createGain();
    o.type = type || "sine";
    o.frequency.setValueAtTime(freq, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.03);
  }
  function burst(from, to, dur, vol, q, start) {
    var a = audio(); if (!a) return;
    var t = a.currentTime + (start || 0);
    var s = a.createBufferSource(); s.buffer = noiseBuf;
    var f = a.createBiquadFilter(); f.type = "bandpass"; f.Q.value = q || 1.2;
    f.frequency.setValueAtTime(from, t); f.frequency.exponentialRampToValueAtTime(to, t + dur);
    var g = a.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(master);
    s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05);
  }
  var sfx = {
    squish: function (p) { p = p || 1; burst(1100 * p, 240 * p, 0.17, 0.5, 1.3); blip(170 * p, 85 * p, 0.15, 0.16); },
    plop: function (p) { p = p || 1; blip(640 * p, 170 * p, 0.1, 0.22); },
    klack: function () { burst(3600, 2000, 0.035, 0.35, 4); blip(150, 60, 0.14, 0.25, "sine", 0.01); burst(700, 200, 0.2, 0.35, 1, 0.02); },
    pling: function (p) { p = p || 1; blip(1047 * p, 0, 0.35, 0.07, "triangle"); blip(1568 * p, 0, 0.45, 0.05, "triangle", 0.07); },
    hoi: function () { blip(392, 523, 0.12, 0.12, "triangle"); blip(523, 880, 0.16, 0.1, "triangle", 0.12); },
    roll: function () { for (var i = 0; i < 6; i++) blip(220 + i * 40, 160 + i * 30, 0.07, 0.08, "sine", i * 0.06); burst(500, 300, 0.4, 0.12, 0.8); },
    pop: function () { blip(300 + Math.random() * 120, 140, 0.07, 0.12); }
  };

  /* Durchgehendes Matschen beim Kneten: Rauschen, dessen Lautstärke dem Tempo folgt */
  var knead = null;
  function kneadSound(speed) {
    var a = audio(); if (!a) return;
    if (!knead) {
      var s = a.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
      var lp = a.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 700;
      var bp = a.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 320; bp.Q.value = 0.9;
      var g = a.createGain(); g.gain.value = 0;
      s.connect(lp); lp.connect(bp); bp.connect(g); g.connect(master); s.start();
      knead = { s: s, bp: bp, g: g };
    }
    var v = Math.min(1, speed / 1.6);
    knead.g.gain.setTargetAtTime(v * 0.9, a.currentTime, 0.04);
    knead.bp.frequency.setTargetAtTime(220 + v * 520, a.currentTime, 0.05);
    if (v > 0.55 && Math.random() < 0.12) blip(260 + Math.random() * 300, 120, 0.06, 0.06 * v);
  }
  function kneadStop() { if (knead && ac) knead.g.gain.setTargetAtTime(0, ac.currentTime, 0.06); }

  var soundBtn = document.getElementById("kn-sound");
  function paintSound() {
    soundBtn.querySelector(".kn-sound__text").textContent = soundOn ? "Ton an" : "Ton aus";
    soundBtn.setAttribute("aria-pressed", soundOn ? "true" : "false");
    soundBtn.classList.toggle("is-off", !soundOn);
  }
  soundBtn.addEventListener("click", function () {
    soundOn = !soundOn; save("sound", soundOn); paintSound();
    if (!soundOn) kneadStop(); else sfx.plop(1.2);
    jelly(soundBtn);
  });
  paintSound();

  /* =========================================================
     Hilfsfunktionen
     ========================================================= */
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
  function svgEl(tag, attrs) {
    var n = document.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    return n;
  }
  function ext(url, text, cls) { return el("a", { href: url, target: "_blank", rel: "noopener noreferrer", class: cls || "kn-btn", text: text }); }
  function rnd(a, b) { return a + Math.random() * (b - a); }

  function rgb(hex) { hex = hex.replace("#", ""); return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)]; }
  function mix(hex, other, t) {
    var a = rgb(hex), b = rgb(other);
    return "rgb(" + a.map(function (v, i) { return Math.round(v + (b[i] - v) * t); }).join(",") + ")";
  }

  /* Elastisches Nachwackeln für alles, was man drückt */
  function jelly(node) {
    if (!node || reduce) return;
    node.classList.remove("is-jelly"); void node.offsetWidth; node.classList.add("is-jelly");
  }
  document.addEventListener("animationend", function (e) { if (e.animationName === "kn-jelly") e.target.classList.remove("is-jelly"); });

  /* Knetbuchstaben: jeder Buchstabe einzeln, jeder lässt sich quetschen */
  function clayWord(text, colors, cls) {
    var wrap = el("span", { class: "kn-letters " + (cls || ""), "aria-hidden": "true" });
    var i = 0;
    text.split(" ").forEach(function (word, wi) {
      var w = el("span", { class: "kn-word" });
      Array.prototype.forEach.call(word, function (ch) {
        var c = colors ? colors[i % colors.length] : null;
        var l = el("span", { class: "kn-l", text: ch });
        l.style.setProperty("--tilt", rnd(-5, 5).toFixed(1) + "deg");
        l.style.setProperty("--lift", rnd(-3, 3).toFixed(1) + "px");
        if (c) { l.style.setProperty("--c", c); l.style.setProperty("--c-dark", mix(c, "#2a1e2e", 0.38)); }
        l.dataset.i = i;
        w.appendChild(l); i++;
      });
      if (wi > 0) wrap.appendChild(document.createTextNode(" "));
      wrap.appendChild(w);
    });
    return wrap;
  }
  document.addEventListener("pointerdown", function (e) {
    var l = e.target.closest && e.target.closest(".kn-l");
    if (!l) return;
    jelly(l); sfx.squish(0.8 + (Number(l.dataset.i) % 7) * 0.09);
  });
  document.addEventListener("mouseover", function (e) {
    var l = e.target.closest && e.target.closest(".kn-l");
    if (!l || reduce || l.classList.contains("is-jelly")) return;
    l.classList.remove("is-wiggle"); void l.offsetWidth; l.classList.add("is-wiggle");
  });

  /* =========================================================
     Formen (Ausstechformen). Alle in einem 100×100-Raster.
     ========================================================= */
  function starPath(cx, cy, ro, ri, n) {
    var d = "";
    for (var i = 0; i < n * 2; i++) {
      var r = i % 2 ? ri : ro, a = -Math.PI / 2 + i * Math.PI / n;
      d += (i ? "L" : "M") + (cx + Math.cos(a) * r).toFixed(1) + " " + (cy + Math.sin(a) * r).toFixed(1) + " ";
    }
    return d + "Z";
  }
  function gearPath(cx, cy, ro, ri, n) {
    var d = "", step = Math.PI * 2 / n, wb = step * 0.56, wt = step * 0.34;
    for (var k = 0; k < n; k++) {
      var a = -Math.PI / 2 + k * step;
      [[ri, a - wb / 2], [ro, a - wt / 2], [ro, a + wt / 2], [ri, a + wb / 2]].forEach(function (p, j) {
        d += (k === 0 && j === 0 ? "M" : "L") + (cx + Math.cos(p[1]) * p[0]).toFixed(1) + " " + (cy + Math.sin(p[1]) * p[0]).toFixed(1) + " ";
      });
    }
    return d + "Z";
  }
  function dots(list, r) { return list.map(function (p) { return "M" + (p[0] - r) + " " + p[1] + " a" + r + " " + r + " 0 1 0 " + 2 * r + " 0 a" + r + " " + r + " 0 1 0 " + -2 * r + " 0"; }).join(" "); }

  var SHAPE_DEFS = {
    kugel:       { d: "M50 8 A42 42 0 1 1 49.9 8 Z" },
    sprechblase: { d: "M28 16 H72 Q90 16 90 34 V50 Q90 68 72 68 H50 L30 88 L34 68 H28 Q10 68 10 50 V34 Q10 16 28 16 Z", g: dots([[33, 42], [50, 42], [67, 42]], 4.5) },
    zahnrad:     { d: gearPath(50, 50, 46, 34, 8), g: dots([[50, 50]], 11) },
    stern:       { d: starPath(50, 53, 48, 21, 5) },
    herz:        { d: "M50 88 C22 68 7 50 10 32 C13 14 38 9 50 27 C62 9 87 14 90 32 C93 50 78 68 50 88 Z" },
    krone:       { d: "M15 82 L9 30 L31 52 L50 16 L69 52 L91 30 L85 82 Z", g: "M14 68 L86 68 " + dots([[32, 75], [50, 75], [68, 75]], 3) },
    brief:       { d: "M15 22 H85 Q92 22 92 29 V73 Q92 80 85 80 H15 Q8 80 8 73 V29 Q8 22 15 22 Z", g: "M11 27 L50 56 L89 27" }
  };

  var N = 64;
  var SHAPES = {};
  (function prepShapes() {
    var probe = document.createElement("canvas").getContext("2d");
    Object.keys(SHAPE_DEFS).forEach(function (name) {
      var def = SHAPE_DEFS[name], path = new Path2D(def.d);
      var sx = 0, sy = 0, n = 0, x, y;
      for (y = 0; y <= 100; y += 2) for (x = 0; x <= 100; x += 2) if (probe.isPointInPath(path, x, y)) { sx += x; sy += y; n++; }
      var cx = sx / n, cy = sy / n, pts = [];
      for (var i = 0; i < N; i++) {
        var a = -Math.PI / 2 + i / N * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a), r = 0;
        for (var rr = 74; rr > 0; rr -= 1.5) if (probe.isPointInPath(path, cx + ca * rr, cy + sa * rr)) { r = rr; break; }
        var lo = r, hi = r + 1.5;
        for (var k = 0; k < 6; k++) { var mid = (lo + hi) / 2; if (probe.isPointInPath(path, cx + ca * mid, cy + sa * mid)) lo = mid; else hi = mid; }
        pts.push([ca * lo, sa * lo]);
      }
      var A = 0; for (i = 0; i < N; i++) { var p = pts[i], q = pts[(i + 1) % N]; A += p[0] * q[1] - q[0] * p[1]; }
      var kk = Math.sqrt(Math.PI / (Math.abs(A) / 2));
      SHAPES[name] = { name: name, d: def.d, path: path, groove: def.g ? new Path2D(def.g) : null, cx: cx, cy: cy, k: kk, unit: pts.map(function (p) { return [p[0] * kk, p[1] * kk]; }) };
    });
  })();

  /* Kleines Knet-Symbol einer Form (für Überschriften und Leiste) */
  var iconCount = 0;
  function shapeIcon(name, color, cls) {
    var def = SHAPE_DEFS[name], id = "kn-ig" + (iconCount++);
    var svg = svgEl("svg", { viewBox: "-4 -4 108 108", class: "kn-icon " + (cls || ""), "aria-hidden": "true", focusable: "false" });
    var defs = svgEl("defs"), grad = svgEl("radialGradient", { id: id, cx: "34%", cy: "28%", r: "80%" });
    [["0", mix(color, "#ffffff", 0.45)], [".5", color], ["1", mix(color, "#2a1e2e", 0.3)]].forEach(function (s) { grad.appendChild(svgEl("stop", { offset: s[0], "stop-color": s[1] })); });
    defs.appendChild(grad); svg.appendChild(defs);
    svg.appendChild(svgEl("path", { d: def.d, fill: "rgba(31,43,82,.18)", transform: "translate(0 5)" }));
    svg.appendChild(svgEl("path", { d: def.d, fill: "url(#" + id + ")", stroke: mix(color, "#2a1e2e", 0.3), "stroke-width": "1.5", "stroke-linejoin": "round" }));
    if (def.g) svg.appendChild(svgEl("path", { d: def.g, fill: "none", stroke: mix(color, "#2a1e2e", 0.35), "stroke-width": "3", "stroke-linecap": "round", opacity: ".55" }));
    return svg;
  }
  /* Ausstechform als Umriss */
  function cutterIcon(name, color) {
    var def = SHAPE_DEFS[name];
    var svg = svgEl("svg", { viewBox: "-8 -8 116 116", class: "kn-cutter__svg", "aria-hidden": "true", focusable: "false" });
    svg.appendChild(svgEl("path", { d: def.d, fill: "none", stroke: "rgba(31,43,82,.22)", "stroke-width": "9", "stroke-linejoin": "round", transform: "translate(2 5)" }));
    svg.appendChild(svgEl("path", { d: def.d, fill: "none", stroke: color, "stroke-width": "9", "stroke-linejoin": "round" }));
    svg.appendChild(svgEl("path", { d: def.d, fill: "none", stroke: "rgba(255,255,255,.6)", "stroke-width": "2.5", "stroke-linejoin": "round", transform: "translate(-1.6 -1.8)" }));
    if (def.g) svg.appendChild(svgEl("path", { d: def.g, fill: "none", stroke: color, "stroke-width": "4.5", "stroke-linecap": "round", "stroke-linejoin": "round", opacity: ".85" }));
    return svg;
  }

  /* =========================================================
     Kapitel
     ========================================================= */
  var CHAPTERS = [
    { id: "journalismus", name: "Journalismus", shape: "sprechblase", cutter: "#E94A3C", clay: "#E94A3C", slab: "yellow" },
    { id: "werkstatt",    name: "KI-Werkstatt", shape: "zahnrad",     cutter: "#2F8FD0", clay: "#68C0EE", slab: "blue" },
    { id: "buehne",       name: "Bühne",        shape: "stern",       cutter: "#F2A900", clay: "#FFCD48", slab: "pink", accent: "#E94A3C" },
    { id: "ueber-mich",   name: "Über mich",    shape: "herz",        cutter: "#E8638C", clay: "#FF96B6", slab: "green" },
    { id: "preise",       name: "Preise",       shape: "krone",       cutter: "#4FA63A", clay: "#86CC62", slab: "orange" },
    { id: "kontakt",      name: "Kontakt",      shape: "brief",       cutter: "#7A64D8", clay: "#A592F2", slab: "lilac" }
  ];
  function chapter(id) { return CHAPTERS.filter(function (c) { return c.id === id; })[0]; }

  /* =========================================================
     Der Knetklumpen (Canvas, weiche Physik)
     ========================================================= */
  var CLAY_COLORS = [["Rot", "#E94A3C"], ["Gelb", "#FFCD48"], ["Grün", "#86CC62"], ["Rosa", "#FF96B6"], ["Blau", "#68C0EE"]];
  var blob = null;

  function makeBlob(canvas, onKnead) {
    var g = canvas.getContext("2d");
    var W = 0, H = 0, dpr = 1, C = { x: 0, y: 0 }, R = 100;
    var p = [], v = [], q = [], shape = SHAPES.kugel, color = load("farbe", "#E94A3C");
    var prints = [], cutter = null, running = false, visible = true, lastT = 0;
    var tex = null, pattern = null;
    var img = new Image(); img.onload = function () { tex = img; pattern = null; }; img.src = TEXTURE;

    for (var i = 0; i < N; i++) { p.push({ x: 0, y: 0 }); v.push({ x: 0, y: 0 }); q.push({ x: 0, y: 0 }); }

    function layout() {
      var r = canvas.getBoundingClientRect();
      var oldR = R, oldC = { x: C.x, y: C.y }, first = !W;
      W = r.width; H = r.height; dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      R = Math.min(W * 0.27, H * 0.31);
      C = { x: W / 2, y: H * 0.5 };
      for (var i = 0; i < N; i++) {
        if (first) { q[i].x = shape.unit[i][0] * R; q[i].y = shape.unit[i][1] * R; p[i].x = C.x + q[i].x; p[i].y = C.y + q[i].y; }
        else {
          var s = R / oldR; q[i].x *= s; q[i].y *= s;
          p[i].x = C.x + (p[i].x - oldC.x) * s; p[i].y = C.y + (p[i].y - oldC.y) * s;
        }
      }
      draw();
    }

    /* --- Physik --- */
    var finger = null; // { x, y, r }
    var grab = null;   // { w: [], x, y }
    var active = false;
    function area() { var A = 0; for (var i = 0; i < N; i++) { var a = p[i], b = p[(i + 1) % N]; A += a.x * b.y - b.x * a.y; } return Math.abs(A) / 2; }
    function step(dt) {
      var A0 = Math.PI * R * R, A = area(), L = 0, i;
      for (i = 0; i < N; i++) { var nb = p[(i + 1) % N]; L += Math.hypot(nb.x - p[i].x, nb.y - p[i].y); }
      var press = (A0 - A) / Math.max(L, 1);
      var relax = active ? 0 : 0.001;
      for (i = 0; i < N; i++) {
        var a = p[(i + N - 1) % N], b = p[(i + 1) % N], P = p[i];
        // langsam zurück in die gewählte Form – Knete "erinnert" sich
        q[i].x += (shape.unit[i][0] * R - q[i].x) * relax;
        q[i].y += (shape.unit[i][1] * R - q[i].y) * relax;
        var fx = (C.x + q[i].x - P.x) * 55 + ((a.x + b.x) / 2 - P.x) * 260;
        var fy = (C.y + q[i].y - P.y) * 55 + ((a.y + b.y) / 2 - P.y) * 260;
        var tx = b.x - a.x, ty = b.y - a.y, tl = Math.hypot(tx, ty) || 1;
        fx += (ty / tl) * press * 45; fy += (-tx / tl) * press * 45;
        v[i].x = (v[i].x + fx * dt) * 0.9; v[i].y = (v[i].y + fy * dt) * 0.9;
      }
      for (i = 0; i < N; i++) {
        p[i].x += v[i].x * dt; p[i].y += v[i].y * dt;
        if (finger) {
          var dx = p[i].x - finger.x, dy = p[i].y - finger.y, d = Math.hypot(dx, dy);
          if (d < finger.r) { var s = finger.r / (d || 0.01); p[i].x = finger.x + dx * s; p[i].y = finger.y + dy * s; v[i].x *= 0.5; v[i].y *= 0.5; }
        }
        // nicht durch die Mitte drücken, nicht aus dem Bild ziehen
        var rx = p[i].x - C.x, ry = p[i].y - C.y, rl = Math.hypot(rx, ry);
        if (rl < R * 0.22) { p[i].x = C.x + rx / (rl || 1) * R * 0.22; p[i].y = C.y + ry / (rl || 1) * R * 0.22; }
        p[i].x = Math.max(8, Math.min(W - 8, p[i].x)); p[i].y = Math.max(8, Math.min(H - 8, p[i].y));
        if (active) { // Knete bleibt, wie man sie formt
          q[i].x += (p[i].x - C.x - q[i].x) * 0.06; q[i].y += (p[i].y - C.y - q[i].y) * 0.06;
          var ql = Math.hypot(q[i].x, q[i].y); if (ql > R * 2.3) { q[i].x *= R * 2.3 / ql; q[i].y *= R * 2.3 / ql; }
        }
      }
    }
    function deformation() {
      var s = 0; for (var i = 0; i < N; i++) s += Math.hypot(q[i].x - shape.unit[i][0] * R, q[i].y - shape.unit[i][1] * R);
      return s / N / R;
    }

    /* --- Zeichnen --- */
    function smooth(pts, ox, oy, sc) {
      var path = new Path2D(), n = pts.length;
      function X(o) { return ox + (o.x - ox) * sc; } function Y(o) { return oy + (o.y - oy) * sc; }
      var l = pts[n - 1], f = pts[0];
      path.moveTo((X(l) + X(f)) / 2, (Y(l) + Y(f)) / 2);
      for (var i = 0; i < n; i++) { var a = pts[i], b = pts[(i + 1) % n]; path.quadraticCurveTo(X(a), Y(a), (X(a) + X(b)) / 2, (Y(a) + Y(b)) / 2); }
      path.closePath(); return path;
    }
    function draw(now) {
      now = now || performance.now();
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, W, H);
      var minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
      for (var i = 0; i < N; i++) { minX = Math.min(minX, p[i].x); maxX = Math.max(maxX, p[i].x); minY = Math.min(minY, p[i].y); maxY = Math.max(maxY, p[i].y); }
      var bw = maxX - minX, bh = maxY - minY;
      var path = smooth(p, C.x, C.y, 1);

      // Schatten auf dem Brett
      g.save();
      g.shadowColor = "rgba(25,30,60,.32)"; g.shadowBlur = 26; g.shadowOffsetY = 16;
      var grad = g.createRadialGradient(minX + bw * 0.36, minY + bh * 0.3, R * 0.05, minX + bw * 0.45, minY + bh * 0.45, Math.max(bw, bh) * 0.8);
      grad.addColorStop(0, mix(color, "#ffffff", 0.42)); grad.addColorStop(0.5, color); grad.addColorStop(1, mix(color, "#2a1e2e", 0.32));
      g.fillStyle = grad; g.fill(path);
      g.restore();

      g.save(); g.clip(path);
      // Knet-Struktur
      if (tex) {
        if (!pattern) { pattern = g.createPattern(tex, "repeat"); }
        g.globalCompositeOperation = "overlay"; g.globalAlpha = 0.42; g.fillStyle = pattern;
        g.fillRect(0, 0, W, H); g.globalAlpha = 1;
        g.globalCompositeOperation = "source-over";
      }
      // Rillen der Ausstechform – verschwinden, wenn man weiterknetet
      if (shape.groove) {
        var ga = Math.max(0, 1 - deformation() * 7);
        if (ga > 0.02) {
          var sc = R * shape.k;
          g.save(); g.translate(C.x, C.y); g.scale(sc, sc); g.translate(-shape.cx, -shape.cy);
          g.lineCap = "round"; g.lineJoin = "round";
          g.globalAlpha = 0.6 * ga; g.strokeStyle = "rgba(255,255,255,.75)"; g.lineWidth = 2.6; g.translate(0.5, 0.7); g.stroke(shape.groove);
          g.translate(-0.5, -0.7); g.strokeStyle = mix(color, "#2a1e2e", 0.45); g.lineWidth = 2.2; g.stroke(shape.groove);
          g.restore();
        }
      }
      // Fingerabdrücke
      for (var k = prints.length - 1; k >= 0; k--) {
        var pr = prints[k], age = (now - pr.t) / 9000;
        if (age >= 1) { prints.splice(k, 1); continue; }
        g.save(); g.translate(pr.x, pr.y); g.rotate(pr.rot); g.globalAlpha = (1 - age) * 0.5;
        g.strokeStyle = mix(color, "#2a1e2e", 0.5); g.lineWidth = 1.3;
        for (var ring = 0; ring < 7; ring++) {
          var rx2 = 3 + ring * 2.6, ry2 = rx2 * 1.3;
          g.beginPath(); g.ellipse(0, 0, rx2, ry2, 0, 0.4 + ring * 0.3, Math.PI * 2 - 0.3 + ring * 0.12); g.stroke();
        }
        g.restore();
      }
      // Glanzlicht
      var hl = g.createRadialGradient(minX + bw * 0.32, minY + bh * 0.22, 0, minX + bw * 0.32, minY + bh * 0.22, Math.max(bw, bh) * 0.32);
      hl.addColorStop(0, "rgba(255,255,255,.45)"); hl.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = hl; g.fillRect(0, 0, W, H);
      g.restore();
      g.lineWidth = 2; g.strokeStyle = mix(color, "#2a1e2e", 0.5); g.globalAlpha = 0.35; g.stroke(path); g.globalAlpha = 1;

      // Ausstechform im Anflug
      if (cutter) drawCutter(now);
    }

    /* --- Ausstechform --- */
    function drawCutter(now) {
      var t = now - cutter.t0, s = SHAPES[cutter.shape], sc = R * s.k, y = 0, alpha = 1;
      var DOWN = reduce ? 1 : 280, HOLD = reduce ? 1 : 180, UP = reduce ? 1 : 320;
      if (t < DOWN) { var e = t / DOWN; y = -(1 - e * e) * (R * 1.6 + 40); }
      else if (t < DOWN + HOLD) { y = 0; if (!cutter.hit) { cutter.hit = true; cut(cutter.shape); } }
      else if (t < DOWN + HOLD + UP) { var u = (t - DOWN - HOLD) / UP; y = -u * R * 1.2; alpha = 1 - u; }
      else { var done = cutter.done; cutter = null; if (done) done(); return; }
      // Schatten der Form auf der Knete
      g.save(); g.translate(C.x, C.y); g.scale(sc, sc); g.translate(-s.cx, -s.cy);
      g.globalAlpha = alpha * Math.max(0, 0.35 - Math.abs(y) / (R * 6));
      g.lineWidth = 10 / sc * 1.2; g.strokeStyle = "rgba(20,25,50,1)"; g.lineJoin = "round"; g.translate(1.5, 2.5); g.stroke(s.path);
      g.restore();
      g.save(); g.translate(C.x, C.y + y); g.scale(sc, sc); g.translate(-s.cx, -s.cy);
      g.globalAlpha = alpha; g.lineJoin = "round";
      g.lineWidth = 11 / sc; g.strokeStyle = cutter.color; g.stroke(s.path);
      g.lineWidth = 3 / sc; g.strokeStyle = "rgba(255,255,255,.65)"; g.translate(-1.6 / sc, -1.8 / sc); g.stroke(s.path);
      g.restore();
    }
    function cut(name) {
      shape = SHAPES[name];
      for (var i = 0; i < N; i++) {
        q[i].x = shape.unit[i][0] * R; q[i].y = shape.unit[i][1] * R;
        p[i].x = C.x + q[i].x * 1.05; p[i].y = C.y + q[i].y * 0.96;
        v[i].x = 0; v[i].y = 0;
      }
      prints.length = 0;
      sfx.klack(); setTimeout(function () { sfx.squish(0.9); }, 40);
      wake();
    }

    /* --- Schleife --- */
    function loop(now) {
      if (!running) return;
      var dt = Math.min(0.033, (now - lastT) / 1000 || 0.016); lastT = now;
      var sub = 3; for (var s = 0; s < sub; s++) step(dt / sub);
      draw(now);
      var still = !active && !cutter && !prints.length;
      if (still) { var mv = 0; for (var i = 0; i < N; i++) mv += Math.abs(v[i].x) + Math.abs(v[i].y); if (mv < N * 0.4 && deformation() < 0.004) { running = false; return; } }
      if (!visible && !active) { running = false; return; }
      requestAnimationFrame(loop);
    }
    function wake() { if (running) return; running = true; lastT = performance.now(); requestAnimationFrame(loop); }

    /* --- Anfassen --- */
    function local(e) { var r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    function inside(pt) {
      var c = false; for (var i = 0, j = N - 1; i < N; j = i++) {
        var a = p[i], b = p[j];
        if (((a.y > pt.y) !== (b.y > pt.y)) && (pt.x < (b.x - a.x) * (pt.y - a.y) / (b.y - a.y) + a.x)) c = !c;
      }
      return c;
    }
    function nearEdge(pt) { var m = 1e9; for (var i = 0; i < N; i++) m = Math.min(m, Math.hypot(p[i].x - pt.x, p[i].y - pt.y)); return m; }
    var last = null, downAt = null, moved = 0, kneadMs = 0;
    var tapOut = null;
    canvas.addEventListener("pointerdown", function (e) {
      if (e.button > 0 || active) return;
      var pt = local(e);
      var isIn = inside(pt);
      if (!isIn && nearEdge(pt) > R * 0.7) return;     // daneben gegriffen: nichts tun
      if (!isIn && e.pointerType !== "mouse") {        // Finger außerhalb: Seite darf scrollen, Antippen macht eine Delle
        tapOut = { x: pt.x, y: pt.y, id: e.pointerId, t: performance.now() };
        return;
      }
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      active = true; last = pt; downAt = { x: pt.x, y: pt.y, t: performance.now(), inside: isIn }; moved = 0;
      if (isIn) {
        var w = [], sig = R * 0.78;
        for (var i = 0; i < N; i++) { var d = Math.hypot(p[i].x - pt.x, p[i].y - pt.y); w.push(Math.exp(-(d / sig) * (d / sig))); }
        grab = { w: w };
      } else {
        finger = { x: pt.x, y: pt.y, r: Math.max(16, R * 0.2) };
      }
      sfx.squish(rnd(0.85, 1.15));
      hideHint();
      wake();
    });
    canvas.addEventListener("pointermove", function (e) {
      if (!active) return;
      var pt = local(e), dx = pt.x - last.x, dy = pt.y - last.y, dist = Math.hypot(dx, dy);
      var now = performance.now(), dtm = Math.max(1, now - (last.t || now - 16));
      moved += dist;
      if (grab) for (var i = 0; i < N; i++) { p[i].x += grab.w[i] * dx; p[i].y += grab.w[i] * dy; q[i].x += grab.w[i] * dx * 0.5; q[i].y += grab.w[i] * dy * 0.5; }
      if (finger) { finger.x = pt.x; finger.y = pt.y; }
      var speed = dist / dtm;
      kneadSound(speed);
      if (dist > 0.5) { kneadMs += dtm; if (onKnead) onKnead(kneadMs); }
      last = pt; last.t = now;
    });
    function release(e) {
      if (!active) return;
      active = false; kneadStop();
      var pt = e && e.clientX !== undefined ? local(e) : last;
      if (downAt && moved < 6) {
        // kurz reingedrückt: Fingerabdruck und ein kleiner Wackler
        prints.push({ x: pt.x, y: pt.y, rot: rnd(-0.6, 0.6), t: performance.now() });
        if (prints.length > 14) prints.shift();
        for (var i = 0; i < N; i++) { var dx = p[i].x - C.x, dy = p[i].y - C.y, l = Math.hypot(dx, dy) || 1; v[i].x += dx / l * 70; v[i].y += dy / l * 70 * 0.6; }
        sfx.plop(rnd(0.8, 1.1));
      }
      grab = null; finger = null; downAt = null;
      wake();
    }
    canvas.addEventListener("pointerup", function (e) {
      if (tapOut && e.pointerId === tapOut.id) {
        var pt = local(e);
        if (Math.hypot(pt.x - tapOut.x, pt.y - tapOut.y) < 12 && performance.now() - tapOut.t < 450) dent(tapOut);
        tapOut = null;
      }
      release(e);
    });
    canvas.addEventListener("pointercancel", function () { tapOut = null; });
    // Auf dem Handy: Nur wer im Klumpen aufsetzt, knetet. Sonst scrollt die Seite ganz normal.
    canvas.addEventListener("touchstart", function (e) {
      if (e.touches.length !== 1) return;
      if (inside(local(e.touches[0]))) e.preventDefault();
    }, { passive: false });
    canvas.addEventListener("pointercancel", release);
    canvas.addEventListener("lostpointercapture", function () { if (active) release(); });
    canvas.addEventListener("dblclick", function () { roll(); });

    /* Tastatur: Pfeile drücken von der Seite, Leertaste quetscht platt, R rollt zur Kugel */
    canvas.addEventListener("keydown", function (e) {
      var dir = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
      if (dir) {
        e.preventDefault();
        for (var i = 0; i < N; i++) {
          var dx = p[i].x - C.x, dy = p[i].y - C.y, l = Math.hypot(dx, dy) || 1, dot = (dx * dir[0] + dy * dir[1]) / l;
          if (dot > 0.35) { var f = (dot - 0.35) * R * 0.5; p[i].x -= dir[0] * f; p[i].y -= dir[1] * f; q[i].x -= dir[0] * f * 0.8; q[i].y -= dir[1] * f * 0.8; }
        }
        sfx.squish(rnd(0.9, 1.1)); hideHint(); kneadMs += 400; if (onKnead) onKnead(kneadMs); wake();
      } else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        for (var j = 0; j < N; j++) { q[j].x *= 1.18; q[j].y *= 0.78; v[j].y += (p[j].y - C.y) > 0 ? 0 : 90; }
        sfx.squish(0.7); hideHint(); wake();
      } else if (e.key === "r" || e.key === "R") { roll(); }
    });

    function dent(pt) {
      var dx0 = C.x - pt.x, dy0 = C.y - pt.y, l0 = Math.hypot(dx0, dy0) || 1, s = R * 0.45;
      for (var i = 0; i < N; i++) {
        var d = Math.hypot(p[i].x - pt.x, p[i].y - pt.y), push = Math.exp(-(d * d) / (s * s)) * R * 0.3;
        p[i].x += dx0 / l0 * push; p[i].y += dy0 / l0 * push;
        q[i].x += dx0 / l0 * push * 0.7; q[i].y += dy0 / l0 * push * 0.7;
      }
      sfx.squish(rnd(0.9, 1.1)); hideHint(); wake();
    }
    function roll() {
      shape = SHAPES.kugel;
      for (var i = 0; i < N; i++) { q[i].x = shape.unit[i][0] * R; q[i].y = shape.unit[i][1] * R; }
      prints.length = 0; sfx.roll(); wake();
    }

    var ro = window.ResizeObserver ? new ResizeObserver(function () { layout(); wake(); }) : null;
    if (ro) ro.observe(canvas); else window.addEventListener("resize", function () { layout(); wake(); });
    if (window.IntersectionObserver) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) wake(); }).observe(canvas);
    document.addEventListener("visibilitychange", function () { if (!document.hidden) wake(); });

    layout();
    // Am Anfang einmal kurz durchwackeln, damit man sieht: das ist weich
    if (!reduce) setTimeout(function () { for (var i = 0; i < N; i++) { var s = Math.sin(i / N * Math.PI * 6); v[i].x += (p[i].x - C.x) / R * s * 160; v[i].y += (p[i].y - C.y) / R * s * 160; } wake(); }, 500);
    wake();

    return {
      press: function (name, col, done) {
        if (cutter) return;
        cutter = { shape: name, color: col, t0: performance.now(), done: done };
        wake();
      },
      roll: roll,
      color: function (c) { color = c; save("farbe", c); wake(); draw(); },
      getColor: function () { return color; }
    };
  }

  /* =========================================================
     Maskottchen mit Sprechblase
     ========================================================= */
  var bubble = null, bubbleTimer = null;
  function say(text, ms) {
    if (!bubble) return;
    bubble.textContent = text;
    bubble.classList.add("is-on");
    jelly(bubble);
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(function () { bubble.classList.remove("is-on"); }, ms || 4200);
  }
  var LINES = [
    "Hallo! Ich bin aus Knete. Christian ist echt.",
    "Drück ruhig fester, ich halt was aus.",
    "Ja, mein Kopf ist ein Mikrofon. Frag lieber nicht.",
    "Tipp: Weiter unten gibt's Medaillen aus Knete.",
    "Alles hier ist von Hand geformt. Fast wie gute Recherche.",
    "Probier mal den Stern. Der führt auf die Bühne."
  ];
  var lineIx = 0;

  /* =========================================================
     Fingerabdrücke überall, wo man reindrückt
     ========================================================= */
  var printLayer = document.getElementById("kn-prints");
  document.addEventListener("pointerdown", function (e) {
    if (reduce || e.button > 0) return;
    if (e.target.closest && e.target.closest("canvas, .design-switch")) return;
    var f = el("i", { class: "kn-print" });
    f.style.left = (e.pageX - 14) + "px"; f.style.top = (e.pageY - 18) + "px";
    f.style.setProperty("--r", rnd(-40, 40).toFixed(0) + "deg");
    printLayer.appendChild(f);
    if (printLayer.children.length > 24) printLayer.firstChild.remove();
    setTimeout(function () { f.remove(); }, 6200);
  });

  /* Alles, was Knete ist, quetscht sich beim Drücken */
  document.addEventListener("pointerdown", function (e) {
    var t = e.target.closest && e.target.closest(".kn-squish");
    if (t) jelly(t);
  });
  document.addEventListener("click", function (e) {
    var t = e.target.closest && e.target.closest(".kn-btn, .kn-pill, .kn-tab, .kn-ball, .kn-cutter, .kn-color, .kn-roll");
    if (t && e.detail === 0) jelly(t); // Tastatur
  });

  /* =========================================================
     Seite bauen
     ========================================================= */
  function heading(ch, sub) {
    var h = el("h2", { class: "kn-title", id: "h-" + ch.id }, [el("span", { class: "kn-sr", text: ch.name }), clayWord(ch.name)]);
    return el("div", { class: "kn-slab__head" }, [el("div", { class: "kn-slab__icon kn-squish" }, [shapeIcon(ch.shape, ch.clay)]), el("div", {}, [h, sub ? el("p", { class: "kn-sub", text: sub }) : null])]);
  }
  function slab(ch, sub, kids) {
    var s = el("section", { class: "kn-slab kn-slab--" + ch.slab + " kn-pop", id: ch.id, "aria-labelledby": "h-" + ch.id }, [heading(ch, sub)].concat(kids));
    s.style.setProperty("--accent", ch.accent || ch.cutter);
    return s;
  }
  function card(item, accent) {
    return el("article", { class: "kn-card kn-squish kn-pop" }, [
      item.tag ? el("span", { class: "kn-tag", text: item.tag }) : null,
      el("h3", { text: item.titel }),
      el("p", { text: item.text }),
      item.link ? ext(item.link, (item.linkText || "Ansehen") + " →", "kn-btn kn-btn--small") : null
    ]);
  }
  function photo(src, alt, tilt) {
    var f = el("figure", { class: "kn-frame kn-squish" }, [el("img", { src: src, alt: alt, loading: "lazy" })]);
    f.style.setProperty("--tilt", tilt + "deg");
    return f;
  }

  /* --- Kopfbereich: Knetbrett --- */
  function buildHero() {
    var nameColors = ["#E94A3C", "#FFCD48", "#86CC62", "#FF96B6", "#FFFFFF", "#FF9F43"];
    var name = el("h1", { class: "kn-name" }, [el("span", { class: "kn-sr", text: S.name }), clayWord("Christian", nameColors, "kn-name__a"), el("br"), clayWord("Schiffer", nameColors.slice(3).concat(nameColors.slice(0, 3)), "kn-name__b")]);
    var pillColors = ["#E94A3C", "#2F8FD0", "#F2A900", "#4FA63A"];
    var ROLE_TO = { Journalist: "journalismus", Autor: "journalismus", Speaker: "buehne", Trainer: "werkstatt" };
    var roleLinks = [];
    var roles = el("ul", { class: "kn-roles", "aria-label": "Was ich mache" }, S.roles.map(function (r, i) {
      var a = el("a", { class: "kn-pill kn-squish kn-pill--role", href: "#" + (ROLE_TO[r] || "journalismus"), text: r });
      a.style.setProperty("--c", pillColors[i % 4]); a.style.setProperty("--tilt", rnd(-4, 4).toFixed(1) + "deg");
      roleLinks.push([a, r]);
      return el("li", {}, [a]);
    }));
    var tag = el("ul", { class: "kn-tagline" }, S.tagline.map(function (t) { return el("li", { text: t }); }));

    var canvas = el("canvas", { class: "kn-blob", tabindex: "0", role: "img", "aria-label": "Ein Klumpen Knete zum Spielen. Ziehen, drücken, quetschen. Mit den Pfeiltasten drückst du ihn von der Seite ein, die Leertaste quetscht ihn platt, R rollt ihn wieder zur Kugel." });
    var hint = el("p", { class: "kn-hint", "aria-hidden": "true", html: "Knet mich!<br><small>ziehen · drücken · quetschen</small>" });
    var zone = el("div", { class: "kn-zone" }, [canvas, hint]);

    var colors = el("div", { class: "kn-colors", role: "group", "aria-label": "Farbe der Knete" }, CLAY_COLORS.map(function (c) {
      var b = el("button", { type: "button", class: "kn-color", "aria-label": "Knete in " + c[0], title: c[0] });
      b.style.setProperty("--c", c[1]);
      b.addEventListener("click", function () {
        blob.color(c[1]); sfx.plop(1 + CLAY_COLORS.indexOf(c) * 0.08); paintColors(); jelly(b);
      });
      return b;
    }));
    function paintColors() { Array.prototype.forEach.call(colors.children, function (b, i) { b.setAttribute("aria-pressed", CLAY_COLORS[i][1] === blob.getColor() ? "true" : "false"); }); }
    var rollBtn = el("button", { type: "button", class: "kn-roll", text: "Zur Kugel rollen" });
    rollBtn.addEventListener("click", function () { blob.roll(); jelly(rollBtn); });
    var tools = el("div", { class: "kn-tools" }, [colors, rollBtn]);

    var mascot = el("button", { type: "button", class: "kn-mascot", "aria-label": "Das Knet-Maskottchen anstupsen" }, [el("img", { src: MASCOT, alt: "" })]);
    bubble = el("p", { class: "kn-bubble", role: "status" });
    mascot.addEventListener("click", function () {
      jelly(mascot.firstChild); sfx.hoi();
      say(LINES[lineIx++ % LINES.length]);
    });

    var cutters = el("div", { class: "kn-cutters__row" }, CHAPTERS.map(function (ch) {
      var b = el("a", { class: "kn-cutter", href: "#" + ch.id }, [cutterIcon(ch.shape, ch.cutter), el("span", { text: ch.name })]);
      b.style.setProperty("--c", ch.cutter);
      b.addEventListener("click", function (e) { e.preventDefault(); cutTo(ch, b); });
      return b;
    }));
    // Form in den Klumpen stechen, dann ins Kapitel (auch für die Rollen-Knöpfe oben)
    function cutTo(ch, b, after) {
      jelly(b); hideHint();
      var target = document.getElementById(ch.id);
      var go = function () {
        history.replaceState(null, "", "#" + ch.id);
        if (after) after();
        target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
        var h = target.querySelector("h2"); if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
      };
      if (reduce) { go(); return; }
      blob.press(ch.shape, ch.cutter, function () { setTimeout(go, 260); });
    }
    roleLinks.forEach(function (pair) {
      var a = pair[0], r = pair[1];
      a.addEventListener("click", function (e) {
        e.preventDefault(); sfx.squish(1.1);
        var ch = chapter(ROLE_TO[r] || "journalismus");
        var after = r === "Autor" ? function () {
          var t = Array.prototype.filter.call(document.querySelectorAll(".kn-tab"), function (x) { return x.textContent.trim() === "Bücher"; })[0];
          if (t && t.getAttribute("aria-selected") !== "true") t.click();
        } : null;
        cutTo(ch, a, after);
      });
    });
    var tray = el("nav", { class: "kn-cutters", "aria-label": "Kapitel" }, [
      el("p", { class: "kn-cutters__label", text: "Form auswählen – und ab ins Kapitel:" }),
      cutters
    ]);

    var hero = el("section", { class: "kn-hero", id: "start" }, [
      el("div", { class: "kn-board" }, [
        el("div", { class: "kn-hero__text" }, [
          el("p", { class: "kn-kicker", text: "Von Hand geformt in " + S.city + ", seit " + S.since }),
          name, roles, tag
        ]),
        el("div", { class: "kn-play" }, [zone, tools]),
        el("div", { class: "kn-mascot-wrap" }, [bubble, mascot])
      ]),
      tray
    ]);
    main.appendChild(hero);

    var knead1 = false, knead2 = false, knead3 = false;
    blob = makeBlob(canvas, function (ms) {
      if (!knead1 && ms > 1800) { knead1 = true; say("Ja, genau so!", 2400); }
      else if (!knead2 && ms > 9000) { knead2 = true; say("Du knetest wie ein Profi.", 3000); }
      else if (!knead3 && ms > 22000) { knead3 = true; say("Jetzt bist du offiziell entspannt. Weiter unten geht's übrigens um Journalismus.", 5200); }
    });
    paintColors();

    hintEl = hint;
  }
  var hintEl = null;
  function hideHint() { if (hintEl) hintEl.classList.add("is-gone"); }

  /* --- Leiste oben --- */
  function buildBar() {
    var bar = document.getElementById("kn-bar");
    var top = el("a", { class: "kn-bar__home kn-squish", href: "#start", "aria-label": "Nach oben zur Knete" }, [shapeIcon("kugel", "#E94A3C")]);
    bar.appendChild(top);
    CHAPTERS.forEach(function (ch) {
      bar.appendChild(el("a", { class: "kn-bar__link", href: "#" + ch.id, "data-id": ch.id }, [shapeIcon(ch.shape, ch.clay), el("span", { text: ch.name })]));
    });
    var hero = document.getElementById("start");
    if (window.IntersectionObserver) {
      var io = new IntersectionObserver(function (en) {
        en.forEach(function (x) {
          if (x.isIntersecting) Array.prototype.forEach.call(bar.querySelectorAll(".kn-bar__link"), function (a) { a.classList.toggle("is-here", a.dataset.id === x.target.id); });
        });
      }, { rootMargin: "-45% 0px -50% 0px" });
      CHAPTERS.forEach(function (ch) { io.observe(document.getElementById(ch.id)); });
    }
    // Leiste erst zeigen, wenn die Ausstechformen oben aus dem Bild sind
    var tray = hero.querySelector(".kn-cutters"), ticking = false;
    function check() { ticking = false; bar.classList.toggle("is-on", tray.getBoundingClientRect().bottom < 40); }
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(check); } }, { passive: true });
    check();
    bar.addEventListener("click", function (e) { var a = e.target.closest("a"); if (a) sfx.plop(1.2); });
  }

  /* --- Journalismus --- */
  function buildJournalismus() {
    var ch = chapter("journalismus");
    var groups = S.journalismus.concat([{ titel: "Bücher", books: true }]);
    var tabs = el("div", { class: "kn-tabs", role: "tablist", "aria-label": "Bereiche" });
    var panel = el("div", { class: "kn-panel", role: "tabpanel", id: "kn-jpanel" });
    var tabColors = ["#E94A3C", "#2F8FD0", "#4FA63A", "#7A64D8", "#F2A900"];
    function show(gi, focus) {
      Array.prototype.forEach.call(tabs.children, function (b, j) { b.setAttribute("aria-selected", j === gi ? "true" : "false"); b.tabIndex = j === gi ? 0 : -1; });
      if (focus) tabs.children[gi].focus();
      panel.innerHTML = "";
      panel.setAttribute("aria-labelledby", "kn-jtab" + gi);
      var gr = groups[gi];
      if (gr.books) {
        panel.appendChild(el("p", { class: "kn-panel__intro", text: "Manche Themen brauchen mehr als einen Artikel oder eine Sendung – sie brauchen ein ganzes Buch." }));
        panel.appendChild(el("div", { class: "kn-books" }, S.buecher.map(function (b, i) {
          return el("div", { class: "kn-book kn-squish kn-pop" }, [
            el("div", { class: "kn-book__cover" }, [b.cover ? el("img", { src: b.cover, alt: "Cover: " + b.titel, loading: "lazy" }) : el("span", { class: "kn-book__secret", text: "?" })]),
            el("h3", { text: b.titel }), el("p", { class: "kn-book__sub", text: b.untertitel }), el("p", { class: "kn-book__verlag", text: b.verlag })
          ]);
        })));
      } else {
        panel.appendChild(el("p", { class: "kn-panel__intro", text: gr.intro }));
        panel.appendChild(el("div", { class: "kn-cards" + (gr.items.length === 4 ? " kn-cards--four" : "") }, gr.items.map(function (it) { return card(it); })));
      }
      plopIn(panel);
    }
    groups.forEach(function (gr, gi) {
      var b = el("button", { type: "button", role: "tab", class: "kn-tab", id: "kn-jtab" + gi, "aria-controls": "kn-jpanel", text: gr.titel });
      b.style.setProperty("--c", tabColors[gi % tabColors.length]);
      b.addEventListener("click", function () { sfx.squish(0.9 + gi * 0.07); jelly(b); show(gi); });
      b.addEventListener("keydown", function (e) {
        var n = groups.length;
        if (e.key === "ArrowRight") { e.preventDefault(); show((gi + 1) % n, true); }
        if (e.key === "ArrowLeft") { e.preventDefault(); show((gi + n - 1) % n, true); }
      });
      tabs.appendChild(b);
    });
    show(0);
    main.appendChild(slab(ch, "Podcasts, Radio-Dokus, Selbstversuche, Games – und drei Bücher.", [
      el("p", { class: "kn-lead", text: S.journalismusIntro }),
      tabs, panel
    ]));
  }

  /* --- KI-Werkstatt --- */
  function buildWerkstatt() {
    var ch = chapter("werkstatt"), W = S.workshops;
    var sizes = [["S", "90-Minuten-Crashkurs", "Crashkurs (90 Minuten)", 0.72], ["M", "Tagesseminar", "Tagesseminar", 0.86], ["L", "Wochenseminar", "Wochenseminar", 1]];
    var balls = el("div", { class: "kn-balls" }, sizes.map(function (s, i) {
      var a = el("a", { class: "kn-ball", href: "mailto:" + S.email + "?subject=" + encodeURIComponent("Workshop-Anfrage: " + s[2]) }, [
        el("span", { class: "kn-ball__lump", "aria-hidden": "true", text: s[0] }),
        el("span", { class: "kn-ball__name", text: s[1] })
      ]);
      a.style.setProperty("--size", s[3]);
      a.style.setProperty("--c", ["#FFCD48", "#86CC62", "#E94A3C"][i]);
      a.addEventListener("pointerdown", function () { sfx.squish(1.25 - i * 0.2); });
      return a;
    }));
    main.appendChild(slab(ch, "Generative KI richtig einsetzen – mit den Händen im Material.", [
      el("div", { class: "kn-split" }, [
        el("div", { class: "kn-split__text" }, W.text.map(function (t) { return el("p", { text: t }); }).concat([
          el("blockquote", { class: "kn-quote kn-squish" }, [el("p", { text: "„" + W.zitat + "“" })])
        ])),
        el("div", { class: "kn-photos" }, W.fotos.map(function (f, i) { return photo(f, "Szene aus einem KI-Workshop", i ? 2.5 : -2); }))
      ]),
      el("h3", { class: "kn-h3", text: "Wie viel Knete darf's sein?" }),
      balls,
      el("p", { class: "kn-note", text: "Ein Klick auf eine Kugel öffnet eine E-Mail mit der passenden Anfrage." })
    ]));
  }

  /* --- Bühne --- */
  function buildBuehne() {
    var ch = chapter("buehne");
    main.appendChild(slab(ch, "Vorträge, Panels, Moderationen.", [
      el("p", { class: "kn-lead", text: S.talksIntro }),
      el("div", { class: "kn-cards kn-cards--two" }, S.talks.map(function (t) { return card({ tag: t.tag, titel: t.titel, text: t.text, link: t.link, linkText: "Ansehen" }); })),
      el("div", { class: "kn-photos kn-photos--row" }, S.talkFotos.map(function (f, i) { return photo(f, "Christian Schiffer auf der Bühne", i ? 1.8 : -1.5); }))
    ]));
  }

  /* --- Über mich --- */
  function buildIch() {
    var ch = chapter("ueber-mich");
    var age = new Date().getFullYear() - S.since;
    var facts = el("dl", { class: "kn-facts" }, [
      ["Heimat", S.city], ["Knetalter", age + " Jahre"], ["Beruf", "Journalist, Autor, Speaker, Moderator, Trainer"], ["Ressort", "„Netzwelt“ beim BR"]
    ].reduce(function (acc, f) { return acc.concat([el("dt", { text: f[0] }), el("dd", { text: f[1] })]); }, []));
    var zeugen = el("div", { class: "kn-voices" }, S.zeugen.map(function (z, i) {
      var b = el("figure", { class: "kn-voice kn-squish kn-pop" }, [
        el("blockquote", {}, [el("p", { text: "„" + z.text + "“" })]),
        el("figcaption", {}, [el("b", { text: z.name }), el("span", { text: z.rolle })])
      ]);
      b.style.setProperty("--c", ["#FFCD48", "#68C0EE", "#FF96B6"][i % 3]);
      return b;
    }));
    main.appendChild(slab(ch, "Der Mensch hinter dem Mikrofon.", [
      el("div", { class: "kn-me" }, [
        el("div", { class: "kn-me__pic" }, [photo(S.portrait, "Porträt von Christian Schiffer", -2.5), facts]),
        el("div", { class: "kn-me__text" }, [
          el("p", { class: "kn-lead", text: S.steckbrief }),
          el("blockquote", { class: "kn-quote kn-quote--big kn-squish" }, [el("p", { text: "„" + S.zitat + "“" })])
        ].concat(S.bio.map(function (b) { return el("p", { text: b }); })))
      ]),
      el("h3", { class: "kn-h3", text: "Was andere über mich sagen" }),
      zeugen
    ]));
  }

  /* --- Preise --- */
  function buildPreise() {
    var ch = chapter("preise");
    var cols = ["#FFCD48", "#68C0EE", "#E94A3C", "#86CC62", "#FF96B6", "#A592F2"];
    var list = el("ol", { class: "kn-medals" }, S.preise.map(function (p, i) {
      var c = cols[i % cols.length];
      var li = el("li", { class: "kn-medal kn-pop" }, [
        el("span", { class: "kn-medal__disc kn-squish", "aria-hidden": "true" }, [el("span", { text: String(p.jahr) })]),
        el("span", { class: "kn-medal__text" }, [el("b", { text: p.preis }), el("span", { text: "für „" + p.werk + "“" })]),
        el("span", { class: "kn-sr", text: " (" + p.jahr + ")" })
      ]);
      li.style.setProperty("--c", c);
      li.style.setProperty("--c-dark", mix(c, "#2a1e2e", 0.35));
      li.style.setProperty("--tilt", rnd(-6, 6).toFixed(1) + "deg");
      li.querySelector(".kn-medal__disc").addEventListener("pointerdown", function () { sfx.pling(1 + (i % 6) * 0.06); });
      return li;
    }));
    main.appendChild(slab(ch, "Zwölf Medaillen – leider nur die hier aus Knete.", [list]));
  }

  /* --- Kontakt --- */
  function buildKontakt() {
    var ch = chapter("kontakt");
    var env = el("a", { class: "kn-envelope", href: "mailto:" + S.email }, [
      el("span", { class: "kn-envelope__flap", "aria-hidden": "true" }),
      el("span", { class: "kn-envelope__text" }, [el("b", { text: "E-Mail schreiben" }), el("span", { text: S.email })])
    ]);
    env.addEventListener("pointerdown", function () { sfx.squish(1.1); });
    env.addEventListener("click", function () { sfx.pling(1.2); jelly(env); });
    var copy = el("button", { type: "button", class: "kn-btn kn-btn--ghost", text: "Adresse kopieren" });
    copy.addEventListener("click", function () {
      var done = function () { copy.textContent = "Kopiert!"; sfx.pling(1.3); setTimeout(function () { copy.textContent = "Adresse kopieren"; }, 2000); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(S.email).then(done, function () { copy.textContent = S.email; });
      else copy.textContent = S.email;
    });
    var socialCols = ["#2A6DB5", "#2F8FD0", "#1F2B52", "#D9507A"];
    main.appendChild(slab(ch, "Moderationen, Workshops, Vorträge, journalistische Projekte.", [
      el("div", { class: "kn-contact" }, [
        el("div", { class: "kn-contact__mail" }, [env, copy]),
        el("div", { class: "kn-contact__rest" }, [
          el("p", { class: "kn-lead", text: "Für Anfragen zu Vorträgen, Moderationen oder journalistischen Aufträgen am besten per E-Mail." }),
          el("ul", { class: "kn-socials" }, S.socials.map(function (s, i) {
            var a = ext(s.url, s.name, "kn-pill kn-pill--link");
            a.style.setProperty("--c", socialCols[i % 4]); a.style.setProperty("--tilt", rnd(-3, 3).toFixed(1) + "deg");
            return el("li", {}, [a]);
          })),
          el("p", { class: "kn-note", text: S.phoneNote })
        ])
      ])
    ]));
  }

  /* Elemente "ploppen" beim ersten Auftauchen kurz auf – bleiben aber immer sichtbar */
  var popIO = (!reduce && window.IntersectionObserver) ? new IntersectionObserver(function (en) {
    en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add("is-in"); popIO.unobserve(x.target); } });
  }, { rootMargin: "0px 0px -8% 0px" }) : null;
  function plopIn(root) {
    if (!popIO) return;
    Array.prototype.forEach.call(root.querySelectorAll(".kn-pop:not(.is-in)"), function (n, i) { n.style.setProperty("--delay", (i % 6) * 60 + "ms"); popIO.observe(n); });
  }

  buildHero();
  buildJournalismus();
  buildWerkstatt();
  buildBuehne();
  buildIch();
  buildPreise();
  buildKontakt();
  buildBar();
  plopIn(main);

  /* Direktlink auf ein Kapitel (z. B. knete.html#preise) */
  if (location.hash && document.getElementById(location.hash.slice(1))) {
    setTimeout(function () { document.getElementById(location.hash.slice(1)).scrollIntoView(); }, 60);
  }

  /* Erste Berührung schaltet den Ton frei (Browser wollen das so) */
  function unlock() { if (soundOn) audio(); document.removeEventListener("pointerdown", unlock, true); document.removeEventListener("keydown", unlock, true); }
  document.addEventListener("pointerdown", unlock, true);
  document.addEventListener("keydown", unlock, true);
})();
