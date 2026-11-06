const r = require(require('path').resolve(process.argv[2])); const names = [...new Set(Object.keys(r.cc).map(k => k.split('|')[0]))]; const st = [...new Set(Object.keys(r.cs).map(k => k.split('|')[1]))];
const avg = a => a.reduce((x, y) => x + y, 0) / a.length;
const rows = names.map(n => { const vc = names.filter(m => m !== n).map(m => r.cc[n + '|' + m]), vs = st.map(m => r.cs[n + '|' + m]);
  return { n, vc: avg(vc), vs: avg(vs), hard: vc.filter(p => p >= 0.9 || p <= 0.1).length, sHard: vs.filter(p => p >= 0.95).length, minS: Math.min(...vs) }; }).sort((a, b) => b.vc - a.vc);
console.log('card'.padEnd(12), 'vs cards', 'vs starters', '90/10 vs cards', 'starters it beats 95%+', 'worst vs a starter');
rows.forEach(x => console.log(x.n.padEnd(12), (100 * x.vc).toFixed(0).padStart(6) + '%', (100 * x.vs).toFixed(0).padStart(9) + '%', String(x.hard).padStart(10), String(x.sHard).padStart(12), (100 * x.minS).toFixed(0).padStart(12) + '%'));
const lop = Object.keys(r.cc).filter(k => { const [a, b] = k.split('|'); return a < b && (r.cc[k] >= 0.9 || r.cc[k] <= 0.1); }).length;
console.log('lopsided card pairs (90/10+):', lop, 'of', names.length * (names.length - 1) / 2, '| spread vs cards', (100 * (rows[0].vc - rows[rows.length - 1].vc)).toFixed(0), 'pts');
if (process.argv[3]) { console.log('\nmatrix (row beats column):'); console.log(''.padEnd(11) + names.map(n => n.slice(0, 5).padStart(6)).join('')); names.forEach(a => console.log(a.padEnd(11) + names.map(b => a === b ? '     –' : String(Math.round(100 * r.cc[a + '|' + b])).padStart(6)).join(''))); }
