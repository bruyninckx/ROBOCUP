// T63 Part 2 (22 Nov 2026): Kev's round-11 Gyro (Race-spec Booster + Race-spec Jammer + Quantum shield, level 2) against 8 other
// robots, bare as they come, open floor, Gyro first: each part's leave-one-out value per opponent, on the same seeds.
// One line per fight in tools/t63-out/p2.jsonl; resumable; seeds run in blocks of 25 over every cell so a stopped run is balanced.
//   node tools/t63-opponents.js --n=150 [--shard=0/2]        node tools/t63-opponents.js --report
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const DL = require(path.join(ROOT, 'src2/engine.js')), LU = require(path.join(ROOT, 'src2/lineup.js'));
LU.usePK(); LU.levelBoost = 0;
const OUT = path.join(ROOT, 'tools/t63-out'); fs.mkdirSync(OUT, { recursive: true });
const F = path.join(OUT, 'p2.jsonl');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const GYRO = { name: 'Gyro', level: 2, parts: ['booster', 'jammer', 'quantum'], rar: { booster: 2, jammer: 2 } };
const OPP = { Mauler: 1, Thwacker: 1, Whaler: 2, Pincher: 2, Slingshot: 3, Hydra: 3, Pogo: 4, Railgun: 4 };
const VAR = { full: null, nobooster: 'booster', nojammer: 'jammer', noquantum: 'quantum' };
const spec = (r, team) => Object.assign(LU.build(r.name, r.parts, r.rar), { name: r.name, level: r.level, teamName: team });
function fight(opp, v, seed) {
  const g = Object.assign({}, GYRO, { parts: GYRO.parts.filter(p => p !== VAR[v]) });
  const S = DL.create({ a: spec(g, 'Steel Bolts'), b: spec({ name: opp, level: OPP[opp], parts: [] }, 'Rust Rivets'), seed, countdown: 0, arena: 'open', wear: true });
  let n = 0; while (!S.over && n++ < 48000) { DL.step(S); S.fx.length = 0; }
  const r = S.result || {}, G = S.robots[0];
  const dd = {}; for (const d of G.drones) { const l = G.stats.lost.find(q => q.label === d.H.label); dd[d.key] = l ? +l.t.toFixed(1) : null; }
  const sm = G.stats.lost.find(q => /Shell motor/.test(q.label));
  return { opp, v, seed, w: r.winner === 0 ? 1 : r.winner === 1 ? 0 : 0.5, t: +(r.t || S.t).toFixed(1), how: r.how || 'none', dd, sm: sm ? +sm.t.toFixed(1) : null };
}
const load = () => fs.existsSync(F) ? fs.readFileSync(F, 'utf8').split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch (e) { return null; } }).filter(Boolean) : [];
function run(N) {
  const [si, sn] = arg('shard', '0/1').split('/').map(Number), done = new Set(load().map(r => r.opp + r.v + r.seed));
  let j = 0;
  for (let b = 1; b <= N; b += 25) for (const opp of Object.keys(OPP)) for (const v of Object.keys(VAR)) for (let s = b; s < b + 25 && s <= N; s++) {
    if (j++ % sn !== si || done.has(opp + v + s)) continue;
    fs.appendFileSync(F, JSON.stringify(fight(opp, v, s)) + '\n');
  }
}
function report() {
  const R = load(), cell = {}; for (const r of R) (cell[r.opp] = cell[r.opp] || {})[r.v] = Object.assign((cell[r.opp] || {})[r.v] || {}, { [r.seed]: r });
  const lines = ['| Opponent (level) | fights a cell | Gyro full build | Booster gain | Jammer gain | Quantum gain | discordant pairs |', '|---|---|---|---|---|---|---|'];
  const all = [];
  for (const opp of Object.keys(OPP)) {
    const C = cell[opp]; if (!C || !C.full) continue;
    const seeds = Object.keys(C.full).filter(s => Object.keys(VAR).every(v => C[v] && C[v][s]));
    if (!seeds.length) continue;
    const full = seeds.reduce((a, s) => a + C.full[s].w, 0) / seeds.length;
    const cellTxt = [], disc = [];
    for (const v of ['nobooster', 'nojammer', 'noquantum']) {
      const d = seeds.map(s => C.full[s].w - C[v][s].w), m = d.reduce((a, x) => a + x, 0) / d.length, sd = Math.sqrt(d.reduce((a, x) => a + (x - m) ** 2, 0) / Math.max(1, d.length - 1));
      cellTxt.push(`${m >= 0 ? '+' : ''}${Math.round(100 * m)} ± ${Math.round(196 * sd / Math.sqrt(d.length))}`); disc.push(d.filter(x => x !== 0).length / d.length);
      all.push({ opp, part: VAR[v], m, se: sd / Math.sqrt(d.length), n: d.length, disc: d.filter(x => x !== 0).length / d.length });
    }
    lines.push(`| ${opp} (${OPP[opp]}) | ${seeds.length} | ${Math.round(100 * full)}% | ${cellTxt.join(' | ')} | ${disc.map(x => Math.round(100 * x) + '%').join(' / ')} |`);
  }
  // per part: spread across opponents (true SD = sqrt(var of the means - mean se^2))
  for (const p of ['booster', 'jammer', 'quantum']) {
    const A = all.filter(x => x.part === p); if (A.length < 3) continue;
    const mu = A.reduce((a, x) => a + x.m, 0) / A.length, ov = A.reduce((a, x) => a + (x.m - mu) ** 2, 0) / (A.length - 1), nv = A.reduce((a, x) => a + x.se * x.se, 0) / A.length;
    lines.push(`${p}: average gain ${Math.round(100 * mu)} points over ${A.length} opponents; spread across opponents observed SD ${Math.round(100 * Math.sqrt(ov))}, noise ${Math.round(100 * Math.sqrt(nv))}, true SD about ${Math.round(100 * Math.sqrt(Math.max(0, ov - nv)))}`);
  }
  const dsc = all.reduce((a, x) => a + x.disc, 0) / Math.max(1, all.length);
  lines.push(`discordant pairs (the same seed gives a different winner with and without the part): ${Math.round(100 * dsc)}% on average`);
  console.log(lines.join('\n')); fs.writeFileSync(path.join(OUT, 'p2-report.txt'), lines.join('\n') + '\n');
}
if (require.main === module) { if (process.argv.includes('--report')) report(); else run(+arg('n', 150)); }
module.exports = { fight };
