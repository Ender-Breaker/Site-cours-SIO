/* Fond animé façon « Vice City » : couleurs pilotées par la config, palmiers et étincelles générés. */
(function () {
  'use strict';
  var C = URC.color;
  var root = document.documentElement;
  var $ = function (id) { return document.getElementById(id); };
  var current = null;
  var lastDecor = '';

  /* ---------- Palmiers (SVG générés, puis posés comme images pour rester légers) ---------- */
  function rand(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }

  function svgUrl(svg) { return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); }

  function trunkSvg(fill, h, lean) {
    // Tronc légèrement courbé, plus fin en haut, avec quelques anneaux.
    var w = 260, cx = 130, top = 30, bx = cx - lean;
    var d = 'M' + (bx - 24) + ',' + h +
      ' C' + (bx - 18) + ',' + (h * 0.62) + ' ' + (cx - 26) + ',' + (h * 0.3) + ' ' + (cx - 8) + ',' + top +
      ' L' + (cx + 8) + ',' + top +
      ' C' + (cx + 4) + ',' + (h * 0.3) + ' ' + (bx + 20) + ',' + (h * 0.62) + ' ' + (bx + 24) + ',' + h + ' Z';
    var rings = '';
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">' +
      '<path d="' + d + '" fill="' + fill + '"/>' + rings + '</svg>';
  }

  function crownSvg(fill, seed) {
    // Couronne de palmes : nervure courbe + folioles tombantes.
    var r = rand(seed), S = 900, cx = S / 2, cy = S / 2, out = '';
    var angles = [-178, -158, -138, -116, -95, -74, -52, -30, -10, 8, 172, 24, 156];
    angles.forEach(function (deg, i) {
      var a = deg * Math.PI / 180;
      var L = 300 + r() * 110;
      var horiz = Math.abs(Math.cos(a));
      var droop = 50 + horiz * 210 + r() * 40;
      var p0 = [cx, cy];
      var p1 = [cx + Math.cos(a) * L * 0.55, cy + Math.sin(a) * L * 0.55 - 70];
      var p2 = [cx + Math.cos(a) * L, cy + Math.sin(a) * L + droop];
      var rachis = 'M' + p0 + ' Q' + p1 + ' ' + p2;
      out += '<path d="' + rachis + '" stroke="' + fill + '" stroke-width="7" fill="none" stroke-linecap="round"/>';
      for (var t = 0.05; t <= 0.99; t += 0.021) {
        var mt = 1 - t;
        var x = mt * mt * p0[0] + 2 * mt * t * p1[0] + t * t * p2[0];
        var y = mt * mt * p0[1] + 2 * mt * t * p1[1] + t * t * p2[1];
        var tx = 2 * mt * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]);
        var ty = 2 * mt * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]);
        var tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
        var prof = Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.12)), 0.6);
        var len = (16 + 112 * prof) * (0.85 + r() * 0.3);
        [1, -1].forEach(function (side) {
          // Foliole : vers l'avant, vers l'extérieur et tirée vers le bas (gravité)
          var nx = -ty * side, ny = tx * side;
          var gx = tx * 0.5 + nx * 0.55, gy = ty * 0.5 + ny * 0.55 + 0.95;
          var gl = Math.hypot(gx, gy) || 1; gx /= gl; gy /= gl;
          var ex = x + gx * len, ey = y + gy * len;
          var mx = x + gx * len * 0.5 + nx * len * 0.08, my = y + gy * len * 0.5 + ny * len * 0.08;
          out += '<path d="M' + x.toFixed(1) + ',' + y.toFixed(1) + ' Q' + mx.toFixed(1) + ',' + my.toFixed(1) + ' ' + ex.toFixed(1) + ',' + ey.toFixed(1) +
            '" stroke="' + fill + '" stroke-width="' + (3.4 - t * 1.8).toFixed(1) + '" fill="none" stroke-linecap="round"/>';
        });
      }
      if (i === 0) out += '<circle cx="' + cx + '" cy="' + (cy + 10) + '" r="26" fill="' + fill + '"/>';
    });
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + S + '" height="' + S + '" viewBox="0 0 ' + S + ' ' + S + '">' + out + '</svg>';
  }

  /* ---------- Tours et nexus : même style de silhouette, avec un cristal lumineux ---------- */
  function mirror(d, W) {
    // Retourne horizontalement un chemin « M x,y L x,y Q x,y x,y Z » (coordonnées absolues)
    return d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, function (m, x, y) { return (W - parseFloat(x)) + ',' + y; });
  }

  var TOWER = { W: 320, H: 1000, crystal: { x: 160, y: 182, w: 62, h: 112 }, line: { x: 160, y1: 352, y2: 880 } };
  function towerSvg(fill) {
    var W = TOWER.W, half = [
      'M160,1000 L14,1000 L24,955 L48,948 L52,905 L160,905 Z',                 // socle (moitié)
      'M160,905 L78,905 C92,760 100,560 106,336 L160,336 Z',                    // fût
      'M160,712 L84,712 L88,690 L160,690 Z',                                    // bague basse
      'M160,490 L94,490 L98,470 L160,470 Z',                                    // bague haute
      'M160,340 L96,340 L66,286 L160,286 Z',                                    // couronne
      'M68,290 Q34,186 106,88 Q80,190 106,290 Z',                               // griffe extérieure
      'M110,290 Q96,212 134,148 Q124,214 134,290 Z',                            // griffe intérieure
      'M160,290 L140,290 L148,262 L160,262 Z'                                   // support du cristal
    ];
    var paths = half.map(function (d) { return '<path d="' + d + '"/><path d="' + mirror(d, W) + '"/>'; }).join('');
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + TOWER.H + '" viewBox="0 0 ' + W + ' ' + TOWER.H + '" fill="' + fill + '">' + paths + '</svg>';
  }

  var NEXUS = { W: 720, H: 600, crystal: { x: 360, y: 246, w: 124, h: 224 } };
  function nexusSvg(fill) {
    var W = NEXUS.W, half = [
      'M360,600 L30,600 L48,560 L100,552 L112,516 L180,510 L192,480 L360,480 Z', // socle à gradins
      'M96,556 L150,556 L156,400 L128,326 L104,400 Z',                            // pylône extérieur
      'M168,512 L232,512 L246,300 L210,186 L182,300 Z',                           // pylône intérieur
      'M360,484 L252,484 L274,418 L312,390 L360,410 Z',                           // berceau
      'M258,432 Q168,282 302,126 Q222,282 298,420 Z',                             // bras courbe
      'M196,560 L232,560 L236,520 L214,500 L198,520 Z'                            // petite flèche avant
    ];
    var paths = half.map(function (d) { return '<path d="' + d + '"/><path d="' + mirror(d, W) + '"/>'; }).join('');
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + NEXUS.H + '" viewBox="0 0 ' + W + ' ' + NEXUS.H + '" fill="' + fill + '">' + paths + '</svg>';
  }

  // Cristal en SVG inline : ses couleurs suivent les variables CSS (--cr1…--cr4), sans reconstruction
  var CRYSTAL = '<svg viewBox="0 0 100 180" preserveAspectRatio="none" aria-hidden="true">' +
    '<polygon points="50,0 0,70 50,84" style="fill:var(--cr1)"/>' +
    '<polygon points="50,0 100,70 50,84" style="fill:var(--cr2)"/>' +
    '<polygon points="0,70 50,180 50,84" style="fill:var(--cr3)"/>' +
    '<polygon points="100,70 50,180 50,84" style="fill:var(--cr4)"/>' +
    '<polygon points="50,0 100,70 50,180 0,70" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="1.5"/></svg>';

  function crystalEl(spec, cls, haloSize) {
    var wrap = document.createElement('div');
    wrap.className = 'cr ' + (cls || '');
    wrap.style.left = (spec.x - spec.w / 2) + 'px';
    wrap.style.top = (spec.y - spec.h / 2) + 'px';
    wrap.style.width = spec.w + 'px';
    wrap.style.height = spec.h + 'px';
    var halo = document.createElement('div');
    halo.className = 'halo';
    halo.style.width = halo.style.height = haloSize + 'px';
    halo.style.left = (spec.w - haloSize) / 2 + 'px';
    halo.style.top = (spec.h - haloSize) / 2 + 'px';
    var gem = document.createElement('div');
    gem.className = 'gem';
    gem.innerHTML = CRYSTAL;
    wrap.appendChild(halo); wrap.appendChild(gem);
    return wrap;
  }

  function buildTower(el, fill) {
    var img = new Image(); img.src = svgUrl(towerSvg(fill));
    var line = document.createElement('div');
    line.className = 'conduit';
    line.style.left = (TOWER.line.x - 2) + 'px'; line.style.top = TOWER.line.y1 + 'px';
    line.style.height = (TOWER.line.y2 - TOWER.line.y1) + 'px';
    el.appendChild(img); el.appendChild(line);
    el.appendChild(crystalEl(TOWER.crystal, 'float', 300));
    return { W: TOWER.W, H: TOWER.H };
  }

  function buildNexus(el, fill) {
    var img = new Image(); img.src = svgUrl(nexusSvg(fill));
    el.appendChild(img);
    var cr = crystalEl(NEXUS.crystal, 'float big', 560);
    // Éclats en orbite autour du cristal
    for (var i = 0; i < 3; i++) {
      var ox = document.createElement('div'); ox.className = 'orb-x';
      ox.style.animationDelay = (-i * 3.2) + 's';
      var oy = document.createElement('div'); oy.className = 'orb-y';
      oy.style.animationDelay = (-i * 3.2 - 2.4) + 's';
      var sh = document.createElement('div'); sh.className = 'shard'; sh.innerHTML = CRYSTAL;
      oy.appendChild(sh); ox.appendChild(oy); cr.appendChild(ox);
    }
    el.appendChild(cr);
    return { W: NEXUS.W, H: NEXUS.H };
  }

  // Emplacements du décor (1920 × 1080) : un réglage par emplacement dans la config
  var SLOTS = [
    { cls: 'p1', opacity: 0.92, palm: { x: -40, h: 960, lean: 70, scale: 1, flip: false, seed: 7 },
      tour: { cx: 120, h: 860 }, nexus: { cx: 300, h: 470 } },
    { cls: 'p2', opacity: 0.55, palm: { x: 210, h: 760, lean: -40, scale: 0.72, flip: true, seed: 19 },
      tour: { cx: 370, h: 600 }, nexus: { cx: 540, h: 330 } },
    { cls: 'p3', opacity: 0.8, palm: { x: 1770, h: 880, lean: -60, scale: 0.85, flip: true, seed: 31 },
      tour: { cx: 1830, h: 800 }, nexus: { cx: 1760, h: 430 } }
  ];

  function buildPalm(el, fill, p) {
    var h = p.h;
    var trunk = new Image(); trunk.src = svgUrl(trunkSvg(fill, h, p.lean));
    trunk.style.left = '0px'; trunk.style.top = '0px';
    var crown = new Image(); crown.className = 'crown'; crown.src = svgUrl(crownSvg(fill, p.seed));
    // Le centre de la couronne (450,450) se place au sommet du tronc (130,30)
    crown.style.left = (130 - 450) + 'px'; crown.style.top = (30 - 450) + 'px';
    crown.style.transformOrigin = '450px 450px';
    el.appendChild(trunk); el.appendChild(crown);
    el.style.width = '260px'; el.style.height = h + 'px';
    el.style.left = p.x + 'px';
    el.style.transformOrigin = '130px ' + h + 'px';
    el.style.transform = 'scale(' + (p.flip ? -p.scale : p.scale) + ',' + p.scale + ')';
  }

  function normDecor(v) {
    v = String(v || '').toLowerCase();
    if (/^tour|^tower|^turret/.test(v)) return 'tour';
    if (/^nex/.test(v)) return 'nexus';
    if (/^(aucun|none|vide|rien)/.test(v)) return 'aucun';
    return 'palmier';
  }

  function buildDecor(c) {
    var host = $('palms');
    host.innerHTML = '';
    var fill = C.mix(c.c1, '#000000', 0.45);
    SLOTS.forEach(function (slot, i) {
      var type = normDecor(c['decor' + (i + 1)]);
      if (type === 'aucun') return;
      var el = document.createElement('div');
      el.className = 'palm ' + slot.cls + ' deco-' + type;
      el.style.opacity = slot.opacity;
      if (type === 'palmier') { buildPalm(el, fill, slot.palm); host.appendChild(el); return; }
      var spec = slot[type];
      var size = type === 'tour' ? buildTower(el, fill) : buildNexus(el, fill);
      var s = spec.h / size.H;
      el.style.width = size.W + 'px'; el.style.height = size.H + 'px';
      el.style.left = (spec.cx - size.W / 2) + 'px';
      el.style.bottom = (type === 'tour' ? -12 : -18) + 'px';
      el.style.transformOrigin = '50% 100%';
      el.style.transform = 'scale(' + s + ')';
      host.appendChild(el);
    });
  }

  /* ---------- Traînées lumineuses ---------- */
  function buildLines() {
    var host = $('lines');
    if (host.childElementCount) return;
    var specs = [[640, 520, 19, 0], [702, 900, 27, -9], [776, 640, 23, -15], [835, 760, 31, -4], [905, 460, 17, -11], [968, 980, 35, -22]];
    specs.forEach(function (s) {
      var d = document.createElement('div');
      d.className = 'streak';
      d.style.top = s[0] + 'px'; d.style.width = s[1] + 'px';
      d.style.animationDuration = 'calc(' + s[2] + 's / var(--spd))';
      d.style.animationDelay = s[3] + 's';
      host.appendChild(d);
    });
  }

  /* ---------- Étincelles dorées (à peine visibles) ---------- */
  var canvas = $('sparkles'), ctx = canvas.getContext('2d');
  var sprite = document.createElement('canvas');
  var parts = [], sparkCfg = { n: 0, color: '#ffd98a', opacity: 0.5, speed: 1 };

  function makeSprite(col) {
    var s = 48; sprite.width = sprite.height = s;
    var g = sprite.getContext('2d'), m = s / 2;
    g.clearRect(0, 0, s, s);
    var rad = g.createRadialGradient(m, m, 0, m, m, m);
    rad.addColorStop(0, 'rgba(255,255,255,1)');
    rad.addColorStop(0.18, C.rgba(col, 0.9));
    rad.addColorStop(0.5, C.rgba(col, 0.18));
    rad.addColorStop(1, C.rgba(col, 0));
    g.fillStyle = rad; g.fillRect(0, 0, s, s);
    // Petite croix lumineuse pour l'effet « étoile »
    g.globalCompositeOperation = 'lighter';
    var lin = g.createLinearGradient(0, m, s, m);
    lin.addColorStop(0, C.rgba(col, 0)); lin.addColorStop(0.5, C.rgba(col, 0.55)); lin.addColorStop(1, C.rgba(col, 0));
    g.fillStyle = lin; g.fillRect(0, m - 0.75, s, 1.5);
    var lin2 = g.createLinearGradient(m, 0, m, s);
    lin2.addColorStop(0, C.rgba(col, 0)); lin2.addColorStop(0.5, C.rgba(col, 0.55)); lin2.addColorStop(1, C.rgba(col, 0));
    g.fillStyle = lin2; g.fillRect(m - 0.75, 0, 1.5, s);
  }

  function spawn(p, anywhere) {
    p.x = Math.random() * 1920;
    p.y = anywhere ? Math.random() * 1080 : 1080 + Math.random() * 40;
    p.size = 6 + Math.random() * 12;          // taille du sprite affiché (px)
    p.vx = (Math.random() - 0.5) * 6;          // px / s
    p.vy = -(3 + Math.random() * 10);
    p.phase = Math.random() * Math.PI * 2;
    p.tw = 0.6 + Math.random() * 1.6;          // vitesse de scintillement
    p.base = 0.35 + Math.random() * 0.65;
    return p;
  }

  function setParticles(n) {
    n = Math.max(0, Math.min(300, Math.round(n)));
    while (parts.length < n) parts.push(spawn({}, true));
    parts.length = n;
  }

  var lastT = 0;
  function frame(t) {
    var dt = Math.min(0.05, (t - lastT) / 1000 || 0); lastT = t;
    ctx.clearRect(0, 0, 1920, 1080);
    if (parts.length) {
      var sp = sparkCfg.speed;
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.x += p.vx * dt * sp; p.y += p.vy * dt * sp; p.phase += p.tw * dt * sp;
        if (p.y < -30 || p.x < -30 || p.x > 1950) spawn(p, false);
        var tw = Math.sin(p.phase); tw = tw > 0 ? tw * tw : 0;
        var a = sparkCfg.opacity * p.base * (0.15 + 0.85 * tw);
        if (a < 0.01) continue;
        ctx.globalAlpha = a;
        ctx.drawImage(sprite, p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
      ctx.globalAlpha = 1;
    }
    requestAnimationFrame(frame);
  }

  /* ---------- Application de la config ---------- */
  function apply(c) {
    var prev = current; current = c;
    var vars = {
      '--c1': c.c1, '--c2': c.c2, '--c3': c.c3, '--c4': c.c4,
      '--glow': c.glow, '--accent': c.accent,
      '--spd': Math.max(0.1, +c.speed || 1),
      '--s1': C.hueShift(c.c1, 18), '--s2': C.hueShift(c.c2, -26), '--s3': C.hueShift(c.c3, 22), '--s4': C.hueShift(c.c4, -18),
      '--h1': C.rgba(C.mix(c.c4, c.glow, 0.5), 0.35),
      '--b1': C.rgba(c.c3, 0.42), '--b2': C.rgba(c.accent, 0.16), '--b3': C.rgba(c.c4, 0.45),
      '--g1': C.rgba(c.glow, 0.95), '--g2': C.rgba(c.glow, 0.55), '--g3': C.rgba(c.c4, 0.25),
      '--d1': C.rgba('#ffffff', 0.9), '--d2': C.rgba(c.glow, 0.7),
      '--cr1': C.mix(c.glow, '#ffffff', 0.55), '--cr2': c.glow, '--cr3': C.mix(c.accent, c.glow, 0.5), '--cr4': C.mix(c.accent, c.c1, 0.45),
      '--crh1': C.rgba(c.glow, 0.5), '--crh2': C.rgba(c.accent, 0.16)
    };
    Object.keys(vars).forEach(function (k) { root.style.setProperty(k, vars[k]); });

    $('sun').classList.toggle('off', !c.sun);
    $('sunDisc').classList.toggle('off', !c.sun);
    $('blobs').classList.toggle('off', !c.haze);
    $('horizon').classList.toggle('off', !c.haze);
    $('lines').classList.toggle('off', !c.lines);
    $('palms').classList.toggle('off', !c.palms);
    $('grain').classList.toggle('off', !c.grain);
    $('vignette').classList.toggle('off', !c.vignette);

    buildLines();
    var decorKey = [c.c1, c.decor1, c.decor2, c.decor3].join('|');
    if (decorKey !== lastDecor) { lastDecor = decorKey; buildDecor(c); }
    if (!prev || prev.particleColor !== c.particleColor) makeSprite(c.particleColor);
    sparkCfg.opacity = Math.max(0, Math.min(1, +c.particleOpacity));
    sparkCfg.speed = Math.max(0.1, +c.speed || 1);
    setParticles(+c.particles || 0);
  }

  URC.init({
    section: 'fond',
    aliases: { preset: 'preset', particules: 'particles', vitesse: 'speed' },
    onChange: function (c) {
      // Un preset passé seul dans l'URL (?preset=miami) remplit les couleurs
      var params = new URLSearchParams(location.search);
      if (params.get('preset') && URC.FOND_PRESETS[params.get('preset')] && !current) {
        var p = URC.FOND_PRESETS[params.get('preset')];
        ['c1', 'c2', 'c3', 'c4', 'glow', 'accent'].forEach(function (k) { if (!params.get(k)) c[k] = p[k]; });
      }
      var d = params.get('decor');
      if (d && !current) { c.decor1 = c.decor2 = c.decor3 = d; }
      apply(c);
    }
  });
  requestAnimationFrame(frame);
})();
