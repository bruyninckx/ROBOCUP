// Bookie tags for a lineup (Kev, 14 Nov): which fight-style tags each robot earns, measured in fresh fights.
// node tag-sim.js shard nShards out.json [robots] : duels (every pair), 4-way free-for-alls, 2v2s and the four special arenas.
// Robots at power grade 1, damage x1 (untweaked) unless TWEAKED=1. Then node tag-report.js out*.json
const L = require('./engine.js'), LU = require('./lineup.js'); if (process.env.TWEAKED) LU.usePK();
const [shard, nsh, out] = [+process.argv[2], +process.argv[3], process.argv[4]];
const names = process.argv[5] ? process.argv[5].split(',') : [...Object.keys(LU.ROBOTS), ...Object.keys(LU.ROBOTS4), ...Object.keys(LU.CANDIDATES)];
const ONLY = process.env.ONLY || '', F = +(process.env.F || 4), NFFA = +(process.env.NFFA || 360), NTV = +(process.env.NTV || 360), NAR = +(process.env.NAR || 6);
const spec = n => process.env.TWEAKED ? LU.build(n) : { preset: n, dmgK: 1, hpK: 1 };
const hpf = R => { let h = 0, m = 0; for (const q of R.parts.concat(R.internals || [])) { m += q.maxHp; h += q.attached === false ? 0 : Math.max(0, Math.min(q.hp, q.maxHp)); } return m ? h / m : 0; }; // health as in matrix.js: every part, torn-off parts count 0
const run = o => { const S = L.create(Object.assign({ countdown: 0 }, o)); while (!S.over && S.t < 200) { L.step(S); S.fx.length = 0; } return S; };
const res = { duel: [], ffa: [], tv: [], arena: [] }; let job = 0; const mine = () => (job++ % nsh) === shard;
// duels: winner, time, how much health the winner kept
for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) for (let f = 0; f < F; f++) { if (ONLY && ONLY !== 'duel') break; if (!mine()) continue;
  const sw = f % 2 === 1, a = names[i], b = names[j], S = run(sw ? { a: Object.assign(spec(b), { name: 'B' }), b: Object.assign(spec(a), { name: 'A' }), seed: 91001 + f } : { a: Object.assign(spec(a), { name: 'A' }), b: Object.assign(spec(b), { name: 'B' }), seed: 91001 + f });
  const w = S.result && S.result.winner, ia = sw ? 1 : 0, win = w == null ? null : w === ia ? a : b, W = w == null ? null : S.robots[w];
  res.duel.push({ a, b, win, t: +S.t.toFixed(1), keep: W ? +hpf(W).toFixed(3) : null }); }
// four-way free-for-alls and 2v2s, random lineups
const rng = L.mkRng(4242), pick = n => { const p = names.slice(), o = []; while (o.length < n) o.push(p.splice(Math.floor(rng() * p.length), 1)[0]); return o; };
if (ONLY && ONLY !== 'rest') { require('fs').writeFileSync(out, JSON.stringify(res)); process.exit(0); }
for (let f = 0; f < NFFA; f++) { const p = pick(4); if (!mine()) continue; const S = run({ mode: 'ffa', robots: p.map((n, i) => Object.assign(spec(n), { team: i })), seed: 5000 + f * 3, arena: 'open' });
  res.ffa.push({ p, win: (S.result.winners || []).map(i => p[i]) }); }
for (let f = 0; f < NTV; f++) { const p = pick(4); if (!mine()) continue; const S = run({ mode: '2v2', robots: p.map((n, i) => Object.assign(spec(n), { team: i < 2 ? 0 : 1 })), seed: 7000 + f * 3, arena: 'open' });
  const ws = (S.result.winners || []).map(i => S.robots[i].team); res.tv.push({ p, win: ws.length ? ws[0] : null }); }
// special arenas: each robot against the same random opponents on the open floor and on each arena (same seeds), sides swapped
for (const n of names) for (let k = 0; k < NAR; k++) { const o = names[Math.floor(rng() * names.length)]; if (o === n || !mine()) continue;
  for (const ar of ['open', 'saws', 'killbox', 'cage', 'ice']) { const sw = k % 2 === 1, S = run(sw ? { a: Object.assign(spec(o), { name: 'B' }), b: Object.assign(spec(n), { name: 'A' }), seed: 3000 + k, arena: ar } : { a: Object.assign(spec(n), { name: 'A' }), b: Object.assign(spec(o), { name: 'B' }), seed: 3000 + k, arena: ar });
    const w = S.result && S.result.winner; res.arena.push({ n, o, ar, win: w == null ? 0.5 : (w === (sw ? 1 : 0) ? 1 : 0) }); } }
require('fs').writeFileSync(out, JSON.stringify(res));
