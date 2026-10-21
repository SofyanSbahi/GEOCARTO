/* WP1 (v3.1) — robustesse de la mise en page en salle / en amphi / en 4:3.
   Audit du 2026-10-21 : à l'étape de décompte d'un vote, la figure tombait à 19–49 % de la hauteur d'écran à ×1,3 et à 1–15 % à ×1,5 (toutes les leçons) ;
   en 4:3 le texte des options débordait de sa carte ; des bulles recouvraient les schémas. Ces tests verrouillent la logique pure et les règles CSS ;
   la mesure sur rendu réel est faite par tools/stage/stage_gate.mjs (Chromium). */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { t } from '../js/stage/i18n.js';
import '../js/stage/lessons/fr.js';
import * as K from '../js/stage/kit.js';
import { callout } from '../js/stage/lessons/geomap.js';
import { SEC } from '../js/stage/lessons/coupe.js';
import { LESSONS } from '../js/stage/lessons/index.js';
import { chromeUnit, CHROME_MAX, CHROME_W } from '../js/stage/tools.js';

const ROOMS = [.8, 1, 1.2, 1.3, 1.5, 2, 2.5], ASPECTS = [16 / 9, 16 / 10, 4 / 3, 5 / 4];
const css = fs.readFileSync(new URL('../css/stage.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const lessonSrc = fs.readFileSync(new URL('../js/stage/lesson.js', import.meta.url), 'utf8');

test('unité du chrome : suit la salle jusqu\'à CHROME_MAX puis plafonne (la figure garde sa place)', () => {
  const u1 = 10.8;
  for (const rs of ROOMS) {
    const u = u1 * rs, c = chromeUnit(u, u1);
    assert.ok(c <= u + 1e-9);
    if (rs <= CHROME_MAX) assert.equal(c, u, `à ×${rs} le chrome doit rester inchangé`);
    else assert.ok(Math.abs(c - u1 * CHROME_MAX) < 1e-9, `à ×${rs} le chrome doit plafonner à ×${CHROME_MAX}`);
  }
  let prev = 0; for (const rs of ROOMS) { const c = chromeUnit(u1 * rs, u1); assert.ok(c >= prev); prev = c; }
  assert.ok(CHROME_MAX >= 1.3 && CHROME_MAX <= 1.6, 'plafond hors de la plage validée sur rendu (1,3–1,6)');
});

test('unité du chrome : plafonnée aussi par la LARGEUR (5:4, 4:3), sans effet en 16:9', () => {
  const sizes = [[1920, 1080], [1280, 800], [1024, 768], [1280, 1024]];
  for (const [w, h] of sizes) for (const rs of ROOMS) {
    const u1 = h * .01, c = chromeUnit(u1 * rs, u1, w);
    assert.ok(c <= w * CHROME_W + 1e-9, `${w}×${h} ×${rs} : chrome ${c.toFixed(1)} px > ${(w * CHROME_W).toFixed(1)}`);
    assert.ok(c <= u1 * CHROME_MAX + 1e-9);
  }
  for (const rs of [1, CHROME_MAX]) assert.equal(chromeUnit(10.8 * rs, 10.8, 1920), 10.8 * rs, 'en 16:9 le plafond de largeur ne doit rien changer jusqu\'à CHROME_MAX');
  assert.equal(chromeUnit(10.24, 10.24, 1280), 10.24, '5:4 ×1 : inchangé');
});

test('toutes les règles .st-l utilisent l\'unité plafonnée --uc (jamais --u, qui grossit sans limite)', () => {
  const bad = []; for (const m of css.matchAll(/(^|[};])\s*(\.st-l(?![a-z])[^{}]*)\{([^}]*)\}/g)) if (/var\(--u\)/.test(m[3])) bad.push(m[2].trim());
  assert.deepEqual(bad, []);
});

test('mise en page : rangée de figure ≥ 46 % de la hauteur, légende ≤ 24 %, titre ≤ 12 %', () => {
  assert.match(css, /\.st-l\{[^}]*grid-template-rows:auto minmax\(46vh,1fr\) auto auto/);
  assert.match(css, /\.st-l-cap\{[^}]*max-height:24vh/);
  assert.match(css, /\.st-l-top\{[^}]*max-height:12vh/);
  assert.match(lessonSrc, /fitClaim\(\$\('#lClaim'\), uc\)/, 'le titre doit être ajusté à son budget');
  assert.match(lessonSrc, /fitCaption\(\$\('#lCap'\), capVariants, uc\)/, 'la légende doit être ajustée à son budget');
});

test('textes projetés du chrome ≥ 3,8 u (bandeau d\'en-tête, compteur, paramètre) ; minuteur ≥ 5 u', () => {
  const size = sel => { const m = css.match(new RegExp(sel.replace(/[.[\]]/g, '\\$&') + '\\{[^}]*?font-size:calc\\(var\\(--uc\\)\\*([\\d.]+)\\)')); assert.ok(m, sel + ' : taille introuvable'); return +m[1]; };
  for (const s of ['.st-l-kind', '.st-l-n', '.st-l-tally', '.st-l-pv']) assert.ok(size(s) >= 3.8, `${s} : ${size(s)} u < 3,8 u`);
  assert.ok(size('.st-l-timer b') >= 5, 'chiffres du minuteur < 5 u');
});

test('le bandeau « instruction par les pairs » n\'est plus projeté : il reste dans la vue présentateur', () => {
  const [mount, presenter] = lessonSrc.split('function mountPresenter');
  assert.ok(presenter && /st-l-pi/.test(presenter), 'la vue présentateur doit garder le bandeau');
  assert.ok(!/class="st-l-pi/.test(mount), 'le bandeau ne doit plus être émis dans l\'écran projeté');
});

test('indication enseignant (touche I) : textes courts, présents, et touche déclarée', () => {
  for (const b of ['low', 'mid', 'high']) { const s = t('pi.s.' + b); assert.notEqual(s, 'pi.s.' + b); assert.ok(s.length <= 24, `pi.s.${b} trop long (${s.length})`); }
  assert.notEqual(t('lk.h.hint'), 'lk.h.hint');
  assert.match(lessonSrc, /i: 'hint', I: 'hint'/);
});

test('fitBox : chaque option de vote tient dans sa carte (largeur ET hauteur) à toutes les tailles de salle et tous les formats', () => {
  const labels = [];
  for (const L of LESSONS) { const ctx = L.setup ? L.setup(L.seed || 1) : {}; for (const sc of L.scenes) if (sc.kind === 'vote' && sc.vote) {
    const X = { t, ctx, pi: 0, seed: L.seed || 1, scene: sc, lesson: L, nf: n => String(n) };
    sc.vote.opts.forEach((o, i) => labels.push([`${L.id}.${sc.id}.o${i}`, sc.vote.label ? sc.vote.label(i, X) : t(`${L.id}.${sc.id}.o${i}`)])); } }
  assert.ok(labels.length >= 70);
  const ch = (66 - 3 * 1.6) / 4, H = ch - 4.6;          // carte de vote à 4 options, zone des barres de résultat déduite (voir voteFig)
  for (const rs of ROOMS) for (const asp of ASPECTS) { K.room(rs, asp);
    for (const [id, label] of labels) { const f = K.fitBox(label, 37, H, 4.2, 2);
      assert.ok(f.lines.length <= 2, `${id} ×${rs} ${asp.toFixed(2)} : ${f.lines.length} lignes`);
      assert.ok(f.size >= K.MIN - 1e-9);
      assert.ok(f.lines.length * f.size * 1.16 <= H + 1e-9, `${id} ×${rs} ${asp.toFixed(2)} : hauteur ${(f.lines.length * f.size * 1.16).toFixed(1)} > ${H.toFixed(1)}`); } }
  K.room(1, 16 / 9);
});

const rectOf = svg => { const m = svg.match(/<rect x="([\d.-]+)" y="([\d.-]+)" width="([\d.-]+)" height="([\d.-]+)"[^>]*class="[^"]*fp/); assert.ok(m, 'bulle introuvable'); return { x: +m[1], y: +m[2], w: +m[3], h: +m[4] }; };
const keysOf = re => { const src = [fs.readFileSync(new URL('../js/stage/lessons/geologie.js', import.meta.url), 'utf8'), fs.readFileSync(new URL('../js/stage/lessons/coupe.js', import.meta.url), 'utf8')].join('\n'); return [...new Set([...src.matchAll(re)].map(m => m[1]))]; };

test('bulles de la colonne de droite : jamais au-dessus de la légende (y ≥ 41), hauteur bornée', () => {
  const keys = keysOf(/'(geocarte\.[a-z]+\.t\d)'\s*:/g); assert.ok(keys.length >= 15, 'clés de bulles non trouvées');
  for (const rs of ROOMS) for (const asp of ASPECTS) { K.room(rs, asp);
    for (const k of keys) { const r = rectOf(callout(132, 57, t(k), { top: 41 }));
      assert.ok(r.y >= 41 - 1e-6, `${k} ×${rs} ${asp.toFixed(2)} : bulle à y=${r.y.toFixed(1)}`); assert.ok(r.y + r.h <= 69 + 1e-6); } }
  K.room(1, 16 / 9);
});

test('bandeau du bas : borné à 24 u, et le bas des coupes (SEC) lui laisse sa place à toutes les tailles', () => {
  const keys = keysOf(/'(coupe\.[a-z]+\.t\d[a-z]?)'\s*:/g); assert.ok(keys.length >= 15, 'clés de bandeaux non trouvées');
  for (const rs of ROOMS) for (const asp of ASPECTS) { K.room(rs, asp);
    for (const k of keys) { const r = rectOf(callout(80, 61, t(k, { n: 2, m: 31, a: 31, b: 60 }), { w: 122, lines: 2, size: 5.4, maxH: 24 }));
      assert.ok(r.h <= 24 + 1e-6, `${k} ×${rs} ${asp.toFixed(2)} : bandeau ${r.h.toFixed(1)} u`);
      assert.ok(SEC.y + SEC.h <= r.y - 0.4 || r.h <= 17 + 1e-6 && SEC.y + SEC.h <= 52, `${k} ×${rs} ${asp.toFixed(2)} : la coupe (bas à ${(SEC.y + SEC.h).toFixed(1)}) recouvre le bandeau (haut à ${r.y.toFixed(1)})`); } }
  K.room(1, 16 / 9);
});

test('SEC : à l\'échelle 1 en 16:9, le bas de la coupe ne touche plus le bandeau (≥ 0,5 u)', () => {
  K.room(1, 16 / 9); const r = rectOf(callout(80, 61, 'x'.repeat(60), { w: 122, lines: 2, size: 5.4, maxH: 24 }));
  assert.ok(SEC.y + SEC.h <= r.y - .4, `coupe jusqu'à ${(SEC.y + SEC.h).toFixed(1)}, bandeau dès ${r.y.toFixed(1)}`);
});
