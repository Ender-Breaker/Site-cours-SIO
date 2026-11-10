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
    labos: [{ href: "labo-terminal.html", ico: ">_", titre: "Labo terminal Linux", texte: "40 missions guidées sur un vrai faux système de fichiers : ls, cd, grep, chmod, pipes, sudo, tar… plus un bac à sable." }],
    chapitres: [
      { id: "presentation-blocs", titre: "Présentation des Blocs 1 et 3", niveau: "facile" },
      { id: "linux-shell-bases", titre: "Linux : le shell et l'arborescence", niveau: "facile" },
      { id: "linux-texte-pipes", titre: "Linux : texte, redirections et pipes", niveau: "moyen" },
      { id: "linux-droits-utilisateurs", titre: "Linux : droits, propriétaires et utilisateurs", niveau: "moyen" },
      { id: "linux-archives-processus", titre: "Linux : archives, processus et variables", niveau: "moyen" },
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
    description: "Base de la programmation en PHP : variables, conditions, formulaires.",
    labos: [{ href: "labo-php.html", ico: "<?", titre: "Labo PHP", texte: "18 missions avec du vrai PHP 8.4 dans le navigateur : variables, conditions, formulaires GET/POST testés automatiquement." }],
    chapitres: [
      { id: "php-variables-fonctions", titre: "PHP : variables, constantes et fonctions", niveau: "facile" },
      { id: "php-conditionnelles", titre: "PHP : les conditionnelles (if, else, switch)", niveau: "moyen" },
      { id: "php-formulaires", titre: "PHP : formulaires et traitement des données", niveau: "moyen" }
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
    chapitres: []
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
  }
];
