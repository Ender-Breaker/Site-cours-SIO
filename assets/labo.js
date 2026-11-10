/* Étude Facile — Labo terminal : parcours guidé (leçons → missions) + bac à sable.
   Données : window.EF_LABO = { fs, lecons: [{ id, titre, missions: [...] }], aide: [...] }
   Mission : { id, titre, texte (HTML), syntaxe: [], objectifs: [{ txt, r: [règles EFTerm.check] }],
               indice, solution: [], fs?, modes?, owners?, cwd?, prep?: [] }                         */
(function () {
  "use strict";
  var EF = window.EtudeFacile, esc = EF.esc, el = EF.el, I = EF.icon;
  var LAB = window.EF_LABO;
  var KEY = "ef-labo-terminal";
  var HOME = "/home/etu";

  /* ---------- progression ---------- */
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save(p) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) { /* stockage indisponible */ } }
  var prog = load(); prog.done = prog.done || {};

  var all = [];
  LAB.lecons.forEach(function (l, li) { l.missions.forEach(function (m, mi) { m.lecon = l; m.li = li; m.mi = mi; all.push(m); }); });
  function byId(id) { return all.filter(function (m) { return m.id === id; })[0]; }
  function firstTodo() { return all.filter(function (m) { return !prog.done[m.id]; })[0] || all[0]; }

  /* ---------- squelette ---------- */
  document.body.appendChild(EF.header("../../"));
  var main = el("main", "wrap page labo c-emerald");
  document.body.appendChild(main);
  main.innerHTML =
    '<nav class="crumbs"><a href="../../index.html">Accueil</a><span>›</span><a href="index.html">SISR</a><span>›</span><span>Labo terminal</span></nav>' +
    '<div class="page-head c-emerald"><div class="ico">&gt;_</div><div><h1>Labo terminal</h1>' +
    '<div class="sub">Tape de vraies commandes Linux sur un système de fichiers virtuel — rien ne peut casser.</div></div></div>' +
    '<div class="labo-mode chips" role="tablist">' +
    '<button class="chip" data-mode="guide" role="tab">' + I("book-open") + ' Parcours guidé</button>' +
    '<button class="chip" data-mode="libre" role="tab">' + I("pencil-line") + ' Bac à sable</button>' +
    '<span class="labo-score" id="lb-score"></span></div>' +
    '<div class="labo-lecons" id="lb-lecons"></div>' +
    '<div class="labo-grid">' +
    '<section class="labo-brief" id="lb-brief" aria-live="polite"></section>' +
    '<section class="labo-work"><div id="lb-term"></div>' +
    '<div class="labo-explo"><div class="labo-explo-head"><b>Explorateur</b>' +
    '<label><input type="checkbox" id="lb-hidden"> fichiers cachés</label>' +
    '<label><input type="checkbox" id="lb-root"> tout le disque</label></div>' +
    '<div class="labo-explo-body"><ul class="labo-tree" id="lb-tree"></ul><pre class="labo-preview" id="lb-prev">Clique sur un fichier pour voir son contenu.</pre></div></div>' +
    '</section></div>';

  var $ = function (id) { return document.getElementById(id); };
  var brief = $("lb-brief"), termBox = $("lb-term"), tree = $("lb-tree"), prev = $("lb-prev");
  var mode = "guide", cur = null, term = null, okSet = {}, hintShown = false, openFile = null;

  /* ---------- terminal ---------- */
  function startTerm(m) {
    var fs = {}; Object.keys(LAB.fs).forEach(function (k) { fs[k] = LAB.fs[k]; });
    if (m && m.fs) Object.keys(m.fs).forEach(function (k) { if (m.fs[k] === false) delete fs[k]; else fs[k] = m.fs[k]; });
    var modes = {}, owners = {};
    [LAB.modes, m && m.modes].forEach(function (o) { if (o) Object.keys(o).forEach(function (k) { modes[k] = o[k]; }); });
    [LAB.owners, m && m.owners].forEach(function (o) { if (o) Object.keys(o).forEach(function (k) { owners[k] = o[k]; }); });
    termBox.innerHTML = ""; termBox.className = "";
    term = EFTerm.mount(termBox, {
      fs: fs, modes: modes, owners: owners, cwd: (m && m.cwd) || HOME,
      banner: m ? "Mission : " + m.titre + " — tape tes commandes ici (help = liste des commandes)." :
        "Bac à sable : expérimente librement. help liste les commandes, tree montre l'arborescence.",
      onCommand: function () { renderTree(); if (mode !== "libre") evaluate(); }
    });
    (m && m.prep || []).forEach(function (c) { term.sh.run(c); });
    ["hist", "cmds", "outs"].forEach(function (k) { term.sh.S[k].length = 0; });
    term.sh.S.last = "";
    openFile = null; prev.textContent = "Clique sur un fichier pour voir son contenu.";
    renderTree();
  }

  /* ---------- explorateur ---------- */
  function perm(n) {
    var s = n.t === "d" ? "d" : "-", f = "rwx";
    for (var i = 0; i < 9; i++) s += (n.m >> (8 - i)) & 1 ? f.charAt(i % 3) : "-";
    return s;
  }
  function renderTree() {
    if (!term) return;
    var sh = term.sh, showHidden = $("lb-hidden").checked, whole = $("lb-root").checked;
    var start = whole ? "/" : HOME, cwd = sh.S.cwd;
    function li(name, path, n, depth) {
      var here = path === cwd, isD = n.t === "d";
      var h = '<li class="' + (isD ? "d" : "f") + (here ? " here" : "") + (path === openFile ? " open" : "") + '">' +
        '<button type="button" data-p="' + esc(path) + '" title="' + esc(perm(n) + " " + n.o + ":" + n.g) + '">' +
        '<span class="nm">' + esc(name) + (isD && path !== HOME && path !== "/" ? "/" : "") + '</span><span class="pm">' + perm(n) + '</span>' +
        (here ? '<span class="ici">tu es ici</span>' : "") + '</button>';
      if (isD && depth < 8) {
        var kids = Object.keys(n.kids).sort().filter(function (k) { return showHidden || k.charAt(0) !== "."; });
        if (kids.length) h += "<ul>" + kids.map(function (k) { return li(k, (path === "/" ? "" : path) + "/" + k, n.kids[k], depth + 1); }).join("") + "</ul>";
      }
      return h + "</li>";
    }
    var rootN = sh.get(start);
    tree.innerHTML = rootN ? li(start === HOME ? "~  " + HOME : "/", start, rootN, 0) : "";
    if (openFile) showFile(openFile, true);
  }
  function showFile(p, quiet) {
    var n = term.sh.get(p);
    if (!n) { prev.textContent = "(fichier supprimé)"; openFile = null; return; }
    if (n.t === "d") { if (!quiet) prev.textContent = p + "/ — dossier (" + Object.keys(n.kids).length + " élément(s)). Utilise cd et ls pour y aller."; return; }
    openFile = p;
    var u = term.sh.S.user, sh = n.o === u ? 6 : (term.sh.groupsOf(u).indexOf(n.g) >= 0 ? 3 : 0);
    var lisible = u === "root" || ((n.m >> sh) & 4);
    prev.textContent = "── " + p + " (" + perm(n) + " " + n.o + ":" + n.g + ")\n" +
      (lisible ? (n.c || "(fichier vide)") : "cat: Permission non accordée — il te manque le droit r");
  }
  tree.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-p]"); if (!b) return;
    showFile(b.dataset.p); renderTree();
  });
  $("lb-hidden").addEventListener("change", renderTree);
  $("lb-root").addEventListener("change", renderTree);

  /* ---------- insertion d'une commande dans la ligne ---------- */
  function insert(txt) {
    if (!term) return;
    term.input.value = txt; term.input.focus();
    term.input.setSelectionRange(txt.length, txt.length);
  }
  main.addEventListener("click", function (e) {
    var c = e.target.closest("[data-ins]"); if (!c) return;
    insert(c.dataset.ins);
  });

  /* ---------- parcours guidé ---------- */
  function score() {
    var n = all.filter(function (m) { return prog.done[m.id]; }).length;
    $("lb-score").innerHTML = I("trophy") + " " + n + " / " + all.length + " missions";
  }
  function renderLecons() {
    var box = $("lb-lecons");
    if (mode !== "guide") { box.innerHTML = ""; box.hidden = true; return; }
    box.hidden = false;
    box.innerHTML = LAB.lecons.map(function (l, li) {
      var d = l.missions.filter(function (m) { return prog.done[m.id]; }).length;
      return '<div class="labo-lecon' + (cur && cur.lecon === l ? " on" : "") + (d === l.missions.length ? " fini" : "") + '">' +
        '<div class="ll-t"><span class="ll-n">' + (li + 1) + '</span>' + esc(l.titre) + '<span class="ll-c">' + d + "/" + l.missions.length + '</span></div>' +
        '<div class="ll-dots">' + l.missions.map(function (m, mi) {
          return '<a href="#m=' + m.id + '" class="' + (prog.done[m.id] ? "ok" : "") + (cur === m ? " cur" : "") + '" title="' + esc(m.titre) + '">' + (mi + 1) + '</a>';
        }).join("") + '</div></div>';
    }).join("");
  }
  function goals() {
    return '<ul class="labo-goals">' + cur.objectifs.map(function (o, i) {
      return '<li class="' + (okSet[i] ? "ok" : "") + '"><span class="ck">' + (okSet[i] ? "✓" : "") + '</span><span class="gt">' + o.txt + '</span></li>';
    }).join("") + '</ul>';
  }
  function renderBrief() {
    var m = cur, idx = all.indexOf(m), done = cur.objectifs.every(function (o, i) { return okSet[i]; });
    var h = '<div class="lb-kicker">Leçon ' + (m.li + 1) + ' · ' + esc(m.lecon.titre) + ' — mission ' + (m.mi + 1) + '/' + m.lecon.missions.length + '</div>' +
      '<h2>' + esc(m.titre) + '</h2><div class="lb-texte">' + m.texte + '</div>';
    if (m.syntaxe && m.syntaxe.length) h += '<div class="lb-syntaxe"><span>Syntaxe</span>' + m.syntaxe.map(function (s) {
      return '<code>' + esc(s) + '</code>';
    }).join("") + '</div>';
    h += '<h3>Objectifs</h3>' + goals();
    if (done) {
      h += '<div class="box retenir lb-win"><b>Mission réussie</b><p>' + (m.bravo || "Bien joué, c'est exactement ça.") + '</p>' +
        (all[idx + 1] ? '<a class="btn primary" href="#m=' + all[idx + 1].id + '">Mission suivante →</a>' :
          '<p><b>Tu as terminé tout le parcours.</b> Passe au bac à sable pour t\'entraîner librement.</p>') + '</div>';
    }
    h += '<div class="lb-actions">' +
      '<button class="btn" id="lb-hint" type="button">' + I("lightbulb") + ' Indice</button>' +
      (hintShown ? '<button class="btn" id="lb-sol" type="button">Voir la solution</button>' : "") +
      '<button class="btn" id="lb-reset" type="button">' + I("rotate-ccw") + ' Recommencer</button></div>' +
      '<div id="lb-help"></div>' +
      '<div class="lb-nav">' +
      (all[idx - 1] ? '<a href="#m=' + all[idx - 1].id + '">← ' + esc(all[idx - 1].titre) + '</a>' : '<span></span>') +
      (all[idx + 1] ? '<a href="#m=' + all[idx + 1].id + '">' + esc(all[idx + 1].titre) + ' →</a>' : '<span></span>') + '</div>';
    brief.innerHTML = h;
    var help = $("lb-help");
    $("lb-hint").onclick = function () {
      hintShown = true; renderBrief();
      $("lb-help").innerHTML = '<div class="box attention"><b>Indice</b><p>' + m.indice + '</p></div>';
    };
    if ($("lb-sol")) $("lb-sol").onclick = function () {
      help.innerHTML = '<div class="box"><b>Solution</b><p>Clique sur une commande pour la placer dans le terminal :</p>' +
        m.solution.map(function (s) { return '<button type="button" class="lb-cmd" data-ins="' + esc(s) + '">$ ' + esc(s) + '</button>'; }).join("") + '</div>';
    };
    $("lb-reset").onclick = function () { open(m, true); };
  }
  function evaluate() {
    if (mode === "examen") return evalExamen();
    var before = cur.objectifs.every(function (o, i) { return okSet[i]; }), changed = false;
    cur.objectifs.forEach(function (o, i) {
      if (!okSet[i] && EFTerm.check(term.sh, o.r)) { okSet[i] = true; changed = true; }
    });
    var after = cur.objectifs.every(function (o, i) { return okSet[i]; });
    if (!changed) return;
    if (after && !before) {
      prog.done[cur.id] = 1; save(prog);
      termBox.classList.add("done");
      score(); renderLecons();
    }
    var keep = $("lb-help") ? $("lb-help").innerHTML : "";
    renderBrief();
    if (!after && keep) $("lb-help").innerHTML = keep;
    term.focus();
  }
  function open(m, reset) {
    cur = m; okSet = {}; hintShown = false;
    prog.last = m.id; save(prog);
    startTerm(m); renderBrief(); renderLecons();
    if (!reset) window.scrollTo({ top: Math.min(window.scrollY, main.querySelector(".labo-grid").offsetTop - 80) });
    term.focus();
  }

  /* ---------- bac à sable ---------- */
  function openLibre() {
    cur = null;
    var h = '<div class="lb-kicker">Mode libre</div><h2>Bac à sable</h2>' +
      '<div class="lb-texte"><p>Un système complet avec ton dossier <code>' + HOME + '</code>, <code>/etc</code>, <code>/tmp</code>… Essaie tout ce que tu as vu en cours : rien n\'est réel, <b>Recommencer</b> remet tout à zéro.</p></div>' +
      '<div class="lb-actions"><button class="btn" id="lb-reset" type="button">' + I("rotate-ccw") + ' Recommencer</button></div>' +
      '<h3>Aide-mémoire</h3><p class="lb-small">Clique sur une commande pour la placer dans le terminal.</p>';
    LAB.aide.forEach(function (g) {
      h += '<div class="lb-aide"><b>' + esc(g.titre) + '</b><dl>' + g.cmds.map(function (c) {
        return '<dt><button type="button" class="lb-cmd" data-ins="' + esc(c[0]) + '">' + esc(c[0]) + '</button></dt><dd>' + esc(c[1]) + '</dd>';
      }).join("") + '</dl></div>';
    });
    brief.innerHTML = h;
    $("lb-reset").onclick = openLibre;
    startTerm(null); renderLecons();
  }

  /* ---------- évaluation pratique (#examen) ---------- */
  var E = null, MID = document.body.dataset.module || "sisr";
  function hasard(a) { return a[Math.floor(Math.random() * a.length)]; }
  function examen() {
    mode = "examen"; main.classList.add("en-examen");
    var lecons = LAB.lecons.slice().sort(function () { return Math.random() - 0.5; }).slice(0, 3);
    E = { list: lecons.map(function (l) { return hasard(l.missions); }), i: 0, ok: [], fini: false };
    E.chrono = EF.examChrono("Labo terminal", 900, function () { finExamen(); });
    main.querySelector(".labo-grid").insertAdjacentElement("beforebegin", E.chrono.el);
    examOpen(0);
  }
  function examOpen(i) {
    E.i = i; cur = E.list[i]; okSet = {};
    E.chrono.pos("mission " + (i + 1) + "/" + E.list.length);
    startTerm(cur); examBrief(); term.focus();
  }
  function examBrief() {
    var der = E.i + 1 >= E.list.length, ok = E.ok[E.i];
    brief.innerHTML = '<div class="lb-kicker">Mission ' + (E.i + 1) + ' sur ' + E.list.length + '</div><h2>' + esc(cur.titre) + '</h2>' +
      '<h3>Objectifs</h3>' + goals() +
      (ok ? '<div class="box retenir lb-win"><b>Mission réussie</b><p>' + (der ? "C'était la dernière." : "Passage à la suivante…") + '</p></div>'
        : '<p class="lb-small" style="margin-top:10px">Pas d\'indice ni de solution pendant l\'épreuve. La mission est validée dès que tous les objectifs sont atteints. <code>help</code> liste les commandes.</p>') +
      '<div class="lb-actions">' + (der ? '' : '<button class="btn" id="ex-next" type="button">' + (ok ? "Mission suivante →" : "Passer cette mission →") + '</button>') +
      '<button class="btn' + (der ? ' primary' : '') + '" id="ex-fin" type="button">Terminer l\'évaluation</button></div>';
    if ($("ex-next")) $("ex-next").onclick = function () { examOpen(E.i + 1); };
    $("ex-fin").onclick = function () {
      var reste = E.list.length - E.ok.filter(Boolean).length;
      if (reste && !window.confirm("Terminer maintenant ? Les missions non réussies compteront comme ratées.")) return;
      finExamen();
    };
  }
  function evalExamen() {
    if (E.fini || E.ok[E.i]) return;
    var changed = false;
    cur.objectifs.forEach(function (o, i) { if (!okSet[i] && EFTerm.check(term.sh, o.r)) { okSet[i] = true; changed = true; } });
    if (!changed) return;
    if (cur.objectifs.every(function (o, i) { return okSet[i]; })) {
      E.ok[E.i] = true; termBox.classList.add("done");
      var i = E.i;
      setTimeout(function () {
        if (E.fini || E.i !== i) return;
        if (E.ok.filter(Boolean).length === E.list.length) finExamen();
        else if (i + 1 < E.list.length) examOpen(i + 1);
      }, 1300);
    }
    examBrief(); term.focus();
  }
  function finExamen() {
    if (E.fini) return; E.fini = true;
    var rest = E.chrono.restant(); E.chrono.stop(); E.chrono.el.remove();
    var box = main.querySelector(".labo-grid"); box.className = "labo-resultat";
    EF.examResultat(box, {
      mid: MID, titre: "Labo terminal", couleur: "emerald", racine: "../../", duree: 900, coef: 150, restant: rest,
      retour: location.pathname.split("/").pop(),
      missions: E.list.map(function (m, i) { return { titre: m.titre, ok: !!E.ok[i], solution: m.solution.join("\n") }; }),
      rejouer: function () { location.hash = "#examen"; location.reload(); }
    });
  }

  /* ---------- routage ---------- */
  function route() {
    if (/^#examen/.test(location.hash)) { if (!E) examen(); return; }
    if (E) { location.reload(); return; }
    var hsh = location.hash, m = /#m=([\w-]+)/.exec(hsh);
    mode = hsh === "#libre" ? "libre" : "guide";
    main.querySelectorAll(".labo-mode .chip").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.mode === mode)); });
    if (mode === "libre") openLibre();
    else open((m && byId(m[1])) || byId(prog.last) || firstTodo());
  }
  main.querySelector(".labo-mode").addEventListener("click", function (e) {
    var b = e.target.closest(".chip"); if (!b) return;
    location.hash = b.dataset.mode === "libre" ? "#libre" : "#m=" + ((cur && cur.id) || prog.last || firstTodo().id);
  });
  window.addEventListener("hashchange", route);
  score(); route();
})();
