/* Page de configuration générale : modifie l'état partagé et le diffuse en direct aux calques. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  var state = URC.load(null);
  URC.state = state;
  var obs = new ObsLink();
  var flushTimer = null;

  /* ---------- Outils ---------- */
  function toast(text) {
    var t = $('toast'); t.textContent = text; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove('show'); }, 2200);
  }
  function fmtTime(sec) {
    var s = Math.ceil(Math.max(0, sec)), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
    var p = function (n) { return String(n).padStart(2, '0'); };
    return h ? h + ':' + p(m) + ':' + p(r) : p(m) + ':' + p(r);
  }
  function parseDuration(txt) {
    txt = String(txt || '').trim();
    if (!txt) return null;
    var parts = txt.split(':').map(function (x) { return parseInt(x, 10) || 0; });
    if (parts.length === 1) return parts[0] * 60;                     // « 10 » = 10 minutes
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  function copy(text) {
    var done = function () { toast('Copié dans le presse-papiers'); };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
    } else { fallbackCopy(text); done(); }
  }
  function fallbackCopy(text) {
    var ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta);
    ta.select(); try { document.execCommand('copy'); } catch (e) { /* rien */ } ta.remove();
  }
  function getPath(path) { var p = path.split('.'); return state[p[0]][p[1]]; }
  function setPath(path, val) { var p = path.split('.'); state[p[0]][p[1]] = val; }

  /* ---------- Diffusion ---------- */
  function commit(now) {
    clearTimeout(flushTimer);
    if (now) flush(); else flushTimer = setTimeout(flush, 60);
  }
  function flush() {
    var rev = Date.now();
    if (rev <= URC.rev) rev = URC.rev + 1;
    URC.rev = rev;
    URC.state = state;
    URC.save();
    URC.publish({ t: 'state', rev: rev, state: state }, obs);
  }
  function command(section, cmd, arg) {
    URC.publish({ t: 'cmd', section: section, cmd: cmd, arg: arg }, obs);
  }

  /* ---------- Champs génériques (data-k="section.cle") ---------- */
  function outText(el) {
    var k = el.dataset.k, v = parseFloat(el.value);
    if (/interval$/.test(k)) return v + ' s';
    if (/(size|scale|speed)$/.test(k)) return v.toFixed(2).replace(/\.?0+$/, '') + '×';
    if (/Opacity$/.test(k)) return Math.round(v * 100) + ' %';
    if (/height$/.test(k)) return v + ' px';
    return String(v);
  }
  function showOut(el) {
    if (el.type !== 'range') return;
    var o = el.parentNode.querySelector('output'); if (o) o.textContent = outText(el);
  }
  function populate() {
    $$('[data-k]').forEach(function (el) {
      var v = getPath(el.dataset.k);
      if (el.type === 'checkbox') el.checked = !!v;
      else el.value = (v === undefined || v === null) ? '' : v;
      showOut(el);
    });
    $('tDur').value = fmtTime(state.timer.duration);
    renderPresets(); renderSponsors(); renderChips();
  }
  $$('[data-k]').forEach(function (el) {
    el.addEventListener('input', function () {
      var k = el.dataset.k, v;
      if (el.type === 'checkbox') v = el.checked;
      else if (el.type === 'range' || el.type === 'number' || el.hasAttribute('data-num')) v = parseFloat(el.value);
      else v = el.value;
      setPath(k, v); showOut(el);
      if (/^fond\.(c[1-4]|glow|accent)$/.test(k)) { state.fond.preset = 'perso'; renderPresets(); }
      if (k === 'champions.forced') renderChips();
      commit();
    });
  });

  /* ---------- Timer ---------- */
  var T = function () { return state.timer; };
  function renderTimer() {
    var t = T(), rem = URC.timerRemaining(t);
    var finished = t.running && rem <= 0;
    $('tRead').textContent = finished ? '00:00' : fmtTime(rem);
    var st = $('tState');
    st.className = finished ? 'done' : t.running ? 'on' : '';
    st.textContent = finished ? 'Terminé : « ' + t.endText + ' »' : t.running ? 'En cours' : (rem < t.duration ? 'En pause' : 'Prêt');
    $('tPause').textContent = !t.running && rem > 0 && rem < t.duration ? '▶ Reprendre' : '❚❚ Pause';
  }
  function tStart() {
    var t = T();
    if (t.running && URC.timerRemaining(t) > 0) return;
    var rem = t.remaining > 0 && !t.running ? t.remaining : t.duration;
    t.running = true; t.endAt = Date.now() + rem * 1000;
    commit(true); renderTimer();
  }
  $('tStart').onclick = tStart;
  $('tPause').onclick = function () {
    var t = T();
    if (t.running) {
      t.remaining = Math.max(0, (t.endAt - Date.now()) / 1000);
      t.running = false; t.endAt = 0;
      commit(true); renderTimer();
    } else if (t.remaining > 0) tStart();
  };
  $('tReset').onclick = function () {
    var t = T(); t.running = false; t.endAt = 0; t.remaining = t.duration;
    commit(true); renderTimer();
  };
  $$('[data-tadd]').forEach(function (b) {
    b.onclick = function () {
      var t = T(), d = +b.dataset.tadd, now = Date.now();
      if (t.running) {
        if (t.endAt < now) t.endAt = now;
        t.endAt = Math.max(now, t.endAt + d * 1000);
      } else {
        t.remaining = Math.max(0, (+t.remaining || 0) + d);
      }
      commit(true); renderTimer();
    };
  });
  function applyDuration() {
    var d = parseDuration($('tDur').value);
    if (d === null) { $('tDur').value = fmtTime(T().duration); return; }
    var t = T(); t.duration = d;
    if (!t.running) t.remaining = d;
    $('tDur').value = fmtTime(d);
    commit(true); renderTimer();
  }
  $('tDur').addEventListener('change', applyDuration);
  $('tDur').addEventListener('keydown', function (e) { if (e.key === 'Enter') applyDuration(); });
  $('tAtGo').onclick = function () {
    var v = $('tAt').value; if (!v) { toast('Choisis une heure'); return; }
    var hm = v.split(':'), target = new Date();
    target.setHours(+hm[0], +hm[1], 0, 0);
    if (target.getTime() <= Date.now()) target.setDate(target.getDate() + 1);
    var t = T();
    t.duration = Math.round((target.getTime() - Date.now()) / 1000);
    t.running = true; t.endAt = target.getTime();
    $('tDur').value = fmtTime(t.duration);
    commit(true); renderTimer();
    toast('Compte à rebours calé sur ' + v);
  };
  setInterval(renderTimer, 200);

  /* ---------- Sponsors ---------- */
  var fileTarget = -1;
  function renderSponsors() {
    var host = $('spList'); host.innerHTML = '';
    state.sponsors.items.forEach(function (it, i) {
      var row = document.createElement('div');
      row.className = 'sp-row' + (it.on === false ? ' off' : '');
      row.innerHTML =
        '<input type="checkbox" title="Afficher">' +
        '<div class="thumb"></div>' +
        '<div class="txt"><input type="text" class="name" placeholder="Nom du sponsor">' +
        '<input type="text" class="src" placeholder="assets/logos/mon-logo.png ou https://…"></div>' +
        '<div class="acts">' +
          '<button class="sm ghost" data-a="up" title="Monter">↑</button>' +
          '<button class="sm ghost" data-a="down" title="Descendre">↓</button>' +
          '<button class="sm ghost" data-a="file" title="Choisir une image sur ce PC">📁</button>' +
          '<button class="sm ghost" data-a="del" title="Supprimer">✕</button>' +
        '</div>';
      var cb = row.querySelector('input[type=checkbox]'), name = row.querySelector('.name'), src = row.querySelector('.src'), th = row.querySelector('.thumb');
      cb.checked = it.on !== false; name.value = it.name || '';
      src.value = /^data:/.test(it.src) ? '(image importée depuis le PC)' : (it.src || '');
      src.readOnly = /^data:/.test(it.src);
      th.style.backgroundImage = it.src ? 'url("' + it.src + '")' : 'none';
      cb.onchange = function () { it.on = cb.checked; row.classList.toggle('off', !cb.checked); commit(); };
      name.oninput = function () { it.name = name.value; commit(); };
      src.oninput = function () { it.src = src.value.trim(); th.style.backgroundImage = it.src ? 'url("' + it.src + '")' : 'none'; commit(); };
      row.querySelector('.acts').onclick = function (e) {
        var a = e.target.dataset && e.target.dataset.a; if (!a) return;
        var arr = state.sponsors.items;
        if (a === 'up' && i > 0) { arr.splice(i - 1, 0, arr.splice(i, 1)[0]); }
        else if (a === 'down' && i < arr.length - 1) { arr.splice(i + 1, 0, arr.splice(i, 1)[0]); }
        else if (a === 'del') { arr.splice(i, 1); }
        else if (a === 'file') { fileTarget = i; $('spFile').value = ''; $('spFile').click(); return; }
        else return;
        renderSponsors(); commit();
      };
      host.appendChild(row);
    });
  }
  $('spAdd').onclick = function () { state.sponsors.items.push({ name: '', src: '', on: true }); renderSponsors(); };
  $('spNext').onclick = function () { command('sponsors', 'next'); };
  $('spFile').onchange = function () {
    var f = this.files && this.files[0]; if (!f || fileTarget < 0) return;
    if (f.size > 400 * 1024) { toast('Image trop lourde (400 Ko max). Ajoute-la plutôt dans assets/logos du dépôt.'); return; }
    var rd = new FileReader();
    rd.onload = function () {
      var it = state.sponsors.items[fileTarget];
      if (!it) return;
      it.src = rd.result; if (!it.name) it.name = f.name.replace(/\.[^.]+$/, '');
      renderSponsors(); commit();
    };
    rd.readAsDataURL(f);
  };

  /* ---------- Champions ---------- */
  function forcedArr() { return String(state.champions.forced || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean); }
  function nice(entry) {
    var p = String(entry).split(':'), id = p[0];
    var b = window.URC_CHAMPS[id];
    return (b ? b.name : id) + (p[1] ? ' (skin ' + p[1] + ')' : '');
  }
  function renderChips() {
    var host = $('chList'); host.innerHTML = '';
    var f = forcedArr();
    state.champions.list.forEach(function (entry, i) {
      var chip = document.createElement('span');
      chip.className = 'chip' + (f.indexOf(entry) !== -1 ? ' forced' : '');
      chip.innerHTML = '<span></span><button title="Forcer / libérer ce champion">★</button><button title="Retirer de la liste">✕</button>';
      chip.firstChild.textContent = nice(entry);
      var btns = chip.querySelectorAll('button');
      btns[0].onclick = function () {
        var fa = forcedArr(), k = fa.indexOf(entry);
        if (k === -1) fa.push(entry); else fa.splice(k, 1);
        state.champions.forced = fa.join(',');
        populateOne('champions.forced'); renderChips(); commit();
      };
      btns[1].onclick = function () {
        state.champions.list.splice(i, 1);
        var fa = forcedArr().filter(function (x) { return x !== entry; });
        state.champions.forced = fa.join(',');
        populateOne('champions.forced'); renderChips(); commit();
      };
      host.appendChild(chip);
    });
  }
  function populateOne(path) {
    $$('[data-k="' + path + '"]').forEach(function (el) { el.value = getPath(path); });
  }
  function addChamp() {
    var v = $('chAdd').value.trim(); if (!v) return;
    v = v.replace(/\s+/g, ' ');
    // Nom affiché (ex. « Lee Sin ») → identifiant Data Dragon si connu
    var id = ddNames[v.toLowerCase()] || v;
    if (state.champions.list.indexOf(id) === -1) state.champions.list.push(id);
    $('chAdd').value = '';
    renderChips(); commit();
  }
  $('chAddBtn').onclick = addChamp;
  $('chAdd').addEventListener('keydown', function (e) { if (e.key === 'Enter') addChamp(); });
  $('chNext').onclick = function () { command('champions', 'next'); };
  $('chShuffle').onclick = function () { command('champions', 'shuffle'); };
  $('chUnforce').onclick = function () { state.champions.forced = ''; populateOne('champions.forced'); renderChips(); commit(); };

  // Liste de tous les champions (Data Dragon) pour l'autocomplétion
  var ddNames = {};
  function fillDatalist(names) {
    $('chNames').innerHTML = names.map(function (n) { return '<option value="' + n.replace(/"/g, '&quot;') + '">'; }).join('');
  }
  fillDatalist(Object.keys(window.URC_CHAMPS).map(function (k) { return window.URC_CHAMPS[k].name; }));
  Object.keys(window.URC_CHAMPS).forEach(function (k) { ddNames[window.URC_CHAMPS[k].name.toLowerCase()] = k; });
  $('chAdd').addEventListener('focus', function once() {
    $('chAdd').removeEventListener('focus', once);
    fetch('https://ddragon.leagueoflegends.com/api/versions.json').then(function (r) { return r.json(); })
      .then(function (v) { return fetch('https://ddragon.leagueoflegends.com/cdn/' + v[0] + '/data/fr_FR/champion.json'); })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        var names = Object.keys(j.data).map(function (id) { ddNames[j.data[id].name.toLowerCase()] = id; return j.data[id].name; });
        names.sort(function (a, b) { return a.localeCompare(b, 'fr'); });
        fillDatalist(names);
      }).catch(function () { /* hors ligne : liste intégrée */ });
  });

  /* ---------- Fond ---------- */
  function renderPresets() {
    var host = $('presets'); host.innerHTML = '';
    Object.keys(URC.FOND_PRESETS).forEach(function (key) {
      var p = URC.FOND_PRESETS[key];
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'swatch' + (state.fond.preset === key ? ' on' : '');
      b.innerHTML = '<i style="background:linear-gradient(172deg,' + p.c1 + ',' + p.c2 + ' 36%,' + p.c3 + ' 70%,' + p.c4 + ')"></i>';
      b.appendChild(document.createTextNode(p.nom));
      b.onclick = function () {
        ['c1', 'c2', 'c3', 'c4', 'glow', 'accent'].forEach(function (k) { state.fond[k] = p[k]; });
        state.fond.preset = key;
        populate(); commit();
      };
      host.appendChild(b);
    });
  }

  /* ---------- Aperçu ---------- */
  var preview = $('preview');
  var lays = $$('.lay', preview);
  function scalePreview() {
    var s = preview.clientWidth / 1920;
    lays.forEach(function (l) { l.style.transform = 'scale(' + s + ')'; });
  }
  if ('ResizeObserver' in window) new ResizeObserver(scalePreview).observe(preview);
  window.addEventListener('resize', scalePreview);
  function setPreview(on) {
    $$('iframe.lay', preview).forEach(function (f) {
      var want = on ? f.dataset.lay + '.html' : 'about:blank';
      if (f.getAttribute('src') !== want) f.setAttribute('src', want);
    });
    $('previewOff').hidden = on;
    lays.forEach(function (l) { l.style.visibility = on ? '' : 'hidden'; });
  }
  $$('[data-lay-tg]').forEach(function (cb) {
    cb.onchange = function () {
      var l = preview.querySelector('[data-lay="' + cb.dataset.layTg + '"]');
      if (l) l.classList.toggle('hide', !cb.checked);
    };
  });
  // Dans un dock OBS ou sur petit écran, l'aperçu démarre en pause (économie de ressources)
  var startPreview = !window.obsstudio && window.innerWidth > 640;
  $('previewOn').checked = startPreview;
  $('previewOn').onchange = function () { setPreview(this.checked); };

  /* ---------- URL pour OBS ---------- */
  var base = location.href.replace(/[?#].*$/, '').replace(/[^/]*$/, '');
  var LAYERS = [
    { id: 'fond', nom: 'Fond animé', type: 'Source navigateur', file: 'fond.html', sec: 'fond' },
    { id: 'champions', nom: 'Cartes champions', type: 'Source navigateur', file: 'champions.html', sec: 'champions' },
    { id: 'timer', nom: 'Timer', type: 'Source navigateur', file: 'timer.html', sec: 'timer' },
    { id: 'sponsors', nom: 'Sponsors (rotation)', type: 'Source navigateur', file: 'sponsors.html', sec: 'sponsors' },
    { id: 'logo', nom: 'Logo B blanc', type: 'Source image', file: 'assets/calques/calque-logo-B.png' },
    { id: 'spimg', nom: 'Sponsors (image fixe)', type: 'Source image', file: 'assets/calques/calque-sponsors-statique.png' }
  ];
  function frozenUrl(L) {
    var o = {}; o[L.sec] = state[L.sec];
    if (L.sec === 'timer') { o.timer = URC.clone(state.timer); o.timer.running = false; o.timer.endAt = 0; o.timer.remaining = o.timer.duration; }
    return base + L.file + '?cfg=' + URC.encode(o);
  }
  function renderUrls() {
    var host = $('urls'); host.innerHTML = '';
    LAYERS.forEach(function (L) {
      var row = document.createElement('div'); row.className = 'url-row';
      row.innerHTML = '<b></b><input type="text" readonly><button class="sm">Copier</button>' +
        (L.sec ? '<button class="sm frz" title="URL contenant les réglages actuels de ce calque">Avec réglages</button>' : '<span class="frz"></span>');
      row.querySelector('b').innerHTML = L.nom + '<small>' + L.type + '</small>';
      var inp = row.querySelector('input'); inp.value = base + L.file;
      inp.onfocus = function () { inp.select(); };
      var btns = row.querySelectorAll('button');
      btns[0].onclick = function () { copy(base + L.file); };
      if (btns[1]) btns[1].onclick = function () { copy(frozenUrl(L)); };
      host.appendChild(row);
    });
  }

  /* ---------- OBS ---------- */
  var OBS_KEY = 'urc-overlay:obs';
  var syncTimer = null, retryTimer = null, manualOff = false;
  function obsSettings() {
    try { return JSON.parse(localStorage.getItem(OBS_KEY)) || {}; } catch (e) { return {}; }
  }
  function saveObsSettings() {
    var s = { host: $('obsHost').value.trim(), port: $('obsPort').value, auto: $('obsAuto').checked };
    if (s.auto) s.pass = $('obsPass').value; // mot de passe gardé seulement si reconnexion auto
    try { localStorage.setItem(OBS_KEY, JSON.stringify(s)); } catch (e) { /* rien */ }
  }
  function setObsUi(status, text) {
    var pill = $('pillObs');
    pill.className = 'pill ' + (status === 'ok' ? 'ok' : status === 'connexion' ? 'wait' : status === 'perdu' || status === 'err' ? 'bad' : '');
    pill.lastChild.textContent = status === 'ok' ? 'OBS : connecté' : status === 'connexion' ? 'OBS : connexion…' : status === 'perdu' ? 'OBS : perdu' : 'OBS : déconnecté';
    $('obsConnect').disabled = status === 'ok' || status === 'connexion';
    $('obsDisconnect').disabled = status !== 'ok';
    $('obsRefresh').disabled = status !== 'ok';
    if (text !== undefined) { $('obsMsg').textContent = text; $('obsMsg').className = 'msg ' + (status === 'ok' ? 'ok' : status === 'err' || status === 'perdu' ? 'bad' : ''); }
  }
  obs.onstatus = function (st) {
    if (st === 'perdu') {
      setObsUi('perdu', 'Connexion à OBS perdue.');
      clearInterval(syncTimer);
      if ($('obsAuto').checked && !manualOff) scheduleRetry();
    } else if (st === 'connexion') setObsUi('connexion');
  };
  function scheduleRetry() {
    clearTimeout(retryTimer);
    retryTimer = setTimeout(function () { connectObs(true); }, 5000);
  }
  function connectObs(silent) {
    manualOff = false;
    saveObsSettings();
    var url = 'ws://' + ($('obsHost').value.trim() || '127.0.0.1') + ':' + ($('obsPort').value || 4455);
    setObsUi('connexion', silent ? undefined : 'Connexion à ' + url + '…');
    obs.connect(url, $('obsPass').value).then(function () {
      setObsUi('ok', 'Connecté. Les réglages sont envoyés à toutes les sources navigateur d’OBS.');
      flush();
      clearInterval(syncTimer);
      // Renvoi régulier de l'état complet : un calque rechargé se remet à jour tout seul
      syncTimer = setInterval(function () { if (obs.connected) URC.publish({ t: 'state', rev: Date.now(), state: state }, obs); }, 5000);
    }).catch(function (err) {
      setObsUi('err', err.message + (location.protocol === 'https:' ? ' Si le navigateur demande l’accès au réseau local, accepte-le.' : ''));
      if ($('obsAuto').checked && !manualOff) scheduleRetry();
    });
  }
  $('obsConnect').onclick = function () { connectObs(false); };
  $('obsDisconnect').onclick = function () {
    manualOff = true; clearTimeout(retryTimer); clearInterval(syncTimer);
    obs.disconnect(); setObsUi('off', 'Déconnecté.');
  };
  $('obsRefresh').onclick = function () {
    obs.refreshBrowserSources().then(function (n) { toast(n + ' source(s) navigateur actualisée(s)'); })
      .catch(function (e) { toast('Échec : ' + e.message); });
  };
  $('obsAuto').onchange = saveObsSettings;
  (function restoreObs() {
    var s = obsSettings();
    if (s.host) $('obsHost').value = s.host;
    if (s.port) $('obsPort').value = s.port;
    if (s.pass) $('obsPass').value = s.pass;
    $('obsAuto').checked = !!s.auto;
    if (s.auto) connectObs(true);
  })();

  $('btnReloadAll').onclick = function () { command('*', 'reload'); toast('Rechargement des calques demandé'); };

  /* ---------- Sauvegarde ---------- */
  $('btnExport').onclick = function () {
    var blob = new Blob([JSON.stringify({ type: 'urc-overlay', version: 1, state: state }, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'overlay-urc-config.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  };
  $('fileImport').onchange = function () {
    var f = this.files && this.files[0]; if (!f) return;
    var rd = new FileReader();
    rd.onload = function () {
      try {
        var j = JSON.parse(rd.result);
        state = URC.merge(URC.DEFAULTS, j.state || j);
        URC.state = state;
        populate(); renderUrls(); commit(true);
        $('saveMsg').textContent = 'Configuration importée.'; $('saveMsg').className = 'msg ok';
      } catch (e) { $('saveMsg').textContent = 'Fichier illisible.'; $('saveMsg').className = 'msg bad'; }
    };
    rd.readAsText(f);
    this.value = '';
  };
  $('btnReset').onclick = function () {
    if (!window.confirm('Remettre tous les réglages par défaut ?')) return;
    state = URC.clone(URC.DEFAULTS); URC.state = state;
    populate(); commit(true);
    $('saveMsg').textContent = 'Réglages par défaut rétablis.'; $('saveMsg').className = 'msg ok';
  };

  /* ---------- Démarrage ---------- */
  populate();
  renderUrls();
  renderTimer();
  setPreview(startPreview);
  scalePreview();
})();
