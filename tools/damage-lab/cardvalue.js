// ROBOCUS 2.0: how much each robot-stat Intrigue card changes a robot's chance to win its next fight.
//   node cardvalue.js [fights per card, default 220] [EMP fights, default 200] [workers, default 2]
// Paired design: the same pairs of equal-level robots (sides alternate) and the same seeds are fought with and
// without the card on robot A. The spec changes are exactly the ones prototypes/tabletop-2.html makes
// (fightSpec for face-down cards and EMP the Garage, resolveScheme0 for Loose Bolts / Rogue Firmware,
// the fight-end wear for Overclock, Repair2.bodyHeal for the free Upkeep heal).
// Results: cardvalue-results.json (win %, swing in points, logit and levels = logit / 0.62).
'use strict';
const path = require('path'), fs = require('fs'), cp = require('child_process');
try { require.resolve('planck'); } catch (e) { globalThis.planck = require(path.join(__dirname, '../../vendor/planck-1.4.3.min.js')); }
const L = require('./engine.js'), LU = require('./lineup.js'); LU.usePK();
const LEVEL = 0.62, MAXT = 200;
const N = +process.argv[2] || 220, NE = +process.argv[3] || 200, W = +process.argv[4] || 2;
const names = Object.keys(LU.ROBOTS), lvOf = n => LU.ROBOTS[n][0];
const emptyWear = () => ({ parts: {}, lost: [], ints: {}, dents: {}, drones: [] });   // as the page's emptyWear
const motorsOf = sp => L.create({ a: sp, b: sp, seed: 1 }).robots[0].internals.filter(q => q.key === 'motor').map(q => q.label);
const withWear = (sp, f) => { sp.wear = sp.wear || emptyWear(); f(sp.wear); return sp; };
// card -> what it does to robot A's spec (a fresh LU.build copy)
const CONDS = {
  base: sp => sp,
  'Secret Upgrade': sp => { sp.dmgK *= 1.2; sp.hpK *= 1.2; return sp; },                         // fightSpec tm.up
  'Smudged Lens': sp => { sp.dmgK *= 0.85; return sp; },                                          // fightSpec tm.lens
  Overclock: sp => { sp.motor = 'hot'; return sp; },                                              // fightSpec tm.oc
  'Overclock (after: drive motors 40%)': sp => withWear(sp, w => { for (const lb of motorsOf(sp)) w.ints[lb] = 0.4; }),   // fight-end wear
  'Sugar in the Tank': sp => withWear(sp, w => { for (const lb of motorsOf(sp)) w.ints[lb] = 0.6; }),                     // fightSpec tm.sugar
  'Loose Bolts (lid 30%)': sp => withWear(sp, w => { w.lid = 0.3; }),                              // resolveScheme0
  'Loose Bolts (after free heal: lid 50%)': sp => withWear(sp, w => { w.lid = 0.3; }) && heal(sp),
  'Rogue Firmware chassis (40%)': sp => withWear(sp, w => { w.parts.Chassis = 0.4; }),             // resolveScheme0
  'Rogue Firmware chassis (after free heal: 50%)': sp => withWear(sp, w => { w.parts.Chassis = 0.4; }) && heal(sp),
};
// candidate numbers for the owner (not in the game): the same pairs and seeds, so they share the base row
const PROPS = {
  'proposal: Secret Upgrade +15% / +15%': sp => { sp.dmgK *= 1.15; sp.hpK *= 1.15; return sp; },
  'proposal: Sugar in the Tank, motors at 30%': sp => withWear(sp, w => { for (const lb of motorsOf(sp)) w.ints[lb] = 0.3; }),
  'proposal: Loose Bolts, top plate off': sp => withWear(sp, w => { w.lid = 0; }),
  'proposal: Loose Bolts, one wheel at 30%': sp => withWear(sp, w => { const R = L.create({ a: sp, b: sp, seed: 1 }).robots[0], q = R.parts.find(x => x.kind === 'wheel'); if (q) w.parts[q.label] = 0.3; }),
  'proposal: Smudged Lens -25%': sp => { sp.dmgK *= 0.75; return sp; },
};
Object.assign(CONDS, PROPS);
function heal(sp) {   // Repair2.bodyHeal (needs src2/repair.js, which wants window-less globals)
  const R2 = require('../../src2/repair.js'); R2.bodyHeal(sp); return sp;
}
const EMP = { base: sp => sp, 'EMP the Garage': sp => { sp.mod = 'none'; sp.helpers = []; if (sp.wear) sp.wear.drones = []; return sp; } };   // fightSpec T.tamper.noMods

// the pairs: A walks the lineup, B is another robot of the same level; sides alternate
function pairs(n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = names[i % names.length], same = names.filter(b => lvOf(b) === lvOf(a) && b !== a), b = same[Math.floor(i / names.length) % same.length];
    out.push({ a, pa: [], b, pb: [], sw: i % 2, seed: 9100 + i });
  }
  return out;
}
// EMP pairs: robots with their own module (vs the same level), and level 0-2 robots with a drone or module part
// vs a stock robot one level up (a part is worth about a level: docs/robocus-2.0-lineup.md)
function empPairs(n) {
  const own = names.filter(x => { const s = L.normSpec(LU.build(x)); return s.mod && s.mod !== 'none'; });
  const parts = Object.keys(LU.PARTS).filter(k => LU.PARTS[k].kind === 'drone' || LU.PARTS[k].kind === 'module');
  const low = names.filter(x => lvOf(x) <= 2), out = [];
  for (let i = 0; i < n; i++) {
    let a, pa = [], b;
    if (i % 3 === 0) { a = own[(i / 3) % own.length]; const same = names.filter(x => lvOf(x) === lvOf(a) && x !== a); b = same[Math.floor(i / 3 / own.length) % same.length]; }
    else { const j = i - Math.ceil(i / 3); a = low[j % low.length]; pa = [parts[j % parts.length]]; const up = names.filter(x => lvOf(x) === lvOf(a) + 1); b = up[j % up.length]; }
    out.push({ a, pa, b, pb: [], sw: i % 2, seed: 9700 + i, emp: true });
  }
  return out;
}
function fight(p, cond) {
  const f = (p.emp ? EMP : CONDS)[cond], sa = f(LU.build(p.a, p.pa)), sb = LU.build(p.b, p.pb);
  const S = L.run(p.sw ? { a: sb, b: sa, seed: p.seed } : { a: sa, b: sb, seed: p.seed }, MAXT);
  return (S.result.winner === (p.sw ? 1 : 0)) ? 1 : 0;
}
function jobs() {
  const J = [], P = pairs(N), E = empPairs(NE);
  for (const c of Object.keys(CONDS)) P.forEach((p, i) => J.push({ set: 'main', c, i }));
  for (const c of Object.keys(EMP)) E.forEach((p, i) => J.push({ set: 'emp', c, i }));
  return { J, P, E };
}

if (process.env.CV_WORKER != null) {   // worker: every W-th job
  const k = +process.env.CV_WORKER, { J, P, E } = jobs(), out = [];
  J.forEach((j, n) => { if (n % W === k) out.push([n, fight((j.set === 'emp' ? E : P)[j.i], j.c)]); });
  process.send(out);
} else {
  const t0 = Date.now(), { J, P, E } = jobs(), win = new Array(J.length);
  let left = W;
  for (let k = 0; k < W; k++) {
    const ch = cp.fork(__filename, process.argv.slice(2), { env: Object.assign({}, process.env, { CV_WORKER: k }) });
    ch.on('message', m => { for (const [n, w] of m) win[n] = w; });
    ch.on('exit', () => { if (--left === 0) done(); });
  }
  function done() {
    const by = {}; J.forEach((j, n) => { ((by[j.set] = by[j.set] || {})[j.c] = by[j.set][j.c] || [])[j.i] = win[n]; });
    const lg = p => Math.log(Math.max(0.005, Math.min(0.995, p)) / (1 - Math.max(0.005, Math.min(0.995, p))));
    const res = { fights: { main: N, emp: NE }, seconds: Math.round((Date.now() - t0) / 1000), cards: {} };
    for (const set of ['main', 'emp']) {
      const B = by[set].base, pb = B.reduce((a, x) => a + x, 0) / B.length;
      res[set === 'main' ? 'base' : 'empBase'] = Math.round(pb * 1000) / 10;
      for (const c of Object.keys(by[set])) {
        if (c === 'base') continue;
        const X = by[set][c], d = X.map((x, i) => x - B[i]), md = d.reduce((a, x) => a + x, 0) / d.length;
        const sd = Math.sqrt(d.reduce((a, x) => a + (x - md) * (x - md), 0) / (d.length - 1)), pc = pb + md;
        res.cards[c] = { n: X.length, base: Math.round(pb * 1000) / 10, win: Math.round(pc * 1000) / 10, swing: Math.round(md * 1000) / 10,
          se: Math.round(sd / Math.sqrt(d.length) * 1000) / 10, logit: Math.round((lg(pc) - lg(pb)) * 100) / 100, levels: Math.round((lg(pc) - lg(pb)) / LEVEL * 100) / 100 };
        const r = res.cards[c];
        console.log(c.padEnd(46), (r.base + '% -> ' + r.win + '%').padEnd(16), 'swing', (r.swing > 0 ? '+' : '') + r.swing, '±' + r.se, ' logit', r.logit, ' levels', r.levels);
      }
    }
    // which robots Overclock can't change (already hot-wound) and which have a module of their own
    res.notes = { alreadyHot: names.filter(x => L.normSpec(LU.build(x)).motor === 'hot'), ownModule: names.filter(x => { const s = L.normSpec(LU.build(x)); return s.mod && s.mod !== 'none'; }) };
    fs.writeFileSync(path.join(__dirname, 'cardvalue-results.json'), JSON.stringify(res, null, 1));
    console.log('saved cardvalue-results.json in', res.seconds, 's');
  }
}
