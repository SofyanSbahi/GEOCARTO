# GéoCarto v3 · Mode Stage — premier tranche verticale (preuve de concept)

Objectif : prouver, sur le labo « Courbes de niveau », qu'un mode **projection** conçu à part est nettement plus lisible depuis le dernier rang d'un amphithéâtre que la même page « adaptée ».

Accès : `#/stage` (accueil) · `#/stage/courbes` (projection) · `#/stage/courbes/presenter` (vue enseignant). Boutons « Mode Stage » dans le labo, dans le chapitre *Courbes de niveau* et dans le hub Labos.

## 1. Ce qui est livré

| Brique | Réalisation |
|---|---|
| Plein écran, figure d'abord | Coque masquée, en-tête fin, **carte = 60 % de l'écran** (8,6 % avant), panneau latéral réduit à 3 cartes : paramètre, lecture, légende. |
| Typographie de projection | Unité **u = 1 % de la hauteur d'écran × facteur de salle**. Titre 4,4 u · idée à retenir 2,7 u · étiquettes de carte 2,5 u · rien de lisible sous 2,2 u. |
| Étiquettes évolutives | Carte rendue en **SVG** (fond estompé en canvas). Étiquettes, traits, symboles recalculés à chaque zoom/redimensionnement : taille écran constante, plus de labels quand on zoome, halo blanc, placement anti-chevauchement. Chiffres droits (pas pivotés). |
| Palette de projection | Fond blanc pur, courbes brun foncé 0,27 u (maîtresses 0,55 u), texte quasi noir. |
| Projecteur (S) | Assombrit tout sauf un disque suivant le pointeur ; molette ou `[` `]` pour la taille. |
| Zoom (Z) | ×2, ×3 centré sur le pointeur, déplacement par glisser ou Maj+flèches ; les étiquettes restent nettes et gardent leur taille. |
| Crayon (P) / laser (L) | Encre rouge à liseré blanc, effacement (C) ; pointeur laser visible de loin. |
| Contrôles de présentation | ←/→/PgUp/PgDn/Espace (télécommande), ↑/↓ (paramètre de la scène), 1–7, B/W/. (écran noir/blanc), F (plein écran), Q (question flash), R (révéler), N (nouveau terrain), H (aide), Échap. Barre d'outils tactile qui se masque seule. Balayage horizontal sur la carte = scène suivante/précédente. |
| Réglage de la salle (K) | Préréglages Classe ×1 / Amphi ×1,5 / Grand amphi ×2 + calcul à partir de la largeur d'écran et de la distance du dernier rang (heuristique 10′ d'arc) ; mémorisé par appareil. |
| Scènes (storytelling) | 7 scènes de données (`js/stage/scenes.js`) : plan horizontal + bloc 3D, équidistance, lire une altitude (prédire → R), pente/écartement, formes (nom masqué → R), règle des V, synthèse. Chaque scène = 1 titre, 1 idée, 1 question flash, notes enseignant. |
| Vue présentateur | 2ᵉ fenêtre : notes, question flash, scène suivante, **aperçu fidèle de la salle**, minuteurs, commandes qui pilotent la projection (BroadcastChannel). |
| Prêt pour l'arabe / l'anglais | Aucun texte en dur : `t('clé')` + `register('ar', {...})` ; `dir="rtl"` appliqué automatiquement. Chiffres via `Intl`. |
| Accessibilité | Boutons nommés, `aria-pressed`, annonce vocale du titre/de l'idée à chaque scène, carte étiquetée, focus visible, `prefers-reduced-motion`. |

Fichiers : `js/stage/{stage,figure,mapsvg,scenes,i18n,fr}.js`, `css/stage.css`. Modifications du reste de l'app : routes (`main.js`), 3 boutons d'accès, export de `tintCanvas`, **correction de `analyze()`** (cf. §5).

## 2. Mesures avant / après (Chromium, mêmes contenus : colline, éq. 20 m)

Hypothèse de lisibilité : écran de 3 m de large (16:9), hauteur de capitale = 0,72 × corps, seuil de 10′ d'arc. Heuristique de conception à valider dans votre salle, pas une norme.

| Mesure | Avant (1920×1080) | **Après ×1** | **Après ×1,5** |
|---|---|---|---|
| Carte (largeur × hauteur) | 511 × 350 px | **1346 × 923 px** | 1110 × 761 px |
| Part de l'écran occupée par la carte | 8,6 % | **59,9 %** | 40,7 % |
| Étiquette de courbe (altitude) | 10 px = 0,93 % hauteur | **27 px = 2,5 %** | 40,5 px = 3,75 % |
| Plus petit texte de la page | 12,2 px (1,13 %) | **23,8 px (2,2 %)** | 35,6 px (3,3 %) |
| Texte (en caractères) sous 2 % de la hauteur | 92 % | **0 %** | 0 % |
| Courbe / courbe maîtresse | 0,85 / 1,9 px | **2,9 / 5,9 px** | 4,4 / 8,9 px |
| Étiquette lisible jusqu'à (écran 3 m) | 3,9 m | **10,4 m** | 15,7 m |

Autres résolutions : à 1280×720 la carte passe de 481 px à 897 px et l'étiquette lisible de 5,8 m à 10,4 m ; en 4:3 (1024×768) de 353 px à 640 px et de 5,4 m à 10,4 m. **Constat important : avec une interface en pixels fixes, la lisibilité empire quand la résolution du projecteur augmente** (10 px = 1,39 % de la hauteur en 720p, 0,93 % en 1080p). L'unité relative à la hauteur d'écran supprime ce défaut.

Images : `docs/stage/` — `comparaison_1_proche`, `comparaison_2_distance_x2`, `comparaison_3_distance_x3` (simulation du spectateur éloigné : réduction + flou), `avant_/apres_1920x1080`, `apres_amphi_x1.5`, `apres_projecteur_4x3`, `outil_projecteur`, `reglage_salle`, `vue_presentateur`, `galerie_7_scenes`.
La simulation de distance est une **approximation** (sous-échantillonnage + flou léger), pas une mesure photométrique. La capture « avant » est le labo actuel, auquel on a seulement ajouté le bouton « Mode Stage ».

## 3. Tests automatisés (`tools/stage/`)

- `test_stage.py` : 28 vérifications (navigation clavier/télécommande, paramètre, projecteur, zoom ×2 avec étiquettes de taille constante, crayon, question, écran noir, aide, réglage de la salle, sonde, révéler, nouveau terrain, sortie, synchronisation présentateur ↔ projection, absence d'erreur JS) : **28/28**.
- 29 routes de l'application (anciennes + Stage) chargées sans erreur en `file://` et en `http` : **0 problème**.
- `measure.py` : reproduit le tableau ci-dessus ; peut servir de **garde-fou** (échec si un texte passe sous 2 % de la hauteur d'écran).

## 4. Plan de migration du reste de la plateforme

**Principe** : une page n'est « Stage » que si elle passe la *Definition of Done* ci-dessous. On migre par ordre d'impact en salle, sans réécrire les moteurs (terrain, profil, scoring) : seul le rendu et la mise en scène changent.

*Definition of Done d'une scène Stage* : (1) toute taille en u ; plus petit texte ≥ 2,2 u ; (2) étiquettes en SVG/HTML, jamais en pixels de canvas ; (3) une idée, ≤ 25 mots à l'écran, un paramètre à la fois ; (4) clavier + télécommande + toucher ; (5) textes dans le dictionnaire ; (6) question flash et notes enseignant ; (7) `measure.py` vert à 1920×1080, 1280×720, 1024×768.

| Vague | Contenu | Travail principal | Dépend de |
|---|---|---|---|
| **0 (fait)** | Courbes de niveau (7 scènes) | Preuve de concept | — |
| **1** | M1 complet : échelle, orientation, coordonnées, pente, formes (labos *pente* et *atlas*) | Réutiliser `figure.js`/`mapsvg.js` ; scènes = données ; figures du manuel en SVG ou image ≥ 1600 px | Stage Kit |
| **2** | **Profil topographique** (cœur du cours) : scènes « trait A–B → relevé → papier → tracé → correction » ; profil rendu en SVG avec axes lisibles | Extraire de `profile.js` un rendu SVG de la feuille millimétrée ; mode « tracé démonstratif » à l'écran | Stage Kit, vue présentateur |
| **3** | **Questions flash** : quiz de chapitre et bibliothèque d'erreurs en diapositives (énoncé + figure, 4 choix XL, révélation) ; « trouvez l'erreur » sur un profil faux | Nouveau type de scène `question` ; format de banque enrichi (erreur-type visée) | Vague 1 |
| **4** | **Class Hub local** : mêmes messages que le canal actuel (`{t:'cmd'|'state'}`) transportés par WebSocket depuis l'ordinateur de l'enseignant ; vote avec confiance, « spaghetti » des profils, tap-to-predict | Petit serveur à fichier unique (Node ou binaire), QR code de connexion, mode dégradé hors ligne | Vague 3 |
| **5** | Terrain 3D, construction inverse, cas marocains (MNT réels) | Calques 3D lisibles à distance, vues liées carte/profil/3D | Vagues 1–2 |
| **6** | Arabe / anglais ; M3–M4 hors cœur v3 | Fichiers `ar.js` / `en.js`, glossaire trilingue ; scènes géologiques sur le même noyau | i18n (prêt) |

**Dette technique à traiter en parallèle** : découper `profile.js` (37 Ko, lignes très denses) ; sortir les leçons du JS vers des données versionnées ; tests de non-régression sur le moteur (`terrain`, `geol`) ; icônes PNG pour l'installation PWA ; remplacer `Math.random` par le générateur à graine partout où l'exercice doit être reproductible.

## 5. Limites et points à vérifier

- **Non testé en salle** : aucun test sur un vrai vidéoprojecteur, un vrai amphithéâtre, une télécommande réelle, Safari/Firefox, iPad. Le calcul de distance repose sur une heuristique (10′ d'arc) à valider avec 2–3 collègues au dernier rang.
- **Synchronisation présentateur** : `BroadcastChannel` fonctionne en `http`, `https`, `localhost` (GitHub Pages inclus) ; **pas depuis `file://`** (origines isolées). Le mode projection seul fonctionne bien en `file://`. Le Class Hub (vague 4) lèvera cette limite.
- **Moteur modifié** : `analyze()` (js/core/terrain.js) ne repérait pas le sommet des formes analytiques parfaitement symétriques (deux mailles de même altitude s'excluaient). Un départage par ordre de balayage a été ajouté. Effet de bord : quelques sommets/cuvettes supplémentaires peuvent apparaître ailleurs dans l'app sur des surfaces à égalité ; à surveiller.
- **Hydrographie / crêtes calculées** : les talwegs détectés sur le relief procédural sont fragmentaires (et absents sur certaines graines) et la détection de crêtes est bruitée. La scène « règle des V » utilise donc les formes analytiques *Vallée* et *Crête* et laisse la ligne de crête au crayon. Les calques automatiques restent disponibles dans le moteur mais ne sont pas projetés.
- **Scène 1 (bloc 3D)** : reprise du moteur isométrique existant, plus petite que la carte ; à refaire en 3D temps réel dans la vague 5.
- Les textes pédagogiques de Stage (idées, questions, notes) sont nouveaux et à relire par l'enseignant.
- Poids : `dist/app.js` passe de 985 Ko à 1 028 Ko (+43 Ko) ; `css/stage.css` +12 Ko.
