// T60 (22 Nov 2026): Kev's stacked Gyro against Scavenger, rebuilt as the game builds its fights (spec2 / buildFight in
// prototypes/tabletop-2.html: Lineup.build(name, parts, tiers) + level + wear, engine create {a, b, seed, arena, wear}).
// Each fight is one line in tools/t60-out/<config>.jsonl; a run picks up where it stopped (seeds already there are skipped).
//   node tools/gyro-scavenger.js --cfg=r9 --n=300 [--from=1]      configs: see CFG below
//   node tools/gyro-scavenger.js --report                         summary of every config file
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const DL = require(path.join(ROOT, 'src2/engine.js')), LU = require(path.join(ROOT, 'src2/lineup.js')), R2 = require(path.join(ROOT, 'src2/repair.js'));
LU.usePK(); LU.levelBoost = 0;   // as the page: LU.usePK() at load, BAL.levelBoost 0
const OUT = path.join(ROOT, 'tools/t60-out'); fs.mkdirSync(OUT, { recursive: true });
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const clone = o => JSON.parse(JSON.stringify(o));

// Kev's robots (log kev-log-22nov-b.json, build 2026-11-22e). Tiers from the Market lot ids: p_booster~2 and p_jammer~2 are
// Race-spec (tier 2), p_quantum, p_overdrive and p_weapon are Standard.
const GYRO = { name: 'Gyro', level: 2, parts: ['booster', 'jammer', 'quantum'], rar: { booster: 2, jammer: 2 } };
const SCAV = { name: 'Scavenger', level: 3, parts: ['overdrive', 'weapon'], rar: null };
function spec(r, team, wear) {
  const sp = Object.assign(LU.build(r.name, r.parts, r.rar), { name: r.name, level: r.level, teamName: team });
  if (wear) sp.wear = clone(wear);
  return sp;
}
// Scavenger's damage in round 9 ("Body 54%, saw cuts"): it came from its round 8 KO of Gaucho (open floor, Scavenger with Overdrive),
// then Upkeep (body heals back to half, Body.bodyHeal) and a crew repair of its Weapon zone (log, round 9). The exact wear is not in
// the log, so we make look-alikes: rerun that fight, keep Scavenger wins whose wear after heal + weapon repair reads Body 50-58%,
// saw cuts, Drive and Weapon fine. Cached in tools/t60-out/scav-wear.json.
function scavWears(k = 6) {
  const f = path.join(OUT, 'scav-wear.json');
  if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, 'utf8'));
  const got = [], sc = { name: 'Scavenger', level: 3, parts: ['overdrive'], rar: null }, ga = { name: 'Gaucho', level: 3, parts: [], rar: null };
  for (let seed = 1; seed < 4000 && got.length < k; seed++) {
    const S = DL.create({ a: spec(ga, 'Bulls'), b: spec(sc, 'Rust Rivets'), seed, countdown: 0, arena: 'open', wear: true });
    let g = 0; while (!S.over && g++ < 48000) { DL.step(S); S.fx.length = 0; }
    if (!S.result || S.result.winner !== 1) continue;
    const w = DL.wearOf(S.robots[1]), sp = Object.assign(spec(sc, 'Rust Rivets'), { wear: w });
    R2.bodyHeal(sp, 0.5); R2.repairZone(sp, 'weapon');
    const Z = R2.zones(sp);
    if (Z.body.broken || Z.body.f < 0.5 || Z.body.f > 0.58 || Z.drive.damaged || Z.weapon.damaged || !(Z.body.marks || []).includes('saw cuts')) continue;
    got.push({ seed, body: +Z.body.f.toFixed(3), marks: Z.body.marks, wear: sp.wear });
    process.stderr.write('scav wear from seed ' + seed + ': body ' + Z.body.f.toFixed(2) + ' ' + Z.body.marks.join(', ') + '\n');
  }
  fs.writeFileSync(f, JSON.stringify(got)); return got;
}
// Scavenger in round 11 ("no damage"): what its round 9 win over Gyro left (the card shows only zones below 70%, so it can carry
// wear and marks), after round 10's Upkeep (body heal) and the crew repair of its Body zone (log, round 10). Look-alikes: round 9
// rebuilt fights that Scavenger won, kept when Drive and Weapon read undamaged (>= 70%, nothing lost) after the Body repair.
function scavWears11(k = 8) {
  const f = path.join(OUT, 'scav-wear11.json');
  if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, 'utf8'));
  const got = [], W9 = scavWears();
  for (let seed = 1; seed < 3000 && got.length < k; seed++) {
    const g = spec(GYRO, 'Steel Bolts'), s = spec(SCAV, 'Rust Rivets', W9[seed % W9.length].wear);
    const S = DL.create({ a: s, b: g, seed, countdown: 0, arena: 'killbox', wear: true });
    let n = 0; while (!S.over && n++ < 48000) { DL.step(S); S.fx.length = 0; }
    if (!S.result || S.result.winner !== 0) continue;
    const sp = Object.assign(spec(SCAV, 'Rust Rivets'), { wear: DL.wearOf(S.robots[0]) });
    R2.bodyHeal(sp, 0.5); R2.repairZone(sp, 'body');
    const Z = R2.zones(sp); if (Z.drive.damaged || Z.weapon.damaged || Z.body.damaged) continue;
    got.push({ seed, t: +S.result.t.toFixed(1), drive: +Z.drive.f.toFixed(2), weapon: +Z.weapon.f.toFixed(2), marks: [].concat(Z.drive.marks || [], Z.weapon.marks || []), wear: sp.wear });
    process.stderr.write('r11 scav wear from r9 seed ' + seed + ' (' + S.result.t.toFixed(1) + ' s): drive ' + Z.drive.f.toFixed(2) + ' weapon ' + Z.weapon.f.toFixed(2) + ' ' + got[got.length - 1].marks.join(', ') + '\n');
  }
  fs.writeFileSync(f, JSON.stringify(got)); return got;
}
const drop = (r, k) => Object.assign({}, r, { parts: r.parts.filter(x => x !== k) });
// configs: arena, Gyro, Scavenger, Scavenger wear (r9), live cards (replayed at their times), Gyro's face-down Smudged Lens
const CFG = {
  r9:       { arena: 'killbox', g: GYRO, s: SCAV, wear: true },                         // round 9 as the bookie saw it
  r9live:   { arena: 'killbox', g: GYRO, s: SCAV, wear: true, live: [{ t: 5, type: 'chiphack', on: 'g', by: 'Team3' }, { t: 9.3, type: 'field_eng', on: 's', by: 'Rust' }] },
  r9new:    { arena: 'killbox', g: GYRO, s: SCAV, wear: false },                        // round 9 with Scavenger undamaged
  r11:      { arena: 'open', g: GYRO, s: SCAV },
  r11worn:  { arena: 'open', g: GYRO, s: SCAV, wear11: true },                           // + the wear Scavenger may have carried from round 9                                         // round 11 as the bookie saw it
  r11lens:  { arena: 'open', g: GYRO, s: SCAV, lens: true },                             // + the face-down Smudged Lens on Gyro
  r11live:  { arena: 'open', g: GYRO, s: SCAV, lens: true, live: [{ t: 1.1, type: 'emp', x: 1.5606672519754174, y: 0.5253731343283584, by: 'Steel' }, { t: 8, type: 'supply', x: 1.9361587983324025, y: 1.5084689187429468, crate: 'overcharge', by: 'Rust' }] },
  bare:     { arena: 'open', g: { name: 'Gyro', level: 2, parts: [] }, s: { name: 'Scavenger', level: 3, parts: [] } },
  g_nobooster: { arena: 'open', g: drop(GYRO, 'booster'), s: SCAV },
  g_nojammer:  { arena: 'open', g: drop(GYRO, 'jammer'), s: SCAV },
  g_noquantum: { arena: 'open', g: drop(GYRO, 'quantum'), s: SCAV },
  g_bare:      { arena: 'open', g: { name: 'Gyro', level: 2, parts: [] }, s: SCAV },
  s_nooverdrive: { arena: 'open', g: GYRO, s: drop(SCAV, 'overdrive') },
  s_noweapon:    { arena: 'open', g: GYRO, s: drop(SCAV, 'weapon') },
  s_bare:        { arena: 'open', g: GYRO, s: { name: 'Scavenger', level: 3, parts: [] } },
  kb_bare:     { arena: 'killbox', g: { name: 'Gyro', level: 2, parts: [] }, s: { name: 'Scavenger', level: 3, parts: [] } },
};
// one fight: who wins, how, when, what each lost (with cause and who), what Gyro's shield / quantum did
function fight(c, seed) {
  const W = c.wear ? scavWears() : c.wear11 ? scavWears11() : null, wear = W && W.length ? W[(seed >>> 0) % W.length].wear : null;
  const g = spec(c.g, 'Steel Bolts'), s = spec(c.s, 'Rust Rivets', wear);
  if (c.lens) g.dmgK *= 0.75;   // BAL.cards.lens (fightSpec: tm.lens)
  // the side order as in Kev's fights: round 9 Scavenger first (a), round 11 Gyro first
  const gFirst = c.arena !== 'killbox';
  const S = DL.create({ a: gFirst ? g : s, b: gFirst ? s : g, seed, countdown: c.live ? 2.99 : 0, arena: c.arena, wear: true });
  const gi = gFirst ? 0 : 1, si = 1 - gi, live = (c.live || []).slice();
  let gy = 0, q = { phased: 0, quantum: 0 }, g0 = 0;
  while (!S.over && g0++ < 48000) {
    if (live.length && S.countdown <= 0 && S.t >= live[0].t) { const L = live.shift(), cmd = { type: L.type, by: L.by }; if (L.on) cmd.robot = L.on === 'g' ? gi : si; if (L.x != null) { cmd.x = L.x; cmd.y = L.y; } if (L.crate) cmd.crate = L.crate; try { DL.command(S, cmd); } catch (e) {} }
    DL.step(S);
    for (const f of S.fx) if (f.robot === gi && (f.type === 'shield' || f.type === 'shieldhit')) gy++;
    const G = S.robots[gi]; if (G.quantumT > 0 && !q.on) { q.on = 1; q.phased++; } else if (!(G.quantumT > 0)) q.on = 0;
    S.fx.length = 0;
  }
  const res = S.result || {}, G = S.robots[gi], Sc = S.robots[si];
  const lost = R => R.stats.lost.map(l => [Math.round(l.t * 10) / 10, l.label, l.cause, l.by ? (l.by === R.name ? 'self' : 'foe') : '']);
  const gw = DL.wearOf(G), marks = (() => { try { const Z = R2.zones(Object.assign(spec(c.g, ''), { wear: gw })); return { w: Z.weapon.marks, b: Z.body.marks }; } catch (e) { return null; } })();
  return { seed, gyroWon: res.winner === gi ? 1 : res.winner === si ? 0 : 0.5, how: res.how || 'none', t: Math.round((res.t || S.t) * 10) / 10, text: res.text || '',
    gLost: lost(G), sLost: lost(Sc), gTaken: Math.round(G.stats.taken), sTaken: Math.round(Sc.stats.taken), gDealtBy: G.stats.dealtBy, sDealtBy: Sc.stats.dealtBy, phases: q.phased, gMarks: marks };
}
// the bookie's own seeds (simOdds): round, the fight's teams in entrant order
function bookieSeeds(round, teams, n) { let sd = ((round * 7919 + teams.reduce((a, t) => a * 31 + t + 1, 17)) ^ 0x5bd1e995) >>> 0; const o = []; for (let i = 0; i < n; i++) { sd = (Math.imul(sd, 1664525) + 1013904223) >>> 0; o.push(sd); } return o; }
function run(name, n, from) {
  const c = CFG[name]; if (!c) throw new Error('no config ' + name);
  const bk = arg('bookie', ''), f = path.join(OUT, name + (bk ? '-bookie' : '') + '.jsonl'), done = new Set();
  if (fs.existsSync(f)) for (const l of fs.readFileSync(f, 'utf8').split('\n')) if (l.trim()) { try { done.add(JSON.parse(l).seed); } catch (e) {} }
  let k = 0;
  const seeds = bk ? bookieSeeds(+bk.split(':')[0], bk.split(':')[1].split('-').map(Number), n) : Array.from({ length: n }, (_, i) => from + i);
  for (const seed of seeds) { if (done.has(seed)) continue; const r = fight(c, seed); fs.appendFileSync(f, JSON.stringify(r) + '\n'); if (++k % 25 === 0) process.stderr.write(name + ' ' + (done.size + k) + '\n'); }
}
const wilson = (w, n) => { if (!n) return [0, 0]; const z = 1.96, p = w / n, d = 1 + z * z / n, m = (p + z * z / (2 * n)) / d, h = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d; return [m - h, m + h]; };
function report() {
  const pct = x => Math.round(x * 1000) / 10;
  for (const name of Object.keys(CFG).flatMap(k => [k, k + '-bookie'])) {
    const f = path.join(OUT, name + '.jsonl'); if (!fs.existsSync(f)) continue;
    const R = fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)); if (!R.length) continue;
    const n = R.length, w = R.reduce((a, r) => a + r.gyroWon, 0), [lo, hi] = wilson(w, n);
    const lostG = R.filter(r => r.gyroWon === 0), ts = lostG.map(r => r.t).sort((a, b) => a - b), med = ts.length ? ts[Math.floor(ts.length / 2)] : null;
    const fast = lostG.filter(r => r.t <= 15 && /chassis torn apart/.test(r.text)).length, fast15 = lostG.filter(r => r.t <= 15).length;
    const scavClean = R.filter(r => !r.sLost.length).length, scavCleanWin = lostG.filter(r => !r.sLost.length).length;
    const ends = {}; for (const r of lostG) { const k = r.how === 'KO' ? r.text.replace(/^.*?: Gyro /, '').replace(/\(.*\)/, '').replace(/, counted out/, '').trim() : r.how; ends[k] = (ends[k] || 0) + 1; }
    const first = {}; for (const r of lostG) { const l = r.gLost[0]; const k = l ? l[1] + ' (' + l[2] + ')' : 'nothing'; first[k] = (first[k] || 0) + 1; }
    const motorFirst = lostG.filter(r => r.gLost[0] && /Shell motor/.test(r.gLost[0][1])).length;
    const hazard = lostG.filter(r => r.gLost.some(l => /spike|saw|hazard|wall/i.test(l[2]))).length;
    const top = o => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => k + ' ' + v).join('; ');
    console.log(`${name}: n ${n}, Gyro wins ${pct(w / n)}% [${pct(lo)}-${pct(hi)}], Gyro losses ${lostG.length}: median ${med} s, over in 15 s ${fast15} (chassis torn apart ${fast} = ${pct(fast / n)}% of all fights), Scavenger loses nothing ${scavClean}/${n} (in its wins ${scavCleanWin}/${lostG.length}), shell motor goes first ${motorFirst}, a hazard part in the losses ${hazard}, quantum/phase per fight ${(R.reduce((a, r) => a + r.phases, 0) / n).toFixed(2)}`);
    console.log('   endings: ' + top(ends)); console.log('   first part Gyro loses: ' + top(first));
  }
}
if (process.argv.includes('--report')) report();
else if (arg('cfg')) for (const c of arg('cfg').split(',')) run(c, +arg('n', 300), +arg('from', 1));
module.exports = { fight, CFG, scavWears };
