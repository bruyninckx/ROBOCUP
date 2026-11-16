// Multiplayer check: one host tab + N client tabs in one browser, over the local transport (BroadcastChannel), every
// seat played by the test bot (?bot=1). Runs a whole game and checks: no errors, every screen ends on the host's
// fame, and every fight a client watched ended the same way as on the host (no desyncs). Pass: the last line is "OK".
//   node tools/mp-test.js [clients=3] [seed=5] [maxMinutes=45] [chaos=0]
// Page: the 2.0 game (prototypes/tabletop-2.html) unless PAGE=... ; the 1.0 page: PAGE=tabletop-prototype.html node tools/mp-test.js
// planck (2.0): a local copy when there is one (PLANCK=<file> or --planck=<file>, then node_modules/planck, then
// vendor/planck-1.4.3.min.js; PLANCK=cdn: the network), see tools/planck-local.js. The first line says which page and planck.
// Time: 3 bot clients take 3-6 min on a quiet 2-core PC and up to 20 on a busy one; a TIMEOUT line says how far it got.
// WATCH=1: fights run in real time on every screen, to test the fight clock.
// chaos=1 also: a player closes its tab and comes back (same name), the host skips a slow player, another player
// leaves for good and the AI takes its seat, and the round-start save is loaded into a fresh host.
const { chromium } = require('playwright');
const path = require('path'), PLK = require('./planck-local.js');
const PAGE = process.env.PAGE || 'tabletop-2.html', WATCH = process.env.WATCH === '1' ? '&watch=1' : '';
const ARGS = process.argv.slice(2).filter(a => !a.startsWith('--')), OPT = k => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : ''; };
(async () => {
  const N = +(ARGS[0] || 3), seed = +(ARGS[1] || 5), maxMin = +(ARGS[2] || 45), chaos = +(ARGS[3] || 0);
  const PL = PLK.find(OPT('planck'));
  const pageFile = path.resolve('prototypes', PAGE), fileUrl = require('url').pathToFileURL(pageFile).href;
  if (!require('fs').existsSync(pageFile)) { console.log('mp-test: no page ' + pageFile + ' (run it from the ROBOCUS folder)'); process.exit(2); }
  console.log('mp-test: page ' + PAGE + ' | planck ' + PL.source + ' | ' + N + ' clients, seed ' + seed + ', up to ' + maxMin + ' min' + (chaos ? ', chaos' : '') + (WATCH ? ', watch' : ''));
  const log = [];
  const room = 'T' + seed + 'X' + N;
  const base = fileUrl + '?net=local&room=' + room + '&bot=1' + WATCH;
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
  await PLK.route(ctx, PL);   // every page of this context (host, clients, the chaos reload) gets the local planck
  const errs = [];
  const open = async (q, tag) => { const p = await ctx.newPage(); p.on('pageerror', e => errs.push(tag + ': ' + e.message + ' @' + (e.stack || '').split('\n').slice(1, 5).map(x => x.trim().replace(/\(file:.*?html[^:]*:/, '(:')).join(' < '))); p.on('console', m => { if ((m.type() === 'error' && !/Failed to load resource/.test(m.text())) || /desync/.test(m.text())) errs.push(tag + ' console: ' + m.text()); }); await p.goto(base + q); return p; };
  const host = await open('&host=1&name=Host&autostart=' + N + '&seed=' + seed, 'host');
  try { await PLK.check(host, PL); } catch (e) { console.log('FAIL: ' + e.message); await b.close(); process.exit(2); }
  const clients = [];
  for (let k = 0; k < N; k++) clients.push(await open('&name=P' + (k + 1), 'P' + (k + 1)));
  let saveText = null;
  const t0 = Date.now(); let last = '', same = 0, skipAt = 0, fights = 0, skipped = 0, lastRound = 0;
  // how far the game got: for a TIMEOUT / STALL line (a slow PC is not a failure of the game)
  const where = async st => { const [r, ph, ms] = String(st).split(':'); const ds = [];
    for (const p of clients) ds.push(await p.evaluate(() => (window.ROBOCUS_GAME.HS != null ? 'seat ' + window.ROBOCUS_GAME.HS : '?') + ' ' + (window.ROBOCUS_GAME.desyncs || 0)).catch(() => 'closed'));
    return 'round ' + r + ', phase ' + ph + (ms ? ' (' + ms + ')' : '') + ', ' + fights + ' fights so far, desyncs so far: ' + ds.join(', ') + ', ' + ((Date.now() - t0) / 60000).toFixed(1) + ' min'; };
  for (;;) {
    const st = await host.evaluate(() => { const G = window.ROBOCUS_GAME && window.ROBOCUS_GAME.G; if (!G || !window.ROBOCUS_GAME.role) return 'lobby'; if (G.over) return null;
      return G.round + ':' + G.phase + ':' + (G.marketStage || '') + ':' + G.teams.map(t => t.fame + '/' + t.credits).join(',') + ':' + [0, 1, 2, 3].map(s => window.ROBOCUS_GAME.seatBusyWith(s) || '-').join('|') + ':' + (G.fight && G.fight.B ? (G.fight.B.tick != null ? G.fight.B.tick : G.fight.B.step) : ''); });
    if (st === null) break;
    // fights: skip about half of them (tests the clients' skip), watch the rest
    const ph = st.split(':')[1];
    if (ph === 'fight') { if (!skipAt) { fights++; skipAt = Date.now() + (Math.random() < 0.5 ? 2500 : 1e9); } if (Date.now() > skipAt) { skipped++; skipAt = 1e15; await host.evaluate(() => { const b = document.querySelector('#fightView:not([hidden]) .fv-skip:not([hidden])') || document.getElementById('pAct1'); if (b) b.click(); }); }
      await host.evaluate(() => { const d = document.querySelector('#fightView .fv-done:not([hidden])'); if (d && !document.getElementById('fightView').hidden) d.click(); }); }
    else skipAt = 0;
    if (chaos) {
      const rnd = +st.split(':')[0];
      if (rnd === 2 && ph === 'upkeep' && !log.includes('drop')) { log.push('drop'); console.log('chaos: P1 closes its tab'); await clients[0].close({ runBeforeUnload: true }); await host.waitForTimeout(2000);
        const paused = await host.evaluate(() => !!document.getElementById('netPause')); console.log('chaos: players', await host.evaluate(() => JSON.stringify(window.ROBOCUS_HOST.players.map(p => [p.name, p.seat, p.connected])) + window.ROBOCUS_GAME.SEATS)); console.log('chaos: host shows pause:', paused); if (!paused) errs.push('no pause overlay after a drop-out');
        await host.waitForTimeout(3000); console.log('chaos: P1 comes back'); clients[0] = await open('&name=P1', 'P1b'); await host.waitForTimeout(2500);
        const back = await clients[0].evaluate(() => window.ROBOCUS_GAME.role + ':' + window.ROBOCUS_GAME.HS); console.log('chaos: P1 rejoined as', back); }
      if (rnd === 3 && ph === 'market' && !log.includes('skip') && N >= 2) { log.push('skip');
        await clients[1].evaluate(() => { window.__noBot = true; }); console.log('chaos: P2 stops playing for a while');
        await host.waitForTimeout(4000); const w = await host.evaluate(() => window.ROBOCUS_GAME.seatBusyWith(2)); console.log('chaos: host skips P2 (busy with', w + ')');
        await host.evaluate(() => window.ROBOCUS_GAME.skipSeat(2)); await clients[1].evaluate(() => { window.__noBot = false; }); }
      if (rnd === 4 && ph === 'upkeep' && !log.includes('leave') && N >= 3) { log.push('leave'); console.log('chaos: P3 leaves for good'); await clients[2].close({ runBeforeUnload: true }); clients.splice(2, 1); await host.waitForTimeout(2000);
        await host.evaluate(() => { const b = document.querySelector('#netPause [data-ai]'); if (b) b.click(); }); const s3 = await host.evaluate(() => window.ROBOCUS_GAME.SEATS[3]); console.log('chaos: seat 3 is now', s3); if (s3 !== 'ai') errs.push('seat 3 not handed to the AI'); }
      if (rnd >= 3 && !log.includes('save')) { const sv = await host.evaluate(() => window.ROBOCUS_GAME.saveText()); if (sv) { log.push('save'); saveText = sv; console.log('chaos: got the save of round', JSON.parse(sv).G.round); } }
    }
    same = st === last ? same + 1 : 0; last = st;
    const rn = +st.split(':')[0]; if (rn > lastRound) { lastRound = rn; console.log('round ' + rn + ' at ' + ((Date.now() - t0) / 60000).toFixed(1) + ' min'); }
    if (same > 120) { console.log('STALL (nothing moved for 30 s): ' + await where(st) + '  [' + st + ']'); break; }
    if (Date.now() - t0 > maxMin * 60000) { console.log('TIMEOUT after ' + maxMin + ' min: ' + await where(st) + '. A busy PC can need longer: give more minutes as the 3rd number (node tools/mp-test.js ' + N + ' ' + seed + ' ' + (maxMin * 2) + ')'); break; }
    await host.waitForTimeout(250);
  }
  await host.waitForTimeout(1500);
  const acts = await host.evaluate(() => { const h = {}; for (const e of window.ROBOCUS_DEBUG.PT.game.events) if (e.k === 'act' && e.remote) h[e.name] = (h[e.name] || 0) + 1; return h; });
  console.log('remote actions', JSON.stringify(acts));
  const live = await host.evaluate(() => { const h = {}; for (const e of window.ROBOCUS_DEBUG.PT.game.events) if (e.k === 'live_card') h['team ' + e.team] = (h['team ' + e.team] || 0) + 1; return h; });
  console.log('live cards played', JSON.stringify(live));
  const rej = await host.evaluate(() => { const h = {}; for (const e of window.ROBOCUS_DEBUG.PT.game.events) if (e.k === 'live_reject') { const k = e.why.replace(/\d+/g, 'N'); h[k] = (h[k] || 0) + 1; } return h; });
  if (Object.keys(rej).length) console.log('live cards refused', JSON.stringify(rej));
  const hostFp = await host.evaluate(() => { const G = window.ROBOCUS_GAME.G; return { over: G.over, round: G.round, fame: G.teams.map(t => t.fame), cr: G.teams.map(t => t.credits), names: G.teams.map(t => t.name), errs: window.ROBOCUS_DEBUG.PT.errs }; });
  const cl = [];
  for (const p of clients) cl.push(await p.evaluate(() => { const G = window.ROBOCUS_GAME.G; const ev = window.ROBOCUS_DEBUG.PT.game ? window.ROBOCUS_DEBUG.PT.game.events : []; return { seat: window.ROBOCUS_GAME.HS, role: window.ROBOCUS_GAME.role, over: G.over, fame: G.teams.map(t => t.fame), desyncs: window.ROBOCUS_GAME.desyncs, resims: window.ROBOCUS_GAME.resims, fightsChecked: ev.filter(e => e.k === 'fight_end' && e.hash).length, logLines: document.querySelectorAll('#ticker > *').length, errs: window.ROBOCUS_DEBUG.PT.errs }; }));
  console.log('host', JSON.stringify(hostFp));
  cl.forEach(c => console.log('client', JSON.stringify(c)));
  console.log('fights seen', fights, 'skipped', skipped, 'minutes', ((Date.now() - t0) / 60000).toFixed(1));
  const bad = [];
  if (!hostFp.over) bad.push('game did not finish (round ' + hostFp.round + ')');
  cl.forEach(c => { if (c.role !== 'client') bad.push('a tab is not a client'); if (JSON.stringify(c.fame) !== JSON.stringify(hostFp.fame)) bad.push('seat ' + c.seat + ' shows other fame'); if (c.desyncs) bad.push('seat ' + c.seat + ': ' + c.desyncs + ' fight desyncs'); });
  if (errs.length) bad.push(errs.length + ' page errors');
  if (chaos && saveText) {   // load the save into a fresh host (a new room) with the same names: same seats, same round
    const room2 = room + 'L', h2 = await ctx.newPage(); h2.on('pageerror', e => errs.push('load: ' + e.message));
    await h2.goto(fileUrl + '?net=local&room=' + room2 + '&host=1&name=Host');
    await h2.waitForTimeout(500);
    await h2.setInputFiles('#nlLoad', { name: 'save.json', mimeType: 'application/json', buffer: Buffer.from(saveText) });
    await h2.waitForTimeout(500);
    const c2 = await ctx.newPage(); await c2.goto(fileUrl + '?net=local&room=' + room2 + '&name=P1&bot=1');
    await h2.waitForTimeout(2500);
    await h2.waitForSelector('#nlStart:not([disabled])', { timeout: 15000 }); await h2.evaluate(() => document.getElementById('nlStart').click());   /* the lobby redraws while it waits: a DOM click, not a pointer click */ await h2.waitForTimeout(2500);   // the player may need a moment to be ready
    const r = await h2.evaluate(() => { const G = window.ROBOCUS_GAME.G; return { round: G.round, phase: G.phase, seats: window.ROBOCUS_GAME.SEATS }; });
    const rc = await c2.evaluate(() => { const G = window.ROBOCUS_GAME.G; return { round: G.round, phase: G.phase, seat: window.ROBOCUS_GAME.HS }; });
    console.log('chaos: loaded save ->', JSON.stringify(r), 'client', JSON.stringify(rc));
    if (r.round !== JSON.parse(saveText).G.round || r.phase !== 'upkeep' || rc.round !== r.round) errs.push('save did not load right');
  }
  console.log(errs.slice(0, 15).join('\n'));
  console.log((bad.length ? 'FAIL: ' + bad.join('; ') : 'OK') + '  (' + PAGE + ', planck ' + PL.source + ')');
  await b.close();
  process.exit(bad.length ? 1 : 0);
})();
