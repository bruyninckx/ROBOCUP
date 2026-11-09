// tuning chips: node chips.js <chip|none> <loLevel> <hiLevel> [seeds] [arena]   (the low-level robot gets the chip)
const L = require('./engine.js'), LU = require('./lineup.js'); LU.usePK();
const chip = process.argv[2], lo = +process.argv[3], hi = +process.argv[4], seeds = +process.argv[5] || 2, arena = process.argv[6] || 'open';
const all = Object.assign({}, LU.ROBOTS, LU.ROBOTS4), by = {}; for (const n in all) (by[all[n][0]] = by[all[n][0]] || []).push(n);
let w = 0, n = 0, glitch = 0; const per = {};
for (const a of by[lo]) for (const b of by[hi]) { if (lo === hi && a === b) continue; for (let s = 0; s < seeds; s++) for (const side of [0, 1]) {
  const A = LU.build(a, chip === 'none' ? [] : [chip]), B = LU.build(b);
  const S = L.create({ a: side ? B : A, b: side ? A : B, seed: 5300 + s * 17 + n, arena });
  while (!S.over && S.t < 200) { L.step(S); S.fx.length = 0; }
  const won = S.result && S.result.winner === (side ? 1 : 0); if (won) w++; n++;
  per[a] = per[a] || [0, 0]; per[a][1]++; if (won) per[a][0]++;
  glitch += S.log.filter(x => /tuning chip overloads/.test(x.text)).length;
} }
const pr = {}; for (const k in per) pr[k] = Math.round(100 * per[k][0] / per[k][1]);
console.log(JSON.stringify({ chip, lo, hi, arena, win: Math.round(1000 * w / n) / 10, fights: n, glitchPerFight: Math.round(100 * glitch / n) / 100, perRobot: pr }));
