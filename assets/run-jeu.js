/* Étude Facile — exécution de JavaScript, Lua et C++ dans un Web Worker (module).
   Messages reçus :
     { t: "init", lang: "js"|"lua"|"cpp", base }            base = URL du dossier assets/
     { t: "console", id, code, stdin: [lignes] }            → { t: "fin", id, out, err }
     { t: "jeu", id, code }                                  → { t: "pret", id, out, q, err }
     { t: "frame", id, dt, inp }                             → { t: "img", id, q, out, err }
   Pendant la compilation C++, le worker envoie { t: "phase", id, p: "compile" | "run" }.
   API de jeu (identique dans les quatre langages) : effacer, rect, cercle, ligne, texte, touche,
   toucheAppuyee, sourisX, sourisY, clic, hasard, LARGEUR (480), HAUTEUR (320). */
let LANG = "js", BASE = "";
let Q = [], OUT = [], INP = { k: {}, p: {}, mx: 0, my: 0, c: false, d: false };
const JEUX = {}; /* jeux en cours, par identifiant de session */

const API = {
  effacer: (c) => Q.push(["efface", String(c ?? "black")]),
  rect: (x, y, w, h, c) => Q.push(["rect", +x, +y, +w, +h, String(c ?? "white")]),
  cercle: (x, y, r, c) => Q.push(["cercle", +x, +y, +r, String(c ?? "white")]),
  ligne: (x1, y1, x2, y2, c, e) => Q.push(["ligne", +x1, +y1, +x2, +y2, String(c ?? "white"), +(e ?? 2)]),
  texte: (s, x, y, t, c) => Q.push(["texte", String(s), +x, +y, +(t ?? 20), String(c ?? "white")]),
  touche: (k) => !!INP.k[String(k)],
  toucheAppuyee: (k) => !!INP.p[String(k)],
  sourisX: () => INP.mx,
  sourisY: () => INP.my,
  clic: () => !!INP.c,
  hasard: (a, b) => Math.floor(Math.random() * (Math.floor(b) - Math.floor(a) + 1)) + Math.floor(a),
  LARGEUR: 480,
  HAUTEUR: 320
};
const NOMS = Object.keys(API);
function vider() { const o = OUT.join(""); OUT = []; return o; }

/* ======================================================= JavaScript */
function fmtJs(v, prof = 0) {
  if (typeof v === "string") return prof ? JSON.stringify(v) : v;
  if (v === undefined) return "undefined";
  if (v === null || typeof v !== "object") return String(v);
  if (prof > 2) return Array.isArray(v) ? "[…]" : "{…}";
  if (Array.isArray(v)) return "[ " + v.map((x) => fmtJs(x, prof + 1)).join(", ") + " ]";
  if (v instanceof Map) return "Map(" + v.size + ")";
  const k = Object.keys(v);
  return (v.constructor && v.constructor.name && v.constructor.name !== "Object" ? v.constructor.name + " " : "") +
    "{ " + k.map((x) => x + ": " + fmtJs(v[x], prof + 1)).join(", ") + " }";
}
function errJs(e) {
  const m = /<anonymous>:(\d+):(\d+)/.exec(e && e.stack || "");
  const ligne = m ? +m[1] - 2 : 0;
  return (e && e.name ? e.name : "Error") + (ligne > 0 ? " (ligne " + ligne + ")" : "") + " : " + (e && e.message ? e.message : String(e));
}
function consoleJs() {
  const log = (...a) => OUT.push(a.map((x) => fmtJs(x)).join(" ") + "\n");
  return { log, info: log, warn: log, error: log, table: log };
}
function runJs(code, stdin) {
  let i = 0;
  const lire = () => (i < stdin.length ? stdin[i++] : null);
  try { new Function("console", "lire", "prompt", code)(consoleJs(), lire, lire); return { out: vider(), err: "" }; }
  catch (e) { return { out: vider(), err: errJs(e) }; }
}
function jeuJs(code) {
  const f = new Function("console", "lire", ...NOMS, code +
    "\n;return { setup: typeof setup === 'function' ? setup : null, update: typeof update === 'function' ? update : null, draw: typeof draw === 'function' ? draw : null };");
  const fn = f(consoleJs(), () => null, ...NOMS.map((n) => API[n]));
  return { setup: fn.setup, update: fn.update, draw: fn.draw };
}

/* ======================================================= Lua (wasmoon) */
let factory = null;
const PRE_LUA = `
local __e, __l = __ecrire, __lire
function print(...)
  local t = {}
  for i = 1, select('#', ...) do t[#t + 1] = tostring((select(i, ...))) end
  __e(table.concat(t, "\\t") .. "\\n")
end
io.write = function(...)
  for i = 1, select('#', ...) do __e(tostring((select(i, ...)))) end
end
io.read = function(f)
  local s = __l()
  if s == nil then return nil end
  if f == "n" or f == "*n" then return tonumber(s) end
  return s
end
__ecrire, __lire = nil, nil
`;
async function moteurLua(stdin) {
  if (!factory) {
    await import(BASE + "vendor/wasmoon/index.js");
    factory = new self.wasmoon.LuaFactory(BASE + "vendor/wasmoon/glue.wasm");
  }
  const lua = await factory.createEngine({ injectObjects: false, enableProxy: false });
  let i = 0;
  lua.global.set("__ecrire", (s) => { OUT.push(String(s)); });
  lua.global.set("__lire", () => (i < stdin.length ? stdin[i++] : undefined));
  await lua.doString(PRE_LUA);
  return lua;
}
function errLua(e) {
  let m = String(e && e.message || e);
  m = m.replace(/\[string "[^"]*"\]:(\d+):/g, "ligne $1 :").replace(/^Error: /, "");
  return m.split("\n")[0];
}
async function runLua(code, stdin) {
  let lua = null;
  try {
    lua = await moteurLua(stdin);
    await lua.doString(code);
    return { out: vider(), err: "" };
  } catch (e) { return { out: vider(), err: errLua(e) }; }
  finally { try { lua && lua.global.close(); } catch (e) { /* rien */ } }
}
async function jeuLua(code) {
  const lua = await moteurLua([]);
  NOMS.forEach((n) => lua.global.set(n, API[n]));
  await lua.doString(code);
  const get = (n) => { const f = lua.global.get(n); return typeof f === "function" ? f : null; };
  return { setup: get("setup"), update: get("update"), draw: get("draw"), lua };
}

/* ======================================================= C++ (clang en WebAssembly) */
let clang = null;
const cache = new Map();
const JEU_H = `#pragma once
#include <string>
#define EF_IMPORT(n) __attribute__((import_module("ef"), import_name(#n)))
extern "C" {
EF_IMPORT(effacer) void ef_effacer(const char*);
EF_IMPORT(rect) void ef_rect(double, double, double, double, const char*);
EF_IMPORT(cercle) void ef_cercle(double, double, double, const char*);
EF_IMPORT(ligne) void ef_ligne(double, double, double, double, const char*, double);
EF_IMPORT(texte) void ef_texte(const char*, double, double, double, const char*);
EF_IMPORT(touche) int ef_touche(const char*);
EF_IMPORT(appui) int ef_appui(const char*);
EF_IMPORT(souris) double ef_souris(int);
EF_IMPORT(hasard) int ef_hasard(int, int);
}
const int LARGEUR = 480;
const int HAUTEUR = 320;
inline void effacer(const std::string& c = "black") { ef_effacer(c.c_str()); }
inline void rect(double x, double y, double l, double h, const std::string& c = "white") { ef_rect(x, y, l, h, c.c_str()); }
inline void cercle(double x, double y, double r, const std::string& c = "white") { ef_cercle(x, y, r, c.c_str()); }
inline void ligne(double x1, double y1, double x2, double y2, const std::string& c = "white", double e = 2) { ef_ligne(x1, y1, x2, y2, c.c_str(), e); }
inline void texte(const std::string& s, double x, double y, double t = 20, const std::string& c = "white") { ef_texte(s.c_str(), x, y, t, c.c_str()); }
inline bool touche(const std::string& k) { return ef_touche(k.c_str()) != 0; }
inline bool toucheAppuyee(const std::string& k) { return ef_appui(k.c_str()) != 0; }
inline double sourisX() { return ef_souris(0); }
inline double sourisY() { return ef_souris(1); }
inline bool clic() { return ef_souris(2) != 0; }
inline int hasard(int a, int b) { return ef_hasard(a, b); }
void setup();
void update(double dt);
void draw();
`;
const EF_CPP = `#include "jeu.h"
__attribute__((weak)) void setup() {}
__attribute__((weak)) void update(double dt) {}
__attribute__((weak)) void draw() {}
extern "C" {
__attribute__((export_name("ef_setup"))) void ef_setup_() { setup(); }
__attribute__((export_name("ef_update"))) void ef_update_(double dt) { update(dt); }
__attribute__((export_name("ef_draw"))) void ef_draw_() { draw(); }
}
`;
function nettoieDiag(t) {
  return t.split("\n").filter((l) => l && !/^clang\+\+: error: linker command failed|^\s*\d+ errors? generated\.|^wasm-ld: error: \/tmp\//.test(l))
    .map((l) => l.replace(/\/tmp\/[\w.-]+\.o: /g, "")).slice(0, 30).join("\n");
}
async function compiler(code, jeu, id) {
  const cle = (jeu ? "J" : "C") + code;
  if (cache.has(cle)) return cache.get(cle);
  if (!clang) {
    postMessage({ t: "phase", id, p: "charge" });
    clang = await import(BASE + "vendor/clang/gen/bundle.js");
  }
  postMessage({ t: "phase", id, p: "compile" });
  const dec = new TextDecoder(); let diag = "";
  const args = ["clang++", "-std=c++20", "-O1", "-fno-exceptions", "-fno-color-diagnostics", "-Wall", "main.cpp", "-o", "main.wasm"];
  if (jeu) args.splice(5, 0, "-mexec-model=reactor", "ef_jeu.cpp");
  let r;
  try {
    const res = await clang.runClang(args, { "main.cpp": code, "jeu.h": JEU_H, "ef_jeu.cpp": EF_CPP },
      { stdout: (b) => { if (b) diag += dec.decode(b, { stream: true }); }, stderr: (b) => { if (b) diag += dec.decode(b, { stream: true }); } });
    r = { wasm: res["main.wasm"], diag: nettoieDiag(diag) };
  } catch (e) {
    r = { wasm: null, diag: nettoieDiag(diag) || String(e && e.message || e) };
  }
  if (cache.size > 30) cache.clear();
  cache.set(cle, r);
  return r;
}
class Sortie extends Error { constructor(c) { super("exit " + c); this.code = c; } }
function wasi(getMem, stdin) {
  const enc = new TextEncoder(), dec = new TextDecoder();
  const entree = enc.encode(stdin.length ? stdin.join("\n") + "\n" : "");
  let pos = 0;
  const v = () => new DataView(getMem().buffer), u8 = () => new Uint8Array(getMem().buffer);
  const imp = {
    fd_write(fd, iovs, n, nw) {
      const d = v(); let tot = 0;
      for (let i = 0; i < n; i++) {
        const p = d.getUint32(iovs + 8 * i, true), l = d.getUint32(iovs + 8 * i + 4, true);
        if (fd === 1 || fd === 2) OUT.push(dec.decode(u8().slice(p, p + l), { stream: true }));
        tot += l;
      }
      d.setUint32(nw, tot, true); return 0;
    },
    fd_read(fd, iovs, n, nr) {
      const d = v(); let tot = 0;
      if (fd === 0) for (let i = 0; i < n; i++) {
        const p = d.getUint32(iovs + 8 * i, true), l = d.getUint32(iovs + 8 * i + 4, true);
        const k = Math.min(l, entree.length - pos);
        u8().set(entree.subarray(pos, pos + k), p); pos += k; tot += k;
        if (k < l) break;
      }
      d.setUint32(nr, tot, true); return 0;
    },
    fd_close: () => 0, fd_seek: () => 70, fd_fdstat_get(fd, p) { const d = v(); for (let i = 0; i < 24; i++) d.setUint8(p + i, 0); d.setUint8(p, fd < 3 ? 2 : 0); return 0; },
    fd_fdstat_set_flags: () => 0, fd_prestat_get: () => 8, fd_prestat_dir_name: () => 8, fd_filestat_get: () => 8, path_open: () => 44,
    environ_sizes_get(c, s) { const d = v(); d.setUint32(c, 0, true); d.setUint32(s, 0, true); return 0; }, environ_get: () => 0,
    args_sizes_get(c, s) { const d = v(); d.setUint32(c, 0, true); d.setUint32(s, 0, true); return 0; }, args_get: () => 0,
    clock_time_get(id, prec, p) { v().setBigUint64(p, BigInt(Math.round((id === 0 ? Date.now() : performance.now()) * 1e6)), true); return 0; },
    clock_res_get(id, p) { v().setBigUint64(p, 1000n, true); return 0; },
    random_get(p, l) { crypto.getRandomValues(u8().subarray(p, p + l)); return 0; },
    sched_yield: () => 0, poll_oneoff: () => 52,
    proc_exit(c) { throw new Sortie(c); }
  };
  return new Proxy(imp, { get: (o, k) => (k in o ? o[k] : () => 52) });
}
function importsEf(getMem) {
  const s = (p) => { const m = new Uint8Array(getMem().buffer); let e = p; while (m[e]) e++; return new TextDecoder().decode(m.subarray(p, e)); };
  return {
    effacer: (c) => API.effacer(s(c)),
    rect: (x, y, w, h, c) => API.rect(x, y, w, h, s(c)),
    cercle: (x, y, r, c) => API.cercle(x, y, r, s(c)),
    ligne: (a, b, c2, d, c, e) => API.ligne(a, b, c2, d, s(c), e),
    texte: (t, x, y, ta, c) => API.texte(s(t), x, y, ta, s(c)),
    touche: (k) => (API.touche(s(k)) ? 1 : 0),
    appui: (k) => (API.toucheAppuyee(s(k)) ? 1 : 0),
    souris: (i) => (i === 0 ? INP.mx : i === 1 ? INP.my : i === 2 ? (INP.c ? 1 : 0) : (INP.d ? 1 : 0)),
    hasard: (a, b) => API.hasard(a, b)
  };
}
async function instancier(wasm, stdin) {
  let inst = null;
  const getMem = () => inst.exports.memory;
  const mod = await WebAssembly.compile(wasm);
  inst = await WebAssembly.instantiate(mod, { wasi_snapshot_preview1: wasi(getMem, stdin), ef: importsEf(getMem) });
  return inst;
}
function errWasm(e) {
  if (e instanceof Sortie) return e.code ? "Le programme s'est terminé avec le code " + e.code : "";
  const m = String(e && e.message || e);
  if (/unreachable/.test(m)) return "Erreur à l'exécution (le programme a planté : accès hors d'un tableau, pointeur invalide, division par zéro ?)";
  if (/out of bounds/.test(m)) return "Erreur à l'exécution : accès mémoire hors limites (indice de tableau trop grand ?)";
  if (/call stack/.test(m)) return "Erreur à l'exécution : récursion infinie (une fonction qui s'appelle sans jamais s'arrêter ?)";
  return "Erreur à l'exécution : " + m;
}
async function runCpp(code, stdin, id) {
  const c = await compiler(code, false, id);
  if (!c.wasm) return { out: "", err: "Erreur de compilation\n" + c.diag };
  postMessage({ t: "phase", id, p: "run" });
  try {
    const inst = await instancier(c.wasm, stdin);
    inst.exports._start();
    return { out: vider(), err: "" };
  } catch (e) { return { out: vider(), err: errWasm(e) }; }
}
async function jeuCpp(code, id) {
  const c = await compiler(code, true, id);
  if (!c.wasm) throw new Error("Erreur de compilation\n" + c.diag);
  postMessage({ t: "phase", id, p: "run" });
  const inst = await instancier(c.wasm, []);
  if (inst.exports._initialize) inst.exports._initialize();
  return { setup: inst.exports.ef_setup, update: inst.exports.ef_update, draw: inst.exports.ef_draw, cpp: true };
}

/* ======================================================= boucle de messages */
function errGen(e) { return LANG === "lua" ? errLua(e) : LANG === "cpp" ? errWasm(e) : errJs(e); }
self.onmessage = async (ev) => {
  const d = ev.data;
  if (d.t === "init") { LANG = d.lang; BASE = d.base; return; }
  if (d.t === "console") {
    OUT = []; Q = [];
    const r = LANG === "lua" ? await runLua(d.code, d.stdin || []) : LANG === "cpp" ? await runCpp(d.code, d.stdin || [], d.id) : runJs(d.code, d.stdin || []);
    postMessage({ t: "fin", id: d.id, out: r.out, err: r.err });
    return;
  }
  if (d.t === "jeu") {
    let g = null, err = "";
    try {
      g = LANG === "lua" ? await jeuLua(d.code) : LANG === "cpp" ? await jeuCpp(d.code, d.id) : jeuJs(d.code);
    } catch (e) {
      const m = String(e && e.message || e);
      err = /^Erreur de compilation/.test(m) ? m : errGen(e);
    }
    /* partie synchrone : rien d'autre ne peut s'intercaler */
    OUT = []; Q = []; INP = { k: {}, p: {}, mx: 0, my: 0, c: false, d: false };
    if (g && g.setup) { try { g.setup(); } catch (e) { err = errGen(e); g = null; } }
    if (g && !err) JEUX[d.id] = g;
    postMessage({ t: "pret", id: d.id, sid: d.id, out: vider(), q: Q, err });
    return;
  }
  if (d.t === "frame") {
    Q = []; OUT = []; INP = d.inp || INP;
    let err = "";
    const g = JEUX[d.sid];
    if (g) {
      try {
        if (g.update) g.update(d.dt);
        if (g.draw) g.draw();
      } catch (e) { err = errGen(e); fermer(d.sid); }
    }
    postMessage({ t: "img", id: d.id, q: Q, out: vider(), err });
    return;
  }
  if (d.t === "stop") fermer(d.sid);
};
function fermer(sid) {
  const g = JEUX[sid];
  if (g && g.lua) { try { g.lua.global.close(); } catch (e) { /* rien */ } }
  delete JEUX[sid];
}
