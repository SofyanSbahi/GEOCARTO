/* rc.3 — sécurité : échappement des données d'élèves, export CSV sans injection de formule, code enseignant non consigné dans les documents,
   contenu publiable limité à site/. Les contrôles « statiques » protègent contre un retour en arrière lors d'une future modification. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const root = new URL('../', import.meta.url).pathname, read = p => fs.readFileSync(path.join(root, p), 'utf8');
globalThis.document = { documentElement: {}, querySelector: () => null, querySelectorAll: () => [] };    // util.js ne touche au DOM qu'à l'appel
globalThis.localStorage = globalThis.localStorage || { getItem: () => null, setItem() { } };
const { esc, csvCell } = await import('../js/core/util.js');

test('esc neutralise les caractères HTML dans le texte et dans les attributs', () => {
  assert.equal(esc('<img src=x onerror="a()">'), '&lt;img src=x onerror=&quot;a()&quot;&gt;');
  assert.equal(esc(`"'&`), '&quot;&#39;&amp;'); assert.equal(esc(null), ''); assert.equal(esc(12), '12');
});
test('csvCell neutralise les formules de tableur et protège les séparateurs', () => {
  for (const f of ['=1+1', '+SUM(A1)', '-2', '@cmd', '\tx']) assert.ok(csvCell(f).startsWith("'"), f);
  assert.equal(csvCell('Amina'), 'Amina'); assert.equal(csvCell('a;b'), '"a;b"'); assert.equal(csvCell('dit "oui"'), '"dit ""oui"""');
});
/* toute interpolation ${…} qui mentionne une donnée non fiable doit contenir esc( — vérifié par expression régulière, pas par simple absence de texte */
const interp = src => [...src.matchAll(/\$\{((?:[^{}]|\{[^{}]*\})*)\}/g)].map(m => m[1]);
/* le nom de fichier du rapport (assaini par .replace(/\W+/g,'_')) n'entre pas dans du HTML */
const unsafe = (src, names) => interp(src).filter(e => names.some(n => e.includes(n)) && !e.includes('esc(') && !e.includes("replace(/\\W+/g,'_')"));
test('les pages qui affichent des données importées ou saisies passent par esc()', () => {
  const prof = read('js/pages/prof.js'), defi = read('js/pages/defi.js'), port = read('js/pages/portfolio.js');
  assert.deepEqual(unsafe(prof, ['r.name', 'r.cls', 'r.xp', 'byId[k]', 'className', 'project.score']).filter(e => !e.startsWith('r.project&&')), [], 'prof.js');
  assert.deepEqual(unsafe(defi, ['assign.title', 'assign.type', 'assign.seed', 'assign.scaleN', 'assign.due']), [], 'defi.js');
  assert.deepEqual(unsafe(port, ['it.title', 'it.mode', 'it.code', 'it.img', 's.who.name', 's.who.cls', 'P.notes']), [], 'portfolio.js');
  assert.ok(/csvCell/.test(prof));
});
test('le code enseignant n\'est consigné dans aucun document et n\'est plus l\'ancien', () => {
  const old = 'Atlas-K7Q2-Relief', oldHash = createHash('sha256').update(old).digest('hex');
  for (const f of ['README.md', 'config.js', ...fs.readdirSync(path.join(root, 'docs')).filter(x => x.endsWith('.md')).map(x => 'docs/' + x)]) assert.ok(!read(f).includes(old) && !read(f).includes(oldHash), `${f} contient l'ancien code ou son empreinte`);
  assert.match(read('config.js'), /teacherHash:'[0-9a-f]{64}'/);
});
test('make-site.sh ne publie que le nécessaire (aucun code source, test, document, outil)', () => {
  execFileSync('sh', ['tools/make-site.sh'], { cwd: root, stdio: 'pipe' });
  const files = []; (function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) e.isDirectory() ? walk(path.join(d, e.name)) : files.push(path.relative(path.join(root, 'site'), path.join(d, e.name))); })(path.join(root, 'site'));
  const top = new Set(files.map(f => f.split(path.sep)[0]));
  for (const forbidden of ['js', 'tests', 'docs', 'tools', 'README.md', 'package.json', 'CLAUDE.md', 'node_modules', 'build.sh']) assert.ok(!top.has(forbidden), `${forbidden} dans site/`);
  for (const need of ['index.html', 'config.js', 'dist', 'css', 'img', 'COPYRIGHT.txt', 'CREDITS.txt', 'robots.txt', 'THIRD-PARTY-LICENSES.txt']) assert.ok(top.has(need), `${need} manquant`);
  assert.ok(!files.some(f => /\.(md|mjs|py)$/.test(f)));
  assert.match(read('site/index.html'), /name="robots" content="noindex/);
});
