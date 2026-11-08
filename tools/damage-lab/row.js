// node row.js cfg.json Name '{"dmgK":0.6}' [seedFrom seedTo]  -> that robot's row on holdout seeds
const M = require('./market.js'), fs = require('fs');
const [f, name, ov, s0 = 101, s1 = 120] = process.argv.slice(2);
const c = JSON.parse(fs.readFileSync(f)); const names = Object.keys(c.robots);
const builds = names.map(n => JSON.parse(JSON.stringify(c.robots[n])));
const i = names.indexOf(name); const o = JSON.parse(ov || '{}');
if (o.armour) { Object.assign(builds[i].armour, o.armour); delete o.armour; } Object.assign(builds[i], o);
const seeds = []; for (let s = +s0; s <= +s1; s++) seeds.push(s);
(async () => {
  const pairs = names.map((_, j) => [i, j]).filter(([a, b]) => a !== b);
  const s = await M.evaluate(builds, { tune: c.tune, seeds, arenas: c.arenas, pairs });
  const row = s.wr[i].map((x, j) => x == null ? '' : names[j].slice(0, 6) + ' ' + Math.round(x * 100)).filter(Boolean).join('  ');
  const v = s.wr[i].filter(x => x != null); console.log([process.env.OKB, process.env.OFACE, process.env.OMNI].join(','), name, ov, '| avg', Math.round(v.reduce((a, b) => a + b, 0) / v.length * 100), '|', row, '| med', s.med.toFixed(0));
})();
