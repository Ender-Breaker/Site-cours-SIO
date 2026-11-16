/* Étude Facile — classement (Firestore : collection « profils », lecture publique). */
(function () {
  "use strict";
  var EF = window.EtudeFacile, esc = EF.esc, el = EF.el, I = EF.icon;
  var TOUS = (window.EF_MODULES || []).filter(function (m) { return m.chapitres.length; });
  /* deux classements séparés : le programme du BTS et les cours bonus (stats.bonus) */
  var BONUS = location.hash === "#bonus";
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
    '<div class="sub">' + (BONUS ? "Les cours bonus ont leur propre classement : chapitres, missions de labo et évaluations hors programme." : "Chapitres validés, missions de labo et évaluations : qui révise le plus ?") + '</div></div></div>' +
    '<div class="cl-onglets" role="tablist">' +
    '<a href="classement.html" role="tab" aria-selected="' + !BONUS + '"' + (BONUS ? "" : ' aria-current="page"') + '>' + I("book-open") + ' Programme BTS</a>' +
    '<a href="classement.html#bonus" role="tab" aria-selected="' + BONUS + '"' + (BONUS ? ' aria-current="page"' : "") + '>' + I("zap") + ' Cours bonus</a></div>' +
    '<div class="cl-outils"><label>Afficher <select id="cl-vue">' + options + '</select></label>' +
    '<a class="btn" href="evaluation.html">' + I("timer") + ' Passer une évaluation</a></div>' +
    '<div id="cl-zone"><p class="lead">Chargement du classement…</p></div>' +
    '<p class="lb-small cl-regle">' + (BONUS ? "Score bonus = 100 pts par chapitre bonus validé + 20 pts par mission des labos bonus + tes meilleurs points de chaque évaluation bonus. Il ne se mélange pas au classement du programme." : "Score général = 100 pts par chapitre validé + 20 pts par mission de labo réussie + tes meilleurs points de chaque évaluation. Les cours bonus ont leur propre classement.") + '</p>';
  window.addEventListener("hashchange", function () { location.reload(); });
  var zone = document.getElementById("cl-zone"), vue = document.getElementById("cl-vue");

  function mmss(s) { s = Math.round(s || 0); return Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2); }
  function message(t) { zone.innerHTML = '<div class="box attention"><b>Classement indisponible</b><p>' + t + '</p></div>'; }

  var C = null;
  function charger() {
    var key = vue.value, F = C.F;
    zone.innerHTML = '<p class="lead">Chargement…</p>';
    var q = key
      ? F.query(F.collection(C.db, "profils"), F.orderBy(new F.FieldPath("evals", key, "points"), "desc"), F.limit(100))
      : F.query(F.collection(C.db, "profils"), F.orderBy(BONUS ? "stats.bonus.score" : "stats.score", "desc"), F.limit(100));
    F.getDocs(q).then(function (snap) {
      var moi = C.user() && C.user().uid, lignes = [];
      snap.forEach(function (d) { var p = d.data(), s = (BONUS && !key ? (p.stats || {}).bonus : p.stats) || {}; if (key || s.score) lignes.push({ id: d.id, p: p, s: s }); });
      if (!lignes.length) {
        zone.innerHTML = '<div class="box"><b>Personne pour l\'instant</b><p>' + (key ? "Sois le premier à passer cette évaluation !" : BONUS ? "Valide un chapitre ou une mission d'un cours bonus (en étant connecté) pour ouvrir ce classement." : "Connecte-toi et valide un chapitre pour ouvrir le classement.") + '</p></div>';
        return;
      }
      var tete = key ? '<tr><th>#</th><th>Pseudo</th><th>Points</th><th>Réussite</th><th>Temps</th><th>Date</th></tr>'
        : '<tr><th>#</th><th>Pseudo</th><th>Score</th><th>Chapitres</th><th>Missions</th><th>Évaluations</th></tr>';
      var corps = lignes.map(function (l, i) {
        var p = l.p, s = l.s, e = key && p.evals ? p.evals[key] || {} : {};
        var rang = i + 1, cls = (l.id === moi ? "moi " : "") + (rang <= 3 ? "podium p" + rang : "");
        return '<tr class="' + cls + '"><td class="rang"><span>' + rang + '</span></td><td class="ps">' + esc(p.pseudo || "?") + (l.id === moi ? ' <small>(toi)</small>' : '') + '</td>' +
          (key ? '<td><b>' + (e.points || 0) + '</b></td><td>' + Math.round((e.pct || 0) * 100) + ' %</td><td>' + mmss(e.duree) + '</td><td>' + esc(e.date || "") + '</td>'
            : '<td><b>' + (s.score || 0) + '</b></td><td>' + (s.chapitres || 0) + '</td><td>' + (s.missions || 0) + '</td><td>' + (s.evals || 0) + ' pts</td>') + '</tr>';
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
