// ROBOCUS 2.0 double check (Kev, 10 Nov): node matrix-fresh.js -> fresh.json, every open-floor pair on fresh seeds
// fresh-seed re-run of every open-floor pair: 6 fights a pair (3 seeds x 2 sides), seeds far from the matrix's
const D = './';
const L = require(D + 'engine.js'), LU = require(D + 'lineup.js'); LU.usePK();
const all = Object.assign({}, LU.ROBOTS, LU.ROBOTS4), names = Object.keys(all), out = {};
let k = 0;
for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) { const a = names[i], b = names[j]; let w = 0;
  for (let s = 0; s < 3; s++) for (const side of [0, 1]) { const S = L.create({ a: side ? LU.build(b) : LU.build(a), b: side ? LU.build(a) : LU.build(b), seed: 55000 + k * 11 + s * 3 + side, arena: 'open' });
    while (!S.over && S.t < 200) { L.step(S); S.fx.length = 0; } if ((S.result.winner === 0) !== !!side) w++; }
  out[a + '|' + b] = w; k++; }
require('fs').writeFileSync(__dirname + '/fresh.json', JSON.stringify(out)); console.log('done', k);
