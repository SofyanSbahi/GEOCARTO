/* Outils partagés du mode Stage (projection v1 « decks » ET leçons v2). Aucun accès au DOM de l'application d'origine. */
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const TAN10 = Math.tan(10 / 60 * Math.PI / 180);
/* Taille de texte recommandée pour qu'une lettre soit lue à 10' d'arc depuis le dernier rang (limite d'acuité standard 5' × 2 pour le confort). */
export function recommendedScale(widthM, distM, baseLabelPct = 2.5) {
  const cap = distM * TAN10, font = cap / .72, H = widthM * 9 / 16, pct = font / H * 100;
  return { pct, scale: clamp(pct / baseLabelPct, .8, 2.5) };
}
const KEY = 'gc_stage', LOG = 'gc_stage_log';
export const loadPrefs = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
export const savePrefs = o => { try { localStorage.setItem(KEY, JSON.stringify({ ...loadPrefs(), ...o })); } catch (e) { } };
/* journal local des votes (jamais envoyé nulle part) : { lesson, scene, votes:[…], ok, ts } — 200 dernières entrées */
export function logVote(entry) {
  try { const a = JSON.parse(localStorage.getItem(LOG)) || []; a.push({ ...entry, ts: Date.now() }); localStorage.setItem(LOG, JSON.stringify(a.slice(-200))); } catch (e) { }
}
export const readLog = () => { try { return JSON.parse(localStorage.getItem(LOG)) || []; } catch (e) { return []; } };
/* unité d'écran : 1 % de la hauteur (ou de la largeur en portrait) × facteur de salle */
export const unitPx = rs => (innerWidth / innerHeight < 1.25 ? innerWidth * .0072 : innerHeight * .01) * rs;

/* Le « chrome » (bandeau, légende, rail, boutons) ne doit pas manger la figure quand on agrandit la salle : son unité suit l'échelle de salle
   jusqu'à CHROME_MAX × l'unité de base, puis plafonne. Au-delà, c'est la FIGURE qui grossit (elle occupe la place libérée) et son texte
   suit le facteur de salle de kit.js. Audit v3.1 : sans plafond, la figure d'un vote tombait à 19–49 % de la hauteur d'écran à ×1,3 et
   à 1–15 % à ×1,5 (toutes leçons). 1,45 ≈ 7 % de la hauteur d'écran pour une ligne de légende : lisible à 30 m d'un écran de 4 m. */
export const CHROME_MAX = 1.45;
/* Plafond de largeur : l'unité est liée à la HAUTEUR d'écran ; sur un écran moins large (5:4, 4:3) le bandeau d'en-tête (pastille, titre, compteur) manque de
   place avant d'avoir atteint CHROME_MAX (audit v3.1 : à 1280×1024 ×1,5 le compteur sortait de l'écran). 0,95 % de la largeur ne change rien en 16:9. */
export const CHROME_W = .0095;
export const chromeUnit = (u, u1, w = Infinity) => Math.min(u, u1 * CHROME_MAX, w * CHROME_W);
export const fmtClock = s => { s = Math.max(0, Math.ceil(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
/* texte d'exercice du moteur → texte sûr : on retire les balises sauf <b>, et les <details> (légendes) */
export const safeHtml = s => String(s).replace(/<details[\s\S]*?<\/details>/g, '').replace(/<(?!\/?b>)[^>]*>/g, '').replace(/&nbsp;/g, ' ');
export const plain = s => safeHtml(s).replace(/<[^>]*>/g, '');
export const words = s => plain(s).trim().split(/\s+/).filter(Boolean).length;
/* nombre de séquences « passives » consécutives avant la séquence i (hook/vote/practice = actives) */
export function passiveRun(kinds, i, active) { let n = 0; for (let k = i; k >= 0 && !active.has(kinds[k]); k--) n++; return n; }

export const clearLog = () => { try { localStorage.removeItem(LOG); } catch (e) { } };
/* Ordre d'affichage des options d'un vote.
   Avant v3.1 les options s'affichaient dans l'ordre d'écriture : la bonne réponse était « A » dans 16 votes sur 20 (tous ceux de géologie).
   Désormais l'ordre est une permutation déterministe de (clé de scène, graine de séance) : stable pendant la séance et identique sur
   l'écran projeté et la vue présentateur, différente d'une scène à l'autre. perm[d] = index canonique de l'option affichée à la position d.
   Les décomptes, le journal et le bilan restent en ordre CANONIQUE : seule la lettre montrée à la salle est traduite.
   fixed = true : ordre d'écriture conservé — à réserver aux cas où la pédagogie l'exige (à justifier dans le code de la scène). */
const hash32 = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
export function optionOrder(n, key, seed = 0, fixed = false) {
  const perm = Array.from({ length: n }, (_, i) => i);
  if (fixed || n < 2) return perm;
  let a = hash32(key + '|' + seed) || 1;
  const rnd = () => { a = (a + 0x6D2B79F5) | 0; let x = Math.imul(a ^ (a >>> 15), 1 | a); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [perm[i], perm[j]] = [perm[j], perm[i]]; }
  return perm;
}
/* inverse : inv[c] = position (lettre) où s'affiche l'option canonique c */
export const invertOrder = perm => { const inv = []; perm.forEach((c, d) => { inv[c] = d; }); return inv; };

/* Instruction par les pairs (Mazur) : selon la part de bonnes réponses, que faire ? low < 30 % → réexpliquer ; mid 30–70 % → discuter par deux puis revoter ; high > 70 % → passer. */
export function mazur(tot, ok) {
  const sum = (tot || []).reduce((a, b) => a + b, 0); if (!sum || ok < 0) return null;
  const pct = Math.round(100 * (tot[ok] || 0) / sum);
  return { pct, n: sum, band: pct < 30 ? 'low' : pct <= 70 ? 'mid' : 'high' };
}
