/* Cartes de champions animées : illustrations Riot, animations d'attente en CSS, rotation automatique. */
(function () {
  'use strict';

  var DD = 'https://ddragon.leagueoflegends.com';
  var CD = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/';
  var CW = 440, CH = 800, GAP = 50;

  var cfg = null;
  var cards = [];
  var deck = [], deckPos = 0;
  var startAt = 0, ticks = [];
  var host = document.getElementById('cards');
  var tpl = document.getElementById('tpl-card');

  /* ---------- Données des champions ---------- */
  var ddIndex = null; // index Data Dragon (chargé seulement si besoin)

  function norm(s) {
    return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/gi, '').toLowerCase();
  }

  function parseEntry(entry) {
    var parts = String(entry).split(':');
    return { raw: parts[0].trim(), skin: parseInt(parts[1], 10) || 0 };
  }

  function builtin(raw) {
    var n = norm(raw);
    var ids = Object.keys(window.URC_CHAMPS);
    for (var i = 0; i < ids.length; i++) {
      if (norm(ids[i]) === n || norm(window.URC_CHAMPS[ids[i]].name) === n) return Object.assign({ id: ids[i] }, window.URC_CHAMPS[ids[i]]);
    }
    return null;
  }

  function loadDdIndex() {
    if (ddIndex) return ddIndex;
    ddIndex = fetch(DD + '/api/versions.json').then(function (r) { return r.json(); })
      .then(function (v) { return fetch(DD + '/cdn/' + v[0] + '/data/fr_FR/champion.json'); })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        var map = {};
        Object.keys(j.data).forEach(function (id) {
          var c = j.data[id];
          var info = { id: id, key: +c.key, name: c.name, title: c.title, tags: c.tags };
          map[norm(id)] = info; map[norm(c.name)] = info;
        });
        return map;
      })
      .catch(function () { return {}; });
    return ddIndex;
  }

  function getInfo(raw) {
    var b = builtin(raw);
    if (b) return Promise.resolve(b);
    return loadDdIndex().then(function (map) {
      return map[norm(raw)] || { id: raw, key: 0, name: raw, title: '', tags: [] };
    });
  }

  /* Illustration centrée (CommunityDragon) si possible, sinon splash Data Dragon. */
  var artCache = {};
  function getArt(info, skin) {
    var ck = info.id + ':' + skin;
    if (artCache[ck]) return artCache[ck];
    var fallback = { url: DD + '/cdn/img/champion/splash/' + info.id + '_' + skin + '.jpg', pos: '50% 30%', centered: false };
    var p = !info.key ? Promise.resolve(fallback) :
      fetch(CD + 'v1/champions/' + info.key + '.json').then(function (r) {
        if (!r.ok) throw new Error('http ' + r.status);
        return r.json();
      }).then(function (j) {
        var wanted = info.key * 1000 + skin;
        var s = (j.skins || []).filter(function (k) { return k.id === wanted; })[0] || (j.skins || [])[0];
        if (!s || !s.splashPath) return fallback;
        var url = CD + s.splashPath.replace(/^\/lol-game-data\/assets\//i, '').toLowerCase();
        return { url: url, pos: '50% 30%', centered: true, fallback: fallback };
      }).catch(function () { return fallback; });
    artCache[ck] = p;
    return p;
  }

  function preload(art) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () { (img.decode ? img.decode() : Promise.resolve()).then(function () { resolve(art); }, function () { resolve(art); }); };
      img.onerror = function () {
        if (art.fallback) preload(art.fallback).then(resolve);
        else resolve(null);
      };
      img.src = art.url;
    });
  }

  /* ---------- Une carte ---------- */
  function Card(index) {
    var el = tpl.content.firstElementChild.cloneNode(true);
    this.el = el;
    this.index = index;
    this.arts = el.querySelectorAll('.art');
    this.front = 0;
    this.bar = el.querySelector('.bar');
    this.info = el.querySelector('.info');
    this.current = null; // entrée affichée (ex. "Ahri:0")
    this.busy = false;
    host.appendChild(el);
  }

  Card.prototype.show = function (entry, instant) {
    var self = this;
    var e = parseEntry(entry);
    self.current = entry;
    var token = (self.token = (self.token || 0) + 1);
    return getInfo(e.raw).then(function (info) {
      return getArt(info, e.skin).then(preload).then(function (art) {
        if (token !== self.token) return; // un autre changement est arrivé entre-temps
        var back = self.arts[1 - self.front];
        var img = back.querySelector('img');
        if (art) { img.src = art.url; img.style.objectPosition = art.pos; }
        else img.removeAttribute('src');

        var write = function () {
          var roles = (info.tags || []).map(function (t) { return '<span>' + (window.URC_ROLES[t] || t) + '</span>'; }).join('');
          self.info.querySelector('.roles').innerHTML = roles;
          self.info.querySelector('.name').textContent = info.name;
          self.info.querySelector('.title').textContent = info.title || '';
        };

        if (instant) {
          self.arts[self.front].classList.remove('front');
          back.classList.add('front');
          self.front = 1 - self.front;
          write();
          return;
        }
        self.info.classList.add('out');
        back.classList.remove('enter'); void back.offsetWidth; back.classList.add('enter');
        self.bar.classList.remove('go'); void self.bar.offsetWidth; self.bar.classList.add('go');
        setTimeout(function () { if (token === self.token) { write(); self.info.classList.remove('out'); } }, 520);
        setTimeout(function () {
          if (token !== self.token) return;
          self.arts[self.front].classList.remove('front');
          back.classList.remove('enter');
          back.classList.add('front');
          self.front = 1 - self.front;
        }, 980);
      });
    });
  };

  /* ---------- Paquet et rotation ---------- */
  function forcedList() {
    return String(cfg.forced || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  }

  function buildDeck() {
    var f = forcedList();
    var src = f.length ? f : (cfg.list || []).slice();
    if (!src.length) src = URC.DEFAULTS.champions.list.slice();
    if (cfg.shuffle && !f.length) {
      for (var i = src.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = src[i]; src[i] = src[j]; src[j] = t; }
    }
    deck = src; deckPos = 0;
  }

  function displayed(except) {
    return cards.filter(function (c) { return c !== except && c.current; }).map(function (c) { return norm(parseEntry(c.current).raw); });
  }

  function nextFor(card) {
    if (!deck.length) return null;
    var busy = displayed(card);
    for (var tries = 0; tries < deck.length; tries++) {
      var entry = deck[deckPos % deck.length];
      deckPos++;
      if (deckPos >= deck.length && cfg.shuffle && !forcedList().length) {
        var keep = deck[deck.length - 1]; buildDeck();
        if (deck[0] === keep && deck.length > 1) { deck.push(deck.shift()); }
      }
      if (busy.indexOf(norm(parseEntry(entry).raw)) === -1 || deck.length <= cards.length - 1) return entry;
    }
    return deck[deckPos++ % deck.length];
  }

  function layout() {
    var n = Math.max(1, Math.min(3, Math.round(cfg.count) || 2));
    var s = Math.max(0.4, Math.min(1.6, +cfg.scale || 1));
    var cw = CW * s, ch = CH * s, gap = GAP * s;
    document.documentElement.style.setProperty('--cw', cw + 'px');
    document.documentElement.style.setProperty('--ch', ch + 'px');
    while (cards.length < n) cards.push(new Card(cards.length));
    while (cards.length > n) { var c = cards.pop(); c.el.remove(); }
    var total = n * cw + (n - 1) * gap;
    var x0 = cfg.position === 'gauche' ? 140 : cfg.position === 'centre' ? (1920 - total) / 2 : 1920 - 170 - total;
    var y0 = Math.max(20, (1080 - ch) / 2 + 40 * s);
    cards.forEach(function (c, i) {
      c.el.style.left = (x0 + i * (cw + gap)) + 'px';
      c.el.style.top = y0 + 'px';
      c.el.querySelector('.name').style.fontSize = Math.round(84 * s) + 'px';
    });
    host.classList.toggle('tilts', !!cfg.tilt);
    host.classList.toggle('no-name', !cfg.showName);
    host.classList.toggle('no-title', !cfg.showTitle);
    host.classList.toggle('no-roles', !cfg.showRoles);
    document.documentElement.style.setProperty('--acc', cfg.accent);
    document.documentElement.style.setProperty('--acc2', cfg.accent2);
  }

  function fillAll(instant) {
    var f = forcedList();
    cards.forEach(function (c, i) {
      var entry = f.length && f.length <= cards.length ? f[i % f.length] : nextFor(c);
      if (entry) setTimeout(function () { c.show(entry, instant); }, instant ? 0 : i * 180);
    });
  }

  function schedule() {
    startAt = performance.now();
    ticks = cards.map(function (c, i) { return startAt + (cfg.interval * 1000) * (1 + i / cards.length); });
  }

  function canRotate() {
    var f = forcedList();
    if (cfg.paused) return false;
    if (f.length && f.length <= cards.length) return false;
    return true;
  }

  setInterval(function () {
    if (!cfg || !canRotate()) return;
    var now = performance.now(), I = Math.max(3, +cfg.interval || 12) * 1000;
    cards.forEach(function (c, i) {
      if (now >= ticks[i]) {
        ticks[i] = now + I;
        var entry = nextFor(c);
        if (entry) c.show(entry);
      }
    });
  }, 200);

  /* ---------- Braises autour des cartes ---------- */
  var cv = document.getElementById('embers'), cx = cv.getContext('2d');
  var embers = [];
  function rectOf(c) { return { x: parseFloat(c.el.style.left), y: parseFloat(c.el.style.top), w: c.el.offsetWidth, h: c.el.offsetHeight }; }
  function spawnEmber(p) {
    var c = cards[Math.floor(Math.random() * cards.length)];
    if (!c) return p;
    var r = rectOf(c);
    p.x = r.x + Math.random() * r.w; p.y = r.y + r.h * (0.55 + Math.random() * 0.5);
    p.vy = -(18 + Math.random() * 40); p.vx = (Math.random() - 0.5) * 14;
    p.life = 0; p.max = 2.5 + Math.random() * 3; p.r = 0.8 + Math.random() * 1.8;
    p.warm = Math.random() < 0.6;
    return p;
  }
  var lastE = 0;
  function emberFrame(t) {
    var dt = Math.min(0.05, (t - lastE) / 1000 || 0); lastE = t;
    cx.clearRect(0, 0, 1920, 1080);
    if (cfg && cfg.embers && cards.length) {
      var want = 26 * cards.length;
      while (embers.length < want) embers.push(spawnEmber({ life: 0, max: 0 }));
      embers.length = want;
      cx.globalCompositeOperation = 'lighter';
      for (var i = 0; i < embers.length; i++) {
        var p = embers[i];
        p.life += dt;
        if (p.life >= p.max) { spawnEmber(p); continue; }
        p.x += p.vx * dt; p.y += p.vy * dt;
        var k = p.life / p.max, a = Math.sin(Math.PI * k) * 0.55;
        cx.fillStyle = URC.color.rgba(p.warm ? cfg.accent2 : cfg.accent, a);
        cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, Math.PI * 2); cx.fill();
      }
      cx.globalCompositeOperation = 'source-over';
    }
    requestAnimationFrame(emberFrame);
  }
  requestAnimationFrame(emberFrame);

  /* ---------- Config ---------- */
  var prevKey = '';
  URC.init({
    section: 'champions',
    aliases: { champ: 'forced', champion: 'forced', liste: 'list', pause: 'paused', vitesse: 'interval', cartes: 'count', echelle: 'scale' },
    onChange: function (c) {
      var first = !cfg;
      cfg = c;
      var key = JSON.stringify([c.list, c.forced, c.count, c.shuffle]);
      var structural = key !== prevKey; prevKey = key;
      var prevCount = cards.length;
      layout();
      if (structural || first) {
        buildDeck();
        cards.forEach(function (card) { card.current = null; });
        fillAll(first);
        schedule();
      } else if (cards.length !== prevCount) {
        schedule();
      }
    },
    onCommand: function (cmd, arg) {
      if (cmd === 'next') { cards.forEach(function (c, i) { setTimeout(function () { var e = nextFor(c); if (e) c.show(e); }, i * 220); }); schedule(); }
      else if (cmd === 'show' && arg) { var i = Math.max(0, Math.min(cards.length - 1, +arg.slot || 0)); cards[i].show(arg.entry); ticks[i] = performance.now() + cfg.interval * 1000; }
      else if (cmd === 'shuffle') { buildDeck(); fillAll(false); schedule(); }
    }
  });
})();
