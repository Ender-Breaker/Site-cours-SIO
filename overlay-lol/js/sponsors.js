/* Bandeau « Partenaires officiels » avec rotation périodique des logos. */
(function () {
  'use strict';
  var band = document.getElementById('band');
  var slider = document.getElementById('slider');
  var prog = document.getElementById('prog');
  var label = document.getElementById('label');
  var cfg = null, slides = [], idx = 0, timer = null, structKey = '';

  function chunk(arr, n) {
    var out = [];
    for (var i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
    return out;
  }

  function slideWidth(el) {
    // Largeur réelle d'une diapo (les logos ont des proportions différentes)
    var w = 0, imgs = el.querySelectorAll('img');
    imgs.forEach(function (img) {
      var h = cfg.height;
      w += img.naturalHeight ? img.naturalWidth * h / img.naturalHeight : h * 2;
    });
    return w + Math.max(0, imgs.length - 1) * 44;
  }

  function fit() {
    if (!slides[idx]) { slider.style.width = '0px'; return; }
    slider.style.width = Math.ceil(slideWidth(slides[idx])) + 'px';
  }

  function build() {
    slides.forEach(function (s) { s.remove(); });
    var items = (cfg.items || []).filter(function (it) { return it && it.on !== false && it.src; });
    var per = Math.max(1, Math.round(cfg.perSlide) || 1);
    slides = chunk(items, per).map(function (group) {
      var s = document.createElement('div');
      s.className = 'slide';
      group.forEach(function (it) {
        var img = new Image();
        img.alt = it.name || '';
        img.onload = fit;
        img.src = it.src;
        s.appendChild(img);
      });
      slider.insertBefore(s, slider.firstChild);
      return s;
    });
    idx = 0;
    if (slides[0]) slides[0].classList.add('on');
    fit();
  }

  function restartProgress() {
    prog.classList.remove('run');
    if (slides.length > 1 && !cfg.paused) { void prog.offsetWidth; prog.classList.add('run'); }
  }

  function go(next) {
    if (slides.length < 2) return;
    var cur = slides[idx];
    idx = (next === undefined ? idx + 1 : next) % slides.length;
    var nxt = slides[idx];
    cur.classList.remove('on', 'in'); cur.classList.add('out');
    nxt.classList.remove('out'); void nxt.offsetWidth; nxt.classList.add('in');
    setTimeout(function () { nxt.classList.add('on'); }, 50);
    setTimeout(function () { cur.classList.remove('out'); }, 900);
    fit();
    restartProgress();
  }

  function loop() {
    clearInterval(timer);
    var s = Math.max(2, +cfg.interval || 6);
    document.documentElement.style.setProperty('--dur', s + 's');
    restartProgress();
    if (slides.length > 1 && !cfg.paused) timer = setInterval(go, s * 1000);
  }

  URC.init({
    section: 'sponsors',
    aliases: { intervalle: 'interval', parslide: 'perSlide', pause: 'paused', transition: 'transition' },
    onChange: function (c) {
      cfg = c;
      var root = document.documentElement.style;
      root.setProperty('--h', c.height + 'px');
      root.setProperty('--col', c.color);
      label.textContent = c.label;
      band.className = 'band pos-' + (c.position || 'original') + ' t-' + (c.transition || 'glisse') +
        (c.showLabel ? '' : ' no-label') + (c.progress ? '' : ' no-progress');
      var key = JSON.stringify([c.items, c.perSlide]);
      if (key !== structKey) { structKey = key; build(); }
      else fit();
      loop();
    },
    onCommand: function (cmd) { if (cmd === 'next') { go(); loop(); } }
  });
})();
