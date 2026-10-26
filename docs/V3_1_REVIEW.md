# GéoCarto v3.1 « Raisonner, pas réciter » — revue finale

> Version 1.0 · 2026-10-22 · branche `v3.1/wp2-wp4` (non poussée : l'app GitHub n'est pas installée sur le dépôt).
> **Statut du contenu rédigé par la machine** : le fil du raisonnement, les notes enseignant, la leçon préalable et la palette sont des **brouillons automatiques à relire par un géologue / un enseignant de topographie**. Aucune donnée d'étudiants n'existe : tout ce qui suit sur l'effet pédagogique est une **évaluation de conception**, pas une mesure.

## 1. Fonctions livrées

| Lot | Livré | Vérification |
|---|---|---|
| WP0 | Tous les votes mélangés (permutation déterministe par scène et graine ; décomptes canoniques ; `fixed` seulement si nécessaire, aucun cas) | `vote-order.test.js` |
| WP1 | Robustesse amphi : unité de chrome bornée, titre ≤ 12 % de la hauteur, légende ≤ 24 %, figure ≥ 46 % ; chronomètre refait ; bandeau enseignant déplacé dans la vue présentateur | `layout.test.js` + porte de projection |
| WP2 | **Fil du géologue** (Observer · Situer · Mesurer · Dater · Supposer · Vérifier) affiché sur chaque scène de géologie ; fiche imprimable `#/stage/fil` | `thread.test.js` |
| WP3 | **Options figurées** : les mauvaises réponses sont les figures qu'un étudiant au malentendu produirait (coupes, flèches lettrées, structures) ; vote « galerie » | `distractors.test.js` (moteur pur) |
| WP4 | **Leçon préalable « Lire le relief »** (3 votes, ≈ 7 min), séparée de la leçon principale | `prereq.test.js` |
| WP5 | Palette de projection (ΔE ≥ 10 en 4 conditions), liserés blancs, opacité des estompées 0,22 → 0,4, γ/δ → Gr/Do | `palette.test.js` |
| WP6 | Vue présentateur : malentendu dominant et sa correction, bande de Mazur, mention « brouillon » | `teacher.test.js` |
| WP7 | `npm run audit:geology`, cache `sw.js` renommé, `dist/app.js` reproductible (`check:dist`), docs | — |

**Mesures de clôture** : 179 tests verts ; porte de projection sur rendu réel, **1 744 écrans, 176 votes simulés, 4 formats × 4 échelles de salle (×0,8 à ×2,5) : 0 défaut** (texte hors carte, recouvrements, rognage, légende tronquée, figure < 50 % / 45 %, textes sous les tailles minimales, intégrité lettre ↔ vote). Chaque lot a été contrôlé par mutations volontaires (le test échoue quand on casse la règle).

**Mesures RC2 (2026-10-26)** : 180 tests verts ; porte de projection étendue à **toutes les leçons Stage** (10 leçons, topographie comprise) : **4 608 écrans, 368 votes simulés, 4 formats × 4 échelles de salle : 0 défaut** (avant la finition : 81 défauts, tous dans les leçons de topographie).

## 2. Améliorations pédagogiques
- **On ne peut plus réussir en répondant « A »** : avant, la bonne réponse était A dans 16 votes de géologie sur 20.
- **Le vote devient un diagnostic** : chaque mauvaise réponse est un malentendu nommé, souvent montré comme figure ; l'enseignant voit le malentendu dominant, pas seulement un pourcentage.
- **Un vocabulaire de raisonnement** (le fil) relie 27 scènes à un geste de géologue ; il est visible, nommé, imprimable. Hypothèse de conception : il transfère mieux qu'une liste de règles. Non mesuré.
- **Prérequis explicite** : trois réflexes de topographie vérifiés en 7 min avant la géologie, sans allonger la leçon principale.
- **La couleur ne porte plus seule** l'information : lettres de formation, liserés, palette testée.

## 3. Améliorations pour la projection
Hiérarchie typographique bornée (rien sous le seuil du dernier rang), figure toujours dominante, bandeau enseignant retiré de l'écran projeté, flèches et traits clés cernés de blanc, formations estompées encore visibles sous un projecteur délavé, légendes et lettres de vote gros, formats 16:9, 16:10, 4:3 et 5:4. Outil d'audit reproductible.

## 4. Limites restantes (honnêtes)
1. **Aucun test avec des étudiants ni en salle réelle.** Les ΔE, le « délavage » et le daltonisme sont simulés ; le seuil 10 est une règle empirique.
2. **Contenu non relu par un géologue** : fil, notes, leçon préalable, malentendus, solutions. Les faits des six modèles marocains et les droits des figures restent non vérifiés (hérité).
3. **Résidus de projection : corrigés en RC2** (2026-10-26) — bulles recouvrant du texte et légende écrasée dans *coord, échelle, orient, mission, relief, pente, profil* (4:3 et amphi). Restent hors périmètre : vide dans *geocarte/14* et *coupe/7* (F9) et largeur adaptative des cartes de texte (F7).
4. **Vote 2 du préalable : corrigé en RC2** — colline adoucie, flèche P → Q horizontale et deux fois plus longue, altitudes écartées de la flèche.
5. **Hachures non faites** (décision : lettres + palette) ; à reprendre si un étudiant daltonien signale un problème.
6. **Pas d'évaluation d'apprentissage** : aucun pré/post-test, aucune analyse d'items ; l'éthique est un préalable pour en publier.
7. **Livraison** : branche non poussée (403 GitHub) ; pas de LICENSE ; code enseignant en clair dans le code client (à nettoyer, M6) ; l'audit de projection n'est pas dans la CI.

## 5. Recommandations pour une v3.2
1. **Relecture géologique** (1 relecteur nommé, 1 jour) avant tout usage noté : fil, notes, préalable, 24 malentendus, faits des cas marocains.
2. **Premier essai en classe, instrumenté localement** : un groupe, journal `gc_stage_log` exporté, 3 observations structurées (dernier rang : lisibilité ; taux de vote avant/après discussion ; malentendus dominants). Corrige la palette et les seuils de Mazur sur données réelles.
3. **D « Histoire d'une carte »** (jalon annoncé) : une carte → coupe → bloc 3D, avec le fil comme squelette.
4. **Étude d'évaluation** (volet recherche, éthique requise) : retour sur malentendus ciblés vs. retour générique ; effet du préalable ; temps enseignant. Bon candidat d'article de pédagogie des géosciences (périmètre et revue à vérifier).
5. **Paysages synthétiques à autocorrélation réglable** pour enseigner pourquoi un découpage aléatoire gonfle l'AUC : un même moteur sert l'enseignement et un banc d'essai de validation spatiale (piste de recherche, nouveauté non vérifiée).
6. **Dette technique** : F7/F9, bulles des anciens thèmes, audit en CI (Playwright en devDependency), arabe et anglais, extraction du moteur en « domain pack » réutilisable.
7. **Hygiène** : installer l'app GitHub et pousser ; choisir une licence ; retirer le code enseignant du client.

## 6. Évaluation finale de la valeur pédagogique (étudiants de première année de géologie)

**Verdict.** GéoCarto v3.1 est une **base solide et prête pour un premier essai encadré en classe**, pas encore un outil dont l'efficacité est établie. Sa valeur repose sur trois choix de conception qui vont dans le bon sens selon la littérature d'enseignement active (votes de type *peer instruction* avec seuils de Mazur, retour sur malentendus, exemples calculés), mais **ces effets n'ont pas été mesurés ici**.

**Forces**
- Cible bien le **raisonnement** plutôt que la récitation : chaque vote exige d'inférer (altitude, pendage, âge relatif), et le fil rend le geste explicite.
- **Diagnostic précis** : malentendus nommés + options figurées ; l'enseignant sait quoi corriger, pas seulement qui a échoué.
- **Utilisable par un auditoire entier** : lisible du dernier rang, vérifié sur 1 744 écrans, fonctionne hors-ligne, sans compte, données d'élèves locales.
- **Progression raisonnable** : préalable → carte → coupe, une idée par scène.

**Faiblesses**
- **Majoritairement passif entre les votes** (scènes de démonstration) ; l'action de l'étudiant au crayon (tracer une coupe) reste dans les modules autonomes, pas dans Stage.
- **Peu de transfert vers le terrain** : cartes synthétiques et six modèles marocains non vérifiés ; pas encore de vraie carte géologique marocaine ouverte.
- **Dépendance à l'enseignant** : l'efficacité des votes dépend de la discussion par deux, hors de l'outil.
- **Pas de preuve d'efficacité** et contenu non relu.

**Note de confiance.** Qualité technique et lisibilité : élevée (mesurée). Cohérence pédagogique de conception : bonne (jugement d'expert-machine, à confirmer par un géologue). Effet sur l'apprentissage : **inconnu** tant qu'un essai avec comparaison n'a pas eu lieu.

**Triple rendement (recherche · logiciel · enseignement).** Enseignement : leçons et fiches utilisables. Logiciel : moteur de distracteurs pur et testé, porte de projection, palette vérifiée, tous réutilisables dans d'autres domaines. Recherche : piste d'évaluation des retours ciblés et banc d'essai synthétique pour la validation spatiale.
