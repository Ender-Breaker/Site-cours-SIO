// Valide un labo terminal : pour chaque mission, la solution doit remplir tous les objectifs, et l'état de départ ne doit pas les remplir.
const puppeteer = require("puppeteer-core");
(async () => {
  const br = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome", headless: "new", args: ["--no-sandbox"] });
  const pg = await br.newPage();
  const errs = []; pg.on("pageerror", e => errs.push(String(e))); pg.on("console", m => { if (m.type() === "error") errs.push(m.text()); });
  await pg.goto("http://localhost:8765/" + process.argv[2], { waitUntil: "load" });
  const r = await pg.evaluate(() => {
    const LAB = window.EF_LABO, out = [];
    function mk(m) {
      const fs = Object.assign({}, LAB.fs, m.fs || {});
      const sh = EFShell.create({ fs, modes: Object.assign({}, LAB.modes || {}, m.modes || {}), owners: Object.assign({}, LAB.owners || {}, m.owners || {}), cwd: m.cwd || "/home/etu" });
      (m.prep || []).forEach(c => sh.run(c));
      sh.S.cmds = []; sh.S.outs = []; sh.S.last = "";
      return sh;
    }
    LAB.lecons.forEach(l => l.missions.forEach(m => {
      let sh = mk(m);
      const avant = m.objectifs.map(o => EFTerm.check(sh, o.r));
      const apres = m.objectifs.map(() => false);   // comme dans le labo : un objectif atteint après une commande reste acquis
      m.solution.forEach(c => { sh.run(c); m.objectifs.forEach((o, i) => { if (!apres[i] && EFTerm.check(sh, o.r)) apres[i] = true; }); });
      const ok = apres.every(x => x) && !avant.every(x => x);
      out.push((ok ? "ok    " : "ECHEC ") + m.id + " avant=" + JSON.stringify(avant) + " après=" + JSON.stringify(apres) + (ok ? "" : "\n   last=" + JSON.stringify(sh.S.last).slice(0, 400)));
    }));
    return out.join("\n");
  });
  console.log(r); if (errs.length) console.log("ERREURS", errs);
  await br.close();
})();
