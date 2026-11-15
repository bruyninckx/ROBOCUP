// How much do counters decide whole games? (Kev, 15 Nov: "would the amount of counters be too much")
// Reads game-sim runs (sims/<tag>.json, 2.0 page) and the matchup table they played with, and reports for duels:
// how often the two robots are a counter matchup, how often the lower level wins, whether the bookie priced it, and
// what each level costs in the Market against how often it wins.
//   node tools/counter-report.js <tag> <matrix-data.json> [<tag> <matrix-data.json> ...]
const fs = require('fs'), path = require('path');
const args = process.argv.slice(2), runs = [];
for (let i = 0; i < args.length; i += 2) runs.push([args[i], args[i + 1]]);
const pct = (a, b) => b ? Math.round(100 * a / b) + '%' : '-';
for (const [tag, mxf] of runs) {
  const D = JSON.parse(fs.readFileSync(path.join('sims', tag + '.json')));
  const MX = JSON.parse(fs.readFileSync(mxf)).arenas.open.pairs, lv = {};
  const games = D.res.filter(r => r && (r.v2 || r.fightsX)), FX = games.flatMap(g => (g.v2 || g).fightsX || []), LOTS = games.flatMap(g => (g.v2 || g).lots || []);
  for (const f of FX) for (const e of f.x2 || []) if (e) lv[e.name] = e.level;
  const mx = (a, b) => MX[a + '|' + b] ? MX[a + '|' + b][0] / MX[a + '|' + b][1] : MX[b + '|' + a] ? 1 - MX[b + '|' + a][0] / MX[b + '|' + a][1] : null;
  // what a level gap usually gives (as the game's MX_EXP), from the robots in the table
  const by = {}; const L0 = {}; for (const f of FX) for (const e of f.x2 || []) if (e) L0[e.name] = e.level;
  for (const k in MX) { const [a, b] = k.split('|'); if (L0[a] == null || L0[b] == null) continue; const p = MX[k][0] / MX[k][1], d = L0[a] - L0[b]; (by[d] = by[d] || []).push(p); (by[-d] = by[-d] || []).push(1 - p); }
  const EXP = {}; for (const d in by) EXP[d] = by[d].reduce((x, y) => x + y, 0) / by[d].length;
  const duels = FX.filter(f => f.win != null && (f.x2 || []).filter(Boolean).length === 2 && !f.house && f.x2[0].side !== f.x2[1].side);
  let n = 0, c25 = 0, c40 = 0, flip = 0, lowWin = 0, gapN = 0, lowWinC = 0, gapC = 0, lowWinN = 0, gapNN = 0, calib = [], favWin = 0;
  const gapStat = {};
  for (const f of duels) {
    const [A, B] = f.x2, m = mx(A.name, B.name); if (m == null) continue; n++;
    const e = EXP[A.level - B.level], d = m - e, aWon = f.win === A.side;
    if (Math.abs(d) >= 0.25) c25++; if (Math.abs(d) >= 0.4) c40++;
    const pA = f.p ? f.p[A.side] : null; if (pA != null) { calib.push([pA, aWon ? 1 : 0, Math.abs(d) >= 0.25]); if ((pA >= 0.5) === aWon) favWin++; }
    if (A.level !== B.level) {
      const [lo, hi] = A.level < B.level ? [A, B] : [B, A], loWon = f.win === lo.side, mLo = lo === A ? m : 1 - m, gap = hi.level - lo.level;
      gapN++; if (loWon) lowWin++; if (mLo > 0.5) flip++;
      const isC = Math.abs(d) >= 0.25; if (isC) { gapC++; if (loWon) lowWinC++; } else { gapNN++; if (loWon) lowWinN++; }
      const G = gapStat[gap] = gapStat[gap] || [0, 0]; G[0]++; if (!loWon) G[1]++;
    }
  }
  const brier = xs => xs.length ? (xs.reduce((a, [p, w]) => a + (p - w) ** 2, 0) / xs.length).toFixed(3) : '-';
  const cal = xs => { const p = xs.reduce((a, x) => a + x[0], 0) / (xs.length || 1), w = xs.reduce((a, x) => a + x[1], 0) / (xs.length || 1); return `odds ${Math.round(100 * p)}% / won ${Math.round(100 * w)}%`; };
  console.log(`\n== ${tag}: ${games.length} games, ${FX.length} fights, ${n} duels with table data`);
  console.log(`counter matchups (25+ points off the level gap): ${c25} (${pct(c25, n)}) · 40+ points: ${c40} (${pct(c40, n)})`);
  console.log(`duels between different levels: ${gapN}; the lower level wins ${pct(lowWin, gapN)}; the lower level is the table favourite in ${pct(flip, gapN)}`);
  console.log(`  lower level wins: in counter matchups ${pct(lowWinC, gapC)} (${gapC}), in the rest ${pct(lowWinN, gapNN)} (${gapNN})`);
  console.log('  higher level wins by gap: ' + Object.keys(gapStat).sort().map(g => `${g} level${g > 1 ? 's' : ''}: ${pct(gapStat[g][1], gapStat[g][0])} (${gapStat[g][0]})`).join(' · '));
  console.log(`bookie: favourite wins ${pct(favWin, calib.length)}; Brier ${brier(calib)} (all) · counter duels ${brier(calib.filter(x => x[2]))}, ${cal(calib.filter(x => x[2] && x[0] < 0.5).map(x => x))} for their underdog side`);
  // Market: price per level vs duel wins of that level (all duels, any opponent)
  const lvW = {}, lvP = {};
  for (const f of duels) for (const e of f.x2) { const W = lvW[e.level] = lvW[e.level] || [0, 0]; W[0]++; if (f.win === e.side) W[1]++; }
  for (const l of LOTS) if (l.kind === 'robot' && l.winner != null && l.winner >= 0 && l.level != null) (lvP[l.level] = lvP[l.level] || []).push(l.price);
  console.log('per level: ' + [0, 1, 2, 3, 4].map(l => `L${l} wins ${pct((lvW[l] || [0, 0])[1], (lvW[l] || [0, 0])[0])} of ${(lvW[l] || [0, 0])[0]} duels` + (lvP[l] ? `, sells for ${(lvP[l].reduce((a, b) => a + b, 0) / lvP[l].length).toFixed(1)} Cr (${lvP[l].length})` : '')).join(' · '));
  const winners = games.map(g => g.winner).filter(w => w >= 0);
  console.log(`games finished: ${games.filter(g => g.over).length}/${games.length}; rounds ${(games.reduce((a, g) => a + g.round, 0) / games.length).toFixed(1)}`);
}
