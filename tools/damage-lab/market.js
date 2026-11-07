// Balance harness for the Damage Lab market robots. node market.js [file.json]
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
if (!isMainThread) {
  const L = require('./engine.js');
  Object.assign(L.TUNE, workerData.tune || {}); if (process.env.OMNI) L.ARC.omni = +process.env.OMNI; if (process.env.OKB) L.DRIVES.omni.kb = +process.env.OKB; if (process.env.OFACE) L.ARC.omniFace = +process.env.OFACE;
  const out = [];
  for (const job of workerData.jobs) {
    const [i, j, seed, arena] = job, swap = seed % 2 === 1;
    const A = Object.assign({}, workerData.builds[swap ? j : i], { name: 'A' }), B = Object.assign({}, workerData.builds[swap ? i : j], { name: 'B' });
    const S = L.run({ a: A, b: B, seed, arena }, 200);
    const r = S.result; const wA = r.winner === 0;
    const iWon = swap ? !wA : wA;
    const loser = S.robots[r.winner ? 0 : 1];
    out.push({ i, j, seed, arena, iWon, t: r.t, how: r.how, ko: r.how === 'KO' ? (loser.ko || '').replace(/ \(.*\)/, '').replace(/,.*/, '') : 'time' });
  }
  parentPort.postMessage(out);
  return;
}
async function evaluate(builds, opts = {}) {
  const seeds = opts.seeds || [1, 2, 3, 4, 5, 6, 7, 8], arenas = opts.arenas || ['open'], tune = opts.tune || {};
  const pairs = opts.pairs || (() => { const p = []; for (let i = 0; i < builds.length; i++) for (let j = i + 1; j < builds.length; j++) p.push([i, j]); return p; })();
  const jobs = []; for (const [i, j] of pairs) for (const s of seeds) for (const a of arenas) jobs.push([i, j, s, a]);
  const W = opts.workers || 2, chunks = Array.from({ length: W }, (_, k) => jobs.filter((_, n) => n % W === k));
  const res = (await Promise.all(chunks.map(c => new Promise((ok, bad) => { const w = new Worker(__filename, { workerData: { jobs: c, builds, tune } }); w.on('message', ok); w.on('error', bad); })))).flat();
  return summarise(builds, res);
}
function summarise(builds, res) {
  const n = builds.length, win = Array.from({ length: n }, () => Array(n).fill(0)), cnt = Array.from({ length: n }, () => Array(n).fill(0));
  const times = [], ko = {};
  for (const r of res) { cnt[r.i][r.j]++; cnt[r.j][r.i]++; if (r.iWon) win[r.i][r.j]++; else win[r.j][r.i]++; times.push(r.t); ko[r.ko] = (ko[r.ko] || 0) + 1; }
  const wr = win.map((row, i) => row.map((w, j) => cnt[i][j] ? w / cnt[i][j] : null));
  const avg = wr.map(row => { const v = row.filter(x => x != null); return v.reduce((a, b) => a + b, 0) / v.length; });
  times.sort((a, b) => a - b);
  const med = times[Math.floor(times.length / 2)], timeouts = res.filter(r => r.how !== 'KO').length / res.length;
  return { wr, avg, med, q1: times[Math.floor(times.length / 4)], q3: times[Math.floor(times.length * 3 / 4)], timeouts, ko, res };
}
function score(s) {
  let e = 0;
  // drama-first: averages within about 44-56%, no matchup worse than 80/20, short violent fights (median 40-70 s), few judges
  for (const a of s.avg) e += Math.pow(Math.max(0, Math.abs(a - 0.5) - 0.06) * 10, 2) * 3;
  for (const row of s.wr) for (const x of row) if (x != null) e += Math.max(0, Math.abs(x - 0.5) - 0.3) * 20;
  e += Math.max(0, 40 - s.med) * 0.3 + Math.max(0, s.med - 70) * 0.3 + Math.max(0, s.timeouts - 0.1) * 30;
  return e;
}
function print(names, s) {
  const pad = (x, k) => String(x).padStart(k);
  let out = pad('', 10) + names.map(n => pad(n.slice(0, 8), 9)).join('') + '   avg\n';
  s.wr.forEach((row, i) => { out += pad(names[i].slice(0, 9), 10) + row.map(x => pad(x == null ? '-' : Math.round(x * 100), 9)).join('') + pad(Math.round(s.avg[i] * 100), 6) + '\n'; });
  out += `median ${s.med.toFixed(0)}s (q1 ${s.q1.toFixed(0)}, q3 ${s.q3.toFixed(0)}), time-outs ${(s.timeouts * 100).toFixed(0)}%\n`;
  out += 'endings: ' + Object.entries(s.ko).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', ') + '\n';
  out += 'score ' + score(s).toFixed(1);
  return out;
}
module.exports = { evaluate, score, print };
if (require.main === module) {
  (async () => {
    const cfg = JSON.parse(require('fs').readFileSync(process.argv[2] || 'market.json', 'utf8'));
    const names = Object.keys(cfg.robots), builds = names.map(k => cfg.robots[k]);
    const t0 = Date.now();
    const s = await evaluate(builds, { tune: cfg.tune, seeds: cfg.seeds, arenas: cfg.arenas });
    console.log(print(names, s)); console.error(((Date.now() - t0) / 1000).toFixed(1) + 's');
  })();
}
