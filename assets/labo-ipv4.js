/* Étude Facile — labo Sous-réseaux (SISR).
   Missions de calcul générées au hasard : masque, CIDR, adresse réseau, broadcast, plage, même réseau, découpage, VLSM.
   Modes : parcours guidé (#m=L1-2), bac à sable (#libre), épreuve chronométrée (#examen).
   Progression : localStorage « ef-labo-ipv4 » { done: { "L1-2": 1, … } }. Classement pratique : « sisr-ipv4_pratique ». */
(function () {
  "use strict";
  var EF = window.EtudeFacile, esc = EF.esc, el = EF.el, I = EF.icon;
  var CLE = "ef-labo-ipv4", MID = "sisr-ipv4", NB_EX = 6, DUREE_EX = 720, COEF_EX = 150;
  var $ = function (id) { return document.getElementById(id); };

  /* ---------- calcul IPv4 ---------- */
  function toIP(n) { return [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join("."); }
  function parseIP(s) {
    var m = /^\s*(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\s*$/.exec(String(s));
    if (!m) return null;
    var p = m.slice(1).map(Number);
    if (p.some(function (x) { return x > 255; })) return null;
    return ((p[0] << 24) | (p[1] << 16) | (p[2] << 8) | p[3]) >>> 0;
  }
  function maskOf(c) { return c === 0 ? 0 : ((0xFFFFFFFF << (32 - c)) >>> 0); }
  function net(ip, c) { return (ip & maskOf(c)) >>> 0; }
  function bc(ip, c) { return (net(ip, c) | (~maskOf(c) >>> 0)) >>> 0; }
  function r(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(a) { return a[r(0, a.length - 1)]; }
  function rip() {
    var t = r(0, 2);
    if (t === 0) return ((192 << 24) | (168 << 16) | (r(0, 255) << 8) | r(1, 254)) >>> 0;
    if (t === 1) return ((172 << 24) | (r(16, 31) << 16) | (r(0, 255) << 8) | r(1, 254)) >>> 0;
    return ((10 << 24) | (r(0, 255) << 16) | (r(0, 255) << 8) | r(1, 254)) >>> 0;
  }
  function bloc(c) {
    if (c % 8 === 0) return "Le préfixe tombe pile sur un octet : l'octet " + (c / 8 + 1 > 4 ? 4 : c / 8 + 1) + " et les suivants sont la partie hôte.";
    var o = Math.floor(c / 8), m = (maskOf(c) >>> (24 - 8 * o)) & 255;
    return "Masque " + toIP(maskOf(c)) + " : l'octet " + (o + 1) + " vaut " + m + ", donc des blocs de 256 − " + m + " = <b>" + (256 - m) + "</b> sur cet octet.";
  }
  function bits(n, c) {
    var h = '<div class="octets">';
    for (var o = 0; o < 4; o++) {
      var v = (n >>> (24 - 8 * o)) & 255;
      h += '<div class="oct"><div class="bits">';
      for (var b = 0; b < 8; b++) h += '<span class="bit ' + (o * 8 + b < c ? "n" : "h") + '">' + ((v >> (7 - b)) & 1) + '</span>';
      h += '</div><div class="dec">' + v + '</div></div>';
    }
    return h + '</div>';
  }
  function cidr(s) { var m = /^\s*\/?\s*(\d{1,2})\s*$/.exec(String(s)); return m && +m[1] <= 32 ? +m[1] : null; }
  function entier(s) { var m = /^\s*(\d+)\s*$/.exec(String(s).replace(/\s/g, "")); return m ? +m[1] : null; }

  /* ---------- générateurs de missions ----------
     Chaque générateur renvoie { titre, texte, champs:[{ id, label, type:"ip"|"cidr"|"nombre"|"ouinon", rep }], solution, explication } */
  var G = {
    masque: function () {
      var c = r(16, 30);
      return { titre: "Du préfixe au masque", texte: "<p>Un réseau utilise le préfixe <b>/" + c + "</b>. Donne son masque en notation décimale pointée et le nombre d'hôtes utilisables.</p>",
        champs: [{ id: "m", label: "Masque", type: "ip", rep: maskOf(c) }, { id: "h", label: "Hôtes utilisables", type: "nombre", rep: Math.pow(2, 32 - c) - 2 }],
        solution: "Masque " + toIP(maskOf(c)) + " · " + (Math.pow(2, 32 - c) - 2) + " hôtes",
        explication: "<p>" + c + " bits à 1, puis " + (32 - c) + " bits à 0 :</p>" + bits(maskOf(c), c) + "<p>Hôtes : 2<sup>" + (32 - c) + "</sup> − 2 = <b>" + (Math.pow(2, 32 - c) - 2) + "</b> (on retire l'adresse réseau et le broadcast).</p>" };
    },
    cidr: function () {
      var c = r(16, 30);
      return { titre: "Du masque au préfixe", texte: "<p>Le masque d'un réseau est <b>" + toIP(maskOf(c)) + "</b>. Quel est le préfixe CIDR correspondant ?</p>",
        champs: [{ id: "c", label: "Préfixe (/n)", type: "cidr", rep: c }], solution: "/" + c,
        explication: "<p>On compte les bits à 1 du masque :</p>" + bits(maskOf(c), c) + "<p>Il y en a <b>" + c + "</b>, donc <b>/" + c + "</b>.</p>" };
    },
    reseau: function () {
      var c = r(17, 30), ip = rip();
      return { titre: "Trouver l'adresse réseau", texte: "<p>Un poste a l'adresse <b>" + toIP(ip) + "/" + c + "</b>. Quelle est l'adresse du réseau auquel il appartient ?</p>",
        champs: [{ id: "n", label: "Adresse réseau", type: "ip", rep: net(ip, c) }], solution: toIP(net(ip, c)),
        explication: "<p>" + bloc(c) + "</p><p>Adresse ET masque : on garde les bits réseau (en bleu) et on met les bits d'hôte à 0.</p>" + bits(net(ip, c), c) + "<p>Réseau : <b>" + toIP(net(ip, c)) + "/" + c + "</b></p>" };
    },
    broadcast: function () {
      var c = r(17, 30), ip = rip();
      return { titre: "Trouver le broadcast", texte: "<p>Quelle est l'adresse de diffusion (broadcast) du réseau de <b>" + toIP(ip) + "/" + c + "</b> ?</p>",
        champs: [{ id: "b", label: "Broadcast", type: "ip", rep: bc(ip, c) }], solution: toIP(bc(ip, c)),
        explication: "<p>" + bloc(c) + "</p><p>On part du réseau " + toIP(net(ip, c)) + " et on met tous les bits d'hôte à 1 :</p>" + bits(bc(ip, c), c) + "<p>Broadcast : <b>" + toIP(bc(ip, c)) + "</b></p>" };
    },
    plage: function () {
      var c = r(18, 30), ip = rip(), n = net(ip, c), b = bc(ip, c);
      return { titre: "La plage d'adresses", texte: "<p>Pour le réseau de <b>" + toIP(ip) + "/" + c + "</b>, donne la première et la dernière adresse attribuables à une machine.</p>",
        champs: [{ id: "f", label: "Première adresse", type: "ip", rep: n + 1 }, { id: "l", label: "Dernière adresse", type: "ip", rep: b - 1 }],
        solution: toIP(n + 1) + " → " + toIP(b - 1),
        explication: "<p>" + bloc(c) + "</p><p>Réseau <b>" + toIP(n) + "</b>, broadcast <b>" + toIP(b) + "</b>. La plage va de réseau + 1 à broadcast − 1 : <b>" + toIP(n + 1) + "</b> → <b>" + toIP(b - 1) + "</b> (" + (Math.pow(2, 32 - c) - 2) + " adresses).</p>" };
    },
    meme: function () {
      var c = r(20, 29), a = rip(), n = net(a, c), taille = Math.pow(2, 32 - c), b;
      if (Math.random() < 0.5) b = (n + r(1, taille - 2)) >>> 0;
      else b = (n + (Math.random() < 0.5 ? taille : -taille) + r(1, taille - 2)) >>> 0;
      var ok = net(b, c) === n;
      return { titre: "Même réseau ?", texte: "<p>Machine A : <b>" + toIP(a) + "/" + c + "</b><br>Machine B : <b>" + toIP(b) + "/" + c + "</b></p><p>Peuvent-elles communiquer directement, sans passer par un routeur ?</p>",
        champs: [{ id: "o", label: "Même réseau ?", type: "ouinon", rep: ok }], solution: ok ? "Oui, même réseau" : "Non, réseaux différents",
        explication: "<p>" + bloc(c) + "</p><p>A ET masque = <b>" + toIP(n) + "</b><br>B ET masque = <b>" + toIP(net(b, c)) + "</b></p><p>" + (ok ? "Même résultat : même réseau, communication directe." : "Résultats différents : il faut passer par la passerelle (un routeur).") + "</p>" };
    },
    decoupe: function () {
      var k = pick([2, 4, 8, 16]), e = Math.log2(k), base = ((192 << 24) | (168 << 16) | (r(0, 254) << 8)) >>> 0, c = 24 + e, t = 256 / k, i = r(2, k);
      return { titre: "Découper un /24", texte: "<p>On découpe <b>" + toIP(base) + "/24</b> en <b>" + k + "</b> sous-réseaux de même taille.</p><p>Donne le nouveau préfixe et l'adresse du sous-réseau n° " + i + " (le premier commence à " + toIP(base) + ").</p>",
        champs: [{ id: "c", label: "Nouveau préfixe (/n)", type: "cidr", rep: c }, { id: "n", label: "Adresse du sous-réseau n° " + i, type: "ip", rep: base + (i - 1) * t }],
        solution: "/" + c + " · sous-réseau n° " + i + " : " + toIP(base + (i - 1) * t),
        explication: "<p>" + k + " sous-réseaux = 2<sup>" + e + "</sup> : on emprunte <b>" + e + " bit" + (e > 1 ? "s" : "") + "</b> à la partie hôte, donc <b>/" + c + "</b>.</p><p>Taille de bloc : 256 / " + k + " = <b>" + t + "</b>. Les sous-réseaux commencent à 0, " + t + ", " + 2 * t + "… Le n° " + i + " commence à " + (i - 1) + " × " + t + " = " + (i - 1) * t + " : <b>" + toIP(base + (i - 1) * t) + "</b>.</p>" };
    },
    vlsm: function () {
      var h = pick([5, 10, 12, 20, 25, 30, 40, 50, 60, 100, 120, 200, 250, 500]), b = 2;
      while (Math.pow(2, b) - 2 < h) b++;
      var c = 32 - b;
      return { titre: "Dimensionner un sous-réseau", texte: "<p>Un service a besoin de <b>" + h + " adresses</b> pour ses machines (passerelle comprise). Quel est le plus grand préfixe (le plus petit réseau) qui convient, et combien d'hôtes offre-t-il ?</p>",
        champs: [{ id: "c", label: "Préfixe (/n)", type: "cidr", rep: c }, { id: "h", label: "Hôtes utilisables", type: "nombre", rep: Math.pow(2, b) - 2 }],
        solution: "/" + c + " · " + (Math.pow(2, b) - 2) + " hôtes",
        explication: "<p>On cherche le plus petit nombre de bits d'hôte h tel que 2<sup>h</sup> − 2 ≥ " + h + " :</p><p>" + (b > 2 ? "2<sup>" + (b - 1) + "</sup> − 2 = " + (Math.pow(2, b - 1) - 2) + " (trop peu), " : "") + "2<sup>" + b + "</sup> − 2 = <b>" + (Math.pow(2, b) - 2) + "</b> ✓</p><p>h = " + b + ", donc préfixe 32 − " + b + " = <b>/" + c + "</b>.</p>" };
    }
  };
  var LECONS = [
    { titre: "Masques et CIDR", gens: ["masque", "cidr", "masque", "cidr"] },
    { titre: "Adresse réseau", gens: ["reseau", "reseau", "reseau", "reseau"] },
    { titre: "Broadcast et plage", gens: ["broadcast", "broadcast", "plage", "plage"] },
    { titre: "Même réseau ?", gens: ["meme", "meme", "meme", "meme"] },
    { titre: "Découpage", gens: ["decoupe", "decoupe", "decoupe", "decoupe"] },
    { titre: "VLSM", gens: ["vlsm", "vlsm", "vlsm", "vlsm"] }
  ];
  var ALL = [];
  LECONS.forEach(function (l, li) { l.gens.forEach(function (g, mi) { ALL.push({ id: "L" + (li + 1) + "-" + (mi + 1), li: li, mi: mi, gen: g }); }); });

  /* ---------- progression ---------- */
  function lit() { try { var o = JSON.parse(localStorage.getItem(CLE)) || {}; o.done = o.done || {}; return o; } catch (e) { return { done: {} }; } }
  var prog = lit();
  function sauver() { try { localStorage.setItem(CLE, JSON.stringify(prog)); } catch (e) { /* rien */ } }

  /* ---------- squelette ---------- */
  document.body.appendChild(EF.header("../../"));
  var main = el("main", "wrap page labo labo-ipv4 c-emerald");
  document.body.appendChild(main);
  main.innerHTML =
    '<nav class="crumbs"><a href="../../index.html">Accueil</a><span>›</span><a href="index.html">SISR</a><span>›</span><span>Labo sous-réseaux</span></nav>' +
    '<div class="page-head c-emerald"><div class="ico">/24</div><div><h1>Labo sous-réseaux</h1>' +
    '<div class="sub">Adresses réseau, broadcast, masques, découpage et VLSM : des calculs toujours nouveaux, corrigés pas à pas.</div></div></div>' +
    '<div class="labo-mode chips" role="tablist">' +
    '<a class="chip" data-mode="guide" href="#">' + I("book-open") + ' Parcours guidé</a>' +
    '<a class="chip" data-mode="libre" href="#libre">' + I("pencil-line") + ' Calculateur</a>' +
    '<a class="chip" href="../../evaluation.html#m=sisr&amp;t=pratique&amp;l=1">' + I("timer") + ' Épreuve chronométrée</a>' +
    '<span class="labo-score" id="li-score"></span></div>' +
    '<div class="labo-lecons" id="li-lecons"></div>' +
    '<div class="labo-grid" id="li-grid"><section class="labo-brief" id="li-brief" aria-live="polite"></section>' +
    '<section class="labo-work ip-work" id="li-work"></section></div>';

  function score() {
    var n = ALL.filter(function (m) { return prog.done[m.id]; }).length;
    $("li-score").innerHTML = I("trophy") + " " + n + " / " + ALL.length + " missions";
  }

  /* ---------- formulaire de réponse ---------- */
  function formulaire(q, prefixe) {
    return '<form class="ip-form" id="' + prefixe + '-form" autocomplete="off"><div class="ip-champs">' + q.champs.map(function (c) {
      if (c.type === "ouinon") return '<div class="field"><span>' + esc(c.label) + '</span><div class="chips ip-on" data-champ="' + c.id + '">' +
        '<button type="button" class="chip" data-v="1" aria-pressed="false">Oui</button><button type="button" class="chip" data-v="0" aria-pressed="false">Non</button></div></div>';
      return '<label class="field">' + esc(c.label) + '<input name="' + c.id + '" type="text" inputmode="' + (c.type === "ip" ? "decimal" : "numeric") + '" spellcheck="false" autocapitalize="off" placeholder="' +
        (c.type === "ip" ? "ex. 192.168.1.0" : c.type === "cidr" ? "ex. /24" : "ex. 254") + '"></label>';
    }).join("") + '</div><div class="ip-verdicts" id="' + prefixe + '-res"></div></form>';
  }
  function brancherOuiNon(box) {
    [].forEach.call(box.querySelectorAll(".ip-on"), function (g) {
      g.onclick = function (e) { var b = e.target.closest(".chip"); if (!b) return; [].forEach.call(g.children, function (x) { x.setAttribute("aria-pressed", String(x === b)); }); };
    });
  }
  function valeur(form, c) {
    if (c.type === "ouinon") { var b = form.querySelector('.ip-on[data-champ="' + c.id + '"] [aria-pressed="true"]'); return b ? b.dataset.v === "1" : null; }
    var v = form.querySelector('[name="' + c.id + '"]').value;
    return c.type === "ip" ? parseIP(v) : c.type === "cidr" ? cidr(v) : entier(v);
  }
  function corriger(form, q) {
    return q.champs.map(function (c) { var v = valeur(form, c); return { c: c, v: v, ok: v !== null && v === c.rep }; });
  }
  function aff(c, v) { return c.type === "ip" ? toIP(v) : c.type === "cidr" ? "/" + v : c.type === "ouinon" ? (v ? "Oui" : "Non") : String(v); }

  /* ---------- parcours guidé ---------- */
  var mode = "guide", cur = null, Q = null, essais = 0;
  function renderLecons() {
    var box = $("li-lecons");
    if (mode !== "guide") { box.hidden = true; return; }
    box.hidden = false;
    box.innerHTML = LECONS.map(function (l, li) {
      var ms = ALL.filter(function (m) { return m.li === li; }), d = ms.filter(function (m) { return prog.done[m.id]; }).length;
      return '<div class="labo-lecon' + (cur && cur.li === li ? " on" : "") + (d === ms.length ? " fini" : "") + '"><div class="ll-t"><span class="ll-n">' + (li + 1) + '</span>' + esc(l.titre) + '<span class="ll-c">' + d + '/' + ms.length + '</span></div>' +
        '<div class="ll-dots">' + ms.map(function (m) { return '<a href="#m=' + m.id + '" class="' + (prog.done[m.id] ? "ok" : "") + (cur === m ? " cur" : "") + '">' + (m.mi + 1) + '</a>'; }).join("") + '</div></div>';
    }).join("");
  }
  function ouvrir(m) {
    cur = m; Q = G[m.gen](); essais = 0;
    var idx = ALL.indexOf(m), prev = ALL[idx - 1], next = ALL[idx + 1];
    $("li-brief").innerHTML = '<div class="lb-kicker">Leçon ' + (m.li + 1) + ' · ' + esc(LECONS[m.li].titre) + ' — mission ' + (m.mi + 1) + '/4</div>' +
      '<h2>' + esc(Q.titre) + '</h2><div class="lb-texte">' + Q.texte + '</div>' +
      (prog.done[m.id] ? '<p class="lb-small">Mission déjà validée. Les valeurs changent à chaque fois : refais-la pour t\'entraîner.</p>' : '') +
      '<div class="lb-actions"><button type="button" class="btn" id="li-autre">' + I("rotate-ccw") + ' Autres valeurs</button>' +
      '<button type="button" class="btn" id="li-aide">' + I("lightbulb") + ' Voir la méthode</button></div>' +
      '<div class="lb-nav">' + (prev ? '<a href="#m=' + prev.id + '">← Mission précédente</a>' : '<span></span>') + (next ? '<a href="#m=' + next.id + '">Mission suivante →</a>' : '<span></span>') + '</div>';
    $("li-work").innerHTML = '<div class="ip-carte">' + formulaire(Q, "li") + '<div class="lb-actions"><button type="submit" form="li-form" class="btn primary">' + I("check") + ' Vérifier</button></div><div id="li-corr"></div></div>';
    brancherOuiNon($("li-work"));
    $("li-form").onsubmit = function (e) { e.preventDefault(); verifier(); };
    $("li-autre").onclick = function () { ouvrir(m); };
    $("li-aide").onclick = function () { corrige(false); };
    var f = $("li-work").querySelector("input"); if (f && !matchMedia("(pointer:coarse)").matches) f.focus();
    renderLecons(); score();
  }
  function corrige(gagne) {
    $("li-corr").innerHTML = '<div class="box ' + (gagne ? "retenir" : "attention") + ' lb-win"><b>' + (gagne ? "Bravo, c'est juste !" : "La méthode") + '</b>' + Q.explication +
      (gagne ? "" : '<p><b>Réponse :</b> ' + esc(Q.solution) + '</p>') +
      '<div class="lb-actions">' + (gagne && ALL[ALL.indexOf(cur) + 1] ? '<a class="btn primary" href="#m=' + ALL[ALL.indexOf(cur) + 1].id + '">Mission suivante →</a>' : '') +
      '<button type="button" class="btn" id="li-encore">' + I("rotate-ccw") + ' Nouvelles valeurs</button></div></div>';
    $("li-encore").onclick = function () { ouvrir(cur); };
  }
  function verifier() {
    var res = corriger($("li-form"), Q), tout = res.every(function (x) { return x.ok; });
    essais++;
    $("li-res").innerHTML = res.map(function (x) {
      return '<div class="ip-v ' + (x.ok ? "ok" : "ko") + '"><span class="ck">' + (x.ok ? "✓" : "✗") + '</span>' + esc(x.c.label) + ' : ' + (x.v === null ? "réponse manquante ou mal écrite" : x.ok ? aff(x.c, x.v) : aff(x.c, x.v) + " n'est pas correct") + '</div>';
    }).join("");
    if (tout) {
      if (!prog.done[cur.id]) { prog.done[cur.id] = 1; sauver(); }
      corrige(true); renderLecons(); score();
    } else if (essais >= 2) {
      $("li-corr").innerHTML = '<p class="lb-small">Bloqué ? Clique sur <b>Voir la méthode</b> pour la correction détaillée.</p>';
    }
  }

  /* ---------- calculateur (bac à sable) ---------- */
  function libre() {
    $("li-brief").innerHTML = '<div class="lb-kicker">Calculateur</div><h2>Calcule tout un réseau</h2><div class="lb-texte">' +
      '<p>Entre une adresse et un préfixe : tu obtiens toutes les valeurs, le binaire et, si tu veux, le découpage en sous-réseaux.</p>' +
      '<p>Sers-t\'en pour vérifier un exercice papier, pas pour le faire à ta place !</p></div>' +
      '<div class="box"><b>Rappel</b><p>Taille de bloc = 256 − valeur du masque dans l\'octet « intéressant ». Hôtes = 2<sup>bits d\'hôte</sup> − 2.</p></div>';
    $("li-work").innerHTML = '<div class="ip-carte"><div class="row"><label class="field">Adresse IP<input id="lc-ip" value="192.168.1.130" spellcheck="false" inputmode="decimal"></label>' +
      '<label class="field">Préfixe /n<input id="lc-c" value="26" inputmode="numeric" style="width:6rem"></label>' +
      '<label class="field">Découper en<input id="lc-k" value="4" inputmode="numeric" style="width:6rem"></label></div><div class="err" id="lc-err"></div><div id="lc-out"></div></div>';
    ["lc-ip", "lc-c", "lc-k"].forEach(function (i) { $(i).oninput = calc; });
    calc();
  }
  function kv(l, v) { return '<div><span>' + l + '</span><strong>' + v + '</strong></div>'; }
  function calc() {
    var ip = parseIP($("lc-ip").value), c = cidr($("lc-c").value), k = entier($("lc-k").value) || 1;
    if (ip === null || c === null) { $("lc-err").textContent = ip === null ? "Adresse IP invalide (4 nombres de 0 à 255)." : "Préfixe invalide (0 à 32)."; $("lc-out").innerHTML = ""; return; }
    $("lc-err").textContent = "";
    var n = net(ip, c), b = bc(ip, c), h = 32 - c;
    var html = '<div class="kv">' + kv("Masque", toIP(maskOf(c))) + kv("Adresse réseau", toIP(n) + "/" + c) + kv("Broadcast", toIP(b)) +
      kv("Première adresse", c <= 30 ? toIP(n + 1) : "—") + kv("Dernière adresse", c <= 30 ? toIP(b - 1) : "—") + kv("Hôtes utilisables", c <= 30 ? Math.pow(2, h) - 2 : (c === 31 ? 2 : 1)) + '</div>' +
      '<p class="lb-small" style="margin-top:14px">Binaire (bleu = réseau, orange = hôte)</p><div class="bitscroll">' + bits(ip, c) + '</div>';
    var e = 0; while (Math.pow(2, e) < k) e++;
    if (k > 1 && c + e <= 30) {
      var c2 = c + e, t = Math.pow(2, 32 - c2), nb = Math.pow(2, e), lignes = [];
      for (var i = 0; i < Math.min(nb, 64); i++) { var s = (n + i * t) >>> 0; lignes.push('<tr><td>' + (i + 1) + '</td><td class="m">' + toIP(s) + '/' + c2 + '</td><td class="m">' + toIP(s + 1) + ' → ' + toIP(s + t - 2) + '</td><td class="m">' + toIP(s + t - 1) + '</td></tr>'); }
      html += '<h3 class="ip-h3">Découpage en ' + nb + ' sous-réseaux /' + c2 + ' (' + (t - 2) + ' hôtes chacun)</h3>' +
        '<div class="split">' + lignes.slice(0, 8).map(function (x, i) { return '<div class="a' + (i % 4 + 1) + '">' + (i + 1) + '</div>'; }).join("") + '</div>' +
        '<table><thead><tr><th>#</th><th>Réseau</th><th>Plage</th><th>Broadcast</th></tr></thead><tbody>' + lignes.join("") + '</tbody></table>' + (nb > 64 ? '<p class="lb-small">… ' + (nb - 64) + ' autres</p>' : '');
    } else if (k > 1) html += '<p class="err">Impossible de découper autant : il ne resterait pas assez de bits d\'hôte.</p>';
    $("lc-out").innerHTML = html;
  }

  /* ---------- épreuve chronométrée ---------- */
  var E = null;
  function examen() {
    mode = "examen"; main.classList.add("en-examen");
    $("li-lecons").hidden = true; main.querySelector(".labo-mode").hidden = true;
    var gens = ["masque", "reseau", "broadcast", "plage", "meme", "decoupe", "vlsm", "cidr"].sort(function () { return Math.random() - 0.5; }).slice(0, NB_EX);
    E = { list: gens.map(function (g) { return G[g](); }), i: 0, rep: [], fini: false };
    E.chrono = EF.examChrono("Labo sous-réseaux", DUREE_EX, function () { finExamen(); });
    $("li-grid").insertAdjacentElement("beforebegin", E.chrono.el);
    examOuvrir(0);
  }
  function examOuvrir(i) {
    E.i = i; var q = E.list[i], der = i + 1 >= E.list.length;
    E.chrono.pos("calcul " + (i + 1) + "/" + E.list.length);
    $("li-brief").innerHTML = '<div class="lb-kicker">Calcul ' + (i + 1) + ' sur ' + E.list.length + '</div><h2>' + esc(q.titre) + '</h2><div class="lb-texte">' + q.texte + '</div>' +
      '<p class="lb-small" style="margin-top:10px">Pas de correction pendant l\'épreuve. Tu peux revenir sur un calcul tant que le temps n\'est pas écoulé.</p>' +
      '<div class="ll-dots">' + E.list.map(function (x, j) { return '<a href="#" data-j="' + j + '" class="' + (E.rep[j] ? "ok" : "") + (j === i ? " cur" : "") + '">' + (j + 1) + '</a>'; }).join("") + '</div>';
    $("li-work").innerHTML = '<div class="ip-carte">' + formulaire(q, "ex") + '<div class="lb-actions"><button type="submit" form="ex-form" class="btn' + (der ? '' : ' primary') + '">' + (der ? "Enregistrer" : "Valider et continuer →") + '</button>' +
      '<button type="button" class="btn' + (der ? ' primary' : '') + '" id="ex-fin">Terminer l\'épreuve</button></div></div>';
    brancherOuiNon($("li-work"));
    var form = $("ex-form");
    if (E.rep[i]) E.rep[i].forEach(function (x) {
      if (x.c.type === "ouinon") { if (x.v !== null) form.querySelector('.ip-on[data-champ="' + x.c.id + '"] [data-v="' + (x.v ? 1 : 0) + '"]').setAttribute("aria-pressed", "true"); }
      else form.querySelector('[name="' + x.c.id + '"]').value = x.brut || "";
    });
    form.onsubmit = function (e) {
      e.preventDefault(); garder();
      if (i + 1 < E.list.length) examOuvrir(i + 1); else examOuvrir(i);
    };
    $("ex-fin").onclick = function () {
      garder();
      var faits = E.rep.filter(Boolean).length;
      if (faits < E.list.length && !window.confirm("Terminer maintenant ? Les calculs sans réponse compteront comme faux.")) return;
      finExamen();
    };
    [].forEach.call($("li-brief").querySelectorAll("[data-j]"), function (a) { a.onclick = function (e) { e.preventDefault(); garder(); examOuvrir(+a.dataset.j); }; });
  }
  function garder() {
    var form = $("ex-form"); if (!form) return;
    var q = E.list[E.i], res = corriger(form, q);
    res.forEach(function (x) { if (x.c.type !== "ouinon") x.brut = form.querySelector('[name="' + x.c.id + '"]').value; });
    if (res.some(function (x) { return x.v !== null; })) E.rep[E.i] = res;
  }
  function finExamen() {
    if (E.fini) return; E.fini = true;
    var rest = E.chrono.restant(); E.chrono.stop(); E.chrono.el.remove();
    var box = $("li-grid"); box.className = "labo-resultat";
    EF.examResultat(box, {
      mid: MID, titre: "Labo sous-réseaux", couleur: "emerald", racine: "../../", duree: DUREE_EX, coef: COEF_EX, restant: rest,
      retour: "labo-ipv4.html",
      missions: E.list.map(function (q, i) {
        var rep = E.rep[i], ok = !!rep && rep.every(function (x) { return x.ok; });
        return { titre: q.titre + " — " + q.texte.replace(/<br>/g, " ").replace(/<[^>]+>/g, "").slice(0, 110), ok: ok, solution: q.solution };
      }),
      rejouer: function () { location.hash = "#examen"; location.reload(); }
    });
  }

  /* ---------- routage ---------- */
  function route() {
    if (/^#examen/.test(location.hash)) { if (!E) examen(); return; }
    if (E) { location.reload(); return; }
    var m = /#m=(L\d+-\d+)/.exec(location.hash);
    mode = location.hash === "#libre" ? "libre" : "guide";
    [].forEach.call(main.querySelectorAll(".labo-mode [data-mode]"), function (c) { c.setAttribute("aria-pressed", String(c.dataset.mode === mode)); });
    if (mode === "libre") { cur = null; renderLecons(); score(); libre(); return; }
    var cible = m && ALL.filter(function (x) { return x.id === m[1]; })[0];
    ouvrir(cible || ALL.filter(function (x) { return !prog.done[x.id]; })[0] || ALL[0]);
  }
  window.addEventListener("hashchange", route);
  route();
})();
