/*
 * Enregistreur des caméras (Web Worker).
 * Reçoit les images de l'onglet capturé, découpe chaque caméra, l'encode en continu (WebCodecs)
 * et garde en mémoire les dernières secondes de chacune. Sur demande, assemble un MP4 instantanément.
 */
/* global Mp4Muxer */
importScripts('../vendor/mp4-muxer.js');

var cfg = { fps: 15, width: 640, height: 360, seconds: 15, bitrate: 1500000 };
var view = { w: 1, h: 1 };
var cams = {};       // id → { rect, canvas, ctx, encoder, chunks, decoderConfig, frames }
var codec = null;    // { webcodecs, mux }
var reader = null, running = false, lastTs = -Infinity;

var CODECS = [
  { webcodecs: 'avc1.4d401f', mux: 'avc', extra: { avc: { format: 'avc' } } },   // H.264 Main : lisible partout
  { webcodecs: 'avc1.42001f', mux: 'avc', extra: { avc: { format: 'avc' } } },   // H.264 Baseline
  { webcodecs: 'vp09.00.10.08', mux: 'vp9', extra: {} }                         // VP9 en secours
];

function encoderConfig(c) {
  var o = { codec: c.webcodecs, width: cfg.width, height: cfg.height, bitrate: cfg.bitrate, framerate: cfg.fps, latencyMode: 'realtime' };
  for (var k in c.extra) o[k] = c.extra[k];
  return o;
}

async function pickCodec() {
  for (var i = 0; i < CODECS.length; i++) {
    try {
      var r = await VideoEncoder.isConfigSupported(encoderConfig(CODECS[i]));
      if (r.supported) return CODECS[i];
    } catch (e) { /* suivant */ }
  }
  throw new Error('Aucun encodeur vidéo disponible dans ce navigateur.');
}

function makeCam(id) {
  var canvas = new OffscreenCanvas(cfg.width, cfg.height);
  var cam = { id: id, rect: null, canvas: canvas, ctx: canvas.getContext('2d', { alpha: false }), chunks: [], decoderConfig: null, frames: 0 };
  cam.encoder = new VideoEncoder({
    output: function (chunk, meta) {
      var data = new Uint8Array(chunk.byteLength);
      chunk.copyTo(data);
      if (meta && meta.decoderConfig) cam.decoderConfig = meta.decoderConfig;
      cam.chunks.push({ data: data, type: chunk.type, ts: chunk.timestamp, dur: chunk.duration || Math.round(1e6 / cfg.fps) });
      prune(cam);
    },
    error: function (e) { postMessage({ type: 'error', message: 'Encodeur ' + id + ' : ' + e.message }); }
  });
  cam.encoder.configure(encoderConfig(codec));
  return cam;
}

/* Garde seulement la fenêtre utile, en commençant toujours par une image clé. */
function prune(cam) {
  var ch = cam.chunks;
  if (!ch.length) return;
  var cutoff = ch[ch.length - 1].ts - (cfg.seconds + 2) * 1e6;
  var k = -1;
  for (var i = 0; i < ch.length && ch[i].ts <= cutoff; i++) if (ch[i].type === 'key') k = i;
  if (k > 0) ch.splice(0, k);
}

function encodeAll(frame) {
  var sx = frame.displayWidth / view.w, sy = frame.displayHeight / view.h;
  var ts = frame.timestamp;
  var keyEvery = Math.max(1, Math.round(cfg.fps)); // une image clé par seconde
  Object.keys(cams).forEach(function (id) {
    var c = cams[id];
    if (!c.rect || c.encoder.state !== 'configured') return;
    if (c.encoder.encodeQueueSize > 6) return; // machine surchargée : on saute cette image
    var r = c.rect;
    c.ctx.drawImage(frame, r.x * sx, r.y * sy, r.w * sx, r.h * sy, 0, 0, cfg.width, cfg.height);
    var vf = new VideoFrame(c.canvas, { timestamp: ts, duration: Math.round(1e6 / cfg.fps) });
    c.encoder.encode(vf, { keyFrame: c.frames % keyEvery === 0 });
    vf.close();
    c.frames++;
  });
}

async function pump() {
  var minGap = 1e6 / cfg.fps - 4000;
  while (running) {
    var res;
    try { res = await reader.read(); } catch (e) { break; }
    if (res.done) break;
    var frame = res.value;
    if (frame.timestamp - lastTs >= minGap) { lastTs = frame.timestamp; encodeAll(frame); }
    frame.close();
  }
  running = false;
  postMessage({ type: 'stopped' });
}

function setRects(msg) {
  view = { w: msg.viewW, h: msg.viewH };
  if (msg.seconds) cfg.seconds = msg.seconds;
  msg.rects.forEach(function (r) {
    if (!cams[r.id]) cams[r.id] = makeCam(r.id);
    cams[r.id].rect = r.visible ? r : null;
  });
}

function bufferInfo() {
  var out = {};
  Object.keys(cams).forEach(function (id) {
    var ch = cams[id].chunks;
    out[id] = ch.length ? (ch[ch.length - 1].ts - ch[0].ts) / 1e6 : 0;
  });
  return out;
}

async function exportClip(id, seconds) {
  var c = cams[id];
  if (!c) return postMessage({ type: 'clip-error', id: id, message: 'Caméra inconnue' });
  try { await c.encoder.flush(); } catch (e) { /* on exporte ce qu'on a */ }
  var ch = c.chunks.slice();
  if (!ch.length || !c.decoderConfig) return postMessage({ type: 'clip-error', id: id, message: 'Rien en mémoire pour cette caméra (enregistrement pas encore démarré ?)' });
  var end = ch[ch.length - 1].ts + ch[ch.length - 1].dur;
  var wanted = end - seconds * 1e6;
  var k = 0;
  for (var i = 0; i < ch.length; i++) if (ch[i].type === 'key' && ch[i].ts <= wanted) k = i;
  var sel = ch.slice(k);
  var muxer = new Mp4Muxer.Muxer({
    target: new Mp4Muxer.ArrayBufferTarget(),
    video: { codec: codec.mux, width: cfg.width, height: cfg.height, frameRate: cfg.fps },
    fastStart: 'in-memory',
    firstTimestampBehavior: 'offset'
  });
  sel.forEach(function (x, j) {
    var dur = j < sel.length - 1 ? Math.max(1, sel[j + 1].ts - x.ts) : x.dur;
    muxer.addVideoChunkRaw(x.data, x.type, x.ts, dur, j === 0 ? { decoderConfig: c.decoderConfig } : undefined);
  });
  muxer.finalize();
  var buf = muxer.target.buffer;
  postMessage({ type: 'clip', id: id, buffer: buf, duration: (end - sel[0].ts) / 1e6, mime: 'video/mp4' }, [buf]);
}

onmessage = async function (e) {
  var m = e.data;
  try {
    if (m.type === 'start') {
      for (var k in m.cfg) cfg[k] = m.cfg[k];
      codec = await pickCodec();
      setRects(m);
      reader = m.readable.getReader();
      running = true; lastTs = -Infinity;
      postMessage({ type: 'started', codec: codec.webcodecs });
      pump();
    } else if (m.type === 'rects') {
      if (codec) setRects(m);
    } else if (m.type === 'export') {
      await exportClip(m.id, m.seconds || cfg.seconds);
    } else if (m.type === 'info') {
      postMessage({ type: 'info', buffers: bufferInfo() });
    } else if (m.type === 'stop') {
      running = false;
      if (reader) try { await reader.cancel(); } catch (err) { /* déjà fermé */ }
      Object.keys(cams).forEach(function (id) { try { cams[id].encoder.close(); } catch (err) { /* rien */ } });
      cams = {};
    }
  } catch (err) {
    postMessage({ type: 'error', message: err.message || String(err) });
  }
};
