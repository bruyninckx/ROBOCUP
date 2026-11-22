// T26 (Kev, 17 Nov: "lets do the open auction during the betting, and when everybody locks bids, the open auction is done"):
// the Market's open market and sealed bids in one step, on one screen (solo: you against three AI teams), at 1600x900 and 1280x720.
//   1. the Market opens with the lots biddable at once: the note says what you can do, has 🤝 buttons and Lock Bids; the pit
//      shows the lots with their − / +; no "Start the auction";
//   2. bid on two lots (the pit's +), sell a Stash part to the bank on the Stash card while bidding: credits up, bids kept;
//   3. an AI offer while bidding (Rust Rivets offers a robot): it lands in the note; Accept: the robot and the credits move, bids kept;
//   4. a trade (the deal panel: you give credits to an AI team) leaves your bids above your credits: the note says so, Lock is
//      greyed, a lock sent anyway is refused with a line; lowering the bids makes Lock work;
//   5. Lock → the lots resolve with the bids you made (results, credits paid);
//   6. after the lots: a trade or a bid is refused with a "Too late" line.
// "A trade after locking unlocks you" needs a second person who has not locked: market-step-online.js.
//   node tools/mp-scenario/market-step.js [screenshotFolder]
const path = require('path'), fs = require('fs');
(async () => {
  const shots = process.argv[2]; if (shots) fs.mkdirSync(shots, { recursive: true });
  const b = await require('./launch.js')(require('playwright'));
  const PLK = require('../planck-local.js'), PL = PLK.find();
  const bad = [], errs = [];
  const shot = (p, n) => shots ? p.screenshot({ path: path.join(shots, n) }) : null;
  const noteShot = (p, n) => shots ? p.locator('#promptBar').screenshot({ path: path.join(shots, n) }) : null;
  const until = async (p, f, ms = 20000, arg) => { for (let t = 0; t < ms; t += 100) { if (await p.evaluate(f, arg)) return true; await p.waitForTimeout(100); } return false; };
  const st = p => p.evaluate(() => { const D = window.ROBOCUS_DEBUG, G = D.G, t = G.teams[0];
    return { phase: G.phase, stage: G.marketStage, auction: !!G.marketAuction, resolved: !!G.marketResolved, cr: t.credits, bids: (G.ps[0].bids || []).slice(0, 4), robots: t.robots.map(r => r.name), stash: (t.stash || []).slice(), rust: G.teams[1].credits + '/' + G.teams[1].robots.length };
  });
  const note = p => p.evaluate(() => { const el = document.getElementById('promptBar'), r = el.getBoundingClientRect();
    const btns = [...el.querySelectorAll('button')].map(x => { const q = x.getBoundingClientRect(); return { t: x.textContent.trim(), off: x.disabled, cut: q.bottom > r.bottom + 1 || q.right > r.right + 1 || q.top < r.top - 1 }; });
    return { text: el.innerText.replace(/\s+/g, ' ').trim(), move: !el.classList.contains('idle'), locked: el.classList.contains('locked'), btns }; });
  const lastMsgs = (p, n = 6) => p.evaluate(n => window.ROBOCUS_DEBUG.PT.game.events.filter(e => e.k === 'msg').slice(-n).map(e => e.text), n);
  async function open(w, h) {
    const p = await b.newPage({ viewport: { width: w, height: h } }); p.on('pageerror', e => errs.push(w + 'x' + h + ': ' + e.message));
    await PLK.route(p, PL);
    await p.goto(require('url').pathToFileURL(path.resolve('prototypes/tabletop-2.html')).href + '?seed=13&bal=' + encodeURIComponent(JSON.stringify({ tradeFloor: false }))); await p.waitForTimeout(800);   // T55: the old Market flow (deal panel, offers in the note); the floor: trading-floor.js
    await p.evaluate(() => { window.__noSlide = true; window.__noAuto = true; });
    await p.click('#pAct2'); await p.waitForTimeout(1500); await p.mouse.move(5, 5);
    // a quiet table: empty hands (no schemes, no reaction windows), no Stash, 10 Cr each; Rust Rivets has 3 robots and 3 Cr
    await p.evaluate(() => { const D = window.ROBOCUS_DEBUG, G = D.G;
      G.teams.forEach(t => { t.hand = []; t.stash = []; t.credits = 10; t.debt = 0; });
      D.updateHud(); D.act('upkeepDone'); });
    if (!await until(p, () => { const G = window.ROBOCUS_DEBUG.G; return G.phase === 'intrigue' && G.intrigueTurn === 0 || G.phase === 'market'; })) bad.push(w + 'x' + h + ': no Intrigue turn');
    await p.evaluate(() => { const D = window.ROBOCUS_DEBUG; if (D.G.phase === 'intrigue') D.act('endTurn'); });
    if (!await until(p, () => window.ROBOCUS_DEBUG.mktOpen())) bad.push(w + 'x' + h + ': the Market did not open');
    // AI offers at the start (none expected on this quiet table); answer anything with Refuse
    for (let k = 0; k < 10; k++) { if (!await p.evaluate(() => !!(window.ROBOCUS_DEBUG.RX.q && !window.ROBOCUS_DEBUG.RX.q.over))) break; await p.waitForTimeout(900); await p.evaluate(() => { const bt = [...document.querySelectorAll('#promptBar.qmode [data-rk]')].find(x => /Refuse/.test(x.textContent)); if (bt) bt.click(); }); await p.waitForTimeout(400); }
    return p;
  }
  // a click on the pit's + of lot k (the canvas hit region, as a player clicks it)
  const plus = (p, k, kind = 'market_plus') => p.evaluate(([k, kind]) => { const D = window.ROBOCUS_DEBUG, h = D.hitRegions.find(x => x.kind === kind && x.idx === k); if (!h) return null; return D.worldToScreen ? (() => { const s = D.worldToScreen(h.x + h.w / 2, h.y + h.h / 2); return s; })() : null; }, [k, kind]);
  async function clickPit(p, k, kind) { const pt = await plus(p, k, kind); if (!pt) return false; await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(250); await p.mouse.move(5, 5); return true; }

  for (const [w, h] of [[1600, 900], [1280, 720]]) {
    const tag = w + 'x' + h, p = await open(w, h);
    // 1. the merged step
    let s = await st(p), n = await note(p);
    await shot(p, tag + '-1-market-step.png'); await noteShot(p, tag + '-1-note-your-move.png');
    console.log(tag + ' 1 open: ' + JSON.stringify(s) + '\n   note: ' + n.text + '\n   buttons: ' + n.btns.map(x => x.t + (x.cut ? ' (CUT)' : '')).join(' | '));
    if (s.stage !== 'lots' || s.auction || s.resolved) bad.push(tag + ': not in the merged step: ' + JSON.stringify(s));
    if (!/Bid on the lots in secret/.test(n.text) || !/trade and sell while you bid/.test(n.text)) bad.push(tag + ': note text: ' + n.text);
    if (!n.btns.some(x => /Lock Bids/.test(x.t) && !x.off) || n.btns.filter(x => /🤝/.test(x.t)).length !== 3) bad.push(tag + ': note buttons: ' + n.btns.map(x => x.t).join(' | '));
    if (n.btns.some(x => x.cut)) bad.push(tag + ': a note button is cut off');
    if (/Start the auction/.test(n.text)) bad.push(tag + ': Start the auction is still there');
    if (!n.move) bad.push(tag + ': note not YOUR MOVE');
    // 2. bid on lots 0 and 1 in the pit, then sell a Stash part on the Stash card
    const ok0 = await clickPit(p, 0), ok1 = await clickPit(p, 1); await clickPit(p, 1);
    if (!ok0 || !ok1) bad.push(tag + ': no + on the lots in the pit');
    const part = await p.evaluate(() => { const D = window.ROBOCUS_DEBUG, id = Object.keys(D.LOTS).find(k => D.LOTS[k].part && !D.LOTS[k].legend); D.G.teams[0].stash = [id]; D.updateHud(); return id; });
    await p.waitForTimeout(300);
    const s2a = await st(p);
    const sold = await p.evaluate(() => { const bt = document.querySelector('#stashCard [data-sell]'); if (!bt) return false; bt.click(); return true; });
    await p.waitForTimeout(400); const s2 = await st(p);
    console.log(tag + ' 2 bids + bank sale: ' + JSON.stringify(s2a) + ' → ' + JSON.stringify(s2));
    if (JSON.stringify(s2a.bids) !== JSON.stringify([1, 2, 0, 0])) bad.push(tag + ': pit bids ' + JSON.stringify(s2a.bids));
    if (!sold || s2.stash.length || s2.cr <= s2a.cr || JSON.stringify(s2.bids) !== JSON.stringify(s2a.bids) || s2.stage !== 'lots') bad.push(tag + ': bank sale while bidding: ' + JSON.stringify(s2));
    // 3. an AI offer while bidding: Rust Rivets (3 robots, 3 Cr) offers you a robot (you have one)
    await p.evaluate(() => { const D = window.ROBOCUS_DEBUG, G = D.G, R = G.teams[1], r0 = R.robots[0];
      G.teams[2].robots.length = Math.min(G.teams[2].robots.length, 1); G.teams[3].robots.length = Math.min(G.teams[3].robots.length, 1);
      R.robots = [r0]; for (let k = 1; k < 3; k++) { const r = JSON.parse(JSON.stringify(r0)); r.id = 'T26-' + k; R.robots.push(r); } R.credits = 3;
      window.__offer = 'open'; D.openMarketAI().then(() => { window.__offer = 'done'; }); });
    let q = null; for (let t = 0; t < 8000 && !q; t += 100) { q = await p.evaluate(() => { const pb = document.getElementById('promptBar'); return pb.classList.contains('qmode') ? pb.innerText.replace(/\s+/g, ' ') : null; }); if (!q) await p.waitForTimeout(100); }
    await p.waitForTimeout(900); await shot(p, tag + '-3-offer-while-bidding.png'); await noteShot(p, tag + '-3-note-offer.png');
    const s3a = await st(p);
    const acc = await p.evaluate(() => { const bt = [...document.querySelectorAll('#promptBar.qmode [data-rk]')].find(x => /Accept/.test(x.textContent)); if (!bt) return false; bt.click(); return true; });
    await until(p, () => window.__offer === 'done', 8000); await p.waitForTimeout(300);
    const s3 = await st(p);
    console.log(tag + ' 3 offer: ' + (q || 'NO OFFER') + '\n   accept: ' + JSON.stringify(s3a) + ' → ' + JSON.stringify(s3));
    if (!q || !acc) bad.push(tag + ': no AI offer in the note while bidding');
    else if (s3.robots.length !== s3a.robots.length + 1 || s3.cr >= s3a.cr || JSON.stringify(s3.bids) !== JSON.stringify(s3a.bids) || s3.stage !== 'lots') bad.push(tag + ': accepting the offer: ' + JSON.stringify(s3));
    // 4. a trade (deal panel) that leaves the bids above the credits
    await p.evaluate(() => { const D = window.ROBOCUS_DEBUG, G = D.G; G.teams[0].credits = 6; G.ps[0].bids = [3, 3, 0, 0, 0]; D.updateHud(); });
    await until(p, () => !!document.querySelector('#promptBar [data-trade="2"]'), 5000);   // the answered offer's ✓ stays in the note a moment
    await p.evaluate(() => { const bt = document.querySelector('#promptBar [data-trade="2"]'); if (bt) bt.click(); });
    if (!await until(p, () => { const d = document.getElementById('dealModal'); return d && !d.hidden; }, 5000)) bad.push(tag + ': no deal panel; note: ' + JSON.stringify(await note(p)) + ' ' + (await lastMsgs(p, 4)).join(' / ') + ' ' + JSON.stringify(await p.evaluate(() => { const D = window.ROBOCUS_DEBUG, G = D.G; return { trading: G.teams[0].trading, deals: G.mDeals, open: D.mktOpen(), offer: window.__offer, q: !!(D.RX.q && !D.RX.q.over), dm: (document.getElementById('dealModal') || {}).hidden }; })));
    for (let k = 0; k < 4; k++) await p.evaluate(() => { const bt = document.querySelector('#dealModal [data-cr="give"][data-d="1"]'); if (bt) bt.click(); });
    await p.waitForTimeout(200); await shot(p, tag + '-4-deal-panel-while-bidding.png');
    await p.evaluate(() => { const bt = document.querySelector('#dealModal [data-k="lock"]'); if (bt) bt.click(); });
    await p.waitForTimeout(600);
    const s4 = await st(p); n = await note(p);
    await noteShot(p, tag + '-4-note-bids-too-high.png');
    const lockBtn = n.btns.find(x => /Lock Bids/.test(x.t));
    console.log(tag + ' 4 trade (4 Cr to Moss): ' + JSON.stringify(s4) + '\n   note: ' + n.text + ' · Lock ' + (lockBtn && lockBtn.off ? 'greyed' : 'ACTIVE'));
    if (s4.cr !== 2) bad.push(tag + ': the trade did not go through (credits ' + s4.cr + ')');
    if (!/more than your credits/.test(n.text) || !lockBtn || !lockBtn.off) bad.push(tag + ': bids above credits: the note does not block Lock');
    await p.evaluate(() => window.ROBOCUS_DEBUG.act('lockBids')); await p.waitForTimeout(300);
    const s4b = await st(p), m4 = (await lastMsgs(p, 3)).join(' / ');
    console.log('   lock sent anyway: ' + JSON.stringify({ stage: s4b.stage, auction: s4b.auction }) + ' · ' + m4);
    if (s4b.auction || s4b.resolved || !/Lower them, then lock/.test(m4)) bad.push(tag + ': a lock with bids above the credits went through');
    // lower the bids with the pit's −: 3+3 → 1+1
    for (let k = 0; k < 2; k++) { await clickPit(p, 0, 'market_minus'); await clickPit(p, 1, 'market_minus'); }
    n = await note(p); const lb = n.btns.find(x => /Lock Bids/.test(x.t));
    if (!lb || lb.off) bad.push(tag + ': Lock still greyed after lowering the bids: ' + JSON.stringify(await st(p)));
    // 5. Lock (the note's button) → the lots resolve with these bids
    const before = await st(p);
    await p.evaluate(() => { const bt = document.querySelector('#promptBar #pAct1'); if (bt) bt.click(); });
    await until(p, () => { const G = window.ROBOCUS_DEBUG.G; return G.marketResolved || (G.marketAuction && G.marketAuction.tie); }, 15000);
    const res = await p.evaluate(() => { const G = window.ROBOCUS_DEBUG.G, A = G.marketAuction; return { resolved: !!G.marketResolved, tie: !!(A && A.tie), results: (G.marketResults || []).map(r => [r.winner, r.price]), cr: G.teams[0].credits }; });
    console.log(tag + ' 5 lock: ' + JSON.stringify(before) + ' → ' + JSON.stringify(res));
    if (!res.resolved && !res.tie) bad.push(tag + ': the lock did not resolve the lots');
    await shot(p, tag + '-5-results.png');
    // 6. too late
    await p.evaluate(() => { window.ROBOCUS_DEBUG.act('trade', 2); window.ROBOCUS_DEBUG.act('bid', 2, 'plus'); }); await p.waitForTimeout(300);
    const m6 = (await lastMsgs(p, 4)).join(' / '), dm = await p.evaluate(() => { const d = document.getElementById('dealModal'); return !!d && !d.hidden; });
    console.log(tag + ' 6 after the lots: ' + m6);
    if (dm || !/Too late: the Market bids are closed/.test(m6) || !/Too late: the bids on the lots/.test(m6)) bad.push(tag + ': a late trade or bid was not refused with a line');
    await p.close();
  }
  console.log(errs.length ? 'page errors:\n  ' + errs.join('\n  ') : 'no page errors');
  console.log(bad.length ? 'FAIL:\n  ' + bad.join('\n  ') : 'OK');
  await b.close(); process.exit(bad.length || errs.length ? 1 : 0);
})();
