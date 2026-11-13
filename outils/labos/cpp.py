"""Labo C++ : leçons et missions (voir lua.py pour les conventions)."""


def prog(inc, corps, avant=""):
    """Programme complet : #include, using namespace std, déclarations éventuelles, puis main."""
    return ("".join("#include <%s>\n" % i for i in inc.split(",")) + "using namespace std;\n\n" + (avant.strip("\n") + "\n\n" if avant else "") +
            "int main() {\n" + "".join(("    " + l if l else "") + "\n" for l in corps.strip("\n").split("\n")) + "    return 0;\n}\n")


ANIMAL = '''class Animal {
protected:
    string nom;
public:
    Animal(const string& nom) : nom(nom) {}
    virtual string crier() const = 0;
    void presenter() const { cout << nom << " fait " << crier() << endl; }
    virtual ~Animal() = default;
};
'''
MAIN_ANIMAL = 'Chien rex("Rex");\nChat tigrou("Tigrou");\nvector<const Animal*> animaux = {&rex, &tigrou};\nfor (const Animal* a : animaux) a->presenter();'
OBJET = '''struct Objet {
    string nom;
    Objet(const string& n) : nom(n) { cout << "création de " << nom << endl; }
    ~Objet() { cout << "destruction de " << nom << endl; }
};
'''
VEC_MAIN = 'Vec a{1, 2}, b{3, 4};\ncout << a + b << endl;\ncout << a + b + Vec{10, 10} << endl;'
TPL_MAIN = 'cout << plusGrand(3, 8) << endl;\ncout << plusGrand(2.5, 1.5) << endl;\ncout << plusGrand(string("pomme"), string("poire")) << endl;'

LECONS = [
    ("Afficher et calculer", [
        "cpp-afficher", "cpp-age", "cpp-ttc",
        K("conv", prog("iostream", "int s;\ncin >> s;\n"),
          prog("iostream", 'int s;\ncin >> s;\nint h = s / 3600;\nint m = (s % 3600) / 60;\ncout << h << " h " << m << " min " << s % 60 << " s" << endl;'),
          'cout << 7 / 2 << " " << 7 % 2;   // 3 1', "`s / 3600` donne les heures (division entière) ; `(s % 3600) / 60` les minutes ; `s % 60` les secondes."),
        K("moyenne", prog("iostream", "double a, b, c;\ncin >> a >> b >> c;\n"),
          prog("iostream,iomanip", 'double a, b, c;\ncin >> a >> b >> c;\ncout << fixed << setprecision(2) << "Moyenne : " << (a + b + c) / 3 << endl;'),
          '#include <iomanip>\ncout << fixed << setprecision(2) << 3.14159;   // 3.14', "Inclus `<iomanip>` puis écris `cout << fixed << setprecision(2)` avant la valeur. Lis les notes dans des `double`."),
    ]),
    ("Conditions et boucles", [
        "cpp-parite",
        K("mention", prog("iostream", "double note;\ncin >> note;\n"),
          prog("iostream", 'double note;\ncin >> note;\nif (note < 10) cout << "Insuffisant" << endl;\nelse if (note < 12) cout << "Passable" << endl;\nelse if (note < 14) cout << "Assez bien" << endl;\nelse if (note < 16) cout << "Bien" << endl;\nelse cout << "Très bien" << endl;'),
          'if (x < 10) { … }\nelse if (x < 20) { … }\nelse { … }', "Enchaîne les `else if` du plus petit seuil au plus grand."),
        "cpp-table", "cpp-somme",
        K("fizzbuzz", prog("iostream", "int n;\ncin >> n;\n"),
          prog("iostream", 'int n;\ncin >> n;\nfor (int i = 1; i <= n; i++) {\n    if (i % 15 == 0) cout << "FizzBuzz" << endl;\n    else if (i % 3 == 0) cout << "Fizz" << endl;\n    else if (i % 5 == 0) cout << "Buzz" << endl;\n    else cout << i << endl;\n}'),
          'if (i % 3 == 0) { … }   // i est un multiple de 3', "Teste d'abord le cas « multiple de 15 », sinon il ne sera jamais atteint."),
        K("rebours", prog("iostream", "int n;\ncin >> n;\n"),
          prog("iostream", 'int n;\ncin >> n;\nfor (int i = n; i >= 1; i--) {\n    cout << i << endl;\n}\ncout << "Décollage !" << endl;'),
          'for (int i = 10; i >= 1; i--) { … }', "`for (int i = n; i >= 1; i--)`"),
        K("devine", prog("iostream", "const int SECRET = 42;\nint essais = 0;\n"),
          prog("iostream", 'const int SECRET = 42;\nint essai, essais = 0;\ndo {\n    cin >> essai;\n    essais++;\n    if (essai < SECRET) cout << "Trop petit" << endl;\n    else if (essai > SECRET) cout << "Trop grand" << endl;\n} while (essai != SECRET);\ncout << "Gagné ! Essais : " << essais << endl;'),
          'do {\n    …\n} while (condition);   // au moins un tour', "Une boucle `do { … } while (essai != SECRET);` : il y a toujours au moins un essai."),
        K("pgcd", prog("iostream", "int a, b;\ncin >> a >> b;\n"),
          prog("iostream", 'int a, b;\ncin >> a >> b;\nwhile (b != 0) {\n    int reste = a % b;\n    a = b;\n    b = reste;\n}\ncout << "PGCD : " << a << endl;'),
          'int reste = a % b;   // garde le reste avant de modifier a', "Dans la boucle : calcule le reste, puis `a = b; b = reste;`."),
    ]),
    ("Fonctions et références", [
        "cpp-premier",
        M("cpp-reference", "Échanger par référence",
          "La fonction **echanger** doit échanger les valeurs de ses deux arguments. Telle qu'elle est écrite, elle ne modifie que des copies : corrige sa première ligne pour qu'elle agisse sur les variables de `main`. Le programme lit a et b puis les affiche après l'échange.\n\n**Exemple**\n\n```\nvoid doubler(int& n) {   // & : n désigne la variable d'origine\n    n = n * 2;\n}\n```",
          prog("iostream", 'int a, b;\ncin >> a >> b;\nechanger(a, b);\ncout << a << " " << b << endl;', "void echanger(int a, int b) {\n    int temp = a;\n    a = b;\n    b = temp;\n}"),
          prog("iostream", 'int a, b;\ncin >> a >> b;\nechanger(a, b);\ncout << a << " " << b << endl;', "void echanger(int& a, int& b) {\n    int temp = a;\n    a = b;\n    b = temp;\n}"),
          [(["3", "7"], "7 3"), (["-1", "5"], "5 -1")],
          [("Les paramètres sont des références", "code", r"echanger\s*\(\s*int\s*&\s*\w+\s*,\s*int\s*&")],
          "Ajoute `&` après le type de chaque paramètre : `void echanger(int& a, int& b)`."),
        K("minmax", prog("iostream,vector", "int n;\ncin >> n;\n", "// écris ici une fonction qui calcule le minimum et le maximum"),
          prog("iostream,vector", 'int n;\ncin >> n;\nvector<int> t(n);\nfor (int& v : t) cin >> v;\nint mini, maxi;\nminmax(t, mini, maxi);\ncout << "Min : " << mini << endl;\ncout << "Max : " << maxi << endl;',
               "void minmax(const vector<int>& t, int& mini, int& maxi) {\n    mini = maxi = t[0];\n    for (int v : t) {\n        if (v < mini) mini = v;\n        if (v > maxi) maxi = v;\n    }\n}"),
          'void f(const vector<int>& t, int& a, int& b) {   // deux résultats par référence\n    a = t[0];\n    b = t[1];\n}', "Une fonction ne renvoie qu'une valeur : passe `mini` et `maxi` **par référence** (`int& mini, int& maxi`).",
          [("Une fonction transmet les deux résultats (références, pair ou struct)", "code", r"&\s*\w+\s*,[^)]*&\s*\w+\s*\)|pair\s*<|struct\s+\w+")]),
        K("factorielle", prog("iostream", "int n;\ncin >> n;\n", "long long factorielle(int n) {\n    // à compléter\n    return 0;\n}"),
          prog("iostream", 'int n;\ncin >> n;\ncout << n << "! = " << factorielle(n) << endl;', "long long factorielle(int n) {\n    if (n <= 1) return 1;\n    return n * factorielle(n - 1);\n}"),
          'int compte(int n) {\n    if (n == 0) return 0;        // cas d\'arrêt\n    return 1 + compte(n - 1);    // appel récursif\n}', "Cas d'arrêt : `if (n <= 1) return 1;`. Sinon `return n * factorielle(n - 1);`.",
          [("La fonction s'appelle elle-même", "code", r"\b(\w+)\s*\(\s*(?:int|long|unsigned)[^)]*\)\s*\{[\s\S]*\b\1\s*\([\s\S]*\b\1\s*\(")]),
        K("fibo", prog("iostream", "int n;\ncin >> n;\n"),
          prog("iostream", 'int n;\ncin >> n;\nlong long a = 0, b = 1;\nfor (int i = 0; i < n; i++) {\n    if (i > 0) cout << " ";\n    cout << a;\n    long long suivant = a + b;\n    a = b;\n    b = suivant;\n}\ncout << endl;'),
          'long long suivant = a + b;\na = b;\nb = suivant;', "Deux variables `a` et `b` ; à chaque tour affiche `a`, puis avance : `suivant = a + b; a = b; b = suivant;`."),
        K("binaire", prog("iostream,string", "int n;\ncin >> n;\n"),
          prog("iostream,string", 'int n;\ncin >> n;\nstring bits = "";\nif (n == 0) bits = "0";\nwhile (n > 0) {\n    bits = to_string(n % 2) + bits;\n    n /= 2;\n}\ncout << bits << endl;'),
          'string s = to_string(1) + "0";   // "10"', "Ajoute chaque reste **devant** : `bits = to_string(n % 2) + bits;`. Pense au cas n = 0."),
    ]),
    ("Vector et string", [
        "cpp-tableau",
        K("inverser", prog("iostream,vector,string", "int n;\ncin >> n;\nvector<string> t(n);\n"),
          prog("iostream,vector,string", 'int n;\ncin >> n;\nvector<string> t(n);\nfor (string& s : t) cin >> s;\nfor (int i = n - 1; i >= 0; i--) {\n    cout << t[i];\n    if (i > 0) cout << " ";\n}\ncout << endl;'),
          'for (int i = n - 1; i >= 0; i--) { … }   // du dernier au premier', "Parcours les indices de `n - 1` à `0`."),
        K("tri", prog("iostream,vector", "int n;\ncin >> n;\nvector<int> t(n);\n"),
          prog("iostream,vector,algorithm", 'int n;\ncin >> n;\nvector<int> t(n);\nfor (int& v : t) cin >> v;\nsort(t.begin(), t.end());\nfor (int i = 0; i < n; i++) {\n    if (i > 0) cout << " ";\n    cout << t[i];\n}\ncout << endl;'),
          '#include <algorithm>\nsort(t.begin(), t.end());', "Inclus `<algorithm>` puis `sort(t.begin(), t.end());`."),
        "cpp-palindrome",
        K("voyelles", prog("iostream,string", "string mot;\ncin >> mot;\n"),
          prog("iostream,string", 'string mot;\ncin >> mot;\nint n = 0;\nfor (char c : mot) {\n    if (string("aeiouy").find(c) != string::npos) n++;\n}\ncout << "Voyelles : " << n << endl;'),
          'for (char c : mot) { … }                       // chaque caractère\nif (string("abc").find(c) != string::npos) { … }   // c est-il dans "abc" ?', "Parcours le mot avec `for (char c : mot)` et teste si `c` fait partie de `\"aeiouy\"`."),
        K("mots", prog("iostream,string", "string mot;\nint n = 0;\n"),
          prog("iostream,string", 'string mot;\nint n = 0;\nwhile (cin >> mot) n++;\ncout << "Mots : " << n << endl;'),
          'while (cin >> mot) { … }   // lit un mot à la fois, tant qu\'il en reste', "`cin >> mot` saute tous les espaces et renvoie faux quand il n'y a plus rien à lire."),
        K("cesar", prog("iostream,string", "string texte;\ngetline(cin, texte);\n"),
          prog("iostream,string", "string texte;\ngetline(cin, texte);\nfor (char& c : texte) {\n    if (c >= 'a' && c <= 'z') c = 'a' + (c - 'a' + 3) % 26;\n}\ncout << texte << endl;"),
          "char c = 'a' + 2;        // 'c' : un char est un nombre\nint rang = 'e' - 'a';    // 4", "`c - 'a'` donne le rang de 0 à 25 ; ajoute 3, prends le reste modulo 26, rajoute `'a'`. Parcours avec `char&` pour modifier."),
        K("parentheses", prog("iostream,string", "string expr;\ngetline(cin, expr);\nint niveau = 0;\n"),
          prog("iostream,string", 'string expr;\ngetline(cin, expr);\nint niveau = 0;\nbool ok = true;\nfor (char c : expr) {\n    if (c == \'(\') niveau++;\n    else if (c == \')\') {\n        niveau--;\n        if (niveau < 0) ok = false;\n    }\n}\ncout << (ok && niveau == 0 ? "équilibré" : "non équilibré") << endl;'),
          "if (c == '(') niveau++;", "Deux conditions : le compteur ne passe jamais sous 0, et il vaut 0 à la fin."),
    ]),
    ("Pointeurs, classes et héritage", [
        M("cpp-pointeur", "Agir à travers un pointeur",
          "Complète **doubler** : elle reçoit un **pointeur** vers un entier et double la valeur pointée. Si le pointeur est `nullptr`, elle ne fait rien (sans planter). Le programme lit n, appelle `doubler(&n)` puis `doubler(nullptr)`, et affiche n.\n\n**Exemple**\n\n```\nvoid zero(int* p) {\n    if (p != nullptr) *p = 0;   // *p : la valeur pointée\n}\n```",
          prog("iostream", "int n;\ncin >> n;\ndoubler(&n);\ndoubler(nullptr);\ncout << n << endl;", "void doubler(int* p) {\n    // à compléter\n}"),
          prog("iostream", "int n;\ncin >> n;\ndoubler(&n);\ndoubler(nullptr);\ncout << n << endl;", "void doubler(int* p) {\n    if (p != nullptr) *p = *p * 2;\n}"),
          [(["21"], "42"), (["-4"], "-8")],
          [("Le pointeur est testé avant d'être utilisé", "code", r"nullptr|if\s*\(\s*!?\s*p\s*\)")],
          "`if (p != nullptr) *p = *p * 2;`"),
        M("cpp-struct", "Une struct et un vector",
          "Définis une struct **Produit** (nom, prix, quantité : des entiers pour le prix et la quantité). Lis un entier n, puis n produits : nom, prix et quantité, chacun sur sa ligne. Range-les dans un `vector<Produit>`. Affiche ensuite, pour chaque produit, **nom : montant** (prix × quantité), puis **Total : X**.\n\n**Exemple**\n\n```\nstruct Point {\n    int x, y;\n};\nvector<Point> pts;\npts.push_back({3, 4});\n```",
          prog("iostream,vector,string", "int n;\ncin >> n;\n", "// définis ici la struct Produit"),
          prog("iostream,vector,string", 'int n;\ncin >> n;\nvector<Produit> produits(n);\nfor (Produit& p : produits) cin >> p.nom >> p.prix >> p.quantite;\nint total = 0;\nfor (const Produit& p : produits) {\n    cout << p.nom << " : " << p.prix * p.quantite << endl;\n    total += p.prix * p.quantite;\n}\ncout << "Total : " << total << endl;', "struct Produit {\n    string nom;\n    int prix;\n    int quantite;\n};"),
          [(["2", "souris", "20", "3", "clavier", "50", "1"], "souris : 60\nclavier : 50\nTotal : 110"), (["1", "ecran", "150", "2"], "ecran : 300\nTotal : 300")],
          [("Une <code>struct Produit</code> est définie", "code", r"struct\s+Produit\s*\{")],
          "N'oublie pas le point-virgule après l'accolade fermante de la struct."),
        "cpp-compte",
        M("cpp-heritage", "Héritage et polymorphisme",
          "La classe abstraite **Animal** est écrite. Crée deux classes filles : **Chien**, dont `crier()` renvoie `\"Ouaf\"`, et **Chat**, dont `crier()` renvoie `\"Miaou\"`. Le `main` déjà écrit les parcourt à travers des pointeurs vers `Animal`.\n\n**Exemple**\n\n```\nclass Fille : public Mere {\npublic:\n    Fille(const string& nom) : Mere(nom) {}      // appelle le constructeur de la mère\n    string methode() const override { return \"…\"; }\n};\n```",
          prog("iostream,string,vector", MAIN_ANIMAL, ANIMAL + "\n// à compléter : les classes Chien et Chat"),
          prog("iostream,string,vector", MAIN_ANIMAL, ANIMAL + '\nclass Chien : public Animal {\npublic:\n    Chien(const string& nom) : Animal(nom) {}\n    string crier() const override { return "Ouaf"; }\n};\n\nclass Chat : public Animal {\npublic:\n    Chat(const string& nom) : Animal(nom) {}\n    string crier() const override { return "Miaou"; }\n};'),
          [([], "Rex fait Ouaf\nTigrou fait Miaou")],
          [("Les deux classes héritent d'<code>Animal</code>", "code", r"class\s+Chien\s*:\s*public\s+Animal[\s\S]*class\s+Chat\s*:\s*public\s+Animal|class\s+Chat\s*:\s*public\s+Animal[\s\S]*class\s+Chien\s*:\s*public\s+Animal"),
           ("<code>crier</code> est redéfinie avec <code>override</code>", "code", r"crier\s*\(\s*\)\s*const\s+override")],
          "`class Chien : public Animal { public: Chien(const string& nom) : Animal(nom) {} string crier() const override { return \"Ouaf\"; } };`"),
        M("cpp-smart", "Un pointeur intelligent",
          "Ce programme crée un objet avec `new` et oublie de le libérer : son destructeur ne s'exécute jamais (**fuite de mémoire**). Remplace le pointeur brut par un **unique_ptr** créé avec `make_unique` : la destruction devient automatique, sans `new` ni `delete`.\n\n**Exemple**\n\n```\n#include <memory>\nauto p = make_unique<Objet>(\"clé\");   // détruit tout seul à la fin du bloc\ncout << p->nom;\n```",
          prog("iostream,string,memory", 'Objet* o = new Objet("potion");\ncout << o->nom << endl;', OBJET),
          prog("iostream,string,memory", 'auto o = make_unique<Objet>("potion");\ncout << o->nom << endl;', OBJET),
          [([], "création de potion\npotion\ndestruction de potion")],
          [("Utilise <code>make_unique</code>", "code", r"make_unique\s*<\s*Objet\s*>"), ("Plus de <code>new</code> ni de <code>delete</code>", "nocode", r"\bnew\s+Objet|\bdelete\b")],
          "`auto o = make_unique<Objet>(\"potion\");`"),
    ]),
    ("STL, lambdas et templates", [
        K("inventaire", prog("iostream,string,map", "int n;\ncin >> n;\nmap<string, int> stock;\n"),
          prog("iostream,string,map", 'int n;\ncin >> n;\nmap<string, int> stock;\nfor (int i = 0; i < n; i++) {\n    string nom;\n    int qte;\n    cin >> nom >> qte;\n    stock[nom] += qte;\n}\nfor (const auto& [nom, qte] : stock) {\n    cout << nom << " : " << qte << endl;\n}'),
          'stock[nom] += qte;                          // clé absente : démarre à 0\nfor (const auto& [cle, valeur] : stock) { … }   // dans l\'ordre des clés', "Une `map<string, int>` garde ses clés triées : il suffit de la parcourir."),
        K("doublons", prog("iostream,string,set", "int n;\ncin >> n;\nset<string> vus;\n"),
          prog("iostream,string,set,vector", 'int n;\ncin >> n;\nset<string> vus;\nvector<string> res;\nfor (int i = 0; i < n; i++) {\n    string mot;\n    cin >> mot;\n    if (vus.insert(mot).second) res.push_back(mot);\n}\nfor (size_t i = 0; i < res.size(); i++) {\n    if (i > 0) cout << " ";\n    cout << res[i];\n}\ncout << endl;'),
          'set<string> vus;\nif (vus.count(mot) == 0) { vus.insert(mot); … }   // jamais vu', "Un `set` sert à savoir ce qui a déjà été vu ; un `vector` garde l'ordre d'apparition."),
        M("cpp-lambda", "Compter avec une lambda",
          "Lis un entier n, puis n notes. Affiche **Admis : X**, où X est le nombre de notes supérieures ou égales à 10. Utilise l'algorithme `count_if` avec une **lambda**, sans écrire de boucle de comptage.\n\n**Exemple**\n\n```\n#include <algorithm>\nint n = count_if(v.begin(), v.end(), [](int x) { return x % 2 == 0; });   // nombre de pairs\n```",
          prog("iostream,vector,algorithm", "int n;\ncin >> n;\nvector<double> notes(n);\nfor (double& x : notes) cin >> x;\n"),
          prog("iostream,vector,algorithm", 'int n;\ncin >> n;\nvector<double> notes(n);\nfor (double& x : notes) cin >> x;\nint admis = count_if(notes.begin(), notes.end(), [](double x) { return x >= 10; });\ncout << "Admis : " << admis << endl;'),
          [(["5", "12", "5", "19", "8", "10"], "Admis : 3"), (["2", "9", "9.5"], "Admis : 0"), (["1", "10"], "Admis : 1")],
          [("Utilise <code>count_if</code> avec une lambda", "code", r"count_if\s*\([\s\S]*\[[^\]]*\]\s*\(")],
          "`count_if(notes.begin(), notes.end(), [](double x) { return x >= 10; })`"),
        M("cpp-template", "Une fonction template",
          "Écris **une seule** fonction template **plusGrand(a, b)** qui renvoie le plus grand de ses deux arguments, quel que soit leur type. Le `main` déjà écrit l'appelle avec des entiers, des réels et des chaînes.\n\n**Exemple**\n\n```\ntemplate <typename T>\nT premier(T a, T b) {\n    return a;\n}\n```",
          prog("iostream,string", TPL_MAIN, "// à compléter : la fonction template plusGrand"),
          prog("iostream,string", TPL_MAIN, "template <typename T>\nT plusGrand(T a, T b) {\n    return a > b ? a : b;\n}"),
          [([], "8\n2.5\npomme")],
          [("Une seule fonction, déclarée avec <code>template</code>", "code", r"template\s*<\s*(typename|class)\s+\w+\s*>"), ("Pas de surcharge type par type", "nocode", r"\b(int|double|string)\s+plusGrand\s*\(")],
          "`template <typename T> T plusGrand(T a, T b) { return a > b ? a : b; }`"),
        M("cpp-vecteur", "Surcharger des opérateurs",
          "Complète la struct **Vec** pour que deux vecteurs s'additionnent avec `+`, et écris l'opérateur `<<` pour qu'un vecteur s'affiche sous la forme **(x, y)**.\n\n**Exemple**\n\n```\nstruct P {\n    int v;\n    P operator+(const P& o) const { return {v + o.v}; }\n};\nostream& operator<<(ostream& f, const P& p) { return f << p.v; }\n```",
          prog("iostream", VEC_MAIN, "struct Vec {\n    double x, y;\n    // à compléter : operator+\n};\n\n// à compléter : operator<<"),
          prog("iostream", VEC_MAIN, 'struct Vec {\n    double x, y;\n    Vec operator+(const Vec& o) const { return {x + o.x, y + o.y}; }\n};\n\nostream& operator<<(ostream& f, const Vec& v) {\n    return f << "(" << v.x << ", " << v.y << ")";\n}'),
          [([], "(4, 6)\n(14, 16)")],
          [("<code>operator+</code> et <code>operator&lt;&lt;</code> sont définis", "code", r"operator\s*\+[\s\S]*operator\s*<<")],
          "`operator<<` s'écrit **hors** de la struct et renvoie le flux : `ostream& operator<<(ostream& f, const Vec& v)`."),
    ]),
    ("Dessiner et bouger", ["cpp-dessin", "cpp-bouger", "cpp-rebond", "cpp-clics"]),
    ("Mini-jeux", [
        "cpp-saut", "cpp-fruits",
        J("etoiles", '#include "jeu.h"\n#include <vector>\n\nstruct Etoile { double x, y; };\nstd::vector<Etoile> etoiles;\n\nvoid setup() {\n    // crée les 5 étoiles\n}\n\nvoid update(double dt) {\n}\n\nvoid draw() {\n    effacer("black");\n}\n',
          '#include "jeu.h"\n#include <vector>\n\nstruct Etoile { double x, y; };\nstd::vector<Etoile> etoiles;\n\nvoid setup() {\n    for (int i = 0; i < 5; i++) {\n        etoiles.push_back({60.0 + i * 90, i * 40.0});\n    }\n}\n\nvoid update(double dt) {\n    for (Etoile& e : etoiles) {\n        e.y += 2;\n        if (e.y > 320) e.y = 0;\n    }\n}\n\nvoid draw() {\n    effacer("black");\n    for (const Etoile& e : etoiles) {\n        cercle(e.x, e.y, 3, "white");\n    }\n}\n',
          'etoiles.push_back({60.0, 0.0});            // ajoute une étoile\nfor (Etoile& e : etoiles) e.y += 2;        // & : modifie l\'original', "Crée les étoiles dans `setup` : `etoiles.push_back({60.0 + i * 90, i * 40.0});`. Parcours avec `Etoile&` pour les déplacer."),
        J("tir", '#include "jeu.h"\n#include <vector>\n#include <algorithm>\n\nstruct Tir { double x, y; };\ndouble x = 220;\nstd::vector<Tir> tirs;\n\nvoid setup() {\n}\n\nvoid update(double dt) {\n}\n\nvoid draw() {\n    effacer("black");\n    rect(x, 290, 40, 20, "blue");\n}\n',
          '#include "jeu.h"\n#include <vector>\n#include <algorithm>\n\nstruct Tir { double x, y; };\ndouble x = 220;\nstd::vector<Tir> tirs;\n\nvoid setup() {\n}\n\nvoid update(double dt) {\n    if (touche("gauche")) x -= 5;\n    if (touche("droite")) x += 5;\n    if (toucheAppuyee("espace")) tirs.push_back({x + 18, 280});\n    for (Tir& t : tirs) t.y -= 8;\n    tirs.erase(std::remove_if(tirs.begin(), tirs.end(), [](const Tir& t) { return t.y < 0; }), tirs.end());\n}\n\nvoid draw() {\n    effacer("black");\n    rect(x, 290, 40, 20, "blue");\n    for (const Tir& t : tirs) {\n        rect(t.x, t.y, 4, 10, "yellow");\n    }\n}\n',
          'tirs.erase(std::remove_if(tirs.begin(), tirs.end(),\n    [](const Tir& t) { return t.y < 0; }), tirs.end());   // supprime les tirs sortis', "`toucheAppuyee(\"espace\")` n'est vrai qu'une image par appui. Supprime avec l'idiome `erase` + `remove_if`."),
    ]),
]
