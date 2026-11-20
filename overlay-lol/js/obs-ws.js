/*
 * Client obs-websocket v5 minimal (intégré à OBS 28+).
 * Sert à la page config.html pour envoyer les réglages aux sources navigateur :
 * CallVendorRequest → obs-browser « emit_event » déclenche un événement window dans chaque calque.
 */
(function (global) {
  'use strict';

  function sha256b64(text) {
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)).then(function (buf) {
      var bin = ''; new Uint8Array(buf).forEach(function (b) { bin += String.fromCharCode(b); });
      return btoa(bin);
    });
  }

  function ObsLink() {
    this.ws = null;
    this.connected = false;
    this.pending = {};
    this.seq = 0;
    this.onstatus = function () {};
  }

  ObsLink.prototype.connect = function (url, password) {
    var self = this;
    this.disconnect();
    if (!global.crypto || !crypto.subtle) return Promise.reject(new Error('Page non sécurisée : ouvre la config en https ou en localhost.'));
    return new Promise(function (resolve, reject) {
      var done = false, ws;
      try { ws = new WebSocket(url, 'obswebsocket.json'); }
      catch (e) { reject(new Error('Adresse invalide')); return; }
      self.ws = ws;
      self.onstatus('connexion');
      ws.onmessage = function (ev) {
        var m; try { m = JSON.parse(ev.data); } catch (e) { return; }
        if (m.op === 0) { // Hello
          var identify = { op: 1, d: { rpcVersion: 1, eventSubscriptions: 0 } };
          var auth = m.d && m.d.authentication;
          if (!auth) { ws.send(JSON.stringify(identify)); return; }
          if (!password) { done = true; ws.close(); reject(new Error('OBS demande un mot de passe')); return; }
          sha256b64(password + auth.salt)
            .then(function (secret) { return sha256b64(secret + auth.challenge); })
            .then(function (a) { identify.d.authentication = a; ws.send(JSON.stringify(identify)); });
        } else if (m.op === 2) { // Identified
          done = true; self.connected = true; self.onstatus('ok'); resolve();
        } else if (m.op === 7) { // RequestResponse
          var p = self.pending[m.d.requestId];
          if (!p) return;
          delete self.pending[m.d.requestId];
          if (m.d.requestStatus && m.d.requestStatus.result) p.resolve(m.d.responseData || {});
          else p.reject(new Error((m.d.requestStatus && m.d.requestStatus.comment) || 'Requête refusée'));
        }
      };
      ws.onclose = function (ev) {
        var wasOn = self.connected;
        self.connected = false;
        Object.keys(self.pending).forEach(function (k) { self.pending[k].reject(new Error('Déconnecté')); });
        self.pending = {};
        self.onstatus(wasOn ? 'perdu' : 'off');
        if (!done) {
          done = true;
          reject(new Error(ev.code === 4009 ? 'Mot de passe incorrect' : 'Connexion impossible (OBS ouvert ? serveur WebSocket activé ?)'));
        }
      };
      ws.onerror = function () { /* géré dans onclose */ };
    });
  };

  ObsLink.prototype.disconnect = function () {
    if (this.ws) { try { this.ws.onclose = null; this.ws.close(); } catch (e) { /* déjà fermé */ } }
    this.ws = null; this.connected = false;
  };

  ObsLink.prototype.request = function (type, data) {
    var self = this;
    if (!this.connected) return Promise.reject(new Error('OBS non connecté'));
    var id = 'r' + (++this.seq);
    return new Promise(function (resolve, reject) {
      self.pending[id] = { resolve: resolve, reject: reject };
      self.ws.send(JSON.stringify({ op: 6, d: { requestType: type, requestId: id, requestData: data || {} } }));
      setTimeout(function () { if (self.pending[id]) { delete self.pending[id]; reject(new Error('Pas de réponse')); } }, 5000);
    });
  };

  /* Événement personnalisé reçu par toutes les sources navigateur (window.addEventListener(nom, …)). */
  ObsLink.prototype.emit = function (name, data) {
    return this.request('CallVendorRequest', {
      vendorName: 'obs-browser', requestType: 'emit_event',
      requestData: { event_name: name, event_data: data }
    });
  };

  /* Actualise (sans cache) toutes les sources navigateur de la collection de scènes. */
  ObsLink.prototype.refreshBrowserSources = function () {
    var self = this;
    return this.request('GetInputList', { inputKind: 'browser_source' }).then(function (r) {
      var inputs = r.inputs || [];
      return Promise.all(inputs.map(function (i) {
        return self.request('PressInputPropertiesButton', { inputName: i.inputName, propertyName: 'refreshnocache' }).catch(function () {});
      })).then(function () { return inputs.length; });
    });
  };

  global.ObsLink = ObsLink;
})(window);
