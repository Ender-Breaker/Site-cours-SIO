/* Étude Facile — Labo code (HTML/CSS ou PHP) : éditeur + aperçu + objectifs vérifiés à l'exécution.
   Données : window.EF_CODE = { langue: "html"|"php", key, titre, sousTitre, ico, couleur, fichier,
             module: { titre, href }, lecons: [{ titre, missions: [...] }], libre: "code de départ" }
   Mission : { id, titre, texte, depart, objectifs: [{ txt, r: [règles] }], indice, solution, get?, post? }
   Règles : code / codei / nocode (regex sur le source), out (regex sur la sortie), noerr,
            dom (sélecteur), min [sél, n], count [sél, n], text [sél, regex], attr [sél, attribut, regex],
            style [sél, propriété, regex], test { get, post, out, notout, dom }  (PHP : exécution séparée)  */
(function () {
  "use strict";
  var EF = window.EtudeFacile, esc = EF.esc, el = EF.el, I = EF.icon;
  var CFG = window.EF_CODE, PHP = CFG.langue === "php", PY = CFG.langue === "python";
  var HERE = (document.currentScript && document.currentScript.src) || location.href;
  var PHP_URLS = window.EF_PHP_URLS || [new URL("vendor/php-wasm/PhpWeb.mjs", HERE).href, "https://cdn.jsdelivr.net/npm/php-wasm@0.2.0/PhpWeb.mjs", "https://unpkg.com/php-wasm@0.2.0/PhpWeb.mjs"];
  var ERR = PY ? /^Traceback|^\w*(Error|Exception)\b.*:|^\s+File "main\.py"/m : /(Parse error|Fatal error|Warning|Deprecated|Notice):/;

  /* ---------- progression ---------- */
  function load() { try { return JSON.parse(localStorage.getItem(CFG.key)) || {}; } catch (e) { return {}; } }
  function save() { try { localStorage.setItem(CFG.key, JSON.stringify(prog)); } catch (e) { /* stockage indisponible */ } }
  var prog = load(); prog.done = prog.done || {}; prog.code = prog.code || {};
  var all = [];
  CFG.lecons.forEach(function (l, li) { l.missions.forEach(function (m, mi) { m.lecon = l; m.li = li; m.mi = mi; all.push(m); }); });
  function byId(id) { return all.filter(function (m) { return m.id === id; })[0]; }
  function firstTodo() { return all.filter(function (m) { return !prog.done[m.id]; })[0] || all[0]; }

  /* ---------- squelette ---------- */
  document.body.appendChild(EF.header("../../"));
  var main = el("main", "wrap page labo c-" + CFG.couleur);
  document.body.appendChild(main);
  main.innerHTML =
    '<nav class="crumbs"><a href="../../index.html">Accueil</a><span>›</span><a href="' + esc(CFG.module.href) + '">' + esc(CFG.module.titre) + '</a><span>›</span><span>' + esc(CFG.titre) + '</span></nav>' +
    '<div class="page-head c-' + CFG.couleur + '"><div class="ico">' + esc(CFG.ico) + '</div><div><h1>' + esc(CFG.titre) + '</h1>' +
    '<div class="sub">' + esc(CFG.sousTitre) + '</div></div></div>' +
    '<div class="labo-mode chips" role="tablist">' +
    '<button class="chip" data-mode="guide" role="tab">' + I("book-open") + ' Parcours guidé</button>' +
    '<button class="chip" data-mode="libre" role="tab">' + I("pencil-line") + ' Bac à sable</button>' +
    '<span class="labo-score" id="lc-score"></span></div>' +
    '<div class="labo-lecons" id="lc-lecons"></div>' +
    '<div class="labo-grid">' +
    '<section class="labo-brief" id="lc-brief" aria-live="polite"></section>' +
    '<section class="labo-work">' +
    '<div class="code-ed"><div class="code-bar"><span class="code-file">' + I("code") + ' ' + esc(CFG.fichier) + '</span>' +
    '<span class="code-status" id="lc-status"></span>' +
    '<button class="btn primary" id="lc-run" type="button">' + I("play") + ' Exécuter</button></div>' +
    '<div class="code-area"><pre class="code-gut" id="lc-gut" aria-hidden="true">1</pre>' +
    '<textarea id="lc-src" spellcheck="false" autocapitalize="off" autocomplete="off" aria-label="Éditeur de code"></textarea></div>' +
    '<div class="code-hint">Ctrl + Entrée pour exécuter · Tab pour indenter</div></div>' +
    '<div id="lc-err"></div>' +
    (PY ? '<div class="code-out py-out"><div class="code-url"><i></i><i></i><i></i><span id="lc-url">Console Python</span></div>' +
      '<label class="py-in"><span>Entrées du programme — une valeur par ligne, lues dans l\'ordre par <code>input()</code></span><textarea id="lc-stdin" rows="2" spellcheck="false"></textarea></label>' +
      '<pre id="lc-console" class="py-console" aria-live="polite"></pre><div id="lc-notice"></div></div>' :
    '<div class="code-out"><div class="code-url"><i></i><i></i><i></i><span id="lc-url"></span></div>' +
    (PHP ? '<div class="code-tabs"><button type="button" data-v="rendu" aria-pressed="true">Aperçu</button><button type="button" data-v="source" aria-pressed="false">HTML produit par PHP</button></div>' : '') +
    '<iframe id="lc-frame" title="Aperçu" sandbox="allow-same-origin allow-forms"></iframe><pre id="lc-raw" class="code-raw" hidden></pre>' +
    '<div id="lc-notice"></div></div>') +
    '</section></div>';

  var $ = function (id) { return document.getElementById(id); };
  var brief = $("lc-brief"), src = $("lc-src"), gut = $("lc-gut"), frame = $("lc-frame"), raw = $("lc-raw");
  var mode = "guide", cur = null, results = null, hintShown = false;

  /* ---------- éditeur ---------- */
  function gutter() {
    var n = src.value.split("\n").length, s = "";
    for (var i = 1; i <= n; i++) s += i + "\n";
    gut.textContent = s;
    gut.scrollTop = src.scrollTop;
  }
  var saveT = null;
  function draft() {
    gutter();
    clearTimeout(saveT);
    if (mode === "examen") return;
    saveT = setTimeout(function () { prog.code[cur ? cur.id : "__libre"] = src.value; save(); }, 300);
  }
  src.addEventListener("input", draft);
  src.addEventListener("scroll", function () { gut.scrollTop = src.scrollTop; });
  src.addEventListener("keydown", function (e) {
    var v = src.value, a = src.selectionStart, b = src.selectionEnd;
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); runAndCheck(); return; }
    if (e.key === "Tab") {
      e.preventDefault();
      src.setRangeText(PY ? "    " : "  ", a, b, "end"); draft();
    } else if (e.key === "Enter") {
      var lineStart = v.lastIndexOf("\n", a - 1) + 1, ind = /^[ \t]*/.exec(v.slice(lineStart, a))[0];
      if (PY && /:\s*$/.test(v.slice(lineStart, a))) ind += "    ";
      else if (!PY && /[{>]\s*$/.test(v.slice(lineStart, a)) && !/<\/[^>]*>\s*$/.test(v.slice(lineStart, a)) && !/\/>\s*$/.test(v.slice(lineStart, a))) ind += "  ";
      e.preventDefault();
      src.setRangeText("\n" + ind, a, b, "end"); draft();
    }
  });
  function setCode(c) { src.value = c; gutter(); }

  /* ---------- exécution ---------- */
  var php = null, phpReady = null, queue = Promise.resolve(), status = $("lc-status");
  function ensurePhp() {
    if (phpReady) return phpReady;
    status.textContent = "Chargement de PHP… (une seule fois, quelques secondes)";
    status.className = "code-status wait";
    phpReady = (function tryUrl(i) {
      return import(PHP_URLS[i]).catch(function (e) { if (i + 1 < PHP_URLS.length) return tryUrl(i + 1); throw e; });
    })(0).then(function (mod) {
      php = new mod.PhpWeb();
      php.addEventListener("output", function (e) { php._out += e.detail.join(""); });
      php.addEventListener("error", function (e) { php._out += e.detail.join(""); });
      php._out = "";
      return php.binary;
    }).then(function () {
      status.textContent = "PHP 8.4 · prêt"; status.className = "code-status ok";
    }).catch(function (e) {
      status.textContent = "PHP n'a pas pu se charger (connexion ?)"; status.className = "code-status ko";
      phpReady = null; throw e;
    });
    return phpReady;
  }
  /* ---------- Python (Pyodide dans un Web Worker) ---------- */
  var worker = null, wReady = null, wSeq = 0, wWait = {};
  function startWorker() {
    status.textContent = "Chargement de Python… (une seule fois, quelques secondes)"; status.className = "code-status wait";
    worker = new Worker(new URL("py-worker.js", HERE).href, { type: "module" });
    wReady = new Promise(function (ok, ko) {
      worker.onmessage = function (e) {
        var d = e.data;
        if (d.pret) { status.textContent = "Python " + d.version + " · prêt"; status.className = "code-status ok"; ok(); return; }
        if (d.echec) { status.textContent = "Python n'a pas pu se charger"; status.className = "code-status ko"; ko(new Error(d.echec)); return; }
        var w = wWait[d.id]; if (w) { delete wWait[d.id]; clearTimeout(w.t); w.ok(d.out); }
      };
      worker.onerror = function (e) { ko(e); };
    });
    wReady.catch(function () {});
    return wReady;
  }
  function runPy(code, stdin) {
    if (!worker) startWorker();
    return wReady.then(function () {
      return new Promise(function (ok) {
        var id = ++wSeq;
        wWait[id] = { ok: ok, t: setTimeout(function () {
          /* boucle infinie probable : on coupe et on relance Python */
          Object.keys(wWait).forEach(function (k) { clearTimeout(wWait[k].t); wWait[k].ok(k == id ? "⏱ Programme arrêté au bout de 5 secondes : il tourne en boucle ? (vérifie la condition de ton while)\nTimeoutError: temps dépassé\n" : ""); });
          wWait = {}; worker.terminate(); worker = null; startWorker();
        }, 5000) };
        worker.postMessage({ id: id, code: code, stdin: stdin || [] });
      });
    });
  }
  function b64(o) { return btoa(unescape(encodeURIComponent(JSON.stringify(o || {})))); }
  /* req = { method, get, post } ; renvoie la sortie (texte) */
  function execute(code, req) {
    req = req || {};
    if (PY) {
      var job0 = queue.then(function () { return runPy(code, req.stdin); });
      queue = job0.catch(function () {});
      return job0;
    }
    if (!PHP) return Promise.resolve(code);
    var job = queue.then(function () { return ensurePhp(); }).then(function () {
      return php.refresh();
    }).then(function () {
      php._out = "";
      var pre = "<?php $_GET=json_decode(base64_decode('" + b64(req.get) + "'),true);$_POST=json_decode(base64_decode('" + b64(req.post) + "'),true);" +
        "$_REQUEST=array_merge($_GET,$_POST);$_SERVER['REQUEST_METHOD']='" + (req.method === "post" ? "POST" : "GET") + "';" +
        "$_SERVER['QUERY_STRING']=http_build_query($_GET);error_reporting(E_ALL);ini_set('display_errors','1'); ?>";
      return php.run(pre + code).catch(function () { /* l'erreur est déjà dans la sortie */ });
    }).then(function () {
      return php._out.replace(/php-wasm run script/g, CFG.fichier).replace(/^\n+/, "");
    });
    queue = job.catch(function () {});
    return job;
  }

  /* ---------- aperçu ---------- */
  var current = { req: {}, out: "" };
  function urlFor(req) {
    var q = req.get && Object.keys(req.get).length ? "?" + Object.keys(req.get).map(function (k) { return encodeURIComponent(k) + "=" + encodeURIComponent(req.get[k]); }).join("&") : "";
    return "http://localhost/" + (PHP ? CFG.fichier : CFG.fichier) + q + (req.method === "post" ? "   (POST)" : "");
  }
  function notice(html) { $("lc-notice").innerHTML = html ? '<div class="code-notice">' + html + '</div>' : ""; }
  var AIDE_PY = {
    SyntaxError: "Erreur de syntaxe : regarde la ligne indiquée (un <code>:</code> oublié après if/for/def ? une parenthèse ou un guillemet non fermé ?).",
    IndentationError: "Problème d'indentation : le bloc après <code>:</code> doit être décalé de 4 espaces, toujours les mêmes.",
    NameError: "Variable ou fonction inconnue : faute de frappe ? variable utilisée avant d'être créée ? guillemets oubliés autour d'un texte ?",
    TypeError: "Types incompatibles : par exemple un texte + un nombre. <code>input()</code> renvoie toujours du texte : convertis avec <code>int()</code> ou <code>float()</code>.",
    ValueError: "Valeur impossible à convertir : par exemple <code>int(\"abc\")</code>. Vérifie les entrées du programme.",
    ZeroDivisionError: "Division par zéro.",
    IndexError: "Indice hors de la liste : le dernier élément d'une liste de n éléments a l'indice n - 1.",
    EOFError: "Le programme attend une saisie avec <code>input()</code> mais il n'y a plus de valeur : ajoute-la dans « Entrées du programme ».",
    TimeoutError: "Le programme ne s'arrête pas : une boucle <code>while</code> dont la condition reste toujours vraie ?"
  };
  function showErr(out) {
    if (PY) {
      var lines = (out || "").split("\n").filter(Boolean), last = lines.filter(function (l) { return /^\w+(Error|Exception)\b/.test(l); }).pop();
      if (!last || !ERR.test(out)) { $("lc-err").innerHTML = ""; return; }
      var ln = /File "main\.py", line (\d+)/.exec(out), type = last.split(":")[0];
      $("lc-err").innerHTML = '<div class="code-erreur"><b>' + esc(type) + (ln ? " · ligne " + ln[1] : "") + '</b><code>' + esc(last) + '</code><span>' + (AIDE_PY[type] || "Lis le message : il indique la ligne et la nature du problème.") + '</span></div>';
      return;
    }
    var m = ERR.exec(out || "");
    if (!m) { $("lc-err").innerHTML = ""; return; }
    var line = out.split("\n").filter(function (l) { return ERR.test(l); })[0];
    $("lc-err").innerHTML = '<div class="code-erreur"><b>Erreur PHP</b><code>' + esc(line.replace(/<[^>]+>/g, "")) + '</code>' +
      '<span>Regarde le numéro de ligne, puis la ligne juste au-dessus (un <code>;</code> oublié ?).</span></div>';
  }
  function render(out, req) {
    current = { req: req || {}, out: out };
    if (PY) {
      $("lc-console").textContent = out || "(le programme n'a rien affiché)";
      showErr(out);
      return Promise.resolve();
    }
    $("lc-url").textContent = urlFor(current.req);
    raw.textContent = out || "(aucune sortie)";
    showErr(out);
    return new Promise(function (ok) {
      frame.onload = function () { hook(); ok(); };
      frame.srcdoc = out || "";
    });
  }
  function paramsOf(form, submitter) {
    var fd; try { fd = new FormData(form, submitter); } catch (e) { fd = new FormData(form); if (submitter && submitter.name) fd.append(submitter.name, submitter.value); }
    var o = {};
    fd.forEach(function (v, k) {
      var key = k.replace(/\[\]$/, "");
      if (/\[\]$/.test(k)) { (o[key] = o[key] || []).push(String(v)); } else o[k] = String(v);
    });
    return o;
  }
  function parseQuery(href) {
    var o = {}, q = (href.split("?")[1] || "").split("#")[0];
    q.split("&").forEach(function (p) { if (!p) return; var kv = p.split("="); o[decodeURIComponent(kv[0])] = decodeURIComponent((kv[1] || "").replace(/\+/g, " ")); });
    return o;
  }
  function hook() {
    var d = frame.contentDocument; if (!d) return;
    d.addEventListener("submit", function (e) {
      e.preventDefault();
      var f = e.target, method = (f.getAttribute("method") || "get").toLowerCase(), action = f.getAttribute("action") || "";
      var data = paramsOf(f, e.submitter);
      if (PHP && (!action || action === CFG.fichier || action.charAt(0) === "?")) {
        var req = method === "post" ? { method: "post", get: parseQuery(action), post: data } : { method: "get", get: data, post: {} };
        execute(src.value, req).then(function (out) { return render(out, req); }).then(function () {
          notice("Formulaire envoyé en <b>" + method.toUpperCase() + "</b> : " + esc(JSON.stringify(data)));
        });
      } else {
        var rows = Object.keys(data).map(function (k) { return "<tr><td><code>" + esc(k) + "</code></td><td>" + esc(String(data[k])) + "</td></tr>"; }).join("");
        notice("Le formulaire serait envoyé à <code>" + esc(action || "(cette page)") + "</code> en <b>" + method.toUpperCase() + "</b> avec :" +
          (rows ? '<table class="code-data">' + rows + "</table>" : " aucune donnée (pense à l'attribut <code>name</code>)."));
      }
    });
    d.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a[href]"); if (!a) return;
      e.preventDefault();
      var href = a.getAttribute("href");
      if (PHP && (href.charAt(0) === "?" || href.indexOf(CFG.fichier + "?") === 0)) {
        var req = { method: "get", get: parseQuery(href), post: {} };
        execute(src.value, req).then(function (out) { return render(out, req); });
        notice("Lien suivi : <code>" + esc(href) + "</code>");
      } else notice("Lien vers <code>" + esc(href) + "</code>" + (a.target === "_blank" ? " (nouvel onglet)" : "") + " — non suivi dans l'aperçu.");
    });
  }
  main.addEventListener("click", function (e) {
    var t = e.target.closest(".code-tabs button"); if (!t) return;
    main.querySelectorAll(".code-tabs button").forEach(function (b) { b.setAttribute("aria-pressed", String(b === t)); });
    var srcView = t.dataset.v === "source"; raw.hidden = !srcView; frame.hidden = srcView;
  });

  /* ---------- vérification ---------- */
  function rx(s, f) { return new RegExp(s, f || "m"); }
  function norm(t) { return (t || "").replace(/\s+/g, " ").trim(); }
  function checkDoc(d, r, win) {
    var k = Object.keys(r)[0], v = r[k], q;
    switch (k) {
      case "dom": return !!d.querySelector(v);
      case "min": return d.querySelectorAll(v[0]).length >= v[1];
      case "count": return d.querySelectorAll(v[0]).length === v[1];
      case "text": return [].some.call(d.querySelectorAll(v[0]), function (n) { return rx(v[1], "i").test(norm(n.textContent)); });
      case "attr": return [].some.call(d.querySelectorAll(v[0]), function (n) { return n.hasAttribute(v[1]) && rx(v[2], "i").test(n.getAttribute(v[1])); });
      case "style":
        if (!win) return false;
        q = d.querySelectorAll(v[0]);
        return q.length > 0 && [].every.call(q, function (n) { return rx(v[2], "i").test(win.getComputedStyle(n).getPropertyValue(v[1]).trim()); });
    }
    return null;
  }
  function checkRule(r, code) {
    var k = Object.keys(r)[0], v = r[k];
    switch (k) {
      case "code": return Promise.resolve(rx(v).test(code));
      case "codei": return Promise.resolve(rx(v, "mi").test(code));
      case "nocode": return Promise.resolve(!rx(v, "mi").test(code));
      case "out": return Promise.resolve(rx(v).test(current.out));
      case "notout": return Promise.resolve(!rx(v).test(current.out));
      case "noerr": return Promise.resolve(!ERR.test(current.out));
      case "test":
        var req = PY ? { stdin: v.stdin || [] } : { method: v.post ? "post" : "get", get: v.get || {}, post: v.post || {} };
        return execute(v.apres ? code + "\n" + v.apres + "\n" : code, req).then(function (out) {
          if (v.out && !rx(v.out).test(out)) return false;
          if (v.notout && rx(v.notout).test(out)) return false;
          if (ERR.test(out)) return false;
          if (v.dom && !PY) { var d = new DOMParser().parseFromString(out, "text/html"); if (!d.querySelector(v.dom)) return false; }
          return true;
        });
      default:
        var d2 = frame.contentDocument, res = d2 ? checkDoc(d2, r, frame.contentWindow) : false;
        return Promise.resolve(res === null ? false : res);
    }
  }
  function checkAll(m, code) {
    var res = [];
    return m.objectifs.reduce(function (p, o, i) {
      return p.then(function () {
        return o.r.reduce(function (pp, r) { return pp.then(function (ok) { return ok ? checkRule(r, code) : false; }); }, Promise.resolve(true))
          .then(function (ok) { res[i] = ok; });
      });
    }, Promise.resolve()).then(function () { return res; });
  }

  var running = false;
  function runAndCheck() {
    if (running) return;
    running = true;
    var btn = $("lc-run"), code = src.value, req = PY ? { stdin: stdinLines() } : cur ? { method: cur.post ? "post" : "get", get: cur.get || {}, post: cur.post || {} } : {};
    btn.disabled = true; notice("");
    execute(code, req).then(function (out) { return render(out, req); }).then(function () {
      if (mode === "examen") return evalExamen(code);
      if (mode !== "guide" || !cur) return;
      if (PY && /TimeoutError: temps dépassé/.test(current.out)) { results = cur.objectifs.map(function () { return false; }); renderBrief(false); return; }
      return checkAll(cur, code).then(function (res) {
        results = res;
        var ok = res.every(Boolean);
        if (ok && !prog.done[cur.id]) { prog.done[cur.id] = 1; save(); score(); renderLecons(); }
        renderBrief(ok);
      });
    }).catch(function () {
      notice("Impossible d'exécuter le code : PHP n'est pas chargé. Vérifie ta connexion puis réessaie.");
    }).then(function () { running = false; btn.disabled = false; });
  }
  $("lc-run").addEventListener("click", runAndCheck);
  function stdinLines() { var t = $("lc-stdin"); return t && t.value.length ? t.value.replace(/\n$/, "").split("\n") : []; }
  if (PY) $("lc-stdin").addEventListener("keydown", function (e) { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); runAndCheck(); } });

  /* ---------- parcours ---------- */
  function score() {
    var n = all.filter(function (m) { return prog.done[m.id]; }).length;
    $("lc-score").innerHTML = I("trophy") + " " + n + " / " + all.length + " missions";
  }
  function renderLecons() {
    var box = $("lc-lecons");
    if (mode !== "guide") { box.innerHTML = ""; box.hidden = true; return; }
    box.hidden = false;
    box.innerHTML = CFG.lecons.map(function (l, li) {
      var d = l.missions.filter(function (m) { return prog.done[m.id]; }).length;
      return '<div class="labo-lecon' + (cur && cur.lecon === l ? " on" : "") + (d === l.missions.length ? " fini" : "") + '">' +
        '<div class="ll-t"><span class="ll-n">' + (li + 1) + '</span>' + esc(l.titre) + '<span class="ll-c">' + d + "/" + l.missions.length + '</span></div>' +
        '<div class="ll-dots">' + l.missions.map(function (m, mi) {
          return '<a href="#m=' + m.id + '" class="' + (prog.done[m.id] ? "ok" : "") + (cur === m ? " cur" : "") + '" title="' + esc(m.titre) + '">' + (mi + 1) + '</a>';
        }).join("") + '</div></div>';
    }).join("");
  }
  function renderBrief(win) {
    var m = cur, idx = all.indexOf(m);
    var h = '<div class="lb-kicker">Leçon ' + (m.li + 1) + ' · ' + esc(m.lecon.titre) + ' — mission ' + (m.mi + 1) + '/' + m.lecon.missions.length + '</div>' +
      '<h2>' + esc(m.titre) + '</h2><div class="lb-texte">' + m.texte + '</div>' +
      '<h3>Objectifs</h3><ul class="labo-goals">' + m.objectifs.map(function (o, i) {
        var st = results ? (results[i] ? "ok" : "ko") : "";
        return '<li class="' + st + '"><span class="ck">' + (st === "ok" ? "✓" : st === "ko" ? "✗" : "") + '</span><span class="gt">' + o.txt + '</span></li>';
      }).join("") + '</ul>' +
      (results ? "" : '<p class="lb-small" style="margin-top:8px">Écris ton code puis clique sur <b>Exécuter</b> : les objectifs sont vérifiés à chaque exécution.</p>');
    if (win) {
      h += '<div class="box retenir lb-win"><b>Mission réussie</b><p>' + (m.bravo || "Tous les objectifs sont validés.") + '</p>' +
        (all[idx + 1] ? '<a class="btn primary" href="#m=' + all[idx + 1].id + '">Mission suivante →</a>' :
          '<p><b>Parcours terminé !</b> Continue dans le bac à sable.</p>') + '</div>';
    }
    h += '<div class="lb-actions"><button class="btn" id="lc-hint" type="button">' + I("lightbulb") + ' Indice</button>' +
      (hintShown ? '<button class="btn" id="lc-sol" type="button">Voir la solution</button>' : "") +
      '<button class="btn" id="lc-reset" type="button">' + I("rotate-ccw") + ' Code de départ</button></div><div id="lc-help"></div>' +
      '<div class="lb-nav">' +
      (all[idx - 1] ? '<a href="#m=' + all[idx - 1].id + '">← ' + esc(all[idx - 1].titre) + '</a>' : '<span></span>') +
      (all[idx + 1] ? '<a href="#m=' + all[idx + 1].id + '">' + esc(all[idx + 1].titre) + ' →</a>' : '<span></span>') + '</div>';
    brief.innerHTML = h;
    $("lc-hint").onclick = function () {
      hintShown = true; renderBrief(win);
      $("lc-help").innerHTML = '<div class="box attention"><b>Indice</b><p>' + m.indice + '</p></div>';
    };
    if ($("lc-sol")) $("lc-sol").onclick = function () {
      $("lc-help").innerHTML = '<div class="box"><b>Solution</b><pre class="code-sol">' + esc(m.solution) + '</pre>' +
        '<button class="btn" type="button" id="lc-use">Remplacer mon code par la solution</button></div>';
      $("lc-use").onclick = function () { setCode(m.solution); draft(); src.focus(); };
    };
    $("lc-reset").onclick = function () {
      if (src.value !== m.depart && !window.confirm("Remettre le code de départ ? Ton code actuel sera perdu.")) return;
      setCode(m.depart); draft(); results = null; renderBrief(false);
    };
  }
  function open(m) {
    cur = m; results = null; hintShown = false;
    prog.last = m.id; save();
    setCode(prog.code[m.id] != null ? prog.code[m.id] : m.depart);
    renderBrief(false); renderLecons(); notice("");
    if (PY) {
      $("lc-stdin").value = (m.stdin || []).join("\n");
      $("lc-console").textContent = "Clique sur Exécuter pour lancer ton programme.";
      $("lc-err").innerHTML = "";
      return;
    }
    var req = { method: m.post ? "post" : "get", get: m.get || {}, post: m.post || {} };
    execute(src.value, req).then(function (out) { return render(out, req); }).catch(function () {});
  }
  function openLibre() {
    cur = null; results = null;
    brief.innerHTML = '<div class="lb-kicker">Mode libre</div><h2>Bac à sable</h2><div class="lb-texte">' + CFG.libreTexte + '</div>' +
      '<div class="lb-actions"><button class="btn" id="lc-reset" type="button">' + I("rotate-ccw") + ' Code de départ</button></div>';
    $("lc-reset").onclick = function () { setCode(CFG.libre); draft(); runAndCheck(); };
    setCode(prog.code.__libre != null ? prog.code.__libre : CFG.libre);
    renderLecons(); notice("");
    if (PY) { $("lc-stdin").value = ""; $("lc-console").textContent = "Clique sur Exécuter pour lancer ton programme."; $("lc-err").innerHTML = ""; return; }
    execute(src.value, {}).then(function (out) { return render(out, {}); }).catch(function () {});
  }

  /* ---------- évaluation pratique (#examen) ---------- */
  var E = null, MID = document.body.dataset.module;
  function hasard(a) { return a[Math.floor(Math.random() * a.length)]; }
  function examen() {
    mode = "examen"; main.classList.add("en-examen");
    var ctx = EF.examBlancCtx(MID), nEx = ctx ? ctx.n : 3, dureeEx = ctx ? Math.max(1, (ctx.fin - Date.now()) / 1000) : 900;
    var lecons = CFG.lecons.slice().sort(function () { return Math.random() - 0.5; }).slice(0, nEx);
    E = { ctx: ctx, list: lecons.map(function (l) { return hasard(l.missions); }), i: 0, ok: [], fini: false };
    E.chrono = EF.examChrono(ctx ? "Examen blanc · partie pratique" : CFG.titre, dureeEx, function () { finExamen(); });
    main.querySelector(".labo-grid").insertAdjacentElement("beforebegin", E.chrono.el);
    examOpen(0);
  }
  function examOpen(i) {
    E.i = i; cur = E.list[i]; results = null;
    E.chrono.pos("mission " + (i + 1) + "/" + E.list.length);
    setCode(cur.depart); notice(""); $("lc-err").innerHTML = "";
    if (PY) { $("lc-stdin").value = (cur.stdin || []).join("\n"); $("lc-console").textContent = "Clique sur Exécuter pour lancer ton programme."; }
    else {
      var req = { method: cur.post ? "post" : "get", get: cur.get || {}, post: cur.post || {} };
      execute(src.value, req).then(function (out) { return render(out, req); }).catch(function () {});
    }
    examBrief(); src.focus();
  }
  function examBrief() {
    var der = E.i + 1 >= E.list.length, ok = E.ok[E.i];
    brief.innerHTML = '<div class="lb-kicker">Mission ' + (E.i + 1) + ' sur ' + E.list.length + '</div><h2>' + esc(cur.titre) + '</h2>' +
      '<div class="lb-texte">' + cur.texte + '</div>' +
      '<h3>Objectifs</h3><ul class="labo-goals">' + cur.objectifs.map(function (o, i) {
        var st = results ? (results[i] ? "ok" : "ko") : "";
        return '<li class="' + st + '"><span class="ck">' + (st === "ok" ? "✓" : st === "ko" ? "✗" : "") + '</span><span class="gt">' + o.txt + '</span></li>';
      }).join("") + '</ul>' +
      (ok ? '<div class="box retenir lb-win"><b>Mission réussie</b><p>' + (der ? "C'était la dernière." : "Passage à la suivante…") + '</p></div>'
        : '<p class="lb-small" style="margin-top:10px">Pas d\'indice ni de solution pendant l\'épreuve. Clique sur <b>Exécuter</b> pour faire vérifier ton code.</p>') +
      '<div class="lb-actions">' + (der ? '' : '<button class="btn" id="ex-next" type="button">' + (ok ? "Mission suivante →" : "Passer cette mission →") + '</button>') +
      '<button class="btn' + (der ? ' primary' : '') + '" id="ex-fin" type="button">Terminer l\'évaluation</button></div>';
    if ($("ex-next")) $("ex-next").onclick = function () { examOpen(E.i + 1); };
    $("ex-fin").onclick = function () {
      if (E.ok.filter(Boolean).length < E.list.length && !window.confirm("Terminer maintenant ? Les missions non réussies compteront comme ratées.")) return;
      finExamen();
    };
  }
  function evalExamen(code) {
    if (E.fini) return;
    if (PY && /TimeoutError: temps dépassé/.test(current.out)) { results = cur.objectifs.map(function () { return false; }); examBrief(); return; }
    var i = E.i;
    return checkAll(cur, code).then(function (res) {
      if (E.fini || E.i !== i) return;
      results = res;
      if (res.every(Boolean) && !E.ok[i]) {
        E.ok[i] = true;
        setTimeout(function () {
          if (E.fini || E.i !== i) return;
          if (E.ok.filter(Boolean).length === E.list.length) finExamen();
          else if (i + 1 < E.list.length) examOpen(i + 1);
        }, 1300);
      }
      examBrief();
    });
  }
  function SOL(m) { return Array.isArray(m.solution) ? m.solution.join("\n") : m.solution; }
  function finExamen() {
    if (E.fini) return; E.fini = true;
    var rest = E.chrono.restant(); E.chrono.stop(); E.chrono.el.remove();
    var box = main.querySelector(".labo-grid"); box.className = "labo-resultat";
    if (E.ctx) {
      try { sessionStorage.removeItem("ef-examen-blanc"); } catch (e) { /* rien */ }
      EF.examBlancResultat(box, { ctx: E.ctx, restant: rest, racine: "../../",
        missions: E.list.map(function (m, i) { return { titre: m.titre, ok: !!E.ok[i], solution: SOL(m) }; }) });
      return;
    }
    EF.examResultat(box, {
      mid: MID, titre: CFG.titre, couleur: CFG.couleur, racine: "../../", duree: 900, coef: 150, restant: rest,
      retour: location.pathname.split("/").pop(),
      missions: E.list.map(function (m, i) { return { titre: m.titre, ok: !!E.ok[i], solution: m.solution }; }),
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
    if (mode === "libre") openLibre(); else open((m && byId(m[1])) || byId(prog.last) || firstTodo());
  }
  main.querySelector(".labo-mode").addEventListener("click", function (e) {
    var b = e.target.closest(".chip"); if (!b) return;
    location.hash = b.dataset.mode === "libre" ? "#libre" : "#m=" + ((cur && cur.id) || prog.last || firstTodo().id);
  });
  window.addEventListener("hashchange", route);
  /* accès pour les tests automatiques */
  window.EFCodeLab = { missions: all, verify: function (m, code) {
    cur = m; var req = PY ? { stdin: m.stdin || [] } : { method: m.post ? "post" : "get", get: m.get || {}, post: m.post || {} };
    return execute(code, req).then(function (out) { return render(out, req); }).then(function () { return checkAll(m, code); });
  } };
  if (PHP) ensurePhp().catch(function () {});
  if (PY) startWorker();
  score(); route();
})();
