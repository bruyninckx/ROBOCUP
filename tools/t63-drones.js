// T63 Part 1 (22 Nov 2026): why were Gyro's Booster and Jammer drones worth nothing against Scavenger?
// The round-11 fight (open floor, Gyro first, both new) built as tools/gyro-scavenger.js builds it, measured step by step
// from outside the engine (nothing in the engine changed). One line per fight in tools/t63-out/p1-<cfg>.jsonl; resumable.
//   node tools/t63-drones.js --cfg=full,nojammer,nobooster --n=200      then   node tools/t63-drones.js --report
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const DL = require(path.join(ROOT, 'src2/engine.js')), LU = require(path.join(ROOT, 'src2/lineup.js'));
LU.usePK(); LU.levelBoost = 0;
const OUT = path.join(ROOT, 'tools/t63-out'); fs.mkdirSync(OUT, { recursive: true });
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const GYRO = { name: 'Gyro', level: 2, parts: ['booster', 'jammer', 'quantum'], rar: { booster: 2, jammer: 2 } };
const SCAV = { name: 'Scavenger', level: 3, parts: ['overdrive', 'weapon'], rar: null };
const drop = (r, k) => Object.assign({}, r, { parts: r.parts.filter(x => x !== k) });
// jamfix (what-if, from outside): a jammed Scavenger reloads as slowly as any other jammed weapon (R.cool runs at jk, so 1/jk
// times slower: jk = 1 - 0.5 x 1.1 x 1.6 = 0.12 for this Race-spec Jammer, 0.9 s -> 7.5 s) instead of the flat x1.6.
const HACK = { jamfix: true };
const CFG = { full: GYRO, jamfix: GYRO, nojammer: drop(GYRO, 'jammer'), nobooster: drop(GYRO, 'booster'), noquantum: drop(GYRO, 'quantum') };
const spec = (r, team) => Object.assign(LU.build(r.name, r.parts, r.rar), { name: r.name, level: r.level, teamName: team });
const DT = 1 / 120;

function fight(gcfg, seed, hack) {
  const S = DL.create({ a: spec(gcfg, 'Steel Bolts'), b: spec(SCAV, 'Rust Rivets'), seed, countdown: 0, arena: 'open', wear: true });
  const G = S.robots[0], Sc = S.robots[1];
  const o = { seed, drones: {}, steps: 0, jam: 0, jamLoaded: 0, loaded: 0, empty: 0, boost: 0, spin: 0, boostSpin: 0, nitro: 0,
    gDealt: 0, gDealtBoost: 0, gDealtSpin: 0, speedB: [0, 0], speedN: [0, 0], near: 0, shellMotorT: null, shellT: null, spinEndT: null,
    cannonT: null, intakeT: null, firstShotT: null, gaps: [] };
  for (const d of G.drones) o.drones[d.key] = { dieT: null, hits: 0, hitsScoop: 0, dmg: 0, by: '', inRange: 0, life: 0 };
  let lastNitro = 0, lastDealt = 0, lastFired = 0, lastFireT = null, n = 0;
  const hp0 = new Map(G.drones.map(d => [d, d.hp]));
  while (!S.over && n++ < 48000) {
    DL.step(S); S.fx.length = 0; o.steps++;
    // drones: hp lost this step, and whether Scavenger's scoop (its only 'weapon' part) was close
    const sp = Sc.body.getPosition(), sf = Sc.body.getWorldVector({ x: 1, y: 0 }), scoop = { x: sp.x + sf.x * (Sc.hl + 0.1), y: sp.y + sf.y * (Sc.hl + 0.1) };
    for (const d of G.drones) {
      const D = o.drones[d.key];
      if (d.alive) D.life++;
      const lost = hp0.get(d) - Math.max(0, d.hp); hp0.set(d, Math.max(0, d.hp));
      if (lost > 0) { D.hits++; D.dmg += lost; const p = d.body.getPosition ? d.body.getPosition() : null; if (p && Math.hypot(p.x - scoop.x, p.y - scoop.y) < 0.45) D.hitsScoop++; }
      if (!d.alive && D.dieT == null) { D.dieT = +S.t.toFixed(1); const l = G.stats.lost.find(q => q.label === d.H.label); D.by = l ? l.by : '?'; }
      if (d.alive && d.key === 'jammer') { const p = d.body.getPosition(); if (Math.hypot(p.x - sp.x, p.y - sp.y) < 1.7) D.inRange++; }
    }
    // the jam on Scavenger, and whether Scavenger had something to fire
    const loaded = Sc.cannon && Sc.cannon.hp > 0 && Sc.hopper && Sc.hopper.length > 0;
    if (Sc.jammed > 0) { o.jam++; if (loaded) o.jamLoaded++; }
    if (loaded) o.loaded++; else if (Sc.hopper && !Sc.hopper.length) o.empty++;
    if (hack && Sc.l4.fired > lastFired && Sc.jammed > 0) { const jk = Math.max(0.1, 1 - 0.5 * 1.1 * (Sc.jamQ || 1)); Sc.l4.last += 0.9 / jk - 0.9 * 1.6; }
    if (Sc.l4.fired > lastFired) { if (lastFireT != null) o.gaps.push(+(S.t - lastFireT).toFixed(2)); else o.firstShotT = +S.t.toFixed(2); lastFireT = S.t; lastFired = Sc.l4.fired; }
    // Gyro: booster docked (boostK > 1), shell spinning (bladeW > 12, the engine's own "spinning" test), its damage dealt
    const boosted = G.boostK > 1, spinning = G.shell && G.shell.attached && G.wmotor.hp > 0 && G.bladeW > 12;
    if (boosted) o.boost++; if (spinning) o.spin++; if (boosted && spinning) o.boostSpin++;
    if ((G.nitro || 0) > lastNitro + 0.5) o.nitro++; lastNitro = G.nitro || 0;
    const dd = G.stats.dealt - lastDealt; lastDealt = G.stats.dealt; o.gDealt += dd; if (boosted) o.gDealtBoost += dd; if (spinning) o.gDealtSpin += dd;
    const v = G.body.getLinearVelocity(), vs = Math.hypot(v.x, v.y); if (boosted) { o.speedB[0] += vs; o.speedB[1]++; } else { o.speedN[0] += vs; o.speedN[1]++; }
    const gp = G.body.getPosition(); if (Math.hypot(gp.x - sp.x, gp.y - sp.y) < G.hl + Sc.hl + 0.5) o.near++;
    if (o.shellMotorT == null && G.wmotor.hp <= 0) o.shellMotorT = +S.t.toFixed(1);
    if (o.shellT == null && G.shell && !G.shell.attached) o.shellT = +S.t.toFixed(1);
    if (o.spinEndT == null && (G.wmotor.hp <= 0 || (G.shell && !G.shell.attached) || !G.alive)) o.spinEndT = +S.t.toFixed(1);
    if (o.cannonT == null && Sc.cannon.hp <= 0) o.cannonT = +S.t.toFixed(1);
    if (o.intakeT == null && Sc.intake.hp <= 0) o.intakeT = +S.t.toFixed(1);
  }
  const res = S.result || {};
  Object.assign(o, { gyroWon: res.winner === 0 ? 1 : res.winner === 1 ? 0 : 0.5, how: res.how || 'none', t: +(res.t || S.t).toFixed(1),
    fired: Sc.l4.fired, ate: Sc.l4.ate, junkHits: Sc.l4.hits || 0, junkDmg: Math.round(Sc.l4.dmg || 0), sTaken: Math.round(Sc.stats.taken), gTaken: Math.round(G.stats.taken),
    sDealtBy: Sc.stats.dealtBy, gDealtBy: G.stats.dealtBy });
  o.gDealt = Math.round(o.gDealt); o.gDealtBoost = Math.round(o.gDealtBoost); o.gDealtSpin = Math.round(o.gDealtSpin);
  o.speedB = o.speedB[1] ? +(o.speedB[0] / o.speedB[1]).toFixed(2) : null; o.speedN = o.speedN[1] ? +(o.speedN[0] / o.speedN[1]).toFixed(2) : null;
  return o;
}
function run(name, N) {
  const f = path.join(OUT, 'p1-' + name + '.jsonl'), done = new Set();
  if (fs.existsSync(f)) for (const l of fs.readFileSync(f, 'utf8').split('\n')) if (l.trim()) try { done.add(JSON.parse(l).seed); } catch (e) {}
  for (let seed = 1; seed <= N; seed++) { if (done.has(seed)) continue; fs.appendFileSync(f, JSON.stringify(fight(CFG[name], seed, HACK[name])) + '\n'); if (seed % 25 === 0) process.stderr.write(name + ' ' + seed + '\n'); }
}
const load = name => { const f = path.join(OUT, 'p1-' + name + '.jsonl'); return fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)) : []; };
const med = a => { const s = a.filter(x => x != null).sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null; };
const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
const r1 = x => Math.round(x * 10) / 10;
function report() {
  const out = [];
  for (const name of Object.keys(CFG)) {
    const R = load(name); if (!R.length) continue; const n = R.length;
    out.push(`== ${name}: ${n} fights, Gyro wins ${r1(100 * mean(R.map(r => r.gyroWon)))}%, fight length median ${med(R.map(r => r.t))} s`);
    for (const k of ['booster', 'jammer']) {
      const D = R.map(r => r.drones[k]).filter(Boolean); if (!D.length) continue;
      const died = D.filter(d => d.dieT != null), lifeShare = mean(R.filter(r => r.drones[k]).map(r => r.drones[k].life / r.steps));
      out.push(`  ${k}: shot down in ${died.length}/${D.length} fights (median at ${med(died.map(d => d.dieT))} s; by ${[...new Set(died.map(d => d.by))].join('/')}), alive ${r1(100 * lifeShare)}% of fight time; ` +
        `fights with any hit ${D.filter(d => d.hits).length}, damage steps ${D.reduce((a, d) => a + d.hits, 0)} (with Scavenger's scoop within 0.45 m: ${D.reduce((a, d) => a + d.hitsScoop, 0)})` +
        (k === 'jammer' ? `; within 1.7 m of Scavenger ${r1(100 * mean(R.map(r => r.drones.jammer.inRange / r.steps)))}% of fight time` : ''));
    }
    out.push(`  Scavenger jammed ${r1(100 * mean(R.map(r => r.jam / r.steps)))}% of fight time; loaded (cannon works, ammo in hopper) ${r1(100 * mean(R.map(r => r.loaded / r.steps)))}%, hopper empty ${r1(100 * mean(R.map(r => r.empty / r.steps)))}%; jammed while loaded ${r1(100 * mean(R.map(r => r.jamLoaded / Math.max(1, r.loaded))))}% of loaded time`);
    const gaps = R.flatMap(r => r.gaps);
    out.push(`  Scavenger shots per fight ${r1(mean(R.map(r => r.fired)))} (per minute ${r1(mean(R.map(r => r.fired / r.t * 60)))}), junk hits ${r1(mean(R.map(r => r.junkHits)))}, junk damage ${r1(mean(R.map(r => r.junkDmg)))}, sucked up ${r1(mean(R.map(r => r.ate)))}; time between shots median ${med(gaps)} s (under 1.0 s: ${r1(100 * gaps.filter(g => g < 1.0).length / Math.max(1, gaps.length))}%, 1.0-1.5 s: ${r1(100 * gaps.filter(g => g >= 1.0 && g < 1.5).length / Math.max(1, gaps.length))}%); first shot median ${med(R.map(r => r.firstShotT))} s`);
    const sm = R.map(r => r.shellMotorT);
    out.push(`  Gyro shell motor lost in ${sm.filter(x => x != null).length}/${n} (median ${med(sm)} s), shell off in ${R.filter(r => r.shellT != null).length}; spinning shell works until median ${med(R.map(r => r.spinEndT == null ? r.t : r.spinEndT))} s = ${r1(100 * mean(R.map(r => (r.spinEndT == null ? r.t : r.spinEndT) / r.t)))}% of the fight; shell actually spinning (>12 rad/s) ${r1(100 * mean(R.map(r => r.spin / r.steps)))}% of fight time`);
    out.push(`  Booster docked ${r1(100 * mean(R.map(r => r.boost / r.steps)))}% of fight time, docked AND shell spinning ${r1(100 * mean(R.map(r => r.boostSpin / r.steps)))}%; nitro kicks per fight ${r1(mean(R.map(r => r.nitro)))}; Gyro speed docked ${r1(mean(R.filter(r => r.speedB != null).map(r => r.speedB)) * 10) / 10} m/s vs not ${r1(mean(R.filter(r => r.speedN != null).map(r => r.speedN)) * 10) / 10}`);
    out.push(`  Gyro damage dealt ${r1(mean(R.map(r => r.gDealt)))} per fight (with booster docked ${r1(mean(R.map(r => r.gDealtBoost)))}, while its shell spins ${r1(mean(R.map(r => r.gDealtSpin)))}); by cause ${JSON.stringify(Object.fromEntries(Object.entries(R.reduce((a, r) => { for (const [k, v] of Object.entries(r.gDealtBy || {})) a[k] = (a[k] || 0) + v; return a; }, {})).map(([k, v]) => [k, Math.round(v / n)])))}`);
    out.push(`  Scavenger cannon lost ${R.filter(r => r.cannonT != null).length}/${n}, vacuum lost ${R.filter(r => r.intakeT != null).length}/${n}; Gyro takes ${r1(mean(R.map(r => r.gTaken)))}, Scavenger takes ${r1(mean(R.map(r => r.sTaken)))}`);
  }
  // paired: the same seed with and without each drone
  const F = new Map(load('full').map(r => [r.seed, r]));
  for (const name of ['nojammer', 'nobooster', 'jamfix']) {
    const P = load(name).filter(r => F.has(r.seed)); if (!P.length) continue;
    const d = P.map(r => F.get(r.seed).gyroWon - r.gyroWon), m = mean(d), sd = Math.sqrt(mean(d.map(x => (x - m) ** 2))), se = sd / Math.sqrt(d.length);
    const dm = P.filter(r => r.shellMotorT != null && F.get(r.seed).shellMotorT != null).map(r => F.get(r.seed).shellMotorT - r.shellMotorT);
    out.push(`== paired full vs ${name} (${P.length} seeds): win gain of the part ${r1(100 * m)} points ± ${r1(196 * se)}; Scavenger shots ${r1(mean(P.map(r => F.get(r.seed).fired)))} vs ${r1(mean(P.map(r => r.fired)))} per fight, per minute ${r1(mean(P.map(r => F.get(r.seed).fired / F.get(r.seed).t * 60)))} vs ${r1(mean(P.map(r => r.fired / r.t * 60)))}; shell motor dies at median ${med(P.map(r => F.get(r.seed).shellMotorT))} vs ${med(P.map(r => r.shellMotorT))} s (paired difference median ${med(dm)} s, mean ${r1(mean(dm))} s, ${dm.length} pairs); first shot at ${r1(mean(P.map(r => F.get(r.seed).firstShotT)))}`);
  }
  console.log(out.join('\n')); fs.writeFileSync(path.join(OUT, 'p1-report.txt'), out.join('\n') + '\n');
}
if (require.main !== module) {} else if (process.argv.includes('--report')) report(); else if (arg('cfg')) for (const c of arg('cfg').split(',')) run(c, +arg('n', 200));
module.exports = { fight, CFG };
