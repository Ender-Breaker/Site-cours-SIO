"""Labo Java : leçons et missions (voir lua.py pour les conventions)."""


def ind(txt, n):
    return "".join((" " * n + l if l else "") + "\n" for l in txt.strip("\n").split("\n"))


def prog(corps, imp="java.util.Scanner", classes="", statiques=""):
    """Programme complet : imports, classes éventuelles, puis la classe Main (membres statiques éventuels + main)."""
    return ("".join("import %s;\n" % i for i in imp.split(",") if i) + ("\n" if imp else "") + (classes.strip("\n") + "\n\n" if classes else "") +
            "public class Main {\n" + (ind(statiques, 4) + "\n" if statiques else "") + "    public static void main(String[] args) {\n" + ind(corps, 8) + "    }\n}\n")


SC = "Scanner sc = new Scanner(System.in);\n"
ANIMAL = '''abstract class Animal {
    protected final String nom;
    Animal(String nom) { this.nom = nom; }
    abstract String crier();
    String presenter() { return nom + " fait " + crier(); }
}
'''
MAIN_ANIMAL = 'List<Animal> animaux = List.of(new Chien("Rex"), new Chat("Tigrou"));\nfor (Animal a : animaux) System.out.println(a.presenter());'
MAIN_POINT = 'Point a = new Point(3, 4), b = new Point(3, 4), c = new Point(0, 1);\nSystem.out.println(a);\nSystem.out.println(a.equals(b));\nSystem.out.println(a.equals(c));'
MAIN_FORME = 'List<Forme> formes = List.of(new Rectangle(3, 4), new Carre(5));\nfor (Forme f : formes) System.out.println(f.aire());'
MAIN_AGE = SC + 'int age = sc.nextInt();\ntry {\n    verifier(age);\n    System.out.println("Âge valide : " + age);\n} catch (AgeInvalideException e) {\n    System.out.println(e.getMessage());\n}'
LIRE_NOTES = SC + "int n = sc.nextInt();\nList<Integer> notes = new ArrayList<>();\nfor (int i = 0; i < n; i++) notes.add(sc.nextInt());\n"
JEU_FIN = "\n    public static void main(String[] args) {\n        lancer(new Main());\n    }\n}\n"
JEU_IMP = "import java.util.ArrayList;\nimport java.util.List;\n\npublic class Main extends Jeu {\n"

LECONS = [
    ("Afficher et calculer", [
        "java-afficher", "java-age", "java-ttc",
        K("conv", prog(SC + "int s = sc.nextInt();"),
          prog(SC + 'int s = sc.nextInt();\nint h = s / 3600;\nint m = (s % 3600) / 60;\nSystem.out.println(h + " h " + m + " min " + (s % 60) + " s");'),
          'System.out.println(7 / 2 + " " + 7 % 2);   // 3 1', "`s / 3600` donne les heures (division entière) ; `(s % 3600) / 60` les minutes ; `s % 60` les secondes. Mets les calculs entre parenthèses dans la concaténation."),
        K("moyenne", prog(SC + "double a = sc.nextDouble();"),
          prog(SC + 'double a = sc.nextDouble();\ndouble b = sc.nextDouble();\ndouble c = sc.nextDouble();\nSystem.out.printf("Moyenne : %.2f%n", (a + b + c) / 3);'),
          'System.out.printf("%.2f%n", 3.14159);   // 3.14', "`System.out.printf(\"Moyenne : %.2f%n\", valeur);` Lis les notes avec `nextDouble()`."),
    ]),
    ("Conditions et boucles", [
        "java-parite",
        K("mention", prog(SC + "double note = sc.nextDouble();"),
          prog(SC + 'double note = sc.nextDouble();\nif (note < 10) System.out.println("Insuffisant");\nelse if (note < 12) System.out.println("Passable");\nelse if (note < 14) System.out.println("Assez bien");\nelse if (note < 16) System.out.println("Bien");\nelse System.out.println("Très bien");'),
          'if (x < 10) { … }\nelse if (x < 20) { … }\nelse { … }', "Enchaîne les `else if` du plus petit seuil au plus grand."),
        "java-table", "java-somme",
        K("fizzbuzz", prog(SC + "int n = sc.nextInt();"),
          prog(SC + 'int n = sc.nextInt();\nfor (int i = 1; i <= n; i++) {\n    if (i % 15 == 0) System.out.println("FizzBuzz");\n    else if (i % 3 == 0) System.out.println("Fizz");\n    else if (i % 5 == 0) System.out.println("Buzz");\n    else System.out.println(i);\n}'),
          'if (i % 3 == 0) { … }   // i est un multiple de 3', "Teste d'abord le cas « multiple de 15 », sinon il ne sera jamais atteint."),
        K("rebours", prog(SC + "int n = sc.nextInt();"),
          prog(SC + 'int n = sc.nextInt();\nfor (int i = n; i >= 1; i--) {\n    System.out.println(i);\n}\nSystem.out.println("Décollage !");'),
          'for (int i = 10; i >= 1; i--) { … }', "`for (int i = n; i >= 1; i--)`"),
        K("devine", prog(SC + "final int SECRET = 42;\nint essais = 0;"),
          prog(SC + 'final int SECRET = 42;\nint essai, essais = 0;\ndo {\n    essai = sc.nextInt();\n    essais++;\n    if (essai < SECRET) System.out.println("Trop petit");\n    else if (essai > SECRET) System.out.println("Trop grand");\n} while (essai != SECRET);\nSystem.out.println("Gagné ! Essais : " + essais);'),
          'do {\n    …\n} while (condition);   // au moins un tour', "Une boucle `do { … } while (essai != SECRET);` : il y a toujours au moins un essai."),
        K("pgcd", prog(SC + "int a = sc.nextInt();\nint b = sc.nextInt();"),
          prog(SC + 'int a = sc.nextInt();\nint b = sc.nextInt();\nwhile (b != 0) {\n    int reste = a % b;\n    a = b;\n    b = reste;\n}\nSystem.out.println("PGCD : " + a);'),
          'int reste = a % b;   // garde le reste avant de modifier a', "Dans la boucle : calcule le reste, puis `a = b; b = reste;`."),
    ]),
    ("Méthodes et tableaux", [
        "java-premier",
        K("minmax", prog(SC + "int n = sc.nextInt();", statiques="// écris ici une méthode qui calcule le minimum et le maximum"),
          prog(SC + 'int n = sc.nextInt();\nint[] t = new int[n];\nfor (int i = 0; i < n; i++) t[i] = sc.nextInt();\nint[] r = minMax(t);\nSystem.out.println("Min : " + r[0]);\nSystem.out.println("Max : " + r[1]);',
               statiques="static int[] minMax(int[] t) {\n    int mini = t[0], maxi = t[0];\n    for (int v : t) {\n        if (v < mini) mini = v;\n        if (v > maxi) maxi = v;\n    }\n    return new int[]{mini, maxi};\n}"),
          'static int[] deux() {\n    return new int[]{1, 2};   // deux résultats dans un tableau\n}', "Une méthode ne renvoie qu'une valeur : renvoie un tableau `new int[]{mini, maxi}`.",
          [("Une méthode reçoit le tableau et calcule les deux valeurs", "code", r"static\s+[\w\[\]<>]+\s+\w+\s*\(\s*(int\[\]|List<Integer>)\s+\w+\s*\)")]),
        K("factorielle", prog(SC + "int n = sc.nextInt();", statiques="static long factorielle(int n) {\n    // à compléter\n    return 0;\n}"),
          prog(SC + 'int n = sc.nextInt();\nSystem.out.println(n + "! = " + factorielle(n));', statiques="static long factorielle(int n) {\n    if (n <= 1) return 1;\n    return n * factorielle(n - 1);\n}"),
          'static int compte(int n) {\n    if (n == 0) return 0;        // cas d\'arrêt\n    return 1 + compte(n - 1);    // appel récursif\n}', "Cas d'arrêt : `if (n <= 1) return 1;`. Sinon `return n * factorielle(n - 1);`.",
          [("La méthode s'appelle elle-même", "code", r"\b(\w+)\s*\(\s*(?:int|long)\s+\w+\s*\)\s*\{[\s\S]*\b\1\s*\([\s\S]*\b\1\s*\(")]),
        K("fibo", prog(SC + "int n = sc.nextInt();"),
          prog(SC + 'int n = sc.nextInt();\nlong a = 0, b = 1;\nStringBuilder sb = new StringBuilder();\nfor (int i = 0; i < n; i++) {\n    if (i > 0) sb.append(" ");\n    sb.append(a);\n    long suivant = a + b;\n    a = b;\n    b = suivant;\n}\nSystem.out.println(sb);'),
          'long suivant = a + b;\na = b;\nb = suivant;', "Deux variables `a` et `b` ; à chaque tour ajoute `a` au texte, puis avance : `suivant = a + b; a = b; b = suivant;`."),
        K("binaire", prog(SC + "int n = sc.nextInt();"),
          prog(SC + 'int n = sc.nextInt();\nString bits = "";\nif (n == 0) bits = "0";\nwhile (n > 0) {\n    bits = (n % 2) + bits;\n    n /= 2;\n}\nSystem.out.println(bits);'),
          'String s = 1 + "0";   // "10" : le nombre est collé devant le texte', "Ajoute chaque reste **devant** : `bits = (n % 2) + bits;`. Pense au cas n = 0.",
          [("Sans <code>toBinaryString</code>", "nocode", r"toBinaryString|toString\s*\([^)]*,\s*2\s*\)")]),
        "java-tableau",
        K("tri", prog(SC + "int n = sc.nextInt();\nint[] t = new int[n];", "java.util.Scanner,java.util.Arrays"),
          prog(SC + 'int n = sc.nextInt();\nint[] t = new int[n];\nfor (int i = 0; i < n; i++) t[i] = sc.nextInt();\nArrays.sort(t);\nStringBuilder sb = new StringBuilder();\nfor (int i = 0; i < n; i++) {\n    if (i > 0) sb.append(" ");\n    sb.append(t[i]);\n}\nSystem.out.println(sb);', "java.util.Scanner,java.util.Arrays"),
          'Arrays.sort(t);   // trie le tableau sur place', "`Arrays.sort(t);` puis une boucle pour afficher avec des espaces."),
    ]),
    ("Chaînes de caractères", [
        "java-palindrome",
        K("voyelles", prog(SC + "String mot = sc.next();"),
          prog(SC + 'String mot = sc.next();\nint n = 0;\nfor (char c : mot.toCharArray()) {\n    if ("aeiouy".indexOf(c) >= 0) n++;\n}\nSystem.out.println("Voyelles : " + n);'),
          'for (char c : mot.toCharArray()) { … }     // chaque caractère\nif ("abc".indexOf(c) >= 0) { … }           // c est-il dans "abc" ?', "Parcours `mot.toCharArray()` et teste `\"aeiouy\".indexOf(c) >= 0`."),
        K("mots", prog(SC + "String phrase = sc.nextLine();"),
          prog(SC + 'String phrase = sc.nextLine();\nString[] mots = phrase.trim().split("\\\\s+");\nSystem.out.println("Mots : " + mots.length);'),
          'String[] t = "a  b".split("\\\\s+");   // découpe sur un ou plusieurs espaces', "`phrase.trim().split(\"\\\\s+\")` renvoie le tableau des mots ; sa longueur est la réponse."),
        K("cesar", prog(SC + "String texte = sc.nextLine();"),
          prog(SC + "String texte = sc.nextLine();\nStringBuilder sb = new StringBuilder();\nfor (char c : texte.toCharArray()) {\n    if (c >= 'a' && c <= 'z') c = (char) ('a' + (c - 'a' + 3) % 26);\n    sb.append(c);\n}\nSystem.out.println(sb);"),
          "char c = (char) ('a' + 2);   // 'c' : un char est un nombre\nint rang = 'e' - 'a';        // 4", "`c - 'a'` donne le rang de 0 à 25 ; ajoute 3, prends le reste modulo 26, rajoute `'a'` et reconvertis avec `(char)`."),
        K("parentheses", prog(SC + "String expr = sc.nextLine();\nint niveau = 0;"),
          prog(SC + 'String expr = sc.nextLine();\nint niveau = 0;\nboolean ok = true;\nfor (char c : expr.toCharArray()) {\n    if (c == \'(\') niveau++;\n    else if (c == \')\') {\n        niveau--;\n        if (niveau < 0) ok = false;\n    }\n}\nSystem.out.println(ok && niveau == 0 ? "équilibré" : "non équilibré");'),
          "if (c == '(') niveau++;", "Deux conditions : le compteur ne passe jamais sous 0, et il vaut 0 à la fin."),
    ]),
    ("Objets, héritage et interfaces", [
        "java-compte",
        M("java-tostring", "toString et equals",
          "Complète la classe **Point** : `toString()` doit renvoyer **(x, y)**, et `equals` doit considérer que deux points de mêmes coordonnées sont égaux. Le `main` est déjà écrit.\n\n**Exemple**\n\n```\n@Override\npublic String toString() { return \"…\"; }\n\n@Override\npublic boolean equals(Object o) {\n    if (!(o instanceof Point)) return false;\n    Point p = (Point) o;\n    return …;\n}\n```",
          prog(MAIN_POINT, "", "class Point {\n    private final int x, y;\n    Point(int x, int y) { this.x = x; this.y = y; }\n\n    // à compléter : toString et equals\n}"),
          prog(MAIN_POINT, "", 'class Point {\n    private final int x, y;\n    Point(int x, int y) { this.x = x; this.y = y; }\n\n    @Override\n    public String toString() { return "(" + x + ", " + y + ")"; }\n\n    @Override\n    public boolean equals(Object o) {\n        if (!(o instanceof Point)) return false;\n        Point p = (Point) o;\n        return x == p.x && y == p.y;\n    }\n\n    @Override\n    public int hashCode() { return 31 * x + y; }\n}'),
          [([], "(3, 4)\ntrue\nfalse")],
          [("Les méthodes sont redéfinies avec <code>@Override</code>", "code", r"@Override[\s\S]*toString[\s\S]*@Override|@Override[\s\S]*equals[\s\S]*@Override")],
          "`equals` reçoit un `Object` : teste `instanceof Point`, convertis avec `(Point) o`, puis compare x et y."),
        M("java-heritage", "Héritage et classe abstraite",
          "La classe abstraite **Animal** est écrite. Crée deux classes filles : **Chien**, dont `crier()` renvoie `\"Ouaf\"`, et **Chat**, dont `crier()` renvoie `\"Miaou\"`. Le `main` déjà écrit les range dans une `List<Animal>`.\n\n**Exemple**\n\n```\nclass Fille extends Mere {\n    Fille(String nom) { super(nom); }           // appelle le constructeur de la mère\n    @Override String methode() { return \"…\"; }\n}\n```",
          prog(MAIN_ANIMAL, "java.util.List", ANIMAL + "\n// à compléter : les classes Chien et Chat"),
          prog(MAIN_ANIMAL, "java.util.List", ANIMAL + '\nclass Chien extends Animal {\n    Chien(String nom) { super(nom); }\n    @Override String crier() { return "Ouaf"; }\n}\n\nclass Chat extends Animal {\n    Chat(String nom) { super(nom); }\n    @Override String crier() { return "Miaou"; }\n}'),
          [([], "Rex fait Ouaf\nTigrou fait Miaou")],
          [("Les deux classes héritent d'<code>Animal</code>", "code", r"class\s+Chien\s+extends\s+Animal[\s\S]*class\s+Chat\s+extends\s+Animal|class\s+Chat\s+extends\s+Animal[\s\S]*class\s+Chien\s+extends\s+Animal"),
           ("Le constructeur de la mère est appelé avec <code>super</code>", "code", r"super\s*\(\s*\w+\s*\)")],
          "`class Chien extends Animal { Chien(String nom) { super(nom); } @Override String crier() { return \"Ouaf\"; } }`"),
        M("java-interface", "Une interface",
          "L'interface **Forme** déclare la méthode `aire()`. Écris deux classes qui l'implémentent : **Rectangle** (largeur, hauteur) et **Carre** (côté). Le `main` déjà écrit affiche leurs aires.\n\n**Exemple**\n\n```\ninterface Parlant { String parler(); }\n\nclass Robot implements Parlant {\n    @Override public String parler() { return \"bip\"; }   // public obligatoire\n}\n```",
          prog(MAIN_FORME, "java.util.List", "interface Forme {\n    double aire();\n}\n\n// à compléter : les classes Rectangle et Carre"),
          prog(MAIN_FORME, "java.util.List", "interface Forme {\n    double aire();\n}\n\nclass Rectangle implements Forme {\n    private final double l, h;\n    Rectangle(double l, double h) { this.l = l; this.h = h; }\n    @Override public double aire() { return l * h; }\n}\n\nclass Carre implements Forme {\n    private final double c;\n    Carre(double c) { this.c = c; }\n    @Override public double aire() { return c * c; }\n}"),
          [([], "12.0\n25.0")],
          [("Les deux classes utilisent <code>implements Forme</code>", "code", r"class\s+\w+\s+implements\s+Forme[\s\S]*class\s+\w+\s+implements\s+Forme")],
          "Une méthode qui implémente une interface doit être `public` : `@Override public double aire() { … }`."),
        M("java-enum", "Un enum et un switch",
          "Définis un enum **Feu** avec les valeurs ROUGE, ORANGE et VERT. Le programme lit le nom d'une couleur (en majuscules), le convertit en valeur de l'enum avec `valueOf`, puis affiche l'action : **Stop** pour ROUGE, **Ralentir** pour ORANGE, **Passer** pour VERT.\n\n**Exemple**\n\n```\nenum Jour { LUNDI, MARDI }\nJour j = Jour.valueOf(\"MARDI\");\nString s = switch (j) {\n    case LUNDI -> \"début\";\n    case MARDI -> \"suite\";\n};\n```",
          prog(SC + "String couleur = sc.next();", classes="// définis ici l'enum Feu"),
          prog(SC + 'Feu feu = Feu.valueOf(sc.next());\nString action = switch (feu) {\n    case ROUGE -> "Stop";\n    case ORANGE -> "Ralentir";\n    case VERT -> "Passer";\n};\nSystem.out.println(action);', classes="enum Feu { ROUGE, ORANGE, VERT }"),
          [(["ROUGE"], "Stop"), (["ORANGE"], "Ralentir"), (["VERT"], "Passer")],
          [("Un <code>enum Feu</code> est défini et utilisé", "code", r"enum\s+Feu\s*\{[\s\S]*Feu\.valueOf|Feu\.valueOf[\s\S]*enum\s+Feu\s*\{")],
          "`Feu feu = Feu.valueOf(sc.next());` puis un `switch (feu)`."),
        M("java-record", "Un record",
          "Définis un record **Produit** (nom, prix, quantité : des entiers pour le prix et la quantité) avec une méthode `montant()` qui renvoie prix × quantité. Lis un entier n, puis n produits : nom, prix et quantité, chacun sur sa ligne. Affiche pour chaque produit **nom : montant**, puis **Total : X**.\n\n**Exemple**\n\n```\nrecord Point(int x, int y) {\n    int somme() { return x + y; }\n}\nPoint p = new Point(3, 4);\nSystem.out.println(p.x() + \" \" + p.somme());\n```",
          prog(SC + "int n = sc.nextInt();", "java.util.Scanner,java.util.ArrayList,java.util.List", "// définis ici le record Produit"),
          prog(SC + 'int n = sc.nextInt();\nList<Produit> produits = new ArrayList<>();\nfor (int i = 0; i < n; i++) {\n    produits.add(new Produit(sc.next(), sc.nextInt(), sc.nextInt()));\n}\nint total = 0;\nfor (Produit p : produits) {\n    System.out.println(p.nom() + " : " + p.montant());\n    total += p.montant();\n}\nSystem.out.println("Total : " + total);', "java.util.Scanner,java.util.ArrayList,java.util.List",
               "record Produit(String nom, int prix, int quantite) {\n    int montant() { return prix * quantite; }\n}"),
          [(["2", "souris", "20", "3", "clavier", "50", "1"], "souris : 60\nclavier : 50\nTotal : 110"), (["1", "ecran", "150", "2"], "ecran : 300\nTotal : 300")],
          [("Un <code>record Produit</code> est défini", "code", r"record\s+Produit\s*\(")],
          "`record Produit(String nom, int prix, int quantite) { int montant() { return prix * quantite; } }` ; les accesseurs s'écrivent `p.nom()`."),
    ]),
    ("Collections, exceptions et streams", [
        K("inverser", prog(SC + "int n = sc.nextInt();\nList<String> mots = new ArrayList<>();", "java.util.Scanner,java.util.ArrayList,java.util.List"),
          prog(SC + 'int n = sc.nextInt();\nList<String> mots = new ArrayList<>();\nfor (int i = 0; i < n; i++) mots.add(sc.next());\nStringBuilder sb = new StringBuilder();\nfor (int i = n - 1; i >= 0; i--) {\n    sb.append(mots.get(i));\n    if (i > 0) sb.append(" ");\n}\nSystem.out.println(sb);', "java.util.Scanner,java.util.ArrayList,java.util.List"),
          'for (int i = liste.size() - 1; i >= 0; i--) { … liste.get(i) … }', "Parcours les indices de `n - 1` à `0` et lis avec `mots.get(i)`."),
        K("inventaire", prog(SC + "int n = sc.nextInt();\nMap<String, Integer> stock = new TreeMap<>();", "java.util.Scanner,java.util.Map,java.util.TreeMap"),
          prog(SC + 'int n = sc.nextInt();\nMap<String, Integer> stock = new TreeMap<>();\nfor (int i = 0; i < n; i++) {\n    String nom = sc.next();\n    int qte = sc.nextInt();\n    stock.put(nom, stock.getOrDefault(nom, 0) + qte);\n}\nfor (Map.Entry<String, Integer> e : stock.entrySet()) {\n    System.out.println(e.getKey() + " : " + e.getValue());\n}', "java.util.Scanner,java.util.Map,java.util.TreeMap"),
          'stock.put(nom, stock.getOrDefault(nom, 0) + qte);   // 0 la première fois\nfor (Map.Entry<String, Integer> e : stock.entrySet()) { … e.getKey() … e.getValue() … }', "Une `TreeMap` garde ses clés triées : il suffit de parcourir `entrySet()`."),
        K("doublons", prog(SC + "int n = sc.nextInt();\nSet<String> vus = new HashSet<>();", "java.util.Scanner,java.util.Set,java.util.HashSet,java.util.List,java.util.ArrayList"),
          prog(SC + 'int n = sc.nextInt();\nSet<String> vus = new HashSet<>();\nList<String> res = new ArrayList<>();\nfor (int i = 0; i < n; i++) {\n    String mot = sc.next();\n    if (vus.add(mot)) res.add(mot);\n}\nSystem.out.println(String.join(" ", res));', "java.util.Scanner,java.util.Set,java.util.HashSet,java.util.List,java.util.ArrayList"),
          'if (vus.add(mot)) { … }             // add renvoie false si le mot était déjà là\nString.join(" ", liste)             // colle une liste avec des espaces', "`vus.add(mot)` renvoie `true` seulement la première fois. `String.join(\" \", res)` assemble le résultat."),
        M("java-exception", "Attraper une exception",
          "Lis une ligne. Si c'est un entier, affiche **Double : X** (le double du nombre). Sinon, le programme ne doit pas planter : attrape l'exception et affiche **Erreur : saisie invalide**.\n\n**Exemple**\n\n```\ntry {\n    int n = Integer.parseInt(texte);\n} catch (NumberFormatException e) {\n    …\n}\n```",
          prog(SC + 'String saisie = sc.nextLine();\nint n = Integer.parseInt(saisie);\nSystem.out.println("Double : " + n * 2);'),
          prog(SC + 'String saisie = sc.nextLine();\ntry {\n    int n = Integer.parseInt(saisie);\n    System.out.println("Double : " + n * 2);\n} catch (NumberFormatException e) {\n    System.out.println("Erreur : saisie invalide");\n}'),
          [(["21"], "Double : 42"), (["abc"], "Erreur : saisie invalide"), (["12.5"], "Erreur : saisie invalide")],
          [("L'exception <code>NumberFormatException</code> est attrapée", "code", r"catch\s*\(\s*(final\s+)?(NumberFormatException|IllegalArgumentException|RuntimeException|Exception)\b")],
          "Entoure la conversion **et** l'affichage du résultat d'un `try`, puis `catch (NumberFormatException e)`."),
        M("java-throw", "Créer et lever sa propre exception",
          "Crée la classe **AgeInvalideException**, qui hérite de `Exception`. Complète la méthode **verifier(age)** : elle lève cette exception avec le message **âge impossible : X** quand l'âge est négatif ou supérieur à 130. Le `main` déjà écrit attrape l'exception.\n\n**Exemple**\n\n```\nclass StockVideException extends Exception {\n    StockVideException(String message) { super(message); }\n}\n\nstatic void retirer(int n) throws StockVideException {\n    if (n > 0) throw new StockVideException(\"stock vide\");\n}\n```",
          prog(MAIN_AGE, classes="// à compléter : la classe AgeInvalideException", statiques="static void verifier(int age) throws AgeInvalideException {\n    // à compléter\n}"),
          prog(MAIN_AGE, classes="class AgeInvalideException extends Exception {\n    AgeInvalideException(String message) { super(message); }\n}",
               statiques='static void verifier(int age) throws AgeInvalideException {\n    if (age < 0 || age > 130) throw new AgeInvalideException("âge impossible : " + age);\n}'),
          [(["17"], "Âge valide : 17"), (["250"], "âge impossible : 250"), (["-3"], "âge impossible : -3")],
          [("La classe hérite de <code>Exception</code> et l'exception est levée avec <code>throw new</code>", "code", r"class\s+AgeInvalideException\s+extends\s+Exception[\s\S]*throw\s+new\s+AgeInvalideException")],
          "Le constructeur transmet le message à la classe mère : `super(message);`."),
        M("java-stream", "Filtrer et compter avec un stream",
          "Le programme lit n notes dans une liste. Avec un **stream**, affiche **Admis : X** (le nombre de notes supérieures ou égales à 10), puis sur la ligne suivante les notes admises triées par ordre croissant, séparées par un espace.\n\n**Exemple**\n\n```\nlong pairs = liste.stream().filter(x -> x % 2 == 0).count();\nString texte = liste.stream().sorted().map(String::valueOf).collect(Collectors.joining(\" \"));\n```",
          prog(LIRE_NOTES, "java.util.*,java.util.stream.*"),
          prog(LIRE_NOTES + 'System.out.println("Admis : " + notes.stream().filter(x -> x >= 10).count());\nSystem.out.println(notes.stream().filter(x -> x >= 10).sorted().map(String::valueOf).collect(Collectors.joining(" ")));', "java.util.*,java.util.stream.*"),
          [(["5", "12", "5", "19", "8", "10"], "Admis : 3\n10 12 19"), (["3", "9", "20", "4"], "Admis : 1\n20")],
          [("Utilise <code>stream()</code> et <code>filter</code>", "code", r"\.stream\s*\(\s*\)[\s\S]*\.filter\s*\(")],
          "`notes.stream().filter(x -> x >= 10).count()` ; pour l'affichage : `.sorted().map(String::valueOf).collect(Collectors.joining(\" \"))`."),
    ]),
    ("Dessiner et bouger", ["java-dessin", "java-bouger", "java-rebond", "java-clics"]),
    ("Mini-jeux", [
        "java-saut", "java-fruits",
        J("etoiles", JEU_IMP + '    List<double[]> etoiles = new ArrayList<>();     // chaque étoile : {x, y}\n\n    public void setup() {\n        // crée les 5 étoiles\n    }\n\n    public void update(double dt) {\n    }\n\n    public void draw() {\n        effacer("black");\n    }\n' + JEU_FIN,
          JEU_IMP + '    List<double[]> etoiles = new ArrayList<>();     // chaque étoile : {x, y}\n\n    public void setup() {\n        for (int i = 0; i < 5; i++) {\n            etoiles.add(new double[]{60 + i * 90, i * 40});\n        }\n    }\n\n    public void update(double dt) {\n        for (double[] e : etoiles) {\n            e[1] += 2;\n            if (e[1] > 320) e[1] = 0;\n        }\n    }\n\n    public void draw() {\n        effacer("black");\n        for (double[] e : etoiles) {\n            cercle(e[0], e[1], 3, "white");\n        }\n    }\n' + JEU_FIN,
          'etoiles.add(new double[]{60, 0});          // ajoute une étoile {x, y}\nfor (double[] e : etoiles) e[1] += 2;      // modifie son y', "Crée les étoiles dans `setup` : `etoiles.add(new double[]{60 + i * 90, i * 40});`. `e[0]` est le x, `e[1]` le y."),
        J("tir", JEU_IMP + '    double x = 220;\n    List<double[]> tirs = new ArrayList<>();        // chaque tir : {x, y}\n\n    public void update(double dt) {\n    }\n\n    public void draw() {\n        effacer("black");\n        rect(x, 290, 40, 20, "blue");\n    }\n' + JEU_FIN,
          JEU_IMP + '    double x = 220;\n    List<double[]> tirs = new ArrayList<>();        // chaque tir : {x, y}\n\n    public void update(double dt) {\n        if (touche("gauche")) x -= 5;\n        if (touche("droite")) x += 5;\n        if (toucheAppuyee("espace")) tirs.add(new double[]{x + 18, 280});\n        for (double[] t : tirs) t[1] -= 8;\n        tirs.removeIf(t -> t[1] < 0);\n    }\n\n    public void draw() {\n        effacer("black");\n        rect(x, 290, 40, 20, "blue");\n        for (double[] t : tirs) {\n            rect(t[0], t[1], 4, 10, "yellow");\n        }\n    }\n' + JEU_FIN,
          'tirs.removeIf(t -> t[1] < 0);   // retire les tirs sortis de l\'écran', "`toucheAppuyee(\"espace\")` n'est vrai qu'une image par appui. `removeIf` retire les tirs dont le y est négatif."),
    ]),
]
