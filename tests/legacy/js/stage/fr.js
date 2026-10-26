/* Textes français du mode Stage (cours « Courbes de niveau »). */
import { register } from './i18n.js';

register('fr', {
  /* interface */
  'ui.exit': 'Quitter', 'ui.prev': 'Scène précédente', 'ui.next': 'Scène suivante',
  'ui.spot': 'Projecteur', 'ui.zoom': 'Zoom', 'ui.pen': 'Crayon', 'ui.laser': 'Pointeur laser',
  'ui.ask': 'Question', 'ui.blank': 'Écran noir', 'ui.full': 'Plein écran', 'ui.calib': 'Réglage de la salle',
  'ui.present': 'Vue présentateur', 'ui.help': 'Aide', 'ui.clear': 'Effacer le crayon', 'ui.reveal': 'Révéler',
  'ui.newterrain': 'Nouveau terrain', 'ui.scene': 'Scène {n} sur {m}', 'ui.probeHint': 'Touchez la carte pour sonder un point.',
  'ui.revealHint': 'Appuyez sur R pour révéler.', 'ui.code': 'Code du terrain : {c}', 'ui.fsHint': 'Plein écran : touche F',
  'ui.theme': 'Thème clair / sombre', 'ui.question': 'Question à la classe', 'ui.close': 'Fermer',
  'ui.formN': 'Forme {n} sur {m}', 'ui.zoomBadge': 'Zoom ×{z}', 'ui.unknown': '?',
  /* légende / carte */
  'map.contour': 'Courbe de niveau', 'map.index': 'Courbe maîtresse (cotée)', 'map.summit': 'Sommet (altitude en m)',
  'map.river': 'Talweg', 'map.crest': 'Crête', 'map.north': 'N', 'map.eq': 'Équidistance', 'map.alt': 'Altitude du plan',
  'map.curves': 'Courbes', 'map.every': 'Courbes maîtresses tous les {m} m',
  /* formes */
  'form.colline': 'Colline (sommet)', 'form.cuvette': 'Cuvette (dépression)', 'form.col': 'Col (selle)',
  'form.vallee': 'Vallée et talweg', 'form.crete': 'Ligne de crête', 'form.plateau': 'Plateau',
  'rule.colline': 'Courbes fermées, altitudes croissantes vers le centre.',
  'rule.cuvette': 'Courbes fermées, altitudes décroissantes vers le centre (hachures vers le bas).',
  'rule.col': 'Selle entre deux sommets et deux creux opposés.',
  'rule.vallee': 'Courbes en V dont la pointe est tournée vers l’amont (altitudes croissantes).',
  'rule.crete': 'Courbes en V dont la pointe est tournée vers l’aval (altitudes décroissantes).',
  'rule.plateau': 'Courbes très espacées au sommet, très serrées sur le pourtour.',
  /* lectures */
  'read.alt': 'Altitude', 'read.between': 'entre {a} m et {b} m', 'read.slope': 'Pente', 'read.gap': 'Écartement',
  'read.gapMap': 'sur la carte (1/{n})', 'read.slopeClass.0': 'faible', 'read.slopeClass.1': 'modérée',
  'read.slopeClass.2': 'forte', 'read.slopeClass.3': 'très forte', 'read.flat': 'pente quasi nulle',
  'read.count': '{n} courbes tracées', 'read.plane': 'Chaque courbe = trace d’un plan horizontal sur le relief.', 'read.formula': 'Pente % = Éq ÷ écartement × 100',
  'probe.0': 'Zone peu pentue (haut)', 'probe.1': 'Zone très pentue', 'probe.2': 'Zone peu pentue (bas)',
  'layers.0': 'Vallée : courbes seules', 'layers.1': 'Vallée + talweg (bleu)', 'layers.2': 'Crête : courbes seules',
  'v.0': 'Prédisez : où coule l’eau ?', 'v.1': 'Talweg : V tournés vers l’amont.', 'v.2': 'Crête : V tournés vers l’aval. Tracez la ligne de crête au crayon (P).',

  /* scènes : titre / idée à retenir / question flash / notes pour l’enseignant */
  's.plane.title': 'Une courbe de niveau est une coupe horizontale',
  's.plane.say': 'Chaque courbe relie les points de même altitude : on « tranche » le relief par des plans horizontaux.',
  's.plane.ask': 'Quand le plan monte de 50 m, que devient la courbe tracée sur la carte ?',
  's.plane.note': 'Durée ≈ 2 min. Montez le plan avec ↑ et laissez la classe voir la carte se construire. Erreur fréquente : croire qu’une courbe est un chemin qui monte ou descend.',
  's.plane.param': 'Altitude du plan',

  's.eq.title': 'L’équidistance règle le niveau de détail',
  's.eq.say': 'Équidistance = écart d’altitude constant entre deux courbes consécutives. Plus elle est petite, plus la carte est détaillée.',
  's.eq.ask': 'Combien de courbes obtient-on avec Éq = 50 m ? Et avec 10 m ?',
  's.eq.note': 'Faites défiler 100 → 10 m (↑↓) en demandant ce qui change et ce qui est perdu. Reliez au choix de l’équidistance selon l’échelle et le relief.',
  's.eq.param': 'Équidistance',

  's.read.title': 'Lire une altitude entre deux courbes',
  's.read.say': 'Repérer les courbes maîtresses cotées, compter les courbes, puis interpoler.',
  's.read.ask': 'Quelle est l’altitude du point touché ? Entre quelles courbes se trouve-t-il ?',
  's.read.note': 'Touchez un point, laissez la classe estimer, puis R pour révéler. Une estimation graphique à ± ¼ d’équidistance est raisonnable. N génère un autre terrain.',

  's.gap.title': 'Courbes serrées = pente forte',
  's.gap.say': 'L’écartement (distance horizontale entre deux courbes) est inversement proportionnel à la pente.',
  's.gap.ask': 'Où la pente est-elle la plus forte ? Comment le voit-on sur la carte ?',
  's.gap.note': '↑↓ passe d’une zone à l’autre. Pente % = Éq ÷ écartement × 100. Rappel : 100 % = 45°, pas 90°.',
  's.gap.param': 'Zone sondée',

  's.forms.title': 'Reconnaître les formes du relief',
  's.forms.say': 'Observez la fermeture des courbes, le sens des altitudes et la forme des V.',
  's.forms.ask': 'Quelle est cette forme ? Justifiez avec ce que vous voyez sur les courbes.',
  's.forms.note': 'Le nom est masqué : faites voter ou discuter 30 s, puis R pour révéler. Cuvette : hachures vers le bas ; col : deux sommets et deux creux opposés.',
  's.forms.param': 'Forme',

  's.v.title': 'Talwegs et crêtes : la règle des V',
  's.v.say': 'Dans un talweg les V pointent vers l’amont ; sur une crête ils pointent vers l’aval.',
  's.v.ask': 'Dans quel sens coule l’eau ici ? Où passe la ligne de crête ?',
  's.v.note': 'Étapes 1–2 : vallée (la classe prédit l’écoulement, puis le talweg apparaît). Étape 3 : crête (tracez-la au crayon, touche P). La règle a une exception (couche inclinée dans le sens de l’écoulement) : voir le chapitre.',
  's.v.param': 'Calque',

  's.synth.title': 'Synthèse : lire un relief complet',
  's.synth.say': 'Altitudes, formes, pentes, écoulements : combinez tout ce que vous avez appris.',
  's.synth.ask': 'Décrivez ce relief : point culminant, vallées, versants les plus raides.',
  's.synth.note': 'Sondez plusieurs points. N génère un nouveau terrain ; son code est affiché pour que les élèves le rechargent sur leur appareil. ↑↓ change l’équidistance.',
  's.synth.param': 'Équidistance',

  /* aide clavier */
  'help.title': 'Commandes de présentation',
  'help.keys': [
    ['→  ␣  PgDn', 'Scène suivante'], ['←  PgUp', 'Scène précédente'], ['1 – 7', 'Aller à la scène'],
    ['↑  ↓', 'Changer le paramètre de la scène'], ['S', 'Projecteur (molette ou [ ] : taille)'], ['Z', 'Zoom ×2 / ×3 (Maj+flèches : déplacer)'],
    ['P', 'Crayon (C : effacer)'], ['L', 'Pointeur laser'], ['Q', 'Question à la classe'], ['R', 'Révéler la réponse'],
    ['N', 'Nouveau terrain'], ['B  W', 'Écran noir / blanc'], ['F', 'Plein écran'], ['K', 'Réglage de la salle'],
    ['V', 'Vue présentateur (2ᵉ fenêtre)'], ['T', 'Thème clair / sombre'], ['+  −', 'Taille globale'], ['Échap', 'Fermer / quitter']
  ],
  /* réglage de la salle */
  'calib.title': 'Réglage de la salle',
  'calib.lead': 'Placez-vous au dernier rang. Lisez ces altitudes. Si vous hésitez, augmentez la taille.',
  'calib.presets': 'Préréglages', 'calib.p.1': 'Salle de classe', 'calib.p.1.5': 'Amphithéâtre', 'calib.p.2': 'Grand amphithéâtre',
  'calib.scale': 'Taille : ×{s}', 'calib.calc': 'Calcul à partir de la salle',
  'calib.width': 'Largeur de l’écran (m)', 'calib.dist': 'Distance du dernier rang (m)',
  'calib.result': 'Pour lire les altitudes à {d} m, il faut une hauteur de chiffre d’au moins {p} % de la hauteur de l’écran (heuristique : 10 minutes d’arc). Facteur conseillé : ×{s}.',
  'calib.cap': 'Au-delà de ×2, mieux vaut réduire le contenu de la scène (ou agrandir l’écran) que grossir davantage.',
  'calib.apply': 'Appliquer', 'calib.ok': 'Terminé',
  /* page d’accueil Stage */
  'home.title': 'Mode Stage · projection', 'home.lead': 'Mode plein écran pour projeter en salle ou en amphithéâtre : textes agrandis, figure au centre, projecteur, zoom, crayon, commandes à la télécommande.',
  'home.launch': 'Lancer la scène « Courbes de niveau »', 'home.present': 'Ouvrir la vue présentateur',
  'home.calib': 'Régler la taille pour ma salle', 'home.tip': 'Astuce : lancez d’abord le plein écran (touche F) et réglez la taille depuis le dernier rang (touche K).',
  'home.deckCourbes': 'Courbes de niveau', 'home.deckCourbesDesc': '7 scènes : plan horizontal, équidistance, lecture d’altitude, pente, formes, règle des V, synthèse.',
  /* vue présentateur */
  'pres.title': 'Vue présentateur', 'pres.note': 'Notes', 'pres.question': 'Question flash', 'pres.next': 'Ensuite',
  'pres.timer': 'Temps écoulé', 'pres.sceneTimer': 'Sur cette scène', 'pres.scenes': 'Scènes', 'pres.controls': 'Commandes',
  'pres.preview': 'Aperçu de la salle', 'pres.waiting': 'En attente de la fenêtre de projection…',
  'pres.noSync': 'Les deux fenêtres doivent être ouvertes depuis le même site (http, https ou localhost). Depuis un fichier local (file://), la synchronisation est bloquée par le navigateur.',
  'pres.openStage': 'Ouvrir la fenêtre de projection', 'pres.connected': 'Connecté à la projection'
});
