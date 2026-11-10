// ROBOCUS 2.0 (Kev, 10 Nov): 2v2 report (reads tv-21100.json, tv-25500.json)
const fs = require('fs'), M = require('./matrix-data.json'), LU = require('./lineup.js');
const all = Object.assign({}, LU.ROBOTS, LU.ROBOTS4), names = Object.keys(all), lv = n => all[n][0], P = M.arenas.open.pairs;
const s = {}; names.forEach(n => s[n] = 1);
for (let it = 0; it < 200; it++) { for (const i of names) { let W = 0, den = 0; for (const j of names) { if (i === j) continue; const k = P[i + '|' + j] ? [P[i + '|' + j][0], P[i + '|' + j][1]] : [P[j + '|' + i][1] - P[j + '|' + i][0], P[j + '|' + i][1]]; W += k[0]; den += k[1] / (s[i] + s[j]); } s[i] = Math.max(1e-3, W / den); } }
const stat = files => { const st = {}; names.forEach(n => st[n] = { n: 0, w: 0, exp: 0, kos: 0, alive: 0 });
  for (const f of files.flatMap(x => JSON.parse(fs.readFileSync(x)))) { const A = s[f.pick[0]] + s[f.pick[1]], B = s[f.pick[2]] + s[f.pick[3]], winA = f.win.some(p => f.pick.indexOf(p) < 2), winB = f.win.some(p => f.pick.indexOf(p) >= 2);
    f.pick.forEach((p, i) => { const o = st[p], mine = i < 2; o.n++; o.exp += (mine ? A : B) / (A + B); if (mine ? winA : winB) o.w++; o.kos += f.kos[i]; o.alive += f.alive[i]; }); }
  const rows = names.map(n => ({ n, lv: lv(n), apps: st[n].n, win: 100 * st[n].w / st[n].n, exp: 100 * st[n].exp / st[n].n, kos: st[n].kos / st[n].n, alive: st[n].alive / st[n].n }));
  const mx = rows.reduce((a, r) => a + r.exp, 0) / rows.length, my = rows.reduce((a, r) => a + r.win, 0) / rows.length; let sxy = 0, sxx = 0; for (const r of rows) { sxy += (r.exp - mx) * (r.win - my); sxx += (r.exp - mx) ** 2; }
  const b = sxy / sxx, a = my - b * mx; rows.forEach(r => { r.res = r.win - (a + b * r.exp); }); return { a, b, rows }; };
const A = stat(['tv-21100.json']), B = stat(['tv-25500.json']), C = stat(['tv-21100.json', 'tv-25500.json']);
const ra = Object.fromEntries(A.rows.map(r => [r.n, r.res])), rb = Object.fromEntries(B.rows.map(r => [r.n, r.res]));
const x = names.map(n => ra[n]), y = names.map(n => rb[n]), m1 = x.reduce((p, q) => p + q) / x.length, m2 = y.reduce((p, q) => p + q) / y.length;
let sxy = 0, sa = 0, sb = 0; for (let i = 0; i < x.length; i++) { sxy += (x[i] - m1) * (y[i] - m2); sa += (x[i] - m1) ** 2; sb += (y[i] - m2) ** 2; }
console.log('2v2: team win = ' + C.a.toFixed(1) + ' + ' + C.b.toFixed(2) + ' x duel-based expectation; split-half r =', (sxy / Math.sqrt(sa * sb)).toFixed(2));
C.rows.sort((p, q) => q.res - p.res).forEach(r => console.log(r.n.padEnd(12), 'L' + r.lv, 'apps', r.apps, 'team win', r.win.toFixed(0) + '%', 'exp', (C.a + C.b * r.exp).toFixed(0) + '%', 'res', (r.res >= 0 ? '+' : '') + r.res.toFixed(0), 'halves', ra[r.n].toFixed(0) + '/' + rb[r.n].toFixed(0), 'KOs', r.kos.toFixed(2), 'survives', Math.round(100 * r.alive) + '%'));
fs.writeFileSync('tv-final.json', JSON.stringify(C));
