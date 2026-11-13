/* Étude Facile — questions ouvertes de l'évaluation « textuel ».
   Chaque question : { q, notions: [{ n: "libellé", rx: "regex" }], corrige: "HTML" }
   La réponse est comparée en minuscules et SANS accents : écrire les regex sans accents.
   Le score d'une question = notions trouvées / notions attendues. */
window.EF_EVAL_TEXTES = {
  algo: [
    { q: "Explique la différence entre <code>=</code> et <code>==</code> en Python, avec un exemple.",
      notions: [
        { n: "= sert à affecter / donner une valeur", rx: "affect|assign|donne(r)? (une )?valeur|stock|range" },
        { n: "== sert à comparer / tester l'égalité", rx: "compar|test|egal|egalite|verifi" },
        { n: "== renvoie un booléen (True / False)", rx: "bool|true|false|vrai|faux" },
        { n: "un exemple de code", rx: "\\w+\\s*=\\s*\\w+|==" }],
      corrige: "<p><code>=</code> est l'<b>affectation</b> : il range une valeur dans une variable (<code>age = 18</code>). <code>==</code> est une <b>comparaison</b> : il teste si deux valeurs sont égales et renvoie un booléen <code>True</code> ou <code>False</code> (<code>age == 18</code> → <code>True</code>).</p>" },
    { q: "Quelle est la différence entre une boucle <code>for</code> et une boucle <code>while</code> ? Quand utiliser l'une ou l'autre ?",
      notions: [
        { n: "for : nombre de tours connu / parcours d'une séquence", rx: "nombre (de )?(tours|iterations|fois) (connu|defini|fixe)|connai|parcour|range|sequence|liste|chaque element" },
        { n: "while : répète tant qu'une condition est vraie", rx: "tant que|condition" },
        { n: "while : nombre de tours inconnu à l'avance", rx: "inconnu|ne sait pas|on ignore|pas (a l'avance|connu)|indetermin|jusqu'a ce" },
        { n: "risque de boucle infinie avec while", rx: "infini" }],
      corrige: "<p><code>for</code> sert quand on connaît le nombre de tours ou qu'on parcourt une séquence (<code>for i in range(10)</code>, <code>for x in liste</code>). <code>while</code> répète <b>tant qu'une condition est vraie</b> : utile quand on ne sait pas à l'avance combien de tours faire (saisie jusqu'à une valeur correcte). Attention : si la condition ne devient jamais fausse, c'est une <b>boucle infinie</b>.</p>" },
    { q: "Pourquoi écrit-on <code>int(input(\"Âge : \"))</code> et pas seulement <code>input(\"Âge : \")</code> ?",
      notions: [
        { n: "input renvoie toujours une chaîne (str / texte)", rx: "chaine|str\\b|texte|string|caractere" },
        { n: "int convertit en entier", rx: "conver|transform|entier|int\\b|nombre" },
        { n: "pour pouvoir calculer / comparer", rx: "calcul|addition|compar|operation|\\+" }],
      corrige: "<p><code>input()</code> renvoie <b>toujours une chaîne de caractères</b> (<code>str</code>), même si on tape un nombre. Pour calculer ou comparer numériquement, il faut la <b>convertir</b> en entier avec <code>int()</code> (ou en décimal avec <code>float()</code>). Sinon <code>\"3\" + \"4\"</code> donne <code>\"34\"</code>.</p>" },
    { q: "À quoi sert une fonction en programmation ? Quelle différence entre <code>return</code> et <code>print</code> dans une fonction ?",
      notions: [
        { n: "regrouper / réutiliser du code (éviter les répétitions)", rx: "reutilis|repet|eviter de reecrire|regroup|factoris|plusieurs fois" },
        { n: "paramètres en entrée", rx: "parametre|argument|entree" },
        { n: "return renvoie une valeur réutilisable", rx: "return.{0,40}(renvoi|retourn|valeur|resultat)|renvoi|retourn" },
        { n: "print affiche seulement à l'écran", rx: "print.{0,40}(affich|ecran)|affich" }],
      corrige: "<p>Une fonction <b>regroupe des instructions</b> sous un nom pour les <b>réutiliser</b> sans les réécrire ; elle reçoit des <b>paramètres</b>. <code>return</code> <b>renvoie une valeur</b> au programme qui l'a appelée (on peut la stocker, la réutiliser dans un calcul). <code>print</code> ne fait qu'<b>afficher</b> à l'écran : la valeur n'est pas récupérable.</p>" },
    { q: "Qu'est-ce qu'une liste en Python ? Cite au moins deux opérations courantes sur une liste.",
      notions: [
        { n: "collection ordonnée de plusieurs valeurs", rx: "plusieurs|ensemble|collection|suite|sequence|elements" },
        { n: "accès par indice (commence à 0)", rx: "indice|index|position|\\[0\\]|commence a 0" },
        { n: "append / ajouter", rx: "append|ajout" },
        { n: "len / longueur, ou parcours avec for", rx: "len|longueur|taille|for|parcour|remove|suppr|pop|sort|tri" }],
      corrige: "<p>Une liste est une <b>collection ordonnée</b> de valeurs : <code>notes = [12, 15, 9]</code>. On accède à un élément par son <b>indice</b>, qui commence à 0 (<code>notes[0]</code>). Opérations courantes : <code>append()</code> pour ajouter, <code>len()</code> pour la longueur, <code>for x in notes</code> pour parcourir, <code>remove()</code>, <code>sort()</code>…</p>" }
  ],
  slam: [
    { q: "Explique le rôle respectif du HTML et du CSS dans une page web.",
      notions: [
        { n: "HTML : structure / contenu", rx: "html.{0,60}(structur|contenu|squelette|balis)|structur|contenu" },
        { n: "CSS : mise en forme / apparence", rx: "css.{0,60}(style|mise en forme|apparence|presentation|design|couleur)|mise en forme|apparence|style" },
        { n: "séparation fond / forme", rx: "separ|fond.{0,20}forme|independ|distinct" }],
      corrige: "<p>Le <b>HTML</b> décrit la <b>structure et le contenu</b> de la page (titres, paragraphes, liens, images) grâce aux balises. Le <b>CSS</b> gère la <b>mise en forme</b> (couleurs, polices, marges, disposition). On <b>sépare le fond de la forme</b> : on peut changer tout le style sans toucher au contenu.</p>" },
    { q: "Quelle est la différence entre les méthodes GET et POST d'un formulaire ? Quand utiliser POST ?",
      notions: [
        { n: "GET : données visibles dans l'URL", rx: "get.{0,60}(url|adresse|visible)|url|adresse" },
        { n: "POST : données dans le corps de la requête (invisibles dans l'URL)", rx: "post.{0,80}(corps|cache|invisible|pas (dans|visible))|corps|cache|invisible" },
        { n: "POST pour les données sensibles (mot de passe…)", rx: "sensibl|mot de passe|confidenti|secur|personnel" },
        { n: "GET limité en taille / pour la recherche ou le partage de lien", rx: "limit|taille|recherche|partag|favori|marque-page" }],
      corrige: "<p>Avec <b>GET</b>, les données sont ajoutées à l'<b>URL</b> (<code>?nom=Léa</code>) : visibles, limitées en taille, pratiques pour une recherche ou un lien partageable. Avec <b>POST</b>, elles voyagent dans le <b>corps de la requête HTTP</b>, invisibles dans l'URL : on l'utilise pour les <b>données sensibles</b> (mot de passe, données personnelles) ou volumineuses.</p>" },
    { q: "À quoi servent les balises sémantiques HTML5 (<code>header</code>, <code>nav</code>, <code>main</code>, <code>footer</code>…) ?",
      notions: [
        { n: "décrire le rôle / le sens de chaque zone", rx: "sens|role|signif|decri|semanti" },
        { n: "référencement (SEO / moteurs de recherche)", rx: "referenc|seo|moteur" },
        { n: "accessibilité (lecteurs d'écran)", rx: "accessib|lecteur d'ecran|malvoyant|handicap" },
        { n: "lisibilité du code (plutôt que des div)", rx: "lisib|clair|compren|div" }],
      corrige: "<p>Elles indiquent le <b>rôle</b> de chaque zone (en-tête, menu, contenu principal, pied de page) au lieu de <code>&lt;div&gt;</code> anonymes. Avantages : meilleur <b>référencement</b>, meilleure <b>accessibilité</b> (les lecteurs d'écran comprennent la structure) et code plus <b>lisible</b>.</p>" },
    { q: "Décris le modèle de boîte en CSS (box model).",
      notions: [
        { n: "contenu (content)", rx: "contenu|content" },
        { n: "padding : marge intérieure", rx: "padding|marge interieure|interne" },
        { n: "border : bordure", rx: "border|bordure" },
        { n: "margin : marge extérieure", rx: "margin|marge exterieure|externe" }],
      corrige: "<p>Chaque élément est une boîte composée, de l'intérieur vers l'extérieur : le <b>contenu</b>, le <b>padding</b> (marge intérieure, entre le contenu et la bordure), la <b>border</b> (bordure) et la <b>margin</b> (marge extérieure, qui sépare la boîte de ses voisines).</p>" },
    { q: "Décompose l'URL <code>https://www.exemple.fr:443/cours/index.php?page=2</code> et explique chaque partie.",
      notions: [
        { n: "https : protocole (sécurisé)", rx: "protocole|https" },
        { n: "www.exemple.fr : nom de domaine / serveur", rx: "domaine|serveur|hote|host" },
        { n: "443 : port", rx: "port" },
        { n: "/cours/index.php : chemin / ressource", rx: "chemin|ressource|fichier|dossier|path" },
        { n: "?page=2 : paramètre (query string)", rx: "parametre|query|requete|variable|\\$_get|get" }],
      corrige: "<p><code>https</code> : le <b>protocole</b> (HTTP sécurisé) ; <code>www.exemple.fr</code> : le <b>nom de domaine</b> du serveur ; <code>443</code> : le <b>port</b> (celui par défaut de HTTPS) ; <code>/cours/index.php</code> : le <b>chemin</b> de la ressource demandée ; <code>?page=2</code> : un <b>paramètre</b> (lisible en PHP avec <code>$_GET[\"page\"]</code>).</p>" }
  ],
  sisr: [
    { q: "Explique la différence entre un chemin absolu et un chemin relatif sous Linux, avec un exemple de chacun.",
      notions: [
        { n: "absolu : part de la racine /", rx: "racine|commence par \\/|depuis \\/|^\\s*\\/|\\/home" },
        { n: "relatif : part du dossier courant", rx: "courant|actuel|ou l'on est|ou on se trouve|position" },
        { n: "exemple avec .. ou un chemin sans /", rx: "\\.\\.|\\.\\/|cd [a-z]" }],
      corrige: "<p>Un chemin <b>absolu</b> part de la <b>racine</b> <code>/</code> et fonctionne d'où qu'on soit : <code>/home/etu/Documents</code>. Un chemin <b>relatif</b> part du <b>dossier courant</b> : <code>Documents</code>, <code>../tmp</code> (<code>..</code> = dossier parent, <code>.</code> = dossier courant).</p>" },
    { q: "Que signifient les droits <code>rwxr-x---</code> ? Comment les obtenir avec <code>chmod</code> en notation octale ?",
      notions: [
        { n: "propriétaire : lecture, écriture, exécution", rx: "proprietaire|utilisateur|user|\\bu\\b" },
        { n: "groupe : lecture et exécution", rx: "groupe|group|\\bg\\b" },
        { n: "autres : aucun droit", rx: "autres|other|\\bo\\b|aucun|rien" },
        { n: "r=4, w=2, x=1", rx: "4.{0,20}2.{0,20}1|r\\s*=\\s*4|lecture.{0,10}4" },
        { n: "chmod 750", rx: "750" }],
      corrige: "<p><code>rwx</code> pour le <b>propriétaire</b> (lecture, écriture, exécution), <code>r-x</code> pour le <b>groupe</b> (lecture, exécution), <code>---</code> pour les <b>autres</b> (aucun droit). Avec r = 4, w = 2, x = 1 : 4+2+1 = 7, 4+1 = 5, 0 → <code>chmod 750 fichier</code>.</p>" },
    { q: "Qu'est-ce qu'un pipe (<code>|</code>) sous Linux ? Donne un exemple utile.",
      notions: [
        { n: "envoie la sortie d'une commande vers l'entrée de la suivante", rx: "sortie.{0,60}entree|resultat.{0,60}(suivante|autre commande)|enchain|redirig" },
        { n: "un exemple de commandes enchaînées", rx: "\\w+[^|]*\\|\\s*\\w+" },
        { n: "commandes de filtrage (grep, sort, wc, uniq…)", rx: "grep|sort|wc|uniq|head|tail|cut" }],
      corrige: "<p>Le pipe <code>|</code> <b>envoie la sortie</b> d'une commande <b>vers l'entrée</b> de la suivante, pour enchaîner des traitements. Exemple : <code>grep ERROR serveur.log | wc -l</code> compte les lignes d'erreur ; <code>sort liste.txt | uniq -c</code> compte les doublons.</p>" },
    { q: "Différence entre <code>&gt;</code> et <code>&gt;&gt;</code> dans le shell ?",
      notions: [
        { n: "redirection de la sortie vers un fichier", rx: "redirig|redirection|fichier|sortie" },
        { n: "> écrase / remplace le contenu", rx: "ecras|remplac|efface|vide" },
        { n: ">> ajoute à la fin", rx: "ajout|a la fin|append|a la suite|concaten" }],
      corrige: "<p>Les deux <b>redirigent la sortie</b> d'une commande vers un fichier. <code>&gt;</code> <b>écrase</b> le fichier (son contenu est remplacé) ; <code>&gt;&gt;</code> <b>ajoute à la fin</b> sans effacer ce qui existe.</p>" },
    { q: "Pourquoi utilise-t-on <code>sudo</code> ? Pourquoi ne pas travailler directement en root ?",
      notions: [
        { n: "exécuter une commande avec les droits administrateur (root)", rx: "root|admin|superutilisateur|privileg|droits" },
        { n: "ponctuellement, pour une seule commande", rx: "ponctuel|temporaire|une (seule )?commande|seulement|uniquement|besoin" },
        { n: "sécurité : limiter les erreurs / dégâts", rx: "secur|erreur|danger|risque|degat|casser|accident" },
        { n: "traçabilité (journal / qui a fait quoi)", rx: "trac|journal|log|historique|qui a fait" }],
      corrige: "<p><code>sudo</code> permet d'exécuter <b>une commande</b> avec les <b>droits de root</b> (administrateur), seulement quand c'est nécessaire. Travailler en root en permanence est <b>dangereux</b> : une erreur (<code>rm</code> mal placé) peut casser le système, et un programme malveillant aurait tous les droits. <code>sudo</code> demande aussi le mot de passe et <b>journalise</b> qui a fait quoi.</p>" }
  ],
  bloc1: [
    { q: "Comment récupère-t-on en PHP les données envoyées par un formulaire ? Que faut-il vérifier avant de les utiliser ?",
      notions: [
        { n: "$_GET ou $_POST selon la méthode", rx: "\\$_get|\\$_post|_get|_post" },
        { n: "la clé est l'attribut name du champ", rx: "name|nom du champ|cle" },
        { n: "vérifier l'existence avec isset (ou empty)", rx: "isset|empty|exist|envoy" },
        { n: "protéger l'affichage avec htmlspecialchars", rx: "htmlspecialchars|xss|injection|echapp|securis" }],
      corrige: "<p>Selon la méthode du formulaire, les valeurs arrivent dans <code>$_GET</code> ou <code>$_POST</code>, avec pour clé l'attribut <code>name</code> du champ : <code>$_POST[\"prenom\"]</code>. Avant de les utiliser, on vérifie qu'elles <b>existent</b> (<code>isset()</code>, <code>empty()</code>), on les convertit si besoin (<code>(int)</code>) et on <b>protège l'affichage</b> avec <code>htmlspecialchars()</code> contre les failles XSS.</p>" },
    { q: "Explique la différence entre une variable et une constante en PHP.",
      notions: [
        { n: "variable : valeur qui peut changer", rx: "variable.{0,60}(chang|modifi|evolu)|chang|modifi" },
        { n: "constante : valeur fixe pendant l'exécution", rx: "constante.{0,60}(fixe|ne (change|peut)|jamais|immuable)|fixe|immuable|jamais" },
        { n: "variable avec $", rx: "\\$" },
        { n: "constante avec define / const, sans $", rx: "define|const" }],
      corrige: "<p>Une <b>variable</b> (<code>$prix</code>) contient une valeur qui <b>peut changer</b> pendant l'exécution. Une <b>constante</b> a une valeur <b>fixe</b> : on la crée avec <code>define(\"TVA\", 0.2)</code> ou <code>const TVA = 0.2;</code> et on l'utilise sans <code>$</code>, en majuscules par convention.</p>" },
    { q: "Quand utiliser <code>switch</code> plutôt qu'une suite de <code>if / elseif</code> ? À quoi sert <code>break</code> ?",
      notions: [
        { n: "switch : comparer une variable à plusieurs valeurs précises", rx: "plusieurs valeurs|valeurs (precises|fixes)|egalite|une (meme )?variable|cas|case" },
        { n: "plus lisible", rx: "lisib|clair|simple" },
        { n: "break arrête / sort du switch", rx: "arret|sort|stop|quitte|fin" },
        { n: "sans break, on exécute aussi les cas suivants", rx: "suivant|continue|enchain|tous les cas|cascade" }],
      corrige: "<p><code>switch</code> est adapté quand on compare <b>une même variable à plusieurs valeurs précises</b> (jour = 1, 2, 3…) : c'est plus lisible qu'une suite de <code>elseif</code>. <code>break</code> <b>sort du switch</b> : sans lui, PHP exécute aussi les <b>cas suivants</b>. <code>default</code> traite les autres valeurs.</p>" },
    { q: "Pourquoi faut-il utiliser <code>htmlspecialchars()</code> quand on affiche une saisie utilisateur ?",
      notions: [
        { n: "faille XSS / injection de code", rx: "xss|injection|faille|attaque|pirat|malveill" },
        { n: "empêche l'exécution de HTML ou JavaScript", rx: "javascript|script|html|balise|execut" },
        { n: "convertit les caractères spéciaux (< > &) en entités", rx: "caracteres? speciaux|entite|&lt;|<|chevron|convert|transform" }],
      corrige: "<p>Si on affiche directement une saisie, un visiteur peut injecter des balises HTML ou du <b>JavaScript</b> qui s'exécuteront dans la page des autres : c'est la <b>faille XSS</b>. <code>htmlspecialchars()</code> <b>convertit les caractères spéciaux</b> (<code>&lt;</code>, <code>&gt;</code>, <code>&amp;</code>, guillemets) en entités HTML : le code s'affiche comme du texte au lieu d'être exécuté.</p>" },
    { q: "Pourquoi utiliser les balises sémantiques HTML5 (header, nav, main, article, footer) plutôt que des div ? Donne deux avantages.",
      notions: [
        { n: "elles donnent du sens à la structure (rôle de chaque zone)", rx: "sens|semanti|role|signif|structur" },
        { n: "accessibilité : lecteurs d'écran, navigation", rx: "accessib|lecteur|malvoyant|aveugle|handicap" },
        { n: "référencement par les moteurs de recherche", rx: "referenc|seo|moteur|google" },
        { n: "code plus lisible et maintenable", rx: "lisib|maintenab|clair|comprendre le code|relire" }],
      corrige: "<p>Les balises sémantiques disent <b>à quoi sert</b> chaque zone (en-tête, menu, contenu principal, pied de page) alors qu'une <code>div</code> ne dit rien. Avantages : <b>accessibilité</b> (les lecteurs d'écran permettent d'aller directement au menu ou au contenu), <b>référencement</b> (les moteurs comprennent mieux la page) et un code <b>plus lisible</b> pour les développeurs.</p>" },
    { q: "Explique la différence entre <code>display: flex</code> et <code>display: grid</code>, avec un exemple d'utilisation pour chacun.",
      notions: [
        { n: "flex : une dimension (ligne ou colonne)", rx: "une dimension|1 dimension|une seule (ligne|direction)|ligne ou (une )?colonne|un axe|un seul axe" },
        { n: "grid : deux dimensions (lignes et colonnes)", rx: "deux dimensions|2 dimensions|lignes et (des )?colonnes|grille" },
        { n: "exemple flex : menu, barre, alignement, centrage", rx: "menu|nav|barre|centr|align|bouton" },
        { n: "exemple grid : mise en page, galerie, cartes", rx: "mise en page|galerie|cartes|layout|tableau de bord|colonnes de|gabarit" }],
      corrige: "<p><b>Flexbox</b> place des éléments sur <b>un seul axe</b> (une ligne ou une colonne) : idéal pour un menu, une barre d'outils ou centrer un élément. <b>Grid</b> organise en <b>deux dimensions</b> (lignes et colonnes) : idéal pour la mise en page générale ou une galerie de cartes (<code>grid-template-columns: repeat(3, 1fr)</code>).</p>" },
    { q: "Quelle est la différence entre <code>WHERE</code> et <code>HAVING</code> dans une requête SQL ? Donne un exemple.",
      notions: [
        { n: "WHERE filtre les lignes avant le regroupement", rx: "where[^.]*(ligne|avant)" },
        { n: "HAVING filtre les groupes après GROUP BY", rx: "having[^.]*(groupe|apres|group by)" },
        { n: "HAVING peut utiliser un agrégat (COUNT, SUM, AVG…)", rx: "count|sum|avg|agregat|max|min" }],
      corrige: "<p><code>WHERE</code> filtre les <b>lignes</b> avant le regroupement, il ne peut pas contenir d'agrégat. <code>HAVING</code> filtre les <b>groupes</b> après le <code>GROUP BY</code> et peut utiliser un agrégat. Exemple : <code>SELECT type, COUNT(*) FROM materiel WHERE prix &gt; 100 GROUP BY type HAVING COUNT(*) &gt;= 3;</code></p>" },
    { q: "Qu'est-ce qu'une clé étrangère dans une base de données ? À quoi sert-elle ?",
      notions: [
        { n: "colonne qui fait référence à la clé primaire d'une autre table", rx: "cle primaire|reference|autre table|id d" },
        { n: "relie deux tables (permet les jointures)", rx: "relie|lien|relation|jointure|join" },
        { n: "garantit la cohérence (intégrité référentielle)", rx: "coheren|integrit|exist|interdit|empeche|refuse" }],
      corrige: "<p>Une clé étrangère est une colonne qui contient la <b>clé primaire d'une ligne d'une autre table</b> (ex. <code>employe.service_id</code> → <code>service.id</code>). Elle <b>relie</b> les tables, ce qui permet les jointures, et le SGBD garantit l'<b>intégrité référentielle</b> : impossible d'y mettre une valeur qui n'existe pas dans la table référencée.</p>" }
  ],
  bloc3: [
    { q: "Qu'est-ce qu'une donnée à caractère personnel au sens du RGPD ? Donne des exemples.",
      notions: [
        { n: "information sur une personne physique identifiée ou identifiable", rx: "personne physique|identifi|individu|une personne" },
        { n: "directement ou indirectement", rx: "direct|indirect|recoup|croise" },
        { n: "exemples (nom, adresse IP, e-mail, photo…)", rx: "nom|adresse|ip|mail|photo|telephone|numero|voix|empreinte" }],
      corrige: "<p>C'est toute information se rapportant à une <b>personne physique identifiée ou identifiable</b>, <b>directement</b> (nom, photo) ou <b>indirectement</b> par recoupement (adresse IP, numéro de téléphone, identifiant, adresse e-mail, plaque d'immatriculation, voix…).</p>" },
    { q: "Cite et explique au moins trois grands principes du RGPD.",
      notions: [
        { n: "licéité / base légale / consentement", rx: "licit|base legale|consentement|loyaut|transparen" },
        { n: "finalité déterminée", rx: "finalit|but|objectif" },
        { n: "minimisation des données", rx: "minimis|necessaire|strictement|pertinen" },
        { n: "durée de conservation limitée", rx: "duree|conserv|limit" },
        { n: "sécurité / confidentialité", rx: "secur|confidential|integrit|protection" }],
      corrige: "<p><b>Licéité et transparence</b> (une base légale comme le consentement, une information claire) ; <b>finalité</b> déterminée et légitime ; <b>minimisation</b> (ne collecter que le nécessaire) ; <b>exactitude</b> ; <b>durée de conservation limitée</b> ; <b>sécurité et confidentialité</b> des données ; et responsabilité (pouvoir prouver sa conformité).</p>" },
    { q: "Quelle est la différence entre anonymisation et pseudonymisation ?",
      notions: [
        { n: "anonymisation : irréversible, plus d'identification possible", rx: "irrevers|impossible|definitiv|plus (possible|aucun)|ne peut plus" },
        { n: "pseudonymisation : réversible (avec une information supplémentaire)", rx: "revers|cle|table de correspondance|information (supplementaire|additionnelle)|retrouver" },
        { n: "données pseudonymisées restent soumises au RGPD", rx: "rgpd|reste(nt)? (des )?donnees personnelles|soumis" }],
      corrige: "<p>L'<b>anonymisation</b> rend l'identification de la personne <b>impossible et irréversible</b> : les données ne sont plus personnelles, le RGPD ne s'applique plus. La <b>pseudonymisation</b> remplace les identifiants par un pseudonyme, mais elle est <b>réversible</b> avec une information supplémentaire (table de correspondance, clé) : les données restent personnelles et <b>soumises au RGPD</b>.</p>" },
    { q: "Qu'est-ce qu'une AIPD (ou PIA) et quand est-elle obligatoire ?",
      notions: [
        { n: "analyse d'impact relative à la protection des données", rx: "analyse d'impact|impact|etude" },
        { n: "évaluer les risques pour les droits et libertés des personnes", rx: "risque|droits|libertes|vie privee" },
        { n: "obligatoire si risque élevé (données sensibles, surveillance, grande échelle…)", rx: "eleve|sensible|grande echelle|surveillance|profilage|systematique|obligatoire" },
        { n: "mesures pour réduire les risques", rx: "mesure|reduir|attenu|correct|plan d'action" }],
      corrige: "<p>L'<b>AIPD</b> (analyse d'impact relative à la protection des données, PIA en anglais) <b>évalue les risques</b> d'un traitement pour la vie privée et les <b>droits et libertés</b> des personnes, et définit les <b>mesures</b> pour les réduire. Elle est obligatoire quand le traitement présente un <b>risque élevé</b> : données sensibles, surveillance systématique, traitement à grande échelle, profilage…</p>" }
  ],
  maths: [
    { q: "Explique la méthode pour convertir le nombre décimal 45 en binaire, et donne le résultat.",
      notions: [
        { n: "divisions successives par 2", rx: "division|divis|par 2|/ ?2" },
        { n: "on garde les restes", rx: "reste" },
        { n: "lecture des restes de bas en haut (du dernier au premier)", rx: "bas en haut|remont|dernier au premier|inverse|a l'envers|sens inverse" },
        { n: "résultat 101101", rx: "101101" }],
      corrige: "<p>On fait des <b>divisions successives par 2</b> en notant les <b>restes</b> : 45 = 2×22+<b>1</b>, 22 = 2×11+<b>0</b>, 11 = 2×5+<b>1</b>, 5 = 2×2+<b>1</b>, 2 = 2×1+<b>0</b>, 1 = 2×0+<b>1</b>. On lit les restes <b>de bas en haut</b> : 45 = <b>101101</b><sub>2</sub> (vérification : 32+8+4+1 = 45).</p>" },
    { q: "Qu'est-ce qu'une suite arithmétique ? Donne la formule du terme général.",
      notions: [
        { n: "on ajoute toujours le même nombre (la raison)", rx: "ajout|addition|meme nombre|constante|raison|\\+ ?r" },
        { n: "u(n+1) = u(n) + r", rx: "u ?\\(?n ?\\+ ?1\\)? ?= ?u ?\\(?n\\)? ?\\+ ?r|un\\+1 ?= ?un ?\\+ ?r" },
        { n: "u(n) = u(0) + n×r", rx: "u ?\\(?n\\)? ?= ?u ?\\(?[0p]\\)? ?\\+ ?\\(?n|u0 ?\\+ ?n ?[x*×]? ?r|nr|n ?r" }],
      corrige: "<p>Une suite est <b>arithmétique</b> si on passe d'un terme au suivant en <b>ajoutant toujours le même nombre</b> r, la <b>raison</b> : u<sub>n+1</sub> = u<sub>n</sub> + r. Terme général : <b>u<sub>n</sub> = u<sub>0</sub> + n×r</b> (ou u<sub>n</sub> = u<sub>p</sub> + (n−p)×r).</p>" },
    { q: "Explique ce que signifie <code>a ≡ b (mod n)</code> et donne un exemple.",
      notions: [
        { n: "a et b ont le même reste dans la division par n", rx: "meme reste|reste" },
        { n: "ou : n divise a − b", rx: "divis|multiple|a ?- ?b" },
        { n: "un exemple chiffré", rx: "\\d+ ?(≡|=|est congru).{0,20}\\d+" }],
      corrige: "<p><code>a ≡ b (mod n)</code> signifie que a et b ont le <b>même reste</b> dans la division euclidienne par n, autrement dit que <b>n divise a − b</b>. Exemple : 17 ≡ 2 (mod 5) car 17 = 5×3 + 2 (et 17 − 2 = 15 est un multiple de 5).</p>" },
    { q: "Comment calcule-t-on le PGCD de deux nombres avec l'algorithme d'Euclide ? Applique-le à 84 et 36.",
      notions: [
        { n: "divisions euclidiennes successives", rx: "division|divis" },
        { n: "on remplace (a, b) par (b, reste)", rx: "reste|remplac|diviseur devient|par le reste" },
        { n: "le PGCD est le dernier reste non nul", rx: "dernier reste non nul|reste non nul|dernier reste" },
        { n: "PGCD(84, 36) = 12", rx: "\\b12\\b" }],
      corrige: "<p>On effectue des <b>divisions euclidiennes successives</b> en remplaçant (a, b) par (b, r) où r est le reste, jusqu'à obtenir un reste nul. Le PGCD est le <b>dernier reste non nul</b>. 84 = 36×2 + 12 ; 36 = 12×3 + 0 → <b>PGCD(84, 36) = 12</b>.</p>" }
  ],
  "culture-generale": [
    { q: "Comment reconnaître un verbe du 2e groupe d'un verbe du 3e groupe en -ir ? Donne un exemple de chaque.",
      notions: [
        { n: "le participe présent en -issant (ou nous -issons)", rx: "issant|issons" },
        { n: "exemple 2e groupe : finir, choisir, réussir…", rx: "finir|choisir|reussir|grandir|rougir|agir|remplir|obeir|batir|punir" },
        { n: "exemple 3e groupe : partir, venir, dormir, courir…", rx: "partir|venir|dormir|courir|sortir|tenir|mourir|ouvrir|sentir|servir|mentir|offrir|cueillir" }],
      corrige: "<p>On regarde le <b>participe présent</b> : <i>finir → finissant</i> (2<sup>e</sup> groupe) ; <i>partir → partant</i> (3<sup>e</sup> groupe). On peut aussi conjuguer avec <i>nous</i> : <i>nous finissons</i> / <i>nous partons</i>.</p>" },
    { q: "Avec « je », comment savoir s'il faut écrire « -ai » (futur) ou « -ais » (conditionnel) ? Explique la méthode.",
      notions: [
        { n: "remplacer je par nous (ou une autre personne)", rx: "nous|tu|il |autre personne" },
        { n: "nous -rons → futur → -ai", rx: "rons|futur" },
        { n: "nous -rions → conditionnel → -ais", rx: "rions|conditionnel" },
        { n: "après si + imparfait, on met le conditionnel", rx: "\\bsi\\b" }],
      corrige: "<p>On remplace <b>je</b> par <b>nous</b> : si l'on dit <i>nous chanterons</i>, c'est le <b>futur</b> (<i>je chanterai</i>) ; si l'on dit <i>nous chanterions</i>, c'est le <b>conditionnel</b> (<i>je chanterais</i>). Après « si + imparfait », on emploie le conditionnel : <i>si je pouvais, je viendrais</i>.</p>" },
    { q: "Comment choisir entre « -é », « -er » et « -ez » à la fin d'un verbe du 1er groupe ?",
      notions: [
        { n: "remplacer par un verbe du 3e groupe (vendre, prendre, mordre…)", rx: "vendre|prendre|mordre|3e groupe|troisieme groupe|remplac" },
        { n: "vendu / pris → participe passé en -é", rx: "vendu|pris|mordu|participe" },
        { n: "vendre → infinitif en -er", rx: "infinitif" },
        { n: "-ez avec vous", rx: "vous" }],
      corrige: "<p>On remplace par un verbe du 3<sup>e</sup> groupe comme <i>vendre</i> : <i>j'ai vendu</i> → <b>participe passé -é</b> ; <i>il va vendre</i> → <b>infinitif -er</b> ; avec <i>vous</i> au présent → <b>-ez</b> (<i>vous chantez</i>).</p>" }
  ],
  cejm: [
    { q: "Qui sont les principaux agents économiques ? Donne la fonction principale de chacun.",
      notions: [
        { n: "ménages : consommer (et épargner)", rx: "menage" },
        { n: "entreprises : produire des biens et services", rx: "entreprise|produi" },
        { n: "administrations / État : services non marchands, redistribution", rx: "administration|etat|public|non marchand|redistribu" },
        { n: "banques / institutions financières : financer", rx: "banque|financ|credit|institution" },
        { n: "reste du monde : échanges avec l'étranger", rx: "reste du monde|etranger|export|import" }],
      corrige: "<p>Les <b>ménages</b> consomment et épargnent ; les <b>entreprises</b> produisent des biens et services marchands ; les <b>administrations publiques</b> produisent des services non marchands et redistribuent ; les <b>institutions financières</b> (banques) financent l'économie ; le <b>reste du monde</b> regroupe les échanges avec l'étranger (importations, exportations).</p>" },
    { q: "Explique la loi de l'offre et de la demande : que se passe-t-il quand le prix augmente ?",
      notions: [
        { n: "la demande baisse quand le prix augmente", rx: "demande.{0,40}(baiss|diminu)|achet.{0,20}moins" },
        { n: "l'offre augmente quand le prix augmente", rx: "offre.{0,40}(augment|hausse)|produi.{0,20}plus" },
        { n: "prix d'équilibre : offre = demande", rx: "equilibre|offre ?= ?demande|rencontre|croisement" }],
      corrige: "<p>Quand le prix augmente, la <b>demande diminue</b> (les acheteurs achètent moins) et l'<b>offre augmente</b> (les producteurs ont intérêt à vendre plus). Le marché tend vers le <b>prix d'équilibre</b>, celui pour lequel la quantité offerte est égale à la quantité demandée.</p>" },
    { q: "Qu'est-ce qu'un marché ? Cite les conditions d'un marché de concurrence parfaite.",
      notions: [
        { n: "lieu (réel ou virtuel) de rencontre de l'offre et de la demande", rx: "rencontre|offre.{0,20}demande|lieu|echange" },
        { n: "atomicité (beaucoup d'acheteurs et de vendeurs)", rx: "atomicit|nombreux|beaucoup|grand nombre" },
        { n: "homogénéité du produit", rx: "homogen|identique|meme produit" },
        { n: "transparence de l'information", rx: "transparen|information" },
        { n: "libre entrée / libre circulation", rx: "libre|entree|sortie|mobilit|circulation" }],
      corrige: "<p>Un marché est le <b>lieu</b>, réel ou virtuel, où se <b>rencontrent l'offre et la demande</b> d'un bien et où se forme un prix. La concurrence parfaite suppose : <b>atomicité</b> (très nombreux offreurs et demandeurs), <b>homogénéité</b> des produits, <b>transparence</b> de l'information, <b>libre entrée et sortie</b> du marché, et libre circulation des facteurs de production.</p>" }
  ],
  /* ---------- cours bonus : généré par outils/gen.py depuis outils/textes.py ---------- */
  "lua": [
    { q: "Quelle est la différence entre une variable <code>local</code> et une variable globale en Lua ? Pourquoi faut-il préférer <code>local</code> ?",
      notions: [
        { n: "local : visible seulement dans son bloc / sa fonction", rx: "bloc|portee|fonction|fichier|limite|seulement dans|interieur" },
        { n: "sans local, la variable est globale", rx: "global" },
        { n: "risque : écraser une autre variable / faute de frappe silencieuse", rx: "ecras|conflit|collision|faute|erreur|bug|modifi|partout" },
        { n: "une variable inconnue vaut nil", rx: "\\bnil\\b" }],
      corrige: "<p>Une variable <code>local</code> n'existe que dans le <b>bloc</b> où elle est déclarée. Sans <code>local</code>, la variable est <b>globale</b> : visible et modifiable partout, elle peut écraser une autre variable du même nom, et une faute de frappe crée silencieusement une nouvelle variable qui vaut <code>nil</code>. On écrit donc <code>local</code> à chaque création.</p>" },
    { q: "Explique ce qu'est une table en Lua et les deux façons de la parcourir.",
      notions: [
        { n: "seule structure de données : liste et dictionnaire", rx: "liste|tableau|dictionnaire|cle|structure" },
        { n: "les indices commencent à 1", rx: "\\b1\\b|un\\b" },
        { n: "ipairs : liste, dans l'ordre", rx: "ipairs" },
        { n: "pairs : toutes les clés, ordre non garanti", rx: "\\bpairs" }],
      corrige: "<p>La table est l'<b>unique structure de données</b> de Lua : elle sert de liste (indices à partir de <b>1</b>) et de dictionnaire (clé → valeur). <code>ipairs(t)</code> parcourt une liste dans l'ordre des indices et s'arrête au premier <code>nil</code> ; <code>pairs(t)</code> parcourt toutes les clés, dans un ordre non garanti.</p>" },
    { q: "Qu'est-ce qu'une closure ? Donne un exemple d'utilisation.",
      notions: [
        { n: "une fonction", rx: "fonction" },
        { n: "qui garde l'accès aux variables locales de l'endroit où elle a été créée", rx: "captur|garde|conserv|accede|acces|retient|souvien|memoris" },
        { n: "ces variables sont privées / propres à chaque closure", rx: "prive|propre|independan|protege|chaque" },
        { n: "un exemple : compteur, fabrique, callback…", rx: "compteur|fabrique|multiplicateur|callback|iterateur|compte" }],
      corrige: "<p>Une closure est une <b>fonction qui garde l'accès aux variables locales</b> du bloc où elle a été créée, même après la fin de ce bloc. Exemple : <code>creerCompteur()</code> déclare <code>local n = 0</code> et renvoie une fonction qui fait <code>n = n + 1</code>. Chaque compteur a son propre <code>n</code>, <b>privé</b> et inaccessible de l'extérieur.</p>" },
    { q: "À quoi sert une métatable ? Explique le rôle de <code>__index</code> dans la création d'une classe.",
      notions: [
        { n: "modifie le comportement d'une table", rx: "comportement|modifi|personnalis|redefini|operateur" },
        { n: "__index : consulté quand une clé est absente", rx: "absent|manqu|n'existe pas|pas trouve|introuvable|inexistant" },
        { n: "les méthodes sont cherchées dans la classe", rx: "methode|classe|fonction" },
        { n: "setmetatable relie l'instance à la classe", rx: "setmetatable" }],
      corrige: "<p>Une métatable <b>modifie le comportement</b> d'une table (opérateurs, affichage, accès). Quand on lit une clé <b>absente</b>, Lua consulte <code>__index</code>. Pour une classe : <code>Classe.__index = Classe</code> et chaque instance est créée avec <code>setmetatable({}, Classe)</code> ; une méthode absente de l'instance est alors cherchée dans la classe, où elle n'est écrite qu'une fois.</p>" },
    { q: "Comment gère-t-on les erreurs en Lua ? Présente <code>error</code>, <code>pcall</code> et la convention <code>nil, message</code>.",
      notions: [
        { n: "error lève une erreur", rx: "error.*(leve|provoque|declenche|arret|lance)|(leve|provoque|declenche|lance).*error" },
        { n: "pcall appelle en mode protégé", rx: "pcall" },
        { n: "pcall renvoie true/false puis le résultat ou le message", rx: "true|false|vrai|faux|booleen|statut" },
        { n: "nil, message pour les erreurs prévisibles", rx: "nil" }],
      corrige: "<p><code>error(msg)</code> <b>lève</b> une erreur et arrête le programme. <code>pcall(f, …)</code> appelle <code>f</code> en mode <b>protégé</b> et renvoie <code>true</code> + les résultats, ou <code>false</code> + l'erreur, sans arrêter le programme. Pour une erreur prévisible (saisie invalide, fichier absent), une fonction renvoie plutôt <code>nil</code> suivi d'un message.</p>" },
    { q: "Qu'est-ce qu'une coroutine et à quoi sert-elle dans un jeu ?",
      notions: [
        { n: "une fonction qui peut se mettre en pause", rx: "pause|suspen|interromp|arret" },
        { n: "et reprendre là où elle s'était arrêtée", rx: "repren|resume|continu" },
        { n: "yield / resume", rx: "yield|resume|wrap" },
        { n: "usage : séquences d'actions, générateurs, attentes", rx: "sequence|generateur|attend|attente|script|animation|image" }],
      corrige: "<p>Une coroutine est une fonction qui peut se <b>mettre en pause</b> (<code>coroutine.yield</code>) puis <b>reprendre</b> exactement où elle en était (<code>coroutine.resume</code>), avec ses variables intactes. Dans un jeu, elle permet d'écrire une <b>séquence d'actions</b> étalée sur plusieurs images (avancer, attendre, tirer) comme un simple script, ou de créer des générateurs.</p>" },
    { q: "Quelle est la différence entre <code>objet.methode()</code> et <code>objet:methode()</code> ?",
      notions: [
        { n: "le deux-points passe l'objet en premier argument", rx: "premier|automatique|passe|ajoute|implicite" },
        { n: "ce paramètre s'appelle self", rx: "self" },
        { n: "obj:m(a) équivaut à obj.m(obj, a)", rx: "equiva|revient|raccourci|pareil|meme chose|identique" },
        { n: "erreur classique si on se trompe", rx: "erreur|nil|number|bug|piege|oubli" }],
      corrige: "<p>Le deux-points est un <b>raccourci</b> : <code>obj:m(a)</code> équivaut à <code>obj.m(obj, a)</code>. Il passe <b>automatiquement</b> l'objet en premier argument, que la méthode reçoit sous le nom <code>self</code>. Appeler une méthode avec un point par erreur donne à <code>self</code> une mauvaise valeur : c'est le piège classique.</p>" }
  ],
  "cpp": [
    { q: "Explique la différence entre le passage par valeur, par référence et par référence constante en C++.",
      notions: [
        { n: "par valeur : la fonction reçoit une copie", rx: "copie" },
        { n: "par référence (&) : la fonction modifie l'original", rx: "original|modifi|meme variable|directement" },
        { n: "const & : pas de copie et pas de modification", rx: "const" },
        { n: "const & pour les gros objets (string, vector)", rx: "gros|string|vector|objet|cout|performan|rapide|lourd" }],
      corrige: "<p><b>Par valeur</b> (<code>int n</code>) : la fonction travaille sur une <b>copie</b>. <b>Par référence</b> (<code>int&amp; n</code>) : elle agit sur la variable <b>d'origine</b> et peut la modifier. <b>Par référence constante</b> (<code>const string&amp; s</code>) : ni copie ni modification ; c'est la forme à utiliser pour les objets volumineux (string, vector).</p>" },
    { q: "Qu'est-ce qu'un pointeur ? Explique <code>&amp;</code>, <code>*</code> et <code>nullptr</code>.",
      notions: [
        { n: "un pointeur contient une adresse mémoire", rx: "adresse" },
        { n: "& donne l'adresse d'une variable", rx: "&|esperluette|adresse de" },
        { n: "* donne la valeur pointée (déréférencement)", rx: "valeur|dereferenc|contenu|pointe" },
        { n: "nullptr : ne pointe sur rien, à tester avant usage", rx: "nullptr|nul|rien" }],
      corrige: "<p>Un pointeur est une variable qui contient l'<b>adresse</b> d'une autre. <code>&amp;x</code> donne l'adresse de <code>x</code> ; <code>*p</code> donne la <b>valeur</b> à l'adresse contenue dans <code>p</code> (déréférencement). <code>nullptr</code> est le pointeur qui ne pointe sur <b>rien</b> : il faut tester un pointeur avant de le déréférencer.</p>" },
    { q: "Quelle est la différence entre la pile et le tas ? Qu'est-ce qu'une fuite de mémoire ?",
      notions: [
        { n: "pile : variables locales, libération automatique", rx: "pile|stack|local|automatique" },
        { n: "tas : mémoire réservée avec new", rx: "tas|heap|new|dynamique" },
        { n: "libération manuelle avec delete", rx: "delete|liber" },
        { n: "fuite : mémoire réservée jamais libérée", rx: "fuite|jamais liber|oubli|perdu|non liber" }],
      corrige: "<p>La <b>pile</b> contient les variables locales : elles sont libérées <b>automatiquement</b> à la fin de leur bloc. Le <b>tas</b> contient ce qu'on réserve avec <code>new</code> et qu'on doit libérer avec <code>delete</code>. Une <b>fuite de mémoire</b> est une zone réservée qui n'est jamais libérée. Les pointeurs intelligents évitent ce problème.</p>" },
    { q: "Qu'est-ce que l'encapsulation ? Quel est le rôle du constructeur et du mot-clé <code>private</code> ?",
      notions: [
        { n: "regrouper données et méthodes dans une classe", rx: "classe|methode|attribut|regroup" },
        { n: "private : inaccessible de l'extérieur", rx: "private|prive|exterieur|cach|inaccessible|proteg" },
        { n: "on passe par des méthodes publiques qui gardent l'objet cohérent", rx: "public|accesseur|getter|coheren|valide|control|verifi" },
        { n: "le constructeur initialise l'objet à sa création", rx: "constructeur|initialis|creation" }],
      corrige: "<p>L'encapsulation consiste à regrouper données et <b>méthodes</b> dans une classe et à rendre les données <b>privées</b> (<code>private</code>) : on ne peut les modifier que par des méthodes <b>publiques</b>, qui garantissent un état cohérent. Le <b>constructeur</b>, appelé automatiquement à la création, initialise les attributs.</p>" },
    { q: "Explique le polymorphisme en C++ : à quoi servent <code>virtual</code>, <code>override</code> et une classe abstraite ?",
      notions: [
        { n: "héritage : une classe fille redéfinit une méthode de la mère", rx: "herit|fille|derive|mere|base|redefini" },
        { n: "virtual : la méthode appelée dépend du type réel de l'objet", rx: "virtual|virtuel|type reel|reel|dynami" },
        { n: "override : redéfinition vérifiée par le compilateur", rx: "override|verifi|compilateur" },
        { n: "classe abstraite : méthode virtuelle pure, non instanciable", rx: "abstrait|pure|= ?0|instanci|interface" }],
      corrige: "<p>Une classe fille peut <b>redéfinir</b> une méthode de sa classe mère. Si la méthode est <code>virtual</code>, c'est la version de la <b>classe réelle</b> de l'objet qui est appelée, même à travers un pointeur ou une référence de la mère. <code>override</code> fait vérifier la redéfinition par le compilateur. Une méthode <code>= 0</code> est virtuelle pure : la classe est <b>abstraite</b>, non instanciable.</p>" },
    { q: "Qu'est-ce que le principe RAII ? Quel est le lien avec <code>unique_ptr</code> ?",
      notions: [
        { n: "ressource acquise dans le constructeur", rx: "constructeur|acqui|creation|initialis" },
        { n: "libérée dans le destructeur", rx: "destructeur|liber|detrui" },
        { n: "automatiquement, à la fin du bloc", rx: "automatique|fin du bloc|portee|sort" },
        { n: "unique_ptr : un seul propriétaire, plus de delete", rx: "unique_ptr|proprietaire|delete|make_unique|intelligent" }],
      corrige: "<p>RAII : une ressource est <b>acquise dans le constructeur</b> et <b>libérée dans le destructeur</b>. Comme le destructeur d'une variable locale est appelé <b>automatiquement</b> à la fin du bloc, rien ne fuit. <code>unique_ptr</code> applique ce principe à la mémoire du tas : il possède l'objet, le détruit tout seul, et rend <code>delete</code> inutile.</p>" },
    { q: "À quoi sert un template ? Donne un exemple.",
      notions: [
        { n: "écrire un code valable pour plusieurs types", rx: "plusieurs types|n'importe quel type|generique|tout type|different" },
        { n: "le type est un paramètre (typename T)", rx: "typename|parametre|\\bt\\b|<" },
        { n: "le compilateur génère une version par type", rx: "compilateur|compilation|genere|instanci" },
        { n: "un exemple : maxi, vector, map, Pile…", rx: "vector|map|max|pile|somme|unique_ptr|echang" }],
      corrige: "<p>Un template permet d'écrire une fonction ou une classe <b>valable pour plusieurs types</b> : le type est un <b>paramètre</b> (<code>template &lt;typename T&gt;</code>). Le <b>compilateur</b> génère une version pour chaque type utilisé. Exemples : <code>T maxi(T a, T b)</code>, ou les conteneurs <code>vector&lt;int&gt;</code> et <code>map&lt;string, int&gt;</code>.</p>" }
  ]
};
