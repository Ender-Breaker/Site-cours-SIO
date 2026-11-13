/* Étude Facile — blocs « Essaie ce code » dans les cours (Lua, C++, Java, JavaScript).
   Dans le cours :  <div class="essai" data-langue="lua" data-stdin="17&#10;4"><pre><code>…</code></pre></div>
   Le bloc devient un petit éditeur : on modifie, on exécute, la sortie s'affiche dessous.
   data-stdin  : entrées du programme (une par ligne), modifiables.
   data-erreur : le programme est censé produire une erreur (exemple d'erreur commentée).
   À charger après app.js et jeu.js, avant chapter.js. */
(function () {
  "use strict";
  var EF = window.EtudeFacile || {}, I = EF.icon || function () { return ""; };
  var FICHIER = { lua: "main.lua", cpp: "main.cpp", java: "Main.java", js: "main.js" };
  var ATTENTE = { lua: "Exécution…", js: "Exécution…", cpp: "Compilation… (quelques secondes la première fois)", java: "Compilation…" };
  var runners = {}, file = Promise.resolve();
  function runner(l) { return runners[l] || (runners[l] = window.EFJeu.runner(l)); }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function lignes(t) { return Math.max(2, t.split("\n").length); }

  function lance(box) {
    var ta = box.querySelector(".essai-src"), sin = box.querySelector(".essai-stdin"), out = box.querySelector(".essai-out"), btn = box.querySelector(".essai-run");
    var lang = box.dataset.langue, code = ta.value;
    var stdin = sin && sin.value.length ? sin.value.replace(/\n$/, "").split("\n") : [];
    out.hidden = false; out.className = "essai-out attente"; out.textContent = ATTENTE[lang] || "Exécution…"; btn.disabled = true;
    var job = file.then(function () { return runner(lang).console(code, stdin); }).then(function (r) {
      r = r || {};
      var o = r.out || "";
      out.className = "essai-out" + (r.err ? " ko" : "");
      out.innerHTML = (o ? esc(o) : (r.err ? "" : '<i>(le programme n\'affiche rien)</i>')) + (r.err ? (o && !/\n$/.test(o) ? "\n" : "") + '<b>' + esc(r.err) + '</b>' : "");
      btn.disabled = false;
      return { out: o, err: r.err || "", code: code };
    }, function (e) {
      out.className = "essai-out ko"; out.textContent = "Impossible de lancer le programme. Recharge la page."; btn.disabled = false;
      return { out: "", err: String(e), code: code };
    });
    file = job.catch(function () {});
    return job;
  }

  function monte(box) {
    var pre = box.querySelector("pre"); if (!pre) return;
    var lang = box.dataset.langue || "lua";
    var code = pre.textContent.replace(/^\n/, "").replace(/\s+$/, "");
    var stdin = box.dataset.stdin;
    box.innerHTML =
      '<div class="essai-bar"><span class="essai-f">' + I("code") + ' ' + FICHIER[lang] + ' <small>modifie et relance</small></span>' +
      '<button type="button" class="essai-reset" title="Remettre le code de départ" aria-label="Remettre le code de départ">' + I("rotate-ccw") + '</button>' +
      '<button type="button" class="btn primary essai-run">' + I("play") + ' Exécuter</button></div>' +
      '<textarea class="essai-src" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" wrap="off" aria-label="Code à essayer"></textarea>' +
      (stdin != null ? '<label class="essai-in"><span>Entrées du programme (une par ligne)</span><textarea class="essai-stdin" spellcheck="false" autocapitalize="off" rows="' + lignes(stdin) + '"></textarea></label>' : '') +
      '<div class="essai-out" hidden aria-live="polite"></div>';
    var ta = box.querySelector(".essai-src");
    ta.value = code; ta.rows = lignes(code);
    if (stdin != null) box.querySelector(".essai-stdin").value = stdin;
    ta.addEventListener("input", function () { ta.rows = lignes(ta.value); });
    ta.addEventListener("keydown", function (e) {
      if (e.key === "Tab" && !e.shiftKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        var s = ta.selectionStart, f = ta.selectionEnd;
        ta.value = ta.value.slice(0, s) + "  " + ta.value.slice(f); ta.selectionStart = ta.selectionEnd = s + 2;
      } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); lance(box); }
    });
    box.querySelector(".essai-run").addEventListener("click", function () { lance(box); });
    box.querySelector(".essai-reset").addEventListener("click", function () {
      ta.value = code; ta.rows = lignes(code);
      if (stdin != null) box.querySelector(".essai-stdin").value = stdin;
      var o = box.querySelector(".essai-out"); o.hidden = true; o.textContent = "";
    });
  }

  Array.prototype.forEach.call(document.querySelectorAll(".essai"), monte);
  window.EFEssai = { lance: lance };
})();
