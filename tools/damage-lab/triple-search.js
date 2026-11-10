// node tri.js lane nl : level 0-2 robots fully kitted (2 parts + 1 legendary from their best fits) vs every level 3 and 4 robot
const D = './';
const L = require(D + 'engine.js'), LU = require(D + 'lineup.js'); LU.usePK();
const [lane, nl] = process.argv.slice(2).map(Number), C = require('./triple-candidates.json'), fs = require('fs');
const all = Object.assign({}, LU.ROBOTS, LU.ROBOTS4), lv = n => all[n][0], names = Object.keys(all);
const panel = names.filter(n => lv(n) >= 3);
const kind = k => LU.PARTS[k].kind;
Object.keys(C).forEach((a, ia) => { if (ia % nl !== lane) return;
  const builds = [[]];
  const R = C[a].reg; for (let i = 0; i < R.length; i++) for (let j = i + 1; j < R.length; j++) { const p = [R[i], R[j]];
    if (p.filter(k => kind(k) === 'module').length > 1 || p.filter(k => kind(k) === 'chip').length > 1) continue;
    for (const g of C[a].leg) builds.push([...p, g]); }
  const res = [];
  for (const bd of builds) { let w = 0, n = 0, w3 = 0, n3 = 0;
    panel.forEach((b, ib) => { for (const side of [0, 1]) { const A = LU.build(a, bd), B = LU.build(b);
      const S = L.create({ a: side ? B : A, b: side ? A : B, seed: 83000 + ib * 7 + side, arena: 'open' }); while (!S.over && S.t < 200) { L.step(S); S.fx.length = 0; }
      const won = S.result.winner === side; n++; if (won) w++; if (lv(b) === 3) { n3++; if (won) w3++; } } });
    res.push({ build: bd, win: Math.round(100 * w / n), vsL3: Math.round(100 * w3 / n3), vsL4: Math.round(100 * (w - w3) / (n - n3)) }); }
  fs.mkdirSync('tri', { recursive: true }); fs.writeFileSync('tri/' + a + '.json', JSON.stringify({ robot: a, level: lv(a), res })); console.log('done', a);
});
