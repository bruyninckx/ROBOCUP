// ROBOCUS 2.0 (Kev, 10 Nov): node sweep-ffa-report.js ffa-*.json -> per robot FFA wins vs its duel strength
const fs = require('fs'), M = require('./matrix-data.json'), LU = require('./lineup.js');
const all = Object.assign({}, LU.ROBOTS, LU.ROBOTS4), names = Object.keys(all), lv = n => all[n][0], P = M.arenas.open.pairs;
// Bradley-Terry strengths from the duel table (MM iterations)
const s = {}; names.forEach(n => s[n] = 1);
for (let it = 0; it < 200; it++) { for (const i of names) { let W = 0, den = 0; for (const j of names) { if (i === j) continue; const k = P[i + '|' + j] ? [P[i + '|' + j][0], P[i + '|' + j][1]] : [P[j + '|' + i][1] - P[j + '|' + i][0], P[j + '|' + i][1]]; W += k[0]; den += k[1] / (s[i] + s[j]); } s[i] = Math.max(1e-3, W / den); } const g = Math.exp(names.reduce((a, n) => a + Math.log(s[n]), 0) / names.length); names.forEach(n => s[n] /= g); }
const files = process.argv.slice(2), F = files.flatMap(f => JSON.parse(fs.readFileSync(f)));
const st = {}; names.forEach(n => st[n] = { n: 0, w: 0, exp: 0, kos: 0, place: 0 });
for (const f of F) { const tot = f.pick.reduce((a, p) => a + s[p], 0);
  f.pick.forEach((p, i) => { const o = st[p]; o.n++; o.exp += s[p] / tot; if (f.win.includes(p)) o.w += 1 / f.win.length; o.kos += f.kos[i]; const pl = f.order.indexOf(p); o.place += pl >= 0 ? pl + 1 : 4; }); }
console.log('fights', F.length, 'avg length', Math.round(F.reduce((a, f) => a + f.t, 0) / F.length), 's');
const rows = names.map(n => { const o = st[n]; return { n, lv: lv(n), apps: o.n, win: 100 * o.w / o.n, exp: 100 * o.exp / o.n, kos: o.kos / o.n, place: o.place / o.n }; });
rows.forEach(r => { r.d = r.win - r.exp; r.se = 100 * Math.sqrt((r.exp / 100) * (1 - r.exp / 100) / r.apps); });
rows.sort((a, b) => b.d / b.se - a.d / a.se);
console.log('robot      L  apps  FFA win  duel-based exp  diff  (z)   KOs/fight  avg place');
rows.forEach(r => console.log(r.n.padEnd(12), r.lv, String(r.apps).padStart(4), r.win.toFixed(0).padStart(6) + '%', r.exp.toFixed(0).padStart(10) + '%', (r.d >= 0 ? '+' : '') + r.d.toFixed(0).padStart(4), (r.d / r.se).toFixed(1).padStart(5), r.kos.toFixed(2).padStart(8), r.place.toFixed(2).padStart(8)));
fs.writeFileSync(__dirname + '/ffa-rows.json', JSON.stringify(rows));
