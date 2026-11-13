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

Page `bonus.html` (lien « Bonus » dans la barre du haut et bandeau sur l'accueil). Les matières marquées `bonus: true` dans `data/modules.js` ne comptent ni dans la progression générale ni au classement.

| Module | Chapitres | Labo |
|---|---|---|
| JavaScript | 8 : bases, conditions et boucles, fonctions, tableaux et objets, classes et modules, DOM, asynchrone et API REST, jeux | 40 missions |
| Lua | 12 : bases, conditions et boucles, fonctions, tables, chaînes et motifs, closures, métatables, objets et héritage, erreurs et modules, coroutines, jeux, écosystème (LÖVE, Roblox) | 44 missions |
| C++ | 12 : bases, conditions et boucles, fonctions et références, vector et string, pointeurs, classes, héritage, RAII et pointeurs intelligents, STL et lambdas, templates et opérateurs, exceptions/fichiers/projet, jeux | 45 missions |
| Java | 12 : bases, conditions et boucles, méthodes et tableaux, chaînes, POO, héritage et interfaces, collections, exceptions, lambdas et streams, enum et records, fichiers/JDBC/Maven/JUnit, jeux | 45 missions |
| C# | 2 : syntaxe et collections ; classes, propriétés, LINQ, accès aux données | |
| Git et GitHub | 4 : bases, branches et fusions, GitHub et pull requests, annuler et bonnes pratiques | |
| Scripts Bash | 4 : premier script, conditions/boucles/fonctions, regex avec grep/sed/awk, SSH/cron/sauvegardes | |
| PowerShell | 2 : cmdlets et pipeline d'objets ; scripts, Active Directory, administration à distance | |
| Docker | 2 : images et conteneurs ; Dockerfile et Docker Compose | |
| Sécurité web | 2 : injection SQL, XSS, CSRF ; mots de passe, sessions, contrôle d'accès, HTTPS | |

**Code exécutable dans les cours.** Dans les chapitres JavaScript, Lua, C++ et Java, les blocs « Exécuter » (`assets/essai.js`) sont de petits éditeurs : on modifie le code, on le relance, la sortie s'affiche dessous. Chaque chapitre a un tutoriel pas à pas et des « défis » qui ouvrent la mission correspondante du labo (`labo-xxx.html#m=<mission>`).

| Langage | Exécution dans le navigateur |
|---|---|
| JavaScript | Web Worker (`assets/run-jeu.js`) |
| Lua 5.4 | wasmoon (`assets/vendor/wasmoon/`) |
| C++20 | clang compilé en WebAssembly (`assets/vendor/clang/`), sans exceptions ni fichiers |
| Java | javac + TeaVM en WebAssembly (`assets/vendor/java/`) |

`assets/jeu.js` fournit une même API de jeu aux quatre langages (`effacer`, `rect`, `cercle`, `ligne`, `texte`, `touche`, `toucheAppuyee`, `clic`, `sourisX/Y`, `hasard`, 480 × 320, `update(dt)` / `draw()` à 60 images/s). En C++ : `#include "jeu.h"` ; en Java : `public class Main extends Jeu` puis `lancer(new Main())`.

**Ces pages sont générées.** Sources et générateur dans `outils/` (voir `outils/README.md`) : `python3 outils/gen.py` régénère les chapitres, les labos, la partie bonus de `data/modules.js` et de `data/eval-textes.js`. Chaque solution de labo et chaque bloc exécutable est vérifié automatiquement (`outils/verif.js`).
