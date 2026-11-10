// every module on every level 0-2 robot, with its best non-module part and its best legendary, vs every level 3-4 robot (same seeds as tri.js)
const D = './';
const L = require(D + 'engine.js'), LU = require(D + 'lineup.js'); LU.usePK();
const C = require('./triple-candidates.json'), fs = require('fs');
const all = Object.assign({}, LU.ROBOTS, LU.ROBOTS4), lv = n => all[n][0], names = Object.keys(all), panel = names.filter(n => lv(n) >= 3);
const MODS = ['shield', 'emp', 'mines', 'popper', 'tow', 'jam'], kind = k => LU.PARTS[k].kind;
const out = {};
for (const a of Object.keys(C)) { const other = C[a].reg.find(k => kind(k) !== 'module') || 'gunner', leg = C[a].leg[0]; out[a] = { other, leg, res: {} };
  for (const m of MODS) { const bd = [m, other, leg]; let w = 0, n = 0;
    panel.forEach((b, ib) => { for (const side of [0, 1]) { const A = LU.build(a, bd), B = LU.build(b); const S = L.create({ a: side ? B : A, b: side ? A : B, seed: 83000 + ib * 7 + side, arena: 'open' });
      while (!S.over && S.t < 200) { L.step(S); S.fx.length = 0; } n++; if (S.result.winner === side) w++; } });
    out[a].res[m] = Math.round(100 * w / n); }
  console.log(a, JSON.stringify(out[a])); }
fs.writeFileSync(__dirname + '/modsweep.json', JSON.stringify(out));
