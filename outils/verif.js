// node verif.js labo <chemin/labo.html> [filtre-id]   → vérifie solution (doit passer) et départ (ne doit pas passer)
// node verif.js run <lang> <fichier> [stdin…]          → exécute un programme console
// node verif.js essais <chemin/chapitre.html>           → exécute tous les blocs .essai d'un chapitre
// node verif.js page <chemin>                            → erreurs console + débordement à 390 px
const puppeteer = require("puppeteer-core");
const fs = require("fs");
const B = "http://localhost:8765/";
(async () => {
  const [mode, a, b, ...rest] = process.argv.slice(2);
  const br = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome", headless: "new", args: ["--no-sandbox", "--disable-gpu"] });
  const pg = await br.newPage();
  const errs = [];
  pg.on("pageerror", (e) => errs.push("pageerror: " + e.message));
  pg.on("console", (m) => { if (m.type() === "error" && !/favicon|firebase|ERR_INTERNET|net::ERR/.test(m.text())) errs.push("console: " + m.text()); });
  let bad = 0;
  if (mode === "labo") {
    await pg.goto(B + a, { waitUntil: "load" });
    await pg.waitForFunction("window.EFCodeLab", { timeout: 30000 });
    const ids = await pg.evaluate(() => EFCodeLab.missions.map((m) => m.id));
    for (const id of ids) {
      if (b && !new RegExp(b).test(id)) continue;
      const r = await pg.evaluate(async (id) => {
        const m = EFCodeLab.missions.find((x) => x.id === id);
        const sol = Array.isArray(m.solution) ? m.solution.join("\n") : m.solution;
        const ok = await EFCodeLab.verify(m, sol);
        const out = document.getElementById("lc-console") ? document.getElementById("lc-console").textContent : "";
        const dep = await EFCodeLab.verify(m, m.depart);
        return { ok, dep, out: out.slice(0, 400) };
      }, id);
      const pass = r.ok.every(Boolean), depPass = r.dep.every(Boolean);
      if (!pass || depPass) { bad++; console.log((pass ? "DEPART-PASSE " : "ECHEC ") + id, JSON.stringify(r.ok), pass ? "" : "\n   sortie: " + JSON.stringify(r.out)); }
      else console.log("ok " + id);
    }
  } else if (mode === "run") {
    await pg.goto(B + "modules/lua/labo-lua.html", { waitUntil: "load" });
    await pg.waitForFunction("window.EFJeu");
    const r = await pg.evaluate((l, c, s) => EFJeu.runner(l).console(c, s), a, fs.readFileSync(b, "utf8"), rest);
    console.log(r.out + (r.err ? "\n[ERR] " + r.err : ""));
  } else if (mode === "essais") {
    await pg.goto(B + a, { waitUntil: "load" });
    await pg.waitForFunction("window.EFEssai", { timeout: 15000 });
    const n = await pg.evaluate(() => document.querySelectorAll(".essai").length);
    for (let i = 0; i < n; i++) {
      const r = await pg.evaluate((i) => EFEssai.lance(document.querySelectorAll(".essai")[i]), i);
      const att = await pg.evaluate((i) => document.querySelectorAll(".essai")[i].dataset.erreur, i);
      if ((r.err && att == null) || (!r.err && att != null)) { bad++; console.log("ESSAI " + i + " ERR: " + r.err + "\n" + r.code.slice(0, 300)); }
      else if (process.env.V) console.log("--- essai " + i + "\n" + r.out);
    }
    console.log(a + " : " + n + " essais, " + bad + " en erreur");
  } else if (mode === "page") {
    await pg.setViewport({ width: 390, height: 800 });
    await pg.goto(B + a, { waitUntil: "networkidle0" });
    const w = await pg.evaluate(() => document.documentElement.scrollWidth);
    if (w > 392) { bad++; console.log("DEBORDE " + a + " " + w); }
    if (b) await pg.screenshot({ path: b, fullPage: rest[0] === "full" });
  }
  if (errs.length) { bad++; console.log(errs.slice(0, 8).join("\n")); }
  await br.close();
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
