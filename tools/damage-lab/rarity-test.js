// Rarity tiers in levels (Kev, 16 Nov): every non-chip part at every tier on a sample of robots against robots a level up, same seeds
// for every tier.   node rarity-test.js shard nShards out.json   RAR='[1,1.2,1.4,1.6,2.2]'   then: node rarity-test.js --sum a.json b.json
const L = require('./engine.js'), LU = require('./lineup.js'), fs = require('fs');
LU.usePK();
if (process.argv[2] === '--sum') {
  const rows = [].concat(...process.argv.slice(3).map(f => JSON.parse(fs.readFileSync(f)))), lg = p => Math.log(Math.max(.02, Math.min(.98, p)) / (1 - Math.max(.02, Math.min(.98, p)))), step = lg(0.64);
  const agg = key => { const W = {}; for (const r of rows) { const k = key(r); if (k == null) continue; (W[k] = W[k] || [0, 0])[0] += r[4]; W[k][1]++; } return W; };
  const none = agg(r => r[1] ? null : 'none').none, base = none[0] / none[1];
  console.log('no part: ' + Math.round(base * 100) + '% (' + none[1] + ' fights)');
  const show = (title, key) => { console.log(title); const W = agg(key); for (const k of Object.keys(W).sort()) console.log('  ' + k.padEnd(22) + String(Math.round(100 * W[k][0] / W[k][1])).padStart(3) + '%  ' + ((lg(W[k][0] / W[k][1]) - lg(base)) / step).toFixed(2).padStart(6) + ' levels  (' + W[k][1] + ' fights)'); };
  show('by tier', r => r[1] ? 'tier ' + r[2] : null);
  show('by tier and kind', r => r[1] ? LU.PARTS[r[1]].kind.padEnd(10) + ' tier ' + r[2] : null);
  process.exit(0);
}
if (process.env.RAR) LU.RAR_Q.splice(0, 5, ...JSON.parse(process.env.RAR));
const [shard, nsh, out] = [+process.argv[2], +process.argv[3], process.argv[4]];
const all = Object.assign({}, LU.ROBOTS, LU.ROBOTS4), names = Object.keys(all), lv = n => all[n][0];
const sample = names.filter((n, i) => lv(n) <= 3 && i % 2 === 0), parts = Object.keys(LU.PARTS).filter(k => LU.PARTS[k].kind !== 'chip');
const res = []; let job = 0;
for (const n of sample) { const opp = names.filter(m => m !== n && lv(m) === lv(n) + 1).slice(0, 2);
  for (const k of [null].concat(parts)) for (const o of opp) { if ((job++ % nsh) !== shard) continue;
    for (const t of k ? [0, 1, 2, 3, 4] : [0]) { const sw = names.indexOf(o) % 2, A = LU.build(n, k ? [k] : [], k ? { [k]: t } : null), B = LU.build(o), S = L.create({ a: sw ? B : A, b: sw ? A : B, seed: (+process.env.SEED || 52000) + names.indexOf(o) * 13 + names.indexOf(n), arena: 'open' });
      while (!S.over && S.t < 200) { L.step(S); S.fx.length = 0; }
      const w = S.result.winner; res.push([n, k, t, o, w == null ? 0.5 : ((w === 0) !== !!sw ? 1 : 0)]); } } }
fs.writeFileSync(out, JSON.stringify(res)); console.log('done', res.length);
