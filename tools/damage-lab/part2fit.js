// node part2fit.js out.json : per part, win % of (tier n robot + part) vs tier n+gap, next to stock
const d = require('./' + process.argv[2]), byK = {};
for (const [i, j, w] of d.res) { byK[i] = byK[i] || [0, 0]; byK[i][0] += w; byK[i][1]++; }
const agg = {}; for (const [k, r, t, pk] of d.meta) { const [w, n] = byK[k] || [0, 0]; const a = agg[pk] = agg[pk] || { w: 0, n: 0, per: {}, tiers: {} }; a.w += w; a.n += n; a.per[r] = Math.round(100 * w / n); const tt = a.tiers[t] = a.tiers[t] || [0, 0]; tt[0] += w; tt[1] += n; }
const rows = Object.entries(agg).map(([pk, a]) => ({ pk, wr: a.w / a.n, per: a.per, tiers: a.tiers, close: Object.values(a.per).filter(x => x >= 40).length, nr: Object.keys(a.per).length })).sort((x, y) => y.wr - x.wr);
console.log(`gap ${d.gap} level(s): win % of a tier-n robot with the part vs the tier n+${d.gap} robots (50% = gap closed)`, JSON.stringify(d.pk));
for (const r of rows) console.log(r.pk.padEnd(16), String(Math.round(100 * r.wr)).padStart(3) + '%', ' by tier', Object.entries(r.tiers).map(([t, [w, n]]) => 'L' + t + ' ' + Math.round(100 * w / n)).join(' '), ' robots >=40%:', r.close + '/' + r.nr);
require('fs').writeFileSync(process.argv[2].replace('.json', '.fit.json'), JSON.stringify(rows));
