// ROBOCUS 2.0 matchup overview (Kev, 9 Nov): every robot against every other robot, N fights a pair (half on each side).
// For each pair: wins for the row robot, how much health the winner (and the loser) had left, knockouts, fight length.
// node matrix.js <arena> <all|same> <part> <parts> [fightsPerPair]  → matrix-<arena>-<mode>-<part>.json (merge with matrix-merge.js)
const L = require('./engine.js'), LU = require('./lineup.js'); LU.usePK();
const arena = process.argv[2] || 'open', mode = process.argv[3] || 'all', part = +process.argv[4] || 0, parts = +process.argv[5] || 1, N = +process.argv[6] || 20;
const all = Object.assign({}, LU.ROBOTS, LU.ROBOTS4), names = Object.keys(all);
const ONLY = process.env.ONLY ? new Set(process.env.ONLY.split(',')) : null;
const pairs = []; for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) if (mode === 'all' || all[names[i]][0] === all[names[j]][0]) pairs.push([names[i], names[j]]);
// health: every part of the robot (wheels, armour, weapon, chassis, internals), torn-off parts count as 0.
// (The chassis alone is misleading: most knockouts are lost wheels or a crippled drive, so the winner's chassis is usually near 100%.)
const health = R => { let h = 0, m = 0; for (const q of R.parts.concat(R.internals || [])) { m += q.maxHp; h += q.attached === false ? 0 : Math.max(0, Math.min(q.hp, q.maxHp)); } return m ? Math.round(100 * h / m) : 0; };
const out = {};
pairs.forEach(([a, b], k) => {
  if (ONLY ? !(ONLY.has(a) || ONLY.has(b)) : k % parts !== part) return;   // ONLY=a,b: re-run just the pairs with these robots (same seeds)
  const f = [];   // per fight: [winner is a (1/0), winner's health 0-100, KO (1/0), seconds, loser's health]
  for (let s = 0; s < N; s++) {
    const side = s % 2, x = side ? b : a, y = side ? a : b;
    const S = L.create({ a: LU.build(x), b: LU.build(y), seed: 7700 + 31 * k + s, arena });
    while (!S.over && S.t < 200) { L.step(S); S.fx.length = 0; }
    const W = S.robots[S.result.winner], aWon = (S.result.winner === 0) !== !!side;
    f.push([aWon ? 1 : 0, health(W), S.result.how === 'KO' ? 1 : 0, Math.round(S.t), health(W.enemy)]);
  }
  out[a + '|' + b] = f;
});
require('fs').writeFileSync(`matrix-${arena}-${mode}-${part}.json`, JSON.stringify(out));
console.log('done', arena, mode, part, Object.keys(out).length, 'pairs');
