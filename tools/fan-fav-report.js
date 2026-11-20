// Fan Favourite study (T35, 20 Nov 2026; docs/robocus-fan-favourite.md). Reads sims/<tag>.json from tools/game-sim.js (2.0 page).
//   node tools/fan-fav-report.js <baseTag> [tag2 ...]        summary per run, paired by seed against the first tag (seat 0 = the tested seat)
//   node tools/fan-fav-report.js --deep <tag>                part A: when Fan Favourites appear, what they earn, matched comparison, fate
//   '+' merges runs (a+b); a later run's game replaces a stalled or crashed one of the same seed.
// Uses: res.ups (Upkeep snapshots incl. robot wins), res.v2.cr (credit ledger [round, team, amt, src]), res.v2.fightsX (x2[].wins),
// res.v2.favSafe (losing Fan Favourites the host could not scrap), res.v2.scraps, res.sponsors, the run's balFull (favTokens).
const fs = require('fs'), path = require('path');
const argv = process.argv.slice(2), deep = argv.includes('--deep'), tags = argv.filter(x => !x.startsWith('--'));
if (!tags.length) { console.log('usage: node tools/fan-fav-report.js [--deep] <baseTag> [tag2 ...]   (files in sims/)'); process.exit(1); }
const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN;
const sd = a => { const m = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / Math.max(1, a.length - 1)); };
const ci = a => a.length > 1 ? 1.96 * sd(a) / Math.sqrt(a.length) : NaN;   // 95% half-width of a mean
const f1 = x => isNaN(x) ? '-' : (Math.round(x * 10) / 10).toFixed(1), pc = x => isNaN(x) ? '-' : Math.round(x * 100) + '%';
const mci = a => f1(mean(a)) + ' ±' + f1(ci(a));
const pci = a => pc(mean(a)) + ' ±' + Math.round(100 * ci(a));

function load(tag) {
  const parts = tag.split('+').map(t => JSON.parse(fs.readFileSync(path.join('sims', t + '.json')))), by = {};
  for (const P of parts) for (const r of P.res) { const old = by[r.seed]; if (old && old.over && !old.stall && !old.crash) continue; by[r.seed] = r; }
  const D = Object.assign({}, parts[0], { res: Object.values(by).sort((a, b) => a.seed - b.seed) });
  const fame = (D.balFull && D.balFull.fame) || { favTokens: 3, favTokensApex: 2, fanFav: 1 };
  const g = D.res.filter(r => r.over && !r.stall && !r.crash && r.v2);
  g.forEach(r => { r.favW = r.sponsors.map(s => s === 'apex' ? fame.favTokensApex : fame.favTokens); });
  return { tag, D, g, fame, bySeed: Object.fromEntries(g.map(r => [r.seed, r])) };
}
const runs = tags.map(load), base = runs[0];
const crBy = (r, team, pred) => r.v2.cr.filter(c => c[1] === team && (!pred || pred(c))).reduce((a, c) => a + c[2], 0);
const firstFav = (r, team) => { for (const k of Object.keys(r.ups).map(Number).sort((a, b) => a - b)) if ((r.ups[k].wins || [])[team] && r.ups[k].wins[team].some(w => w >= r.favW[team])) return k; return null; };
const row = (k, vals, w = 30) => console.log('| ' + k + ' | ' + vals.join(' | ') + ' |');
const head = cols => { console.log('| | ' + cols.join(' | ') + ' |'); console.log('|---|' + cols.map(() => '---').join('|') + '|'); };

// ---------- summary: seat 0 against the other three, paired by seed with the first run ----------
console.log('\nGames (finished / run): ' + runs.map(R => R.tag + ' ' + R.g.length + '/' + R.D.res.length).join(', ') + '\n');
head(runs.map(R => R.tag));
const S = R => R.g;
row('Seat 0 wins (25% = par)', runs.map(R => pci(S(R).map(r => r.winner === 0 ? 1 : 0))));
row('Seat 0 wins, paired change vs ' + base.tag, runs.map(R => { const pr = S(R).filter(r => base.bySeed[r.seed]).map(r => (r.winner === 0) - (base.bySeed[r.seed].winner === 0)); return R === base ? '-' : (pr.length ? (mean(pr) >= 0 ? '+' : '') + Math.round(100 * mean(pr)) + ' ±' + Math.round(100 * ci(pr)) + ' pts (' + pr.length + ')' : '-'); }));
row('Other seats win (each)', runs.map(R => pc(mean(S(R).map(r => r.winner > 0 ? 1 / 3 : 0)))));
row('Game length (rounds)', runs.map(R => mci(S(R).map(r => r.round))));
row('Seat 0 Apex Media', runs.map(R => pc(mean(S(R).map(r => r.sponsors[0] === 'apex' ? 1 : 0)))));
row('Seat 0 hosts per game', runs.map(R => mci(S(R).map(r => (r.v2.hosts || []).filter(h => h[1] === 0).length))));
row('Seat 0 Fan Favourite by round (median)', runs.map(R => { const a = S(R).map(r => firstFav(r, 0)).filter(x => x != null).sort((x, y) => x - y); return pc(a.length / S(R).length) + ' of games, r' + (a.length ? a[a.length >> 1] - 1 : '-'); }));
for (const k of [3, 5, 7, 9]) row('Seat 0 credits at Upkeep ' + k + ' (others)', runs.map(R => { const a = S(R).filter(r => r.ups[k]); return f1(mean(a.map(r => r.ups[k].cr[0]))) + ' (' + f1(mean(a.map(r => mean(r.ups[k].cr.slice(1))))) + ')'; }));
row('Seat 0 fame at Upkeep 7 (others)', runs.map(R => { const a = S(R).filter(r => r.ups[7]); return f1(mean(a.map(r => r.ups[7].fame[0]))) + ' (' + f1(mean(a.map(r => mean(r.ups[7].fame.slice(1))))) + ')'; }));
const SRC = ['appearance', 'mechanics', 'hostdeal', 'backing', 'sponsor', 'card', 'cashin', 'bet', 'host', 'market', 'lot', 'repair', 'upkeep'];
for (const src of SRC) row('Seat 0 Cr/game: ' + src + ' (others)', runs.map(R => f1(mean(S(R).map(r => crBy(r, 0, c => c[3] === src)))) + ' (' + f1(mean(S(R).map(r => mean([1, 2, 3].map(t => crBy(r, t, c => c[3] === src)))))) + ')'));
row('Seat 0 Cr earned / spent per game (others)', runs.map(R => f1(mean(S(R).map(r => crBy(r, 0, c => c[2] > 0)))) + ' / ' + f1(mean(S(R).map(r => -crBy(r, 0, c => c[2] < 0)))) + ' (' + f1(mean(S(R).map(r => mean([1, 2, 3].map(t => crBy(r, t, c => c[2] > 0)))))) + ' / ' + f1(mean(S(R).map(r => mean([1, 2, 3].map(t => -crBy(r, t, c => c[2] < 0)))))) + ')'));
const FS = ['win', 'host', 'fan', 'fav', 'bounty'];
row('Seat 0 fame/game: win / host / fan+fav / cards+ / cards- / bounty', runs.map(R => { const fb = S(R).map(r => r.fameBy[0] || {}), s = (o, p) => Object.keys(o).filter(p).reduce((a, k) => a + o[k], 0);
  return [mean(fb.map(o => s(o, k => /^win/.test(k)))), mean(fb.map(o => s(o, k => k === 'host'))), mean(fb.map(o => s(o, k => k === 'fan' || k === 'fav'))), mean(fb.map(o => s(o, k => /^card/.test(k) && o[k] > 0))), mean(fb.map(o => s(o, k => /^card/.test(k) && o[k] < 0))), mean(fb.map(o => s(o, k => k === 'bounty')))].map(f1).join(' / '); }));
// normal-game health (all seats)
row('Fan Favourites per game (all teams)', runs.map(R => mci(S(R).map(r => [0, 1, 2, 3].filter(t => firstFav(r, t) != null).length))));
row('Appearance Cr per game (all teams)', runs.map(R => mci(S(R).map(r => r.v2.cr.filter(c => c[3] === 'appearance').reduce((a, c) => a + c[2], 0)))));
row('Host scraps per game', runs.map(R => mci(S(R).map(r => r.v2.hostScrap))));
row('Fame per round (all teams)', runs.map(R => f1(mean(S(R).map(r => r.fame.reduce((a, b) => a + b, 0) / r.round)))));
row('Fights per game', runs.map(R => f1(mean(S(R).map(r => r.fights)))));

if (deep) for (const R of runs) partA(R);

// ---------- part A: what a Fan Favourite is worth in normal games ----------
function partA(R) {
  const g = R.g; console.log('\n## Part A: ' + R.tag + ' (' + g.length + ' games)\n');
  // when the first Fan Favourite arrives (made in the round before the Upkeep that shows it)
  const firsts = []; g.forEach(r => [0, 1, 2, 3].forEach(t => { const k = firstFav(r, t); if (k != null) firsts.push({ r, t, k, made: k - 1 }); }));
  const teams = g.length * 4;
  console.log('Team-games with a Fan Favourite: ' + firsts.length + ' of ' + teams + ' (' + pc(firsts.length / teams) + '); Apex Media teams: ' + pc(firsts.filter(x => x.r.sponsors[x.t] === 'apex').length / Math.max(1, g.reduce((a, r) => a + r.sponsors.filter(s => s === 'apex').length, 0))) + ' of theirs');
  const byR = {}; firsts.forEach(x => { byR[x.made] = (byR[x.made] || 0) + 1; });
  console.log('Round the first Fan Favourite is made: ' + Object.keys(byR).sort((a, b) => a - b).map(k => 'r' + k + ' ' + byR[k]).join(', '));
  console.log('Games where any team gets one: ' + pc(mean(g.map(r => [0, 1, 2, 3].some(t => firstFav(r, t) != null) ? 1 : 0))));
  // appearance money per team-round with / without a Fan Favourite (at that round's Upkeep)
  const withF = [], without = [];
  g.forEach(r => Object.keys(r.ups).map(Number).forEach(k => [0, 1, 2, 3].forEach(t => { const w = (r.ups[k].wins || [])[t] || []; const a = crBy(r, t, c => c[0] === k && c[3] === 'appearance'); (w.some(x => x >= r.favW[t]) ? withF : without).push(a); })));
  console.log('\nAppearance money per team-round: with a Fan Favourite ' + mci(withF) + ' Cr (' + withF.length + ' team-rounds), without ' + mci(without) + ' (' + without.length + ')');
  // FF fights and wins
  let ffE = 0, ffW = 0, ffRounds = 0; g.forEach(r => { r.v2.fightsX.forEach(f => (f.x2 || []).forEach(x => { if (x && x.wins >= r.favW[x.team]) { ffE++; if (f.win === x.side) ffW++; } })); [0, 1, 2, 3].forEach(t => { const k = firstFav(r, t); if (k != null) ffRounds += Math.max(0, r.round - k + 1); }); });
  console.log('Fan Favourite fights: ' + ffE + ' entries in ' + ffRounds + ' team-rounds with one (' + f1(ffE / Math.max(1, ffRounds)) + ' a round); it wins ' + pc(ffW / Math.max(1, ffE)) + ' of them');
  // matched: team with its first FF at Upkeep k vs teams without one at the same round and the same fame (all games)
  const H = 3, pool = {};
  g.forEach(r => Object.keys(r.ups).map(Number).forEach(k => [0, 1, 2, 3].forEach(t => { const w = (r.ups[k].wins || [])[t] || []; if (w.some(x => x >= r.favW[t])) return; const key = k + ':' + r.ups[k].fame[t]; (pool[key] = pool[key] || []).push({ r, t, k }); })));
  const out = x => { const r = x.r, u = r.ups, k = x.k, e = u[k + H] || null; return { win: r.winner === x.t ? 1 : 0, dCr: e ? e.cr[x.t] - u[k].cr[x.t] + 0 : null, earn: crBy(r, x.t, c => c[0] >= k && c[0] < k + H && c[2] > 0), dFame: (e ? e.fame[x.t] : r.fame[x.t]) - u[k].fame[x.t] }; };
  const A = [], B = []; firsts.forEach(x => { const key = x.k + ':' + x.r.ups[x.k].fame[x.t], c = (pool[key] || []).filter(y => y.r !== x.r); if (!c.length) return; A.push(out(x)); const o = c.map(out); B.push({ win: mean(o.map(z => z.win)), earn: mean(o.map(z => z.earn)), dFame: mean(o.filter(z => z.dFame != null).map(z => z.dFame)) }); });
  const d = (k) => A.map((a, i) => a[k] - B[i][k]).filter(x => !isNaN(x));
  console.log('\nMatched (same round, same fame, other games; ' + A.length + ' Fan Favourite teams):');
  console.log('| | with its first Fan Favourite | same round + fame, none | paired difference |\n|---|---|---|---|');
  console.log('| Game won | ' + pc(mean(A.map(a => a.win))) + ' | ' + pc(mean(B.map(b => b.win))) + ' | ' + (mean(d('win')) >= 0 ? '+' : '') + Math.round(100 * mean(d('win'))) + ' ±' + Math.round(100 * ci(d('win'))) + ' pts |');
  console.log('| Credits earned in the next ' + H + ' rounds | ' + f1(mean(A.map(a => a.earn))) + ' | ' + f1(mean(B.map(b => b.earn))) + ' | ' + mci(d('earn')) + ' |');
  const ok = A.map((a, i) => i).filter(i => A[i].dFame != null && !isNaN(B[i].dFame));
  console.log('| Fame gained in the next ' + H + ' rounds (or to the end) | ' + f1(mean(ok.map(i => A[i].dFame))) + ' | ' + f1(mean(ok.map(i => B[i].dFame))) + ' | ' + mci(ok.map(i => A[i].dFame - B[i].dFame)) + ' (' + ok.length + ') |');
  // fate: losing Fan Favourites the host could not scrap; how often a non-FF loser in the same spot is scrapped
  const lean = (fm, L, Hh) => fm[L] >= fm[Hh] - 2 || fm[L] === Math.max(...fm);
  const nonFF = { lean: [0, 0], none: [0, 0] };
  g.forEach(r => r.v2.fightsX.forEach(f => { if (typeof f.win !== 'number' || f.win < 0 || f.house) return; (f.x2 || []).forEach(x => { if (!x || f.win === x.side || x.team === f.host || x.wins >= r.favW[x.team]) return;
    const fm = f.fameAt || [0, 0, 0, 0], key = lean(fm, x.team, f.host) ? 'lean' : 'none', sc = r.v2.scraps.some(s => s.why === 'host' && s.r === f.r && s.team === x.team && s.robot === x.name); nonFF[key][0]++; if (sc) nonFF[key][1]++; }); }));
  const fsafe = g.flatMap(r => r.v2.favSafe || []), nl = fsafe.filter(s => lean(s.fame, s.team, s.host)).length;
  const pL = nonFF.lean[1] / Math.max(1, nonFF.lean[0]), pN = nonFF.none[1] / Math.max(1, nonFF.none[0]);
  console.log('\nLosing Fan Favourites the host could not scrap: ' + fsafe.length + ' in ' + g.length + ' games (' + f1(fsafe.length / g.length) + ' a game); ' + nl + ' of them belonged to a fame threat to the host');
  console.log('Other losers (not the host\'s, not a Fan Favourite) scrapped: ' + pc(pL) + ' of ' + nonFF.lean[0] + ' when a fame threat to the host, ' + pc(pN) + ' of ' + nonFF.none[0] + ' otherwise');
  console.log('So about ' + f1(nl * pL + (fsafe.length - nl) * pN) + ' Fan Favourites (' + f1((nl * pL + (fsafe.length - nl) * pN) / g.length) + ' a game) would have been scrapped without the immunity');
}
