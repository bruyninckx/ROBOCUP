const L = require('./engine.js');
const names = Object.keys(L.PRESETS);
const args = process.argv.slice(2);
const arena = args[0] || 'open';
const pairs = args[1] ? [args[1].split(',')] : null;
let rows = [];
const t0 = Date.now();
const list = pairs || names.map(a => names.map(b => [a, b])).flat().filter(([a, b]) => a < b);
for (const [a, b] of list) {
  for (let seed = 1; seed <= (pairs ? 4 : 1); seed++) {
    const S = L.run({ a: { preset: a, name: a }, b: { preset: b, name: b }, seed, arena });
    const r = S.result || { text: 'no result', winner: -1, t: S.t };
    rows.push(`${a} v ${b} s${seed}: ${r.t.toFixed(0)}s ${r.text} | lost ${S.robots[0].stats.lost.length}/${S.robots[1].stats.lost.length} dealt ${S.robots[0].stats.dealt.toFixed(0)}/${S.robots[1].stats.dealt.toFixed(0)}`);
    if (pairs) console.log(S.log.map(l => l.t.toFixed(1) + ' ' + l.text).join('\n'));
  }
}
console.log(rows.join('\n'));
console.error('ms', Date.now() - t0);
