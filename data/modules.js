/* ============================================================
   Étude Facile — liste des matières (modules)
   Pour ajouter une matière ou un chapitre : modifie seulement ce fichier.

   Un chapitre = un fichier HTML : modules/<id-module>/<id-chapitre>.html
   (copie modules/algo/types-operations.html comme modèle)
   - option : "SLAM", "SISR" ou "COMMUN"
   - niveau d'un chapitre : "facile", "moyen" ou "difficile"
   ============================================================ */
window.EF_MODULES = [
  {
    id: "algo",
    evalTextuel: true,
    titre: "Algo Python",
    sousTitre: "Algorithmique · Python",
    icone: "Py",
    option: "COMMUN",
    couleur: "lime",
    description: "Types de données, conditions, boucles, fonctions : les bases pour programmer en Python.",
    labos: [{ href: "labo-python.html", ico: "Py", titre: "Labo Python", texte: "21 missions avec du vrai Python 3 dans le navigateur : saisies, conditions, boucles, listes, fonctions, testées automatiquement." }],
    chapitres: [
      { id: "types-operations", titre: "Données : types et opérations", niveau: "facile" },
      { id: "bonus-variables-affectation", titre: "Bonus : variables et affectation", niveau: "facile" },
      { id: "bonus-affichage-saisie", titre: "Bonus : afficher et saisir", niveau: "facile" },
      { id: "bonus-conditions", titre: "Bonus : conditions if/elif/else", niveau: "facile" },
      { id: "bonus-boucles", titre: "Bonus : boucles for et while", niveau: "moyen" },
      { id: "bonus-listes-chaines", titre: "Bonus : chaînes et listes", niveau: "moyen" },
      { id: "bonus-fonctions", titre: "Bonus : fonctions", niveau: "moyen" }
    ]
  },
  {
    id: "slam",
    evalTextuel: true,
    titre: "SLAM",
    sousTitre: "Bloc 2 · Développement d'applications",
    icone: "</>",
    option: "SLAM",
    couleur: "indigo",
    description: "POO, bases de données, web, API : tout pour concevoir et coder des applications.",
    labos: [{ href: "labo-html.html", ico: "</>", titre: "Labo HTML / CSS", texte: "19 missions : écris du HTML et du CSS, vois le résultat en direct, objectifs vérifiés automatiquement. Plus un bac à sable." }],
    chapitres: [
      { id: "html-bases", titre: "HTML : les bases", niveau: "facile" },
      { id: "css-bases", titre: "CSS : les bases et les sélecteurs", niveau: "facile" },
      { id: "css-positionnement", titre: "CSS : positionnement et flex", niveau: "moyen" },
      { id: "http-url", titre: "Service HTTP et URL", niveau: "facile" },
      { id: "formulaires-html", titre: "HTML : les formulaires de saisie", niveau: "moyen" }
    ]
  },
  {
    id: "sisr",
    evalTextuel: true,
    titre: "SISR",
    sousTitre: "Bloc 2 · Systèmes et réseaux",
    icone: ">_",
    option: "SISR",
    couleur: "emerald",
    description: "Réseaux, Linux, Windows Server, virtualisation, services : administrer une infrastructure.",
    labos: [{ href: "labo-terminal.html", ico: ">_", titre: "Labo terminal Linux", court: "Terminal", texte: "40 missions guidées sur un vrai faux système de fichiers : ls, cd, grep, chmod, pipes, sudo, tar… plus un bac à sable." },
      { href: "labo-ipv4.html", ico: "/24", titre: "Labo sous-réseaux", court: "Sous-réseaux", cle: "sisr-ipv4", texte: "24 missions de calcul IPv4 toujours renouvelées : masque, adresse réseau, broadcast, plage, découpage et VLSM. Plus un calculateur.",
        examDuree: 720, examCoef: 150, examTexte: "6 calculs · 12 min", examDesc: "6 calculs d'adressage tirés au hasard (réseau, broadcast, plage, découpage, VLSM…), sans correction pendant l'épreuve." }],
    chapitres: [
      { id: "presentation-blocs", titre: "Présentation des Blocs 1 et 3", niveau: "facile" },
      { id: "linux-shell-bases", titre: "Linux : le shell et l'arborescence", niveau: "facile" },
      { id: "linux-texte-pipes", titre: "Linux : texte, redirections et pipes", niveau: "moyen" },
      { id: "linux-droits-utilisateurs", titre: "Linux : droits, propriétaires et utilisateurs", niveau: "moyen" },
      { id: "linux-archives-processus", titre: "Linux : archives, processus et variables", niveau: "moyen" },
      { id: "adressage-ipv4", titre: "Adressage IPv4 et services réseau", niveau: "moyen" },
      { id: "wordpress-nginx", titre: "WordPress sur un serveur LEMP (Nginx)", niveau: "difficile" }
    ]
  },
  {
    id: "bloc1",
    evalTextuel: true,
    titre: "Bloc 1",
    sousTitre: "Support et mise à disposition de services",
    icone: "<?",
    option: "COMMUN",
    couleur: "violet",
    description: "Pages web en HTML et CSS, programmation PHP et bases de données SQL.",
    labos: [{ href: "labo-php.html", ico: "<?", titre: "Labo PHP", court: "PHP", texte: "18 missions avec du vrai PHP 8.4 dans le navigateur : variables, conditions, formulaires GET/POST testés automatiquement." },
      { href: "labo-html.html", ico: "</>", titre: "Labo HTML", court: "HTML", cle: "bloc1-html", texte: "12 missions sur la structure et la sémantique : zones HTML5, titres, articles, figures, tableaux, médias, formulaire accessible." },
      { href: "labo-css.html", ico: "{ }", titre: "Labo CSS", court: "CSS", cle: "bloc1-css", texte: "13 missions vérifiées sur le rendu : sélecteurs et spécificité, modèle de boîte, Flexbox, grille, media queries." },
      { href: "labo-sql.html", ico: "SQL", titre: "Labo SQL", court: "SQL", cle: "bloc1-sql", texte: "26 missions sur une vraie base SQLite (parc informatique) : SELECT, WHERE, GROUP BY, jointures, INSERT, UPDATE, DELETE, CREATE TABLE." }],
    chapitres: [
      { id: "html-semantique", titre: "HTML : structure et sémantique d'une page", niveau: "facile" },
      { id: "html-tableaux-medias", titre: "HTML : tableaux, médias et accessibilité", niveau: "moyen" },
      { id: "css-selecteurs-cascade", titre: "CSS : sélecteurs, cascade et unités", niveau: "facile" },
      { id: "css-flexbox-grid", titre: "CSS : Flexbox, Grid et responsive", niveau: "moyen" },
      { id: "php-variables-fonctions", titre: "PHP : variables, constantes et fonctions", niveau: "facile" },
      { id: "php-conditionnelles", titre: "PHP : les conditionnelles (if, else, switch)", niveau: "moyen" },
      { id: "php-formulaires", titre: "PHP : formulaires et traitement des données", niveau: "moyen" },
      { id: "sql-select", titre: "SQL : interroger une base de données", niveau: "facile" },
      { id: "sql-jointures", titre: "SQL : jointures et regroupements", niveau: "moyen" },
      { id: "sql-ldd-lmd", titre: "SQL : créer et modifier les données", niveau: "moyen" }
    ]
  },
  {
    id: "bloc3",
    evalTextuel: true,
    titre: "Bloc 3",
    sousTitre: "Cybersécurité des services informatiques",
    icone: "§",
    option: "COMMUN",
    couleur: "rose",
    description: "Protection des données personnelles : RGPD, anonymisation, analyse d'impact (PIA).",
    chapitres: [
      { id: "rgpd-essentiel", titre: "Le RGPD : l'essentiel à connaître", niveau: "facile" },
      { id: "anonymisation", titre: "Anonymisation et pseudonymisation", niveau: "moyen" },
      { id: "pia-methode", titre: "Le PIA : analyse d'impact (méthode CNIL)", niveau: "moyen" }
    ]
  },
  {
    id: "maths",
    evalTextuel: true,
    titre: "Maths",
    sousTitre: "Arithmétique · Probabilités · Statistiques · Suites",
    icone: "∑",
    option: "COMMUN",
    couleur: "pink",
    description: "Conversions, congruences, probabilités, statistiques et suites numériques.",
    chapitres: [
      { id: "numeration-conversions", titre: "Numération et conversions de base", niveau: "facile" },
      { id: "divisibilite-pgcd", titre: "Divisibilité, nombres premiers et PGCD", niveau: "facile" },
      { id: "congruences", titre: "Congruences", niveau: "moyen" },
      { id: "suites-arithmetiques", titre: "Suites arithmétiques", niveau: "facile" },
      { id: "suites-geometriques", titre: "Suites géométriques", niveau: "moyen" },
      { id: "statistiques-ajustement", titre: "Statistiques à deux variables", niveau: "moyen" }
    ]
  },
  {
    id: "culture-generale",
    titre: "Culture générale",
    sousTitre: "Expression et communication",
    icone: "Aa",
    option: "COMMUN",
    couleur: "amber",
    description: "Synthèse de documents, expression écrite et orale, thèmes de l'année.",
    evalTextuel: true,
    labos: [{ href: "conjugaison.html", ico: "é", titre: "La bonne terminaison", court: "Conjugaison", texte: "Conjugaison : tape la bonne terminaison de 754 verbes, à tous les temps. Chaque série de 25 bonnes réponses valide une mission.",
      examDuree: 360, examCoef: 150, examTexte: "20 verbes · 6 min", blancTexte: "10 verbes à conjuguer", examDesc: "20 verbes tirés au hasard, tous temps confondus. Pas de correction pendant l'épreuve." }],
    chapitres: [
      { id: "terminaisons-verbales", titre: "Les terminaisons verbales", niveau: "facile" }
    ]
  },
  {
    id: "cejm",
    evalTextuel: true,
    titre: "CEJM",
    sousTitre: "Économie · Droit · Management",
    icone: "€",
    option: "COMMUN",
    couleur: "cyan",
    description: "Culture économique, juridique et managériale appliquée aux services informatiques.",
    chapitres: [
      { id: "agents-economiques", titre: "Les acteurs de l'économie numérique", niveau: "facile" },
      { id: "marche-offre-demande", titre: "Le marché : offre, demande et prix", niveau: "facile" }
    ]
  },
  {
    id: "anglais",
    titre: "Anglais",
    sousTitre: "English for computer users",
    icone: "EN",
    option: "COMMUN",
    couleur: "sky",
    description: "Vocabulaire informatique et expression en anglais.",
    chapitres: []
  },

  /* ---------- Cours bonus : hors programme, ne comptent ni dans la progression ni au classement ---------- */
  {
    id: "javascript", bonus: true,
    titre: "JavaScript",
    sousTitre: "Bonus · le langage du web",
    icone: "JS",
    option: "BONUS",
    couleur: "js",
    description: "Variables, fonctions, tableaux, objets, DOM et événements, puis des jeux en canvas dans le navigateur.",
    labos: [{ href: "labo-js.html", ico: "JS", titre: "Labo JavaScript", court: "JavaScript", texte: "16 missions : programmes console puis jeux (dessin, clavier, souris, rebonds, gravité, mini-jeu complet). Plus un bac à sable." }],
    chapitres: [
      { id: "js-bases", titre: "JavaScript : variables, types et opérateurs", niveau: "facile" },
      { id: "js-conditions-boucles", titre: "JavaScript : conditions et boucles", niveau: "facile" },
      { id: "js-fonctions", titre: "JavaScript : les fonctions", niveau: "moyen" },
      { id: "js-tableaux-objets", titre: "JavaScript : tableaux et objets", niveau: "moyen" },
      { id: "js-dom-evenements", titre: "JavaScript : le DOM et les événements", niveau: "moyen" },
      { id: "js-jeu-canvas", titre: "JavaScript : créer un jeu dans le navigateur", niveau: "difficile" }
    ]
  },
  {
    id: "lua", bonus: true, evalTextuel: true,
    titre: "Lua",
    sousTitre: "Bonus · le langage des jeux",
    icone: "Lua",
    option: "BONUS",
    couleur: "lua",
    description: "Le cours complet du langage de Roblox, LÖVE et des scripts de jeux : bases, tables, chaînes, closures, métatables, objets, coroutines, puis des jeux.",
    labos: [{ href: "labo-lua.html", ico: "Lua", titre: "Labo Lua", court: "Lua", texte: "44 missions avec du vrai Lua 5.4 : bases, chaînes, tables, closures, métatables, objets, coroutines, puis des jeux dans le navigateur. Plus un bac à sable." }],
    chapitres: [
      { id: "lua-bases", titre: "Lua : variables, types et affichage", niveau: "facile" },
      { id: "lua-conditions-boucles", titre: "Lua : conditions et boucles", niveau: "facile" },
      { id: "lua-fonctions", titre: "Lua : les fonctions", niveau: "moyen" },
      { id: "lua-tables", titre: "Lua : les tables", niveau: "moyen" },
      { id: "lua-chaines", titre: "Lua : les chaînes de caractères", niveau: "moyen" },
      { id: "lua-closures", titre: "Lua : portée, closures et fonctions d'ordre supérieur", niveau: "moyen" },
      { id: "lua-metatables", titre: "Lua : métatables et métaméthodes", niveau: "difficile" },
      { id: "lua-objets-jeux", titre: "Lua : objets, classes et héritage", niveau: "difficile" },
      { id: "lua-erreurs-modules", titre: "Lua : erreurs, modules et bibliothèques standard", niveau: "moyen" },
      { id: "lua-coroutines", titre: "Lua : les coroutines", niveau: "difficile" },
      { id: "lua-jeux", titre: "Lua : créer un jeu", niveau: "difficile" },
      { id: "lua-ecosysteme", titre: "Lua en vrai : Roblox, LÖVE, Neovim et bonnes pratiques", niveau: "moyen" }
    ]
  },
  {
    id: "cpp", bonus: true, evalTextuel: true,
    titre: "C++",
    sousTitre: "Bonus · rapide et compilé",
    icone: "C++",
    option: "BONUS",
    couleur: "cpp",
    description: "Le cours complet : compilation, types, fonctions et références, vector et string, pointeurs, classes, héritage, mémoire moderne, STL, templates, puis de vrais jeux compilés en WebAssembly.",
    labos: [{ href: "labo-cpp.html", ico: "C++", titre: "Labo C++", court: "C++", texte: "45 missions avec du vrai C++20 compilé par clang dans le navigateur : bases, fonctions, vector, pointeurs, classes, héritage, STL, templates, puis des jeux en temps réel. Plus un bac à sable." }],
    chapitres: [
      { id: "cpp-bases", titre: "C++ : compiler, afficher, lire", niveau: "facile" },
      { id: "cpp-conditions-boucles", titre: "C++ : conditions et boucles", niveau: "facile" },
      { id: "cpp-fonctions", titre: "C++ : fonctions et références", niveau: "moyen" },
      { id: "cpp-vector-string", titre: "C++ : tableaux, vector et string", niveau: "moyen" },
      { id: "cpp-pointeurs", titre: "C++ : pointeurs et mémoire", niveau: "difficile" },
      { id: "cpp-classes", titre: "C++ : classes et objets", niveau: "difficile" },
      { id: "cpp-heritage", titre: "C++ : héritage et polymorphisme", niveau: "difficile" },
      { id: "cpp-memoire-moderne", titre: "C++ : RAII, copie et pointeurs intelligents", niveau: "difficile" },
      { id: "cpp-stl", titre: "C++ : la STL, conteneurs, algorithmes et lambdas", niveau: "difficile" },
      { id: "cpp-templates", titre: "C++ : templates et surcharge d'opérateurs", niveau: "difficile" },
      { id: "cpp-projets", titre: "C++ : exceptions, fichiers et organisation d'un projet", niveau: "moyen" },
      { id: "cpp-jeu", titre: "C++ : créer un jeu dans le navigateur", niveau: "difficile" }
    ]
  },
  {
    id: "java", bonus: true, evalTextuel: true,
    titre: "Java",
    sousTitre: "Bonus · objets et Android",
    icone: "J",
    option: "BONUS",
    couleur: "java",
    description: "Le cours complet : types, méthodes, tableaux, chaînes, programmation objet, héritage et interfaces, collections, exceptions, lambdas et streams, puis des jeux avec la classe Jeu.",
    labos: [{ href: "labo-java.html", ico: "J", titre: "Labo Java", court: "Java", texte: "45 missions avec du vrai Java (javac + TeaVM) dans le navigateur : bases, méthodes, chaînes, objets, héritage, collections, exceptions, streams, puis des jeux. Plus un bac à sable." }],
    chapitres: [
      { id: "java-bases", titre: "Java : la classe Main, types et Scanner", niveau: "facile" },
      { id: "java-conditions-boucles", titre: "Java : conditions et boucles", niveau: "facile" },
      { id: "java-methodes-tableaux", titre: "Java : méthodes et tableaux", niveau: "moyen" },
      { id: "java-chaines", titre: "Java : les chaînes de caractères", niveau: "moyen" },
      { id: "java-poo", titre: "Java : programmation orientée objet", niveau: "difficile" },
      { id: "java-heritage", titre: "Java : héritage, classes abstraites et interfaces", niveau: "difficile" },
      { id: "java-collections", titre: "Java : les collections et les génériques", niveau: "moyen" },
      { id: "java-exceptions", titre: "Java : les exceptions", niveau: "moyen" },
      { id: "java-lambdas-streams", titre: "Java : lambdas et streams", niveau: "difficile" },
      { id: "java-enum-records", titre: "Java : enum, records, paquetages et bonnes pratiques", niveau: "moyen" },
      { id: "java-projets", titre: "Java en vrai : fichiers, base de données, Maven et tests", niveau: "moyen" },
      { id: "java-jeu", titre: "Java : créer un jeu dans le navigateur", niveau: "difficile" }
    ]
  }
];
