# Étude Facile — Site de cours BTS SIO

Site de révision pour le BTS SIO (1re année, option SLAM). Chaque matière est un module, chaque chapitre une page avec une partie **Cours** et une partie **S'entraîner** (exercices interactifs : QCM, vrai/faux, saisie, association, terminal simulé). Une progression avec XP et séries est enregistrée dans le navigateur.

**Site en ligne :** https://sitecoursio.vercel.app

## Matières

| Module | Contenu |
|---|---|
| Algorithmique / Python | Types et opérations, plus 6 chapitres bonus (variables, affichage, conditions, boucles, listes et chaînes, fonctions) |
| SLAM | HTML, CSS, formulaires, HTTP et URL |
| SISR | Présentation des blocs, shell Linux, droits, archives et processus, adressage IPv4 et services réseau, WordPress / Nginx |
| Bloc 1 | HTML (structure et sémantique ; tableaux, médias, accessibilité), CSS (sélecteurs et cascade ; Flexbox, Grid, responsive), PHP (variables, conditions, formulaires), SQL (SELECT ; jointures et regroupements ; LDD/LMD) |
| Bloc 3 | RGPD, PIA, anonymisation |
| Mathématiques | Numération, divisibilité et PGCD, congruences, suites, statistiques |
| CEJM | Agents économiques, marché, offre et demande |
| Culture générale | Les terminaisons verbales (cours + exercices) |
| Anglais | À venir |

## Labos interactifs

| Labo | Module | Contenu |
|---|---|---|
| Terminal Linux | SISR | 40 missions guidées sur un système de fichiers virtuel (ls, cd, grep, chmod, pipes, sudo, tar…) + bac à sable |
| HTML / CSS | SLAM | 19 missions avec aperçu en direct, objectifs vérifiés sur le rendu (DOM, styles calculés) |
| PHP | Bloc 1 | 18 missions avec du vrai PHP 8.4 (php-wasm) ; formulaires GET/POST simulés et tests automatiques |
| Python | Algo Python | 21 missions avec du vrai Python 3 (Pyodide, dans un Web Worker) ; saisies `input()` et tests automatiques |
| HTML | Bloc 1 | 12 missions sur la structure HTML5, les titres, les articles, les figures, les tableaux, les médias et un formulaire accessible |
| CSS | Bloc 1 | 13 missions vérifiées sur le rendu : sélecteurs et spécificité, modèle de boîte, Flexbox, grille, media query, sticky |
| SQL | Bloc 1 | 26 missions sur une vraie base SQLite (sql.js) : SELECT, WHERE, agrégats, GROUP BY/HAVING, jointures, INSERT/UPDATE/DELETE, CREATE/ALTER TABLE ; requêtes vérifiées sur leur résultat |
| Sous-réseaux | SISR | 24 missions de calcul IPv4 générées au hasard (masque, réseau, broadcast, plage, même réseau, découpage, VLSM), correction pas à pas + calculateur (`assets/labo-ipv4.js`) |
| La bonne terminaison | Culture générale | Conjugaison de 754 verbes à 6 temps avec diagnostic des erreurs ; 25 bonnes réponses = 1 mission ; épreuve de 20 verbes en 6 min |

Les labos de code partagent le moteur `assets/labo-code.js` ; les missions sont générées dans les pages `modules/*/labo-*.html`.
PHP, Python et SQLite (sql.js) sont embarqués dans `assets/vendor/` (aucun CDN nécessaire).

## Comptes, évaluations et classement

- **Comptes** (Firebase Auth : Google ou e-mail) : pseudo unique, progression synchronisée entre appareils (`assets/cloud.js`, configuration dans `data/firebase-config.js`, règles de sécurité dans `firestore.rules`).
- **Évaluation** (`evaluation.html`) : épreuves chronométrées par matière.
  - *Questionnaire* : 10 questions tirées dans les exercices des chapitres, 6 min.
  - *Textuel* : 3 questions ouvertes (`data/eval-textes.js`), 12 min, correction par notions attendues + corrigé.
  - *Pratique* : 3 missions de labo sans indice (`labo-*.html#examen`), 15 min. Une matière peut avoir plusieurs labos : chacun a sa propre épreuve et son classement (`#m=sisr&t=pratique&l=1`, clé `cle` du labo dans `data/modules.js`, ex. `sisr-ipv4_pratique`).
  - *Examen blanc* : questionnaire + questions ouvertes (+ 2 missions de labo si la matière en a un), 18 à 25 min, sous un seul chrono.
  - *Évaluation de chapitre* : 8 questions sur un chapitre, 4 min (entraînement, hors classement).
  - Accès direct : `evaluation.html#m=<matière>&t=<type>[&c=<chapitre>]`, liens sur chaque page de matière.
  - Points = coefficient × réussite + bonus de rapidité (si ≥ 50 %). Le meilleur résultat de chaque épreuve est conservé.
- **Forum** (`forum.html`) : questions par matière, réponses en fil, votes ▲/▼, meilleure réponse, tri (populaires, récentes, mieux notées, sans réponse) et recherche. Firestore : `posts`, `posts/{id}/reponses`, `votes/{uid}`.
- **Classement** (`classement.html`) : général (100 pts par chapitre, 20 par mission, + meilleurs points d'évaluation) ou par épreuve.

## RGPD

- Pages `mentions-legales.html`, `confidentialite.html`, `conditions.html` (coordonnées dans `data/site.js`) ; liens dans le pied de page de toutes les pages.
- Aucun traceur non nécessaire : simple bandeau d'information (pas de consentement requis pour les stockages strictement nécessaires).
- Aucune ressource tierce au chargement : polices (`assets/fonts/`) et SDK Firebase (`assets/vendor/firebase/`) hébergés sur le site.
- Inscription : acceptation des conditions (date et version enregistrées). Menu du compte › « Mes données » : export JSON et suppression du compte.

## Téléphone

Le site est utilisable sur téléphone : barre du haut compacte, pastilles et leçons en défilement horizontal, tableaux défilants, champs à 16 px (pas de zoom iOS), touches tactiles pour le terminal (Tab, ↑, |, /…) et pour l'éditeur de code (symboles, indentation, exécuter).

## Pages reprises

`modules/culture-generale/conjugaison.html` (labo de conjugaison, styles `assets/conjugaison.css`) et `modules/sisr/adressage-ipv4.html` (chapitre standard avec ses outils de calcul et schémas, styles `assets/ipv4.css`) sont passés au design du site. Le chapitre IPv4 ajoute à chaque chargement des questions de calcul tirées au hasard.

## Cours bonus (hors programme)

Page `bonus.html` (lien « Bonus » dans la barre du haut et bandeau sur l'accueil). Les matières marquées `bonus: true` dans `data/modules.js` (JavaScript, Lua, C++, Java) ne comptent ni dans la progression générale ni au classement.

Chaque langage a ses chapitres (cours + exercices, donc évaluations) et un labo de 16 missions (console puis jeux) :

| Langage | Exécution dans le navigateur |
|---|---|
| JavaScript | Web Worker (`assets/run-jeu.js`) |
| Lua 5.4 | wasmoon (`assets/vendor/wasmoon/`) |
| C++20 | clang compilé en WebAssembly (`assets/vendor/clang/`, @browserrun/clang), exécution WASI maison |
| Java | javac + TeaVM en WebAssembly (`assets/vendor/java/`, @live-codes/java-wasm) |

`assets/jeu.js` fournit une même API de jeu aux quatre langages (`effacer`, `rect`, `cercle`, `ligne`, `texte`, `touche`, `toucheAppuyee`, `clic`, `sourisX/Y`, `hasard`, 480 × 320, `update(dt)` / `draw()` à 60 images/s), l'écran (canvas, clavier, souris, croix tactile) et les scénarios de test sans affichage utilisés par la règle `jeu { etapes, test }` des labos. En C++ : `#include "jeu.h"` ; en Java : `public class Main extends Jeu` puis `lancer(new Main())`.

## Lancer en local

Aucune installation : c'est un site statique (HTML, CSS, JavaScript).

```bash
python3 -m http.server 8000
```

Puis ouvrir http://localhost:8000.

## Structure

```
index.html          page d'accueil
data/modules.js     liste des modules et chapitres
assets/             style.css, app.js, module.js, chapter.js, terminal.js
modules/<matière>/  une page HTML par chapitre
```

## Ajouter un chapitre

1. Créer `modules/<matière>/<chapitre>.html` en copiant un chapitre existant : le cours va dans `<article id="cours">`, les exercices dans `window.EF_EXERCICES`.
2. Déclarer le chapitre dans `data/modules.js`.

## Crédits

Icônes : [Lucide](https://lucide.dev) (licence ISC). PHP : [php-wasm](https://github.com/seanmorris/php-wasm) (Apache-2.0 / GPL-2.0). Python : [Pyodide](https://pyodide.org) (MPL-2.0). Polices : Bricolage Grotesque et Hanken Grotesk (Google Fonts).
