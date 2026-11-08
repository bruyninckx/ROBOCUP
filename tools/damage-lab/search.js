// Coordinate-descent search over weapon knobs + builds for the market robots. node search.js in.json out.json
const fs = require('fs'), { Worker } = require('worker_threads');
const L = require('./engine.js'), M = require('./market.js');
const [inF, outF] = process.argv.slice(2);
const cfg = JSON.parse(fs.readFileSync(inF, 'utf8'));
const names = Object.keys(cfg.robots); let builds = names.map(k => cfg.robots[k]);
const tune = Object.assign({}, cfg.tune);
for (const b of builds) if (tune[b.weapon] == null) tune[b.weapon] = L.TUNE[b.weapon] != null ? L.TUNE[b.weapon] : 1;
const seeds = cfg.seeds, arenas = cfg.arenas;
const cache = new Map(); // pair key -> results
const key = (i, j) => JSON.stringify([builds[i], builds[j], tune[builds[i].weapon], tune[builds[j].weapon], tune.dmg]);
async function evalAll(changed) {
  const n = builds.length, need = [];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (!cache.has(key(i, j))) need.push([i, j]);
  if (need.length) {
    const s = await M.evaluate(builds, { tune, seeds, arenas, pairs: need });
    for (const [i, j] of need) cache.set(key(i, j), s.res.filter(r => r.i === i && r.j === j));
  }
  const all = []; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) all.push(...cache.get(key(i, j)));
  return summ(all);
}
function summ(res) { // reuse market.js summarise via a fake evaluate result
  const n = builds.length, win = Array.from({ length: n }, () => Array(n).fill(0)), cnt = Array.from({ length: n }, () => Array(n).fill(0)), times = [], ko = {};
  for (const r of res) { cnt[r.i][r.j]++; cnt[r.j][r.i]++; if (r.iWon) win[r.i][r.j]++; else win[r.j][r.i]++; times.push(r.t); ko[r.ko] = (ko[r.ko] || 0) + 1; }
  const wr = win.map((row, i) => row.map((w, j) => cnt[i][j] ? w / cnt[i][j] : null));
  const avg = wr.map(row => { const v = row.filter(x => x != null); return v.reduce((a, b) => a + b, 0) / v.length; });
  times.sort((a, b) => a - b);
  return { wr, avg, med: times[times.length >> 1], q1: times[times.length >> 2], q3: times[(times.length * 3) >> 2], timeouts: res.filter(r => r.how !== 'KO').length / res.length, ko, res };
}
const clone = o => JSON.parse(JSON.stringify(o));
function moves(i) {
  const b = builds[i], out = [], w = b.weapon, frontTool = L.WEAPONS[w].cat !== 'top';
  const k = b.dmgK || 1;
  out.push(['dmgK', k * 0.8], ['dmgK', k * 1.25]);
  const CH = ['light', 'medium', 'heavy'], ci = CH.indexOf(b.chassis);
  if (ci > 0) out.push(['chassis', CH[ci - 1]]); if (ci < 2) out.push(['chassis', CH[ci + 1]]);
  for (const bk of Object.keys(L.BUMPERS)) if (bk !== (b.bumper || 'steel')) out.push(['bumper', bk]);
  if (cfg.drives) for (const d of Object.keys(L.DRIVES)) if (d !== b.drive) out.push(['drive', d]);
  out.push(['motor', b.motor === 'std' ? 'hot' : 'std'], ['battery', b.battery === 'std' ? 'big' : 'std']);
  for (const a of ['side', 'rear', 'top', 'front']) { if (a === 'front' && frontTool) continue; const v = b.armour[a]; if (v > 0) out.push(['armour.' + a, v - 1]); if (v < 3) out.push(['armour.' + a, v + 1]); }
  return out;
}
function apply(i, m) {
  const [f, v] = m;
  if (f === 'knob') { tune[builds[i].weapon] = +v.toFixed(3); return true; }
  const b = clone(builds[i]); if (f === 'dmgK') { b.dmgK = +v.toFixed(3); builds[i] = b; return true; } if (f.startsWith('armour.')) b.armour[f.slice(7)] = v; else b[f] = v;
  if (L.weightOf(b) > 120) return false;
  builds[i] = b; return true;
}
function save(s, sc) {
  const robots = {}; names.forEach((n, i) => robots[n] = builds[i]);
  fs.writeFileSync(outF, JSON.stringify({ tune, arenas, seeds, robots, score: sc }, null, 1));
  fs.appendFileSync(outF + '.log', new Date().toISOString().slice(11, 19) + ' score ' + sc.toFixed(2) + '\n' + M.print(names, s) + '\n\n');
}
(async () => {
  let s = await evalAll(), best = M.score(s); save(s, best);
  for (let round = 1; round <= (cfg.rounds || 4); round++) {
    let improved = false;
    // worst robots first
    const order = names.map((_, i) => i).sort((a, b) => Math.abs(s.avg[b] - 0.5) - Math.abs(s.avg[a] - 0.5));
    for (const i of order) {
      for (const m of moves(i)) {
        const bb = clone(builds[i]), kk = tune[builds[i].weapon];
        if (!apply(i, m)) continue;
        const s2 = await evalAll(), sc = M.score(s2);
        if (sc < best - 0.3) { best = sc; s = s2; improved = true; fs.appendFileSync(outF + '.log', `r${round} ${names[i]} ${m[0]}=${typeof m[1] === 'number' ? m[1].toFixed(2) : m[1]} -> ${sc.toFixed(2)}\n`); save(s, best); }
        else { builds[i] = bb; tune[builds[i].weapon] = kk; }
      }
    }
    fs.appendFileSync(outF + '.log', `== round ${round} done, score ${best.toFixed(2)}\n`);
    if (!improved) break;
  }
  fs.appendFileSync(outF + '.log', 'DONE\n');
})();
