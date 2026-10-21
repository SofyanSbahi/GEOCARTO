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
export const fmtClock = s => { s = Math.max(0, Math.ceil(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
/* texte d'exercice du moteur → texte sûr : on retire les balises sauf <b>, et les <details> (légendes) */
export const safeHtml = s => String(s).replace(/<details[\s\S]*?<\/details>/g, '').replace(/<(?!\/?b>)[^>]*>/g, '').replace(/&nbsp;/g, ' ');
export const plain = s => safeHtml(s).replace(/<[^>]*>/g, '');
export const words = s => plain(s).trim().split(/\s+/).filter(Boolean).length;
/* nombre de séquences « passives » consécutives avant la séquence i (hook/vote/practice = actives) */
export function passiveRun(kinds, i, active) { let n = 0; for (let k = i; k >= 0 && !active.has(kinds[k]); k--) n++; return n; }

export const clearLog = () => { try { localStorage.removeItem(LOG); } catch (e) { } };
/* Instruction par les pairs (Mazur) : selon la part de bonnes réponses, que faire ? low < 30 % → réexpliquer ; mid 30–70 % → discuter par deux puis revoter ; high > 70 % → passer. */
export function mazur(tot, ok) {
  const sum = (tot || []).reduce((a, b) => a + b, 0); if (!sum || ok < 0) return null;
  const pct = Math.round(100 * (tot[ok] || 0) / sum);
  return { pct, n: sum, band: pct < 30 ? 'low' : pct <= 70 ? 'mid' : 'high' };
}
