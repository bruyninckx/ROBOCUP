// What is an upgrade worth? Each market robot + one upgrade vs the other six market robots (stock),
// on the same seeds as the stock robot, so the difference is the upgrade. node upgrades.js [seeds] > out.json
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
if (!isMainThread) {
  const L = require('./engine.js'); const out = [];
  for (const [vi, opp, seed, arena] of workerData.jobs) {
    const v = workerData.vars[vi], swap = seed % 2 === 1;
    const A = Object.assign({}, v.spec, { name: 'A' }), B = { preset: opp, name: 'B' };
    const S = L.run(swap ? { a: B, b: A, seed, arena } : { a: A, b: B, seed, arena }, 200);
    out.push([vi, (S.result.winner === 0) !== swap ? 1 : 0, S.t]);
  }
  parentPort.postMessage(out); return;
}
const L = require('./engine.js');
const M = L.MARKET_TABLE.names, NS = +process.argv[2] || 12, S0 = +process.env.SEED0 || 3001, seeds = Array.from({ length: NS }, (_, k) => S0 + k);
const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null; // robot:cat:key filter (stock always kept)
const vars = [];
for (const r of M) {
  const P = L.normSpec({ preset: r }), base = { preset: r };
  const add = (cat, key, label, extra) => (cat === 'stock' && (!ONLY || ONLY.some(x => x.startsWith(r + ':'))) || !ONLY || ONLY.includes(`${r}:${cat}:${key}`)) && vars.push({ robot: r, cat, key, label, spec: Object.assign({}, P, base, extra) });
  add('stock', 'stock', 'stock', {});
  for (const [k, d] of Object.entries(L.DESIGNS[P.weapon] || {})) add('weapon', k, d.label, { wd: k });
  for (const s of ['side', 'top', 'rear', 'front']) if (P.armour[s] < 3 && !(s === 'front' && L.frontTool(P.weapon))) add('armour', s, `+1 ${s} armour`, { armour: Object.assign({}, P.armour, { [s]: P.armour[s] + 1 }) });
  if (P.motor === 'std') add('motor', 'hot', 'hot-wound motors', { motor: 'hot' });
  if (P.battery === 'std') add('battery', 'big', 'big battery', { battery: 'big' });
  for (const pr of Object.keys(L.PROCS)) if (pr !== P.proc) add('chip', pr, L.PROCS[pr].label, { proc: pr });
}
const jobs = []; vars.forEach((v, vi) => { for (const o of M) if (o !== v.robot) for (const s of seeds) for (const a of ['open', 'pit']) jobs.push([vi, o, s, a]); });
console.error(vars.length, 'variants', jobs.length, 'fights');
const W = 2, chunks = Array.from({ length: W }, (_, k) => jobs.filter((_, n) => n % W === k)), t0 = Date.now();
Promise.all(chunks.map(c => new Promise((ok, bad) => { const w = new Worker(__filename, { workerData: { jobs: c, vars } }); w.on('message', ok); w.on('error', bad); }))).then(rs => {
  const res = rs.flat(), win = vars.map(() => 0), n = vars.map(() => 0), tt = vars.map(() => 0);
  for (const [vi, w, t] of res) { win[vi] += w; n[vi]++; tt[vi] += t; }
  const out = vars.map((v, vi) => ({ robot: v.robot, cat: v.cat, key: v.key, label: v.label, kg: L.weightOf(v.spec), win: Math.round(1000 * win[vi] / n[vi]) / 10, n: n[vi], t: Math.round(tt[vi] / n[vi]) }));
  for (const r of M) { const b = out.find(o => o.robot === r && o.cat === 'stock'); for (const o of out) if (o.robot === r) o.delta = Math.round((o.win - b.win) * 10) / 10; }
  console.log(JSON.stringify({ fights: res.length, perVariant: n[0], seeds, out }, null, 1)); console.error('done in', Math.round((Date.now() - t0) / 1000), 's');
});
