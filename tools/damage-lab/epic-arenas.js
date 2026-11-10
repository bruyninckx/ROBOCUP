// ROBOCUS 2.0 double check (Kev, 10 Nov): node epic-arenas.js -> epicx.json
// epic combos: every arena (next level up) + same level + two levels up, with vs without
const D = './';
const L = require(D + 'engine.js'), LU = require(D + 'lineup.js'); LU.usePK();
const all = Object.assign({}, LU.ROBOTS, LU.ROBOTS4), lv = n => all[n][0], names = Object.keys(all);
const C = [['Ramrod', 'powerkit'], ['Whaler', 'overdrive'], ['Ramrod', 'emp'], ['Orbiter', 'matador'], ['Brawler', 'powerkit'], ['Popcorn', 'overdrive'], ['Scythe', 'booster']];
const run = (a, p, opp, arena, seeds) => { let w0 = 0, w1 = 0, n = 0; for (const b of opp) for (let s = 0; s < seeds; s++) for (const side of [0, 1]) { const seed = 61000 + n * 19;
  for (const pt of [null, p]) { const A = LU.build(a, pt ? [pt] : []), B = LU.build(b); const S = L.create({ a: side ? B : A, b: side ? A : B, seed, arena }); while (!S.over && S.t < 200) { L.step(S); S.fx.length = 0; } if (S.result.winner === side) { if (pt) w1++; else w0++; } } n++; }
  return [Math.round(100 * w0 / n), Math.round(100 * w1 / n), n]; };
const res = [];
for (const [a, p] of C) { const up = Math.min(4, lv(a) + 1), r = { c: a + '+' + p };
  for (const ar of ['cage', 'ice', 'killbox', 'saws']) r[ar] = run(a, p, names.filter(b => b !== a && lv(b) === up), ar, 1);
  r.same = run(a, p, names.filter(b => b !== a && lv(b) === lv(a)), 'open', 2);
  if (lv(a) + 2 <= 4) r.up2 = run(a, p, names.filter(b => lv(b) === lv(a) + 2), 'open', 2);
  res.push(r); console.log(JSON.stringify(r)); }
require('fs').writeFileSync(__dirname + '/epicx.json', JSON.stringify(res));
