// T64 (22 Nov 2026, playtest-ready): drop-outs and rejoins in the phases that went in since the last two-PC run, on JOINED
// screens (host + 3 clients over the local transport, bots frozen). A joined player closes its tab and opens the link again
// with the same name:
//   1. Market, trading floor: offers open to and from the player (one from the host, one to another client). While it is away
//      the host shows the pause box; back, its floor shows the same open tickets as the host, it answers Yes and the credits
//      move the same on every screen; the last lock calls the rest off and the Market goes on.
//   2. Upkeep, garage: the player drafts a move (a bill, local to its screen), drops, comes back: the host's state never
//      changed (the draft is gone, as it was only on that screen), the garage still works (a new move locked: the host applies it).
//      The host's Nudge and Skip on a player who does not click Done: the ⏳ row names the player and "Upkeep"; Nudge reaches that
//      screen; Skip ends its Upkeep.
//   3. Arena, "Who steps in?": joined seat 1 is the host and is asked; it drops before answering; back, the question is on its
//      screen again and its answer picks the team that fights.
//   4. A player leaves for good: the host hands its seat to the AI from the pause box; the game plays on to the next round.
//   5. Market, an unanswered ticket to a joined player: the host's Skip locks the player's bids; the ticket times out on its own
//      clock (BAL.floorMs 6 s here) with "no answer" and nothing moves.
//   node tools/mp-scenario/rejoin.js [seed=7] [screenshotFolder]
const { setup } = require('./lib.js');
const path = require('path'), fs = require('fs');
// what the test bot does for a question it missed: a random answer in the note, No in a deal panel (lib.js setup does the same)
const answerOpen = () => { const bs = [...document.querySelectorAll('#promptBar.rxmode [data-rk]:not(:disabled), #promptBar.qmode [data-rk]:not(:disabled)')]; if (bs.length) bs[Math.floor(Math.random() * bs.length)].click();
  const m = document.getElementById('ivModal'); if (m && !m.hidden) { const b = [...m.querySelectorAll('button[data-k]')]; if (b.length) b[Math.floor(Math.random() * b.length)].click(); }
  const d = document.getElementById('dealModal'); if (d && !d.hidden) { const no = d.querySelector('[data-k="no"]'); if (no) no.click(); } };
(async () => {
  const seed = +process.argv[2] || 7, shots = process.argv[3]; if (shots) fs.mkdirSync(shots, { recursive: true });
  const bad = [], want = (c, m) => { if (!c) bad.push(m); }, say = (...a) => console.log(...a);
  const S = await setup(seed, () => { const G = window.ROBOCUS_GAME && window.ROBOCUS_GAME.G; return !!(G && G.phase === 'intrigue' && G.round >= 1 && G.intrigueTurn >= 0 && !G.ivBusy); }, { bal: { floorMs: 0 } });
  const { b, host, errs, seatOf } = S;
  const ctx = host.context();
  const urls = {}; for (const s of [1, 2, 3]) urls[s] = seatOf[s].url();
  const sleep = ms => host.waitForTimeout(ms);
  const until = async (p, f, ms = 8000, arg) => { for (let t = 0; t < ms; t += 200) { try { if (await p.evaluate(f, arg)) return true; } catch (e) {} await new Promise(r => setTimeout(r, 200)); } return false; };
  const drop = async s => { await seatOf[s].close({ runBeforeUnload: true }); seatOf[s] = null; await sleep(2500); };
  const back = async s => { const p = await ctx.newPage(); p.on('pageerror', e => errs.push('P' + s + 'b: ' + e.message)); await p.addInitScript(() => { window.__noBot = true; window.__noAuto = true; }); await p.goto(urls[s]); seatOf[s] = p;
    const ok = await until(p, () => !!(window.ROBOCUS_GAME && window.ROBOCUS_GAME.role === 'client' && window.ROBOCUS_GAME.G && window.ROBOCUS_GAME.G.teams), 20000); await sleep(1500); return ok; };
  const paused = () => host.evaluate(() => { const el = document.getElementById('netPause'); return el ? el.innerText.replace(/\s+/g, ' ') : ''; });
  const hostSt = () => host.evaluate(() => { const D = window.ROBOCUS_DEBUG, G = D.G; return { ph: G.phase, round: G.round, open: D.mktOpen(), cr: G.teams.map(t => t.credits), offers: (G.offers || []).map(o => o.id + ':' + o.from + '>' + o.to), done: (G.floorDone || []).map(x => x.from + '>' + x.to + ':' + x.res) }; });
  const floorIds = p => p.evaluate(() => { const el = document.getElementById('tradeFloor'); if (!el || el.hidden) return null; return [...el.querySelectorAll('.tf-t[data-oid]')].map(t => +t.dataset.oid).sort((a, b) => a - b); });
  const crOn = p => p.evaluate(() => window.ROBOCUS_GAME.G.teams.map(t => t.credits).join(','));
  const shot = async (p, n) => { if (shots && p) await p.screenshot({ path: path.join(shots, n) }); };
  for (const s of [1, 2, 3]) await seatOf[s].evaluate(() => { window.__noAuto = true; });
  await host.evaluate(() => { window.__noAuto = true; window.ROBOCUS_DEBUG.G.teams.forEach(t => { t.hand = []; }); });

  // ---------- 1. Market with offers open
  for (let k = 0; k < 120; k++) {
    const g = await host.evaluate(() => { const D = window.ROBOCUS_DEBUG, G = D.G; return { ph: G.phase, turn: G.intrigueTurn, open: D.mktOpen() }; });
    if (g.open) break;
    if (g.ph === 'intrigue' && g.turn >= 0) await seatOf[g.turn].evaluate(() => window.ROBOCUS_DEBUG.act('endTurn'));
    for (const p of [host, seatOf[1], seatOf[2], seatOf[3]]) await p.evaluate(() => { const bt = [...document.querySelectorAll('#promptBar.qmode [data-rk]')].find(x => /Refuse|OK|Pass|Let it/.test(x.textContent)); if (bt && !bt.disabled) bt.click(); });
    await sleep(500);
  }
  if (!(await hostSt()).open) { console.log('FAIL: never reached the Market'); await b.close(); process.exit(1); }
  await host.evaluate(() => { const D = window.ROBOCUS_DEBUG, G = D.G; G.teams.forEach(t => { t.credits = 10; t.stash = []; }); G.offers = []; G.ps.forEach(P => { P.bids = [0, 0, 0, 0, 0]; }); G.gather = null; D.updateHud(); });
  await sleep(1200);
  await host.evaluate(() => window.ROBOCUS_DEBUG.act('offerSend', 1, { cr: 2, sec: 0, items: [] }, { cr: 0, sec: 0, items: [] }, null));   // host → A: 2 Cr for nothing
  await seatOf[1].evaluate(() => window.ROBOCUS_DEBUG.act('offerSend', 2, { cr: 1, sec: 0, items: [] }, { cr: 0, sec: 0, items: [] }, null));   // A → B
  await until(host, () => (window.ROBOCUS_DEBUG.G.offers || []).length >= 2, 6000); await sleep(800);
  let h = await hostSt(); say('1 offers open: ' + JSON.stringify(h.offers));
  want(h.offers.length === 2, '1: two offers should be open, host has ' + h.offers);
  await drop(1);
  const pz = await paused(); say('1 A closed its tab; host pause box: ' + (pz || 'NONE'));
  want(/paused/i.test(pz) && /P1/.test(pz), '1: no pause box naming P1 on the host');
  await shot(host, 't64-rejoin-pause.png');
  const h1 = await hostSt(); say('1 while A is away: ' + JSON.stringify(h1.offers) + ' done ' + JSON.stringify(h1.done));
  want(await back(1), '1: A did not get back into the game');
  want(!(await paused()), '1: the pause box stays after A is back');
  const tf0 = Date.now(); await until(seatOf[1], () => { const el = document.getElementById('tradeFloor'); return !!(el && !el.hidden && el.querySelector('.tf-t[data-oid]')); }, 20000);
  say('1 A\'s trading floor showed ' + ((Date.now() - tf0) / 1000).toFixed(1) + ' s after the game was back on its screen');
  const h2 = await hostSt(), fA = await floorIds(seatOf[1]);
  say('1 A back: its floor ' + JSON.stringify(fA) + ', host ' + JSON.stringify(h2.offers));
  want(fA && JSON.stringify(fA) === JSON.stringify(h2.offers.map(x => +x.split(':')[0]).sort((a, b) => a - b)), '1: A\'s floor after the rejoin differs from the host: ' + JSON.stringify(fA) + ' vs ' + h2.offers);
  await shot(seatOf[1], 't64-rejoin-market-back.png');
  const fromHost = (h2.offers.find(x => /:0>1$/.test(x)) || '').split(':')[0];
  if (fromHost) { const c0 = h2.cr; await seatOf[1].evaluate(id => { const bt = document.querySelector('#tradeFloor [data-fy="' + id + '"]'); if (bt) bt.click(); }, fromHost);
    await until(host, c0 => window.ROBOCUS_DEBUG.G.teams[1].credits === c0[1] + 2, 6000, c0); await sleep(1000);
    const c1 = (await hostSt()).cr; say('1 A says Yes to the host\'s 2 Cr: ' + c0 + ' → ' + c1);
    want(c1[1] === c0[1] + 2 && c1[0] === c0[0] - 2, '1: the Yes after the rejoin did not move 2 Cr');
    for (const s of [1, 2, 3]) { const c = await crOn(seatOf[s]); want(c === c1.join(','), '1: seat ' + s + ' shows credits ' + c + ', host ' + c1); } }
  else bad.push('1: the host\'s offer to A was gone after the rejoin: ' + h2.offers);
  for (const p of [host, seatOf[1], seatOf[2], seatOf[3]]) { await p.evaluate(() => window.ROBOCUS_DEBUG.act('lockBids')); await sleep(300); }
  want(await until(host, () => !window.ROBOCUS_DEBUG.mktOpen(), 10000), '1: the Market did not close after every lock');
  h = await hostSt(); want(!h.offers.length, '1: offers still open after the last lock: ' + h.offers);

  let desync = 0; const desyncs = async ps => { for (const p of ps.filter(Boolean)) desync += await p.evaluate(() => (window.ROBOCUS_DEBUG.PT.game.events || []).filter(e => e.k === 'desync').length); };
  await desyncs([host, seatOf[1], seatOf[2], seatOf[3]]);
  await b.close();
  await part2(); await part3();
  if (desync) bad.push(desync + ' desyncs');
  if (errs.length) bad.push(errs.length + ' page errors: ' + errs.slice(0, 4).join(' | '));
  console.log(bad.length ? 'FAIL\n  ' + bad.join('\n  ') : 'OK');
  process.exit(bad.length ? 1 : 0);

  // ---------- 2. Upkeep: garage draft, drop, back; Nudge and Skip (a fresh room, frozen in the first Upkeep)
  async function part2() {
  const S = await setup(seed + 1, () => { const G = window.ROBOCUS_GAME && window.ROBOCUS_GAME.G; if (G && G.phase === 'upkeep') { window.__noAuto = true; return true; } return false; });
  const { b, host, seatOf } = S; errs.push(...S.errs); const ctx = host.context(); const sleep = ms => host.waitForTimeout(ms);
  const urls = {}; for (const s of [1, 2, 3]) urls[s] = seatOf[s].url();
  const drop = async s => { await seatOf[s].close({ runBeforeUnload: true }); seatOf[s] = null; await sleep(2500); };
  const back = async s => { const p = await ctx.newPage(); p.on('pageerror', e => errs.push('P' + s + 'b: ' + e.message)); await p.addInitScript(() => { window.__noBot = true; window.__noAuto = true; }); await p.goto(urls[s]); seatOf[s] = p;
    const ok = await until(p, () => !!(window.ROBOCUS_GAME && window.ROBOCUS_GAME.role === 'client' && window.ROBOCUS_GAME.G && window.ROBOCUS_GAME.G.teams), 20000); await sleep(1500); return ok; };
  for (const s of [1, 2, 3]) await seatOf[s].evaluate(() => { window.__noAuto = true; });
  // the bots press Done at once (Upkeep waits for Done since T56): open Upkeep again for the joined seats that pressed it
  const open = await host.evaluate(() => { const D = window.ROBOCUS_DEBUG, g = D.G.gather; if (g && g.done) [1, 2, 3].forEach(s => { delete g.done[s]; }); D.updateHud(); return [1, 2, 3].filter(s => !(g && g.done && g.done[s])); });
  await sleep(1000);
  say('2 seats still in Upkeep: ' + JSON.stringify(open));
  if (open.length < 2) { bad.push('2: fewer than 2 joined seats still in Upkeep (' + open + '), part 2 not run'); await b.close(); return; }
  const c = open[0], o2 = open[1];
  await host.evaluate(c => { const D = window.ROBOCUS_DEBUG, G = D.G, t = G.teams[c];
    const src = [t.robots[0], G.teams[(c + 1) % 4].robots[0]];
    t.robots = src.map((s, k) => { const r = JSON.parse(JSON.stringify(s)); if (k) { r.id = 'RJ' + k; r.uid = 'RJu' + k; } delete r.wear; delete r.leg; delete r.rar; r.parts = []; r.exhausted = false; return r; });
    t.robots[0].parts = ['tow']; t.stash = ['p_hull']; t.credits = 7; D.updateHud(); }, c);
  await until(seatOf[c], c => window.ROBOCUS_DEBUG.G.teams[c].robots.length === 2 && window.ROBOCUS_DEBUG.G.teams[c].stash.length === 1, 8000, c); await sleep(800);
  const g0 = await host.evaluate(c => { const t = window.ROBOCUS_DEBUG.G.teams[c]; return JSON.stringify({ cr: t.credits, st: t.stash, r: t.robots.map(r => r.parts) }); }, c);
  const rid = await seatOf[c].evaluate(c => String(window.ROBOCUS_DEBUG.G.teams[c].robots[1].id), c);
  const dr = await seatOf[c].evaluate(rid => { const D = window.ROBOCUS_DEBUG; D.gdMove('s:0', rid); const P = D.gdPlan(); return P ? { lines: P.lines.length, cost: P.cost } : null; }, rid);
  say('2 seat ' + c + ' drafts Stash → robot: ' + JSON.stringify(dr)); want(dr && dr.lines === 1, '2: no draft on the joined screen');
  await drop(c); want(await back(c), '2: seat ' + c + ' did not get back in Upkeep');
  const g1 = await host.evaluate(c => { const t = window.ROBOCUS_DEBUG.G.teams[c]; return JSON.stringify({ cr: t.credits, st: t.stash, r: t.robots.map(r => r.parts) }); }, c);
  want(g1 === g0, '2: the host\'s team changed by a draft and a drop: ' + g0 + ' → ' + g1);
  const ph = await host.evaluate(() => window.ROBOCUS_DEBUG.G.phase); want(ph === 'upkeep', '2: Upkeep went on while the player was away: ' + ph);
  const nA = await seatOf[c].evaluate(() => { const el = document.getElementById('promptBar'); return el ? el.innerText.replace(/\s+/g, ' ').slice(0, 160) : ''; });
  say('2 back in Upkeep, note: ' + nA); want(/Upkeep|Done|garage|bill|repair/i.test(nA), '2: the note after the rejoin does not show Upkeep');
  await shot(seatOf[c], 't64-rejoin-upkeep-back.png');
  const dr2 = await seatOf[c].evaluate(rid => { const D = window.ROBOCUS_DEBUG; D.gdMove('s:0', rid); const P = D.gdPlan(); return P ? P.lines.length : 0; }, rid); await sleep(300);
  const how = await seatOf[c].evaluate(() => { const b = document.getElementById('gLock'); if (b && !b.disabled) { b.click(); return 'Lock in button'; }
    const D = window.ROBOCUS_DEBUG, t = D.G.teams[window.ROBOCUS_GAME.HS]; D.act('garageLock', { sig: D.garageSig(t), moves: Object.entries(D.GD.place) }); return 'no Lock in button (' + (b ? 'disabled' : 'missing') + '): act'; });
  say('2 second draft ' + dr2 + ' line(s), locked by ' + how);
  want(dr2 === 1 && await until(host, c => window.ROBOCUS_DEBUG.G.teams[c].stash.length === 0, 8000, c), '2: the garage move after the rejoin was not applied by the host');
  // Nudge and Skip on the other seat, which does not click Done
  const nw = await until(host, s => { const el = document.getElementById('netWait'); return !!(el && el.querySelector('[data-n="' + s + '"]')); }, 15000, o2);
  const nwTxt = await host.evaluate(() => { const el = document.getElementById('netWait'); return el ? el.innerText.replace(/\s+/g, ' ') : ''; });
  say('2 host ⏳ row: ' + nwTxt); want(nw && /upkeep/i.test(nwTxt), '2: no ⏳ Nudge / Skip row for seat ' + o2 + ' in Upkeep');
  await shot(host, 't64-upkeep-nudge.png');
  await host.evaluate(s => { const b = document.querySelector('#netWait [data-n="' + s + '"]'); if (b) b.click(); }, o2);
  const nudged = await until(seatOf[o2], () => [...document.querySelectorAll('body *')].some(x => /host is waiting for you/.test(x.textContent) && x.getBoundingClientRect().width > 0), 4000);
  want(nudged, '2: the Nudge did not reach the player\'s screen'); say('2 Nudge seen on seat ' + o2 + ': ' + nudged);
  await host.evaluate(s => { const b = document.querySelector('#netWait [data-s="' + s + '"]'); if (b) b.click(); }, o2);
  const sk = await until(host, s => { const G = window.ROBOCUS_DEBUG.G; return G.phase !== 'upkeep' || !!(G.gather && G.gather.done && G.gather.done[s]); }, 6000, o2);
  want(sk, '2: Skip did not end the player\'s Upkeep'); say('2 Skip: ' + sk);
  await desyncs([host, seatOf[1], seatOf[2], seatOf[3]]);
  await b.close();
  }

  async function part3() {
  const S = await setup(seed + 2, () => { const G = window.ROBOCUS_GAME && window.ROBOCUS_GAME.G; return !!(G && G.phase === 'intrigue' && G.round >= 1 && G.intrigueTurn >= 0 && !G.ivBusy); });
  const { b, host, seatOf } = S; errs.push(...S.errs); const ctx = host.context(); const sleep = ms => host.waitForTimeout(ms);
  const urls = {}; for (const s of [1, 2, 3]) urls[s] = seatOf[s].url();
  const drop = async s => { await seatOf[s].close({ runBeforeUnload: true }); seatOf[s] = null; await sleep(2500); };
  const back = async s => { const p = await ctx.newPage(); p.on('pageerror', e => errs.push('P' + s + 'b: ' + e.message)); await p.addInitScript(() => { window.__noBot = true; }); await p.goto(urls[s]); seatOf[s] = p;
    const ok = await until(p, () => !!(window.ROBOCUS_GAME && window.ROBOCUS_GAME.role === 'client' && window.ROBOCUS_GAME.G && window.ROBOCUS_GAME.G.teams), 20000); await sleep(1500); return ok; };
  const paused = () => host.evaluate(() => { const el = document.getElementById('netPause'); return el ? el.innerText.replace(/\s+/g, ' ') : ''; });
  const hostSt = () => host.evaluate(() => { const D = window.ROBOCUS_DEBUG, G = D.G; return { ph: G.phase, round: G.round, open: D.mktOpen(), cr: G.teams.map(t => t.credits), offers: (G.offers || []).map(o => o.id + ':' + o.from + '>' + o.to), done: (G.floorDone || []).map(x => x.from + '>' + x.to + ':' + x.res) }; });
  const all = () => [host, seatOf[1], seatOf[2], seatOf[3]].filter(Boolean);
  const playTo = async (f, ms = 240000) => { await Promise.all(all().map(p => p.evaluate(() => { window.__noBot = false; }))); const t0 = Date.now(); let ok = false;
    let k = 0;
    while (Date.now() - t0 < ms) { if (await host.evaluate(f)) { ok = true; break; }
      if (++k % 8 === 0) for (const p of all()) await p.evaluate(answerOpen).catch(() => {});   // a question that opened while the bots were frozen missed its bot answer (as in lib.js setup)
      await host.evaluate(() => { const v = document.getElementById('fightView'); if (v && !v.hidden) { const s = v.querySelector('.fv-skip:not([hidden])'); if (s) s.click(); const d = v.querySelector('.fv-done:not([hidden])'); if (d) d.click(); } }); await sleep(250); }
    if (!ok) for (const p of all()) say('   screen ' + await p.evaluate(() => window.ROBOCUS_GAME.HS).catch(() => '?') + ': ' + await require('./lib.js').modal(p).catch(e => e.message));
    if (!ok) say('   (stuck at: ' + await host.evaluate(() => { const G = window.ROBOCUS_DEBUG.G; return G.round + ' ' + G.phase + ' ' + (G.marketStage || '') + ' busy ' + [0, 1, 2, 3].map(s => window.ROBOCUS_GAME.seatBusyWith(s) || '-').join('|') + ' seats ' + window.ROBOCUS_GAME.SEATS + ' note: ' + (document.getElementById('promptBar') || {}).innerText; }).catch(e => e.message) + ')');
    await Promise.all(all().map(p => p.evaluate(() => { window.__noBot = true; }))); await sleep(1500); return ok; };
  // ---------- 3. "Who steps in?" asked of a joined host who drops (a fresh room, frozen in round 1's Intrigue)
  await Promise.all(all().map(p => p.evaluate(() => { window.__noBot = true; })));
  await host.evaluate(() => { const D = window.ROBOCUS_DEBUG, G = D.G;
    G.teams.forEach((t, i) => { t.fame = 3; t.robots.forEach(r => { r.exhausted = i === 2; }); });
    for (let s = 0; s < 4; s++) D.PS(s).choose = false; G.gather = null;
    G.phase = 'arena'; G.host = 1; G.fight = null; G.pickTeams = null; G.hostStep = false; G.chooseMyBot = false; G.arenaEvent = null; G.houseRobot = false; G.arenaPick = 'open'; G.pendingFormat = 'duel'; G.standIn = null; D.updateHud();
    D.invite([1, 2], [0, 1], 'duel'); });
  const qOn = p => p.evaluate(() => { const R = window.ROBOCUS_DEBUG.RX; return R.q && !R.q.over ? [...document.querySelectorAll('#promptBar.qmode [data-rk]')].map(x => x.textContent.trim()) : null; });
  want(await until(seatOf[1], () => { const R = window.ROBOCUS_DEBUG.RX; return !!(R.q && !R.q.over); }, 15000), '3: no "Who steps in?" on joined host seat 1');
  say('3 seat 1 is asked: ' + JSON.stringify(await qOn(seatOf[1])));
  await drop(1); want(await back(1), '3: seat 1 did not get back');
  const q3 = await until(seatOf[1], () => { const R = window.ROBOCUS_DEBUG.RX; return !!(R.q && !R.q.over); }, 8000);
  const bs = await qOn(seatOf[1]); say('3 seat 1 back, question: ' + JSON.stringify(bs));
  want(q3 && bs && bs.length === 2, '3: the question is not on seat 1\'s screen after the rejoin');
  await shot(seatOf[1], 't64-rejoin-standin.png');
  if (bs) { await sleep(1000); await seatOf[1].evaluate(() => { const b = [...document.querySelectorAll('#promptBar.qmode [data-rk]')][1]; if (b) b.click(); });
    const ft = await until(host, () => { const F = window.ROBOCUS_DEBUG.G.fight; return !!(F && F.sides && F.sides[1] && F.sides[1].team === 3) || !!(F && F.teams && F.teams[1] === 3); }, 10000);
    const fs2 = await host.evaluate(() => { const F = window.ROBOCUS_DEBUG.G.fight; return F ? JSON.stringify(F.teams || (F.sides || []).map(s => s.team)) : 'no fight'; });
    say('3 fight after the answer: ' + fs2); want(/3/.test(fs2), '3: the answer after the rejoin did not pick team 3: ' + fs2); }

  // ---------- 4. P3 leaves for good: the AI takes the seat, the game plays on
  await drop(3);
  await host.evaluate(() => { const b = document.querySelector('#netPause [data-ai="3"]'); if (b) b.click(); });
  await sleep(800);
  const s3 = await host.evaluate(() => window.ROBOCUS_GAME.SEATS[3]); say('4 seat 3 is now ' + s3); want(s3 === 'ai', '4: seat 3 not handed to the AI');
  want(!(await paused()), '4: the pause box stays after "Let the AI play"');
  const r4 = (await hostSt()).round;
  want(await playTo(r4 => { const G = window.ROBOCUS_DEBUG.G; return G.over || G.round > r4 && G.phase === 'intrigue'; }, 300000), '4: the game did not reach the next round after the AI took seat 3');

  // ---------- 5. Market: an unanswered ticket to P2; the host Skips P2
  const r5 = (await hostSt()).round;
  want(await playTo(() => window.ROBOCUS_DEBUG.mktOpen(), 300000), '5: never reached the Market');
  await host.evaluate(() => { const D = window.ROBOCUS_DEBUG, G = D.G; D.BALref.floorMs = 6000; G.teams.forEach(t => { t.credits = 10; }); G.offers = []; G.gather = null; D.updateHud(); });
  await sleep(800);
  await host.evaluate(() => window.ROBOCUS_DEBUG.act('offerSend', 2, { cr: 1, sec: 0, items: [] }, { cr: 0, sec: 0, items: [] }, null));
  await until(host, () => (window.ROBOCUS_DEBUG.G.offers || []).some(o => o.to === 2), 5000);
  const c5 = (await hostSt()).cr;
  await host.evaluate(() => window.ROBOCUS_GAME.skipSeat(2)); await sleep(600);
  const lk = await host.evaluate(() => { const G = window.ROBOCUS_DEBUG.G; return !!(G.gather && G.gather.done && G.gather.done[2]); });
  say('5 Skip on P2 with a ticket open: P2 locked ' + lk); want(lk, '5: Skip did not lock P2\'s bids');
  const gone = await until(host, () => !(window.ROBOCUS_DEBUG.G.offers || []).some(o => o.to === 2), 15000);
  const d5 = (await hostSt()); say('5 ticket after its time: ' + JSON.stringify(d5.offers) + ' done ' + JSON.stringify(d5.done) + ' credits ' + c5 + ' → ' + d5.cr);
  want(gone, '5: the unanswered ticket did not time out');
  want(d5.cr[0] === c5[0] && d5.cr[2] === c5[2], '5: credits moved for an unanswered ticket');
  want(await playTo(r5 => { const G = window.ROBOCUS_DEBUG.G; return G.over || G.round > r5; }, 300000), '5: the game did not go on after the Market');

  await desyncs(all());
  await b.close();
  }
})().catch(e => { console.error(e); process.exit(1); });
