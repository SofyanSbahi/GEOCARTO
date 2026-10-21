/* Cas d'étude marocains : MODÈLES PÉDAGOGIQUES inspirés de paysages réels (pas des MNT réels).
   Les faits cités sont volontairement généraux ; à confronter à la carte officielle (ANCFCC / Division de la Cartographie) et au cours. */
export const CASES=[
{id:'toubkal',t:'Haut Atlas — massif du Toubkal',em:'🏔️',reg:'Haut Atlas occidental',topo:{type:'montagne',seed:4011,scaleN:50000,base:2600,relief:1500,peaks:4,valleys:.8},geo:{kind:'granite',seed:4011},
 ctx:'Le Toubkal (≈ 4 167 m) est le plus haut sommet d\'Afrique du Nord. Les hautes vallées glaciaires façonnées au Quaternaire et un réseau de talwegs encaissés rendent le relief très contrasté : courbes très serrées sur les versants, plus espacées dans les fonds de vallée.',
 geoTxt:'Le Haut Atlas occidental expose des terrains anciens de socle (Précambrien et Paléozoïque), localement recoupés par des roches magmatiques. Le modèle géologique est simplifié (série paléozoïque d\'inspiration + intrusion).',
 goals:['Reconnaître crêtes et talwegs en haute montagne','Interpréter des pentes très fortes (> 30 %)','Lire une intrusion magmatique recoupant une série'],scale:'1/50 000'},
{id:'todgha',t:'Gorges du Todgha — Haut Atlas oriental',em:'🏜️',reg:'Région de Tinghir',topo:{type:'plateau',seed:7301,scaleN:25000,base:1200,relief:520,valleys:.85},geo:{kind:'monoclinal',seed:7301,dip:15},
 ctx:'Le Todgha entaille profondément des plateaux calcaires : parois quasi verticales, talweg étroit. Sur la carte, les courbes se confondent presque sur les parois (figuré de falaise) alors que le plateau est quasiment sans courbe.',
 geoTxt:'Les gorges sont taillées dans des calcaires d\'âge jurassique. Le modèle représente des couches modérément inclinées (≈ 15°), afin de s\'entraîner à lire pendage, contacts et V dans les vallées.',
 goals:['Profil d\'une vallée encaissée (rupture de pente)','Hauteur d\'une falaise (min/max)','Contact géologique en V dans un talweg'],scale:'1/25 000'},
{id:'tichka',t:'Tizi n\'Tichka — col routier',em:'🛣️',reg:'Entre Marrakech et Ouarzazate',topo:{type:'montagne',seed:2260,scaleN:50000,base:1400,relief:1100,peaks:3,valleys:.7},geo:{kind:'synclinal',seed:2260},
 ctx:'Le Tizi n\'Tichka (≈ 2 260 m) est l\'un des plus hauts cols routiers du Maroc. Un col est un point bas de la ligne de crête : sur la carte, les courbes forment un « sablier » entre deux sommets, et la route y serpente pour limiter la pente.',
 geoTxt:'Modèle générique de série atlasique plissée (synclinal) : sert à s\'entraîner à repérer l\'âge des formations au cœur d\'un pli.',
 goals:['Repérer un col et une ligne de partage des eaux','Calculer la pente d\'une route (P = Éq/Éc)','Distinguer synclinal et anticlinal'],scale:'1/50 000'},
{id:'siroua',t:'Jbel Siroua — massif volcanique',em:'🌋',reg:'Anti-Atlas central',topo:{type:'volcan',seed:3304,scaleN:50000,base:1800,relief:1500,valleys:.7},geo:{kind:'discordance',seed:3304},
 ctx:'Le Jbel Siroua (≈ 3 300 m) est un massif volcanique néogène reposant sur le socle ancien de l\'Anti-Atlas. Un édifice volcanique donne des courbes concentriques et des ravines radiales.',
 geoTxt:'Le modèle illustre une <b>discordance</b> : des formations peu inclinées reposent sur des couches anciennes fortement inclinées (colonne fictive simplifiée, sans roches volcaniques).',
 goals:['Reconnaître un relief volcanique (courbes concentriques, talwegs radiaux)','Lire une discordance angulaire','Comparer âges relatifs'],scale:'1/50 000'},
{id:'phosphates',t:'Plateau des phosphates — Khouribga',em:'⛏️',reg:'Plateau central',topo:{type:'plateau',seed:5120,scaleN:25000,base:700,relief:260,valleys:.5},geo:{kind:'tabulaire',seed:5120},
 ctx:'Le bassin des phosphates de Khouribga forme un plateau faiblement ondulé, incisé par quelques vallées. Un relief tabulaire donne de larges zones sans courbe, avec un relief marqué seulement sur les bords et dans les vallées.',
 geoTxt:'Les couches phosphatées, datées de la fin du Crétacé à l\'Éocène, sont subhorizontales : leurs contacts suivent les courbes de niveau, ce qui permet d\'étudier une série horizontale.',
 goals:['Contacts géologiques parallèles aux courbes','Profil d\'un plateau incisé','Estimer l\'épaisseur de couches par l\'altitude'],scale:'1/25 000'},
{id:'moyenatlas',t:'Moyen Atlas — plis et plateaux',em:'🌲',reg:'Région d\'Azrou – Ifrane',topo:{type:'complexe',seed:6118,scaleN:50000,base:1200,relief:850,valleys:.6},geo:{kind:'anticlinal',seed:6118},
 ctx:'Le Moyen Atlas associe plateaux calcaires, reliefs plissés et champs de volcans récents. Les plateaux karstiques contiennent des dépressions fermées (cuvettes) et des lacs.',
 geoTxt:'Modèle d\'anticlinal : les formations les plus anciennes occupent le cœur du pli, les plus récentes les flancs, après érosion.',
 goals:['Lire un anticlinal sur une carte','Reconnaître cuvettes et plateaux','Profil perpendiculaire à l\'axe du pli'],scale:'1/50 000'}];
export const caseById=Object.fromEntries(CASES.map(c=>[c.id,c]));
