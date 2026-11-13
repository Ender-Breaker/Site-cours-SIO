"""Fiches des modules bonus (ordre = ordre d'affichage). {n} dans le texte d'un labo = nombre de missions."""
MODULES = {
    "javascript": dict(
        titre="JavaScript", sousTitre="Bonus · le langage du web", icone="JS", couleur="js",
        description="Variables, fonctions, tableaux, objets, DOM et événements, puis des jeux en canvas dans le navigateur.",
        labo=dict(href="labo-js.html", titre="Labo JavaScript", court="JavaScript",
                  texte="16 missions : programmes console puis jeux (dessin, clavier, souris, rebonds, gravité, mini-jeu complet). Plus un bac à sable."),
        fixes=[("js-bases", "JavaScript : variables, types et opérateurs", "facile"),
               ("js-conditions-boucles", "JavaScript : conditions et boucles", "facile"),
               ("js-fonctions", "JavaScript : les fonctions", "moyen"),
               ("js-tableaux-objets", "JavaScript : tableaux et objets", "moyen"),
               ("js-dom-evenements", "JavaScript : le DOM et les événements", "moyen"),
               ("js-jeu-canvas", "JavaScript : créer un jeu dans le navigateur", "difficile")]),
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
        titre="Java", sousTitre="Bonus · objets et Android", icone="J", couleur="java",
        description="Classes, types, Scanner, méthodes, tableaux et ArrayList, programmation objet, puis des jeux avec la classe Jeu.",
        labo=dict(href="labo-java.html", titre="Labo Java", court="Java",
                  texte="16 missions avec du vrai Java (javac + TeaVM) dans le navigateur : console, objets, puis jeux. Plus un bac à sable."),
        fixes=[("java-bases", "Java : la classe Main, types et Scanner", "facile"),
               ("java-conditions-boucles", "Java : conditions et boucles", "facile"),
               ("java-methodes-tableaux", "Java : méthodes, tableaux et ArrayList", "moyen"),
               ("java-poo", "Java : programmation orientée objet", "difficile"),
               ("java-jeu", "Java : créer un jeu dans le navigateur", "difficile")]),
}
