// ROBOCUS 2.0 matchup overview (Kev, 9 Nov): every robot against every other robot, N fights a pair (half on each side).
// For each pair: wins for the row robot, how much chassis health the winner had left, knockouts, fight length.
// node matrix.js <arena> <all|same> <part> <parts> [fightsPerPair]  → matrix-<arena>-<mode>-<part>.json (merge with matrix-merge.js)
const L = require('./engine.js'), LU = require('./lineup.js'); LU.usePK();
const arena = process.argv[2] || 'open', mode = process.argv[3] || 'all', part = +process.argv[4] || 0, parts = +process.argv[5] || 1, N = +process.argv[6] || 20;
const all = Object.assign({}, LU.ROBOTS, LU.ROBOTS4), names = Object.keys(all);
const pairs = []; for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) if (mode === 'all' || all[names[i]][0] === all[names[j]][0]) pairs.push([names[i], names[j]]);
const out = {};
pairs.forEach(([a, b], k) => {
  if (k % parts !== part) return;
  const f = [];   // per fight: [winner is a (1/0), winner chassis health 0-100, KO (1/0), seconds]
  for (let s = 0; s < N; s++) {
    const side = s % 2, x = side ? b : a, y = side ? a : b;
    const S = L.create({ a: LU.build(x), b: LU.build(y), seed: 7700 + 31 * k + s, arena });
    while (!S.over && S.t < 200) { L.step(S); S.fx.length = 0; }
    const W = S.robots[S.result.winner], aWon = (S.result.winner === 0) !== !!side;
    f.push([aWon ? 1 : 0, Math.round(100 * Math.max(0, Math.min(1, W.chassis.hp / W.chassis.maxHp))), S.result.how === 'KO' ? 1 : 0, Math.round(S.t)]);
  }
  out[a + '|' + b] = f;
});
require('fs').writeFileSync(`matrix-${arena}-${mode}-${part}.json`, JSON.stringify(out));
console.log('done', arena, mode, part, Object.keys(out).length, 'pairs');
