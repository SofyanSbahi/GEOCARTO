# GéoCarto v3.1 — candidat à la livraison (RC1) et liste de contrôle

> Version 1.4 · 2026-10-26 · `3.1.0-rc.5` (rc.5 = rc.4 + ergonomie de la vue enseignant, § 10 ; écran projeté identique). Précédemment `3.1.0-rc.4` (RC2 = RC1 + finition de projection des leçons de topographie, voir § 7). Contenu pédagogique rédigé par la machine : **brouillon à relire par un géologue** (porte de livraison G3 ci-dessous).

## 1. Ce que contient la RC1
Leçons Stage « Cartes géologiques » (15 scènes), « Coupes géologiques » (12 scènes) et préalable « Lire le relief » (3 votes) ; votes mélangés ; fil du raisonnement ; options figurées ; palette de projection ; vue présentateur avec malentendu dominant ; outil d'audit `npm run audit:geology`. Détail : [V3_1_REVIEW.md](V3_1_REVIEW.md), plan et journal : [V3_1_PLAN.md](V3_1_PLAN.md).

## 2. Ordre de fusion recommandé (PR empilées)
Les cinq branches forment une chaîne linéaire : chaque PR a pour base la précédente. **Fusionner dans l'ordre, en « merge commit » (pas de squash : un squash casserait les PR suivantes)**, puis laisser GitHub rebaser la base de la suivante sur `main`.

| # | Branche | Base | Contenu |
|---|---|---|---|
| 1 | `recovery/restore-source` | `main` | M1–M4 : sources restaurées, outils épinglés, `.gitignore`/README, CI |
| 2 | `docs/v3-1-plan` | #1 | Plan v3.1 et audit visuel de référence |
| 3 | `v3.1/wp0-wp1` | #2 | WP0 votes mélangés, WP1 robustesse amphi |
| 4 | `v3.1/wp2-wp4` | #3 | WP2 fil, WP3 options figurées, WP4 préalable, WP5 palette, WP6 enseignant, WP7 audit, revue |
| 5 | `release/v3.1-rc1` | #4 | Cette liste de contrôle, protocole d'essai, version 3.1.0-rc.1 |

Ne fusionner #1 que si la CI est verte (elle teste `dist/app.js` reproductible).

## 3. Portes de livraison
| Porte | Condition | État RC1 |
|---|---|---|
| G1 Technique | `npm ci && npm test` vert ; `npm run check:dist` vert ; CI verte sur la PR | tests locaux 179/179 ; `check:dist` OK ; **CI à confirmer sur GitHub** |
| G2 Projection | `npm run audit:geology` : 0 défaut (4 formats × 4 échelles) | RC1 : géologie 1 744 écrans, 0 défaut · **RC2 : toutes les leçons, 4 608 écrans, 0 défaut** |
| G3 Contenu | Relecture par un géologue : fil, notes, préalable, 24 malentendus, faits des cas marocains, droits des figures | **NON FAITE — bloquante pour tout usage noté** ; autorisée pour l'essai de validation (§ protocole) |
| G4 Salle | Test du dernier rang (touche `K`) dans la salle réelle, au projecteur réel | **À faire** avant l'essai |
| G5 Hors-ligne | Premier chargement en ligne, puis avion : leçons Stage et préalable fonctionnent ; ancien cache remplacé (`geocarto-v4-stage4-v31`) | à faire sur l'appareil de projection |
| G6 Hygiène | Code enseignant changé (README et `config.js`, M6) ; licence choisie ; adresse du dépôt à jour (renommé `GEOCARTO`) | **à faire** |
| G7 Navigateurs | Chrome et Edge récents sur l'ordinateur de salle ; une tablette ; un téléphone | à faire |

## 4. Liste de contrôle de publication
1. [ ] Pousser et ouvrir les 5 PR (chaîne ci-dessus) ; CI verte sur chacune.
2. [ ] Fusionner #1 → #5 dans l'ordre ; vérifier que `main` reconstruit `dist/app.js` à l'identique (`npm ci && npm run check:dist`).
3. [ ] **Changer le code enseignant** (M6), vérifier qu'il n'apparaît dans aucun document partagé ; décider d'une licence (code : MIT/Apache ; contenu : CC-BY, après vérification des droits des figures).
4. [ ] G3 : un relecteur nommé signe `docs/V3_1_REVIEW.md` §1 (date, nom, corrections). Retirer ou conserver la mention « brouillon automatique » selon son avis.
5. [ ] G4 et G5 dans la salle.
6. [ ] Passer `package.json` de `3.1.0-rc.5` à `3.1.0` ; étiqueter `v3.1.0` ; notes de version = résumé de la revue.
7. [ ] Activer GitHub Pages sur `main` (racine) ; ouvrir l'URL publique en navigation privée ; vérifier `#/stage/prereq`, `#/stage/geocarte`, `#/stage/coupe`, `#/stage/fil`.
8. [ ] Sauvegarde : archive du dépôt (ou bundle) + export Zenodo si le contenu est ouvert (DOI).
9. [ ] Ouvrir les tickets « v3.2 » issus de la revue (relecture, essai instrumenté, D « Histoire d'une carte », dette F7/F9, audit en CI).

## 5. Retour arrière
Chaque PR est indépendante en lecture et réversible par `git revert -m 1` du merge. Le service worker supprime l'ancien cache à l'activation ; en cas de problème en salle, ouvrir l'application en navigation privée ou vider les données du site.

## 6. Limites connues de la RC1 (reprise de la revue)
Aucun test avec des étudiants ; palette validée par simulation ; contenu non relu ; défauts d'anciennes leçons (*coord, échelle, orient, mission* à 4:3 / amphi, hors géologie) ; flèche courte au vote 2 du préalable ; pas d'arabe ni d'anglais.

## 7. RC2 — finition (2026-10-26)
Aucune fonction nouvelle (la v3.2 attend l'essai en classe) ; uniquement des défauts de projection mesurés par la porte, dans les leçons de topographie :
- *Coordonnées* : étiquettes φ/λ qui se recouvraient et masquaient M ; N/S et O/E qui se chevauchaient ; colonne X/Y empilée d'après les tailles réelles.
- *Échelle* : « Sur le terrain » recouvert par la valeur agrandie.
- *Orientation* : texte des trois nords agrandi deux fois (débordait de la figure) ; titre du vote sur « N » ; valeur du paramètre (« Déclinaison … ») qui écrasait la légende → elle passe sur deux lignes.
- *Mission* : pastille de la question courante sur la ligne voisine.
- *Relief* : titre du vote 1 passé sous les cartes d'options (nouvel outil `tagFit`, testé).
- *Pente* : étiquette d'angle sur « D = 200 m » ; étiquettes de l'éventail % / degrés et cadre « 100 % ≠ 100° » qui se chevauchaient (colonne de légende).
- *Profil* : code du terrain sur son intitulé.
- *Préalable « Lire le relief »*, vote 2 : flèche P → Q horizontale et deux fois plus longue.
- Outil : `--all` (liste complète des défauts) pour la porte et `audit:geology`.

## 8. rc.3 — sécurité, publication, préparation de la classe (2026-10-26)
**Aucune fonction pédagogique ni changement d'interface** : `js/stage/` et `css/` identiques à rc.2 ; l'essai en classe reste comparable. Détail : [SECURITY_RELEASE_AUDIT.md](SECURITY_RELEASE_AUDIT.md) § 10.
- **Code enseignant** remplacé par une phrase secrète longue (empreinte seule dans `config.js` ; la phrase n'est écrite dans aucun fichier du dépôt) ; ancien code retiré des documents et **invalide**.
- **Injection (XSS)** corrigée : `esc()` sur toutes les données d'élèves, rapports et devoirs importés, stockage local (tableau de classe, défi, portfolio) ; **export CSV** protégé contre l'injection de formule. Vérifié dans Chromium (charges piégées affichées comme texte, nom « O'Brien » intact).
- **Droits** : `COPYRIGHT.txt`, `CREDITS.txt` (illustrations tierces : droits à leurs détenteurs, vérification en cours), `THIRD-PARTY-LICENSES.txt` publiés avec le site ; inventaire `docs/IMAGE_SOURCES.md` ; balises `robots noindex` + `robots.txt`.
- **Publication** : seul `site/` est publié (`tools/make-site.sh`), par le workflow **manuel** `.github/workflows/pages.yml` (tests, build reproductible, contrôle « aucun fichier source » avant publication).
- **Mesures** : 185 tests ; porte de projection depuis `site/` : 10 leçons, 0 défaut ; `js/`, `README.md`, `docs/` → 404 sur le site.

## 9. rc.4 — simulateur de profil sur smartphone (2026-10-26)
**Problème signalé** : à l'étape « Relevé », la carte fait ~360 × 250 px sur un téléphone ; les courbes peuvent être à 3–4 px les unes des autres et le pincement du navigateur est bloqué par la carte (nécessaire aux glisser-déposer de l'étape précédente). Lecture des altitudes et choix du bon point imprécis.
**Correctif, tactile uniquement** (souris et stylet inchangés) :
- **Zoom ×1 à ×4** : pincement à deux doigts, déplacement à un doigt, boutons + / − / 1:1 (≥ 44 px) ; la carte est **redessinée** au zoom (traits et cotes nets).
- **Loupe** ×3 sur appui maintenu, à côté du doigt, avec réticule ; lâcher = sélection précise.
- **Cibles ≥ 44 px** au doigt ; si deux courbes sont trop proches pour être distinguées, un message invite à zoomer ou à utiliser la loupe au lieu de choisir au hasard.
- **Bulle de retour** près du point touché (même message que sous la carte), menu des altitudes ajusté à l'écran ; bouton de l'assistant masqué et carte remontée au-dessus de la barre d'onglets pendant cette étape.
- **Pédagogie préservée** : aucun geste ne révèle d'altitude ; l'élève choisit toujours l'altitude lui-même ; les tolérances par mode restent les mêmes (seul le minimum tactile est relevé, compensé par le zoom).
**Vérification** : bureau — rendu des étapes 2 et 3 et résultats des clics **identiques au pixel** à `main` (graine fixe, modes débutant et intermédiaire) ; téléphone (iPhone 13, Pixel 7, événements tactiles réels via le protocole Chrome) — pincement ×3,7, déplacement, loupe et sélection précise, sélection fiable une fois zoomé, aucune erreur ; 191 tests (6 nouveaux sur les gestes, vérifiés par mutation) ; `js/stage/` et `css/stage.css` inchangés.

## 10. rc.5 — ergonomie de la vue enseignant (2026-10-26)
**Écran projeté identique au pixel** (42 écrans de 5 leçons comparés à rc.4, capture déterministe) : l'essai en classe reste comparable. Changements limités à la vue enseignant et au lancement depuis l'index. Détail et suite (items 4 et 7) : [TEACHER_ERGONOMICS.md](TEACHER_ERGONOMICS.md).
- **Touches dans la vue enseignant**, relayées à la projection (mêmes touches ; sauf Échap, F, H, P) — une télécommande de présentation fonctionne quelle que soit la fenêtre active.
- **« 🎙️ Projection + vue enseignant »** sur chaque leçon de l'index : un clic ouvre la projection et met la vue enseignant dans l'onglet courant, avec un guide « deux écrans : trois gestes ».
- **État de la liaison** : 🟢 synchronisé / 🟠 en attente / 🔴 projection non détectée (signal toutes les 2 s, perte après 5,5 s), bouton « Ouvrir la fenêtre de projection ».
- **Grandes commandes** : ◀ / ▶ de 72 px, position scène / étape, boutons ≥ 52 px, votes 76 × 64 px.
- **Vérifié dans Chromium** : lancement en un clic, → ← Début Fin relayés, votes A A B C 4 Maj+A → 4 votes, Échap/F/H/P non relayés, « . » écran vide relayé, projection fermée → 🔴 en 6 s, réouverture → 🟢 sur la scène en cours ; 197 tests (6 nouveaux, vérifiés par mutation).
