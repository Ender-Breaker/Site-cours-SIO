/*
 * URC Overlay — noyau commun à tous les calques.
 *
 * Gère la configuration (valeurs par défaut, paramètres d'URL, sauvegarde locale)
 * et la synchronisation en direct avec la page config.html, par trois canaux :
 *   1. BroadcastChannel (même navigateur : onglets, docks OBS qui partagent le profil)
 *   2. Événement « urc-overlay » émis par OBS (obs-websocket → obs-browser emit_event)
 *   3. localStorage (dernier état connu, relu au rechargement)
 *
 * Priorité au chargement : défauts < dernier état sauvegardé < paramètres d'URL.
 */
(function (global) {
  'use strict';

  var STORE_KEY = 'urc-overlay:etat';
  var CHANNEL = 'urc-overlay';
  var OBS_EVENT = 'urc-overlay';

  var DEFAULTS = {
    fond: {
      preset: 'vice',
      c1: '#0d0623',          // haut du ciel (nuit)
      c2: '#3b1460',          // violet
      c3: '#d6336c',          // rose néon
      c4: '#ff8a3d',          // orange horizon
      glow: '#ffc36b',        // halo du soleil
      accent: '#2de2e6',      // néon cyan
      sun: true,
      palms: true,            // afficher le décor (palmiers, tours, nexus)
      decor1: 'palmier',      // décor de gauche : palmier | tour | nexus | aucun
      decor2: 'palmier',      // décor en arrière-plan
      decor3: 'palmier',      // décor de droite
      haze: true,
      lines: true,
      grain: true,
      vignette: true,
      particles: 38,          // nombre de particules dorées
      particleColor: '#ffd98a',
      particleOpacity: 0.5,
      speed: 1                // multiplicateur de vitesse des animations
    },
    champions: {
      list: ['Ahri', 'Jinx', 'Yasuo', 'Lux', 'LeeSin', 'Thresh', 'Ezreal', 'Zed', 'Kaisa', 'Teemo'],
      forced: '',             // ex. "Ahri,Jinx" : force les cartes (vide = rotation)
      count: 2,               // nombre de cartes affichées (1 à 3)
      interval: 12,           // secondes entre deux changements d'une même carte
      paused: false,
      shuffle: true,
      position: 'droite',     // droite | centre | gauche
      scale: 1,
      showName: true,
      showTitle: true,
      showRoles: true,
      accent: '#ff3e8a',
      accent2: '#ffb347',
      tilt: true,
      embers: true
    },
    sponsors: {
      label: 'PARTENAIRES OFFICIELS',
      showLabel: true,
      items: [
        { name: 'Crédit Agricole', src: 'assets/logos/credit-agricole.png', on: true },
        { name: 'Pays de Landerneau-Daoulas', src: 'assets/logos/pays-landerneau-daoulas.png', on: true },
        { name: 'MTE', src: 'assets/logos/mte.png', on: true }
      ],
      perSlide: 1,            // logos visibles en même temps
      interval: 6,            // secondes entre deux rotations
      transition: 'glisse',   // glisse | fondu | flip
      paused: false,
      position: 'original',   // original | haut-centre | bas-centre | bas-gauche | bas-droite
      height: 58,             // hauteur des logos en px
      color: '#ffffff',
      progress: true          // fine barre de progression sous les logos
    },
    logo: {
      show: true,
      src: 'assets/logos/urc-b-blanc.png',
      tint: true,             // recolorer le logo avec « color » (désactiver pour garder ses couleurs)
      color: '#ffffff',       // couleur appliquée au logo (rouge d'origine : #d0221b)
      height: 80,             // hauteur en px
      position: 'original',   // original (haut droite) | haut-gauche | bas-droite | bas-gauche | centre
      opacity: 1,
      glow: false,            // halo lumineux
      box: false              // carré sombre derrière (comme l'écran d'origine)
    },
    timer: {
      label: 'LA PARTIE COMMENCE DANS',
      sublabel: '',
      endText: 'C’EST PARTI !',
      duration: 600,          // secondes
      running: false,
      endAt: 0,               // horodatage (ms) de fin quand le timer tourne
      remaining: 600,         // secondes restantes quand il est en pause
      position: 'original',   // original | haut-droite | bas-gauche | centre
      color: '#ffffff',
      accent: '#ff3e8a',
      gradient: true,         // chiffres en dégradé accent
      size: 1,
      pulse: true             // pulsation sur les 10 dernières secondes
    }
  };

  /* Ambiances prêtes à l'emploi pour le fond (modifiables ensuite couleur par couleur). */
  var FOND_PRESETS = {
    vice:    { nom: 'Vice City (défaut)', c1: '#0d0623', c2: '#3b1460', c3: '#d6336c', c4: '#ff8a3d', glow: '#ffc36b', accent: '#2de2e6' },
    sunset:  { nom: 'Coucher de soleil',  c1: '#1a0b2e', c2: '#6a1b4d', c3: '#ff4f6d', c4: '#ffb86b', glow: '#ffe08a', accent: '#ff6ec7' },
    miami:   { nom: 'Miami turquoise',    c1: '#062b3d', c2: '#0f6c80', c3: '#23c7c0', c4: '#ff8fb1', glow: '#fff0b3', accent: '#ff4fa3' },
    neon:    { nom: 'Néon nuit',          c1: '#05030f', c2: '#1b0b3a', c3: '#5a1e8c', c4: '#e0336f', glow: '#ff7ab8', accent: '#34f5ff' },
    lagon:   { nom: 'Turquoise (original)', c1: '#1fc9b4', c2: '#2fe0c4', c3: '#2bc9cf', c4: '#3b8fe0', glow: '#d8fff6', accent: '#ffffff' }
  };

  /* Petites fonctions de couleur partagées. */
  function hexToRgb(hex) {
    var h = String(hex || '#000').replace('#', '');
    if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    var n = parseInt(h, 16) || 0;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(function (v) { return Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0'); }).join('');
  }
  var color = {
    rgba: function (hex, a) { var c = hexToRgb(hex); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; },
    mix: function (a, b, t) {
      var x = hexToRgb(a), y = hexToRgb(b);
      return rgbToHex(x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t);
    },
    hueShift: function (hex, deg) {
      var c = hexToRgb(hex).map(function (v) { return v / 255; });
      var max = Math.max.apply(null, c), min = Math.min.apply(null, c), l = (max + min) / 2, h = 0, s = 0, d = max - min;
      if (d) {
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        h = max === c[0] ? (c[1] - c[2]) / d + (c[1] < c[2] ? 6 : 0) : max === c[1] ? (c[2] - c[0]) / d + 2 : (c[0] - c[1]) / d + 4;
        h *= 60;
      }
      h = (h + deg + 360) % 360;
      function f(n) { var k = (n + h / 30) % 12, a = s * Math.min(l, 1 - l); return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); }
      return rgbToHex(f(0) * 255, f(8) * 255, f(4) * 255);
    }
  };

  /* ---------- utilitaires ---------- */
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function isObj(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }
  function merge(base, over) {
    var out = clone(base);
    if (!isObj(over)) return out;
    Object.keys(over).forEach(function (k) {
      if (over[k] === undefined) return;
      if (isObj(over[k]) && isObj(out[k])) out[k] = merge(out[k], over[k]);
      else out[k] = clone(over[k]);
    });
    return out;
  }
  function safeGet(key) { try { return global.localStorage.getItem(key); } catch (e) { return null; } }
  function safeSet(key, val) { try { global.localStorage.setItem(key, val); } catch (e) { /* stockage indisponible */ } }

  function b64encode(obj) {
    var json = JSON.stringify(obj);
    var bin = unescape(encodeURIComponent(json));
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function b64decode(str) {
    var s = str.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    return JSON.parse(decodeURIComponent(escape(atob(s))));
  }

  /* Convertit une valeur texte d'URL selon le type de la valeur par défaut. */
  function coerce(raw, ref) {
    if (typeof ref === 'boolean') return !/^(0|false|non|no|off)$/i.test(raw);
    if (typeof ref === 'number') {
      if (/^\d{1,3}:\d{2}$/.test(raw)) { var p = raw.split(':'); return (+p[0]) * 60 + (+p[1]); }
      var n = parseFloat(raw); return isNaN(n) ? ref : n;
    }
    if (Array.isArray(ref)) return raw.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    return raw;
  }

  function readUrl(section, aliases) {
    var over = {};
    var params = new URLSearchParams(global.location.search);
    if (params.get('cfg')) {
      try { over = b64decode(params.get('cfg')); } catch (e) { console.warn('[URC] cfg illisible', e); }
    }
    params.forEach(function (raw, key) {
      if (key === 'cfg' || key === 'live') return;
      var sec = section, field = key;
      if (key.indexOf('.') > 0) { sec = key.split('.')[0]; field = key.split('.').slice(1).join('.'); }
      else if (aliases && aliases[key]) field = aliases[key];
      if (!sec || !DEFAULTS[sec] || !(field in DEFAULTS[sec])) return;
      over[sec] = over[sec] || {};
      var val = coerce(raw, DEFAULTS[sec][field]);
      if (typeof val === 'string' && /^[0-9a-f]{6}$/i.test(val) && /^#/.test(DEFAULTS[sec][field])) val = '#' + val;
      over[sec][field] = val;
    });
    return over;
  }

  function loadStored() {
    var raw = safeGet(STORE_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  }

  /* ---------- API ---------- */
  var URC = {
    DEFAULTS: DEFAULTS,
    FOND_PRESETS: FOND_PRESETS,
    color: color,
    STORE_KEY: STORE_KEY,
    OBS_EVENT: OBS_EVENT,
    clone: clone,
    merge: merge,
    encode: b64encode,
    decode: b64decode,
    state: null,
    rev: 0,
    _handlers: [],
    _cmdHandlers: [],
    _bc: null,

    /* Charge l'état complet (défauts + sauvegarde + URL). */
    load: function (section, aliases) {
      var stored = loadStored();
      var state = merge(DEFAULTS, stored && stored.state);
      this.rev = (stored && stored.rev) || 0;
      state = merge(state, readUrl(section, aliases));
      this.state = state;
      return state;
    },

    save: function () {
      safeSet(STORE_KEY, JSON.stringify({ rev: this.rev, state: this.state }));
    },

    /*
     * Pour un calque : charge la config, écoute les mises à jour et appelle
     * onChange(configDeLaSection, etatComplet) au départ puis à chaque changement.
     */
    init: function (opts) {
      var self = this;
      var section = opts.section;
      this.load(section, opts.aliases);
      var live = new URLSearchParams(global.location.search).get('live') !== '0';
      var last = JSON.stringify(this.state[section]);

      function apply(force) {
        var cur = JSON.stringify(self.state[section]);
        if (!force && cur === last) return;
        last = cur;
        opts.onChange(self.state[section], self.state);
      }

      this._handlers.push(function () { apply(false); });
      if (opts.onCommand) this._cmdHandlers.push(function (msg) {
        if (msg.section === section || msg.section === '*') opts.onCommand(msg.cmd, msg.arg);
      });

      if (live) this.listen();
      apply(true);
      return this.state[section];
    },

    /* Reçoit un message (de config.html ou d'OBS). */
    receive: function (msg) {
      if (typeof msg === 'string') { try { msg = JSON.parse(msg); } catch (e) { return; } }
      if (!msg || !msg.t) return;
      if (msg.t === 'cmd') {
        if (msg.cmd === 'reload' && (msg.section === '*' || !msg.section)) { global.location.reload(); return; }
        this._cmdHandlers.forEach(function (h) { h(msg); });
        return;
      }
      if (msg.rev && msg.rev <= this.rev) return; // déjà appliqué ou plus ancien
      if (msg.t === 'state' && msg.state) this.state = merge(DEFAULTS, msg.state);
      else if (msg.t === 'patch' && msg.section && msg.data) {
        var patch = {}; patch[msg.section] = msg.data;
        this.state = merge(this.state, patch);
      } else return;
      if (msg.rev) this.rev = msg.rev;
      this.save();
      this._handlers.forEach(function (h) { h(); });
    },

    listen: function () {
      var self = this;
      if (this._listening) return;
      this._listening = true;
      if ('BroadcastChannel' in global) {
        this._bc = new BroadcastChannel(CHANNEL);
        this._bc.onmessage = function (e) { self.receive(e.data); };
      }
      // Événement personnalisé émis par OBS (obs-websocket → obs-browser « emit_event »)
      global.addEventListener(OBS_EVENT, function (e) { self.receive(e.detail); });
      // Autres onglets du même navigateur
      global.addEventListener('storage', function (e) {
        if (e.key !== STORE_KEY || !e.newValue) return;
        try {
          var s = JSON.parse(e.newValue);
          self.receive({ t: 'state', rev: s.rev, state: s.state });
        } catch (err) { /* ignore */ }
      });
    },

    /* Pour config.html : diffuse un message sur tous les canaux. */
    publish: function (msg, obsLink) {
      if (!this._bc && 'BroadcastChannel' in global) this._bc = new BroadcastChannel(CHANNEL);
      if (this._bc) this._bc.postMessage(msg);
      if (obsLink && obsLink.connected) obsLink.emit(OBS_EVENT, msg).catch(function () {});
    },

    /* ---------- timer : calcul partagé ---------- */
    timerRemaining: function (t, now) {
      now = now || Date.now();
      if (t.running && t.endAt) return Math.max(0, (t.endAt - now) / 1000);
      return Math.max(0, +t.remaining || 0);
    }
  };

  global.URC = URC;
})(window);
