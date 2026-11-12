/* Étude Facile — évaluations chronométrées.
   Types : questionnaire (banque des chapitres), textuel (questions ouvertes), pratique (labo en mode examen),
           chapitre (questionnaire d'un seul chapitre, entraînement), examen (examen blanc : plusieurs parties).
   Accès direct : evaluation.html#m=<matière>&t=<type>[&c=<chapitre>]
   Résultats : EtudeFacile.saveEval(clé). Clés publiques : <matière>_<questionnaire|textuel|pratique|examen>. */
(function () {
  "use strict";
  var EF = window.EtudeFacile, esc = EF.esc, el = EF.el, I = EF.icon;
  var MODS = (window.EF_MODULES || []).filter(function (m) { return m.chapitres.length; });
  var TEXTES = window.EF_EVAL_TEXTES || {};
  var TYPES = {
    questionnaire: { nom: "Questionnaire", duree: 360, coef: 100, desc: "10 questions tirées au hasard dans tous les chapitres (QCM, vrai/faux, saisie, association)." },
    textuel: { nom: "Textuel", duree: 720, coef: 100, desc: "3 questions ouvertes : explique avec tes mots, la correction repère les notions attendues." },
    pratique: { nom: "Pratique", duree: 900, coef: 150, desc: "3 missions de labo tirées au hasard, sans indice ni solution." },
    examen: { nom: "Examen blanc", coef: 250, desc: "L'épreuve complète, sous un seul chrono : questionnaire, questions ouvertes et, si la matière a un labo, missions pratiques." },
    chapitre: { nom: "Évaluation du chapitre", duree: 240, coef: 50, desc: "8 questions sur ce chapitre seulement. Pour t'entraîner : ne compte pas au classement." }
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
  function laboDe(m, l) { return (m.labos || [])[+l || 0]; }
  function modDe(id) { return MODS.filter(function (x) { return x.id === id; })[0]; }
  function chapDe(m, cid) { return m.chapitres.filter(function (c) { return c.id === cid; })[0]; }
  function cle(m, type, cid, l) {
    if (type === "pratique" && +l > 0) return (laboDe(m, l).cle || m.id + "-" + l) + "_pratique";
    return type === "chapitre" ? m.id + "_chap_" + cid : m.id + "_" + type;
  }
  function nomPratique(m, l) { return (m.labos || []).length > 1 ? "Pratique · " + (laboDe(m, l).court || laboDe(m, l).titre) : "Pratique"; }

  /* Parties d'une épreuve : { k: "q"|"t"|"p", n, poids, chap? } */
  function parties(m, type, cid) {
    if (type === "questionnaire") return [{ k: "q", n: 10, poids: 1 }];
    if (type === "chapitre") return [{ k: "q", n: 8, poids: 1, chap: cid }];
    if (type === "textuel") return [{ k: "t", n: 3, poids: 1 }];
    if (type === "pratique") return [{ k: "p", n: 3, poids: 1 }];
    var p = [{ k: "q", n: 10, poids: 4, titre: "Questionnaire" }];
    if (TEXTES[m.id]) p.push({ k: "t", n: 2, poids: 3, titre: "Questions ouvertes" });
    if (laboDe(m)) p.push({ k: "p", n: 2, poids: 3, titre: "Pratique" });
    return p;
  }
  function duree(m, type, l) {
    if (type === "pratique") return laboDe(m, l).examDuree || TYPES.pratique.duree;
    if (type !== "examen") return TYPES[type].duree;
    return laboDe(m) ? 1500 : 1080;
  }
  function coef(m, type) { return type === "examen" ? (laboDe(m) ? 250 : 200) : TYPES[type].coef; }

  /* ---------- écran de choix ---------- */
  function accueil() {
    arreterChrono(); window.onbeforeunload = null;
    if (location.hash) history.replaceState(null, "", location.pathname);
    var ev = EF.getEvals();
    var h = '<nav class="crumbs"><a href="index.html">Accueil</a><span>›</span><span>Évaluation</span></nav>' +
      '<div class="page-head"><div class="ico">' + I("timer") + '</div><div><h1>Évaluation</h1>' +
      '<div class="sub">Teste-toi sous chrono, sans indice. Ton meilleur résultat compte pour le classement.</div></div></div>' +
      '<div class="ev-types">' + ["questionnaire", "textuel", "pratique", "examen"].map(function (t) {
        var T = TYPES[t];
        return '<div class="ev-type"><b>' + T.nom + '</b><span>' + T.desc + '</span><span class="ev-meta">' + I("timer") + ' ' +
          (t === "examen" ? "18 à 25 min · jusqu'à 300 pts" : mmss(T.duree) + ' · jusqu\'à ' + Math.round(T.coef * 1.2) + ' pts') + '</span></div>';
      }).join("") + '</div>' +
      '<p class="lb-small">Chaque chapitre a aussi sa propre évaluation (8 questions, 4 min) : ouvre une matière puis « Évaluer ce chapitre ».</p>' +
      '<h2 class="ev-h2">Choisis une matière</h2><div class="ev-grid">';
    MODS.forEach(function (m) {
      var types = ["questionnaire"];
      if (TEXTES[m.id]) types.push("textuel");
      (m.labos || []).forEach(function (x, i) { types.push("pratique:" + i); });
      types.push("examen");
      h += '<div class="ev-mod c-' + m.couleur + '"><div class="ev-mod-t"><span class="ico">' + esc(m.icone) + '</span><div><b>' + esc(m.titre) + '</b><span>' + esc(m.sousTitre) + '</span></div></div>' +
        '<div class="ev-btns">' + types.map(function (tt) {
          var t = tt.split(":")[0], l = tt.split(":")[1] || "", best = ev[cle(m, t, null, l)];
          return '<button type="button" class="ev-go' + (t === "examen" ? " examen" : "") + '" data-m="' + m.id + '" data-t="' + t + '" data-l="' + l + '"><span>' + (t === "pratique" ? nomPratique(m, l) : TYPES[t].nom) + '</span>' +
            (best ? '<small>record ' + best.points + ' pts · ' + Math.round(best.pct * 100) + ' %</small>' : '<small>pas encore tenté</small>') + '</button>';
        }).join("") + '</div><a class="ev-modlien" href="modules/' + m.id + '/index.html">Évaluations par chapitre →</a></div>';
    });
    main.innerHTML = h + '</div>';
    window.scrollTo(0, 0);
  }
  main.addEventListener("click", function (e) {
    var b = e.target.closest(".ev-go"); if (!b) return;
    consignes(modDe(b.dataset.m), b.dataset.t, b.dataset.c, b.dataset.l);
  });

  /* ---------- consignes ---------- */
  function consignes(m, type, cid, l) {
    var T = TYPES[type], ch = cid && chapDe(m, cid), P = parties(m, type, cid), D = duree(m, type, l), C = coef(m, type);
    var best = EF.getEvals()[cle(m, type, cid, l)], LB = type === "pratique" ? laboDe(m, l) : null;
    if (LB && (LB.examDesc || LB.examCoef)) { T = { nom: nomPratique(m, l), desc: LB.examDesc || T.desc }; C = LB.examCoef || C; }
    else if (LB) T = { nom: nomPratique(m, l), desc: T.desc };
    var detailParties = type === "examen" ? '<li>Déroulé : ' + P.map(function (p, i) {
      return (i + 1) + '. <b>' + p.titre + '</b> (' + (p.k === "p" && laboDe(m).blancTexte ? laboDe(m).blancTexte : p.n + (p.k === "q" ? " questions" : p.k === "t" ? " questions ouvertes" : " missions de labo")) + ', ' + Math.round(100 * p.poids / P.reduce(function (a, x) { return a + x.poids; }, 0)) + ' % de la note)';
    }).join(" → ") + '. Tu ne peux pas revenir à une partie terminée.</li>' : '';
    main.innerHTML = '<nav class="crumbs"><a href="index.html">Accueil</a><span>›</span><a href="evaluation.html" data-retour>Évaluation</a><span>›</span><span>' + esc(m.titre) + '</span></nav>' +
      '<div class="ev-consignes c-' + m.couleur + '"><div class="lb-kicker">' + esc(m.titre) + (ch ? ' · ' + esc(ch.titre) : '') + '</div><h1>' + T.nom + '</h1><p class="lead">' + T.desc + '</p>' +
      '<ul class="ev-regles"><li>' + I("timer") + ' Durée : <b>' + mmss(D) + '</b>. À la fin du temps, ta copie est rendue automatiquement.</li>' + detailParties +
      '<li>Pas d\'indice, pas de correction pendant l\'épreuve : tout est corrigé à la fin.</li>' +
      '<li>Points : ' + C + ' × ton taux de réussite, + un bonus de rapidité jusqu\'à ' + Math.round(C * 0.2) + ' pts si tu as au moins 50 %.' + (type === "chapitre" ? ' (entraînement : hors classement)' : '') + '</li>' +
      (P.some(function (p) { return p.k === "t"; }) ? '<li>Questions ouvertes : la correction cherche les notions attendues dans ta réponse. Écris des phrases complètes avec le vocabulaire du cours.</li>' : '') +
      (P.some(function (p) { return p.k === "p"; }) ? '<li>La partie pratique se déroule dans le labo de la matière (' + esc(laboDe(m, l).titre) + ').</li>' : '') +
      (best ? '<li>Ton record : <b>' + best.points + ' pts</b> (' + Math.round(best.pct * 100) + ' %, le ' + esc(best.date) + ').</li>' : '') +
      '</ul><div class="btns"><button type="button" class="btn primary" id="ev-start">' + I("timer") + ' Commencer</button>' +
      '<button type="button" class="btn" data-retour>Retour</button></div></div>';
    main.querySelectorAll("[data-retour]").forEach(function (x) { x.onclick = function (e) { e.preventDefault(); accueil(); }; });
    document.getElementById("ev-start").onclick = function () {
      if (type === "pratique") { location.href = "modules/" + m.id + "/" + laboDe(m, l).href + "#examen"; return; }
      lancer(m, type, cid);
    };
    window.scrollTo(0, 0);
  }

  /* ---------- chronomètre ---------- */
  var chrono = null, fin = 0, total = 0, quandFini = null;
  function demarrerChrono(sec, tot, cb) {
    total = tot; fin = Date.now() + sec * 1000; quandFini = cb;
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
    if (r <= 0 && quandFini) { var cb = quandFini; arreterChrono(); cb(true); }
  }
  function arreterChrono() { clearInterval(chrono); chrono = null; quandFini = null; }
  function barre(R, extra) {
    var p = R.P[R.i];
    return '<div class="ev-bar c-' + R.m.couleur + '"><div><b>' + esc(R.m.titre) + '</b> · ' + TYPES[R.type].nom +
      (R.P.length > 1 ? ' · partie ' + (R.i + 1) + '/' + R.P.length + ' : ' + esc(p.titre) : '') + (extra ? ' · <span id="ev-pos">' + extra + '</span>' : '') + '</div>' +
      '<div class="ev-chrono" id="ev-chrono">' + I("timer") + ' <b>' + mmss(restant()) + '</b><i></i></div></div>';
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
          (w.EF_EXERCICES || []).forEach(function (q) { if (q.type !== "terminal") { q.chap = c.titre; q.cid = c.id; out.push(q); } });
        });
        return out;
      }).catch(function () { return []; });
    })).then(function (l) { banques[m.id] = [].concat.apply([], l); return banques[m.id]; });
  }

  /* ---------- déroulé d'une épreuve (une ou plusieurs parties) ---------- */
  function lancer(m, type, cid) {
    var R = { m: m, type: type, cid: cid, P: parties(m, type, cid), i: 0, res: [], D: duree(m, type), C: coef(m, type), forcer: null };
    main.innerHTML = '<p class="lead">Préparation de l\'épreuve…</p>';
    banque(m).then(function (tout) {
      R.tout = tout;
      if (R.P.some(function (p) { return p.k === "q"; }) && !tout.length) { main.innerHTML = '<div class="box attention"><b>Impossible de charger les questions</b><p>Vérifie ta connexion, puis réessaie.</p></div>'; return; }
      demarrerChrono(R.D, R.D, function () { tempsEcoule(R); });
      partie(R);
    });
  }
  function partie(R) {
    var p = R.P[R.i];
    if (p.k === "q") partieQuestionnaire(R, p);
    else if (p.k === "t") partieTextuel(R, p);
    else if (p.k === "p") partiePratique(R, p);
  }
  function partieFinie(R, pct, detail) {
    R.forcer = null;
    R.res[R.i] = { pct: pct, detail: detail };
    R.i++;
    if (R.i < R.P.length && restant() > 0) partie(R); else terminer(R);
  }
  function tempsEcoule(R) {
    if (R.forcer) R.forcer(); else terminer(R);
  }
  function terminer(R) {
    if (R.fini) return; R.fini = true;
    var rest = restant(); arreterChrono();
    for (var i = 0; i < R.P.length; i++) if (!R.res[i]) R.res[i] = { pct: 0, detail: '<p class="lb-small">Partie non traitée (temps écoulé).</p>' };
    var totP = R.P.reduce(function (a, p) { return a + p.poids; }, 0);
    var pct = R.P.reduce(function (a, p, i) { return a + p.poids * R.res[i].pct; }, 0) / totP;
    var detail = R.P.length === 1 ? R.res[0].detail : R.P.map(function (p, i) {
      return '<h3 class="ev-partie">Partie ' + (i + 1) + ' · ' + esc(p.titre) + ' <span>' + Math.round(R.res[i].pct * 100) + ' %</span></h3>' + R.res[i].detail;
    }).join("");
    resultat(R, pct, rest, detail);
  }

  /* ---------- partie questionnaire ---------- */
  function partieQuestionnaire(R, p) {
    var pool = p.chap ? R.tout.filter(function (q) { return q.cid === p.chap; }) : R.tout;
    var par = { facile: [], moyen: [], difficile: [] };
    shuffle(pool).forEach(function (q) { (par[q.niveau] || par.facile).push(q); });
    var n = Math.min(p.n, pool.length), choix = par.facile.splice(0, Math.round(n * 0.4)).concat(par.moyen.splice(0, Math.round(n * 0.4)), par.difficile.splice(0, n - 2 * Math.round(n * 0.4)));
    var reste = shuffle(par.facile.concat(par.moyen, par.difficile));
    while (choix.length < n && reste.length) choix.push(reste.pop());
    var S = { qs: shuffle(choix), i: 0, rep: [] };
    R.forcer = function () { corrigerQuestionnaire(R, S); };
    question(R, S);
  }
  function question(R, S) {
    var q = S.qs[S.i], n = S.qs.length, der = S.i + 1 >= n;
    var h = barre(R, "question " + (S.i + 1) + "/" + n) +
      '<div class="ev-dots">' + S.qs.map(function (x, k) { return '<i class="' + (k < S.i ? "fait" : k === S.i ? "cur" : "") + '"></i>'; }).join("") + '</div>' +
      '<div class="ev-q"><div class="lb-kicker">' + esc(q.chap || "") + '</div><h2>' + fmt(q.q) + '</h2>' + (q.code ? '<pre>' + esc(q.code) + '</pre>' : '') + '<div id="ev-zone"></div></div>' +
      '<div class="btns ev-nav"><button type="button" class="btn" id="ev-passer">Passer</button><button type="button" class="btn primary" id="ev-next" disabled>' +
      (!der ? "Question suivante →" : R.i + 1 < R.P.length ? "Partie suivante →" : "Terminer") + '</button></div>';
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
      S.rep[S.i] = v; S.i++;
      if (S.i < n) question(R, S); else corrigerQuestionnaire(R, S);
    }
    next.onclick = function () { suivant(val); };
    document.getElementById("ev-passer").onclick = function () { suivant(null); };
  }
  function juste(q, v) {
    if (v === null || v === undefined) return false;
    if (q.type === "qcm" || q.type === "vf") return v === q.answer;
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
  function corrigerQuestionnaire(R, S) {
    if (S.fini) return; S.fini = true;
    var ok = S.qs.map(function (q, i) { return juste(q, S.rep[i]); });
    var pct = ok.filter(Boolean).length / S.qs.length;
    partieFinie(R, pct, S.qs.map(function (q, i) {
      return '<details class="ev-corr ' + (ok[i] ? "ok" : "ko") + '"><summary><span class="ck">' + (ok[i] ? "✓" : "✗") + '</span>' + fmt(q.q) + '</summary>' +
        (q.code ? '<pre>' + esc(q.code) + '</pre>' : '') +
        '<p><b>Ta réponse :</b> ' + taReponse(q, S.rep[i]) + '</p>' + (ok[i] ? '' : '<p><b>Bonne réponse :</b> ' + bonneReponse(q) + '</p>') +
        (q.explication ? '<p class="ev-expl">' + fmt(q.explication) + '</p>' : '') + '</details>';
    }).join(""));
  }

  /* ---------- partie textuelle ---------- */
  function partieTextuel(R, p) {
    var qs = shuffle(TEXTES[R.m.id]).slice(0, p.n);
    var S = { qs: qs, i: 0, rep: qs.map(function () { return ""; }) };
    R.forcer = function () { var t = document.getElementById("ev-texte"); if (t) S.rep[S.i] = t.value; corrigerTextuel(R, S); };
    redaction(R, S);
  }
  function redaction(R, S) {
    var q = S.qs[S.i], n = S.qs.length, apres = R.i + 1 < R.P.length;
    main.innerHTML = barre(R, "question " + (S.i + 1) + "/" + n) +
      '<div class="ev-dots">' + S.qs.map(function (x, k) { return '<button type="button" data-k="' + k + '" class="' + (S.rep[k].trim() ? "fait" : "") + (k === S.i ? " cur" : "") + '" aria-label="Question ' + (k + 1) + '"></button>'; }).join("") + '</div>' +
      '<div class="ev-q"><h2>' + q.q + '</h2><textarea id="ev-texte" rows="9" placeholder="Rédige ta réponse en quelques phrases…"></textarea><div class="ev-compte" id="ev-compte"></div></div>' +
      '<div class="btns ev-nav">' + (S.i > 0 ? '<button type="button" class="btn" id="ev-prec">← Précédente</button>' : '') +
      (S.i + 1 < n ? '<button type="button" class="btn primary" id="ev-suiv">Question suivante →</button>' : '') +
      '<button type="button" class="btn' + (S.i + 1 < n ? '' : ' primary') + '" id="ev-rendre">' + (apres ? "Partie suivante →" : "Rendre ma copie") + '</button></div>';
    tick();
    var t = document.getElementById("ev-texte"), c = document.getElementById("ev-compte");
    t.value = S.rep[S.i];
    function compte() { S.rep[S.i] = t.value; var w = t.value.trim() ? t.value.trim().split(/\s+/).length : 0; c.textContent = w + " mot" + (w > 1 ? "s" : ""); }
    t.oninput = compte; compte(); t.focus();
    function aller(k) { S.rep[S.i] = t.value; S.i = k; redaction(R, S); }
    main.querySelectorAll(".ev-dots button").forEach(function (b) { b.onclick = function () { aller(+b.dataset.k); }; });
    if (document.getElementById("ev-prec")) document.getElementById("ev-prec").onclick = function () { aller(S.i - 1); };
    if (document.getElementById("ev-suiv")) document.getElementById("ev-suiv").onclick = function () { aller(S.i + 1); };
    document.getElementById("ev-rendre").onclick = function () {
      S.rep[S.i] = t.value;
      var vides = S.rep.filter(function (x) { return !x.trim(); }).length;
      if (vides && !window.confirm(vides + " question(s) sans réponse. Continuer quand même ?")) return;
      corrigerTextuel(R, S);
    };
  }
  function noteTexte(q, rep) {
    var t = sansAccent(rep);
    return q.notions.map(function (no) { return t.trim().length > 0 && new RegExp(no.rx, "i").test(t); });
  }
  function corrigerTextuel(R, S) {
    if (S.fini) return; S.fini = true;
    var scores = S.qs.map(function (q, i) { var n = noteTexte(q, S.rep[i]); return { n: n, s: n.filter(Boolean).length / n.length }; });
    var pct = scores.reduce(function (a, x) { return a + x.s; }, 0) / S.qs.length;
    partieFinie(R, pct, S.qs.map(function (q, i) {
      var sc = scores[i];
      return '<details class="ev-corr ' + (sc.s >= 0.75 ? "ok" : sc.s >= 0.4 ? "moy" : "ko") + '" open><summary><span class="ck">' + Math.round(sc.s * 100) + '%</span>' + q.q + '</summary>' +
        '<div class="ev-copie"><b>Ta réponse</b><p>' + (S.rep[i].trim() ? esc(S.rep[i]).replace(/\n/g, "<br>") : "<i>pas de réponse</i>") + '</p></div>' +
        '<ul class="ev-notions">' + q.notions.map(function (no, k) { return '<li class="' + (sc.n[k] ? "ok" : "ko") + '"><span class="ck">' + (sc.n[k] ? "✓" : "✗") + '</span>' + esc(no.n) + '</li>'; }).join("") + '</ul>' +
        '<div class="ev-corrige"><b>Corrigé</b>' + q.corrige + '</div></details>';
    }).join("") + '<p class="lb-small">La correction automatique repère des mots-clés : elle peut se tromper. Compare ta réponse au corrigé pour juger toi-même.</p>');
  }

  /* ---------- partie pratique (examen blanc) : on continue dans le labo ---------- */
  function partiePratique(R, p) {
    var rest = restant();
    arreterChrono(); window.onbeforeunload = null;
    try {
      sessionStorage.setItem("ef-examen-blanc", JSON.stringify({
        mid: R.m.id, titre: R.m.titre, couleur: R.m.couleur, n: p.n, coef: R.C, duree: R.D, fin: Date.now() + rest * 1000,
        parties: R.P.map(function (x, i) { return { titre: x.titre, poids: x.poids, pct: R.res[i] ? R.res[i].pct : null, detail: R.res[i] ? R.res[i].detail : "" }; })
      }));
    } catch (e) { /* sessionStorage indisponible */ }
    main.innerHTML = barre(R, "") + '<div class="ev-q"><h2>Partie ' + (R.i + 1) + ' · Pratique</h2><p class="lead">Direction le ' + esc(laboDe(R.m).titre) + ' pour ' + p.n + ' missions. Le chrono continue.</p></div>';
    setTimeout(function () { location.href = "modules/" + R.m.id + "/" + laboDe(R.m).href + "#examen-blanc"; }, 1200);
  }

  /* ---------- résultat ---------- */
  function resultat(R, pct, rest, detail) {
    window.onbeforeunload = null;
    var dureeFaite = Math.round(R.D - rest), pts = EF.points(pct, R.C, rest, R.D), ch = R.cid && chapDe(R.m, R.cid);
    var sv = EF.saveEval(cle(R.m, R.type, R.cid), { pct: Math.round(pct * 1000) / 1000, points: pts, duree: dureeFaite });
    var connecte = window.EFCloud && window.EFCloud.user();
    main.innerHTML = '<div class="ev-res c-' + R.m.couleur + '"><div class="lb-kicker">' + esc(R.m.titre) + ' · ' + TYPES[R.type].nom + (ch ? ' · ' + esc(ch.titre) : '') + '</div>' +
      '<div class="ev-score"><b>' + Math.round(pct * 100) + '<small>%</small></b><div><span class="ev-pts">' + pts + ' pts</span>' +
      '<span>' + I("timer") + ' ' + mmss(dureeFaite) + (rest <= 0 ? " (temps écoulé)" : "") + '</span>' +
      (sv.record ? '<span class="ev-record">Nouveau record !</span>' : '<span>Record : ' + sv.best.points + ' pts</span>') + '</div></div>' +
      (R.type === "chapitre" ? '<p class="lb-small">Évaluation d\'entraînement : elle ne compte pas au classement.</p>' :
        (window.EF_FIREBASE_CONFIG && !connecte ? '<p class="ev-login">Connecte-toi pour que ce résultat compte dans le classement. <button type="button" class="btn" id="ev-login">Se connecter</button></p>' : '')) +
      '<div class="btns"><button type="button" class="btn primary" id="ev-again">' + I("rotate-ccw") + ' Recommencer</button>' +
      (ch ? '<a class="btn" href="modules/' + R.m.id + '/' + R.cid + '.html">Revoir le cours</a>' : '') +
      '<button type="button" class="btn" id="ev-home">Autre évaluation</button><a class="btn" href="classement.html">' + I("trophy") + ' Classement</a></div></div>' +
      '<h2 class="ev-h2">Correction</h2><div class="ev-detail">' + detail + '</div>';
    document.getElementById("ev-again").onclick = function () { lancer(R.m, R.type, R.cid); };
    document.getElementById("ev-home").onclick = accueil;
    if (document.getElementById("ev-login")) document.getElementById("ev-login").onclick = function () { window.EFCloud.ouvrir(); };
    window.scrollTo(0, 0);
  }

  /* ---------- routage : evaluation.html#m=…&t=…&c=… ---------- */
  function route() {
    var h = {}; location.hash.replace(/^#/, "").split("&").forEach(function (kv) { var p = kv.split("="); if (p[0]) h[p[0]] = decodeURIComponent(p[1] || ""); });
    var m = h.m && modDe(h.m);
    if (m && TYPES[h.t] && (h.t !== "chapitre" || (h.c && chapDe(m, h.c))) && (h.t !== "textuel" || TEXTES[m.id]) && (h.t !== "pratique" || laboDe(m, h.l))) consignes(m, h.t, h.c, h.l);
    else accueil();
  }

  window.EFEval = { juste: juste, noteTexte: noteTexte, banque: banque, MODS: MODS, parties: parties };
  window.addEventListener("hashchange", function () { if (!chrono && location.hash) route(); });
  route();
})();
