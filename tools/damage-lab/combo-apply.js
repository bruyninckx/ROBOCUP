// T58: turn the combo hunt's combo-results.json into the game's table text (PART_FIT, EPIC, TRIPLE) for review.
//   node tools/damage-lab/combo-apply.js combo-results/combo-results.json [--merge]
// It changes NO file: it prints the new table lines and what changed against prototypes/tabletop-2.html today. The orchestrator
// pastes them in after Kev has seen the list (and has named the new epics: they come out as 'NEW <robot> + <part>').
// --merge keeps the game's entries for robots this run did not test (a partial run); without it the tables are replaced whole.
// Rules as in the game: PART_FIT[robot][part] = [+1 great / -1 poor, gain in points] (epics are great fits too); EPIC[robot|part] =
// [name, wins without, wins with] (% vs robots a level up); TRIPLE[robot] = [[parts], as it comes, built vs bare level 3-4,
// built vs kitted level 3-4] for level 0-2 robots whose best build wins 80%+ against bare level 3-4 robots.
'use strict';
const fs = require('fs'), path = require('path');
const f = process.argv[2] || 'combo-results/combo-results.json', MERGE = process.argv.includes('--merge');
const RS = JSON.parse(fs.readFileSync(f, 'utf8'));
const H = fs.readFileSync(path.join(__dirname, '..', '..', 'prototypes', 'tabletop-2.html'), 'utf8');
const oldFit = JSON.parse(H.match(/const PART_FIT = (\{.*?\});/)[1]);
const blk = name => H.slice(H.indexOf('const ' + name + ' = {'), H.indexOf('};', H.indexOf('const ' + name + ' = {')));
const oldEpic = {}; for (const m of blk('EPIC').matchAll(/'([A-Za-z]+\|[a-z]+)':\s*(\[[^\]]*\](?:\s*\])?)/g)) oldEpic[m[1]] = m[2];
const oldTri = {}; for (const m of blk('TRIPLE').matchAll(/(\w+):\s*(\[\[[^\]]*\][^\]]*\])/g)) oldTri[m[1]] = m[2];
const tested = new Set(RS.meta.robots), keep = n => MERGE && !tested.has(n);

const fit = {}; for (const [n, ks] of Object.entries(oldFit)) if (keep(n)) fit[n] = ks;
for (const [n, ks] of Object.entries(RS.fits)) fit[n] = ks;
const epic = {}; for (const [id, e] of Object.entries(oldEpic)) if (keep(id.split('|')[0])) epic[id] = e;
for (const [id, e] of Object.entries(RS.epic)) epic[id] = JSON.stringify([e[0], e[1], e[2]]).replace(/"/g, "'").replace(/,/g, ', ');
const tri = {}; for (const [n, t] of Object.entries(oldTri)) if (keep(n)) tri[n] = t;
for (const [n, t] of Object.entries(RS.triple)) tri[n] = JSON.stringify([t[0], t[1], t[2], t[3]]).replace(/"/g, "'").replace(/,/g, ', ');

const day = new Date().toISOString().slice(0, 10);
console.log(`// ---- paste over the three tables in prototypes/tabletop-2.html (combo hunt ${day}, ${RS.meta.fights} fights, depth ${RS.meta.depth}, engine ${RS.meta.fp}) ----\n`);
console.log(`  const PART_FIT = ${JSON.stringify(fit)};   // T58 combo hunt (${day}): docs/robocus-combo-hunt.md`);
console.log('');
console.log(`  const EPIC = {   // T58 combo hunt (${day}): held on two fresh seed sets vs every robot a level up`);
for (const [id, e] of Object.entries(epic)) console.log(`    '${id}': ${e},`);
console.log('  };');
console.log('');
console.log(`  const TRIPLE = {   // T58 combo hunt (${day}): best full build of each level 0-2 robot, 80%+ vs bare level 3-4 robots (last number: vs kitted ones)`);
console.log('    ' + Object.entries(tri).map(([n, t]) => `${n}: ${t}`).join(', ') + ',');
console.log('  };');
// ---- what changed
const lines = [];
for (const n of new Set(Object.keys(oldFit).concat(Object.keys(fit)))) for (const k of new Set(Object.keys(oldFit[n] || {}).concat(Object.keys(fit[n] || {})))) {
  const a = oldFit[n] && oldFit[n][k], b = fit[n] && fit[n][k];
  if (!a) lines.push(`+ fit ${n} + ${k} ${b[0] > 0 ? 'great' : 'poor'} (${b[1]})`); else if (!b) lines.push(`- fit ${n} + ${k} (was ${a[0] > 0 ? 'great' : 'poor'} ${a[1]})${tested.has(n) ? '' : ' (robot not in this run)'}`);
  else if (a[0] !== b[0]) lines.push(`~ fit ${n} + ${k} flips ${a[0] > 0 ? 'great' : 'poor'} -> ${b[0] > 0 ? 'great' : 'poor'}`); }
for (const id of new Set(Object.keys(oldEpic).concat(Object.keys(epic)))) { if (!oldEpic[id]) lines.push(`+ epic ${id} ${epic[id]} (needs a name)`); else if (!epic[id]) lines.push(`- epic ${id} ${oldEpic[id]}${tested.has(id.split('|')[0]) ? '' : ' (robot not in this run)'}`); }
for (const n of new Set(Object.keys(oldTri).concat(Object.keys(tri)))) { if (!oldTri[n]) lines.push(`+ giant-slayer ${n} ${tri[n]}`); else if (!tri[n]) lines.push(`- giant-slayer ${n} ${oldTri[n]}`); else if (oldTri[n] !== tri[n]) lines.push(`~ giant-slayer ${n} ${oldTri[n]} -> ${tri[n]}`); }
console.log('\n// ---- changes against the game today ----');
console.log(lines.length ? lines.map(s => '// ' + s).join('\n') : '// none');
const tiersNote = RS.tiers && RS.tiers.length ? RS.tiers.length + ' tier rows' : 'none';
console.log(`// (not table material: best builds of ${Object.keys(RS.builds).length} robots, ${RS.synergy.length} synergy rows, ${tiersNote}: see report.md)`);
