# GéoCarto 2 – cartographie topographique & profils

Plateforme pédagogique statique conçue pour GitHub Pages. Elle se lance en **double-cliquant sur `index.html`** (file://), via localhost ou sur Pages : l'application est livrée en un bundle classique `dist/app.js`.
Sources lisibles dans `js/` (ES modules) ; après modification, régénérer `dist/app.js` (voir « Développement et reproductibilité » ci-dessous). Three.js r160 est inclus (licence MIT, `vendor/`).

## Publication sur GitHub Pages
1. Créer un dépôt et déposer **tout le contenu de ce dossier à la racine**.
2. Settings → Pages → *Deploy from a branch* → `main` / `(root)`.
3. Le site est en ligne sur `https://<utilisateur>.github.io/<depot>/` (HTTPS requis pour le mode hors-ligne).

Test local : ouvrir `index.html`, ou `python3 -m http.server 8000`. **Déposer aussi le dossier `dist/`** (sinon l'application affiche un message d'erreur explicite).

## Mode Stage v2 — enseigner par la projection (`#/stage`)
Cinq leçons en scènes lisibles depuis le dernier rang, sans zoom : **Échelle, Orientation, Coordonnées, Pente, Profil topographique** (construction point par point). Une idée par scène, révélation progressive, **votes avec malentendus nommés**, exercices du moteur avec minuteur, vue enseignant, test du dernier rang (touche `K`). Les thèmes 4, 5, 6 et 8 restent servis par le deck v1 ; la géologie est livrée avec Stage v4 (voir plus bas). Conception, règles de lisibilité, feuille de route : [docs/STAGE_PEDAGOGY.md](docs/STAGE_PEDAGOGY.md). Tests : `node --test tests/lessons.test.js` ; audit sur rendu réel : `python3 tools/stage/audit_lessons.py`.

## Mode Stage v1 (projection, preuve de concept)
Mode plein écran pour projeter en salle/amphithéâtre, depuis le labo ou le chapitre « Courbes de niveau » (`#/stage/courbes`) : texte et étiquettes agrandis, figure au centre, projecteur, zoom, crayon, télécommande, réglage de la salle, vue présentateur (`V`, 2ᵉ fenêtre ; nécessite http/https). Voir `docs/STAGE_MODE.md` (mesures avant/après, plan de migration). Tests : `tools/stage/`. Le bundle se reconstruit avec `sh build.sh` (ou `esbuild` local).

## Nouveautés Phase 2
- 4 modules (16 chapitres) au parcours unique : **Théorie → Exemple → Activité → Exercices → Quiz → Validation**. Exercices et quiz sont **propres à chaque chapitre** (aucun partage).
- Atelier géologique (cartes + coupes), 6 cas marocains modélisés, projet final, portfolio, bibliothèque d'erreurs, défi hebdomadaire, recommandations adaptatives, espace enseignant, réglages d'accessibilité.
- **Espace enseignant** : `#/prof`. Le code n'est **jamais écrit dans les documents** : seule son empreinte est dans `config.js`. Pour le changer : Espace enseignant → section 7 → coller la nouvelle empreinte dans `config.js` et republier. Protection *dissuasive* seulement (site statique).
- `config.js` : empreinte du code enseignant et nom de classe, modifiable sans reconstruire.

## Structure
- `index.html`, `css/app.css` : coque et design system (mobile-first, mode sombre).
- `js/core/` : `terrain.js` (génération de MNT, courbes, hydrographie, profils), `draw.js` (carte, estompage, bloc 2D), `scene3d.js` (Three.js), `store.js` (XP, badges, compétences), `ui.js`.
- `js/core/geol.js`, `geodraw.js`, `adapt.js`, `sha256.js` : moteur géologique, carte géologique, recommandations, empreinte du code.
- `js/data/` : `chapters.js` (registre), `quizbank.js` (quiz par chapitre), `errors.js`, `cases.js`, `kb.js`.
- `js/pages/` : `profile.js` (simulateur de profil), `exos.js` (générateur infini), `labs.js`, `terrain.js` (terrain virtuel), `inverse.js`, `course.js`, `home.js`, `me.js`, `assistant.js`.
- `js/content/lessons.js` : **textes des leçons** (à modifier ici) ; `js/data/quizbank.js` : questions ; `js/data/kb.js` : base de l'assistant.
- `js/widgets/` : widgets interactifs insérés dans les leçons (`data-w="..."`).
- `img/` : figures conservées (WebP optimisé) ; `docs/AUDIT_ET_RAPPORT.md` : audit et rapport.

## Données élèves
Tout est stocké dans le navigateur (`localStorage`) : aucune donnée n'est envoyée. Export / import JSON depuis « Mon tableau de bord ».

## Architecture v3 : moteurs, modèle pédagogique, expériences
`js/engine/` contient les cinq moteurs (terrain, courbes, profil, géologie, pédagogie) : fonctions pures, testées sous Node, sans navigateur. Learning Mode (`pages/`, `widgets/`) et Stage Mode (`stage/`) sont deux **expériences** qui les appellent. Voir [docs/ENGINES.md](docs/ENGINES.md) et l'[ADR 0001](docs/adr/0001-engines-and-experiences.md).
`npm test` lance la suite de tests (golden, contrat des moteurs, Stage ; 203 tests à la livraison v3.1 ; 122 à la restauration) ; `python3 tools/e2e/compare_legacy.py` compare l'application au code d'origine.


## Stage v3 — système de cours
Prologue « la mission » (un terrain pour toute la séance), budget d'attention testé (≤ 3 points focaux, ≤ 12 mots par figure), outils `rest` / `fade` / `spotlight`. Voir `docs/STAGE_LECTURE.md`. Mesure : `node tools/stage/focus_report.mjs`.

## Stage v4 — géologie et outils d'enseignement
Leçons **Cartes géologiques** (`#/stage/geocarte`) et **Coupes géologiques** (`#/stage/coupe`), instruction par les pairs (vote → discussion → revote : touche **R**), **bibliothèque des malentendus** (`#/stage/lib`), **bilan de séance** (`#/stage/bilan`, export JSON/CSV, données locales). Classement des prochaines directions : `docs/STAGE_LECTURE.md` §8.

## Développement et reproductibilité
Prérequis : Node.js ≥ 22. Le bundle `dist/app.js` est **reproductible** : esbuild est épinglé (0.28.2, `package-lock.json`).
```sh
npm ci                # installe l'outillage exact
npm test              # 203 tests (golden, contrat des moteurs, Stage, palette, enseignant)
npm run audit:geology # audit de projection sur rendu réel (Chromium + Playwright) : géologie, 4 formats × 4 échelles
npm run build         # régénère dist/app.js depuis js/main.js
npm run check:dist    # reconstruit et échoue si dist/app.js diffère du fichier versionné
```
Règle : toute modification de `js/` ou de `vendor/` doit être livrée **avec** le `dist/app.js` régénéré (GitHub Pages sert `dist/` tel quel). L'intégration continue (`.github/workflows/ci.yml`) échoue si le bundle versionné ne correspond pas aux sources.
Les références de non-régression sont dans `tests/golden/` ; `tests/legacy/` conserve le code d'origine pour les régénérer (`npm run golden`, uniquement pour figer un comportement voulu). Les scripts navigateur de `tools/` (Python + Playwright) s'exécutent contre un serveur local (`python3 -m http.server 8765`).

## Version 3.1 (candidat à la livraison)
Revue : [docs/V3_1_REVIEW.md](docs/V3_1_REVIEW.md) · liste de contrôle et ordre de fusion : [docs/V3_1_RELEASE.md](docs/V3_1_RELEASE.md) · essai en classe : [docs/V3_1_CLASSROOM_PROTOCOL.md](docs/V3_1_CLASSROOM_PROTOCOL.md).

## Publication (lien pour étudiants et collègues)
On ne publie **que** le dossier `site/` (jamais la racine du dépôt) : `npm ci && sh build.sh && sh tools/make-site.sh`, ou le workflow manuel *Publier site/ sur GitHub Pages* (Settings → Pages → Source : GitHub Actions). Sécurité, limites et droits : [docs/SECURITY_RELEASE_AUDIT.md](docs/SECURITY_RELEASE_AUDIT.md), [docs/IMAGE_SOURCES.md](docs/IMAGE_SOURCES.md).
