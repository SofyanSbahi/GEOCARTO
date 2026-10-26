import {W} from './basic.js';
import {h} from '../core/util.js';
import {lessonDone,state} from '../core/store.js';
import {pickExo,mountExo} from '../pages/exos.js';
W.selfeval=el=>{const items=['L\'échelle des longueurs = celle de la carte (indiquée)','L\'échelle des hauteurs est indiquée et l\'exagération connue','L\'origine des altitudes est juste sous le point le plus bas','Chaque intersection avec une courbe est reportée avec sa bonne altitude','Les sommets et fonds de talweg entre deux points sont estimés','Le tracé est lissé, à main levée, continu de A à B','A et B portent leurs altitudes et coordonnées','Orientation du profil (rose des vents) indiquée','Localisation du trait sur un schéma 2 × 2 cm','Titre, nom de la carte, échelle, nom de l\'étudiant']
 el.innerHTML=`<h3>Grille d'auto-évaluation</h3>${items.map((t,i)=>`<label class="opt" style="display:flex;gap:10px"><input type="checkbox"> ${t}</label>`).join('')}<div class="fb" id="r"></div>`;
 el.onchange=()=>{const n=el.querySelectorAll('input:checked').length;el.querySelector('#r').className='fb '+(n>=9?'ok':'ko');el.querySelector('#r').textContent=`${n}/10 critères validés `+(n===10?'– ton profil est prêt ! 🎉':'');if(n===10)lessonDone('m2/auto')}};
W.exo=el=>{mountExo(el,el.dataset.skill)};
export {W};
