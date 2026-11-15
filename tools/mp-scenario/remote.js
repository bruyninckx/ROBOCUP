// Two PCs, two networks: real online games played by the clicker (15 Nov). Until now every test room was a set of tabs in
// one browser. This one uses the real thing: the game from the web address your friends use, a real room, real links between
// the two PCs. One PC hosts, the other joins with 1 to 3 players; both click their own seats like click-game.js does.
//
//   PC 1 (host):  node tools/mp-scenario/remote.js host <CODE> [games=5] [minutes=15] [players=3]
//   PC 2 (join):  node tools/mp-scenario/remote.js join <CODE> [games=5] [minutes=15] [players=3]
//   (Windows: tools\remote-host.cmd and tools\remote-join.cmd ask for the code.)
//   Same CODE, games, minutes and players on both. CODE: a few letters, e.g. KEV. Game k is played in room CODE + k.
//   Start them in any order, within ten minutes of each other; each side waits for the other at every game.
//   One PC only, to try the tool itself (a local room, no internet):  node tools/mp-scenario/remote.js both <CODE> 1 5
//
//   --url=…     another address than https://bruyninckx.github.io/ROBOCUP/prototypes/tabletop-2.html
//   --firefox   the joined players run in Firefox (needs: npx playwright install firefox): fights in another browser engine
//   --no-drop   leave out the dropped connection (default: in every second game the joining PC goes offline for 12 s)
//
// What it finds out, per game (playtests/remote-runs/<date_time>-<role>/, and latest-remote-<role>.txt):
//   - does the joining PC get through to the host at all, how long it takes, over a direct link or the relay, the delay;
//   - do the fights end the same on both PCs (they run in real time on every screen), how often a live card came in late;
//   - does a dropped connection come back, and how fast;
//   - stuck steps, page errors, lost-host moments; on the host: every joined screen's log arriving (the four-logs file is
//     saved per game as host-<room>.json).
const pw = require('playwright');
const fs = require('fs'), path = require('path');
const { collect, choose, liveCards } = require('./clicker.js');
const ARGS = process.argv.slice(2).filter(a => !a.startsWith('--')), OPT = n => { const a = process.argv.find(x => x.startsWith('--' + n + '=')); return a ? a.slice(n.length + 3) : null; }, FLAG = n => process.argv.includes('--' + n);
const role = ARGS[0], CODE = String(ARGS[1] || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
const GAMES = +(ARGS[2] || 5), MIN = +(ARGS[3] || 15), PLAYERS = Math.max(1, Math.min(3, +(ARGS[4] || 3)));
if (!['host', 'join', 'both'].includes(role) || !CODE) { console.log('Usage: node tools/mp-scenario/remote.js host|join|both <CODE> [games=5] [minutes=15] [players=3]'); process.exit(2); }
const LOCAL = role === 'both';
const URL0 = LOCAL ? require('url').pathToFileURL(path.resolve('prototypes/tabletop-2.html')).href : (OPT('url') || 'https://bruyninckx.github.io/ROBOCUP/prototypes/tabletop-2.html');
const room = k => (CODE + k).slice(0, 8), q = (r, more) => URL0 + '?room=' + r + (LOCAL ? '&net=local' : '') + '&bot=1&watch=1' + more;
const now = new Date(), p2 = n => String(n).padStart(2, '0'), stamp = now.getFullYear() + '-' + p2(now.getMonth() + 1) + '-' + p2(now.getDate()) + '_' + p2(now.getHours()) + p2(now.getMinutes());
const sleep = ms => new Promise(r => setTimeout(r, ms)), clock = () => new Date().toTimeString().slice(0, 8);
const outOf = r => { const d = path.join('playtests', 'remote-runs', stamp + '-' + r); fs.mkdirSync(d, { recursive: true }); return d; };
const sayTo = (lines, tag) => s => { console.log(clock() + ' ' + tag + ' ' + s); lines.push(clock() + ' ' + s); };
// the link of this page to the other PC: direct or through the relay, and the delay
const linkInfo = async () => { try { const X = window.ROBOCUS_CLIENT || window.ROBOCUS_HOST, peer = X && X.T && X.T.peer, out = []; if (!peer) return out;
  for (const id of Object.keys(peer.connections || {})) for (const c of peer.connections[id]) { const pc = c.peerConnection; if (!pc) continue; const stats = await pc.getStats(), by = {}; let pair = null; stats.forEach(s => { by[s.id] = s; });
    stats.forEach(s => { if (s.type === 'candidate-pair' && s.state === 'succeeded' && (s.nominated || s.selected)) pair = s; });
    if (pair) { const l = by[pair.localCandidateId] || {}, r = by[pair.remoteCandidateId] || {}; out.push({ link: l.candidateType === 'relay' || r.candidateType === 'relay' ? 'relay' : 'direct', local: l.candidateType, remote: r.candidateType, protocol: l.protocol, delayMs: Math.round((pair.currentRoundTripTime || 0) * 1000) }); } }
  return out; } catch (e) { return [{ err: String(e.message) }]; } };
const pageState = () => { const GM = window.ROBOCUS_GAME, G = GM && GM.G; if (!G || !G.teams || !GM.role) return null; const np = document.getElementById('netPause');
  return { over: !!G.over, round: G.round, phase: G.phase, stage: G.marketStage || '', seat: GM.HS, busy: GM.seatBusyWith(GM.HS), lost: !!(np && /Lost the host/.test(np.textContent)), paused: !!np, fame: G.teams.map(t => t.fame) }; };
// one screen, played by clicks until the game is over, the time is up, or stop() says so
async function playSeat(p, tag, dir, say, isHost, until, stop) {
  const m = {}, R = { tag, stuck: [], lostHost: 0, lostMs: 0, rounds: 0, live: { tried: 0, played: 0 } };
  let lastKey = null, since = Date.now(), tries = 0, fightKey = '', fightAt = 0, wasLost = false, lostAt = 0, shots = 0;
  await p.evaluate(() => { window.__noBot = true; const pin = document.getElementById('handPin'); if (pin && /keep open/.test(pin.textContent)) pin.click(); }).catch(() => {});
  while (Date.now() < until && !(stop && stop())) {
    let st = null, C = null; try { st = await p.evaluate(pageState); C = st && await p.evaluate(collect); } catch (e) { await sleep(500); continue; }
    if (!st) { await sleep(500); continue; }
    R.rounds = st.round; R.fame = st.fame; R.seat = st.seat;
    if (st.over) { R.over = true; break; }
    if (st.lost && !wasLost) { wasLost = true; lostAt = Date.now(); R.lostHost++; say(tag + ' lost the host (round ' + st.round + ' ' + st.phase + ')'); }
    if (!st.lost && wasLost) { wasLost = false; R.lostMs += Date.now() - lostAt; say(tag + ' has the host back after ' + ((Date.now() - lostAt) / 1000).toFixed(0) + ' s'); }
    if (!isHost && wasLost && Date.now() - lostAt > 25000) { R.lostHost--; R.hostGone = true; say(tag + ': the host is gone (it ended the game, or closed)'); break; }   // not a lost link: the host stopped
    if (st.paused) { await sleep(400); continue; }
    if (st.phase === 'fight') {   // watched on every screen: live cards by clicking; the host runs it at 4x and skips after 40 s
      const fk = st.round + 'f'; if (fk !== fightKey) { fightKey = fk; fightAt = Date.now(); }
      try { const r = await liveCards(p); R.live.tried += r.tried; R.live.played += r.played; } catch (e) {}
      if (isHost) await p.evaluate(late => { const v = document.getElementById('fightView'); if (!v || v.hidden) return; const sp = v.querySelector('[data-sp="4"]'); if (sp && sp.getAttribute('aria-pressed') !== 'true') sp.click(); if (late) { const sk = v.querySelector('.fv-skip:not([hidden])'); if (sk) sk.click(); } const d = v.querySelector('.fv-done:not([hidden])'); if (d) d.click(); }, Date.now() - fightAt > 40000).catch(() => {});
      await sleep(300); continue;
    }
    const label = C.modal ? (C.modal === 'dealModal' ? 'deal panel' : C.modal === 'reactWin' ? 'reaction window' : 'question') + ': ' + C.title.replace(/[^A-Za-z ?]/g, '').trim().split(' ').slice(0, 4).join(' ') : st.busy;
    const key = label ? label + '@' + st.round + st.phase + st.stage : null;
    if (key !== lastKey) { lastKey = key; since = Date.now(); tries = 0; }
    if (!label || (lastKey && lastKey[0] === '!')) { await sleep(250); continue; }
    tries++;
    if (tries > 80 || Date.now() - since > 150000) {
      const file = path.join(dir, 'stuck-' + tag + '-' + (++shots) + '-' + label.replace(/[^a-z0-9]+/gi, '_').slice(0, 40) + '.png'); try { await p.screenshot({ path: file }); } catch (e) {}
      R.stuck.push({ label, round: st.round, phase: st.phase + (st.stage ? '/' + st.stage : ''), canClick: [...new Set(C.items.map(i => i.label))].slice(0, 12), shot: file }); say('STUCK ' + tag + ' · ' + label + ' · round ' + st.round + ' ' + st.phase);
      lastKey = '!' + key;
      await p.evaluate(() => { for (const id of ['dealModal', 'ivModal', 'reactWin']) { const el = document.getElementById(id); if (el && !el.hidden && el._finish) el._finish(); } window.__noBot = false; }).catch(() => {});
      await sleep(1500); await p.evaluate(() => { window.__noBot = true; }).catch(() => {});
      continue;
    }
    m.tries = tries; try { await choose(p, C, label, key, m); } catch (e) {}
    await sleep(120);
  }
  return R;
}
async function hostSide(ctx, k, dir, say) {
  const r = room(k), p = await ctx.newPage(), errs = []; p.on('pageerror', e => errs.push(e.message));
  say('game ' + k + ': opening room ' + r + ', waiting for ' + PLAYERS + ' player' + (PLAYERS > 1 ? 's' : '') + ' (up to 10 minutes)');
  await p.goto(q(r, '&host=1&name=Host&autostart=' + PLAYERS + '&seed=' + (1000 + k)));
  const t0 = Date.now(); let started = false, lastLobby = '';
  while (Date.now() - t0 < 600000) {
    const s = await p.evaluate(() => { const H = window.ROBOCUS_HOST, el = document.getElementById('netLobby'); return { started: !!(H && H.started), players: H ? H.players.map(x => x.name + (x.connected ? '' : ' (away)') + (x.ready ? ' ready' : '')).join(', ') : '', bad: H && H.badVer ? Object.keys(H.badVer).map(n => n + ' has version ' + H.badVer[n]).join('; ') : '', err: el && !el.hidden && /Could not open the room/.test(el.textContent) ? el.textContent.replace(/\s+/g, ' ').slice(0, 200) : '' }; }).catch(() => null);
    if (s && s.started) { started = true; break; }
    const line = s ? (s.err || ('in the lobby: ' + (s.players || 'nobody yet') + (s.bad ? ' · WRONG VERSION: ' + s.bad : ''))) : 'the page is not ready';
    if (line !== lastLobby) { lastLobby = line; say(line); }
    if (s && s.err) break;
    await sleep(2000);
  }
  const res = { room: r, game: k, started, waitedS: Math.round((Date.now() - t0) / 1000) };
  if (!started) { say('game ' + k + ': nobody joined, or the room could not be opened. Skipped.'); res.note = lastLobby; await p.close(); return res; }
  say('game ' + k + ' started after ' + res.waitedS + ' s');
  await sleep(1500); res.links = await p.evaluate(linkInfo).catch(() => []);
  if (res.links.length) say('links to the players: ' + res.links.map(l => l.err || (l.link + ', ' + l.delayMs + ' ms')).join(' · '));
  const R = await playSeat(p, 'host', dir, say, true, Date.now() + MIN * 60000, null);
  await sleep(6000);   // the joined screens' last log batches
  const H = await p.evaluate(() => { const G = window.ROBOCUS_GAME.G, PT = window.ROBOCUS_DEBUG.PT, ev = PT.game.events, n = k => ev.filter(e => e.k === k).length;
    return { over: !!G.over, round: G.round, fame: G.teams.map(t => t.fame), fights: n('fight_end'), mismatches: ev.filter(e => e.k === 'client_desync').map(e => 'seat ' + e.seat + ' fight ' + e.fid), lateCards: n('client_resim'), clientErrors: ev.filter(e => e.k === 'client_error').map(e => 'seat ' + e.seat + ': ' + e.msg), cameBack: ev.filter(e => e.k === 'msg' && /is back\./.test(e.text)).length, errors: ev.filter(e => e.k === 'error').map(e => e.msg),
      screens: (PT.screens || []).map(x => ({ seat: x.seat, name: x.name, events: x.events.length, gaps: x.events.filter(e => e.k === 'gap').length })), file: JSON.stringify(Object.assign({}, PT.game, { screens: PT.screens || [] })) }; }).catch(e => ({ err: String(e.message) }));
  if (H.file) { fs.writeFileSync(path.join(dir, 'host-' + r + '.json'), H.file); delete H.file; }
  Object.assign(res, H, { stuck: R.stuck, live: R.live, pageErrors: errs });
  say('game ' + k + (res.over ? ' finished' : ' stopped') + ' in round ' + res.round + ' · ' + (res.fights || 0) + ' fights, ' + (res.mismatches || []).length + ' ended differently on a joined screen, ' + (res.lateCards || 0) + ' late live cards · players came back ' + (res.cameBack || 0) + '× · joined logs received: ' + ((res.screens || []).map(x => x.name + ' ' + x.events + (x.gaps ? ' (' + x.gaps + ' gaps)' : '')).join(', ') || 'none') + ' · ' + R.stuck.length + ' stuck, ' + ((res.errors || []).length + errs.length) + ' errors on the host, ' + (res.clientErrors || []).length + ' on joined screens');
  await p.close(); return res;
}
async function joinSide(ctx, k, dir, say, drop) {
  const r = room(k), res = { room: r, game: k, players: [] }, pages = [];
  say('game ' + k + ': joining room ' + r + ' with ' + PLAYERS + ' player' + (PLAYERS > 1 ? 's' : '') + ' (trying for up to 10 minutes)');
  for (let i = 1; i <= PLAYERS; i++) { const p = await ctx.newPage(), errs = [], warn = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (/desync/i.test(m.text())) warn.push(m.text()); }); pages.push({ p, name: 'R' + i, errs, warn, tries: 0, joinErrs: [] }); }
  const t0 = Date.now(), state = p => p.evaluate(() => { const C = window.ROBOCUS_CLIENT, el = document.getElementById('netLobby'), stage = document.getElementById('nlStage'); return { joined: !!(C && C.joined), started: !!(C && C.started), err: el && !el.hidden && el.querySelector('[style*="b45309"]') ? el.querySelector('[style*="b45309"]').textContent.trim().slice(0, 220) : '', stage: stage ? stage.textContent : '' }; }).catch(() => null);
  for (const P of pages) { P.t0 = Date.now(); await P.p.goto(q(r, '&name=' + P.name)).catch(() => {}); }
  let lastLine = '';
  while (Date.now() - t0 < 600000) {
    let n = 0;
    for (const P of pages) { const s = await state(P.p); if (!s) continue;
      if (s.joined && !P.joinedS) { P.joinedS = Math.round((Date.now() - P.t0) / 1000); P.link = await P.p.evaluate(linkInfo).catch(() => []); say(P.name + ' is in after ' + P.joinedS + ' s' + (P.tries ? ' (try ' + (P.tries + 1) + ')' : '') + (P.link[0] ? ': ' + (P.link[0].err || P.link[0].link + ' link, ' + P.link[0].delayMs + ' ms') : '')); }
      if (s.started) n++;
      if (!s.joined && s.err) { if (!P.joinErrs.includes(s.err)) { P.joinErrs.push(s.err); say(P.name + ' could not join: ' + s.err); } if (Date.now() - P.t0 > 12000) { P.tries++; P.t0 = Date.now(); await P.p.goto(q(r, '&name=' + P.name)).catch(() => {}); } }
      else if (!s.joined && Date.now() - P.t0 > 45000) { P.tries++; P.t0 = Date.now(); await P.p.goto(q(r, '&name=' + P.name)).catch(() => {}); }
    }
    if (n === pages.length) break;
    const line = pages.filter(P => P.joinedS).length + ' of ' + pages.length + ' in the room, ' + n + ' in a started game'; if (line !== lastLine) { lastLine = line; say(line); }
    await sleep(2000);
  }
  const inGame = []; for (const P of pages) { const s = await state(P.p); if (s && s.started) inGame.push(P); }
  if (!inGame.length) { say('game ' + k + ': could not get into a game in room ' + r + '. Skipped.'); res.note = pages.map(P => P.name + ': ' + (P.joinErrs.join(' | ') || 'no answer')).join(' · '); for (const P of pages) await P.p.close(); return res; }
  say('game ' + k + ' is on with ' + inGame.length + ' of ' + pages.length + ' players');
  const until = Date.now() + (MIN + 1) * 60000; let gone = 0;
  const dropper = drop ? (async () => { await sleep(90000); if (Date.now() > until - 60000) return; say('DROP: this PC goes offline for 12 s'); res.dropAt = clock(); await ctx.setOffline(true); await sleep(12000); await ctx.setOffline(false); const tb = Date.now(); say('back online');
    for (let i = 0; i < 90; i++) { await sleep(1000); const ok = []; for (const P of inGame) { const s = await P.p.evaluate(pageState).catch(() => null); ok.push(!!(s && !s.lost)); } if (ok.every(Boolean)) { res.dropBackS = Math.round((Date.now() - tb) / 1000); say('every player has the host back ' + res.dropBackS + ' s after coming online'); return; } }
    res.dropBackS = -1; say('NOT ALL PLAYERS CAME BACK within 90 s after the drop'); })() : Promise.resolve();
  const results = await Promise.all(inGame.map(P => playSeat(P.p, P.name, dir, say, false, until, () => gone > 0).then(R => { if (!R.over && R.lostHost && Date.now() < until - 5000) { /* the host closed the game */ } return R; })));
  await dropper.catch(() => {});
  for (let i = 0; i < inGame.length; i++) { const P = inGame[i], R = results[i];
    const c = await P.p.evaluate(() => { const GM = window.ROBOCUS_GAME, ev = window.ROBOCUS_DEBUG.PT.game ? window.ROBOCUS_DEBUG.PT.game.events : []; return { desyncs: GM.desyncs, resims: GM.resims, fights: ev.filter(e => e.k === 'fight_end').length, same: ev.filter(e => e.k === 'fight_end' && e.same).length, errors: ev.filter(e => e.k === 'error').map(e => e.msg) }; }).catch(() => ({}));
    const link2 = await P.p.evaluate(linkInfo).catch(() => []);
    res.players.push(Object.assign({ name: P.name, joinedS: P.joinedS, joinTries: P.tries + 1, joinErrs: P.joinErrs, link: (link2[0] || (P.link || [])[0] || null), pageErrors: P.errs, mismatchWarnings: P.warn.length }, c, { over: !!R.over, round: R.rounds, fame: R.fame, seat: R.seat, stuck: R.stuck, lostHost: R.lostHost, lostS: Math.round(R.lostMs / 1000), live: R.live }));
  }
  say('game ' + k + ': ' + res.players.map(x => x.name + ' ' + (x.over ? 'finished' : 'stopped') + ' in round ' + x.round + ', fights ' + (x.same || 0) + ' of ' + (x.fights || 0) + ' the same as the host' + (x.desyncs ? ' (' + x.desyncs + ' DIFFERENT)' : '') + ', ' + (x.resims || 0) + ' late cards, lost the host ' + x.lostHost + '×, ' + x.stuck.length + ' stuck, ' + ((x.errors || []).length + x.pageErrors.length) + ' errors' + (x.link ? ', ' + (x.link.err || x.link.link + ' ' + x.link.delayMs + ' ms') : '')).join(' · '));
  for (const P of pages) await P.p.close().catch(() => {});
  return res;
}
(async () => {
  const stopAwake = require('./awake.js')();
  const engine = FLAG('firefox') && role !== 'host' ? 'firefox' : 'chromium';
  const b = engine === 'firefox' ? await pw.firefox.launch().catch(e => { console.log('Could not start Firefox: ' + String(e.message).split('\n')[0] + '\nRun once: npx playwright install firefox'); process.exit(2); }) : await require('./launch.js')(pw);
  const mk = async sz => { const c = await b.newContext({ viewport: sz }); if (LOCAL && fs.existsSync('vendor/planck-1.4.3.min.js')) await c.route(/^https?:/, r => r.abort()); return c; };
  const sides = LOCAL ? ['host', 'join'] : [role], lines = {}, all = {};
  console.log((LOCAL ? 'One PC, a local room (a test of the tool itself)' : role === 'host' ? 'HOST' : 'JOIN with ' + PLAYERS + ' player' + (PLAYERS > 1 ? 's' : '') + ' in ' + engine) + ' · code ' + CODE + ' · ' + GAMES + ' games of at most ' + MIN + ' minutes · ' + URL0.replace(/\?.*/, ''));
  const ctx = await mk({ width: 1600, height: 900 });   // 'both': one context, so the local room connects them
  await Promise.all(sides.map(async side => {
    const dir = outOf(side), L = lines[side] = [], say = sayTo(L, side === 'host' ? '[host]' : '[join]'), games = [];
    for (let k = 1; k <= GAMES; k++) { try { games.push(side === 'host' ? await hostSide(ctx, k, dir, say) : await joinSide(ctx, k, dir, say, !FLAG('no-drop') && !LOCAL && k % 2 === 0)); } catch (e) { say('game ' + k + ' broke the test: ' + String(e.message).split('\n')[0]); games.push({ game: k, broke: String(e.message) }); } fs.writeFileSync(path.join(dir, 'games.json'), JSON.stringify(games, null, 1)); }
    all[side] = games;
    const played = games.filter(g => side === 'host' ? g.started : (g.players || []).length), sum = [];
    sum.push('=== ' + side.toUpperCase() + ' · code ' + CODE + ' · ' + played.length + ' of ' + GAMES + ' games played ===');
    if (side === 'host') { const f = played.reduce((a, g) => a + (g.fights || 0), 0), mm = played.flatMap(g => g.mismatches || []), lk = played.flatMap(g => g.links || []).filter(l => !l.err);
      sum.push('fights: ' + f + ', ended differently on a joined screen: ' + mm.length + (mm.length ? ' (' + mm.slice(0, 5).join(', ') + ')' : '') + ' · late live cards: ' + played.reduce((a, g) => a + (g.lateCards || 0), 0));
      if (lk.length) sum.push('links: ' + lk.filter(l => l.link === 'direct').length + ' direct, ' + lk.filter(l => l.link === 'relay').length + ' through the relay · delay ' + Math.min(...lk.map(l => l.delayMs)) + ' to ' + Math.max(...lk.map(l => l.delayMs)) + ' ms');
      sum.push('players came back after a drop: ' + played.reduce((a, g) => a + (g.cameBack || 0), 0) + '× · joined logs with gaps: ' + played.flatMap(g => g.screens || []).filter(x => x.gaps).length + ' · games where a joined log is missing: ' + played.filter(g => (g.screens || []).length < PLAYERS).length);
      sum.push('stuck steps on the host: ' + played.reduce((a, g) => a + (g.stuck || []).length, 0) + ' · errors on the host: ' + played.reduce((a, g) => a + (g.errors || []).length + (g.pageErrors || []).length, 0) + ' · on joined screens: ' + played.reduce((a, g) => a + (g.clientErrors || []).length, 0)); }
    else { const P = played.flatMap(g => g.players), lk = P.map(x => x.link).filter(l => l && !l.err), je = [...new Set(games.flatMap(g => (g.players || []).flatMap(x => x.joinErrs || [])).concat(games.filter(g => g.note).map(g => g.note)))];
      sum.push('got into the game: ' + P.length + ' player-games of ' + GAMES * PLAYERS + (P.length ? ' · time to join ' + Math.min(...P.map(x => x.joinedS || 0)) + ' to ' + Math.max(...P.map(x => x.joinedS || 0)) + ' s · needed more than one try: ' + P.filter(x => x.joinTries > 1).length : ''));
      if (je.length) sum.push('join trouble: ' + je.slice(0, 4).join(' | '));
      if (lk.length) sum.push('links: ' + lk.filter(l => l.link === 'direct').length + ' direct, ' + lk.filter(l => l.link === 'relay').length + ' through the relay · delay ' + Math.min(...lk.map(l => l.delayMs)) + ' to ' + Math.max(...lk.map(l => l.delayMs)) + ' ms');
      sum.push('fights the same as the host: ' + P.reduce((a, x) => a + (x.same || 0), 0) + ' of ' + P.reduce((a, x) => a + (x.fights || 0), 0) + ' · DIFFERENT: ' + P.reduce((a, x) => a + (x.desyncs || 0), 0) + ' · late live cards: ' + P.reduce((a, x) => a + (x.resims || 0), 0));
      const dr = played.filter(g => g.dropAt); if (dr.length) sum.push('dropped connection (' + dr.length + ' games): back after ' + dr.map(g => g.dropBackS < 0 ? 'NOT BACK' : g.dropBackS + ' s').join(', '));
      sum.push('lost the host: ' + P.reduce((a, x) => a + x.lostHost, 0) + '× (' + P.reduce((a, x) => a + x.lostS, 0) + ' s in all) · stuck steps: ' + P.reduce((a, x) => a + x.stuck.length, 0) + ' · errors: ' + P.reduce((a, x) => a + (x.errors || []).length + x.pageErrors.length, 0));
      const st = [...new Set(P.flatMap(x => x.stuck.map(s => s.label + ' (round ' + s.round + ' ' + s.phase + ')')))]; if (st.length) sum.push('stuck at: ' + st.slice(0, 6).join(' · ')); }
    lines[side + 'Sum'] = sum;
    fs.writeFileSync(path.join(dir, 'log.txt'), L.join('\n') + '\n\n' + sum.join('\n') + '\n');
    fs.writeFileSync(path.join('playtests', 'remote-runs', 'latest-remote-' + side + '.txt'), 'Run ' + dir + '\n' + sum.join('\n') + '\n\n' + L.join('\n') + '\n');
  }));
  for (const side of sides) console.log('\n' + lines[side + 'Sum'].join('\n'));
  console.log('\nThe full text: playtests' + path.sep + 'remote-runs' + path.sep + 'latest-remote-' + sides.join('.txt and latest-remote-') + '.txt');
  stopAwake(); await b.close(); process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
