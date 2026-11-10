// ROBOCUS 2.0 access check (Kev, 10 Nov): node tools/access-report.js <tag>   (a game-sim run of prototypes/tabletop-2.html)
// How reachable are parts, combos and counters in real (AI) games: what the Market offered when, who got it,
// how many epic / great-fit / giant-slayer builds happened, and whether an answer to a rival's robot was on offer in time.
const fs = require('fs'), path = require('path'), tag = process.argv[2] || 'access_base';
const D = JSON.parse(fs.readFileSync(path.join('sims', tag + '.json'))), html = fs.readFileSync('prototypes/tabletop-2.html', 'utf8');
const grab = (name) => { const i = html.indexOf('const ' + name + ' = {'), j = html.indexOf('};', i); return eval('(' + html.slice(i + ('const ' + name + ' = ').length, j + 1) + ')'); };
const PART_FIT = grab('PART_FIT'), EPIC = grab('EPIC'), TRIPLE = grab('TRIPLE');
const M = JSON.parse(fs.readFileSync('tools/damage-lab/matrix-data.json')).arenas.open.pairs;
const pw = (a, b) => M[a + '|' + b] ? M[a + '|' + b][0] / M[a + '|' + b][1] : M[b + '|' + a] ? 1 - M[b + '|' + a][0] / M[b + '|' + a][1] : 0.5;
const games = D.res.filter(g => g.over && g.v2 && g.v2.snaps), mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0, pct = x => Math.round(100 * x) + '%';
const parts = new Set(); games.forEach(g => g.v2.snaps.forEach(s => s.k === 'offer' && s.lots.forEach(l => l.startsWith('part:') && parts.add(l.slice(5)))));
const out = [];
out.push('games ' + games.length + ', rounds avg ' + mean(games.map(g => g.round)).toFixed(1));
// 1. exposure
const first = {}, nOff = {}; for (const p of parts) { first[p] = []; nOff[p] = []; }
let lotsPart = 0, lotsSold = 0, lotsAll = 0, kinds = { part: 0, robot: 0, crew: 0 };
for (const g of games) { const f = {}, n = {};
  for (const s of g.v2.snaps) { if (s.k === 'offer' && s.next) for (const l of s.next) if (l.startsWith('part:') && f[l.slice(5)] == null) f[l.slice(5)] = s.r;   // seen face up on the conveyor
    if (s.k === 'offer') for (const l of s.lots) { lotsAll++; kinds[l.split(':')[0]] = (kinds[l.split(':')[0]] || 0) + 1; if (l.startsWith('part:')) { const p = l.slice(5); if (f[p] == null) f[p] = s.r; n[p] = (n[p] || 0) + 1; } }
    if (s.k === 'sold') for (const l of s.lots) if (l.id.startsWith('part:')) { lotsPart++; if (l.winner >= 0) lotsSold++; } }
  for (const p of parts) { first[p].push(f[p] == null ? 99 : f[p]); nOff[p].push(n[p] || 0); } }
const allFirst = [...parts].flatMap(p => first[p]);
out.push('\n1. EXPOSURE of a given part (per game)');
out.push('  seen (offered, or face up on the conveyor) by round 2: ' + pct(mean(allFirst.map(x => x <= 2))) + ' | by round 4: ' + pct(mean(allFirst.map(x => x <= 4))) + ' | by round 6: ' + pct(mean(allFirst.map(x => x <= 6))) + ' | never: ' + pct(mean(allFirst.map(x => x === 99))));
out.push('  times a part is offered per game: ' + mean([...parts].flatMap(p => nOff[p])).toFixed(1) + ' | part lots that find a buyer: ' + pct(lotsSold / lotsPart) + ' | lots per round: ' + Object.entries(kinds).map(([k, v]) => k + ' ' + (v / games.reduce((a, g) => a + g.round, 0)).toFixed(1)).join(', '));
// 2. builds
const has = (r, k) => r.parts.includes(k) || r.leg === k;
let epicC = 0, fitG = 0, fitP = 0, tri = 0, tri2 = 0, kitted = [0, 0, 0, 0], epicOff = 0, epicOwn = 0, epicRival = 0, epicUnsold = 0, gEpicChance = 0, fitOff = 0, fitOwn = 0;
for (const g of games) { const seenE = new Set(), seenG = new Set(), seenP = new Set(), seenT = new Set(), seenT2 = new Set(); let chance = false;
  const S = g.v2.snaps;
  S.forEach((s, i) => {
    if (s.teams) s.teams.forEach((T, ti) => T.robots.forEach(r => { for (const k of r.parts.concat(r.leg ? [r.leg] : [])) { if (EPIC[r.n + '|' + k]) seenE.add(ti + r.n + k); const f = PART_FIT[r.n] && PART_FIT[r.n][k]; if (f && f[0] > 0) seenG.add(ti + r.n + k); if (f && f[0] < 0) seenP.add(ti + r.n + k); }
      const t = TRIPLE[r.n]; if (t) { const c = t[0].filter(k => has(r, k)).length; if (c === 3) seenT.add(ti + r.n); if (c >= 2) seenT2.add(ti + r.n); } }));
    if (s.k === 'offer') { const sold = S.slice(i + 1).find(q => q.k === 'sold' && q.r === s.r);
      s.lots.forEach(l => { if (!l.startsWith('part:')) return; const k = l.slice(5), res = sold && sold.lots.find(q => q.id === l);
        s.teams.forEach((T, ti) => T.robots.forEach(r => { const f = PART_FIT[r.n] && PART_FIT[r.n][k];
          if (EPIC[r.n + '|' + k] && !has(r, k)) { epicOff++; chance = true; if (res && res.winner === ti) epicOwn++; else if (res && res.winner >= 0) epicRival++; else epicUnsold++; }
          else if (f && f[0] > 0 && !has(r, k)) { fitOff++; if (res && res.winner === ti) fitOwn++; } })); }); }
    if (s.k === 'end') s.teams.forEach(T => T.robots.forEach(r => { kitted[Math.min(3, r.parts.length + (r.leg ? 1 : 0))]++; })); });
  epicC += seenE.size; fitG += seenG.size; fitP += seenP.size; tri += seenT.size; tri2 += seenT2.size; if (chance) gEpicChance++; }
const ng = games.length, kt = kitted.reduce((a, b) => a + b, 0);
out.push('\n2. BUILDS (per game)');
out.push('  epic combos completed: ' + (epicC / ng).toFixed(2) + ' | games with an epic chance in the Market: ' + pct(gEpicChance / ng) + ' | epic chances per game: ' + (epicOff / ng).toFixed(2) + ' -> owner got it ' + pct(epicOwn / (epicOff || 1)) + ', a rival took it ' + pct(epicRival / (epicOff || 1)) + ', unsold ' + pct(epicUnsold / (epicOff || 1)));
out.push('  great fits fitted: ' + (fitG / ng).toFixed(2) + ' (chances ' + (fitOff / ng).toFixed(1) + ' a game, owner got it ' + pct(fitOwn / (fitOff || 1)) + ') | poor fits fitted: ' + (fitP / ng).toFixed(2));
out.push('  giant-slayer builds completed: ' + (tri / ng).toFixed(2) + ' | two of the three parts: ' + (tri2 / ng).toFixed(2));
out.push('  robots at the end with 0 / 1 / 2 / 3 parts: ' + kitted.map(x => pct(x / kt)).join(' / '));
// 3. answers in time: a rival robot none of mine beats 40% of the time (table); is a robot that beats it 60%+ offered, and how soon?
let threats = 0, ansNow = 0, ans2 = 0, ansEver = 0, bought = 0, wait = [], teamRoundsThreat = 0, teamRounds = 0;
for (const g of games) { const offers = g.v2.snaps.filter(s => s.k === 'offer'), open = new Map();
  offers.forEach((s, oi) => { s.teams.forEach((T, ti) => { if (!T.robots.length) return; teamRounds++; let any = false;
      s.teams.forEach((R, ri) => { if (ri === ti) return; R.robots.forEach(b => { const best = Math.max(...T.robots.map(m => pw(m.n, b.n))); if (best < 0.4) { any = true; const key = ti + '|' + ri + '|' + b.n; if (!open.has(key)) open.set(key, oi); } }); });
      if (any) teamRoundsThreat++; }); });
  for (const [key, oi] of open) { const [ti, ri, bn] = key.split('|'); threats++; let found = -1, got = false;
    for (let j = oi; j < offers.length; j++) { const ans = offers[j].lots.filter(l => l.startsWith('robot:') && pw(l.slice(6), bn) >= 0.6); if (ans.length) { if (found < 0) found = j - oi;
        const sold = g.v2.snaps.find(q => q.k === 'sold' && q.r === offers[j].r); if (sold && sold.lots.some(q => ans.includes(q.id) && q.winner === +ti)) got = true; } }
    if (found === 0) ansNow++; if (found >= 0 && found <= 2) ans2++; if (found >= 0) { ansEver++; wait.push(found); } if (got) bought++; } }
out.push('\n3. ANSWERS (a rival robot that none of your robots beats 40% of the time; answer = a robot lot that beats it 60%+)');
out.push('  team-rounds facing such a robot: ' + pct(teamRoundsThreat / teamRounds) + ' | threats per game: ' + (threats / ng).toFixed(1));
out.push('  answer in the Market the same round: ' + pct(ansNow / threats) + ' | within 2 more rounds: ' + pct(ans2 / threats) + ' | ever: ' + pct(ansEver / threats) + ' (wait ' + mean(wait).toFixed(1) + ' rounds) | the team bought one: ' + pct(bought / threats));
console.log(out.join('\n'));
