/* États d'élève de test (format localStorage « geocarto2 ») */
const base={xp:10,sections:[],ch:{},errors:{},portfolio:{items:[],notes:{}},weekly:{},project:{},who:{name:'',cls:''},done:{},quiz:{},skills:{},exos:{n:0,ok:0},profiles:[],badges:{},minutes:{},streak:{last:'',n:0},misc:{},settings:{mode:'intermediaire',fs:1,contrast:false,big:false,motion:false}};
const NOW=1_800_000_000_000,DAY=864e5;
export const NOW_MS=NOW;
export const STATES=[
 {...base},
 {...base,ch:{def:{theory:1,example:1,act:3,exo:4,exoOk:4,quiz:.9,ok:1},echelle:{theory:1,example:0,act:1,exo:2,exoOk:1,quiz:.5,ok:0}},skills:{echelle:{n:5,ok:2,m:.4,last:NOW-DAY}},errors:{'t-unite':3,'p-regle':1}},
 {...base,ch:Object.fromEntries(['def','echelle','orient','coord','courbes'].map(c=>[c,{theory:1,example:1,act:3,exo:4,exoOk:4,quiz:1,ok:1}])),skills:{courbes:{n:9,ok:8,m:.85,last:NOW-10*DAY},pente:{n:4,ok:1,m:.3,last:NOW-2*DAY}},profiles:[{score:40,mode:'debutant'},{score:55,mode:'debutant'},{score:50,mode:'debutant'}],errors:{'p-extrema':4,'t-V':2}},
 {...base,ch:Object.fromEntries(['def','echelle','orient','coord','courbes','pente','formes','theorie','methode','echelles','auto','geo1','geo2','geo3','coupe1','coupe2'].map(c=>[c,{theory:1,example:1,act:3,exo:4,exoOk:4,quiz:1,ok:1}])),profiles:[{score:90,mode:'expert'},{score:80,mode:'expert'},{score:70,mode:'intermediaire'},{score:95,mode:'expert'}],weekly:{}}
];
