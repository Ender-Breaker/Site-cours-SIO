# Étude Facile — Site de cours BTS SIO

Site de révision pour le BTS SIO (1re année, option SLAM). Chaque matière est un module, chaque chapitre une page avec une partie **Cours** et une partie **S'entraîner** (exercices interactifs : QCM, vrai/faux, saisie, association, terminal simulé). Une progression avec XP et séries est enregistrée dans le navigateur.

**Site en ligne :** https://sitecoursio.vercel.app

## Matières

| Module | Contenu |
|---|---|
| Algorithmique / Python | Types et opérations, plus 6 chapitres bonus (variables, affichage, conditions, boucles, listes et chaînes, fonctions) |
| SLAM | HTML, CSS, formulaires, HTTP et URL |
| SISR | Présentation des blocs, shell Linux, droits, archives et processus, WordPress / Nginx |
| Bloc 1 | PHP : variables, fonctions, conditions, formulaires |
| Bloc 3 | RGPD, PIA, anonymisation |
| Mathématiques | Numération, divisibilité et PGCD, congruences, suites, statistiques |
| CEJM | Agents économiques, marché, offre et demande |
| Culture générale, Anglais | À venir |

## Labos interactifs

| Labo | Module | Contenu |
|---|---|---|
| Terminal Linux | SISR | 40 missions guidées sur un système de fichiers virtuel (ls, cd, grep, chmod, pipes, sudo, tar…) + bac à sable |
| HTML / CSS | SLAM | 19 missions avec aperçu en direct, objectifs vérifiés sur le rendu (DOM, styles calculés) |
| PHP | Bloc 1 | 18 missions avec du vrai PHP 8.4 (php-wasm) ; formulaires GET/POST simulés et tests automatiques |
| Python | Algo Python | 21 missions avec du vrai Python 3 (Pyodide, dans un Web Worker) ; saisies `input()` et tests automatiques |

Les labos de code partagent le moteur `assets/labo-code.js` ; les missions sont générées dans les pages `modules/*/labo-*.html`.
PHP et Python sont embarqués dans `assets/vendor/` (aucun CDN nécessaire).

## Comptes, évaluations et classement

- **Comptes** (Firebase Auth : Google ou e-mail) : pseudo unique, progression synchronisée entre appareils (`assets/cloud.js`, configuration dans `data/firebase-config.js`, règles de sécurité dans `firestore.rules`).
- **Évaluation** (`evaluation.html`) : épreuves chronométrées par matière.
  - *Questionnaire* : 10 questions tirées dans les exercices des chapitres, 6 min.
  - *Textuel* : 3 questions ouvertes (`data/eval-textes.js`), 12 min, correction par notions attendues + corrigé.
  - *Pratique* : 3 missions de labo sans indice (`labo-*.html#examen`), 15 min.
  - *Examen blanc* : questionnaire + questions ouvertes (+ 2 missions de labo si la matière en a un), 18 à 25 min, sous un seul chrono.
  - *Évaluation de chapitre* : 8 questions sur un chapitre, 4 min (entraînement, hors classement).
  - Accès direct : `evaluation.html#m=<matière>&t=<type>[&c=<chapitre>]`, liens sur chaque page de matière.
  - Points = coefficient × réussite + bonus de rapidité (si ≥ 50 %). Le meilleur résultat de chaque épreuve est conservé.
- **Forum** (`forum.html`) : questions par matière, réponses en fil, votes ▲/▼, meilleure réponse, tri (populaires, récentes, mieux notées, sans réponse) et recherche. Firestore : `posts`, `posts/{id}/reponses`, `votes/{uid}`.
- **Classement** (`classement.html`) : général (100 pts par chapitre, 20 par mission, + meilleurs points d'évaluation) ou par épreuve.

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
