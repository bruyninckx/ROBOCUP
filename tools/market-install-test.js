// ROBOCUS 2.0 regression test: parts won in the Market are never lost, and a won part goes on at once with Undo / Move.
// History: Kev's playtest, 8 Nov (a robot and two parts won in the same auction by a team with no robot; the parts showed
// "Click a Robot Bay" but could not be fitted and vanished). Since T12 (16 Nov) a part a person wins is fitted at once
// (its only robot with room, or the best-odds one), the note shows ↶ Undo for 5 s and ↪ <robot> to move it; Undo puts it
// back to "pick a robot or keep it in the Stash"; a late Undo is refused. Updated to that flow on 16 Nov (T14).
// Drives seat 0 as a person in prototypes/tabletop-2.html with Playwright (the note's own buttons, a real canvas click on the bay),
// plus the AI path.
//   node tools/market-install-test.js            (exit code 1 on a failure)
// Needs playwright (npm install --no-package-lock). planck: see tools/planck-local.js (PLANCK=, node_modules, vendor/).
'use strict';
const path = require('path');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');
const PLK = require('./planck-local.js'), PL = PLK.find();
let fails = 0;
const check = (ok, what) => { console.log((ok ? 'ok   ' : 'FAIL ') + what); if (!ok) fails++; };

async function page(b) {
  const p = await b.newPage({ viewport: { width: 1400, height: 1000 } });
  p.errs = []; p.on('pageerror', e => p.errs.push(e.message));
  await PLK.route(p, PL);
  await p.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  await p.goto(require('url').pathToFileURL(path.join(ROOT, 'prototypes/tabletop-2.html')).href + '?seed=11');
  await p.waitForFunction(() => window.ROBOCUS_DEBUG && window.ROBOCUS_DEBUG.G);
  await PLK.check(p, PL);
  return p;
}
// seat 0 wins the lots in `market` with `bids` (the others have no credits); `robots`: null = keep, [] = none, or names
async function setupMarket(p, { stash = [], robots = [], market, bids }) {
  await p.evaluate(([stash, robots, market, bids]) => {
    const D = window.ROBOCUS_DEBUG, G = D.G, t = G.teams[0];
    if (robots) { t.robots = []; for (const n of robots) D.applyLot(0, D.robotLot(n), null); }   // a robot lot puts a new robot in the garage
    t.robots.forEach(r => { r.parts = []; delete r.leg; delete r.rar; });
    t.stash = stash.slice(); t.credits = 20;
    G.teams.forEach(o => { if (o.i) o.credits = 0; });
    G.phase = 'market'; G.marketStage = 'lots'; G.round = 2; G.marketResolved = false; G.marketAuction = null;
    G.market = market.map(x => x[0] === '@' ? D.robotLot(x.slice(1)) : x);
    D.LOTS['crew:mechanic:99'] = D.LOTS['crew:mechanic:99'] || { name: 'Mechanic', icon: '🔧', text: '', crew: 'mechanic' };
    G.ps = G.ps || [{}, {}, {}, {}]; G.ps[0] = G.ps[0] || {}; G.ps[0].install = []; G.ps[0].fitUndo = []; G.ps[0].bids = bids.slice();
    D.resolveMarket();
  }, [stash, robots, market, bids]);
  await p.waitForFunction(() => { const G = window.ROBOCUS_DEBUG.G; return G.marketResolved && !G.marketAuction; }, null, { timeout: 15000 });
  await p.evaluate(() => window.ROBOCUS_DEBUG.updateHud()); await p.waitForTimeout(300);
}
const KEV = { market: ['@Whirlwind', 'p_laser', 'crew:mechanic:99', 'p_powerkit'], bids: [5, 3, 0, 1, 0] };   // Kev's 8 Nov case
const state = p => p.evaluate(() => { const D = window.ROBOCUS_DEBUG, G = D.G, t = G.teams[0]; return {
  robots: t.robots.map(r => ({ id: r.id, name: r.name, parts: (r.parts || []).slice(), leg: r.leg || null, rar: r.rar ? JSON.stringify(r.rar) : '' })),
  stash: (t.stash || []).slice(), install: (G.ps[0].install || []).map(x => x.lot), undo: (G.ps[0].fitUndo || []).map(x => ({ id: x.id, lot: x.lot, rid: x.rid })),
  trim: !!G.ps[0].stashTrim, phase: G.phase, stage: G.marketStage, results: (G.marketResults || []).map(r => r.target),
  prompt: (document.getElementById('promptBar') || {}).innerText || '',
  undoBtns: [...document.querySelectorAll('#promptBar [data-undo]')].map(b => +b.dataset.undo), mvBtns: [...document.querySelectorAll('#promptBar [data-mv]')].map(b => b.dataset.mv) }; });
// the 5 s window counts on the host's clock from the fit; a busy test PC can spend that in the setup, so start it again
// just before a click that must land inside it (the click itself is real)
const freshWindow = p => p.evaluate(() => { const G = window.ROBOCUS_DEBUG.G; (G.ps[0].fitUndo || []).forEach(r => { r.at = Date.now(); r.left = 5; }); window.ROBOCUS_DEBUG.updateHud(); });
// the note redraws every 250 ms (the Undo count) and flashes, so Playwright's pointer click never sees a stable button:
// a DOM click on the real button (its own onclick runs, as for a person), like mp-test does for the lobby
const press = async (p, sel) => { const ok = await p.evaluate(sel => { const b = document.querySelector(sel); if (b) b.click(); return !!b; }, sel); if (!ok) check(false, 'button ' + sel + ' on the note'); await p.waitForTimeout(300); };
const msgs = (p, re) => p.evaluate(src => (window.ROBOCUS_DEBUG.PT.game ? window.ROBOCUS_DEBUG.PT.game.events : []).filter(e => e.k === 'msg' && new RegExp(src).test(e.text)).length, re.source);
async function clickBay(p, name) {   // a real click on the robot's bay on the board
  const pt = await p.evaluate(name => {
    const D = window.ROBOCUS_DEBUG, r = D.hitRegions.slice().reverse().find(q => (q.kind === 'bay' || q.kind === 'bay_action') && q.robot && q.robot.name === name && (q.team == null || q.team === 0));
    if (!r) return null; return D.worldToScreen(r.x + r.w / 2, r.y + Math.min(30, r.h / 2));
  }, name);
  if (!pt) return false;
  await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(300); return true;
}

(async () => {
  console.log('market-install-test: planck ' + PL.source);
  const b = await chromium.launch();
  // 1. Kev's case: no robot, wins a robot and two parts: the robot arrives, both parts go on it at once, Undo shown
  { const p = await page(b); await setupMarket(p, KEV);
    let s = await state(p);
    check(s.robots.length === 1 && s.robots[0].name === 'Whirlwind', 'case 1: the new robot is in the garage');
    check(s.robots[0].parts.slice().sort().join() === 'laser,powerkit', 'case 1: both parts fitted at once (' + s.robots[0].parts.join() + ')');
    check(!s.install.length && !s.stash.length, 'case 1: nothing waits, nothing in the Stash');
    check(s.undo.length === 2 && s.undoBtns.length === 2 && /Undo/.test(s.prompt), 'case 1: the note shows Undo for each part (' + s.undoBtns.length + ')');
    check(!s.mvBtns.length, 'case 1: no Move (only one robot)');
    check(!p.errs.length, 'case 1: no page errors ' + p.errs.join('; ')); await p.close(); }
  // 2. Undo inside 5 s (a real click): the part comes off exactly, waits for a robot; a bay click fits it again (the old path)
  { const p = await page(b); await setupMarket(p, KEV);
    let s = await state(p); const before = s.robots[0], laser = s.undo.find(x => x.lot === 'p_laser');
    await freshWindow(p); await press(p, '#promptBar [data-undo="' + laser.id + '"]');
    s = await state(p);
    check(s.robots[0].parts.join() === 'powerkit' && s.robots[0].leg === before.leg, 'case 2: Undo takes the laser off (' + s.robots[0].parts.join() + ')');
    check(s.install.join() === 'p_laser' && !s.stash.length, 'case 2: the laser waits for a robot (' + s.install.join() + ')');
    check(s.undo.length === 1, 'case 2: the power kit can still be undone');
    check(await clickBay(p, 'Whirlwind'), 'case 2: bay of Whirlwind found on the board');
    s = await state(p);
    check(s.robots[0].parts.slice().sort().join() === 'laser,powerkit' && !s.install.length, 'case 2: a bay click fits it again (' + s.robots[0].parts.join() + ')');
    check(!p.errs.length, 'case 2: no page errors ' + p.errs.join('; ')); await p.close(); }
  // 3. Undo both, then Continue: both go to the Stash with a log line, on to the host bid; Undo restores rarity exactly
  { const p = await page(b); await setupMarket(p, KEV);
    let s = await state(p); const ids = s.undo.map(x => x.id);
    await freshWindow(p); for (const id of ids) await press(p, '#promptBar [data-undo="' + id + '"]');
    s = await state(p);
    check(!s.robots[0].parts.length && (!s.robots[0].rar || s.robots[0].rar === '{}') && !s.robots[0].leg, 'case 3: both off, the robot as it was (parts [' + s.robots[0].parts.join() + '], rar ' + (s.robots[0].rar || '-') + ')');
    await p.evaluate(() => window.ROBOCUS_DEBUG.act('continueMarket')); await p.waitForTimeout(300);
    s = await state(p);
    check(s.stash.slice().sort().join() === 'p_laser,p_powerkit', 'case 3: unfitted parts in the Stash (' + s.stash.join() + ')');
    check(!s.install.length && await msgs(p, /keeps .* in its Stash/) === 1, 'case 3: install queue empty, one log line');
    check(s.stage === 'host', 'case 3: the game went on to the host bid (' + s.stage + ')');
    check(!p.errs.length, 'case 3: no page errors ' + p.errs.join('; ')); await p.close(); }
  // 4. a nearly full Stash: undo both, continue: the stash-trim prompt, then on
  { const p = await page(b); await setupMarket(p, Object.assign({ stash: ['p_medic', 'p_repair', 'p_shield'] }, KEV));
    let s = await state(p);
    await freshWindow(p); for (const x of s.undo) await press(p, '#promptBar [data-undo="' + x.id + '"]');
    await p.evaluate(() => window.ROBOCUS_DEBUG.act('continueMarket')); await p.waitForTimeout(300);
    s = await state(p);
    check(s.stash.length === 5 && s.trim && /Stash full/.test(s.prompt), 'case 4: 5 parts, stash-trim prompt shown');
    check(s.stage !== 'host', 'case 4: waits for the trim');
    await p.click('[data-trim="0"]'); await p.waitForTimeout(300);
    s = await state(p);
    check(s.stash.length === 4 && !s.trim, 'case 4: one sold to the bank, 4 kept');
    await p.evaluate(() => window.ROBOCUS_DEBUG.act('continueMarket')); await p.waitForTimeout(300);
    s = await state(p); check(s.stage === 'host', 'case 4: then on to the host bid');
    check(!p.errs.length, 'case 4: no page errors ' + p.errs.join('; ')); await p.close(); }
  // 5. two robots with room: the part goes on one, Move (a real click) puts it on the other; then a late Undo is refused
  { const p = await page(b); await setupMarket(p, { robots: ['Whirlwind', 'Whirlwind'], market: ['p_laser', 'crew:mechanic:99', 'p_powerkit', 'p_shield'], bids: [3, 0, 0, 0, 0] });
    let s = await state(p);
    const on = s.robots.findIndex(r => r.parts.includes('laser'));
    check(s.robots.length === 2 && on >= 0 && s.robots.filter(r => r.parts.includes('laser')).length === 1, 'case 5: the laser is on one of the two robots');
    check(s.undo.length === 1 && s.mvBtns.length === 1, 'case 5: the note shows Undo and one Move (' + s.mvBtns.join() + ')');
    await freshWindow(p); await press(p, '#promptBar [data-mv]');
    s = await state(p);
    check(!s.robots[on].parts.includes('laser') && s.robots[1 - on].parts.includes('laser'), 'case 5: Move put it on the other robot');
    check(s.undo.length === 1 && s.undo[0].rid === s.robots[1 - on].id, 'case 5: Undo now points at the new robot');
    const id = s.undo[0].id;
    await p.evaluate(() => { const G = window.ROBOCUS_DEBUG.G; G.ps[0].fitUndo.forEach(r => { r.at = Date.now() - 6000; }); });   // the 5 s are over
    await p.evaluate(id => window.ROBOCUS_DEBUG.act('undoFit', id), id); await p.waitForTimeout(300);
    s = await state(p);
    check(s.robots[1 - on].parts.includes('laser') && !s.install.length && !s.stash.length, 'case 5: a late Undo is refused, the laser stays');
    check(await msgs(p, /Too late to change that/) >= 1, 'case 5: the player is told it is too late');
    check(!s.undoBtns.length, 'case 5: no Undo button left');
    check(!p.errs.length, 'case 5: no page errors ' + p.errs.join('; ')); await p.close(); }
  // 6. AI path: an AI team with no robot wins a robot and two parts: fitted on the new robot, nothing lost
  { const p = await page(b);
    const r = await p.evaluate(() => {
      const D = window.ROBOCUS_DEBUG, G = D.G, t = G.teams[2]; t.robots = []; t.stash = [];
      const id = D.robotLot('Whirlwind');
      const A = { wins: [{ idx: 1, lot: 'p_laser', team: 2, price: 3 }, { idx: 0, lot: id, team: 2, price: 5 }, { idx: 3, lot: 'p_powerkit', team: 2, price: 1 }], results: [{}, {}, {}, {}] };
      D.applyMarketWins(A);
      return { robots: t.robots.map(x => x.name + ':' + (x.parts || []).join('+')), stash: t.stash.slice(), targets: A.results.map(x => x.target || '') };
    });
    check(r.robots.join() === 'Whirlwind:laser+powerkit' || (r.robots.length === 1 && r.robots[0].split(':')[1].split('+').filter(Boolean).length + r.stash.length === 2), 'case 6 (AI): ' + r.robots.join() + ' stash [' + r.stash.join() + ']');
    check(!p.errs.length, 'case 6: no page errors ' + p.errs.join('; ')); await p.close(); }
  await b.close();
  console.log(fails ? fails + ' FAILED' : 'all passed');
  process.exit(fails ? 1 : 0);
})();
