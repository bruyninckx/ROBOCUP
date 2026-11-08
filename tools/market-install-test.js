// ROBOCUS 2.0 regression test: parts won in the Market are never lost (Kev's playtest, 8 Nov: a robot and two parts won in the
// same auction by a team with no robot; the parts showed "Click a Robot Bay" but could not be fitted and vanished).
// Drives seat 0 as a person in prototypes/tabletop-2.html with Playwright (real canvas clicks on the bay), plus the AI path.
//   node tools/market-install-test.js            (exit code 1 on a failure)
// Needs playwright (npm install; npx playwright install chromium). planck: node_modules/planck or vendor/planck-1.4.3.min.js.
'use strict';
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');
const PLANCK = ['node_modules/planck/dist/planck.min.js', 'vendor/planck-1.4.3.min.js'].map(f => path.join(ROOT, f)).find(f => fs.existsSync(f));
let fails = 0;
const check = (ok, what) => { console.log((ok ? 'ok   ' : 'FAIL ') + what); if (!ok) fails++; };

async function page(b) {
  const p = await b.newPage({ viewport: { width: 1400, height: 1000 } });
  p.errs = []; p.on('pageerror', e => p.errs.push(e.message));
  if (PLANCK) await p.route(/planck(\.min)?\.js/, r => r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(PLANCK) }));
  await p.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  await p.goto('file://' + path.join(ROOT, 'prototypes/tabletop-2.html') + '?seed=11');
  await p.waitForFunction(() => window.ROBOCUS_DEBUG && window.ROBOCUS_DEBUG.G);
  return p;
}
// Kev's case: seat 0 has no robot, wins a level 1 robot + Laser drone + Power kit in one auction
async function setupMarket(p, stash) {
  await p.evaluate(stash => {
    const D = window.ROBOCUS_DEBUG, G = D.G, t = G.teams[0];
    t.robots = []; t.stash = stash.slice(); t.credits = 20;
    G.teams.forEach(o => { if (o.i) o.credits = 0; });
    G.phase = 'market'; G.marketStage = 'lots'; G.round = 2; G.marketResolved = false; G.marketAuction = null;
    G.market = [D.robotLot('Whirlwind'), 'p_laser', 'crew:mechanic:99', 'p_powerkit'];
    D.LOTS['crew:mechanic:99'] = D.LOTS['crew:mechanic:99'] || { name: 'Mechanic', icon: '🔧', text: '', crew: 'mechanic' };
    G.ps = G.ps || [{}, {}, {}, {}]; G.ps[0] = G.ps[0] || {}; G.ps[0].install = []; G.ps[0].bids = [5, 3, 0, 1, 0];
    D.resolveMarket();
  }, stash);
  await p.waitForFunction(() => { const G = window.ROBOCUS_DEBUG.G; return G.marketResolved && !G.marketAuction; }, null, { timeout: 15000 });
  await p.evaluate(() => window.ROBOCUS_DEBUG.updateHud()); await p.waitForTimeout(400);
}
const state = p => p.evaluate(() => { const G = window.ROBOCUS_DEBUG.G, t = G.teams[0]; return { robots: t.robots.map(r => ({ name: r.name, parts: (r.parts || []).slice() })), stash: (t.stash || []).slice(), install: (G.ps[0].install || []).map(x => x.lot), trim: !!G.ps[0].stashTrim, phase: G.phase, stage: G.marketStage, results: (G.marketResults || []).map(r => r.target), prompt: (document.getElementById('promptBar') || {}).innerText || '' }; });
async function clickBay(p, name) {   // a real click on the robot's bay on the board
  const pt = await p.evaluate(name => {
    const D = window.ROBOCUS_DEBUG, r = D.hitRegions.slice().reverse().find(q => (q.kind === 'bay' || q.kind === 'bay_action') && q.robot && q.robot.name === name && (q.team == null || q.team === 0));
    if (!r) return null; const s = D.worldToScreen(r.x + r.w / 2, r.y + Math.min(30, r.h / 2)); return s;
  }, name);
  if (!pt) return false;
  await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(300); return true;
}

(async () => {
  const b = await chromium.launch();
  // 1. fit both parts by clicking the new robot's bay
  { const p = await page(b); await setupMarket(p, []);
    let s = await state(p);
    check(s.robots.length === 1 && s.robots[0].name === 'Whirlwind', 'case 1: the new robot is in the garage');
    check(s.install.join() === 'p_laser,p_powerkit', 'case 1: both parts wait for a bay (' + s.install.join() + ')');
    check(/Install Upgrade/.test(s.prompt), 'case 1: install prompt shown');
    check(await clickBay(p, 'Whirlwind'), 'case 1: bay of Whirlwind found on the board');
    await clickBay(p, 'Whirlwind');
    s = await state(p);
    check(s.robots[0].parts.join() === 'laser,powerkit', 'case 1: both fitted on Whirlwind (' + s.robots[0].parts.join() + ')');
    check(!s.install.length && !s.stash.length, 'case 1: nothing left over');
    check(!p.errs.length, 'case 1: no page errors ' + p.errs.join('; ')); await p.close(); }
  // 2. continue without fitting: both go to the Stash, with a log line
  { const p = await page(b); await setupMarket(p, []);
    await p.evaluate(() => window.ROBOCUS_DEBUG.act('continueMarket')); await p.waitForTimeout(300);
    const s = await state(p), log = await p.evaluate(() => (window.ROBOCUS_DEBUG.PT.game ? window.ROBOCUS_DEBUG.PT.game.events : []).filter(e => e.k === 'msg' && /keeps .* in its Stash/.test(e.text)).length);
    check(s.stash.sort().join() === 'p_laser,p_powerkit', 'case 2: unfitted parts in the Stash (' + s.stash.join() + ')');
    check(!s.install.length && log === 1, 'case 2: install queue empty, one log line');
    check(s.stage === 'host', 'case 2: the game went on to the host bid (' + s.stage + ')');
    check(!p.errs.length, 'case 2: no page errors ' + p.errs.join('; ')); await p.close(); }
  // 3. continue with a nearly full Stash: the stash-trim prompt, then on
  { const p = await page(b); await setupMarket(p, ['p_medic', 'p_repair', 'p_shield']);
    await p.evaluate(() => window.ROBOCUS_DEBUG.act('continueMarket')); await p.waitForTimeout(300);
    let s = await state(p);
    check(s.stash.length === 5 && s.trim && /Stash full/.test(s.prompt), 'case 3: 5 parts, stash-trim prompt shown');
    check(s.stage === 'lots' || s.stage !== 'host', 'case 3: waits for the trim');
    await p.click('[data-trim="0"]'); await p.waitForTimeout(300);
    s = await state(p);
    check(s.stash.length === 4 && !s.trim, 'case 3: one sold to the bank, 4 kept');
    await p.evaluate(() => window.ROBOCUS_DEBUG.act('continueMarket')); await p.waitForTimeout(300);
    s = await state(p); check(s.stage === 'host', 'case 3: then on to the host bid');
    check(!p.errs.length, 'case 3: no page errors ' + p.errs.join('; ')); await p.close(); }
  // 4. AI path: an AI team with no robot wins a robot and two parts: fitted on the new robot, nothing lost
  { const p = await page(b);
    const r = await p.evaluate(() => {
      const D = window.ROBOCUS_DEBUG, G = D.G, t = G.teams[2]; t.robots = []; t.stash = [];
      const id = D.robotLot('Whirlwind');
      const A = { wins: [{ idx: 1, lot: 'p_laser', team: 2, price: 3 }, { idx: 0, lot: id, team: 2, price: 5 }, { idx: 3, lot: 'p_powerkit', team: 2, price: 1 }], results: [{}, {}, {}, {}] };
      D.applyMarketWins(A);
      return { robots: t.robots.map(x => x.name + ':' + (x.parts || []).join('+')), stash: t.stash.slice(), targets: A.results.map(x => x.target || '') };
    });
    check(r.robots.join() === 'Whirlwind:laser+powerkit' || (r.robots.length === 1 && r.robots[0].split(':')[1].split('+').filter(Boolean).length + r.stash.length === 2), 'case 4 (AI): ' + r.robots.join() + ' stash [' + r.stash.join() + ']');
    check(!p.errs.length, 'case 4: no page errors ' + p.errs.join('; ')); await p.close(); }
  await b.close();
  console.log(fails ? fails + ' FAILED' : 'all passed');
  process.exit(fails ? 1 : 0);
})();
