# Overlay URC — écran de lancement League of Legends (OBS)

Écran d'attente façon « Vice City », découpé en calques indépendants pour OBS.
Toutes les pages font 1920 × 1080 ; seules `fond.html` et les PNG sont opaques ou positionnés, le reste est transparent.

En ligne : `https://sitecoursio.vercel.app/overlay-lol/`

## Calques

| Calque | Fichier | Source OBS |
|---|---|---|
| Fond animé (couleurs modifiables) | `fond.html` | Source navigateur |
| Cartes champions (rotation auto) | `champions.html` | Source navigateur |
| Timer (compte à rebours) | `timer.html` | Source navigateur |
| Sponsors (rotation des logos) | `sponsors.html` | Source navigateur |
| Logo B blanc | `assets/calques/calque-logo-B.png` | Source image |
| Sponsors fixes (sans animation) | `assets/calques/calque-sponsors-statique.png` | Source image |

Ordre conseillé dans la scène, de bas en haut : fond → champions → timer → sponsors → logo B.

## Mise en place dans OBS

1. **Source navigateur** pour chaque page HTML : largeur `1920`, hauteur `1080`, laisser le CSS personnalisé vide.
2. **Source image** pour les PNG (ils font déjà 1920 × 1080, à placer en 0,0).
3. **Config dans OBS** : Docks → Docks de navigateur personnalisés → URL de `config.html`.
4. **Pilotage en direct** : OBS → Outils → Paramètres du serveur WebSocket → Activer. Dans `config.html`, saisir le port (4455) et le mot de passe puis « Se connecter ». Si le navigateur demande l'accès au réseau local, l'accepter.

## Comment la synchro fonctionne

`config.html` envoie l'état complet à chaque modification :

- par **obs-websocket** (`CallVendorRequest` → `obs-browser` / `emit_event`, événement `urc-overlay`) vers toutes les sources navigateur d'OBS, puis toutes les 5 s tant que la connexion est ouverte ;
- par **BroadcastChannel** et **localStorage** vers les pages ouvertes dans le même navigateur (aperçu, onglets).

Chaque calque garde le dernier état reçu (localStorage) et le relit au rechargement.

## Paramètres d'URL (optionnels, prioritaires au chargement)

Forme générale : `section.cle=valeur`, par ex. `champions.html?champions.interval=8`.

| Page | Raccourcis |
|---|---|
| `champions.html` | `champ=Ahri,Jinx` (forcer), `liste=…`, `pause=1`, `vitesse=10` (s), `cartes=1..3`, `echelle=0.8` |
| `sponsors.html` | `intervalle=6`, `parslide=2`, `pause=1`, `transition=glisse\|fondu\|flip` |
| `timer.html` | `duree=10:00`, `start=1`, `titre=…`, `fin=…` |
| `fond.html` | `preset=vice\|sunset\|miami\|neon\|lagon`, `c1..c4`, `glow`, `accent` (hex sans #), `particules=40`, `vitesse=1` |

`?cfg=…` contient un état encodé (bouton « Avec réglages » de la config). `?live=0` coupe la synchro.

## Champions

Illustrations officielles Riot chargées à la volée : splash centré via CommunityDragon, repli sur Data Dragon.
N'importe quel champion fonctionne (`Garen`, `Wukong`, `Kai'Sa`…), avec un skin précis via `Nom:numéro` (`Ahri:1`).
Les 10 champions par défaut sont définis dans `js/champions-data.js`.

## Fichiers

- `js/core.js` — config par défaut, URL, sauvegarde, synchro (commun à tous les calques)
- `js/obs-ws.js` — client obs-websocket v5 (config uniquement)
- `js/fond.js`, `js/champions.js`, `js/sponsors.js` — logique des calques
- `fonts/` — Anton et Montserrat (licence OFL), hébergées ici
- `assets/logos/` — logos sources ; `assets/calques/` — PNG plein écran

Les pages de ce dossier chargent les illustrations de champions depuis les serveurs de Riot (Data Dragon) et de CommunityDragon. League of Legends et ses illustrations appartiennent à Riot Games.
