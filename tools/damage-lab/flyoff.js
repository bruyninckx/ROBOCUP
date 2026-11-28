// T67 parts that fly off: seeded fights of one robot against the whole tuned field, breakaway switch on and off (paired seeds).
// node flyoff.js Buzzkill [seedsPerOpponent=4] [shard=0/1] [on] > out.jsonl   (one JSON line a fight; 'on': only the switch-on fights, for tuning)
// node flyoff.js report out.jsonl ...                                        (the numbers for docs/robocus-flyoff.md)
// T68: node flyoff.js gone Gyro [seedsPerOpponent=4] [shard=0/1] > g.jsonl    (switch off; the robot without its piece from the start,
//      spec.flyoffGone, against the same robot keeping it, spec.flyoffKeep: same seeds; the behaviour change)
//      node flyoff.js gonereport g.jsonl ...
const L = require('./engine.js'), LU = require('./lineup.js'); LU.usePK();
const args = process.argv.slice(2);
if (args[0] === 'report') { report(args.slice(1)); return; }
if (args[0] === 'gonereport') { goneReport(args.slice(1)); return; }
const gone = args[0] === 'gone'; if (gone) args.shift();
const name = args[0], per = +(args[1] || 4), [si, sn] = (args[2] || '0/1').split('/').map(Number), onOnly = args[3] === 'on';
const field = Object.keys(LU.ROBOTS).concat(Object.keys(LU.ROBOTS4)).filter(n => n !== name);
// what the robot did (T68): its weapon's own counters
function weap(R, S) {
  const st = R.l4 || {}, F = R.fo || {}, o = { t: +S.t.toFixed(2), by: {} };
  for (const ph of ['pre', 'post']) for (const [c, v] of Object.entries((F.dealt || {})[ph] || {})) { const a = o.by[c] || (o.by[c] = { n: 0, d: 0 }); a.n += v.n; a.d = +(a.d + v.d).toFixed(2); }
  for (const k of ['fired', 'hits', 'thrown', 'ate']) if (st[k] != null) o[k] = st[k];
  for (const k of ['wide', 'picks', 'cuts', 'spilled', 'fetch']) if (F[k] != null) o[k] = F[k];
  return o;
}
let job = 0;
if (gone) {
  for (const opp of field) for (let k = 0; k < per; k++) {
    if (job++ % sn !== si) continue;
    const seed = 1000 + k * 37 + field.indexOf(opp) * 1009, swap = k % 2 === 1;
    for (const g of [false, true]) {
      const me = Object.assign(LU.build(name), g ? { flyoffGone: true } : { flyoffKeep: true }), them = LU.build(opp);
      const S = L.run(swap ? { a: them, b: me, seed, arena: 'open', flyoff: false } : { a: me, b: them, seed, arena: 'open', flyoff: false });
      const R = S.robots[swap ? 1 : 0];
      console.log(JSON.stringify(Object.assign({ name, opp, seed, gone: g, win: S.result ? (S.result.winner === R.id ? 1 : 0) : 0.5 }, weap(R, S))));
    }
  }
  return;
}
for (const opp of field) for (let k = 0; k < per; k++) {
  if (job++ % sn !== si) continue;
  const seed = 1000 + k * 37 + field.indexOf(opp) * 1009, swap = k % 2 === 1;
  for (const on of onOnly ? [true] : [false, true]) {
    const me = LU.build(name), them = LU.build(opp);
    const S = L.run(swap ? { a: them, b: me, seed, arena: 'open', flyoff: on } : { a: me, b: them, seed, arena: 'open', flyoff: on });
    const R = S.robots[swap ? 1 : 0], E = S.robots[swap ? 0 : 1], F = R.fo;
    const o = { name, opp, seed, on, win: S.result ? (S.result.winner === R.id ? 1 : 0) : 0.5, t: +S.t.toFixed(2), how: S.result ? S.result.how : '-' };
    if (F) {
      o.off = F.off; o.offT = F.offT; o.own = F.touch.own; o.other = F.touch.other; o.dealt = F.dealt; o.pieces = F.pieces.length;
      o.n = F.n; o.offs = F.offs; o.ev = F.ev; o.stuck = F.pieces.filter(p => p.stuckIn).length; // T69: pieces lost (several per robot), when, the touch / step effects
      o.pieceMoved = F.pieces.reduce((a, p) => a + (p.body.isActive() ? 1 : 0), 0);
      if (R.foBend != null) o.bend = +R.foBend.toFixed(3);
    }
    o.flips = R.spec.weapon === 'flipper' ? 12 - R.gas : undefined;
    if (F) { const w = weap(R, S); for (const k of ['fired', 'hits', 'thrown', 'ate', 'wide', 'picks', 'cuts', 'spilled', 'fetch']) if (w[k] != null) o[k] = w[k]; }
    console.log(JSON.stringify(o));
  }
}
function report(files) {
  const fs = require('fs'), rows = files.flatMap(f => fs.readFileSync(f, 'utf8').trim().split('\n').filter(Boolean).map(l => JSON.parse(l)));
  const by = {}; for (const r of rows) (by[r.name] = by[r.name] || []).push(r);
  for (const [n, rs] of Object.entries(by)) {
    const on = rs.filter(r => r.on), off = rs.filter(r => !r.on), N = on.length;
    const pop = on.filter(r => r.off), p = pop.length / N, se = Math.sqrt(p * (1 - p) / N);
    const wOn = on.reduce((a, r) => a + r.win, 0) / N, wOff = off.length ? off.reduce((a, r) => a + r.win, 0) / off.length : NaN;
    // paired difference: same seed, same opponent
    const key = r => r.opp + '|' + r.seed, offM = new Map(off.map(r => [key(r), r])), diffs = on.map(r => r.win - (offM.get(key(r)) || { win: r.win }).win);
    const md = diffs.reduce((a, x) => a + x, 0) / diffs.length, sd = Math.sqrt(diffs.reduce((a, x) => a + (x - md) ** 2, 0) / (diffs.length - 1)), sed = sd / Math.sqrt(diffs.length);
    const tot = pop.reduce((a, r) => a + r.own + r.other, 0), oth = pop.reduce((a, r) => a + r.other, 0), withTouch = pop.filter(r => r.own + r.other > 0).length;
    const offTs = pop.map(r => r.offT).sort((a, b) => a - b);
    console.log(`## ${n}: ${N} fights with the switch on, ${off.length} paired with it off (${new Set(rs.map(r => r.opp)).size} opponents, open floor)`);
    console.log(`- piece comes off in ${pop.length} of ${N} fights: ${(p * 100).toFixed(0)}% (± ${(1.96 * se * 100).toFixed(0)}, 95%); median time ${offTs.length ? offTs[offTs.length >> 1].toFixed(1) : '-'} s`);
    console.log(`- loose piece touched by robots in ${withTouch} of ${pop.length} fights; ${tot} contacts (${oth} by the other robot, ${tot - oth} by its own robot), ${(tot / Math.max(1, pop.length)).toFixed(1)} a fight`);
    console.log(`- win rate vs the field: off ${(wOff * 100).toFixed(1)}%, on ${(wOn * 100).toFixed(1)}%; paired difference ${(md * 100).toFixed(1)} ± ${(1.96 * sed * 100).toFixed(1)} points (95%)`);
    // behaviour: hits and damage per hit before / after, by cause, over the fights where it came off (time-normalised)
    const agg = { pre: {}, post: {} }, time = { pre: 0, post: 0 };
    for (const r of pop) { time.pre += r.offT; time.post += Math.max(0, r.t - r.offT); for (const ph of ['pre', 'post']) for (const [c, v] of Object.entries(r.dealt[ph])) { const a = agg[ph][c] || (agg[ph][c] = { n: 0, d: 0 }); a.n += v.n; a.d += v.d; } }
    const top = Object.entries(agg.pre).concat(Object.entries(agg.post)).reduce((m, [c, v]) => (m[c] = (m[c] || 0) + v.d, m), {}), main = Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 2).map(x => x[0]);
    for (const c of main) { const a = agg.pre[c] || { n: 0, d: 0 }, b = agg.post[c] || { n: 0, d: 0 };
      console.log(`- ${c} hits (fights where it came off): before ${(a.n / time.pre).toFixed(2)}/s, ${(a.d / Math.max(1, a.n)).toFixed(1)} a hit, ${(a.d / time.pre).toFixed(1)} damage/s; after ${(b.n / Math.max(1e-9, time.post)).toFixed(2)}/s, ${(b.d / Math.max(1, b.n)).toFixed(1)} a hit, ${(b.d / Math.max(1e-9, time.post)).toFixed(1)} damage/s`); }
    if (on.some(r => r.bend != null)) { const bs = pop.map(r => r.bend || 0); console.log(`- bare flipper bend at the end: mean ${(bs.reduce((a, x) => a + x, 0) / bs.length).toFixed(2)} (max 0.5); flips a fight on ${(on.reduce((a, r) => a + r.flips, 0) / N).toFixed(1)}, off ${(off.reduce((a, r) => a + r.flips, 0) / off.length).toFixed(1)}`); }
    const pw = new Map(); for (const r of on) { const o = pw.get(r.opp) || { n: 0, p: 0 }; o.n++; o.p += r.off ? 1 : 0; pw.set(r.opp, o); }
  }
}

// T68: the behaviour change, from fights started without the piece (gone) against the same fights keeping it (keep)
function goneReport(files) {
  const fs = require('fs'), rows = files.flatMap(f => fs.readFileSync(f, 'utf8').trim().split('\n').filter(Boolean).map(l => JSON.parse(l)));
  const by = {}; for (const r of rows) (by[r.name] = by[r.name] || []).push(r);
  for (const [n, rs] of Object.entries(by)) {
    const G = rs.filter(r => r.gone), K = rs.filter(r => !r.gone), sum = (A, f) => A.reduce((a, r) => a + (f(r) || 0), 0);
    console.log(`## ${n} without its piece from the start: ${G.length} fights, against the same ${K.length} keeping it (switch off, open floor)`);
    console.log(`- wins: keeping it ${sum(K, r => r.win)} of ${K.length}, without it ${sum(G, r => r.win)} of ${G.length}`);
    const tK = sum(K, r => r.t), tG = sum(G, r => r.t), causes = {};
    for (const r of rs) for (const [c, v] of Object.entries(r.by)) causes[c] = (causes[c] || 0) + v.d;
    for (const c of Object.entries(causes).sort((a, b) => b[1] - a[1]).slice(0, 3).map(x => x[0])) {
      const f = (A, T) => { const n2 = sum(A, r => (r.by[c] || {}).n), d = sum(A, r => (r.by[c] || {}).d); return `${(n2 / T).toFixed(2)}/s, ${(d / Math.max(1, n2)).toFixed(1)} a hit, ${(d / T).toFixed(2)} damage/s`; };
      console.log(`- ${c} hits: keeping it ${f(K, tK)}; without it ${f(G, tG)}`);
    }
    for (const k of ['fired', 'hits', 'thrown', 'ate', 'wide', 'picks', 'cuts', 'spilled', 'fetch']) if (rs.some(r => r[k] != null)) console.log(`- ${k}: keeping it ${(sum(K, r => r[k]) / tK * 60).toFixed(2)} a minute, without it ${(sum(G, r => r[k]) / tG * 60).toFixed(2)} a minute`);
    console.log(`- fight length: keeping it ${(tK / K.length).toFixed(1)} s, without it ${(tG / G.length).toFixed(1)} s`);
  }
}
