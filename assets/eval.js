/* Étude Facile — évaluations chronométrées : questionnaire (banque des chapitres), textuel (questions ouvertes),
   pratique (missions des labos, en mode examen dans la page du labo). Résultats : EtudeFacile.saveEval(). */
(function () {
  "use strict";
  var EF = window.EtudeFacile, esc = EF.esc, el = EF.el, I = EF.icon;
  var MODS = (window.EF_MODULES || []).filter(function (m) { return m.chapitres.length; });
  var TEXTES = window.EF_EVAL_TEXTES || {};
  var TYPES = {
    questionnaire: { nom: "Questionnaire", n: 10, duree: 360, coef: 100, desc: "10 questions tirées au hasard dans les chapitres (QCM, vrai/faux, saisie, association)." },
    textuel: { nom: "Textuel", n: 3, duree: 720, coef: 100, desc: "3 questions ouvertes : explique avec tes mots, la correction repère les notions attendues." },
    pratique: { nom: "Pratique", n: 3, duree: 900, coef: 150, desc: "3 missions de labo tirées au hasard, sans indice ni solution." }
  };

  document.body.appendChild(EF.header(""));
  var nav = document.querySelector('.top-nav a[href="evaluation.html"]'); if (nav) nav.setAttribute("aria-current", "page");
  var main = el("main", "wrap page eval");
  document.body.appendChild(main);

  function fmt(s) { return esc(s).replace(/`([^`]+)`/g, "<code>$1</code>"); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function norm(s) { return String(s).replace(/[’‘`´"]/g, "'").replace(/\s+/g, ""); }
  function sansAccent(s) { return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " "); }
  function mmss(s) { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2); }
  function laboDe(m) { return (m.labos || [])[0]; }

  /* ---------- écran de choix ---------- */
  function accueil() {
    arreterChrono(); window.onbeforeunload = null;
    var ev = EF.getEvals();
    var h = '<nav class="crumbs"><a href="index.html">Accueil</a><span>›</span><span>Évaluation</span></nav>' +
      '<div class="page-head"><div class="ico">' + I("timer") + '</div><div><h1>Évaluation</h1>' +
      '<div class="sub">Teste-toi sous chrono, sans indice. Ton meilleur résultat compte pour le classement.</div></div></div>' +
      '<div class="ev-types">' + Object.keys(TYPES).map(function (t) {
        var T = TYPES[t];
        return '<div class="ev-type"><b>' + T.nom + '</b><span>' + T.desc + '</span><span class="ev-meta">' + I("timer") + ' ' + mmss(T.duree) + ' · jusqu\'à ' + Math.round(T.coef * 1.2) + ' pts</span></div>';
      }).join("") + '</div>' +
      '<h2 class="ev-h2">Choisis une matière</h2><div class="ev-grid">';
    MODS.forEach(function (m) {
      var types = ["questionnaire"];
      if (TEXTES[m.id]) types.push("textuel");
      if (laboDe(m)) types.push("pratique");
      h += '<div class="ev-mod c-' + m.couleur + '"><div class="ev-mod-t"><span class="ico">' + esc(m.icone) + '</span><div><b>' + esc(m.titre) + '</b><span>' + esc(m.sousTitre) + '</span></div></div>' +
        '<div class="ev-btns">' + types.map(function (t) {
          var best = ev[m.id + "_" + t];
          return '<button type="button" class="ev-go" data-m="' + m.id + '" data-t="' + t + '"><span>' + TYPES[t].nom + '</span>' +
            (best ? '<small>record ' + best.points + ' pts · ' + Math.round(best.pct * 100) + ' %</small>' : '<small>pas encore tenté</small>') + '</button>';
        }).join("") + '</div></div>';
    });
    main.innerHTML = h + '</div>';
    window.scrollTo(0, 0);
  }
  main.addEventListener("click", function (e) {
    var b = e.target.closest(".ev-go"); if (!b) return;
    consignes(b.dataset.m, b.dataset.t);
  });

  /* ---------- consignes ---------- */
  function consignes(mid, type) {
    var m = MODS.filter(function (x) { return x.id === mid; })[0], T = TYPES[type];
    var best = EF.getEvals()[mid + "_" + type];
    main.innerHTML = '<nav class="crumbs"><a href="index.html">Accueil</a><span>›</span><a href="evaluation.html" data-retour>Évaluation</a><span>›</span><span>' + esc(m.titre) + '</span></nav>' +
      '<div class="ev-consignes c-' + m.couleur + '"><div class="lb-kicker">' + esc(m.titre) + '</div><h1>' + T.nom + '</h1><p class="lead">' + T.desc + '</p>' +
      '<ul class="ev-regles"><li>' + I("timer") + ' Durée : <b>' + mmss(T.duree) + '</b>. À la fin du temps, ta copie est rendue automatiquement.</li>' +
      '<li>Pas d\'indice, pas de correction pendant l\'épreuve : tout est corrigé à la fin.</li>' +
      '<li>Points : ' + T.coef + ' × ton taux de réussite, + un bonus de rapidité jusqu\'à ' + Math.round(T.coef * 0.2) + ' pts si tu as au moins 50 %.</li>' +
      (type === "textuel" ? '<li>La correction est automatique : elle cherche les notions attendues dans ta réponse. Écris des phrases complètes avec le vocabulaire du cours.</li>' : '') +
      (type === "pratique" ? '<li>L\'épreuve se déroule dans le labo de la matière (' + esc(laboDe(m).titre) + ').</li>' : '') +
      (best ? '<li>Ton record : <b>' + best.points + ' pts</b> (' + Math.round(best.pct * 100) + ' %, le ' + esc(best.date) + ').</li>' : '') +
      '</ul><div class="btns"><button type="button" class="btn primary" id="ev-start">' + I("timer") + ' Commencer</button>' +
      '<button type="button" class="btn" data-retour>Retour</button></div></div>';
    main.querySelectorAll("[data-retour]").forEach(function (x) { x.onclick = function (e) { e.preventDefault(); accueil(); }; });
    document.getElementById("ev-start").onclick = function () {
      if (type === "pratique") { location.href = "modules/" + mid + "/" + laboDe(m).href + "#examen"; return; }
      if (type === "questionnaire") lancerQuestionnaire(m); else lancerTextuel(m);
    };
    window.scrollTo(0, 0);
  }

  /* ---------- chronomètre ---------- */
  var chrono = null, fin = 0, total = 0, quandFini = null;
  function demarrerChrono(sec, cb) {
    total = sec; fin = Date.now() + sec * 1000; quandFini = cb;
    window.onbeforeunload = function () { return "Ton évaluation est en cours."; };
    tick(); chrono = setInterval(tick, 250);
  }
  function restant() { return Math.max(0, (fin - Date.now()) / 1000); }
  function tick() {
    var r = restant(), b = document.getElementById("ev-chrono");
    if (b) {
      b.querySelector("b").textContent = mmss(r);
      b.querySelector("i").style.width = (100 * r / total) + "%";
      b.classList.toggle("urgent", r <= 60);
    }
    if (r <= 0) { var cb = quandFini; arreterChrono(); if (cb) cb(true); }
  }
  function arreterChrono() { clearInterval(chrono); chrono = null; quandFini = null; }
  function barre(m, type, extra) {
    return '<div class="ev-bar c-' + m.couleur + '"><div><b>' + esc(m.titre) + '</b> · ' + TYPES[type].nom + (extra ? ' · <span id="ev-pos">' + extra + '</span>' : '') + '</div>' +
      '<div class="ev-chrono" id="ev-chrono">' + I("timer") + ' <b>' + mmss(TYPES[type].duree) + '</b><i></i></div></div>';
  }

  /* ---------- banque de questions (lue dans les pages des chapitres) ---------- */
  var banques = {};
  function banque(m) {
    if (banques[m.id]) return Promise.resolve(banques[m.id]);
    return Promise.all(m.chapitres.map(function (c) {
      return fetch("modules/" + m.id + "/" + c.id + ".html").then(function (r) { return r.ok ? r.text() : ""; }).then(function (html) {
        var d = new DOMParser().parseFromString(html, "text/html"), out = [];
        [].forEach.call(d.querySelectorAll("script:not([src])"), function (s) {
          if (s.textContent.indexOf("EF_EXERCICES") < 0) return;
          var w = {};
          try { new Function("window", s.textContent)(w); } catch (e) { return; }
          (w.EF_EXERCICES || []).forEach(function (q) { if (q.type !== "terminal") { q.chap = c.titre; out.push(q); } });
        });
        return out;
      }).catch(function () { return []; });
    })).then(function (l) { banques[m.id] = [].concat.apply([], l); return banques[m.id]; });
  }

  /* ---------- questionnaire ---------- */
  function lancerQuestionnaire(m) {
    main.innerHTML = '<p class="lead">Préparation des questions…</p>';
    banque(m).then(function (tout) {
      if (!tout.length) { main.innerHTML = '<div class="box attention"><b>Impossible de charger les questions</b><p>Vérifie ta connexion, puis réessaie.</p></div>'; return; }
      /* on mélange les niveaux : environ 4 faciles, 4 moyennes, 2 difficiles quand c'est possible */
      var par = { facile: [], moyen: [], difficile: [] };
      shuffle(tout).forEach(function (q) { (par[q.niveau] || par.facile).push(q); });
      var choix = par.facile.splice(0, 4).concat(par.moyen.splice(0, 4), par.difficile.splice(0, 2));
      var reste = shuffle(par.facile.concat(par.moyen, par.difficile));
      while (choix.length < TYPES.questionnaire.n && reste.length) choix.push(reste.pop());
      var S = { m: m, qs: shuffle(choix), i: 0, rep: [], debut: Date.now() };
      demarrerChrono(TYPES.questionnaire.duree, function () { finQuestionnaire(S); });
      question(S);
    });
  }
  function question(S) {
    var q = S.qs[S.i], n = S.qs.length;
    var h = barre(S.m, "questionnaire", "question " + (S.i + 1) + "/" + n) +
      '<div class="ev-dots">' + S.qs.map(function (x, k) { return '<i class="' + (k < S.i ? "fait" : k === S.i ? "cur" : "") + '"></i>'; }).join("") + '</div>' +
      '<div class="ev-q"><div class="lb-kicker">' + esc(q.chap || "") + '</div><h2>' + fmt(q.q) + '</h2>' + (q.code ? '<pre>' + esc(q.code) + '</pre>' : '') + '<div id="ev-zone"></div></div>' +
      '<div class="btns ev-nav"><button type="button" class="btn" id="ev-passer">Passer</button><button type="button" class="btn primary" id="ev-next" disabled>' + (S.i + 1 < n ? "Question suivante →" : "Terminer") + '</button></div>';
    main.innerHTML = h; tick();
    var zone = document.getElementById("ev-zone"), next = document.getElementById("ev-next"), val = null;
    function pret(v) { val = v; next.disabled = v === null; }
    if (q.type === "qcm") {
      var order = shuffle(q.options.map(function (o, i) { return i; }));
      zone.className = "opts";
      order.forEach(function (oi, pos) {
        var b = el("button", "opt", '<span class="k">' + "ABCDEF"[pos] + '</span><span>' + fmt(q.options[oi]) + '</span>'); b.type = "button";
        b.onclick = function () { [].forEach.call(zone.children, function (x) { x.classList.remove("choisi"); }); b.classList.add("choisi"); pret(oi); };
        zone.appendChild(b);
      });
    } else if (q.type === "vf") {
      zone.className = "opts vf";
      [true, false].forEach(function (v) {
        var b = el("button", "opt", v ? "Vrai" : "Faux"); b.type = "button";
        b.onclick = function () { [].forEach.call(zone.children, function (x) { x.classList.remove("choisi"); }); b.classList.add("choisi"); pret(v); };
        zone.appendChild(b);
      });
    } else if (q.type === "saisie") {
      zone.className = "answer-row";
      var inp = el("input"); inp.type = "text"; inp.placeholder = "Ta réponse…"; inp.autocomplete = "off"; inp.spellcheck = false; inp.autocapitalize = "off";
      inp.oninput = function () { pret(inp.value.trim() ? inp.value : null); };
      inp.onkeydown = function (e) { if (e.key === "Enter" && !next.disabled) next.click(); };
      zone.appendChild(inp); setTimeout(function () { inp.focus(); }, 0);
    } else if (q.type === "associer") {
      zone.className = "pairs";
      var droite = shuffle(q.paires.map(function (p) { return p[1]; })), sels = [];
      q.paires.forEach(function (p) {
        var r = el("div", "pair"); r.appendChild(el("div", "l", esc(p[0])));
        var s = el("select"); s.appendChild(new Option("Choisis…", ""));
        droite.forEach(function (x) { s.appendChild(new Option(x, x)); });
        s.onchange = function () { pret(sels.every(function (x) { return x.value; }) ? sels.map(function (x) { return x.value; }) : null); };
        sels.push(s); r.appendChild(s); zone.appendChild(r);
      });
    }
    function suivant(v) {
      S.rep[S.i] = v;
      S.i++;
      if (S.i < n) question(S); else finQuestionnaire(S);
    }
    next.onclick = function () { suivant(val); };
    document.getElementById("ev-passer").onclick = function () { suivant(null); };
  }
  function juste(q, v) {
    if (v === null || v === undefined) return false;
    if (q.type === "qcm") return v === q.answer;
    if (q.type === "vf") return v === q.answer;
    if (q.type === "saisie") return q.answers.some(function (a) { return norm(a) === norm(v); });
    if (q.type === "associer") return q.paires.every(function (p, i) { return v[i] === p[1]; });
    return false;
  }
  function bonneReponse(q) {
    if (q.type === "qcm") return fmt(q.options[q.answer]);
    if (q.type === "vf") return q.answer ? "Vrai" : "Faux";
    if (q.type === "saisie") return "<code>" + esc(q.answers[0]) + "</code>";
    if (q.type === "associer") return q.paires.map(function (p) { return esc(p[0]) + " → " + esc(p[1]); }).join("<br>");
    return "";
  }
  function taReponse(q, v) {
    if (v === null || v === undefined) return "<i>pas de réponse</i>";
    if (q.type === "qcm") return fmt(q.options[v]);
    if (q.type === "vf") return v ? "Vrai" : "Faux";
    if (q.type === "saisie") return "<code>" + esc(v) + "</code>";
    if (q.type === "associer") return q.paires.map(function (p, i) { return esc(p[0]) + " → " + esc(v[i]); }).join("<br>");
    return "";
  }
  function finQuestionnaire(S) {
    if (S.fini) return; S.fini = true;
    var r = restant(); arreterChrono();
    var ok = S.qs.map(function (q, i) { return juste(q, S.rep[i]); });
    var pct = ok.filter(Boolean).length / S.qs.length;
    var detail = S.qs.map(function (q, i) {
      return '<details class="ev-corr ' + (ok[i] ? "ok" : "ko") + '"><summary><span class="ck">' + (ok[i] ? "✓" : "✗") + '</span>' + fmt(q.q) + '</summary>' +
        (q.code ? '<pre>' + esc(q.code) + '</pre>' : '') +
        '<p><b>Ta réponse :</b> ' + taReponse(q, S.rep[i]) + '</p>' + (ok[i] ? '' : '<p><b>Bonne réponse :</b> ' + bonneReponse(q) + '</p>') +
        (q.explication ? '<p class="ev-expl">' + fmt(q.explication) + '</p>' : '') + '</details>';
    }).join("");
    resultat(S.m, "questionnaire", pct, r, detail);
  }

  /* ---------- textuel ---------- */
  function lancerTextuel(m) {
    var qs = shuffle(TEXTES[m.id]).slice(0, TYPES.textuel.n);
    var S = { m: m, qs: qs, i: 0, rep: qs.map(function () { return ""; }) };
    demarrerChrono(TYPES.textuel.duree, function () { finTextuel(S); });
    redaction(S);
  }
  function redaction(S) {
    var q = S.qs[S.i], n = S.qs.length;
    main.innerHTML = barre(S.m, "textuel", "question " + (S.i + 1) + "/" + n) +
      '<div class="ev-dots">' + S.qs.map(function (x, k) { return '<button type="button" data-k="' + k + '" class="' + (S.rep[k].trim() ? "fait" : "") + (k === S.i ? " cur" : "") + '" aria-label="Question ' + (k + 1) + '"></button>'; }).join("") + '</div>' +
      '<div class="ev-q"><h2>' + q.q + '</h2><textarea id="ev-texte" rows="9" placeholder="Rédige ta réponse en quelques phrases…"></textarea><div class="ev-compte" id="ev-compte"></div></div>' +
      '<div class="btns ev-nav">' + (S.i > 0 ? '<button type="button" class="btn" id="ev-prec">← Précédente</button>' : '') +
      (S.i + 1 < n ? '<button type="button" class="btn primary" id="ev-suiv">Question suivante →</button>' : '') +
      '<button type="button" class="btn' + (S.i + 1 < n ? '' : ' primary') + '" id="ev-rendre">Rendre ma copie</button></div>';
    tick();
    var t = document.getElementById("ev-texte"), c = document.getElementById("ev-compte");
    t.value = S.rep[S.i];
    function compte() { S.rep[S.i] = t.value; var w = t.value.trim() ? t.value.trim().split(/\s+/).length : 0; c.textContent = w + " mot" + (w > 1 ? "s" : ""); }
    t.oninput = compte; compte(); t.focus();
    function aller(k) { S.rep[S.i] = t.value; S.i = k; redaction(S); }
    main.querySelectorAll(".ev-dots button").forEach(function (b) { b.onclick = function () { aller(+b.dataset.k); }; });
    if (document.getElementById("ev-prec")) document.getElementById("ev-prec").onclick = function () { aller(S.i - 1); };
    if (document.getElementById("ev-suiv")) document.getElementById("ev-suiv").onclick = function () { aller(S.i + 1); };
    document.getElementById("ev-rendre").onclick = function () {
      S.rep[S.i] = t.value;
      var vides = S.rep.filter(function (x) { return !x.trim(); }).length;
      if (vides && !window.confirm(vides + " question(s) sans réponse. Rendre quand même ?")) return;
      finTextuel(S);
    };
  }
  function noteTexte(q, rep) {
    var t = sansAccent(rep);
    return q.notions.map(function (no) { return t.trim().length > 0 && new RegExp(no.rx, "i").test(t); });
  }
  function finTextuel(S) {
    if (S.fini) return; S.fini = true;
    var t = document.getElementById("ev-texte"); if (t) S.rep[S.i] = t.value;
    var r = restant(); arreterChrono();
    var scores = S.qs.map(function (q, i) { var n = noteTexte(q, S.rep[i]); return { n: n, s: n.filter(Boolean).length / n.length }; });
    var pct = scores.reduce(function (a, x) { return a + x.s; }, 0) / S.qs.length;
    var detail = S.qs.map(function (q, i) {
      var sc = scores[i];
      return '<details class="ev-corr ' + (sc.s >= 0.75 ? "ok" : sc.s >= 0.4 ? "moy" : "ko") + '" open><summary><span class="ck">' + Math.round(sc.s * 100) + '%</span>' + q.q + '</summary>' +
        '<div class="ev-copie"><b>Ta réponse</b><p>' + (S.rep[i].trim() ? esc(S.rep[i]).replace(/\n/g, "<br>") : "<i>pas de réponse</i>") + '</p></div>' +
        '<ul class="ev-notions">' + q.notions.map(function (no, k) { return '<li class="' + (sc.n[k] ? "ok" : "ko") + '"><span class="ck">' + (sc.n[k] ? "✓" : "✗") + '</span>' + esc(no.n) + '</li>'; }).join("") + '</ul>' +
        '<div class="ev-corrige"><b>Corrigé</b>' + q.corrige + '</div></details>';
    }).join("") + '<p class="lb-small">La correction automatique repère des mots-clés : elle peut se tromper. Compare ta réponse au corrigé pour juger toi-même.</p>';
    resultat(S.m, "textuel", pct, r, detail);
  }

  /* ---------- résultat ---------- */
  function resultat(m, type, pct, rest, detail) {
    window.onbeforeunload = null;
    var T = TYPES[type], duree = Math.round(T.duree - rest);
    var pts = EF.points(pct, T.coef, rest, T.duree);
    var sv = EF.saveEval(m.id + "_" + type, { pct: Math.round(pct * 1000) / 1000, points: pts, duree: duree });
    var connecte = window.EFCloud && window.EFCloud.user();
    main.innerHTML = '<div class="ev-res c-' + m.couleur + '"><div class="lb-kicker">' + esc(m.titre) + ' · ' + T.nom + '</div>' +
      '<div class="ev-score"><b>' + Math.round(pct * 100) + '<small>%</small></b><div><span class="ev-pts">' + pts + ' pts</span>' +
      '<span>' + I("timer") + ' ' + mmss(duree) + (rest <= 0 ? " (temps écoulé)" : "") + '</span>' +
      (sv.record ? '<span class="ev-record">Nouveau record !</span>' : '<span>Record : ' + sv.best.points + ' pts</span>') + '</div></div>' +
      (window.EF_FIREBASE_CONFIG && !connecte ? '<p class="ev-login">Connecte-toi pour que ce résultat compte dans le classement. <button type="button" class="btn" id="ev-login">Se connecter</button></p>' : '') +
      '<div class="btns"><button type="button" class="btn primary" id="ev-again">' + I("rotate-ccw") + ' Recommencer</button>' +
      '<button type="button" class="btn" id="ev-home">Autre évaluation</button><a class="btn" href="classement.html">' + I("trophy") + ' Classement</a></div></div>' +
      '<h2 class="ev-h2">Correction</h2><div class="ev-detail">' + detail + '</div>';
    document.getElementById("ev-again").onclick = function () { type === "questionnaire" ? lancerQuestionnaire(m) : lancerTextuel(m); };
    document.getElementById("ev-home").onclick = accueil;
    if (document.getElementById("ev-login")) document.getElementById("ev-login").onclick = function () { window.EFCloud.ouvrir(); };
    window.scrollTo(0, 0);
  }

  window.EFEval = { juste: juste, noteTexte: noteTexte, banque: banque, MODS: MODS };
  accueil();
})();
