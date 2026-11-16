/* Étude Facile — classement (Firestore : collection « profils », lecture publique). */
(function () {
  "use strict";
  var EF = window.EtudeFacile, esc = EF.esc, el = EF.el, I = EF.icon;
  var TOUS = (window.EF_MODULES || []).filter(function (m) { return m.chapitres.length; });
  /* deux classements séparés : le programme du BTS et les cours bonus (stats.bonus) */
  var BONUS = location.hash === "#bonus", SERIES = location.hash === "#series";
  /* série effective d'un profil : remise à 0 si le dernier défi date d'avant-hier ou plus */
  function serieDe(p) {
    var s = (p.stats || {}).serie || {};
    return { jours: (s.dernier === EF.jour(0) || s.dernier === EF.jour(-1)) ? (s.jours || 0) : 0, record: s.record || 0, dernier: s.dernier || "" };
  }
  function flamme(n) { return '<span class="cl-serie' + (n ? "" : " zero") + '">' + I("flame") + n + '</span>'; }
  var TYPES = { examen: "Examen blanc", questionnaire: "Questionnaire", textuel: "Textuel", pratique: "Pratique" };

  document.body.appendChild(EF.header(""));
  var nav = document.querySelector('.top-nav a[href="classement.html"]'); if (nav) nav.setAttribute("aria-current", "page");
  var main = el("main", "wrap page classement");
  document.body.appendChild(main);

  var MODS = TOUS.filter(function (m) { return !!m.bonus === BONUS; });
  var options = '<option value="">' + (BONUS ? "Classement bonus général" : "Classement général") + '</option>';
  MODS.forEach(function (m) {
    options += '<optgroup label="' + esc(m.titre) + '">' + Object.keys(TYPES).filter(function (t) {
      return (t !== "textuel" || m.evalTextuel) && t !== "pratique";
    }).map(function (t) {
      return '<option value="' + m.id + "_" + t + '">' + esc(m.titre) + " · " + TYPES[t] + '</option>';
    }).join("") + (m.labos || []).map(function (l, i) {
      if (l.sansExamen) return "";
      var nom = m.labos.filter(function (x) { return !x.sansExamen; }).length > 1 ? "Pratique · " + (l.court || l.titre) : "Pratique";
      return '<option value="' + (i && l.cle ? l.cle : m.id) + '_pratique">' + esc(m.titre) + " · " + esc(nom) + '</option>';
    }).join("") + '</optgroup>';
  });
  main.innerHTML = '<nav class="crumbs"><a href="index.html">Accueil</a><span>›</span><span>Classement</span></nav>' +
    '<div class="page-head"><div class="ico">' + I("trophy") + '</div><div><h1>Classement</h1>' +
    '<div class="sub">' + (SERIES ? "Les plus longues séries en cours : au moins un défi par jour (question de quiz, mission de labo, évaluation), réussi ou non." : BONUS ? "Les cours bonus ont leur propre classement : chapitres, missions de labo et évaluations hors programme." : "Chapitres validés, missions de labo et évaluations : qui révise le plus ?") + '</div></div></div>' +
    '<div class="cl-onglets" role="tablist">' +
    '<a href="classement.html" role="tab" aria-selected="' + (!BONUS && !SERIES) + '">' + I("book-open") + ' Programme BTS</a>' +
    '<a href="classement.html#bonus" role="tab" aria-selected="' + BONUS + '">' + I("zap") + ' Cours bonus</a>' +
    '<a href="classement.html#series" role="tab" aria-selected="' + SERIES + '">' + I("flame") + ' Séries</a></div>' +
    '<div class="cl-outils">' + (SERIES ? '<div class="cl-moi-serie"></div>' : '<label>Afficher <select id="cl-vue">' + options + '</select></label>') +
    '<a class="btn" href="evaluation.html">' + I("timer") + ' Passer une évaluation</a></div>' +
    '<div id="cl-zone"><p class="lead">Chargement du classement…</p></div>' +
    '<p class="lb-small cl-regle">' + (SERIES ? "Une série augmente de 1 chaque jour où tu fais au moins un défi : répondre à une question de quiz, lancer la vérification d'une mission de labo, passer une évaluation, une partie de duel ou de l'atelier. Réussi ou non, ça compte. Un jour sans défi, et la série repart de zéro (ton record reste)." : BONUS ? "Score bonus = 100 pts par chapitre bonus validé + 20 pts par mission des labos bonus + tes meilleurs points de chaque évaluation bonus. Il ne se mélange pas au classement du programme." : "Score général = 100 pts par chapitre validé + 20 pts par mission de labo réussie + tes meilleurs points de chaque évaluation. Les cours bonus ont leur propre classement.") + '</p>';
  window.addEventListener("hashchange", function () { location.reload(); });
  var zone = document.getElementById("cl-zone"), vue = document.getElementById("cl-vue") || { value: "", addEventListener: function () {} };
  var moiSerie = main.querySelector(".cl-moi-serie");
  if (moiSerie) {
    var ms = EF.serie();
    moiSerie.innerHTML = flamme(ms.jours) + ' <span>' + (ms.aujourdhui ? "Ta série : " + ms.jours + " jour" + (ms.jours > 1 ? "s" : "") + ". Défi du jour fait !" : ms.jours ? "Ta série : " + ms.jours + " jour" + (ms.jours > 1 ? "s" : "") + ". Fais un défi aujourd'hui pour la garder." : "Pas de série en cours : fais un défi pour la lancer.") + (ms.record ? " Record : " + ms.record + "." : "") + '</span>';
  }

  function mmss(s) { s = Math.round(s || 0); return Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2); }
  function message(t) { zone.innerHTML = '<div class="box attention"><b>Classement indisponible</b><p>' + t + '</p></div>'; }

  var C = null;
  function charger() {
    var key = vue.value, F = C.F;
    zone.innerHTML = '<p class="lead">Chargement…</p>';
    var q = SERIES
      ? F.query(F.collection(C.db, "profils"), F.orderBy("stats.serie.jours", "desc"), F.limit(300))
      : key
      ? F.query(F.collection(C.db, "profils"), F.orderBy(new F.FieldPath("evals", key, "points"), "desc"), F.limit(100))
      : F.query(F.collection(C.db, "profils"), F.orderBy(BONUS ? "stats.bonus.score" : "stats.score", "desc"), F.limit(100));
    F.getDocs(q).then(function (snap) {
      var moi = C.user() && C.user().uid, lignes = [];
      snap.forEach(function (d) { var p = d.data(), s = (BONUS && !key ? (p.stats || {}).bonus : p.stats) || {}, sr = serieDe(p); if (SERIES ? sr.jours : (key || s.score)) lignes.push({ id: d.id, p: p, s: s, sr: sr }); });
      if (SERIES) lignes.sort(function (a, b) { return b.sr.jours - a.sr.jours || b.sr.record - a.sr.record; });
      if (!lignes.length) {
        zone.innerHTML = '<div class="box"><b>Personne pour l\'instant</b><p>' + (SERIES ? "Aucune série en cours. Fais un défi aujourd'hui (en étant connecté) pour ouvrir ce classement !" : key ? "Sois le premier à passer cette évaluation !" : BONUS ? "Valide un chapitre ou une mission d'un cours bonus (en étant connecté) pour ouvrir ce classement." : "Connecte-toi et valide un chapitre pour ouvrir le classement.") + '</p></div>';
        return;
      }
      var tete = SERIES ? '<tr><th>#</th><th>Pseudo</th><th>Série en cours</th><th>Record</th><th>Dernier défi</th></tr>'
        : key ? '<tr><th>#</th><th>Pseudo</th><th>Points</th><th>Réussite</th><th>Temps</th><th>Date</th></tr>'
        : '<tr><th>#</th><th>Pseudo</th><th>Score</th><th>Chapitres</th><th>Missions</th><th>Évaluations</th><th>Série</th></tr>';
      var corps = lignes.map(function (l, i) {
        var p = l.p, s = l.s, e = key && p.evals ? p.evals[key] || {} : {};
        var rang = i + 1, cls = (l.id === moi ? "moi " : "") + (rang <= 3 ? "podium p" + rang : "");
        return '<tr class="' + cls + '"><td class="rang"><span>' + rang + '</span></td><td class="ps">' + esc(p.pseudo || "?") + (l.id === moi ? ' <small>(toi)</small>' : '') + '</td>' +
          (SERIES ? '<td><b>' + flamme(l.sr.jours) + '</b> jour' + (l.sr.jours > 1 ? "s" : "") + '</td><td>' + l.sr.record + ' j</td><td>' + (l.sr.dernier === EF.jour(0) ? "Aujourd'hui" : "Hier") + '</td>'
            : key ? '<td><b>' + (e.points || 0) + '</b></td><td>' + Math.round((e.pct || 0) * 100) + ' %</td><td>' + mmss(e.duree) + '</td><td>' + esc(e.date || "") + '</td>'
            : '<td><b>' + (s.score || 0) + '</b></td><td>' + (s.chapitres || 0) + '</td><td>' + (s.missions || 0) + '</td><td>' + (s.evals || 0) + ' pts</td><td>' + flamme(l.sr.jours) + '</td>') + '</tr>';
      }).join("");
      zone.innerHTML = '<div class="cl-table"><table><thead>' + tete + '</thead><tbody>' + corps + '</tbody></table></div>' +
        (moi ? "" : '<p class="ev-login">Tu n\'apparais pas encore ici ? <button type="button" class="btn" id="cl-login">Se connecter</button></p>');
      var lg = document.getElementById("cl-login"); if (lg) lg.onclick = function () { C.ouvrir(); };
    }).catch(function (x) {
      message(x && x.code === "permission-denied"
        ? "Firestore refuse la lecture : publie les règles de sécurité (fichier <code>firestore.rules</code>) dans la console Firebase."
        : "Erreur : " + esc((x && (x.code || x.message)) || String(x)));
    });
  }
  vue.addEventListener("change", charger);

  if (!window.EF_FIREBASE_CONFIG && !document.querySelector('script[src*="firebase-config"]')) { message("Les comptes ne sont pas activés sur ce site."); return; }
  function pret() { if (C) return; C = window.EFCloud; C.A.onAuthStateChanged(C.auth, function () { charger(); }); }
  if (window.EFCloud) pret();
  else {
    document.addEventListener("ef-cloud-pret", pret);
    setTimeout(function () {
      if (C) return;
      if (!window.EF_FIREBASE_CONFIG) message("Les comptes ne sont pas activés sur ce site.");
      else message("Impossible de joindre Firebase. Vérifie ta connexion (ou un bloqueur de publicités), puis recharge la page.");
    }, 12000);
  }
})();
