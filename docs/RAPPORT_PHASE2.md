# Phase 2 – Optimisation pédagogique : rapport

## 1. Ce qui est livré (et testé)
| Demande | Réalisation | Vérification |
|---|---|---|
| 1. Cartes géologiques, coupes, projet final | Modules 3 et 4 (5 chapitres), atelier géologique (9 structures : tabulaire, monoclinal, anticlinal, synclinal, faille normale/inverse, discordance, granite, filon), projet final en 4 étapes | Moteur validé numériquement : le problème des 3 points retrouve pendage/direction du modèle (écart ≤ 2°) ; pendage apparent exact ; 9 structures × coupe générées |
| 2–3. Audit + cohérence | Parcours Théorie→Exemple→Activité→Exercices→Quiz→Validation sur 16 chapitres ; critères de validation explicites (4 exercices réussis, quiz ≥ 80 %, activité manipulée) | 16 chapitres × 150 exercices tirés sans erreur ; **0 question étrangère** affichée dans un quiz de chapitre ; 0 doublon de question ; validation de bout en bout automatisée |
| 4–5. Modes enseignant / élève | Élève = mode par défaut ; espace enseignant `#/prof` : import des rapports, tableau de classe, compétences, erreurs fréquentes, export CSV, devoirs (code), aperçu avec corrigés | Mauvais code refusé, bon code accepté, import d'un rapport testé |
| 6. Portfolio | Productions (miniatures), réflexions, compétences, points à travailler, export rapport / impression | Page testée |
| 7. Cas marocains | 6 modèles (Toubkal, Todgha, Tizi n'Tichka, Siroua, phosphates, Moyen Atlas) | Voir limites |
| 8. Correction assistée des profils | Analyse par tronçon, biais, extrema, détection de 8 erreurs-types reliées à la bibliothèque | — |
| 9. Bibliothèque d'erreurs | 24 fiches (symptôme, cause, remède, entraînement), compteurs personnels, détection automatique dans profils et exercices | — |
| 10. Défi hebdomadaire | Même défi pour tous (graine = semaine ISO) : 1 profil + 5 exercices, bonus XP ; devoir enseignant importable | Page testée |
| 11. Recommandations adaptatives | Règles : prochain chapitre, point faible (< 60 %), erreur récurrente, révision espacée (> 7 j), profils | — |
| 12. Accessibilité | Réglages : taille du texte, contraste élevé, grandes zones tactiles, animations réduites ; saisie numérique et clavier pour tracer ; lettres sur la carte géologique (lisible sans couleur) ; menu mobile ; zones de réponse annoncées (`aria-live`) | Pas de débordement horizontal à 390 px |
| 14. Innovation | Impression d'un TP papier (carte + millimétré à l'échelle réelle), exemples résolus générés, exercices diagnostics d'erreurs | — |

## 2. Audit des leçons existantes (corrections faites)
1. **Mélange entre chapitres** : les quiz tiraient dans toute la banque du module (ex. quiz d'Échelle contenant des questions de Pente) → banques par chapitre.
2. **Activités noyées dans la théorie** → déplacées dans l'étape « Activité ».
3. Chapitre « Définition » sans exercice ni quiz → créés.
4. Légendes d'images affirmant des identifications invérifiables (« vallée glaciaire en U », « Tizi N'Tnifift ») → neutralisées.
5. Lambert Maroc : « zones Nord et Sud » → plusieurs zones (Nord, Sud, Sahara).
6. Qualificatifs de pente présentés comme absolus → signalés « repères indicatifs ».
7. « Les altitudes sont des multiples de l'équidistance » → « en général ».
8. Animation « plans horizontaux » : niveaux du plan (pas de 10 m) incohérents avec les courbes (20 m) → corrigé.
9. Règle des V : formulation simplifiée fausse dans certains cas → énoncée avec son exception (couche plongeant dans le sens de l'écoulement avec un pendage plus faible que le talweg).
10. Largeur d'affleurement w = e / sin δ : conditions explicitées (terrain plat, coupe ⟂ direction).

## 3. Limites et points à vérifier — lire attentivement
- **Mode enseignant : pas une vraie sécurité.** Site statique, aucun serveur : le code est contrôlé dans le navigateur et contournable (l'empreinte est publique dans `config.js`). Il cache les outils aux élèves ; il ne protège rien de confidentiel. Les données élèves restent sur leur appareil ; l'enseignant ne voit que les rapports qu'ils lui remettent. Pour une vraie authentification, il faut un hébergement avec contrôle d'accès. **Code initial `Atlas-K7Q2-Relief` à changer avant diffusion.**
- **« IA » de correction** : algorithmique (comparaison au profil exact, règles), pas un modèle de langage ; ne produit que des diagnostics prévus.
- **Cas marocains = modèles, pas des relevés.** Les paysages sont générés ; les faits cités sont généraux (Toubkal ≈ 4 167 m ; gorges du Todgha dans des calcaires jurassiques ; phosphates fin Crétacé–Éocène ; Siroua volcan néogène…) et **je n'ai pas pu les vérifier contre une source ce soir** : à relire par un géologue. Les colonnes stratigraphiques sont **fictives** (couleurs inspirées de la convention par âge, simplifiées).
- **Simplifications géologiques** : épaisseurs constantes (plis « parallèles » approchés), failles à glissement rigide le long du plan, pas de décrochements, plis déversés, ni auréoles de métamorphisme.
- **Notes automatiques** (projet, synthèse écrite par mots-clés, coupe par distance moyenne) : indicatives ; la synthèse n'est pas évaluée sur le fond.
- **Défi hebdomadaire** : pas de classement (pas de serveur). **Adaptatif** : à base de règles simples, non entraîné.
- **Non testé** : Safari/iOS, Firefox, vrais téléphones/tablettes, stylet. Tests réalisés sous Chromium (44 routes, parcours automatisés).
- Les exercices **hors chapitre** (défi hebdomadaire, projet) sont mixtes volontairement ; les chapitres, eux, sont étanches.
