/* Étude Facile — terminal Linux simulé (bash minimal, système de fichiers virtuel).
   Moteur : EFShell.create(spec) -> { run(ligne), prompt(), state… }
   Interface : EFTerm.mount(conteneur, { fs, cwd, onCommand(sh, ligne, sortie) })            */
(function (root) {
  "use strict";

  /* ---------- Système de fichiers ---------- */
  function dir(m, o, g) { return { t: "d", kids: {}, m: m == null ? 493 : m, o: o || "etu", g: g || o || "etu" }; }
  function file(c, m, o, g) { return { t: "f", c: c || "", m: m == null ? 420 : m, o: o || "etu", g: g || o || "etu" }; }

  function defaultFS() {
    return {
      "/home/etu/": null,
      "/home/etu/notes.txt": "Linux est sensible à la casse\nle shell interprète les commandes\nTab complète les noms\nLinux est libre\n",
      "/home/etu/docs/": null,
      "/home/etu/docs/liste.txt": "pomme\nbanane\ncerise\nbanane\nabricot\n",
      "/home/etu/docs/eleves.csv": "Durand;Alice;17\nMartin;Bob;18\nLeroy;Chloé;17\nBernard;David;19\n",
      "/tmp/": null
    };
  }

  function create(spec) {
    spec = spec || {};
    var S = { cwd: "/home/etu", user: "etu", env: {}, hist: [], jobs: [], nextPid: 4200, last: "", outs: [], cmds: [] };
    S.root = dir(493, "root", "root");
    var fsSpec = spec.fs || defaultFS();
    var base = {
      "/etc/": null,
      "/etc/passwd": "root:x:0:0:root:/root:/bin/bash\nwww-data:x:33:33:www-data:/var/www:/usr/sbin/nologin\netu:x:1000:1000:Etudiant:/home/etu:/bin/bash\n",
      "/etc/group": "root:x:0:\nsudo:x:27:etu\nwww-data:x:33:\netu:x:1000:\n",
      "/home/": null
    };
    function seed(map) {
      Object.keys(map).forEach(function (p) {
        var isDir = p.charAt(p.length - 1) === "/" || map[p] === null;
        var parts = p.split("/").filter(Boolean), n = S.root;
        parts.forEach(function (name, i) {
          var last = i === parts.length - 1;
          if (!n.kids[name]) {
            var home = parts[0] === "home" && parts[1];
            var own = home && (parts.length >= 2) ? home : "root";
            if (parts[0] === "tmp") own = "root";
            n.kids[name] = (last && !isDir) ? file(map[p], 420, own === "root" && parts[0] === "home" ? "etu" : own) : dir(parts[0] === "tmp" ? 511 : 493, own);
            if (parts[0] === "home" && parts.length === 2) n.kids[name].o = n.kids[name].g = name;
            if (parts[0] === "etc" && last && !isDir) { n.kids[name].o = "root"; n.kids[name].g = "root"; }
          }
          if (last && !isDir && n.kids[name].t === "f") n.kids[name].c = map[p];
          n = n.kids[name];
        });
      });
    }
    seed(base); seed(fsSpec);
    if (spec.modes) Object.keys(spec.modes).forEach(function (p) { var n = get(p); if (n) n.m = parseInt(spec.modes[p], 8); });
    if (spec.owners) Object.keys(spec.owners).forEach(function (p) { var n = get(p); if (n) { var s = spec.owners[p].split(":"); n.o = s[0]; n.g = s[1] || s[0]; } });
    if (!get("/root")) { S.root.kids.root = dir(448, "root", "root"); }
    if (spec.cwd) S.cwd = spec.cwd; else if (spec.user === "root") S.cwd = "/root";
    if (spec.user) S.user = spec.user;
    S.env = { HOME: S.user === "root" ? "/root" : "/home/" + S.user, USER: S.user, PATH: "/usr/local/bin:/usr/bin:/bin", SHELL: "/bin/bash", LANG: "fr_FR.UTF-8" };
    var ENVEXP = { HOME: 1, USER: 1, PATH: 1, SHELL: 1, LANG: 1 };
    var shellVars = {};

    /* ---------- chemins ---------- */
    function resolve(p, cwd) {
      cwd = cwd || S.cwd;
      if (p === "~" || p.slice(0, 2) === "~/") p = S.env.HOME + p.slice(1);
      var parts = (p.charAt(0) === "/" ? p : cwd + "/" + p).split("/"), out = [];
      parts.forEach(function (x) {
        if (!x || x === ".") return;
        if (x === "..") out.pop(); else out.push(x);
      });
      return "/" + out.join("/");
    }
    function get(p) {
      var n = S.root, parts = p.split("/").filter(Boolean);
      for (var i = 0; i < parts.length; i++) {
        if (!n || n.t !== "d") return null;
        n = n.kids[parts[i]];
      }
      return n || null;
    }
    function parentOf(p) { var i = p.lastIndexOf("/"); return { dir: i <= 0 ? "/" : p.slice(0, i), name: p.slice(i + 1) }; }
    function shortCwd() { return S.cwd === S.env.HOME ? "~" : (S.cwd.indexOf(S.env.HOME + "/") === 0 ? "~" + S.cwd.slice(S.env.HOME.length) : S.cwd); }

    /* ---------- droits ---------- */
    function groupsOf(u) {
      var g = get("/etc/group").c.split("\n"), r = [];
      var pw = get("/etc/passwd").c.split("\n").filter(function (l) { return l.split(":")[0] === u; })[0];
      var gid = pw ? pw.split(":")[3] : null;
      g.forEach(function (l) {
        if (!l) return; var f = l.split(":");
        if ((f[3] || "").split(",").indexOf(u) >= 0 || f[2] === gid) r.push(f[0]);
      });
      return r;
    }
    function can(n, bit, u) {
      u = u || S.user; if (u === "root") return true;
      var sh = n.o === u ? 6 : (groupsOf(u).indexOf(n.g) >= 0 ? 3 : 0);
      return ((n.m >> sh) & bit) !== 0;
    }
    function modeStr(n) {
      var s = n.t === "d" ? "d" : n.lnk ? "l" : "-", f = "rwx";
      for (var i = 0; i < 9; i++) s += (n.m >> (8 - i)) & 1 ? f.charAt(i % 3) : "-";
      return s;
    }
    function uid(u) { var l = get("/etc/passwd").c.split("\n").filter(function (x) { return x.split(":")[0] === u; })[0]; return l ? l.split(":") : null; }

    /* ---------- utilitaires ---------- */
    function deep(n) { return JSON.parse(JSON.stringify(n)); }
    function size(n) { return n.t === "d" ? 4096 : (n.c || "").length; }
    function lines(t) { var a = t.split("\n"); if (a[a.length - 1] === "") a.pop(); return a; }
    function nl(a) { return a.length ? a.join("\n") + "\n" : ""; }
    function readFile(p, cmd) {
      var f = get(resolve(p));
      if (!f) throw cmd + ": " + p + ": Aucun fichier ou dossier de ce type";
      if (f.t === "d") throw cmd + ": " + p + ": est un dossier";
      if (!can(f, 4)) throw cmd + ": " + p + ": Permission non accordée";
      return f.c || "";
    }
    function writeFile(p, text, append) {
      var ap = resolve(p), pr = parentOf(ap), d = get(pr.dir);
      if (!d || d.t !== "d") throw "bash: " + p + ": Aucun fichier ou dossier de ce type";
      var f = d.kids[pr.name];
      if (f && f.t === "d") throw "bash: " + p + ": est un dossier";
      if (f && !can(f, 2)) throw "bash: " + p + ": Permission non accordée";
      if (!f) {
        if (!can(d, 2)) throw "bash: " + p + ": Permission non accordée";
        f = d.kids[pr.name] = file("", 420, S.user, S.user);
      }
      f.c = append ? (f.c || "") + text : text;
    }
    function opts(args, withVal) {
      var o = {}, rest = [], i = 0, end = false;
      withVal = withVal || {};
      for (; i < args.length; i++) {
        var a = args[i];
        if (!end && a === "--") { end = true; continue; }
        if (!end && a.length > 1 && a.charAt(0) === "-" && !/^-\d+$/.test(a)) {
          for (var k = 1; k < a.length; k++) {
            var c = a.charAt(k);
            if (withVal[c]) {
              var v = a.slice(k + 1);
              if (!v) { v = args[++i]; }
              o[c] = v; break;
            }
            o[c] = true;
          }
        } else rest.push(a);
      }
      return { o: o, a: rest };
    }
    function glob(pat) {
      var rx = new RegExp("^" + pat.replace(/[.+^${}()|\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".") + "$");
      var i = pat.lastIndexOf("/"), dp = i >= 0 ? pat.slice(0, i + 1) : "", fp = i >= 0 ? pat.slice(i + 1) : pat;
      rx = new RegExp("^" + fp.replace(/[.+^${}()|\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".") + "$");
      var d = get(resolve(dp || "."));
      if (!d || d.t !== "d") return [pat];
      var m = Object.keys(d.kids).filter(function (n) { return (n.charAt(0) !== "." || fp.charAt(0) === ".") && rx.test(n); }).sort(cmpName).map(function (n) { return dp + n; });
      return m.length ? m : [pat];
    }
    function cmpName(a, b) { return a.toLowerCase() < b.toLowerCase() ? -1 : a.toLowerCase() > b.toLowerCase() ? 1 : a < b ? -1 : 1; }

    /* ---------- commandes ---------- */
    var C = {};
    C.pwd = function () { return S.cwd + "\n"; };
    C.whoami = function () { return S.user + "\n"; };
    C.hostname = function () { return "lab-ubuntu\n"; };
    C.date = function () { return "mar. 10 nov. 2026 08:30:00 CET\n"; };
    C.who = function () { return S.user + "   pts/0   2026-11-10 08:30\n"; };
    C.clear = function () { return "\f"; };
    C.exit = function () { return "logout (simulation : la session reste ouverte)\n"; };
    C.history = function () { return S.hist.map(function (h, i) { return ("     " + (i + 1)).slice(-5) + "  " + h; }).join("\n") + "\n"; };
    C.echo = function (a) { var o = opts(a.slice(0, 1)); var n = o.o.n; var t = (n ? a.slice(1) : a).join(" "); return n ? t : t + "\n"; };
    C.cd = function (a) {
      var t = a[0] || "~", p = resolve(t), n = get(p);
      if (!n) throw "bash: cd: " + t + ": Aucun fichier ou dossier de ce type";
      if (n.t !== "d") throw "bash: cd: " + t + ": N'est pas un dossier";
      if (!can(n, 1)) throw "bash: cd: " + t + ": Permission non accordée";
      S.cwd = p; return "";
    };
    C.mkdir = function (a) {
      var r = opts(a);
      r.a.forEach(function (p) {
        var ap = resolve(p), parts = ap.split("/").filter(Boolean), n = S.root, cur = "";
        parts.forEach(function (name, i) {
          cur += "/" + name; var last = i === parts.length - 1;
          if (n.kids[name]) { if (last && !r.o.p) throw "mkdir: impossible de créer le répertoire « " + p + " » : Le fichier existe"; n = n.kids[name]; return; }
          if (!last && !r.o.p) throw "mkdir: impossible de créer le répertoire « " + p + " » : Aucun fichier ou dossier de ce type";
          if (!can(n, 2)) throw "mkdir: impossible de créer le répertoire « " + p + " » : Permission non accordée";
          n = n.kids[name] = dir(493, S.user, S.user);
        });
      });
      return "";
    };
    C.rmdir = function (a) {
      a.forEach(function (p) {
        var ap = resolve(p), n = get(ap);
        if (!n) throw "rmdir: échec de suppression de '" + p + "': Aucun fichier ou dossier de ce type";
        if (n.t !== "d") throw "rmdir: échec de suppression de '" + p + "': N'est pas un dossier";
        if (Object.keys(n.kids).length) throw "rmdir: échec de suppression de '" + p + "': Le dossier n'est pas vide";
        var pr = parentOf(ap); delete get(pr.dir).kids[pr.name];
      });
      return "";
    };
    C.touch = function (a) {
      a.forEach(function (p) { var ap = resolve(p); if (!get(ap)) writeFile(p, "", false); });
      return "";
    };
    C.rm = function (a) {
      var r = opts(a), err = "";
      r.a.forEach(function (p) {
        var ap = resolve(p), n = get(ap);
        if (!n) { if (!r.o.f) err += "rm: impossible de supprimer '" + p + "': Aucun fichier ou dossier de ce type\n"; return; }
        if (n.t === "d" && !(r.o.r || r.o.R)) { err += "rm: impossible de supprimer '" + p + "': est un dossier\n"; return; }
        var pr = parentOf(ap), d = get(pr.dir);
        if (!can(d, 2)) { err += "rm: impossible de supprimer '" + p + "': Permission non accordée\n"; return; }
        delete d.kids[pr.name];
      });
      if (err) throw err.replace(/\n$/, "");
      return "";
    };
    function copyNode(n) { return deep(n); }
    C.cp = function (a) {
      var r = opts(a), src = r.a.slice(0, -1), dst = r.a[r.a.length - 1];
      if (r.a.length < 2) throw "cp: opérande de fichier manquant";
      var dn = get(resolve(dst));
      if (src.length > 1 && (!dn || dn.t !== "d")) throw "cp: la cible '" + dst + "' n'est pas un répertoire";
      src.forEach(function (s) {
        var sn = get(resolve(s));
        if (!sn) throw "cp: impossible d'évaluer '" + s + "': Aucun fichier ou dossier de ce type";
        if (sn.t === "d" && !(r.o.r || r.o.R)) throw "cp: -r non spécifié ; omission du répertoire '" + s + "'";
        if (sn.t === "f" && !can(sn, 4)) throw "cp: impossible d'ouvrir '" + s + "' en lecture: Permission non accordée";
        var target = resolve(dst), name = parentOf(resolve(s)).name;
        if (dn && dn.t === "d") target = target + "/" + name;
        var pr = parentOf(target), pd = get(pr.dir);
        if (!pd || pd.t !== "d") throw "cp: impossible de créer le fichier '" + dst + "': Aucun fichier ou dossier de ce type";
        if (!can(pd, 2)) throw "cp: impossible de créer le fichier '" + dst + "': Permission non accordée";
        var c = copyNode(sn); c.o = c.g = S.user; pd.kids[pr.name] = c;
      });
      return "";
    };
    C.mv = function (a) {
      var src = a.slice(0, -1), dst = a[a.length - 1];
      if (a.length < 2) throw "mv: opérande de fichier manquant";
      var dn = get(resolve(dst));
      src.forEach(function (s) {
        var sp = resolve(s), sn = get(sp);
        if (!sn) throw "mv: impossible d'évaluer '" + s + "': Aucun fichier ou dossier de ce type";
        var target = resolve(dst);
        if (dn && dn.t === "d") target = target + "/" + parentOf(sp).name;
        var pr = parentOf(target), pd = get(pr.dir);
        if (!pd || pd.t !== "d") throw "mv: impossible de déplacer '" + s + "' vers '" + dst + "': Aucun fichier ou dossier de ce type";
        if (!can(pd, 2)) throw "mv: impossible de déplacer '" + s + "': Permission non accordée";
        var sp2 = parentOf(sp); delete get(sp2.dir).kids[sp2.name];
        pd.kids[pr.name] = sn;
      });
      return "";
    };
    C.cat = function (a, inp) {
      if (!a.length) return inp || "";
      return a.map(function (p) { return readFile(p, "cat"); }).join("");
    };
    function src1(a, inp, cmd) { return a.length ? a.map(function (p) { return readFile(p, cmd); }).join("") : (inp || ""); }
    C.head = function (a, inp) {
      var r = opts(a, { n: 1 }), n = r.o.n ? parseInt(r.o.n, 10) : 10;
      a.forEach(function (x) { if (/^-\d+$/.test(x)) { n = parseInt(x.slice(1), 10); r.a = r.a.filter(function (y) { return y !== x; }); } });
      return nl(lines(src1(r.a, inp, "head")).slice(0, n));
    };
    C.tail = function (a, inp) {
      var r = opts(a, { n: 1 }), n = r.o.n ? parseInt(r.o.n, 10) : 10;
      a.forEach(function (x) { if (/^-\d+$/.test(x)) { n = parseInt(x.slice(1), 10); r.a = r.a.filter(function (y) { return y !== x; }); } });
      var l = lines(src1(r.a, inp, "tail")); return nl(l.slice(Math.max(0, l.length - n)));
    };
    C.less = function (a, inp) { return C.cat(a, inp); };
    C.grep = function (a, inp) {
      var r = opts(a), pat = r.a[0], files = r.a.slice(1);
      if (pat === undefined) throw "Usage : grep [OPTION]... MOTIF [FICHIER]...";
      var rx; try { rx = new RegExp(pat, r.o.i ? "i" : ""); } catch (e) { rx = new RegExp(pat.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), r.o.i ? "i" : ""); }
      var out = [], total = 0;
      function scan(text, label) {
        var cnt = 0;
        lines(text).forEach(function (l, i) {
          var m = rx.test(l); if (r.o.v) m = !m; if (!m) return; cnt++;
          out.push((label ? label + ":" : "") + (r.o.n ? (i + 1) + ":" : "") + l);
        });
        if (r.o.c) { out.length -= cnt; out.push((label ? label + ":" : "") + cnt); }
        total += cnt;
      }
      if (!files.length) scan(inp || "", ""); else files.forEach(function (f) { scan(readFile(f, "grep"), files.length > 1 ? f : ""); });
      return nl(out);
    };
    C.wc = function (a, inp) {
      var r = opts(a), files = r.a, any = r.o.l || r.o.w || r.o.c;
      function one(t, name) {
        var L = (t.match(/\n/g) || []).length, W = t.split(/\s+/).filter(Boolean).length, B = t.length, p = [];
        if (!any || r.o.l) p.push(L); if (!any || r.o.w) p.push(W); if (!any || r.o.c) p.push(B);
        return p.join(" ") + (name ? " " + name : "") + "\n";
      }
      if (!files.length) return one(inp || "", "");
      return files.map(function (f) { return one(readFile(f, "wc"), f); }).join("");
    };
    C.sort = function (a, inp) {
      var r = opts(a), l = lines(src1(r.a, inp, "sort"));
      l.sort(r.o.n ? function (x, y) { return parseFloat(x) - parseFloat(y); } : cmpName);
      if (r.o.u) l = l.filter(function (x, i) { return i === 0 || x !== l[i - 1]; });
      if (r.o.r) l.reverse();
      return nl(l);
    };
    C.uniq = function (a, inp) {
      var r = opts(a), l = lines(src1(r.a, inp, "uniq")), o = [];
      var cnt = [];
      l.forEach(function (x, i) { if (i === 0 || x !== l[i - 1]) { o.push(x); cnt.push(1); } else cnt[cnt.length - 1]++; });
      if (r.o.d) o = o.filter(function (x, i) { return cnt[i] > 1; });
      else if (r.o.c) o = o.map(function (x, i) { return ("      " + cnt[i]).slice(-7) + " " + x; });
      return nl(o);
    };
    C.cut = function (a, inp) {
      var r = opts(a, { d: 1, f: 1 }), d = r.o.d === undefined ? "\t" : r.o.d, fs = [];
      if (!r.o.f) throw "cut : vous devez spécifier une liste d'octets, de caractères ou de champs";
      String(r.o.f).split(",").forEach(function (x) {
        var m = x.split("-"); if (m.length === 2) { for (var i = +m[0]; i <= +m[1]; i++) fs.push(i); } else fs.push(+x);
      });
      return nl(lines(src1(r.a, inp, "cut")).map(function (l) {
        var p = l.split(d); return fs.map(function (i) { return p[i - 1]; }).filter(function (x) { return x !== undefined; }).join(d);
      }));
    };
    C.ls = function (a) {
      var r = opts(a), paths = r.a.length ? r.a : ["."], out = "", multi = paths.length > 1 || r.o.R;
      function lsOne(ap, shown, header) {
        var n = get(ap), res = "";
        if (n.t !== "d" || r.o.d) {
          return r.o.l ? longLine(shown, n) + "\n" : shown + "\n";
        }
        if (!can(n, 4)) throw "ls: impossible d'ouvrir le répertoire '" + shown + "': Permission non accordée";
        var names = Object.keys(n.kids).sort(cmpName);
        if (!r.o.a) names = names.filter(function (x) { return x.charAt(0) !== "."; });
        else names = [".", ".."].concat(names);
        if (header) res += shown + ":\n";
        if (r.o.l) {
          res += "total " + names.length * 4 + "\n";
          names.forEach(function (x) { var k = x === "." ? n : x === ".." ? n : n.kids[x]; res += longLine(x, k) + "\n"; });
        } else res += names.join("  ") + (names.length ? "\n" : "");
        if (r.o.R) names.forEach(function (x) {
          if (x === "." || x === "..") return;
          var k = n.kids[x]; if (k.t === "d") res += "\n" + lsOne(ap + "/" + x, (shown === "." ? "." : shown) + "/" + x, true);
        });
        return res;
      }
      function longLine(name, n) { return modeStr(n) + " 1 " + n.o + " " + n.g + " " + ("      " + size(n)).slice(-5) + " nov. 10 08:30 " + name + (n.lnk ? " -> " + n.lnk : ""); }
      paths.forEach(function (p, i) {
        var ap = resolve(p), n = get(ap);
        if (!n) throw "ls: impossible d'accéder à '" + p + "': Aucun fichier ou dossier de ce type";
        out += (i && n.t === "d" ? "\n" : "") + lsOne(ap, p, multi && n.t === "d");
      });
      return out;
    };
    C.tree = function (a) {
      var r = opts(a), p = r.a[0] || ".", ap = resolve(p), n = get(ap), nd = 0, nf = 0;
      if (!n) throw p + " [erreur à l'ouverture du dossier]";
      if (n.t !== "d") return p + "\n\n0 directories, 1 file\n";
      function walk(d, pre) {
        var names = Object.keys(d.kids).sort(cmpName).filter(function (x) { return r.o.a || x.charAt(0) !== "."; }), o = "";
        names.forEach(function (x, i) {
          var k = d.kids[x], last = i === names.length - 1;
          o += pre + (last ? "└── " : "├── ") + x + (k.t === "d" ? "/" : "") + "\n";
          if (k.t === "d") { nd++; if (can(k, 4)) o += walk(k, pre + (last ? "    " : "│   ")); } else nf++;
        });
        return o;
      }
      var body = walk(n, "");
      return p + "\n" + body + "\n" + nd + " dossier" + (nd > 1 ? "s" : "") + ", " + nf + " fichier" + (nf > 1 ? "s" : "") + "\n";
    };
    C.file = function (a) {
      return a.map(function (p) {
        var n = get(resolve(p)); if (!n) return p + ": cannot open (No such file or directory)\n";
        var t = n.t === "d" ? "directory" : n.gz ? "gzip compressed data" : n.arc ? "POSIX tar archive" : (n.c || "") === "" ? "empty" : "ASCII text";
        return p + ": " + t + "\n";
      }).join("");
    };
    C.chmod = function (a) {
      var r = opts(a.filter(function (x) { return !/^[ugoa]*[+\-=][rwx]+(,.*)?$/.test(x) || x.charAt(0) === "-" && false; }));
      var spec = a.filter(function (x) { return /^([0-7]{3,4}|[ugoa]*[+\-=][rwx]*(,[ugoa]*[+\-=][rwx]*)*)$/.test(x); })[0];
      var rec = a.indexOf("-R") >= 0;
      var targets = a.filter(function (x) { return x !== spec && x !== "-R"; });
      if (!spec || !targets.length) throw "chmod : opérande manquant";
      function apply(n) {
        if (/^[0-7]+$/.test(spec)) n.m = parseInt(spec, 8) & 511;
        else spec.split(",").forEach(function (cl) {
          var m = /^([ugoa]*)([+\-=])([rwx]*)$/.exec(cl), who = m[1] || "a", bits = 0;
          if (m[3].indexOf("r") >= 0) bits |= 4; if (m[3].indexOf("w") >= 0) bits |= 2; if (m[3].indexOf("x") >= 0) bits |= 1;
          if (who.indexOf("a") >= 0) who = "ugo";
          [["u", 6], ["g", 3], ["o", 0]].forEach(function (w) {
            if (who.indexOf(w[0]) < 0) return;
            var mask = bits << w[1];
            if (m[2] === "+") n.m |= mask; else if (m[2] === "-") n.m &= ~mask; else n.m = (n.m & ~(7 << w[1])) | mask;
          });
        });
      }
      function walk(n) { apply(n); if (rec && n.t === "d") Object.keys(n.kids).forEach(function (k) { walk(n.kids[k]); }); }
      targets.forEach(function (p) {
        var n = get(resolve(p)); if (!n) throw "chmod: impossible d'accéder à '" + p + "': Aucun fichier ou dossier de ce type";
        if (n.o !== S.user && S.user !== "root") throw "chmod: modification des droits de '" + p + "': Opération non permise";
        walk(n);
      });
      return "";
    };
    C.chown = function (a) {
      var r = opts(a), spec = r.a[0], targets = r.a.slice(1);
      if (!spec || !targets.length) throw "chown : opérande manquant";
      if (S.user !== "root") throw "chown: modification du propriétaire de '" + targets[0] + "': Opération non permise";
      var s = spec.split(":"), usr = s[0], grp = s[1];
      if (usr && !uid(usr)) throw "chown: utilisateur incorrect: « " + usr + " »";
      function walk(n) { if (usr) n.o = usr; if (grp) n.g = grp; if (r.o.R && n.t === "d") Object.keys(n.kids).forEach(function (k) { walk(n.kids[k]); }); }
      targets.forEach(function (p) { var n = get(resolve(p)); if (!n) throw "chown: impossible d'accéder à '" + p + "': Aucun fichier ou dossier de ce type"; walk(n); });
      return "";
    };
    C.chgrp = function (a) {
      var r = opts(a), grp = r.a[0], targets = r.a.slice(1);
      function walk(n) { n.g = grp; if (r.o.R && n.t === "d") Object.keys(n.kids).forEach(function (k) { walk(n.kids[k]); }); }
      targets.forEach(function (p) {
        var n = get(resolve(p)); if (!n) throw "chgrp: impossible d'accéder à '" + p + "': Aucun fichier ou dossier de ce type";
        if (S.user !== "root" && n.o !== S.user) throw "chgrp: modification du groupe de '" + p + "': Opération non permise";
        walk(n);
      });
      return "";
    };
    function addLine(path, line) { var f = get(path); f.c += line + "\n"; }
    function nextId() {
      var m = 999; get("/etc/passwd").c.split("\n").forEach(function (l) { var u = +l.split(":")[2]; if (u >= 1000 && u > m) m = u; });
      return m + 1;
    }
    function makeUser(name, withHome, extra) {
      if (uid(name)) throw "adduser : l'utilisateur « " + name + " » existe déjà";
      var id = nextId();
      addLine("/etc/passwd", name + ":x:" + id + ":" + id + "::/home/" + name + ":/bin/bash");
      addLine("/etc/group", name + ":x:" + id + ":");
      if (withHome) { var h = dir(493, name, name); get("/home").kids[name] = h; }
      (extra || []).forEach(function (g) { addToGroup(g, name); });
    }
    function addToGroup(g, u) {
      var f = get("/etc/group"), found = false;
      f.c = f.c.split("\n").map(function (l) {
        var p = l.split(":"); if (p[0] !== g) return l; found = true;
        var m = (p[3] || "").split(",").filter(Boolean); if (m.indexOf(u) < 0) m.push(u);
        return p[0] + ":" + p[1] + ":" + p[2] + ":" + m.join(",");
      }).join("\n");
      if (!found) throw "usermod : le groupe « " + g + " » n'existe pas";
    }
    function needRoot(c) { if (S.user !== "root") throw c + " : Permission non accordée (essaie avec sudo)"; }
    C.adduser = function (a) {
      needRoot("adduser"); var n = a[0]; if (!n) throw "adduser : nom d'utilisateur manquant";
      makeUser(n, true); return "Ajout de l'utilisateur « " + n + " » ...\nAjout du nouveau groupe « " + n + " »\nCréation du répertoire personnel « /home/" + n + " »\nL'utilisateur « " + n + " » a été ajouté.\n";
    };
    C.useradd = function (a) {
      needRoot("useradd"); var r = opts(a, { G: 1, g: 1, s: 1 }), n = r.a[0];
      if (!n) throw "useradd : nom d'utilisateur manquant";
      makeUser(n, !!r.o.m, r.o.G ? String(r.o.G).split(",") : []); return "";
    };
    C.groupadd = function (a) {
      needRoot("groupadd"); var g = a[0]; if (!g) throw "groupadd : nom manquant";
      if (get("/etc/group").c.split("\n").some(function (l) { return l.split(":")[0] === g; })) throw "groupadd : le groupe « " + g + " » existe déjà";
      var max = 999; get("/etc/group").c.split("\n").forEach(function (l) { var x = +l.split(":")[2]; if (x >= 1000 && x > max) max = x; });
      addLine("/etc/group", g + ":x:" + (max + 1) + ":"); return "";
    };
    C.usermod = function (a) {
      needRoot("usermod"); var r = opts(a, { G: 1 }), n = r.a[0];
      if (!uid(n)) throw "usermod : l'utilisateur « " + n + " » n'existe pas";
      if (!r.o.G) throw "usermod : option -G manquante";
      String(r.o.G).split(",").forEach(function (g) { addToGroup(g, n); }); return "";
    };
    C.id = function (a) {
      var u = a[0] || S.user, p = uid(u); if (!p) throw "id : « " + u + " » : utilisateur inexistant";
      var gs = groupsOf(u), g = get("/etc/group").c.split("\n");
      function gid(n) { var l = g.filter(function (x) { return x.split(":")[0] === n; })[0]; return l ? l.split(":")[2] : "?"; }
      return "uid=" + p[2] + "(" + u + ") gid=" + p[3] + "(" + (g.filter(function (x) { return x.split(":")[2] === p[3]; })[0] || "").split(":")[0] + ") groupes=" + gs.map(function (n) { return gid(n) + "(" + n + ")"; }).join(",") + "\n";
    };
    C.groups = function (a) { var u = a[0] || S.user; if (!uid(u)) throw "groups : « " + u + " » : utilisateur inexistant"; var gs = groupsOf(u); return (a[0] ? u + " : " : "") + gs.join(" ") + "\n"; };
    C.sudo = function (a) {
      if (!a.length) throw "usage : sudo commande";
      var prev = S.user; S.user = "root";
      try { return exec(a, S.stdin); } finally { S.user = prev; }
    };
    C.tar = function (a) {
      var r = opts(a.length && a[0].charAt(0) !== "-" ? ["-" + a[0]].concat(a.slice(1)) : a, { f: 1 });
      var af = r.o.f, paths = r.a, out = "";
      if (!af) throw "tar : l'option « f » est requise ici";
      function list(prefix, n, acc) { acc.push(n.t === "d" && prefix.slice(-1) !== "/" ? prefix + "/" : prefix); if (n.t === "d") Object.keys(n.kids).sort(cmpName).forEach(function (k) { list(prefix.replace(/\/$/, "") + "/" + k, n.kids[k], acc); }); return acc; }
      if (r.o.c) {
        var items = [];
        paths.forEach(function (p) {
          var n = get(resolve(p)); if (!n) throw "tar : " + p + " : stat impossible : Aucun fichier ou dossier de ce type";
          var rel = p.replace(/^\.?\//, "").replace(/\/$/, "");
          items.push({ p: rel, n: deep(n) });
          if (r.o.v) list(n.t === "d" ? rel + "/" : rel, n, []).forEach(function (x) { out += x + "\n"; });
        });
        writeFile(af, "[archive]", false);
        var f = get(resolve(af)); f.arc = items; if (r.o.z) f.gzipped = true;
        return out;
      }
      var fn = get(resolve(af)); if (!fn) throw "tar : " + af + " : open impossible : Aucun fichier ou dossier de ce type";
      var arc = fn.arc; if (fn.gz && fn.gz.arc) throw "tar : " + af + " : ce n'est pas une archive tar (décompresse d'abord avec gunzip)";
      if (!arc) throw "tar : ceci ne ressemble pas à une archive tar";
      if (r.o.t) {
        var res = []; arc.forEach(function (it) { list(it.n.t === "d" ? it.p + "/" : it.p, it.n, []).forEach(function (x) { res.push(x); }); });
        return nl(res.map(function (x, i) { return x; }));
      }
      if (r.o.x) {
        var want = paths;
        arc.forEach(function (it) {
          (function put(path, n) {
            if (want.length && !want.some(function (w) { return path === w.replace(/\/$/, "") || path.indexOf(w.replace(/\/$/, "") + "/") === 0 || w.replace(/\/$/, "").indexOf(path) === 0; })) return;
            var ap = resolve(path), pr = parentOf(ap);
            var par = get(pr.dir);
            if (!par) { C.mkdir(["-p", pr.dir]); par = get(pr.dir); }
            if (n.t === "d") { if (!par.kids[pr.name]) { par.kids[pr.name] = dir(493, S.user, S.user); } Object.keys(n.kids).forEach(function (k) { put(path + "/" + k, n.kids[k]); }); }
            else { var c = deep(n); c.o = c.g = S.user; par.kids[pr.name] = c; if (r.o.v) out += path + "\n"; }
            if (n.t === "d" && r.o.v) out += path + "/\n";
          })(it.p, it.n);
        });
        return out;
      }
      throw "tar : vous devez spécifier c, t ou x";
    };
    C.gzip = function (a) {
      a.forEach(function (p) {
        var ap = resolve(p), n = get(ap); if (!n || n.t !== "f") throw "gzip: " + p + ": Aucun fichier ou dossier de ce type";
        var pr = parentOf(ap), d = get(pr.dir); d.kids[pr.name + ".gz"] = { t: "f", c: "[gzip]", gz: deep(n), m: n.m, o: n.o, g: n.g }; delete d.kids[pr.name];
      }); return "";
    };
    C.gunzip = function (a) {
      a.forEach(function (p) {
        var ap = resolve(p), n = get(ap); if (!n || !n.gz) throw "gzip: " + p + ": pas au format gzip ou fichier absent";
        var pr = parentOf(ap), d = get(pr.dir); d.kids[pr.name.replace(/\.gz$/, "")] = n.gz; delete d.kids[pr.name];
      }); return "";
    };
    C.sleep = function () { return ""; };
    C.ln = function (a) {
      var r = opts(a), t = r.a[0], l = r.a[1];
      if (!t || !l) throw "ln : opérande manquant";
      if (!r.o.s) throw "ln : seuls les liens symboliques (-s) sont simulés";
      var tn = get(resolve(t)), lp = resolve(l), ln = get(lp);
      if (ln && ln.t === "d") lp = lp + "/" + parentOf(resolve(t)).name;
      var pr = parentOf(lp), pd = get(pr.dir);
      if (!pd) throw "ln: impossible de créer le lien symbolique '" + l + "': Aucun fichier ou dossier de ce type";
      if (pd.kids[pr.name]) throw "ln: impossible de créer le lien symbolique '" + l + "': Le fichier existe";
      pd.kids[pr.name] = { t: "f", c: tn && tn.t === "f" ? tn.c : "", lnk: resolve(t), m: 511, o: S.user, g: S.user };
      return "";
    };
    C.wget = function (a) {
      var u = a[a.length - 1] || ""; if (!/^https?:\/\//.test(u)) throw "wget : URL manquante ou invalide";
      var name = u.split("/").pop() || "index.html";
      if (!/latest-fr_FR\.tar\.gz$/.test(u)) { writeFile(name, "<html>…</html>\n", false); return "« " + name + " » enregistré [simulation]\n"; }
      var wp = dir(493, "root", "root");
      wp.kids["index.php"] = file("<?php /* WordPress */\n", 420, "root"); wp.kids["wp-config-sample.php"] = file("<?php\n// ** Réglages MySQL **\ndefine('DB_NAME', 'nom_de_la_base');\n", 420, "root");
      wp.kids["wp-login.php"] = file("<?php // login\n", 420, "root"); wp.kids["wp-content"] = dir(493, "root", "root");
      writeFile(name, "[archive]", false);
      var f = get(resolve(name)); f.arc = [{ p: "wordpress", n: wp }]; f.gzipped = true;
      return "--2026-11-10 08:30:00--  " + u + "\nRésolution de fr.wordpress.org… 198.143.164.252\n« " + name + " » enregistré [13667213/13667213]\n";
    };
    C.nano = C.vi = C.vim = function (a) { return "(simulation : l'éditeur " + "n'est pas disponible ici — utilise echo … >> fichier pour écrire du texte)\n"; };
    C.nginx = function (a) { if (a[0] === "-t") return "nginx: the configuration file /etc/nginx/nginx.conf syntax is ok\nnginx: configuration file /etc/nginx/nginx.conf test is successful\n"; throw "nginx : option non simulée (essaie nginx -t)"; };
    C.service = function (a) { if (!a[1]) throw "Usage : service <service> {start|stop|restart|status}"; needRoot("service"); return "[ ok ] " + a[0] + " : " + a[1] + " effectué (simulation)\n"; };
    C.systemctl = function (a) { if (!a[1]) throw "Usage : systemctl {start|stop|restart|status} <service>"; needRoot("systemctl"); return a[0] + " " + a[1] + " : effectué (simulation)\n"; };
    C.apt = C["apt-get"] = function (a) { needRoot("apt"); return "(simulation) apt " + a.join(" ") + " : paquet traité\n"; };
    C.ps = function () {
      var s = "    PID TTY          TIME CMD\n   1234 pts/0    00:00:00 bash\n";
      S.jobs.forEach(function (j) { s += ("      " + j.pid).slice(-7) + " pts/0    00:00:00 " + j.cmd + "\n"; });
      return s + "   9876 pts/0    00:00:00 ps\n";
    };
    C.jobs = function () { return S.jobs.map(function (j, i) { return "[" + j.id + "]" + (i === S.jobs.length - 1 ? "+" : " ") + "  " + j.state + "                 " + j.cmd + " &"; }).join("\n") + (S.jobs.length ? "\n" : ""); };
    C.kill = function (a) {
      var r = opts(a), t = r.a[0]; if (!t) throw "kill : usage : kill [-9] PID|%job";
      var i = -1;
      S.jobs.forEach(function (j, k) { if (t === "%" + j.id || +t === j.pid) i = k; });
      if (i < 0) throw "bash: kill: " + t + ": processus inexistant ou job inconnu";
      var j = S.jobs.splice(i, 1)[0]; return "[" + j.id + "]+  Terminated              " + j.cmd + "\n";
    };
    C.fg = function (a) { var t = a[0] || "%1"; var i = S.jobs.filter(function (j) { return t === "%" + j.id; })[0]; if (!i) throw "bash: fg: " + t + ": job inexistant"; return i.cmd + "\n(simulation : ^C pour l'arrêter)\n"; };
    C.df = function () { return "Sys. de fichiers  Taille Utilisé Dispo Uti% Monté sur\n/dev/sda1           20G    6,1G   13G  32% /\n"; };
    C.env = C.printenv = function () { return Object.keys(S.env).map(function (k) { return k + "=" + S.env[k]; }).join("\n") + "\n"; };
    C.set = function () { return C.env() + Object.keys(shellVars).map(function (k) { return k + "=" + shellVars[k]; }).join("\n") + (Object.keys(shellVars).length ? "\n" : ""); };
    C.export = function (a) { a.forEach(function (x) { var i = x.indexOf("="); if (i > 0) S.env[x.slice(0, i)] = x.slice(i + 1); else if (shellVars[x] !== undefined) S.env[x] = shellVars[x]; }); return ""; };
    C.unset = function (a) { a.forEach(function (x) { delete S.env[x]; delete shellVars[x]; }); return ""; };
    C.help = function () {
      return "Commandes disponibles (simulées) :\n" + Object.keys(C).filter(function (k) { return k !== "help"; }).sort().join("  ") +
        "\n\nAstuces : Tab complète, ↑ rappelle la commande précédente, `whatis cmd` explique une commande, Ctrl+L efface l'écran.\n";
    };
    var MAN = {
      ls: "liste le contenu d'un dossier", tree: "affiche l'arborescence d'un dossier", cd: "change de dossier", pwd: "affiche le dossier courant", cp: "copie des fichiers", mv: "déplace ou renomme",
      rm: "supprime des fichiers", mkdir: "crée des dossiers", rmdir: "supprime des dossiers vides", cat: "affiche des fichiers", grep: "cherche un motif dans des fichiers",
      chmod: "change les droits d'accès", chown: "change le propriétaire", sort: "trie des lignes", wc: "compte lignes, mots et caractères", head: "affiche le début d'un fichier",
      tail: "affiche la fin d'un fichier", cut: "extrait des champs", tar: "crée ou extrait des archives", echo: "affiche un texte", ps: "liste les processus", kill: "termine un processus",
      ping: "teste la connexion avec une machine", ip: "affiche ou configure le réseau", sudo: "exécute une commande en administrateur", man: "affiche le manuel", find: "cherche des fichiers"
    };
    C.whatis = function (a) { return a.map(function (c) { return MAN[c] ? c + " (1) - " + MAN[c] + "\n" : c + ": rien de pertinent\n"; }).join(""); };
    C.man = function (a) { if (!a[0]) throw "Quel manuel voulez-vous ?"; if (!MAN[a[0]]) throw "Aucune entrée de manuel pour " + a[0]; return "NOM\n       " + a[0] + " - " + MAN[a[0]] + "\n(manuel complet non simulé ; tape `whatis " + a[0] + "`)\n"; };
    C.apropos = function (a) { var o = ""; Object.keys(MAN).forEach(function (k) { if (MAN[k].indexOf(a[0]) >= 0 || k.indexOf(a[0]) >= 0) o += k + " (1) - " + MAN[k] + "\n"; }); return o || a[0] + " : rien de pertinent\n"; };
    /* réseau simulé */
    var HOSTS = { "localhost": "127.0.0.1", "lab-ubuntu": "192.168.1.10", "passerelle": "192.168.1.1", "serveur": "192.168.1.20", "google.fr": "142.250.74.227", "sio-brest.fr": "193.54.80.10" };
    C.ip = function (a) {
      var s = a[0] || "";
      if (s === "a" || s === "addr" || s === "address") return "1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536\n    inet 127.0.0.1/8 scope host lo\n2: enp0s3: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500\n    link/ether 08:00:27:ab:cd:ef\n    inet 192.168.1.10/24 brd 192.168.1.255 scope global enp0s3\n";
      if (s === "r" || s === "route") return "default via 192.168.1.1 dev enp0s3\n192.168.1.0/24 dev enp0s3 proto kernel scope link src 192.168.1.10\n";
      throw "Usage : ip [ a | r ]  (simulation : `ip a` et `ip r`)";
    };
    C.ping = function (a) {
      var r = opts(a, { c: 1 }), h = r.a[0], n = r.o.c ? +r.o.c : 4;
      if (!h) throw "ping : adresse de destination requise";
      var ip = HOSTS[h] || (/^\d+\.\d+\.\d+\.\d+$/.test(h) ? h : null);
      if (!ip) throw "ping: " + h + ": Échec temporaire dans la résolution du nom";
      var ok = /^(127\.|192\.168\.1\.(1|10|20)$)|^142\.|^193\./.test(ip), o = "PING " + h + " (" + ip + ") 56(84) octets de données.\n";
      for (var i = 1; i <= n; i++) o += ok ? "64 octets de " + ip + " : icmp_seq=" + i + " ttl=64 temps=" + (0.4 + i / 10).toFixed(1) + " ms\n" : "De 192.168.1.10 icmp_seq=" + i + " Hôte de destination inaccessible\n";
      return o + "--- statistiques ping " + h + " ---\n" + n + " paquets transmis, " + (ok ? n : 0) + " reçus, " + (ok ? "0" : "100") + "% paquets perdus\n";
    };
    C.nslookup = function (a) { var ip = HOSTS[a[0]]; if (!ip) throw "** le serveur ne trouve pas " + a[0] + " : NXDOMAIN"; return "Nom :     " + a[0] + "\nAdresse : " + ip + "\n"; };
    C.find = function (a) {
      var r = opts(a, { name: 1 });
      var start = "."; var nm = null;
      for (var i = 0; i < a.length; i++) { if (a[i] === "-name") nm = a[i + 1]; else if (i === 0 && a[i].charAt(0) !== "-") start = a[i]; }
      var rx = nm ? new RegExp("^" + nm.replace(/[.+^${}()|\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".") + "$") : null, out = [];
      (function walk(ap, shown) {
        var n = get(ap); if (!n) return;
        if (!rx || rx.test(parentOf(ap).name)) out.push(shown);
        if (n.t === "d") Object.keys(n.kids).sort(cmpName).forEach(function (k) { walk(ap + "/" + k, shown + "/" + k); });
      })(resolve(start), start);
      return nl(out);
    };

    /* ---------- analyse de la ligne ---------- */
    function expandVars(s) {
      return s.replace(/\$\{?([A-Za-z_][A-Za-z0-9_]*)\}?/g, function (m, k) { return S.env[k] !== undefined ? S.env[k] : (shellVars[k] !== undefined ? shellVars[k] : ""); });
    }
    function tokenize(line) {
      var toks = [], cur = null, i = 0, q = null;
      function push() { if (cur !== null) { toks.push(cur); cur = null; } }
      for (; i < line.length; i++) {
        var c = line.charAt(i);
        if (q) {
          if (c === q) q = null;
          else { cur.s += c; cur.q = true; if (q === "'") cur.raw = true; else cur.dq = true; }
          continue;
        }
        if (c === "'" || c === '"') { q = c; if (cur === null) cur = { s: "", q: true }; cur.q = true; cur.pieces = true; continue; }
        if (/\s/.test(c)) { push(); continue; }
        if (c === "|" || c === ";" || c === "<" || c === "&") { push(); toks.push({ op: c }); continue; }
        if (c === ">") { push(); if (line.charAt(i + 1) === ">") { toks.push({ op: ">>" }); i++; } else toks.push({ op: ">" }); continue; }
        if (cur === null) cur = { s: "" };
        cur.s += c;
      }
      if (q) throw "bash: erreur de syntaxe : guillemet non fermé";
      push();
      return toks;
    }
    function expandTok(t) {
      /* variables : pas dans les '...' (approximation : on ne développe que si pas de guillemets simples) */
      var s = t.raw ? t.s : expandVars(t.s);
      if (!t.q && /[*?]/.test(s)) return glob(s);
      if (!t.q && s.charAt(0) === "~") s = resolve(s);
      return [s];
    }
    function exec(args, stdin) {
      if (!args.length) return "";
      var name = args[0], a = args.slice(1);
      if (!C[name]) {
        if (name.indexOf("/") >= 0 || name.slice(0, 2) === "./") {
          var n = get(resolve(name));
          if (!n) throw "bash: " + name + ": Aucun fichier ou dossier de ce type";
          if (n.t === "d") throw "bash: " + name + ": est un dossier";
          if (!can(n, 1)) throw "bash: " + name + ": Permission non accordée";
          return "(simulation : " + name + " exécuté)\n";
        }
        throw name + " : commande introuvable";
      }
      S.stdin = stdin;
      return C[name](a, stdin);
    }
    function runLine(line) {
      var toks = tokenize(line), cmds = [], cur = { args: [], in: null, out: null, app: false }, pend = null, bg = false;
      toks.forEach(function (t) {
        if (t.op) {
          if (t.op === ">" || t.op === ">>" || t.op === "<") { pend = t.op; return; }
          if (t.op === "&") { bg = true; return; }
          cmds.push(cur); cur.sep = t.op; cur = { args: [], in: null, out: null }; return;
        }
        if (pend) {
          var v = expandTok(t)[0];
          if (pend === "<") cur.in = v; else { cur.out = v; cur.app = pend === ">>"; }
          pend = null; return;
        }
        cur.args.push(t);
      });
      cmds.push(cur);
      var out = "", pipeIn = null, resultOut = "";
      cmds.forEach(function (c, idx) {
        var args = []; c.args.forEach(function (t, i) { expandTok(t).forEach(function (x) { args.push(x); }); });
        if (!args.length) return;
        if (args.length === 1 && /^[A-Za-z_][A-Za-z0-9_]*=/.test(args[0])) { var e = args[0].indexOf("="); shellVars[args[0].slice(0, e)] = args[0].slice(e + 1); S.env.hasOwnProperty(args[0].slice(0, e)) && (S.env[args[0].slice(0, e)] = args[0].slice(e + 1)); return; }
        var stdin = pipeIn; if (c.in) stdin = readFile(c.in, "bash");
        var res;
        if (bg && args[0] === "sleep") {
          var pid = S.nextPid++, id = S.jobs.length ? S.jobs[S.jobs.length - 1].id + 1 : 1;
          S.jobs.push({ id: id, pid: pid, cmd: args.join(" "), state: "En cours" }); res = "[" + id + "] " + pid + "\n";
        } else res = exec(args, stdin);
        if (c.out) { writeFile(c.out, res, c.app); res = ""; }
        if (c.sep === "|") { pipeIn = res; } else { pipeIn = null; resultOut += res; }
      });
      return resultOut;
    }
    function expandHistory(line) {
      var t = line.trim();
      if (t === "!!") { if (!S.hist.length) throw "bash: !!: événement non trouvé"; return S.hist[S.hist.length - 1]; }
      var m = /^!(-?\d+)$/.exec(t);
      if (m) { var k = +m[1], h = k < 0 ? S.hist[S.hist.length + k] : S.hist[k - 1]; if (!h) throw "bash: " + t + ": événement non trouvé"; return h; }
      m = /^!([A-Za-z].*)$/.exec(t);
      if (m) { for (var i = S.hist.length - 1; i >= 0; i--) if (S.hist[i].indexOf(m[1]) === 0) return S.hist[i]; throw "bash: " + t + ": événement non trouvé"; }
      return line;
    }

    /* ---------- API ---------- */
    function run(line) {
      var out;
      try {
        line = expandHistory(line);
        if (!line.trim()) return "";
        S.hist.push(line.trim());
        out = runLine(line);
      } catch (e) {
        out = (typeof e === "string" ? e : "erreur interne : " + (e && e.message)) + "\n";
        out = out.replace(/\n\n$/, "\n");
      }
      S.last = out; S.outs.push(out); S.cmds.push(line.trim());
      return out;
    }
    function prompt() { return S.user + "@lab:" + shortCwd() + (S.user === "root" ? "#" : "$"); }
    function complete(buf) {
      var m = /^(.*?)(\S*)$/.exec(buf), before = m[1], w = m[2], first = !before.trim();
      var c;
      if (first && w.indexOf("/") < 0) c = Object.keys(C).filter(function (k) { return k.indexOf(w) === 0; }).sort();
      else {
        var i = w.lastIndexOf("/"), dp = i >= 0 ? w.slice(0, i + 1) : "", fp = i >= 0 ? w.slice(i + 1) : w;
        var d = get(resolve(dp || ".")); c = [];
        if (d && d.t === "d") c = Object.keys(d.kids).filter(function (k) { return k.indexOf(fp) === 0 && (k.charAt(0) !== "." || fp.charAt(0) === "."); }).sort().map(function (k) { return dp + k + (d.kids[k].t === "d" ? "/" : ""); });
      }
      return { before: before, list: c, word: w };
    }
    function read(p) { var n = get(p); return n && n.t === "f" ? n.c : null; }
    function mode(p) { var n = get(p); return n ? ("0" + (n.m & 511).toString(8)).slice(-3) : null; }
    function exists(p) { return !!get(p); }
    function owner(p) { var n = get(p); return n ? n.o : null; }
    function group(p) { var n = get(p); return n ? n.g : null; }
    return { run: run, prompt: prompt, complete: complete, S: S, read: read, mode: mode, exists: exists, owner: owner, group: group, get: get, groupsOf: groupsOf, resolve: resolve, hist: S.hist };
  }

  /* ---------- Vérification d'un exercice (règles JSON) ---------- */
  function norm(s) { return String(s).replace(/\s+$/, ""); }
  function check(sh, rules) {
    return (rules || []).every(function (r) {
      var k = Object.keys(r)[0], v = r[k];
      switch (k) {
        case "exists": return sh.exists(v);
        case "absent": return !sh.exists(v);
        case "cwd": return sh.S.cwd === v;
        case "contains": var t = sh.read(v[0]); return t !== null && t.indexOf(v[1]) >= 0;
        case "notcontains": var t2 = sh.read(v[0]); return t2 !== null && t2.indexOf(v[1]) < 0;
        case "equals": var t3 = sh.read(v[0]); return t3 !== null && norm(t3) === norm(v[1]);
        case "lines": var t4 = sh.read(v[0]); return t4 !== null && (t4.match(/\n/g) || []).length === v[1];
        case "mode": return sh.mode(v[0]) === v[1];
        case "owner": return sh.owner(v[0]) === v[1];
        case "group": return sh.group(v[0]) === v[1];
        case "ingroup": return sh.groupsOf(v[0]).indexOf(v[1]) >= 0;
        case "env": return sh.S.env[v[0]] === v[1];
        case "user": return !!sh.read("/etc/passwd").split("\n").filter(function (l) { return l.split(":")[0] === v; }).length;
        case "out": return new RegExp(v, "m").test(sh.S.last);
        case "anyout": return sh.S.outs.some(function (o) { return new RegExp(v, "m").test(o); });
        case "cmd": return sh.S.cmds.some(function (c) { return new RegExp(v).test(c); });
        case "jobs": return sh.S.jobs.length === v;
        default: return false;
      }
    });
  }

  /* ---------- Interface ---------- */
  function mount(box, opts) {
    opts = opts || {};
    var sh = create({ fs: opts.fs, modes: opts.modes, owners: opts.owners, cwd: opts.cwd, user: opts.user });
    box.classList.add("term");
    box.innerHTML = '<div class="term-bar"><i></i><i></i><i></i><span>terminal — bash (simulé)</span></div>' +
      '<div class="term-out" role="log" aria-live="polite"></div>' +
      '<div class="term-line"><span class="term-ps"></span><input class="term-in" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="Ligne de commande"></div>';
    var out = box.querySelector(".term-out"), inp = box.querySelector(".term-in"), ps = box.querySelector(".term-ps");
    var hi = 0, locked = false;
    function setPs() { ps.textContent = sh.prompt() + " "; }
    function print(txt, cls) {
      if (!txt) return;
      var d = document.createElement("div"); d.className = "term-row" + (cls ? " " + cls : ""); d.textContent = txt.replace(/\n$/, "");
      out.appendChild(d); out.scrollTop = out.scrollHeight;
    }
    function submit() {
      if (locked) return;
      var line = inp.value; inp.value = "";
      var e = document.createElement("div"); e.className = "term-row cmd"; e.textContent = ps.textContent + line; out.appendChild(e);
      var res = sh.run(line); hi = sh.hist.length;
      if (res === "\f") out.innerHTML = ""; else print(res);
      setPs(); out.scrollTop = out.scrollHeight;
      if (opts.onCommand) opts.onCommand(sh, line, res);
    }
    function completer() {
      var c = sh.complete(inp.value);
      if (c.list.length === 1) inp.value = c.before + c.list[0] + (c.list[0].slice(-1) === "/" ? "" : " ");
      else if (c.list.length > 1) {
        var p = c.list[0]; c.list.forEach(function (x) { while (x.indexOf(p) !== 0) p = p.slice(0, -1); });
        if (p.length > c.word.length) inp.value = c.before + p; else print(c.list.join("  "));
      }
    }
    function histo(d) {
      if (d < 0 && hi > 0) { hi--; inp.value = sh.hist[hi] || ""; }
      if (d > 0 && hi < sh.hist.length) { hi++; inp.value = sh.hist[hi] || ""; }
    }
    /* rangée de touches pour les écrans tactiles (pas de Tab, de ↑ ni de | sur un clavier de téléphone) */
    var touches = document.createElement("div");
    touches.className = "term-touches";
    touches.innerHTML = [["Tab", "tab"], ["↑", "haut"], ["↓", "bas"], ["|", "|"], ["/", "/"], ["~", "~"], ["-", "-"], [">", ">"], ["*", "*"], ["..", ".."], ["Entrée", "ok"]]
      .map(function (t) { return '<button type="button" data-k="' + t[1] + '">' + t[0] + '</button>'; }).join("");
    box.appendChild(touches);
    touches.addEventListener("mousedown", function (e) { e.preventDefault(); });
    touches.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b || locked) return;
      e.stopPropagation();
      var k = b.dataset.k;
      if (k === "tab") completer(); else if (k === "haut") histo(-1); else if (k === "bas") histo(1); else if (k === "ok") submit();
      else { var a = inp.selectionStart || inp.value.length; inp.value = inp.value.slice(0, a) + k + inp.value.slice(inp.selectionEnd || a); inp.setSelectionRange(a + k.length, a + k.length); }
      inp.focus();
    });
    inp.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter") { ev.preventDefault(); submit(); }
      else if (ev.key === "ArrowUp") { ev.preventDefault(); histo(-1); }
      else if (ev.key === "ArrowDown") { ev.preventDefault(); histo(1); }
      else if (ev.key === "Tab") { ev.preventDefault(); completer(); }
      else if (ev.ctrlKey && ev.key.toLowerCase() === "l") { ev.preventDefault(); out.innerHTML = ""; }
      else if (ev.ctrlKey && ev.key.toLowerCase() === "c") { ev.preventDefault(); print(ps.textContent + inp.value + "^C", "cmd"); inp.value = ""; }
    });
    box.addEventListener("click", function () { if (!locked && window.getSelection().toString() === "") inp.focus(); });
    setPs();
    if (opts.banner !== false) print(opts.banner || "Terminal simulé · tape une commande (Tab = complétion, ↑ = historique). Essaie : ls, pwd, cat notes.txt");
    return {
      sh: sh, input: inp,
      run: function (l) { inp.value = l; submit(); },
      lock: function () { locked = true; inp.disabled = true; },
      focus: function () { inp.focus(); }
    };
  }

  var API = { create: create, check: check, mount: mount, defaultFS: defaultFS };
  root.EFShell = API; root.EFTerm = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})(typeof window !== "undefined" ? window : globalThis);
