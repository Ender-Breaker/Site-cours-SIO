/* Étude Facile — moteur de chapitre : onglet Cours + onglet S'entraîner (exercices interactifs)

   Dans la page du chapitre :
   - <article id="cours"> … </article>           le cours (HTML pur)
   - window.EF_EXERCICES = [ … ]                 les exercices, dans un <script> avant celui-ci

   Types d'exercices :
   { type:"qcm",     q, options:[…], answer:index, explication, niveau, code? }
   { type:"vf",      q, answer:true|false,         explication, niveau, code? }
   { type:"saisie",  q, answers:["…","…"],         explication, niveau, code? }
   { type:"associer",q, paires:[["gauche","droite"],…], explication, niveau }
   { type:"terminal",q, fs?, modes?, owners?, cwd?, user?, checks:[{exists:"/chemin"},…], solution, indice?, explication, niveau }
   Dans les textes, `…` (accents graves) donne du code en ligne. */
(function () {
  "use strict";
  var EF = window.EtudeFacile, esc = EF.esc, el = EF.el;
  var body = document.body;
  var mid = body.dataset.module, cid = body.dataset.chapter;
  var mod = (window.EF_MODULES || []).filter(function (m) { return m.id === mid; })[0];
  if (!mod) return;
  var idx = -1;
  mod.chapitres.forEach(function (c, i) { if (c.id === cid) idx = i; });
  var chap = mod.chapitres[idx];
  if (!chap) return;

  var I = window.EtudeFacile.icon;
  var LVL = { facile: "Facile", moyen: "Moyen", difficile: "Difficile" };
  var exos = (window.EF_EXERCICES || []).map(function (e) { e.niveau = e.niveau || "facile"; return e; });
  var coursEl = document.getElementById("cours");
  document.title = chap.titre + " — Étude Facile";

  function fmt(s) { return esc(s).replace(/`([^`]+)`/g, "<code>$1</code>"); }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function norm(s) {
    return String(s).replace(/[’‘`´"]/g, "'").replace(/\s+/g, "");
  }

  /* ---------- Squelette de la page ---------- */
  var header = EF.header("../../");
  var main = el("main", "wrap page");
  body.insertBefore(header, coursEl);
  body.insertBefore(main, coursEl);

  main.innerHTML =
    '<nav class="crumbs"><a href="../../index.html">Accueil</a><span>›</span>' +
    '<a href="index.html">' + esc(mod.titre) + '</a><span>›</span><span>Chapitre ' + (idx + 1) + '</span></nav>' +
    '<h1>' + esc(chap.titre) + '</h1>' +
    '<div class="chap-meta" style="margin-top:8px"><span class="lvl ' + chap.niveau + '">' + LVL[chap.niveau] + '</span></div>' +
    '<div class="tabs" role="tablist">' +
    '<button class="tab" role="tab" id="t-cours" aria-selected="true">' + I('book-open') + ' Cours</button>' +
    '<button class="tab" role="tab" id="t-jeu" aria-selected="false">' + I('pencil-line') + ' S\'entraîner</button></div>';

  var jeuEl = el("section", "game");
  jeuEl.id = "jeu";
  jeuEl.hidden = true;
  main.appendChild(coursEl);
  main.appendChild(jeuEl);

  var prev = mod.chapitres[idx - 1], next = mod.chapitres[idx + 1];
  var pager = el("div", "pager");
  pager.innerHTML =
    (prev ? '<a class="btn" href="' + prev.id + '.html">← ' + esc(prev.titre) + '</a>' : '<a class="btn" href="index.html">← Sommaire</a>') +
    (next ? '<a class="btn next" href="' + next.id + '.html">' + esc(next.titre) + ' →</a>' : '');
  main.appendChild(pager);

  function show(tab, push) {
    var jeu = tab === "jeu";
    coursEl.hidden = jeu;
    jeuEl.hidden = !jeu;
    document.getElementById("t-cours").setAttribute("aria-selected", String(!jeu));
    document.getElementById("t-jeu").setAttribute("aria-selected", String(jeu));
    if (push) {
      try { history.replaceState(null, "", jeu ? "#jeu" : location.pathname + location.search); } catch (e) {}
      window.scrollTo({ top: 0 });
    }
  }
  document.getElementById("t-cours").onclick = function () { show("cours", true); };
  document.getElementById("t-jeu").onclick = function () { show("jeu", true); };
  show(location.hash === "#jeu" ? "jeu" : "cours", false);

  /* ---------- Cours : blocs de code avec bouton Copier ---------- */
  Array.prototype.forEach.call(coursEl.querySelectorAll("pre"), function (pre) {
    var raw = pre.textContent.replace(/^\n/, "").replace(/\s+$/, "");
    var repl = pre.hasAttribute("data-repl");
    var wrap = el("div", "codebox");
    pre.parentNode.insertBefore(wrap, pre);
    var copyText = raw;
    if (repl) {
      pre.innerHTML = raw.split("\n").map(function (l) {
        return /^>>> /.test(l) ? '<span class="pr">&gt;&gt;&gt;</span> ' + esc(l.slice(4)) : '<span class="out">' + esc(l) + '</span>';
      }).join("\n");
      copyText = raw.split("\n").filter(function (l) { return /^>>> /.test(l); })
        .map(function (l) { return l.slice(4); }).join("\n");
    } else {
      pre.textContent = raw;
    }
    wrap.appendChild(pre);
    var b = el("button", "copy", "Copier");
    b.type = "button";
    b.onclick = function () {
      function ok() { b.textContent = "Copié ✓"; setTimeout(function () { b.textContent = "Copier"; }, 1400); }
      if (navigator.clipboard) navigator.clipboard.writeText(copyText).then(ok, ok); else ok();
    };
    wrap.appendChild(b);
  });
  // Terminaux d'essai dans le cours : <div data-terminal></div>
  Array.prototype.forEach.call(coursEl.querySelectorAll("[data-terminal]"), function (d) {
    if (window.EFTerm) window.EFTerm.mount(d, { banner: d.getAttribute("data-banner") || undefined });
  });
  // Infobulles : focusables au clavier / au toucher
  Array.prototype.forEach.call(coursEl.querySelectorAll(".tip"), function (t) { t.tabIndex = 0; });

  /* ---------- Jeu ---------- */
  var S = null; // état d'une partie

  function levelsPresent() {
    return ["facile", "moyen", "difficile"].filter(function (l) {
      return exos.some(function (e) { return e.niveau === l; });
    });
  }

  function renderStart(level) {
    level = level || "tous";
    if (!exos.length) {
      jeuEl.innerHTML = '<div class="game-card"><h2>Exercices bientôt disponibles</h2><p class="muted">Les exercices de ce chapitre arrivent prochainement.</p></div>';
      return;
    }
    var n = exos.filter(function (e) { return level === "tous" || e.niveau === level; }).length;
    var best = EF.getBest(mid, cid);
    var chips = ["tous"].concat(levelsPresent()).map(function (l) {
      var c = exos.filter(function (e) { return l === "tous" || e.niveau === l; }).length;
      return '<button class="chip" data-l="' + l + '" aria-pressed="' + (l === level) + '">' +
        (l === "tous" ? "Tous niveaux" : LVL[l]) + ' · ' + c + '</button>';
    }).join("");
    jeuEl.innerHTML =
      '<div class="game-card"><h2>Mode entraînement</h2>' +
      '<p class="muted" style="margin-top:6px">Gagne de l\'XP, enchaîne les bonnes réponses pour des bonus. Au moins 70 % sur « Tous niveaux » valide le chapitre.</p>' +
      (best != null ? '<p class="muted" style="margin-top:8px">Meilleur score : <b style="color:var(--emerald)">' + best + ' %</b></p>' : '') +
      '<div class="lvl-pick" id="lp">' + chips + '</div>' +
      '<button class="btn green" id="go" style="width:100%">Lancer (' + n + ' question' + (n > 1 ? 's' : '') + ')</button></div>';
    document.getElementById("lp").onclick = function (e) {
      var b = e.target.closest(".chip");
      if (b) renderStart(b.dataset.l);
    };
    document.getElementById("go").onclick = function () { start(level); };
  }

  function start(level) {
    var list = shuffle(exos.filter(function (e) { return level === "tous" || e.niveau === level; }));
    S = { level: level, list: list, i: 0, xp: 0, ok: 0, streak: 0, best: 0, wrong: [] };
    renderQ();
  }

  function hud() {
    return '<div class="hud"><span>Question <b>' + (S.i + 1) + '</b> / ' + S.list.length + '</span>' +
      '<span><span class="streak">' + (S.streak >= 2 ? I('flame') + ' ' + S.streak + ' ' : '') + '</span><span class="xp">' + I('zap') + ' ' + S.xp + ' XP</span></span></div>' +
      '<div class="bar"><i style="width:' + Math.round(S.i / S.list.length * 100) + '%"></i></div>';
  }

  function renderQ() {
    var q = S.list[S.i], answered = false;
    var html = '<div class="game-card">' + hud() +
      '<div class="qnum"><span class="lvl ' + q.niveau + '">' + LVL[q.niveau] + '</span></div>' +
      '<div class="qtext">' + fmt(q.q) + '</div>' +
      (q.code ? '<pre class="qcode">' + esc(q.code) + '</pre>' : '') +
      '<div id="widget"></div><div id="fb"></div></div>';
    jeuEl.innerHTML = html;
    var w = document.getElementById("widget");

    function finish(correct, goodText) {
      if (answered) return;
      answered = true;
      var gain = 0;
      if (correct) {
        S.ok++; S.streak++; S.best = Math.max(S.best, S.streak);
        gain = 10 + (S.streak >= 3 ? 5 : 0);
        S.xp += gain;
      } else {
        S.streak = 0; S.wrong.push({ q: q, good: goodText });
      }
      var fb = document.getElementById("fb");
      fb.innerHTML = '<div class="fb ' + (correct ? "good" : "bad") + '"><b>' +
        (correct ? "Bien joué ! +" + gain + " XP" + (S.streak >= 3 ? " (bonus série)" : "") : "Raté") + '</b>' +
        (correct ? "" : '<div>Bonne réponse : ' + goodText + '</div>') +
        (q.explication ? '<div style="margin-top:6px" class="muted">' + fmt(q.explication) + '</div>' : '') + '</div>' +
        '<div class="next-row"><button class="btn primary" id="nx">' +
        (S.i + 1 < S.list.length ? "Suivant →" : "Voir mon score") + '</button></div>';
      var nx = document.getElementById("nx");
      nx.focus();
      nx.onclick = function () { S.i++; if (S.i < S.list.length) renderQ(); else renderEnd(); };
    }

    if (q.type === "qcm") {
      var order = shuffle(q.options.map(function (o, i) { return i; }));
      var box = el("div", "opts");
      order.forEach(function (oi, pos) {
        var b = el("button", "opt", '<span class="k">' + "ABCDEF"[pos] + '</span><span>' + fmt(q.options[oi]) + '</span>');
        b.type = "button";
        b.onclick = function () {
          if (answered) return;
          var ok = oi === q.answer;
          Array.prototype.forEach.call(box.children, function (x, p) {
            x.disabled = true;
            if (order[p] === q.answer) x.classList.add("ok");
          });
          if (!ok) b.classList.add("ko");
          finish(ok, fmt(q.options[q.answer]));
        };
        box.appendChild(b);
      });
      w.appendChild(box);
    } else if (q.type === "vf") {
      var vb = el("div", "opts vf");
      [true, false].forEach(function (v) {
        var b = el("button", "opt", v ? "Vrai" : "Faux");
        b.type = "button";
        b.onclick = function () {
          if (answered) return;
          var ok = v === q.answer;
          Array.prototype.forEach.call(vb.children, function (x, p) {
            x.disabled = true;
            if ((p === 0) === q.answer) x.classList.add("ok");
          });
          if (!ok) b.classList.add("ko");
          finish(ok, q.answer ? "Vrai" : "Faux");
        };
        vb.appendChild(b);
      });
      w.appendChild(vb);
    } else if (q.type === "saisie") {
      var row = el("div", "answer-row");
      var inp = el("input");
      inp.type = "text"; inp.placeholder = "Ta réponse…";
      inp.autocomplete = "off"; inp.autocapitalize = "off"; inp.spellcheck = false;
      var go = el("button", "btn primary", "Valider");
      go.type = "button";
      function submit() {
        if (answered || !inp.value.trim()) return;
        var ok = q.answers.some(function (a) { return norm(a) === norm(inp.value); });
        inp.disabled = true; go.disabled = true;
        inp.classList.add(ok ? "ok" : "ko");
        finish(ok, "<code>" + esc(q.answers[0]) + "</code>");
      }
      go.onclick = submit;
      inp.onkeydown = function (e) { if (e.key === "Enter") submit(); };
      row.appendChild(inp); row.appendChild(go);
      w.appendChild(row);
      inp.focus();
    } else if (q.type === "associer") {
      var rights = shuffle(q.paires.map(function (p) { return p[1]; }));
      var pairs = el("div", "pairs");
      var sels = [];
      q.paires.forEach(function (p) {
        var r = el("div", "pair");
        r.appendChild(el("div", "l", esc(p[0])));
        var s = el("select");
        s.appendChild(new Option("Choisis…", ""));
        rights.forEach(function (x) { s.appendChild(new Option(x, x)); });
        sels.push(s); r.appendChild(s); pairs.appendChild(r);
      });
      var vb2 = el("button", "btn primary", "Valider");
      vb2.type = "button";
      vb2.style.width = "100%";
      vb2.onclick = function () {
        if (answered) return;
        if (sels.some(function (s) { return !s.value; })) { vb2.textContent = "Complète tous les choix"; return; }
        var all = true;
        sels.forEach(function (s, i) {
          var ok = s.value === q.paires[i][1];
          if (!ok) all = false;
          s.disabled = true; s.classList.add(ok ? "ok" : "ko");
        });
        vb2.disabled = true;
        finish(all, q.paires.map(function (p) { return "<code>" + esc(p[0]) + "</code> → <code>" + esc(p[1]) + "</code>"; }).join("<br>"));
      };
      w.appendChild(pairs); w.appendChild(vb2);
    } else if (q.type === "terminal") {
      var tbox = el("div");
      w.appendChild(tbox);
      var tm = window.EFTerm.mount(tbox, {
        fs: q.fs, modes: q.modes, owners: q.owners, cwd: q.cwd, user: q.user,
        banner: q.banner || "Écris tes commandes ci-dessous. L'exercice se valide tout seul quand le résultat est bon.",
        onCommand: function (sh) {
          if (answered) return;
          if (window.EFTerm.check(sh, q.checks)) { tm.lock(); tbox.classList.add("done"); finish(true, ""); }
        }
      });
      var tr = el("div", "btn-row");
      if (q.indice) {
        var hb = el("button", "btn", I('lightbulb') + " Indice"); hb.type = "button";
        hb.onclick = function () { hb.disabled = true; hb.innerHTML = I('lightbulb') + " " + fmt(q.indice); };
        tr.appendChild(hb);
      }
      var gu = el("button", "btn", "Voir la solution"); gu.type = "button";
      gu.onclick = function () { if (answered) return; tm.lock(); finish(false, "<code>" + esc(q.solution || "") + "</code>"); };
      tr.appendChild(gu); w.appendChild(tr);
      tm.focus();
    }
  }

  function renderEnd() {
    var total = S.list.length, pct = Math.round(S.ok / total * 100);
    var stars = pct >= 90 ? 3 : pct >= 70 ? 2 : pct >= 40 ? 1 : 0;
    var validated = false;
    if (S.level === "tous") {
      EF.setBest(mid, cid, pct);
      if (pct >= 70) { EF.markDone(mid, cid); validated = true; }
    }
    var title = pct >= 90 ? "Excellent !" : pct >= 70 ? "Bravo, chapitre maîtrisé" : pct >= 40 ? "Pas mal, encore un effort" : "Relis le cours et retente";
    var html = '<div class="game-card"><h2>' + title + '</h2>' +
      '<div class="result-big">' + pct + ' %</div>' +
      '<div class="stars">' + "★".repeat(stars) + '<span style="opacity:.25">' + "★".repeat(3 - stars) + '</span></div>' +
      '<p class="muted" style="margin-top:8px">' + S.ok + ' bonne' + (S.ok > 1 ? 's' : '') + ' réponse' + (S.ok > 1 ? 's' : '') + ' sur ' + total + '</p>' +
      '<div class="res-row"><span class="badge on">' + I('zap') + ' ' + S.xp + ' XP</span><span class="badge on">' + I('flame') + ' Meilleure série : ' + S.best + '</span>' +
      (validated ? '<span class="badge on">' + I('check') + ' Chapitre validé</span>' : '') + '</div>';
    if (S.level !== "tous") html += '<p class="muted">Joue en « Tous niveaux » pour valider le chapitre.</p>';
    else if (!validated) html += '<p class="muted">Il faut au moins 70 % pour valider le chapitre.</p>';
    if (S.wrong.length) {
      html += '<h3 style="margin-top:18px;font-size:1rem">À revoir</h3><ul class="wrong-list">' +
        S.wrong.map(function (w) { return '<li>' + fmt(w.q.q) + '<br><span style="color:var(--text)">→ ' + w.good + '</span></li>'; }).join("") + '</ul>';
    }
    html += '<div class="btn-row"><button class="btn primary" id="again">' + I('rotate-ccw') + ' Rejouer</button>' +
      '<button class="btn" id="back">' + I('book-open') + ' Revoir le cours</button>' +
      (next ? '<a class="btn green" href="' + next.id + '.html#jeu">Chapitre suivant →</a>' : '<a class="btn" href="index.html">Sommaire</a>') + '</div></div>';
    jeuEl.innerHTML = html;
    document.getElementById("again").onclick = function () { renderStart(S.level); };
    document.getElementById("back").onclick = function () { show("cours", true); };
    var tb = header.querySelector(".top-stat b");
    if (tb) tb.textContent = EF.stats(mod).done + (function () {
      var t = 0; (window.EF_MODULES || []).forEach(function (m) { if (m.id !== mod.id) t += EF.stats(m).done; }); return t;
    })();
    window.scrollTo({ top: 0 });
  }

  renderStart();
})();
