// T38: before / after numbers for the garage, from game-sim result files (tools/game-sim.js, 2.0 page).
//   node tools/garage-report.js <before files or glob dir:prefix> -- <after files>
//   e.g. node tools/garage-report.js sims/before-*.json -- sims/after-*.json
// ± is a 95% range (1.96 standard errors; per game for game numbers, per fight for fight numbers).
const fs = require('fs');
const args = process.argv.slice(2), cut = args.indexOf('--'), A = args.slice(0, cut), B = args.slice(cut + 1);
const load = fs_ => fs_.flatMap(f => JSON.parse(fs.readFileSync(f, 'utf8')).res).filter(r => r.v2 && !r.crash);
const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN;
const ci = a => { if (a.length < 2) return NaN; const m = mean(a), v = a.reduce((x, y) => x + (y - m) ** 2, 0) / (a.length - 1); return 1.96 * Math.sqrt(v / a.length); };
const f2 = (a, d = 2) => isNaN(mean(a)) ? '-' : mean(a).toFixed(d) + ' ± ' + (isNaN(ci(a)) ? '-' : ci(a).toFixed(d));
const pct = a => isNaN(mean(a)) ? '-' : (100 * mean(a)).toFixed(0) + '% ± ' + (100 * ci(a)).toFixed(0);
function stats(R) {
  const o = {}, fin = R.filter(r => r.over && !r.stall);
  o.games = R.length; o.finished = fin.length; o.stalls = R.filter(r => r.stall).length;
  o.rounds = fin.map(r => r.round);
  o.famePerRound = fin.map(r => r.fame.reduce((a, b) => a + b, 0) / r.round);
  o.close = fin.map(r => { const f = r.fame.slice().sort((a, b) => b - a); return f[0] - f[1] <= 1 ? 1 : 0; });
  // garage
  o.moves = fin.map(r => (r.v2.garage || []).reduce((a, g) => a + g.moves.length, 0) / 4);
  o.r2r = fin.map(r => (r.v2.garage || []).reduce((a, g) => a + g.moves.filter(m => m.from !== 'S' && m.to !== 'S').length, 0) / 4);
  o.s2r = fin.map(r => (r.v2.garage || []).reduce((a, g) => a + g.moves.filter(m => m.from === 'S' && m.to !== 'S').length, 0) / 4);
  o.fees = fin.map(r => -r.v2.cr.filter(c => c[3] === 'garage').reduce((a, c) => a + c[2], 0) / 4);
  o.stashEnd = fin.map(r => mean(r.v2.stashEnd || [0]));
  o.partsBack = fin.map(r => (r.v2.partsBack || []).reduce((a, p) => a + p.n, 0));
  o.partsBackBroken = fin.map(r => (r.v2.partsBack || []).reduce((a, p) => a + p.broken, 0));
  // parts on robots at every fight snapshot: per team, parts on its top robot (most parts), the rest, and how often the top robot has 2 parts + a legendary
  const top = [], rest = [], full = [], perRobot = [];
  for (const r of fin) for (const s of r.v2.snaps.filter(s => s.k === 'fight')) for (const t of s.teams) {
    if (!t.robots.length) continue;
    const n = t.robots.map(x => x.parts.length + (x.leg ? 1 : 0)); n.forEach(k => perRobot.push(k));
    const k = n.indexOf(Math.max(...n)); top.push(n[k]); if (t.robots.length > 1) rest.push(mean(n.filter((_, j) => j !== k)));
    full.push(t.robots[k].parts.length >= 2 && t.robots[k].leg ? 1 : 0);
  }
  o.perRobot = perRobot; o.top = top; o.rest = rest; o.full = full;
  // Market spend on parts by round
  const mk = (lo, hi) => fin.map(r => r.v2.lots.filter(l => l.r >= lo && l.r <= hi && l.winner >= 0 && !['robot', 'crew', 'other'].includes(l.kind)).reduce((a, l) => a + l.price, 0) / 4);
  o.mk14 = mk(1, 4); o.mk58 = mk(5, 8); o.mk9 = mk(9, 99);
  o.mkParts = fin.map(r => r.v2.lots.filter(l => l.winner >= 0 && !['robot', 'crew', 'other'].includes(l.kind)).length);
  // host scraps: how many, and what the victim loses (robot value at the scrap, less the bank worth of the parts that come back)
  o.hostScraps = fin.map(r => (r.v2.leaves || []).filter(l => l.reason === 'host scrap').length);
  const lost = [], lostParts = [];
  for (const r of fin) for (const l of (r.v2.leaves || []).filter(l => l.reason === 'host scrap')) {
    const pb = (r.v2.partsBack || []).find(p => p.r === l.r && p.team === l.team && p.why === 'host scrap' && !p.used); if (pb) pb.used = 1;
    lost.push((l.v || 0) - (pb ? pb.worth || 0 : 0)); lostParts.push(l.parts || 0);
  }
  o.scrapLost = lost; o.scrapParts = lostParts;
  // the bookie in whole games: favourite wins, Brier (2-sided fights with a winner)
  const fav = [], brier = [];
  for (const r of fin) for (const f of r.v2.fightsX) { if (!f.p || f.p.length !== 2 || f.win == null || f.win < 0) continue; const k = f.p[0] >= f.p[1] ? 0 : 1; if (f.p[0] !== f.p[1]) fav.push(f.win === k ? 1 : 0); brier.push((f.p[0] - (f.win === 0 ? 1 : 0)) ** 2); }
  o.fav = fav; o.brier = brier;
  return o;
}
const S0 = stats(load(A)), S1 = stats(load(B));
const row = (name, k, fmt = f2) => console.log('| ' + name + ' | ' + fmt(S0[k]) + ' | ' + fmt(S1[k]) + ' |');
console.log('| | before (' + S0.finished + ' of ' + S0.games + ' games' + (S0.stalls ? ', ' + S0.stalls + ' stalled' : '') + ') | after (' + S1.finished + ' of ' + S1.games + (S1.stalls ? ', ' + S1.stalls + ' stalled' : '') + ') |');
console.log('|---|---|---|');
row('rounds per game', 'rounds'); row('fame per round (all teams)', 'famePerRound'); row('close finish (winner ≤ 1 fame ahead)', 'close', pct);
row('garage moves per team per game', 'moves'); row('  of which robot → robot', 'r2r'); row('  of which Stash → robot', 's2r'); row('garage fees per team per game (Cr)', 'fees');
row('Stash parts per team at the end', 'stashEnd'); row('parts back from scraps per game', 'partsBack'); row('  of which broken', 'partsBackBroken');
row('parts per robot (at fights)', 'perRobot'); row('parts on a team\'s top robot', 'top'); row('parts on its other robots (mean)', 'rest'); row('top robot has 2 parts + legendary', 'full', pct);
row('Market spend on parts per team, rounds 1-4 (Cr)', 'mk14'); row('  rounds 5-8', 'mk58'); row('  rounds 9+', 'mk9'); row('parts bought per game', 'mkParts');
row('host scraps per game', 'hostScraps'); row('value a host scrap costs the victim (Cr)', 'scrapLost'); row('parts on a host-scrapped robot', 'scrapParts');
row('bookie favourite wins (fights)', 'fav', pct); row('Brier (2-sided fights)', 'brier', a => f2(a, 3));
console.log('\nfights: before ' + S0.brier.length + ', after ' + S1.brier.length + '; host scraps: before ' + S0.scrapLost.length + ', after ' + S1.scrapLost.length);
