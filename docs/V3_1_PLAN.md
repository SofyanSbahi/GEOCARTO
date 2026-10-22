# GéoCarto v3.1 — « Raisonner, pas réciter » · plan de mise en œuvre

> Statut : **WP0 à WP3 réalisés** (2026-10-21 / 22) ; WP4 à WP7 à venir · version 1.3
> Public visé : étudiants de première année de géologie, sans acquis en topographie, cartographie ni raisonnement géologique.
> Ce document évolue avec les versions : mettre à jour la section 9 (journal) à chaque jalon.

## 0. Principe directeur (non négociable)

**Quand la lisibilité depuis le dernier rang s'oppose à l'élégance technique ou à l'esthétique, la lisibilité gagne.**
GéoCarto doit devenir une plateforme d'**enseignement projeté** d'exception, pas seulement d'auto-apprentissage. Chaque lot ci-dessous est donc soumis au *contrat de lisibilité* de la section 2, vérifié par des mesures sur rendu réel.

## 1. Décisions validées

| # | Décision | Conséquence |
|---|---|---|
| D1 | Le **fil du raisonnement** et les **notes enseignant** associés sont un **premier jet à affiner** avec l'expérience de classe. | Tout ce qui est rédigé par la machine porte la mention visible **« brouillon automatique — à relire par un géologue »** jusqu'à relecture (§4, WP2 et WP6). |
| D2 | L'**ouverture sur la lecture du relief** est une **leçon préalable séparée** (`prereq`). | La durée de la leçon *Cartes géologiques* (≈ 38 min) n'augmente pas ; l'enseignant choisit de la passer ou non. |
| D3 | **Toutes les options de vote sont mélangées par défaut.** | Ordre fixe possible seulement si la pédagogie l'exige (`fixed: true`, justifié dans le code). |
| D4 | Ce plan est conservé dans `docs/V3_1_PLAN.md`. | Il évolue avec les versions. |
| D5 | **D (« Histoire d'une carte »)** reste le **prochain grand jalon** après v3.1 (= v3.2). | Hors périmètre de v3.1. |

Périmètre approuvé de v3.1 : **B** (fil du raisonnement) + **A** (options figurées) + **F** (préalable relief) + **I** (formations lisibles en projection), auxquels s'ajoutent deux lots rendus nécessaires par l'audit : **WP0** (ordre des options) et **WP1** (mise en page robuste en salle).

## 2. Contrat de lisibilité de v3.1

Chaque règle a un contrôle automatique ou une mesure sur rendu réel (Chromium, §7).

| # | Règle | Contrôle |
|---|---|---|
| L1 | Texte SVG ≥ `K.MIN` (3,4 u) ; texte HTML projeté ≥ 3,8 % de la hauteur d'écran (le bandeau d'en-tête est exclu, voir F5). | audit rendu |
| L2 | Budget d'attention : ≤ 3 points focaux et ≤ 12 mots par figure (un vote : autant de points que d'options). | `focus_report.mjs` (existant) |
| L3 | La couleur ne porte jamais seule (règle 5 de `STAGE_PEDAGOGY.md`). Éléments clés (flèches, traits) : contraste ≥ 3:1 sur chaque couleur de formation, ou liseré blanc. | `tests/palette.test.js` (nouveau) |
| L4 | Aucun texte hors de sa carte ; aucun recouvrement figure/bulle ; aucun rognage horizontal. | audit rendu |
| L5 | Sur un écran de vote, la figure garde **≥ 50 %** de la hauteur d'écran (≥ 45 % en 4:3) sur **toute la plage de réglage de salle** (×0,8 → ×2,5). | audit rendu (§7) |
| L6 | Une option figurée se distingue des autres de loin : écart ≥ 15° (ou de signe), traits ≥ 0,9 u, aucune étiquette sauf la lettre. | tests moteur + audit |
| L7 | Formations voisines distinguables sous projecteur délavé et daltonisme (ΔE ≥ 10) ou doublées d'un repère non coloré. | `tests/palette.test.js` |
| L8 | Pas plus de 4 séquences passives de suite ni 8 min sans action des étudiants (règle existante). | `tests/lessons.test.js` |

## 3. Constat de départ : audit visuel (2026-10-21)

**Méthode.** Les 27 scènes (15 *Cartes géologiques* + 12 *Coupes géologiques*), **chaque étape** (103 écrans, dont les 3 valeurs du paramètre d'échelle verticale), sur le code restauré. Rendu Chromium, animations terminées (1 s d'attente : une première passe à 110 ms avait produit de fausses « bulles pâles », écartées). Votes simulés (5 A, 4 B, 2 C, 1 D). Formats : 1920×1080, 1280×720, 1280×800, 1024×768 (4:3), 1280×1024 ; échelle de salle ×1 et ×1,5 ; balayage ×1 → ×2 sur le premier vote de chaque leçon. Chaque scène a été regardée sur une planche à 640×360 (ce qui simule aussi une vue lointaine). Les scripts d'audit n'étaient pas versionnés : WP7 les ajoute (`tools/stage/audit_geology.mjs`).
**Limites.** Écran d'ordinateur, pas projecteur réel : le délavé et la lumière ambiante sont simulés par calcul, pas mesurés en salle. Aucune mesure d'apprentissage.

### 3.1 Ce qui est solide et à préserver
- Aucun chevauchement de textes, aucun texte hors cadre, aucun défilement, **0 erreur JS** (103 écrans × 2 formats).
- Texte SVG minimal mesuré : 3,46 % (16:9) et 3,23 % (4:3) de la hauteur d'écran ; légende ≥ 4,9 %.
- Scénarisation visuelle : *coupe/1* (« Et sous le sol ? »), *coupe/6* (« Trois erreurs fréquentes » superposées en rouge), *geocarte/3* (légende = colonne du temps), *geocarte/7* (construction en trois points), *coupe/8* (échelle verticale paramétrée, 31° → 61°), bilans qui se terminent sur la réponse de la mission.

### 3.2 Défauts bloquants (mise en page en salle)

![Preuves : vote effondré en mode amphi (16:9 ×1,5, en haut à gauche), texte hors carte et bulle recouvrant le schéma en 4:3 ×1,5](stage/audit_v31_amphi.webp)

| ID | Constat | Mesure |
|---|---|---|
| **F1** | **À l'étape de décompte d'un vote, la figure s'effondre quand l'échelle de salle augmente** : le bandeau « bonnes réponses : discutez… » et le compteur, placés dans `.st-l-side` (`flex:none`, donc incompressible), s'élargissent avec `--u` et écrasent la légende en une colonne d'un mot par ligne ; le pied de page devient haut et la figure disparaît. Cause probable à confirmer en WP1. **Toutes les leçons** sont touchées (code partagé), pas seulement la géologie. | Hauteur de la figure, en % de l'écran (sain ≈ 55–70 %) : 16:9 → ×1 : 72 % · ×1,3 : 19–49 % · ×1,5 : 1–15 % · ×1,75 et plus : 1 %. 4:3 → ×1 : 61 % · ×1,1 : 38 % · ×1,5 : 8–15 % (la leçon *échelle* est encore plus bas : 26 % dès ×1, 0 % à ×1,1). Mesuré sur le premier vote de chaque leçon, étape de décompte. Le mode « amphi » s'active à ×1,3 ; l'interface propose jusqu'à ×2,5. |
| **F2** | En 4:3 / 5:4 avec échelle ×1,5, le texte des options déborde de sa carte (« Sont verticaux », « Restent horizontaux » coupés) et recouvre les barres de résultat ; à ×1 le texte touche déjà les barres (vu sur capture). | 10 écrans (4:3) et 13 (5:4) : *geocarte* 8 et 10, *coupe* 2, 5 et 9. |
| **F3** | Collisions figure/bulle : la bulle sombre de *coupe/7* (étapes 2 et 3) recouvre une partie du schéma et l'étiquette « 27° » (4:3, 5:4 et 16:10 ×1,5) ; *geocarte/14* : les étiquettes « 477 m » et « 876 m » se chevauchent (4:3 ×1,5) ; l'échelle « 1 km » coupe le trait de contact dans *geocarte/14* ; les bulles de *coupe/10* (étapes 1, 3, 4) mordent sur le bas de la coupe. | voir captures |
| **F4** | En 4:3 ×1,5, le compteur « n / N » et le minuteur de *geocarte/14* sont rognés à droite. | capture |

### 3.3 Défauts de lisibilité

| ID | Constat | Mesure |
|---|---|---|
| **F5** | Textes projetés sous 3,8 % : bandeau d'instruction par les pairs (2,8 %), compteur de votes (3,0 %), **chiffres du minuteur (2,9 %)**, libellé du paramètre (3,4 %), pastille de type de séquence et numéro de scène (2,6 %). Le minuteur concerne les étudiants (pratique) ; le bandeau est destiné à l'enseignant. | CSS `stage.css` : `.st-l-pi`, `.st-l-tally`, `.st-l-timer b`, `.st-l-pv`, `.st-l-n` ; audit |
| **F6** | Correction d'un vote : 23 à 44 mots (les 8 votes de géologie dépassent 22 mots), la seconde ligne (malentendu nommé) est à 3,5 %. | `coupe/5.2` : 44 mots |
| **F7** | La figure d'un vote est petite : l'encart de carte de *coupe/2* (flèche de pendage, information essentielle) ≈ 26×18 u ; la coupe erronée de *coupe/5* ; les cartes de *geocarte/13* et *coupe/9* — alors que leurs options tiennent en un mot et pourraient occuper moins de largeur. Les cartes d'options ont une largeur fixe (68 u sur 160). | observation |
| **F8** | **Flèches et traits clés sans liseré** : le rouge d'accentuation (`C.acc`, #d2461e) a un contraste de **1,29:1 sur le pourpre (Trias), 1,61:1 sur le bleu (Lias), 1,88:1 sur l'orange (Dévonien), 2,18:1 sur le vert (Crétacé inf.)** — moins de 3:1 sur 6 couleurs de formation sur 8 (la flèche « on marche dans le sens du pendage » traverse le pourpre ; le trait de contact et la direction de pendage sont aussi concernés). Les bulles, elles, sont bien contrastées (texte blanc : 4,5:1 à 18:1). | calcul WCAG (couleurs de `geology.js`) |
| **F9** | Espace perdu : *coupe/7* étape 0 et *geocarte/14* étapes 0-1 laissent environ 40 % de la figure vide (estimation visuelle) alors que la carte, dense en courbes, reste petite. Traits en plan de *coupe/7* fins. | observation |
| **F10** | Les formations estompées (opacité 0,22) deviennent presque blanches (*geocarte/3* étapes 2-3, *geocarte/11* étapes 1-2) : sous un projecteur délavé, les bandes « coupées » par le filon seront à peine visibles. | à mesurer (WP5) |
| **F11** | Teintes voisines peu distinctes : écart de couleur (ΔE76, CIELAB) Lias→Dogger 13,6 en vision normale ; **sous projecteur délavé (mélange de 40 % avec un gris clair) et daltonisme (deutéranopie, modèle de Machado), 3 paires passent sous 10** : Crétacé inf./sup. 8,3, Lias/Dogger 8,5, Ordovicien/Silurien 9,2 (Trias/Lias 10,4 et Dogger/Malm 11,9 sont à la limite). Visible dans *geocarte/12* (discordance : bleu intérieur et bleu de l'anneau). Simulation, pas mesure en salle ; seuil 10 = règle empirique. | calcul à reproduire dans `tests/palette.test.js` (WP5) |
| **F12** | Lettres grecques γ et δ dans les pastilles de légende (roches magmatiques) : lisibles de loin ? à tester avec des étudiants. | observation |

### 3.4 Observations pédagogiques à soumettre au géologue (hors périmètre v3.1)
- **P1.** Dans *coupe/4*, la formule α′ (δ = 35°, angle 30°, α′ = 31°) apparaît **avant** l'intuition visuelle de *coupe/7* (« pourquoi le pendage change selon la coupe »). *Intuition visuelle avant formalisme* : envisager d'inverser l'ordre ou de commencer *coupe/4* par une version sans formule.
- **P2.** La bonne réponse est **A dans 16 des 20 votes** de GéoCarto (les 8 votes de géologie sans exception) : corrigé par WP0.
- **P3.** *coupe/5* est déjà un vote de **diagnostic d'erreur** sur figure (la coupe d'un camarade) : c'est un bon modèle ; WP3 s'en inspire et l'agrandit plutôt que de le remplacer.

## 4. Lots de travail

Taille : S petite · M moyenne · L grande. Ordre d'exécution : WP0 → WP1 → WP2 → WP3 → WP4 → WP5 → WP6 → WP7 (WP4 et WP5 peuvent avancer en parallèle).

### WP0 — Ordre des options mélangé par défaut · S–M
- **But.** Supprimer le biais « la réponse est A » (P2) et rendre le décompte et les seuils de Mazur fiables.
- **Conception.** Permutation déterministe par (leçon, scène, graine de séance). Les décomptes restent stockés **dans l'ordre canonique** : journal, bilan (`pages.js`) et `diagnosis()` ne changent pas. La lettre affichée est convertie en index canonique à la frontière de l'interface (clavier a–d, clic, présentateur, `BroadcastChannel`). `fixed: true` pour les rares votes dont l'ordre porte du sens (justification obligatoire en commentaire).
- **Fichiers.** `js/stage/lesson.js` (`voteFig`, `vote()`, touches, légende de correction, vue présentateur), `js/stage/tools.js` (permutation).
- **Tests.** `tests/vote-order.test.js` : bijection, déterminisme, répartition de la bonne réponse sur A–D (≥ 15 % chacune sur 200 graines), cohérence lettre ↔ index canonique, `fixed` respecté. Le test des options (2 lignes de 17 caractères) reste vert.

### WP1 — Mise en page robuste en salle · M
- **But.** Corriger F1–F4 et L4–L5 : l'écran de vote doit rester lisible sur toute la plage d'échelle de salle et sur 16:9, 16:10, 4:3, 5:4.
- **Conception (lisibilité d'abord).** (1) Retirer le bandeau d'instruction par les pairs de l'écran projeté : il va dans la **vue présentateur** ; à l'écran il ne reste qu'un indicateur très court et gros (ex. « 42 % ») ou rien. (2) Plafonner `.st-l-side` (largeur maximale, `flex-shrink`) et garantir une **hauteur minimale de figure** (`min-height` de la rangée) ; le pied de page ne peut plus manger la figure. (3) Cartes d'options : hauteur adaptée au texte agrandi ou texte réduit par `K.fit` jusqu'à `MIN`, jamais de débordement. (4) Bulles : placées hors du cadre des schémas ou schéma réduit pour leur laisser la place (*coupe/7*, *coupe/10*) ; échelle « 1 km » éloignée des contacts. (5) Chiffres du minuteur ≥ 5 % ; compteur et numéro de scène à ≥ 3,8 %.
- **Fichiers.** `css/stage.css`, `js/stage/lesson.js`, `js/stage/kit.js` (`fit`), `js/stage/lessons/coupe.js`, `geomap.js`, `geologie.js` (positions de bulles).
- **Tests.** Audit rendu automatisé (WP7) sur 5 formats × échelles ×0,8 → ×2,5 : figure ≥ 50 % / 45 %, aucun texte hors carte, aucun recouvrement, aucun rognage ; ajout d'un test statique des sélecteurs (`css-scope`) pour toute nouvelle règle.

### WP2 — Fil du raisonnement (B) · M — *brouillon automatique, à relire*
- **But.** Rendre visible, à chaque scène, **comment pense un géologue** : un seul fil, le même pour les cartes et les coupes.
- **Conception.** Six jalons, **Observer · Situer · Mesurer · Dater · Supposer · Vérifier** (libellés ≤ 10 caractères). Bandeau HTML hors du SVG (n'ajoute aucun point focal), jalon courant plein **et numéroté** (pas la couleur seule), taille ≥ 3,8 %. Nom de classe `st-l-thread` : **`st-l-rail` désigne déjà les pastilles de navigation**. La leçon *Coupes* aboutit à **Vérifier** : une coupe est le *test d'une hypothèse*, pas un dessin à recopier. Fiche A5 imprimable (`#/stage/fil`).
- **Correspondance scène → jalon (version 0, à affiner).** *Cartes* : hook, v1, légende → Observer ; contact, horiz, v2 → Situer ; dip, v3, pr → Mesurer ; âge, v4, recoup → Dater ; struct, v5 → Supposer ; bilan → les six. *Coupes* : hook → Observer ; v1, horiz, mono → Vérifier ; v2 (erreurs), apparent, ev → Mesurer ; struct, v3 → Supposer ; pr → Vérifier ; bilan → les six.
- **Statut.** Champ `draft: true` sur chaque jalon et chaque texte ; mention **« brouillon automatique — à relire par un géologue »** visible dans la vue présentateur et la fiche imprimable (clé i18n `lk.draft`). Retirer le drapeau = relecture faite (nom du relecteur et date dans ce document, §9).
- **Fichiers.** `js/stage/lesson.js`, `js/stage/lessons/geologie.js` et `coupe.js` (champ `step`), fichiers de textes des leçons, `js/stage/pages.js` (fiche), `js/main.js` (route, à vérifier), `css/stage.css`.
- **Tests.** `tests/thread.test.js` : chaque scène de géologie a un `step` valide (la correspondance v0 est figée : la changer doit être volontaire) ; le bilan montre les six étapes ; clés i18n présentes ; libellés ≤ 10 caractères ; le bandeau n'émet aucune classe `fp` ; tout jalon `draft` affiche la mention.

### WP3 — Options figurées (A) · L
- **But.** Chaque mauvaise réponse est **la figure que produirait un étudiant ayant ce malentendu**, générée par le moteur : le vote *diagnostique* et la salle *voit* pourquoi c'est faux.
- **Moteur.** Nouveau module pur `js/engine/geology/distractors.js` (sans DOM, contrat des moteurs respecté) : sens inversé, contacts verticaux, contacts horizontaux, pendage vrai pris pour l'apparent, contacts en éventail. Additif : les golden et `ENGINE_VERSION` ne changent pas.
- **Deux mises en page de vote.** `gallery` (grille 2×2 de mini-figures, lettre seule) et `overlay` (une carte, quatre flèches lettrées ; les cartes de texte restent). Largeur des cartes **adaptative** : options d'un mot → cartes étroites → figure plus grande (F7).
- **Première série (4 des 8 votes de géologie).** *coupe* v1 (sens, vertical, horizontal) et v3 (voûte/cuvette) en `gallery` ; *geocarte* v3 (direction du pendage) en `overlay` ; *coupe* v2 (diagnostic d'erreur, déjà figuré) : **agrandi seulement**. Les votes *couleur*, *âge*, *horizontales* et *nom de structure* restent verbaux (pas purement géométriques).
- **Fichiers.** `js/engine/geology/distractors.js` (+ `index.js`), `js/stage/lesson.js`, `js/stage/lessons/coupe.js`, `geologie.js`, `geosection.js`, `geomap.js`, fichiers de textes, `css/stage.css`.
- **Tests.** Propriétés dans `tests/engine.test.js` (variante correcte = `apparentDip`, écart ≥ 15° ou de signe, toutes structures × graines) ; dans `tests/geology-stage.test.js`, chaque option figurée correspond à l'identifiant de malentendu annoncé ; budget d'attention ; audit rendu.

### WP4 — Leçon préalable « Lire le relief » (F) · M
- **But.** Vérifier en 3 votes (≈ 6 min) que les étudiants lisent les courbes de niveau avant d'aborder les contacts.
- **Conception.** Leçon **séparée** `prereq`, entièrement active (votes). Réutilise les malentendus existants (`e-diff`, `e-bas`, `t-fermee`, `t-vallee`…) et ajoute la question du **V d'une courbe dans une vallée** (pont vers la règle des V). Conseil par bande de Mazur **dans la vue présentateur**. Lien depuis l'accroche de *Cartes géologiques*.
- **Fichiers.** `js/stage/lessons/prereq.js` (nouveau), `lessons/index.js`, `lessons/fr.js`, `tests/lessons.test.js` (le test « 11 thèmes » admet les leçons annexes).
- **Tests.** `tests/prereq.test.js` ; tests existants (budget, options, séquences passives).

### WP5 — Formations lisibles en projection (I) · M
- **But.** F8, F10–F12 : la géologie ne repose plus sur la couleur seule ni sur un rouge invisible.
- **Conception.** (1) **Lettre de formation sur chaque région** et **hachures** pour les paires faibles (le choix visuel final se décide sur rendu, pas sur plan). (2) **Liseré blanc** sous toutes les flèches et tous les traits clés ; épaisseurs minimales relevées. (3) Opacité des formations estompées ≥ 0,35 (à valider) avec contacts conservés. (4) Greek γ/δ : lettres latines ou pictogramme à tester.
- **Fichiers.** `js/stage/lessons/geomap.js` (`geoMapSvg`, `legendSvg`), `geosection.js` (`regionsSvg`), `geoworld.js`, `css/stage.css`.
- **Tests.** `tests/palette.test.js` : contraste ≥ 3:1 des éléments clés sur chaque formation (ou liseré présent), ΔE ≥ 10 des paires voisines (ou repère non coloré) sous délavage et daltonisme (les formules du calcul de l'audit).

### WP6 — Couche enseignant minimale · S — *brouillon automatique, à relire*
- **Constat (corrigé le 2026-10-22).** La vue présentateur lit `<leçon>.<scène>.note` et `.ask`. Ma première lecture (« aucune note ») était **fausse** : les 27 scènes de géologie ont déjà chacune une note et une question (15 + 12, vérifié par `has()` sur les clés). Le lot devient donc : **relire** ces notes, y **ajouter** le conseil par bande de Mazur et le rappel de l'étape du fil, et les marquer « brouillon » tant qu'elles ne sont pas relues.
- **Contenu.** Pour les scènes modifiées ou créées en v3.1 : note, question à poser, conseil par bande de Mazur (< 30 %, 30–70 %, > 70 %). Chaque texte porte `draft: true`.
- **Tests.** Chaque scène de vote touchée a `note` et `ask` ; la mention « brouillon » s'affiche.

### WP7 — Outil d'audit et hygiène de livraison · S
- Ajouter `tools/stage/audit_geology.mjs` (dérivé de l'audit de la section 3 : captures de toutes les étapes, votes simulés, formats × échelles, sondes de débordement et de recouvrement), utilisable en local et en intégration continue (Chromium présent).
- Changer le nom de cache de `sw.js`, reconstruire `dist/app.js` (`npm run check:dist` vert), mettre à jour `README.md`, `docs/ENGINES.md` (nombre de tests) et ce document.

## 5. Impact par fichier

| Fichier | Lots |
|---|---|
| `js/stage/lesson.js` | 0, 1, 2, 3 |
| `js/stage/tools.js` | 0 |
| `js/stage/kit.js` | 1 |
| `js/stage/lessons/geologie.js`, `coupe.js` | 1, 2, 3, 5, 6 |
| `js/stage/lessons/geomap.js`, `geosection.js`, `geoworld.js` | 1, 3, 5 |
| `js/stage/lessons/prereq.js` (nouveau), `index.js`, `fr.js` | 4 |
| `js/engine/geology/distractors.js` (nouveau), `index.js` | 3 |
| `js/stage/pages.js`, `js/main.js` | 2 |
| `css/stage.css` | 1, 2, 3, 5 |
| `tests/` : `vote-order`, `thread`, `prereq`, `palette` (nouveaux) ; `engine`, `geology-stage`, `lessons` (étendus) | 0, 2, 3, 4, 5 |
| `tools/stage/audit_geology.mjs` (nouveau), `sw.js`, `dist/app.js`, `README.md`, `docs/` | 7 |

## 6. Hors périmètre de v3.1 (reporté)
**D — Histoire d'une carte** (dépôt → basculement → érosion → vue du dessus) : **jalon v3.2**, il partagera le moteur de bloc 2D avec **C** (vues liées carte ⇄ coupe ⇄ bloc, en SVG ; pas de WebGL tant que les projecteurs d'amphi ne sont pas testés). Aussi reportés : mode évaluation et fiches imprimables, vote sur téléphones, arabe et anglais, cas marocains relus, cartes géologiques réelles (licences), P1 (ordre formule/intuition).

## 7. Plan de test et critères d'acceptation

1. La suite existante (122 tests) reste verte ; `npm run check:dist` vert ; CI verte.
2. Nouveaux tests : `vote-order`, `thread`, `prereq`, `palette` ; extensions `engine`, `geology-stage`, `lessons`.
3. **Audit rendu** (WP7) : 27 scènes × toutes les étapes × 5 formats × échelles ×0,8 → ×2,5 : aucun défaut F1–F4 ; texte ≥ 3,8 % hors bandeau d'en-tête ; figure de vote ≥ 50 % (≥ 45 % en 4:3).
4. **Revue visuelle** de chaque scène modifiée, planche à 640×360 comme simulation de vue lointaine.
5. **Revue du contenu** : relecture par un géologue des règles, de la correspondance des jalons et des notes (D1). Tant qu'elle n'a pas eu lieu, la mention « brouillon automatique » reste affichée.
6. **Essai en salle** (une séance réelle) : journal local des votes ; observation de la répartition des réponses avant/après WP0 et WP3. **Descriptif seulement** : aucune conclusion sur les acquis sans un protocole (pré/post, approbation éthique).
7. **Non vérifiable ici** : contraste d'un vrai projecteur, effet pédagogique, relecture géologique. À dire dans les notes de version.

## 8. Risques et décisions ouvertes
- **Relecteur géologue** (nom, date) : à désigner ; sans lui, tout reste « brouillon ».
- **WP1 touche tout le mode Stage**, pas seulement la géologie : prévoir un essai sur les autres leçons.
- **Options figurées** : la densité visuelle (4 mini-figures) doit rester lisible ; critère L6 ; arbitrage sur rendu.
- **Hachures vs lettres** (WP5) : à trancher sur capture projetée.
- Le dépôt de reprise `recovery/restore-source` doit être fusionné avant d'empiler v3.1.

## 9. Journal
| Date | Événement |
|---|---|
| 2026-10-21 | Plan v1.0 rédigé après audit visuel des 27 scènes (103 écrans) ; décisions D1–D5 enregistrées. Aucun code modifié. |
| 2026-10-21 | **WP0 + WP1 réalisés** (v1.1) : voir §10. 141 tests verts ; porte de projection `npm run gate:stage` : 1 552 écrans géologie × 4 formats × 4 échelles sans défaut. |
| 2026-10-22 | **WP2 réalisé** (v1.2) : fil du raisonnement (brouillon à relire). 148 tests. |
| 2026-10-22 | **WP3 réalisé** (v1.3) : options figurées. 162 tests. |
| 2026-10-22 | **WP4 réalisé** (v1.4) : leçon préalable « Lire le relief » (brouillon à relire). 172 tests. |

## 10. État d'avancement

### WP0 + WP1 — réalisés (2026-10-21)
**Mesure avant / après** (même porte `tools/stage/stage_gate.mjs`, mêmes écrans, Chromium) :

| Mesure | Avant | Après |
|---|---|---|
| Figure d'un vote en % de la hauteur d'écran, 16:9 : ×1,3 · ×1,5 · ×1,75 | 19–49 % · 1–15 % · 1 % | 62 % · 57 % · 57 % (relevé intermédiaire ; la porte garantit ≥ 50 % / 45 % sur tous les écrans) |
| idem 4:3 : ×1,1 · ×1,5 | 38 % · 8–15 % | 68 % · 51–58 % |
| Défauts sur 582 écrans de géologie (2 formats × 3 échelles) | **855** (38 / 58 / 268 en 16:9 ; 43 / 175 / 273 en 4:3, par échelle ×1 / ×1,5 / ×2,5) | **0** |
| Matrice complète géologie : 1 552 écrans (4 formats × 4 échelles ×0,8 → ×2,5) | — | **0 défaut** |
| Autres leçons (1 074 écrans, 2 formats × 3 échelles) | 66 / 72 / 319 / 76 / 194 / 499 | 0 / 7 / 7 / 9 / 29 / 32 (pas de régression ; voir « Reste à faire ») |
| Bonne réponse en « A » | 16 votes sur 20 | répartie sur A–D (15–35 % chacune sur 200 graines) |
| Tests Node | 122 | **141** (vote-order 8, layout 11) |

**Ce qui a changé**
- **WP0.** `optionOrder` (permutation déterministe par scène et graine, `js/stage/tools.js`) ; décomptes, journal et bilan restent en ordre canonique. Revue des 20 votes : **aucun n'exige `fixed`** (l'option reste disponible, avec `fixedWhy` obligatoire).
- **WP1.**
  1. *Unité du chrome plafonnée* : `--uc = min(unité de salle, 1,45 × base, 0,95 % de la largeur)` ; toutes les règles `.st-l*` l'utilisent. En 16:9 jusqu'à ×1,45 : aucun changement.
  2. *Budgets* : titre ≤ 11–12 % de la hauteur, légende ≤ 24 %, figure ≥ 46 % (garde CSS) ; polices ajustées par `fitClaim` / `fitCaption` (jamais sous 3,8 % / 4,2 % de la hauteur d'écran).
  3. *Bandeau « instruction par les pairs »* retiré de l'écran projeté : il reste dans la vue présentateur ; **touche I** pour une indication courte (« 42 % · discutez 2 min, puis R ») sur l'écran, mémorisée.
  4. *Correction d'un vote* : le nom du malentendu est toujours projeté ; son explication longue n'est conservée que si elle tient, sinon elle reste dans la vue présentateur et la bibliothèque.
  5. *Options de vote* ajustées en largeur **et** hauteur (`K.fitBox`) ; bulles bornées à leur bande (`callout`, `top` / `maxH`) ; coupes (`SEC`) et schéma de pendage apparent réduits de la hauteur gagnée par le texte ; étiquettes d'altitude écartées (`K.declutter`) ; échelle graphique placée loin des trois points.
  6. *Textes du chrome ≥ 3,8 %* (pastille, compteur, tally, paramètre) ; **minuteur** : chiffres ≥ 5 % avec barre de progression (l'ancien anneau portait des chiffres à 2,9 %).
- **Porte de qualité** `npm run gate:stage` (nécessite Playwright et un serveur local : voir l'en-tête du script) : ordre des options cohérent touche ↔ lettre ↔ carte cochée, débordements, recouvrements, rognage, rail visible, légende non tronquée, figure ≥ 50 % / 45 %, tailles minimales.
- Les tests ont été vérifiés par **mutation** (6 régressions volontaires : toutes détectées).

**Choix à valider en classe** : plafond 1,45 (≈ 7 % de la hauteur pour une ligne de légende) ; seuils 11 % / 24 % / 46 % ; libellés courts de la touche I.

### Reste à faire / observé hors périmètre
- **Autres leçons** (hors géologie) : bulles recouvrant du texte à ×1,5 et en 4:3 (*coord*, *echelle*, *orient*, *mission*) et légende tronquée de *orient/2* — même code partagé, défauts préexistants, à traiter dans un lot dédié.
- **F7 / F9** (figure de vote petite, espace vide dans *geocarte/14* et *coupe/7*) : WP3 et WP5.
- **Revue visuelle** : le « 45° » de *coupe/7* touche le bord de son cadre en 4:3 (mineur).

### WP2 — Fil du raisonnement : réalisé (2026-10-22) — *brouillon automatique, à relire*
- **Bandeau** `Observer · Situer · Mesurer · Dater · Supposer · Vérifier` sur les 27 scènes de géologie (`js/stage/thread.js`, champ `step` de chaque scène). Étape courante pleine, numérotée, `aria-current` ; **bilan : les six pleines**. Il **remplace la rangée du rail** (même hauteur : la figure ne perd rien) ; le rail réapparaît, opaque, au mouvement du pointeur.
- **Lisibilité** : police de 4,6 u de chrome réduite jusqu'à 3,8 % de la hauteur d'écran, rangée ≤ 9 % de la hauteur. **16:9 : les six noms sont toujours visibles** (à tous les réglages de salle testés). **4:3 / 5:4 / 16:10 étroit** : les six noms ne tiennent pas à une taille lisible ; seule l'étape **courante** garde son nom (les autres : leur numéro).
- **Vue présentateur** : ligne « Fil : étape 3 — Mesurer : Quelle direction, quel pendage ? — brouillon automatique… ». **Fiche A5 imprimable** `#/stage/fil` (lien depuis l'index) avec la question et un indice par étape.
- **Statut de brouillon** : `THREAD_DRAFT = true` ; mention « brouillon automatique — à relire par un géologue » dans le présentateur et sur la fiche. Passer à `false` seulement après relecture (nom et date à noter ici).
- **Correspondance v0** (figée par `tests/thread.test.js`) : *Cartes* — hook, v1, légende → Observer ; contact, horiz, v2 → Situer ; dip, v3, pr → Mesurer ; âge, v4, recoup → Dater ; struct, v5 → Supposer ; bilan → les six. *Coupes* — hook → Observer ; v1, horiz, mono, pr → Vérifier ; v2, erreurs, apparent, ev → Mesurer ; v3, struct → Supposer ; bilan → les six. **Points à trancher par le relecteur** : v2/erreurs (diagnostic d'une coupe fausse) en « Mesurer » ou « Vérifier » ? ; la construction d'une coupe avant l'intuition du pendage apparent (cf. P1).
- **Mesure** (`npm run gate:stage`) : 873 écrans géologie × 3 formats × 3 échelles : 0 défaut ; 148 tests (7 nouveaux, vérifiés par 4 régressions volontaires).

### WP3 — Options figurées : réalisé (2026-10-22)
- **Moteur** `js/engine/geology/distractors.js` (pur, DOM-free, additif : golden et `ENGINE_VERSION` inchangés) : `contactVariants` (vrai pendage apparent, sens inversé, contacts verticaux, contacts à plat), `dipDirectionCandidates` (flèches : sens du pendage, son inverse, direction du contact, pente du terrain ; origine choisie pour un écart ≥ 25°), `foldVariants` (anticlinal, cuvette, bandes inclinées, couches horizontales **sur le même terrain**), `gridDifference`, `lineSeparation`, `downhillAzimuth`.
- **Vote « galerie »** (`vote.layout = 'gallery'`, `lesson.js`) : contexte à gauche, grille 2 × 2 de petites coupes à droite, une lettre en gros par option et **aucun autre texte** ; décompte, barre, ✓/✗ et revote comme les cartes ; l'option fausse reste bien visible après la correction (opacité 0,8) car c'est elle qu'on discute.
- **Votes convertis** : *Coupes* v1 « Où vont les contacts ? » (galerie) et v3 « Quelle forme en coupe ? » (galerie) ; *Cartes* v3 « Vers où plonge la couche ? » (quatre **flèches lettrées** sur la carte, les altitudes deviennent discrètes). Les lettres suivent l'ordre mélangé du WP0 (`X.letterOf`). *Coupes* v2 (« Quelle est l'erreur ? ») montrait déjà la coupe fausse : inchangé.
- **Ce que l'audit visuel a corrigé en cours de route** (invisible aux tests) : coupes trop plates (ajout d'une profondeur `MINI_DEPTH` = 0,35), trait trop épais pour « contacts à plat », monoclinal qui plongeait dans la direction de la coupe (bandes plates, indiscernables des couches horizontales), couches horizontales d'une seule teinte, légende « récent / ancien » qui débordait en 4:3 (remplacée par une flèche du temps), texte de question qui recouvrait la carte.
- **Contre-parties à connaître** : la carte de contexte du vote « Quelle forme en coupe ? » est ~45 % plus petite (la place est donnée aux quatre coupes) ; dans le vote de direction, les lettres A et D restent proches des étiquettes d'altitude (lisibles, un peu serrées).
- **Hors lot** : largeur adaptative des cartes de texte (F7) pour les votes restés verbaux (*Cartes* v5 notamment) — non fait.
- **Mesure** : 162 tests (14 nouveaux : `distractors`, dont l'orientation du monoclinal sur la coupe montrée) ; 7 régressions volontaires toutes détectées ; porte de projection : 0 défaut sur les formats testés.

### WP4 — Leçon préalable « Lire le relief » : réalisée (2026-10-22) — *brouillon automatique, à relire*
- **Leçon séparée** `prereq` (`js/stage/lessons/prereq.js`, décision D2), hors de la leçon « Cartes géologiques » ; carte dédiée dans l'index (`#/stage/prereq`) ; 3 votes ≈ 7 min + récapitulatif en 3 lignes ; `draft: true` (bandeau « brouillon automatique » dans la vue présentateur et sur la carte d'index).
- **Trois réflexes testés** : (1) même courbe = même altitude (malentendus `t-pente`, `t-dist`, `t-veg`) ; (2) les chiffres disent où l'on descend (`c-sens`, `c-plat`, `c-nsp`) ; (3) le V pointe vers l'amont (`c-vaval`, `c-vnord`, `c-vnsp`). Figures calculées par le moteur de terrain, équidistance 100 m (3 courbes étiquetées lisibles au dernier rang). Tous les votes sont mélangés.
- **Lien** : la note de la première scène de « Cartes géologiques » suggère le préalable aux groupes peu à l'aise avec les courbes.
- **Mesure** : 172 tests (6 nouveaux : altitudes de P/Q, pointe du V, textes et malentendus) ; porte de projection prereq + geocarte + coupe : 0 défaut (2 formats × 3 échelles).
- **Limite connue** : sur la colline de démonstration, P (500 m) et Q (300 m) ne sont distants que d'~10 unités : la flèche du vote 2 est courte (lisible, mais à agrandir si la relecture le demande). Seuils et formulations à relire par un enseignant de topographie.
