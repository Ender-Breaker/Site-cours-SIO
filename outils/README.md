# Outils : générateur des cours bonus

Les cours bonus (JavaScript, Lua, C++, Java, C#, Git, Bash, PowerShell, Docker, cybersécurité) et leurs labos sont **générés**. On ne modifie pas les pages `modules/<bonus>/*.html` à la main : on modifie les sources ci-dessous puis on relance le générateur.

```
python3 outils/gen.py        # régénère chapitres, labos, data/modules.js (partie bonus) et data/eval-textes.js (partie bonus)
```

| Fichier | Contenu |
|---|---|
| `modules.py` | la fiche de chaque module bonus (titre, couleur, description, labo). L'ordre est celui de l'affichage. |
| `src/<module>-N.txt` | les chapitres (cours + exercices), lus dans l'ordre des fichiers |
| `labos/<module>.py` | les leçons et missions du labo ; `labos/communs.py` : missions partagées par les quatre langages |
| `labos/terminal_defense.py` | le labo terminal « enquêter et durcir » du module cybersécurité (`HREF`, `LAB` : système de fichiers, leçons, missions) ; page générée quand une entrée de `autres_labos` porte `source="terminal_defense"` |
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
node outils/verif-terminal.js modules/securite-web/labo-defense.html   # labo terminal : la solution remplit tous les objectifs, l'état de départ non
node outils/verif-duel.js                                    # joue le duel dans tous les modes (liens de défi, liens trafiqués, chrono expiré)
node outils/verif-atelier.js                                 # atelier de code : exploit de référence valide, correctif qui tient et reste utilisable, liens
```

Règle : l'identifiant d'une mission ou d'un chapitre existant ne change jamais (la progression des élèves y est attachée).

## Plusieurs labos pour un module

Dans `modules.py`, `labo=dict(...)` décrit le labo de code généré depuis `labos/<module>.py` (avec `cfg` pour créer la page si elle n'existe pas, `fin` pour l'encadré « Passe à la pratique » des chapitres). `autres_labos=[dict(...)]` ajoute d'autres entrées à la fiche : `href`, `ico`, `titre`, `court`, `texte`, et au besoin `cle` (clé d'évaluation), `examTexte`, `sansExamen=True` (pas d'évaluation pratique), `bouton` (libellé du bouton), `source` (labo terminal à générer). `langue="js"` sur la fiche rend exécutables les blocs ```` ```run ```` des chapitres d'un module qui n'est pas un langage.

Le duel (`modules/securite-web/duel.html`, `assets/duel.js`) est écrit à la main : il n'est pas régénéré.

L'atelier de code (`modules/securite-web/atelier.html`, `assets/atelier.js`) est aussi écrit à la main. Ses manches sont dans le tableau `MANCHES` de `assets/atelier.js` : chaque manche a une source-jouet vulnérable (`cible`), le corps du vérificateur d'attaque (`att`) et d'usage (`use`), une liste d'exploits canoniques, et un correctif d'exemple. Les sources contenant des expressions régulières sont écrites en `String.raw` pour préserver les antislashs.
