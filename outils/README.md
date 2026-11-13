# Outils : générateur des cours bonus

Les cours bonus (JavaScript, Lua, C++, Java, C#, Git, Bash, PowerShell, Docker, sécurité web) et leurs labos sont **générés**. On ne modifie pas les pages `modules/<bonus>/*.html` à la main : on modifie les sources ci-dessous puis on relance le générateur.

```
python3 outils/gen.py        # régénère chapitres, labos, data/modules.js (partie bonus) et data/eval-textes.js (partie bonus)
```

| Fichier | Contenu |
|---|---|
| `modules.py` | la fiche de chaque module bonus (titre, couleur, description, labo). L'ordre est celui de l'affichage. |
| `src/<module>-N.txt` | les chapitres (cours + exercices), lus dans l'ordre des fichiers |
| `labos/<module>.py` | les leçons et missions du labo ; `labos/communs.py` : missions partagées par les quatre langages |
| `textes.py` | les questions ouvertes de l'évaluation « textuel » |
| `verif.js` | tests automatiques (Chrome sans affichage, `npm i puppeteer-core`, site servi sur le port 8765) |

## Format d'un chapitre

```
=== identifiant | Titre du chapitre | f        (f facile, m moyen, d difficile)
Paragraphe avec `code` et **gras**.
## Titre de section
!info Titre | texte ¶ second paragraphe        (aussi : !retenir, !attention)
!defi Titre | texte | identifiant-de-mission   (lien vers une mission du labo)
!tuto Titre du tutoriel
# Titre d'une étape
!fin
| en-tête | en-tête |                          (tableau : une ligne par rangée)
--- exos
Q¤f¤Question ?¤bonne réponse;;fausse;;fausse;;fausse¤explication     (les réponses sont mélangées à la génération)
V¤m¤Affirmation.¤V¤explication                                         (V ou F)
S¤m¤Question ?¤réponse;;variante acceptée¤explication
A¤m¤Consigne¤gauche=>droite;;gauche=>droite¤explication
```

Blocs de code : ```` ``` ```` simple = code affiché ; ```` ```run ```` = code **exécutable** dans la page (Lua, C++, Java, JavaScript).
Options de `run` : `stdin=a|b` (entrées, `~` = espace), `err` (le programme est censé échouer), `h=iostream,vector` (C++ : ajoute les `#include`), `imp=java.util.*` (Java), `main` (le corps est placé dans `main` ; `@@` sépare les déclarations du corps), `cls` (Java : classes puis corps de `main`).

## Tests

```
python3 -m http.server 8765 &
node outils/verif.js labo modules/lua/labo-lua.html          # chaque solution doit passer, chaque code de départ doit échouer
node outils/verif.js essais modules/cpp/cpp-stl.html         # exécute tous les blocs run d'un chapitre
node outils/verif.js page modules/git/index.html             # erreurs de script et débordement à 390 px
```

Règle : l'identifiant d'une mission ou d'un chapitre existant ne change jamais (la progression des élèves y est attachée).
