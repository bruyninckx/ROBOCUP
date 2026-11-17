// Whole games before / after an arena change (T19, 17 Nov 2026): game length paired by seed, fame per round, arena picks,
// the host on its own arena, upsets, the bookie on arena fights. Reads sims/<tag>.json from tools/game-sim.js (2.0 page).
//   node tools/arena-games-report.js t19-before t19-after
//   node tools/arena-games-report.js before+before-b after+after-b   ('+' merges runs; a later run's game replaces a stalled one of the same seed)
// The first tag is the baseline; the paired lines compare every other tag with it, seed by seed (same seeds = same start).
// The ARENA_FIT table is read from the page each run used (the "page" field in the json), so each run is judged by its own table.
const fs = require('fs'), path = require('path');
const tags = process.argv.slice(2).filter(x => !x.startsWith('--'));
if (!tags.length) { console.log('usage: node tools/arena-games-report.js <baseTag> <tag2> [...]   (files in sims/)'); process.exit(1); }
const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN;
const sd = a => { const m = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / Math.max(1, a.length - 1)); };
const q = (a, p) => { const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const f1 = x => isNaN(x) ? '-' : (Math.round(x * 10) / 10).toFixed(1), f2 = x => isNaN(x) ? '-' : x.toFixed(2), f3 = x => isNaN(x) ? '-' : x.toFixed(3);
const pc = x => isNaN(x) ? '-' : Math.round(x * 100) + '%';
const se = (k, n) => n ? Math.sqrt(Math.max(k, 0.5) / n * (1 - Math.min(k, n - 0.5) / n) / n) : NaN;   // binomial sd of a share
const share = (k, n) => n ? pc(k / n) + ' ±' + Math.round(100 * se(k, n)) + ' (' + n + ')' : '- (0)';

function load(tag) {
  const parts = tag.split('+').map(t => JSON.parse(fs.readFileSync(path.join('sims', t + '.json')))), by = {};
  for (const P of parts) for (const r of P.res) { const old = by[r.seed]; if (old && old.over && !old.stall && !old.crash) continue; by[r.seed] = r; }
  const D = Object.assign({}, parts[0], { res: Object.values(by).sort((a, b) => a.seed - b.seed) });
  let fit = {};
  try { const html = fs.readFileSync(path.resolve(D.page), 'utf8'), m = html.match(/const ARENA_FIT = (\{.*?\});/); if (m) fit = JSON.parse(m[1]); } catch (e) { console.warn(tag + ': no ARENA_FIT (' + e.message + ')'); }
  const g = D.res.filter(r => r.over && !r.stall && !r.crash && r.v2);
  return { tag, D, g, fit, bySeed: Object.fromEntries(g.map(r => [r.seed, r])) };
}
const runs = tags.map(load), base = runs[0];
const af = (fit, name, a) => (a && a !== 'open' && fit[name] && fit[name][a]) || 0;
const row = (k, vals) => console.log('  ' + k.padEnd(46) + vals.map(v => String(v).padEnd(36)).join(''));
const isDuel = f => f.p && f.p.length === 2 && (f.x2 || []).filter(Boolean).length === 2 && !f.house && f.format !== 'mirror';
const decided = f => typeof f.win === 'number' && f.win >= 0;

console.log('\nGames: ' + runs.map(R => R.tag + ' ' + R.g.length + '/' + R.D.res.length + ' (' + R.D.page + ')').join(', '));

// ---- 1. length ----
console.log('\n1. Game length (rounds)');
row('', runs.map(R => R.tag));
const rounds = R => R.g.map(r => r.round);
row('mean ± sd', runs.map(R => f2(mean(rounds(R))) + ' ± ' + f2(sd(rounds(R)))));
row('median (10%-90%)', runs.map(R => q(rounds(R), .5) + ' (' + q(rounds(R), .1) + '-' + q(rounds(R), .9) + ')'));
row('over 13 rounds', runs.map(R => share(R.g.filter(r => r.round > 13).length, R.g.length)));
row('15 rounds or more', runs.map(R => share(R.g.filter(r => r.round >= 15).length, R.g.length)));
row('histogram', runs.map(R => { const h = {}; rounds(R).forEach(x => h[x] = (h[x] || 0) + 1); return Object.entries(h).map(([k, v]) => k + ':' + v).join(' '); }));
for (const R of runs.slice(1)) {
  const seeds = Object.keys(R.bySeed).filter(s => base.bySeed[s]), d = seeds.map(s => R.bySeed[s].round - base.bySeed[s].round);
  console.log('  paired by seed, ' + R.tag + ' - ' + base.tag + ': ' + f2(mean(d)) + ' rounds ± ' + f2(sd(d) / Math.sqrt(d.length)) + ' (1 se; ' + d.length + ' seeds; sd of a pair ' + f2(sd(d)) + '); longer ' + d.filter(x => x > 0).length + ', same ' + d.filter(x => x === 0).length + ', shorter ' + d.filter(x => x < 0).length);
}

// ---- 2. fame ----
console.log('\n2. Fame (all teams, per game; per round = gained / rounds played)');
row('', runs.map(R => R.tag));
const fameSrc = r => { const o = {}; r.fameBy.forEach(fb => Object.entries(fb).forEach(([k, v]) => { if (k === 'phase:setup') return; const kk = k.startsWith('card:') ? (v > 0 ? 'cards +' : 'cards -') : k; o[kk] = (o[kk] || 0) + v; })); return o; };
const srcKeys = [...new Set(runs.flatMap(R => R.g.flatMap(r => Object.keys(fameSrc(r)))))];
for (const k of srcKeys.sort()) row('fame from ' + k, runs.map(R => f2(mean(R.g.map(r => fameSrc(r)[k] || 0)))));
row('net fame / round (all teams)', runs.map(R => f2(mean(R.g.map(r => r.fame.reduce((a, b) => a + b, 0) / r.round)))));
row('winner fame / round', runs.map(R => f2(mean(R.g.map(r => r.fame[r.winner] / r.round)))));
row('runner-up within 1 fame', runs.map(R => share(R.g.filter(r => { const f = r.fame.slice().sort((a, b) => b - a); return f[0] - f[1] <= 1; }).length, R.g.length)));
const atR = (r, R) => r.ups && r.ups[R] && r.ups[R].fame;
row('fame spread at round 8 upkeep (max-min)', runs.map(R => f2(mean(R.g.map(r => atR(r, 8)).filter(Boolean).map(f => Math.max(...f) - Math.min(...f))))));
row('leader at round 8 wins', runs.map(R => { const g = R.g.filter(r => atR(r, 8)); return share(g.filter(r => { const f = atR(r, 8), m = Math.max(...f); return f[r.winner] === m; }).length, g.length); }));

// ---- 3. fights and arenas ----
console.log('\n3. Fights and arenas');
row('', runs.map(R => R.tag));
const FX = R => R.g.flatMap(r => r.v2.fightsX.map(f => Object.assign({ g: r }, f)));
row('fights / game', runs.map(R => f2(FX(R).length / R.g.length)));
row('fight time s (mean)', runs.map(R => f1(mean(FX(R).filter(f => f.time != null).map(f => f.time)))));
row('judges decisions', runs.map(R => share(FX(R).filter(f => f.how === 'judges').length, FX(R).length)));
row('fights on a special arena', runs.map(R => share(FX(R).filter(f => f.arena !== 'open').length, FX(R).length)));
row('  which (share of all fights)', runs.map(R => { const c = {}; FX(R).forEach(f => { if (f.arena !== 'open') c[f.arena] = (c[f.arena] || 0) + 1; }); return Object.entries(c).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + ' ' + pc(v / FX(R).length)).join(' '); }));
const hostIn = f => (f.x2 || []).some(e => e && e.team === f.host);
row('host fights itself: arena picked', runs.map(R => { const a = FX(R).filter(hostIn); return share(a.filter(f => f.arena !== 'open').length, a.length); }));
row('host stays out: arena picked', runs.map(R => { const a = FX(R).filter(f => !hostIn(f)); return share(a.filter(f => f.arena !== 'open').length, a.length); }));
row('arena Cr paid / game (all teams)', runs.map(R => f2(mean(R.g.map(r => -r.v2.cr.filter(e => e[3] === 'arena').reduce((a, e) => a + e[2], 0))))));
row('fight time s: open / arena', runs.map(R => f1(mean(FX(R).filter(f => f.arena === 'open' && f.time != null).map(f => f.time))) + ' / ' + f1(mean(FX(R).filter(f => f.arena !== 'open' && f.time != null).map(f => f.time)))));
row('fight time s by arena', runs.map(R => { const by = {}; FX(R).forEach(f => { if (f.time != null) (by[f.arena] = by[f.arena] || []).push(f.time); }); return Object.entries(by).map(([k, v]) => k + ' ' + Math.round(mean(v))).join(' '); }));

// ---- 4. the host on its own arena (duels where the host sends a robot) ----
console.log('\n4. Host duels (the host sends a robot; 2 robots, no House Robot): open floor vs a picked arena');
row('', runs.map(R => R.tag));
for (const where of ['open', 'arena']) {
  const sel = R => FX(R).filter(f => isDuel(f) && decided(f) && hostIn(f) && (where === 'open' ? f.arena === 'open' : f.arena !== 'open'));
  const side = f => f.x2.find(e => e && e.team === f.host).side;
  row(where + ': host wins / bookie p (n)', runs.map(R => { const a = sel(R); return pc(mean(a.map(f => f.win === side(f) ? 1 : 0))) + ' ±' + Math.round(100 * se(a.filter(f => f.win === side(f)).length, a.length)) + ' / ' + pc(mean(a.map(f => f.p[side(f)]))) + ' (' + a.length + ')'; }));
  row(where + ': host level - foe level', runs.map(R => f2(mean(sel(R).map(f => { const h = f.x2.find(e => e && e.team === f.host), o = f.x2.find(e => e && e.team !== f.host); return (h.level || 0) - (o.level || 0); })))));
  row(where + ': ARENA_FIT edge host - foe (logit)', runs.map(R => f2(mean(sel(R).map(f => { const h = f.x2.find(e => e && e.team === f.host), o = f.x2.find(e => e && e.team !== f.host); return af(R.fit, h.name, f.arena) - af(R.fit, o.name, f.arena); })))));
}

// ---- 5. upsets: duels between different levels ----
console.log('\n5. Upsets: duels between robots of different levels, the lower level wins');
row('', runs.map(R => R.tag));
for (const where of ['all', 'open', 'arena']) {
  row(where, runs.map(R => { const a = FX(R).filter(f => isDuel(f) && decided(f) && (where === 'all' || (where === 'open') === (f.arena === 'open'))).filter(f => { const [x, y] = f.x2.filter(Boolean); return (x.level || 0) !== (y.level || 0); });
    const up = a.filter(f => { const [x, y] = f.x2.filter(Boolean), lo = (x.level || 0) < (y.level || 0) ? x : y; return lo.side === f.win; }); return share(up.length, a.length); }));
}
row('duels: stronger by str2 (parts, damage) wins', runs.map(R => { const a = FX(R).filter(f => isDuel(f) && decided(f)).filter(f => { const [x, y] = f.x2.filter(Boolean); return Math.abs(x.s - y.s) > 0.05; }); return share(a.filter(f => { const [x, y] = f.x2.filter(Boolean); return (x.s > y.s ? x : y).side === f.win; }).length, a.length); }));
for (const where of ['open', 'arena']) row('  ' + where, runs.map(R => { const a = FX(R).filter(f => isDuel(f) && decided(f) && (where === 'open') === (f.arena === 'open')).filter(f => { const [x, y] = f.x2.filter(Boolean); return Math.abs(x.s - y.s) > 0.05; }); return share(a.filter(f => { const [x, y] = f.x2.filter(Boolean); return (x.s > y.s ? x : y).side === f.win; }).length, a.length); }));
row('duels: one level apart, the higher wins', runs.map(R => { const a = FX(R).filter(f => isDuel(f) && decided(f)).filter(f => { const [x, y] = f.x2.filter(Boolean); return Math.abs((x.level || 0) - (y.level || 0)) === 1; }); return share(a.filter(f => { const [x, y] = f.x2.filter(Boolean), hi = (x.level || 0) > (y.level || 0) ? x : y; return hi.side === f.win; }).length, a.length); }));

// ---- 6. the bookie ----
console.log('\n6. The bookie (formula odds; bot games skip the simulating bookie): favourite wins, Brier (coin flip), mean p of the side that won');
row('', runs.map(R => R.tag));
const cal = fx => { let fav = 0, n = 0, br = 0, br0 = 0, nb = 0, pw = 0; for (const f of fx) { if (!decided(f) || !f.p) continue; n++; if (f.p.indexOf(Math.max(...f.p)) === f.win) fav++; pw += f.p[f.win]; f.p.forEach((p, s) => { const y = s === f.win ? 1 : 0; br += (p - y) ** 2; br0 += (1 / f.p.length - y) ** 2; nb++; }); } return n ? pc(fav / n) + ', ' + f3(br / nb) + ' (' + f3(br0 / nb) + '), ' + pc(pw / n) + ' n' + n : '-'; };
row('all fights', runs.map(R => cal(FX(R))));
row('duels on open floor', runs.map(R => cal(FX(R).filter(f => isDuel(f) && f.arena === 'open'))));
row('duels on an arena', runs.map(R => cal(FX(R).filter(f => isDuel(f) && f.arena !== 'open'))));
const sameLv = f => { const [x, y] = f.x2.filter(Boolean); return (x.level || 0) === (y.level || 0); };
row('  same level (bookie: 15 Nov arena table)', runs.map(R => cal(FX(R).filter(f => isDuel(f) && f.arena !== 'open' && sameLv(f)))));
row('  levels differ (bookie: open + ARENA_FIT)', runs.map(R => cal(FX(R).filter(f => isDuel(f) && f.arena !== 'open' && !sameLv(f)))));
row('other formats (2v2, ffa, double, house...)', runs.map(R => cal(FX(R).filter(f => !isDuel(f)))));
// arena duels: does the side the ARENA_FIT favours win more than the bookie said?
row('arena duels: fit-favoured side wins / p', runs.map(R => { const a = FX(R).filter(f => isDuel(f) && decided(f) && f.arena !== 'open'); let n = 0, w = 0, p = 0;
  a.forEach(f => { const [x, y] = f.x2.filter(Boolean), d = af(R.fit, x.name, f.arena) - af(R.fit, y.name, f.arena); if (Math.abs(d) < 0.2) return; const s = d > 0 ? x.side : y.side; n++; p += f.p[s]; if (f.win === s) w++; }); return n ? pc(w / n) + ' / ' + pc(p / n) + ' (' + n + ', |edge|>=0.2)' : '-'; }));

// ---- 7. credits ----
console.log('\n7. Credits');
row('', runs.map(R => R.tag));
row('end credits per team (mean)', runs.map(R => f2(mean(R.g.flatMap(r => r.cr)))));
row('market spend / game', runs.map(R => f1(mean(R.g.map(r => r.marketCr.reduce((a, b) => a + b, 0))))));
row('bets staked / game', runs.map(R => f1(mean(R.g.map(r => r.betCr || 0)))));
row('robots bought / game', runs.map(R => f2(mean(R.g.map(r => r.v2.lots.filter(l => l.kind === 'robot' && l.winner != null && l.winner >= 0).length)))));
row('host scraps / game', runs.map(R => f2(mean(R.g.map(r => r.v2.hostScrap || 0)))));

// ---- 8. the host's arena pick, judged with the robots that actually fought ----
console.log('\n8. Host duels on a picked arena: actual wins vs the bookie with and without the arena fit (p without ~ sigm(logit p - fit edge))');
row('', runs.map(R => R.tag));
const lg = p => Math.log(p / (1 - p)), sg = x => 1 / (1 + Math.exp(-x));
const hostArena = R => FX(R).filter(f => isDuel(f) && decided(f) && hostIn(f) && f.arena !== 'open').map(f => { const h = f.x2.find(e => e && e.team === f.host), o = f.x2.find(e => e && e !== h), p = Math.max(0.03, Math.min(0.97, f.p[h.side])), ed = af(R.fit, h.name, f.arena) - af(R.fit, o.name, f.arena); return { w: f.win === h.side ? 1 : 0, p, p0: sg(lg(p) - ed), ed }; });
row('host wins / bookie / bookie without arena', runs.map(R => { const a = hostArena(R); return pc(mean(a.map(x => x.w))) + ' ±' + Math.round(100 * se(a.filter(x => x.w).length, a.length)) + ' / ' + pc(mean(a.map(x => x.p))) + ' / ' + pc(mean(a.map(x => x.p0))) + ' (' + a.length + ')'; }));
const ARS = ['saws', 'killbox', 'cage', 'ice'];
const edgeOf = (R, f, a) => { const h = f.x2.find(e => e && e.team === f.host), o = f.x2.find(e => e && e !== h); return af(R.fit, h.name, a) - af(R.fit, o.name, a); };
row('picked arena helps the robots sent (edge > 0)', runs.map(R => { const a = FX(R).filter(f => isDuel(f) && hostIn(f) && f.arena !== 'open'); return share(a.filter(f => edgeOf(R, f, f.arena) > 0).length, a.length); }));
row('open-floor host duels with an arena edge > 0.15', runs.map(R => { const a = FX(R).filter(f => isDuel(f) && hostIn(f) && f.arena === 'open'); return share(a.filter(f => ARS.some(k => edgeOf(R, f, k) > 0.15)).length, a.length); }));
row('  of those, host held < 4 Cr at the fight', runs.map(R => { let n = 0, k = 0; R.g.forEach(r => { const sn = r.v2.snaps.filter(s => s.k === 'fight'); if (sn.length !== r.v2.fightsX.length) return; r.v2.fightsX.forEach((f, i) => { if (!(isDuel(f) && hostIn(f) && f.arena === 'open' && ARS.some(a => edgeOf(R, f, a) > 0.15))) return; n++; if (sn[i].teams[f.host].cr < 4) k++; }); }); return share(k, n); }));
