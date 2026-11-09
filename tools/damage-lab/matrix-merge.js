// Merges the matrix-*.json runs (matrix.js) into matrix-data.json for the Lineup Arena's matchup overview (build.py inlines it).
// node matrix-merge.js <dir with matrix-*.json>
// per pair 'A|B': [A wins, fights, winner's health avg, A's health when A wins, B's health when B wins, knockouts, median seconds, blowouts (winner 60%+ health)]
const fs = require('fs'), path = require('path'), dir = process.argv[2] || '.';
const out = { made: new Date().toISOString().slice(0, 10), arenas: {} };
for (const f of fs.readdirSync(dir).filter(f => /^matrix-\w+-(all|same)-\d+\.json$/.test(f))) {
  const [, arena, mode] = f.match(/^matrix-(\w+)-(all|same)-/), D = JSON.parse(fs.readFileSync(path.join(dir, f)));
  const A = out.arenas[arena] = out.arenas[arena] || { mode, pairs: {} };
  for (const [k, fs2] of Object.entries(D)) {
    const aw = fs2.filter(x => x[0]).length, n = fs2.length, avg = xs => xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null;
    const ts = fs2.map(x => x[3]).sort((a, b) => a - b);
    A.pairs[k] = [aw, n, avg(fs2.map(x => x[1])), avg(fs2.filter(x => x[0]).map(x => x[1])), avg(fs2.filter(x => !x[0]).map(x => x[1])), fs2.filter(x => x[2]).length, ts[ts.length >> 1], fs2.filter(x => x[1] >= 60).length];
  }
}
fs.writeFileSync(path.join(__dirname, 'matrix-data.json'), JSON.stringify(out));
console.log(Object.entries(out.arenas).map(([k, v]) => k + ' ' + Object.keys(v.pairs).length).join(', '));
