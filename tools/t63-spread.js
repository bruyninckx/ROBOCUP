// T63 Part 2b (22 Nov 2026): how much does a part's value swing from opponent to opponent? From data already in the repo.
// For each robot + part: the gain (win % with the part minus without, same opponent) against each opponent, then
//   observed spread across opponents (SD)  =  true spread  +  noise of few fights per cell
// so true SD = sqrt(observed variance - mean noise variance). Noise is taken as unpaired (p1(1-p1)/k + p0(1-p0)/k): the fights are
// paired, which lowers the real noise a bit, so the true spread here is if anything too low (cautious).
//   node tools/t63-spread.js          writes tools/t63-out/spread.txt
'use strict';
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const ROOT = path.join(__dirname, '..'), OUT = path.join(ROOT, 'tools/t63-out'); fs.mkdirSync(OUT, { recursive: true });
const out = [];
let PAIRED = !process.argv.includes('--unpaired');
// cells: Map robot -> part ('' = bare) -> opp -> [wins, n]
function add(C, r, p, o, w, i) { const a = C[r] = C[r] || {}, b = a[p] = a[p] || {}, c = b[o] = b[o] || [0, 0, {}]; c[0] += w; c[1]++; if (i != null) c[2][i] = w; }
function analyse(name, C) {
  const rows = [];   // per robot+part
  for (const r of Object.keys(C)) {
    const bare = C[r]['']; if (!bare) continue;
    for (const p of Object.keys(C[r])) {
      if (p === '') continue;
      const g = [], nv = [];
      for (const o of Object.keys(C[r][p])) {
        const a = C[r][p][o], b = bare[o]; if (!b) continue;
        const p1 = a[0] / a[1], p0 = b[0] / b[1]; g.push(100 * (p1 - p0));
        // paired noise: the fight-by-fight differences on the same seeds, their sample variance / k (unbiased)
        const ks = Object.keys(a[2]).filter(i => b[2][i] != null);
        if (PAIRED && ks.length >= 2) { const d = ks.map(i => a[2][i] - b[2][i]), dm = d.reduce((x, y) => x + y, 0) / d.length; nv.push(1e4 * d.reduce((x, y) => x + (y - dm) ** 2, 0) / (d.length - 1) / d.length); }
        else { const s1 = (a[0] + 1) / (a[1] + 2), s0 = (b[0] + 1) / (b[1] + 2); nv.push(1e4 * (s1 * (1 - s1) / a[1] + s0 * (1 - s0) / b[1])); }
      }
      if (g.length < 3) continue;
      const m = g.reduce((x, y) => x + y, 0) / g.length, ov = g.reduce((x, y) => x + (y - m) ** 2, 0) / (g.length - 1), noise = nv.reduce((x, y) => x + y, 0) / nv.length;
      rows.push({ r, p, m, ov, noise, k: g.length, g });
    }
  }
  const N = rows.length, mean = f => rows.reduce((a, x) => a + f(x), 0) / N;
  const obs = mean(x => x.ov), noi = mean(x => x.noise), tv = Math.max(0, obs - noi), tsd = Math.sqrt(tv);
  const avgAbs = mean(x => Math.abs(x.m)), sdAvg = Math.sqrt(Math.max(0, mean(x => x.m * x.m) - mean(x => x.m) ** 2 - noi / rows[0].k));
  // with a normal model of the true swing: the share of (robot+part, opponent) cells whose true gain is 15+ points off the part's own average
  const erf = x => { const t = 1 / (1 + 0.3275911 * Math.abs(x)), y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return x >= 0 ? y : -y; };
  const fmt = 0; const tail = d => tsd ? 1 - erf(d / (tsd * Math.SQRT2)) : 0;
  // per part: true SD of its gain across opponents, pooled over robots
  const byPart = {}; for (const x of rows) (byPart[x.p] = byPart[x.p] || []).push(x);
  const partSd = Object.entries(byPart).map(([p, R]) => { const o = R.reduce((a, x) => a + x.ov, 0) / R.length, n = R.reduce((a, x) => a + x.noise, 0) / R.length; return [p, Math.sqrt(Math.max(0, o - n)), R.reduce((a, x) => a + x.m, 0) / R.length]; }).sort((a, b) => b[1] - a[1]);
  out.push(`== ${name}: ${N} robot+part combos, ${rows[0].k}-ish opponents each, about ${Math.round(Object.values(Object.values(C)[0][''] || {}).reduce((a, c) => a + c[1], 0) / Object.keys(Object.values(C)[0][''] || {}).length)} fights a cell`);
  out.push(`   gain of a part on a robot, averaged over opponents: mean |gain| ${avgAbs.toFixed(1)} points`);
  out.push(`   spread of the gain from opponent to opponent: observed SD ${Math.sqrt(obs).toFixed(1)}, of which noise ${Math.sqrt(noi).toFixed(1)}, so TRUE SD about ${tsd.toFixed(1)} points`);
  out.push(`   with that true SD: a cell is 15+ points off the robot+part's own average in ${(100 * tail(15)).toFixed(0)}% of cases, 10+ in ${(100 * tail(10)).toFixed(0)}%, 25+ in ${(100 * tail(25)).toFixed(0)}%`);
  out.push(`   per part, true SD across opponents (avg gain): ` + partSd.map(([p, s, m]) => `${p} ${s.toFixed(0)} (${m >= 0 ? '+' : ''}${m.toFixed(0)})`).join(', '));
  return { N, tsd, noise: Math.sqrt(noi), avgAbs };
}
// 1. combo hunt slice (T58, today's engine with wear): stage 1 keys S~robot~part~opp~~i, value [key, win, t, how]
{
  const C = {}; const L = zlib.gunzipSync(fs.readFileSync(path.join(ROOT, 'tools/damage-lab/combo-hunt/slice-fights.jsonl.gz'))).toString().split('\n');
  for (const l of L) { if (!l.trim()) continue; const [k, w] = JSON.parse(l), s = k.split('~'); if (s[0] !== 'S') continue; add(C, s[1], s[2], s[3], +w, s[5]); }
  analyse('combo hunt slice (22 Nov, wear on; 6 robots x 27 parts, 6 opponents, 4 fights a cell)', C);
}
// 2. tag recheck parts (15 Nov, tuned lineup): {n, k, o, win}
{
  const C = {}; for (const f of ['parts_0.json', 'parts_1.json']) { const seen = {}; for (const x of JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/damage-lab/tag-tuned', f), 'utf8'))) { const key = x.n + '|' + x.k + '|' + x.o; seen[key] = (seen[key] || 0) + 1; add(C, x.n, x.k || '', x.o, +x.win, f + seen[key]); } }
  analyse('tag recheck (15 Nov; 33 robots x 27 parts, 4 opponents, 4 fights a cell)', C);
}
// 3. part levels rounds 1 and 3 (15-16 Nov): [robot, part, opp, win]
for (const rd of ['r1', 'r3']) {
  const C = {}; for (const f of [rd + '_0.json', rd + '_1.json']) for (const x of JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/damage-lab/part-levels', f), 'utf8'))) add(C, x[0], x[1] || '', x[2], +x[3], f);
  analyse(`part levels ${rd} (33 robots x parts, 5 opponents, 2 fights a cell)`, C);
}
// 4. the engine's DRONE_VALUE (8 Nov, older engine and lineup): 120 fights a cell, so nearly no noise
{
  const src = fs.readFileSync(path.join(ROOT, 'tools/damage-lab/engine.js'), 'utf8'), m = src.match(/const DRONE_VALUE = (\{.*?\}\}\});/);
  const D = JSON.parse(m[1]); const lines = [];
  let sv = 0, nv = 0, cnt = 0;
  for (const [k, v] of Object.entries(D.drones)) {
    const g = Object.values(v.per), mu = g.reduce((a, b) => a + b, 0) / g.length, var_ = g.reduce((a, b) => a + (b - mu) ** 2, 0) / (g.length - 1);
    const noise = 1e4 * 0.5 / D.fights; sv += var_; nv += noise; cnt++;
    lines.push(`${k} avg ${v.avg}, range ${Math.min(...g)} to ${Math.max(...g)}, SD ${Math.sqrt(var_).toFixed(0)}`);
  }
  out.push(`== engine DRONE_VALUE (8 Nov, ${D.fights} fights a cell, 7 opponents; noise SD about ${Math.sqrt(nv / cnt).toFixed(0)}): true SD about ${Math.sqrt(Math.max(0, sv / cnt - nv / cnt)).toFixed(1)} points`);
  out.push('   ' + lines.join('; '));
}
console.log(out.join('\n')); fs.writeFileSync(path.join(OUT, 'spread.txt'), out.join('\n') + '\n');
