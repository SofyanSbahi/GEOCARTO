/* Pages d'accompagnement de l'enseignant (hors projection) :
   · #/stage/lib   — bibliothèque des malentendus : chaque erreur nommée, sa correction, où elle est testée (vote) ; fréquence locale si des séances existent
   · #/stage/bilan — bilan des séances à partir du journal LOCAL des votes (jamais envoyé) : taux de réussite par question, gain du revote, à revoir, export JSON/CSV
   Aucune donnée d'étudiant n'est collectée : le journal ne contient que des compteurs de votes de la salle. */
import './fr.js';
import './lessons/fr.js';
import { t, has, setLang } from './i18n.js';
import { LESSONS } from './lessons/index.js';
import { loadPrefs, readLog, clearLog } from './tools.js';

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const LET = 'ABCD', sum = a => (a || []).reduce((x, y) => x + y, 0);
const qKey = (L, sc) => `${L.id}.${sc.id}.q`;
const claim = (L, sc) => has(`${L.id}.${sc.id}.claim`) ? t(`${L.id}.${sc.id}.claim`) : sc.id;
const qText = (L, sc) => has(qKey(L, sc)) ? t(qKey(L, sc)) : claim(L, sc);
const sceneNo = (L, sc) => L.scenes.indexOf(sc) + 1;

/* tous les votes du catalogue : { L, sc, opts } */
export function allVotes() { const out = []; LESSONS.forEach(L => L.scenes.forEach(sc => { if (sc.kind === 'vote' && sc.vote) out.push({ L, sc }); })); return out; }
/* malentendus nommés : id → { id, uses:[{L,sc,i}] } */
export function misconceptions() {
  const m = new Map();
  allVotes().forEach(({ L, sc }) => sc.vote.opts.forEach((o, i) => { if (o.mis) { if (!m.has(o.mis)) m.set(o.mis, { id: o.mis, uses: [] }); m.get(o.mis).uses.push({ L, sc, i }); } }));
  return [...m.values()];
}
/* agrège le journal : par (leçon, scène) → { n séances, pct de bonnes réponses, votes par option, gain du revote } */
export function aggregate(log) {
  const g = new Map();
  log.forEach(e => {
    const k = e.lesson + '/' + e.scene, a = g.get(k) || { lesson: e.lesson, scene: e.scene, n: 0, tot: 0, good: 0, opts: [], gains: [] };
    const s = sum(e.votes); if (!s) { g.set(k, a); return; }
    a.n++; a.tot += s; a.good += e.votes[e.ok] || 0; e.votes.forEach((v, i) => a.opts[i] = (a.opts[i] || 0) + v);
    if (e.pre && sum(e.pre)) a.gains.push(100 * (e.votes[e.ok] || 0) / s - 100 * (e.pre[e.ok] || 0) / sum(e.pre));
    g.set(k, a);
  });
  return [...g.values()].filter(a => a.tot).map(a => ({ ...a, pct: Math.round(100 * a.good / a.tot), gain: a.gains.length ? Math.round(a.gains.reduce((x, y) => x + y, 0) / a.gains.length) : null }));
}
const find = (lesson, scene) => { const L = LESSONS.find(l => l.id === lesson); const sc = L && L.scenes.find(s => s.id === scene); return L && sc ? { L, sc } : null; };

export function mountLib(root) {
  setLang(loadPrefs().lang || 'fr');
  const ag = new Map(aggregate(readLog()).map(a => [a.lesson + '/' + a.scene, a]));
  const items = misconceptions().map(m => {
    const freq = m.uses.reduce((s, u) => { const a = ag.get(u.L.id + '/' + u.sc.id); return s + (a && a.opts[u.i] || 0); }, 0);
    return { ...m, freq, name: t('mis.' + m.id), why: t('mis.' + m.id + '.why') };
  });
  items.sort((a, b) => b.freq - a.freq || a.name.localeCompare(b.name, 'fr'));
  const card = m => `<article class="st-lib-c"><h3>${esc(m.name)}${m.freq ? `<span class="st-lib-f">${m.freq} ${t('lib.chosen')}</span>` : ''}</h3><p class="st-lib-why">${esc(m.why)}</p><ul>${m.uses.map(u => `<li><a href="#/stage/${u.L.id}/${sceneNo(u.L, u.sc)}">${esc(t('topic.' + (u.L.title || '').replace('topic.', '')))} · ${esc(qText(u.L, u.sc))}</a> <kbd>${LET[u.i]}</kbd></li>`).join('')}</ul></article>`;
  root.innerHTML = `<h1>📚 ${t('lib.title')}</h1><p class="lead">${t('lib.lead', { n: items.length })}</p><p><a class="btn" href="#/stage">← ${t('ix.title')}</a> <a class="btn" href="#/stage/bilan">${t('bilan.title')}</a></p><div class="st-lib">${items.map(card).join('')}</div>`;
}

export function mountBilan(root) {
  setLang(loadPrefs().lang || 'fr');
  const log = readLog(), rows = aggregate(log).map(a => ({ ...a, f: find(a.lesson, a.scene) })).filter(r => r.f);
  const sessions = new Set(log.map(e => new Date(e.ts).toISOString().slice(0, 10) + e.lesson)).size;
  const weak = [...rows].filter(r => r.tot >= 5).sort((a, b) => a.pct - b.pct).slice(0, 5);
  const tr = r => { const ok = r.f.sc.vote.opts.findIndex(o => o.ok), top = r.f.sc.vote.opts.map((o, i) => [o, i]).filter(([o]) => !o.ok && r.opts[ r.f.sc.vote.opts.indexOf(o)]).sort((a, b) => (r.opts[b[1]] || 0) - (r.opts[a[1]] || 0))[0];
    return `<tr><td><a href="#/stage/${r.lesson}/${sceneNo(r.f.L, r.f.sc)}">${esc(qText(r.f.L, r.f.sc))}</a></td><td class="n">${r.tot}</td><td><span class="st-bar"><i style="width:${r.pct}%" class="${r.pct < 30 ? 'lo' : r.pct > 70 ? 'hi' : 'mid'}"></i></span> <b>${r.pct} %</b></td><td class="n">${r.gain == null ? '—' : (r.gain > 0 ? '+' : '') + r.gain + ' pts'}</td><td>${top && top[0].mis ? esc(t('mis.' + top[0].mis)) : '—'}</td></tr>`; };
  root.innerHTML = `<h1>📊 ${t('bilan.title')}</h1><p class="lead">${t('bilan.lead')}</p>
  <p><a class="btn" href="#/stage">← ${t('ix.title')}</a> <a class="btn" href="#/stage/lib">${t('lib.title')}</a></p>
  ${rows.length ? `<div class="st-kpi"><div><b>${log.length}</b><span>${t('bilan.votes')}</span></div><div><b>${sessions}</b><span>${t('bilan.sessions')}</span></div><div><b>${rows.length ? Math.round(rows.reduce((s, r) => s + r.pct * r.tot, 0) / rows.reduce((s, r) => s + r.tot, 0)) : 0} %</b><span>${t('bilan.avg')}</span></div></div>
  ${weak.length ? `<h2>${t('bilan.weak')}</h2><ol class="st-weak">${weak.map(r => `<li><a href="#/stage/${r.lesson}/${sceneNo(r.f.L, r.f.sc)}">${esc(qText(r.f.L, r.f.sc))}</a> — <b>${r.pct} %</b></li>`).join('')}</ol>` : ''}
  <h2>${t('bilan.all')}</h2><table class="st-tab"><thead><tr><th>${t('bilan.q')}</th><th>${t('bilan.n')}</th><th>${t('bilan.ok')}</th><th>${t('bilan.gain')}</th><th>${t('bilan.mis')}</th></tr></thead><tbody>${rows.map(tr).join('')}</tbody></table>
  <p class="st-note">${t('bilan.note')}</p>
  <p><button class="btn" id="bJson">JSON</button> <button class="btn" id="bCsv">CSV</button> <button class="btn" id="bClr">${t('bilan.clear')}</button></p>` : `<div class="box tip"><b class="t">💡</b>${t('bilan.empty')}</div>`}`;
  const dl = (name, mime, data) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([data], { type: mime })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); };
  const q = s => '"' + String(s).replace(/"/g, '""') + '"';
  const j = root.querySelector('#bJson'); if (!j) return;
  j.onclick = () => dl('geocarto-bilan.json', 'application/json', JSON.stringify({ exporte: new Date().toISOString(), journal: log, synthese: rows.map(({ f, ...r }) => r) }, null, 1));
  root.querySelector('#bCsv').onclick = () => dl('geocarto-bilan.csv', 'text/csv', ['lecon;scene;votes;bonnes_reponses_pct;gain_revote_pts;A;B;C;D'].concat(rows.map(r => [r.lesson, r.scene, r.tot, r.pct, r.gain == null ? '' : r.gain, ...[0, 1, 2, 3].map(i => r.opts[i] || 0)].join(';'))).join('\n'));
  root.querySelector('#bClr').onclick = () => { if (confirm(t('bilan.confirm'))) { clearLog(); mountBilan(root); } };
}
