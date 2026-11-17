// ROBOCUS 2.0 arena layouts (9 Nov): each robot vs every same-level robot on one arena, both sides.
// node arenafit.js <open|saws|killbox|cage|ice> [seeds] [firstSeed] [--out=file.json] [--up]
//   (the tabletop's ARENA_FIT comes from these runs; arenafit-report.js turns several runs into the tables)
// 17 Nov (T4, arenas change who wins): seeds no longer depend on the running fight count, so a run can be split over
// processes (firstSeed), and the output also has wins/fights per robot, fight length, KO / judges share and hazard damage.
const L = require('./engine.js'), LU = require('./lineup.js'); LU.usePK();
const args = process.argv.slice(2).filter(a => !a.startsWith('--')), opt = Object.fromEntries(process.argv.slice(2).filter(a => a.startsWith('--')).map(a => { const [k, v] = a.slice(2).split('='); return [k, v == null ? true : v]; }));
const arena = args[0] || 'open', seeds = +args[1] || 1, s0 = +args[2] || 0;
const all = Object.assign({}, LU.ROBOTS, LU.ROBOTS4), by = {}; for (const n in all) (by[all[n][0]] = by[all[n][0]] || []).push(n);
const w = {}, n = {}, trait = {}; let secs = 0, fights = 0, kos = 0, judges = 0, hz = 0, dmg = 0, pairI = 0; const koWhy = {};
// --up: each robot against every robot one level up instead (does the higher level still win as often there?)
const up = !!opt.up; let upW = 0, upN = 0;
for (const lv in by) for (const a of by[lv]) for (const b of (up ? by[+lv + 1] || [] : by[lv])) { if (!up && a >= b) continue; pairI++; for (let s = s0; s < s0 + seeds; s++) for (const side of [0, 1]) {
  const x = side ? b : a, y = side ? a : b;
  const S = L.create({ a: LU.build(x), b: LU.build(y), seed: 9100 + s * 1009 + pairI * 2 + side, arena });
  for (const R of S.robots) if (!trait[R.name]) trait[R.name] = { lv: +lv, kg: Math.round(R.body.getMass()), drive: R.spec.drive, weapon: R.spec.weapon };
  while (!S.over && S.t < 200) { L.step(S); S.fx.length = 0; }
  fights++; secs += S.t;
  if (S.result && S.result.how === 'KO') { kos++; const lo = S.robots.find(R => !R.alive); const k = lo && lo.ko ? lo.ko.split(/[,:(]/)[0].trim() : '?'; koWhy[k] = (koWhy[k] || 0) + 1; } else if (S.result) judges++;
  for (const R of S.robots) { hz += R.stats.hz || 0; dmg += R.stats.taken || 0; }
  const win = S.result && S.result.winner === 0 ? x : S.result && S.result.winner === 1 ? y : null;
  for (const r of [x, y]) { n[r] = (n[r] || 0) + 1; if (win === r) w[r] = (w[r] || 0) + 1; }
  if (up) { upN++; if (win === b) upW++; }
} }
const out = {}; for (const r in n) out[r] = Math.round(100 * (w[r] || 0) / n[r]);
const res = { arena, up, upW, upN, seeds, firstSeed: s0, fights, avgSec: Math.round(secs / fights * 10) / 10, secs, kos, judges, hz: Math.round(hz), dmg: Math.round(dmg), koWhy, win: out, w, n, trait };
if (opt.out) require('fs').writeFileSync(opt.out, JSON.stringify(res));
console.log(JSON.stringify({ arena, fights, avgSec: res.avgSec, koShare: Math.round(100 * kos / fights), judgesShare: Math.round(100 * judges / fights), hazardShare: Math.round(1000 * hz / Math.max(1, dmg)) / 10, higherWins: up ? Math.round(1000 * upW / upN) / 10 : undefined, win: out }));
