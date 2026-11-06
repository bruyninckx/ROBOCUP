#!/usr/bin/env node
// node tools/layout-check.js 1366x768   (needs Playwright; screenshots + report.json in $LAYOUT_OUT or the temp folder)
// Layout check (6 Nov): drives the tabletop through every phase at one viewport size, screenshots each state, and reports
// help regions (canvas info) hidden under HTML overlays or off screen, plus modals that don't fit.
const { chromium } = require('playwright');
const [W, H] = (process.argv[2] || '1366x768').split('x').map(Number);
const OUT = require('path').join(process.env.LAYOUT_OUT || require('os').tmpdir() + '/robocus-layout', W + 'x' + H);
(async () => {
  require('fs').mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: W, height: H } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').join(__dirname, '..', 'prototypes', 'tabletop-prototype.html'));
  await p.waitForTimeout(600);
  const report = [];
  const check = async (name) => {
    await p.waitForTimeout(1600);   // camera settles
    await p.screenshot({ path: OUT + '/' + name + '.png' });
    const r = await p.evaluate(() => {
      const D = window.ROBOCUS_DEBUG, vw = innerWidth, vh = innerHeight;
      const rect = el => { if (!el || el.hidden || el.offsetParent === null && getComputedStyle(el).position !== 'fixed') return null; const r = el.getBoundingClientRect(); return r.width && r.height ? { x: r.left, y: r.top, w: r.width, h: r.height } : null; };
      const overlays = {};
      overlays.pill = rect(document.querySelector('.top-pill'));
      overlays.prompt = rect(document.getElementById('promptBar'));
      overlays.stash = rect(document.getElementById('stashCard'));
      overlays.log = rect(document.getElementById('logPanel'));
      overlays.handTab = rect(document.getElementById('handTab'));
      const hs = document.getElementById('handStage'); if (hs && hs.classList.contains('open')) overlays.hand = rect(document.getElementById('handTray'));
      const inter = (a, c) => { const x = Math.max(a.x, c.x), y = Math.max(a.y, c.y), x2 = Math.min(a.x + a.w, c.x + c.w), y2 = Math.min(a.y + a.h, c.y + c.h); return x2 > x && y2 > y ? (x2 - x) * (y2 - y) : 0; };
      const hidden = [], off = [];
      const fight = D.G.phase === 'fight';
      for (const h of D.helpRegions) {
        if (fight && (h.x < -455 || h.x + h.w > 455 || h.y < -285 || h.y + h.h > 285)) continue;   // in a fight only the arena matters
        const a = D.worldToScreen(h.x, h.y), c = D.worldToScreen(h.x + h.w, h.y + h.h), R = { x: a.x, y: a.y, w: c.x - a.x, h: c.y - a.y };
        if (R.w < 2 || R.h < 2) continue;
        for (const [k, o] of Object.entries(overlays)) if (o && inter(R, o) > 0.3 * R.w * R.h) hidden.push(k + ': ' + h.title.replace(/<[^>]+>/g, '').slice(0, 40));
        if (R.x < -2 || R.y < -2 || R.x + R.w > vw + 2 || R.y + R.h > vh + 2) off.push(h.title.replace(/<[^>]+>/g, '').slice(0, 40));
      }
      if (fight) { const a = D.worldToScreen(-450, -280), c = D.worldToScreen(450, 280), A = { x: a.x, y: a.y, w: c.x - a.x, h: c.y - a.y }; for (const [k, o] of Object.entries(overlays)) if (o && k !== 'handTab' && inter(A, o) > 0) hidden.push('ARENA under ' + k + ' ' + Math.round(inter(A, o)) + ' px²'); if (A.x < 0 || A.y < 0 || A.x + A.w > vw || A.y + A.h > vh) off.push('ARENA off screen ' + [A.x, A.y, A.x + A.w, A.y + A.h].map(Math.round).join(',')); }
      // DOM overlays overlapping each other
      const dom = [];
      const ks = Object.keys(overlays).filter(k => overlays[k]);
      for (let i = 0; i < ks.length; i++) for (let j = i + 1; j < ks.length; j++) if (inter(overlays[ks[i]], overlays[ks[j]]) > 20) dom.push(ks[i] + '×' + ks[j]);
      // modals that don't fit
      const modals = [];
      for (const sel of ['#ivModal .iv-box', '#dealModal .iv-box', '#scoutPanel .sc-box']) { const el = document.querySelector(sel); const m = el && !el.closest('[hidden]') ? el.getBoundingClientRect() : null; if (m && m.width) { if (m.top < 0 || m.bottom > vh || m.left < 0 || m.right > vw) modals.push(sel + ' ' + Math.round(m.top) + '..' + Math.round(m.bottom) + ' of ' + vh); if (el.scrollHeight > el.clientHeight + 2 && getComputedStyle(el).overflowY === 'visible') modals.push(sel + ' content cut'); } }
      // text overflow in HTML buttons / chips in the left column and modals
      const over = [...document.querySelectorAll('#leftCol button, #ivModal button, #dealModal button, .dl-chip')].filter(e => e.offsetParent && e.scrollWidth > e.clientWidth + 2).map(e => e.textContent.trim().slice(0, 30));
      return { phase: D.G.phase + (D.G.marketStage && D.G.phase === 'market' ? ':' + D.G.marketStage : ''), hidden: [...new Set(hidden)], off: [...new Set(off)], dom, modals, over, zoom: +(D.cam ? D.cam.zoom : 0).toFixed(2) };
    });
    report.push(Object.assign({ name }, r));
  };
  const clickOn = async () => { const btn = (await p.$('#pAct2')) || (await p.$('#pAct1')); if (btn) try { await btn.click({ timeout: 400 }); } catch (e) {} };
  const until = async (fn, max = 400) => { for (let i = 0; i < max; i++) { if (await p.evaluate(fn)) return true; const m = await p.$('#ivModal:not([hidden]) button.secondary'); if (m) { try { await m.click({ timeout: 300 }); } catch (e) {} continue; } const dm = await p.$('#dealModal:not([hidden]) [data-k="no"]'); if (dm) { try { await dm.click({ timeout: 300 }); } catch (e) {} continue; } await clickOn(); await p.waitForTimeout(90); } return false; };
  await check('01-setup');
  await p.click('#pAct2'); await p.waitForTimeout(500);
  await check('02-upkeep');
  // open the scout panel on my robot
  await p.evaluate(() => { const D = window.ROBOCUS_DEBUG; D.openScout(0, D.G.teams[0].robots[0]); }); await check('03-scout'); await p.evaluate(() => window.ROBOCUS_DEBUG.closeScout());
  // give me 3 robots with parts and crew for a full garage
  await p.evaluate(() => { const D = window.ROBOCUS_DEBUG, G = D.G, t = G.teams[0]; D.applyLot(0, D.robotLot('Juggernaut'), null); D.applyLot(0, D.robotLot('Fortress'), null); t.crew.push({ uid: 8001, kind: 'hacker' }, { uid: 8002, kind: 'analyst' }, { uid: 8003, kind: 'fixer' }); t.robots[0].b.brk = ['mod']; t.robots[0].dmg = 30; G.teams[1].stash = ['w_lens', 'd_medic', 'x_plate']; D.updateHud(); });
  await check('04-full-garage');
  await until(() => window.ROBOCUS_DEBUG.G.phase === 'intrigue');
  await check('05-intrigue');
  // open the hand
  await p.hover('#handTab'); await p.waitForTimeout(400); await check('06-hand-open'); await p.mouse.move(W / 2, 40);
  await until(() => window.ROBOCUS_DEBUG.G.phase === 'market' && window.ROBOCUS_DEBUG.G.marketStage === 'open' && !window.ROBOCUS_DEBUG.G.openBusy);
  await p.evaluate(() => { const D = window.ROBOCUS_DEBUG, G = D.G; G.market = [D.robotLot('Wasp'), 'L_twin', 'crew:repairtech:99', 'm_flipper']; D.LOTS['crew:repairtech:99'] = { name: 'Repair Tech', icon: '🛠️', text: 'Repairs half price', crew: 'repairtech', desc: '' }; G.legendNext = 'L_quantum'; D.updateHud(); });
  await check('07-open-market');
  p.evaluate(() => window.ROBOCUS_DEBUG.humanTrade(window.ROBOCUS_DEBUG.G.teams[1])); await p.waitForTimeout(500);
  await check('08-trade-panel');
  await p.click('#dealModal [data-k="no"]'); await p.waitForTimeout(200);
  await p.evaluate(() => window.ROBOCUS_DEBUG.startLots());
  await check('09-lots');
  await p.evaluate(() => { const G = window.ROBOCUS_DEBUG.G; G.myBids = [1, 0, 0, 0, 0]; });
  await p.click('#pAct1');
  await until(() => window.ROBOCUS_DEBUG.G.marketResolved && !(window.ROBOCUS_DEBUG.G.pendingInstall || []).length, 60);
  await check('10-results');
  await until(() => window.ROBOCUS_DEBUG.G.marketStage === 'host');
  await check('11-host-bid');
  await until(() => ['arena', 'bets'].includes(window.ROBOCUS_DEBUG.G.phase));
  await check('12-arena');
  await until(() => window.ROBOCUS_DEBUG.G.phase === 'bets' || (window.ROBOCUS_DEBUG.G.chooseMyBot && (() => { const D = window.ROBOCUS_DEBUG, G = D.G, s = G.fight.teams.indexOf(0); G.fight.robots[s] = G.teams[0].robots.find(r => !r.exhausted) || G.teams[0].robots[0]; D.afterChoose(); return false; })()));
  await check('13-bets');
  await until(() => window.ROBOCUS_DEBUG.G.phase === 'fight');
  await p.waitForTimeout(5500);   // intro + some fighting
  await check('14-fight');
  await until(() => window.ROBOCUS_DEBUG.G.phase === 'after', 600);
  await check('15-after');
  const pterr = await p.evaluate(() => window.ROBOCUS_DEBUG.PT.game.events.filter(e => e.k === 'error').map(e => e.msg + ' @R' + e.r + ' ' + e.ph + '\n' + e.stack));
  errs.push(...pterr);
  require('fs').writeFileSync(OUT + '/report.json', JSON.stringify({ W, H, report, errs }, null, 1));
  const bad = report.filter(r => r.hidden.length || r.off.length || r.dom.length || r.modals.length || r.over.length);
  console.log(W + 'x' + H, 'states', report.length, 'with issues', bad.length, 'errors', errs.length);
  await b.close();
})();
