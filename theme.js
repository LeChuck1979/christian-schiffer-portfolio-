/* Design-Umschalter
   Setzt das gewählte Design sofort (bevor die Seite gezeichnet wird),
   merkt es sich im Browser des Besuchers und baut unten rechts einen Knopf ein. */
(function () {
  var THEMES = [
    { id: "papier",    name: "Papier",    hint: "Das Original",           swatch: ["#F0E6D2", "#1c1917", "#b91c1c"] },
    { id: "knete",     name: "Knetmasse", hint: "Alles von Hand geformt", swatch: ["#FFCD48", "#68C0EE", "#E94A3C"], page: "knete.html" },
    { id: "pluesch",   name: "Plüsch",    hint: "Weich wie Moos",         swatch: ["#EDF1E2", "#B2562E", "#24382A"], page: "pluesch.html" },
    { id: "steampunk", name: "Steampunk", hint: "Messing, Leder, Dampf",  swatch: ["#261B14", "#DA8E44", "#ECD6AA"], page: "steampunk.html" },
    { id: "pixel",     name: "Pixel",     hint: "Die Seite als Videospiel", swatch: ["#1D2B53", "#FFEC27", "#FF004D"], page: "pixel.html" }
  ];
  var KEY = "cs-design";
  var root = document.documentElement;

  function isKnown(id) {
    for (var i = 0; i < THEMES.length; i++) if (THEMES[i].id === id) return true;
    return false;
  }
  function load() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function save(id) {
    try { localStorage.setItem(KEY, id); } catch (e) {}
  }

  // Ein Link wie seite.html#design-steampunk zeigt direkt ein Design (praktisch zum Herzeigen)
  function find(id) {
    for (var i = 0; i < THEMES.length; i++) if (THEMES[i].id === id) return THEMES[i];
    return null;
  }
  var world = window.CS_WORLD || null;          // auf einer eigenen Design-Seite (z. B. pixel.html)
  var fromHash = (location.hash || "").replace("#design-", "");
  var current = world || (isKnown(fromHash) ? fromHash : load());
  if (!isKnown(current)) current = "papier";
  if (world) save(world);
  else if (isKnown(fromHash)) save(fromHash);

  // Eigene Design-Welten haben eine eigene Seite: von der Startseite aus dorthin springen
  var path = location.pathname.split("/").pop();
  var onHome = path === "" || path === "index.html";
  var here = find(current);
  if (!world && here && here.page) {
    if (onHome && !isKnown(fromHash)) { location.replace(here.page); return; }
    current = "papier";                         // Unterseiten zeigen dann das Original
  }
  root.setAttribute("data-theme", current);

  var ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<circle cx="13.5" cy="6.5" r="1.5" fill="currentColor"/><circle cx="17.5" cy="10.5" r="1.5" fill="currentColor"/>' +
    '<circle cx="8.5" cy="7.5" r="1.5" fill="currentColor"/><circle cx="6.5" cy="12.5" r="1.5" fill="currentColor"/>' +
    '<path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>';

  function build() {
    if (document.querySelector(".design-switch")) return;

    // Maskottchen in den großen Kopfbereich (nur wo es einen gibt)
    var firstSection = document.querySelector("body > section, body > main > section");
    if (firstSection && firstSection.classList.contains("bg-crumpled")) {
      var mascot = document.createElement("div");
      mascot.className = "theme-mascot";
      mascot.setAttribute("aria-hidden", "true");
      firstSection.appendChild(mascot);
    }
    // ... und ein zweites, das unten in der dunklen Kontakt-Fußzeile winkt
    var footers = document.querySelectorAll("section.bg-ink");
    var footer = footers[footers.length - 1];
    if (footer) {
      var wave = document.createElement("div");
      wave.className = "theme-mascot theme-mascot--footer";
      wave.setAttribute("aria-hidden", "true");
      footer.appendChild(wave);
    }

    var wrap = document.createElement("div");
    wrap.className = "design-switch";

    var panel = document.createElement("div");
    panel.className = "design-switch__panel";
    panel.id = "design-switch-panel";
    panel.hidden = true;
    panel.innerHTML = '<p class="design-switch__title">Design wählen</p>';

    var options = [];
    THEMES.forEach(function (t) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "design-switch__option";
      b.setAttribute("data-design", t.id);
      b.innerHTML =
        '<span class="design-switch__swatch" aria-hidden="true">' +
        t.swatch.map(function (c) { return '<i style="background:' + c + '"></i>'; }).join("") +
        "</span><span><span class=\"design-switch__name\">" + t.name +
        '</span><span class="design-switch__hint">' + t.hint + "</span></span>";
      b.addEventListener("click", function () {
        choose(t.id);
        close();
        button.focus();
      });
      options.push(b);
      panel.appendChild(b);
    });

    var button = document.createElement("button");
    button.type = "button";
    button.className = "design-switch__button";
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-controls", panel.id);
    button.setAttribute("aria-label", "Design der Seite ändern");
    button.innerHTML = ICON + '<span class="design-switch__label">Design</span>';
    button.addEventListener("click", function (e) {
      e.stopPropagation();
      if (panel.hidden) open(); else close();
    });

    wrap.appendChild(panel);
    wrap.appendChild(button);
    if (!document.body) return;
    document.body.appendChild(wrap);

    function mark() {
      options.forEach(function (b) {
        b.setAttribute("aria-pressed", b.getAttribute("data-design") === current ? "true" : "false");
      });
    }
    function choose(id) {
      var t = find(id);
      save(id);
      if (t && t.page) { location.href = t.page; return; }          // in die eigene Design-Welt
      if (world) { location.href = "index.html#design-" + id; return; } // aus der Welt zurück
      current = id;
      root.setAttribute("data-theme", id);
      mark();
    }
    function open() {
      panel.hidden = false;
      button.setAttribute("aria-expanded", "true");
      var active = panel.querySelector('[aria-pressed="true"]') || options[0];
      active.focus();
    }
    function close() {
      panel.hidden = true;
      button.setAttribute("aria-expanded", "false");
    }

    document.addEventListener("click", function (e) {
      if (!panel.hidden && !wrap.contains(e.target)) close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !panel.hidden) { close(); button.focus(); }
    });
    mark();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build);
  else build();
})();
