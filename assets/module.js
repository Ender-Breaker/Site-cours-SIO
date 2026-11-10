/* Étude Facile — page d'une matière (liste des chapitres, filtre de difficulté) */
(function () {
  "use strict";
  var EF = window.EtudeFacile, esc = EF.esc, el = EF.el;
  var mid = document.body.dataset.module;
  var mod = (window.EF_MODULES || []).filter(function (m) { return m.id === mid; })[0];
  if (!mod) { document.body.textContent = "Matière introuvable."; return; }

  document.title = mod.titre + " — Étude Facile";
  var I = window.EtudeFacile.icon;
  var LVL = { facile: "Facile", moyen: "Moyen", difficile: "Difficile" };
  var filter = "tous";

  document.body.appendChild(EF.header("../../"));
  var main = el("main", "wrap page");
  document.body.appendChild(main);

  function render() {
    var s = EF.stats(mod);
    var html =
      '<nav class="crumbs"><a href="../../index.html">Accueil</a><span>›</span><span>' + esc(mod.titre) + '</span></nav>' +
      '<div class="page-head c-' + mod.couleur + '"><div class="ico">' + esc(mod.icone) + '</div><div>' +
      '<h1>' + esc(mod.titre) + '</h1><div class="sub">' + esc(mod.sousTitre) + '</div></div></div>' +
      '<p class="lead">' + esc(mod.description) + '</p>' +
      '<div class="bar c-' + mod.couleur + '" style="margin-top:16px"><i style="width:' + s.pct + '%"></i></div>' +
      '<div class="sub" style="margin-top:6px">' + s.done + ' / ' + s.total + ' chapitre' + (s.total > 1 ? 's' : '') + ' validé' + (s.done > 1 ? 's' : '') + '</div>';

    if (!mod.chapitres.length) {
      html += '<div class="box" style="margin-top:22px"><b>Bientôt disponible</b><p>Les chapitres de cette matière arrivent prochainement.</p></div>';
      main.innerHTML = html;
      return;
    }

    var levels = ["tous"].concat(["facile", "moyen", "difficile"].filter(function (l) {
      return mod.chapitres.some(function (c) { return c.niveau === l; });
    }));
    html += '<div class="chips" id="lv" style="margin-top:20px">' + levels.map(function (l) {
      return '<button class="chip" data-l="' + l + '" aria-pressed="' + (l === filter) + '">' + (l === "tous" ? "Tous les niveaux" : LVL[l]) + '</button>';
    }).join("") + '</div><div class="chap-list">';

    mod.chapitres.forEach(function (c, i) {
      if (filter !== "tous" && c.niveau !== filter) return;
      var done = EF.isDone(mod.id, c.id), best = EF.getBest(mod.id, c.id);
      var f = c.id + ".html";
      html += '<div class="chap c-' + mod.couleur + (done ? " done" : "") + '"><div class="chap-top">' +
        '<div class="chap-num">' + (done ? "✓" : (i + 1)) + '</div><div><h3>' + esc(c.titre) + '</h3>' +
        '<div class="chap-meta"><span class="lvl ' + c.niveau + '">' + (LVL[c.niveau] || "") + '</span>' +
        (best != null ? '<span>Meilleur score : <b>' + best + ' %</b></span>' : '<span>Pas encore tenté</span>') +
        '</div></div></div>' +
        '<div class="btns"><a class="btn" href="' + f + '">' + I('book-open') + ' Cours</a>' +
        '<a class="btn primary" href="' + f + '#jeu">' + I('pencil-line') + ' S\'entraîner</a></div></div>';
    });
    html += '</div>';
    main.innerHTML = html;

    var lv = document.getElementById("lv");
    if (lv) lv.addEventListener("click", function (e) {
      var b = e.target.closest(".chip");
      if (!b) return;
      filter = b.dataset.l;
      render();
    });
  }

  window.addEventListener("pageshow", render);
  render();
})();
