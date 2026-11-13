#!/usr/bin/env python3
"""Étude Facile — générateur des cours bonus et de leurs labos.

    python3 outils/gen.py            régénère tout (chapitres, labos, data/modules.js, data/eval-textes.js)

Sources :
  outils/src/<module>.txt     les chapitres d'un module (cours + exercices), format décrit dans outils/README.md
  outils/labos/<module>.py    les leçons et missions du labo du module
  outils/modules.py           la fiche de chaque module bonus (titre, description, labo…)
"""
import html, json, os, re, hashlib, random, importlib.util

ICI = os.path.dirname(os.path.abspath(__file__))
RACINE = os.path.dirname(ICI)
LANGUE = {"lua": "lua", "cpp": "cpp", "java": "java", "javascript": "js"}


# ---------------------------------------------------------------- balisage léger → HTML
def inline(s):
    out = []
    for i, part in enumerate(s.split("`")):
        if i % 2:
            out.append("<code>" + html.escape(part, quote=False) + "</code>")
        else:
            p = html.escape(part, quote=False)
            p = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", p)
            p = re.sub(r"\[([^\]]+)\]\(([^)\s]+)\)", r'<a href="\2">\1</a>', p)
            out.append(p)
    return "".join(out)


def cellules(l):
    cells, cur, code = [], "", False
    for ch in l.strip().strip("|"):
        if ch == "`":
            code = not code
        if ch == "|" and not code:
            cells.append(cur.strip()); cur = ""
        else:
            cur += ch
    cells.append(cur.strip())
    return cells


def bloc_code(info, lignes, langue):
    code = html.escape("\n".join(lignes), quote=False)
    mots = info.split()
    if mots and mots[0] == "run" and langue:
        att = ""
        for m in mots[1:]:
            if m.startswith("stdin="):
                att += ' data-stdin="' + html.escape(m[6:].replace("|", "\n")).replace("\n", "&#10;") + '"'
            elif m == "stdin":
                att += ' data-stdin=""'
            elif m == "err":
                att += ' data-erreur="1"'
            elif m.startswith("lang="):
                langue = m[5:]
        return '<div class="essai" data-langue="%s"%s><pre><code>%s</code></pre></div>' % (langue, att, code)
    return "<pre><code>" + code + "</code></pre>"


def balisage(src, langue=None, labo=None):
    L = src.strip("\n").split("\n")
    out, i, tuto, etape = [], 0, False, False

    def ferme_etape():
        nonlocal etape
        if etape:
            out.append("</div>"); etape = False

    while i < len(L):
        l = L[i]
        if not l.strip():
            i += 1; continue
        if l.startswith("```"):
            info, j = l[3:].strip(), i + 1
            while j < len(L) and not L[j].startswith("```"):
                j += 1
            out.append(bloc_code(info, L[i + 1:j], langue)); i = j + 1; continue
        m = re.match(r"(#{2,4}) (.*)", l)
        if m:
            n = len(m.group(1)); out.append("<h%d>%s</h%d>" % (n, inline(m.group(2)), n)); i += 1; continue
        if l.startswith("# ") and tuto:
            ferme_etape(); out.append('<div class="etape"><h4>%s</h4>' % inline(l[2:])); etape = True; i += 1; continue
        if l.startswith("!tuto "):
            out.append('<section class="tuto"><h3><small>Tutoriel</small>%s</h3>' % inline(l[6:])); tuto = True; i += 1; continue
        if l.strip() == "!fin":
            ferme_etape(); out.append("</section>"); tuto = False; i += 1; continue
        m = re.match(r"!(info|retenir|attention|defi) (.*)", l)
        if m:
            typ, parts = m.group(1), [p.strip() for p in m.group(2).split(" | ")]
            cls = "box" + ("" if typ == "info" else " " + typ)
            corps = "".join("<p>%s</p>" % inline(p) for p in parts[1].split("¶")) if len(parts) > 1 else ""
            if typ == "defi":
                cible = (labo or "") + ("#m=" + parts[2] if len(parts) > 2 and parts[2] else "")
                corps += '<a class="defi-go" href="%s">Relever le défi dans le labo →</a>' % cible
            out.append('<div class="%s"><b>%s</b>%s</div>' % (cls, inline(parts[0]), corps)); i += 1; continue
        if l.startswith("|"):
            rows = []
            while i < len(L) and L[i].startswith("|"):
                rows.append(cellules(L[i])); i += 1
            h = "<table><tr>" + "".join("<th>%s</th>" % inline(c) for c in rows[0]) + "</tr>"
            for r in rows[1:]:
                h += "<tr>" + "".join("<td>%s</td>" % inline(c) for c in r) + "</tr>"
            out.append(h + "</table>"); continue
        if re.match(r"(- |\d+\. )", l):
            tag = "ul" if l.startswith("- ") else "ol"
            pat = r"- " if tag == "ul" else r"\d+\. "
            items = []
            while i < len(L) and re.match(pat, L[i]):
                items.append(re.sub("^" + pat, "", L[i])); i += 1
            out.append("<%s>%s</%s>" % (tag, "".join("<li>%s</li>" % inline(x) for x in items), tag)); continue
        para = []
        while i < len(L) and L[i].strip() and not re.match(r"(```|#{1,4} |!|\||- |\d+\. )", L[i]):
            para.append(L[i].strip()); i += 1
        if not para:  # ligne commençant par un caractère spécial non reconnu
            para.append(L[i].strip()); i += 1
        out.append("<p>%s</p>" % inline(" ".join(para)))
    ferme_etape()
    if tuto:
        out.append("</section>")
    return "\n".join(out)


# ---------------------------------------------------------------- exercices
NIV = {"f": "facile", "m": "moyen", "d": "difficile"}


def exercice(l):
    c = [x.strip() for x in l.split("¤")]
    typ, niv, q = c[0], NIV[c[1]], c[2]
    e = {"niveau": niv}
    if " ::: " in q:
        q, code = q.split(" ::: ", 1)
        e["code"] = code.replace("\\n", "\n")
    e["q"] = q
    expl = c[4] if len(c) > 4 else ""
    if typ == "Q":
        opts = [o.strip() for o in c[3].split(";;")]
        bonne = opts[0]
        rnd = random.Random(int(hashlib.md5(q.encode()).hexdigest(), 16))
        rnd.shuffle(opts)
        e.update(type="qcm", options=opts, answer=opts.index(bonne))
    elif typ == "V":
        e.update(type="vf", answer=c[3].upper().startswith("V"))
    elif typ == "S":
        e.update(type="saisie", answers=[o.strip() for o in c[3].split(";;")])
    elif typ == "A":
        e.update(type="associer", paires=[[x.strip() for x in p.split("=>")] for p in c[3].split(";;")])
    else:
        raise ValueError("type d'exercice inconnu : " + l)
    e["explication"] = expl
    return e


# ---------------------------------------------------------------- chapitres
PAGE = """<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#2b3fe0">
  <title>%(titre)s — Étude Facile</title>
<link rel="icon" type="image/svg+xml" href="../../favicon.svg">

  <link rel="stylesheet" href="../../assets/style.css">
</head>
<body data-module="%(mid)s" data-chapter="%(cid)s">

<!-- ============ COURS ============ (page générée par outils/gen.py depuis outils/src/%(mid)s.txt) -->
<article id="cours">
<div class="box"><b>Cours bonus</b><p>Ce cours est hors programme du BTS : il ne compte ni dans ta progression ni au classement. Il est là pour aller plus loin.</p></div>
%(cours)s%(fin)s
</article>

<!-- ============ EXERCICES ============ -->
<script>
window.EF_EXERCICES = %(exos)s;
</script>
<script src="../../data/modules.js"></script>
<script src="../../assets/app.js"></script>
<script src="../../assets/terminal.js"></script>
%(essai)s<script src="../../assets/chapter.js"></script>
</body>
</html>
"""


def js_json(o):
    return json.dumps(o, ensure_ascii=False, indent=1).replace("</", "<\\/")


def chapitres(mid, fiche):
    import glob
    src = "\n".join(open(f, encoding="utf-8").read() for f in sorted(glob.glob(os.path.join(ICI, "src", mid + "-*.txt"))))
    res = []
    labo = fiche.get("labo", {}).get("href")
    for bloc in re.split(r"^=== ", src, flags=re.M)[1:]:
        tete, _, reste = bloc.partition("\n")
        cid, titre, niv = [x.strip() for x in tete.split(" | ")]
        cours, _, exos = reste.partition("\n--- exos\n")
        ex = [exercice(l) for l in exos.split("\n") if l.strip()]
        langue = LANGUE.get(mid)
        fin = ""
        if labo:
            fin = '\n<div class="box retenir"><b>Passe à la pratique</b><p>Le <a href="%s">%s</a> te fait écrire ces programmes pour de vrai, vérifiés automatiquement.</p></div>' % (labo, fiche["labo"]["titre"])
        page = PAGE % dict(titre=html.escape(titre, quote=False), mid=mid, cid=cid, cours=balisage(cours, langue, labo), fin=fin, exos=js_json(ex),
                           essai='<script src="../../assets/jeu.js"></script>\n<script src="../../assets/essai.js"></script>\n' if langue else "")
        os.makedirs(os.path.join(RACINE, "modules", mid), exist_ok=True)
        open(os.path.join(RACINE, "modules", mid, cid + ".html"), "w", encoding="utf-8").write(page)
        res.append({"id": cid, "titre": titre, "niveau": NIV[niv], "n": len(ex)})
    return res


INDEX = """<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#2b3fe0">
  <title>%s — Étude Facile</title>
  <link rel="icon" type="image/svg+xml" href="../../favicon.svg">
  <link rel="stylesheet" href="../../assets/style.css">
</head>
<body data-module="%s">
  <script src="../../data/modules.js"></script>
  <script src="../../assets/app.js"></script>
  <script src="../../assets/module.js"></script>
</body>
</html>
"""


# ---------------------------------------------------------------- labos
def esc_rx(s):
    return re.sub(r"([\\^$.|?*+()\[\]{}])", r"\\\1", s)


def rx_sortie(att):
    if att.startswith("re:"):
        return att[3:]
    return "^" + r"[ \t]*\n".join(esc_rx(x) for x in att.split("\n")) + r"[ \t]*$"


def M(id, titre, texte, depart, solution, tests=(), regles=(), indice="", stdin=None, jeu=()):
    """tests : (entrées, sortie attendue[, libellé[, sortie interdite (regex)]]) ; regles : (libellé, code|codei|nocode, regex) ;
    jeu : (libellé, étapes, test JS)."""
    obj = []
    for t in tests:
        ent, att = t[0], t[1]
        vu = att[3:] if att.startswith("re:") else att
        lib = t[2] if len(t) > 2 and t[2] else (("Entrée <code>%s</code> → " % html.escape(", ".join(ent)) if ent else "Le programme affiche ") + "<code>%s</code>" % html.escape(vu.split("\n")[0] + (" …" if "\n" in vu else ""), quote=False))
        test = {"stdin": list(ent), "out": rx_sortie(att)}
        if len(t) > 3:
            test["notout"] = t[3]
        obj.append({"txt": lib, "r": [{"test": test}]})
    for lib, etapes, test in jeu:
        obj.append({"txt": lib, "r": [{"jeu": {"etapes": etapes, "test": test}}]})
    for lib, typ, rx in regles:
        obj.append({"txt": lib, "r": [{typ: rx}]})
    m = {"id": id, "titre": titre, "_texte": texte, "depart": depart, "objectifs": obj, "indice": inline(indice), "solution": solution}
    ent = stdin if stdin is not None else (list(tests[0][0]) if tests else None)
    if ent:
        m["stdin"] = ent
    return m


def labo(mid, fiche):
    lab = fiche["labo"]
    chemin = os.path.join(RACINE, "modules", mid, lab["href"])
    page = open(chemin, encoding="utf-8").read()
    a = page.index("window.EF_CODE = ") + len("window.EF_CODE = ")
    b = page.index("};\n</script>", a) + 1
    cfg = json.loads(page[a:b])
    anciennes = {m["id"]: m for l in cfg["lecons"] for m in l["missions"]}
    spec = importlib.util.spec_from_file_location("labo_" + mid, os.path.join(ICI, "labos", mid + ".py"))
    mod = importlib.util.module_from_spec(spec); mod.M = M
    sc = importlib.util.spec_from_file_location("communs", os.path.join(ICI, "labos", "communs.py"))
    com = importlib.util.module_from_spec(sc); sc.loader.exec_module(com)
    pre = cfg["langue"]

    def avec_exemple(texte, exemple):
        return texte + ("\n\n**Exemple**\n\n```\n" + exemple.strip("\n") + "\n```" if exemple else "")

    def K(cle, depart, solution, exemple="", indice="", regles=()):
        titre, texte, tests = com.COMMUNS[cle]
        return M(pre + "-" + cle, titre, avec_exemple(texte, exemple), depart, solution, tests, regles, indice)

    def J(cle, depart, solution, exemple="", indice="", regles=()):
        titre, texte, obj = com.JEUX[cle]
        return M(pre + "-" + cle, titre, avec_exemple(texte, exemple), depart, solution, (), regles, indice, jeu=obj)

    mod.K, mod.J = K, J
    spec.loader.exec_module(mod)
    lecons, vus = [], set()
    for titre, missions in mod.LECONS:
        ms = []
        for m in missions:
            if isinstance(m, str):
                m = anciennes[m]
            else:
                m = dict(m); m["texte"] = balisage(m.pop("_texte"), None); m = {k: m[k] for k in ["id", "titre", "texte", "depart", "objectifs", "indice", "solution"] + (["stdin"] if "stdin" in m else [])}
            assert m["id"] not in vus, "mission en double : " + m["id"]
            vus.add(m["id"]); ms.append(m)
        lecons.append({"titre": titre, "missions": ms})
    oubli = set(anciennes) - vus
    assert not oubli, "missions existantes oubliées (la progression des élèves serait perdue) : %s" % oubli
    cfg["lecons"] = lecons
    if "sousTitre" in lab:
        cfg["sousTitre"] = lab["sousTitre"]
    open(chemin, "w", encoding="utf-8").write(page[:a] + js_json(cfg) + page[b:])
    return sum(len(l["missions"]) for l in lecons), len(lecons)


# ---------------------------------------------------------------- data/modules.js
def fiche_js(mid, f, chaps):
    lab = f.get("labo")
    l = '  {\n    id: "%s", bonus: true,%s\n    titre: %s,\n    sousTitre: %s,\n    icone: %s,\n    option: "BONUS",\n    couleur: "%s",\n    description: %s,\n' % (
        mid, " evalTextuel: true," if f.get("textuel") else "", *[json.dumps(f[k], ensure_ascii=False) for k in ("titre", "sousTitre", "icone")], f["couleur"], json.dumps(f["description"], ensure_ascii=False))
    if lab:
        l += '    labos: [{ href: "%s", ico: %s, titre: %s, court: %s, texte: %s }],\n' % (lab["href"], json.dumps(f["icone"], ensure_ascii=False), *[json.dumps(lab[k], ensure_ascii=False) for k in ("titre", "court", "texte")])
    l += "    chapitres: [\n" + ",\n".join('      { id: "%s", titre: %s, niveau: "%s" }' % (c["id"], json.dumps(c["titre"], ensure_ascii=False), c["niveau"]) for c in chaps) + "\n    ]\n  }"
    return l


def maj_modules_js(fiches):
    chemin = os.path.join(RACINE, "data", "modules.js")
    s = open(chemin, encoding="utf-8").read()
    marque = "  /* ---------- Cours bonus"
    a = s.index(marque)
    tete = s[a:s.index("\n", a) + 1]
    s = s[:a] + tete + ",\n".join(fiches) + "\n];\n"
    open(chemin, "w", encoding="utf-8").write(s)


def maj_textes():
    spec = importlib.util.spec_from_file_location("textes", os.path.join(ICI, "textes.py"))
    t = importlib.util.module_from_spec(spec); spec.loader.exec_module(t)
    chemin = os.path.join(RACINE, "data", "eval-textes.js")
    s = open(chemin, encoding="utf-8").read().rstrip()
    marque = "\n  /* ---------- cours bonus : généré par outils/gen.py depuis outils/textes.py ---------- */\n"
    s = (s[:s.index(marque)] if marque in s else s[:s.rindex("}")]).rstrip().rstrip(",")
    blocs = []
    for mid, qs in t.TEXTES.items():
        lignes = ["    { q: %s,\n      notions: [\n%s],\n      corrige: %s }" % (
            json.dumps(q, ensure_ascii=False),
            ",\n".join("        { n: %s, rx: %s }" % (json.dumps(n, ensure_ascii=False), json.dumps(rx, ensure_ascii=False)) for n, rx in notions),
            json.dumps(cor, ensure_ascii=False)) for q, notions, cor in qs]
        blocs.append("  %s: [\n%s\n  ]" % (json.dumps(mid), ",\n".join(lignes)))
    open(chemin, "w", encoding="utf-8").write(s + "," + marque + ",\n".join(blocs) + "\n};\n")


def main():
    spec = importlib.util.spec_from_file_location("modules_bonus", os.path.join(ICI, "modules.py"))
    mb = importlib.util.module_from_spec(spec); spec.loader.exec_module(mb)
    fiches = []
    for mid, f in mb.MODULES.items():
        if "fixes" in f:  # chapitres écrits à la main (pas de source dans outils/src) : on garde les pages telles quelles
            chaps = [{"id": c[0], "titre": c[1], "niveau": c[2], "n": 0} for c in f["fixes"]]
            info = "%-11s %2d chapitres (pages non régénérées)" % (mid, len(chaps))
        else:
            chaps = chapitres(mid, f)
            open(os.path.join(RACINE, "modules", mid, "index.html"), "w", encoding="utf-8").write(INDEX % (html.escape(f["titre"]), mid))
            info = "%-11s %2d chapitres, %3d exercices" % (mid, len(chaps), sum(c["n"] for c in chaps))
        if f.get("labo") and os.path.exists(os.path.join(ICI, "labos", mid + ".py")):
            n, nl = labo(mid, f)
            f["labo"]["texte"] = f["labo"]["texte"].replace("{n}", str(n))
            info += ", labo : %d missions en %d leçons" % (n, nl)
        fiches.append(fiche_js(mid, f, chaps))
        print(info)
    maj_modules_js(fiches)
    maj_textes()


if __name__ == "__main__":
    main()
