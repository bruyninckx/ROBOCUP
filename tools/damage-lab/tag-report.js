// node tag-report.js t0.json t1.json ... : the bookie tags each robot earns (same rules as the 2.0 tabletop's bookieTags), from tag-sim.js runs
const fs = require('fs'), files = process.argv.slice(2), D = { duel: [], ffa: [], tv: [], arena: [] };
for (const f of files) { const r = JSON.parse(fs.readFileSync(f)); for (const k in D) D[k].push(...r[k]); }
const names = [...new Set(D.duel.flatMap(d => [d.a, d.b]))];
// Bradley-Terry rating from the duels (Elo scale)
const W = {}, G = {}; for (const n of names) { W[n] = 0.5; G[n] = {}; }
for (const d of D.duel) { const N = 1; if (d.win == null) { W[d.a] += 0.5; W[d.b] += 0.5; } else W[d.win] += 1; G[d.a][d.b] = (G[d.a][d.b] || 0) + N; G[d.b][d.a] = (G[d.b][d.a] || 0) + N; }
let p = Object.fromEntries(names.map(n => [n, 1]));
for (let it = 0; it < 400; it++) { const q = {}; for (const i of names) { let s = 1 / (p[i] + 1); for (const [j, N] of Object.entries(G[i])) s += N / (p[i] + p[j]); q[i] = W[i] / s; } const gm = Math.exp(names.reduce((a, n) => a + Math.log(q[n]), 0) / names.length); for (const n of names) p[n] = q[n] / gm; }
const elo = n => 400 * Math.log10(p[n]), pw = (a, b) => 1 / (1 + Math.pow(10, (elo(b) - elo(a)) / 400));
const T = {}; for (const n of names) T[n] = { n, elo: Math.round(elo(n)), tags: [], stat: {} };
// style: giant killer / coin-flip brawler / quick finisher / grinder (one per robot, in that order)
const avgLoss = (() => { const v = D.duel.filter(d => d.win).map(d => 1 - d.keep); return v.reduce((a, b) => a + b, 0) / v.length; })();
for (const n of names) {
  const mine = D.duel.filter(d => d.a === n || d.b === n), up = mine.filter(d => elo(d.a === n ? d.b : d.a) - elo(n) >= 60);
  const upW = up.filter(d => d.win === n).length / (up.length || 1), upE = up.reduce((a, d) => a + pw(n, d.a === n ? d.b : d.a), 0) / (up.length || 1);
  const blow = mine.filter(d => d.win && d.keep >= 0.85).length / mine.length, tm = mine.reduce((a, d) => a + d.t, 0) / mine.length;
  const lost = mine.filter(d => d.win && d.win !== n), hit = lost.reduce((a, d) => a + (1 - d.keep), 0) / (lost.length || 1);
  T[n].stat = { upN: up.length, upW: Math.round(upW * 100), upE: Math.round(upE * 100), blow: Math.round(blow * 100), t: Math.round(tm), hit: Math.round(hit * 100) };
  if (up.length >= 12 && upW >= 1.25 * upE && upW - upE >= 0.06) T[n].tags.push(['🗡️ Giant killer', `beats stronger robots ${Math.round(upW * 100)}% (expected ${Math.round(upE * 100)}%)`]);
  else if (blow >= 0.5) T[n].tags.push(['🎲 Coin-flip brawler', `${Math.round(blow * 100)}% of its fights are blowouts`]);
  else if (tm <= 40) T[n].tags.push(['⏱️ Quick finisher', `fights last ${Math.round(tm)} s`]);
  else if (tm >= 70) T[n].tags.push(['🧱 Grinder', `fights last ${Math.round(tm)} s`]);
  if (lost.length >= 8 && hit * 100 >= avgLoss * 100 + 6) T[n].tags.push(['🔨 Hard hitter', `the winner loses ${Math.round(hit * 100)}% health (average ${Math.round(avgLoss * 100)}%)`]);
}
// free-for-all: win share against what its duel strength predicts (calibrated: favourites win less in a melee)
{ const rows = []; for (const f of D.ffa) { const s = f.p.map(n => p[n]), tot = s.reduce((a, b) => a + b, 0); f.p.forEach((n, i) => rows.push({ n, pred: s[i] / tot, won: f.win.includes(n) ? 1 / f.win.length : 0 })); }
  const mx = rows.reduce((a, r) => a + r.pred, 0) / rows.length, my = rows.reduce((a, r) => a + r.won, 0) / rows.length;
  const b = rows.reduce((a, r) => a + (r.pred - mx) * (r.won - my), 0) / rows.reduce((a, r) => a + (r.pred - mx) ** 2, 0), a0 = my - b * mx;
  for (const n of names) { const m = rows.filter(r => r.n === n); if (m.length < 15) continue; const res = m.reduce((a, r) => a + r.won - (a0 + b * r.pred), 0) / m.length * 100; T[n].stat.ffa = Math.round(res); T[n].stat.ffaN = m.length;
    if (res >= 10) T[n].tags.push(['🌀 Brawl master', `+${Math.round(res)} points in free-for-alls (${m.length} fights)`]); else if (res <= -10) T[n].tags.push(['🌀 Lost in a melee', `${Math.round(res)} points in free-for-alls (${m.length} fights)`]); }
  T._ffa = { a: +a0.toFixed(2), b: +b.toFixed(2) }; }
// 2v2: team result against the pair's duel strengths
{ for (const n of names) { const m = D.tv.filter(f => f.p.includes(n) && f.win != null); if (m.length < 15) continue;
    const res = m.reduce((a, f) => { const i = f.p.indexOf(n), t = i < 2 ? 0 : 1, A = t ? f.p.slice(2) : f.p.slice(0, 2), B = t ? f.p.slice(0, 2) : f.p.slice(2), e = x => x.reduce((a, k) => a + elo(k), 0) / 2, pr = 1 / (1 + Math.pow(10, (e(B) - e(A)) / 400)); return a + (f.win === t ? 1 : 0) - pr; }, 0) / m.length * 100;
    T[n].stat.tv = Math.round(res); T[n].stat.tvN = m.length; if (res <= -10) T[n].tags.push(['🤝 Lone wolf', `its 2v2 team wins ${Math.round(-res)} points less than the duel strengths say (${m.length} fights)`]); if (res >= 10) T[n].tags.push(['🤝 Team player', `its 2v2 team wins ${Math.round(res)} points more (${m.length} fights)`]); } }
// arenas: logit change against the same opponents and seeds on the open floor, x0.5 (shrunk for the noise), tagged at |0.45|
{ const AT = { saws: ['🪚 Saw specialist', '🪚 Hates saws'], killbox: ['☠️ Killbox natural', '☠️ Hates the Killbox'], cage: ['🔒 Cage fighter', '🔒 Hates the Cage'], ice: ['🧊 Ice skater', '🧊 Slips on ice'] };
  const lg = x => Math.log((x + 0.5) / (1 - x + 0.5));
  for (const n of names) for (const ar of Object.keys(AT)) { const o = D.arena.filter(r => r.n === n && r.ar === 'open'), a = D.arena.filter(r => r.n === n && r.ar === ar); if (a.length < 4) continue;
    const wo = o.reduce((s, r) => s + r.win, 0) / o.length, wa = a.reduce((s, r) => s + r.win, 0) / a.length, f = 0.5 * (lg(wa) - lg(wo)); (T[n].stat.ar = T[n].stat.ar || {})[ar] = +f.toFixed(2);
    if (Math.abs(f) >= 0.45) T[n].tags.push([f > 0 ? AT[ar][0] : AT[ar][1], `${Math.round(wa * 100)}% there vs ${Math.round(wo * 100)}% on the open floor (${a.length} fights)`]); } }
const order = names.slice().sort((x, y) => T[y].elo - T[x].elo);
console.log(`duels ${D.duel.length}, free-for-alls ${D.ffa.length}, 2v2 ${D.tv.length}, arena fights ${D.arena.length}; average health a winner loses ${Math.round(avgLoss * 100)}%`);
for (const n of order) console.log(n.padEnd(12), String(T[n].elo).padStart(5), JSON.stringify(T[n].stat), '|', T[n].tags.map(t => t[0]).join(', ') || '-');
fs.writeFileSync(process.env.OUT || 'tag-report.json', JSON.stringify({ T, order }, null, 1));
