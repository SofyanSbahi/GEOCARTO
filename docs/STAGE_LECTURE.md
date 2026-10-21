# Stage v3 — un système de cours, pas un site adapté

*Principe directeur : un étudiant du dernier rang doit comprendre **ce qui est important en 2 secondes**. Un écran qui porte plusieurs centres d'attention concurrents est un écran à redessiner.*

## 1. Ce que le paradigme « page web » nous faisait faire — et ce qu'on fait à la place

| Réflexe de la page web | Dans une salle de cours | Stage v3 |
|---|---|---|
| Chapitre qui défile : théorie, exemple, activité, exercices, quiz, validation | Tout est visible en même temps ⇒ rien n'est important | **Une scène = une idée, une figure, une phrase.** Aucun défilement, aucun onglet |
| Théorie d'abord, définition en tête | L'étudiant lit la définition sans avoir *vu* le phénomène | **Phénomène d'abord, nom en dernier** (le mot arrive à l'étape qui clôt la scène) |
| Exemple résolu, corrigé visible | L'étudiant regarde quelqu'un d'autre avoir raison | **Construction avant correction** : un point par étape (profil), un vote avant la réponse, un énoncé avant la solution |
| Quiz en fin de chapitre | La confusion est détectée trop tard | **Vote au milieu de la scène**, avec le malentendu *nommé* au résultat |
| Cartes de même poids, bandeaux, encadrés | L'œil ne sait pas où aller | **Un seul point focal à la fois** : la dernière annotation attire l'œil, les précédentes reculent |
| Chaque chapitre est indépendant | Pas de fil, pas de « pourquoi » | **Une mission, un terrain** pour toute la séance (§4) |
| Liste de validation à cocher | Sans objet en amphi | Supprimée. L'enseignant a une note (touche P), l'étudiant a la réponse de la mission |

Learning Mode reste inchangé : c'est le bon outil pour l'étude individuelle. Les deux partagent les moteurs, pas la mise en scène.

## 2. Le test des 2 secondes, rendu mesurable

On ne peut pas mesurer le regard d'un étudiant depuis un script ; on peut mesurer ce qui le *distrait*. Trois règles, vérifiées par `tests/lessons.test.js` et rapportées par `node tools/stage/focus_report.mjs` :

1. **Idée de la scène ≤ 8 mots** (l'en-tête, lisible en 1 seconde).
2. **Points focaux ≤ 3 par étape** : étiquettes pleines, pastilles, grands chiffres (≥ 6 u). Un vote peut montrer autant d'objets que d'options. Les annotations passées en `rest` (elles restent lisibles mais ne sont plus focales) ou en `fade` (elles reculent à 32 %) ne comptent plus.
3. **Mots dans la figure ≤ 12** (jetons de ≥ 2 lettres ; graduations, chiffres, repères A/B/P exclus). Le texte long va dans la légende (≤ 14 mots), jamais dans la figure.

*État de départ mesuré sur Stage v2 : 15 scènes sur 40 dépassaient le budget initial (≤ 3 focaux, ≤ 18 mots). Elles ont été redessinées ; les 43 scènes actuelles (prologue inclus) passent.*

**Limite honnête** : ces seuils sont une hypothèse de conception (calibrée sur la littérature de charge cognitive et sur le test « dernier rang »), pas un résultat d'expérience. Ils fixent un plancher ; ils ne remplacent pas le test en salle.

### Test en salle (à faire une fois, 10 minutes)
Afficher 5 écrans pris au hasard, 2 secondes chacun ; chaque étudiant du dernier rang écrit « l'idée de cet écran ». **Succès : ≥ 80 % de réponses qui disent la même chose que l'enseignant.** Les écrans en dessous de 60 % sont redessinés en premier.

## 3. Outils d'attention (kit)

| Outil | Effet | Usage |
|---|---|---|
| `at(st, k, …)` | Apparition animée à l'étape *k* | Révélation progressive |
| `at(…, { rest: true })` | Quand l'étape suivante arrive, l'annotation reste lisible mais cesse d'être un point focal | Valeurs successives qu'il faut comparer (rayons de la scène « pente », croisements) |
| `at(…, { fade: true })` | Elle recule (opacité 32 %) et ne compte plus dans les mots | Question de départ remplacée par sa réponse |
| `badge(…, { quiet: true })` | Repère (A, B) qui n'est pas un focus | Ancrages de cadre |
| `spotlight(st, k, cx, cy, r)` | Assombrit tout sauf un disque | Gestion d'attention sur figure riche (disponible, utilisé dès qu'une scène s'y prête) |

## 4. Le fil rouge : la mission

Un camp **A**, un refuge **B**, **un seul terrain** pour toute la séance (graine 4, le même terrain que la leçon Profil). Le prologue (5 min) pose le récit et annonce six questions ; chaque leçon répond à *une* question, et **sa dernière image affiche la réponse, calculée par le moteur sur ce terrain** :

| # | Question de la mission | Leçon | Réponse affichée en fin de leçon |
|---|---|---|---|
| 1 | Combien de kilomètres ? | Échelle | `6,2 cm sur la carte = 1,55 km` |
| 2 | Vers où marcher ? | Orientation | Cap A → B en degrés et secteur de la rose |
| 3 | Où exactement est le refuge ? | Coordonnées | X, Y du refuge en km |
| 4–6–8 | Quelle altitude, quel terrain ? | Relief | Altitude du camp et du refuge |
| 7 | Est-ce que ça monte fort ? | Pente | Pente moyenne du trajet en % |
| 9 | À quoi ressemble la marche ? | Profil | Point haut du trajet |
| 10 | Sur quelle roche marche-t-on ? | Carte géologique *(planifié)* | Formations traversées |
| 11 | Que cache le sol sous nos pas ? | Coupe géologique *(planifié)* | Coupe le long de A → B |

Pourquoi un fil : (a) l'étudiant sait *pourquoi* on apprend la notion (récit, motivation) ; (b) le même terrain revient cinq fois, donc la lecture de la carte se consolide au lieu de repartir de zéro ; (c) la leçon Profil devient le sommet du récit, pas un chapitre de plus.

## 5. Storyboards par thème

Notation : **[D]** démonstration avant explication · **[C]** construction avant correction · **[P]** participation de la salle.

### 1 · Échelle — « 1 cm sur la carte, combien sur le terrain ? »
*Image du cours : une règle de 4 cm qui se « déplie » en une barre verte sur le terrain.*
Accroche (carte puis terrain, « ? m » **[P]**) → ratio animé avec 4 échelles au choix **[D]** → conversion cm → m → km, une unité par étape **[C]** → vote (piège unités) → grande/petite échelle (même territoire, deux niveaux de détail) → vote → exercice chronométré → bilan + réponse de la mission.
*2 secondes :* un grand « 1,55 km » ; jamais plus de deux nombres à l'écran.

### 2 · Orientation — « le haut de la feuille n'est pas le nord »
*Image : une rose des vents posée sur une carte penchée.*
Accroche : la salle devine le nord sur une feuille inclinée **[P]**, la flèche réelle arrive ensuite → trois nords, un par étape, **une explication à la fois** **[D]** → azimut construit : rose, arc depuis le nord, valeur, secteur **[C]** → vote (sens, secteur, axe) → exercice → bilan + cap de la mission.

### 3 · Coordonnées — « un point, deux nombres, dans cet ordre »
*Image : une croix bleue (horizontale) et verte (verticale) qui se coupent sur le point.*
Accroche : une ville, deux lignes qui apparaissent une par une **[D]** → signes (N/S puis E/O) : chaque paire recule quand la suivante arrive → grille kilométrique : X puis Y puis couple **[C]** → vote (latitude/longitude) → exercice → bilan + coordonnées du refuge.

### 4·5·6·8 · Relief — « la colline, coupée par des plans »
*Image : des plans horizontaux qui découpent une colline et laissent leurs traces sur la carte.*
Plans de coupe, un par étape, côté vue + côté plan **[D]** → vote : que relie une courbe ? → équidistance 100 → 10 m au clavier **[D]** → vote (division par 6 ?) → point P entre deux courbes : les deux courbes encadrantes, l'estimation, la valeur exacte du MNT **[C]** → vote → formes (le nom est caché jusqu'à la réponse) **[P]** → vote (« fermée = colline » ?) → exercice → bilan + altitudes du camp et du refuge.

### 7 · Pente — « 10 % ≠ 10° »
*Image : le triangle H/D qui s'étire sous le doigt (↑↓).*
Panneau de signalisation à 10 % puis le triangle **[D]** → H varie, la formule suit **[D]** → éventail des 4 pentes (le dernier rayon seul est focal) → vote (formule) → courbes serrées ⇔ pente forte **[D]** → vote → exercice → bilan + pente moyenne du trajet.

### 9 · Profil topographique — « un profil se construit »
*Image : la bande de report (croisements) qui devient, point après point, une courbe.*
Carte et trait AB → relevé des croisements → papier : échelle verticale choisie, effet visible → vote (que valide-t-on ?) → **construction : un point par étape, puis la courbe, puis les extremums** **[C]** → vote de diagnostic (la faute du camarade, vérifiée par le moteur) → tracé libre chronométré → bilan + point haut. *Priorité n° 1.*

### 10 · Cartes géologiques — « on lit la carte comme un géologue » *(fait : `geologie.js`, 16 scènes)*
*Image : la carte topographique de la mission, qui se « colore ».*
Accroche : la carte topo → un cadre → la même zone en carte géologique **[D]** → vote 1 (que représentent les couleurs ?) → **la légende est une colonne du temps** → un contact traverse les courbes ⇒ couche inclinée / suit une courbe ⇒ horizontale **[D]** → vote 2 (contacts horizontaux ?) → **trois points d'un même contact : l'altitude du point milieu interpolée → ligne de direction → pendage perpendiculaire, vers le bas → angle** **[C]** (loupe sur le triangle, moteur `pickThreeFat`) → vote 3 (sens du pendage) → superposition : le plus jeune est du côté du pendage **[D]** → vote 4 (âge) → recoupement : ce qui coupe est plus jeune → structure (pli, discordance) → vote 5 → exercice chronométré → bilan + « le trajet traverse n formations ».
Malentendus nommés : couleur = altitude, couleur = végétation, contact horizontal par défaut, pendage vers le haut, direction confondue avec pendage, âge = relief, pli inversé.

### 11 · Coupes géologiques — « on construit la coupe, on ne la regarde pas » *(fait : `coupe.js`, 12 scènes)*
*Image : le profil de la leçon 9, soudain rempli de couleurs.*
Profil de la mission **[D]** → bande colorée de la carte posée sur le profil (« que se passe-t-il dessous ? ») → vote 1 (où vont les contacts ?) → horizontal (tabulaire) : lignes horizontales **[C]** → monoclinal : 6 étapes — points de contact, pendage apparent (tan α′ = tan δ·|cos β|), première droite, parallèles, couleurs, **superposition de la coupe exacte du moteur avec l'écart en degrés** **[C]** → vote 2 (la coupe d'un camarade : quelle erreur ?) avec la vérité en surimpression à la révélation → trois erreurs types → pendage apparent (schéma 45° / β 60° → 27°) → exagération verticale (paramètre ×1–×3 : l'angle dessiné change, pas le pendage) → vote 3 (prédire l'anticlinal) → cinq signatures (tabulaire, monoclinal, anticlinal, synclinal, discordance) → exercice chronométré de 5 min (carte du moteur, correction par superposition) → bilan « pendage apparent sur A → B ».
Malentendus nommés : sens inversé, contacts verticaux ou horizontaux, pendage vrai au lieu de l'apparent, éventail, « c'est juste » ; plis : inversé, monoclinal, tabulaire.

## 6. Ce qui est fait, ce qui reste

- **Fait** : 9 leçons v2 (prologue, échelle, orientation, coordonnées, relief — qui couvre 4 thèmes —, pente, profil, **cartes géologiques**, **coupes géologiques**), budget d'attention appliqué et testé, fil rouge calculé par le moteur, instruction par les pairs, bibliothèque des malentendus, bilan de séance.
- **À faire** : test des 2 secondes en salle ; failles dans la galerie ; variantes arabe / anglais (mêmes clés) ; fiches papier imprimables pour les exercices (voir §8) ; quelques textes un peu petits à l'échelle de salle 1,5 (pente 5.1, profil 4.x, relief 2.x, coupe 2.x / 5.x : ~3,2 % de la hauteur d'écran).

## 7. Outils d'enseignement (P3)

**Instruction par les pairs (Mazur)** — dans toute scène de vote, après le tally (étape 2) :
- le bandeau lit le taux de bonnes réponses : **< 30 %** « réexpliquez », **30–70 %** « discutez par deux 2 min, puis revotez », **> 70 %** « acquis, corrigez et passez » ;
- **R** (ou le bouton du présentateur) garde le premier tour en barre grise « avant » et repart à zéro : le second tour s'affiche contre le premier ;
- le journal local enregistre les deux tours, d'où un **gain de revote** par question.
Les seuils sont ceux de Mazur ; ils sont indicatifs et **non validés** sur ce cours.

**Bibliothèque des malentendus** (`#/stage/lib`) — générée à partir des votes : chaque erreur nommée, sa correction, les questions qui la testent (lien direct vers la scène), et combien de fois elle a été choisie en salle.

**Bilan de séance** (`#/stage/bilan`) — calculé sur l'appareil à partir du journal des votes (200 dernières entrées, compteurs seulement, rien n'est envoyé) : votes, séances, % de bonnes réponses, **à revoir en priorité**, gain du revote, erreur la plus choisie par question ; export **JSON / CSV**, effacement du journal.

**Gestion de l'attention** : inchangée (v3) mais appliquée aux deux nouvelles leçons — ≤ 3 points focaux, ≤ 12 mots, ≤ 8 minutes passives de suite, participation tous les 2–3 scènes.

## 8. Après la géologie : classement des prochaines directions (P4)

Critères : impact pédagogique (I), complexité de réalisation sous contrainte *site statique / `file://` / pas de serveur* (C), valeur à long terme (V). Notes sur 5 (C : 5 = très complexe).

| # | Direction | I | C | V | Verdict |
|---|---|---|---|---|---|
| 1 | **Mode évaluation + examen** (variantes tirées d'une graine, corrigés, grille, fiches papier) | 5 | 2 | 5 | **À faire en premier.** Le moteur sait déjà tirer des exercices reproductibles et les corriger ; les pratiques de Stage demandent des feuilles imprimées ; cela clôt la boucle enseigner → faire → évaluer. |
| 2 | **Études de cas marocaines** (Anti-Atlas, Haut Atlas, Rif…) | 5 | 3 | 5 | **Deuxième.** Motivation et pertinence ; le moteur génère déjà des analogues, il manque des données réelles sous licence et la relecture d'un géologue. |
| 3 | **Class Hub local** (votes sur téléphones) + vote en direct | 4 | 5 | 4 | **Troisième**, car sans serveur c'est le plus risqué (wifi d'amphi, vie privée, hébergement). Le comptage à main levée / cartons A–D + R fonctionne déjà. Piste : page élève statique + relais minimal, ou QR avec réponse encodée. |
| 4 | **Arabe** (RTL) | 4 | 3 | 4 | Après 1–2 : mêmes clés i18n, mais le RTL dans le SVG et la terminologie demandent une relecture native. |
| 5 | **Anglais** | 3 | 2 | 3 | Peu coûteux (traduction) ; utile pour la diffusion hors du Maroc. |
| 6 | **Synchronisation étudiants** | 2 | 5 | 3 | Exige un serveur et des comptes pour un gain pédagogique faible face à son coût ; à repousser. |

*Temps réel, réponses en direct, mode examen* sont des cas des lignes 1 et 3 plutôt que des chantiers séparés.

**Limites assumées** : les seuils de Mazur ne sont pas validés en salle ; les exercices de pratique supposent une feuille papier imprimée ; les failles ne sont pas encore dans la galerie ; les tests vérifient la cohérence interne (moteur ↔ leçon), pas l'effet pédagogique.
