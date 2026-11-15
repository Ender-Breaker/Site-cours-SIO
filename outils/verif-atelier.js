const puppeteer = require("puppeteer-core");
const B = "http://localhost:8765/modules/securite-web/atelier.html";
const EXPLOITS = {
  injection: 'return { identifiant: "admin\' --", motdepasse: "x" };',
  xss: 'return "<img src=x onerror=alert(1)>";',
  acces: 'return { idDoc: "facture-admin", requete: { jeton: "jeton-lea", role: "admin" } };',
  traversee: 'return "../../etc/passwd";',
  commande: 'return "site; cat /etc/shadow";'
};
const MAUVAIS = { injection: 'return { identifiant: "x", motdepasse: "y" };', xss: 'return "bonjour";', acces: 'return { idDoc: "facture-admin", requete: { jeton: "jeton-lea" } };', traversee: 'return "photo.png";', commande: 'return "site";' };
(async () => {
  const br = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome", headless: "new", args: ["--no-sandbox"] });
  const pg = await br.newPage(); await pg.setViewport({ width: 390, height: 800 });
  const errs = []; pg.on("pageerror", e => errs.push("PAGE " + e)); pg.on("console", m => { if (m.type() === "error" && !/favicon|firebase|firestore|CORS|ERR_|net::/.test(m.text())) errs.push("CONSOLE " + m.text()); });
  await pg.goto(B, { waitUntil: "load" }); await pg.waitForFunction("window.EFAtelier && window.EFJeu");
  for (const m of await pg.evaluate(() => EFAtelier.MANCHES.map(x => x.id))) {
    const r = await pg.evaluate(async (id, bon, mauvais) => {
      const M = EFAtelier.MANCHES.find(x => x.id === id);
      const a = await EFAtelier.verifierAttaque(M, bon);            // bon exploit → valide
      const am = await EFAtelier.verifierAttaque(M, mauvais);       // entrée inoffensive → non valide
      if (a.err) return { id, err: "attaque: " + a.err };
      const dFix = await EFAtelier.verifierDefense(M, a.payload, M.correction);   // correctif → tient + usage
      const dVuln = await EFAtelier.verifierDefense(M, a.payload, M.cible);       // cible vuln → ne tient pas
      const dCasse = await EFAtelier.verifierDefense(M, a.payload, "function " + M.signature.replace("function ", "").split("(")[0] + "(){ return null; }".replace("(){","(" + M.signature.split("(")[1]));
      return { id, exploitValide: a.valide, mauvaisRejete: !am.valide, fixTient: dFix.tient, fixUsage: dFix.usage, vulnNeTientPas: !dVuln.tient, fixErr: dFix.err || null };
    }, m, EXPLOITS[m], MAUVAIS[m]);
    const ok = r.exploitValide && r.mauvaisRejete && r.fixTient && r.fixUsage && r.vulnNeTientPas && !r.fixErr;
    console.log((ok ? "ok    " : "ECHEC ") + JSON.stringify(r));
  }
  // liens : aller-retour défi + résultat, et rejet des liens trafiqués
  const lk = await pg.evaluate(() => {
    const enc = EFAtelier.encode({ v: 1, r: 0, n: "Léa", p: { identifiant: "admin' --", motdepasse: "x" } });
    const dec = EFAtelier.decode(enc);
    const res = EFAtelier.encode({ v: 1, r: 2, n: "Léa", d: "Noé", ok: 1 });
    return { decOk: !!dec && dec.r === 0 && dec.p.identifiant === "admin' --", resOk: !!EFAtelier.decode(res),
      rejette: [EFAtelier.decode("nawak"), EFAtelier.decode(EFAtelier.encode({ v: 1, r: 99, p: "x" })), EFAtelier.decode(EFAtelier.encode({ v: 1, r: 0, p: { x: { y: { z: { w: { t: 1 } } } } } }))].every(x => x === null) };
  });
  console.log("liens:", JSON.stringify(lk));
  console.log(errs.length ? "ERREURS\n" + errs.join("\n") : "aucune erreur console");
  await br.close();
})().catch(e => { console.error(e); process.exit(2); });
