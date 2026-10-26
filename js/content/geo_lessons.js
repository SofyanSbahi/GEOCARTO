const D=(t,x)=>`<div class="box def"><b class="t">📘 Définition · ${t}</b>${x}</div>`,R=x=>`<div class="box rem"><b class="t">⚠️ À retenir</b>${x}</div>`,T=x=>`<div class="box tip"><b class="t">💡 Astuce</b>${x}</div>`,E=x=>`<div class="box err"><b class="t">🚫 Erreur fréquente</b>${x}</div>`,N=x=>`<div class="box rem"><b class="t">ℹ️ Modèle pédagogique</b>${x}</div>`;
const WG=(n,x='')=>`<div class="widget" data-w="${n}" ${x}></div>`;
export const GEO_MODS={
m3:{title:'Cartes géologiques',icon:'🪨',lessons:[
{id:'geo1',icon:'🗺️',title:'Lire une carte géologique',goal:'Identifier formations, âges relatifs et contacts.',
theory:`${D('Carte géologique','Carte qui représente, sur un fond topographique, la nature (lithologie) et l\'âge des roches <b>affleurantes</b> (ou masquées seulement par une mince couverture meuble), leurs limites (contacts) et les accidents (failles), avec des mesures d\'inclinaison des couches.')}
<p>Chaque formation est repérée par une <b>couleur</b> et une <b>lettre</b>. Les couleurs suivent une convention par âge (système géologique) ; les lettres et signes permettent de lire la carte même en noir et blanc.</p>
<h3>La légende : colonne stratigraphique</h3>
<p>Les formations sont rangées du <b>plus récent (en haut)</b> au <b>plus ancien (en bas)</b>, avec leur nature, leur âge et leur épaisseur approximative.</p>
<h3>Trois principes pour dater</h3>
<ul><li><b>Superposition</b> : si les couches ne sont pas renversées, la plus basse est la plus ancienne.</li><li><b>Recoupement</b> : un objet (faille, granite, filon) est plus récent que ce qu'il recoupe.</li><li><b>Continuité latérale</b> : une couche se prolonge latéralement jusqu'à ce qu'une limite l'interrompe.</li></ul>
<h3>Contacts et relief</h3>
<p>Couches <b>horizontales</b> : les contacts suivent les courbes de niveau ; les formations les plus anciennes sont dans les vallées, les plus récentes sur les sommets. Les tracés dépendent donc de la <b>géométrie des couches</b> et du <b>relief</b> à la fois.</p>
${N('Les cartes de cette plateforme sont générées : colonnes <i>d\'inspiration atlasique</i> (Trias rouge, Lias carbonaté…) mais fictives (épaisseurs et dispositions simplifiées). Elles ne remplacent pas les feuilles officielles de la carte géologique du Maroc.')}`,
example:`<p><b>Série horizontale.</b> Sur une carte, les calcaires du Lias (l) occupent le fond des vallées ; les marnes du Dogger (d) bordent les versants ; les calcaires du Malm (m) forment les sommets. Les contacts suivent les courbes de niveau.</p><ol class="steps"><li>Les contacts sont parallèles aux courbes ⇒ couches <b>horizontales</b>.</li><li>Le plus bas topographiquement est le plus ancien : l (Lias) &lt; d (Dogger) &lt; m (Malm).</li><li>Conclusion : l est la plus ancienne ; m, au sommet, la plus récente.</li></ol>`,act:'geoexplore',actArgs:'data-kinds="tabulaire,monoclinal,granite"'},
{id:'geo2',icon:'📐',title:'Direction et pendage',goal:'Mesurer et interpréter l\'inclinaison des couches.',
theory:`${D('Direction','Orientation (azimut, 0–180°) d\'une <b>ligne horizontale</b> tracée dans le plan de la couche.')}
${D('Pendage','Angle <b>maximal</b> entre la couche et l\'horizontale, mesuré perpendiculairement à la direction ; on précise le <b>sens de plongement</b> (vers où la couche s\'enfonce).')}
<div class="formula">Notation : N 060° E – 30° SE &nbsp;(direction – pendage et côté)</div>
<p>Sur la carte, le symbole est une courte barre (direction) munie d'un trait vers le plongement, avec la valeur du pendage.</p>
<h3>Largeur d'affleurement</h3>
<p>Sur terrain plat, pour une couche d'épaisseur <b>e</b>, de pendage <b>δ</b> : <b>w = e / sin δ</b> (w mesurée perpendiculairement à la direction). Plus le pendage est faible, plus l'affleurement est large.</p>
<h3>Règle des V</h3>
<ul><li>Couche <b>horizontale</b> : le contact suit les courbes de niveau.</li><li>Couche <b>verticale</b> : le contact est une <b>droite</b>, indifférente au relief.</li><li>Couche <b>inclinée</b> : le contact dessine un V dans les vallées. Il pointe vers le sens du pendage, sauf si la couche plonge <i>dans le sens de l'écoulement</i> avec un pendage <i>plus faible</i> que la pente du talweg (le V pointe alors vers l'amont).</li></ul>
<h3>Problème des trois points</h3>
<p>Avec trois points d'un même contact d'altitudes connues : on trace la ligne de même altitude (<b>direction</b>), on mesure la distance horizontale perpendiculaire entre deux lignes de niveau structural, puis <b>tan δ = Δz / distance</b>.</p>
${E('Confondre la <b>direction</b> (horizontale) avec la <b>ligne de plus grande pente</b> (plongement) : elles sont perpendiculaires.')}`,
example:`<p>Deux points A (640 m) et B (520 m) sont sur le même contact ; la distance horizontale AB mesurée dans le sens du plongement est de 480 m.</p><ol class="steps"><li>Dénivelée : 640 − 520 = 120 m.</li><li>tan δ = 120 / 480 = 0,25.</li><li>δ = arctan(0,25) ≈ <b>14,0°</b>. La couche plonge de A vers B.</li></ol>`,act:'dipcalc'},
{id:'geo3',icon:'🌋',title:'Plis, failles, discordances, intrusions',goal:'Reconnaître les grandes structures sur une carte.',
theory:`<h3>Plis</h3>
<p>Un <b>anticlinal</b> est un pli en voûte : les couches les plus <b>anciennes</b> sont au cœur (après érosion). Un <b>synclinal</b> est un pli en creux : les plus <b>récentes</b> sont au cœur. L'<b>axe</b> du pli peut plonger : les contacts dessinent alors une fermeture en « nez » (pli périclinal).</p>
<h3>Failles</h3>
<p>Une <b>faille</b> est une cassure avec déplacement. Le compartiment supérieur est le <b>toit</b>, l'inférieur le <b>mur</b>. Faille <b>normale</b> : le toit descend (extension). Faille <b>inverse</b> : le toit monte (compression). Sur la carte, les contacts sont <b>décalés</b> le long de la trace de la faille ; plus le plan est incliné vers l'horizontale, plus la trace épouse le relief.</p>
<h3>Discordance angulaire</h3>
<p>Des couches plus jeunes, peu inclinées, reposent sur des couches plus anciennes fortement inclinées : il y a eu <b>déformation puis érosion</b> avant le nouveau dépôt. (Au Maroc, le Trias rouge repose en discordance sur le Paléozoïque plissé en de nombreuses régions.)</p>
<h3>Intrusions</h3>
<p>Un <b>pluton</b> (ex. granite) recoupe les couches, tache irrégulière. Un <b>filon</b> (dyke) vertical est une bande rectiligne étroite ; des filons de dolérites d'environ 200 Ma recoupent des terrains plus anciens au Maroc. Ce qui recoupe est <b>plus récent</b>.</p>
${N('Failles modélisées par un glissement rigide le long du plan, plis à épaisseur constante : des simplifications. Pas de décrochements ni de plis déversés ici.')}`,
example:`<p>Une carte montre, de part et d'autre d'un axe, la même succession symétrique ; au centre affleure le Lias (ancien), sur les bords le Dogger puis le Malm.</p><ol class="steps"><li>Symétrie ⇒ pli.</li><li>Le plus ancien (Lias) est au cœur ⇒ <b>anticlinal</b>.</li><li>Si le cœur avait montré le Crétacé supérieur (récent), ce serait un <b>synclinal</b>.</li></ol>`,act:'geoexplore',actArgs:'data-kinds="anticlinal,synclinal,faille_normale,faille_inverse,discordance,granite,filon"'}]},
m4:{title:'Coupes géologiques',icon:'🧱',lessons:[
{id:'coupe1',icon:'✂️',title:'Construire une coupe géologique',goal:'Passer de la carte à la coupe, étape par étape.',
theory:`<p>Une <b>coupe géologique</b> montre, dans un plan vertical, la structure en profondeur d'après la carte. Elle s'appuie sur un <b>profil topographique</b> (module 2).</p>
<ol class="steps"><li><b>Choisir le trait de coupe</b>, de préférence perpendiculaire à la direction des couches (et recoupant les structures).</li><li><b>Tracer le profil topographique</b> avec la <b>même échelle</b> horizontale et verticale (sinon les pendages sont faussés).</li><li><b>Reporter</b> sur le profil chaque limite (contact, faille) rencontrée par le trait.</li><li><b>Calculer le pendage apparent</b> dans le plan de coupe.</li><li><b>Prolonger les contacts</b> en profondeur avec ce pendage, en conservant l'épaisseur des couches.</li><li><b>Habiller</b> : titre, orientation (ex. SO–NE), échelles, légende, noms des formations.</li></ol>
${E('Exagérer l\'échelle verticale d\'une coupe géologique : les pendages sont redressés et les épaisseurs déformées.')}`,
example:`<p>Un contact affleure à 900 m ; son pendage apparent dans la coupe est de 25° vers la droite.</p><ol class="steps"><li>À 400 m vers la droite, la chute est 400 × tan 25° ≈ 187 m.</li><li>Altitude du contact à cet endroit : 900 − 187 ≈ <b>713 m</b>.</li></ol>`,act:'geosection'},
{id:'coupe2',icon:'🔢',title:'Pendage apparent et interprétation',goal:'Calculer le pendage dans une coupe oblique.',
theory:`<p>Si la coupe n'est pas perpendiculaire à la direction des couches, on y voit un pendage <b>apparent</b> plus faible que le pendage réel.</p>
<div class="formula">tan α′ = tan δ × cos β</div>
<p>δ : pendage réel · β : angle entre le plan de coupe et la direction de plongement · α′ : pendage apparent. Si β = 0°, α′ = δ ; si β = 90° (coupe parallèle à la direction), α′ = 0°.</p>
<h3>Épaisseur</h3><p>Sur terrain plat et coupe ⟂ direction : <b>e = w · sin δ</b>.</p>
<h3>Failles sur la coupe</h3><p>On trace la faille avec son pendage et on décale les contacts de part et d'autre, du rejet mesuré. On indique le sens du mouvement par des demi-flèches.</p>
${R('Le pendage apparent est toujours ≤ pendage réel. Pour lire un pendage réel sur une coupe, il faut qu\'elle soit perpendiculaire à la direction.')}`,
example:`<p>Pendage réel 40° ; coupe faisant 60° avec la direction de plongement.</p><ol class="steps"><li>tan α′ = tan 40° × cos 60° = 0,839 × 0,5 = 0,419.</li><li>α′ = arctan(0,419) ≈ <b>22,8°</b>.</li></ol>`,act:'dipcalc'}]}};
