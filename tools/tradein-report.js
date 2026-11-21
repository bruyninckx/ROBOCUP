// T52 (21 Nov 2026): trade-ins and robot buying in game-sim runs, paired by seed.
//   node tools/tradein-report.js sims/A.json sims/B.json
// Per game: trade-ins per team, Fan Favourite trade-ins (and one win short), trade-ins of a robot held 2 rounds or less, Market Cr
// on robot lots (all teams; the team that pays most), level 3-4 lots offered and sold, win rate of the team that pays most on robot
// lots, game length, fame per round. Mean ± 1 s.e.; the B-A line is paired by seed.
'use strict';
const fs = require('fs');
const load = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const per = g => { const v = g.v2 || {}, ti = v.tradeIns || [], lots = v.lots || [], rl = lots.filter(l => l.kind === 'robot');
  const paid = [0, 1, 2, 3].map(t => rl.filter(l => l.winner === t).reduce((a, l) => a + (l.price || 0), 0)), top = paid.indexOf(Math.max(...paid));
  const hi = rl.filter(l => l.level >= 3), fw = 3;
  return { ok: !!g.over && !g.crash, tiTeam: ti.length / 4, fav: ti.filter(x => x.fav).length, near: ti.filter(x => !x.fav && x.wins === fw - 1 && x.wins > 0).length, recent: ti.filter(x => x.held != null && x.held <= 2).length,
    robotCr: paid.reduce((a, b) => a + b, 0), topCr: paid[top], topWins: g.winner === top ? 1 : 0, hiOffered: hi.length, hiSold: hi.filter(l => l.winner != null && l.winner >= 0).length,
    hiSoldShare: hi.length ? hi.filter(l => l.winner != null && l.winner >= 0).length / hi.length : null, l4Sold: rl.filter(l => l.level >= 4 && l.winner >= 0).length,
    lotsCr: lots.filter(l => l.winner >= 0).reduce((a, l) => a + (l.price || 0), 0), rounds: g.round, famePerRound: (g.fame || []).reduce((a, b) => a + b, 0) / Math.max(1, g.round), errs: g.pageErrN || 0 }; };
const stat = v => { v = v.filter(x => x != null && !isNaN(x)); const m = v.reduce((a, b) => a + b, 0) / v.length, sd = Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / Math.max(1, v.length - 1)); return [m, sd / Math.sqrt(v.length), v.length]; };
const f = (x, d = 2) => x[0].toFixed(d) + ' ± ' + x[1].toFixed(d);
const files = process.argv.slice(2), runs = files.map(load);
const by = runs.map(r => Object.fromEntries(r.res.map(g => [g.seed, per(g)])));
const seeds = Object.keys(by[0]).filter(s => by.every(b => b[s] && b[s].ok));
console.log('games (all finished in every run): ' + seeds.length + '; files: ' + files.join(', '));
const keys = [['tiTeam', 'trade-ins per team per game'], ['fav', 'Fan Favourite trade-ins per game'], ['near', 'trade-ins one win short of Fan Favourite'], ['recent', 'trade-ins of a robot held 2 rounds or less'], ['robotCr', 'Market Cr on robot lots per game (all teams)'], ['topCr', '... by the team that pays most'], ['topWins', 'win rate of the team that pays most on robots'], ['hiOffered', 'level 3-4 robot lots offered per game'], ['hiSold', 'level 3-4 robot lots sold per game'], ['l4Sold', 'level 4 lots sold per game'], ['lotsCr', 'Market Cr on all lots per game'], ['rounds', 'game length (rounds)'], ['famePerRound', 'fame per round (all teams)'], ['errs', 'page errors']];
for (const [k, name] of keys) {
  const cols = by.map(b => stat(seeds.map(s => b[s][k])));
  let line = name.padEnd(48) + cols.map(c => f(c).padStart(16)).join('');
  if (by.length >= 2) { const d = stat(seeds.map(s => by[1][s][k] - by[0][s][k])); line += '   B-A ' + (d[0] >= 0 ? '+' : '') + f(d); }
  console.log(line);
}
if (by.length >= 2) { const same = seeds.filter(s => JSON.stringify(runs[0].res.find(g => g.seed == s).fame) === JSON.stringify(runs[1].res.find(g => g.seed == s).fame)).length; console.log('same final fame in both runs: ' + same + ' of ' + seeds.length + ' games'); }
