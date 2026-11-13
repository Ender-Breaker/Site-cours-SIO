/* Étude Facile — exécution de programmes et de jeux (JavaScript, Lua, C++, Java) pour les labos.
   window.EFJeu = {
     runner(lang)            → { console(code, stdin) → Promise<{out, err, temps}>,
                                 jeu(code) → Promise<session>, phase(fn) }
     session                 → { out, err, q (dessins du setup), frame(dt, inp) → Promise<{q, out, err}>, stop() }
     ecran(canvas)           → { dessine(q), entree() → inp, fin() }   (clavier + souris)
     boucle(session, ecran, onLog, onErr) → stop()
     scenario(lang, code, etapes) → Promise<{ S (dessins du setup), F: [dessins par image], O (sortie), E (erreur) }>
     estJeu(lang, code)      → vrai si le programme définit draw / update (ou étend Jeu en Java)
   }
   Une étape de scénario : { n: nombre d'images, k: [touches maintenues], p: [touches appuyées à la 1re image], souris: {x, y, clic} }.
   Noms des touches : gauche, droite, haut, bas, espace, entree, echap, a…z, 0…9. */
(function () {
  "use strict";
  var HERE = (document.currentScript && document.currentScript.src) || location.href;
  var BASE = new URL(".", HERE).href;
  var DT = 1 / 60;

  /* ------------------------------------------------------------ JS / Lua / C++ : worker */
  function WorkerRunner(lang) {
    var self = this, w = null, seq = 0, attente = {}, onPhase = null;
    function demarre() {
      w = new Worker(BASE + "run-jeu.js", { type: "module" });
      w.postMessage({ t: "init", lang: lang, base: BASE });
      w.onmessage = function (e) {
        var d = e.data, a = attente[d.id];
        if (d.t === "phase") { if (onPhase) onPhase(d.p); if (a && d.p === "run" && a.surRun) a.surRun(); return; }
        if (!a) return;
        delete attente[d.id]; clearTimeout(a.t);
        a.ok(d);
      };
      w.onerror = function (e) { Object.keys(attente).forEach(function (k) { attente[k].ok({ err: "Erreur interne : " + (e.message || "worker") }); }); attente = {}; };
    }
    function coupe() { if (w) w.terminate(); w = null; Object.keys(attente).forEach(function (k) { clearTimeout(attente[k].t); }); attente = {}; }
    /* envoie un message ; le délai démarre tout de suite (JS, Lua) ou après la compilation (C++) */
    function envoie(msg, delai, msgDelai) {
      if (!w) demarre();
      return new Promise(function (ok) {
        var id = ++seq; msg.id = id;
        var a = attente[id] = { ok: ok };
        function arme() { a.t = setTimeout(function () { coupe(); ok({ out: "", err: msgDelai, temps: true }); }, delai); }
        if (lang === "cpp" && msg.t !== "frame") { a.surRun = arme; a.t = setTimeout(function () { coupe(); ok({ out: "", err: "La compilation a pris trop de temps. Réessaie.", temps: true }); }, 120000); }
        else arme();
        w.postMessage(msg);
      });
    }
    self.phase = function (fn) { onPhase = fn; };
    self.console = function (code, stdin) {
      return envoie({ t: "console", code: code, stdin: stdin || [] }, 5000,
        "Programme arrêté au bout de 5 secondes : il tourne en boucle sans fin ? (ou il attend une entrée qui n'existe pas)");
    };
    self.jeu = function (code) {
      return envoie({ t: "jeu", code: code }, 4000, "Le setup du jeu ne se termine pas : une boucle sans fin ?").then(function (r) {
        var vivant = !r.err, sid = r.sid;
        return {
          out: r.out || "", err: r.err || "", q: r.q || [],
          frame: function (dt, inp) {
            if (!vivant) return Promise.resolve({ q: [], out: "", err: "" });
            return envoie({ t: "frame", sid: sid, dt: dt, inp: inp }, 2000, "Une image du jeu met plus de 2 secondes à se calculer : une boucle sans fin dans update ou draw ?").then(function (f) {
              if (f.err) vivant = false;
              return f;
            });
          },
          stop: function () { if (vivant && w) w.postMessage({ t: "stop", sid: sid }); vivant = false; }
        };
      });
    };
    self.coupe = coupe;
  }

  /* ------------------------------------------------------------ Java : javac + TeaVM (worker de @live-codes/java-wasm) */
  var JAVA_JEU = "\nabstract class Jeu {\n" +
    "  public static final int LARGEUR = 480, HAUTEUR = 320;\n" +
    "  public void setup() {}\n  public void update(double dt) {}\n  public void draw() {}\n" +
    "  @org.teavm.jso.JSFunctor interface EfImage extends org.teavm.jso.JSObject { void appel(double dt); }\n" +
    "  @org.teavm.jso.JSBody(script = \"self.__efq = []; self.__efi = {k:{}, p:{}, mx:0, my:0, c:false, d:false};\") private static native void efInit();\n" +
    "  @org.teavm.jso.JSBody(params = {\"f\"}, script = \"self.addEventListener('message', function (e) { var d = e.data; if (d && d.ef === 'frame') { self.__efq = []; self.__efi = d.inp; var er = ''; try { f(d.dt); } catch (x) { er = String(x && x.message || x); } self.postMessage({ ef: 'img', q: self.__efq, err: er }); } }); self.postMessage({ ef: 'pret', q: self.__efq });\") private static native void efBoucle(EfImage f);\n" +
    "  public static void lancer(Jeu j) { efInit(); j.setup(); efBoucle(dt -> { j.update(dt); j.draw(); }); }\n" +
    "  @org.teavm.jso.JSBody(params = {\"c\"}, script = \"self.__efq.push(['efface', c]);\") public static native void effacer(String c);\n" +
    "  public static void effacer() { effacer(\"black\"); }\n" +
    "  @org.teavm.jso.JSBody(params = {\"x\", \"y\", \"w\", \"h\", \"c\"}, script = \"self.__efq.push(['rect', x, y, w, h, c]);\") public static native void rect(double x, double y, double w, double h, String c);\n" +
    "  @org.teavm.jso.JSBody(params = {\"x\", \"y\", \"r\", \"c\"}, script = \"self.__efq.push(['cercle', x, y, r, c]);\") public static native void cercle(double x, double y, double r, String c);\n" +
    "  @org.teavm.jso.JSBody(params = {\"a\", \"b\", \"x\", \"y\", \"c\", \"e\"}, script = \"self.__efq.push(['ligne', a, b, x, y, c, e]);\") public static native void ligne(double a, double b, double x, double y, String c, double e);\n" +
    "  public static void ligne(double a, double b, double x, double y, String c) { ligne(a, b, x, y, c, 2); }\n" +
    "  @org.teavm.jso.JSBody(params = {\"s\", \"x\", \"y\", \"t\", \"c\"}, script = \"self.__efq.push(['texte', s, x, y, t, c]);\") public static native void texte(String s, double x, double y, double t, String c);\n" +
    "  public static void texte(String s, double x, double y) { texte(s, x, y, 20, \"white\"); }\n" +
    "  @org.teavm.jso.JSBody(params = {\"s\"}, script = \"self.__efq.push(['log', s + '\\\\n']);\") public static native void afficher(String s);\n" +
    "  @org.teavm.jso.JSBody(params = {\"k\"}, script = \"return !!self.__efi.k[k];\") public static native boolean touche(String k);\n" +
    "  @org.teavm.jso.JSBody(params = {\"k\"}, script = \"return !!self.__efi.p[k];\") public static native boolean toucheAppuyee(String k);\n" +
    "  @org.teavm.jso.JSBody(script = \"return self.__efi.mx;\") public static native double sourisX();\n" +
    "  @org.teavm.jso.JSBody(script = \"return self.__efi.my;\") public static native double sourisY();\n" +
    "  @org.teavm.jso.JSBody(script = \"return !!self.__efi.c;\") public static native boolean clic();\n" +
    "  public static int hasard(int a, int b) { return a + (int) (Math.random() * (b - a + 1)); }\n" +
    "}\n";
  var javaCharge = null, javaWorkers = [], javaChaine = Promise.resolve();
  function chargeJava() {
    if (javaCharge) return javaCharge;
    javaCharge = new Promise(function (ok, ko) {
      var W0 = window.Worker;
      window.Worker = function (u, o) { var x = new W0(u, o); javaWorkers.push(x); return x; };
      window.Worker.prototype = W0.prototype;
      var s = document.createElement("script"); s.src = BASE + "vendor/java/java-wasm.iife.js";
      s.onload = function () { ok(); }; s.onerror = function () { javaCharge = null; ko(new Error("java")); };
      document.head.appendChild(s);
    });
    return javaCharge;
  }
  function utf8(s) { try { return decodeURIComponent(escape(s)); } catch (e) { return s; } }
  function errJava(r) {
    var t = (r.error || r.stderr || "").replace(/\r/g, "");
    t = t.replace(/\/?[\w/]*Main\.java/g, "Main.java");
    return utf8(t).trim();
  }
  function JavaRunner() {
    var self = this, rt = null, onPhase = null;
    function nouveau() {
      var p = javaChaine.then(function () { return chargeJava(); }).then(function () {
        var avant = javaWorkers.length;
        var rp = window.JavaWasm.createRuntime({ baseUrl: BASE + "vendor/java/", onProgress: function (p) { if (onPhase) onPhase(p.stage === "generate" || p.stage === "compile" ? "compile" : p.stage); } });
        var w = javaWorkers[javaWorkers.length - 1];
        return rp.then(function (r) { r.__worker = javaWorkers.length > avant ? javaWorkers[avant] : w; return r; });
      });
      javaChaine = p.catch(function () {});
      return p;
    }
    function avecDelai(p, ms, onTemps) {
      return new Promise(function (ok, ko) {
        var t = setTimeout(function () { onTemps(); ok(null); }, ms);
        p.then(function (v) { clearTimeout(t); ok(v); }, function (e) { clearTimeout(t); ko(e); });
      });
    }
    self.phase = function (fn) { onPhase = fn; };
    self.console = function (code, stdin) {
      var p = rt ? Promise.resolve(rt) : nouveau().then(function (r) { rt = r; return r; });
      return p.then(function (r) {
        if (onPhase) onPhase("compile");
        return avecDelai(r.run(code, { input: (stdin || []).join("\n") + "\n" }), 20000, function () { try { r.destroy(); } catch (e) { /* rien */ } rt = null; });
      }).then(function (res) {
        if (!res) return { out: "", err: "Programme arrêté : il tourne en boucle sans fin ? (ou la compilation a été trop longue)", temps: true };
        return { out: utf8(res.stdout || ""), err: res.ok ? "" : errJava(res) };
      });
    };
    self.jeu = function (code) {
      if (!/extends\s+Jeu\b/.test(code)) return Promise.resolve({ out: "", err: "Pour un jeu, ta classe doit étendre Jeu : public class Main extends Jeu { … }", q: [], frame: function () { return Promise.resolve({ q: [] }); }, stop: function () {} });
      return nouveau().then(function (r) {
        var w = r.__worker, pret = null, attente = null;
        var pPret = new Promise(function (ok) { pret = ok; });
        w.addEventListener("message", function (e) {
          var d = e.data;
          if (!d || !d.ef) return;
          if (d.ef === "pret") pret(d);
          if (d.ef === "img" && attente) { var a = attente; attente = null; a(d); }
        });
        if (onPhase) onPhase("compile");
        return avecDelai(r.run(code + JAVA_JEU, {}), 25000, function () { try { r.destroy(); } catch (e) { /* rien */ } }).then(function (res) {
          if (!res) return { out: "", err: "Le jeu ne démarre pas : une boucle sans fin dans setup ou main ?", q: [], frame: function () { return Promise.resolve({ q: [] }); }, stop: function () {} };
          var out = utf8(res.stdout || "");
          if (!res.ok) { try { r.destroy(); } catch (e) { /* rien */ } return { out: out, err: errJava(res), q: [], frame: function () { return Promise.resolve({ q: [] }); }, stop: function () {} }; }
          return avecDelai(pPret, 3000, function () {}).then(function (d) {
            var vivant = !!d;
            var logs = function (q) { var o = ""; q.forEach(function (c) { if (c[0] === "log") o += utf8(c[1]); }); return o; };
            var q0 = d ? d.q || [] : [];
            return {
              out: out + logs(q0), err: d ? "" : "Le jeu n'a pas démarré : appelle lancer(new Main()); dans main.", q: q0.filter(function (c) { return c[0] !== "log"; }),
              frame: function (dt, inp) {
                if (!vivant) return Promise.resolve({ q: [], out: "", err: "" });
                return new Promise(function (ok) {
                  var t = setTimeout(function () { vivant = false; try { r.destroy(); } catch (e) { /* rien */ } ok({ q: [], out: "", err: "Une image du jeu met trop de temps à se calculer : une boucle sans fin dans update ou draw ?" }); }, 2000);
                  attente = function (d2) {
                    clearTimeout(t);
                    var q = d2.q || [];
                    if (d2.err) vivant = false;
                    ok({ q: q.filter(function (c) { return c[0] !== "log"; }), out: logs(q), err: d2.err ? "Exception : " + utf8(d2.err) : "" });
                  };
                  w.postMessage({ ef: "frame", dt: dt, inp: inp });
                });
              },
              stop: function () { vivant = false; try { r.destroy(); } catch (e) { /* rien */ } }
            };
          });
        });
      });
    };
    self.coupe = function () { if (rt) try { rt.destroy(); } catch (e) { /* rien */ } rt = null; };
  }

  var runners = {};
  function runner(lang) { return runners[lang] || (runners[lang] = lang === "java" ? new JavaRunner() : new WorkerRunner(lang)); }
  var testeurs = {};
  function testeur(lang) { return lang === "java" ? (testeurs[lang] || (testeurs[lang] = new JavaRunner())) : runner(lang); }

  /* ------------------------------------------------------------ écran : dessin + entrées */
  var TOUCHES = { ArrowLeft: "gauche", ArrowRight: "droite", ArrowUp: "haut", ArrowDown: "bas", " ": "espace", Enter: "entree", Escape: "echap", Shift: "maj" };
  function nomTouche(e) { if (TOUCHES[e.key]) return TOUCHES[e.key]; var k = (e.key || "").toLowerCase(); return k.length === 1 ? k : k; }
  function ecran(cv) {
    var ctx = cv.getContext("2d"), k = {}, p = {}, mx = 0, my = 0, c = false, d = false;
    function down(e) {
      var n = nomTouche(e);
      if (["gauche", "droite", "haut", "bas", "espace"].indexOf(n) >= 0) e.preventDefault();
      if (!k[n]) p[n] = true;
      k[n] = true;
    }
    function up(e) { k[nomTouche(e)] = false; }
    function pos(e) { var r = cv.getBoundingClientRect(); mx = Math.round((e.clientX - r.left) * cv.width / r.width); my = Math.round((e.clientY - r.top) * cv.height / r.height); }
    function md(e) { pos(e); d = true; c = true; cv.focus(); }
    function mu() { d = false; }
    function blur() { k = {}; }
    cv.addEventListener("keydown", down); cv.addEventListener("keyup", up); cv.addEventListener("blur", blur);
    cv.addEventListener("pointermove", pos); cv.addEventListener("pointerdown", md); window.addEventListener("pointerup", mu);
    function dessine(q) {
      q.forEach(function (o) {
        switch (o[0]) {
          case "efface": ctx.fillStyle = o[1]; ctx.fillRect(0, 0, cv.width, cv.height); break;
          case "rect": ctx.fillStyle = o[5]; ctx.fillRect(o[1], o[2], o[3], o[4]); break;
          case "cercle": ctx.fillStyle = o[4]; ctx.beginPath(); ctx.arc(o[1], o[2], Math.max(0, o[3]), 0, Math.PI * 2); ctx.fill(); break;
          case "ligne": ctx.strokeStyle = o[5]; ctx.lineWidth = o[6] || 2; ctx.beginPath(); ctx.moveTo(o[1], o[2]); ctx.lineTo(o[3], o[4]); ctx.stroke(); break;
          case "texte": ctx.fillStyle = o[5]; ctx.font = "700 " + o[4] + "px 'Hanken Grotesk', system-ui, sans-serif"; ctx.textBaseline = "top"; ctx.fillText(o[1], o[2], o[3]); break;
        }
      });
    }
    return {
      dessine: dessine,
      vide: function () { ctx.fillStyle = "#16182b"; ctx.fillRect(0, 0, cv.width, cv.height); },
      entree: function () { var i = { k: Object.assign({}, k), p: p, mx: mx, my: my, c: c, d: d }; p = {}; c = false; return i; },
      appuie: function (n, oui) { if (oui) { if (!k[n]) p[n] = true; k[n] = true; } else k[n] = false; },
      fin: function () { cv.removeEventListener("keydown", down); cv.removeEventListener("keyup", up); cv.removeEventListener("blur", blur); cv.removeEventListener("pointermove", pos); cv.removeEventListener("pointerdown", md); window.removeEventListener("pointerup", mu); }
    };
  }

  /* ------------------------------------------------------------ boucle d'animation */
  function boucle(session, ec, onLog, onErr) {
    var actif = true, occupe = false, dernier = performance.now();
    ec.dessine(session.q || []);
    function tick(t) {
      if (!actif) return;
      requestAnimationFrame(tick);
      if (occupe) return;
      var dt = Math.min(0.05, (t - dernier) / 1000); dernier = t;
      occupe = true;
      session.frame(dt, ec.entree()).then(function (f) {
        occupe = false;
        if (!actif) return;
        if (f.q && f.q.length) ec.dessine(f.q);
        if (f.out) onLog(f.out);
        if (f.err) { actif = false; onErr(f.err); }
      });
    }
    requestAnimationFrame(tick);
    return function () { actif = false; session.stop(); };
  }

  /* ------------------------------------------------------------ scénarios de test (sans affichage) */
  var cacheScen = {};
  function scenario(lang, code, etapes) {
    var cle = lang + "\u0001" + code + "\u0001" + JSON.stringify(etapes || []);
    if (cacheScen[cle]) return cacheScen[cle];
    var p = testeur(lang).jeu(code).then(function (s) {
      var res = { S: s.q || [], F: [], O: s.out || "", E: s.err || "" };
      if (s.err) return res;
      var liste = [];
      (etapes || [{ n: 1 }]).forEach(function (e) {
        var held = {}; (e.k || []).forEach(function (x) { held[x] = true; });
        for (var i = 0; i < (e.n || 1); i++) {
          var pr = {}; if (i === 0) (e.p || []).forEach(function (x) { pr[x] = true; held[x] = held[x] || false; });
          var sx = e.souris || {};
          liste.push({ k: held, p: pr, mx: sx.x || 0, my: sx.y || 0, c: i === 0 && !!sx.clic, d: !!sx.clic });
        }
      });
      return liste.reduce(function (pp, inp) {
        return pp.then(function (stop) {
          if (stop) return true;
          return s.frame(DT, inp).then(function (f) {
            res.F.push(f.q || []); res.O += f.out || "";
            if (f.err) { res.E = f.err; return true; }
            return false;
          });
        });
      }, Promise.resolve(false)).then(function () { s.stop(); return res; });
    });
    var ks = Object.keys(cacheScen); if (ks.length > 40) cacheScen = {};
    cacheScen[cle] = p;
    p.catch(function () { delete cacheScen[cle]; });
    return p;
  }

  function estJeu(lang, code) {
    var c = String(code || "").replace(/\/\/[^\n]*|--[^\n]*/g, "");
    if (lang === "java") return /extends\s+Jeu\b/.test(c);
    if (lang === "cpp") return /#include\s*"jeu\.h"/.test(c);
    if (lang === "lua") return /function\s+(draw|update)\s*\(/.test(c);
    return /function\s+(draw|update)\s*\(|\b(draw|update)\s*=\s*(\(|function)/.test(c);
  }

  window.EFJeu = { runner: runner, ecran: ecran, boucle: boucle, scenario: scenario, estJeu: estJeu, DT: DT };
})();
