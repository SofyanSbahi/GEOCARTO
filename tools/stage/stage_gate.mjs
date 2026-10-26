#!/usr/bin/env node
/* Porte de qualité « projection » du mode Stage — mesure sur rendu réel (Chromium + Playwright). Complète les tests Node (tests/*.test.js), qui ne
   voient ni la mise en page ni le DOM.
   Pour chaque leçon demandée, chaque scène, chaque étape (votes simulés), sur plusieurs formats d'écran et échelles de salle :
     · V1 (WP0)  l'ordre des options est mélangé ET cohérent : la carte lettrée « A » reçoit bien le vote de la touche a ; la carte cochée à la
                 correction porte la lettre annoncée dans la légende.
     · L4        aucun texte hors de sa carte de vote ; aucune bulle recouvrant le texte d'un autre élément ; aucun rognage horizontal ;
                 légende non tronquée.
     · L5        figure ≥ 50 % de la hauteur d'écran (≥ 45 % en 4:3 / 5:4) sur tout écran de vote, à toute échelle de salle.
     · L1        légende ≥ 4,2 % de la hauteur d'écran ; compteur de votes ≥ 3,8 % ; chiffres du minuteur ≥ 5 %.
   Usage : python3 -m http.server 8765  (à la racine du dépôt)  puis  node tools/stage/stage_gate.mjs [--url http://localhost:8765/index.html]
           [--lessons geocarte,coupe] [--rs 0.8,1,1.5,2.5] [--views 1920x1080,1024x768] [--quick]
   Playwright : doit être résolvable (npm i -D playwright, ou NODE_PATH / PLAYWRIGHT_PATH vers un dossier node_modules). CHROMIUM_PATH : navigateur à utiliser.
   Code de retour ≠ 0 s'il y a un défaut. */
import { createRequire } from 'node:module';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : d; };
const URL_ = arg('url', 'http://localhost:8765/index.html');
const quick = process.argv.includes('--quick');
const LESSONS = arg('lessons', 'geocarte,coupe').split(',');
const RS = arg('rs', quick ? '1,1.5,2.5' : '0.8,1,1.5,2.5').split(',').map(Number);
const VIEWS = arg('views', quick ? '1920x1080,1024x768' : '1920x1080,1280x800,1024x768,1280x1024').split(',').map(v => v.split('x').map(Number));

async function loadPlaywright() {
  const tries = [() => import('playwright'), () => createRequire(process.cwd() + '/')('playwright'), () => createRequire((process.env.PLAYWRIGHT_PATH || '/opt/node22/lib/node_modules') + '/')('playwright')];
  for (const f of tries) { try { const m = await f(); return m.chromium ? m : m.default; } catch (e) { /* suivant */ } }
  console.error('Playwright introuvable : npm i -D playwright, ou PLAYWRIGHT_PATH=/chemin/vers/node_modules'); process.exit(2);
}

/* ---- mesures exécutées dans la page ---- */
const PROBE = () => {
  const svg = document.querySelector('#lSvg'), fig = document.querySelector('#lFig').getBoundingClientRect(), k = svg.getScreenCTM().a, H = innerHeight;
  const out = { cardOverflow: [], calloutOverText: [] };
  svg.querySelectorAll('[data-vote]').forEach(g => {
    const r = g.querySelector('rect').getBoundingClientRect();
    g.querySelectorAll('text').forEach(t => { if (!t.textContent.trim()) return; const b = t.getBoundingClientRect(); if (b.bottom > r.bottom + 1 || b.top < r.top - 1 || b.right > r.right + 1) out.cardOverflow.push(t.textContent.trim().slice(0, 24)); });
  });
  svg.querySelectorAll('rect.fp').forEach(rc => {
    const b = rc.getBoundingClientRect(); if (b.width < 30 * k) return;
    svg.querySelectorAll('text').forEach(t => { if (!t.textContent.trim()) return; const q = t.getBoundingClientRect(), cx = q.left + q.width / 2, cy = q.top + q.height / 2;
      if (cx >= b.left && cx <= b.right && cy >= b.top && cy <= b.bottom) return;      // le texte de la bulle elle-même
      const ix = Math.min(b.right, q.right) - Math.max(b.left, q.left), iy = Math.min(b.bottom, q.bottom) - Math.max(b.top, q.top);
      if (ix > 2 && iy > 2) out.calloutOverText.push(t.textContent.trim().slice(0, 14)); });
  });
  const cap = document.querySelector('#lCap'), capBox = document.querySelector('.st-l-cap');
  out.capClipped = cap.scrollHeight > capBox.clientHeight + 1;
  out.capPct = parseFloat(getComputedStyle(cap).fontSize) / H * 100;
  out.capWidth = cap.getBoundingClientRect().width / innerWidth;
  out.figPct = fig.height / H * 100;
  out.hOut = [...document.querySelectorAll('.st-l-top > *, #lSide > *, #lCap')].some(e => { const r = e.getBoundingClientRect(); return r.right > innerWidth + 1 || r.left < -1; });
  const tal = document.querySelector('.st-l-tally'); out.tallyPct = tal ? parseFloat(getComputedStyle(tal).fontSize) / H * 100 : null;
  const tim = document.querySelector('.st-l-timer b'); out.timerPct = tim ? parseFloat(getComputedStyle(tim).fontSize) / H * 100 : null;
  out.hasBanner = !!document.querySelector('#lSide .st-l-pi');
  out.railOut = document.querySelector('#lRail').getBoundingClientRect().bottom > innerHeight + 1;
  out.headPct = document.querySelector('.st-l-top').getBoundingClientRect().height / H * 100;
  return out;
};
/* cartes d'un vote : [{ letter, count, ok }] dans l'ordre affiché */
const CARDS = () => [...document.querySelectorAll('#lSvg [data-vote]')].map(g => {
  const ts = [...g.querySelectorAll('text')].map(t => t.textContent.trim()), bg = g.querySelector('rect').getAttribute('fill');
  return { letter: ts[0], count: ts.length > 1 ? ts[ts.length - 1] : null, ok: bg === '#e3f5ea', dim: g.classList.contains('dim') };
});

const { chromium } = await loadPlaywright();
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const fails = [], seen = { screens: 0, votes: 0 }, perCfg = {};
const fail = (cfg, id, msg) => { fails.push(`${cfg} · ${id} : ${msg}`); (perCfg[cfg] ||= { n: 0, bad: 0 }).bad++; };

for (const [W, H] of VIEWS) for (const rs of RS) {
  const cfg = `${W}×${H} ×${rs}`, aspect = W / H, minFig = aspect < 1.5 ? 45 : 50; perCfg[cfg] ||= { n: 0, bad: 0 };
  const pg = await browser.newPage({ viewport: { width: W, height: H } }), errs = []; pg.on('pageerror', e => errs.push(String(e)));
  await pg.goto(URL_); await pg.evaluate(rs => localStorage.setItem('gc_stage', JSON.stringify({ rs })), rs);
  for (const L of LESSONS) {
    await pg.goto(`${URL_}#/stage/${L}/1`); await pg.reload(); await pg.waitForSelector('.st-l');
    const nsc = await pg.evaluate(() => document.querySelectorAll('.st-l-dot').length);
    for (let sc = 1; sc <= nsc; sc++) {
      await pg.evaluate(() => (location.hash = '#/stage')); await pg.waitForTimeout(30);
      await pg.evaluate(([L, sc]) => (location.hash = `#/stage/${L}/${sc}`), [L, sc]); await pg.waitForSelector('.st-l'); await pg.waitForTimeout(100);
      const kind = await pg.evaluate(() => document.querySelector('#lKind').dataset.kind);
      for (let k = 0; k < 14; k++) {
        await pg.waitForTimeout(quick ? 120 : 220);
        const id = `${L}/${sc}.${k}`; let vote = null;
        if (kind === 'vote' && k === 1) {                         // main levée : 5 × a, 4 × b, 2 × c, 1 × d ; on vérifie que la carte « A » a bien reçu les votes de la touche a
          for (const key of 'aaaaabbbbccd') await pg.keyboard.press(key);
          await pg.waitForTimeout(120); const cards = await pg.evaluate(CARDS); seen.votes++;
          const want = { A: '5', B: '4', C: '2', D: '1' };
          cards.forEach(c => { if (want[c.letter] !== c.count) fail(cfg, id, `V1 la carte ${c.letter} affiche ${c.count} au lieu de ${want[c.letter]} (touche ≠ lettre affichée)`); });
        }
        const r = await pg.evaluate(PROBE); seen.screens++; perCfg[cfg].n++;
        if (kind === 'vote' && k >= 2) {                           // correction : la carte cochée porte la lettre annoncée par la légende
          const cards = await pg.evaluate(CARDS), capLetter = await pg.evaluate(() => (document.querySelector('#lCap .st-l-ok') || {}).textContent?.trim()[0]);
          const okCard = cards.find(c => c.ok); if (!okCard || okCard.letter !== capLetter) fail(cfg, id, `V1 carte correcte ${okCard && okCard.letter} ≠ lettre de la légende ${capLetter}`);
        }
        if (r.cardOverflow.length) fail(cfg, id, `L4 texte hors de sa carte : ${r.cardOverflow.slice(0, 2).join(' | ')}`);
        if (r.calloutOverText.length) fail(cfg, id, `L4 bulle sur le texte « ${r.calloutOverText[0]} »`);
        if (r.hOut) fail(cfg, id, 'L4 rognage horizontal');
        if (r.capClipped) fail(cfg, id, 'L4 légende tronquée');
        if (r.railOut) fail(cfg, id, 'L4 le rail de navigation sort de l\'écran');
        if (r.headPct > 12.5) fail(cfg, id, `L4 titre trop haut (${r.headPct.toFixed(0)} % de l\'écran)`);
        if (r.capWidth < .4) fail(cfg, id, `L4 légende écrasée (${Math.round(r.capWidth * 100)} % de la largeur)`);
        if (r.hasBanner) fail(cfg, id, 'L4 le bandeau d\'instruction est de retour sur l\'écran projeté');
        if (kind === 'vote' && r.figPct < minFig) fail(cfg, id, `L5 figure ${r.figPct.toFixed(0)} % < ${minFig} %`);
        if (r.capPct < 4.2 - .05 && rs >= 1) fail(cfg, id, `L1 légende ${r.capPct.toFixed(1)} % < 4,2 %`);
        if (rs >= 1 && r.tallyPct != null && r.tallyPct < 3.8 - .05) fail(cfg, id, `L1 compteur ${r.tallyPct.toFixed(1)} % < 3,8 %`);
        if (rs >= 1 && r.timerPct != null && r.timerPct < 5) fail(cfg, id, `L1 minuteur ${r.timerPct.toFixed(1)} % < 5 %`);
        const before = await pg.evaluate(() => document.querySelector('#lN').textContent);
        await pg.keyboard.press('ArrowRight'); await pg.waitForTimeout(50);
        const after = await pg.evaluate(() => document.querySelector('#lN') ? document.querySelector('#lN').textContent : 'gone');
        if (after !== before) break;
      }
    }
  }
  if (errs.length) fail(cfg, 'js', `erreurs JS : ${errs[0]}`);
  await pg.close();
}
await browser.close();
console.log(`${seen.screens} écrans, ${seen.votes} votes simulés, ${VIEWS.length} format(s) × ${RS.length} échelle(s) de salle, leçons : ${LESSONS.join(', ')}\n`);
for (const [cfg, v] of Object.entries(perCfg)) console.log(`${cfg.padEnd(18)} ${String(v.n).padStart(4)} écrans · ${v.bad ? v.bad + ' défaut(s)' : 'OK'}`);
if (fails.length) {
  /* regroupé par format/échelle et par type de défaut, avec quelques exemples */
  const groups = new Map();
  for (const f of fails) { const m = f.match(/^(.*?) · (\S+) : (\S+(?: \S+)?)/); const key = `${m[1]} · ${m[3]}`; const g = groups.get(key) || { n: 0, ex: [] }; g.n++; if (g.ex.length < 3) g.ex.push(m[2]); groups.set(key, g); }
  console.log('\nDÉFAUTS (' + fails.length + ') par format · échelle · type :');
  for (const [k, g] of groups) console.log(`  ${String(g.n).padStart(3)} × ${k}   ex. ${g.ex.join(', ')}`);
  process.exit(1);
}
console.log('\nRÉSULTAT : OK');
