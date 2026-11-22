// T53 (22 Nov 2026; Kev, 17 Nov: "a broken weapon with no repair button"): every robot, damaged by real fights, gets a repair
// button for every zone that is damaged or broken, in the YOUR MOVE note and on the card, and repairing it clears it.
//   node tools/mp-scenario/repair-all.js [fightsPerChain] [chains] [statesFile]
//   PARTS=1 node tools/mp-scenario/repair-all.js    the same with two part cards on each robot (drones, modules, kits, legendaries, chips)
// 1. Fights (node, the engine the game loads from src2/): each of the 33 robots, 2 chains of 3 fights by default against robots
//    spread over the lineup; each fight starts with the damage the last one left (as in the game: wear and marks carry over).
//    The states are kept in a file (default /tmp/robocus-repair-states.json) and reused when it exists (delete it to fight again).
// 2. Invisible damage: every label the fight's wear names (a part below 100%, a lost part, an internal) must be in one of the three
//    zones (Repair2.zones labels), else the robot carries damage no button can repair.
// 3. In the game (tabletop-2.html, solo, Upkeep): each state on my robot; every zone zonesOf() calls damaged or broken has a note
//    button (data-rep) and a card hit region (zone_fix); no note button for a zone that is not damaged (a wear mark alone is the
//    grey optional "fix?" on the card only, T41); a click on the note button repairs it (the zone is no longer damaged, broken
//    or marked) and, after all of them, the robot is as strong as new (no damage left the repairs can't reach).
'use strict';
const path = require('path'), fs = require('fs'), os = require('os');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const ROOT = path.join(__dirname, '..', '..');

if (!isMainThread) {   // a fight worker: one robot's chains
  const L = require(path.join(ROOT, 'src2/engine.js')), LU = require(path.join(ROOT, 'src2/lineup.js'));
  const { name, opps, per, seed0, parts } = workerData, out = [];
  opps.forEach((chain, c) => {
    let wear = null;
    for (let k = 0; k < per; k++) {
      const a = Object.assign(LU.build(name, parts), { name }); if (wear) a.wear = JSON.parse(JSON.stringify(wear));
      const S = L.run({ a, b: LU.build(chain[k % chain.length], []), seed: seed0 + c * 31 + k, arena: 'open' });
      wear = L.wearOf(S.robots[0]); out.push({ name, parts, chain: c, fight: k + 1, vs: chain[k % chain.length], wear });
    }
  });
  parentPort.postMessage(out);
  return;
}

(async () => {
  const PARTS = !!process.env.PARTS, PER = +process.argv[2] || 3, CHAINS = +process.argv[3] || 2, FILE = process.argv[4] || path.join(os.tmpdir(), 'robocus-repair-states' + (PARTS ? '-parts' : '') + '.json');
  const LU = require(path.join(ROOT, 'src2/lineup.js')), R2 = require(path.join(ROOT, 'src2/repair.js'));
  const ROB = Object.assign({}, LU.ROBOTS, LU.ROBOTS4), names = Object.keys(ROB).sort();
  console.log(names.length + ' robots');
  let states;
  if (fs.existsSync(FILE)) { states = JSON.parse(fs.readFileSync(FILE, 'utf8')); console.log('states from ' + FILE + ' (' + states.length + ')'); }
  else {
    const t0 = Date.now(), par = Math.max(1, Math.min(8, os.cpus().length)); states = [];
    const PK = Object.keys(LU.PARTS), partsFor = i => PARTS ? [...new Set([PK[i % PK.length], PK[(i * 5 + 3) % PK.length]])] : [];
    const jobs = names.map((name, i) => ({ name, parts: partsFor(i), seed0: 500 + i * 7, per: PER, opps: Array.from({ length: CHAINS }, (_, c) => Array.from({ length: PER }, (_, k) => names[(i + 5 + c * 11 + k * 7) % names.length])) }));
    let next = 0;
    await Promise.all(Array.from({ length: par }, async () => { while (next < jobs.length) { const j = jobs[next++];
      const r = await new Promise((res, rej) => { const w = new Worker(__filename, { workerData: j }); w.once('message', res); w.once('error', rej); });
      states.push(...r); process.stdout.write('.'); } }));
    console.log('\n' + states.length + ' fights in ' + Math.round((Date.now() - t0) / 1000) + ' s');
    fs.writeFileSync(FILE, JSON.stringify(states));
  }
  const bad = [];
  // 2. invisible damage (node)
  let dmgStates = 0;
  for (const s of states) {
    const sp = Object.assign(LU.build(s.name, s.parts || []), { wear: s.wear }), Z = R2.zones(sp), all = new Set([].concat(...Object.values(Z).map(z => z.labels)));
    const named = Object.keys(s.wear.parts || {}).filter(k => s.wear.parts[k] < 1).concat(s.wear.lost || [], Object.keys(s.wear.ints || {}).filter(k => s.wear.ints[k] < 1));
    const lost = named.filter(k => !all.has(k));
    if (lost.length) bad.push(s.name + ' fight ' + s.chain + '.' + s.fight + ': damage outside every zone: ' + lost.join(', '));
    if (Object.values(Z).some(z => z.damaged)) dmgStates++;
  }
  console.log('states with a damaged or broken zone: ' + dmgStates + ' of ' + states.length);

  // 3. the game
  const b = await require('./launch.js')(require('playwright'));
  const PLK = require('../planck-local.js'), PL = PLK.find();
  const p = await b.newPage({ viewport: { width: 1600, height: 900 } }), errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await PLK.route(p, PL);
  await p.goto(require('url').pathToFileURL(path.join(ROOT, 'prototypes/tabletop-2.html')).href + '?seed=13'); await p.waitForTimeout(800);
  await p.evaluate(() => { window.__noSlide = true; window.__noAuto = true; });
  await p.click('#pAct2'); await p.waitForTimeout(1500);
  const ph = await p.evaluate(() => window.ROBOCUS_DEBUG.G.phase); if (ph !== 'upkeep') bad.push('not in Upkeep (' + ph + ')');
  const tally = { states: 0, zones: 0, broken: 0, byZone: { drive: 0, weapon: 0, body: 0 }, marksOnly: 0, robots: new Set() };
  for (let i = 0; i < states.length; i++) {
    const s = states[i];
    const set = await p.evaluate(([s, i]) => { const D = window.ROBOCUS_DEBUG, G = D.G, t = G.teams[0], LU = window.Lineup;
      const lv = (LU.ROBOTS[s.name] || LU.ROBOTS4[s.name])[0];
      const r = JSON.parse(JSON.stringify(G.teams[0].robots[0] || window.__r0)); window.__r0 = window.__r0 || JSON.parse(JSON.stringify(r));
      Object.assign(r, { name: s.name, level: lv, parts: (s.parts || []).slice(), leg: null, rar: null, id: 'RA' + i, uid: 'RAu' + i, wear: JSON.parse(JSON.stringify(s.wear)) });
      t.robots = [r]; t.rep = { used: {}, free: 99 }; t.exMechs = 0; t.credits = 99; t.stash = [];
      D.updateHud(); const Z = D.zonesOf(r);
      return { id: r.id, Z: Object.fromEntries(Object.values(Z).map(q => [q.key, { damaged: q.damaged, broken: q.broken, marked: !!q.marked, f: q.f }])) }; }, [s, i]);
    await p.waitForTimeout(120);   // the card is drawn on the next frame
    const seen = await p.evaluate(id => { const D = window.ROBOCUS_DEBUG;
      return { note: [...document.querySelectorAll('#promptBar [data-rep]')].map(x => x.dataset.rep), card: D.hitRegions.filter(h => h.kind === 'zone_fix' && String(h.robot.id) === id).map(h => h.zone) }; }, set.id);
    const tag = s.name + ((s.parts || []).length ? ' +' + s.parts.join('+') : '') + ' (fight ' + (s.chain + 1) + '.' + s.fight + ' vs ' + s.vs + ')';
    const dmg = Object.keys(set.Z).filter(k => set.Z[k].damaged);
    if (!dmg.length && Object.values(set.Z).some(q => q.marked)) tally.marksOnly++;
    if (dmg.length) { tally.states++; tally.robots.add(s.name); }
    for (const k of Object.keys(set.Z)) {
      const q = set.Z[k], inNote = seen.note.includes(set.id + ':' + k), onCard = seen.card.includes(k);
      if (q.damaged) { tally.zones++; tally.byZone[k]++; if (q.broken) tally.broken++; }
      if (q.damaged && !inNote) bad.push(tag + ': ' + k + (q.broken ? ' broken' : ' ' + Math.round(q.f * 100) + '%') + ': no button in the note');
      if ((q.damaged || q.marked) && !onCard) bad.push(tag + ': ' + k + ': no repair region on the card');
      if (!q.damaged && inNote) bad.push(tag + ': ' + k + ' not damaged but has a note button');
    }
    // repair each damaged zone with its note button
    for (const k of dmg) {
      const r = await p.evaluate(([id, k]) => { const bt = document.querySelector('#promptBar [data-rep="' + id + ':' + k + '"]'); if (!bt || bt.disabled) return 'no live button'; bt.click(); return null; }, [set.id, k]);
      // the note button works through pickNow (the repair runs after the next paint): wait for it, up to 3 s
      for (let w = 0; w < 60 && !r; w++) { if (await p.evaluate(k => { const D = window.ROBOCUS_DEBUG, q = D.zonesOf(D.G.teams[0].robots[0])[k]; return !q.damaged && !q.marked; }, k)) break; await p.waitForTimeout(50); }
      await p.waitForTimeout(30);
      const after = await p.evaluate(([id, k]) => { const D = window.ROBOCUS_DEBUG, r = D.G.teams[0].robots[0], q = D.zonesOf(r)[k]; return { damaged: q.damaged, broken: q.broken, marked: !!q.marked, f: q.f }; }, [set.id, k]);
      if (r) bad.push(tag + ': ' + k + ': ' + r);
      else if (after.damaged || after.broken || after.marked) bad.push(tag + ': ' + k + ' still ' + JSON.stringify(after) + ' after the repair');
    }
    if (dmg.length) {   // all the damage the zones can see is gone: is the robot as strong as new?
      const left = await p.evaluate(() => { const D = window.ROBOCUS_DEBUG, r = D.G.teams[0].robots[0], Z = D.zonesOf(r); return { gap: D.str2(Object.assign({}, r, { wear: null })) - D.str2(r), dmg: Object.values(Z).filter(q => q.damaged).map(q => q.key), clean: Object.values(Z).every(q => q.f >= 0.999 && !q.marked) }; });
      if (left.dmg.length) bad.push(tag + ': still damaged after repairing: ' + left.dmg.join(', '));
      if (left.clean && left.gap > 0.02) bad.push(tag + ': ' + left.gap.toFixed(2) + ' strength lost that no repair reaches');
    }
    if (i % 40 === 39) process.stdout.write(i + 1 + ' ');
  }
  await b.close();
  console.log('\nin the game: ' + tally.states + ' damaged states (' + tally.robots.size + ' robots), ' + tally.zones + ' damaged zones (' + tally.broken + ' broken; drive ' + tally.byZone.drive + ', weapon ' + tally.byZone.weapon + ', body ' + tally.byZone.body + '), ' + tally.marksOnly + ' states with wear marks only');
  const never = names.filter(n => !tally.robots.has(n)); if (never.length) console.log('never damaged in these fights: ' + never.join(', '));
  if (errs.length) bad.push('page errors: ' + errs.slice(0, 5).join(' | '));
  console.log(bad.length ? 'FAIL (' + bad.length + ')\n' + bad.slice(0, 60).join('\n') : 'OK');
  process.exit(bad.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
