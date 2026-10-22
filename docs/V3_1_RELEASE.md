# GéoCarto v3.1 — candidat à la livraison (RC1) et liste de contrôle

> Version 1.0 · 2026-10-22 · `3.1.0-rc.1`. Contenu pédagogique rédigé par la machine : **brouillon à relire par un géologue** (porte de livraison G3 ci-dessous).

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
| G2 Projection | `npm run audit:geology` : 0 défaut (4 formats × 4 échelles) | 1 744 écrans, 0 défaut |
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
6. [ ] Passer `package.json` de `3.1.0-rc.1` à `3.1.0` ; étiqueter `v3.1.0` ; notes de version = résumé de la revue.
7. [ ] Activer GitHub Pages sur `main` (racine) ; ouvrir l'URL publique en navigation privée ; vérifier `#/stage/prereq`, `#/stage/geocarte`, `#/stage/coupe`, `#/stage/fil`.
8. [ ] Sauvegarde : archive du dépôt (ou bundle) + export Zenodo si le contenu est ouvert (DOI).
9. [ ] Ouvrir les tickets « v3.2 » issus de la revue (relecture, essai instrumenté, D « Histoire d'une carte », dette F7/F9, audit en CI).

## 5. Retour arrière
Chaque PR est indépendante en lecture et réversible par `git revert -m 1` du merge. Le service worker supprime l'ancien cache à l'activation ; en cas de problème en salle, ouvrir l'application en navigation privée ou vider les données du site.

## 6. Limites connues de la RC1 (reprise de la revue)
Aucun test avec des étudiants ; palette validée par simulation ; contenu non relu ; défauts d'anciennes leçons (*coord, échelle, orient, mission* à 4:3 / amphi, hors géologie) ; flèche courte au vote 2 du préalable ; pas d'arabe ni d'anglais.
