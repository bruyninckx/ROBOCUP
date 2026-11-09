// tuning chips: what the chip does in a fight (dodges, crashes caused, seconds drifting, fades), level 1 with the chip vs level 3
const L = require('./engine.js'), LU = require('./lineup.js'); LU.usePK();
const chip = process.argv[2], N = +process.argv[3] || 20;
const lo = Object.keys(LU.ROBOTS).filter(k => LU.ROBOTS[k][0] === 1), hi = Object.keys(LU.ROBOTS).filter(k => LU.ROBOTS[k][0] === 3);
const tot = { dodge: 0, crash: 0, drift: 0, fade: 0 }; let w = 0, secs = 0;
for (let i = 0; i < N; i++) {
  const S = L.create({ a: LU.build(lo[i % lo.length], [chip]), b: LU.build(hi[i % hi.length]), seed: 600 + i });
  while (!S.over && S.t < 200) { L.step(S); S.fx.length = 0; }
  const cs = S.robots[0].chipStats || {}; for (const k in tot) tot[k] += cs[k] || 0; if (S.result.winner === 0) w++; secs += S.t;
}
for (const k in tot) tot[k] = Math.round(tot[k] / N * 10) / 10;
console.log(chip, 'per fight', JSON.stringify(tot), 'win', Math.round(100 * w / N) + '%', 'fight', Math.round(secs / N) + ' s');
