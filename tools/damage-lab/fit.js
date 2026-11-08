// fit strengths from scan1.json: base strengths (round robin) + power slope per robot
const d = require('./' + (process.argv[2] || 'scan1.json')), T = require('./tiers.js');
const P = d.pool, n = P.length, meta = d.meta; // meta: [buildIdx, robotIdx, p]
// players: 0..n-1 base, then variants
const nv = n + meta.length, games = {};
for (const [i, j, w] of d.res) { const k = i + ',' + j; games[k] = games[k] || [i, j, 0, 0]; games[k][2] += w; games[k][3]++; }
const G = Object.values(games), s = T.bt(nv, G, 1500);
const rows = P.map((name, i) => { const lo = meta.find(m => m[1] === i && m[2] === 0.6), hi = meta.find(m => m[1] === i && m[2] === 1.6); return { name, s: s[i], lo: s[lo[0]], hi: s[hi[0]] }; });
// win% vs the whole pool (round robin)
for (const r of rows) { const i = P.indexOf(r.name); let w = 0, t = 0; for (const [a, b, ww, tt] of G) { if (a >= n || b >= n) continue; if (a === i) { w += ww; t += tt; } else if (b === i) { w += tt - ww; t += tt; } } r.wr = w / t; r.slope = (r.hi - r.lo) / Math.log(1.6 / 0.6); }
rows.sort((a, b) => b.s - a.s);
for (const r of rows) console.log(r.name.padEnd(11), (T.STARTERS.includes(r.name) ? 'S' : 'M'), 'str', r.s.toFixed(2).padStart(6), ' rr win', (100 * r.wr).toFixed(0).padStart(3) + '%', ' p0.6', r.lo.toFixed(2).padStart(6), ' p1.6', r.hi.toFixed(2).padStart(6), ' slope/ln p', r.slope.toFixed(2));
require('fs').writeFileSync('fit1.json', JSON.stringify(rows));
