/* Régénère tests/golden/engines.json À PARTIR DU CODE HISTORIQUE (tests/legacy). À n'exécuter que pour (re)figer la référence.
   Usage : node tools/make-golden.mjs */
import fs from 'node:fs';
import {api} from '../tests/helpers/legacy-api.js';
import {compute} from '../tests/golden-cases.js';
const out=compute(api);
fs.mkdirSync(new URL('../tests/golden/',import.meta.url),{recursive:true});
fs.writeFileSync(new URL('../tests/golden/engines.json',import.meta.url),JSON.stringify(out,null,1));
console.log('golden écrit :',Object.entries(out).map(([k,v])=>k+':'+Object.keys(v).length).join(' '));
