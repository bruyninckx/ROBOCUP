// node partfit.js parts1.json : per part, effect in strength units (log-odds vs the panel, compared with the stock robot). One level = 0.62.
const d = require('./' + process.argv[2]);
const byB = {}; for (const [i, j, w] of d.res) { byB[i] = byB[i] || [0, 0]; byB[i][0] += w; byB[i][1]++; }
const lg = (w, t) => { const p = (w + 0.5) / (t + 1); return Math.log(p / (1 - p)); };
const stock = {}, rows = {};
for (const [k, r, pk] of d.meta) { const [w, t] = byB[k] || [0, 0]; if (pk === 'stock') stock[r] = lg(w, t); }
for (const [k, r, pk] of d.meta) { if (pk === 'stock') continue; const [w, t] = byB[k] || [0, 0]; (rows[pk] = rows[pk] || {})[r] = lg(w, t) - stock[r]; }
const out = Object.entries(rows).map(([pk, per]) => { const v = Object.values(per), avg = v.reduce((a, b) => a + b, 0) / v.length, sd = Math.sqrt(v.reduce((a, b) => a + (b - avg) ** 2, 0) / v.length); return { pk, avg, sd, lvl: avg / 0.62, good: v.filter(x => x >= 0.4).length, bad: v.filter(x => x < 0).length, n: v.length, per }; }).sort((a, b) => b.avg - a.avg);
for (const o of out) console.log(o.pk.padEnd(18), 'avg', o.avg.toFixed(2).padStart(5), '= ' + o.lvl.toFixed(2) + ' levels', ' sd', o.sd.toFixed(2), ' robots >=0.4:', o.good + '/' + o.n, ' worse:', o.bad, ' ', Object.entries(o.per).map(([r, x]) => r.slice(0, 5) + ' ' + x.toFixed(1)).join(' '));
require('fs').writeFileSync(process.argv[2].replace('.json', '.fit.json'), JSON.stringify(out));
