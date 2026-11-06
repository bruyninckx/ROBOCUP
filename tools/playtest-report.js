#!/usr/bin/env node
/* Playtest report: reads the game logs the tabletop prototype writes (📝 in the log header) and summarises them.

   node tools/playtest-report.js                 # all *.json in playtests/
   node tools/playtest-report.js playtests/2026-11-06T13-31-16.json --md docs/playtest-report.md

   Per game: rounds, winner, fame by round, Intrigue plays (landed/blocked), live cards, Market prices, deals,
   fight formats, the bookie's calibration (did favourites win as often as it said?), notes and errors. */
const fs = require('fs'), path = require('path');
const args = process.argv.slice(2);
const mdOut = args.includes('--md') ? args[args.indexOf('--md') + 1] : null;
const inputs = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--md');
const files = (inputs.length ? inputs : [path.join(__dirname, '..', 'playtests')]).flatMap(p =>
  fs.statSync(p).isDirectory() ? fs.readdirSync(p).filter(f => f.endsWith('.json')).sort().map(f => path.join(p, f)) : [p]);
if (!files.length) { console.log('No playtest logs found. Pick ROBOCUS/playtests in the game (📝 in the log header), or download a game and put it there.'); process.exit(0); }

const out = [];
const say = s => out.push(s);
const pct = x => Math.round(x * 100) + '%';
const all = { plays: {}, live: {}, lots: {}, formats: {}, calib: [], deals: { locked: 0, no: 0, yes: 0, refused: 0 }, errors: {}, notes: [] };
say('# ROBOCUS playtest report\n');
say(files.length + ' game log' + (files.length > 1 ? 's' : '') + '.\n');

for (const f of files) {
  let g; try { g = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { say('- ' + path.basename(f) + ': unreadable (' + e.message + ')'); continue; }
  const ev = g.events || [];
  const over = ev.find(e => e.k === 'game_over');
  const last = ev[ev.length - 1] || { t: 0, r: 0 };
  const names = (ev.find(e => e.k === 'new_game') || {}).teams || [];
  say('## ' + g.id + (over ? ': ' + over.winnerName + ' wins in round ' + over.rounds : ': unfinished (round ' + last.r + ')'));
  say('Build `' + g.build + '` · ' + Math.round(last.t / 60) + ' min · ' + ev.length + ' events · you played seat ' + g.seat + (names[g.seat] ? ' (' + names[g.seat] + ')' : '') + '.\n');
  // fame by round (snapshot at each Upkeep)
  const ups = ev.filter(e => e.k === 'phase' && e.ph === 'upkeep').filter((e, i, a) => a.findIndex(x => x.r === e.r) === i);   // first Upkeep of each round (sparring returns to Upkeep)
  if (ups.length) {
    say('| Round | ' + ups[0].teams.map(t => t.name).join(' | ') + ' |');
    say('|---|' + ups[0].teams.map(() => '---').join('|') + '|');
    ups.forEach(u => say('| ' + u.r + ' | ' + u.teams.map(t => t.fame + ' fame, ' + t.cr + ' Cr' + (t.stash && t.stash.length ? ', 📦' + t.stash.length : '')).join(' | ') + ' |'));
    if (over) say('| end | ' + over.teams.map(t => t.fame + ' fame, ' + t.cr + ' Cr').join(' | ') + ' |');
    say('');
  }
  // Intrigue and arena plays
  for (const p of ev.filter(e => e.k === 'play')) {
    const m = p.text.match(/ plays (.+?)(?: on |$)/); const card = m ? m[1].trim() : p.text;
    const o = all.plays[card] = all.plays[card] || { n: 0, landed: 0, blocked: 0, failed: 0 };
    o.n++; if (p.result) o[p.result] = (o[p.result] || 0) + 1;
  }
  // fights
  const starts = ev.filter(e => e.k === 'fight_start'), ends = ev.filter(e => e.k === 'fight_end' && !e.sandbox);
  ends.forEach((e, i) => {
    const s = starts[i]; if (!s) return;
    const fm = s.format + (s.house ? '+house' : '');
    const fo = all.formats[fm] = all.formats[fm] || { n: 0, time: 0, timeouts: 0 };
    fo.n++; fo.time += e.time; if (e.timeout) fo.timeouts++;
    (s.p || []).forEach((p, side) => all.calib.push({ p, won: e.winSide === side ? 1 : 0, n: s.p.length }));
    (e.log || []).filter(x => x.k === 'card').forEach(x => { all.live[x.name] = (all.live[x.name] || 0) + 1; });
  });
  // market
  ev.filter(e => e.k === 'market').forEach(m => m.lots.forEach(l => { const o = all.lots[l.id] = all.lots[l.id] || { n: 0, sold: 0, sum: 0 }; o.n++; if (l.winner >= 0) { o.sold++; o.sum += l.price; } }));
  // deals
  ev.filter(e => e.k === 'deal_panel').forEach(d => { if (d.locked) all.deals.locked++; else all.deals.no++; });
  ev.filter(e => e.k === 'msg').forEach(m => { if (/^🤝/.test(m.text)) all.deals.yes++; if (/^✋/.test(m.text)) all.deals.refused++; });
  // notes and errors
  ev.filter(e => e.k === 'note').forEach(n => all.notes.push(g.id + ' R' + n.r + ' ' + n.ph + ': ' + n.text));
  ev.filter(e => e.k === 'error').forEach(x => { const k = x.msg; const o = all.errors[k] = all.errors[k] || { n: 0, where: g.id + ' R' + x.r + ' ' + x.ph, stack: (x.stack || '').split('\n')[1] || '' }; o.n++; });
}

say('## All games\n');
const plays = Object.entries(all.plays).sort((a, b) => b[1].n - a[1].n);
if (plays.length) { say('**Intrigue and arena cards played**\n\n| Card | Played | Landed | Blocked | Not played (no backing) |\n|---|---|---|---|---|'); plays.forEach(([c, o]) => say('| ' + c + ' | ' + o.n + ' | ' + (o.landed || 0) + ' | ' + (o.blocked || 0) + ' | ' + (o.failed || 0) + ' |')); say(''); }
const live = Object.entries(all.live); if (live.length) say('**Live cards in fights:** ' + live.map(([k, n]) => k + ' ×' + n).join(', ') + '\n');
const fm = Object.entries(all.formats); if (fm.length) { say('**Fights**\n\n| Format | Fights | Avg length | Timeouts |\n|---|---|---|---|'); fm.forEach(([k, o]) => say('| ' + k + ' | ' + o.n + ' | ' + (o.time / o.n).toFixed(1) + ' s | ' + o.timeouts + ' |')); say(''); }
if (all.calib.length) {
  const bands = [[0, 0.25, 'Heavy underdog'], [0.25, 0.42, 'Underdog'], [0.42, 0.58, 'Even'], [0.58, 0.75, 'Favourite'], [0.75, 1.01, 'Heavy favourite']];
  say('**Bookie calibration** (every side of every fight: what the bookie said vs how often it won)\n\n| Band | Sides | Bookie said | Actually won |\n|---|---|---|---|');
  bands.forEach(([lo, hi, nm]) => { const xs = all.calib.filter(c => c.p >= lo && c.p < hi); if (xs.length) say('| ' + nm + ' | ' + xs.length + ' | ' + pct(xs.reduce((a, c) => a + c.p, 0) / xs.length) + ' | ' + pct(xs.reduce((a, c) => a + c.won, 0) / xs.length) + ' |'); });
  const brier = all.calib.reduce((a, c) => a + (c.p - c.won) ** 2, 0) / all.calib.length;
  say('\nBrier score ' + brier.toFixed(3) + ' (0 = perfect, 0.25 = coin flip).\n');
}
const lots = Object.entries(all.lots).sort((a, b) => b[1].n - a[1].n);
if (lots.length) { say('**Market lots**\n\n| Lot | Offered | Sold | Avg price |\n|---|---|---|---|'); lots.forEach(([k, o]) => say('| ' + k + ' | ' + o.n + ' | ' + o.sold + ' | ' + (o.sold ? (o.sum / o.sold).toFixed(1) + ' Cr' : '–') + ' |')); say(''); }
say('**Deals:** your offer panels ' + all.deals.locked + ' locked, ' + all.deals.no + ' "no deal"; log lines 🤝 ' + all.deals.yes + ' · ✋ ' + all.deals.refused + '.\n');
if (all.notes.length) { say('**Your notes**\n'); all.notes.forEach(n => say('- ' + n)); say(''); }
const errs = Object.entries(all.errors);
say(errs.length ? '**Errors**\n\n' + errs.map(([m, o]) => '- ' + m + ' (×' + o.n + ', first at ' + o.where + ') ' + o.stack.trim()).join('\n') + '\n' : '**Errors:** none.\n');

const text = out.join('\n');
if (mdOut) { fs.writeFileSync(mdOut, text); console.log('wrote ' + mdOut); } else console.log(text);
