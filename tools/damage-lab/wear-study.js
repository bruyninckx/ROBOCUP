// ROBOCUS 2.0 wear study (Kev, 11 Nov): what does carried-over damage really cost each robot, against what the bookie charges?
// node wear-study.js <out.jsonl> [Robot,Robot,...]   then wear-report.js <out.jsonl ...>
// Per robot: 1) fight it against robots near its level and keep the damage it carries out (as the game does: wearOf, then the free
// Upkeep body heal to half); 2) send each damaged copy and the robot as new into the same fights (same rivals, seeds, sides).
// Output: one line per damaged state: zones, what is lost, wins worn / new, and the bookie's strength change for that damage.
const fs = require('fs'), path = require('path');
const L = require('./engine.js'), LU = require('./lineup.js'); LU.usePK();
const R2 = require(path.join('..', '..', 'src2', 'repair.js'));
const all = Object.assign({}, LU.ROBOTS, LU.ROBOTS4), lv = n => all[n][0], names = Object.keys(all);
const out = process.argv[2], who = process.argv[3] ? process.argv[3].split(',') : names;
const NS = +process.env.NS || 18, NO = +process.env.NO || 4, SEEDS = +process.env.SEEDS || 2;
const run = (A, B, seed) => { const S = L.create({ a: A, b: B, seed, arena: 'open' }); while (!S.over && S.t < 200) { L.step(S); S.fx.length = 0; } return S; };
const clone = o => JSON.parse(JSON.stringify(o));
for (const a of who) {
  const h = [...a].reduce((x, c) => x * 31 + c.charCodeAt(0) >>> 0, 7);
  const near = names.filter(b => b !== a && Math.abs(lv(b) - lv(a)) <= 1);
  const pick = (k, n) => { const o = []; for (let i = 0; o.length < n && i < 99; i++) { const b = near[(h + k * 7 + i * 5) % near.length]; if (!o.includes(b)) o.push(b); } return o; };
  // 1) damaged states, as they come out of real fights (winner or loser)
  const states = [];
  for (let i = 0; states.length < NS && i < NS * 4; i++) {
    const b = near[(h + i * 3) % near.length], side = i % 2, A = LU.build(a), B = LU.build(b);
    const S = run(side ? B : A, side ? A : B, 52000 + h % 1000 + i * 13);
    const sp = LU.build(a); sp.wear = clone(L.wearOf(S.robots[side])); R2.bodyHeal(sp, 0.5);
    const Z = R2.zones(sp); if (!R2.ZONES.some(z => Z[z.key].damaged)) continue;
    states.push({ wear: sp.wear, won: S.result.winner === side, z: Object.fromEntries(R2.ZONES.map(z => [z.key, Z[z.key].broken ? 'broken' : Z[z.key].damaged ? 'damaged' : 'ok'])), lost: Object.fromEntries(R2.ZONES.map(z => [z.key, Z[z.key].lost])), f: Object.fromEntries(R2.ZONES.map(z => [z.key, Math.round(Z[z.key].f * 100) / 100])) });
  }
  // 2) the same fights, damaged and as new
  const opp = pick(1, NO), fights = []; for (const b of opp) for (let s = 0; s < SEEDS; s++) for (const side of [0, 1]) fights.push({ b, side, seed: 77000 + h % 1000 + fights.length * 19 });
  const play = wear => { let w = 0; for (const f of fights) { const A = LU.build(a), B = LU.build(f.b); if (wear) A.wear = clone(wear); const S = run(f.side ? B : A, f.side ? A : B, f.seed); if (S.result.winner === f.side) w++; } return w; };
  const base = play(null), s0 = R2.strength(null, a, lv(a), []);
  for (const st of states) for (const v of ['raw', 'body']) {
    const sp = LU.build(a); sp.wear = clone(st.wear);
    if (v === 'body') { if (st.z.body === 'ok' || (st.z.drive === 'ok' && st.z.weapon === 'ok')) continue; R2.repairZone(sp, 'drive'); R2.repairZone(sp, 'weapon'); }   // the usual state in real games: Drive and Weapon repaired, Body left
    const Z = R2.zones(sp), zs = k => Z[k].broken ? 'broken' : Z[k].damaged ? 'damaged' : 'ok';
    const rec = { robot: a, lv: lv(a), v, n: fights.length, base, worn: play(sp.wear), won: st.won, z: { drive: zs('drive'), weapon: zs('weapon'), body: zs('body') }, lost: Z.body.lost, lostDW: Z.drive.lost.concat(Z.weapon.lost), f: Math.round(Z.body.f * 100) / 100, ds: Math.round((R2.strength(sp, a, lv(a), []) - s0) * 1000) / 1000 };
    fs.appendFileSync(out, JSON.stringify(rec) + '\n');
  }
}
