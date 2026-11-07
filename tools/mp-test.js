// Multiplayer check: one host tab + N client tabs in one browser, over the local transport (BroadcastChannel), every
// seat played by the test bot (?bot=1). Runs a whole game and checks: no errors, every screen ends on the host's
// fame, and every fight a client watched ended the same way as on the host (no desyncs).
//   node tools/mp-test.js [clients=3] [seed=5] [maxMinutes=20] [chaos=0]
// chaos=1 also: a player closes its tab and comes back (same name), the host skips a slow player, another player
// leaves for good and the AI takes its seat, and the round-start save is loaded into a fresh host.
const { chromium } = require('playwright');
(async () => {
  const N = +(process.argv[2] || 3), seed = +(process.argv[3] || 5), maxMin = +(process.argv[4] || 20), chaos = +(process.argv[5] || 0);
  const log = [];
  const room = 'T' + seed + 'X' + N;
  const base = 'file://' + process.cwd() + '/prototypes/tabletop-prototype.html?net=local&room=' + room + '&bot=1';
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
  const errs = [];
  const open = async (q, tag) => { const p = await ctx.newPage(); p.on('pageerror', e => errs.push(tag + ': ' + e.message + ' @' + (e.stack || '').split('\n')[1])); p.on('console', m => { if (m.type() === 'error' || /desync/.test(m.text())) errs.push(tag + ' console: ' + m.text()); }); await p.goto(base + q); return p; };
  const host = await open('&host=1&name=Host&autostart=' + N + '&seed=' + seed, 'host');
  const clients = [];
  for (let k = 0; k < N; k++) clients.push(await open('&name=P' + (k + 1), 'P' + (k + 1)));
  let saveText = null;
  const t0 = Date.now(); let last = '', same = 0, skipAt = 0, fights = 0, skipped = 0;
  for (;;) {
    const st = await host.evaluate(() => { const G = window.ROBOCUS_GAME && window.ROBOCUS_GAME.G; if (!G || !window.ROBOCUS_GAME.role) return 'lobby'; if (G.over) return null;
      return G.round + ':' + G.phase + ':' + (G.marketStage || '') + ':' + G.teams.map(t => t.fame + '/' + t.credits).join(',') + ':' + [0, 1, 2, 3].map(s => window.ROBOCUS_GAME.seatBusyWith(s) || '-').join('|') + ':' + (G.fight && G.fight.B ? G.fight.B.tick : ''); });
    if (st === null) break;
    // fights: skip about half of them (tests the clients' skip), watch the rest
    const ph = st.split(':')[1];
    if (ph === 'fight') { if (!skipAt) { fights++; skipAt = Date.now() + (Math.random() < 0.5 ? 2500 : 1e9); } if (Date.now() > skipAt) { skipped++; skipAt = 1e15; await host.evaluate(() => { const b = document.getElementById('pAct1'); if (b) b.click(); }); } }
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
    if (same > 120) { console.log('STALL', st); break; }
    if (Date.now() - t0 > maxMin * 60000) { console.log('TIMEOUT', st); break; }
    await host.waitForTimeout(250);
  }
  await host.waitForTimeout(1500);
  const acts = await host.evaluate(() => { const h = {}; for (const e of window.ROBOCUS_DEBUG.PT.game.events) if (e.k === 'act' && e.remote) h[e.name] = (h[e.name] || 0) + 1; return h; });
  console.log('remote actions', JSON.stringify(acts));
  const hostFp = await host.evaluate(() => { const G = window.ROBOCUS_GAME.G; return { over: G.over, round: G.round, fame: G.teams.map(t => t.fame), cr: G.teams.map(t => t.credits), names: G.teams.map(t => t.name), errs: window.ROBOCUS_DEBUG.PT.errs }; });
  const cl = [];
  for (const p of clients) cl.push(await p.evaluate(() => { const G = window.ROBOCUS_GAME.G; const ev = window.ROBOCUS_DEBUG.PT.game ? window.ROBOCUS_DEBUG.PT.game.events : []; return { seat: window.ROBOCUS_GAME.HS, role: window.ROBOCUS_GAME.role, over: G.over, fame: G.teams.map(t => t.fame), desyncs: window.ROBOCUS_GAME.desyncs, resims: window.ROBOCUS_GAME.resims, fightsChecked: ev.filter(e => e.k === 'fight_end' && e.hash).length, logLines: document.querySelectorAll('#ticker > *').length, errs: window.ROBOCUS_DEBUG.PT.errs }; }));
  console.log('host', JSON.stringify(hostFp));
  cl.forEach(c => console.log('client', JSON.stringify(c)));
  console.log('fights seen', fights, 'skipped', skipped, 'minutes', ((Date.now() - t0) / 60000).toFixed(1));
  const bad = [];
  if (!hostFp.over) bad.push('game did not finish');
  cl.forEach(c => { if (c.role !== 'client') bad.push('a tab is not a client'); if (JSON.stringify(c.fame) !== JSON.stringify(hostFp.fame)) bad.push('seat ' + c.seat + ' shows other fame'); if (c.desyncs) bad.push('seat ' + c.seat + ': ' + c.desyncs + ' fight desyncs'); });
  if (errs.length) bad.push(errs.length + ' page errors');
  if (chaos && saveText) {   // load the save into a fresh host (a new room) with the same names: same seats, same round
    const room2 = room + 'L', h2 = await ctx.newPage(); h2.on('pageerror', e => errs.push('load: ' + e.message));
    await h2.goto('file://' + process.cwd() + '/prototypes/tabletop-prototype.html?net=local&room=' + room2 + '&host=1&name=Host');
    await h2.waitForTimeout(500);
    await h2.setInputFiles('#nlLoad', { name: 'save.json', mimeType: 'application/json', buffer: Buffer.from(saveText) });
    await h2.waitForTimeout(500);
    const c2 = await ctx.newPage(); await c2.goto('file://' + process.cwd() + '/prototypes/tabletop-prototype.html?net=local&room=' + room2 + '&name=P1&bot=1');
    await h2.waitForTimeout(2500);
    await h2.click('#nlStart'); await h2.waitForTimeout(2500);
    const r = await h2.evaluate(() => { const G = window.ROBOCUS_GAME.G; return { round: G.round, phase: G.phase, seats: window.ROBOCUS_GAME.SEATS }; });
    const rc = await c2.evaluate(() => { const G = window.ROBOCUS_GAME.G; return { round: G.round, phase: G.phase, seat: window.ROBOCUS_GAME.HS }; });
    console.log('chaos: loaded save ->', JSON.stringify(r), 'client', JSON.stringify(rc));
    if (r.round !== JSON.parse(saveText).G.round || r.phase !== 'upkeep' || rc.round !== r.round) errs.push('save did not load right');
  }
  console.log(errs.slice(0, 15).join('\n'));
  console.log(bad.length ? 'FAIL: ' + bad.join('; ') : 'OK');
  await b.close();
  process.exit(bad.length ? 1 : 0);
})();
