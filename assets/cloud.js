/* Étude Facile — compte Firebase : connexion (Google / e-mail), pseudo, synchronisation de la progression.
   Chargé automatiquement par app.js si data/firebase-config.js contient une configuration.
   Firestore :
     prives/{uid}   → { sync: { "ef-progress": "…json…", … }, maj }          (lecture/écriture : soi seul)
     profils/{uid}  → { pseudo, stats: { chapitres, missions, score }, maj }  (lecture : tous — leaderboard)
     pseudos/{pseudo en minuscules} → { uid }                                 (réservation d'un pseudo unique) */
const V = "13.2.0";
const SDK = window.EF_FIREBASE_SDK || new URL("vendor/firebase/", import.meta.url).href; /* SDK Firebase 13.2.0 hébergé sur le site */
const [{ initializeApp }, A, F] = await Promise.all([
  import(SDK + "firebase-app.js"), import(SDK + "firebase-auth.js"), import(SDK + "firebase-firestore.js")
]);

const app = initializeApp(window.EF_FIREBASE_CONFIG);
const auth = A.getAuth(app);
auth.languageCode = "fr";
const db = F.getFirestore(app);
const EF = window.EtudeFacile;
const esc = EF.esc;
const racine = new URL("../", import.meta.url).href;

const CLES = ["ef-progress", "ef-best", "ef-labo-terminal", "ef-labo-html", "ef-labo-php", "ef-labo-python", "ef-evals"];
/* évaluations qui comptent au classement (les évaluations de chapitre « <matière>_chap_<id> » restent privées) */
const VERSION_CGU = "2026-11-10";
const PUBLIQUE = /^[a-z0-9-]+_(questionnaire|textuel|pratique|examen)$/;
const LABOS = ["ef-labo-terminal", "ef-labo-html", "ef-labo-php", "ef-labo-python"];
let user = null, profil = null, etat = "", synchroPrete = false;

/* ---------- interface : bouton de compte dans la barre du haut ---------- */
const slot = document.createElement("div");
slot.className = "compte";
function place() {
  const w = document.querySelector(".topbar .wrap");
  if (w && !w.contains(slot)) w.appendChild(slot);
  return !!w;
}
if (!place()) {
  const mo = new MutationObserver(() => { if (place()) mo.disconnect(); });
  mo.observe(document.documentElement, { childList: true, subtree: true });
}

function rendu() {
  if (!user) {
    slot.innerHTML = `<button type="button" class="compte-btn" data-a="ouvrir">Se connecter</button>`;
    return;
  }
  const nom = profil && profil.pseudo ? profil.pseudo : "…";
  slot.innerHTML = `<button type="button" class="compte-btn moi" data-a="menu" aria-haspopup="true" aria-expanded="false">
      <span class="avatar">${esc(nom.charAt(0).toUpperCase())}</span><span class="nom">${esc(nom)}</span></button>
    <div class="compte-menu" hidden>
      <div class="cm-tete"><b>${esc(nom)}</b><span>${esc(user.email || "")}</span></div>
      <div class="cm-etat">${esc(etat || "Progression synchronisée")}</div>
      ${profil && profil.stats ? `<div class="cm-stats"><span><b>${profil.stats.chapitres}</b> chapitres</span><span><b>${profil.stats.missions}</b> missions</span><span><b>${profil.stats.score}</b> pts</span></div>` : ""}
      <a class="cm-lien" href="${racine}classement.html">Voir le classement</a>
      <button type="button" data-a="pseudo">Changer de pseudo</button>
      <button type="button" data-a="donnees">Mes données</button>
      <button type="button" data-a="sortir">Se déconnecter</button>
    </div>`;
}
slot.addEventListener("click", (e) => {
  const b = e.target.closest("[data-a]"); if (!b) return;
  const a = b.dataset.a, menu = slot.querySelector(".compte-menu");
  if (a === "ouvrir") modale("connexion");
  else if (a === "menu") { menu.hidden = !menu.hidden; b.setAttribute("aria-expanded", String(!menu.hidden)); }
  else if (a === "sortir") { A.signOut(auth); }
  else if (a === "pseudo") { menu.hidden = true; modale("pseudo"); }
  else if (a === "donnees") { menu.hidden = true; modale("donnees"); }
});
document.addEventListener("click", (e) => {
  const m = slot.querySelector(".compte-menu");
  if (m && !m.hidden && !slot.contains(e.target)) m.hidden = true;
});

/* ---------- fenêtre de connexion / pseudo ---------- */
/* Calque « maison » plutôt qu'une <dialog> modale : une dialog modale passe dans la top-layer et rend
   le reste de la page inerte, ce qui casse les menus des gestionnaires de mots de passe (Proton Pass, Bitwarden…). */
const voile = document.createElement("div");
voile.className = "compte-voile"; voile.hidden = true;
voile.innerHTML = '<div class="compte-dlg" role="dialog" aria-modal="true" aria-labelledby="cd-titre"></div>';
document.body.appendChild(voile);
const dlg = voile.firstChild;
let focusAvant = null;
Object.defineProperty(dlg, "open", { get: () => !voile.hidden });
dlg.showModal = () => { focusAvant = document.activeElement; voile.hidden = false; document.documentElement.classList.add("compte-ouvert"); };
dlg.close = () => { voile.hidden = true; document.documentElement.classList.remove("compte-ouvert"); if (focusAvant && focusAvant.focus) focusAvant.focus(); };
voile.addEventListener("mousedown", (e) => { if (e.target === voile && !dlg.dataset.bloque) dlg.close(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && dlg.open && !dlg.dataset.bloque) dlg.close(); });

const ERREURS = {
  "auth/invalid-credential": "E-mail ou mot de passe incorrect.",
  "auth/wrong-password": "Mot de passe incorrect.",
  "auth/user-not-found": "Aucun compte avec cet e-mail.",
  "auth/invalid-email": "Adresse e-mail invalide.",
  "auth/email-already-in-use": "Un compte existe déjà avec cet e-mail : connecte-toi.",
  "auth/weak-password": "Mot de passe trop faible : au moins 6 caractères.",
  "auth/missing-password": "Saisis un mot de passe.",
  "auth/too-many-requests": "Trop de tentatives. Réessaie dans quelques minutes.",
  "auth/network-request-failed": "Pas de connexion réseau.",
  "auth/popup-blocked": "La fenêtre Google a été bloquée par le navigateur.",
  "auth/unauthorized-domain": "Ce site n'est pas autorisé dans Firebase (Authentication › Paramètres › Domaines autorisés).",
  "auth/operation-not-allowed": "Cette méthode de connexion n'est pas activée dans Firebase.",
  "auth/account-exists-with-different-credential": "Cet e-mail est déjà utilisé avec une autre méthode de connexion.",
  "auth/requires-recent-login": "Pour des raisons de sécurité, reconnecte-toi puis recommence.",
  "auth/user-mismatch": "Confirme avec le même compte que celui qui est connecté.",
  "auth/popup-closed-by-user": "Confirmation annulée.",
  "permission-denied": "Refusé par Firestore : vérifie que les règles de sécurité à jour sont publiées."
};
const msgErreur = (err) => ERREURS[err && err.code] || ("Erreur : " + ((err && (err.code || err.message)) || err));

function modale(type, info) {
  delete dlg.dataset.bloque;
  if (type === "connexion" || type === "inscription") {
    const insc = type === "inscription";
    dlg.innerHTML = `<form class="cd-form" id="${insc ? "signup-form" : "login-form"}" action="#" method="post" novalidate autocomplete="on">
      <button type="button" class="cd-x" data-a="fermer" aria-label="Fermer">×</button>
      <h2 id="cd-titre">${insc ? "Créer un compte" : "Connexion"}</h2>
      <p class="cd-sub">Retrouve ta progression sur tous tes appareils et apparais dans le classement.</p>
      <button type="button" class="btn cd-google" data-a="google">${EF.icon("user") || ""} Continuer avec Google</button>
      <p class="cd-mention">En continuant, tu acceptes les <a href="${racine}conditions.html" target="_blank">conditions d'utilisation</a> et la <a href="${racine}confidentialite.html" target="_blank">politique de confidentialité</a>.</p>
      <div class="cd-ou"><span>ou avec ton e-mail</span></div>
      <label for="cd-email">E-mail</label>
      <input type="email" id="cd-email" name="email" autocomplete="username" inputmode="email" autocapitalize="off" spellcheck="false" required>
      <label for="cd-password">Mot de passe${insc ? " <small>(6 caractères minimum)</small>" : ""}</label>
      <div class="cd-mdp"><input type="password" id="cd-password" name="${insc ? "new-password" : "password"}" autocomplete="${insc ? "new-password" : "current-password"}" minlength="6" required>
        <button type="button" class="cd-oeil" data-a="voir" aria-label="Afficher le mot de passe">Voir</button></div>
      ${insc ? `<label for="cd-password2">Confirme le mot de passe</label>
      <input type="password" id="cd-password2" name="confirm-password" autocomplete="new-password" minlength="6" required>` : ""}
      ${insc ? "" : `<button type="button" class="cd-lien" data-a="oubli">Mot de passe oublié ?</button>`}
      ${insc ? `<label class="cd-accept"><input type="checkbox" id="cd-cgu" required> <span>J'ai lu et j'accepte les <a href="${racine}conditions.html" target="_blank">conditions d'utilisation</a> et la <a href="${racine}confidentialite.html" target="_blank">politique de confidentialité</a>.</span></label>` : ""}
      <p class="cd-err" role="alert"></p>
      <button type="submit" class="btn primary">${insc ? "Créer mon compte" : "Se connecter"}</button>
      <p class="cd-bas">${insc ? "Déjà un compte ?" : "Pas encore de compte ?"} <button type="button" class="cd-lien" data-a="${insc ? "connexion" : "inscription"}">${insc ? "Se connecter" : "Créer un compte"}</button></p>
    </form>`;
    const f = dlg.querySelector("form"), err = dlg.querySelector(".cd-err");
    const occupe = (on) => f.querySelectorAll("button, input").forEach((x) => { x.disabled = on; });
    f.addEventListener("submit", async (e) => {
      e.preventDefault(); err.textContent = "";
      const email = f.email.value.trim(), mdp = f.querySelector("#cd-password").value;
      if (insc && mdp !== f.querySelector("#cd-password2").value) { err.textContent = "Les deux mots de passe ne sont pas identiques."; return; }
      if (insc && !f.querySelector("#cd-cgu").checked) { err.textContent = "Coche la case pour accepter les conditions d'utilisation."; return; }
      occupe(true);
      try {
        if (insc) await A.createUserWithEmailAndPassword(auth, email, mdp);
        else await A.signInWithEmailAndPassword(auth, email, mdp);
        dlg.close();
      } catch (x) { err.textContent = msgErreur(x); }
      occupe(false);
    });
    f.addEventListener("click", async (e) => {
      const b = e.target.closest("[data-a]"); if (!b) return;
      const a = b.dataset.a; err.textContent = "";
      if (a === "fermer") dlg.close();
      else if (a === "voir") {
        const champs = f.querySelectorAll("input[type=password], input.vu"), vu = b.textContent === "Voir";
        champs.forEach((c) => { c.type = vu ? "text" : "password"; c.classList.toggle("vu", vu); });
        b.textContent = vu ? "Masquer" : "Voir"; b.setAttribute("aria-label", vu ? "Masquer le mot de passe" : "Afficher le mot de passe");
      }
      else if (a === "connexion" || a === "inscription") modale(a);
      else if (a === "google") {
        occupe(true);
        try { await A.signInWithPopup(auth, new A.GoogleAuthProvider()); dlg.close(); }
        catch (x) {
          if (x && x.code === "auth/popup-blocked") { await A.signInWithRedirect(auth, new A.GoogleAuthProvider()); return; }
          if (!(x && (x.code === "auth/popup-closed-by-user" || x.code === "auth/cancelled-popup-request"))) err.textContent = msgErreur(x);
        }
        occupe(false);
      } else if (a === "oubli") {
        const email = f.email.value.trim();
        if (!email) { err.textContent = "Saisis d'abord ton e-mail ci-dessus."; return; }
        try { await A.sendPasswordResetEmail(auth, email); err.textContent = "E-mail de réinitialisation envoyé (pense aux spams)."; err.classList.add("ok"); }
        catch (x) { err.textContent = msgErreur(x); }
      }
    });
  } else if (type === "pseudo") {
    const premier = !(profil && profil.pseudo);
    if (premier) dlg.dataset.bloque = "1";
    dlg.innerHTML = `<form class="cd-form" action="#" method="post" novalidate>
      ${premier ? "" : `<button type="button" class="cd-x" data-a="fermer" aria-label="Fermer">×</button>`}
      <h2 id="cd-titre">${premier ? "Choisis ton pseudo" : "Changer de pseudo"}</h2>
      <p class="cd-sub">C'est le nom affiché dans le classement. 3 à 20 caractères : lettres, chiffres, tiret ou souligné.</p>
      <label for="cd-pseudo">Pseudo</label><input id="cd-pseudo" name="pseudo" maxlength="20" autocomplete="nickname" data-protonpass-ignore="true" data-1p-ignore data-lpignore="true" required value="${esc((profil && profil.pseudo) || info || "")}">
      <p class="cd-err" role="alert"></p>
      <button type="submit" class="btn primary">Valider</button>
      ${premier ? `<p class="cd-bas"><button type="button" class="cd-lien" data-a="sortir">Annuler et se déconnecter</button></p>` : ""}
    </form>`;
    const f = dlg.querySelector("form"), err = dlg.querySelector(".cd-err");
    f.addEventListener("click", (e) => {
      const b = e.target.closest("[data-a]"); if (!b) return;
      if (b.dataset.a === "fermer") dlg.close();
      if (b.dataset.a === "sortir") { delete dlg.dataset.bloque; dlg.close(); A.signOut(auth); }
    });
    f.addEventListener("submit", async (e) => {
      e.preventDefault(); err.textContent = "";
      const p = f.pseudo.value.trim();
      if (!/^[\p{L}\p{N}_-]{3,20}$/u.test(p)) { err.textContent = "3 à 20 caractères : lettres, chiffres, - ou _ (sans espace)."; return; }
      f.querySelector("[type=submit]").disabled = true;
      try { await choisirPseudo(p); delete dlg.dataset.bloque; dlg.close(); }
      catch (x) { err.textContent = x.message === "pris" ? "Ce pseudo est déjà pris." : msgErreur(x); }
      f.querySelector("[type=submit]").disabled = false;
    });
  }
  else if (type === "donnees") {
    const motDePasse = user.providerData.some((p) => p.providerId === "password");
    dlg.innerHTML = `<form class="cd-form" action="#" method="post" novalidate>
      <button type="button" class="cd-x" data-a="fermer" aria-label="Fermer">×</button>
      <h2 id="cd-titre">Mes données</h2>
      <p class="cd-sub">Ce que le site conserve sur toi est décrit dans la <a href="${racine}confidentialite.html" target="_blank">politique de confidentialité</a>.</p>
      <button type="button" class="btn" data-a="exporter">Télécharger mes données (JSON)</button>
      <div class="cd-danger">
        <b>Supprimer mon compte</b>
        <p class="cd-sub">Supprime ton compte, ton profil du classement, ta progression synchronisée, tes votes et tes questions du forum. Tes réponses sont effacées si possible. C'est définitif.</p>
        <label class="cd-accept"><input type="checkbox" id="cd-local" checked> <span>Effacer aussi la progression enregistrée dans ce navigateur</span></label>
        <label for="cd-confirme">Pour confirmer, tape ton pseudo : <b>${esc((profil && profil.pseudo) || "SUPPRIMER")}</b></label>
        <input id="cd-confirme" autocomplete="off" data-protonpass-ignore="true" data-1p-ignore data-lpignore="true">
        ${motDePasse ? `<label for="cd-mdp-sup">Ton mot de passe</label><input type="password" id="cd-mdp-sup" autocomplete="current-password">` : `<p class="cd-sub">Une fenêtre Google te demandera de confirmer ton identité.</p>`}
      </div>
      <p class="cd-err" role="alert"></p>
      <button type="button" class="btn danger" data-a="supprimer">Supprimer définitivement mon compte</button>
    </form>`;
    const f = dlg.querySelector("form"), err = dlg.querySelector(".cd-err");
    f.addEventListener("submit", (e) => e.preventDefault());
    f.addEventListener("click", async (e) => {
      const b = e.target.closest("[data-a]"); if (!b) return;
      err.classList.remove("ok"); err.textContent = "";
      if (b.dataset.a === "fermer") dlg.close();
      else if (b.dataset.a === "exporter") {
        b.disabled = true; err.textContent = "Préparation du fichier…"; err.classList.add("ok");
        try { await exporter(); err.textContent = "Fichier téléchargé."; } catch (x) { err.classList.remove("ok"); err.textContent = msgErreur(x); }
        b.disabled = false;
      } else if (b.dataset.a === "supprimer") {
        const attendu = (profil && profil.pseudo) || "SUPPRIMER";
        if (f.querySelector("#cd-confirme").value.trim() !== attendu) { err.textContent = "Tape exactement « " + attendu + " » pour confirmer."; return; }
        f.querySelectorAll("button, input").forEach((x) => { x.disabled = true; });
        try {
          await supprimerCompte(motDePasse ? f.querySelector("#cd-mdp-sup").value : null, f.querySelector("#cd-local").checked, (t) => { err.classList.add("ok"); err.textContent = t; });
        } catch (x) {
          err.classList.remove("ok"); err.textContent = msgErreur(x);
          f.querySelectorAll("button, input").forEach((y) => { y.disabled = false; });
        }
      }
    });
  }
  if (!dlg.open) dlg.showModal();
  const champ = dlg.querySelector("input"); if (champ) champ.focus();
}

/* ---------- droits RGPD : export et suppression ---------- */
async function mesReponses() {
  /* requête sur toutes les sous-collections « reponses » : nécessite l'index de groupe de collections (auteur) */
  try {
    const s = await F.getDocs(F.query(F.collectionGroup(db, "reponses"), F.where("auteur", "==", user.uid)));
    const l = []; s.forEach((d) => l.push({ ref: d.ref, id: d.id, post: d.ref.parent.parent.id, data: d.data() }));
    return l;
  } catch (x) { return null; }
}
function json(v) { return JSON.parse(JSON.stringify(v, (k, x) => (x && typeof x.toDate === "function" ? x.toDate().toISOString() : x))); }
async function exporter() {
  const uid = user.uid, lire = async (c) => { const s = await F.getDoc(F.doc(db, c, uid)); return s.exists() ? json(s.data()) : null; };
  const posts = []; (await F.getDocs(F.query(F.collection(db, "posts"), F.where("auteur", "==", uid)))).forEach((d) => posts.push(Object.assign({ id: d.id }, json(d.data()))));
  const reps = await mesReponses();
  const prv = await lire("prives");
  if (prv && prv.sync) Object.keys(prv.sync).forEach((k) => { try { prv.sync[k] = JSON.parse(prv.sync[k]); } catch (e) { /* tel quel */ } });
  const donnees = {
    exporte_le: new Date().toISOString(), site: "Étude Facile",
    compte: { uid, email: user.email, nom: user.displayName, fournisseurs: user.providerData.map((p) => p.providerId), cree: user.metadata && user.metadata.creationTime, derniereConnexion: user.metadata && user.metadata.lastSignInTime },
    profil_public: await lire("profils"), donnees_privees: prv, votes: await lire("votes"),
    forum: { questions: posts, reponses: reps ? reps.map((r) => Object.assign({ id: r.id, question: r.post }, json(r.data))) : "non disponibles (index Firestore manquant)" }
  };
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(donnees, null, 2)], { type: "application/json" }));
  a.download = "etude-facile-mes-donnees.json"; document.body.appendChild(a); a.click(); a.remove();
}
async function supprimerCompte(mdp, effacerLocal, etape) {
  const u = auth.currentUser, uid = u.uid;
  etape("Vérification de ton identité…");
  if (mdp !== null) {
    if (!mdp) throw Object.assign(new Error(), { code: "auth/missing-password" });
    await A.reauthenticateWithCredential(u, A.EmailAuthProvider.credential(u.email, mdp));
  } else await A.reauthenticateWithPopup(u, new A.GoogleAuthProvider());
  etape("Suppression de tes messages du forum…");
  const qs = await F.getDocs(F.query(F.collection(db, "posts"), F.where("auteur", "==", uid)));
  const sup = []; qs.forEach((d) => sup.push(F.deleteDoc(d.ref))); await Promise.all(sup);
  const reps = await mesReponses();
  if (reps) await Promise.all(reps.filter((r) => !r.data.supprime).map((r) => F.updateDoc(r.ref, { texte: "", supprime: true })));
  etape("Suppression de ton profil et de ta progression…");
  const pseudoCle = profil && profil.pseudo ? profil.pseudo.toLowerCase() : null;
  await Promise.all([
    F.deleteDoc(F.doc(db, "votes", uid)).catch(() => {}),
    F.deleteDoc(F.doc(db, "prives", uid)),
    F.deleteDoc(F.doc(db, "profils", uid)),
    pseudoCle ? F.deleteDoc(F.doc(db, "pseudos", pseudoCle)) : null
  ]);
  etape("Suppression du compte…");
  synchroPrete = false;
  await A.deleteUser(u);
  if (effacerLocal) CLES.concat(["ef-info-stockage"]).forEach((k) => { try { localStorage.removeItem(k); } catch (e) { /* rien */ } });
  dlg.close();
  alert("Ton compte et tes données ont été supprimés.");
  location.reload();
}

/* ---------- pseudo unique (transaction : réserve le nouveau, libère l'ancien) ---------- */
async function choisirPseudo(p) {
  const uid = user.uid, cle = p.toLowerCase(), ancien = profil && profil.pseudo;
  await F.runTransaction(db, async (t) => {
    const ref = F.doc(db, "pseudos", cle), s = await t.get(ref);
    if (s.exists() && s.data().uid !== uid) throw new Error("pris");
    if (ancien && ancien.toLowerCase() !== cle) t.delete(F.doc(db, "pseudos", ancien.toLowerCase()));
    t.set(ref, { uid });
    t.set(F.doc(db, "profils", uid), { pseudo: p, stats: stats(), evals: evalsPubliques(), maj: F.serverTimestamp() }, { merge: true });
  });
  profil = Object.assign({}, profil, { pseudo: p, stats: stats() });
  rendu();
}

/* ---------- statistiques (pour le classement) ---------- */
function lit(k) { try { return JSON.parse(localStorage.getItem(k)) || {}; } catch (e) { return {}; } }
function stats() {
  const prog = lit("ef-progress");
  const chapitres = Object.keys(prog).reduce((n, m) => n + (prog[m] || []).length, 0);
  const missions = LABOS.reduce((n, k) => n + Object.keys(lit(k).done || {}).length, 0);
  const ev = lit("ef-evals"), evals = Object.keys(ev).filter((k) => PUBLIQUE.test(k)).reduce((n, k) => n + (ev[k].points || 0), 0);
  return { chapitres, missions, evals, score: chapitres * 100 + missions * 20 + evals };
}
function evalsPubliques() {
  const ev = lit("ef-evals"), r = {};
  Object.keys(ev).forEach((k) => { if (PUBLIQUE.test(k)) r[k] = { points: ev[k].points, pct: ev[k].pct, duree: ev[k].duree, date: ev[k].date }; });
  return r;
}

/* ---------- fusion local ⇄ cloud ---------- */
function fusion(k, loc, nuage) {
  if (k === "ef-progress") {
    const r = {};
    new Set([...Object.keys(loc), ...Object.keys(nuage)]).forEach((m) => {
      r[m] = [...new Set([...(nuage[m] || []), ...(loc[m] || [])])];
    });
    return r;
  }
  if (k === "ef-best") {
    const r = Object.assign({}, nuage);
    Object.keys(loc).forEach((c) => { if (typeof r[c] !== "number" || loc[c] > r[c]) r[c] = loc[c]; });
    return r;
  }
  if (k === "ef-evals") {
    const r = Object.assign({}, nuage);
    Object.keys(loc).forEach((c) => { if (!r[c] || (loc[c].points || 0) >= (r[c].points || 0)) r[c] = loc[c]; });
    return r;
  }
  /* labos : missions réussies = union ; brouillons de code : le local prime */
  return Object.assign({}, nuage, loc, {
    done: Object.assign({}, nuage.done || {}, loc.done || {}),
    code: Object.assign({}, nuage.code || {}, loc.code || {})
  });
}

const setItemOrig = Storage.prototype.setItem;
let minuteur = null;
async function pousser() {
  if (!user || !synchroPrete) return;
  const sync = {};
  CLES.forEach((k) => { const v = localStorage.getItem(k); if (v !== null) sync[k] = v; });
  etat = "Synchronisation…"; rendu();
  try {
    const st = stats();
    await F.setDoc(F.doc(db, "prives", user.uid), { sync, maj: F.serverTimestamp() }, { merge: true });
    if (profil && profil.pseudo) {
      await F.setDoc(F.doc(db, "profils", user.uid), { pseudo: profil.pseudo, stats: st, evals: evalsPubliques(), maj: F.serverTimestamp() }, { merge: true });
      profil.stats = st;
    }
    etat = "Progression synchronisée";
  } catch (x) { etat = "Synchronisation impossible (hors ligne ?)"; }
  rendu();
}
Storage.prototype.setItem = function (k, v) {
  setItemOrig.call(this, k, v);
  if (this === localStorage && CLES.includes(k) && user) { clearTimeout(minuteur); minuteur = setTimeout(pousser, 1500); }
};

async function synchroniser() {
  synchroPrete = false;
  etat = "Récupération de ta progression…"; rendu();
  const s = await F.getDoc(F.doc(db, "prives", user.uid));
  const nuage = (s.exists() && s.data().sync) || {};
  if (!s.exists() || !s.data().cgu || s.data().cgu.version !== VERSION_CGU) {
    await F.setDoc(F.doc(db, "prives", user.uid), { cgu: { version: VERSION_CGU, date: F.serverTimestamp() } }, { merge: true });
  }
  let change = false;
  CLES.forEach((k) => {
    let n = {}; try { n = JSON.parse(nuage[k] || "{}") || {}; } catch (e) { /* ignoré */ }
    const avant = localStorage.getItem(k), loc = lit(k);
    const res = JSON.stringify(fusion(k, loc, n));
    if (res !== "{}" && res !== avant) { setItemOrig.call(localStorage, k, res); if (res !== JSON.stringify(loc)) change = true; }
  });
  synchroPrete = true;
  await pousser();
  /* la page affiche peut-être une progression périmée : on la recharge une fois */
  if (change && !sessionStorage.getItem("ef-sync-recharge")) { sessionStorage.setItem("ef-sync-recharge", "1"); location.reload(); }
  else sessionStorage.removeItem("ef-sync-recharge");
}

A.getRedirectResult(auth).catch(() => {});
A.onAuthStateChanged(auth, async (u) => {
  user = u; profil = null; synchroPrete = false; etat = "";
  rendu();
  if (!u) return;
  try {
    const p = await F.getDoc(F.doc(db, "profils", u.uid));
    profil = p.exists() ? p.data() : {};
    rendu();
    await synchroniser();
    if (!profil.pseudo) modale("pseudo", (u.displayName || "").split(" ")[0].replace(/[^\p{L}\p{N}_-]/gu, "").slice(0, 20));
  } catch (x) {
    etat = x && x.code === "permission-denied"
      ? "Accès refusé par Firestore : les règles de sécurité (firestore.rules) ne sont pas encore publiées."
      : "Erreur Firebase : " + (x.code || x.message);
    rendu();
  }
});

window.EFCloud = { auth, db, F, A, user: () => user, profil: () => profil, stats, ouvrir: () => modale("connexion") };
document.dispatchEvent(new CustomEvent("ef-cloud-pret"));
