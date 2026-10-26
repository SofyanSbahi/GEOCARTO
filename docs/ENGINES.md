# Moteurs GéoCarto (v3) — référence

Décision et règles : [ADR 0001](adr/0001-engines-and-experiences.md). Ce document décrit **ce qui existe**, comment le tester et ce qui reste à faire.

```
js/engine/            moteurs de domaine + modèle pédagogique (aucun DOM, aucun Math.random, aucune horloge cachée)
  math.js             clamp lerp sstep rng(graine) shuffle(a,R) pick(a,R) azimuth dirName parseNum fr …
  terrain/            dem.js (makeDem, demFromForm, transformDem, sample, gradient, slopePct, autoEq, FORMS, TYPES)
                      analysis.js (analyze : écoulements, talwegs, sommets, cols, cuvettes)
  contour/            contours (marching squares + Chaikin), indexStep
  profile/            line.js    profileAlong, crossings, extremes, suggestLine(d,eq,R), pickLine(d,eq,R,opts) — trait court pour la projection
                      curve.js   curveFn (tracé de l'élève, interpolation monotone)
                      paper.js   makeSetup, paperGeometry, paperChoices, checkPaper, paperAdvice, PAD
                      survey.js  levelList, trendRuns, targetsFrom, firstMissing
                      evaluate.js evaluateProfile, detectErrors, diagnoseProfile  (constats CODÉS, pas de phrases)
  geology/            makeGeology, apparentDip, planeFrom3, sectionGrid, boundaries (calcul seulement)
  pedagogy/           exercises.js  Gens, pickExo(ch,seed), traps — figures DÉCLARATIVES (kind: map | geomap)
                      mastery.js    updateSkill, chapterCriteria      recommend.js recommendations(state,{now,week})
js/core/              ADAPTATEURS minces (anciens chemins d'import) + rendu + état d'interface
  terrain.js geol.js  réexportations ; suggestLine garde le défaut Math.random côté interface
  figures.js          peint les figures déclaratives (Learning) ; geodraw.js : rendu géologique (geoRaster, drawSection…)
  profile-text.js     met en mots les constats du moteur de profil (français ; autre langue = autre module)
  adapt.js store.js   état de l'élève + phrases ; la logique est dans engine/pedagogy
```

## Le moteur de profil en bref
```js
import {makeSetup,paperChoices,checkPaper,evaluateProfile,diagnoseProfile} from './engine/profile/index.js';
const S  = makeSetup({dem,A,B,eq,vm,z0});          // vm = m par cm en hauteur ; z0 = origine de l'axe
S.geometry();                                       // {P,lo,hi,zTop,Wmm,Hmm,hmm}   S.toMm / S.fromMm : papier ↔ (s,z)
const R  = evaluateProfile(S,{pts,smooth,marks,cross,hints});   // score, mae, rmse, bias, extrema, précision…
const DG = diagnoseProfile(S,R,{pts,smooth,marks});             // {findings:[{code:'bias'|'extrema'|'missing'|'maxerr'|'worstSection',…}], errorIds}
```
Ce sont ces fonctions que le futur module **Stage · Profil** et les scènes de construction en direct appelleront : la scène « montrer comment on construit le profil » utilise exactement le calcul que l'élève subit.

## Tests
| Commande | Rôle |
|---|---|
| `npm test` (ou `node --test "tests/*.test.js"`) | 197 tests (v3.1) : golden, contrat des moteurs, propriétés, Stage (votes, mise en page, fil, options figurées, palette, enseignant) |
| `node tools/make-golden.mjs` | **régénère la référence à partir du code historique** (`tests/legacy/`) ; à n'utiliser que pour figer un nouveau comportement voulu |
| `tools/e2e/compare_legacy.py` | test différentiel navigateur : application d'origine ↔ refactorée (3 parcours de profil, 64 exercices, 28 pages au pixel près) |
| `tools/stage/test_stage.py` | 28 vérifications du mode Stage |

* **golden** (`tests/golden/engines.json`, ~860 cas) : MNT (49 types×graines, formes, symétries), courbes, analyse, profils/crossings/extrema, courbe de l'élève, papier, évaluation + diagnostic (26 productions d'élève simulées, dont 5 quasi parfaites), géologie (9 structures × 3 graines, coupes, limites), 640 exercices, maîtrise, recommandations, critères.
* **contrat** (`tests/engine-contract.test.js`) : pour chaque fichier de `js/engine/` — pas de `document/window/localStorage/canvas/performance/Math.random/Date.now/new Date()` ; imports uniquement dans `engine/` et `data/` ; pas de dépendance montante (math ← terrain ← contour ← profile ← geology ← pedagogy).
* Vérifié par mutation : changer `.55*shape` en `.56*shape`, ou le sel du mélange, fait échouer le golden.

## Changements de comportement (voulus) et anomalies corrigées
1. **Correction : l'écran de correction du simulateur de profil plantait** (`ReferenceError: back is not defined` — un lien « Retour » référençait une variable inexistante). Présent dans la version livrée : l'élève ne voyait jamais son résultat. Lien supprimé ; le test de bout en bout parcourt maintenant tout le profil jusqu'à la correction.
2. **Exercices : l'ordre des choix est désormais reproductible.** Avant, les valeurs dépendaient de la graine (`#xxxx` affiché) mais l'ordre des choix venait de `Math.random`. Les valeurs sont **inchangées** (flux séparé, dérivé de la graine : `SHUFFLE_SALT`) ; seul l'ordre des choix devient stable pour une graine donnée. Conséquence : une même page peut être redessinée à l'identique, et Stage pourra projeter l'exercice exact que l'élève verra.
3. **Correction (Stage, v. précédente) : collision CSS.** La classe racine du mode Stage `.st` recouvrait les pastilles `a.st` des leçons (écran blanc ovale en plein écran sur `#/m1/def`). Racine renommée `.stg` ; test `tests/css-scope.test.js` (tout sélecteur de `stage.css` doit être borné au mode Stage) et garde-fou « pas de recouvrement plein écran » dans `tools/e2e`.
4. `evaluateProfile` renvoie `null` (au lieu de lever une exception) s'il y a moins de 2 points.
5. Rappel (mode Stage, fait précédemment) : `analyze()` départage les maxima égaux par l'ordre de balayage — peut ajouter des sommets/cuvettes sur des surfaces à altitudes égales (symétries analytiques) ; les codes de terrain procéduraux sont, eux, inchangés (golden).

6. **Ajouts (Stage v2, sans changer un golden) :**
   * `paperAdvice(S)` — critère **absolu** pour le choix des échelles du papier (hauteur réelle du profil en cm, `MIN_PROFILE_CM = 5`). Raison : le critère historique de `checkPaper` (« remplissage ≥ 35 % ») **ne dépend pas de l'exagération verticale** (`vm` s'annule dans le rapport) : il ne peut jamais répondre « trop aplati » à cause de `vm`. `checkPaper` et ses golden sont **inchangés** ; Stage utilise `paperAdvice`. Migrer l'espace élève vers `paperAdvice` = changement de comportement voulu → `ENGINE_VERSION`++ et golden régénérés (vague ultérieure).
   * `pickLine(d,eq,R,opts)` — trait de coupe « pédagogique » : court, 8–14 croisements, points non tassés (≥ 3 mailles), jamais 3 croisements consécutifs de même altitude, ≥ 2 extrema. Déterministe (aléa injecté). Testé dans `tests/engine.test.js`.

## Dette connue (ADR §5) — par ordre de priorité
| Où | Dette | Quand |
|---|---|---|
| `engine/pedagogy/exercises.js`, `legend.js` | énoncés / solutions en français (HTML) | avant l'arabe/l'anglais : clés + paramètres |
| `engine/terrain/dem.js` (`TYPES`, `FORMS[].nom`) | libellés français dans les données | idem |
| `data/chapters.js`, `data/errors.js` | textes français mêlés aux identifiants | idem (autorisés dans les moteurs : ce sont des données) |
| `pages/geo.js`, `widgets/geow.js` | notation des coupes géologiques et construction de coupe dans l'interface | **avant** les workflows géologiques de Stage |
| `pages/inverse.js`, `pages/terrain.js`, `pages/projet.js`, `pages/cas.js` | corrections / notations dans l'interface | par vagues, à la migration de chaque module |
| `core/draw.js` | rendu cartographique canvas (reste côté expérience) ; Stage a son rendu SVG propre | à unifier via une « spécification de carte » |
| `store.js` | état et progression en `localStorage` ; sera remplacé/complété par le Class Hub | vague Class Hub |

## Pour ajouter un moteur ou un exercice
1. Fonction pure dans `js/engine/…`, aléa et temps en paramètres.
2. Ajouter des cas à `tests/golden-cases.js` **uniquement après** avoir un comportement de référence (sinon : test de propriété dans `tests/engine.test.js`).
3. `npm test` ; si un golden change volontairement : `ENGINE_VERSION`++, régénérer, l'écrire ci-dessus.
