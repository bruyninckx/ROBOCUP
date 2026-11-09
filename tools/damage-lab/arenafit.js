// ROBOCUS 2.0 arena layouts (9 Nov): each robot vs every same-level robot on one arena, both sides.
// node arenafit.js <open|saws|killbox|cage|ice> [seeds]   (the tabletop's ARENA_FIT comes from these runs)
const L = require('./engine.js'), LU = require('./lineup.js'); LU.usePK();
const arena = process.argv[2] || 'open', seeds = +process.argv[3] || 1;
const all = Object.assign({}, LU.ROBOTS, LU.ROBOTS4), by = {}; for (const n in all) (by[all[n][0]] = by[all[n][0]] || []).push(n);
const w = {}, n = {}; let secs = 0, fights = 0;
for (const lv in by) for (const a of by[lv]) for (const b of by[lv]) { if (a >= b) continue; for (let s = 0; s < seeds; s++) for (const side of [0, 1]) {
  const x = side ? b : a, y = side ? a : b;
  const S = L.create({ a: LU.build(x), b: LU.build(y), seed: 9100 + s * 7 + fights, arena });
  while (!S.over && S.t < 200) { L.step(S); S.fx.length = 0; }
  fights++; secs += S.t;
  const win = S.result && S.result.winner === 0 ? x : S.result && S.result.winner === 1 ? y : null;
  for (const r of [x, y]) { n[r] = (n[r] || 0) + 1; if (win === r) w[r] = (w[r] || 0) + 1; }
} }
const out = {}; for (const r in n) out[r] = Math.round(100 * (w[r] || 0) / n[r]);
console.log(JSON.stringify({ arena, fights, avgSec: Math.round(secs / fights * 10) / 10, win: out }));
