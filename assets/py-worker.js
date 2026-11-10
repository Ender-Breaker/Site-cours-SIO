/* Étude Facile — exécute du Python (Pyodide) hors du fil principal.
   Message reçu : { id, code, stdin: [lignes] }  →  renvoyé : { id, out, erreur } */
var BASE = new URL("vendor/pyodide/", import.meta.url).href;
var py = null;
var ready = import(BASE + "pyodide.mjs").then(function (m) {
  return m.loadPyodide({ indexURL: BASE });
}).then(function (p) {
  py = p;
  self.postMessage({ pret: true, version: py.runPython("import sys; sys.version.split()[0]") });
}).catch(function (e) {
  self.postMessage({ echec: String(e && e.message || e) });
});

function nettoie(tb) {
  /* garde l'en-tête, les lignes du programme de l'élève et la ligne d'erreur finale */
  var l = tb.split("\n"), out = [], garder = false;
  l.forEach(function (x) {
    if (/^Traceback/.test(x)) { out.push(x); return; }
    if (/^\s+File "/.test(x)) { garder = /File "main\.py"/.test(x); if (garder) out.push(x); return; }
    if (garder && /^\s{4}/.test(x)) { out.push(x); return; }
    if (/^\S/.test(x)) { garder = false; out.push(x); }
  });
  return out.join("\n").trim();
}

var file = ready;
self.onmessage = function (e) {
  var d = e.data;
  file = file.then(function () { return lance(d); });
};
function lance(d) {
  return Promise.resolve().then(function () {
    if (!py) throw new Error("Python indisponible");
    var out = "", dec = new TextDecoder(), i = 0, stdin = d.stdin || [];
    var ecrit = { write: function (b) { out += dec.decode(b, { stream: true }); return b.length; } };
    py.setStdout(ecrit); py.setStderr(ecrit);
    py.setStdin({ stdin: function () {
      if (i < stdin.length) { var v = String(stdin[i++]); out += v + "\n"; return v; }
      return null;
    }, autoEOF: true });
    py.runPython("import linecache; linecache.clearcache()");
    var g = py.globals.get("dict")();
    return py.runPythonAsync(d.code, { globals: g, filename: "main.py" }).then(function () {
      return null;
    }, function (err) {
      return nettoie(String(err && err.message || err));
    }).then(function (erreur) {
      try { py.runPython("import sys\nsys.stdout.flush()\nsys.stderr.flush()"); } catch (x) { /* rien */ }
      g.destroy();
      if (erreur) out += (out && !/\n$/.test(out) ? "\n" : "") + erreur + "\n";
      self.postMessage({ id: d.id, out: out, erreur: erreur });
    });
  }).catch(function (err) {
    self.postMessage({ id: d.id, out: "", erreur: "Python indisponible : " + (err && err.message || err) });
  });
}
