/* Mur des 10 caméras joueurs + enregistrement des dernières secondes (preuve anti-triche). */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var KEY = 'urc-cameras';
  var ROLES = [['top', 'Top'], ['jungle', 'Jungle'], ['mid', 'Mid'], ['adc', 'ADC'], ['support', 'Support']];
  var TEAMS = [['blue', 'Blue'], ['red', 'Red']];
  var QUALITY = {
    480: { w: 480, h: 270, br: 800000 },
    640: { w: 640, h: 360, br: 1500000 },
    960: { w: 960, h: 540, br: 2500000 },
    1280: { w: 1280, h: 720, br: 4000000 }
  };
  var DEF = { base: 'https://www.montournoiesport.fr/twitch/role-player', matchId: '256', channel: '1', seconds: 15, fps: 15, quality: 640, interact: false, urls: {} };

  function load() {
    try { return Object.assign({}, DEF, JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) { return Object.assign({}, DEF); }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch (e) { /* stockage indisponible */ } }
  var cfg = load();

  /* ---------- Caméras ---------- */
  var cams = [];
  TEAMS.forEach(function (t) {
    ROLES.forEach(function (r) {
      cams.push({ id: t[0] + '-' + r[0], team: t[0], role: r[0], label: t[1] + ' ' + r[1], key: String((cams.length + 1) % 10) });
    });
  });
  function urlFor(c) {
    if (cfg.urls && cfg.urls[c.id]) return cfg.urls[c.id];
    return String(cfg.base).replace(/\/+$/, '') + '/' + encodeURIComponent(cfg.matchId) + '/' + c.role + '/' + c.team + '?channel=' + encodeURIComponent(cfg.channel);
  }

  var selected = cams[0].id;

  function toast(t) {
    var el = $('toast'); el.textContent = t; el.classList.add('show');
    clearTimeout(toast.t); toast.t = setTimeout(function () { el.classList.remove('show'); }, 2600);
  }
  function warn(t) { $('warn').textContent = t || ''; }

  function buildWall() {
    var wall = $('wall'); wall.innerHTML = '';
    TEAMS.forEach(function (t) {
      var row = document.createElement('div');
      row.className = 'team ' + t[0];
      row.innerHTML = '<div class="team-label">' + t[1].toUpperCase() + '</div>';
      cams.filter(function (c) { return c.team === t[0]; }).forEach(function (c) {
        var tile = document.createElement('div');
        tile.className = 'tile'; tile.dataset.id = c.id;
        tile.innerHTML = '<div class="head"><b>' + c.role.toUpperCase() + '</b><span class="buf"></span><span class="k">' + c.key + '</span></div>' +
          '<div class="screen"><iframe allow="autoplay; fullscreen" title="' + c.label + '"></iframe><div class="hit"></div></div>';
        tile.querySelector('iframe').src = urlFor(c);
        tile.onclick = function () { select(c.id); };
        tile.ondblclick = function () { window.open(urlFor(c), '_blank', 'noopener'); };
        c.tile = tile; c.iframe = tile.querySelector('iframe'); c.buf = tile.querySelector('.buf');
        row.appendChild(tile);
      });
      wall.appendChild(row);
    });
    fitWall();
    select(selected);
  }

  // Taille des vignettes : tout tient dans la fenêtre, sans défilement (indispensable pour la capture)
  function fitWall() {
    var wall = $('wall');
    var W = wall.clientWidth - 24, H = wall.clientHeight - 24;
    var colW = (W - 34 - 10 * 5) / 5;           // 5 colonnes + étiquette d'équipe
    var maxColForH = ((H - 10) / 2 - 22) * 16 / 9; // 2 rangées, en-tête de 22 px
    var col = Math.max(120, Math.min(colW, maxColForH));
    document.querySelectorAll('.team').forEach(function (row) {
      row.style.gridTemplateColumns = '34px repeat(5, ' + Math.floor(col) + 'px)';
      row.style.justifyContent = 'center';
    });
  }

  function select(id) {
    selected = id;
    cams.forEach(function (c) { c.tile.classList.toggle('sel', c.id === id); });
    $('camSelect').value = id;
  }

  function fillSelect() {
    $('camSelect').innerHTML = cams.map(function (c) { return '<option value="' + c.id + '">' + c.key + ' · ' + c.label + '</option>'; }).join('');
    $('camSelect').onchange = function () { select(this.value); };
  }

  /* ---------- Capture et enregistrement ---------- */
  var worker = null, track = null, infoTimer = null, rectTimer = null;

  function rectsMsg() {
    var vw = window.innerWidth, vh = window.innerHeight;
    return {
      viewW: vw, viewH: vh, seconds: +cfg.seconds,
      rects: cams.map(function (c) {
        var r = c.iframe.getBoundingClientRect();
        var visible = r.width > 0 && r.left >= -1 && r.top >= -1 && r.right <= vw + 1 && r.bottom <= vh + 1;
        return { id: c.id, x: r.left, y: r.top, w: r.width, h: r.height, visible: visible };
      })
    };
  }
  function sendRects() {
    if (!worker) return;
    var m = rectsMsg(); m.type = 'rects';
    worker.postMessage(m);
    var hidden = m.rects.filter(function (r) { return !r.visible; }).length;
    if (hidden) warn(hidden + ' caméra(s) hors de la fenêtre : agrandis la fenêtre pour qu’elles soient enregistrées.');
  }

  function setRecUi(on, text) {
    $('rec').classList.toggle('on', on);
    $('recTxt').textContent = text;
    $('btnSave').disabled = !on;
    $('btnSaveAll').disabled = !on;
    $('btnCapture').textContent = on ? '■ Arrêter' : '▶ Activer l’enregistrement';
    $('btnCapture').classList.toggle('primary', !on);
  }

  async function startCapture() {
    if (!('MediaStreamTrackProcessor' in window) || !('VideoEncoder' in window) || !navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      warn('Ce navigateur ne permet pas l’enregistrement : utilise Chrome ou Edge à jour.');
      return;
    }
    var stream;
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 30 }, displaySurface: 'browser' },
        audio: false,
        preferCurrentTab: true,
        selfBrowserSurface: 'include',
        surfaceSwitching: 'exclude',
        monitorTypeSurfaces: 'exclude'
      });
    } catch (e) {
      toast('Partage annulé');
      return;
    }
    track = stream.getVideoTracks()[0];
    var st = track.getSettings ? track.getSettings() : {};
    warn('');
    if (st.displaySurface && st.displaySurface !== 'browser') {
      warn('Tu as partagé ' + (st.displaySurface === 'monitor' ? 'un écran entier' : 'une fenêtre') + '. Arrête et choisis « Cet onglet » pour un cadrage exact.');
    } else if (st.width && st.height) {
      var a = st.width / st.height, b = window.innerWidth / window.innerHeight;
      if (Math.abs(a - b) / b > 0.04) warn('Le partage ne semble pas être cet onglet : choisis « Cet onglet » pour un cadrage exact.');
    }
    track.addEventListener('ended', stopCapture);

    var q = QUALITY[cfg.quality] || QUALITY[640];
    var proc = new MediaStreamTrackProcessor({ track: track });
    worker = new Worker('js/cameras-worker.js');
    worker.onmessage = onWorker;
    var m = rectsMsg();
    m.type = 'start';
    m.readable = proc.readable;
    m.cfg = { fps: +cfg.fps, width: q.w, height: q.h, bitrate: q.br, seconds: +cfg.seconds };
    worker.postMessage(m, [proc.readable]);
    setRecUi(true, 'Démarrage…');
    infoTimer = setInterval(function () { if (worker) worker.postMessage({ type: 'info' }); }, 1000);
    rectTimer = setInterval(sendRects, 2000);
  }

  function stopCapture() {
    clearInterval(infoTimer); clearInterval(rectTimer);
    if (track) { try { track.stop(); } catch (e) { /* déjà arrêté */ } }
    if (worker) { worker.postMessage({ type: 'stop' }); var w = worker; setTimeout(function () { w.terminate(); }, 1500); }
    worker = null; track = null;
    cams.forEach(function (c) { c.buf.textContent = ''; });
    setRecUi(false, 'Enregistrement inactif');
  }

  function stamp() {
    var d = new Date(), p = function (n) { return String(n).padStart(2, '0'); };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + '_' + p(d.getHours()) + '-' + p(d.getMinutes()) + '-' + p(d.getSeconds());
  }

  function addClip(id, blob, duration) {
    var cam = cams.filter(function (c) { return c.id === id; })[0];
    var name = 'preuve_match' + cfg.matchId + '_' + cam.team.toUpperCase() + '-' + cam.role.toUpperCase() + '_' + stamp() + '.mp4';
    var url = URL.createObjectURL(blob);
    // Téléchargement automatique
    var a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    // Ajout à la liste
    var list = $('clips');
    var empty = list.querySelector('.empty'); if (empty) empty.remove();
    var el = document.createElement('div'); el.className = 'clip';
    el.innerHTML = '<video controls muted playsinline preload="metadata"></video>' +
      '<div class="meta"><b></b><span></span></div>' +
      '<a class="btn sm" style="width:100%">⬇ Télécharger à nouveau</a>';
    el.querySelector('video').src = url;
    el.querySelector('b').textContent = cam.label;
    el.querySelector('.meta span').textContent = new Date().toLocaleTimeString('fr-FR') + ' · ' + duration.toFixed(1) + ' s';
    var dl = el.querySelector('a'); dl.href = url; dl.download = name;
    list.insertBefore(el, list.firstChild);
    cam.tile.classList.add('flash'); setTimeout(function () { cam.tile.classList.remove('flash'); }, 900);
    toast('Clip enregistré : ' + cam.label);
  }

  function onWorker(e) {
    var m = e.data;
    if (m.type === 'started') setRecUi(true, 'REC : les ' + cfg.seconds + ' dernières secondes sont gardées');
    else if (m.type === 'info') {
      cams.forEach(function (c) {
        var s = m.buffers[c.id] || 0;
        c.buf.textContent = s ? Math.min(+cfg.seconds, Math.floor(s)) + ' s' : '';
      });
    } else if (m.type === 'clip') addClip(m.id, new Blob([m.buffer], { type: m.mime }), m.duration);
    else if (m.type === 'clip-error') toast(m.message);
    else if (m.type === 'error') { warn(m.message); }
    else if (m.type === 'stopped') { if (worker) stopCapture(); }
  }

  function exportCam(id) {
    if (!worker) { toast('Active d’abord l’enregistrement'); return; }
    worker.postMessage({ type: 'export', id: id, seconds: +cfg.seconds });
  }

  $('btnCapture').onclick = function () { if (worker) stopCapture(); else startCapture(); };
  $('btnSave').onclick = function () { exportCam(selected); };
  $('btnSaveAll').onclick = function () { cams.forEach(function (c, i) { setTimeout(function () { exportCam(c.id); }, i * 150); }); };

  document.addEventListener('keydown', function (e) {
    if (/^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement.tagName)) return;
    var c = cams.filter(function (x) { return x.key === e.key; })[0];
    if (c) { select(c.id); e.preventDefault(); }
    else if (e.key === 'Enter') { exportCam(selected); e.preventDefault(); }
  });

  /* ---------- Réglages ---------- */
  function showSecs() { document.querySelectorAll('.secs').forEach(function (s) { s.textContent = cfg.seconds; }); }
  function fillSettings() {
    $('matchId').value = cfg.matchId; $('channel').value = cfg.channel; $('seconds').value = cfg.seconds;
    $('fps').value = String(cfg.fps); $('quality').value = String(cfg.quality); $('base').value = cfg.base;
    $('interact').checked = !!cfg.interact;
    document.body.classList.toggle('interact', !!cfg.interact);
    showSecs();
  }
  $('btnApply').onclick = function () {
    var urlsBefore = cams.map(urlFor).join('|');
    cfg.matchId = $('matchId').value.trim() || DEF.matchId;
    cfg.channel = $('channel').value.trim() || DEF.channel;
    cfg.seconds = Math.max(5, Math.min(60, parseInt($('seconds').value, 10) || 15));
    cfg.fps = +$('fps').value; cfg.quality = +$('quality').value;
    cfg.base = $('base').value.trim() || DEF.base;
    save(); fillSettings();
    if (cams.map(urlFor).join('|') !== urlsBefore) cams.forEach(function (c) { c.iframe.src = urlFor(c); });
    sendRects();
    if (worker) setRecUi(true, 'REC : les ' + cfg.seconds + ' dernières secondes sont gardées');
    toast('Réglages appliqués');
  };
  $('interact').onchange = function () { cfg.interact = this.checked; save(); document.body.classList.toggle('interact', cfg.interact); };
  $('btnDefaults').onclick = function () { var u = cfg.urls; cfg = Object.assign({}, DEF, { urls: u }); fillSettings(); $('btnApply').click(); };

  var rz = null;
  window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { fitWall(); setTimeout(sendRects, 50); }, 120); });

  fillSelect();
  buildWall();
  fillSettings();
  window.addEventListener('beforeunload', function (e) { if (worker) { e.preventDefault(); e.returnValue = ''; } });
})();
