// Round robin with no power tweaks (Kev, 14 Nov): every robot (lineup, level 4, candidates) at power grade 1, damage x1, part strengths at engine defaults.
// node rr-free.js shard nShards fightsPerPair out.json   (run one per CPU core with shard 0..n-1, then node rr-free-report.js out0.json out1.json ...)
// node rr.js shard nShards fightsPerPair out.json
const L = require('./engine.js'), LU = require('./lineup.js');
const [shard, nsh, F, out] = [+process.argv[2], +process.argv[3], +process.argv[4], process.argv[5]];
const names = [...Object.keys(LU.ROBOTS), ...Object.keys(LU.ROBOTS4), ...Object.keys(LU.CANDIDATES)];
const pairs = []; for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) pairs.push([names[i], names[j]]);
const res = []; let n = 0;
for (let k = shard; k < pairs.length; k += nsh) {
  const [a, b] = pairs[k]; let wa = 0, wb = 0, dr = 0, T = 0;
  for (let f = 0; f < F; f++) {
    const swap = f % 2 === 1, A = { preset: a, dmgK: 1, hpK: 1, name: 'A' }, B = { preset: b, dmgK: 1, hpK: 1, name: 'B' };
    const S = L.create(swap ? { a: B, b: A, seed: 81001 + f } : { a: A, b: B, seed: 81001 + f });
    while (!S.over && S.t < 200) { L.step(S); S.fx.length = 0; }
    const w = S.result && S.result.winner; const aid = swap ? 1 : 0; if (w == null) dr++; else if (w === aid) wa++; else wb++; T += S.t;
  }
  res.push({ a, b, wa, wb, dr, t: T / F }); n++;
  if (n % 20 === 0) require('fs').writeFileSync(out, JSON.stringify(res));
}
require('fs').writeFileSync(out, JSON.stringify(res)); require('fs').writeFileSync(out + '.done', '1');
