// T41: the bookie's style tags (STYLE: Giant killer / Coin-flip brawler / Quick finisher / Grinder) and Hard hitters (HITTER),
// from the open-floor matchup fights (matrix.js raw files matrix-open-all-*.json, 20 fights a pair), with the rules of
// tag-tuned-report.py (15 Nov). node style-tags.js <dir with matrix-open-all-*.json>  -> prints the two tables for tabletop-2.html
const fs = require('fs'), path = require('path'), LU = require('./lineup.js');
const dir = process.argv[2] || '.', lvAll = Object.assign({}, LU.ROBOTS, LU.ROBOTS4), lv = n => lvAll[n][0], names = Object.keys(lvAll);
const duel = [];
for (const f of fs.readdirSync(dir).filter(f => /^matrix-open-all-\d+\.json$/.test(f))) for (const [k, fs2] of Object.entries(JSON.parse(fs.readFileSync(path.join(dir, f))))) {
  const [a, b] = k.split('|'); for (const x of fs2) duel.push({ a, b, win: x[0] ? a : b, keep: x[1] / 100, t: x[3] });
}
const pair = {}; for (const r of duel) { const w = r.win === r.a ? 1 : 0; (pair[r.a + '|' + r.b] = pair[r.a + '|' + r.b] || [0, 0]); pair[r.a + '|' + r.b][0] += w; pair[r.a + '|' + r.b][1]++; (pair[r.b + '|' + r.a] = pair[r.b + '|' + r.a] || [0, 0]); pair[r.b + '|' + r.a][0] += 1 - w; pair[r.b + '|' + r.a][1]++; }
const gap = {}; for (const [k, [w, n]] of Object.entries(pair)) { const [a, b] = k.split('|'), d = lv(a) - lv(b); (gap[d] = gap[d] || []).push(w / n); }
const EXP = {}; for (const d in gap) EXP[d] = gap[d].reduce((x, y) => x + y, 0) / gap[d].length;
const lossLv = {}; for (const r of duel) { const loser = r.win === r.a ? r.b : r.a; (lossLv[lv(loser)] = lossLv[lv(loser)] || []).push(1 - r.keep); }
const avgLossLv = {}; for (const k in lossLv) avgLossLv[k] = lossLv[k].reduce((x, y) => x + y, 0) / lossLv[k].length;
const STYLE = {}, HITTER = {}, stat = {};
for (const n of names) {
  const mine = duel.filter(r => r.a === n || r.b === n); if (!mine.length) continue;
  let upw = 0, upe = 0, upn = 0;
  for (const [k, [w, m]] of Object.entries(pair)) { const [a, b] = k.split('|'); if (a === n && lv(b) > lv(a)) { upw += w; upe += EXP[lv(a) - lv(b)] * m; upn += m; } }
  const blow = mine.filter(r => r.keep >= 0.85).length / mine.length, tm = mine.reduce((s, r) => s + r.t, 0) / mine.length;
  const lost = mine.filter(r => r.win !== n), hit = lost.reduce((s, r) => s + 1 - r.keep, 0) / Math.max(1, lost.length);
  stat[n] = { up: upn ? [Math.round(100 * upw / upn), Math.round(100 * upe / upn), upn] : null, blow: Math.round(100 * blow), t: Math.round(tm), hit: Math.round(100 * hit), hitLv: Math.round(100 * avgLossLv[lv(n)]) };
  if (upn >= 24 && upw / upn >= 1.25 * upe / upn && (upw - upe) / upn >= 0.06) STYLE[n] = ['giant', Math.round(100 * upw / upn), Math.round(100 * upe / upn)];
  else if (blow >= 0.5) STYLE[n] = ['coin', Math.round(100 * blow)];
  else if (tm <= 40) STYLE[n] = ['quick', Math.round(tm)];
  else if (tm >= 70) STYLE[n] = ['grind', Math.round(tm)];
  if (lost.length >= 10 && hit - avgLossLv[lv(n)] >= 0.045) HITTER[n] = [Math.round(100 * hit), Math.round(100 * avgLossLv[lv(n)])];
}
console.log('STYLE = ' + JSON.stringify(STYLE) + ';');
console.log('HITTER = ' + JSON.stringify(HITTER) + ';');
if (process.env.STAT) console.log(JSON.stringify(stat, null, 0));
