# Audit du projet GéoCarto et rapport des améliorations

Sources analysées : site existant (HTML/CSS/JS, 36 figures), `Polycopie_TP_Carto_BCG_24_25.pptx` (72 images), `Exercices_Tp_Cartographie.pptx` (15), `Support_Tp_Cartographie_BCG_1.ppt` (89 diapositives, converti).

## 1. Forces (conservées)
- Contenu fidèle au manuel BCG-1 ; ton clair ; encadrés Définition / À retenir efficaces.
- Exercices tirés du manuel avec corrections détaillées (équidistance, interpolation, falaises, pente).
- Site statique sans dépendance, déjà compatible GitHub Pages ; mode sombre ; recherche plein texte.
- Premier labo de courbes et de profil dynamique (idée pertinente, reprise et fortement étendue).

## 2. Faiblesses relevées
**Scientifiques / pédagogiques**
- Quiz final : l'option « le sommet des V pointant vers le bas » est ambiguë pour les talwegs (reformulée).
- Règle des V : la crête n'était décrite que par rapport aux cols ; la règle générale (V vers l'aval) et le **bassin versant** (demandé) étaient absents → ajoutés.
- Précision illusoire : les exercices d'interpolation exigeaient 1244,375 m (3 décimales) alors qu'une mesure graphique vaut ±1 m → tolérances réalistes.
- Unités : le manuel donne la déclinaison en **grades** (1 gr = 0,9°) sans conversion ; les unités d'écartement (cm carte / m terrain) étaient mélangées → exercices et leçons dédiés.
- Pente : rien sur la conversion % ↔ degrés (100 % = 45°, pas 90°) ; ajoutée avec simulateur.
- Formes de pente (convexe/concave) : énoncés conservés mais sans lien avec le profil → maintenant visualisés avec le profil du versant.
- Manuel : la polarisation des cotes est formulée de deux façons (« bas des chiffres vers le bas de la pente » / « haut vers le haut ») ; équivalentes, harmonisées.
**Ergonomie / technique**
- Labos sur canvas 600×400 fixe (flou sur écrans Retina), pas d'alternative clavier, une seule tentative d'exercice sans indice ni XP.
- Bug : « Recommencer » un quiz rechargeait la page en haut ; progression mélangeant projet/final.
- Figures extraites de PowerPoint : captures d'écran avec interface (PowerPoint, Google Earth), faible résolution (beaucoup < 500 px), et **associations nom de fichier ↔ légende à revérifier**.
- Aucun mode hors-ligne, aucune accessibilité tactile avancée (stylet, réticule décalé).

## 3. Ce qui a été fait
| Demande | Réalisation |
|---|---|
| Recentrage | Seuls les modules 1 et 2 subsistent ; cartes/coupes géologiques et projet final supprimés. |
| Simulateur de profil (priorité) | 6 étapes : terrain généré (7 types, code partageable) → trait A–B (tactile, suggestion) → relevé des intersections sur bande → choix échelle des hauteurs/origine → tracé sur papier millimétré (clics, gomme, annuler/rétablir, zoom, lissage main levée, réticule décalé au doigt) → correction animée (erreur moyenne, max, précision, extrema, score, diagnostic) + habillage. 3 modes d'aide. |
| Générateur infini | Terrains procéduraux déterministes (graine) ; 25+ modèles d'exercices numériques/visuels avec solutions. |
| 3D | Générateur de reliefs (Three.js) avec paramètres, eau, talwegs, crêtes, rideau A–B ; Terrain virtuel (marche + joystick + minicarte + 5 missions). |
| Construction inverse | Relief→Courbes, Courbes→Relief 3D, Courbes→Profil, Profil→Trait. |
| Labos | Courbes interactives (forme, altitude, pente, équidistance, sonde z/pente/écartement), simulateur de pente animé, atlas 11 formes (carte + bloc 3D), exagération verticale. |
| Gamification | XP, 6 niveaux, 11 badges (dont les 5 demandés), tableau de bord (compétences, temps, historique, export). |
| Assistant | Assistant **local** (base de ~20 fiches, schémas SVG, réponses contextuelles « ici » / « pourquoi le profil remonte »). |
| Performance | ≈ 1,9 Mo en tout (Three.js 0,67 Mo + ≈ 0,8 Mo d’images WebP, 1,1 Mo une fois zippé), service worker, pas de build. |

## 4. Limites assumées (à lire)
- **Assistant IA** : ce n'est pas un modèle de langage (GitHub Pages n'a pas de serveur). Il ne comprend que les sujets de sa base. Un vrai LLM nécessiterait un proxy d'API.
- **Lottie et GIF** : non utilisés ; animations en SVG/CSS/Canvas (plus légères, éditables). Aucune ressource Lottie n'existait dans le projet.
- **Figures** : les SVG remplacent les schémas clés (V, Éq/Éc, pente, plan de coupe, rose, globe). Les photos et cartes du manuel (15 figures) restent des images WebP de qualité d'origine ; les autres figures du polycopié n'ont pas été reprises.
- **Hydrographie** générée : les rivières sont déduites du MNT et peuvent être fragmentées sur les reliefs plats.
- **Pondération du score de profil** (55/20/15/10) choisie par moi : à valider/ajuster par l'enseignant.
- **Tests** : parcours automatisé sous Chromium (toutes les routes sans erreur JS, simulateur de bout en bout, captures mobile/desktop/3D). **Non testé** sur vrais iPhone/Android/Safari ni avec un stylet réel ; à faire avant diffusion.
- Les exercices numérotés du manuel (tableau d'échelles, orientations de segments sur figure, falaises A/B) sont repris sous forme de modèles générés, pas de copies à l'identique.
