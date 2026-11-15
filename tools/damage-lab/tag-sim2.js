// Complete bookie-tag recheck for a tuned lineup (Kev, 14 Nov: "once you tuned them all, do a complete recheck of all the tags").
// node tag-sim2.js lineup.json shard nShards outDir section   section: duel | ffa | tv | arena | body | parts | confirm | slayer | pairs
// lineup.json: { lv: {robot: level}, p: {robot: power grade} }. Specs: dmgK = hpK = p (no preset damage knob), part strengths as in the game (usePK).
const L = require('./engine.js'), LU = require('./lineup.js'), fs = require('fs'); LU.usePK();
const [file, shard, nsh, outDir, section] = [process.argv[2], +process.argv[3], +process.argv[4], process.argv[5], process.argv[6]];
const LN = JSON.parse(fs.readFileSync(file)), lv = LN.lv, P = LN.p, names = Object.keys(lv);
function spec(n, parts = [], o = {}) { let s = { preset: n, dmgK: P[n], hpK: P[n] }; if (parts.some(k => LU.PARTS[k].kind === 'chip')) s.lv = lv[n];
  for (const k of parts) { const sp = L.normSpec(s); s = Object.assign({}, s, LU.PARTS[k].apply(sp, s)); } return Object.assign(s, o); }
const health = R => { let h = 0, m = 0; for (const q of R.parts.concat(R.internals || [])) { m += q.maxHp; h += q.attached === false ? 0 : Math.max(0, Math.min(q.hp, q.maxHp)); } return m ? h / m : 0; };
const run = o => { const S = L.create(Object.assign({ countdown: 0 }, o)); while (!S.over && S.t < 200) { L.step(S); S.fx.length = 0; } return S; };
function duel(A, B, seed, sw, arena) { const S = run(sw ? { a: Object.assign({}, B, { name: 'B' }), b: Object.assign({}, A, { name: 'A' }), seed, arena: arena || 'open' } : { a: Object.assign({}, A, { name: 'A' }), b: Object.assign({}, B, { name: 'B' }), seed, arena: arena || 'open' });
  const w = S.result && S.result.winner, ia = sw ? 1 : 0, W = w == null ? null : S.robots[w]; return { aw: w == null ? 0.5 : w === ia ? 1 : 0, t: +S.t.toFixed(1), keep: W ? +health(W).toFixed(3) : null }; }
let job = 0; const mine = () => (job++ % nsh) === shard; const res = []; const out = `${outDir}/${section}_${shard}.json`;
const flush = () => fs.writeFileSync(out, JSON.stringify(res)); let last = Date.now(); const tick = () => { if (Date.now() - last > 60000) { flush(); last = Date.now(); } };
const rng = L.mkRng(777), pick = (arr, n) => { const p = arr.slice(), o = []; while (o.length < n && p.length) o.push(p.splice(Math.floor(rng() * p.length), 1)[0]); return o; };
const up = n => { const l = Math.min(4, lv[n] + 1); return pick(names.filter(m => lv[m] === l && m !== n), 4); };
if (section === 'duel') { const F = +(process.env.F || 12);
  for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) for (let f = 0; f < F; f++) { if (!mine()) continue; const a = names[i], b = names[j], r = duel(spec(a), spec(b), 111001 + f, f % 2 === 1); res.push({ a, b, win: r.aw === 1 ? a : r.aw === 0 ? b : null, t: r.t, keep: r.keep }); tick(); } }
if (section === 'ffa') { const N = +(process.env.N || 600); for (let f = 0; f < N; f++) { const p = pick(names, 4); if (!mine()) continue; const S = run({ mode: 'ffa', robots: p.map((n, i) => Object.assign(spec(n), { team: i })), seed: 15000 + f * 3, arena: 'open' }); res.push({ p, win: (S.result.winners || []).map(i => p[i]) }); tick(); } }
if (section === 'tv') { const N = +(process.env.N || 600); for (let f = 0; f < N; f++) { const p = pick(names, 4); if (!mine()) continue; const S = run({ mode: '2v2', robots: p.map((n, i) => Object.assign(spec(n), { team: i < 2 ? 0 : 1 })), seed: 17000 + f * 3, arena: 'open' }); const ws = (S.result.winners || []).map(i => S.robots[i].team); res.push({ p, win: ws.length ? ws[0] : null }); tick(); } }
if (section === 'arena') { const K = +(process.env.K || 10); // each robot vs same-level opponents (and one level around), open floor and the four arenas, same seeds
  for (const n of names) { const opp = names.filter(m => m !== n && Math.abs(lv[m] - lv[n]) <= 1); for (let k = 0; k < K; k++) { const o = opp[Math.floor(rng() * opp.length)]; if (!mine()) continue;
    for (const ar of ['open', 'saws', 'killbox', 'cage', 'ice']) { const r = duel(spec(n), spec(o), 13000 + k, k % 2 === 1, ar); res.push({ n, o, ar, win: r.aw }); } tick(); } } }
if (section === 'body') { const K = +(process.env.K || 8); // armour gone (a broken Body): every plate at 0, against 4 same-level robots, paired seeds
  for (const n of names) { const opp = pick(names.filter(m => m !== n && lv[m] === lv[n]), 4); for (const o of opp) for (let k = 0; k < K; k++) { if (!mine()) continue;
    const a = duel(spec(n), spec(o), 19000 + k, k % 2 === 1), b = duel(spec(n, [], { armour: { front: 0, side: 0, rear: 0, top: 0 } }), spec(o), 19000 + k, k % 2 === 1); res.push({ n, o, full: a.aw, bare: b.aw }); tick(); } } }
if (section === 'parts') { const K = +(process.env.K || 4); const parts = Object.keys(LU.PARTS);
  for (const n of names) { const opp = up(n); for (const k of [null].concat(parts)) for (const o of opp) for (let f = 0; f < K; f++) { if (!mine()) continue;
    const r = duel(spec(n, k ? [k] : []), spec(o), 21000 + f, f % 2 === 1); res.push({ n, k, o, win: r.aw }); tick(); } } }
if (section === 'confirm') { const C = JSON.parse(fs.readFileSync(process.env.CAND)); const K = +(process.env.K || 8); // fresh seeds, all robots a level up (L4: own level)
  for (const c of C) { const l = Math.min(4, lv[c.n] + 1), opp = names.filter(m => lv[m] === l && m !== c.n); for (const o of opp) for (let f = 0; f < K; f++) { if (!mine()) continue;
    const a = duel(spec(c.n, c.parts), spec(o), 23000 + f, f % 2 === 1), b = duel(spec(c.n), spec(o), 23000 + f, f % 2 === 1); res.push({ id: c.id, n: c.n, parts: c.parts, o, with: a.aw, without: b.aw }); tick(); } } }
if (section === 'slayer') { const C = JSON.parse(fs.readFileSync(process.env.CAND)); const K = +(process.env.K || 3); // kitted level 0-2 robots against every level 3 and 4 robot
  for (const c of C) for (const o of names.filter(m => lv[m] >= 3)) for (let f = 0; f < K; f++) { if (!mine()) continue;
    const a = duel(spec(c.n, c.parts), spec(o), 25000 + f, f % 2 === 1), b = duel(spec(c.n), spec(o), 25000 + f, f % 2 === 1); res.push({ n: c.n, parts: c.parts, o, with: a.aw, without: b.aw }); tick(); }
}
if (section === 'pairs') { const C = JSON.parse(fs.readFileSync(process.env.CAND)); const K = +(process.env.K || 16); // counter-pick candidates re-fought on fresh seeds
  for (const [a, b] of C) for (let f = 0; f < K; f++) { if (!mine()) continue; const r = duel(spec(a), spec(b), 27000 + f, f % 2 === 1); res.push({ a, b, win: r.aw }); tick(); } }
flush(); fs.writeFileSync(out + '.done', '1');
