// node rr-free-report.js out0.json out1.json ... : one rating per robot (Bradley-Terry, Elo scale: +100 = wins about 64%), win %, its current level and power tweaks, and how many robots it beats 75%+ / loses to 75%+
const L = require('./engine.js'), LU = require('./lineup.js'), fs = require('fs');
const res = [].concat(...process.argv.slice(2).map(f => JSON.parse(fs.readFileSync(f))));
const names = [...Object.keys(LU.ROBOTS), ...Object.keys(LU.ROBOTS4), ...Object.keys(LU.CANDIDATES)];
const cur = n => LU.ROBOTS[n] ? 'L' + LU.ROBOTS[n][0] : LU.ROBOTS4[n] ? 'L' + LU.ROBOTS4[n][0] + '*' : 'cand L' + LU.CANDIDATES[n][0];
const knob = n => { const g = (LU.ROBOTS[n] || LU.ROBOTS4[n] || LU.CANDIDATES[n])[1], d = L.PRESETS[n].dmgK || 1; return { g, d }; };
// Bradley-Terry (MM), draws as half wins, small prior
const W = {}, G = {}; for (const n of names) { W[n] = 0.5; G[n] = {}; }
for (const r of res) { const a = r.wa + r.dr / 2, b = r.wb + r.dr / 2, N = r.wa + r.wb + r.dr; W[r.a] += a; W[r.b] += b; G[r.a][r.b] = (G[r.a][r.b] || 0) + N; G[r.b][r.a] = (G[r.b][r.a] || 0) + N; }
let p = Object.fromEntries(names.map(n => [n, 1]));
for (let it = 0; it < 500; it++) { const q = {}; for (const i of names) { let s = 1 / (p[i] + 1); for (const [j, N] of Object.entries(G[i])) s += N / (p[i] + p[j]); q[i] = W[i] / s; } const gm = Math.exp(names.reduce((a, n) => a + Math.log(q[n]), 0) / names.length); for (const n of names) p[n] = q[n] / gm; }
const elo = n => 400 * Math.log10(p[n]);
const wr = {}; for (const n of names) { let w = 0, t = 0; for (const r of res) { if (r.a === n) { w += r.wa + r.dr / 2; t += r.wa + r.wb + r.dr; } if (r.b === n) { w += r.wb + r.dr / 2; t += r.wa + r.wb + r.dr; } } wr[n] = w / t; }
const pr = {}; for (const r of res) { const N = r.wa + r.wb + r.dr; (pr[r.a] = pr[r.a] || []).push([r.b, (r.wa + r.dr / 2) / N]); (pr[r.b] = pr[r.b] || []).push([r.a, (r.wb + r.dr / 2) / N]); }
const sorted = names.slice().sort((a, b) => elo(b) - elo(a));
console.log('fights', res.reduce((a, r) => a + r.wa + r.wb + r.dr, 0), 'pairs', res.length, 'draws', res.reduce((a, r) => a + r.dr, 0));
for (const n of sorted) { const k = knob(n), m = pr[n] || []; const beat = m.filter(x => x[1] >= 0.75).length, lost = m.filter(x => x[1] <= 0.25).length;
  console.log(n.padEnd(12), String(Math.round(elo(n))).padStart(5), (Math.round(wr[n] * 100) + '%').padStart(5), cur(n).padEnd(8), ('p' + k.g + (k.d !== 1 ? ' dmg x' + k.d : '')).padEnd(18), 'beats', String(beat).padStart(2), 'loses', String(lost).padStart(2)); }
fs.writeFileSync('rr-free-rating.json', JSON.stringify({ sorted: sorted.map(n => ({ n, elo: Math.round(elo(n)), wr: wr[n], cur: cur(n), knob: knob(n) })), res }, null, 1));
