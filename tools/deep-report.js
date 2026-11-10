// ROBOCUS 2.0 deep report (Kev, 10 Nov): node tools/deep-report.js <tag>  (a game-sim run of prototypes/tabletop-2.html)
// Robots, parts, bookie tags and the game's arc in whole AI games: what gets bought, what fights, what wins, and against the odds.
const fs = require('fs'), path = require('path'), tag = process.argv[2] || 'v2_200';
const D = JSON.parse(fs.readFileSync(path.join('sims', tag + '.json'))), html = fs.readFileSync('prototypes/tabletop-2.html', 'utf8');
const grab = name => { const i = html.indexOf('const ' + name + ' = {'), j = html.indexOf('};', i); return eval('(' + html.slice(i + ('const ' + name + ' = ').length, j + 1) + ')'); };
const PART_FIT = grab('PART_FIT'), EPIC = grab('EPIC'), TRIPLE = grab('TRIPLE'), FFA_FIT = grab('FFA_FIT');
const MX = JSON.parse(fs.readFileSync('tools/damage-lab/matrix-data.json')).arenas.open.pairs;
const pw = (a, b) => MX[a + '|' + b] ? MX[a + '|' + b][0] / MX[a + '|' + b][1] : MX[b + '|' + a] ? 1 - MX[b + '|' + a][0] / MX[b + '|' + a][1] : null;
const games = D.res.filter(g => g.over && g.v2), mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0, pct = x => Math.round(100 * x) + '%', pad = (s, n) => String(s).padEnd(n);
const L = []; const say = s => L.push(s);
say(tag + ': ' + games.length + ' finished games of ' + D.res.length + ', ' + mean(games.map(g => g.round)).toFixed(1) + ' rounds on average');
// ---- fights joined with the robots' parts
const F = [];
for (const g of games) { const fs2 = g.v2.snaps.filter(s => s.k === 'fight'), fx = g.v2.fightsX || [];
  fx.forEach((f, i) => { const sn = fs2[i]; if (!sn || f.win == null) return;
    const ents = f.x2.map(e => { const T = sn.teams[e.team], r = T && T.robots.find(q => q.n === e.name); return Object.assign({}, e, { partsL: r ? r.parts.concat(r.leg ? [r.leg] : []) : [] }); });
    F.push({ g, f, ents, nSides: f.p.length }); }); }
say('fights joined: ' + F.length);
const acc = () => ({ n: 0, w: 0, p: 0 }), add = (o, won, p) => { o.n++; if (won) o.w++; o.p += p; };
const line = (name, o, w = 22) => pad(name, w) + pad(o.n, 6) + pad(pct(o.w / (o.n || 1)), 7) + pad(pct(o.p / (o.n || 1)), 9) + ((o.w - o.p) / (o.n || 1) >= 0 ? '+' : '') + Math.round(100 * (o.w - o.p) / (o.n || 1));
// 1. robots
const rob = {}, bought = {};
for (const g of games) for (const l of g.v2.lots || []) if (l.kind === 'robot' && l.winner >= 0) (bought[l.name] = bought[l.name] || []).push(l.price);
for (const x of F) for (const e of x.ents) { const o = rob[e.name] = rob[e.name] || Object.assign(acc(), { lv: e.level }); add(o, x.f.win === e.side, x.f.p[e.side]); }
say('\n1. ROBOTS  (a fighter counts once per fight; "bookie" = its side\'s odds; diff = wins above the odds)');
say(pad('robot', 14) + pad('L', 3) + pad('bought/g', 10) + pad('price', 7) + pad('fights', 8) + pad('wins', 7) + pad('bookie', 9) + 'diff');
Object.entries(rob).sort((a, b) => a[1].lv - b[1].lv || b[1].n - a[1].n).forEach(([n, o]) => say(pad(n, 14) + pad(o.lv, 3) + pad(((bought[n] || []).length / games.length).toFixed(2), 10) + pad(bought[n] ? mean(bought[n]).toFixed(1) : '-', 7) + pad(o.n, 8) + pad(pct(o.w / o.n), 7) + pad(pct(o.p / o.n), 9) + ((o.w - o.p) / o.n >= 0 ? '+' : '') + Math.round(100 * (o.w - o.p) / o.n)));
const byLv = {}; for (const x of F) for (const e of x.ents) add(byLv[e.level] = byLv[e.level] || acc(), x.f.win === e.side, x.f.p[e.side]);
say('by level: ' + Object.entries(byLv).map(([l, o]) => 'L' + l + ' ' + o.n + ' fighters, wins ' + pct(o.w / o.n) + ' (bookie ' + pct(o.p / o.n) + ')').join(' | '));
// 2. parts
const part = {}, sold = {};
for (const g of games) for (const l of g.v2.lots || []) if (String(l.id).startsWith('p_')) { const o = sold[l.id.slice(2)] = sold[l.id.slice(2)] || { off: 0, sold: 0, pr: [] }; o.off++; if (l.winner >= 0) { o.sold++; o.pr.push(l.price); } }
for (const x of F) for (const e of x.ents) for (const k of e.partsL) add(part[k] = part[k] || acc(), x.f.win === e.side, x.f.p[e.side]);
say('\n2. PARTS  (offered / sold per game, price; fighters carrying it)');
say(pad('part', 12) + pad('offered', 9) + pad('sold', 7) + pad('price', 7) + pad('fighters', 10) + pad('wins', 7) + pad('bookie', 9) + 'diff');
Object.keys(sold).sort((a, b) => sold[b].sold - sold[a].sold).forEach(k => { const s = sold[k], o = part[k] || acc(); say(pad(k, 12) + pad((s.off / games.length).toFixed(2), 9) + pad(pct(s.sold / s.off), 7) + pad(s.pr.length ? mean(s.pr).toFixed(1) : '-', 7) + pad(o.n, 10) + pad(pct(o.w / (o.n || 1)), 7) + pad(pct(o.p / (o.n || 1)), 9) + ((o.w - o.p) / (o.n || 1) >= 0 ? '+' : '') + Math.round(100 * (o.w - o.p) / (o.n || 1))); });
const byN = {}; for (const x of F) for (const e of x.ents) add(byN[Math.min(3, e.partsL.length)] = byN[Math.min(3, e.partsL.length)] || acc(), x.f.win === e.side, x.f.p[e.side]);
say('by parts carried: ' + Object.entries(byN).map(([n, o]) => n + ' parts: ' + o.n + ' fighters, wins ' + pct(o.w / o.n) + ' (bookie ' + pct(o.p / o.n) + ')').join(' | '));
// 3. tags
const T = { epic: acc(), great: acc(), poor: acc(), triple2: acc(), counter: acc(), bad: acc(), ffaUp: acc(), ffaDown: acc() };
const lvOf = {}; for (const n in rob) lvOf[n] = rob[n].lv;
const exp = {}; { const by = {}; for (const k in MX) { const [a, b] = k.split('|'); if (lvOf[a] == null || lvOf[b] == null) continue; const p = MX[k][0] / MX[k][1], d = lvOf[a] - lvOf[b]; (by[d] = by[d] || []).push(p); (by[-d] = by[-d] || []).push(1 - p); } for (const d in by) exp[d] = mean(by[d]); }
for (const x of F) { const f = x.f;
  for (const e of x.ents) { const won = f.win === e.side, p = f.p[e.side];
    for (const k of e.partsL) { const ep = EPIC[e.name + '|' + k], ft = PART_FIT[e.name] && PART_FIT[e.name][k];
      if (ep && !(ep[3] && ep[3].includes(f.arena))) add(T.epic, won, p); else if (ft && ft[0] > 0) add(T.great, won, p); else if (ft && ft[0] < 0) add(T.poor, won, p); }
    const t = TRIPLE[e.name]; if (t && t[0].filter(k => e.partsL.includes(k)).length >= 2) add(T.triple2, won, p);
    if (f.format === 'ffa' && FFA_FIT[e.name]) add(FFA_FIT[e.name] > 0 ? T.ffaUp : T.ffaDown, won, p); }
  if (x.ents.length === 2 && f.format === 'duel') { const [a, b] = x.ents, m = pw(a.name, b.name), e = exp[a.level - b.level]; if (m != null && e != null && Math.abs(m - e) >= 0.25) { const up = m > e ? a : b, dn = m > e ? b : a; add(T.counter, f.win === up.side, f.p[up.side]); add(T.bad, f.win === dn.side, f.p[dn.side]); } } }
say('\n3. BOOKIE TAGS IN REAL FIGHTS');
say(pad('tag', 22) + pad('n', 6) + pad('wins', 7) + pad('bookie', 9) + 'diff');
say(line('⚡ Epic combo', T.epic)); say(line('🧩 Great fit', T.great)); say(line('🧩 Poor fit', T.poor)); say(line('👑 2+ of a slayer build', T.triple2)); say(line('🎯 Counter pick (duel)', T.counter)); say(line('⚠️ Bad matchup (duel)', T.bad)); say(line('🌀 Brawl master (FFA)', T.ffaUp)); say(line('🌀 Lost in a melee', T.ffaDown));
// 4. formats, arenas, upsets
const fm = {}, ar = {}; let ups = 0, tot = 0, dur = [];
for (const x of F) { const f = x.f; (fm[f.format] = fm[f.format] || { n: 0, fav: 0, t: [] }); fm[f.format].n++; const favS = f.p.indexOf(Math.max(...f.p)); if (f.win === favS) fm[f.format].fav++; else ups++; tot++; fm[f.format].t.push(f.time || 0); (ar[f.arena] = ar[f.arena] || { n: 0, fav: 0 }).n++; if (f.win === favS) ar[f.arena].fav++; }
say('\n4. FIGHTS: ' + (F.length / games.length).toFixed(1) + ' a game; the bookie\'s favourite loses ' + pct(ups / tot) + ' of them');
say('  formats: ' + Object.entries(fm).map(([k, o]) => k + ' ' + pct(o.n / tot) + ' (fav wins ' + pct(o.fav / o.n) + ', ' + Math.round(mean(o.t)) + ' s)').join(' | '));
say('  arenas:  ' + Object.entries(ar).map(([k, o]) => k + ' ' + pct(o.n / tot) + ' (fav wins ' + pct(o.fav / o.n) + ')').join(' | '));
const bigUps = F.filter(x => x.f.p[x.f.win] <= 0.2).length; say('  long shots (winner had 20% or less): ' + (bigUps / games.length).toFixed(2) + ' a game');
// 5. the arc
let lead6 = 0, lead6n = 0, leadHalf = 0, changes = [], lastWin = 0, comeback = 0, winnerRank = [0, 0, 0, 0], behindAt = [];
for (const g of games) { const offs = g.v2.snaps.filter(s => s.k === 'offer'); if (!offs.length) continue; let prev = -1, ch = 0, maxBehind = 0;
  for (const s of offs) { const fm2 = s.teams.map(t => t.fame), mx = Math.max(...fm2), ld = fm2.indexOf(mx); if (fm2.filter(x => x === mx).length === 1) { if (prev >= 0 && ld !== prev) ch++; prev = ld; } maxBehind = Math.max(maxBehind, mx - fm2[g.winner]); }
  changes.push(ch); behindAt.push(maxBehind); if (maxBehind >= 3) comeback++;
  const mid = offs[Math.floor(offs.length / 2)], fmid = mid.teams.map(t => t.fame), mxm = Math.max(...fmid); lead6n++; if (fmid[g.winner] === mxm) leadHalf++;
  const r = fmid.slice().sort((a, b) => b - a).indexOf(fmid[g.winner]); winnerRank[r]++; }
say('\n5. THE ARC');
say('  lead changes per game: ' + mean(changes).toFixed(1) + ' | the winner led (or shared the lead) at half-time in ' + pct(leadHalf / lead6n) + ' of games | winner\'s rank at half-time 1st-4th: ' + winnerRank.map(x => pct(x / lead6n)).join(' / '));
say('  comebacks (the winner was 3+ fame behind the leader at some Market): ' + pct(comeback / games.length) + ' | biggest gap overcome, average: ' + mean(behindAt).toFixed(1));
const endR = games.flatMap(g => (g.v2.robotsEnd || []).flat()); const wR = games.flatMap(g => (g.v2.robotsEnd || [])[g.winner] || []), oR = games.flatMap(g => (g.v2.robotsEnd || []).filter((_, i) => i !== g.winner).flat());
const prof = rs => 'level ' + mean(rs.map(r => r.level)).toFixed(1) + ', parts ' + mean(rs.map(r => r.parts)).toFixed(1);
say('  winner\'s robots at the end: ' + (wR.length / games.length).toFixed(1) + ' robots, ' + prof(wR) + ' | others: ' + (oR.length / games.length / 3).toFixed(1) + ' robots, ' + prof(oR));
const seat = [0, 0, 0, 0]; games.forEach(g => seat[g.winner]++); say('  wins by seat: ' + seat.map(x => pct(x / games.length)).join(' / ') + ' | winning fame ' + mean(games.map(g => Math.max(...g.fame))).toFixed(1) + ', last place ' + mean(games.map(g => Math.min(...g.fame))).toFixed(1));
console.log(L.join('\n'));
