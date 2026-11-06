#!/usr/bin/env node
/* Counter tags (Kev, 6 Nov): "strong vs X / weak vs Y" for every weapon and part, measured in the Sim.

   node tools/counter-tags.js            # measure, then write the table into src/sim.js (COUNTERS block) and docs/counter-tags.md
   node tools/counter-tags.js --k 5 --m 20 --dry

   Weapons: K random stat builds per weapon class, every build against every build of every other class (sides swapped).
   Parts:   M paired samples per (part, opposing weapon class): the same fight with and without the part, same seeds.
            The tag is the change in win %, so it reads as "this part helps against ...".
   Thresholds: a weapon is strong vs a class at 60%+ and weak at 40% or less; a part needs +/-10 points.
*/
const path = require('path');
const fs = require('fs');
const Sim = require(path.join(__dirname, '..', 'src', 'sim.js'));

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const K = +opt('k', 6), M = +opt('m', 40), DRY = args.includes('--dry');
const rng = Sim.mkRng(20261106);
const ri = n => Math.floor(rng() * n);

const CLASSES = Sim.WEAPON_CLASSES;
const CK = Object.keys(CLASSES);
const UNUSED = { flame: ['acc', 'bullet'], spinner: ['acc', 'bullet'], laser: ['bullet'], railgun: ['bullet'] };

// a random 13-point robot, spent the way a player would for that weapon (weights below; fp at least 2)
const WT = {
  shooter: { hp: 2, armor: 1, speed: 1.5, turret: 1, fp: 1.5, acc: 1.5, bullet: 1 },
  mortar:  { hp: 1, armor: 0.5, speed: 1.5, turret: 0.5, fp: 1.5, acc: 1.5, bullet: 1.5 },
  saw:     { hp: 1.5, armor: 1, speed: 1, turret: 1, fp: 1.5, acc: 1.5, bullet: 1 },
  spinner: { hp: 2, armor: 2, speed: 2, turret: 0.5, fp: 1.5 },
  flame:   { hp: 2, armor: 1.5, speed: 2, turret: 1, fp: 1.5 },
};
function randBuild(ck) {
  const c = CLASSES[ck], lv = {}; Sim.STATS.forEach(k => lv[k] = 0);
  lv.fp = 2;
  const wt = WT[c.weapon] || WT.shooter;
  const use = Sim.STATS.filter(k => wt[k] && !(UNUSED[c.weapon] || []).includes(k)), tot = use.reduce((a, k) => a + wt[k], 0);
  for (let p = 11; p > 0;) {
    let x = rng() * tot, k = use[0];
    for (const u of use) { x -= wt[u]; if (x <= 0) { k = u; break; } }
    if (lv[k] < 4) { lv[k]++; p--; }
  }
  return { lv, weapon: c.weapon, cal: c.cal, range: c.range, mod: null, helpers: [], eng: 1 };
}
const POOL = {}; CK.forEach(ck => { POOL[ck] = []; for (let k = 0; k < K; k++) POOL[ck].push(randBuild(ck)); });

function fight(a, b, seed) {   // win share of a (draw = 0.5), a on side 0
  const B = Sim.newBattle([a, b], seed);
  while (!B.over) Sim.step(B, 1 / 30);
  return B.winner === 0 ? 1 : B.winner === -1 ? 0.5 : 0;
}
const duel = (a, b, seed) => (fight(a, b, seed) + 1 - fight(b, a, seed + 1)) / 2;

const t0 = Date.now();
// 1. weapon vs weapon
const WV = {}; CK.forEach(a => { WV[a] = {}; });
let seed = 1;
for (let i = 0; i < CK.length; i++) for (let j = i + 1; j < CK.length; j++) {
  let w = 0, n = 0;
  for (const a of POOL[CK[i]]) for (const b of POOL[CK[j]]) { w += duel(a, b, seed += 7); n++; }
  WV[CK[i]][CK[j]] = w / n; WV[CK[j]][CK[i]] = 1 - w / n;
}
console.log('weapons done', ((Date.now() - t0) / 1000).toFixed(0) + ' s');

// 2. parts: armour cards, modules, helper drones (change in win % vs each class)
const PARTS = [];
for (const k of Object.keys(Sim.ARMOURS)) PARTS.push({ key: 'arm:' + k, name: Sim.ARMOURS[k].name, fit: b => { b.arm = k; } });
for (const k of Object.keys(Sim.MODS)) PARTS.push({ key: 'mod:' + k, name: Sim.MODS[k].name, fit: b => { b.mod = k; } });
for (const k of ['medic', 'waller', 'spotter', 'gunner', 'bodyguard', 'jammer']) PARTS.push({ key: 'helper:' + k, name: Sim.HELPERS[k].name + (/drone/i.test(Sim.HELPERS[k].name) ? '' : ' drone'), fit: b => { b.helpers = [k]; } });
const PV = {};
for (const P of PARTS) {
  PV[P.key] = {};
  for (const v of CK) {
    let d = 0;
    for (let m = 0; m < M; m++) {
      const a = POOL[CK[ri(CK.length)]][ri(K)], b = POOL[v][ri(K)], a2 = JSON.parse(JSON.stringify(a));
      P.fit(a2); seed += 7;
      d += duel(a2, b, seed) - duel(a, b, seed);
    }
    PV[P.key][v] = d / M;
  }
  process.stdout.write('.');
}
console.log('\nparts done', ((Date.now() - t0) / 1000).toFixed(0) + ' s');

const r2 = x => Math.round(x * 100) / 100;
const OUT = { weapons: {}, parts: {} };
for (const a of CK) {
  const vs = WV[a], ks = CK.filter(b => b !== a);
  OUT.weapons[a] = { vs: Object.fromEntries(ks.map(b => [b, r2(vs[b])])),
    strong: ks.filter(b => vs[b] >= 0.6).sort((x, y) => vs[y] - vs[x]).slice(0, 3),
    weak: ks.filter(b => vs[b] <= 0.4).sort((x, y) => vs[x] - vs[y]).slice(0, 3) };
}
for (const P of PARTS) {
  const vs = PV[P.key];
  const avg = CK.reduce((a, v) => a + vs[v], 0) / CK.length;
  OUT.parts[P.key] = { avg: r2(avg), vs: Object.fromEntries(CK.map(v => [v, r2(vs[v])])),
    strong: CK.filter(v => vs[v] >= 0.1).sort((x, y) => vs[y] - vs[x]).slice(0, 3),
    weak: CK.filter(v => vs[v] <= -0.1).sort((x, y) => vs[x] - vs[y]).slice(0, 3) };
}

// docs table
const nm = k => CLASSES[k].name, pc = x => Math.round(x * 100), sg = x => (x >= 0 ? '+' : '') + pc(x);
let md = '# Counter tags\n\nMeasured in the Sim by `node tools/counter-tags.js` (' + new Date().toISOString().slice(0, 10) + ', ' + K + ' random 13-point builds per weapon (points spent the way a player would for that weapon), ' + M + ' paired samples per part and opposing weapon). The game shows these as ▲ strong vs / ▼ weak vs tags on part cards and robots. Rerun the tool after Sim changes: it rewrites the `COUNTERS` block in `src/sim.js` and this page.\n\n';
md += '## Weapons (win % vs each weapon)\n\n| Weapon | ▲ strong vs (60%+) | ▼ weak vs (40% or less) |\n|---|---|---|\n';
for (const a of CK) { const o = OUT.weapons[a]; md += '| ' + nm(a) + ' | ' + (o.strong.map(b => nm(b) + ' ' + pc(o.vs[b]) + '%').join(', ') || '–') + ' | ' + (o.weak.map(b => nm(b) + ' ' + pc(o.vs[b]) + '%').join(', ') || '–') + ' |\n'; }
md += '\nFull table, row beats column (%):\n\n| | ' + CK.map(nm).join(' | ') + ' |\n|' + '---|'.repeat(CK.length + 1) + '\n';
for (const a of CK) md += '| ' + nm(a) + ' | ' + CK.map(b => a === b ? '–' : pc(OUT.weapons[a].vs[b])).join(' | ') + ' |\n';
md += '\n## Armour, modules and drones (change in win points vs each weapon)\n\n| Part | Overall | ▲ helps vs (+10) | ▼ hurts vs (−10) |\n|---|---|---|---|\n';
for (const P of PARTS) { const o = OUT.parts[P.key]; md += '| ' + P.name + ' | ' + sg(o.avg) + ' | ' + (o.strong.map(v => nm(v) + ' ' + sg(o.vs[v])).join(', ') || '–') + ' | ' + (o.weak.map(v => nm(v) + ' ' + sg(o.vs[v])).join(', ') || '–') + ' |\n'; }

console.log(md);
if (DRY) process.exit(0);
const simPath = path.join(__dirname, '..', 'src', 'sim.js');
let src = fs.readFileSync(simPath, 'utf8');
const block = '  // COUNTERS:BEGIN (generated by tools/counter-tags.js, do not edit by hand)\n  const COUNTERS = ' + JSON.stringify(OUT) + ';\n  // COUNTERS:END';
src = src.replace(/  \/\/ COUNTERS:BEGIN[\s\S]*?\/\/ COUNTERS:END/, block);
fs.writeFileSync(simPath, src);
fs.writeFileSync(path.join(__dirname, '..', 'docs', 'counter-tags.md'), md);
console.log('wrote src/sim.js COUNTERS and docs/counter-tags.md (' + ((Date.now() - t0) / 1000).toFixed(0) + ' s)');
