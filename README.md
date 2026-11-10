# Étude Facile — Site de cours BTS SIO

Site de révision pour le BTS SIO (1re année, option SLAM). Chaque matière est un module, chaque chapitre une page avec une partie **Cours** et une partie **S'entraîner** (exercices interactifs : QCM, vrai/faux, saisie, association, terminal simulé). Une progression avec XP et séries est enregistrée dans le navigateur.

**Site en ligne :** https://ender-breaker.github.io/Site-cours-SIO/

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

Icônes : [Lucide](https://lucide.dev) (licence ISC). Polices : Bricolage Grotesque et Hanken Grotesk (Google Fonts).
