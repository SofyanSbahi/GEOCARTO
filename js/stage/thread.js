/* Fil du raisonnement du géologue (v3.1, WP2) — le même parcours en six étapes pour toute carte et toute coupe :
     1 Observer · 2 Situer · 3 Mesurer · 4 Dater · 5 Supposer · 6 Vérifier
   Chaque scène d'une leçon « à fil » (lesson.thread = true) déclare l'étape qu'elle exerce (`step`). L'écran projeté montre le fil en bandeau (étape courante
   pleine et numérotée : la couleur ne porte jamais seule) ; la vue présentateur et la fiche imprimable (#/stage/fil) donnent la question qui guide chaque étape.
   STATUT : BROUILLON AUTOMATIQUE — la correspondance scène → étape, les libellés et les questions sont un premier jet à relire par un géologue et à affiner
   avec l'expérience de classe. THREAD_DRAFT passe à false seulement après relecture (nom du relecteur et date dans docs/V3_1_PLAN.md). */
import { t } from './i18n.js';

export const STEPS = ['observe', 'locate', 'measure', 'date', 'suppose', 'verify'];
export const THREAD_DRAFT = true;
/* étape d'une scène : l'un des six identifiants, 'all' (bilan : les six) ou null */
export const stepOf = sc => (sc && sc.step) || null;

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

/* Contenu du bandeau (HTML, hors du SVG : il n'ajoute aucun point focal à la figure). '' si la leçon n'a pas de fil. */
export function threadHtml(L, sc) {
  if (!L || !L.thread) return '';
  const cur = stepOf(sc), all = cur === 'all';
  return `<ol class="st-th-l">${STEPS.map((id, i) =>
    `<li class="st-th${all || id === cur ? ' on' : ''}" data-step="${id}"${id === cur ? ' aria-current="step"' : ''}><b>${i + 1}</b><span>${esc(t('th.' + id))}</span></li>`).join('')}</ol>`;
}

/* Ligne de la vue présentateur : « Fil : étape 3 — Mesurer : quelle direction, quel pendage ? » + mention de brouillon */
export function threadNote(L, sc) {
  const cur = stepOf(sc); if (!L.thread || !cur) return '';
  const line = cur === 'all' ? t('th.pv.all') : t('th.pv', { n: STEPS.indexOf(cur) + 1, label: t('th.' + cur), q: t('th.' + cur + '.q') });
  return line + (THREAD_DRAFT ? ' — ' + t('th.draft') : '');
}

export const FR = {
  'th.title': 'Comment pense un géologue', 'th.aria': 'Fil du raisonnement du géologue',
  'th.lead': 'Les mêmes six questions, pour toute carte et toute coupe. À chaque scène, on sait laquelle on se pose.',
  'th.draft': 'brouillon automatique — à relire par un géologue',
  'th.observe': 'Observer', 'th.observe.q': 'Que vois-je ?', 'th.observe.h': 'Couleurs, contacts, légende, courbes de niveau : rien n’est encore interprété.',
  'th.locate': 'Situer', 'th.locate.q': 'Où passent les contacts par rapport aux courbes ?', 'th.locate.h': 'Un contact qui suit une courbe reste à la même altitude ; un contact qui les croise est incliné.',
  'th.measure': 'Mesurer', 'th.measure.q': 'Quelle direction, quel pendage ?', 'th.measure.h': 'Trois points d’un même contact, leurs altitudes, une construction.',
  'th.date': 'Dater', 'th.date.q': 'Qui est plus ancien, qui est plus jeune ?', 'th.date.h': 'Superposition, sens du pendage, recoupement.',
  'th.suppose': 'Supposer', 'th.suppose.q': 'Quelle structure explique tout cela ?', 'th.suppose.h': 'Tabulaire, monoclinal, pli, discordance, intrusion : une hypothèse, pas une certitude.',
  'th.verify': 'Vérifier', 'th.verify.q': 'La coupe confirme-t-elle ? Qu’est-ce qui ne colle pas ?', 'th.verify.h': 'Une coupe est le test d’une hypothèse, pas un dessin à recopier.',
  'th.pv': 'Fil : étape {n} — {label} : {q}', 'th.pv.all': 'Fil : les six étapes, de l’observation à la vérification',
  'th.card.print': 'Imprimer la fiche', 'th.card.back': 'Retour', 'th.card.hint': 'Indice'
};
