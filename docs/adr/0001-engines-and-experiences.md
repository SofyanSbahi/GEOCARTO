# ADR 0001 — Moteurs, modèle pédagogique, expériences

Statut : **accepté** (décision du porteur du projet, 21 oct. 2026). Remplace l'idée « Stage = option d'affichage ».

## Contexte
GéoCarto 2 a été conçu pour l'apprentissage individuel. Le mode Stage (projection, démonstration guidée, raisonnement collectif) en est un usage **différent**, pas une variante d'affichage. Les deux doivent partager les mêmes jeux de données, générateurs, logiques d'évaluation et modèles pédagogiques. Or, dans le code actuel, le moteur de profil (géométrie du papier, notation, diagnostic) vit dans des fermetures de `pages/profile.js`, les générateurs d'exercices renvoient des fonctions de dessin canvas, et `store.js` / `adapt.js` lisent un état global et `Date.now`. Un second mode bâti là-dessus dupliquerait ou casserait la logique.

## Décision
Trois couches, avec une règle de dépendance à sens unique.

```
 EXPÉRIENCES   Learning Mode (pages/, widgets/)      Stage Mode (stage/)
      │                  │                                  │
      ▼                  ▼                                  ▼
 MODÈLE PÉDAGOGIQUE   engine/pedagogy/   concepts, exercices (générateurs), notation,
                                         diagnostics, maîtrise, recommandations, critères
      │
      ▼
 MOTEURS DE DOMAINE   engine/terrain · engine/contour · engine/profile · engine/geology
```

| Moteur | Rôle | Contenu |
|---|---|---|
| Terrain | Générer et interroger un MNT | formes analytiques, relief procédural, `sample`, `gradient`, pente, analyse (sommets, cols, cuvettes, écoulements) |
| Contour | Courbes de niveau | isolignes, lissage, équidistance, courbes maîtresses |
| Profile | Profil topographique | profil exact, intersections, extrema, trait suggéré, courbe de l'élève, géométrie du papier, évaluation, diagnostic |
| Geology | Géologie | structures, plan à 3 points, pendage apparent, grille de coupe, limites |
| Pedagogy | Pédagogie | générateurs d'exercices par chapitre, vérification et pièges, maîtrise, critères de validation, recommandations |

## Règles (vérifiées automatiquement par `tests/engine-contract.test.js`)
1. **Les moteurs n'importent que des moteurs, `engine/math.js` et `data/`.** Jamais `core/ui`, `pages/`, `widgets/`, `stage/`.
2. **Aucun accès au navigateur** : ni `document`, `window`, `localStorage`, `canvas`, `performance`, `requestAnimationFrame`.
3. **Déterminisme** : pas de `Math.random()` ni de `Date.now()` dans un moteur. L'aléa vient d'un générateur à graine passé en paramètre ; le temps, d'un paramètre `now`.
4. **Pas de rendu** : un moteur renvoie des données (ou des *spécifications* de figure déclaratives), jamais du dessin.
5. **Pas de texte d'interface** dans les moteurs de domaine : ils renvoient des codes et des mesures ; la mise en forme est le travail des expériences (condition de l'arabe / de l'anglais). *Dette connue* : les générateurs d'exercices et les diagnostics portent encore des phrases françaises ; elles sont isolées dans `engine/pedagogy/` et listées en annexe.
6. **Les expériences partagent le modèle, pas la narration.** Concepts, tâches, notation, erreurs-types : communs. Textes de leçon (Learning) et scripts de scène (Stage) : écrits séparément.

## Garantie de stabilité des codes de terrain
Un code de terrain (`type-graine-échelle`) montré par l'enseignant doit redonner **exactement** le même relief sur l'appareil de l'élève, aujourd'hui comme dans un an. Les tests *golden* (`tests/golden/`) figent des empreintes de MNT, de courbes, d'analyses, de profils et d'exercices. Toute modification qui les change exige : (a) incrémenter `ENGINE_VERSION`, (b) régénérer les golden, (c) le dire dans le journal des changements.

## Migration
Le code existant est conservé comme **oracle** dans `tests/legacy/js/`. Chaque extraction est validée par des tests différentiels (ancien code ↔ nouveau code, mêmes entrées, mêmes sorties) puis par des golden. Les anciens chemins d'import (`core/terrain.js`, `core/geol.js`, …) restent des **réexportations** le temps de la migration.

## Conséquences
- (+) Stage et Learning réutilisent le même profil, les mêmes exercices, la même notation.
- (+) Moteurs testables sous Node, sans navigateur ; refactorisations sûres.
- (+) Terrain, notation et exercices peuvent évoluer sans toucher aux interfaces.
- (−) Coût initial de découpage ; certaines fonctions de dessin doivent devenir des spécifications de figure.
- (−) Deux couches de textes (moteur → code, expérience → phrase) à terme ; la transition passe par la dette listée ci-dessus.
