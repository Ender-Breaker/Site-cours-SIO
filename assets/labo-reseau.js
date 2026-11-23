/* Étude Facile — labo Réseau (module Réseau, Bloc 1).
   Missions générées au hasard : équipements et couches, encapsulation de routeur en routeur, lecture de tables de routage,
   écriture de routes statiques, drapeaux et ports TCP/UDP, NAT et redirection de port.
   Modes : parcours guidé (#m=L1-2), testeur de table de routage (#libre), épreuve chronométrée (#examen).
   Progression : localStorage « ef-labo-reseau » { done: { "L1-2": 1, … } }. Classement pratique : « reseau_pratique ».
   Fichier généré par /home/claude/reseau/gen_labo.py (en-tête + générateurs) à partir du moteur de labo-ipv4.js. */
(function () {
  "use strict";
  var EF = window.EtudeFacile, esc = EF.esc, el = EF.el, I = EF.icon;
  var CLE = "ef-labo-reseau", MID = "reseau", NB_EX = 8, DUREE_EX = 900, COEF_EX = 150;
  var $ = function (id) { return document.getElementById(id); };

  /* ---------- calcul IPv4 ---------- */
  function toIP(n) { return [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join("."); }
  function parseIP(s) {
    var m = /^\s*(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\s*$/.exec(String(s));
    if (!m) return null;
    var p = m.slice(1).map(Number);
    if (p.some(function (x) { return x > 255; })) return null;
    return ((p[0] << 24) | (p[1] << 16) | (p[2] << 8) | p[3]) >>> 0;
  }
  function maskOf(c) { return c === 0 ? 0 : ((0xFFFFFFFF << (32 - c)) >>> 0); }
  function net(ip, c) { return (ip & maskOf(c)) >>> 0; }
  function r(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(a) { return a[r(0, a.length - 1)]; }
  function melange(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = r(0, i), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function ip4(a, b, c, d) { return (((a << 24) | (b << 16) | (c << 8) | d) >>> 0); }
  function cidr(s) { var m = /^\s*\/?\s*(\d{1,2})\s*$/.exec(String(s)); return m && +m[1] <= 32 ? +m[1] : null; }
  function entier(s) { var m = /^\s*(\d+)\s*$/.exec(String(s).replace(/\s/g, "")); return m ? +m[1] : null; }
  function mac() { var h = "0123456789ABCDEF", s = "00:1A"; for (var i = 0; i < 4; i++) s += ":" + h[r(0, 15)] + h[r(0, 15)]; return s; }
  function macs(n) { var t = {}, o = []; while (o.length < n) { var m = mac(); if (!t[m]) { t[m] = 1; o.push(m); } } return o; }
  function table(tete, lignes) {
    return '<div class="tab-defil"><table><tr>' + tete.map(function (t) { return "<th>" + t + "</th>"; }).join("") + "</tr>" +
      lignes.map(function (l) { return "<tr>" + l.map(function (x) { return '<td class="m">' + x + "</td>"; }).join("") + "</tr>"; }).join("") + "</table></div>";
  }
  var CHOIX_EQ = ["Hub", "Switch", "Routeur", "Point d'accès Wi-Fi", "Box"];
  var CHOIX_TCPIP = ["Application", "Transport", "Internet", "Accès réseau"];

  /* ---------- générateurs ----------
     { titre, texte, champs:[{ id, label, type:"ip"|"cidr"|"nombre"|"ouinon"|"choix", options?, rep }], solution, explication } */
  var G = {
    /* ===== 1. Équipements et couches ===== */
    equip: function () {
      var b = pick([
        ["Il recopie le signal reçu sur un port vers tous les autres ports, sans lire aucune adresse.", "Hub", "couche 1 : il ne voit ni trame ni paquet, d'où collisions et diffusion à tout le monde."],
        ["Il apprend sur quel port se trouve chaque adresse MAC et n'envoie la trame que sur le bon port.", "Switch", "couche 2 : sa table MAC (table CAM) associe ports et adresses MAC."],
        ["Il permet de découper un même équipement en plusieurs réseaux logiques isolés (VLAN), sans adresse IP pour commuter.", "Switch", "les VLAN se configurent sur les switchs (couche 2)."],
        ["Il relie des réseaux IP différents et choisit le chemin grâce à une table de routage.", "Routeur", "couche 3 : il lit l'adresse IP de destination."],
        ["Il change les adresses MAC de la trame à chaque passage mais ne touche pas aux adresses IP du paquet (sauf NAT).", "Routeur", "il remet le paquet dans une nouvelle trame adressée au prochain saut."],
        ["Il peut filtrer les paquets selon leurs adresses IP et leurs ports, et servir ainsi de pare-feu.", "Routeur", "il voit les couches 2 et 3 (et les ports s'il filtre)."],
        ["Il fait le pont entre le réseau filaire et les appareils sans fil (802.11).", "Point d'accès Wi-Fi", "il relie la radio Wi-Fi au réseau Ethernet."],
        ["À la maison, il est à la fois modem, routeur, switch, point d'accès Wi-Fi, pare-feu et serveur DHCP.", "Box", "la box du FAI est un « couteau suisse » du réseau."],
        ["Ancêtre du switch, il provoque des collisions quand deux machines émettent en même temps.", "Hub", "il ne peut rien mettre en attente : les signaux se mélangent."]]);
      return { titre: "Quel équipement ?", texte: "<p>" + b[0] + "</p><p>De quel équipement s'agit-il ?</p>",
        champs: [{ id: "e", label: "Équipement", type: "choix", options: CHOIX_EQ, rep: b[1] }], solution: b[1],
        explication: "<p><b>" + b[1] + "</b> : " + b[2] + "</p><p>Hub = couche 1, switch = couche 2 (MAC), routeur = couche 3 (IP).</p>" };
    },
    couche: function () {
      var b = pick([["HTTP", 7, "Application"], ["DNS", 7, "Application"], ["DHCP", 7, "Application"], ["FTP", 7, "Application"], ["SSH", 7, "Application"], ["SMTP", 7, "Application"],
        ["TCP", 4, "Transport"], ["UDP", 4, "Transport"], ["IPv4", 3, "Internet"], ["IPv6", 3, "Internet"], ["ICMP (ping)", 3, "Internet"], ["Ethernet 802.3", 2, "Accès réseau"], ["Wi-Fi 802.11 (trames)", 2, "Accès réseau"]]);
      return { titre: "Ranger un protocole", texte: "<p>Dans quelle couche du modèle <b>OSI</b> (numéro de 1 à 7) et dans quelle couche du modèle <b>TCP/IP</b> range-t-on le protocole <b>" + b[0] + "</b> ?</p>",
        champs: [{ id: "n", label: "Couche OSI (1 à 7)", type: "nombre", rep: b[1] }, { id: "t", label: "Couche TCP/IP", type: "choix", options: CHOIX_TCPIP, rep: b[2] }],
        solution: "OSI " + b[1] + " · TCP/IP " + b[2],
        explication: "<p><b>" + b[0] + "</b> : couche OSI <b>" + b[1] + "</b>, couche TCP/IP <b>" + b[2] + "</b>.</p><p>Correspondance : Application = OSI 5-6-7, Transport = 4, Internet = 3, Accès réseau = 1-2.</p>" };
    },
    pdu: function () {
      var b = pick([["Transport (4)", "Segment", "Port"], ["Réseau (3)", "Paquet", "Adresse IP"], ["Liaison de données (2)", "Trame", "Adresse MAC"]]);
      return { titre: "Enveloppe et identifiant", texte: "<p>À l'émission, la couche <b>" + b[0] + "</b> ajoute son en-tête. Quel bloc de données obtient-on, et quel identifiant cette en-tête contient-elle (source et destination) ?</p>",
        champs: [{ id: "p", label: "Bloc de données", type: "choix", options: ["Message", "Segment", "Paquet", "Trame", "Bits"], rep: b[1] },
          { id: "i", label: "Identifiant", type: "choix", options: ["Port", "Adresse IP", "Adresse MAC", "Nom de domaine"], rep: b[2] }],
        solution: b[1] + " · " + b[2],
        explication: "<p>Message → <b>segment</b> (ports) → <b>paquet</b> (adresses IP) → <b>trame</b> (adresses MAC) → bits sur le support.</p>" };
    },
    voit: function () {
      var b = pick([["Hub", "Rien de tout ça"], ["Switch", "Adresse MAC"], ["Routeur", "Adresse IP"]]);
      return { titre: "Jusqu'où lit-il ?", texte: "<p>Une trame traverse un <b>" + b[0] + "</b>. Quelle est l'information de plus haut niveau qu'il doit lire pour faire son travail ?</p>",
        champs: [{ id: "v", label: "Il lit au plus…", type: "choix", options: ["Rien de tout ça", "Adresse MAC", "Adresse IP", "Port", "Données applicatives"], rep: b[1] }],
        solution: b[1],
        explication: "<p>Hub : aucune adresse (couche 1). Switch : adresse MAC (couche 2). Routeur : adresse IP (couche 3), et les ports seulement s'il fait pare-feu. Seul le système terminal décapsule jusqu'aux données.</p>" };
    },

    /* ===== 2. Encapsulation et trames ===== */
    troncon: function () {
      var lanA = r(1, 200), lanB = lanA + r(1, 50), a = ip4(192, 168, lanA, r(2, 200)), bb = ip4(192, 168, lanB, r(2, 200)),
        r1a = ip4(192, 168, lanA, 254), r2b = ip4(192, 168, lanB, 254), l = r(0, 250), r1b = ip4(10, 0, l, 1), r2a = ip4(10, 0, l, 2), M = macs(6);
      var noms = ["PC A", "R1 (côté LAN A)", "R1 (côté liaison)", "R2 (côté liaison)", "R2 (côté LAN B)", "Serveur B"];
      var topo = table(["Interface", "Adresse IP", "Adresse MAC"], [
        ["PC A", toIP(a) + "/24", M[0]], ["R1 côté LAN A", toIP(r1a) + "/24", M[1]], ["R1 côté liaison", toIP(r1b) + "/30", M[2]],
        ["R2 côté liaison", toIP(r2a) + "/30", M[3]], ["R2 côté LAN B", toIP(r2b) + "/24", M[4]], ["Serveur B", toIP(bb) + "/24", M[5]]]);
      var t = r(0, 2), src = [0, 2, 4][t], dst = [1, 3, 5][t], tr = ["PC A → R1", "R1 → R2", "R2 → Serveur B"][t];
      return { titre: "Une trame, un tronçon", texte: "<p>Le PC A envoie un paquet au serveur B en passant par R1 puis R2.</p>" + topo + "<p>Sur le tronçon <b>" + tr + "</b>, quelles sont les adresses de la trame et du paquet ?</p>",
        champs: [{ id: "ms", label: "MAC source de la trame", type: "choix", options: M, rep: M[src] }, { id: "md", label: "MAC destination de la trame", type: "choix", options: M, rep: M[dst] },
          { id: "is", label: "IP source du paquet", type: "ip", rep: a }, { id: "id", label: "IP destination du paquet", type: "ip", rep: bb }],
        solution: "MAC " + M[src] + " → " + M[dst] + " · IP " + toIP(a) + " → " + toIP(bb),
        explication: "<p>Sur ce tronçon, la trame va de <b>" + noms[src] + "</b> (" + M[src] + ") à <b>" + noms[dst] + "</b> (" + M[dst] + ") : les adresses MAC changent à chaque tronçon.</p><p>Le paquet, lui, garde toujours <b>" + toIP(a) + " → " + toIP(bb) + "</b> : les adresses IP ne changent jamais en route (sauf NAT).</p>" };
    },
    remise: function () {
      var c = pick([24, 24, 25, 26]), n3 = r(1, 250), base = ip4(192, 168, n3, 0), taille = Math.pow(2, 32 - c), sub = r(0, 256 / taille - 1) * taille,
        a = (base + sub + r(1, taille - 3)) >>> 0, gw = (base + sub + taille - 2) >>> 0, M = macs(3), meme = Math.random() < 0.5, d;
      if (meme) { do { d = (base + sub + r(1, taille - 3)) >>> 0; } while (d === a); }
      else d = ip4(pick([10, 172, 192]), r(16, 31), r(0, 255), r(1, 254));
      return { titre: "Remise directe ou indirecte ?", texte: "<p>Le PC <b>" + toIP(a) + "/" + c + "</b> (MAC " + M[0] + ") veut envoyer un paquet à <b>" + toIP(d) + "</b>.</p>" +
        table(["Machine", "Adresse IP", "Adresse MAC"], [["Passerelle par défaut", toIP(gw), M[1]], ["Destination", toIP(d), meme ? M[2] : "inconnue du PC (réseau distant)"]]) +
        "<p>S'agit-il d'une remise directe ? Vers quelle adresse MAC part la trame ?</p>",
        champs: [{ id: "r", label: "Remise directe ?", type: "ouinon", rep: meme }, { id: "m", label: "MAC de destination de la trame", type: "choix", options: [M[1], M[2], "FF:FF:FF:FF:FF:FF"], rep: meme ? M[2] : M[1] }],
        solution: meme ? "Remise directe, trame vers " + M[2] : "Remise indirecte, trame vers la passerelle " + M[1],
        explication: "<p>On compare les réseaux avec le masque /" + c + " : PC → <b>" + toIP(net(a, c)) + "</b>, destination → <b>" + toIP(net(d, c)) + "</b>.</p><p>" +
          (meme ? "Même réseau : <b>remise directe</b>, la trame est adressée à la MAC de la destination (" + M[2] + ")." : "Réseaux différents : <b>remise indirecte</b>, la trame est adressée à la MAC de la <b>passerelle</b> (" + M[1] + "), le paquet garde l'IP " + toIP(d) + ".") + "</p>" };
    },

    /* ===== 3. Lire une table de routage ===== */
    table: function (cas) {
      cas = cas || pick(["hote", "metrique", "large", "defaut", "aucune"]);
      var n2 = r(0, 250), n3 = r(1, 250), A = ip4(172, 16, n2, 0), B = ip4(192, 168, n3, 0), C = ip4(10, r(1, 200), 0, 0),
        g = melange([ip4(1, 1, 1, 2), ip4(2, 2, 2, 2), ip4(3, 3, 3, 3), ip4(4, 4, 4, 4), ip4(5, 5, 5, 5)]),
        hote = (B + r(2, 250)) >>> 0, defaut = cas === "defaut" || (cas !== "aucune" && Math.random() < 0.5);
      var lignes = [[B, 24, g[0], 1], [hote, 32, g[1], 1], [A, 24, g[2], 1], [A, 24, g[3], 3], [C, 16, g[0], 2]];
      if (defaut) lignes.push([0, 0, g[4], 1]);
      lignes = melange(lignes);
      var dest, rep, pourquoi;
      if (cas === "hote") { dest = hote; rep = toIP(g[1]); pourquoi = "Deux routes correspondent : " + toIP(B) + "/24 et " + toIP(hote) + "/32. On prend la plus précise (préfixe le plus long) : /32."; }
      else if (cas === "metrique") { dest = (A + r(1, 254)) >>> 0; rep = toIP(g[2]); pourquoi = "Deux routes vers exactement " + toIP(A) + "/24 : métriques 1 et 3. On prend la métrique la plus faible."; }
      else if (cas === "large") { do { dest = (B + r(1, 254)) >>> 0; } while (dest === hote); rep = toIP(g[0]); pourquoi = "Seule la route " + toIP(B) + "/24 correspond (la route /32 ne vise qu'une seule adresse, " + toIP(hote) + ")."; }
      else { dest = ip4(pick([8, 45, 91, 151, 203]), r(0, 255), r(0, 255), r(1, 254)); if (defaut) { rep = toIP(g[4]); pourquoi = "Aucune route précise ne correspond : on utilise la route par défaut 0.0.0.0/0."; } else { rep = "Paquet détruit"; pourquoi = "Aucune route ne correspond et il n'y a pas de route par défaut : le routeur détruit le paquet."; } }
      var opts = g.map(toIP).concat(["Paquet détruit"]);
      return { titre: "Où part le paquet ?", texte: "<p>Voici les routes déclarées sur le routeur R1 :</p>" +
        table(["Destination", "Masque", "Passerelle", "Métrique"], lignes.map(function (l) { return [toIP(l[0]), toIP(maskOf(l[1])), toIP(l[2]), l[3]]; })) +
        "<p>R1 reçoit un paquet à destination de <b>" + toIP(dest) + "</b>. Vers quelle passerelle l'envoie-t-il ?</p>",
        champs: [{ id: "g", label: "Passerelle choisie", type: "choix", options: opts, rep: rep }], solution: rep,
        explication: "<p>" + pourquoi + "</p><p>Ordre de décision : 1) préfixe le plus long ; 2) à destination identique, métrique la plus faible ; 3) route par défaut ; 4) sinon paquet détruit.</p>" };
    },

    /* ===== 4. Écrire une route ===== */
    route: function (cas) {
      cas = cas || pick(["reseau", "defaut", "hote", "reseau16"]);
      var l = r(0, 250), r1 = ip4(10, 0, l, 1), r2 = ip4(10, 0, l, 2), r2lan = cas === "reseau16" ? ip4(172, r(16, 31), 0, 0) : ip4(192, 168, r(1, 250), 0),
        pc = (r2lan + r(2, 200)) >>> 0, c = cas === "reseau16" ? 16 : 24, dest, msk, txt;
      var topo = table(["Interface", "Adresse"], [["R1 côté LAN", "192.168.0.254/24"], ["R1 côté liaison vers R2", toIP(r1) + "/30"],
        ["R2 côté liaison vers R1", toIP(r2) + "/30"], ["R2 côté LAN distant", toIP((r2lan + (c === 16 ? 65534 : 254)) >>> 0) + "/" + c]]);
      if (cas === "defaut") { dest = 0; msk = 0; txt = "Écris sur R1 la <b>route par défaut</b> : tout paquet sans route plus précise doit partir vers R2."; }
      else if (cas === "hote") { dest = pc; msk = 32; txt = "Écris sur R1 une route qui ne concerne que le serveur <b>" + toIP(pc) + "</b> (et lui seul), via R2."; }
      else { dest = r2lan; msk = c; txt = "Écris sur R1 la route vers le <b>réseau local de R2</b> (voir le tableau), via R2."; }
      return { titre: cas === "defaut" ? "Écrire la route par défaut" : cas === "hote" ? "Route vers un seul hôte" : "Route vers un réseau distant",
        texte: "<p>" + txt + "</p>" + topo + "<p>Donne la destination, le masque (décimal pointé) et la passerelle.</p>",
        champs: [{ id: "d", label: "Destination", type: "ip", rep: dest }, { id: "m", label: "Masque", type: "ip", rep: maskOf(msk) }, { id: "p", label: "Passerelle", type: "ip", rep: r2 }],
        solution: toIP(dest) + " " + toIP(maskOf(msk)) + " via " + toIP(r2),
        explication: "<p>Destination <b>" + toIP(dest) + "</b>, masque <b>" + toIP(maskOf(msk)) + "</b>" + (cas === "defaut" ? " (0.0.0.0/0 : toutes les adresses)" : cas === "hote" ? " (/32 : les 32 bits comptent, une seule adresse)" : " (adresse du réseau, partie hôte à 0)") + ".</p>" +
          "<p>La passerelle est l'adresse du <b>voisin directement joignable</b> : l'interface de R2 côté liaison, <b>" + toIP(r2) + "</b>, et non son adresse côté LAN distant.</p>" +
          "<p>Sur Cisco : <code>ip route " + toIP(dest) + " " + toIP(maskOf(msk)) + " " + toIP(r2) + "</code></p>" };
    },

    /* ===== 5. TCP et UDP ===== */
    drapeau: function () {
      var b = pick([["1er segment du 3-way handshake (client → serveur)", "SYN", 2], ["2e segment du 3-way handshake (serveur → client)", "SYN, ACK", 18], ["3e segment du 3-way handshake (client → serveur)", "ACK", 16],
        ["Segment qui transporte la requête HTTP du client", "PSH, ACK", 24], ["Segment qui ouvre la clôture de la connexion", "FIN, ACK", 17], ["Réponse d'un serveur quand aucun service n'écoute sur le port demandé", "RST, ACK", 20]]);
      return { titre: "Les drapeaux TCP", texte: "<p><b>" + b[0] + "</b> : quels drapeaux sont levés, et quelle est la valeur décimale du champ drapeaux ?</p>" +
        table(["Drapeau", "FIN", "SYN", "RST", "PSH", "ACK"], [["Poids", "1", "2", "4", "8", "16"]]),
        champs: [{ id: "f", label: "Drapeaux", type: "choix", options: ["SYN", "SYN, ACK", "ACK", "PSH, ACK", "FIN, ACK", "RST, ACK"], rep: b[1] }, { id: "v", label: "Valeur décimale", type: "nombre", rep: b[2] }],
        solution: b[1] + " = " + b[2],
        explication: "<p><b>" + b[1] + "</b> : on additionne les poids des drapeaux levés, soit <b>" + b[2] + "</b>.</p><p>Connexion : SYN (2) → SYN, ACK (18) → ACK (16). Échanges : PSH, ACK (24) et ACK. Clôture : FIN, ACK (17) → FIN, ACK → ACK.</p>" };
    },
    port: function () {
      var b = pick([["Web (HTTP)", 80, "TCP"], ["Web sécurisé (HTTPS)", 443, "TCP"], ["Résolution de noms (DNS)", 53, "UDP"], ["Administration à distance chiffrée (SSH)", 22, "TCP"],
        ["Envoi d'e-mails (SMTP)", 25, "TCP"], ["Transfert de fichiers simplifié (TFTP)", 69, "UDP"], ["Serveur DHCP", 67, "UDP"], ["Transfert de fichiers (FTP, commandes)", 21, "TCP"], ["Synchronisation de l'heure (NTP)", 123, "UDP"]]);
      return { titre: "Port et transport", texte: "<p>Service : <b>" + b[0] + "</b>. Sur quel port le serveur écoute-t-il, et avec quel protocole de transport (cas habituel) ?</p>",
        champs: [{ id: "p", label: "Port du serveur", type: "nombre", rep: b[1] }, { id: "t", label: "Transport", type: "choix", options: ["TCP", "UDP"], rep: b[2] }],
        solution: b[1] + "/" + b[2], explication: "<p><b>" + b[0] + "</b> : port <b>" + b[1] + "</b> en <b>" + b[2] + "</b>.</p><p>TCP quand tout doit arriver dans l'ordre ; UDP pour les échanges courts ou temps réel.</p>" };
    },
    transport: function () {
      var b = pick([["consulter une page web", "TCP", "la page doit arriver complète et dans l'ordre"], ["passer un appel vidéo en direct", "UDP", "une image en retard ne sert plus à rien : pas de retransmission"],
        ["télécharger un fichier de 2 Go", "TCP", "le moindre octet perdu corromprait le fichier"], ["résoudre un nom de domaine (DNS)", "UDP", "une question, une réponse : ouvrir une connexion coûterait plus cher"],
        ["jouer à un jeu en ligne nerveux", "UDP", "la position à jour compte plus qu'un ancien paquet perdu"], ["envoyer un e-mail", "TCP", "le message doit arriver intact"],
        ["obtenir une adresse IP au démarrage (DHCP)", "UDP", "le client n'a pas encore d'adresse : on diffuse des datagrammes"], ["se connecter à un serveur en SSH", "TCP", "chaque commande tapée doit arriver sans perte"]]);
      return { titre: "TCP ou UDP ?", texte: "<p>Quel protocole de transport convient le mieux pour <b>" + b[0] + "</b> ?</p>",
        champs: [{ id: "t", label: "Transport", type: "choix", options: ["TCP", "UDP"], rep: b[1] }], solution: b[1],
        explication: "<p><b>" + b[1] + "</b> : " + b[2] + ".</p><p>TCP : connexion, acquittements, retransmissions. UDP : rapide, léger, sans garantie.</p>" };
    },

    /* ===== 6. NAT et port mapping ===== */
    prive: function () {
      var b = pick([[ip4(10, r(0, 255), r(0, 255), r(1, 254)), true], [ip4(172, r(16, 31), r(0, 255), r(1, 254)), true], [ip4(192, 168, r(0, 255), r(1, 254)), true],
        [ip4(172, pick([15, 32, 33, 64]), r(0, 255), r(1, 254)), false], [ip4(192, pick([167, 169]), r(0, 255), r(1, 254)), false], [ip4(pick([8, 80, 193, 212]), r(0, 255), r(0, 255), r(1, 254)), false]]);
      return { titre: "Privée ou publique ?", texte: "<p>L'adresse <b>" + toIP(b[0]) + "</b> est-elle une adresse <b>privée</b> ?</p>",
        champs: [{ id: "p", label: "Adresse privée ?", type: "ouinon", rep: b[1] }], solution: b[1] ? "Oui, privée" : "Non, publique",
        explication: "<p>Plages privées : <b>10.0.0.0/8</b>, <b>172.16.0.0/12</b> (172.16 à 172.31), <b>192.168.0.0/16</b>.</p><p>" + toIP(b[0]) + " est " + (b[1] ? "dans une de ces plages : <b>privée</b>, non routée sur Internet." : "hors de ces plages : <b>publique</b>.") + "</p>" };
    },
    mapping: function () {
      var pub = ip4(pick([193, 82, 90, 109]), r(0, 255), r(0, 255), r(1, 254)), srv = ip4(192, 168, r(0, 50), r(2, 250)),
        s = pick([["web", 80, 80], ["web", 80, 8080], ["SSH", 22, 2222], ["web sécurisé", 443, 443]]);
      return { titre: "Écrire la redirection de port", texte: "<p>Le serveur " + s[0] + " de l'entreprise a l'adresse privée <b>" + toIP(srv) + "</b> et écoute sur le port <b>" + s[1] + "</b>. Le routeur a l'adresse publique <b>" + toIP(pub) + "</b>. Les internautes doivent le joindre sur le port public <b>" + s[2] + "</b>.</p>" +
        "<p>Complète la commande Cisco :</p><pre><code>ip nat inside source static tcp [IP privée] [port privé] [IP publique] [port public]</code></pre>",
        champs: [{ id: "a", label: "IP privée", type: "ip", rep: srv }, { id: "b", label: "Port privé", type: "nombre", rep: s[1] }, { id: "c", label: "IP publique", type: "ip", rep: pub }, { id: "d", label: "Port public", type: "nombre", rep: s[2] }],
        solution: "ip nat inside source static tcp " + toIP(srv) + " " + s[1] + " " + toIP(pub) + " " + s[2],
        explication: "<p><code>ip nat inside source static tcp " + toIP(srv) + " " + s[1] + " " + toIP(pub) + " " + s[2] + "</code></p><p>D'abord le côté <b>intérieur</b> (adresse privée et port réel du serveur), puis le côté <b>extérieur</b> (adresse publique et port vu par les internautes).</p>" };
    },
    traduit: function () {
      var pub = ip4(pick([193, 82, 90]), r(0, 255), r(0, 255), r(1, 254)), srv = ip4(192, 168, r(0, 50), r(2, 250)), s = pick([[80, 80], [80, 8080], [22, 2222]]),
        inter = ip4(pick([88, 78, 91]), r(0, 255), r(0, 255), r(1, 254));
      return { titre: "Le paquet traduit", texte: "<p>Règle sur le routeur : <code>ip nat inside source static tcp " + toIP(srv) + " " + s[0] + " " + toIP(pub) + " " + s[1] + "</code></p>" +
        "<p>Un internaute (" + toIP(inter) + ") envoie un segment vers <b>" + toIP(pub) + ":" + s[1] + "</b>. Après traduction par le routeur, quelles sont l'adresse IP et le port de destination ? L'adresse IP source change-t-elle ?</p>",
        champs: [{ id: "i", label: "IP de destination après traduction", type: "ip", rep: srv }, { id: "p", label: "Port de destination après traduction", type: "nombre", rep: s[0] }, { id: "s", label: "L'IP source change ?", type: "ouinon", rep: false }],
        solution: toIP(srv) + ":" + s[0] + ", IP source inchangée",
        explication: "<p>La redirection remplace la <b>destination</b> publique " + toIP(pub) + ":" + s[1] + " par l'adresse réelle du serveur <b>" + toIP(srv) + ":" + s[0] + "</b>. L'adresse source (" + toIP(inter) + ") ne change pas : le serveur saura à qui répondre, et le routeur fera la traduction inverse au retour.</p>" };
    },
    dns: function () {
      var pub = ip4(pick([193, 82, 90]), r(0, 255), r(0, 255), r(1, 254)), srv = ip4(192, 168, r(0, 50), r(2, 250)), nom = pick(["www.lamartinandduch.com", "www.agence-brest.fr", "intranet.sio-club.fr"]);
      return { titre: "Le bon enregistrement DNS", texte: "<p>Le site <b>" + nom + "</b> est hébergé sur le serveur interne " + toIP(srv) + ". Le routeur de l'entreprise (adresse publique " + toIP(pub) + ") a une redirection du port 80 vers ce serveur.</p><p>Quelle adresse IP faut-il inscrire pour ce nom sur le serveur DNS public ?</p>",
        champs: [{ id: "i", label: "Adresse IP de l'enregistrement", type: "ip", rep: pub }], solution: toIP(pub),
        explication: "<p>Les internautes doivent recevoir l'adresse <b>publique</b> du routeur, <b>" + toIP(pub) + "</b> : c'est lui qui redirige ensuite vers " + toIP(srv) + ". Une adresse privée serait inutilisable depuis Internet.</p>" };
    }
  };
  var LECONS = [
    { titre: "Équipements et couches", gens: ["equip", "couche", "pdu", "voit", "equip"] },
    { titre: "Encapsulation", gens: ["troncon", "troncon", "remise", "remise", "troncon"] },
    { titre: "Lire une table de routage", gens: ["table:large", "table:metrique", "table:hote", "table:defaut", "table:aucune"] },
    { titre: "Écrire une route", gens: ["route:reseau", "route:reseau16", "route:defaut", "route:hote", "route"] },
    { titre: "TCP et UDP", gens: ["drapeau", "drapeau", "port", "port", "transport"] },
    { titre: "NAT et port mapping", gens: ["prive", "prive", "mapping", "traduit", "dns"] }
  ];
  function gen(nom) { var p = nom.split(":"); return G[p[0]](p[1]); }
  var ALL = [];
  LECONS.forEach(function (l, li) { l.gens.forEach(function (g, mi) { ALL.push({ id: "L" + (li + 1) + "-" + (mi + 1), li: li, mi: mi, gen: g }); }); });

  /* ---------- progression ---------- */
  function lit() { try { var o = JSON.parse(localStorage.getItem(CLE)) || {}; o.done = o.done || {}; return o; } catch (e) { return { done: {} }; } }
  var prog = lit();
  function sauver() { try { localStorage.setItem(CLE, JSON.stringify(prog)); } catch (e) { /* rien */ } }

  /* ---------- squelette ---------- */
  document.body.appendChild(EF.header("../../"));
  var main = el("main", "wrap page labo labo-ipv4 labo-reseau c-navy");
  document.body.appendChild(main);
  main.innerHTML =
    '<nav class="crumbs"><a href="../../index.html">Accueil</a><span>›</span><a href="index.html">Réseau</a><span>›</span><span>Labo réseau</span></nav>' +
    '<div class="page-head c-navy"><div class="ico">⇄</div><div><h1>Labo réseau</h1>' +
    '<div class="sub">Équipements, encapsulation, tables de routage, routes statiques, TCP/UDP et NAT : des situations toujours nouvelles, corrigées pas à pas.</div></div></div>' +
    '<div class="labo-mode chips" role="tablist">' +
    '<a class="chip" data-mode="guide" href="#">' + I("book-open") + ' Parcours guidé</a>' +
    '<a class="chip" data-mode="libre" href="#libre">' + I("pencil-line") + ' Testeur de routes</a>' +
    '<a class="chip" href="../../evaluation.html#m=reseau&amp;t=pratique">' + I("timer") + ' Épreuve chronométrée</a>' +
    '<span class="labo-score" id="li-score"></span></div>' +
    '<div class="labo-lecons" id="li-lecons"></div>' +
    '<div class="labo-grid" id="li-grid"><section class="labo-brief" id="li-brief" aria-live="polite"></section>' +
    '<section class="labo-work ip-work" id="li-work"></section></div>';

  function score() {
    var n = ALL.filter(function (m) { return prog.done[m.id]; }).length;
    $("li-score").innerHTML = I("trophy") + " " + n + " / " + ALL.length + " missions";
  }

  /* ---------- formulaire de réponse ---------- */
  function formulaire(q, prefixe) {
    return '<form class="ip-form" id="' + prefixe + '-form" autocomplete="off"><div class="ip-champs">' + q.champs.map(function (c) {
      if (c.type === "choix") return '<div class="field ip-large"><span>' + esc(c.label) + '</span><div class="chips ip-on ip-choix" data-champ="' + c.id + '">' +
        c.options.map(function (o, k) { return '<button type="button" class="chip" data-v="' + k + '" aria-pressed="false">' + esc(o) + '</button>'; }).join("") + '</div></div>';
      if (c.type === "ouinon") return '<div class="field"><span>' + esc(c.label) + '</span><div class="chips ip-on" data-champ="' + c.id + '">' +
        '<button type="button" class="chip" data-v="1" aria-pressed="false">Oui</button><button type="button" class="chip" data-v="0" aria-pressed="false">Non</button></div></div>';
      return '<label class="field">' + esc(c.label) + '<input name="' + c.id + '" type="text" inputmode="' + (c.type === "ip" ? "decimal" : "numeric") + '" spellcheck="false" autocapitalize="off" placeholder="' +
        (c.type === "ip" ? "ex. 192.168.1.0" : c.type === "cidr" ? "ex. /24" : "ex. 254") + '"></label>';
    }).join("") + '</div><div class="ip-verdicts" id="' + prefixe + '-res"></div></form>';
  }
  function brancherOuiNon(box) {
    [].forEach.call(box.querySelectorAll(".ip-on"), function (g) {
      g.onclick = function (e) { var b = e.target.closest(".chip"); if (!b) return; [].forEach.call(g.children, function (x) { x.setAttribute("aria-pressed", String(x === b)); }); };
    });
  }
  function valeur(form, c) {
    if (c.type === "choix") { var bc = form.querySelector('.ip-on[data-champ="' + c.id + '"] [aria-pressed="true"]'); return bc ? c.options[+bc.dataset.v] : null; }
    if (c.type === "ouinon") { var b = form.querySelector('.ip-on[data-champ="' + c.id + '"] [aria-pressed="true"]'); return b ? b.dataset.v === "1" : null; }
    var v = form.querySelector('[name="' + c.id + '"]').value;
    return c.type === "ip" ? parseIP(v) : c.type === "cidr" ? cidr(v) : entier(v);
  }
  function corriger(form, q) {
    return q.champs.map(function (c) { var v = valeur(form, c); return { c: c, v: v, ok: v !== null && v === c.rep }; });
  }
  function aff(c, v) { return c.type === "choix" ? String(v) : c.type === "ip" ? toIP(v) : c.type === "cidr" ? "/" + v : c.type === "ouinon" ? (v ? "Oui" : "Non") : String(v); }

  /* ---------- parcours guidé ---------- */
  var mode = "guide", cur = null, Q = null, essais = 0;
  function renderLecons() {
    var box = $("li-lecons");
    if (mode !== "guide") { box.hidden = true; return; }
    box.hidden = false;
    box.innerHTML = LECONS.map(function (l, li) {
      var ms = ALL.filter(function (m) { return m.li === li; }), d = ms.filter(function (m) { return prog.done[m.id]; }).length;
      return '<div class="labo-lecon' + (cur && cur.li === li ? " on" : "") + (d === ms.length ? " fini" : "") + '"><div class="ll-t"><span class="ll-n">' + (li + 1) + '</span>' + esc(l.titre) + '<span class="ll-c">' + d + '/' + ms.length + '</span></div>' +
        '<div class="ll-dots">' + ms.map(function (m) { return '<a href="#m=' + m.id + '" class="' + (prog.done[m.id] ? "ok" : "") + (cur === m ? " cur" : "") + '">' + (m.mi + 1) + '</a>'; }).join("") + '</div></div>';
    }).join("");
  }
  function ouvrir(m) {
    cur = m; Q = gen(m.gen); essais = 0;
    var idx = ALL.indexOf(m), prev = ALL[idx - 1], next = ALL[idx + 1];
    $("li-brief").innerHTML = '<div class="lb-kicker">Leçon ' + (m.li + 1) + ' · ' + esc(LECONS[m.li].titre) + ' — mission ' + (m.mi + 1) + '/' + LECONS[m.li].gens.length + '</div>' +
      '<h2>' + esc(Q.titre) + '</h2><div class="lb-texte">' + Q.texte + '</div>' +
      (prog.done[m.id] ? '<p class="lb-small">Mission déjà validée. Les valeurs changent à chaque fois : refais-la pour t\'entraîner.</p>' : '') +
      '<div class="lb-actions"><button type="button" class="btn" id="li-autre">' + I("rotate-ccw") + ' Autres valeurs</button>' +
      '<button type="button" class="btn" id="li-aide">' + I("lightbulb") + ' Voir la méthode</button></div>' +
      '<div class="lb-nav">' + (prev ? '<a href="#m=' + prev.id + '">← Mission précédente</a>' : '<span></span>') + (next ? '<a href="#m=' + next.id + '">Mission suivante →</a>' : '<span></span>') + '</div>';
    $("li-work").innerHTML = '<div class="ip-carte">' + formulaire(Q, "li") + '<div class="lb-actions"><button type="submit" form="li-form" class="btn primary">' + I("check") + ' Vérifier</button></div><div id="li-corr"></div></div>';
    brancherOuiNon($("li-work"));
    $("li-form").onsubmit = function (e) { e.preventDefault(); verifier(); };
    $("li-autre").onclick = function () { ouvrir(m); };
    $("li-aide").onclick = function () { corrige(false); };
    var f = $("li-work").querySelector("input"); if (f && !matchMedia("(pointer:coarse)").matches) f.focus();
    renderLecons(); score();
  }
  function corrige(gagne) {
    $("li-corr").innerHTML = '<div class="box ' + (gagne ? "retenir" : "attention") + ' lb-win"><b>' + (gagne ? "Bravo, c'est juste !" : "La méthode") + '</b>' + Q.explication +
      (gagne ? "" : '<p><b>Réponse :</b> ' + esc(Q.solution) + '</p>') +
      '<div class="lb-actions">' + (gagne && ALL[ALL.indexOf(cur) + 1] ? '<a class="btn primary" href="#m=' + ALL[ALL.indexOf(cur) + 1].id + '">Mission suivante →</a>' : '') +
      '<button type="button" class="btn" id="li-encore">' + I("rotate-ccw") + ' Nouvelles valeurs</button></div></div>';
    $("li-encore").onclick = function () { ouvrir(cur); };
  }
  function verifier() {
    if (window.EtudeFacile.activite) window.EtudeFacile.activite();
    var res = corriger($("li-form"), Q), tout = res.every(function (x) { return x.ok; });
    essais++;
    $("li-res").innerHTML = res.map(function (x) {
      return '<div class="ip-v ' + (x.ok ? "ok" : "ko") + '"><span class="ck">' + (x.ok ? "✓" : "✗") + '</span>' + esc(x.c.label) + ' : ' + (x.v === null ? "réponse manquante ou mal écrite" : x.ok ? aff(x.c, x.v) : aff(x.c, x.v) + " n'est pas correct") + '</div>';
    }).join("");
    if (tout) {
      if (!prog.done[cur.id]) { prog.done[cur.id] = 1; sauver(); }
      corrige(true); renderLecons(); score();
    } else if (essais >= 2) {
      $("li-corr").innerHTML = '<p class="lb-small">Bloqué ? Clique sur <b>Voir la méthode</b> pour la correction détaillée.</p>';
    }
  }

  /* ---------- testeur de table de routage (bac à sable) ---------- */
  function libre() {
    $("li-brief").innerHTML = '<div class="lb-kicker">Testeur de routes</div><h2>Ta propre table de routage</h2><div class="lb-texte">' +
      '<p>Écris une route par ligne : <code>destination/préfixe passerelle [métrique]</code>, puis une adresse de destination. Le testeur montre les routes qui correspondent et celle que choisit le routeur.</p>' +
      '<p>Route par défaut : <code>0.0.0.0/0</code>. Route vers un hôte : <code>/32</code>.</p></div>' +
      '<div class="box"><b>Ordre de décision</b><p>1) préfixe le plus long ; 2) à destination identique, métrique la plus faible ; 3) route par défaut ; 4) sinon le paquet est détruit.</p></div>';
    $("li-work").innerHTML = '<div class="ip-carte"><label class="field">Table de routage<textarea id="lt-t" rows="6" spellcheck="false" style="font-family:var(--mono);font-size:16px">192.168.1.0/24 2.2.2.2 1\n192.168.1.0/24 3.3.3.3 2\n192.168.1.10/32 3.3.3.3\n0.0.0.0/0 4.4.4.4</textarea></label>' +
      '<label class="field">Destination du paquet<input id="lt-d" value="192.168.1.10" spellcheck="false" inputmode="decimal"></label><div class="err" id="lt-err"></div><div id="lt-out"></div></div>';
    $("lt-t").oninput = tester; $("lt-d").oninput = tester; tester();
  }
  function tester() {
    var lignes = $("lt-t").value.split("\n"), routes = [], err = [];
    lignes.forEach(function (l, k) {
      if (!l.trim()) return;
      var m = /^\s*(\d+\.\d+\.\d+\.\d+)\s*\/\s*(\d{1,2})\s+(\d+\.\d+\.\d+\.\d+)(?:\s+(\d+))?\s*$/.exec(l);
      var d = m && parseIP(m[1]), c = m && cidr(m[2]), g = m && parseIP(m[3]);
      if (!m || d === null || c === null || g === null) { err.push("ligne " + (k + 1) + " : format attendu « 192.168.1.0/24 2.2.2.2 1 »"); return; }
      routes.push({ d: net(d, c), c: c, g: g, met: m[4] ? +m[4] : 1, brut: toIP(net(d, c)) + "/" + c });
    });
    var dest = parseIP($("lt-d").value);
    $("lt-err").textContent = err.join(" · ") + (dest === null ? (err.length ? " · " : "") + "destination invalide" : "");
    if (dest === null) { $("lt-out").innerHTML = ""; return; }
    var ok = routes.filter(function (x) { return net(dest, x.c) === x.d; });
    var best = ok.slice().sort(function (a, b) { return b.c - a.c || a.met - b.met; })[0];
    $("lt-out").innerHTML = '<h3 class="ip-h3">Routes qui correspondent à ' + toIP(dest) + '</h3>' +
      (ok.length ? table(["Route", "Passerelle", "Métrique", ""], ok.map(function (x) { return [x.brut, toIP(x.g), x.met, x === best ? "<b>✓ choisie</b>" : x.c < best.c ? "moins précise" : "métrique plus forte"]; })) : "<p>Aucune.</p>") +
      '<div class="box ' + (best ? "retenir" : "attention") + '"><b>Décision</b><p>' + (best ? "Le paquet part vers <b>" + toIP(best.g) + "</b> (route " + best.brut + (best.c === 0 ? ", route par défaut" : "") + ")." : "Aucune route : le paquet est <b>détruit</b>.") + "</p></div>";
  }
  /* ---------- épreuve chronométrée ---------- */
  var E = null;
  function examen() {
    mode = "examen"; main.classList.add("en-examen");
    $("li-lecons").hidden = true; main.querySelector(".labo-mode").hidden = true;
    var gens = melange(["equip", "couche", "pdu", "troncon", "remise", "table", "table", "route", "route", "drapeau", "port", "transport", "prive", "mapping", "traduit", "dns"]).slice(0, NB_EX);
    E = { list: gens.map(gen), i: 0, rep: [], fini: false };
    E.chrono = EF.examChrono("Labo réseau", DUREE_EX, function () { finExamen(); });
    $("li-grid").insertAdjacentElement("beforebegin", E.chrono.el);
    examOuvrir(0);
  }
  function examOuvrir(i) {
    E.i = i; var q = E.list[i], der = i + 1 >= E.list.length;
    E.chrono.pos("question " + (i + 1) + "/" + E.list.length);
    $("li-brief").innerHTML = '<div class="lb-kicker">Question ' + (i + 1) + ' sur ' + E.list.length + '</div><h2>' + esc(q.titre) + '</h2><div class="lb-texte">' + q.texte + '</div>' +
      '<p class="lb-small" style="margin-top:10px">Pas de correction pendant l\'épreuve. Tu peux revenir sur une question tant que le temps n\'est pas écoulé.</p>' +
      '<div class="ll-dots">' + E.list.map(function (x, j) { return '<a href="#" data-j="' + j + '" class="' + (E.rep[j] ? "ok" : "") + (j === i ? " cur" : "") + '">' + (j + 1) + '</a>'; }).join("") + '</div>';
    $("li-work").innerHTML = '<div class="ip-carte">' + formulaire(q, "ex") + '<div class="lb-actions"><button type="submit" form="ex-form" class="btn' + (der ? '' : ' primary') + '">' + (der ? "Enregistrer" : "Valider et continuer →") + '</button>' +
      '<button type="button" class="btn' + (der ? ' primary' : '') + '" id="ex-fin">Terminer l\'épreuve</button></div></div>';
    brancherOuiNon($("li-work"));
    var form = $("ex-form");
    if (E.rep[i]) E.rep[i].forEach(function (x) {
      if (x.c.type === "choix") { if (x.v !== null) form.querySelector('.ip-on[data-champ="' + x.c.id + '"] [data-v="' + x.c.options.indexOf(x.v) + '"]').setAttribute("aria-pressed", "true"); }
      else if (x.c.type === "ouinon") { if (x.v !== null) form.querySelector('.ip-on[data-champ="' + x.c.id + '"] [data-v="' + (x.v ? 1 : 0) + '"]').setAttribute("aria-pressed", "true"); }
      else form.querySelector('[name="' + x.c.id + '"]').value = x.brut || "";
    });
    form.onsubmit = function (e) {
      e.preventDefault(); garder();
      if (i + 1 < E.list.length) examOuvrir(i + 1); else examOuvrir(i);
    };
    $("ex-fin").onclick = function () {
      garder();
      var faits = E.rep.filter(Boolean).length;
      if (faits < E.list.length && !window.confirm("Terminer maintenant ? Les questions sans réponse compteront comme faux.")) return;
      finExamen();
    };
    [].forEach.call($("li-brief").querySelectorAll("[data-j]"), function (a) { a.onclick = function (e) { e.preventDefault(); garder(); examOuvrir(+a.dataset.j); }; });
  }
  function garder() {
    var form = $("ex-form"); if (!form) return;
    var q = E.list[E.i], res = corriger(form, q);
    res.forEach(function (x) { if (x.c.type !== "ouinon" && x.c.type !== "choix") x.brut = form.querySelector('[name="' + x.c.id + '"]').value; });
    if (res.some(function (x) { return x.v !== null; })) E.rep[E.i] = res;
  }
  function finExamen() {
    if (E.fini) return; E.fini = true;
    var rest = E.chrono.restant(); E.chrono.stop(); E.chrono.el.remove();
    var box = $("li-grid"); box.className = "labo-resultat";
    EF.examResultat(box, {
      mid: MID, titre: "Labo réseau", couleur: "navy", racine: "../../", duree: DUREE_EX, coef: COEF_EX, restant: rest,
      retour: "labo-reseau.html",
      missions: E.list.map(function (q, i) {
        var rep = E.rep[i], ok = !!rep && rep.every(function (x) { return x.ok; });
        return { titre: q.titre + " — " + q.texte.replace(/<br>/g, " ").replace(/<[^>]+>/g, "").slice(0, 110), ok: ok, solution: q.solution };
      }),
      rejouer: function () { location.hash = "#examen"; location.reload(); }
    });
  }

  /* ---------- routage ---------- */
  function route() {
    if (/^#examen/.test(location.hash)) { if (!E) examen(); return; }
    if (E) { location.reload(); return; }
    var m = /#m=(L\d+-\d+)/.exec(location.hash);
    mode = location.hash === "#libre" ? "libre" : "guide";
    [].forEach.call(main.querySelectorAll(".labo-mode [data-mode]"), function (c) { c.setAttribute("aria-pressed", String(c.dataset.mode === mode)); });
    if (mode === "libre") { cur = null; renderLecons(); score(); libre(); return; }
    var cible = m && ALL.filter(function (x) { return x.id === m[1]; })[0];
    ouvrir(cible || ALL.filter(function (x) { return !prog.done[x.id]; })[0] || ALL[0]);
  }
  window.addEventListener("hashchange", route);
  route();
})();
