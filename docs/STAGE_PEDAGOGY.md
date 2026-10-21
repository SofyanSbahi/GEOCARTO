# GéoCarto · Stage v2 — enseigner par la projection

> Ce document répond à une question : **que doit voir un étudiant assis au dernier rang ?** — et en tire une conception, pas un agrandissement.
> Statut : vague 1 livrée (moteur de leçons + 5 leçons + tests + audit). Les vagues 2 à 5 sont décrites en §9.

---

## 1. Diagnostic : pourquoi on zoome encore

Zoomer le navigateur multiplie la taille des pixels, pas la **quantité d'information par écran**. Une page d'étude contient 8 à 20 éléments (titre, consigne, carte, légende, boutons, résultats) conçus pour être lus à 50 cm. En projection, 125 % ou 150 % fait déborder la page, introduit un défilement, sépare la consigne de la figure et laisse intacte la **charge cognitive** (tout est là en même temps).

Trois causes distinctes, trois remèdes distincts :

| Cause | Symptôme | Remède Stage v2 |
|---|---|---|
| **Taille** | texte sous le seuil d'acuité du dernier rang | repère logique fixe + taille minimale imposée par le code (§3) |
| **Densité** | trop d'éléments, la figure est écrasée | une idée par scène ; un élément par étape ; détails secondaires retirés en amphi (`lo()`) |
| **Modalité** | une page à lire, pas une scène à regarder | scènes, étapes, révélation progressive, vote, minuteur (§4) |

La conséquence pour votre cahier des charges : *« pas de zoom »* se garantit par une **grammaire de scène** et des **tests automatiques**, pas par un gros réglage de police.

## 2. Ce que voit le dernier rang — la spécification

Hypothèse de calcul (celle de `recommendedScale`, `js/stage/tools.js`) : capitale = 0,72 × corps, seuil 10′ d'arc (2× la limite d'acuité, pour le confort). Taille de corps nécessaire, en % de la hauteur d'écran :

| Largeur d'écran | 10 m | 15 m | 20 m | 25 m | 30 m |
|---|---|---|---|---|---|
| 2,5 m (salle de TD) | 2,5 | 4,3 | 5,7 | 7,2 | 8,6 |
| 3 m | 2,4 | 3,6 | 4,8 | 6,0 | 7,2 |
| 4 m | 1,8 | 2,7 | 3,6 | 4,5 | 5,4 |
| 5 m (grand amphi) | 1,4 | 2,2 | 2,9 | 3,6 | 4,3 |

Trois niveaux de texte, dans une unité **u = 1 % de la hauteur d'écran** (× facteur de salle) :

| Niveau | Taille | Lisible à (écran 3 m) | Usage |
|---|---|---|---|
| **Chiffre clé** | ≥ 6–9 u | ≥ 25 m | le résultat que toute la salle doit retenir (« 25 % », « 52° », « 400 m ») |
| **Légende** | 4,9 u | ≈ 20 m | la phrase de l'étape en cours (≤ 14 mots) |
| **Étiquette** | ≥ 3,4 u | ≈ 14 m | valeurs lues sur la figure ; *jamais la seule porteuse d'un sens* |

Règles qui découlent de ce tableau, appliquées par `js/stage/kit.js` et vérifiées par `tests/lessons.test.js` et `tools/stage/audit_lessons.py` :

1. **Aucun texte sous 3,4 u** dans une figure (le kit relève toute taille inférieure). Mesure réelle à 1920×1080 : 3,46 – 3,66 % de la hauteur.
2. **Traits ≥ 0,35 unité logique** ; halo blanc sous chaque chiffre posé sur un dessin.
3. **Légende ≤ 14 mots**, une ligne si possible (deux au maximum).
4. **Une idée par scène** : son titre (≤ 8 mots) est visible en permanence en haut.
5. **La couleur ne porte jamais seule** : chaque type de séquence a une icône + une forme ; les options d'un vote ont une lettre ; un bon choix a une coche, un mauvais une croix. Palette sûre pour le daltonisme (bleu / orange / vert foncé / rouge).
6. **Détails secondaires retirés en amphi** (`lo(...)`), le texte restant est plus *grand*, pas plus *nombreux*.
7. **Fond blanc pur sur les figures**, noir pur pour le texte (les projecteurs lavent les gris moyens).

Réglage de la salle : touches `+` / `−` (×0,8 → ×2,5), mémorisé par appareil. **Touche `K` : test du dernier rang** — trois lignes de tailles connues ; la ligne A (étiquettes, 3,4 u) doit être nette depuis le dernier rang ; sinon augmenter jusqu'à ce qu'elle le soit. C'est la seule mesure qui vaut ; les tableaux ci-dessus sont une heuristique à valider en salle (voir §9, vague 5).

## 3. Hypothèses que je conteste (et pourquoi)

1. **« Agrandir »** → *reconcevoir*. Une figure projetée est un dessin dans un cadre de 160 × 70 unités logiques, identique du téléphone au vidéoprojecteur. La taille ne dépend plus de la fenêtre.
2. **« Une page par notion »** → *une scène par idée, une étape par élément*. L'enseignant ne défile pas : il **révèle**, au rythme de sa parole. L'élément qui vient d'apparaître est animé (1 seul à la fois) : c'est le pointeur de l'attention.
3. **« Expliquer, puis faire pratiquer »** → *alterner*. Test automatique : **jamais plus de 4 séquences passives de suite, ni plus de 8 minutes sans que les étudiants agissent** (accroche, vote ou exercice). Votre critère « participation toutes les quelques minutes » devient une contrainte du code, pas un vœu.
4. **« Donner la bonne réponse, puis vérifier »** → *faire parier d'abord*. Chaque notion difficile s'ouvre par une accroche (prédire) ou un vote ; la correction **nomme** le malentendu majoritaire (« courbes espacées = pente forte »). Le malentendu a un identifiant stable (`data/errors.js` : `p-regle`, `t-penteinv`…), donc on peut le compter sur plusieurs séances.
5. **« Des boîtiers de vote »** → *non nécessaires*. L'enseignant compte les mains et appuie sur `a b c d` ; les totaux sont gardés localement (`gc_stage_log`) et affichés en barres. Un vote à distance viendra avec le Class Hub, pas avant d'en avoir besoin.
6. **« Le profil s'explique »** → *le profil se construit*. L'étape clé est de reporter **un point à la fois**, en faisant annoncer l'altitude *avant* de la révéler. La leçon fait ce geste devant la salle, avec les mêmes fonctions que l'espace élève (`crossings`, `curveFn`, `paperAdvice`).
7. **« Onze thèmes »** → *oui, mais pas onze blocs égaux*. Contour lines / interval / spot heights forment **une seule lecture de carte** vécue en trois temps ; je les garde séparés dans l'index (votre séquence) mais ils partageront la même scène de carte (vague 2). À l'inverse, **la pente** mérite une leçon propre *avant* les formes, parce qu'elle relie le calcul (H/D) et la carte (espacement des courbes).
8. **« Texte en haut, figure en bas »** → *figure d'abord*. La légende est sous la figure ; la figure occupe ≥ 75 % de la hauteur utile.

## 4. La grammaire de scène

Une leçon = une suite de **scènes** ; une scène = **une idée** et plusieurs **étapes**.

| Type | Icône | Rôle pédagogique | Étapes |
|---|---|---|---|
| **Accroche** (`hook`) | ? | faire prédire, créer le besoin | 3 |
| **Démonstration** (`show`) | œil | montrer un rapport ; **↑ ↓ fait varier un paramètre** devant la salle | 3–4 |
| **Construction** (`build`) | crayon | faire *vivre* une méthode, un élément à la fois | 3 à 15 |
| **Vote** (`vote`) | main | prédire / diagnostiquer ; compter les mains ; **nommer les malentendus** | 3 fixes (question → décompte → correction) |
| **À vous** (`practice`) | crayon | un exercice du moteur (ou tracer sur papier), **minuteur**, correction | 3 fixes (énoncé → minuteur → corrigé) |
| **Bilan** (`recap`) | coche | 3 phrases à retenir ; les étudiants reformulent | 3 |

Commandes (télécommande de salle comprise) : `→`/Espace/PgDn suivant · `←` précédent · `↑ ↓` paramètre · `a b c d` votes (Maj retire) · `B` écran vide · `T` clair/sombre · `+ −` taille · `K` test dernier rang · `N` autre terrain · `F` plein écran · `P` vue enseignant · `H` aide · Échap sortir. Toucher : tiers gauche = précédent, le reste = suivant ; les cartes de vote se touchent.

**Rail de progression** : une pastille par scène, avec l'icône de son type. Un liseré orange apparaît s'il s'écoule 4 séquences passives de suite.

**Vue enseignant** (`#/stage/<leçon>/presenter`, 2ᵉ fenêtre) : note de la scène, **question à poser**, décompte des votes, scène suivante, minuteurs, commandes. Aucune dépendance réseau (BroadcastChannel ; sous `file://` certaines versions de navigateur ne synchronisent pas — l'avertissement est affiché).

## 5. Fondements (sans jargon superflu)

* **Prédire avant de voir** (accroches, `hide`) : améliore la rétention et révèle les conceptions initiales.
* **Instruction par les pairs** (votes) : on vote seul, on débat, on revote — ici le débat est déclenché par le malentendu nommé.
* **Charge cognitive** : une idée, une étape, ≤ 14 mots, figure et étiquette adjacentes (contiguïté), révélation progressive (segmentation), signal (animation de l'élément nouveau).
* **Double codage** : chaque règle est dite *et* montrée (ex. « d = Éq ÷ p » + les courbes qui se resserrent quand ↑ augmente la pente).
* **Exemples travaillés → pratique** : construction guidée (« croisement 3/8 ») puis tracé autonome avec minuteur ; la solution (profil exact en pointillé) n'apparaît qu'à la fin du temps.
* **Erreurs diagnostiquées par le moteur** : la scène « Quelle est l'erreur ? » montre un profil relié à la règle ; le test vérifie que `detectErrors()` renvoie bien `p-regle` pour ce profil (5 graines). La scène ne ment pas.
* **Retrait de l'échafaudage** : l'accroche donne tout (« 1 cm = 250 m »), la pratique ne donne que le code du terrain.

## 6. Les onze thèmes

| # | Thème | Source | Scènes (idée de chaque scène) | ≈ min |
|---|---|---|---|---|
| 1 | **Échelle** | **Leçon v2** | accroche *1 cm = ?* · rapport (↑↓ 4 échelles, D = d × N) · convertir cm → m → km · **vote** 8 cm au 1/10 000 · grande ≠ gros nombre · **vote** grande échelle · exercice · bilan | 17 |
| 2 | **Orientation** | **Leçon v2** | haut de feuille ≠ nord · trois nords (NG, NM, NL ; ↑↓ déclinaison) · mesurer un azimut (rose 16 secteurs ; ↑↓ 4 azimuts) · **vote** azimut 70° · exercice · bilan | 15 |
| 3 | **Coordonnées** | **Leçon v2** | deux nombres situent un point · signes N/S, E/O (↑↓ 4 points du globe) · lire une grille km (X puis Y) · **vote** Sud-Ouest · exercice · bilan | 16 |
| 4 | Courbes de niveau | deck v1 `courbes` (scène 1) | plans de coupe horizontaux + bloc 3D | — |
| 5 | Équidistance | deck v1 (scène 2) | 100 → 50 → 25 → 10 m | — |
| 6 | Points cotés | deck v1 (scène 3) | lire une altitude entre deux courbes (prédire → R) | — |
| 7 | **Pente** | **Leçon v2** | panneau « 10 % » · triangle H/D (↑↓ H) · % ≠ degrés (100 % = 45°) · **vote** 50 m / 200 m · espacement d = Éq ÷ p (↑↓ pente) · **vote** zone la plus raide · exercice · bilan | 19 |
| 8 | Formes du relief | deck v1 (scène 5) | colline, cuvette, col, vallée, crête (nom caché → R) | — |
| 9 | **Profil topographique** | **Leçon v2 (prioritaire)** | couper suivant AB · relever les croisements (doublons) · choisir les échelles du papier (↑↓ Ev, verdict `paperAdvice`) · **vote** sommet entre deux croisements · **construction point par point (A, croisements, B, courbe, extrema)** · **vote** diagnostic · **tracé chronométré sur papier** puis profil exact · bilan | 24 |
| 10 | Cartes géologiques | planifié (vague 3) | voir §8 | — |
| 11 | Coupes géologiques | planifié (vague 3) | voir §8 | — |

Chaque scène porte, en plus de son contenu : **idée** (titre), **légendes par étape**, **note pour l'enseignant**, **question à poser** (clés `<leçon>.<scène>.claim|c0…|note|ask`). Aucune phrase n'est dans le code des figures.

### Le profil, en détail (la leçon qui a coûté le plus de conception)

Le terrain n'est pas imposé : `setup(graine)` choisit **un type de relief, une graine et un trait AB** par `pickLine` (engine/profile) — trait court (≈ 1,5 km à l'échelle du 1/25 000), 8–14 croisements, points non tassés, jamais trois croisements de même altitude à la suite, au moins deux extrema. Le **code du terrain** (`complexe-4-25`) est affiché dès l'accroche : l'étudiant le saisit dans le Simulateur de profil et retravaille *le même terrain* chez lui. `N` tire un autre terrain pendant le cours.

La scène de construction n'est pas une animation : à chaque `→`, **un** point est reporté (ligne dorée de la bande « carte dépliée » vers le papier), la légende donne `croisement 5/8 : à 595 m de A, altitude 640 m`. À la fin : la courbe est tracée (animation de tracé), on constate que **les sommets sont aplatis**, on ajoute les extrema estimés (≈ Éq ÷ 2) et la courbe est retracée en vert. C'est exactement la méthode qu'on attend de l'étudiant.

## 7. Architecture

```
js/stage/
  kit.js        DSL SVG « dernier rang » (repère 160×70, tailles minimales imposées, at()/lo()/tag()/badge()/wrap())
  tools.js      recommendedScale, préférences, journal des votes, utilitaires
  lesson.js     runtime : scène · étape · paramètre · vote · minuteur · test dernier rang · présentateur · index
  lessons/      echelle · orient · coord · pente · profil (+ maps.js : carte SVG issue du moteur Contour) · geologie (planifié)
                fr.js (+ ui.fr.js) : TOUS les textes ; ar.js / en.js : mêmes clés, register('ar', {...})
  stage.js, scenes.js, figure.js, mapsvg.js   decks v1 (conservés ; thèmes 4, 5, 6, 8 en attendant leur migration)
tests/lessons.test.js          contrat (structure, textes, votes, rythme, figures sans NaN, texte ≥ minimum, 14 mots)
tools/stage/audit_lessons.py   audit sur rendu réel (taille mesurée, chevauchements, hors-cadre, JS)
```

Les leçons n'importent des moteurs que des **fonctions** (`pickLine`, `crossings`, `curveFn`, `paperChoices`, `paperAdvice`, `detectErrors`, `contours`, `pickExo`…). Aucun calcul de domaine n'est dupliqué dans une scène.

**Arabe / anglais.** Tous les textes passent par `t(clé)` ; `setLang` applique `dir="rtl"`. Les figures restent **de gauche à droite** (A → B, azimuts, axes : un profil ne se lit pas en miroir) ; le texte arabe reste correctement orienté dans chaque étiquette. Restent à faire : traduire les clés, `Intl` pour les chiffres, et vérifier les étiquettes plus longues (le test `wrap ≤ 2 lignes` et l'audit signalent les débordements).

## 8. Géologie (planifié, à réfléchir avec vous)

Prérequis moteur : déplacer la notation de `pages/geo.js` / `widgets/geow.js` dans `engine/geology` (sinon la scène de construction recopierait la logique).

* **10 · Carte géologique** — scènes : (1) accroche *« lire une carte sans la légende »* ; (2) superposition : couches horizontales → âge relatif, **vote** ; (3) contact et courbes de niveau : la règle du V ; (4) pendage depuis trois points (construction à la Stage : placer A, B, C, tracer l'isohypse) ; (5) structures (plis, failles) — **vote** « quelle structure ? » ; (6) exercice `geo1–geo3`.
* **11 · Coupe géologique** — (1) accroche : *prolonger un contact* ; (2) reporter les contacts sur le profil topographique (réutilise `profil`) ; (3) pendage apparent (`tan α′ = tan δ · cos β`, ↑↓ β) ; (4) construction couche par couche ; (5) **vote** du piège `g-app` ; (6) exercice `coupe1–coupe2`.

## 9. Feuille de route

| Vague | Contenu | Critère de sortie |
|---|---|---|
| **1 — livrée** | runtime de leçons, kit « dernier rang », test du dernier rang (K), vote avec malentendus, minuteur, présentateur, 5 leçons (1, 2, 3, 7, 9), `pickLine` / `paperAdvice` dans le moteur, tests + audit | audit sans défaut à 1920×1080 ; 96+ tests |
| **2** | migrer le deck `courbes` vers le runtime (thèmes 4, 5, 6, 8) avec la carte SVG de `maps.js`, votes sur les formes du relief ; unifier outils (projecteur, zoom, crayon, laser) | 11 thèmes sur le même runtime |
| **3** | moteur géologique (notation hors interface) puis leçons 10 et 11 | scènes de construction géologique |
| **4** | Class Hub local (votes à distance, tableau des malentendus par séance) ; arabe et anglais ; impression des notes enseignant | première séance mixte |
| **5** | **Essais en salle** : protocole §10, calibrage des préréglages, ajustement des seuils ; mesure du temps de saisie des élèves | seuils validés par distance réelle |

## 10. Protocole d'essai en salle (à faire — je ne peux pas le faire à votre place)

1. Ouvrir `#/stage/profil`, touche `K`. Un collègue au dernier rang indique la dernière ligne lue sans effort (A, B ou C). Noter : largeur d'écran, distance, éclairage.
2. Régler `+ / −` jusqu'à ce que A soit nette ; noter le facteur. Il devient le préréglage de la salle.
3. Dérouler *Échelle* et *Profil* en conditions réelles. Pour chaque scène, noter : (a) a-t-on dû demander de relire ? (b) y a-t-il eu un décrochage (bavardage) ? (c) combien de mains aux votes ? Le journal local `gc_stage_log` garde les votes.
4. Remonter les écarts : ils deviennent des cas de test (`tests/lessons.test.js`) ou des règles du kit.

## 11. Limites assumées

* Les seuils sont **calculés**, pas encore **mesurés** dans votre amphithéâtre. Le test `K` est fait pour cela.
* Les thèmes 4, 5, 6, 8 sont servis par le deck v1 : lisible en projection, mais sans votes ni minuteur.
* Les exercices de la scène « À vous » viennent du moteur (français, HTML nettoyé) ; ils sont tirés parmi les énoncés de ≤ 34 mots.
* Les illustrations (panneau, rose, grille) sont des dessins originaux ; aucun fond de carte officiel n'est embarqué.
