// ROBOCUS T37 (Kev, 21 Nov): the 11 Nov wear effects (ARC.cx crack / frag / bend / grindout) in the game's own fights.
// Three variants of the same fight (same robots, seed, side): off (today's game), bend (A: bending only), all (B: all four wear switches).
// The bump switches (slide, under, crush, gut) stay off. Robots are built the way the game builds them (lineup.js build, game part strengths).
//   node wear-game.js duel  <out.jsonl> [shard nShards]   every pair of lineup robots at most one level apart, K fights a pair
//                                                          (seed rounds outermost, so any prefix of the file is a balanced sample)
//   node wear-game.js bw    <out.jsonl>                    Buzzkill vs Whirlwind, N fights: how far the spinner bars bend
//   node wear-game.js carry                                does a bend / crack / groove survive wearOf -> the next fight?
// Resumes: jobs already in <out.jsonl> are skipped. Report: node wear-game-report.js <out.jsonl ...>
// Env: K (fights per pair, default 8 = 4 seeds x 2 sides), N (Buzzkill-Whirlwind fights, default 24), VARIANTS (default off,bend,all).
const fs = require('fs');
const L = require('./engine.js'), LU = require('./lineup.js'); LU.usePK();
// T41 knobs: WEARK = JSON merged into engine WEAR (e.g. {"hpExp":0.5}), GRADES = JSON of power dials {Robot: p}, ONLY = robots (comma list)
// whose pairs are played, SEED0 = seed offset (fresh seeds), wear knobs in KINKK (engine KINK) and KSTIFFK (engine KSTIFF)
if (process.env.WEARK) Object.assign(L.WEAR, JSON.parse(process.env.WEARK));
if (process.env.KINKK) Object.assign(L.KINK, JSON.parse(process.env.KINKK));
if (process.env.KSTIFFK) Object.assign(L.KSTIFF, JSON.parse(process.env.KSTIFFK));
if (process.env.GRADES) for (const [n, p] of Object.entries(JSON.parse(process.env.GRADES))) { const t = LU.ROBOTS[n] || LU.ROBOTS4[n]; if (t) t[1] = p; }
const ONLY = process.env.ONLY ? new Set(process.env.ONLY.split(',')) : null, SEED0 = +(process.env.SEED0 || 0);
const all = Object.assign({}, LU.ROBOTS, LU.ROBOTS4), names = Object.keys(all), lv = n => all[n][0];
const VARIANTS = (process.env.VARIANTS || 'off,bend,all').split(',');
const WEAR4 = ['crack', 'frag', 'bend', 'grindout'];
function setVariant(v) { for (const k of Object.keys(L.ARC.cx)) L.ARC.cx[k] = false; if (v === 'bend') L.ARC.cx.bend = true; if (v === 'all') for (const k of WEAR4) L.ARC.cx[k] = true;
  if (WEAR4.includes(v)) L.ARC.cx[v] = true; if (/^no-/.test(v)) for (const k of WEAR4) L.ARC.cx[k] = k !== v.slice(3); }   // T41 diagnostics: one switch alone, or all but one
const DEG = 180 / Math.PI;
// how bent a robot's weapon parts are right now: the biggest kink (degrees), bows and warps (0..1 of their max)
function bentOf(R) {
  let kink = 0, warp = 0; const arms = [];
  for (const q of R.parts) {
    if (q.kinks) for (const kk of q.kinks) { const d = Math.abs(kk.th) * DEG; if (d > kink) kink = d; if (q.key === 'blade') arms.push(+d.toFixed(1)); }
    if (q.warp) warp = Math.max(warp, q.warp);
  }
  return { kink: +kink.toFixed(1), warp: +warp.toFixed(3), arms };
}
function fight(a, b, seed, side, v, watch) {
  setVariant(v);
  const x = side ? b : a, y = side ? a : b;
  const S = L.create({ a: LU.build(x), b: LU.build(y), seed, arena: 'open' });
  const mx = [0, 0]; let g = 0;
  while (!S.over && S.t < 200) { L.step(S); S.fx.length = 0; if (watch && ++g % 20 === 0) S.robots.forEach((R, i) => { mx[i] = Math.max(mx[i], bentOf(R).kink); }); }
  const ia = side ? 1 : 0, w = S.result ? S.result.winner : null;
  const rob = i => { const R = S.robots[i], bo = bentOf(R); return { cx: R.stats.cx || {}, kink: bo.kink, warp: bo.warp, arms: bo.arms, kmax: watch ? Math.max(mx[i], bo.kink) : undefined }; };
  return { v, aw: w == null ? 0.5 : (w === ia ? 1 : 0), t: +S.t.toFixed(1), ko: S.result && S.result.how === 'KO' ? 1 : 0, A: rob(ia), B: rob(1 - ia) };
}
const done = out => { const s = new Set(); if (fs.existsSync(out)) for (const l of fs.readFileSync(out, 'utf8').split('\n')) if (l) { try { s.add(JSON.parse(l).id); } catch (e) {} } return s; };
const [cmd, out] = process.argv.slice(2);
if (cmd === 'duel') {
  const shard = +(process.argv[4] || 0), nsh = +(process.argv[5] || 1), K = +(process.env.K || 8);
  const pairs = []; for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) if (Math.abs(lv(names[i]) - lv(names[j])) <= 1) pairs.push([names[i], names[j]]);
  const have = done(out); let job = 0, n = 0; const t0 = Date.now();
  for (let s = 0; s < K; s++) pairs.forEach(([a, b], k) => {
    if (ONLY && !ONLY.has(a) && !ONLY.has(b)) return;   // seeds stay those of the full run (k is the pair's place in the full list)
    if ((job++ % nsh) !== shard) return; const id = `${a}|${b}|${s}`; if (have.has(id)) return;
    const seed = 37000 + SEED0 + 31 * k + (s >> 1), side = s % 2;   // seed s>>1 played from both sides
    const rec = { id, a, b, la: lv(a), lb: lv(b), seed, side, r: VARIANTS.map(v => fight(a, b, seed, side, v)) };
    fs.appendFileSync(out, JSON.stringify(rec) + '\n'); n++;
    if (n % 25 === 0) console.log(`shard ${shard}: ${n} jobs, ${Math.round((Date.now() - t0) / 1000)} s`);
  });
  console.log('done shard', shard, n, 'new jobs');
}
if (cmd === 'bw') {
  const N = +(process.env.N || 24), have = done(out);
  for (let s = 0; s < N; s++) { const id = `bw|${s}`; if (have.has(id)) continue; const seed = 39000 + (s >> 1), side = s % 2;
    fs.appendFileSync(out, JSON.stringify({ id, a: 'Buzzkill', b: 'Whirlwind', seed, side, r: VARIANTS.map(v => fight('Buzzkill', 'Whirlwind', seed, side, v, true)) }) + '\n'); }
  console.log('done bw');
}
if (cmd === 'carry') {
  // one fight with all four on, then the game's way of keeping damage: spec.wear = wearOf(robot), and a fresh robot built with it
  setVariant('all');
  for (const [a, b, seed] of [['Buzzkill', 'Whirlwind', 39001], ['Hornet', 'Thumper', 39002], ['Mincer', 'Snapjaw', 39003]]) {
    const S = L.create({ a: LU.build(a), b: LU.build(b), seed, arena: 'open' }); while (!S.over && S.t < 200) { L.step(S); S.fx.length = 0; }
    const R = S.robots[0], w = L.wearOf(R), sp = LU.build(a); sp.wear = JSON.parse(JSON.stringify(w));
    const R2 = L.create({ a: sp, b: LU.build(b), seed: 1, arena: 'open' }).robots[0];
    const marks = Q => Q.parts.filter(q => q.attached).map(q => ({ p: q.label, kinks: (q.kinks || []).length, kink: +((q.kinks || []).reduce((m, k) => Math.max(m, Math.abs(k.th)), 0) * DEG).toFixed(1), warp: q.warp || 0, bends: (q.bends || []).length, cracks: (q.cracks || []).length, grooves: (q.grooves || []).length, dents: q.dents.length, hp: +(q.hp / q.maxHp).toFixed(2) })).filter(m => m.kinks || m.warp || m.bends || m.cracks || m.grooves || m.dents || m.hp < 1);
    console.log(JSON.stringify({ robot: a, after: marks(R), wearKeys: Object.keys(w), lost: w.lost, nextFight: marks(R2) }));
  }
}
