/* Étude Facile — logique commune (progression, helpers, page d'accueil) */
(function () {
  "use strict";
  var KEY = "ef-progress"; // { moduleId: [chapitreId, ...] }
  var BEST = "ef-best";    // { "moduleId/chapitreId": pourcentage }

  function read(key) {
    try { return JSON.parse(localStorage.getItem(key)) || {}; } catch (e) { return {}; }
  }
  function write(key, v) {
    try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) {}
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  var ICONS = {"play": "<polygon points=\"6 3 20 12 6 21 6 3\" />", "code": "<polyline points=\"16 18 22 12 16 6\" /><polyline points=\"8 6 2 12 8 18\" />", "book-open": "<path d=\"M12 5v16\" /><path d=\"M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z\" />", "pencil-line": "<path d=\"M13 21h8\" /><path d=\"m15 5 4 4\" /><path d=\"M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z\" />", "zap": "<path d=\"M15.914 4a1.5 1.5 0 00-2.474-1.561l-9 9A1.5 1.5 0 005.5 14h4.002a.5.5 0 01.471.666L8.086 20a1.5 1.5 0 002.475 1.56l9-9A1.5 1.5 0 0018.5 10h-3.997a.5.5 0 01-.472-.667z\" />", "flame": "<path d=\"M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4\" />", "trophy": "<path d=\"M10 14.66V17a1 1 0 0 1-1 1 2 2 0 0 0-2 2v2\" /><path d=\"M14 14.66V17a1 1 0 0 0 1 1 2 2 0 0 1 2 2v2\" /><path d=\"M17.916 10H19.5A2.5 2.5 0 0 0 22 7.5V5a1 1 0 0 0-1-1h-3\" /><path d=\"M4 22h16\" /><path d=\"M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z\" /><path d=\"M6.084 10H4.5A2.5 2.5 0 0 1 2 7.5V5a1 1 0 0 1 1-1h3\" />", "sprout": "<path d=\"M14 9.536V7a4 4 0 0 1 4-4h1.5a.5.5 0 0 1 .5.5V5a4 4 0 0 1-4 4 4 4 0 0 0-4 4c0 2 1 3 1 5a5 5 0 0 1-1 3\" /><path d=\"M4 9a5 5 0 0 1 8 4 5 5 0 0 1-8-4\" /><path d=\"M5 21h14\" />", "check": "<path d=\"M20 6 9 17l-5-5\" />", "lightbulb": "<path d=\"M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5\" /><path d=\"M9 18h6\" /><path d=\"M10 22h4\" />", "rotate-ccw": "<path d=\"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8\" /><path d=\"M3 3v5h5\" />"};
  function icon(n) { return '<svg class="i" viewBox="0 0 24 24" aria-hidden="true">' + ICONS[n] + '</svg>'; }

  var EF = window.EtudeFacile = {
    icon: icon,
    esc: esc,
    el: el,
    getProgress: function () { return read(KEY); },
    markDone: function (moduleId, chapId) {
      var p = read(KEY);
      p[moduleId] = p[moduleId] || [];
      if (p[moduleId].indexOf(chapId) === -1) p[moduleId].push(chapId);
      write(KEY, p);
    },
    isDone: function (moduleId, chapId) {
      return (read(KEY)[moduleId] || []).indexOf(chapId) !== -1;
    },
    getBest: function (moduleId, chapId) {
      var v = read(BEST)[moduleId + "/" + chapId];
      return typeof v === "number" ? v : null;
    },
    setBest: function (moduleId, chapId, pct) {
      var b = read(BEST), k = moduleId + "/" + chapId;
      if (typeof b[k] !== "number" || pct > b[k]) { b[k] = pct; write(BEST, b); }
    },
    reset: function () { write(KEY, {}); write(BEST, {}); },

    /* Barre du haut commune. prefix = chemin vers la racine ("", "../../") */
    header: function (prefix) {
      var h = el("header", "topbar");
      h.innerHTML = '<div class="wrap"><a class="logo" href="' + prefix + 'index.html">' +
        '<span class="logo-mark">&gt;_</span> Étude Facile</a>' +
        '<div class="top-stat"><b>' + total().done + '</b> chapitres validés</div></div>';
      return h;
    },
    stats: stats
  };

  var modules = window.EF_MODULES || [];

  function stats(m, prog) {
    prog = prog || read(KEY);
    var done = (prog[m.id] || []).filter(function (id) {
      return m.chapitres.some(function (c) { return c.id === id; });
    }).length;
    var n = m.chapitres.length;
    return { done: done, total: n, pct: n ? Math.round(done / n * 100) : 0 };
  }
  function total() {
    var prog = read(KEY), d = 0, t = 0;
    modules.forEach(function (m) { var s = stats(m, prog); d += s.done; t += s.total; });
    return { done: d, total: t };
  }

  var grid = document.getElementById("grid");
  if (!grid) return; // pas sur la page d'accueil

  var state = { option: "TOUS", q: "" };
  var LABEL = { SLAM: "SLAM", SISR: "SISR", COMMUN: "Commun" };

  function renderGlobal(prog) {
    var badges = [];
    modules.forEach(function (m) {
      var s = stats(m, prog);
      if (s.total) {
        badges.push({ ic: "sprout", txt: m.titre + " · Débutant", on: s.done >= 1 });
        badges.push({ ic: "zap", txt: m.titre + " · Confirmé", on: s.pct >= 50 });
        badges.push({ ic: "trophy", txt: m.titre + " · Expert", on: s.pct === 100 });
      }
    });
    var t = total();
    var pct = t.total ? Math.round(t.done / t.total * 100) : 0;
    document.getElementById("g-pct").textContent = pct + " %";
    document.getElementById("g-bar").style.width = pct + "%";
    document.getElementById("g-count").textContent = t.done + " / " + t.total + " chapitres terminés";
    document.getElementById("top-done").textContent = t.done;

    var open = modules.filter(function (m) { return m.chapitres.length; }).length;
    document.getElementById("g-modules").textContent = open + " / " + modules.length;

    var box = document.getElementById("g-badges");
    box.innerHTML = "";
    if (!badges.length) {
      box.appendChild(el("span", "empty-note", "Valide un chapitre pour débloquer ton premier badge."));
      return;
    }
    badges.slice(0, 9).forEach(function (b) {
      box.appendChild(el("span", "badge " + (b.on ? "on" : "off"), icon(b.ic) + " " + esc(b.txt)));
    });
  }

  function renderGrid(prog) {
    grid.innerHTML = "";
    var q = state.q.trim().toLowerCase();
    var list = modules.filter(function (m) {
      // SLAM / SISR montrent aussi les matières communes
      var okOpt = state.option === "TOUS" || m.option === state.option ||
        (m.option === "COMMUN" && (state.option === "SLAM" || state.option === "SISR"));
      var okQ = !q || (m.titre + " " + m.sousTitre + " " + m.description).toLowerCase().indexOf(q) !== -1;
      return okOpt && okQ;
    });
    if (!list.length) { grid.appendChild(el("p", "none", "Aucune matière ne correspond")); return; }

    list.forEach(function (m) {
      var s = stats(m, prog);
      var ready = m.chapitres.length > 0;
      var card = el(ready ? "a" : "div", "card c-" + m.couleur + (ready ? "" : " soon"));
      if (ready) card.href = "modules/" + m.id + "/index.html";
      card.innerHTML =
        '<div class="card-head"><div class="ico">' + esc(m.icone) + '</div><div><h3>' + esc(m.titre) +
        '</h3><div class="sub">' + esc(m.sousTitre) + '</div></div></div>' +
        '<p class="desc">' + esc(m.description) + '</p>' +
        '<div class="bar" role="progressbar" aria-valuenow="' + s.pct + '" aria-valuemin="0" aria-valuemax="100"><i style="width:' + s.pct + '%"></i></div>' +
        '<div class="meta"><span>' + (ready ? s.done + " / " + s.total + " chapitre" + (s.total > 1 ? "s" : "") : "Bientôt disponible") +
        '</span><span class="tag">' + LABEL[m.option] + '</span></div>';
      grid.appendChild(card);
    });
  }

  function render() {
    var prog = read(KEY);
    renderGlobal(prog);
    renderGrid(prog);
  }

  document.getElementById("chips").addEventListener("click", function (e) {
    var b = e.target.closest(".chip");
    if (!b) return;
    state.option = b.dataset.opt;
    this.querySelectorAll(".chip").forEach(function (c) {
      c.setAttribute("aria-pressed", String(c === b));
    });
    renderGrid(read(KEY));
  });
  document.getElementById("search").addEventListener("input", function () {
    state.q = this.value;
    renderGrid(read(KEY));
  });
  document.getElementById("reset").addEventListener("click", function () {
    if (confirm("Effacer toute ta progression ?")) { EF.reset(); render(); }
  });
  window.addEventListener("storage", render);
  window.addEventListener("pageshow", render);

  render();
})();
