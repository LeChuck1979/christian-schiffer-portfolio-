/* =========================================================
   PIXEL – die Website als 16-Bit-Videospiel
   Inhalte kommen aus content.js (window.SITE).
   ========================================================= */
(function () {
  "use strict";
  var S = window.SITE;
  var main = document.getElementById("px-main");
  var hud = document.querySelector(".px-hud");
  var hudTitle = document.getElementById("px-hud-title");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var MASCOT = "graphics/pixel/maskottchen.webp";

  /* ---------- Speicher (Münzen, besuchte Level, Ton) ---------- */
  function load(key, fallback) { try { var v = localStorage.getItem("cs-pixel-" + key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; } }
  function save(key, val) { try { localStorage.setItem("cs-pixel-" + key, JSON.stringify(val)); } catch (e) {} }
  var coins = load("coins", {});
  var visited = load("visited", {});
  var soundOn = load("sound", true);

  /* ---------- 8-Bit-Töne ---------- */
  var ctx = null;
  function audio() {
    if (!soundOn) return null;
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  function tone(freq, start, dur, type, vol, slideTo) {
    var a = audio(); if (!a) return;
    var o = a.createOscillator(), g = a.createGain();
    var t = a.currentTime + (start || 0);
    o.type = type || "square";
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(vol || 0.05, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(a.destination);
    o.start(t); o.stop(t + dur + 0.02);
  }
  var sfx = {
    move: function () { tone(440, 0, 0.05, "square", 0.03); },
    select: function () { tone(523, 0, 0.07); tone(784, 0.07, 0.1); },
    coin: function () { tone(988, 0, 0.07, "square", 0.05); tone(1319, 0.07, 0.28, "square", 0.05); },
    bump: function () { tone(160, 0, 0.08, "triangle", 0.08, 90); },
    jump: function () { tone(300, 0, 0.25, "square", 0.04, 900); },
    start: function () { [523, 659, 784, 1047, 784, 1047].forEach(function (f, i) { tone(f, i * 0.09, 0.12, "square", 0.045); }); },
    tick: function () { tone(880, 0, 0.04, "square", 0.03); },
    over: function () { [392, 330, 262, 196].forEach(function (f, i) { tone(f, i * 0.18, 0.22, "triangle", 0.07); }); },
    oneup: function () { [659, 784, 1319, 1047, 1175, 1568].forEach(function (f, i) { tone(f, i * 0.08, 0.1, "square", 0.045); }); }
  };
  var soundBtn = document.getElementById("px-sound");
  function paintSound() { soundBtn.textContent = soundOn ? "♪ AN" : "♪ AUS"; soundBtn.setAttribute("aria-pressed", soundOn ? "true" : "false"); }
  soundBtn.addEventListener("click", function () { soundOn = !soundOn; save("sound", soundOn); paintSound(); if (soundOn) sfx.select(); });
  paintSound();

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
  function link(url, text, cls) { return el("a", { href: url, target: "_blank", rel: "noopener noreferrer", class: cls || "px-more", text: text }); }
  function flash() { var f = document.querySelector(".px-flash"); f.classList.remove("on"); void f.offsetWidth; f.classList.add("on"); }
  function toast(text) {
    var t = el("div", { class: "px-toast", text: text }); document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2700);
  }
  function confetti() {
    if (reduce) return;
    var colors = ["#ffec27", "#ff004d", "#29adff", "#00e436", "#ff77a8", "#ffa300"];
    for (var i = 0; i < 60; i++) {
      var c = el("i", { class: "px-confetti" });
      c.style.left = Math.random() * 100 + "vw"; c.style.top = -20 - Math.random() * 200 + "px";
      c.style.background = colors[i % colors.length]; c.style.animationDelay = Math.random() * 0.6 + "s";
      document.body.appendChild(c); setTimeout(function (x) { x.remove(); }.bind(null, c), 2600);
    }
  }
  function typewrite(node, text) {
    if (reduce) { node.textContent = text; return; }
    node.textContent = ""; var i = 0;
    var t = setInterval(function () { node.textContent = text.slice(0, ++i); if (i % 3 === 0) tone(1200, 0, 0.02, "square", 0.012); if (i >= text.length) clearInterval(t); }, 28);
    node.addEventListener("click", function () { clearInterval(t); node.textContent = text; }, { once: true });
  }
  function mascotImg(cls) { return el("img", { src: MASCOT, alt: "", class: "px-sprite " + (cls || "") }); }

  /* Sternenhimmel */
  (function () { var s = document.querySelector(".px-stars"); for (var i = 0; i < 90; i++) { var st = el("i"); st.style.left = Math.random() * 100 + "%"; st.style.top = Math.random() * 100 + "%"; s.appendChild(st); } })();

  /* ---------- Münzen ---------- */
  var allCoinIds = [];
  S.journalismus.forEach(function (g, gi) { g.items.forEach(function (_, ii) { allCoinIds.push("j" + gi + "-" + ii); }); });
  S.talks.forEach(function (_, i) { allCoinIds.push("t" + i); });
  S.zeugen.forEach(function (_, i) { allCoinIds.push("z" + i); });
  function coinCount() { return allCoinIds.filter(function (id) { return coins[id]; }).length; }
  function paintCoins() {
    document.getElementById("px-coins").textContent = String(coinCount()).padStart(2, "0");
    document.getElementById("px-coins-max").textContent = String(allCoinIds.length).padStart(2, "0");
  }
  function qblock(id) {
    var b = el("button", { type: "button", class: "px-qblock" + (coins[id] ? " is-empty" : ""), "aria-label": coins[id] ? "Münze schon eingesammelt" : "Fragezeichen-Block: Münze einsammeln", text: "?" });
    b.addEventListener("click", function () {
      b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump");
      if (coins[id]) { sfx.bump(); return; }
      coins[id] = true; save("coins", coins); sfx.coin();
      b.appendChild(el("span", { class: "px-coin" }));
      setTimeout(function () { b.classList.add("is-empty"); b.setAttribute("aria-label", "Münze schon eingesammelt"); }, 250);
      paintCoins();
      if (coinCount() === allCoinIds.length) { setTimeout(function () { sfx.oneup(); confetti(); toast("★ ALLE MÜNZEN! 1UP! ★"); }, 500); }
    });
    return b;
  }
  function card(item, id) {
    var box = el("div", { class: "px-box" }, [
      item.tag ? el("span", { class: "px-tag", text: item.tag }) : null,
      el("h3", { text: item.titel }),
      el("p", { text: item.text }),
      item.link ? link(item.link, (item.linkText || "Ansehen").toUpperCase()) : null
    ]);
    return el("article", { class: "px-item" }, [qblock(id), box]);
  }

  /* ---------- Weltkarte: Stationen ---------- */
  var STOPS = [
    { id: "journalismus", nr: "1", name: "JOURNALISMUS", title: "WORLD 1 · JOURNALISMUS", x: 9, y: 89 },
    { id: "werkstatt",    nr: "2", name: "KI-WERKSTATT", title: "WORLD 2 · KI-WERKSTATT", x: 24, y: 79 },
    { id: "buehne",       nr: "3", name: "BÜHNE",        title: "WORLD 3 · BÜHNE",        x: 41, y: 63 },
    { id: "ich",          nr: "4", name: "CHARAKTER",    title: "WORLD 4 · CHARAKTER",    x: 57, y: 51 },
    { id: "highscore",    nr: "★", name: "HIGHSCORES",   title: "HIGHSCORES",             x: 72, y: 37 },
    { id: "continue",     nr: "✉", name: "CONTINUE?",    title: "CONTINUE?",              x: 88, y: 28 }
  ];
  if (window.PIXEL_STOPS) STOPS.forEach(function (s, i) { if (window.PIXEL_STOPS[i]) { s.x = window.PIXEL_STOPS[i][0]; s.y = window.PIXEL_STOPS[i][1]; } });
  var here = load("here", 0);

  /* ---------- Bildschirme ---------- */
  var screens = {};

  screens.start = function () {
    document.body.classList.add("on-title");
    hud.hidden = true;
    var mascotBtn = el("button", { type: "button", class: "px-title__mascot", "aria-label": "Maskottchen springen lassen" }, [mascotImg("px-idle")]);
    mascotBtn.addEventListener("click", function () { var i = mascotBtn.querySelector("img"); i.classList.remove("px-jump"); void i.offsetWidth; i.classList.add("px-jump"); sfx.jump(); });
    var press = el("button", { type: "button", class: "px-btn px-press", text: "PRESS START" });
    press.addEventListener("click", startGame);
    return el("section", { class: "px-title" }, [
      el("div", { class: "px-title__inner" }, [
        el("h1", { class: "px-logo" }, ["CHRISTIAN", el("span", { text: "SCHIFFER" })]),
        el("p", { class: "px-roles", text: S.roles.join(" · ").toUpperCase() }),
        el("div", {}, [press])
      ]),
      mascotBtn,
      el("p", { class: "px-copyright", text: "© " + S.since + " SCHIFFER SOFT · " + S.city.toUpperCase() })
    ]);
  };
  function startGame() { sfx.start(); go("karte"); }

  screens.karte = function () {
    var map = el("div", { class: "px-map", role: "group", "aria-label": "Weltkarte" });
    var walker = el("div", { class: "px-walker", "aria-hidden": "true" }, [mascotImg("px-idle")]);
    map.appendChild(walker);
    var buttons = STOPS.map(function (s, i) {
      var b = el("button", { type: "button", class: "px-stop" + (visited[s.id] ? " is-done" : ""), style: "left:" + s.x + "%;top:" + s.y + "%", "aria-label": s.title },
        [el("span", { class: "px-stop__dot", text: s.nr }), el("span", { class: "px-stop__label", text: s.name })]);
      b.addEventListener("click", function () { if (here === i) enter(); else moveTo(i, true); });
      b.addEventListener("focus", function () { if (here !== i) moveTo(i, false); });
      map.appendChild(b); return b;
    });
    function place() { var s = STOPS[here]; walker.style.left = s.x + "%"; walker.style.top = (s.y + 1.5) + "%"; buttons.forEach(function (b, j) { b.classList.toggle("is-here", j === here); }); }
    function moveTo(i, thenEnter) { here = i; save("here", here); sfx.move(); place(); if (thenEnter) setTimeout(enter, reduce ? 0 : 750); }
    function enter() { sfx.select(); go(STOPS[here].id); }
    place();
    keyHandler = function (e) {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); moveTo((here + 1) % STOPS.length); buttons[here].focus({ preventScroll: true }); }
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); moveTo((here + STOPS.length - 1) % STOPS.length); buttons[here].focus({ preventScroll: true }); }
      else if (e.key === "Enter" && document.activeElement && !document.activeElement.classList.contains("px-stop")) { enter(); }
    };
    var list = el("div", { class: "px-levellist" }, STOPS.map(function (s) {
      return el("a", { class: "px-btn px-btn--ghost", href: "#" + s.id, text: s.nr + "  " + s.name });
    }));
    return el("div", { class: "px-mapwrap" }, [
      map,
      el("p", { class: "px-maphelp", html: "<b>◀ ▶</b> LAUFEN &nbsp; · &nbsp; <b>ENTER</b> LEVEL BETRETEN &nbsp; · &nbsp; ODER EINFACH ANKLICKEN" }),
      list
    ]);
  };

  function levelIntro(line, rest) {
    var type = el("p", { class: "px-type" });
    var box = el("div", { class: "px-box" }, [type].concat(rest || []));
    setTimeout(function () { typewrite(type, line); }, reduce ? 0 : 350);
    return el("div", { class: "px-intro" }, [el("div", { class: "px-intro__npc" }, [mascotImg("px-idle")]), box]);
  }

  screens.journalismus = function () {
    var wrap = el("div", { class: "px-level" });
    wrap.appendChild(levelIntro("Du betrittst WORLD 1. Hier wird recherchiert!", [el("p", { text: S.journalismusIntro })]));
    var tabs = el("div", { class: "px-tabs", role: "tablist", "aria-label": "Bereiche" });
    var panel = el("div", { role: "tabpanel" });
    var groups = S.journalismus.concat([{ titel: "Bücher", books: true }]);
    function show(gi) {
      Array.prototype.forEach.call(tabs.children, function (b, j) { b.setAttribute("aria-selected", j === gi ? "true" : "false"); });
      panel.innerHTML = "";
      var g = groups[gi];
      if (g.books) {
        panel.appendChild(el("p", { text: "Manche Themen brauchen mehr als einen Artikel oder eine Sendung – sie brauchen ein ganzes Buch." }));
        panel.appendChild(el("div", { class: "px-books" }, S.buecher.map(function (b) {
          return el("div", { class: "px-book" }, [
            el("div", { class: "px-book__cover" }, [b.cover ? el("img", { src: b.cover, alt: "Cover: " + b.titel, loading: "lazy" }) : el("span", { text: "?" })]),
            el("h3", { text: b.titel }), el("p", { text: b.untertitel }), el("p", { text: b.verlag })
          ]);
        })));
      } else {
        panel.appendChild(el("p", { text: g.intro, style: "margin:0 0 30px" }));
        panel.appendChild(el("div", { class: "px-grid" }, g.items.map(function (it, ii) { return card(it, "j" + gi + "-" + ii); })));
      }
    }
    groups.forEach(function (g, gi) {
      var b = el("button", { type: "button", role: "tab", text: g.titel.toUpperCase() });
      b.addEventListener("click", function () { sfx.move(); show(gi); });
      tabs.appendChild(b);
    });
    wrap.appendChild(el("h2", { class: "px-section-title", text: "INVENTAR" }));
    wrap.appendChild(tabs); wrap.appendChild(panel); show(0);
    wrap.appendChild(nextBtn("werkstatt", "WEITER ZU WORLD 2 ▶"));
    return wrap;
  };

  screens.werkstatt = function () {
    var W = S.workshops;
    var wrap = el("div", { class: "px-level" });
    wrap.appendChild(levelIntro("QUEST: " + W.titel.toUpperCase() + ". Generative KI richtig einsetzen lernen.", W.text.map(function (t) { return el("p", { text: t }); })));
    wrap.appendChild(el("div", { class: "px-box" }, [el("span", { class: "px-npc-name", text: "CHRISTIAN SAGT:" }), el("p", { text: "„" + W.zitat + "“" })]));
    wrap.appendChild(el("div", { class: "px-photos" }, W.fotos.map(function (f) { return el("div", { class: "px-photo" }, [el("img", { src: f, alt: "Workshop-Szene", loading: "lazy" })]); })));
    wrap.appendChild(el("h2", { class: "px-section-title", text: "SCHWIERIGKEIT WÄHLEN" }));
    var levels = [["EASY", "90-MINUTEN-CRASHKURS", "Crashkurs (90 Minuten)"], ["NORMAL", "TAGESSEMINAR", "Tagesseminar"], ["HARD", "WOCHENSEMINAR", "Wochenseminar"]];
    wrap.appendChild(el("div", { class: "px-difficulty" }, levels.map(function (l) {
      var a = el("a", { href: "mailto:" + S.email + "?subject=" + encodeURIComponent("Workshop-Anfrage: " + l[2]) }, [el("em", { text: l[0] }), el("span", { text: l[1] })]);
      a.addEventListener("mouseenter", sfx.move); a.addEventListener("click", sfx.select);
      return a;
    })));
    wrap.appendChild(el("p", { text: "Klick auf eine Stufe öffnet eine E-Mail mit der passenden Anfrage.", style: "color:var(--px-grey);margin-top:14px" }));
    wrap.appendChild(nextBtn("buehne", "WEITER ZU WORLD 3 ▶"));
    return wrap;
  };

  screens.buehne = function () {
    var wrap = el("div", { class: "px-level" });
    wrap.appendChild(levelIntro("WORLD 3: DIE BÜHNE. Vorhang auf!", [el("p", { text: S.talksIntro })]));
    wrap.appendChild(el("h2", { class: "px-section-title", text: "STAGES" }));
    wrap.appendChild(el("div", { class: "px-grid" }, S.talks.map(function (t, i) {
      return card({ tag: "STAGE " + (i + 1) + " · " + t.tag, titel: t.titel, text: t.text, link: t.link, linkText: "Ansehen" }, "t" + i);
    })));
    wrap.appendChild(el("h2", { class: "px-section-title", text: "SCREENSHOTS" }));
    wrap.appendChild(el("div", { class: "px-photos" }, S.talkFotos.map(function (f) { return el("div", { class: "px-photo" }, [el("img", { src: f, alt: "Christian Schiffer auf der Bühne", loading: "lazy" })]); })));
    wrap.appendChild(nextBtn("ich", "WEITER ZU WORLD 4 ▶"));
    return wrap;
  };

  screens.ich = function () {
    var wrap = el("div", { class: "px-level" });
    wrap.appendChild(el("h1", { class: "px-section-title", text: "CHARAKTER", style: "margin-top:0" }));
    // Porträt verpixelt – Klick zeigt das echte Foto
    var canvas = el("canvas", { width: 48, height: 64, "aria-hidden": "true" });
    var real = el("img", { src: S.portrait, alt: "Porträt von Christian Schiffer" });
    var pic = el("button", { type: "button", class: "px-char__pic", "aria-label": "Zwischen Pixel- und echtem Foto wechseln" }, [canvas, real]);
    var src = new Image(); src.onload = function () {
      var c = canvas.getContext("2d"); var r = Math.max(48 / src.width, 64 / src.height);
      var w = src.width * r, h = src.height * r; c.imageSmoothingEnabled = true; c.drawImage(src, (48 - w) / 2, (64 - h) / 2, w, h);
    }; src.src = S.portrait;
    pic.addEventListener("click", function () { pic.classList.toggle("hd"); sfx.select(); });
    var stats = [["ERKLÄRKRAFT", 100], ["ANALYSE", 95], ["HUMOR", 90], ["UNBEQUEM", 70, "warm"]];
    var statList = el("ul", { class: "px-stats" }, stats.map(function (s) {
      var bar = el("span", { class: "px-bar " + (s[2] || "") }, [el("i")]);
      setTimeout(function () { bar.firstChild.style.width = s[1] + "%"; }, 200);
      return el("li", {}, [el("span", { text: s[0] }), bar]);
    }));
    var age = new Date().getFullYear() - S.since;
    wrap.appendChild(el("div", { class: "px-char" }, [
      el("div", {}, [pic, el("span", { class: "px-char__hint", text: "KLICK = HD-MODUS" })]),
      el("div", {}, [
        el("div", { class: "px-box" }, [
          el("h2", { text: S.name.toUpperCase() }),
          el("p", { html: "<b style='color:var(--px-yellow)'>KLASSE:</b> Erklärer · <b style='color:var(--px-yellow)'>LEVEL:</b> " + age + " · <b style='color:var(--px-yellow)'>HEIMAT:</b> " + S.city }),
          el("p", { html: "<b style='color:var(--px-yellow)'>SKILLS:</b> " + ["Journalist", "Autor", "Speaker", "Moderator", "Trainer"].join(", ") }),
          statList
        ]),
        el("div", { class: "px-box" }, S.bio.map(function (b) { return el("p", { text: b }); }))
      ])
    ]));
    wrap.appendChild(el("h2", { class: "px-section-title", text: "NPC-GESPRÄCHE" }));
    wrap.appendChild(el("div", { class: "px-npcs" }, S.zeugen.map(function (z, i) {
      return el("article", { class: "px-item" }, [qblock("z" + i), el("div", { class: "px-box" }, [
        el("span", { class: "px-npc-name", text: z.name.toUpperCase() + " · " + z.rolle.toUpperCase() }),
        el("p", { text: "„" + z.text + "“" })
      ])]);
    })));
    wrap.appendChild(nextBtn("highscore", "ZU DEN HIGHSCORES ▶"));
    return wrap;
  };

  screens.highscore = function () {
    var ord = function (n) { return n + (n === 1 ? "ST" : n === 2 ? "ND" : n === 3 ? "RD" : "TH"); };
    var rows = S.preise.map(function (p, i) {
      return el("tr", {}, [el("td", { class: "rank", text: ord(i + 1) }), el("td", { class: "year", text: String(p.jahr) }), el("td", { text: p.preis.toUpperCase() }), el("td", { class: "werk", text: "„" + p.werk + "“" })]);
    });
    var wrap = el("div", { class: "px-level px-scores" }, [
      el("h1", { text: "★ HIGH SCORES ★" }),
      el("table", { "aria-label": "Auszeichnungen" }, [el("tbody", {}, rows)])
    ]);
    setTimeout(sfx.oneup, 200);
    wrap.appendChild(nextBtn("continue", "CONTINUE? ▶"));
    return wrap;
  };

  var countTimer = null;
  screens.continue = function () {
    var count = el("div", { class: "px-count", "aria-live": "off", text: "9" });
    var mail = el("a", { class: "px-btn px-btn--green", href: "mailto:" + S.email, text: "JA! E-MAIL SCHREIBEN" });
    mail.addEventListener("click", function () { clearInterval(countTimer); count.textContent = "♥"; sfx.oneup(); confetti(); });
    var wrap = el("div", { class: "px-level px-continue" }, [
      el("h1", { text: "CONTINUE?" }),
      count,
      el("div", { class: "px-continue__actions" }, [mail]),
      el("p", { text: S.email, style: "font-family:var(--px-title);font-size:11px;color:var(--px-grey)" }),
      el("h2", { class: "px-section-title", text: "SPEICHERPUNKTE" }),
      el("div", { class: "px-saves" }, S.socials.map(function (s) { return link(s.url, s.name.toUpperCase(), "px-btn px-btn--ghost"); })),
      el("div", { class: "px-box" }, [el("p", { text: "Für Anfragen zu Vorträgen, Moderationen oder journalistischen Aufträgen am besten per E-Mail. " + S.phoneNote })])
    ]);
    var n = 9;
    clearInterval(countTimer);
    if (!reduce) countTimer = setInterval(function () {
      if (!document.body.contains(count)) { clearInterval(countTimer); return; }
      n--;
      if (n >= 0) { count.textContent = String(n); sfx.tick(); }
      if (n < 0) { count.textContent = "GAME OVER"; count.classList.add("over"); sfx.over(); }
      if (n < -3) { count.textContent = "…WAR NUR SPASS. SCHREIB TROTZDEM!"; }
      if (n < -7) { n = 9; count.classList.remove("over"); count.textContent = "9"; }
    }, 1000);
    return wrap;
  };

  function nextBtn(target, text) {
    return el("div", { style: "text-align:center;margin-top:50px" }, [el("a", { class: "px-btn", href: "#" + target, text: text })]);
  }

  /* ---------- Navigation ---------- */
  var keyHandler = null;
  function go(name) { if (location.hash.slice(1) !== name) location.hash = name; else render(name); }
  function render(name) {
    if (!screens[name]) name = "start";
    keyHandler = null;
    clearInterval(countTimer);
    document.body.classList.remove("on-title");
    if (name !== "start") flash();
    var stop = STOPS.filter(function (s) { return s.id === name; })[0];
    if (stop) { visited[name] = true; save("visited", visited); here = STOPS.indexOf(stop); save("here", here); }
    setTimeout(function () {
      main.innerHTML = "";
      main.appendChild(screens[name]());
      if (name !== "start") { hud.hidden = false; hudTitle.textContent = stop ? stop.title : "WORLD MAP"; }
      document.querySelector(".px-hud__back").style.visibility = name === "karte" ? "hidden" : "visible";
      window.scrollTo(0, 0);
      var h = main.querySelector("h1, h2, .px-press, .px-stop.is-here");
      if (h && name !== "start") { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
    }, name === "start" || reduce ? 0 : 200);
  }
  window.addEventListener("hashchange", function () { render(location.hash.slice(1) || "start"); });
  document.querySelector(".px-hud__back").addEventListener("click", function () { sfx.move(); go("karte"); });

  document.addEventListener("keydown", function (e) {
    if (keyHandler) keyHandler(e);
    if (e.key === "Escape" && location.hash.slice(1) !== "karte" && location.hash) { go("karte"); }
    if ((location.hash.slice(1) || "start") === "start" && (e.key === "Enter" || e.key === " ") && document.activeElement === document.body) { e.preventDefault(); startGame(); }
    konami(e.key);
  });

  /* Geheimcode: ↑ ↑ ↓ ↓ ← → ← → B A */
  var code = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"], pos = 0;
  function konami(k) {
    pos = (k === code[pos] || k.toLowerCase() === code[pos]) ? pos + 1 : (k === code[0] ? 1 : 0);
    if (pos === code.length) { pos = 0; allCoinIds.forEach(function (id) { coins[id] = true; }); save("coins", coins); paintCoins(); sfx.oneup(); confetti(); toast("CHEAT AKTIVIERT: +30 LEBEN, ALLE MÜNZEN!"); }
  }

  paintCoins();
  render(location.hash.slice(1) || "start");
})();
