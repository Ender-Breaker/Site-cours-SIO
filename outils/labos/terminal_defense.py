"""Labo terminal « Enquêter et durcir » (moteur assets/labo.js, terminal simulé).
Scénario : le serveur srv a subi une force brute SSH réussie. On enquête dans les journaux, on repère la persistance,
on corrige les droits dangereux, on préserve les preuves. Adresses IP de documentation (RFC 5737)."""

HREF = "labo-defense.html"


def _log():
    L = []
    def l(h, pid, msg): L.append("Nov 13 %s srv %s: %s" % (h, pid, msg))
    l("02:40:12", "sshd[380]", "Accepted publickey for etu from 192.0.2.10 port 40022 ssh2")
    l("02:58:30", "sshd[395]", "Failed password for oracle from 198.51.100.4 port 4000 ssh2")
    l("02:58:33", "sshd[395]", "Failed password for test from 198.51.100.4 port 4002 ssh2")
    for i, s in enumerate(["01", "02", "04", "05", "07", "09"]):
        l("03:12:" + s, "sshd[411]", "Failed password for admin from 203.0.113.7 port %d ssh2" % (51122 + 2 * i))
    l("03:14:40", "sshd[413]", "Accepted password for admin from 203.0.113.7 port 51200 ssh2")
    l("03:15:02", "sudo", "admin : TTY=pts/1 ; USER=root ; COMMAND=/usr/sbin/useradd -o -u 0 support2")
    l("03:15:20", "sudo", "admin : TTY=pts/1 ; USER=root ; COMMAND=/usr/sbin/usermod -aG sudo support2")
    l("03:16:30", "sshd[420]", "Accepted password for support2 from 203.0.113.7 port 51310 ssh2")
    l("07:55:03", "sshd[502]", "Accepted publickey for etu from 192.0.2.10 port 40188 ssh2")
    return "\n".join(L) + "\n"


FS = {
    "/home/etu/": None,
    "/home/etu/LISEZ-MOI.txt": "Alerte du 13 novembre : activité anormale sur srv pendant la nuit.\nLe journal d'authentification est dans /var/log/auth.log\nÀ toi d'enquêter, puis de durcir la machine.\n",
    "/home/etu/.ssh/": None,
    "/home/etu/.ssh/id_ed25519": "-----BEGIN OPENSSH PRIVATE KEY-----\n(clé privée de démonstration)\n-----END OPENSSH PRIVATE KEY-----\n",
    "/home/etu/.ssh/id_ed25519.pub": "ssh-ed25519 AAAAC3Nz... etu@portable\n",
    "/home/etu/site/": None,
    "/home/etu/site/index.php": "<?php require 'config.php'; ?>\n",
    "/home/etu/site/.env": "DB_HOST=bdd\nDB_USER=app\nDB_PASSWORD=Un-Mot-De-Passe-De-Demo\n",
    "/home/etu/site/sauvegarde.sh": "#!/bin/bash\n# lancé chaque nuit par cron avec les droits root\ntar -czf /sauvegardes/site.tar.gz /home/etu/site\n",
    "/home/etu/ancien-projet/": None,
    "/home/etu/ancien-projet/.env": "API_KEY=cle-de-demo-1234\n",
    "/home/etu/ancien-projet/notes.txt": "à supprimer un jour\n",
    "/var/log/": None,
    "/var/log/auth.log": _log(),
    "/etc/passwd": "root:x:0:0:root:/root:/bin/bash\nwww-data:x:33:33:www-data:/var/www:/usr/sbin/nologin\netu:x:1000:1000:Etudiant:/home/etu:/bin/bash\nadmin:x:1001:1001:Administrateur:/home/admin:/bin/bash\nsupport2:x:0:0::/home/support2:/bin/bash\n",
    "/etc/group": "root:x:0:\nsudo:x:27:etu,admin,support2\nwww-data:x:33:\netu:x:1000:\nadmin:x:1001:\n",
    "/tmp/": None,
}
MODES = {"/home/etu/.ssh/id_ed25519": "644", "/home/etu/.ssh": "755", "/home/etu/site/.env": "644", "/home/etu/ancien-projet/.env": "666", "/home/etu/site/sauvegarde.sh": "777"}

A = "/var/log/auth.log"


def m(id, titre, texte, syntaxe, objectifs, indice, solution, bravo=""):
    d = dict(id=id, titre=titre, texte=texte, syntaxe=syntaxe, objectifs=[dict(txt=t, r=r) for t, r in objectifs], indice=indice, solution=solution)
    if bravo:
        d["bravo"] = bravo
    return d


LECONS = [
    dict(id="journaux", titre="Enquêter dans les journaux", missions=[
        m("def-echecs", "Combien de tentatives ?",
          "<p>Une alerte signale une activité anormale cette nuit. Le journal <code>/var/log/auth.log</code> enregistre chaque tentative de connexion SSH. Une tentative ratée contient <code>Failed password</code>.</p><p><code>grep -c motif fichier</code> <b>compte</b> les lignes qui contiennent le motif.</p>",
          ['grep -c "motif" fichier'],
          [("Compte les lignes <code>Failed password</code> du journal", [{"out": "^8$"}])],
          'Mets le motif entre guillemets : <code>grep -c "Failed password" /var/log/auth.log</code>',
          ['grep -c "Failed password" %s' % A], "8 échecs en une nuit. Reste à savoir d'où ils viennent."),
        m("def-adresses", "D'où viennent les échecs ?",
          "<p>Dans chaque ligne, les mots sont séparés par des espaces : l'adresse IP est le <b>11e</b>. On enchaîne les commandes avec des tubes :</p><ul><li><code>cut -d\" \" -f11</code> garde le 11e champ ;</li><li><code>sort | uniq -c</code> compte les lignes identiques ;</li><li><code>sort -rn</code> classe du plus grand au plus petit.</li></ul>",
          ['grep "motif" fichier | cut -d" " -f11 | sort | uniq -c | sort -rn'],
          [("Classe les adresses par nombre d'échecs", [{"out": "^\\s*6 203\\.0\\.113\\.7"}, {"out": "2 198\\.51\\.100\\.4"}])],
          'Pars de <code>grep "Failed password" /var/log/auth.log</code> puis ajoute les quatre commandes, séparées par <code>|</code>.',
          ['grep "Failed password" %s | cut -d" " -f11 | sort | uniq -c | sort -rn' % A],
          "<code>203.0.113.7</code> a échoué 6 fois : c'est une attaque par force brute. L'autre adresse est le bruit de fond habituel d'Internet."),
        m("def-compte", "Quel compte est visé ?",
          "<p>Le <b>9e</b> champ de la ligne est le nom du compte essayé. Ne garde que les échecs de l'adresse <code>203.0.113.7</code> et compte par compte.</p>",
          ['grep "a" fichier | grep "b" | cut -d" " -f9 | sort | uniq -c'],
          [("Affiche le compte attaqué depuis <code>203.0.113.7</code> avec son nombre d'échecs", [{"out": "^\\s*6 admin\\s*$"}])],
          'Deux <code>grep</code> à la suite : <code>grep "Failed password" /var/log/auth.log | grep "203.0.113.7"</code>, puis <code>cut -d" " -f9 | sort | uniq -c</code>.',
          ['grep "Failed password" %s | grep "203.0.113.7" | cut -d" " -f9 | sort | uniq -c' % A],
          "Le compte <code>admin</code>, avec un mot de passe au lieu d'une clé : la cible idéale."),
        m("def-reussite", "L'attaquant est-il entré ?",
          "<p>Une connexion réussie contient <code>Accepted</code>. La question décisive d'une enquête : après ses échecs, l'adresse suspecte a-t-elle fini par <b>réussir</b> ?</p>",
          ['grep "Accepted" fichier | grep "adresse"'],
          [("Affiche les connexions réussies depuis <code>203.0.113.7</code>", [{"out": "Accepted password for admin from 203\\.0\\.113\\.7"}, {"out": "Accepted password for support2"}])],
          '<code>grep "Accepted" /var/log/auth.log | grep "203.0.113.7"</code>',
          ['grep "Accepted" %s | grep "203.0.113.7"' % A],
          "Oui : à 03:14:40 sur <code>admin</code>… puis à 03:16:30 sur un compte <code>support2</code> que personne ne connaît."),
        m("def-sudo", "Qu'a-t-il fait une fois entré ?",
          "<p>Chaque commande lancée avec <code>sudo</code> laisse une ligne dans le journal. C'est là que l'on voit ce que l'attaquant a fait avec les droits d'administrateur.</p>",
          ['grep "sudo" fichier'],
          [("Affiche les commandes lancées avec sudo cette nuit", [{"out": "COMMAND=/usr/sbin/useradd -o -u 0 support2"}])],
          '<code>grep "sudo" /var/log/auth.log</code>',
          ['grep "sudo" %s' % A],
          "Il a créé le compte <code>support2</code> avec l'UID 0 (les droits de root) et l'a mis dans le groupe sudo : c'est sa <b>persistance</b>. Changer le mot de passe d'<code>admin</code> ne suffirait pas à le mettre dehors."),
    ]),
    dict(id="comptes", titre="Repérer les comptes anormaux", missions=[
        m("def-connexion", "Qui peut se connecter ?",
          "<p><code>/etc/passwd</code> liste tous les comptes. Ceux dont le shell est <code>nologin</code> ne peuvent pas ouvrir de session. <code>grep -v</code> affiche les lignes qui <b>ne contiennent pas</b> le motif.</p>",
          ['grep -v "motif" fichier'],
          [("Affiche les comptes qui peuvent ouvrir une session", [{"out": "^support2:"}, {"out": "^etu:"}]), ("…sans les comptes de service", [{"cmd": "grep\\s+-v"}])],
          '<code>grep -v nologin /etc/passwd</code>',
          ["grep -v nologin /etc/passwd"]),
        m("def-uid0", "Les comptes aux pleins pouvoirs",
          "<p>Dans <code>/etc/passwd</code>, le 3e champ est l'<b>UID</b>. L'UID <code>0</code> est celui de root : tout compte qui le porte a tous les droits, quel que soit son nom. Il ne doit y en avoir qu'<b>un</b>.</p>",
          ['grep ":x:0:" /etc/passwd'],
          [("Affiche les comptes dont l'UID vaut 0", [{"out": "^root:x:0:"}, {"out": "^support2:x:0:"}])],
          'Cherche le motif <code>:x:0:</code> dans <code>/etc/passwd</code>.',
          ['grep ":x:0:" /etc/passwd'],
          "Deux comptes à l'UID 0 : <code>support2</code> est une porte dérobée. Sur un vrai serveur, on le supprimerait (<code>userdel</code>) après avoir conservé les preuves."),
        m("def-sudoers", "Qui est administrateur ?",
          "<p>Les membres du groupe <code>sudo</code> peuvent tout faire avec <code>sudo</code>. La liste se lit dans <code>/etc/group</code>.</p>",
          ['grep "^groupe:" /etc/group'],
          [("Affiche les membres du groupe sudo", [{"out": "^sudo:x:27:.*support2"}])],
          '<code>grep "^sudo:" /etc/group</code>',
          ['grep "^sudo:" /etc/group'],
          "Trois administrateurs, dont l'intrus. La règle du moindre privilège : cette liste doit être la plus courte possible."),
    ]),
    dict(id="droits", titre="Corriger les droits dangereux", missions=[
        m("def-cle", "Protéger la clé privée SSH",
          "<p>Une clé privée lisible par les autres utilisateurs n'est plus privée. SSH refuse d'ailleurs de l'utiliser. Elle doit être en <code>600</code> (lecture et écriture pour le propriétaire, rien pour les autres), et le dossier <code>.ssh</code> en <code>700</code>.</p>",
          ["ls -la dossier", "chmod 600 fichier", "chmod 700 dossier"],
          [("Regarde les droits actuels dans <code>.ssh</code>", [{"anyout": "id_ed25519"}]), ("Passe la clé privée <code>.ssh/id_ed25519</code> en <code>600</code>", [{"mode": ["/home/etu/.ssh/id_ed25519", "600"]}]), ("Passe le dossier <code>.ssh</code> en <code>700</code>", [{"mode": ["/home/etu/.ssh", "700"]}])],
          '<code>ls -la .ssh</code>, puis <code>chmod 600 .ssh/id_ed25519</code> et <code>chmod 700 .ssh</code>.',
          ["ls -la .ssh", "chmod 600 .ssh/id_ed25519", "chmod 700 .ssh"]),
        m("def-env", "Trouver et protéger les fichiers de secrets",
          "<p>Les fichiers <code>.env</code> contiennent des mots de passe et des clés d'API. <code>find dossier -name \"nom\"</code> les retrouve tous, y compris ceux qu'on a oubliés.</p>",
          ['find /home -name ".env"', "chmod 600 fichier"],
          [("Trouve tous les fichiers <code>.env</code> sous <code>/home</code>", [{"anyout": "ancien-projet/\\.env"}]), ("Passe <code>site/.env</code> en <code>600</code>", [{"mode": ["/home/etu/site/.env", "600"]}]), ("Passe aussi celui de l'ancien projet en <code>600</code>", [{"mode": ["/home/etu/ancien-projet/.env", "600"]}])],
          '<code>find /home -name ".env"</code> en trouve deux. Un <code>chmod 600</code> pour chacun.',
          ['find /home -name ".env"', "chmod 600 site/.env", "chmod 600 ancien-projet/.env"],
          "Le second traînait dans un vieux projet, modifiable par tout le monde. Les secrets oubliés sont les plus dangereux."),
        m("def-script", "Un script que tout le monde peut modifier",
          "<p><code>site/sauvegarde.sh</code> est lancé chaque nuit par <b>root</b>. Or il est en <code>777</code> : n'importe quel utilisateur peut y ajouter ses commandes, qui s'exécuteront avec les droits root. C'est une <b>élévation de privilèges</b> offerte.</p><p>Donne-lui les droits <code>750</code> : tout pour le propriétaire, lecture et exécution pour le groupe, rien pour les autres.</p>",
          ["ls -l fichier", "chmod 750 fichier"],
          [("Constate le problème avec <code>ls -l</code>", [{"anyout": "rwxrwxrwx.*sauvegarde\\.sh"}]), ("Passe le script en <code>750</code>", [{"mode": ["/home/etu/site/sauvegarde.sh", "750"]}])],
          '<code>ls -l site</code> puis <code>chmod 750 site/sauvegarde.sh</code>.',
          ["ls -l site", "chmod 750 site/sauvegarde.sh"]),
    ]),
    dict(id="preuves", titre="Préserver les preuves", missions=[
        m("def-copie", "Mettre le journal à l'abri",
          "<p>Avant toute correction, on <b>préserve les preuves</b> : un attaquant qui revient peut effacer le journal. Copie-le dans un dossier <code>preuves</code>.</p>",
          ["mkdir dossier", "cp source destination"],
          [("Crée le dossier <code>preuves</code> dans ton dossier personnel", [{"exists": "/home/etu/preuves"}]), ("Copie <code>/var/log/auth.log</code> dedans", [{"contains": ["/home/etu/preuves/auth.log", "Accepted password for support2"]}])],
          '<code>mkdir preuves</code> puis <code>cp /var/log/auth.log preuves/</code>',
          ["mkdir preuves", "cp %s preuves/" % A]),
        m("def-ioc", "Extraire les traces de l'attaquant",
          "<p>Pour le rapport d'incident, isole dans un fichier toutes les lignes qui concernent l'adresse de l'attaquant. Le chevron <code>&gt;</code> envoie le résultat d'une commande dans un fichier.</p>",
          ['grep "motif" fichier > resultat.txt', "wc -l fichier"],
          [("Écris dans <code>attaquant.txt</code> toutes les lignes du journal contenant <code>203.0.113.7</code>", [{"lines": ["/home/etu/attaquant.txt", 8]}, {"contains": ["/home/etu/attaquant.txt", "support2"]}]), ("Compte ses lignes", [{"out": "^8\\b"}])],
          '<code>grep "203.0.113.7" /var/log/auth.log > attaquant.txt</code> puis <code>wc -l attaquant.txt</code>',
          ['grep "203.0.113.7" %s > attaquant.txt' % A, "wc -l attaquant.txt"],
          "8 lignes : 6 échecs et 2 connexions réussies. L'adresse est un <b>indicateur de compromission</b> à bloquer sur le pare-feu."),
        m("def-archive", "Archiver et protéger",
          "<p>Dernière étape : regrouper les preuves dans une archive, et la rendre lisible par toi seul.</p>",
          ["tar -czf archive.tar.gz dossier", "chmod 600 fichier"],
          [("Crée l'archive <code>preuves.tar.gz</code> du dossier <code>preuves</code>", [{"exists": "/home/etu/preuves.tar.gz"}]), ("Passe-la en <code>600</code>", [{"mode": ["/home/etu/preuves.tar.gz", "600"]}])],
          '<code>tar -czf preuves.tar.gz preuves</code> puis <code>chmod 600 preuves.tar.gz</code>',
          ["tar -czf preuves.tar.gz preuves", "chmod 600 preuves.tar.gz"],
          "Enquête terminée : tu sais d'où vient l'attaque, comment elle a réussi, ce que l'attaquant a laissé, et tu as corrigé les faiblesses du serveur."),
    ]),
]
for _l in LECONS:
    for _m in _l["missions"]:
        if _m["id"] in ("def-ioc", "def-archive"):
            _m["prep"] = ["mkdir preuves", "cp %s preuves/" % A]

AIDE = [
    dict(titre="Chercher dans un journal", cmds=[['grep "motif" f', "lignes qui contiennent"], ["grep -c motif f", "compter"], ["grep -v motif f", "lignes qui ne contiennent pas"], ['cut -d" " -f11', "garder le 11e champ"], ["sort | uniq -c | sort -rn", "compter et classer"], ["wc -l f", "nombre de lignes"]]),
    dict(titre="Comptes", cmds=[["cat /etc/passwd", "tous les comptes"], ['grep ":x:0:" /etc/passwd', "comptes à l'UID 0"], ['grep "^sudo:" /etc/group', "administrateurs"], ["id", "mes groupes"]]),
    dict(titre="Droits", cmds=[["ls -la", "voir les droits"], ["chmod 600 f", "lisible par moi seul"], ["chmod 700 dossier", "dossier privé"], ["chmod 750 f", "rien pour les autres"], ['find /home -name ".env"', "chercher des fichiers"]]),
    dict(titre="Preuves", cmds=[["cp source dest", "copier"], ["commande > f", "résultat dans un fichier"], ["tar -czf a.tar.gz dossier", "archiver"]]),
]

LAB = dict(key="ef-labo-defense", mid="securite-web-terminal", titre="Labo terminal : enquêter et durcir", couleur="secu", moduleTitre="Cybersécurité",
           sousTitre="Un serveur a été attaqué cette nuit. Fouille les journaux, repère ce que l'intrus a laissé, corrige les droits dangereux, préserve les preuves.",
           fs=FS, modes=MODES, lecons=LECONS, aide=AIDE)
