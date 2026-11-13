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
      '<nav class="crumbs"><a href="../../index.html">Accueil</a><span>›</span>' + (mod.bonus ? '<a href="../../bonus.html">Cours bonus</a><span>›</span>' : '') + '<span>' + esc(mod.titre) + '</span></nav>' +
      '<div class="page-head c-' + mod.couleur + '"><div class="ico">' + esc(mod.icone) + '</div><div>' +
      '<h1>' + esc(mod.titre) + '</h1><div class="sub">' + esc(mod.sousTitre) + '</div></div></div>' +
      '<p class="lead">' + esc(mod.description) + '</p>' +
      '<div class="bar c-' + mod.couleur + '" style="margin-top:16px"><i style="width:' + s.pct + '%"></i></div>' +
      '<div class="sub" style="margin-top:6px">' + s.done + ' / ' + s.total + ' chapitre' + (s.total > 1 ? 's' : '') + ' validé' + (s.done > 1 ? 's' : '') + '</div>';

    (mod.labos || []).forEach(function (l) {
      html += '<a class="labo-promo" href="' + esc(l.href) + '"><div class="lp-ico">' + esc(l.ico) + '</div><div><h3>' + esc(l.titre) + '</h3><p>' + esc(l.texte) + '</p></div>' +
        '<span class="btn primary">Ouvrir le labo →</span></a>';
    });

    if (mod.chapitres.length) {
      var ev = EF.getEvals(), E = "../../evaluation.html#m=" + mod.id + "&t=";
      var epr = [["examen", "Examen blanc", "L'épreuve complète, sous chrono"], ["questionnaire", "Questionnaire", "10 questions · 6 min"]];
      if (mod.evalTextuel) epr.push(["textuel", "Textuel", "3 questions ouvertes · 12 min"]);
      (mod.labos || []).forEach(function (l, i) {
        epr.push(["pratique" + (i ? "&l=" + i : ""), mod.labos.length > 1 ? "Pratique · " + (l.court || l.titre) : "Pratique", l.examTexte || "3 missions de labo · 15 min", i && l.cle ? l.cle + "_pratique" : mod.id + "_pratique"]);
      });
      html += '<section class="mod-evals"><div class="mod-evals-t"><h2>' + I("timer") + ' Évaluations</h2>' + (mod.bonus ? '<span class="lb-small">Hors classement</span>' : '<a href="../../classement.html">' + I("trophy") + ' Classement</a>') + '</div><div class="mod-evals-l">' +
        epr.map(function (e) {
          var b = ev[e[3] || mod.id + "_" + e[0]];
          return '<a class="mod-eval' + (e[0] === "examen" ? " examen" : "") + '" href="' + E + e[0] + '"><b>' + e[1] + '</b><span>' + e[2] + '</span><small>' +
            (b ? "record " + b.points + " pts · " + Math.round(b.pct * 100) + " %" : "pas encore tenté") + '</small></a>';
        }).join("") + '</div></section>';
    }

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
        '<a class="btn primary" href="' + f + (c.externe ? '#quiz' : '#jeu') + '">' + I('pencil-line') + (c.externe ? ' Quiz' : ' S\'entraîner') + '</a>' +
        '<a class="btn chap-eval" href="../../evaluation.html#m=' + mod.id + '&t=chapitre&c=' + c.id + '" title="8 questions, 4 min">' + I('timer') + ' Évaluer ce chapitre' +
        (EF.getEvals()[mod.id + "_chap_" + c.id] ? ' <small>' + EF.getEvals()[mod.id + "_chap_" + c.id].points + ' pts</small>' : '') + '</a></div></div>';
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
