// T64 (22 Nov 2026, playtest-ready): the host reloads its page in the middle of an online game. The game runs in the host's
// page, so a reload ends it for everyone; since T64:
//   1. the browser asks first ("Leave site?": a beforeunload dialog) while an online game with joined players runs;
//   2. after the reload the host lobby shows "↩ Resume the last game (round N)" (the round-start save kept in this browser);
//      a click loads it, the joined players (who reconnect by themselves to the same room) get their seats back, Start goes on
//      from the start of that round on every screen.
// Host + 2 joined bot tabs (local transport). Checks the joined screens' "Lost the host" box and what they show after.
//   node tools/mp-scenario/host-reload.js [seed=9] [screenshotFolder]
const path = require('path'), fs = require('fs');
(async () => {
  const seed = +process.argv[2] || 9, shots = process.argv[3]; if (shots) fs.mkdirSync(shots, { recursive: true });
  const b = await require('./launch.js')(require('playwright'));
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
  const PLK = require('../planck-local.js'), PL = PLK.find(); await PLK.route(ctx, PL);
  const errs = [], bad = [], want = (c, m) => { if (!c) bad.push(m); }, say = (...a) => console.log(...a);
  const base = require('url').pathToFileURL(path.resolve('prototypes/tabletop-2.html')).href + '?net=local&room=HR' + seed;
  const open = async (q, tag) => { const p = await ctx.newPage(); p.on('pageerror', e => errs.push(tag + ': ' + e.message)); await p.goto(base + q); return p; };
  const until = async (p, f, ms = 8000, arg) => { for (let t = 0; t < ms; t += 250) { try { if (await p.evaluate(f, arg)) return true; } catch (e) {} await new Promise(r => setTimeout(r, 250)); } return false; };
  const shot = async (p, n) => { if (shots) await p.screenshot({ path: path.join(shots, n) }); };
  // the host is a person (no bot): its seat 0 is played here by the AI autopilot of the test (debug act), the joined tabs are bots
  const host = await open('&host=1&name=Kev&seed=' + seed, 'host');
  const c1 = await open('&name=Ann&bot=1', 'Ann'), c2 = await open('&name=Bob&bot=1', 'Bob');
  await until(host, () => !!document.querySelector('#nlStart:not([disabled])') && document.querySelectorAll('.nl-seat').length === 4 && /2 player/.test(document.body.innerText), 20000);
  await host.evaluate(() => document.getElementById('nlStart').click());
  want(await until(host, () => !!(window.ROBOCUS_GAME && window.ROBOCUS_GAME.G && window.ROBOCUS_GAME.G.teams), 15000), 'the game did not start');
  // play the host's seat with the page's own AI helpers until round 2's Upkeep has been saved
  const t0 = Date.now();
  while (Date.now() - t0 < 360000) {
    const st = await host.evaluate(() => { const G = window.ROBOCUS_GAME.G; return G.round + ':' + G.phase; });
    if (/^([2-9]|1\d):(intrigue|market)/.test(st)) break;
    await host.evaluate(() => { const D = window.ROBOCUS_DEBUG, G = D.G; try { window.ROBOCUS_GAME.skipSeat(0); } catch (e) {}
      const v = document.getElementById('fightView'); if (v && !v.hidden) { const s = v.querySelector('.fv-skip:not([hidden])'); if (s) s.click(); const d = v.querySelector('.fv-done:not([hidden])'); if (d) d.click(); }
      const bt = [...document.querySelectorAll('#promptBar.qmode [data-rk]:not(:disabled), #promptBar.rxmode [data-rk]:not(:disabled)')][0]; if (bt) bt.click(); });
    await host.waitForTimeout(700);
  }
  const before = await host.evaluate(() => { const G = window.ROBOCUS_GAME.G; return { round: G.round, phase: G.phase, fame: G.teams.map(t => t.fame), names: G.teams.map(t => t.player || null) }; });
  const kept = await host.evaluate(() => { const o = JSON.parse(localStorage.getItem('robocus2.hostSave') || 'null'); return o ? { round: o.round, names: o.names } : null; });
  say('before the reload: ' + JSON.stringify(before) + '; kept save: ' + JSON.stringify(kept));
  want(kept && kept.round === before.round, 'no round-start save kept in the browser for round ' + before.round);
  // 1. the reload asks first
  let asked = '';
  host.on('dialog', d => { asked = d.type(); d.accept(); });
  await host.mouse.click(5, 300);   // Chrome asks "Leave site?" only on a page the person has clicked (a real click, not a script's)
  await host.reload({ waitUntil: 'load' }).catch(() => {});
  await host.waitForTimeout(1500);
  say('reload dialog: ' + (asked || 'none'));
  want(asked === 'beforeunload', 'the host reload did not ask first (Leave site?)');
  // what the joined screens show while the host is gone
  await c1.waitForTimeout(3000);
  const lost = await c1.evaluate(() => { const el = document.getElementById('netPause') || document.getElementById('netLobby'); return el ? el.innerText.replace(/\s+/g, ' ').slice(0, 200) : document.body.innerText.slice(0, 120); });
  say('Ann sees: ' + lost);
  await shot(c1, 't64-host-reload-joined.png');
  // 2. the host lobby shows Resume
  const res = await until(host, () => !!document.getElementById('nlResume'), 10000);
  const rtxt = res ? await host.evaluate(() => document.getElementById('nlResume').textContent) : '';
  say('host lobby: ' + (rtxt || 'NO RESUME BUTTON'));
  want(res && new RegExp('round ' + before.round).test(rtxt), 'no "Resume the last game (round ' + before.round + ')" in the host lobby');
  await shot(host, 't64-host-reload-lobby.png');
  if (res) {
    await host.evaluate(() => document.getElementById('nlResume').click());
    await until(host, () => /Loaded: round/.test(document.body.innerText), 5000);
    const ready = await until(host, () => !!document.querySelector('#nlStart:not([disabled])') && /2 player/.test(document.body.innerText), 30000);
    const lob = await host.evaluate(() => [...document.querySelectorAll('.nl-seat')].map(x => x.innerText.replace(/\s+/g, ' ')).join(' | '));
    say('lobby after Resume: ' + lob);
    want(ready, 'the joined players did not come back to the lobby (or Start stays disabled)');
    await host.evaluate(() => document.getElementById('nlStart').click());
    await host.waitForTimeout(3000);
    const after = await host.evaluate(() => { const G = window.ROBOCUS_GAME.G; return { round: G.round, phase: G.phase, names: G.teams.map(t => t.player || null), seats: window.ROBOCUS_GAME.SEATS }; });
    const ca = await c1.evaluate(() => { const G = window.ROBOCUS_GAME.G; return { round: G && G.round, seat: window.ROBOCUS_GAME.HS, role: window.ROBOCUS_GAME.role }; });
    say('after Start: host ' + JSON.stringify(after) + ', Ann ' + JSON.stringify(ca));
    want(after.round === before.round && after.phase === 'upkeep', 'the resumed game is not at the start of round ' + before.round);
    want(JSON.stringify(after.names) === JSON.stringify(before.names), 'seats moved: ' + JSON.stringify(after.names) + ' vs ' + JSON.stringify(before.names));
    want(ca.role === 'client' && ca.round === after.round && before.names[ca.seat] === 'Ann', 'Ann is not back on her seat in the resumed game');
    // the resumed game plays on (bots on the joined screens, the host skips its own steps)
    const r0 = after.round, t1 = Date.now(); let on = false;
    while (Date.now() - t1 < 240000) { if (await host.evaluate(r0 => window.ROBOCUS_GAME.G.round > r0 || window.ROBOCUS_GAME.G.over, r0)) { on = true; break; }
      await host.evaluate(() => { try { window.ROBOCUS_GAME.skipSeat(0); } catch (e) {} const v = document.getElementById('fightView'); if (v && !v.hidden) { const s = v.querySelector('.fv-skip:not([hidden])'); if (s) s.click(); const d = v.querySelector('.fv-done:not([hidden])'); if (d) d.click(); } const bt = [...document.querySelectorAll('#promptBar.qmode [data-rk]:not(:disabled)')][0]; if (bt) bt.click(); });
      await host.waitForTimeout(700); }
    want(on, 'the resumed game did not reach the next round');
    let desync = 0; for (const p of [c1, c2]) desync += await p.evaluate(() => window.ROBOCUS_GAME.desyncs || 0);
    want(!desync, desync + ' desyncs after the resume');
  }
  if (errs.length) bad.push(errs.length + ' page errors: ' + errs.slice(0, 4).join(' | '));
  await b.close();
  console.log(bad.length ? 'FAIL\n  ' + bad.join('\n  ') : 'OK');
  process.exit(bad.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
