# GéoCarto v3.2 et au-delà — document de vision

> Version 0.1 · 2026-10-26 · **document de réflexion, aucune implémentation.**
> Statut : proposition de la machine, à discuter avec Sofyan Sbahi et à **réviser après l'essai en classe de la v3.1** ([V3_1_CLASSROOM_PROTOCOL.md](V3_1_CLASSROOM_PROTOCOL.md)). Aucune décision de développement n'est prise ici.
> Mission retenue : non pas transmettre des faits géologiques, mais **apprendre aux étudiants de première année à penser, voir et raisonner en trois dimensions comme un géologue.**
> Règle de lecture : « recherche » signifie *résultat publié que j'ai vérifié au moins par sa notice bibliographique* (liste §10) ; tout le reste est **jugement de conception**, signalé comme tel. Les références marquées *(à vérifier)* n'ont pas été retrouvées.

---

## 0. Résumé en une page

**Le diagnostic.** La v3.1 sait faire *voter* une salle sur des figures lisibles, et chaque mauvaise réponse est un malentendu nommé. Ce qu'elle ne fait pas encore : (1) relier explicitement la carte, la coupe et le volume 3D — or c'est exactement la compétence qui manque aux débutants ; (2) faire **produire** quelque chose à l'étudiant (prédire, dessiner, construire) plutôt que **choisir** ; (3) distinguer l'erreur sûre d'elle de l'hésitation ; (4) retirer progressivement l'échafaudage ; (5) ancrer le raisonnement dans de **vrais terrains marocains**.

**La direction recommandée.** Faire de GéoCarto un **laboratoire de pensée spatiale géologique, orchestré en classe**, construit sur un principe et un moteur :
- *un principe* — chaque activité suit le même cycle **Prédire → S'engager (avec sa confiance) → Révéler → Expliquer → Transférer** ;
- *un moteur* — **un seul modèle géologique 3D implicite** (la fonction « quelle formation en (x, y, z) ? » existe déjà dans `js/engine/geology/geology.js`), dont la carte, la coupe, le bloc 3D, le forage et l'image satellite ne sont que des **vues coordonnées**.

**Les cinq innovations les plus transformatrices (classement §6)** :
1. **Bloc ↔ carte ↔ coupe liés, avec prédiction avant révélation** (pas seulement une 3D à faire tourner).
2. **Prédiction dessinée avec correction exacte** (tracer la coupe, la face cachée du bloc, la trace d'un contact) — sur tablette/téléphone, et sur papier.
3. **Vote pondéré par la confiance + question isomorphe** après discussion.
4. **Parcours de compétences spatiales** (5 min par séance, mesuré par pré/post-test).
5. **Cas marocains réels** : MNT réel + images satellites ouvertes + géologie simplifiée **relue par un géologue**, au cœur d'une « Histoire d'une carte ».

Puis, à plus faible coût : **estompage du fil du raisonnement**, **« Trouvez l'erreur du géologue »**, **reconstruction de l'histoire géologique**, **blocs papier à découper**, **ouverture de séance par rappel espacé**.

**Ce que je déconseille pour l'instant** : réalité augmentée/virtuelle, tuteur conversationnel IA face aux étudiants, gamification supplémentaire, 3D en rotation libre sans tâche.

---

## 1. D'où l'on part (état v3.1, vérifié dans le code)

| Atout existant | Où | Pourquoi il compte pour la v3.2 |
|---|---|---|
| **Modèle géologique implicite 3D** : `lit(x, y, z)` → formation, pour 9 structures (tabulaire, monoclinal, anticlinal, synclinal, failles normale/inverse, discordance, granite, filon) | `js/engine/geology/geology.js` | Toute vue (face de bloc, coupe quelconque, forage, carte) se calcule **du même objet** : cohérence garantie entre vues, sans dessin à la main. C'est l'atout architectural majeur. |
| Coupes exactes le long de A→B, régions et contacts vectoriels | `sectionGrid`, `regions.js` | Correction exacte des coupes dessinées par l'étudiant. |
| **Générateurs de malentendus figurés** (WP3) | `js/engine/geology/distractors.js` | Base directe de « Trouvez l'erreur » et des distracteurs des futures activités. |
| Visionneuse 3D WebGL (three.js déjà embarqué, hors ligne) | `js/core/scene3d.js`, `vendor/` | Le bloc 3D interactif n'exige pas de nouvelle dépendance. |
| Votes mélangés, Mazur, journal local, vue présentateur, malentendu dominant | `js/stage/` | L'orchestration de classe existe ; on l'enrichit, on ne la refait pas. |
| Fil du raisonnement (6 étapes) | `js/stage/thread.js` | Prêt pour l'estompage. |
| 6 « cas marocains » | `js/data/cases.js` | **Ce sont des modèles inspirés, pas des terrains réels** (le fichier le dit) : à remplacer progressivement. |
| Porte de projection automatisée | `tools/stage/` | Toute nouvelle vue devra la passer (lisibilité du dernier rang). |

Limite honnête : **aucune donnée d'étudiant** n'existe encore. Tout classement ci-dessous est une hypothèse à confronter à l'essai v3.1.

---

## 2. Ce que la recherche dit, et ne dit pas (synthèse)

| Constat | Force de la preuve | Conséquence pour GéoCarto |
|---|---|---|
| Les compétences spatiales **s'entraînent** ; effet moyen modéré (g ≈ 0,47 sur 217 études), **durable** et **transférable** à des tâches non entraînées (Uttal et al., 2013). | **Forte** (méta-analyse) | Un parcours spatial court et régulier est justifié. |
| La « pénétration visuelle » (imaginer l'intérieur d'un volume) est une capacité distincte, centrale en géologie (Kali & Orion, 1996). | Modérée (étude fondatrice, lycéens) | Cibler explicitement cette capacité, pas seulement la rotation mentale. |
| **Esquisser une prédiction** (dessiner la coupe d'un bloc avant de la voir) améliore l'inférence sur les diagrammes 3D ; la justesse du croquis est corrélée au gain (Gagnier et al., 2017). | Modérée (expérience contrôlée, géologie) | La prédiction dessinée est l'innovation à plus fort levier. |
| Un curriculum de compétences spatiales pour géologues produit des gains pré/post (Ormand et al., 2017, *Spatial Thinking Workbook*). | Modérée | Matériau de référence et instruments de mesure à réutiliser (droits à vérifier). |
| **L'interactivité 3D n'aide pas en soi** : ce qui compte est de *voir les vues informatives* ; un apprenant qui manipule mal fait **moins bien** qu'un spectateur passif guidé (Keehner et al., 2008). | Modérée-forte (3 expériences) | **Ne pas livrer une 3D en rotation libre** : vues guidées, coupes imposées, tâches. |
| La discussion entre pairs améliore la compréhension **même quand personne dans le groupe ne connaît la réponse** ; démontré par une **question isomorphe** posée individuellement après (Smith et al., 2009). | Forte (Science, plan isomorphe) | Ajouter la question isomorphe : c'est aussi la meilleure mesure interne de l'apprentissage. |
| Les erreurs commises **avec forte confiance** sont **mieux corrigées** après rétroaction (effet d'hypercorrection, Butterfield & Metcalfe, 2001 ; répliqué). | Modérée (mémoire, labo) ; transfert en classe moins établi | La confiance déclarée vaut d'être recueillie et montrée à l'enseignant. |
| Notation par certitude (CBM) : bonne fidélité, bien acceptée ; bénéfices d'apprentissage **surtout rapportés par ses promoteurs** (Gardner-Medwin). | Faible-modérée | Utiliser la confiance comme **diagnostic**, pas comme note. |
| **Exemples erronés** : comparer exemple correct et incorrect peut aider (Durkin & Rittle-Johnson, 2012) ; mais l'effet est **inégal** et semble réservé aux apprenants ayant déjà des bases (Große & Renkl, 2007 ; revues récentes). | Modérée, **résultats mixtes** | « Trouvez l'erreur » **après** l'acquisition des bases, toujours **côte à côte** avec la bonne figure. |
| **Estompage des exemples résolus** (retirer progressivement les étapes, d'abord les dernières) favorise le passage à la résolution autonome (Renkl et al., 2002 ; Renkl & Atkinson, 2003). | Forte (série d'expériences) | Estomper le fil du raisonnement au fil des leçons. |
| Plusieurs représentations n'aident que si l'on **apprend à passer de l'une à l'autre** ; leurs bénéfices manquent souvent en expérience (Ainsworth, 2006, cadre DeFT). | Cadre théorique solide | Les vues liées doivent être accompagnées de **tâches de traduction** (carte → coupe, coupe → bloc). |
| Enseignement actif > cours magistral ; rappel espacé et pratique de récupération efficaces *(Freeman et al., 2014 ; Roediger & Karpicke, 2006 ; Dunlosky et al., 2013 — notices non revérifiées ici)*. | Forte (méta-analyses connues) *(à vérifier)* | Ouvertures de séance par rappel espacé ; plus de production, moins de démonstration. |

**Ce qui n'est pas démontré** (à ne pas promettre) : que la 3D interactive améliore à elle seule l'apprentissage ; que la RA/RV ait un effet durable au-delà de la nouveauté ; que la gamification améliore l'apprentissage conceptuel.

**Nouveauté — ce qui existe déjà** : des outils web de blocs 3D géologiques existent et sont utilisés en premier cycle (notamment *Visible Geology*, qui permet d'ajouter plis, failles, filons, discordances, érosion, coupes et forages ; et, plus ancien, *Geo3D* de Kali & Orion). **Un bloc 3D lié à une carte n'est donc pas une innovation en soi.** Ce que GéoCarto peut apporter d'original (à confirmer par une revue de littérature avant toute publication) : (a) l'**orchestration de classe projetée** (votes, malentendus figurés générés par le moteur, confiance, question isomorphe), (b) la **correction exacte de prédictions dessinées** sur un modèle implicite avec topographie réelle, (c) des **terrains marocains réels** en arabe/français, hors ligne, sur appareils modestes.

---

## 3. Les innovations, une par une

Format : *idée · pourquoi (pédagogie) · preuve · complexité · risques · rendement triple (recherche / logiciel / enseignement).*
Complexité : **S** ≤ 1 semaine · **M** 2–4 semaines · **L** 1–3 mois · **XL** > 3 mois (une personne, ordre de grandeur).

### I1. Bloc ↔ carte ↔ coupe liés, « prédire avant de voir »
**L'idée.** Une même scène montre trois vues coordonnées d'un **seul** modèle : le **bloc-diagramme** (avec sa topographie), la **carte géologique** et la **coupe**. Pointer un endroit de la carte l'allume dans le bloc et dans la coupe. On peut **trancher** le bloc (plan vertical quelconque, horizontal), **retirer la couche supérieure** (érosion), **forer**. Mais jamais sans tâche : la vue cachée n'apparaît **qu'après** que la salle (ou l'étudiant) a prédit.
Séquences types :
- *Carte → bloc* : « Voici la carte. Que montre la face avant du bloc ? » (vote figuré ou dessin) → révélation par rotation guidée.
- *Coupe → carte* (problème inverse) : « Voici la coupe. Où affleure le contact sur la carte ? »
- *Érosion* : on abaisse la topographie : « comment la carte va-t-elle changer ? » — fait comprendre que **la carte est l'intersection de la géologie et du relief** (le concept le plus mal compris des débutants, et la racine de la règle des V).
- *Forage* : « à quelle profondeur le forage rencontrera-t-il le Lias ? »

**Pourquoi.** La compétence-cible du cours est précisément la *traduction* entre représentations 2D et volume 3D (pénétration visuelle). Le cadre DeFT dit que plusieurs représentations n'aident que si l'on travaille la traduction ; Keehner et al. disent que ce qui compte est de **voir les bonnes vues** ; Gagnier et al. disent que **prédire par un croquis** avant de voir améliore l'inférence. Le design « prédire → révéler par vue guidée » combine les trois.
**Preuve.** Modérée à forte pour les principes ; aucune pour *ce* dispositif précis (à évaluer).
**Complexité.** **L** pour la version projetable (bloc en **SVG isométrique** calculé par le moteur : déterministe, lisible au dernier rang, imprimable, testable par la porte de projection) ; **L** supplémentaire pour la version WebGL interactive individuelle (three.js déjà embarqué). Recommandation : **SVG d'abord** (classe), WebGL ensuite (travail individuel).
**Risques.** Surcharge visuelle (trois vues = trois foyers : budget d'attention à respecter, une vue « active » à la fois en projection) ; performances WebGL sur ordinateurs de salle anciens ; tentation de la « belle 3D » sans tâche (anti-patron Keehner) ; exagération verticale à expliciter (sinon fausses lectures de pendage).
**Triple rendement.** Enseignement : cœur de la future leçon « Histoire d'une carte ». Logiciel : moteur de vues coordonnées réutilisable (hydrogéologie, forages, nappes). Recherche : étude « prédiction dessinée vs observation guidée » en géologie de première année.

### I2. Prédiction dessinée, corrigée exactement
**L'idée.** L'étudiant **trace** : la coupe sous un trait A–B, la face cachée d'un bloc, la trace d'un contact sur la carte (règle des V), la position d'une couche dans un forage. Le moteur compare au modèle et rend une **rétroaction exacte et localisée** (« votre contact est trop raide ici », « le pendage est inversé »), et **nomme le malentendu** quand le tracé ressemble à un distracteur connu (comparaison avec les variantes de `distractors.js`).
Deux modes : *individuel* (tablette, téléphone, ordinateur) et *classe* (photos de croquis papier non, trop lourd ; plutôt **vote figuré** quand les appareils manquent, et **feuille imprimée** à corriger par superposition d'un **transparent imprimé** de la solution).
**Pourquoi.** Passer de *choisir* à *produire* : c'est la pratique de récupération et la génération, et c'est exactement le geste du géologue. La v3.1 ne fait que choisir.
**Preuve.** Modérée (Gagnier et al., 2017 ; principes de génération et de rétroaction). Les modules autonomes de GéoCarto savent déjà noter un profil topographique tracé : le savoir-faire existe.
**Complexité.** **M** (coupe dessinée sur une trace, à partir de l'existant) à **L** (face de bloc, trace sur carte avec diagnostic).
**Risques.** Tolérance : doit correspondre à la précision d'un tracé au doigt (règle de la référence GéoCarto §6) ; frustration si la correction est trop stricte ; équipement inégal des étudiants (prévoir le mode papier).
**Triple rendement.** Enseignement : activité phare. Logiciel : bibliothèque « tracer-et-noter » générique. Recherche : données de tracés → analyse automatique des malentendus (avec éthique).

### I3. Vote pondéré par la confiance + question isomorphe
**L'idée.** Après chaque vote, chacun indique **sûr / pas sûr** (deux gestes : main ouverte / poing, ou deux touches). La vue présentateur affiche une matrice 2 × 2 : *juste-sûr, juste-hésitant, faux-hésitant, **faux-sûr***. Le **faux-sûr** est la priorité de remédiation (et, d'après l'hypercorrection, le moment où la correction « prend » le mieux). Après discussion et revote, une **question isomorphe** (même concept, autre figure générée par le moteur, réponse individuelle) mesure si la discussion a produit de la compréhension et pas seulement de l'imitation.
**Pourquoi.** Le pourcentage de bonnes réponses ne distingue pas l'élève chanceux de l'élève qui a compris, ni l'hésitant du convaincu à tort. La question isomorphe est le dispositif même de Smith et al. (2009).
**Preuve.** Forte pour la question isomorphe et la discussion ; modérée pour l'hypercorrection ; faible pour un bénéfice propre du recueil de confiance.
**Complexité.** **S** (confiance) + **M** (générer une question isomorphe par vote : le moteur produit déjà des figures paramétrées ; il faut définir l'isomorphisme par type de vote).
**Risques.** Un geste de plus en amphithéâtre (temps) ; déclaration de confiance biaisée (sur-confiance des débutants, pression sociale) : la garder **anonyme et non notée** ; comptage manuel lourd sans boîtiers (prévoir le vote par téléphone en option, hors ligne impossible → mode main levée simplifié : ne compter que les faux-sûrs).
**Triple rendement.** Enseignement : diagnostic plus fin. Logiciel : extension directe de la vue présentateur. Recherche : la question isomorphe donne une **mesure interne d'apprentissage** séance par séance (exploitable dans une étude éthique).

### I4. « Trouvez l'erreur du géologue »
**L'idée.** On montre **côte à côte** une coupe (ou carte, ou bloc) correcte et une construite avec un malentendu (sens du pendage inversé, contact horizontal, pli inversé, V dans le mauvais sens), **générée par le moteur**, et l'on demande : *laquelle est fausse, et quelle étape du fil a été mal faite ?* Variante avancée : une seule figure, une erreur à localiser.
**Pourquoi.** Entraîne l'évaluation critique (étape « Vérifier » du fil), rend visible le malentendu, et réutilise WP3.
**Preuve.** **Mixte** : bénéfices montrés surtout avec comparaison correcte/incorrecte et pour des apprenants qui ont des bases ; risque de surcharge chez les novices.
**Complexité.** **S–M** (les variantes existent ; il faut le format et les textes).
**Risques.** Mémoriser la mauvaise figure (toujours marquer clairement « faux », finir sur la bonne) ; trop tôt dans le parcours = surcharge : **placer après** la première leçon sur le concept.
**Triple rendement.** Enseignement : activité de consolidation. Logiciel : réemploi complet de WP3. Recherche : comparaison « erreur à trouver » vs « exemple correct seul » (petite étude contrôlée possible).

### I5. Estompage du fil du raisonnement
**L'idée.** Les six étapes (Observer · Situer · Mesurer · Dater · Supposer · Vérifier) sont **toutes montrées et remplies** au début ; puis, de leçon en leçon, la **dernière** étape remplie disparaît (estompage arrière), et l'étudiant (ou la salle) doit la fournir ; à la fin, seuls les noms d'étapes restent, puis plus rien. Ajouter des **questions d'auto-explication** courtes (« Quelle étape venez-vous de faire ? Pourquoi ? »).
**Pourquoi.** Le fil est aujourd'hui un **soutien permanent** ; un soutien jamais retiré n'enseigne pas l'autonomie. L'estompage arrière est la technique la mieux étayée pour passer de l'exemple à la résolution.
**Preuve.** **Forte** (Renkl, Atkinson et coll.).
**Complexité.** **S–M** (le fil existe ; il faut un niveau d'estompage par leçon et, plus tard, adapté aux résultats de la classe).
**Risques.** Estomper trop vite pour une classe faible : piloter par les résultats (bande de Mazur, question isomorphe). Le fil lui-même reste un **brouillon à relire** par un géologue.
**Triple rendement.** Enseignement : autonomie. Logiciel : faible coût. Recherche : variable expérimentale simple (estompage vs fil constant).

### I6. Parcours de compétences spatiales
**L'idée.** Cinq minutes par séance, en ouverture : rotation mentale, **coupes de solides** (imaginer la section d'un volume), **pénétration visuelle** (que voit-on à l'intérieur ?), changement de point de vue, lecture de bloc-diagrammes — progressif, avec des objets **géologiques** dès que possible (couches, plis) et non seulement géométriques. **Pré/post-test** standardisé en début et fin de semestre.
**Pourquoi.** Les compétences spatiales sont une barrière connue en géologie, elles **s'entraînent** et le gain **dure et transfère** (Uttal et al.). Les étudiants faibles en spatial sont ceux qui profitent le moins de la 3D libre (Keehner) : il faut les entraîner explicitement.
**Preuve.** **Forte** (méta-analyse) + modérée en géologie (Ormand et al., 2017).
**Complexité.** **M** (générateurs d'items à partir du moteur ; instruments de mesure existants — par ex. *Santa Barbara Solids Test*, Cohen & Hegarty — **droits d'usage à vérifier**).
**Risques.** Effet plafond chez les forts ; temps de séance (5 min = 10 % d'une séance de 50 min) ; un test publié ne doit pas être reproduit sans autorisation.
**Triple rendement.** Enseignement : prérequis transversal (utile aussi en topographie). Logiciel : générateur d'items spatiaux. Recherche : **la meilleure étude publiable à court terme** (pré/post, éventuellement deux groupes, éthique requise).

### I7. Cas marocains réels (« Histoire d'une carte »)
**L'idée.** Remplacer les modèles « inspirés » par de **vrais terrains** : MNT réel (par ex. Copernicus DEM GLO-30 ou SRTM — **conditions de licence à vérifier**), **images Sentinel-2** (données Copernicus ouvertes), et une **géologie simplifiée** construite par l'enseignant à partir de cartes publiées **avec autorisation**, puis **relue par un géologue**. Le Maroc a un atout pédagogique rare : en zone aride, **les couches affleurent et se voient sur les images satellites** — l'étudiant peut **tracer lui-même un contact sur l'image**, mesurer son altitude sur le MNT, déduire le pendage par la méthode des trois points, et confronter sa coupe au modèle.
Régions **candidates** (à valider par un géologue, rien n'est vérifié ici) : plis paléozoïques de l'Anti-Atlas ; plis et gorges calcaires du Haut Atlas central/oriental ; plateaux tabulaires (Moyen Atlas, plateau des phosphates).
Format : une **« Histoire d'une carte »** par région = une enquête de 2–3 séances, du paysage à la carte, de la carte à la coupe, de la coupe à l'histoire géologique, avec le fil comme squelette.
**Pourquoi.** Authenticité, transfert, motivation, et la fin du soupçon « ce sont des cartes inventées ». Le raisonnement sur un terrain réel est ce que fait un géologue.
**Preuve.** Modérée pour l'authenticité/la motivation en général ; pas de preuve spécifique.
**Complexité.** **L–XL**, surtout **hors logiciel** : sélection des sites, droits des cartes du Service géologique (les feuilles publiées portent un copyright ; les notices consultées les donnent en format papier), simplification fidèle, relecture. Côté logiciel : il faut ajuster un **modèle implicite** à des contacts et pendages numérisés — à faire **hors navigateur** (Python, par ex. un modélisateur implicite libre comme GemPy *(à vérifier)*) puis exporter des grilles que le moteur lit.
**Risques.** **Erreur scientifique** sur un terrain réel (pire qu'un modèle inventé) → relecture obligatoire ; droits ; poids des données (hors ligne) ; simplification trompeuse (dire ce qui a été simplifié).
**Triple rendement.** Enseignement : authenticité. Logiciel : premier « domain pack » réel du Data Hub (recette MNT + imagerie + géologie). Recherche : jeu de données pédagogiques ouvert (si droits) ; lien direct avec vos thèmes (relief, aléas, hydrogéologie).

### I8. Reconstruire l'histoire géologique
**L'idée.** À partir d'une carte (ou d'un bloc), l'étudiant **ordonne des événements** — dépôts, basculement, plissement, faille, érosion, discordance, intrusion — et le moteur **rejoue** sa séquence pour montrer la carte qu'elle produirait, à comparer avec la carte cible. Mode inverse : « construisez une histoire qui donne cette carte ».
**Pourquoi.** Penser comme un géologue, c'est raisonner dans **l'espace et le temps** à la fois (principes de superposition, recoupement, inclusion). La v3.1 traite l'âge relatif par votes ; ici l'étudiant **construit** et le moteur **réfute**.
**Preuve.** Faible-modérée (principes d'apprentissage par construction et rétroaction ; pas d'étude spécifique repérée). Des outils proches existent (*Visible Geology* empile des événements), mais sans la tâche « reproduire une carte cible » ni la correction.
**Complexité.** **L** (le moteur doit composer des événements successifs ; aujourd'hui chaque structure est un cas fermé).
**Risques.** Combinatoire (plusieurs histoires valides : accepter les équivalentes) ; essai-erreur sans réflexion (limiter les essais, demander une justification).
**Triple rendement.** Enseignement : stratigraphie et tectonique reliées. Logiciel : moteur d'événements composables (base de futurs générateurs). Recherche : traces de résolution analysables.

### I9. Blocs papier à découper et plier
**L'idée.** Générer, pour chaque structure ou cas réel, un **bloc-diagramme en patron** (6 faces) à imprimer, découper, plier ; certaines faces **laissées vides** à compléter avant d'assembler. Fonctionne sans appareil, en TD, à la maison.
**Pourquoi.** Manipulation physique, coût nul, équité (pas besoin de tablette), cohérent avec la prédiction dessinée. Pratique répandue dans l'enseignement de la géologie structurale (jugement de conception ; pas d'étude citée ici).
**Complexité.** **S–M** (le moteur calcule déjà les faces ; GéoCarto sait déjà imprimer à l'échelle).
**Risques.** Faibles ; qualité d'impression en noir et blanc (prévoir lettres et motifs, pas seulement couleurs — acquis WP5).
**Triple rendement.** Enseignement : TD clé en main. Logiciel : export d'une vue de plus. Recherche : condition « physique vs écran » comparable.

### I10. Ouverture de séance par rappel espacé
**L'idée.** Trois questions en début de séance, choisies **à partir des malentendus dominants des séances précédentes** (journal local), générées sur de **nouvelles figures**.
**Pourquoi.** Pratique de récupération et espacement : parmi les techniques les mieux étayées.
**Preuve.** Forte *(références générales à vérifier)*.
**Complexité.** **S–M** (journal et générateurs existent).
**Risques.** Faibles ; temps de séance.

### I11. Glossaire bilingue et passerelle linguistique
**L'idée.** Bascule arabe ↔ français des termes clés (pendage, direction, affleurement, discordance…) sur chaque figure et dans la fiche du fil ; plus tard interface en arabe.
**Pourquoi.** Une partie des étudiants arrive avec un vocabulaire scientifique acquis dans une autre langue que celle du cours *(situation à confirmer selon la cohorte)* : la charge linguistique s'ajoute à la charge spatiale.
**Complexité.** **S** (glossaire) à **L** (interface arabe complète, mise en page de droite à gauche).
**Risques.** Exactitude de la terminologie arabe (relecture par un enseignant arabophone).

### I12. Tableau de bord des malentendus de la classe (enseignant)
**L'idée.** Après chaque séance, une page locale : malentendus dominants, faux-sûrs, gains au revote et à la question isomorphe, étapes du fil les plus faibles — avec une suggestion de reprise.
**Complexité.** **S–M**. **Risques.** Interprétation abusive de petits effectifs (afficher les n).

### Idées examinées et **déconseillées pour l'instant**
- **Réalité augmentée / virtuelle** : coût, équipement, mal des transports, effet de nouveauté ; bénéfice durable non démontré ; incompatible avec la priorité « projection + appareils modestes ».
- **Tuteur conversationnel IA face aux étudiants** : risque d'erreurs scientifiques non relues, données personnelles, dépendance réseau ; contraire à la règle « tout contenu machine relu ». (Une **aide à l'enseignant** hors ligne pour rédiger des variantes, toujours relues, reste envisageable plus tard.)
- **Plus de gamification** (points, badges) : effets mitigés sur l'apprentissage conceptuel ; la v2 en contient déjà.
- **3D en rotation libre sans tâche** : contre-indiquée par Keehner et al. (2008).

---

## 4. Le cycle pédagogique unificateur

Toutes les activités ci-dessus sont des instances d'un même cycle, qui devient la **signature de GéoCarto** :

```
PRÉDIRE        dessiner / voter / ordonner, seul          (génération, récupération)
S'ENGAGER      déclarer sa confiance                       (métacognition, hypercorrection)
RÉVÉLER        vue guidée du modèle : coupe, face, érosion  (voir les vues informatives)
EXPLIQUER      par deux, puis avec le fil (estompé)         (instruction par les pairs, auto-explication)
TRANSFÉRER     question isomorphe, autre figure, seul       (mesure de compréhension)
```

Conséquence d'architecture : un **format d'activité unique** (déclaratif, données et non code) que le moteur instancie avec n'importe quelle vue — c'est aussi ce que demande la spécification du *Learning Engine* (kernel + engines + packs).

---

## 5. Architecture cible (sans implémentation)

1. **Modèle unique.** `GeoModel` = MNT + fonction implicite `lit(x, y, z)` + histoire d'événements (I8) + métadonnées (source, simplifications, relecteur, licence). Les cas réels (I7) fournissent un `GeoModel` précalculé (grilles), pas du code.
2. **Vues coordonnées, pures et testables.** carte, coupe, face de bloc, bloc isométrique SVG, forage, image satellite drapée, patron papier : chacune est une **fonction pure du modèle** (même contrat que le moteur actuel : pas de DOM ni d'aléa non injecté). Le WebGL n'est qu'un **rendu** de ces vues, jamais leur source.
3. **Format d'activité déclaratif** (cycle §4) : type de prédiction, vue de révélation, isomorphisme, distracteurs, étape du fil, tolérance, textes (fr/ar). Les activités deviennent des **données** relisibles par un géologue.
4. **Correcteur de tracés** générique : tracé de l'étudiant vs vue exacte → écart localisé + malentendu le plus proche.
5. **Projection d'abord.** Toute vue passe la porte de projection (lisibilité du dernier rang) avant d'avoir une version interactive.
6. **Données locales.** Confiance, tracés, réponses : sur l'appareil, compteurs seulement pour la classe ; aucune collecte nominative sans protocole éthique.
7. **Hors ligne et léger.** Cas réels découpés en tuiles et compressés ; budget de poids par cas.

Points d'attention : la composition d'événements (I8) est le seul changement profond du moteur géologique ; tout le reste s'ajoute autour. Le moteur actuel est figé par des tests *golden* : toute extension doit être **additive**.

---

## 6. Classement par impact éducatif attendu

Notes de 1 à 5 (jugement), **à réviser après l'essai v3.1**. *Impact* = effet attendu sur la pensée 3D des débutants ; *Preuve* = force des résultats publiés sur le principe ; *Coût* inverse de la complexité ; *Risque* = probabilité d'échec ou d'effet nul.

| Rang | Innovation | Impact | Preuve | Complexité | Risque | Commentaire |
|---|---|---|---|---|---|---|
| 1 | **I1 + I2** Vues liées avec prédiction dessinée | 5 | Modérée-forte (principes) | L (SVG) + L (WebGL) | Moyen | Cœur de la mission « penser en 3D ». À traiter ensemble : I1 sans I2 = belle 3D passive. |
| 2 | **I6** Parcours spatial | 4 | **Forte** | M | Faible | Meilleur rapport preuve/coût ; meilleure étude publiable à court terme. |
| 3 | **I3** Confiance + question isomorphe | 4 | Forte (isomorphe), modérée (confiance) | S–M | Faible | Améliore *toutes* les leçons existantes ; mesure interne de l'apprentissage. |
| 4 | **I5** Estompage du fil | 4 | **Forte** | S–M | Faible | Coût faible, transforme un soutien en apprentissage de l'autonomie. |
| 5 | **I7** Cas marocains réels | 4 | Faible-modérée | L–XL (surtout hors logiciel) | **Élevé** (exactitude, droits) | Le plus distinctif ; dépend d'un géologue relecteur et des autorisations. |
| 6 | **I8** Reconstruire l'histoire | 4 | Faible-modérée | L | Moyen | Le meilleur entraînement espace-temps ; demande l'évolution du moteur. |
| 7 | **I4** Trouvez l'erreur | 3 | Mixte | S–M | Moyen (novices) | Réemploi WP3 ; à placer après les bases. |
| 8 | **I10** Rappel espacé | 3 | Forte | S–M | Faible | Gain sûr mais incrémental. |
| 9 | **I9** Blocs papier | 3 | Faible (pratique courante) | S–M | Faible | Équité et TD sans appareil. |
| 10 | **I12** Tableau de bord enseignant | 3 | — | S–M | Faible | Utile à l'enseignant, effet indirect. |
| 11 | **I11** Passerelle linguistique | 2–4 | — | S → L | Faible | Impact dépendant de la cohorte : à mesurer à l'essai. |

**Lecture.** Les rangs 2 à 4 sont **les plus sûrs** (preuve forte, coût faible) ; le rang 1 est **le plus transformateur** ; le rang 5 est **le plus distinctif** mais le plus risqué.

---

## 7. Feuille de route

> Principe : **aucun développement avant les retours de l'essai v3.1.** Chaque jalon a une **porte de décision** fondée sur des données de classe.

### Étape 0 — Essai v3.1 et décision (maintenant)
Exécuter le protocole d'essai ; ajouter **deux questions** au questionnaire pour orienter la v3.2 : (a) « Ce qui me manque le plus pour voir la géologie en 3D » ; (b) « Je préfèrerais dessiner moi-même / voter / manipuler un bloc ». Relever : faux-sûrs perçus par l'enseignant, malentendus persistants après discussion, lisibilité.
**Porte.** Si la lisibilité ou l'usage de base échouent → corriger la v3.1 d'abord (v3.1.x), rien de nouveau.

### v3.2 — « Mesurer et autonomiser » (≈ 6–8 semaines)
I3 confiance + question isomorphe · I5 estompage du fil · I6 parcours spatial (premiers items + pré-test) · I10 rappel espacé · I4 trouvez l'erreur (2–3 activités) · I12 tableau de bord minimal · I11 glossaire.
Pourquoi d'abord : preuve forte, coût faible, **améliore l'existant** et **produit les mesures** dont on a besoin pour juger la suite.
**Porte.** La question isomorphe montre-t-elle un gain après discussion ? Le pré-test spatial révèle-t-il des étudiants en difficulté ? → oriente I1/I2.

### v3.3 — « Histoire d'une carte » (≈ 2–3 mois)
I1 en **SVG projetable** (bloc isométrique, coupe, carte liés ; tranche, érosion, forage) · I2 prédiction dessinée (coupe et trace de contact, individuel + papier) · I9 blocs papier · première « Histoire d'une carte » sur **modèle synthétique** (pour isoler la difficulté du réel).
**Porte.** Les tracés montrent-ils une progression ? Les étudiants faibles en spatial suivent-ils ?

### v3.4 — « Le Maroc réel » (≈ 3–6 mois, dépend des partenaires)
I7 : 1 à 2 cas réels relus (MNT + Sentinel-2 + géologie simplifiée autorisée) ; tracé de contacts sur image ; méthode des trois points sur le MNT · WebGL individuel (I1) · interface arabe (I11).
**Porte.** Relecture scientifique signée et droits obtenus **avant** publication de chaque cas.

### v4 — « Penser dans le temps » (≈ 6 mois et plus)
I8 reconstruction de l'histoire (moteur d'événements composables) · générateurs d'activités déclaratives ouverts aux enseignants · extraction du moteur en *domain pack* (`structural-geology`, `topography`) pour d'autres cours (hydrogéologie, géomorphologie).

### Programme de recherche associé (éthique requise avant toute collecte)
1. **Pré/post compétences spatiales** avec le parcours I6 (deux cohortes ou deux groupes) — premier article plausible.
2. **Prédiction dessinée vs vue guidée passive** (I1/I2), réplication de Gagnier et al. en première année marocaine.
3. **Confiance et hypercorrection en classe** (I3) : les faux-sûrs sont-ils mieux corrigés à la question isomorphe ?
4. **Estompage vs fil constant** (I5).
5. **Paysages synthétiques à autocorrélation réglable** pour l'enseignement de la validation spatiale (pont vers vos travaux de recherche ; nouveauté non vérifiée).
Instruments : test spatial publié **avec autorisation**, items du concept propres à GéoCarto, question isomorphe ; *Geoscience Concept Inventory* comme référence possible *(à vérifier : contenu et accès)*. Venues : revues d'enseignement des géosciences et de technologies éducatives (**périmètre, indexation et frais à vérifier**).

---

## 8. Risques transversaux et garde-fous

| Risque | Garde-fou |
|---|---|
| Dérive vers la « belle 3D » sans apprentissage | Règle : **aucune vue sans tâche de prédiction** ; mesure par question isomorphe. |
| Erreur scientifique (surtout sur cas réels) | Relecteur géologue nommé ; mention « brouillon » tant que non relu ; faits sourcés. |
| Surcharge cognitive des débutants | Budget d'attention (déjà testé) ; une vue active à la fois en projection ; erreurs à trouver seulement après les bases. |
| Fracture d'équipement | Tout existe en version **projection + papier** ; l'individuel est un bonus. |
| Droits des cartes et images | Licence vérifiée par source avant usage ; pas de republication sans autorisation. |
| Portée qui s'étend (mainteneur unique) | Une version = une porte de décision ; limite de 3 chantiers ouverts ; tests et porte de projection obligatoires. |
| Données d'étudiants | Local par défaut, compteurs seulement ; protocole éthique avant toute étude. |
| Promesse non tenue | Ne rien annoncer comme « efficace » avant une évaluation comparative. |

---

## 9. Recommandation de direction à long terme

**GéoCarto ne doit pas devenir « un logiciel de 3D géologique de plus »** — ce créneau est occupé et bien servi. Sa place est ailleurs : **l'environnement qui apprend à une salle entière, sur des appareils modestes et hors ligne, à passer de la carte au volume et au temps, par prédiction, engagement, révélation et explication — sur des terrains marocains réels, en français et en arabe, avec un diagnostic des malentendus que l'enseignant peut utiliser dans la minute.**

Concrètement :
1. **Garder le moteur unique** (modèle implicite + vues pures) comme fondation : c'est lui qui rend possibles la cohérence entre vues, la correction exacte et les distracteurs figurés.
2. **Passer de « choisir » à « produire »** : la prédiction dessinée est le saut qualitatif.
3. **Mesurer à chaque séance** (confiance, question isomorphe) : GéoCarto devient son propre instrument d'évaluation — c'est ce qui le rendra publiable et crédible.
4. **Ancrer dans le réel** dès que la relecture et les droits le permettent.
5. **Rester projetable d'abord** : la contrainte du dernier rang a amélioré toute la v3.1 ; elle doit rester la porte d'entrée de chaque nouvelle vue.

**Prochaine action proposée** : aucune ligne de code ; **ajouter les deux questions d'orientation au questionnaire de l'essai v3.1**, mener l'essai, puis réviser ce classement avec les données.

---

## 10. Références (notices vérifiées le 2026-10-26, texte intégral non lu)

- Ainsworth, S. (2006). DeFT: A conceptual framework for considering learning with multiple representations. *Learning and Instruction*, 16(3), 183–198.
- Butterfield, B., & Metcalfe, J. (2001). Errors committed with high confidence are hypercorrected. *Journal of Experimental Psychology: Learning, Memory, and Cognition*, 27(6), 1491–1494.
- Durkin, K., & Rittle-Johnson, B. (2012). The effectiveness of incorrect examples and comparison when learning about decimal magnitude. *Learning and Instruction*, 22(3), 206–214.
- Gagnier, K. M., Atit, K., Ormand, C. J., & Shipley, T. F. (2017). Comprehending 3D diagrams: Sketching to support spatial reasoning. *Topics in Cognitive Science*, 9(4), 883–901.
- Große, C. S., & Renkl, A. (2007). Finding and fixing errors in worked examples: Can this foster learning outcomes? *Learning and Instruction*, 17, 612–634.
- Kali, Y., & Orion, N. (1996). Spatial abilities of high-school students in the perception of geologic structures. *Journal of Research in Science Teaching*, 33, 369–391.
- Keehner, M., Hegarty, M., Cohen, C., Khooshabeh, P., & Montello, D. R. (2008). Spatial reasoning with external visualizations: What matters is what you see, not whether you interact. *Cognitive Science*, 32(7), 1099–1132.
- Ormand, C. J., et al. (2017). The spatial thinking workbook: A research-validated spatial skills curriculum for geology majors. *Journal of Geoscience Education*, 65(4), 423–434.
- Renkl, A., & Atkinson, R. K. (2003). Structuring the transition from example study to problem solving in cognitive skill acquisition: A cognitive load perspective. *Educational Psychologist*, 38(1), 1–22.
- Smith, M. K., Wood, W. B., Adams, W. K., Wieman, C., Knight, J. K., Guild, N., & Su, T. T. (2009). Why peer discussion improves student performance on in-class concept questions. *Science*, 323(5910), 122–124.
- Uttal, D. H., Meadow, N. G., Tipton, E., Hand, L. L., Alden, A. R., Warren, C., & Newcombe, N. S. (2013). The malleability of spatial skills: A meta-analysis of training studies. *Psychological Bulletin*, 139(2), 352–402.
- Outils existants : *Visible Geology* (R. Cockett, UBC ; aujourd'hui porté par Seequent) ; *Geo3D* (Kali & Orion). *Santa Barbara Solids Test* (Cohen & Hegarty, Hegarty lab, UCSB ; conditions d'usage à vérifier).
- **À vérifier avant toute citation** : Renkl, Atkinson, Maier & Staley (2002) ; Freeman et al. (2014) ; Roediger & Karpicke (2006) ; Dunlosky et al. (2013) ; Titus & Horsman (2009) ; Libarkin & Anderson (2005, *Geoscience Concept Inventory*) ; GemPy ; licences Copernicus DEM et Sentinel-2 ; droits des cartes du Service géologique du Maroc.
