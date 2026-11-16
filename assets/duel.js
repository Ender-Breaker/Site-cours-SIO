/* Étude Facile — Duel attaque / défense (module Cybersécurité).
   Une SIMULATION sous forme de jeu : un joueur compose un plan d'attaque à partir d'un catalogue,
   l'autre choisit ses protections avec un budget limité, puis traite les incidents qui passent.
   Aucune attaque réelle : pas de réseau, pas de commande, uniquement des fiches et des questions.
   Modes : contre l'ordinateur (défense ou attaque), à deux sur le même appareil, défi par lien (#d=…) et résultat (#r=…).
   ATTENTION : l'ordre des tableaux PROT et ATT est inscrit dans les liens de défi. On ajoute à la fin, on ne réordonne pas. */
(function () {
  "use strict";
  var EF = window.EtudeFacile, esc = EF.esc, el = EF.el;
  var KEY = "ef-duel", BUDGET_A = 10, MIN_A = 4, MAX_A = 6, CHRONO = 45;

  /* ---------- protections (défense) ---------- */
  var PROT = [
    { id: "mfa", nom: "Authentification multifacteur", cout: 2, quoi: "Un second facteur (application, clé) est demandé en plus du mot de passe : un mot de passe volé ou deviné ne suffit plus." },
    { id: "blocage", nom: "Blocage après échecs", cout: 1, quoi: "Après quelques essais ratés, l'adresse est bannie et le compte temporisé (fail2ban, limitation de débit)." },
    { id: "mdp", nom: "Gestionnaire de mots de passe", cout: 1, quoi: "Chaque compte a un mot de passe long, aléatoire et unique : une fuite sur un autre site ne sert à rien ici." },
    { id: "sensibilisation", nom: "Formation des salariés", cout: 2, quoi: "Exercices d'hameçonnage, réflexes face à une demande pressante, une clé inconnue, un appel inhabituel." },
    { id: "double", nom: "Double validation des paiements", cout: 1, quoi: "Tout virement ou changement de coordonnées bancaires est confirmé par une seconde personne, sur un numéro déjà connu." },
    { id: "devsec", nom: "Développement sécurisé", cout: 3, quoi: "Requêtes préparées, échappement de l'affichage, contrôle des fichiers envoyés, relecture du code avant mise en ligne." },
    { id: "waf", nom: "Pare-feu applicatif (WAF)", cout: 2, quoi: "Un filtre placé devant le site bloque les requêtes web qui ressemblent à une injection." },
    { id: "correctifs", nom: "Gestion des correctifs", cout: 2, quoi: "Inventaire des logiciels et mises à jour de sécurité appliquées sous quelques jours." },
    { id: "edr", nom: "Antivirus / EDR", cout: 2, quoi: "Les programmes au comportement suspect sont arrêtés sur les postes, et les supports amovibles inconnus sont bloqués." },
    { id: "sauvegardes", nom: "Sauvegardes hors ligne", cout: 2, quoi: "Règle 3-2-1 : trois copies, deux supports, une copie déconnectée. La restauration est testée régulièrement." },
    { id: "chiffrement", nom: "Échanges chiffrés", cout: 2, quoi: "HTTPS partout, VPN pour les nomades, Wi-Fi d'entreprise où chaque appareil vérifie l'identité de la borne." },
    { id: "antiddos", nom: "Protection anti-saturation", cout: 2, quoi: "Le trafic passe par un service qui absorbe et filtre les afflux massifs avant qu'ils n'atteignent le serveur." },
    { id: "comptes", nom: "Gestion des comptes", cout: 2, quoi: "Moindre privilège, revue régulière des comptes, fermeture le jour du départ, mots de passe administrateur différents par machine." },
    { id: "segmentation", nom: "Segmentation du réseau", cout: 2, quoi: "Postes, serveurs et objets connectés sont dans des réseaux séparés ; un pare-feu interne ne laisse passer que le nécessaire." },
    { id: "secrets", nom: "Gestion des secrets", cout: 1, quoi: "Clés et mots de passe dans un coffre, jamais dans le code ; les dépôts sont analysés avant chaque envoi." },
    { id: "durcissement", nom: "Durcissement des systèmes", cout: 2, quoi: "Mots de passe d'usine changés, services inutiles coupés, exécution interdite dans les dossiers de dépôt, audits de configuration." },
    { id: "integrite", nom: "Contrôle des dépendances", cout: 1, quoi: "Versions figées, empreintes vérifiées à l'installation, mises à jour de bibliothèques relues avant déploiement." },
    { id: "supervision", nom: "Supervision et alertes", cout: 2, quoi: "Les journaux sont centralisés et corrélés. Ne bloque rien, mais pendant un incident deux fausses pistes sont écartées d'office." }
  ];

  /* ---------- attaques (catalogue pédagogique : principe, signes vus par la défense, parades) ---------- */
  var ATT = [
    { id: "hameconnage", nom: "Hameçonnage", cout: 1, cible: "Messagerie", chap: "cyber-social",
      principe: "Un courriel imite le fournisseur de messagerie et pousse un salarié à saisir son mot de passe sur une fausse page.",
      signes: ["09:02  Léa (comptabilité) : « J'ai reçu un message \"Votre boîte expire aujourd'hui\", j'ai cliqué et remis mon mot de passe. »", "09:40  Messagerie : connexion réussie au compte lea depuis un pays où l'entreprise n'a aucun salarié", "09:41  Messagerie : nouvelle règle de transfert automatique vers une adresse externe"],
      bloque: ["mfa", "sensibilisation"], proches: ["bourrage", "president", "force-brute"],
      bonne: "Changer son mot de passe, fermer toutes ses sessions et supprimer la règle de transfert",
      fausses: ["Supprimer le courriel reçu et attendre de voir", "Éteindre le serveur de messagerie de toute l'entreprise", "Demander à Léa de ne plus ouvrir ses courriels cette semaine"],
      expl: "Le mot de passe est connu de l'attaquant : il faut le changer, couper les sessions déjà ouvertes et retirer ce qu'il a installé (la règle de transfert). Avec un second facteur, le mot de passe volé n'aurait pas suffi." },
    { id: "force-brute", nom: "Force brute", cout: 1, cible: "Accès distant (SSH)", chap: "cyber-attaques",
      principe: "Un robot essaie des milliers de mots de passe courants sur un compte accessible depuis Internet.",
      signes: ["03:12  sshd : 412 « Failed password for admin » depuis 203.0.113.7 en 9 minutes", "03:21  sshd : « Accepted password for admin » depuis 203.0.113.7", "03:22  sudo : admin lance une création de compte"],
      bloque: ["mfa", "blocage"], proches: ["bourrage", "faille-connue", "interne"],
      bonne: "Bloquer l'adresse, désactiver le compte admin et rechercher ce que l'intrus a créé",
      fausses: ["Redémarrer le serveur pour fermer la session", "Bloquer l'adresse sur le pare-feu, puis classer l'incident", "Effacer le journal pour repartir sur une base propre"],
      expl: "Des centaines d'échecs puis une réussite depuis la même adresse : la force brute a abouti. Bloquer l'adresse ne suffit plus, l'intrus est déjà entré : on neutralise le compte et on cherche sa persistance. Et on n'efface jamais un journal, c'est la preuve." },
    { id: "bourrage", nom: "Bourrage d'identifiants", cout: 2, cible: "Portail client", chap: "secu-authentification",
      principe: "Des couples identifiant / mot de passe issus de la fuite d'un autre site sont rejoués tels quels : ceux qui réutilisent leur mot de passe sont pris.",
      signes: ["Portail : 3 000 tentatives de connexion en une heure, sur 2 900 comptes différents", "Chaque adresse IP n'essaie qu'un ou deux comptes, puis change", "41 connexions réussies du premier coup, sur des comptes inactifs depuis des mois"],
      bloque: ["mfa", "mdp"], proches: ["force-brute", "hameconnage", "deni-service"],
      bonne: "Réinitialiser les mots de passe des comptes touchés et prévenir leurs titulaires",
      fausses: ["Bloquer l'adresse IP qui a fait le plus de tentatives", "Allonger la durée de session du portail", "Attendre : aucun compte administrateur n'est touché"],
      expl: "Un ou deux essais par compte depuis des milliers d'adresses : ce n'est pas une force brute, ce sont des mots de passe déjà fuités ailleurs. Bloquer une adresse ne sert à rien. Les comptes ouverts sont réinitialisés et leurs titulaires prévenus." },
    { id: "injection-sql", nom: "Injection SQL", cout: 2, cible: "Site web", chap: "secu-injections",
      principe: "Une saisie du visiteur est collée dans une requête SQL : en y glissant du SQL, on fait lire à la base ce qu'elle ne devait pas montrer.",
      signes: ["Journal web : des centaines de requêtes sur /produit où l'identifiant contient une apostrophe et le mot UNION", "Base de données : une requête a lu toute la table clients à 02:47", "Aucune connexion administrateur à cette heure-là"],
      bloque: ["devsec", "waf"], proches: ["xss", "televersement", "faille-connue"],
      bonne: "Mettre la page hors ligne, corriger par une requête préparée, puis évaluer les données lues",
      fausses: ["Changer le mot de passe de l'administrateur du site", "Ajouter un filtre qui retire le mot UNION des adresses", "Restaurer la base depuis la sauvegarde de la veille"],
      expl: "Du SQL dans un paramètre et une lecture massive de table : injection SQL. La vraie correction est la requête préparée ; filtrer un mot se contourne. Restaurer ne sert à rien, les données ont été lues, pas modifiées : il faut informer les personnes concernées et la CNIL." },
    { id: "xss", nom: "XSS stocké", cout: 2, cible: "Site web (commentaires)", chap: "secu-injections",
      principe: "Un commentaire contenant du JavaScript est enregistré par le site, puis exécuté dans le navigateur de chaque visiteur.",
      signes: ["Des clients signalent être redirigés ailleurs en ouvrant la page d'un produit", "Le dernier commentaire publié contient une balise script", "Les navigateurs des visiteurs envoient leur cookie de session vers un domaine inconnu"],
      bloque: ["devsec", "waf"], proches: ["injection-sql", "faux-wifi", "hameconnage"],
      bonne: "Retirer le commentaire, invalider les sessions en cours et échapper l'affichage des commentaires",
      fausses: ["Demander aux clients de vider leur cache", "Bloquer le compte qui a posté, sans toucher à la page", "Désactiver HTTPS le temps de l'analyse"],
      expl: "Le script s'exécute chez les visiteurs, pas sur le serveur : c'est un XSS stocké. Les sessions volées doivent être invalidées, et la page doit échapper tout ce qu'elle réaffiche. Bloquer un compte n'empêche pas d'en créer un autre." },
    { id: "televersement", nom: "Dépôt de fichier piégé", cout: 2, cible: "Formulaire d'envoi", chap: "cyber-protections",
      principe: "Le formulaire « envoyer une photo » accepte n'importe quel fichier : un script est déposé à la place d'une image, et le serveur l'exécute.",
      signes: ["Dossier des images envoyées : un fichier « avatar.php » déposé à 01:33", "Journal web : ce fichier est appelé toutes les 30 secondes depuis une seule adresse", "Le processus du serveur web lance des commandes système"],
      bloque: ["devsec", "durcissement"], proches: ["faille-connue", "injection-sql", "dependance"],
      bonne: "Isoler le serveur du réseau, garder une copie pour l'enquête, puis réinstaller depuis une source saine",
      fausses: ["Supprimer le fichier et reprendre l'activité", "Renommer le fichier en .jpg", "Redémarrer le serveur web"],
      expl: "Un script parmi les images, appelé régulièrement : le serveur est piloté à distance. Supprimer le fichier ne suffit pas, on ignore ce qui a déjà été installé : on isole, on conserve les preuves, on reconstruit. Parade : vérifier le type réel du fichier, le renommer, interdire l'exécution dans le dossier de dépôt." },
    { id: "rancongiciel", nom: "Rançongiciel", cout: 3, cible: "Postes et serveur de fichiers", chap: "cyber-attaques",
      principe: "Une pièce jointe piégée chiffre les fichiers du poste puis ceux des partages réseau ; une rançon est réclamée pour la clé.",
      signes: ["08:03  Le poste de l'accueil ouvre la pièce jointe « facture.zip »", "08:15  Trois postes affichent une demande de rançon", "Serveur de fichiers : 200 documents par minute sont renommés avec une extension inconnue"],
      bloque: ["edr", "sauvegardes"], proches: ["usb", "lateral", "deni-service"],
      bonne: "Débrancher du réseau les machines touchées, sans les éteindre, et donner l'alerte",
      fausses: ["Payer vite la rançon pour limiter l'arrêt", "Éteindre toutes les machines de l'entreprise", "Lancer une analyse antivirus sur le serveur et attendre"],
      expl: "Le chiffrement se propage par le réseau : la priorité est d'en couper les machines touchées. On ne les éteint pas (leur mémoire sert à l'enquête) et on ne paie pas, rien ne garantit la restitution. Des sauvegardes hors ligne testées permettent de tout restaurer." },
    { id: "faille-connue", nom: "Faille connue non corrigée", cout: 2, cible: "Serveur web", chap: "cyber-pentest",
      principe: "Le site tourne sur un logiciel dont une faille est publique et corrigée depuis des mois, mais la mise à jour n'a jamais été faite.",
      signes: ["Le gestionnaire de contenu du site n'a pas été mis à jour depuis 14 mois", "Journal web : un balayage automatique teste des adresses propres à cette version", "Un compte administrateur « maint » existe sur le site ; personne ne l'a créé"],
      bloque: ["correctifs"], proches: ["force-brute", "televersement", "defaut"],
      bonne: "Supprimer le compte inconnu, appliquer le correctif et vérifier ce qui a été modifié",
      fausses: ["Masquer le numéro de version et ne rien changer d'autre", "Supprimer le compte inconnu, sans mettre à jour", "Changer le thème du site"],
      expl: "Une version ancienne, un balayage qui la reconnaît, un compte sorti de nulle part : une faille publique a été exploitée. Tant que le correctif n'est pas appliqué, la porte reste ouverte. Cacher la version ne ralentit que les curieux." },
    { id: "faux-wifi", nom: "Faux point d'accès Wi-Fi", cout: 2, cible: "Wi-Fi", chap: "cyber-reseau",
      principe: "Une borne portant le même nom que le Wi-Fi de l'entreprise attire les appareils : l'attaquant se retrouve entre eux et Internet.",
      signes: ["Deux réseaux « Atelier-Morel » sont visibles, dont un sans cadenas", "Des salariés voient des alertes de certificat sur leurs sites habituels", "Des appareils sont associés à une borne qui n'appartient pas à l'entreprise"],
      bloque: ["chiffrement"], proches: ["xss", "hameconnage", "deni-service"],
      bonne: "Prévenir de ne pas s'y connecter, localiser la borne pirate et changer les mots de passe saisis entre-temps",
      fausses: ["Dire d'accepter les alertes de certificat pour continuer à travailler", "Renommer le Wi-Fi de l'entreprise et s'arrêter là", "Augmenter la puissance de la borne officielle"],
      expl: "Un réseau jumeau et des alertes de certificat : quelqu'un s'est placé au milieu des échanges. Une alerte de certificat ne s'accepte jamais. Avec HTTPS partout, un VPN et un Wi-Fi d'entreprise, l'interception ne donne rien de lisible." },
    { id: "usb", nom: "Clé USB piégée", cout: 1, cible: "Postes", chap: "cyber-social",
      principe: "Des clés étiquetées « Salaires 2026 » sont laissées sur le parking : la curiosité fait le reste.",
      signes: ["Un salarié a branché une clé trouvée devant l'entrée", "Son poste a lancé un programme inconnu juste après", "Le poste contacte une adresse externe toutes les 60 secondes"],
      bloque: ["sensibilisation", "edr"], proches: ["rancongiciel", "hameconnage", "dependance"],
      bonne: "Isoler le poste du réseau et remettre la clé au service informatique sans la rebrancher",
      fausses: ["Brancher la clé sur un autre poste pour voir ce qu'elle contient", "Formater la clé et la réutiliser", "Laisser le poste tourner pour ne pas alerter l'attaquant"],
      expl: "Un programme lancé au branchement puis des appels réguliers vers l'extérieur : le poste est sous contrôle. On l'isole, et on ne rebranche la clé nulle part. Un salarié formé l'aurait apportée au service informatique sans la brancher." },
    { id: "deni-service", nom: "Déni de service", cout: 2, cible: "Site web", chap: "cyber-reseau",
      principe: "Des milliers de machines envoient en même temps des requêtes au site : il sature et devient inaccessible.",
      signes: ["Le site ne répond plus depuis 10:02", "Pare-feu : 80 000 requêtes par seconde, depuis 12 000 adresses différentes", "Aucune connexion suspecte, aucun fichier modifié"],
      bloque: ["antiddos"], proches: ["bourrage", "force-brute", "rancongiciel"],
      bonne: "Contacter l'hébergeur pour activer le filtrage du trafic en amont",
      fausses: ["Bloquer les adresses une par une sur le pare-feu", "Redémarrer le serveur en boucle", "Restaurer le site depuis la sauvegarde"],
      expl: "C'est la disponibilité qui est visée : rien n'est volé ni modifié. Douze mille adresses ne se bloquent pas à la main, et le serveur n'a rien à restaurer : le filtrage doit se faire avant lui, chez l'hébergeur ou un service spécialisé." },
    { id: "interne", nom: "Compte oublié d'un ancien salarié", cout: 2, cible: "Serveur de fichiers", chap: "cyber-systeme",
      principe: "Le compte d'un salarié parti il y a deux mois n'a jamais été fermé : il fonctionne toujours, avec tous ses droits.",
      signes: ["23:40  Connexion au VPN du compte « p.martin », qui a quitté l'entreprise en septembre", "Ce compte copie tout le dossier « Clients » en 20 minutes", "Aucun échec de connexion : le mot de passe était le bon"],
      bloque: ["comptes"], proches: ["force-brute", "bourrage", "lateral"],
      bonne: "Désactiver le compte, couper sa session et faire l'inventaire de ce qui a été copié",
      fausses: ["Changer le mot de passe du Wi-Fi", "Écrire au compte pour demander des explications", "Supprimer le dossier « Clients » du serveur"],
      expl: "Aucun échec, un compte légitime, mais d'une personne partie : personne n'a fermé l'accès. La revue des comptes et la fermeture le jour du départ l'auraient évité. Les données copiées sont une violation à déclarer." },
    { id: "president", nom: "Fraude au président", cout: 2, cible: "Comptabilité", chap: "cyber-social",
      principe: "Un appel puis un courriel pressant, au nom du dirigeant, réclament un virement « urgent et confidentiel » vers un nouveau compte.",
      signes: ["La comptable a reçu un appel « du directeur » exigeant un virement urgent et confidentiel", "Le courriel de confirmation vient de « direction@atelier-rnorel.example » : r et n à la place du m", "Le virement de 38 000 € est parti il y a une heure"],
      bloque: ["double", "sensibilisation"], proches: ["hameconnage", "interne", "bourrage"],
      bonne: "Appeler tout de suite la banque pour demander le rappel du virement, puis déposer plainte",
      fausses: ["Répondre au courriel pour réclamer le remboursement", "Attendre le retour du directeur lundi pour vérifier", "Bloquer le domaine imité et considérer l'affaire close"],
      expl: "Urgence, secret, autorité : les trois leviers de l'ingénierie sociale, sans aucune faille technique. Un virement peut parfois être rappelé dans les premières heures : chaque minute compte. Une double validation sur un numéro déjà connu aurait arrêté la fraude." },
    { id: "lateral", nom: "Rebond dans le réseau", cout: 3, cible: "Réseau interne", chap: "cyber-reseau",
      principe: "Depuis un premier poste compromis, l'attaquant passe de machine en machine jusqu'au serveur : tout le réseau se voit, et le même mot de passe administrateur sert partout.",
      signes: ["Le poste de l'accueil ouvre des sessions sur 14 autres postes en 5 minutes", "Le même compte administrateur local est utilisé sur chacun", "Il tente maintenant d'atteindre le serveur de fichiers"],
      bloque: ["segmentation", "comptes"], proches: ["rancongiciel", "interne", "force-brute"],
      bonne: "Isoler le poste d'origine et les machines atteintes, puis changer les mots de passe administrateur",
      fausses: ["Redémarrer le poste de l'accueil", "Surveiller sans intervenir pour voir jusqu'où il va", "Changer uniquement le mot de passe de l'utilisateur de l'accueil"],
      expl: "Un poste qui se connecte à tous les autres avec le même compte : l'attaquant se déplace latéralement. Dans un réseau segmenté, le poste de l'accueil n'aurait jamais pu joindre les autres, et un mot de passe administrateur différent par machine aurait limité la casse à une seule." },
    { id: "secret", nom: "Secret publié par erreur", cout: 1, cible: "Dépôt de code", chap: "cyber-protections",
      principe: "Un fichier contenant une clé d'API a été poussé sur un dépôt public : des robots parcourent ces dépôts en permanence.",
      signes: ["La facture du service cloud a été multipliée par 40 en deux jours", "Des appels à l'API partent de pays où l'entreprise n'a aucune activité", "Le fichier « .env » apparaît dans l'historique du dépôt public depuis mardi"],
      bloque: ["secrets"], proches: ["bourrage", "interne", "dependance"],
      bonne: "Révoquer la clé immédiatement et en créer une nouvelle",
      fausses: ["Supprimer le fichier du dépôt par un nouveau commit", "Passer le dépôt en privé et garder la même clé", "Attendre la fin du mois pour contester la facture"],
      expl: "Une clé publiée est une clé compromise, définitivement : elle reste dans l'historique et a déjà été copiée. La seule réponse est de la révoquer. Un coffre à secrets et une analyse du dépôt avant l'envoi auraient évité la fuite." },
    { id: "defaut", nom: "Mot de passe d'usine", cout: 1, cible: "Objets connectés", chap: "cyber-systeme",
      principe: "La caméra, l'imprimante ou le routeur ont gardé l'identifiant et le mot de passe d'origine, publiés dans la notice.",
      signes: ["La caméra de l'entrepôt est joignable depuis Internet", "Connexion à son interface avec le compte « admin » d'origine, jamais modifié", "Elle envoie du trafic vers des milliers d'adresses : elle fait partie d'un réseau de machines zombies"],
      bloque: ["durcissement"], proches: ["force-brute", "deni-service", "faille-connue"],
      bonne: "La déconnecter, la réinitialiser, changer son mot de passe et fermer son accès depuis Internet",
      fausses: ["La redémarrer", "Changer le mot de passe du Wi-Fi", "La laisser : ce n'est qu'une caméra"],
      expl: "Aucun mot de passe n'a été deviné : il était dans la notice. Un objet connecté enrôlé sert à attaquer d'autres victimes et offre un pied dans le réseau. Durcir, c'est changer les réglages d'usine et couper ce qui n'a pas à être exposé." },
    { id: "dependance", nom: "Dépendance piégée", cout: 3, cible: "Application", chap: "cyber-crypto",
      principe: "Une bibliothèque utilisée par l'application est remplacée par une version piégée : le code malveillant arrive par une mise à jour ordinaire.",
      signes: ["Depuis le déploiement de mardi, l'application contacte un serveur inconnu au démarrage", "Une dépendance a changé de version sans que personne ne l'ait décidé", "L'empreinte du paquet installé ne correspond pas à celle publiée par son auteur"],
      bloque: ["integrite"], proches: ["faille-connue", "usb", "televersement"],
      bonne: "Revenir à la version précédente vérifiée, puis renouveler les secrets auxquels l'application avait accès",
      fausses: ["Bloquer le serveur inconnu sur le pare-feu et garder la nouvelle version", "Mettre à jour toutes les autres dépendances au passage", "Désactiver l'outil qui signale la bibliothèque"],
      expl: "Une empreinte qui ne correspond plus : le paquet n'est pas celui de son auteur. C'est une attaque par la chaîne d'approvisionnement. On revient à une version sûre, et tout secret que le code piégé a pu lire est considéré comme volé." }
  ];
  var IA = {}, IP = {};
  ATT.forEach(function (a, i) { IA[a.id] = i; });
  PROT.forEach(function (p, i) { IP[p.id] = i; });
  function A(id) { return ATT[IA[id]]; }
  function P(id) { return PROT[IP[id]]; }

  var NIVEAUX = [{ nom: "Facile", n: 4, budget: 13 }, { nom: "Normal", n: 5, budget: 11 }, { nom: "Difficile", n: 6, budget: 10, ruse: true }];
  var PTS_D = [3, 1, 0, 0], PTS_A = [0, 1, 2, 3];   /* résultat d'une attaque : 0 bloquée, 1 contenue, 2 subie, 3 réussie */
  var CIBLES = [
    { nom: "Association de quartier", budget: 6, talent: .3, texte: "Trois bénévoles, un seul ordinateur, personne pour l'informatique." },
    { nom: "PME Atelier Morel", budget: 11, talent: .6, texte: "Quarante salariés, un technicien à mi-temps." },
    { nom: "Banque régionale", budget: 22, talent: .9, texte: "Une équipe de sécurité qui veille jour et nuit." }
  ];
  var BUDGET_D = 11;

  /* ---------- petits outils ---------- */
  function melange(t) { t = t.slice(); for (var i = t.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = t[i]; t[i] = t[j]; t[j] = x; } return t; }
  function somme(ids, tab) { return ids.reduce(function (s, id) { return s + tab(id).cout; }, 0); }
  function pluriel(n, mot) { return n + " " + mot + (n > 1 ? "s" : ""); }
  function nomPropre(s) { return String(s || "").replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 20); }
  function stats() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function noter(role, gagne) {
    try {
      var s = stats(); s[role] = s[role] || { j: 0, v: 0 }; s[role].j++; if (gagne) s[role].v++;
      localStorage.setItem(KEY, JSON.stringify(s));
      if (window.EtudeFacile && window.EtudeFacile.activite) window.EtudeFacile.activite();
    } catch (e) { /* stockage indisponible : le duel reste jouable */ }
  }

  /* Liens de défi : JSON brouillé (XOR + Base64). Ce n'est pas un chiffrement, juste de quoi ne pas lire l'attaque d'un coup d'œil. */
  var CLE = "etude-facile-duel";
  function brouille(s) { var o = ""; for (var i = 0; i < s.length; i++) o += String.fromCharCode(s.charCodeAt(i) ^ CLE.charCodeAt(i % CLE.length)); return o; }
  function encode(o) { return btoa(unescape(encodeURIComponent(brouille(JSON.stringify(o))))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
  function decode(c) {
    try {
      var o = JSON.parse(brouille(decodeURIComponent(escape(atob(c.replace(/-/g, "+").replace(/_/g, "/"))))));
      if (!o || o.v !== 1 || !Array.isArray(o.a)) return null;
      var vus = {}, ok = o.a.length >= MIN_A && o.a.length <= MAX_A && o.a.every(function (i) { var b = Number.isInteger(i) && i >= 0 && i < ATT.length && !vus[i]; vus[i] = 1; return b; });
      if (!ok) return null;
      var r = { n: nomPropre(o.n) || "Un élève", a: o.a.map(function (i) { return ATT[i].id; }) };
      if (somme(r.a, A) > BUDGET_A) return null;
      if (o.r) {
        if (!Array.isArray(o.r) || o.r.length !== o.a.length || !Array.isArray(o.p)) return null;
        r.d = nomPropre(o.d) || "Un élève";
        r.p = o.p.filter(function (i) { return Number.isInteger(i) && i >= 0 && i < PROT.length; }).map(function (i) { return PROT[i].id; });
        r.r = o.r.map(function (x) { return x === 3 || x === 2 || x === 1 ? x : 0; });
      }
      return r;
    } catch (e) { return null; }
  }
  function lien(prefixe, o) { return location.origin + location.pathname + "#" + prefixe + "=" + encode(o); }

  /* ---------- squelette ---------- */
  document.body.appendChild(EF.header("../../"));
  var main = el("main", "wrap page duel c-secu");
  document.body.appendChild(main);
  var S = null, tic = null;
  function stop() { if (tic) { clearInterval(tic); tic = null; } }
  function ecran(html, etape) {
    stop();
    main.innerHTML =
      '<nav class="crumbs"><a href="../../index.html">Accueil</a><span>›</span><a href="index.html">Cybersécurité</a><span>›</span>' + (etape ? '<a href="duel.html" data-accueil>Duel</a><span>›</span><span>' + esc(etape) + '</span>' : '<span>Duel attaque / défense</span>') + '</nav>' + html;
    var a = main.querySelector("[data-accueil]");
    if (a) a.addEventListener("click", function (e) { e.preventDefault(); history.replaceState(null, "", location.pathname); accueil(); });
    window.scrollTo(0, 0);
    var h = main.querySelector("h1, h2"); if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); }
  }
  function clic(sel, f) { Array.prototype.forEach.call(main.querySelectorAll(sel), function (b) { b.addEventListener("click", function (e) { f(b, e); }); }); }

  /* ---------- accueil ---------- */
  function accueil() {
    S = null;
    var s = stats(), d = s.def || { j: 0, v: 0 }, a = s.att || { j: 0, v: 0 };
    ecran(
      '<div class="page-head c-secu"><div class="ico">VS</div><div><h1>Duel attaque / défense</h1><div class="sub">Un joueur compose une attaque, l\'autre protège une entreprise et traite les incidents.</div></div></div>' +
      '<p class="lead">L\'attaquant choisit ses attaques avec ' + BUDGET_A + ' points d\'action. Le défenseur, sans les connaître, achète ses protections avec un budget serré. Ce qui n\'est pas bloqué devient un incident : il faut le reconnaître et réagir, en ' + CHRONO + ' secondes.</p>' +
      '<div class="duel-modes">' +
        '<section class="duel-mode bleu"><span class="tag">Seul · défense</span><h2>Défendre contre l\'ordinateur</h2><p>L\'ordinateur prépare une attaque. À toi de protéger l\'Atelier Morel.</p><div class="chips" data-niveaux>' +
          NIVEAUX.map(function (n, i) { return '<button class="chip" data-niveau="' + i + '" aria-pressed="' + (i === 1) + '">' + n.nom + '</button>'; }).join("") + '</div><button class="btn primary" data-mode="solo">Défendre →</button></section>' +
        '<section class="duel-mode rouge"><span class="tag">Seul · attaque</span><h2>Attaquer l\'ordinateur</h2><p>Compose ton plan et vois ce qui passe selon la cible.</p><div class="chips" data-cibles>' +
          CIBLES.map(function (c, i) { return '<button class="chip" data-cible="' + i + '" aria-pressed="' + (i === 1) + '">' + esc(c.nom) + '</button>'; }).join("") + '</div><button class="btn primary" data-mode="cible">Attaquer →</button></section>' +
        '<section class="duel-mode"><span class="tag">À deux · même appareil</span><h2>Face à face</h2><p>L\'un compose l\'attaque en cachant l\'écran, puis passe l\'appareil à l\'autre, qui défend.</p><button class="btn primary" data-mode="deux">Commencer →</button></section>' +
        '<section class="duel-mode"><span class="tag">À deux · à distance</span><h2>Défier un ami</h2><p>Compose ton attaque et envoie le lien. Ton ami défend quand il veut, puis te renvoie le résultat.</p><button class="btn primary" data-mode="lien">Créer un défi →</button></section>' +
        '<section class="duel-mode" style="background:var(--m-clair)"><span class="tag">Pour aller plus loin · code</span><h2>Atelier de code</h2><p>Écris toi-même l\'exploit contre un code vulnérable, puis corrige-le : injection SQL, XSS, contrôle d\'accès, chemins, commandes.</p><a class="btn primary" href="atelier.html">Ouvrir l\'atelier →</a></section>' +
      '</div>' +
      '<p class="duel-stats"><b>Tes duels</b> · en défense : ' + d.v + ' gagné' + (d.v > 1 ? "s" : "") + ' sur ' + d.j + ' · en attaque : ' + a.v + ' gagné' + (a.v > 1 ? "s" : "") + ' sur ' + a.j + '</p>' +
      '<div class="box attention"><b>Une simulation, et rien d\'autre</b><p>Aucune attaque n\'est réellement lancée : tu manipules des fiches, pas des outils. Dans la réalité, s\'introduire dans un système sans autorisation écrite de son propriétaire est un délit (article 323-1 du Code pénal), même « pour tester ».</p></div>' +
      '<details class="duel-regles"><summary>Comment sont comptés les points ?</summary><p>Chaque attaque est jugée séparément.</p><ul><li><b>Bloquée</b> par une protection : 3 points pour la défense.</li><li><b>Contenue</b> (attaque reconnue et bonne réaction) : 1 point pour chaque camp.</li><li><b>Subie</b> (une seule bonne réponse) : 2 points pour l\'attaque.</li><li><b>Réussie</b> (aucune bonne réponse, ou temps écoulé) : 3 points pour l\'attaque.</li></ul><p>Bien réagir limite les dégâts, mais seule une protection choisie à l\'avance arrête vraiment une attaque : prévenir vaut mieux que guérir.</p></details>');
    var niveau = 1, cible = 1;
    clic("[data-niveau]", function (b) { niveau = +b.dataset.niveau; Array.prototype.forEach.call(b.parentNode.children, function (x) { x.setAttribute("aria-pressed", x === b); }); });
    clic("[data-cible]", function (b) { cible = +b.dataset.cible; Array.prototype.forEach.call(b.parentNode.children, function (x) { x.setAttribute("aria-pressed", x === b); }); });
    clic("[data-mode]", function (b) {
      var m = b.dataset.mode;
      S = { mode: m, att: [], prot: [], res: [], budget: BUDGET_D, nomA: "", nomD: "" };
      if (m === "solo") {
        var N = NIVEAUX[niveau]; S.budget = N.budget; S.nomA = "L'ordinateur"; S.niveau = N.nom;
        S.att = planOrdinateur(N.n, N.ruse);
        acheter();
      } else {
        if (m === "cible") S.cible = CIBLES[cible];
        composer();
      }
    });
  }
  function planOrdinateur(n, ruse) {   /* ruse : l'ordinateur préfère les attaques qu'une seule protection arrête */
    var plan = [], reste = BUDGET_A + 2, pool = melange(ATT);
    if (ruse) pool.sort(function (x, y) { return (x.bloque.length - y.bloque.length) * (Math.random() < .8 ? 1 : -1); });
    for (var i = 0; i < pool.length && plan.length < n; i++) if (pool[i].cout <= reste - (n - plan.length - 1)) { plan.push(pool[i].id); reste -= pool[i].cout; }
    return plan;
  }

  /* ---------- l'attaquant compose son plan ---------- */
  function composer() {
    var titre = S.mode === "cible" ? "Cible : " + S.cible.nom : S.mode === "deux" ? "Attaquant : compose ton plan" : "Compose ton attaque";
    ecran(
      '<h1 class="duel-h">' + esc(titre) + '</h1>' +
      '<p class="lead">' + (S.mode === "cible" ? esc(S.cible.texte) + " " : S.mode === "deux" ? "Le défenseur ne doit pas voir l'écran. " : "") + 'Choisis de ' + MIN_A + ' à ' + MAX_A + ' attaques, pour ' + BUDGET_A + ' points d\'action au plus. Elles seront jouées dans l\'ordre où tu les choisis.</p>' +
      '<div class="duel-barre rouge" role="status"><span data-compte></span><button class="btn primary" data-valider disabled>Valider le plan →</button></div>' +
      '<div class="duel-cartes">' + ATT.map(function (a) {
        return '<button class="duel-carte" data-att="' + a.id + '" aria-pressed="false"><span class="dc-haut"><b>' + esc(a.nom) + '</b><span class="dc-cout">' + a.cout + ' pt' + (a.cout > 1 ? "s" : "") + '</span></span><span class="tag">' + esc(a.cible) + '</span><span class="dc-texte">' + esc(a.principe) + '</span><span class="dc-rang" aria-hidden="true"></span></button>';
      }).join("") + '</div>', "Attaque");
    function maj() {
      var c = somme(S.att, A), ok = S.att.length >= MIN_A && S.att.length <= MAX_A && c <= BUDGET_A;
      main.querySelector("[data-compte]").innerHTML = '<b>' + c + ' / ' + BUDGET_A + '</b> points · ' + pluriel(S.att.length, "attaque") + (c > BUDGET_A ? ' · <span class="duel-trop">budget dépassé</span>' : S.att.length < MIN_A ? ' · encore ' + (MIN_A - S.att.length) : "");
      main.querySelector("[data-valider]").disabled = !ok;
      Array.prototype.forEach.call(main.querySelectorAll("[data-att]"), function (b) {
        var r = S.att.indexOf(b.dataset.att);
        b.setAttribute("aria-pressed", r >= 0); b.querySelector(".dc-rang").textContent = r >= 0 ? r + 1 : "";
      });
    }
    clic("[data-att]", function (b) {
      var id = b.dataset.att, r = S.att.indexOf(id);
      if (r >= 0) S.att.splice(r, 1); else if (S.att.length < MAX_A) S.att.push(id);
      maj();
    });
    clic("[data-valider]", function () {
      if (S.mode === "cible") return simuler();
      if (S.mode === "deux") return passation();
      partagerDefi();
    });
    maj();
  }

  function champLien(url, texte) {
    return '<div class="duel-lien"><input type="text" readonly value="' + esc(url) + '" aria-label="Lien à envoyer"><div class="btns"><button class="btn primary" data-copier>Copier le lien</button>' +
      (navigator.share ? '<button class="btn" data-partager data-texte="' + esc(texte) + '">Partager…</button>' : "") + '</div><p class="lb-small" data-copie role="status"></p></div>';
  }
  function brancheLien() {
    var champ = main.querySelector(".duel-lien input");
    clic("[data-copier]", function () {
      function fini(ok) { main.querySelector("[data-copie]").textContent = ok ? "Lien copié : colle-le dans un message." : "Copie impossible : sélectionne le lien à la main."; }
      champ.select();
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(champ.value).then(function () { fini(true); }, function () { fini(false); });
      else { try { fini(document.execCommand("copy")); } catch (e) { fini(false); } }
    });
    clic("[data-partager]", function (b) { navigator.share({ title: "Duel attaque / défense", text: b.dataset.texte, url: champ.value }).catch(function () { /* partage annulé */ }); });
  }

  function partagerDefi() {
    ecran('<h1 class="duel-h">Ton défi est prêt</h1><p class="lead">Signe ton attaque, puis envoie le lien à l\'élève que tu défies. Il ne verra tes attaques qu\'en les subissant.</p>' +
      '<label class="duel-nom">Ton prénom ou pseudo <input type="text" maxlength="20" autocomplete="nickname" data-nom placeholder="Anonyme"></label><div data-zone></div>' +
      '<div class="box"><b>Et ensuite ?</b><p>À la fin de sa partie, ton adversaire obtient un lien de résultat à te renvoyer : tu y verras ce qui est passé et ce qu\'il a bloqué. Tu peux aussi coller le lien de défi sur le forum du site.</p></div>' +
      '<div class="btns"><button class="btn" data-retour>Revenir à l\'accueil du duel</button></div>', "Défi");
    function maj() {
      var nom = nomPropre(main.querySelector("[data-nom]").value);
      main.querySelector("[data-zone]").innerHTML = champLien(lien("d", { v: 1, n: nom, a: S.att.map(function (id) { return IA[id]; }) }), (nom || "Un élève") + " te défie en cybersécurité : sauras-tu défendre ?");
      brancheLien();
    }
    main.querySelector("[data-nom]").addEventListener("input", maj);
    clic("[data-retour]", accueil);
    maj();
  }

  function passation() {
    ecran('<div class="duel-passe"><div class="ico">VS</div><h1 class="duel-h">Passe l\'appareil au défenseur</h1><p class="lead">Le plan d\'attaque est enregistré : ' + pluriel(S.att.length, "attaque") + ' en attente. Défenseur, à toi de jouer quand tu es prêt.</p><button class="btn primary" data-suite>Je suis le défenseur →</button></div>', "Passation");
    clic("[data-suite]", acheter);
  }

  /* ---------- le défenseur achète ses protections ---------- */
  function acheter() {
    S.prot = [];
    ecran(
      '<h1 class="duel-h">Défenseur : protège l\'Atelier Morel</h1>' +
      '<p class="lead">' + (S.mode === "lien" ? '<b>' + esc(S.nomA) + '</b> te défie. ' : "") + 'Quarante salariés, un site marchand, une messagerie, un serveur de fichiers, du Wi-Fi. ' + pluriel(S.att.length, "attaque") + ' arrive' + (S.att.length > 1 ? "nt" : "") + ', tu ne sais pas lesquelles. Tu as <b>' + S.budget + ' crédits</b> : impossible de tout acheter, il faut choisir.</p>' +
      '<div class="duel-barre bleu" role="status"><span data-compte></span><button class="btn primary" data-valider>Lancer la simulation →</button></div>' +
      '<div class="duel-cartes">' + PROT.map(function (p) {
        return '<button class="duel-carte" data-prot="' + p.id + '" aria-pressed="false"><span class="dc-haut"><b>' + esc(p.nom) + '</b><span class="dc-cout">' + p.cout + ' cr.</span></span><span class="dc-texte">' + esc(p.quoi) + '</span></button>';
      }).join("") + '</div>', "Défense");
    function maj() {
      var c = somme(S.prot, P);
      main.querySelector("[data-compte]").innerHTML = '<b>' + c + ' / ' + S.budget + '</b> crédits · ' + pluriel(S.prot.length, "protection");
      Array.prototype.forEach.call(main.querySelectorAll("[data-prot]"), function (b) {
        var pris = S.prot.indexOf(b.dataset.prot) >= 0;
        b.setAttribute("aria-pressed", pris); b.disabled = !pris && c + P(b.dataset.prot).cout > S.budget;
      });
    }
    clic("[data-prot]", function (b) {
      var id = b.dataset.prot, r = S.prot.indexOf(id);
      if (r >= 0) S.prot.splice(r, 1); else if (somme(S.prot, P) + P(id).cout <= S.budget) S.prot.push(id);
      maj();
    });
    clic("[data-valider]", function () { S.res = []; S.detail = []; tour(0); });
    maj();
  }

  function bloqueurs(a, prot) { return a.bloque.filter(function (id) { return prot.indexOf(id) >= 0; }); }
  function entete(i, faits) {   /* faits : nombre d'attaques déjà jugées, comptées dans le score affiché */
    var sc = scores(S.res.slice(0, faits)), d = sc.d, at = sc.a;
    return '<div class="duel-score"><span class="bleu"><small>Défense</small><b>' + d + '</b></span><span class="duel-etape">Attaque ' + (i + 1) + ' / ' + S.att.length + '</span><span class="rouge"><small>Attaque</small><b>' + at + '</b></span></div>';
  }
  function parades(a) { return a.bloque.map(function (id) { return esc(P(id).nom); }).join(" ou "); }

  /* ---------- déroulement : une attaque après l'autre ---------- */
  function tour(i) {
    if (i >= S.att.length) return bilan();
    var a = A(S.att[i]), bl = bloqueurs(a, S.prot);
    if (bl.length) {
      S.res[i] = 0; S.detail[i] = { bloque: bl };
      ecran(entete(i, i + 1) +
        '<div class="duel-verdict ok"><span class="tag">Bloquée</span><h1 class="duel-h">' + esc(a.nom) + '</h1><p><b>Arrêtée par :</b> ' + bl.map(function (id) { return esc(P(id).nom); }).join(", ") + '.</p><p>' + esc(a.principe) + '</p>' +
        '<p class="lb-small">3 points pour la défense. <a href="' + a.chap + '.html">Revoir le cours</a></p></div>' +
        '<div class="btns"><button class="btn primary" data-suite>' + (i + 1 < S.att.length ? "Attaque suivante →" : "Voir le bilan →") + '</button></div>', "Simulation");
      clic("[data-suite]", function () { tour(i + 1); });
      return;
    }
    S.res[i] = 3; S.detail[i] = { id: false, re: false };
    var aide = S.prot.indexOf("supervision") >= 0;
    var noms = melange([a.id].concat(aide ? a.proches.slice(0, 1) : a.proches));
    var reactions = melange([a.bonne].concat(a.fausses));
    ecran(entete(i, i) +
      '<div class="duel-incident"><span class="tag">Incident en cours · ' + esc(a.cible) + '</span><h1 class="duel-h">Que se passe-t-il ?</h1>' +
      '<div class="duel-journal" aria-label="Signes observés">' + a.signes.map(function (s) { return '<div>' + esc(s) + '</div>'; }).join("") + '</div>' +
      '<div class="duel-chrono" aria-hidden="true"><i></i></div><p class="lb-small" data-temps></p>' +
      '<div data-question></div><div data-retour role="status" aria-live="polite"></div></div>', "Simulation");
    var zone = main.querySelector("[data-question]"), retour = main.querySelector("[data-retour]");
    function chrono(fin) {
      stop();
      var t0 = Date.now(), barre = main.querySelector(".duel-chrono i"), txt = main.querySelector("[data-temps]");
      function pas() {
        var reste = CHRONO - (Date.now() - t0) / 1000;
        barre.style.width = Math.max(0, reste / CHRONO * 100) + "%"; txt.textContent = Math.max(0, Math.ceil(reste)) + " s";
        if (reste <= 0) { stop(); fin(); }
      }
      pas(); tic = setInterval(pas, 250);
    }
    function question(titre, choix, bon, suite) {
      zone.innerHTML = '<h2 class="duel-q">' + esc(titre) + '</h2><div class="duel-choix">' + choix.map(function (c, k) { return '<button class="btn" data-k="' + k + '">' + esc(c) + '</button>'; }).join("") + '</div>';
      var fait = false;
      function repond(k) {
        if (fait) return; fait = true; stop();
        Array.prototype.forEach.call(zone.querySelectorAll("[data-k]"), function (b, n) { b.disabled = true; if (choix[n] === bon) b.classList.add("ok"); else if (n === k) b.classList.add("ko"); });
        suite(k >= 0 && choix[k] === bon, k < 0);
      }
      Array.prototype.forEach.call(zone.querySelectorAll("[data-k]"), function (b) { b.addEventListener("click", function () { repond(+b.dataset.k); }); });
      chrono(function () { repond(-1); });
    }
    question("1 · Quelle attaque est en cours ?" + (aide ? " (la supervision a écarté deux pistes)" : ""), noms.map(function (id) { return A(id).nom; }), a.nom, function (ok, tard) {
      S.detail[i].id = ok; if (ok) S.res[i]--;
      retour.innerHTML = '<p class="duel-rep ' + (ok ? "ok" : "ko") + '">' + (ok ? "Bien vu : " : tard ? "Trop tard. C'était : " : "Raté. C'était : ") + '<b>' + esc(a.nom) + '</b>.</p><div class="btns"><button class="btn primary" data-q2>Choisir la réaction →</button></div>';
      clic("[data-q2]", function () {
        retour.innerHTML = "";
        question("2 · Quelle est la bonne première réaction ?", reactions, a.bonne, function (ok2, tard2) {
          S.detail[i].re = ok2; if (ok2) S.res[i]--;
          var r = S.res[i];
          retour.innerHTML = '<div class="duel-verdict ' + (r === 1 ? "moyen" : "ko") + '"><span class="tag">' + ["", "Contenue", "Subie", "Réussie"][r] + '</span>' +
            '<p class="duel-rep ' + (ok2 ? "ok" : "ko") + '">' + (ok2 ? "Bonne réaction." : tard2 ? "Trop tard : l'attaque a suivi son cours." : "Ce n'était pas la bonne réaction.") + '</p>' +
            '<p>' + esc(a.expl) + '</p><p><b>Ce qui l\'aurait bloquée :</b> ' + parades(a) + '. <a href="' + a.chap + '.html">Revoir le cours</a></p>' +
            '<p class="lb-small">Points : ' + points(r) + '.</p></div>' +
            '<div class="btns"><button class="btn primary" data-suite>' + (i + 1 < S.att.length ? "Attaque suivante →" : "Voir le bilan →") + '</button></div>';
          clic("[data-suite]", function () { tour(i + 1); });
          retour.scrollIntoView({ block: "nearest", behavior: "smooth" });
        });
      });
    });
  }

  /* ---------- mode « attaquer l'ordinateur » : la défense est simulée ---------- */
  function simuler() {
    var c = S.cible, reste = c.budget, pool = melange(PROT);
    S.prot = []; S.nomD = c.nom; S.nomA = "Toi";
    pool.forEach(function (p) { if (p.cout <= reste && p.id !== "supervision") { S.prot.push(p.id); reste -= p.cout; } });
    S.res = S.att.map(function (id) {
      if (bloqueurs(A(id), S.prot).length) return 0;
      return 3 - (Math.random() < c.talent ? 1 : 0) - (Math.random() < c.talent ? 1 : 0);
    });
    bilan();
  }

  /* ---------- bilan ---------- */
  var ETATS = ["Bloquée", "Contenue", "Subie", "Réussie"], CLASSES = ["ok", "moyen", "ko", "ko"];
  function tableau(att, prot, res) {
    return '<div class="duel-lignes">' + att.map(function (id, i) {
      var a = A(id), bl = bloqueurs(a, prot);
      return '<div class="duel-ligne ' + CLASSES[res[i]] + '"><span class="dl-n">' + (i + 1) + '</span><div><b>' + esc(a.nom) + '</b> <span class="tag">' + ETATS[res[i]] + '</span>' +
        '<p>' + (bl.length ? "Arrêtée par : " + bl.map(function (x) { return esc(P(x).nom); }).join(", ") + "." : "Aucune protection en place. Parade : " + parades(a) + ".") + ' <a href="' + a.chap + '.html">Cours</a></p></div><span class="dl-p">' + PTS_D[res[i]] + ' – ' + PTS_A[res[i]] + '</span></div>';
    }).join("") + '</div>';
  }
  function scores(res) { return { a: res.reduce(function (s, r) { return s + PTS_A[r]; }, 0), d: res.reduce(function (s, r) { return s + PTS_D[r]; }, 0) }; }
  function points(r) { return PTS_D[r] + " pour la défense, " + PTS_A[r] + " pour l'attaque"; }
  function titreBilan(sc, nomD, nomA) {
    return '<div class="duel-final"><span class="bleu"><small>' + esc(nomD) + ' · défense</small><b>' + sc.d + '</b></span><span class="duel-vs">VS</span><span class="rouge"><small>' + esc(nomA) + ' · attaque</small><b>' + sc.a + '</b></span></div>';
  }
  function bilan() {
    var sc = scores(S.res), gagneD = sc.d > sc.a, nul = sc.d === sc.a;
    var nomD = S.mode === "cible" ? S.cible.nom : S.mode === "deux" ? "Défenseur" : "Toi";
    var nomA = S.mode === "cible" ? "Toi" : S.mode === "deux" ? "Attaquant" : S.nomA;
    if (S.mode === "cible") noter("att", sc.a > sc.d); else if (S.mode !== "deux") noter("def", gagneD);
    var phrase = nul ? "Égalité parfaite." : S.mode === "cible" ? (gagneD ? "La cible a tenu : ton plan s'est heurté à ses protections." : "Ton plan est passé : la cible n'était pas prête.") :
      S.mode === "deux" ? (gagneD ? "Victoire du défenseur." : "Victoire de l'attaquant.") : (gagneD ? "Tu as tenu : l'entreprise est toujours debout." : "L'attaque l'emporte cette fois.");
    var nonAchete = [];
    S.att.forEach(function (id, i) { if (S.res[i] > 0) A(id).bloque.forEach(function (p) { if (nonAchete.indexOf(p) < 0) nonAchete.push(p); }); });
    var html = '<h1 class="duel-h">' + esc(phrase) + '</h1>' + titreBilan(sc, nomD, nomA) + tableau(S.att, S.prot, S.res) +
      '<div class="box"><b>Les protections en place</b><p>' + (S.prot.length ? S.prot.map(function (id) { return esc(P(id).nom); }).join(" · ") : "Aucune.") + '</p>' +
      (nonAchete.length ? '<p><b>Ce qui a manqué :</b> ' + nonAchete.map(function (id) { return esc(P(id).nom); }).join(" · ") + '.</p>' : '<p>Toutes les attaques ont été bloquées avant de devenir des incidents.</p>') + '</div>';
    if (S.mode === "lien") {
      html += '<div class="box retenir"><b>Renvoie le résultat à ' + esc(S.nomA) + '</b><label class="duel-nom">Ton prénom ou pseudo <input type="text" maxlength="20" autocomplete="nickname" data-nom placeholder="Anonyme"></label><div data-zone></div></div>';
    }
    html += '<div class="btns">' + (S.mode === "deux" ? '<button class="btn primary" data-revanche>Revanche : on échange les rôles →</button>' : "") +
      '<button class="btn' + (S.mode === "deux" ? "" : " primary") + '" data-rejouer>Nouveau duel</button><a class="btn" href="index.html">Retour au cours</a></div>';
    ecran(html, "Bilan");
    if (S.mode === "lien") {
      var majR = function () {
        var nom = nomPropre(main.querySelector("[data-nom]").value);
        main.querySelector("[data-zone]").innerHTML = champLien(lien("r", { v: 1, n: S.nomA, d: nom, a: S.att.map(function (id) { return IA[id]; }), p: S.prot.map(function (id) { return IP[id]; }), r: S.res }), "Résultat de notre duel de cybersécurité : " + sc.d + " à " + sc.a + ".");
        brancheLien();
      };
      main.querySelector("[data-nom]").addEventListener("input", majR); majR();
    }
    clic("[data-rejouer]", function () { history.replaceState(null, "", location.pathname); accueil(); });
    clic("[data-revanche]", function () { S = { mode: "deux", att: [], prot: [], res: [], budget: BUDGET_D, nomA: "", nomD: "" }; composer(); });
  }

  /* ---------- arrivée par un lien ---------- */
  function defiRecu(o) {
    S = { mode: "lien", att: o.a, prot: [], res: [], budget: BUDGET_D, nomA: o.n, nomD: "" };
    ecran('<div class="duel-passe"><div class="ico">VS</div><h1 class="duel-h">' + esc(o.n) + ' te défie</h1><p class="lead">' + pluriel(o.a.length, "attaque") + ' t\'attend' + (o.a.length > 1 ? "ent" : "") + '. Tu choisis d\'abord tes protections, puis tu traites les incidents, avec ' + CHRONO + ' secondes par décision.</p>' +
      '<div class="btns"><button class="btn primary" data-suite>Relever le défi →</button><button class="btn" data-non>Plus tard</button></div></div>', "Défi reçu");
    clic("[data-suite]", acheter);
    clic("[data-non]", function () { history.replaceState(null, "", location.pathname); accueil(); });
  }
  function resultatRecu(o) {
    var sc = scores(o.r), gagneA = sc.a > sc.d;
    ecran('<h1 class="duel-h">' + (sc.a === sc.d ? "Égalité avec " + esc(o.d) + "." : gagneA ? "Ton attaque a battu " + esc(o.d) + "." : esc(o.d) + " a tenu bon.") + '</h1>' + titreBilan(sc, o.d, o.n) + tableau(o.a, o.p, o.r) +
      '<div class="box"><b>Ses protections</b><p>' + (o.p.length ? o.p.map(function (id) { return esc(P(id).nom); }).join(" · ") : "Aucune.") + '</p></div>' +
      '<div class="btns"><button class="btn primary" data-rejouer>Préparer un nouveau duel</button><a class="btn" href="index.html">Retour au cours</a></div>', "Résultat");
    clic("[data-rejouer]", function () { history.replaceState(null, "", location.pathname); accueil(); });
  }
  function route() {
    var m = /^#([dr])=([\w-]+)$/.exec(location.hash), o = m && decode(m[2]);
    if (m && !o) {
      ecran('<h1 class="duel-h">Ce lien de duel est illisible</h1><p class="lead">Il a sans doute été coupé en le copiant. Demande à ton adversaire de te le renvoyer en entier.</p><div class="btns"><button class="btn primary" data-rejouer>Aller à l\'accueil du duel</button></div>', "Lien");
      clic("[data-rejouer]", function () { history.replaceState(null, "", location.pathname); accueil(); });
    } else if (o && m[1] === "r" && o.r) resultatRecu(o);
    else if (o && m[1] === "d") defiRecu(o);
    else accueil();
  }
  window.addEventListener("hashchange", route);
  window.EFDuel = { ATT: ATT, PROT: PROT, encode: encode, decode: decode };
  route();
})();
