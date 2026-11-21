# Overlay URC — écran de lancement League of Legends (OBS)

Écran d'attente façon « Vice City », découpé en calques indépendants pour OBS.
Toutes les pages font 1920 × 1080 ; seules `fond.html` et les PNG sont opaques ou positionnés, le reste est transparent.

En ligne : `https://sitecoursio.vercel.app/overlay-lol/`

## Calques

| Calque | Fichier | Source OBS |
|---|---|---|
| Fond animé (couleurs et décor modifiables) | `fond.html` | Source navigateur |
| Cartes champions (rotation auto) | `champions.html` | Source navigateur |
| Timer (compte à rebours) | `timer.html` | Source navigateur |
| Sponsors (rotation des logos) | `sponsors.html` | Source navigateur |
| Logo B (transparent, couleur réglable) | `logo.html` | Source navigateur |
| Logo B blanc en PNG | `assets/calques/calque-logo-B.png` | Source image (fichier téléchargé) |
| Sponsors fixes (sans animation) | `assets/calques/calque-sponsors-statique.png` | Source image (fichier téléchargé) |

Ordre conseillé dans la scène, de bas en haut : fond → champions → timer → sponsors → logo.

> Une **source image** d'OBS n'accepte qu'un fichier sur le PC : télécharge les PNG d'abord. Coller l'URL d'un PNG dans une source navigateur l'affiche sur une page gris clair ; pour le logo, utilise `logo.html`.

## Mise en place dans OBS

1. **Source navigateur** pour chaque page HTML : largeur `1920`, hauteur `1080`, laisser le CSS personnalisé vide.
2. **Source image** pour les PNG, après les avoir téléchargés (ils font déjà 1920 × 1080, à placer en 0,0).
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
| `fond.html` | `preset=vice\|sunset\|miami\|neon\|lagon`, `decor=palmier\|tour\|nexus\|image` (les 3 emplacements) ou `fond.decor1..3`, `fond.img1..3=<url>`, `c1..c4`, `glow`, `accent` (hex sans #), `particules=40`, `vitesse=1` |
| `logo.html` | `couleur=d0221b`, `taille=120`, `logo.box=1`, `logo.glow=1`, `logo.position=bas-droite` |

`?cfg=…` contient un état encodé (bouton « Avec réglages » de la config). `?live=0` coupe la synchro.

## Décor du fond

Trois emplacements (gauche, arrière-plan, droite), chacun au choix : palmier, tour, nexus, image perso ou rien.
Tours et nexus sont des silhouettes originales dans le même style que les palmiers, avec un cristal lumineux animé aux couleurs du fond (halo et néon).

**Image perso** : un PNG à fond transparent par emplacement (URL, ou fichier importé depuis la config, 700 Ko max), par exemple les visuels officiels de tour et de nexus du tournoi. « En silhouette » le teinte comme le reste du décor ; décoché, il garde ses couleurs. Taille réglable.
Pour une image lourde, mieux vaut la placer dans `assets/` du dépôt et coller son URL : une image importée voyage dans chaque envoi de la config.

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
