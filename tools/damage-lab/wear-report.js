// ROBOCUS 2.0 wear report (Kev, 11 Nov): node wear-report.js <wear-study .jsonl files>
// What carried-over damage costs in real fights (logit of wins, damaged vs as new on the same fights) against what the bookie charges.
const fs = require('fs');
const rows = process.argv.slice(2).flatMap(f => fs.readFileSync(f, 'utf8').trim().split('\n').filter(Boolean).map(l => JSON.parse(l)));
const lg = (w, n) => Math.log((w + 0.5) / (n - w + 0.5)), pad = (s, n) => String(s).padEnd(n), pct = x => Math.round(100 * x) + '%';
const acc = () => ({ k: 0, n: 0, b: 0, w: 0, ds: 0 }), add = (o, r) => { o.k++; o.n += r.n; o.b += r.base; o.w += r.worn; o.ds += r.ds; };
const line = (name, o) => pad(name, 34) + pad(o.k, 5) + pad(pct(o.b / o.n), 7) + pad(pct(o.w / o.n), 7) + pad((lg(o.w, o.n) - lg(o.b, o.n)).toFixed(2), 8) + (o.ds / o.k).toFixed(2);
const head = t => { console.log('\n' + t); console.log(pad('', 34) + pad('n', 5) + pad('new', 7) + pad('worn', 7) + pad('real', 8) + 'bookie   (change in strength, logits; one level = 0.62)'); };
const cat = r => r.z.drive === 'broken' ? 'drive broken' : r.z.weapon === 'broken' ? 'weapon broken' : r.z.body === 'broken' ? 'body broken only' + (r.z.drive !== 'ok' || r.z.weapon !== 'ok' ? ' (+dents)' : '') : 'damaged only';
console.log(rows.length + ' damaged states, ' + new Set(rows.map(r => r.robot)).size + ' robots, ' + rows.reduce((a, r) => a + r.n, 0) + ' fights');
const C = {}; for (const r of rows) add(C[r.v + ': ' + cat(r)] = C[r.v + ': ' + cat(r)] || acc(), r);
head('BY STATE  (raw = as it leaves the fight + the free body heal; body = Drive and Weapon repaired)'); Object.keys(C).sort().forEach(k => console.log(line(k, C[k])));
// body broken, Drive and Weapon fine: by what is lost
const bo = rows.filter(r => r.z.body === 'broken' && r.z.drive === 'ok' && r.z.weapon === 'ok');
const kind = l => /armour|plate|skirt|bumper|wedge|shield/i.test(l) && !/Top plate/.test(l) ? 'armour' : /Top plate/.test(l) ? 'top plate' : /chip/i.test(l) ? 'chip' : /drone/.test(l) ? 'drone' : /Battery|Radio/.test(l) ? 'battery/radio' : 'module/other';
const K = {}; for (const r of bo) for (const k of new Set(r.lost.map(kind))) add(K[k] = K[k] || acc(), r);
head('BODY BROKEN ONLY, by what is lost (a state counts under each kind it lost)'); Object.keys(K).sort().forEach(k => console.log(line(k, K[k])));
const N = {}; for (const r of bo) add(N['lost ' + Math.min(4, r.lost.length) + (r.lost.length >= 4 ? '+' : '') + ' body parts'] = N['lost ' + Math.min(4, r.lost.length) + (r.lost.length >= 4 ? '+' : '') + ' body parts'] || acc(), r);
Object.keys(N).sort().forEach(k => console.log(line(k, N[k])));
const other = {}; for (const r of bo) for (const l of r.lost) if (kind(l) === 'module/other') other[l] = (other[l] || 0) + 1; console.log('  module/other labels: ' + Object.entries(other).sort((a, b) => b[1] - a[1]).slice(0, 14).map(x => x[0] + ' ' + x[1]).join(', '));
const R = {}; for (const r of bo) add(R[r.robot] = R[r.robot] || Object.assign(acc(), { lv: r.lv }), r);
head('BODY BROKEN ONLY, by robot'); Object.keys(R).sort((a, b) => (lg(R[a].w, R[a].n) - lg(R[a].b, R[a].n)) - (lg(R[b].w, R[b].n) - lg(R[b].b, R[b].n))).forEach(k => console.log(line('L' + R[k].lv + ' ' + k, R[k])));
