const D=(t,x)=>`<div class="box def"><b class="t">📘 Définition · ${t}</b>${x}</div>`,R=x=>`<div class="box rem"><b class="t">⚠️ À retenir</b>${x}</div>`,T=x=>`<div class="box tip"><b class="t">💡 Astuce</b>${x}</div>`,E=x=>`<div class="box err"><b class="t">🚫 Erreur fréquente</b>${x}</div>`;
const F=(n,c)=>`<figure><img loading="lazy" src="img/${n}.webp" alt="${c}"><figcaption>${c}</figcaption></figure>`;
const WG=(n,x='')=>`<div class="widget" data-w="${n}" ${x}></div>`;
const EXO=(sk)=>`<div class="widget" data-w="exo" data-skill="${sk}"></div>`;
export const MODS={
m1:{title:'Cartographie topographique',icon:'📍',lessons:[
{id:'def',icon:'🗺️',title:'Définition',goal:'Comprendre ce qu\'est une carte topographique.',html:`
<p>Une <b>carte</b> est la représentation, sur un plan, d'une portion de la surface terrestre réduite à une certaine <b>échelle</b>. Elle montre l'étendue d'un espace, sa position par rapport aux espaces voisins et ce qu'il contient.</p>
${D('Carte topographique','Du grec <i>topos</i> (lieu) et <i>graphein</i> (dessiner) : carte qui représente le <b>relief</b> (courbes de niveau), l\'<b>hydrographie</b>, les voies de communication, les localités, la végétation et la toponymie.')}
<p>La Terre est (quasi) sphérique, le papier est plan : on passe de l'un à l'autre par une <b>projection</b>, qui déforme forcément quelque chose (angles, surfaces ou distances). Les cartes topographiques marocaines utilisent la projection <b>conique conforme de Lambert</b> (par zones) (« conforme » = les angles sont conservés).</p>
${F('proj','Familles de projections : cylindrique (a), conique (b), azimutale (c)')}
<h3>Code des couleurs</h3>
<div class="legend"><span><i style="background:#222"></i>Noir : routes, bâti, noms, points cotés</span><span><i style="background:#2d86c8"></i>Bleu : eau</span><span><i style="background:#4c9a4c"></i>Vert : végétation</span><span><i style="background:#b0622a"></i>Bistre : courbes de niveau</span><span><i style="background:#999"></i>Gris : estompage</span></div>
${F('carte','Une carte topographique : les marges portent le titre, les échelles, les trois « Nord » et la légende')}
${T('Aujourd\'hui, cartes numériques, <b>SIG</b> et <b>modèles numériques de terrain (MNT)</b> remplacent peu à peu le papier, mais les principes (échelle, courbes, profils) restent les mêmes. C\'est exactement ce que cette plateforme génère : des MNT virtuels.')}
${WG('quiz','data-bank="m1" data-n="3"')}`},
{id:'echelle',icon:'📏',title:'Échelle',goal:'Convertir distances carte ↔ terrain.',html:`
${D('Échelle','Rapport entre une distance mesurée sur la carte (d) et la distance correspondante sur le terrain (D), <b>exprimées dans la même unité</b> : <b>E = d / D</b>.')}
<div class="formula">D = d × N &nbsp;&nbsp;|&nbsp;&nbsp; d = D / N</div>
<ul><li><b>1/25 000</b> : 1 cm = 25 000 cm = 250 m</li><li><b>1/50 000</b> : 1 cm = 500 m</li><li><b>1/100 000</b> : 1 cm = 1 km</li></ul>
${WG('scale')}
<p>L'échelle peut être <b>numérique</b> (1/N) ou <b>graphique</b> (segment gradué en km ou hm).</p>
${WG('photocopy')}
${R('« Grande échelle » = fraction grande = <b>1/10 000</b> : beaucoup de détails sur une petite surface. « Petite échelle » = 1/1 000 000. Sur une carte au 1/50 000, 1 cm² représente 25 ha.')}
${EXO('echelle')}${WG('quiz','data-bank="m1" data-n="3"')}`},
{id:'orient',icon:'🧭',title:'Orientation',goal:'Lire et exprimer une direction ; distinguer les trois Nord.',html:`
<p>Par convention, le <b>Nord est en haut</b>, l'Est à droite. Une direction s'exprime par un <b>azimut</b> (angle depuis le Nord dans le sens horaire, 0° à 360°) ou par un secteur de la <b>rose des vents</b> (16 secteurs : N, NNE, NE, ENE, E, ESE, SE, SSE, S, SSO, SO, OSO, O, ONO, NO, NNO).</p>
${WG('rose')}
<h3>Trois « Nord »</h3>
<ul><li><b>Nord géographique (NG)</b> : direction du pôle Nord, donnée par les méridiens. Dans le ciel : l'étoile polaire (prolonger 5 fois la distance entre les deux étoiles de la Grande Ourse qui « versent »), ou la Croix du Sud pour le pôle Sud.</li>
<li><b>Nord magnétique (NM)</b> : indiqué par la boussole, décalé du NG de la <b>déclinaison magnétique</b>, qui varie avec le lieu et le temps.</li>
<li><b>Nord Lambert (Y)</b> : nord du quadrillage kilométrique, décalé du NG par la projection (convergence des méridiens).</li></ul>
${WG('norths')}
${R('Les valeurs des trois Nord et la déclinaison (à une date de référence, avec sa variation annuelle) figurent sur la marge de la carte. Pour utiliser une boussole : orienter, puis corriger de la déclinaison actuelle.')}
${F('polaire','Trouver l\'étoile polaire à partir de la Grande Ourse')}
${EXO('orientation')}${WG('quiz','data-bank="m1" data-n="3"')}`},
{id:'coord',icon:'🌍',title:'Coordonnées',goal:'Repérer un point : géographiques et Lambert.',html:`
<h3>Coordonnées géographiques (angulaires)</h3>
${D('Latitude (φ)','Angle Nord–Sud entre le plan de l\'Équateur et la verticale du lieu : de 0° (Équateur) à 90° (pôles). Positive au Nord, négative au Sud.')}
${D('Longitude (λ)','Angle Est–Ouest par rapport au méridien de Greenwich : de 0° à 180°. Positive à l\'Est, négative à l\'Ouest.')}
<p>Un <b>parallèle</b> relie les points de même latitude, un <b>méridien</b> ceux de même longitude.</p>
${WG('globe')}
<div class="box tip"><b class="t">💡 Ordres de grandeur</b>1° de latitude ≈ 111 km partout ; 1° de longitude ≈ 111 km × cos φ (plus court en s'éloignant de l'Équateur).</div>
<h3>Coordonnées Lambert (rectangulaires)</h3>
<p>Un quadrillage <b>kilométrique</b> couvre la carte : <b>X</b> (vers l'Est) et <b>Y</b> (vers le Nord). Pour un point, on projette sur les marges les plus proches et on interpole. Au 1/25 000, un carreau de 1 km mesure 4 cm.</p>
${WG('lambert')}
${F('lambertmaroc','Le Maroc est découpé en plusieurs zones Lambert (Nord, Sud, Sahara)')}
${EXO('coordonnees')}${WG('quiz','data-bank="m1" data-n="3"')}`},
{id:'courbes',icon:'🟤',title:'Courbes de niveau',goal:'Comprendre et lire les courbes de niveau.',html:`
${D('Courbe de niveau','Ligne qui relie tous les points d\'un relief situés à la <b>même altitude</b> (hauteur au-dessus du niveau moyen de la mer). C\'est l\'intersection du relief avec un plan horizontal.')}
${WG('slice')}
${D('Équidistance (Éq)','Différence d\'altitude <b>constante</b> entre deux courbes consécutives (valeur indiquée en marge). Elle dépend de l\'échelle et du relief.')}
${D('Écartement (Éc)','Distance <b>horizontale</b> entre deux courbes consécutives, mesurée perpendiculairement aux courbes (ligne de plus grande pente). Il est <b>variable</b>, et inversement proportionnel à la pente.')}
${WG('eqec')}
<h3>Les trois types de courbes</h3>
<ul><li><b>Maîtresses</b> : épaisses, cotées (ici toutes les 5 courbes : Éq 20 m ⇒ 100, 200…).</li><li><b>Normales</b> : plus fines, altitude déduite de la maîtresse voisine.</li><li><b>Intercalaires</b> : en tirets, à la demi-équidistance, là où le relief est très doux.</li></ul>
${F('types','Courbes maîtresses, normales et intercalaires')}
${R('Les chiffres des courbes maîtresses sont <b>orientés</b> : le haut des chiffres est tourné vers le haut de la pente. Deux courbes de valeurs différentes ne se croisent jamais (sauf figuré de falaise). Les altitudes sont en général des multiples de l\'équidistance.')}
<h3>Points cotés, estompage et interpolation</h3>
<p>Un <b>point coté</b> donne une altitude exacte (sommet, col…). L'<b>estompage</b> simule un éclairage venant du NW à 45° : versants NW clairs, SE sombres. Pour l'altitude d'un point entre deux courbes : <b>interpolation linéaire</b> le long de la plus grande pente.</p>
<div class="formula">z = z_courbe_basse + (distance au bas / Éc) × Éq</div>
${F('estomp','Estompage sur des reliefs')}
${EXO('courbes')}${WG('quiz','data-bank="m1" data-n="4"')}`},
{id:'pente',icon:'📐',title:'Pentes',goal:'Calculer et interpréter une pente.',html:`
${D('Pente','Rapport entre la dénivelée H et la distance <b>horizontale</b> D : <b>P (%) = H / D × 100</b>. Une pente de 10 % = 10 m de dénivelée pour 100 m horizontaux.')}
<div class="formula">P = (Éq / Éc) × 100 &nbsp;|&nbsp; α = arctan(P / 100)</div>
<p class="mute">Les qualificatifs (faible, modérée, forte…) du simulateur sont des <b>repères indicatifs</b>, pas une norme.</p><p>Si la pente est constante : P = (ΣÉq / ΣÉc) × 100. Attention aux unités : Éc doit être converti en mètres réels (Éc réel = Éc carte × N).</p>
${WG('slope')}
<h3>Formes de pentes</h3>
<ul><li><b>Constante</b> : courbes équidistantes (espacées = faible, serrées = forte).</li><li><b>Convexe</b> : de plus en plus serrées vers le bas.</li><li><b>Concave</b> : de plus en plus espacées vers le bas.</li><li><b>Rupture de pente</b> : l'écartement change brusquement.</li><li><b>Falaise</b> : pente quasi verticale, courbes confondues ⇒ figuré spécial. Hauteur = altitude du haut − altitude du bas (on donne un encadrement min/max si les points sont entre deux courbes).</li></ul>
${WG('slopeshapes')}
${EXO('pente')}${WG('quiz','data-bank="m1" data-n="3"')}`},
{id:'formes',icon:'⛰️',title:'Formes du relief',goal:'Reconnaître colline, cuvette, vallée, crête, col, bassin versant.',html:`
<ul><li><b>Colline / sommet</b> : courbes fermées, altitude croissante vers le centre.</li><li><b>Cuvette</b> : courbes fermées hachurées, altitude décroissante vers le centre.</li><li><b>Versant</b> : surface inclinée entre une crête et un talweg.</li><li><b>Vallée</b> : dépression allongée à deux versants convergents, creusée par un cours d'eau ou un glacier. Son axe le plus bas est le <b>talweg</b> (ligne de drainage).</li><li><b>Ligne de crête</b> (de partage des eaux) : joint les points les plus hauts ; alternance de <b>sommets</b> et de <b>cols</b> (<i>tizi</i>).</li><li><b>Bassin versant</b> : surface dont toutes les eaux convergent vers un même exutoire ; il est limité par la ligne de crête.</li><li><b>Plateau</b> : vaste surface subhorizontale dominant son environnement.</li></ul>
${WG('vrule')}
${WG('atlas')}
${E('Confondre colline et cuvette : regarde toujours les <b>altitudes</b> (et les hachures) et pas seulement la forme fermée.')}
<div class="grid g2">${F('vallee','Vallée de montagne (photographie du polycopié)')}${F('tizi','Col (tizi) : image satellite du polycopié')}</div>
${EXO('formes')}${WG('quiz','data-bank="m1" data-n="5"')}`}]},
m2:{title:'Profils topographiques',icon:'📈',lessons:[
{id:'theorie',icon:'🔪',title:'Théorie',goal:'Comprendre ce qu\'est un profil.',html:`
${D('Profil topographique','Ligne d\'intersection entre la surface topographique et un <b>plan vertical</b> matérialisé sur la carte par un segment A–B : le <b>trait de coupe</b>.')}
${WG('plane')}
<p>Faire un profil, c'est <b>reconstituer le relief en coupe</b> à partir des courbes de niveau : le chemin inverse de celui qui a produit la carte. Il sert à voir la forme des versants, évaluer des pentes, vérifier une visibilité, préparer ensuite des coupes géologiques.</p>
${R('Un profil se lit de A (gauche) vers B (droite). Les altitudes sont en ordonnée, les distances en abscisse.')}`},
{id:'methode',icon:'🧱',title:'Méthode',goal:'Maîtriser la technique pas à pas.',html:`
<ol class="steps"><li><b>Trace</b> le trait de coupe A–B sur la carte ; repère les talwegs, crêtes et points cotés qu'il traverse.</li>
<li><b>Prépare le papier millimétré</b> : axe horizontal = longueur de AB à l'échelle de la carte ; axes verticaux en A et en B ; gradue les altitudes (échelle des hauteurs choisie) ; <b>origine</b> = multiple de l'équidistance juste sous l'altitude la plus basse.</li>
<li><b>Pose le bord de la bande</b> de papier contre le trait de coupe et marque chaque intersection avec une courbe, avec son altitude (commence par les maîtresses).</li>
<li><b>Reporte</b> chaque repère à l'abscisse et à l'altitude correspondantes.</li>
<li><b>Estime les extrema</b> : entre deux intersections de même altitude, le profil passe par un sommet ou un fond de talweg (point coté, sinon ≈ Éq/2 au-delà de la dernière courbe).</li>
<li><b>Relie à main levée</b> avec un trait lissé (jamais à la règle), puis reprends au crayon bien taillé.</li>
<li><b>Habille</b> le profil : toponymes, orientation (rose des vents), localisation (carré 2 × 2 cm), échelles des longueurs et des hauteurs (repère 1 × 1 cm), coordonnées Lambert et altitudes de A et B, nom et échelle de la carte, nom de l'étudiant.</li></ol>
${E('Relier les points à la règle ; oublier les sommets entre deux points ; choisir une origine trop basse ; changer l\'échelle en cours de tracé ; confondre le sens de lecture (A à gauche).')}
<p class="lead">👉 Passe à la pratique avec le <b>simulateur de profil sur papier millimétré</b> (3 niveaux d'aide) :</p>
<a class="btn acc" href="#/profil">✏️ Ouvrir le simulateur</a>`},
{id:'echelles',icon:'↕️',title:'Échelles & exagération',goal:'Choisir l\'échelle des hauteurs.',html:`
<p><b>Cas 1</b> : longueurs à l'échelle de la carte, hauteurs à une échelle choisie (relief exagéré). <b>Cas 2</b> : mêmes échelles (profil sans déformation).</p>
<div class="formula">Exagération Ev = (m par cm en longueur) ÷ (m par cm en hauteur) = N_longueurs ÷ N_hauteurs</div>
<p>Exemple : 1 cm = 250 m en longueur et 1 cm = 50 m en hauteur ⇒ Ev = ×5. La pente <b>apparente</b> vaut la pente réelle × Ev (l'angle apparent α′ = arctan(Ev · tan α)).</p>
${WG('vexag')}
${R('Exagérer rend un relief doux lisible mais augmente visuellement les pentes : indique <b>toujours</b> les deux échelles. Choisis l\'échelle des hauteurs pour que le profil occupe environ la moitié à deux tiers de la hauteur du papier.')}
${WG('quiz','data-bank="m2" data-n="5"')}`},
{id:'auto',icon:'✅',title:'Auto-évaluation',goal:'Vérifier la qualité de ton profil.',html:`
<p>Avant de rendre un profil (papier ou numérique), vérifie chaque critère :</p>
${WG('selfeval')}
${WG('quiz','data-bank="m2" data-n="8"')}
<div class="lnav"><a class="btn acc" href="#/profil">✏️ S'entraîner : simulateur</a><a class="btn blue" href="#/inverse">🔄 Construction inverse</a></div>`}]}};
