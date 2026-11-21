// T26 (Kev, 17 Nov: "when everybody locks bids, the open auction is done"; a trade after locking unlocks you: "yes"):
// the merged Market step online, 4 people (host H = seat 0, joined A = 1, B = 2, C = 3), local transport. The bots get everyone
// to round 1's Intrigue and are frozen; this script then plays the screens through the real buttons where it matters.
//   0. Host Skip on C with bids above its credits: the bids are lowered to fit and C is locked; C changes a bid: unlocked again.
//   1. A and B bid (B bids all its credits); H, A and B lock (A's note LOCKED IN; C still deciding).
//   2. B offers A 2 Cr through the deal panel on B's screen; A accepts in its note. On the host, at once: B −2, A +2, both
//      unlocked; every screen shows the same credits and A and B DECIDING. B's bids are now above its credits: B's Lock is
//      greyed and a lock sent anyway is refused with a line; B lowers a bid and locks.
//   3. An open deal at the last lock: A locks, then opens a trade panel with C and leaves it open; C locks last. T47: the step no
//      longer waits: A's panel closes as no deal, A and C get a "the Market closed" line, the lots resolve at once, as expected.
//   4. A late trade and a late bid from A: refused, with a "Too late" line on A's screen.
//   node tools/mp-scenario/market-step-online.js [seed=7] [screenshotFolder]
const path = require('path'), fs = require('fs');
const { setup, press } = require('./lib.js');
(async () => {
  const seed = +(process.argv[2] || 7), shots = process.argv[3]; if (shots) fs.mkdirSync(shots, { recursive: true });
  const { b, host, errs, seatOf, all } = await setup(seed, () => { const G = window.ROBOCUS_GAME && window.ROBOCUS_GAME.G; return !!(G && G.phase === 'intrigue' && G.round >= 1 && G.intrigueTurn >= 0 && !G.ivBusy); });
  const H = seatOf[0], A = seatOf[1], B = seatOf[2], C = seatOf[3], bad = [];
  const shot = (p, n) => shots ? p.screenshot({ path: path.join(shots, n) }) : null;
  const noteShot = (p, n) => shots ? p.locator('#promptBar').screenshot({ path: path.join(shots, n) }) : null;
  const until = async (p, f, ms = 20000, arg) => { for (let t = 0; t < ms; t += 100) { if (await p.evaluate(f, arg)) return true; await p.waitForTimeout(100); } return false; };
  const hs = () => host.evaluate(() => { const D = window.ROBOCUS_DEBUG, G = D.G;
    return { phase: G.phase, stage: G.marketStage, open: D.mktOpen(), resolved: !!G.marketResolved, cr: G.teams.map(t => t.credits), bids: G.ps.map(P => (P.bids || []).slice(0, 4).join('+')),
      locked: G.gather && G.gather.key === 'lots:' + G.round ? Object.keys(G.gather.done).map(Number) : [], deals: Object.assign({}, G.mDeals || {}) }; });
  const actOn = (p, ...a) => p.evaluate(a => window.ROBOCUS_DEBUG.act(...a), a);
  const lockOn = async p => { for (let t = 0; t < 6000; t += 200) {   // the joined screen may still show the last picture for a moment
    if (await p.evaluate(() => { const bt = document.querySelector('#promptBar #pAct1'); if (!bt || bt.disabled || !/Lock Bids/.test(bt.textContent)) return false; bt.click(); return true; })) return true; await p.waitForTimeout(200); } return false; };
  const noteOf = p => p.evaluate(() => { const el = document.getElementById('promptBar'), bt = el.querySelector('#pAct1'); return { text: el.innerText.replace(/\s+/g, ' ').trim(), locked: el.classList.contains('locked'), move: !el.classList.contains('idle'), lock: bt ? (bt.disabled ? 'greyed' : 'on') : 'none' }; });
  const rail = p => p.evaluate(() => (document.getElementById('waitRail') || {}).innerText || '');
  const crOn = p => p.evaluate(() => window.ROBOCUS_GAME.G.teams.map(t => t.credits).join(','));
  const sync = async (what) => { await host.waitForTimeout(1200); const h = (await hs()).cr.join(','); for (const [n, p] of [['A', A], ['B', B], ['C', C]]) { const c = await crOn(p); if (c !== h) bad.push(what + ': ' + n + ' shows credits ' + c + ', host ' + h); } };
  const say = (p, re) => p.evaluate(src => new RegExp(src).test(document.body.innerText), re.source);
  // get through Intrigue (empty hands everywhere: no schemes, no reaction windows) into the Market, bots still frozen
  await host.evaluate(() => { window.ROBOCUS_DEBUG.G.teams.forEach(t => { t.hand = []; }); });
  for (let k = 0; k < 120; k++) {
    const g = await host.evaluate(() => { const D = window.ROBOCUS_DEBUG, G = D.G; return { ph: G.phase, turn: G.intrigueTurn, open: D.mktOpen() }; });
    if (g.open) break;
    if (g.ph === 'intrigue' && g.turn >= 0) await actOn(seatOf[g.turn], 'endTurn');
    for (const p of all) await p.evaluate(() => { const bt = [...document.querySelectorAll('#promptBar.qmode [data-rk]')].find(x => /Refuse|OK|Pass/.test(x.textContent)); if (bt && !bt.disabled) bt.click(); });
    await host.waitForTimeout(500);
  }
  if (!(await hs()).open) { console.log('FAIL: never reached the Market', JSON.stringify(await hs())); await b.close(); process.exit(1); }
  // answer any AI offer (Refuse), then a known table: 10 Cr each, no bids, no Stash
  for (let k = 0; k < 6; k++) { for (const p of all) await p.evaluate(() => { const bt = [...document.querySelectorAll('#promptBar.qmode [data-rk]')].find(x => /Refuse/.test(x.textContent)); if (bt && !bt.disabled) bt.click(); }); await host.waitForTimeout(600); }
  await host.evaluate(() => { const D = window.ROBOCUS_DEBUG, G = D.G; G.teams.forEach(t => { t.credits = 10; t.stash = []; }); G.ps.forEach(P => { P.bids = [0, 0, 0, 0, 0]; }); G.gather = null; D.updateHud(); });
  await host.waitForTimeout(1500);
  console.log('start: ' + JSON.stringify(await hs()));
  // 0. Skip on C with bids above its credits
  await host.evaluate(() => { const G = window.ROBOCUS_DEBUG.G; G.ps[3].bids = [0, 0, 6, 6, 0]; window.ROBOCUS_GAME.skipSeat(3); });
  let s = await hs(); console.log('0 skip C (bids 6+6, 10 Cr): ' + JSON.stringify({ bids: s.bids[3], locked: s.locked }));
  if (s.bids[3] !== '0+0+6+4' || !s.locked.includes(3)) bad.push('Skip did not lower C\'s bids to fit and lock it: ' + JSON.stringify(s));
  await actOn(C, 'bid', 3, 'minus'); await host.waitForTimeout(800); s = await hs();
  if (s.locked.includes(3)) bad.push('C changed a bid after the Skip and is still locked');
  // 1. bids and locks
  await actOn(A, 'bid', 0, 'plus'); await actOn(A, 'bid', 0, 'plus'); await actOn(A, 'bid', 0, 'plus');
  for (let k = 0; k < 9; k++) await actOn(B, 'bid', 1, 'plus');
  await host.waitForTimeout(1200);
  if (!await lockOn(H)) bad.push('no Lock Bids on the host'); await host.waitForTimeout(300);
  if (!await lockOn(A)) bad.push('no Lock Bids on A'); if (!await lockOn(B)) bad.push('no Lock Bids on B');
  await until(host, () => { const G = window.ROBOCUS_DEBUG.G; return G.gather && [0, 1, 2].every(s => G.gather.done[s]); }, 8000); await host.waitForTimeout(1200);
  s = await hs(); const nA = await noteOf(A);
  console.log('1 H, A, B locked: ' + JSON.stringify(s) + '\n   A note: ' + nA.text + (nA.locked ? ' [LOCKED IN]' : ''));
  await shot(A, 'joined-A-1-locked.png'); await noteShot(A, 'joined-A-1-note-locked.png');
  if (JSON.stringify(s.locked.sort()) !== '[0,1,2]' || !nA.locked || !/A change or a trade unlocks you/.test(nA.text)) bad.push('step 1: ' + JSON.stringify(s) + ' A: ' + nA.text);
  // 2. B gives A 2 Cr through the deal panel; A accepts in its note
  const before2 = await hs();
  await B.evaluate(() => { const bt = document.querySelector('#promptBar [data-trade="1"]'); if (bt) bt.click(); });
  if (!await until(B, () => { const d = document.getElementById('dealModal'); return d && !d.hidden; }, 8000)) bad.push('no deal panel on B');
  for (let k = 0; k < 2; k++) await B.evaluate(() => { const bt = document.querySelector('#dealModal [data-cr="give"][data-d="1"]'); if (bt) bt.click(); });
  await shot(B, 'joined-B-2-deal-panel.png');
  const mid = await hs(); console.log('2 B\'s panel open: deals ' + JSON.stringify(mid.deals));
  await B.evaluate(() => { const bt = document.querySelector('#dealModal [data-k="lock"]'); if (bt) bt.click(); });
  if (!await until(A, () => document.getElementById('promptBar').classList.contains('qmode'), 8000)) bad.push('A got no trade offer in the note');
  await A.waitForTimeout(1000); await shot(A, 'joined-A-2-offer-while-bidding.png'); await noteShot(A, 'joined-A-2-note-offer.png');
  const accepted = await press(A, 'ivModal', /Accept/);
  await until(host, () => window.ROBOCUS_DEBUG.G.teams[1].credits === 12, 8000); await host.waitForTimeout(1500);
  const after2 = await hs(), nB = await noteOf(B), nA2 = await noteOf(A), rails = await Promise.all([H, A, B, C].map(rail));
  console.log('   accept: ' + accepted + '\n   host before: ' + JSON.stringify(before2) + '\n   host after:  ' + JSON.stringify(after2) + '\n   B note: ' + nB.text + ' · Lock ' + nB.lock + '\n   A note: ' + nA2.text);
  await shot(B, 'joined-B-2-bids-too-high.png'); await noteShot(B, 'joined-B-2-note-bids-too-high.png');
  if (after2.cr[1] !== 12 || after2.cr[2] !== 8) bad.push('the trade did not move 2 Cr from B to A: ' + after2.cr);
  if (after2.locked.includes(1) || after2.locked.includes(2) || !after2.locked.includes(0)) bad.push('after the trade: A and B should be unlocked, H still locked: ' + after2.locked);
  if (!nA2.move || nA2.locked || !/Market: trade and bid/.test(nA2.text)) bad.push('A\'s note is not back to YOUR MOVE: ' + nA2.text);
  if (nB.lock !== 'greyed' || !/more than your credits/.test(nB.text)) bad.push('B\'s bids are above its credits but Lock is not greyed: ' + nB.text);
  rails.forEach((r, k) => { const who = ['H', 'A', 'B', 'C'][k]; if (!/WAITING FOR 3/.test(r)) bad.push(who + '\'s waiting list after the trade: ' + r.replace(/\s+/g, ' ').slice(0, 200)); });
  if (!await say(A, /Your trade with .* went through, so your bids are not locked any more/)) bad.push('A has no unlock line');
  await sync('after the trade');
  await actOn(B, 'lockBids'); await host.waitForTimeout(1000);
  if ((await hs()).locked.includes(2)) bad.push('B locked with bids above its credits');
  if (!await say(B, /Your bids add up to 9 Cr, but you have 8 Cr\. Lower them, then lock/)) bad.push('B has no "lower them" line');
  await actOn(B, 'bid', 1, 'minus'); await host.waitForTimeout(1200);
  if (!await lockOn(B)) bad.push('B could not lock after lowering its bid: ' + JSON.stringify(await noteOf(B)) + ' ' + JSON.stringify(await hs()));
  // 3. an open deal at the last lock
  await host.waitForTimeout(800); if (!await lockOn(A)) bad.push('A could not lock again');
  await host.waitForTimeout(1000);
  await A.evaluate(() => { const bt = document.querySelector('#promptBar [data-trade="3"]'); if (bt) bt.click(); });
  if (!await until(A, () => { const d = document.getElementById('dealModal'); return d && !d.hidden; }, 8000)) bad.push('no deal panel on A');
  await host.waitForTimeout(800);
  if (!await lockOn(C)) bad.push('no Lock Bids on C');
  // T47 (Kev, 21 Nov: "Cancel the open trade and go on"): the last lock no longer waits; A's panel closes, both get a line
  await until(host, () => { const G = window.ROBOCUS_DEBUG.G; return !!(G.marketResolved || G.marketAuction); }, 10000);
  const held = await hs(), panelA = await A.evaluate(() => { const d = document.getElementById('dealModal'); return !!d && !d.hidden; });
  console.log('3 last lock with A\'s panel open: ' + JSON.stringify(held) + ' · A\'s panel ' + (panelA ? 'STILL OPEN' : 'closed'));
  await shot(A, 'joined-A-3-market-closed.png');
  if (held.open || panelA) bad.push('the last lock did not close A\'s open deal and go on: ' + JSON.stringify(held) + ' panel ' + panelA);
  if (!await say(A, /The Market closed.*called off\. No deal, nothing moved/)) bad.push('A has no "the Market closed" line');
  if (!await say(C, /The Market closed.*called off\. No deal, nothing moved/)) bad.push('C has no "the Market closed" line');
  await until(host, () => !!window.ROBOCUS_DEBUG.G.marketResolved, 15000);
  const res = await host.evaluate(() => { const G = window.ROBOCUS_DEBUG.G; return { resolved: !!G.marketResolved, results: (G.marketResults || []).map(r => [r.winner, r.price]), cr: G.teams.map(t => t.credits) }; });
  console.log('   No deal → ' + JSON.stringify(res));
  if (!res.resolved) bad.push('the lots did not resolve after the open deal closed');
  else {
    if (JSON.stringify(res.results[0]) !== '[1,3]' || JSON.stringify(res.results[1]) !== '[2,8]') bad.push('results: ' + JSON.stringify(res.results));
    if (res.cr[1] !== 9 || res.cr[2] !== 0) bad.push('credits after the lots: ' + res.cr + ' (want A 9, B 0)');
  }
  await sync('after the lots');
  // 4. too late
  await actOn(A, 'trade', 2); await actOn(A, 'bid', 2, 'plus'); await host.waitForTimeout(1500);
  const lateDeal = await A.evaluate(() => { const d = document.getElementById('dealModal'); return !!d && !d.hidden; });
  const lateA = await say(A, /Too late: the Market bids are closed/), lateB = await say(A, /Too late: the bids on the lots already went through/);
  console.log('4 late trade / bid from A: deal panel ' + (lateDeal ? 'OPENED' : 'none') + ', lines: ' + lateA + ' / ' + lateB);
  if (lateDeal || !lateA || !lateB) bad.push('a late trade or bid was not refused with a line');
  const desync = await Promise.all([A, B, C].map(p => p.evaluate(() => window.ROBOCUS_GAME.desyncs)));
  console.log('desyncs on A, B, C: ' + desync.join(', '));
  if (desync.some(x => x)) bad.push('desyncs ' + desync);
  if (errs.length) bad.push(errs.length + ' page errors: ' + errs.slice(0, 3).join(' | '));
  console.log(bad.length ? 'FAIL:\n  ' + bad.join('\n  ') : 'OK');
  await b.close(); process.exit(bad.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
