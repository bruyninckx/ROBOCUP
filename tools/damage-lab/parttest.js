// Part levels (Kev, 15 Nov: "most upgrades should increase level by 1 … perhaps 0.7 … level the upgrades"): every part on every robot
// against every robot a level up (level 4: its own level), with and without the part on the same seeds. docs/robocus-part-levels.md
//   node parttest.js shard nShards out.json [K fights a pair, default 2]      TUNE='{"pk":{"gunner":1.5},"stat":{"weapon":1.25},"partK":[1,1.15,1.45,2,2.1]}'
const L = require('./engine.js'), LU = require('./lineup.js'), fs = require('fs');
const T = process.env.TUNE ? JSON.parse(process.env.TUNE) : {};
Object.assign(LU.PK, T.pk || {}); Object.assign(LU.STAT, T.stat || {}); if (T.partK) LU.PART_K.splice(0, 5, ...T.partK); LU.usePK();
const [shard, nsh, out, K] = [+process.argv[2], +process.argv[3], process.argv[4], +(process.argv[5] || 2)];
const all = Object.assign({}, LU.ROBOTS, LU.ROBOTS4), names = Object.keys(all), lv = n => all[n][0];
const ONLY = process.env.PARTS ? process.env.PARTS.split(',') : null, parts = [null].concat(ONLY || Object.keys(LU.PARTS));
const res = []; let job = 0;
for (const n of names) { const opp = names.filter(m => m !== n && lv(m) === Math.min(4, lv(n) + 1));
  for (const k of parts) for (const o of opp) for (let f = 0; f < K; f++) { if ((job++ % nsh) !== shard) continue;
    const sw = f % 2, A = LU.build(n, k ? [k] : []), B = LU.build(o), S = L.create({ a: sw ? B : A, b: sw ? A : B, seed: 41000 + f * 97 + names.indexOf(o), arena: 'open' });
    while (!S.over && S.t < 200) { L.step(S); S.fx.length = 0; }
    const w = S.result.winner; res.push([n, k, o, w == null ? 0.5 : ((w === 0) !== !!sw ? 1 : 0)]); } }
fs.writeFileSync(out, JSON.stringify(res));
