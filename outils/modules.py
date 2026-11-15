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
        titre="Cybersécurité", sousTitre="Bonus · SLAM, SISR et bloc 3 · attaquer pour mieux défendre", icone="Sec", couleur="secu", textuel=True, langue="js",
        description="Le cours complet : attaques et protections, hameçonnage, failles web, cryptographie, réseau, durcissement, failles de mémoire, rétro-ingénierie, réponse à incident, test d'intrusion. Avec trois labos, dont un duel attaque / défense à jouer contre un autre élève.",
        labo=dict(href="labo-cyber.html", titre="Labo cybersécurité", court="Code",
                  fin='Le <a href="labo-cyber.html">labo cybersécurité</a> te fait écrire des protections, casser des chiffres faibles et analyser des programmes. Le <a href="labo-defense.html">labo terminal</a> te fait enquêter et durcir un serveur. Et le <a href="duel.html">duel attaque / défense</a> t\'oppose à un autre élève.',
                  texte="{n} missions de code : protéger une application, cryptographie, rétro-ingénierie (crackme, hexadécimal, désobfuscation), analyse de journaux. Vérifiées automatiquement.",
                  cfg=dict(langue="js", key="ef-labo-cyber", titre="Labo cybersécurité", ico="Sec", couleur="secu", fichier="main.js",
                           sousTitre="Écris des protections, casse des chiffres faibles, analyse des programmes et des journaux : en JavaScript, vérifié automatiquement.",
                           module=dict(titre="Cybersécurité", href="index.html"),
                           libre='// Bac à sable : écris ce que tu veux, le programme s\'exécute dans la console.\nconst octets = [0x73, 0x69, 0x6f];\nconsole.log(octets.map(o => String.fromCharCode(o)).join(""));\n',
                           libreTexte="<p>Un bac à sable JavaScript pour essayer un déchiffrement, convertir de l'hexadécimal ou tester une idée.</p><p class=\"lb-small\"><code>lire()</code> renvoie la ligne suivante des entrées ; <code>console.log</code> affiche.</p>")),
        autres_labos=[
            dict(href="labo-defense.html", ico=">_", titre="Labo terminal : enquêter et durcir", court="Terminal", cle="securite-web-terminal", source="terminal_defense", examTexte="3 missions au terminal · 15 min",
                 texte="Dans un terminal Linux simulé : fouiller les journaux après une attaque, repérer un compte suspect, corriger des droits dangereux, protéger des secrets."),
            dict(href="duel.html", ico="VS", titre="Duel attaque / défense", court="Duel", sansExamen=True, bouton="Lancer un duel",
                 texte="Un élève compose une attaque, un autre défend le réseau d'une entreprise : choisis tes protections, identifie les incidents, réagis. Seul contre l'ordinateur, à deux sur le même appareil, ou par lien envoyé à un ami."),
        ]),
}
