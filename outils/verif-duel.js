const puppeteer = require("puppeteer-core");
const B = "http://localhost:8765/modules/securite-web/duel.html";
(async () => {
  const br = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome", headless: "new", args: ["--no-sandbox"] });
  const pg = await br.newPage(); await pg.setViewport({ width: 390, height: 800, deviceScaleFactor: 1 });
  const errs = []; pg.on("pageerror", e => errs.push("PAGE " + e)); pg.on("console", m => { if (m.type() === "error") errs.push("CONSOLE " + m.text()); });
  const txt = s => pg.$eval(s, e => e.innerText).catch(() => null);
  const clic = async s => { await pg.evaluate(s => document.querySelector(s).click(), s); await new Promise(r => setTimeout(r, 60)); };
  const debord = () => pg.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  await pg.goto(B, { waitUntil: "load" }); await pg.evaluate(() => { localStorage.clear(); try { localStorage.setItem("ef-cookies", "1"); } catch (e) {} });

  // 1) solo défense : acheter, répondre juste partout
  await clic('[data-mode="solo"]'); console.log("achat:", await txt("h1"), "|", await txt("[data-compte]"), "| débord", await debord());
  for (const id of ["mfa", "sensibilisation", "devsec", "edr", "supervision"]) await clic('[data-prot="' + id + '"]');
  await clic("[data-valider]");
  let incidentVu = false;
  for (let g = 0; g < 10; g++) {
    const h = await txt("h1"); if (!(await pg.$("[data-suite], [data-question]"))) break;
    if (await pg.$("[data-question]")) {
      // bonne réponse : on la retrouve via le catalogue
      const rep = await pg.evaluate(() => { const signe = document.querySelector(".duel-journal div").textContent; const a = EFDuel.ATT.find(a => a.signes[0] === signe); return [a.nom, a.bonne]; });
      await pg.evaluate(n => [...document.querySelectorAll("[data-k]")].find(b => b.innerText === n).click(), rep[0]); await clic("[data-q2]");
      await pg.evaluate(n => [...document.querySelectorAll("[data-k]")].find(b => b.innerText === n).click(), rep[1]);
    }
    console.log("  tour", g, "|", h, "|", (await txt(".duel-verdict .tag")));
    await clic("[data-suite]");
  }
  console.log("bilan:", await txt("h1"), "|", (await txt(".duel-final")).replace(/\n/g, " "), "| débord", await debord(), "| stats", await pg.evaluate(() => localStorage.getItem("ef-duel")));

  // 2) attaquer l'ordinateur
  await clic("[data-rejouer]"); await clic('[data-mode="cible"]'); console.log("composer:", await txt("h1"), "|", await txt("[data-compte]"), "| valider désactivé", await pg.$eval("[data-valider]", b => b.disabled));
  for (const id of ["faille-connue", "faux-wifi", "deni-service", "dependance"]) await clic('[data-att="' + id + '"]');
  await clic('[data-att="rancongiciel"]'); console.log("  dépassé:", await txt("[data-compte]"), "| désactivé", await pg.$eval("[data-valider]", b => b.disabled)); await clic('[data-att="rancongiciel"]');
  await clic("[data-valider]"); console.log("bilan cible:", await txt("h1"), "|", (await txt(".duel-final")).replace(/\n/g, " "), "| stats", await pg.evaluate(() => localStorage.getItem("ef-duel")));

  // 3) défi par lien, puis résultat
  await clic("[data-rejouer]"); await clic('[data-mode="lien"]');
  for (const id of ["hameconnage", "force-brute", "usb", "secret", "injection-sql"]) await clic('[data-att="' + id + '"]');
  await clic("[data-valider]"); await pg.type("[data-nom]", "Éloïse <b>");
  const url = await pg.$eval(".duel-lien input", i => i.value); console.log("lien:", url.length, "car. |", url.slice(0, 90));
  await pg.goto("about:blank"); await pg.goto(url, { waitUntil: "load" }); console.log("défi reçu:", await txt("h1"));
  await clic("[data-suite]"); await clic('[data-prot="mfa"]'); await clic("[data-valider]");
  for (let g = 0; g < 10; g++) {
    if (await pg.$("[data-question]")) { await clic('[data-k="0"]'); await clic("[data-q2]"); await clic('[data-k="0"]'); }
    if (!(await pg.$("[data-suite]"))) break; await clic("[data-suite]");
  }
  console.log("bilan lien:", await txt("h1")); await pg.type("[data-nom]", "Noé");
  const url2 = await pg.$eval(".duel-lien input", i => i.value);
  await pg.goto("about:blank"); await pg.goto(url2, { waitUntil: "load" }); console.log("résultat reçu:", await txt("h1"), "|", (await txt(".duel-final")).replace(/\n/g, " "), "| lignes", (await pg.$$(".duel-ligne")).length);

  // 4) liens invalides ou trafiqués
  for (const h of ["#d=abc", "#d=" + "A".repeat(40), "#r=" + url.split("=")[1]]) { await pg.goto("about:blank"); await pg.goto(B + h, { waitUntil: "load" }); console.log("lien", h.slice(0, 12), "→", await txt("h1")); }
  const forge = await pg.evaluate(() => [EFDuel.encode({ v: 1, n: "x", a: [0, 0, 1, 2] }), EFDuel.encode({ v: 1, n: "x", a: [6, 13, 16, 2, 3] }), EFDuel.encode({ v: 1, n: "<img src=x onerror=alert(1)>", a: [0, 1, 2, 3] }), EFDuel.encode({ v: 1, a: [0, 1, 2, 99] })]);
  for (const c of forge) { await pg.goto("about:blank"); await pg.goto(B + "#d=" + c, { waitUntil: "load" }); console.log("forgé →", await txt("h1"), "| img injectée:", !!(await pg.$("main img"))); }

  // 5) face à face + chrono expiré (horloge accélérée)
  await pg.goto("about:blank"); await pg.goto(B, { waitUntil: "load" }); await clic('[data-mode="deux"]');
  for (const id of ["faille-connue", "faux-wifi", "deni-service", "interne"]) await clic('[data-att="' + id + '"]');
  await clic("[data-valider]"); console.log("passation:", await txt("h1")); await clic("[data-suite]");
  await clic("[data-valider]"); await pg.evaluate(() => { const d = Date.now; Date.now = () => d() + 60000; });
  await new Promise(r => setTimeout(r, 400)); console.log("chrono expiré:", await txt(".duel-rep"));
  await clic("[data-q2]"); await pg.evaluate(() => { const d = Date.now; Date.now = () => d() + 60000; }); await new Promise(r => setTimeout(r, 400)); console.log("  puis:", await txt(".duel-verdict .tag"), "|", await txt(".duel-verdict .duel-rep"));
  console.log(errs.length ? "ERREURS " + errs.join("\n") : "aucune erreur console");
  await br.close();
})();
