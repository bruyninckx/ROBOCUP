// ROBOCUS 2.0 part fit report (Kev, 10 Nov): node partfit-report.js [top] [dir with partfit.js output]. Split-half check of robot x part fit.
const fs = require('fs'), d = process.argv[3] || __dirname + '/fit/', L = require('./engine.js');
const R = fs.readdirSync(d).filter(f => f.endsWith('.json')).map(f => JSON.parse(fs.readFileSync(d + f)));
const mean = a => a.reduce((x, y) => x + y, 0) / (a.length || 1);
const parts = Object.keys(R[0].parts).filter(p => p !== 'none');
// per robot x part: delta win, delta margin, split halves (seeds 0-1 vs 2-3)
const rows = [];
for (const r of R) { const base = r.parts.none;
  for (const p of parts) { const f = r.parts[p];
    const dm = (sel) => mean(f.filter(x => sel(x[2])).map(x => x[1])) - mean(base.filter(x => sel(x[2])).map(x => x[1]));
    rows.push({ r: r.robot, lv: r.level, p, dw: 100 * (mean(f.map(x => x[0])) - mean(base.map(x => x[0]))), dm: dm(() => true), h1: dm(s => s < 2), h2: dm(s => s >= 2) }); } }
// interaction: remove part mean and robot mean
const pm = {}, rm = {}; for (const p of parts) pm[p] = mean(rows.filter(x => x.p === p).map(x => x.dm)); for (const r of R) rm[r.robot] = mean(rows.filter(x => x.r === r.robot).map(x => x.dm));
const gm = mean(rows.map(x => x.dm));
for (const x of rows) { x.ix = x.dm - pm[x.p] - rm[x.r] + gm; x.i1 = x.h1 - pm[x.p] - rm[x.r] + gm; x.i2 = x.h2 - pm[x.p] - rm[x.r] + gm; }
const corr = (a, b) => { const ma = mean(a), mb = mean(b); let s = 0, sa = 0, sb = 0; for (let i = 0; i < a.length; i++) { s += (a[i] - ma) * (b[i] - mb); sa += (a[i] - ma) ** 2; sb += (b[i] - mb) ** 2; } return s / Math.sqrt(sa * sb); };
console.log('robots', R.length, 'combos', rows.length);
console.log('split-half correlation: raw delta margin', corr(rows.map(x => x.h1), rows.map(x => x.h2)).toFixed(2), '| robot x part interaction', corr(rows.map(x => x.i1), rows.map(x => x.i2)).toFixed(2));
module.exports = { R, rows, parts, pm, rm, mean };
if (process.argv[2] === 'top') { const s = rows.slice().sort((a, b) => b.ix - a.ix); console.log('best fits', s.slice(0, 25).map(x => x.r + '+' + x.p + ' ' + Math.round(x.ix) + ' (' + Math.round(x.i1) + '/' + Math.round(x.i2) + ')').join('\n')); console.log('worst fits', s.slice(-25).map(x => x.r + '+' + x.p + ' ' + Math.round(x.ix) + ' (' + Math.round(x.i1) + '/' + Math.round(x.i2) + ')').join('\n')); }
