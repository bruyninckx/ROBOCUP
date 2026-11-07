// How much does each helper drone add? Each market robot + one drone vs the other market robots (no drones), against the same fights without the drone.
// node dronevalue.js out.json [seeds from to]
const M = require('./market.js'), L = require('./engine.js'), fs = require('fs');
const [out, s0 = 401, s1 = 410] = process.argv.slice(2);
const names = Object.keys(L.PRESETS).filter(k => L.PRESETS[k].market), base = names.map(n => ({ preset: n }));
const drones = process.env.DRONES ? process.env.DRONES.split(',') : Object.keys(L.HELPERS), seeds = []; for (let s = +s0; s <= +s1; s++) seeds.push(s);
(async () => {
  const builds = base.slice(), pairs = [], meta = [];
  for (let i = 0; i < names.length; i++) for (const k of [null, ...drones]) {
    const idx = builds.length; builds.push(k ? { preset: names[i], helpers: [k] } : { preset: names[i] }); meta.push({ idx, i, k });
    for (let j = 0; j < names.length; j++) if (j !== i) pairs.push([idx, j]);
  }
  const s = await M.evaluate(builds, { seeds, arenas: ['open', 'pit'], pairs });
  const res = {};
  for (const m of meta) { const v = names.map((_, j) => j).filter(j => j !== m.i).map(j => s.wr[m.idx][j]); res[(m.k || 'none') + '|' + names[m.i]] = v.reduce((a, b) => a + b, 0) / v.length; }
  const table = {}; for (const k of drones) { const d = names.map(n => Math.round((res[k + '|' + n] - res['none|' + n]) * 100)); table[k] = { avg: Math.round(d.reduce((a, b) => a + b, 0) / d.length), per: Object.fromEntries(names.map((n, i) => [n, d[i]])) }; }
  fs.writeFileSync(out, JSON.stringify({ seeds: [s0, s1], base: Object.fromEntries(names.map(n => [n, Math.round(res['none|' + n] * 100)])), table }, null, 1));
  for (const [k, v] of Object.entries(table)) console.log(k.padEnd(10), 'avg +' + v.avg, JSON.stringify(v.per));
})();
