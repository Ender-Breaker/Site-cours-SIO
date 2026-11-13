"""Fiches des modules bonus (ordre = ordre d'affichage). {n} dans le texte d'un labo = nombre de missions."""
MODULES = {
    "javascript": dict(
        titre="JavaScript", sousTitre="Bonus · le langage du web", icone="JS", couleur="js", textuel=True,
        description="Le langage du web : variables, fonctions, tableaux et objets, classes et modules, DOM et événements, asynchrone et API REST, puis des jeux en canvas.",
        labo=dict(href="labo-js.html", titre="Labo JavaScript", court="JavaScript",
                  sousTitre="Du vrai JavaScript : programmes console, tableaux et objets, classes, JSON, puis des jeux en canvas dans le navigateur.",
                  texte="{n} missions : bases, fonctions, tableaux et objets (map, filter, reduce, JSON, classes), chaînes, puis des jeux (dessin, clavier, souris, gravité, tirs). Plus un bac à sable.")),
    "lua": dict(
        titre="Lua", sousTitre="Bonus · le langage des jeux", icone="Lua", couleur="lua", textuel=True,
        description="Le cours complet du langage de Roblox, LÖVE et des scripts de jeux : bases, tables, chaînes, closures, métatables, objets, coroutines, puis des jeux.",
        labo=dict(href="labo-lua.html", titre="Labo Lua", court="Lua",
                  sousTitre="Du vrai Lua 5.4 (le langage de Roblox et de LÖVE) : des bases aux métatables et aux coroutines, puis des jeux dans le navigateur.",
                  texte="{n} missions avec du vrai Lua 5.4 : bases, chaînes, tables, closures, métatables, objets, coroutines, puis des jeux dans le navigateur. Plus un bac à sable.")),
    "cpp": dict(
        titre="C++", sousTitre="Bonus · rapide et compilé", icone="C++", couleur="cpp", textuel=True,
        description="Le cours complet : compilation, types, fonctions et références, vector et string, pointeurs, classes, héritage, mémoire moderne, STL, templates, puis de vrais jeux compilés en WebAssembly.",
        labo=dict(href="labo-cpp.html", titre="Labo C++", court="C++",
                  sousTitre="Du vrai C++20 compilé par clang dans le navigateur : des bases aux classes, à l'héritage, à la STL et aux templates, puis des jeux en temps réel.",
                  texte="{n} missions avec du vrai C++20 compilé par clang dans le navigateur : bases, fonctions, vector, pointeurs, classes, héritage, STL, templates, puis des jeux en temps réel. Plus un bac à sable.")),
    "java": dict(
        titre="Java", sousTitre="Bonus · objets et Android", icone="J", couleur="java", textuel=True,
        description="Le cours complet : types, méthodes, tableaux, chaînes, programmation objet, héritage et interfaces, collections, exceptions, lambdas et streams, puis des jeux avec la classe Jeu.",
        labo=dict(href="labo-java.html", titre="Labo Java", court="Java",
                  sousTitre="Du vrai Java (javac + TeaVM) dans le navigateur : des bases aux objets, à l'héritage, aux collections, aux exceptions et aux streams, puis des jeux.",
                  texte="{n} missions avec du vrai Java (javac + TeaVM) dans le navigateur : bases, méthodes, chaînes, objets, héritage, collections, exceptions, streams, puis des jeux. Plus un bac à sable.")),
    "csharp": dict(
        titre="C#", sousTitre="Bonus · SLAM · le langage de .NET", icone="C#", couleur="cs",
        description="Le langage le plus demandé en SLAM avec Java : syntaxe, collections, classes et propriétés, héritage, LINQ, accès aux bases de données. Avec la table de correspondance Java ↔ C#."),
    "git": dict(
        titre="Git et GitHub", sousTitre="Bonus · SLAM et SISR · versionner son travail", icone="Git", couleur="git",
        description="L'outil attendu en stage et dans le portfolio : commits, branches, fusions et conflits, GitHub, pull requests, et comment réparer ses erreurs."),
    "bash": dict(
        titre="Scripts Bash", sousTitre="Bonus · SISR · automatiser Linux", icone="#!", couleur="bash",
        description="Écrire des scripts d'administration : variables, tests, boucles, fonctions, expressions régulières avec grep, sed et awk, SSH, cron et sauvegardes."),
    "powershell": dict(
        titre="PowerShell", sousTitre="Bonus · SISR · administrer Windows", icone="PS>", couleur="ps",
        description="Le shell de Windows Server : cmdlets, pipeline d'objets, scripts, services, journaux, comptes Active Directory et administration à distance."),
    "docker": dict(
        titre="Docker", sousTitre="Bonus · SLAM et SISR · conteneurs", icone="Dkr", couleur="docker",
        description="Emballer et déployer une application : images, conteneurs, volumes, Dockerfile, et une pile web complète avec Docker Compose."),
    "securite-web": dict(
        titre="Sécurité web", sousTitre="Bonus · SLAM et bloc 3 · OWASP", icone="Sec", couleur="secu",
        description="Comprendre et corriger les failles classiques : injection SQL, XSS, CSRF, stockage des mots de passe, sessions, contrôle d'accès et HTTPS."),
}
