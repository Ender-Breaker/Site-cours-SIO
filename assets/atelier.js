/* Étude Facile — Atelier de code : attaque / défense (module Cybersécurité).
   L'attaquant ÉCRIT lui-même son exploit contre une fonction volontairement vulnérable (cible-jouet),
   le défenseur RÉÉCRIT cette fonction pour qu'elle résiste tout en restant utilisable.
   Tout s'exécute dans le bac à sable JavaScript (assets/jeu.js → Web Worker, coupure à 5 s) : pas de réseau,
   pas de vrai système, cibles fictives. Par les liens de défi ne circulent que des DONNÉES (la charge
   d'attaque, le résultat), jamais du code : le seul code exécuté est celui que l'utilisateur tape, chez lui.
   Cadre : s'exercer sur ces cibles-jouets est légal ; attaquer un vrai système sans autorisation est un délit. */
(function () {
  "use strict";
  var EF = window.EtudeFacile, esc = EF.esc, el = EF.el;
  var KEY = "ef-atelier";

  /* ===================== catalogue des manches ===================== */
  var R = String.raw; // préserve les antislashs des expressions régulières dans les sources-jouets

  var MANCHES = [
    {
      id: "injection", nom: "Injection SQL", court: "SQL", chapitre: "secu-injections", danger: "Vol de données",
      intro: "La fonction <code>connexion</code> colle l'identifiant et le mot de passe dans une requête, par concaténation. Fais-toi passer pour <b>admin</b> sans connaître son mot de passe, puis rends la fonction sûre.",
      signature: "function connexion(identifiant, motdepasse)",
      prelude: R`
var MEMBRES = [
  { identifiant: "admin", motdepasse: "R7p-Qv2!mXz" },
  { identifiant: "lea", motdepasse: "lea2026" }
];
function evaluerWhere(w, row){
  w = String(w).split("--")[0];
  function val(t){ t = t.trim(); if (t.charAt(0) === "'") return t.slice(1, t.lastIndexOf("'")); return row[t]; }
  function atome(a){ var i = a.indexOf("="); if (i < 0) return false; return val(a.slice(0, i)) === val(a.slice(i + 1)); }
  return w.split(/\bOR\b/i).some(function (o){ return o.split(/\bAND\b/i).every(atome); });
}`,
      cible: R`function connexion(identifiant, motdepasse){
  var where = "identifiant='" + identifiant + "' AND motdepasse='" + motdepasse + "'";
  for (var i = 0; i < MEMBRES.length; i++){
    if (evaluerWhere(where, MEMBRES[i])) return MEMBRES[i].identifiant;
  }
  return null;
}`,
      att: R`var r = connexion(pj.identifiant, pj.motdepasse); return r === "admin";`,
      use: R`return connexion("lea", "lea2026") === "lea" && connexion("lea", "faux") === null && connexion("admin", "R7p-Qv2!mXz") === "admin";`,
      exploits: [{ identifiant: "admin' --", motdepasse: "x" }, { identifiant: "zzz", motdepasse: "x' OR '1'='1" }],
      depart: "// Tu choisis l'identifiant et le mot de passe envoyés au serveur.\n// Renvoie de quoi te connecter en \"admin\" sans son vrai mot de passe.\nreturn { identifiant: \"admin\", motdepasse: \"???\" };",
      consigneDef: "Réécris <code>connexion</code> pour qu'aucune injection ne passe, mais que les vrais comptes se connectent encore. Indice : ne construis plus de texte de requête — compare directement les champs.",
      correction: R`function connexion(identifiant, motdepasse){
  // On ne fabrique plus de texte : on compare les valeurs (comme une requête préparée).
  for (var i = 0; i < MEMBRES.length; i++){
    if (identifiant === MEMBRES[i].identifiant && motdepasse === MEMBRES[i].motdepasse)
      return MEMBRES[i].identifiant;
  }
  return null;
}`
    },
    {
      id: "xss", nom: "XSS (script injecté)", court: "XSS", chapitre: "secu-injections", danger: "Prise de contrôle du navigateur",
      intro: "La fonction <code>afficher</code> insère un commentaire dans la page sans le nettoyer. Écris un commentaire qui exécuterait du code chez les visiteurs, puis corrige la fonction.",
      signature: "function afficher(commentaire)",
      prelude: "",
      cible: R`function afficher(commentaire){
  return "<article class='c'>" + commentaire + "</article>";
}`,
      att: R`var html = afficher(pj);
return /<\s*script\b/i.test(html) || /<[a-z][^>]*\son\w+\s*=/i.test(html) || /javascript:/i.test(html);`,
      use: R`return /&lt;b&gt;/.test(afficher("<b>x</b>")) && afficher("Bonjour Léa").indexOf("Bonjour Léa") >= 0 && !/<\s*script/i.test(afficher("<script>v()</script>"));`,
      exploits: ["<img src=x onerror=alert(1)>", "<script>vol(document.cookie)</script>"],
      depart: "// Ton commentaire est inséré tel quel dans la page.\n// Renvoie un texte qui ferait exécuter du code (une balise, un gestionnaire d'événement...).\nreturn \"???\";",
      consigneDef: "Réécris <code>afficher</code> pour neutraliser le HTML du commentaire (échappe <code>&amp; &lt; &gt; \" '</code>) tout en affichant le texte normal.",
      correction: R`function afficher(commentaire){
  var s = String(commentaire)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  return "<article class='c'>" + s + "</article>";
}`
    },
    {
      id: "acces", nom: "Contrôle d'accès cassé", court: "Accès", chapitre: "cyber-attaques", danger: "Accès aux données d'autrui",
      intro: "Tu es connecté en <b>lea</b> (jeton <code>jeton-lea</code>). La fonction <code>consulter</code> fait confiance au rôle envoyé par le client. Récupère la facture d'admin, puis corrige la fonction.",
      signature: "function consulter(idDoc, requete)",
      prelude: R`
var DOCS = {
  "facture-lea": { proprietaire: "lea", total: "120 €" },
  "facture-admin": { proprietaire: "admin", secret: true, total: "90 000 €" }
};
var SESSIONS = { "jeton-lea": "lea" };   // qui est réellement connecté
var ROLES = { lea: "membre", admin: "admin" };   // rôles côté serveur`,
      cible: R`function consulter(idDoc, requete){
  if (requete.role === "admin") return DOCS[idDoc];   // faille : on croit le rôle envoyé par le client
  var utilisateur = SESSIONS[requete.jeton];
  var d = DOCS[idDoc];
  if (d && d.proprietaire === utilisateur) return d;
  return null;
}`,
      att: R`var r = consulter(pj.idDoc, pj.requete); return !!(r && r.secret === true);`,
      use: R`var self = consulter("facture-lea", { jeton: "jeton-lea" });
var vol = consulter("facture-admin", { jeton: "jeton-lea" });
return !!(self && self.total === "120 €") && vol === null;`,
      exploits: [{ idDoc: "facture-admin", requete: { jeton: "jeton-lea", role: "admin" } }, { idDoc: "facture-admin", requete: { role: "admin" } }],
      depart: "// Tu es lea (jeton \"jeton-lea\"). Vise la facture d'admin.\nreturn { idDoc: \"facture-admin\", requete: { jeton: \"jeton-lea\", role: \"???\" } };",
      consigneDef: "Réécris <code>consulter</code> pour ignorer le rôle envoyé par le client : déduis l'utilisateur du jeton de session, et son rôle de la table <code>ROLES</code> côté serveur.",
      correction: R`function consulter(idDoc, requete){
  var utilisateur = SESSIONS[requete.jeton];   // le jeton seul décide de l'identité
  if (!utilisateur) return null;
  var d = DOCS[idDoc];
  if (!d) return null;
  if (d.proprietaire === utilisateur) return d;
  if (ROLES[utilisateur] === "admin") return d;   // rôle lu côté serveur, jamais depuis la requête
  return null;
}`
    },
    {
      id: "traversee", nom: "Traversée de répertoire", court: "Chemin", chapitre: "cyber-protections", danger: "Lecture de fichiers système",
      intro: "La fonction <code>telecharger</code> colle le nom demandé derrière un dossier public. Lis <code>/etc/passwd</code>, alors que seul <code>/www/public/</code> est prévu, puis corrige la fonction.",
      signature: "function telecharger(nom)",
      prelude: R`
var FS = {
  "/www/public/photo.png": "octets PNG",
  "/www/public/cv.pdf": "octets PDF",
  "/etc/passwd": "root:x:0:0:root:/root:/bin/bash"
};
function lireFichier(chemin){
  var parts = [];
  chemin.split("/").forEach(function (p){
    if (p === "" || p === ".") return;
    if (p === "..") parts.pop(); else parts.push(p);
  });
  return FS["/" + parts.join("/")] || null;
}`,
      cible: R`function telecharger(nom){
  return lireFichier("/www/public/" + nom);
}`,
      att: R`var r = telecharger(pj); return /root:x:0:0/.test(String(r || ""));`,
      use: R`return telecharger("photo.png") === "octets PNG" && telecharger("cv.pdf") === "octets PDF";`,
      exploits: ["../../etc/passwd", "../../../etc/passwd"],
      depart: "// Seul /www/public/ est prévu, mais le nom est collé tel quel.\n// Renvoie un nom qui remonte jusqu'à /etc/passwd.\nreturn \"???\";",
      consigneDef: "Réécris <code>telecharger</code> pour refuser tout nom contenant un séparateur de chemin ou <code>..</code> (ou n'accepte qu'une liste de fichiers connus).",
      correction: R`function telecharger(nom){
  if (/[\/\\]/.test(nom) || nom.indexOf("..") >= 0) return null;   // pas de chemin, pas de ".."
  return lireFichier("/www/public/" + nom);
}`
    },
    {
      id: "commande", nom: "Injection de commande", court: "Shell", chapitre: "cyber-protections", danger: "Exécution de commandes",
      intro: "La fonction <code>sauvegarder</code> glisse le nom du dossier dans une commande shell. Fais exécuter une seconde commande, puis corrige la fonction.",
      signature: "function sauvegarder(nom)",
      prelude: R`
var EXEC = [];
function executer(commande){   // mini-shell-jouet : retient le premier mot de chaque commande
  EXEC = [];
  String(commande).split(/;|&&|\|\|/).forEach(function (part){
    var mot = part.trim().split(/\s+/)[0];
    if (mot) EXEC.push(mot);
  });
  return EXEC;
}`,
      cible: R`function sauvegarder(nom){
  return executer("tar -czf /sauvegardes/" + nom + ".tar.gz /www");
}`,
      att: R`EXEC = []; sauvegarder(pj); return EXEC.length > 1 || EXEC.some(function (m){ return m !== "tar"; });`,
      use: R`EXEC = []; sauvegarder("site-2026"); return EXEC.length === 1 && EXEC[0] === "tar";`,
      exploits: ["site; cat /etc/shadow", "x && rm -rf /"],
      depart: "// Le nom est inséré dans : tar -czf /sauvegardes/<nom>.tar.gz /www\n// Renvoie un nom qui fait exécuter une 2e commande.\nreturn \"???\";",
      consigneDef: "Réécris <code>sauvegarder</code> pour n'accepter qu'un nom simple (lettres, chiffres, tiret, souligné) et refuser tout le reste.",
      correction: R`function sauvegarder(nom){
  if (!/^[A-Za-z0-9_-]+$/.test(nom)) return null;   // liste blanche de caractères
  return executer("tar -czf /sauvegardes/" + nom + ".tar.gz /www");
}`
    }
  ];
  var IM = {};
  MANCHES.forEach(function (m, i) { IM[m.id] = i; });

  /* ===================== exécution en bac à sable ===================== */
  function lancer(src) {
    if (!window.EFJeu || !window.EFJeu.runner) return Promise.resolve({ err: "Le moteur n'est pas chargé." });
    return window.EFJeu.runner("js").console(src, []);
  }
  function progPayload(code) {
    return "function __exploit(){\n" + code + "\n}\n" +
      "var __p; try { __p = __exploit(); } catch (e) { console.log('EF::P::' + JSON.stringify({ __err: String(e && e.message || e) })); __p = undefined; }\n" +
      "if (typeof __p !== 'undefined') console.log('EF::P::' + JSON.stringify(__p));";
  }
  function progVerif(m, cibleSrc, payload) {
    return [
      m.prelude || "", cibleSrc,
      "function __att(pj){ " + m.att + " }",
      "function __use(){ " + m.use + " }",
      "var __pl = " + JSON.stringify(payload) + ";",
      "var __ex = [__pl].concat(" + JSON.stringify(m.exploits) + ");",
      "var a1 = 0, a2 = 0, u = 0;",
      "try { a1 = __att(__pl) ? 1 : 0; } catch (e) {}",
      "try { for (var _i = 0; _i < __ex.length; _i++) { if (__att(__ex[_i])) { a2 = 1; break; } } } catch (e) {}",
      "try { u = __use() ? 1 : 0; } catch (e) {}",
      "console.log('EF::R::' + a1 + a2 + u);"
    ].join("\n");
  }
  function litPayload(out) {
    var m = String(out || "").match(/EF::P::(.*)/g);
    if (!m) return { err: "vide" };
    try {
      var v = JSON.parse(m[m.length - 1].slice(7));
      if (v && v.__err) return { err: v.__err };
      if (v === null || typeof v === "undefined") return { err: "null" };
      return { val: v };
    } catch (e) { return { err: "illisible" }; }
  }
  function litR(out) {
    var m = String(out || "").match(/EF::R::(\d)(\d)(\d)/g);
    if (!m) return null;
    var d = m[m.length - 1].slice(7);
    return { a1: d[0] === "1", a2: d[1] === "1", u: d[2] === "1" };
  }
  // données uniquement : rejette tout ce qui n'est pas chaîne/nombre/booléen/objet simple (profondeur ≤ 4)
  function propre(x, prof) {
    if (prof > 4) return false;
    if (x === null) return true;
    var t = typeof x;
    if (t === "string") return x.length <= 400;
    if (t === "number" || t === "boolean") return true;
    if (Array.isArray(x)) return x.length <= 20 && x.every(function (v) { return propre(v, prof + 1); });
    if (t === "object") { var k = Object.keys(x); return k.length <= 20 && k.every(function (c) { return c.length <= 40 && propre(x[c], prof + 1); }); }
    return false;
  }

  function verifierAttaque(m, code) {
    return lancer(progPayload(code)).then(function (r) {
      if (r.temps) return { err: "Ton code tourne trop longtemps (boucle sans fin ?)." };
      if (r.err) return { err: r.err };
      var p = litPayload(r.out);
      if (p.err === "null") return { err: "Ton code doit se terminer par <code>return</code> suivi de l'entrée piégée." };
      if (p.err) return { err: p.err === "illisible" || p.err === "vide" ? "Ton code doit <code>return</code> une entrée simple (texte ou objet)." : esc(p.err) };
      if (!propre(p.val, 0)) return { err: "L'entrée doit être une simple donnée (texte, nombre ou objet de textes)." };
      return lancer(progVerif(m, m.cible, p.val)).then(function (rv) {
        var res = litR(rv.out);
        return { payload: p.val, valide: !!(res && res.a1) };
      });
    });
  }
  function verifierDefense(m, payload, code) {
    return lancer(progVerif(m, code, payload)).then(function (r) {
      if (r.temps) return { err: "Ton correctif tourne trop longtemps (boucle sans fin ?)." };
      if (r.err) return { err: r.err };
      var res = litR(r.out);
      if (!res) return { err: "Code illisible — vérifie que <code>" + esc(m.signature) + "</code> est bien défini." };
      return { tient: !res.a2, usage: res.u };
    });
  }

  /* ===================== liens de défi (données brouillées, aucun code) ===================== */
  var CLE = "etude-facile-atelier";
  function brouille(s) { var o = ""; for (var i = 0; i < s.length; i++) o += String.fromCharCode(s.charCodeAt(i) ^ CLE.charCodeAt(i % CLE.length)); return o; }
  function encode(o) { return btoa(unescape(encodeURIComponent(brouille(JSON.stringify(o))))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
  function decode(c) {
    try {
      var o = JSON.parse(brouille(decodeURIComponent(escape(atob(String(c).replace(/-/g, "+").replace(/_/g, "/"))))));
      if (!o || o.v !== 1 || typeof o.r !== "number" || !MANCHES[o.r]) return null;
      if (typeof o.p !== "undefined" && !propre(o.p, 0)) return null;
      return o;
    } catch (e) { return null; }
  }
  function nomPropre(s) { return String(s || "").replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 20); }
  function lien(prefixe, o) { return location.origin + location.pathname + "#" + prefixe + "=" + encode(o); }

  /* ===================== statistiques locales ===================== */
  function stats() { try { return JSON.parse(localStorage.getItem(KEY)) || { fait: {} }; } catch (e) { return { fait: {} }; } }
  function marquer(id) { try { var s = stats(); s.fait = s.fait || {}; s.fait[id] = true; localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }

  /* ===================== interface ===================== */
  document.body.appendChild(EF.header("../../"));
  var main = el("main", "wrap page atelier c-secu");
  document.body.appendChild(main);
  function ecran(html, etape) {
    main.innerHTML =
      '<nav class="crumbs"><a href="../../index.html">Accueil</a><span>›</span><a href="index.html">Cybersécurité</a><span>›</span>' +
      (etape ? '<a href="atelier.html" data-accueil>Atelier</a><span>›</span><span>' + esc(etape) + '</span>' : '<span>Atelier de code</span>') + '</nav>' + html;
    var a = main.querySelector("[data-accueil]");
    if (a) a.addEventListener("click", function (e) { e.preventDefault(); history.replaceState(null, "", location.pathname); accueil(); });
    window.scrollTo(0, 0);
    var h = main.querySelector("h1"); if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); }
  }
  function clic(sel, f) { Array.prototype.forEach.call(main.querySelectorAll(sel), function (b) { b.addEventListener("click", function (e) { f(b, e); }); }); }
  function editeur(valeur) {
    var t = el("textarea", "at-code");
    t.spellcheck = false; t.autocapitalize = "off"; t.setAttribute("autocorrect", "off"); t.value = valeur;
    t.addEventListener("keydown", function (e) {
      if (e.key === "Tab") { e.preventDefault(); var s = t.selectionStart, en = t.selectionEnd; t.value = t.value.slice(0, s) + "  " + t.value.slice(en); t.selectionStart = t.selectionEnd = s + 2; }
    });
    return t;
  }
  function pre(src) { return '<pre class="at-cible"><code>' + esc(src) + '</code></pre>'; }

  function accueil() {
    var s = stats(), f = s.fait || {}, n = Object.keys(f).length;
    ecran(
      '<div class="page-head c-secu"><div class="ico">&lt;/&gt;</div><div><h1>Atelier de code : attaque / défense</h1><div class="sub">Écris l\'exploit, puis écris le correctif. Tout tourne dans le navigateur, sur des cibles-jouets.</div></div></div>' +
      '<p class="lead">Chaque manche part d\'une fonction <b>volontairement vulnérable</b>. Côté attaque, tu écris le code qui l\'exploite. Côté défense, tu réécris la fonction pour qu\'elle résiste — sans casser son usage normal. Seul (attaque puis défense), à deux sur le même appareil, ou par un défi envoyé à un ami.</p>' +
      '<div class="at-manches">' + MANCHES.map(function (m, i) {
        return '<section class="at-manche' + (f[m.id] ? " faite" : "") + '"><div class="at-mtete"><h2>' + esc(m.nom) + '</h2><span class="tag">' + esc(m.danger) + '</span></div>' +
          '<p>' + m.intro.replace(/<code>[^<]*<\/code>/g, function (x) { return x; }) + '</p>' +
          '<div class="btns"><button class="btn primary" data-jouer="' + i + '" data-mode="solo">Seul →</button>' +
          '<button class="btn" data-jouer="' + i + '" data-mode="deux">À deux</button>' +
          '<button class="btn" data-jouer="' + i + '" data-mode="lien">Défi par lien</button></div>' +
          (f[m.id] ? '<p class="at-ok-petit">Déjà résolue</p>' : '') + '</section>';
      }).join("") + '</div>' +
      '<p class="duel-stats"><b>Progression</b> · ' + n + ' / ' + MANCHES.length + ' manche' + (n > 1 ? "s" : "") + ' résolue' + (n > 1 ? "s" : "") + '. <a href="duel.html">Passer au duel attaque / défense →</a></p>' +
      '<div class="box attention"><b>Un exercice, pas une arme</b><p>Ces failles sont réelles, mais les cibles sont des fonctions-jouets exécutées dans ton navigateur : rien n\'est envoyé, aucun système réel n\'est touché. Reproduire cela sur un site sans l\'autorisation écrite de son propriétaire est un délit (article 323-1 du Code pénal).</p></div>');
    clic("[data-jouer]", function (b) {
      var m = MANCHES[+b.dataset.jouer], mode = b.dataset.mode;
      if (mode === "lien") attaquer(m, "lien");
      else if (mode === "deux") attaquer(m, "deux");
      else attaquer(m, "solo");
    });
  }

  function barreVerdict() { return '<div class="at-verdict" role="status" aria-live="polite"></div>'; }
  function montrer(txt, type) { main.querySelector(".at-verdict").innerHTML = '<div class="at-note ' + type + '">' + txt + '</div>'; }

  /* ---- phase attaque ---- */
  function attaquer(m, mode) {
    var titre = mode === "solo" ? "Attaque" : mode === "deux" ? "Attaquant : écris l'exploit" : "Compose ton défi";
    ecran(
      '<h1 class="at-h">' + esc(m.nom) + '</h1>' +
      '<div class="at-bandeau rouge"><span class="tag">Attaque</span><p>' + m.intro + '</p></div>' +
      '<p class="at-label">La cible (tu ne peux pas la modifier)</p>' + pre(m.cible) +
      '<p class="at-label">Ton exploit — écris le corps d\'une fonction qui <code>return</code> l\'entrée piégée</p>' +
      '<div class="at-ed"></div>' +
      '<div class="btns"><button class="btn primary" data-test>Tester l\'attaque</button>' + (mode === "solo" ? "" : "") + '</div>' +
      barreVerdict(), titre);
    var ed = editeur(m.depart); main.querySelector(".at-ed").appendChild(ed);
    var payload = null;
    clic("[data-test]", function (b) {
      b.disabled = true; montrer("Exécution…", "attente");
      verifierAttaque(m, ed.value).then(function (res) {
        b.disabled = false;
        if (res.err) return montrer("Erreur : " + res.err, "ko");
        if (!res.valide) return montrer("Ton code s'exécute, mais l'attaque ne réussit pas encore sur la cible. Relis la faille et réessaie.", "ko");
        payload = res.payload;
        var suite = mode === "solo" ? "<button class=\"btn primary\" data-suite>Passer à la défense →</button>"
          : mode === "deux" ? "<button class=\"btn primary\" data-suite>Passer l'appareil au défenseur →</button>"
            : "<button class=\"btn primary\" data-suite>Créer le lien du défi →</button>";
        montrer("<b>Exploit réussi.</b> L\'entrée piégée est acceptée par la cible.<div class=\"btns\">" + suite + "</div>", "ok");
        clic("[data-suite]", function () {
          if (mode === "solo") defendre(m, payload, "solo");
          else if (mode === "deux") passation(m, payload);
          else partager(m, payload);
        });
      });
    });
  }

  function passation(m, payload) {
    ecran('<div class="duel-passe"><div class="ico">&lt;/&gt;</div><h1 class="at-h">Passe l\'appareil au défenseur</h1><p class="lead">L\'exploit est prêt. Défenseur, à toi de corriger la fonction pour qu\'il ne marche plus.</p><button class="btn primary" data-suite>Je suis le défenseur →</button></div>', "Passation");
    clic("[data-suite]", function () { defendre(m, payload, "deux"); });
  }

  function champLien(url) {
    return '<div class="duel-lien"><input type="text" readonly value="' + esc(url) + '" aria-label="Lien à envoyer"><div class="btns"><button class="btn primary" data-copier>Copier le lien</button>' +
      (navigator.share ? '<button class="btn" data-partager>Partager…</button>' : "") + '</div><p class="lb-small" data-copie role="status"></p></div>';
  }
  function brancheLien(url) {
    var champ = main.querySelector(".duel-lien input");
    clic("[data-copier]", function () {
      function fini(ok) { main.querySelector("[data-copie]").textContent = ok ? "Lien copié." : "Copie impossible : sélectionne le lien à la main."; }
      champ.select();
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(champ.value).then(function () { fini(true); }, function () { fini(false); });
      else { try { fini(document.execCommand("copy")); } catch (e) { fini(false); } }
    });
    clic("[data-partager]", function () { navigator.share({ title: "Défi attaque / défense", text: "Sauras-tu corriger cette faille ?", url: url }).catch(function () {}); });
  }
  function partager(m, payload) {
    ecran('<h1 class="at-h">Ton défi est prêt</h1><p class="lead">Signe-le, puis envoie le lien. Ton ami recevra ta faille (' + esc(m.nom) + ') et ton attaque, à lui de corriger le code.</p>' +
      '<label class="duel-nom">Ton prénom ou pseudo <input type="text" maxlength="20" autocomplete="nickname" data-nom placeholder="Anonyme"></label><div data-zone></div>' +
      '<div class="box"><b>Et ensuite ?</b><p>À la fin, ton ami obtient un lien de résultat à te renvoyer : tu verras s\'il a tenu. Tu peux aussi coller le lien sur le forum du site.</p></div>' +
      '<div class="btns"><button class="btn" data-retour>Retour à l\'atelier</button></div>', "Défi");
    function maj() {
      var nom = nomPropre(main.querySelector("[data-nom]").value);
      var url = lien("a", { v: 1, r: IM[m.id], n: nom, p: payload });
      main.querySelector("[data-zone]").innerHTML = champLien(url); brancheLien(url);
    }
    main.querySelector("[data-nom]").addEventListener("input", maj);
    clic("[data-retour]", accueil); maj();
  }

  /* ---- phase défense ---- */
  function defendre(m, payload, mode, nomA) {
    ecran(
      '<h1 class="at-h">' + esc(m.nom) + '</h1>' +
      '<div class="at-bandeau bleu"><span class="tag">Défense</span><p>' + (nomA ? '<b>' + esc(nomA) + '</b> a trouvé une faille. ' : "") + 'Réécris la fonction pour que l\'attaque échoue, sans casser son usage normal.</p></div>' +
      '<div class="at-rapport"><p class="at-label">L\'attaque reçue (entrée piégée)</p><pre class="at-cible rouge"><code>' + esc(JSON.stringify(payload)) + '</code></pre></div>' +
      '<div class="box"><b>Consigne</b><p>' + m.consigneDef + '</p><p class="lb-small">Garde la signature <code>' + esc(m.signature) + '</code>.</p></div>' +
      '<p class="at-label">Ton correctif</p><div class="at-ed"></div>' +
      '<div class="btns"><button class="btn primary" data-test>Tester le correctif</button></div>' +
      barreVerdict(), "Défense");
    var ed = editeur(m.cible); main.querySelector(".at-ed").appendChild(ed);
    clic("[data-test]", function (b) {
      b.disabled = true; montrer("Exécution…", "attente");
      verifierDefense(m, payload, ed.value).then(function (res) {
        b.disabled = false;
        if (res.err) return montrer("Erreur : " + res.err, "ko");
        if (!res.usage) return montrer("L\'attaque est bloquée, mais le correctif casse l\'usage normal (un vrai accès ne fonctionne plus). Rééquilibre.", res.tient ? "ko" : "ko");
        if (!res.tient) return montrer("L\'usage normal marche, mais l\'attaque passe encore. Durcis le filtrage.", "ko");
        marquer(m.id);
        bilan(m, payload, mode, nomA, ed.value);
      });
    });
  }

  function bilan(m, payload, mode, nomA, codeDef) {
    var html = '<h1 class="at-h">Faille corrigée</h1>' +
      '<div class="box retenir"><b>Bravo</b><p>Ton correctif bloque l\'attaque <b>et</b> toutes ses variantes connues, tout en gardant la fonction utilisable. C\'est exactement le travail d\'un développeur sécurisé.</p></div>';
    if (mode === "lien") {
      html += '<div class="box"><b>Renvoie le résultat à ' + esc(nomA || "ton adversaire") + '</b><label class="duel-nom">Ton prénom ou pseudo <input type="text" maxlength="20" autocomplete="nickname" data-nom placeholder="Anonyme"></label><div data-zone></div></div>';
    }
    html += '<details class="duel-regles"><summary>Voir une correction possible</summary>' + pre(m.correction) +
      '<p class="lb-small">Une attaque qui marchait : <code>' + esc(JSON.stringify(m.exploits[0])) + '</code></p></details>' +
      '<p><a href="' + m.chapitre + '.html">Revoir le cours lié</a></p>' +
      '<div class="btns">' + (mode === "deux" ? '<button class="btn primary" data-revanche>Rejouer en échangeant les rôles →</button>' : '') +
      '<button class="btn' + (mode === "deux" ? "" : " primary") + '" data-autre>Autre manche</button><a class="btn" href="duel.html">Duel attaque / défense</a></div>';
    ecran(html, "Bilan");
    if (mode === "lien") {
      var maj = function () {
        var nom = nomPropre(main.querySelector("[data-nom]").value);
        var url = lien("b", { v: 1, r: IM[m.id], n: nomA || "", d: nom, ok: 1 });
        main.querySelector("[data-zone]").innerHTML = champLien(url); brancheLien(url);
      };
      main.querySelector("[data-nom]").addEventListener("input", maj); maj();
    }
    clic("[data-autre]", function () { history.replaceState(null, "", location.pathname); accueil(); });
    clic("[data-revanche]", function () { attaquer(m, "deux"); });
  }

  /* ---- arrivée par un lien ---- */
  function defiRecu(o) {
    var m = MANCHES[o.r];
    ecran('<div class="duel-passe"><div class="ico">&lt;/&gt;</div><h1 class="at-h">' + esc(o.n || "Un élève") + ' te défie</h1><p class="lead">Faille : <b>' + esc(m.nom) + '</b>. Tu reçois l\'attaque, à toi d\'écrire le correctif.</p>' +
      '<div class="btns"><button class="btn primary" data-suite>Relever le défi →</button><button class="btn" data-non>Plus tard</button></div></div>', "Défi reçu");
    clic("[data-suite]", function () { defendre(m, o.p, "lien", o.n); });
    clic("[data-non]", function () { history.replaceState(null, "", location.pathname); accueil(); });
  }
  function resultatRecu(o) {
    var m = MANCHES[o.r];
    ecran('<h1 class="at-h">' + esc(o.d || "Ton adversaire") + ' a corrigé « ' + esc(m.nom) + ' »</h1>' +
      '<div class="box ' + (o.ok ? "retenir" : "attention") + '"><b>' + (o.ok ? "Défense réussie" : "Défense incomplète") + '</b><p>' + (o.ok ? "Ton attaque a bien été bloquée, et le code reste utilisable." : "La faille n\'a pas été entièrement corrigée.") + '</p></div>' +
      '<div class="btns"><button class="btn primary" data-autre>Préparer un nouveau défi</button><a class="btn" href="index.html">Retour au cours</a></div>', "Résultat");
    clic("[data-autre]", function () { history.replaceState(null, "", location.pathname); accueil(); });
  }
  function route() {
    var m = /^#([ab])=([\w-]+)$/.exec(location.hash), o = m && decode(m[2]);
    if (m && !o) {
      ecran('<h1 class="at-h">Ce lien de défi est illisible</h1><p class="lead">Il a sans doute été coupé en le copiant. Demande qu\'on te le renvoie en entier.</p><div class="btns"><button class="btn primary" data-autre>Aller à l\'atelier</button></div>', "Lien");
      clic("[data-autre]", function () { history.replaceState(null, "", location.pathname); accueil(); });
    } else if (o && m[1] === "b") resultatRecu(o);
    else if (o && m[1] === "a" && typeof o.p !== "undefined") defiRecu(o);
    else accueil();
  }
  window.addEventListener("hashchange", route);
  window.EFAtelier = { MANCHES: MANCHES, verifierAttaque: verifierAttaque, verifierDefense: verifierDefense, encode: encode, decode: decode, progVerif: progVerif };
  route();
})();
