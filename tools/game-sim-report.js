// Summary of tools/game-sim.js runs, side by side: node tools/game-sim-report.js start4 start1 [more tags]
// Reads sims/<tag>.json. Add --cards to also list each Intrigue card (drawn / played / landed / blocked / cashed per game).
// 2.0 runs (tabletop-2.html) add rows for timing, repairs, zone damage, fight cards, robot lots, the bookie and scraps,
// and print the bookie calibration, fight cards and errors per tag below the table.
const fs = require('fs'), path = require('path');
const tags = process.argv.slice(2).filter(x => !x.startsWith('--')), showCards = process.argv.includes('--cards');
if (!tags.length) { console.log('usage: node tools/game-sim-report.js <tag> [tag2 ...] [--cards]   (files in sims/)'); process.exit(1); }
const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN;
const q = (a, p) => { const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const f1 = x => isNaN(x) ? '-' : (Math.round(x * 10) / 10).toFixed(1), pc = x => isNaN(x) ? '-' : Math.round(x * 100) + '%';
const V2 = {
  sumBy(a, k) { const o = {}; a.forEach(x => { o[x[k]] = (o[x[k]] || 0) + 1; }); return o; },
  of(D, ok, n) {
    const g = ok.filter(r => r.v2); if (!g.length) return {};
    const S = this, per = x => f1(x / g.length);
    const fx = g.flatMap(r => r.v2.fightsX), ent = fx.flatMap(f => (f.x2 || []).filter(Boolean));
    const reps = g.flatMap(r => r.v2.reps), ups = g.flatMap(r => r.v2.ups.filter(u => u.r > 1)), how = S.sumBy(reps, 'how');
    const dmgIn = ups.reduce((a, u) => a + u.dmg.drive + u.dmg.weapon + u.dmg.body, 0), dmgOut = ups.filter(u => u.after).reduce((a, u) => a + u.after.drive + u.after.weapon + u.after.body, 0);
    const zd = k => pc(mean(ent.map(e => e.z && e.z[k] !== 'ok' ? 1 : 0))) + ' (' + pc(mean(ent.map(e => e.z && e.z[k] === 'broken' ? 1 : 0))) + ' broken)';
    const auc = g.flatMap(r => r.auctions || []), won = auc.flatMap(a => a.wins || []), live = g.flatMap(r => r.v2.live);
    const lots = g.flatMap(r => r.v2.lots), sold = lots.filter(l => l.winner != null && l.winner >= 0);
    const rb = sold.filter(l => l.kind === 'robot'), lv = [0, 1, 2, 3].map(L => rb.filter(l => (l.level || 0) === L));
    const cal = S.calib(fx), sc = g.flatMap(r => r.v2.scraps);
    const fw = g.flatMap(r => r.v2.fightWall || []);
    return {
      '— 2.0 —': '',
      'sec / game: wall (throughput)': f1(mean(g.map(r => r.sec))) + ' (' + f1(D.min * 60 / D.res.length) + ' s at par ' + (D.par || '?') + ')',
      'engine: sec / fight, share of game': f1(mean(fw.map(x => x.ms)) / 1000) + ' s, ' + pc(mean(g.map(r => r.v2.stepMs / 1000 / r.sec))),
      'engine steps / fight (120 Hz)': f1(mean(fw.map(x => x.steps))),
      'fight time (s): mean, judges %': f1(mean(fx.filter(f => f.time != null).map(f => f.time))) + ', ' + pc(mean(fx.map(f => f.how === 'judges' ? 1 : 0))),
      'fight formats': Object.entries(S.sumBy(fx, 'format')).map(([k, v]) => k + ' ' + pc(v / fx.length)).join(' '),
      'repairs / team / round (crew, free, Cr)': f1(reps.length / ups.length) + ' (' + [how.crew, how.free, how.credits].map(x => f1((x || 0) / ups.length)).join(', ') + ')' + (how.unknown ? ' ?' + how.unknown : ''),
      'repairs by zone (drive / weapon / body)': ['drive', 'weapon', 'body'].map(k => pc(reps.filter(x => x.zone === k).length / reps.length)).join(' / '),
      'crew / team at upkeep; repair Cr / game': f1(mean(ups.map(u => u.crew))) + '; ' + per((how.credits || 0) * 2),
      'damaged zones at upkeep -> left after': f1(dmgIn / ups.length) + ' -> ' + f1(dmgOut / ups.length) + ' per team (' + pc(1 - dmgOut / Math.max(1, dmgIn)) + ' fixed)',
      'fighters with damage: drive': zd('drive'), 'fighters with damage: weapon': zd('weapon'), 'fighters with damage: body': zd('body'),
      'fight cards: won / fight, price': f1(won.length / fx.length) + ', ' + f1(mean(won.map(w => w.price))) + ' Cr (' + pc(won.length / Math.max(1, auc.reduce((a, x) => a + x.cards.length, 0))) + ' of offered)',
      'fight cards: Cr spent / game (all teams)': per(won.reduce((a, w) => a + w.price, 0)),
      'fight cards: played / fight (of won)': f1(live.length / fx.length) + ' (' + pc(live.length / Math.max(1, won.length)) + ')',
      'robots bought / game: L0 L1 L2 L3': lv.map(a => per(a.length)).join(' '),
      'robot price by level L0 L1 L2 L3': lv.map(a => a.length ? f1(mean(a.map(l => l.price))) : '-').join(' '),
      'parts / crew bought per game (avg Cr)': per(sold.filter(l => l.kind !== 'robot' && l.kind !== 'crew' && l.kind !== 'other').length) + ' (' + f1(mean(sold.filter(l => !['robot', 'crew', 'other'].includes(l.kind)).map(l => l.price))) + ') / ' + per(sold.filter(l => l.kind === 'crew').length) + ' (' + f1(mean(sold.filter(l => l.kind === 'crew').map(l => l.price))) + ')',
      'lots unsold': pc(1 - sold.length / Math.max(1, lots.length)),
      'robots at end / team': f1(mean(g.flatMap(r => r.v2.robotsEnd.map(x => x.length)))),
      'scrapped / game: host, debt; robotless': per(sc.filter(x => x.why === 'host').length) + ', ' + per(sc.filter(x => x.why === 'debt').length) + '; ' + per(sc.filter(x => x.why === 'none-left').length),
      'bookie favourite wins (n)': pc(cal.favWin) + ' (' + cal.n + ')',
      'stronger side (Repair2) wins': pc(cal.strWin),
      'bookie Brier (vs coin flip)': cal.brier.toFixed(3) + ' (' + cal.brier0.toFixed(3) + ')',
      'draws / House Robot wins': pc(cal.draw) + ' / ' + pc(cal.house),
    };
  },
  calib(fx) {   // per side: the bookie's p vs a win; the favourite; the stronger side by Repair2 strength (sum of exp per side)
    const bins = Array.from({ length: 10 }, () => ({ p: 0, w: 0, n: 0 })); let fav = 0, str = 0, n = 0, br = 0, br0 = 0, nb = 0, draw = 0, house = 0;
    for (const f of fx) {
      if (f.win === 'house') { house++; continue; } if (f.win == null || f.win === -1) { draw++; continue; }
      if (!f.p || !f.x2) continue; n++;
      const k = f.p.length, ss = Array.from({ length: k }, (_, sd) => f.x2.filter(e => e && e.side === sd).reduce((a, e) => a + Math.exp(e.s), 0));
      const fi = f.p.indexOf(Math.max(...f.p)), si = ss.indexOf(Math.max(...ss));
      if (fi === f.win) fav++; if (si === f.win) str++;
      f.p.forEach((p, sd) => { const y = sd === f.win ? 1 : 0, b = bins[Math.min(9, Math.floor(p * 10))]; b.p += p; b.w += y; b.n++; br += (p - y) ** 2; br0 += (1 / k - y) ** 2; nb++; });
    }
    const all = fx.length || 1;
    return { n, favWin: fav / n, strWin: str / n, brier: br / nb, brier0: br0 / nb, bins, draw: draw / all, house: house / all };
  },
  details(tag, D) {
    const g = D.res.filter(r => r.v2 && r.over && !r.stall), fx = g.flatMap(r => r.v2.fightsX), cal = this.calib(fx);
    console.log('\n' + tag + ': bookie calibration (every side of every fight; p = bookie odds)');
    console.log('  p band     sides   bookie p   actual win');
    cal.bins.forEach((b, i) => { if (b.n) console.log('  ' + (i / 10).toFixed(1) + '-' + ((i + 1) / 10).toFixed(1) + '   ' + String(b.n).padStart(6) + '   ' + pc(b.p / b.n).padStart(8) + '   ' + pc(b.w / b.n).padStart(10)); });
    const byFmt = {}; fx.forEach(f => { if (typeof f.win !== 'number' || f.win < 0 || !f.p) return; const k = f.format, o = byFmt[k] = byFmt[k] || { n: 0, fav: 0 }; o.n++; if (f.p.indexOf(Math.max(...f.p)) === f.win) o.fav++; });
    console.log('  favourite wins by format: ' + Object.entries(byFmt).map(([k, o]) => k + ' ' + pc(o.fav / o.n) + ' (' + o.n + ')').join(', '));
    const C = {}, won = g.flatMap(r => (r.auctions || []).flatMap(a => a.wins || [])), off = g.flatMap(r => (r.auctions || []).flatMap(a => a.cards)), live = g.flatMap(r => r.v2.live);
    off.forEach(id => { (C[id] = C[id] || { off: 0, won: 0, cr: 0, played: 0 }).off++; });
    won.forEach(w => { const c = C[w.id] = C[w.id] || { off: 0, won: 0, cr: 0, played: 0 }; c.won++; c.cr += w.price; });
    live.forEach(l => { const c = C[l.id] = C[l.id] || { off: 0, won: 0, cr: 0, played: 0 }; c.played++; });
    for (const id in C) if (!live.some(l => l.id === id)) C[id].played = g.reduce((a, r) => a + ((r.cstat || {})[id] ? r.cstat[id].played || 0 : 0), 0);   // not a live card (Swap the Entry): its play count
    console.log('\n' + tag + ': fight cards (per game)   offered / won / avg price / played');
    Object.entries(C).sort((a, b) => b[1].off - a[1].off).forEach(([id, c]) => console.log('  ' + id.padEnd(18) + [c.off / g.length, c.won / g.length].map(f1).join(' / ') + ' / ' + (c.won ? f1(c.cr / c.won) : '-') + ' / ' + f1(c.played / g.length)));
    const E = {};
    D.res.forEach(r => { (r.pageErrs || []).forEach(m => { E['page: ' + m] = (E['page: ' + m] || 0) + 1; }); (r.errEvents || []).forEach(e => { E['game: ' + e.msg] = (E['game: ' + e.msg] || 0) + 1; }); ((r.v2 || {}).hookErrs || []).forEach(m => { E['sim hook: ' + m] = (E['sim hook: ' + m] || 0) + 1; }); if (r.crash) E['crash: ' + r.crash] = (E['crash: ' + r.crash] || 0) + 1; if (r.stall) E['stall'] = (E['stall'] || 0) + 1; if (!r.crash && !r.over) E['not over by round ' + r.round] = (E['not over by round ' + r.round] || 0) + 1; });
    console.log('\n' + tag + ': errors and stalls (games affected)' + (Object.keys(E).length ? '' : ': none'));
    Object.entries(E).sort((a, b) => b[1] - a[1]).forEach(([m, c]) => console.log('  ' + String(c).padStart(4) + '  ' + m.slice(0, 300)));
  }
};
const rows = [], cols = [];
for (const tag of tags) {
  const D = JSON.parse(fs.readFileSync(path.join('sims', tag + '.json')));
  const all = D.res, ok = all.filter(r => r.over && !r.stall && !r.crash), n = ok.length;
  const rounds = ok.map(r => r.round);
  const sumC = (r, pred, k) => Object.entries(r.cstat).filter(([id]) => r.cash[id] && pred(r.cash[id], id)).reduce((a, [, s]) => a + (s[k] || 0), 0);
  const intr = c => !c.live, live = c => c.live, harm = c => c.harmful && !c.live;
  const drawn = ok.map(r => sumC(r, c => !c.auction, 'drawn'));   // Intrigue deck only (auction cards are counted when won)
  const cashCr = ok.map(r => Object.entries(r.cstat).reduce((a, [id, s]) => a + (r.cash[id] ? s.cashed * r.cash[id].cash : 0), 0));
  const fights = ok.map(r => r.fights), liveP = ok.map(r => sumC(r, live, 'played'));
  const atkL = ok.map(r => sumC(r, harm, 'landed')), atkB = ok.map(r => sumC(r, harm, 'blocked'));
  const crPerRound = ok.map(r => { const R = Object.values(r.ups); return R.length ? mean(R.map(u => u.cr.reduce((a, b) => a + b, 0) / 4)) : NaN; });
  const market = ok.map(r => r.marketCr.reduce((a, b) => a + b, 0)), bets = ok.map(r => r.betCr || 0);
  const auct = ok.flatMap(r => r.auctions || []), auctWon = auct.reduce((a, x) => a + (x.wins || []).length, 0), auctCr = auct.reduce((a, x) => a + (x.wins || []).reduce((s, w) => s + (w.price || 0), 0), 0);
  const fame = {}; ok.forEach(r => r.fameBy.forEach(fb => Object.entries(fb).forEach(([k, v]) => { if (k === 'phase:setup') return; const kk = k.startsWith('card:') ? (v > 0 ? 'cards +' : 'cards −') : k; fame[kk] = (fame[kk] || 0) + v; })));
  const hist = {}; rounds.forEach(x => hist[x] = (hist[x] || 0) + 1);
  const seatWins = [0, 1, 2, 3].map(i => ok.filter(r => r.winner === i).length / n);
  cols.push(tag);
  rows.push({
    'settings': 'start ' + D.start + ', win ' + D.win + ', AI v' + D.ai,
    'games finished / run': n + ' / ' + all.length + (all.length - n ? ' (' + all.filter(r => r.stall).length + ' stalls, ' + all.filter(r => r.crash).length + ' crashes)' : ''),
    'page errors': all.reduce((a, r) => a + (r.errs || 0) + (r.pageErrs || []).length, 0),
    'rounds: mean': f1(mean(rounds)), 'rounds: median (10%–90%)': q(rounds, .5) + ' (' + q(rounds, .1) + '–' + q(rounds, .9) + ')',
    'rounds histogram': Object.entries(hist).map(([k, v]) => k + ':' + v).join(' '),
    'Intrigue deck size': ok[0] ? ok[0].deckSize : '-',
    'Intrigue cards drawn / game': f1(mean(drawn)), 'share of the deck seen': ok[0] ? pc(mean(drawn) / ok[0].deckSize) : '-',
    'cards cashed in / game (Cr)': f1(mean(ok.map(r => sumC(r, () => true, 'cashed')))) + ' (' + f1(mean(cashCr)) + ' Cr)',
    'attacks played / game': f1(mean(atkL.map((x, i) => x + atkB[i]))), 'attacks that land': pc(mean(atkL) / (mean(atkL) + mean(atkB))),
    'Security Bot rolls / game': f1(mean(ok.map(r => (r.cstat.security_bot || {}).played || 0))),
    'fights / game': f1(mean(fights)), 'live cards played / fight': f1(mean(liveP) / mean(fights)),
    'auction: cards won / fight (Cr each)': auct.length ? f1(auctWon / mean(fights) / n) + ' (' + f1(auctCr / Math.max(1, auctWon)) + ' Cr)' : '-',
    'avg credits held per team (upkeep)': f1(mean(crPerRound)),
    'Market spend / game (all teams)': f1(mean(market)), 'bets staked / game': f1(mean(bets)),
    'win share by seat 1-4': seatWins.map(pc).join(' '),
    'fame / game by source': Object.entries(fame).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 7).map(([k, v]) => k + ' ' + f1(v / n)).join(', '),
    'close finish: runner-up within 1 / 2 fame': (() => { const g = ok.map(r => { const f = r.fame.slice().sort((a, b) => b - a); return f[0] - f[1]; }); return pc(mean(g.map(x => x <= 1 ? 1 : 0))) + ' / ' + pc(mean(g.map(x => x <= 2 ? 1 : 0))); })(),
    'fame gap winner - last': f1(mean(ok.map(r => Math.max(...r.fame) - Math.min(...r.fame)))),
    ...(V2.of(D, ok, n)),
    _cards: (() => { const c = {}; ok.forEach(r => Object.entries(r.cstat).forEach(([id, s]) => { if (!r.cash[id]) return; const x = c[r.cash[id].name] = c[r.cash[id].name] || { drawn: 0, played: 0, landed: 0, blocked: 0, cashed: 0 }; for (const k in x) x[k] += s[k] || 0; })); for (const k in c) for (const kk in c[k]) c[k][kk] /= n; return c; })()
  });
}
const keys = [...new Set(rows.flatMap(r => Object.keys(r)))].filter(k => k !== '_cards'), w0 = Math.max(...keys.map(k => k.length)) + 2;
const cw = cols.map((c, i) => Math.max(c.length, ...keys.map(k => String(rows[i][k] == null ? '-' : rows[i][k]).length)) + 2);
console.log(''.padEnd(w0) + cols.map((c, i) => c.padEnd(cw[i])).join(''));
for (const k of keys) console.log(k.padEnd(w0) + rows.map((r, i) => String(r[k] == null ? '-' : r[k]).padEnd(cw[i])).join(''));
if (showCards) rows.forEach((r, i) => {
  console.log('\n' + cols[i] + ': per game  drawn / played / landed / blocked / cashed');
  Object.entries(r._cards).sort((a, b) => b[1].drawn - a[1].drawn).forEach(([k, s]) => console.log('  ' + k.padEnd(26) + [s.drawn, s.played, s.landed, s.blocked, s.cashed].map(f1).join(' / ')));
});

// ---- 2.0 extra blocks ----
for (const tag of tags) { const D = JSON.parse(fs.readFileSync(path.join('sims', tag + '.json'))); if (D.res.some(r => r.v2)) V2.details(tag, D); }
