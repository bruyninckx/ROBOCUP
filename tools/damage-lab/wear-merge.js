// T41: pair a new wear-game run (VARIANTS=all, maybe with new knobs) with the 'off' fights of an earlier run on the same ids
// (T37's tools/damage-lab/wear-game/duel_*.jsonl), so wear-game-report.js can compare them. node wear-merge.js out.jsonl new.jsonl... [--base f...]
const fs = require('fs');
const args = process.argv.slice(2), bi = args.indexOf('--base');
const out = args[0], news = (bi < 0 ? args.slice(1) : args.slice(1, bi)), bases = bi < 0 ? ['wear-game/duel_0.jsonl', 'wear-game/duel_1.jsonl'].map(f => __dirname + '/' + f) : args.slice(bi + 1);
const base = {}; for (const f of bases) for (const l of fs.readFileSync(f, 'utf8').split('\n')) if (l) { const r = JSON.parse(l); base[r.id] = r; }
const lines = []; let miss = 0;
for (const f of news) for (const l of fs.readFileSync(f, 'utf8').split('\n')) if (l) { const r = JSON.parse(l), b = base[r.id]; if (!b) { miss++; continue; }
  const off = b.r.find(x => x.v === 'off'); lines.push(JSON.stringify(Object.assign({}, r, { r: [off].concat(r.r.filter(x => x.v !== 'off')) }))); }
fs.writeFileSync(out, lines.join('\n') + '\n'); console.log('merged', lines.length, 'missing base', miss);
