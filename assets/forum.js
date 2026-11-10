/* Étude Facile — forum (façon Reddit) sur Firestore.
   posts/{id} : { titre, texte, matiere, auteur, pseudo, cree, score, nbRep, resolu, modifie? }
   posts/{id}/reponses/{rid} : { texte, auteur, pseudo, parent, cree, score, supprime, modifie? }
   votes/{uid} : { m: { "<post>": ±1, "<post>__<réponse>": ±1 } }   (cohérence vérifiée par firestore.rules)
   Routes : forum.html (liste) · #p=<id> (discussion) · #nouveau (nouvelle question) · #m=<matière> (filtre) */
(function () {
  "use strict";
  var EF = window.EtudeFacile, esc = EF.esc, el = EF.el, I = EF.icon;
  var MODS = window.EF_MODULES || [];
  var MATIERES = [{ id: "general", titre: "Général", couleur: "" }].concat(MODS.map(function (m) { return { id: m.id, titre: m.titre, couleur: m.couleur }; }));
  function mat(id) { return MATIERES.filter(function (m) { return m.id === id; })[0] || MATIERES[0]; }

  document.body.appendChild(EF.header(""));
  var navA = document.querySelector('.top-nav a[href="forum.html"]'); if (navA) navA.setAttribute("aria-current", "page");
  var main = el("main", "wrap page forum");
  document.body.appendChild(main);

  var C = null, F = null, mesVotes = {}, filtre = "", tri = "populaires", recherche = "", cache = null;

  /* ---------- utilitaires ---------- */
  function ms(t) { return !t ? Date.now() : typeof t === "number" ? t : t.toMillis ? t.toMillis() : t.seconds ? t.seconds * 1000 : Date.now(); }
  function ilya(t) {
    var s = Math.max(0, (Date.now() - ms(t)) / 1000);
    if (s < 60) return "à l'instant";
    if (s < 3600) return "il y a " + Math.floor(s / 60) + " min";
    if (s < 86400) return "il y a " + Math.floor(s / 3600) + " h";
    if (s < 86400 * 30) return "il y a " + Math.floor(s / 86400) + " j";
    return new Date(ms(t)).toLocaleDateString("fr-FR");
  }
  /* mini-markdown : ```bloc```, `code`, **gras**, *italique*, liens http(s), retours à la ligne */
  function md(t) {
    var blocs = [];
    t = String(t || "").replace(/```(\w*)\n?([\s\S]*?)```/g, function (x, l, c) { blocs.push(c.replace(/\n$/, "")); return "\u0000" + (blocs.length - 1) + "\u0000"; });
    var h = esc(t)
      .replace(/`([^`\n]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*\n]+)\*\*/g, "<b>$1</b>")
      .replace(/(^|[\s(])\*([^*\n]+)\*/g, "$1<i>$2</i>")
      .replace(/(https?:\/\/[^\s<]+[^\s<.,;:!?)])/g, '<a href="$1" target="_blank" rel="noopener nofollow">$1</a>')
      .replace(/\n/g, "<br>");
    return h.replace(/\u0000(\d+)\u0000/g, function (x, i) { return "<pre>" + esc(blocs[+i]) + "</pre>"; });
  }
  function extrait(t) { var s = String(t || "").replace(/```[\s\S]*?```/g, " [code] ").replace(/[`*]/g, "").replace(/\s+/g, " ").trim(); return s.length > 180 ? s.slice(0, 180) + "…" : s; }
  function moi() { return C && C.user(); }
  function pseudo() { var p = C && C.profil(); return p && p.pseudo; }
  function exigeCompte(msg) {
    if (!moi()) { C.ouvrir(); return false; }
    if (!pseudo()) { alerte(msg || "Choisis d'abord un pseudo (menu de ton compte)."); return false; }
    return true;
  }
  function alerte(t) {
    var a = el("div", "fo-toast", esc(t)); document.body.appendChild(a);
    setTimeout(function () { a.classList.add("parti"); }, 2600); setTimeout(function () { a.remove(); }, 3200);
  }
  function erreur(x) {
    console.error(x);
    alerte(x && x.code === "permission-denied" ? "Refusé par Firestore : les règles du forum ne sont pas encore publiées (firestore.rules)." : "Erreur : " + ((x && (x.code || x.message)) || x));
  }

  /* ---------- votes ---------- */
  function boutonsVote(cle, score, petit) {
    var v = mesVotes[cle] || 0;
    return '<div class="fo-vote' + (petit ? " petit" : "") + '" data-cle="' + esc(cle) + '">' +
      '<button type="button" class="up' + (v === 1 ? " on" : "") + '" data-v="1" aria-label="Vote pour" aria-pressed="' + (v === 1) + '">' + I("arrow-up") + '</button>' +
      '<b>' + (score || 0) + '</b>' +
      '<button type="button" class="down' + (v === -1 ? " on" : "") + '" data-v="-1" aria-label="Vote contre" aria-pressed="' + (v === -1) + '">' + I("arrow-down") + '</button></div>';
  }
  function voter(cle, v, boite) {
    if (!exigeCompte()) return;
    var ancien = mesVotes[cle] || 0, nouveau = ancien === v ? 0 : v, delta = nouveau - ancien;
    if (!delta) return;
    var parts = cle.split("__"), ref = parts[1] ? F.doc(C.db, "posts", parts[0], "reponses", parts[1]) : F.doc(C.db, "posts", parts[0]);
    var b = F.writeBatch(C.db), m = {}; m[cle] = nouveau;
    b.set(F.doc(C.db, "votes", moi().uid), { m: m }, { merge: true });
    b.update(ref, { score: F.increment(delta) });
    /* affichage immédiat, annulé si l'écriture échoue */
    mesVotes[cle] = nouveau;
    var sc = boite.querySelector("b"); sc.textContent = (+sc.textContent) + delta;
    majVote(boite, nouveau);
    if (cache) cache.forEach(function (p) { if (p.id === cle) p.score += delta; });
    b.commit().catch(function (x) {
      mesVotes[cle] = ancien; sc.textContent = (+sc.textContent) - delta; majVote(boite, ancien);
      if (cache) cache.forEach(function (p) { if (p.id === cle) p.score -= delta; });
      erreur(x);
    });
  }
  function majVote(boite, v) {
    boite.querySelector(".up").classList.toggle("on", v === 1); boite.querySelector(".up").setAttribute("aria-pressed", String(v === 1));
    boite.querySelector(".down").classList.toggle("on", v === -1); boite.querySelector(".down").setAttribute("aria-pressed", String(v === -1));
  }
  main.addEventListener("click", function (e) {
    var b = e.target.closest(".fo-vote button"); if (!b) return;
    e.preventDefault(); e.stopPropagation();
    voter(b.parentNode.dataset.cle, +b.dataset.v, b.parentNode);
  });
  function chargerVotes() {
    mesVotes = {};
    if (!moi()) return Promise.resolve();
    return F.getDoc(F.doc(C.db, "votes", moi().uid)).then(function (s) { mesVotes = (s.exists() && s.data().m) || {}; }).catch(function () {});
  }

  /* ---------- liste des questions ---------- */
  function chaud(p) { var h = (Date.now() - ms(p.cree)) / 3600000; return (p.score + p.nbRep * 0.5 + 1) / Math.pow(h + 2, 1.3); }
  function liste() {
    main.innerHTML = '<nav class="crumbs"><a href="index.html">Accueil</a><span>›</span><span>Forum</span></nav>' +
      '<div class="page-head"><div class="ico">' + I("message") + '</div><div><h1>Forum</h1>' +
      '<div class="sub">Pose tes questions, aide les autres. Vote pour les meilleures réponses.</div></div>' +
      '<a class="btn primary fo-poser" href="#nouveau">' + I("plus") + ' Poser une question</a></div>' +
      '<div class="fo-outils"><div class="chips" id="fo-mat">' +
      '<button class="chip" data-m="" aria-pressed="' + (!filtre) + '">Toutes</button>' +
      MATIERES.map(function (m) { return '<button class="chip" data-m="' + m.id + '" aria-pressed="' + (filtre === m.id) + '">' + esc(m.titre) + '</button>'; }).join("") + '</div>' +
      '<div class="fo-tri"><input type="search" id="fo-cherche" placeholder="Rechercher…" value="' + esc(recherche) + '" aria-label="Rechercher dans le forum">' +
      '<select id="fo-tri" aria-label="Trier"><option value="populaires">Populaires</option><option value="recentes">Récentes</option><option value="top">Les mieux notées</option><option value="sans">Sans réponse</option></select></div></div>' +
      '<div id="fo-liste"><p class="lead">Chargement des questions…</p></div>';
    document.getElementById("fo-tri").value = tri;
    document.getElementById("fo-mat").onclick = function (e) { var b = e.target.closest(".chip"); if (!b) return; filtre = b.dataset.m; liste(); };
    document.getElementById("fo-tri").onchange = function (e) { tri = e.target.value; afficherListe(); };
    document.getElementById("fo-cherche").oninput = function (e) { recherche = e.target.value; afficherListe(); };
    var q = F.query(F.collection(C.db, "posts"), F.orderBy("cree", "desc"), F.limit(300));
    F.getDocs(q).then(function (snap) {
      cache = []; snap.forEach(function (d) { var p = d.data(); p.id = d.id; cache.push(p); });
      afficherListe();
    }).catch(function (x) {
      document.getElementById("fo-liste").innerHTML = '<div class="box attention"><b>Forum indisponible</b><p>' +
        (x && x.code === "permission-denied" ? "Firestore refuse la lecture : publie les règles du forum (fichier <code>firestore.rules</code>) dans la console Firebase." : esc((x && (x.code || x.message)) || String(x))) + '</p></div>';
    });
  }
  function afficherListe() {
    var box = document.getElementById("fo-liste"); if (!box || !cache) return;
    var r = recherche.trim().toLowerCase();
    var l = cache.filter(function (p) {
      return (!filtre || p.matiere === filtre) && (!r || (p.titre + " " + p.texte + " " + p.pseudo).toLowerCase().indexOf(r) >= 0) && (tri !== "sans" || !p.nbRep);
    });
    if (tri === "populaires") l.sort(function (a, b) { return chaud(b) - chaud(a); });
    else if (tri === "top") l.sort(function (a, b) { return b.score - a.score || ms(b.cree) - ms(a.cree); });
    else l.sort(function (a, b) { return ms(b.cree) - ms(a.cree); });
    if (!l.length) {
      box.innerHTML = '<div class="box fo-vide"><b>' + (cache.length ? "Aucune question ne correspond" : "Aucune question pour l'instant") + '</b><p>' +
        (cache.length ? "Change de filtre, ou pose la question toi-même !" : "Sois le premier à lancer une discussion.") + '</p><a class="btn primary" href="#nouveau">' + I("plus") + ' Poser une question</a></div>';
      return;
    }
    box.innerHTML = '<div class="fo-posts">' + l.map(function (p) {
      var m = mat(p.matiere);
      return '<article class="fo-post c-' + (m.couleur || "") + '">' + boutonsVote(p.id, p.score) +
        '<a class="fo-post-c" href="#p=' + p.id + '"><div class="fo-meta"><span class="fo-tag">' + esc(m.titre) + '</span>' +
        (p.resolu ? '<span class="fo-resolu">' + I("check") + ' Résolu</span>' : '') +
        '<span>par <b>' + esc(p.pseudo) + '</b> · ' + ilya(p.cree) + '</span></div>' +
        '<h2>' + esc(p.titre) + '</h2><p>' + esc(extrait(p.texte)) + '</p>' +
        '<span class="fo-nb">' + I("message") + ' ' + (p.nbRep || 0) + ' réponse' + (p.nbRep > 1 ? "s" : "") + '</span></a></article>';
    }).join("") + '</div>';
  }

  /* ---------- nouvelle question / modification ---------- */
  function formulaire(post) {
    if (!moi()) {
      main.innerHTML = '<nav class="crumbs"><a href="index.html">Accueil</a><span>›</span><a href="#">Forum</a><span>›</span><span>Nouvelle question</span></nav>' +
        '<div class="box fo-vide"><b>Connecte-toi pour poser une question</b><p>Un compte permet aussi de voter et de répondre.</p><button type="button" class="btn primary" id="fo-co">Se connecter</button></div>';
      document.getElementById("fo-co").onclick = function () { C.ouvrir(); };
      return;
    }
    main.innerHTML = '<nav class="crumbs"><a href="index.html">Accueil</a><span>›</span><a href="#">Forum</a><span>›</span><span>' + (post ? "Modifier" : "Nouvelle question") + '</span></nav>' +
      '<form class="fo-form" id="fo-form" novalidate><h1>' + (post ? "Modifier ta question" : "Poser une question") + '</h1>' +
      '<label for="fo-titre">Titre <small>(une phrase claire : c\'est ce que les autres verront en premier)</small></label>' +
      '<input id="fo-titre" maxlength="150" required placeholder="Ex. : Pourquoi mon chmod 644 empêche d\'exécuter mon script ?">' +
      '<label for="fo-matiere">Matière</label><select id="fo-matiere">' + MATIERES.map(function (m) { return '<option value="' + m.id + '">' + esc(m.titre) + '</option>'; }).join("") + '</select>' +
      '<label for="fo-texte">Détails</label>' +
      '<div class="fo-aide">Mise en forme : <code>`code`</code>, <code>```</code> pour un bloc de code, <code>**gras**</code>. Explique ce que tu as essayé.</div>' +
      '<textarea id="fo-texte" rows="10" maxlength="10000"></textarea>' +
      '<details class="fo-apercu"><summary>Aperçu</summary><div id="fo-apercu"></div></details>' +
      '<p class="cd-err" id="fo-err" role="alert"></p>' +
      '<div class="btns"><button type="submit" class="btn primary">' + (post ? "Enregistrer" : "Publier") + '</button><a class="btn" href="' + (post ? "#p=" + post.id : "#") + '">Annuler</a></div></form>';
    var f = document.getElementById("fo-form"), ti = document.getElementById("fo-titre"), ma = document.getElementById("fo-matiere"), tx = document.getElementById("fo-texte");
    if (post) { ti.value = post.titre; ma.value = post.matiere; tx.value = post.texte; }
    else ma.value = filtre || "general";
    tx.oninput = function () { document.getElementById("fo-apercu").innerHTML = md(tx.value) || "<i>Rien à afficher.</i>"; }; tx.oninput();
    ti.focus();
    f.onsubmit = function (e) {
      e.preventDefault();
      var err = document.getElementById("fo-err"), titre = ti.value.trim(), texte = tx.value.trim();
      if (titre.length < 5) { err.textContent = "Le titre doit faire au moins 5 caractères."; return; }
      if (!exigeCompte()) return;
      var btn = f.querySelector("[type=submit]"); btn.disabled = true;
      var job = post
        ? F.updateDoc(F.doc(C.db, "posts", post.id), { titre: titre, texte: texte, matiere: ma.value, modifie: true }).then(function () { return post.id; })
        : F.addDoc(F.collection(C.db, "posts"), { titre: titre, texte: texte, matiere: ma.value, auteur: moi().uid, pseudo: pseudo(), cree: F.serverTimestamp(), score: 0, nbRep: 0, resolu: null }).then(function (r) { return r.id; });
      job.then(function (id) { cache = null; location.hash = "#p=" + id; })
        .catch(function (x) { btn.disabled = false; err.textContent = x && x.code === "permission-denied" ? "Refusé par Firestore : vérifie que les règles du forum sont publiées." : "Erreur : " + (x.code || x.message); });
    };
  }

  /* ---------- discussion ---------- */
  var P = null, REPS = [];
  function discussion(id) {
    main.innerHTML = '<p class="lead">Chargement…</p>';
    Promise.all([
      F.getDoc(F.doc(C.db, "posts", id)),
      F.getDocs(F.query(F.collection(C.db, "posts", id, "reponses"), F.orderBy("cree", "asc"), F.limit(500)))
    ]).then(function (r) {
      if (!r[0].exists()) { main.innerHTML = '<div class="box attention"><b>Discussion introuvable</b><p>Elle a peut-être été supprimée.</p><a class="btn" href="#">Retour au forum</a></div>'; return; }
      P = r[0].data(); P.id = id; REPS = [];
      r[1].forEach(function (d) { var x = d.data(); x.id = d.id; REPS.push(x); });
      rendreDiscussion();
    }).catch(function (x) {
      main.innerHTML = '<div class="box attention"><b>Impossible de charger la discussion</b><p>' + esc((x && (x.code || x.message)) || String(x)) + '</p><a class="btn" href="#">Retour au forum</a></div>';
    });
  }
  function rendreDiscussion() {
    var m = mat(P.matiere), auteur = moi() && moi().uid === P.auteur;
    var enfants = {}; REPS.forEach(function (x) { (enfants[x.parent || ""] = enfants[x.parent || ""] || []).push(x); });
    Object.keys(enfants).forEach(function (k) { enfants[k].sort(function (a, b) { return (b.id === P.resolu) - (a.id === P.resolu) || b.score - a.score || ms(a.cree) - ms(b.cree); }); });
    function fil(parent, prof) {
      return (enfants[parent] || []).map(function (x) {
        var a = moi() && moi().uid === x.auteur, best = P.resolu === x.id;
        return '<div class="fo-rep' + (best ? " best" : "") + (x.auteur === P.auteur ? " op" : "") + '" id="r-' + x.id + '" style="--prof:' + Math.min(prof, 4) + '">' +
          boutonsVote(P.id + "__" + x.id, x.score, true) +
          '<div class="fo-rep-c"><div class="fo-meta"><b>' + (x.supprime ? "[supprimé]" : esc(x.pseudo)) + '</b>' + (x.auteur === P.auteur && !x.supprime ? '<span class="fo-op">auteur</span>' : '') +
          '<span>· ' + ilya(x.cree) + (x.modifie ? " · modifié" : "") + '</span>' + (best ? '<span class="fo-resolu">' + I("check") + ' Meilleure réponse</span>' : '') + '</div>' +
          '<div class="fo-texte">' + (x.supprime ? "<i>Réponse supprimée par son auteur.</i>" : md(x.texte)) + '</div>' +
          (x.supprime ? '' : '<div class="fo-actions"><button type="button" data-a="repondre" data-id="' + x.id + '">' + I("message") + ' Répondre</button>' +
            (auteur && !x.supprime ? '<button type="button" data-a="best" data-id="' + x.id + '">' + I("check") + ' ' + (best ? "Retirer « meilleure réponse »" : "Meilleure réponse") + '</button>' : '') +
            (a ? '<button type="button" data-a="suppr-rep" data-id="' + x.id + '">Supprimer</button>' : '') + '</div>') +
          '<div class="fo-sous" data-pour="' + x.id + '"></div>' + fil(x.id, prof + 1) + '</div></div>';
      }).join("");
    }
    main.innerHTML = '<nav class="crumbs"><a href="index.html">Accueil</a><span>›</span><a href="#">Forum</a><span>›</span><span>' + esc(m.titre) + '</span></nav>' +
      '<article class="fo-question c-' + (m.couleur || "") + '">' + boutonsVote(P.id, P.score) +
      '<div class="fo-q-c"><div class="fo-meta"><span class="fo-tag">' + esc(m.titre) + '</span>' + (P.resolu ? '<span class="fo-resolu">' + I("check") + ' Résolu</span>' : '') +
      '<span>par <b>' + esc(P.pseudo) + '</b> · ' + ilya(P.cree) + (P.modifie ? " · modifié" : "") + '</span></div>' +
      '<h1>' + esc(P.titre) + '</h1><div class="fo-texte">' + (md(P.texte) || "") + '</div>' +
      (auteur ? '<div class="fo-actions"><a href="#modifier=' + P.id + '">Modifier</a><button type="button" data-a="suppr-post">Supprimer la question</button></div>' : '') +
      '</div></article>' +
      '<section class="fo-reponses"><h2>' + REPS.filter(function (x) { return !x.supprime; }).length + ' réponse' + (REPS.length > 1 ? "s" : "") + '</h2>' +
      '<div class="fo-repondre" id="fo-racine"></div>' + (fil("", 0) || '<p class="lb-small">Pas encore de réponse. Aide ' + esc(P.pseudo) + ' !</p>') + '</section>';
    zoneReponse(document.getElementById("fo-racine"), null);
    if (location.hash.indexOf("&r=") > 0) { var c = document.getElementById("r-" + location.hash.split("&r=")[1]); if (c) c.scrollIntoView({ block: "center" }); }
  }
  function zoneReponse(box, parent) {
    if (!moi()) {
      box.innerHTML = '<div class="fo-co">Connecte-toi pour répondre. <button type="button" class="btn" data-a="connexion">Se connecter</button></div>';
      return;
    }
    box.innerHTML = '<form class="fo-rform"><textarea rows="' + (parent ? 3 : 4) + '" maxlength="5000" placeholder="' + (parent ? "Ta réponse…" : "Écris une réponse (`code`, ``` pour un bloc, **gras**)…") + '" required></textarea>' +
      '<div class="btns"><button type="submit" class="btn primary">Répondre</button>' + (parent ? '<button type="button" class="btn" data-a="annuler">Annuler</button>' : '') + '</div></form>';
    var f = box.querySelector("form"), t = f.querySelector("textarea");
    if (parent) t.focus();
    f.onsubmit = function (e) {
      e.preventDefault();
      var texte = t.value.trim(); if (!texte || !exigeCompte()) return;
      var b = f.querySelector("[type=submit]"); b.disabled = true;
      var ref = F.doc(F.collection(C.db, "posts", P.id, "reponses")), lot = F.writeBatch(C.db);
      lot.set(ref, { texte: texte, auteur: moi().uid, pseudo: pseudo(), parent: parent, cree: F.serverTimestamp(), score: 0, supprime: false });
      lot.update(F.doc(C.db, "posts", P.id), { nbRep: F.increment(1) });
      lot.commit().then(function () {
        cache = null; P.nbRep = (P.nbRep || 0) + 1;
        REPS.push({ id: ref.id, texte: texte, auteur: moi().uid, pseudo: pseudo(), parent: parent, cree: Date.now(), score: 0, supprime: false });
        rendreDiscussion();
        var n = document.getElementById("r-" + ref.id); if (n) { n.scrollIntoView({ block: "center" }); n.classList.add("nouveau"); }
      }).catch(function (x) { b.disabled = false; erreur(x); });
    };
  }
  main.addEventListener("click", function (e) {
    var b = e.target.closest("[data-a]"); if (!b || !main.contains(b)) return;
    var a = b.dataset.a, id = b.dataset.id;
    if (a === "connexion") { C.ouvrir(); return; }
    if (a === "repondre") {
      if (!exigeCompte()) return;
      var z = main.querySelector('.fo-sous[data-pour="' + id + '"]'); if (z.innerHTML) { z.innerHTML = ""; return; }
      zoneReponse(z, id);
    } else if (a === "annuler") { b.closest(".fo-sous").innerHTML = ""; }
    else if (a === "best") {
      var val = P.resolu === id ? null : id;
      F.updateDoc(F.doc(C.db, "posts", P.id), { resolu: val }).then(function () { P.resolu = val; cache = null; rendreDiscussion(); }).catch(erreur);
    } else if (a === "suppr-rep") {
      if (!window.confirm("Supprimer cette réponse ?")) return;
      F.updateDoc(F.doc(C.db, "posts", P.id, "reponses", id), { texte: "", supprime: true }).then(function () {
        REPS.forEach(function (x) { if (x.id === id) { x.supprime = true; x.texte = ""; } }); rendreDiscussion();
      }).catch(erreur);
    } else if (a === "suppr-post") {
      if (!window.confirm("Supprimer définitivement ta question ?")) return;
      F.deleteDoc(F.doc(C.db, "posts", P.id)).then(function () { cache = null; location.hash = ""; }).catch(erreur);
    }
  });

  /* ---------- routage ---------- */
  function route() {
    var h = location.hash, m;
    window.scrollTo(0, 0);
    if ((m = /^#p=([\w-]+)/.exec(h))) discussion(m[1]);
    else if (h === "#nouveau") formulaire(null);
    else if ((m = /^#modifier=([\w-]+)/.exec(h))) {
      F.getDoc(F.doc(C.db, "posts", m[1])).then(function (s) { if (s.exists() && moi() && s.data().auteur === moi().uid) { var p = s.data(); p.id = s.id; formulaire(p); } else location.hash = "#p=" + m[1]; });
    } else {
      if ((m = /^#m=([\w-]+)/.exec(h))) filtre = m[1];
      liste();
    }
  }
  window.addEventListener("hashchange", function () { if (C) route(); });

  function demarrer() {
    if (C) return; C = window.EFCloud; F = C.F;
    var premier = true;
    C.A.onAuthStateChanged(C.auth, function () {
      /* le profil (pseudo) arrive juste après la connexion */
      setTimeout(function () { chargerVotes().then(function () { if (premier || !/^#(nouveau|modifier)/.test(location.hash)) route(); premier = false; }); }, premier ? 0 : 600);
    });
  }
  if (window.EFCloud) demarrer();
  else {
    main.innerHTML = '<p class="lead">Connexion au forum…</p>';
    document.addEventListener("ef-cloud-pret", demarrer);
    setTimeout(function () {
      if (C) return;
      main.innerHTML = '<div class="box attention"><b>Forum indisponible</b><p>' + (window.EF_FIREBASE_CONFIG ? "Impossible de joindre Firebase. Vérifie ta connexion (ou un bloqueur de publicités), puis recharge la page." : "Les comptes ne sont pas activés sur ce site.") + '</p></div>';
    }, 12000);
  }
})();
