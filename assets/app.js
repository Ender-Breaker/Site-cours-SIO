/* Étude Facile — logique commune (progression, helpers, page d'accueil) */
(function () {
  "use strict";

  /* ---------- compte Firebase (facultatif) : chargé seulement si data/firebase-config.js est rempli ---------- */
  var RACINE = (function () { try { return new URL("../", document.currentScript.src).href; } catch (e) { return ""; } })();

  /* ---------- pied de page (liens légaux) + bandeau d'information sur les stockages ---------- */
  function piedDePage() {
    if (!document.body || document.querySelector(".pied")) return;
    var f = document.createElement("footer"); f.className = "pied";
    f.innerHTML = '<div class="wrap"><span>Étude Facile · site de révision BTS SIO, gratuit et sans publicité</span>' +
      '<nav><a href="' + RACINE + 'mentions-legales.html">Mentions légales</a><a href="' + RACINE + 'confidentialite.html">Confidentialité et cookies</a>' +
      '<a href="' + RACINE + 'conditions.html">Conditions d\'utilisation</a></nav></div>';
    document.body.appendChild(f);
    var vu = null; try { vu = localStorage.getItem("ef-info-stockage"); } catch (e) { vu = "1"; }
    if (!vu) {
      var b = document.createElement("div"); b.className = "bandeau-info"; b.setAttribute("role", "region"); b.setAttribute("aria-label", "Information sur les cookies");
      b.innerHTML = '<p><b>Pas de cookie publicitaire ni de mesure d\'audience.</b> Le site enregistre seulement dans ton navigateur ce qui est nécessaire à son fonctionnement (ta progression et, si tu te connectes, ta session). ' +
        '<a href="' + RACINE + 'confidentialite.html">En savoir plus</a></p><button type="button" class="btn">J\'ai compris</button>';
      b.querySelector("button").onclick = function () { try { localStorage.setItem("ef-info-stockage", new Date().toISOString().slice(0, 10)); } catch (e) { /* rien */ } b.remove(); };
      document.body.appendChild(b);
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { setTimeout(piedDePage, 0); });
  else setTimeout(piedDePage, 0);

  (function () {
    var root = RACINE; if (!root) return;
    var c = document.createElement("script");
    c.src = root + "data/firebase-config.js";
    c.onload = function () {
      var cfg = window.EF_FIREBASE_CONFIG;
      if (!cfg || !cfg.apiKey) return;
      var m = document.createElement("script");
      m.type = "module"; m.src = root + "assets/cloud.js";
      document.head.appendChild(m);
    };
    document.head.appendChild(c);
  })();

  var KEY = "ef-progress"; // { moduleId: [chapitreId, ...] }
  var BEST = "ef-best";
  var EVALS = "ef-evals";    // { "moduleId/chapitreId": pourcentage }

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

  var ICONS = {"arrow-up": "<path d=\"M9 18v-6H5l7-7 7 7h-4v6H9z\" />", "arrow-down": "<path d=\"M15 6v6h4l-7 7-7-7h4V6h6z\" />", "message": "<path d=\"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z\" />", "check": "<path d=\"M20 6 9 17l-5-5\" />", "plus": "<path d=\"M5 12h14\" /><path d=\"M12 5v14\" />", "timer": "<line x1=\"10\" x2=\"14\" y1=\"2\" y2=\"2\" /><line x1=\"12\" x2=\"15\" y1=\"14\" y2=\"11\" /><circle cx=\"12\" cy=\"14\" r=\"8\" />", "user": "<path d=\"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2\" /><circle cx=\"12\" cy=\"7\" r=\"4\" />", "play": "<polygon points=\"6 3 20 12 6 21 6 3\" />", "code": "<polyline points=\"16 18 22 12 16 6\" /><polyline points=\"8 6 2 12 8 18\" />", "book-open": "<path d=\"M12 5v16\" /><path d=\"M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z\" />", "pencil-line": "<path d=\"M13 21h8\" /><path d=\"m15 5 4 4\" /><path d=\"M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z\" />", "zap": "<path d=\"M15.914 4a1.5 1.5 0 00-2.474-1.561l-9 9A1.5 1.5 0 005.5 14h4.002a.5.5 0 01.471.666L8.086 20a1.5 1.5 0 002.475 1.56l9-9A1.5 1.5 0 0018.5 10h-3.997a.5.5 0 01-.472-.667z\" />", "flame": "<path d=\"M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4\" />", "trophy": "<path d=\"M10 14.66V17a1 1 0 0 1-1 1 2 2 0 0 0-2 2v2\" /><path d=\"M14 14.66V17a1 1 0 0 0 1 1 2 2 0 0 1 2 2v2\" /><path d=\"M17.916 10H19.5A2.5 2.5 0 0 0 22 7.5V5a1 1 0 0 0-1-1h-3\" /><path d=\"M4 22h16\" /><path d=\"M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z\" /><path d=\"M6.084 10H4.5A2.5 2.5 0 0 1 2 7.5V5a1 1 0 0 1 1-1h3\" />", "sprout": "<path d=\"M14 9.536V7a4 4 0 0 1 4-4h1.5a.5.5 0 0 1 .5.5V5a4 4 0 0 1-4 4 4 4 0 0 0-4 4c0 2 1 3 1 5a5 5 0 0 1-1 3\" /><path d=\"M4 9a5 5 0 0 1 8 4 5 5 0 0 1-8-4\" /><path d=\"M5 21h14\" />", "check": "<path d=\"M20 6 9 17l-5-5\" />", "lightbulb": "<path d=\"M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5\" /><path d=\"M9 18h6\" /><path d=\"M10 22h4\" />", "rotate-ccw": "<path d=\"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8\" /><path d=\"M3 3v5h5\" />"};
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

    /* Évaluations chronométrées : on garde le meilleur résultat (en points) et un petit historique.
       cle = "<module>_<type>"  (type : questionnaire | textuel | pratique) */
    racine: RACINE,
    getEvals: function () { return read(EVALS); },
    saveEval: function (cle, r) {
      var e = read(EVALS), cur = e[cle];
      r.date = r.date || new Date().toISOString().slice(0, 10);
      var hist = (cur && cur.hist) || [];
      hist.unshift({ pct: r.pct, points: r.points, duree: r.duree, date: r.date });
      var best = (!cur || r.points > cur.points) ? { pct: r.pct, points: r.points, duree: r.duree, date: r.date } : { pct: cur.pct, points: cur.points, duree: cur.duree, date: cur.date };
      best.hist = hist.slice(0, 10);
      e[cle] = best; write(EVALS, e);
      return { record: !cur || r.points > cur.points, best: best };
    },
    /* Épreuve pratique dans un labo : barre avec chronomètre. Renvoie { el, restant(), stop() }. */
    examChrono: function (titre, duree, onFin) {
      var bar = el("div", "ev-bar exam-bar");
      bar.innerHTML = '<div><b>Évaluation pratique</b> · ' + esc(titre) + ' · <span class="ex-pos"></span></div>' +
        '<div class="ev-chrono">' + icon("timer") + ' <b></b><i></i></div>';
      var fin = Date.now() + duree * 1000, t = null;
      function restant() { return Math.max(0, (fin - Date.now()) / 1000); }
      function tick() {
        var r = restant(), s = Math.round(r);
        bar.querySelector(".ev-chrono b").textContent = Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2);
        bar.querySelector(".ev-chrono i").style.width = (100 * r / duree) + "%";
        bar.querySelector(".ev-chrono").classList.toggle("urgent", r <= 60);
        if (r <= 0) { clearInterval(t); t = null; window.onbeforeunload = null; onFin(true); }
      }
      t = setInterval(tick, 250); setTimeout(tick, 0);
      window.onbeforeunload = function () { return "Ton évaluation est en cours."; };
      return { el: bar, restant: restant, stop: function () { clearInterval(t); t = null; window.onbeforeunload = null; },
        pos: function (txt) { bar.querySelector(".ex-pos").textContent = txt; } };
    },
    /* Écran de résultat d'une épreuve pratique (et enregistrement). missions : [{ titre, ok, solution (texte) }] */
    examResultat: function (box, o) {
      var reussies = o.missions.filter(function (m) { return m.ok; }).length, pct = reussies / o.missions.length;
      var duree = Math.round(o.duree - o.restant), pts = EF.points(pct, o.coef, o.restant, o.duree);
      var sv = EF.saveEval(o.mid + "_pratique", { pct: Math.round(pct * 1000) / 1000, points: pts, duree: duree });
      var connecte = window.EFCloud && window.EFCloud.user();
      box.innerHTML = '<div class="ev-res c-' + (o.couleur || "") + '"><div class="lb-kicker">' + esc(o.titre) + ' · Évaluation pratique</div>' +
        '<div class="ev-score"><b>' + reussies + '<small>/' + o.missions.length + '</small></b><div><span class="ev-pts">' + pts + ' pts</span>' +
        '<span>' + icon("timer") + ' ' + Math.floor(duree / 60) + ':' + ("0" + (duree % 60)).slice(-2) + (o.restant <= 0 ? " (temps écoulé)" : "") + '</span>' +
        (sv.record ? '<span class="ev-record">Nouveau record !</span>' : '<span>Record : ' + sv.best.points + ' pts</span>') + '</div></div>' +
        (window.EF_FIREBASE_CONFIG && !connecte ? '<p class="ev-login">Connecte-toi pour que ce résultat compte dans le classement. <button type="button" class="btn" data-ex="login">Se connecter</button></p>' : '') +
        '<div class="btns"><button type="button" class="btn primary" data-ex="rejouer">' + icon("rotate-ccw") + ' Recommencer</button>' +
        '<a class="btn" href="' + o.racine + 'evaluation.html">Autre évaluation</a><a class="btn" href="' + o.racine + 'classement.html">' + icon("trophy") + ' Classement</a>' +
        '<a class="btn" href="' + (o.retour || "#") + '">Retour au labo</a></div></div>' +
        '<h2 class="ev-h2">Correction</h2><div class="ev-detail">' + o.missions.map(function (m) {
          return '<details class="ev-corr ' + (m.ok ? "ok" : "ko") + '"' + (m.ok ? "" : " open") + '><summary><span class="ck">' + (m.ok ? "✓" : "✗") + '</span>' + esc(m.titre) + '</summary>' +
            '<p><b>Une solution possible :</b></p><pre>' + esc(m.solution) + '</pre></details>';
        }).join("") + '</div>';
      box.addEventListener("click", function (e) {
        var b = e.target.closest("[data-ex]"); if (!b) return;
        if (b.dataset.ex === "rejouer") o.rejouer();
        if (b.dataset.ex === "login" && window.EFCloud) window.EFCloud.ouvrir();
      });
      window.scrollTo(0, 0);
    },
    /* Examen blanc : la partie pratique se termine dans le labo. Combine les parties et enregistre. */
    examBlancResultat: function (box, o) {
      var c = o.ctx, reussies = o.missions.filter(function (m) { return m.ok; }).length;
      var pratique = '<div class="ev-detail">' + o.missions.map(function (m) {
        return '<details class="ev-corr ' + (m.ok ? "ok" : "ko") + '"' + (m.ok ? "" : " open") + '><summary><span class="ck">' + (m.ok ? "✓" : "✗") + '</span>' + esc(m.titre) + '</summary>' +
          '<p><b>Une solution possible :</b></p><pre>' + esc(m.solution) + '</pre></details>';
      }).join("") + '</div>';
      c.parties.forEach(function (p) { if (p.pct === null) { p.pct = reussies / o.missions.length; p.detail = pratique; } });
      var tot = c.parties.reduce(function (a, p) { return a + p.poids; }, 0);
      var pct = c.parties.reduce(function (a, p) { return a + p.poids * (p.pct || 0); }, 0) / tot;
      var duree = Math.round(c.duree - o.restant), pts = EF.points(pct, c.coef, o.restant, c.duree);
      var sv = EF.saveEval(c.mid + "_examen", { pct: Math.round(pct * 1000) / 1000, points: pts, duree: duree });
      var connecte = window.EFCloud && window.EFCloud.user();
      box.innerHTML = '<div class="ev-res c-' + (c.couleur || "") + '"><div class="lb-kicker">' + esc(c.titre) + ' · Examen blanc</div>' +
        '<div class="ev-score"><b>' + Math.round(pct * 100) + '<small>%</small></b><div><span class="ev-pts">' + pts + ' pts</span>' +
        '<span>' + icon("timer") + ' ' + Math.floor(duree / 60) + ':' + ("0" + (duree % 60)).slice(-2) + (o.restant <= 0 ? " (temps écoulé)" : "") + '</span>' +
        (sv.record ? '<span class="ev-record">Nouveau record !</span>' : '<span>Record : ' + sv.best.points + ' pts</span>') + '</div></div>' +
        '<div class="ev-parts">' + c.parties.map(function (p) { return '<span><b>' + Math.round((p.pct || 0) * 100) + ' %</b> ' + esc(p.titre) + '</span>'; }).join("") + '</div>' +
        (window.EF_FIREBASE_CONFIG && !connecte ? '<p class="ev-login">Connecte-toi pour que ce résultat compte dans le classement. <button type="button" class="btn" data-ex="login">Se connecter</button></p>' : '') +
        '<div class="btns"><a class="btn primary" href="' + o.racine + 'evaluation.html#m=' + c.mid + '&t=examen">' + icon("rotate-ccw") + ' Recommencer</a>' +
        '<a class="btn" href="' + o.racine + 'evaluation.html">Autre évaluation</a><a class="btn" href="' + o.racine + 'classement.html">' + icon("trophy") + ' Classement</a></div></div>' +
        '<h2 class="ev-h2">Correction</h2>' + c.parties.map(function (p, i) {
          return '<h3 class="ev-partie">Partie ' + (i + 1) + ' · ' + esc(p.titre) + ' <span>' + Math.round((p.pct || 0) * 100) + ' %</span></h3><div class="ev-detail">' + (p.detail || "") + '</div>';
        }).join("");
      box.addEventListener("click", function (e) { var b = e.target.closest("[data-ex=login]"); if (b && window.EFCloud) window.EFCloud.ouvrir(); });
      window.scrollTo(0, 0);
    },
    /* Contexte d'examen blanc transmis par evaluation.html (ou null) */
    examBlancCtx: function (mid) {
      if (!/^#examen-blanc/.test(location.hash)) return null;
      var c = null; try { c = JSON.parse(sessionStorage.getItem("ef-examen-blanc")); } catch (e) { /* rien */ }
      return c && c.mid === mid ? c : null;
    },
    /* points = % de réussite × coefficient + bonus de rapidité (si au moins 50 % de réussite) */
    points: function (pct, coef, restant, total) {
      var bonus = pct >= 0.5 && total ? Math.round(coef * 0.2 * Math.max(0, restant) / total) : 0;
      return Math.round(pct * coef) + bonus;
    },

    /* Barre du haut commune. prefix = chemin vers la racine ("", "../../") */
    header: function (prefix) {
      var h = el("header", "topbar");
      h.innerHTML = '<div class="wrap"><a class="logo" href="' + prefix + 'index.html">' +
        '<span class="logo-mark">&gt;_</span> Étude Facile</a>' +
        '<nav class="top-nav"><a href="' + prefix + 'evaluation.html">' + icon("timer") + '<span>Évaluation</span></a>' +
        '<a href="' + prefix + 'classement.html">' + icon("trophy") + '<span>Classement</span></a>' +
        '<a href="' + prefix + 'forum.html">' + icon("message") + '<span>Forum</span></a></nav>' +
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
  (function () {
    var w = document.querySelector(".topbar .wrap"), logo = w && w.querySelector(".logo");
    if (!logo || w.querySelector(".top-nav")) return;
    var n = document.createElement("nav"); n.className = "top-nav";
    n.innerHTML = '<a href="evaluation.html">' + icon("timer") + '<span>Évaluation</span></a><a href="classement.html">' + icon("trophy") + '<span>Classement</span></a><a href="forum.html">' + icon("message") + '<span>Forum</span></a>';
    logo.insertAdjacentElement("afterend", n);
  })();

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
