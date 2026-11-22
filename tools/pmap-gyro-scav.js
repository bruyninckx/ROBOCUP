// T60 (22 Nov 2026): the power map in a state like Kev's rounds 9/11 (seat 0 with a level 2 Gyro: Race-spec Booster drone,
// Race-spec Jammer drone, Quantum shield; Rust Rivets (seat 1) with a Scavenger: Overdrive + Weapon overhaul). Opens the map,
// clicks Gyro, then Scavenger, takes screenshots at 1905 x 932 and checks the game state hash does not change.
//   node tools/pmap-gyro-scav.js --tag=before   ->  /home/claude/out/t60-map-<tag>-click-gyro.png, ...-click-scavenger.png
'use strict';
const path = require('path'), fs = require('fs');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const TAG = arg('tag', 'after'), OUT = arg('out', '/home/claude/out'); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await require('./mp-scenario/launch.js')(require('playwright'));
  const ctx = await b.newContext({ viewport: { width: 1905, height: 932 } });
  const PLK = require('./planck-local.js'), PL = PLK.find(); await PLK.route(ctx, PL);
  const p = await ctx.newPage(), errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(require('url').pathToFileURL(path.join(__dirname, '../prototypes/tabletop-2.html')).href + '?seed=5');
  await p.waitForTimeout(2500);
  await p.evaluate(() => { window.__noBookie = true; const b = document.getElementById('pAct2'); if (b) b.click(); });
  await p.waitForTimeout(1500);
  const info = await p.evaluate(() => { const D = window.ROBOCUS_DEBUG, G = D.G;
    const g = D.mkRobot('Gyro'); g.parts = ['booster', 'jammer']; g.leg = 'quantum'; g.rar = { booster: 2, jammer: 2 };
    const s = D.mkRobot('Scavenger'); s.parts = ['overdrive', 'weapon'];
    G.teams[0].robots.push(g); G.teams[1].robots.push(s);
    return G.teams.map(T => T.name + ': ' + T.robots.map(r => r.name).join(', ')); });
  console.log(info.join(' | '));
  const hash = () => p.evaluate(() => { const D = window.ROBOCUS_DEBUG, s = JSON.stringify([D.G, D.LOTS], (k, v) => k === 'S' || k === 'B' ? undefined : v); let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0; return h.toString(16); });
  const h0 = await hash();
  await p.keyboard.press('m'); await p.waitForTimeout(1200);
  await p.screenshot({ path: path.join(OUT, 't60-map-' + TAG + '-open.png') });
  const clickOn = async (name, team) => { const xy = await p.evaluate(([n, t]) => { const PM = window.ROBOCUS_DEBUG.PM, it = PM.items.find(i => i.name === n && i.kind === 'team' && i.T.i === t), r = PM.cv.getBoundingClientRect(); return it ? [r.left + it.px, r.top + it.py] : null; }, [name, team]);
    if (!xy) throw new Error('no token ' + name); await p.mouse.click(xy[0], xy[1]); await p.mouse.move(5, 5); await p.waitForTimeout(600); };
  await clickOn('Gyro', 0); await p.screenshot({ path: path.join(OUT, 't60-map-' + TAG + '-click-gyro.png') });
  const side1 = await p.evaluate(() => document.querySelector('#pmapBox .pm-side').innerText);
  const vis = await p.evaluate(() => { const sd = document.querySelector('#pmapBox .pm-side'), h = [...sd.querySelectorAll('.pm-h')].find(x => /Against/.test(x.textContent)); if (!h) return null; const a = h.getBoundingClientRect(), s = sd.getBoundingClientRect(); return { top: Math.round(a.top - s.top), sideH: Math.round(s.height), scroll: sd.scrollHeight }; });
  console.log('side panel, Gyro picked:\n' + side1.slice(0, 1600)); console.log('"Against" heading', JSON.stringify(vis));
  await clickOn('Scavenger', 1); await p.screenshot({ path: path.join(OUT, 't60-map-' + TAG + '-click-scavenger.png') });
  const side2 = await p.evaluate(() => document.querySelector('#pmapBox .pm-side').innerText);
  console.log('side panel, Scavenger picked:\n' + side2.slice(0, 900));
  const marks = await p.evaluate(() => { const PM = window.ROBOCUS_DEBUG.PM; return PM.vsTags ? PM.vsTags : null; });
  if (marks) console.log('tags on the map:', JSON.stringify(marks));
  // also: a robot not in this game (no pills), both switch positions, every token of this game clicked once (no errors)
  await p.evaluate(() => { const PM = window.ROBOCUS_DEBUG.PM, it = PM.items.find(i => i.kind === 'line'), r = PM.cv.getBoundingClientRect(); if (it) PM.cv.dispatchEvent(new MouseEvent('click', { clientX: r.left + it.px, clientY: r.top + it.py, bubbles: true })); });
  console.log('lineup robot picked: pills', await p.evaluate(() => { const PM = window.ROBOCUS_DEBUG.PM; return PM.vs ? PM.vs.size : 0; }));
  await p.click('#pmOnly'); await p.waitForTimeout(300);
  const n = await p.evaluate(() => { const PM = window.ROBOCUS_DEBUG.PM, r = PM.cv.getBoundingClientRect(); let k = 0; for (const it of PM.items.filter(i => i.kind === 'team')) { PM.cv.dispatchEvent(new MouseEvent('click', { clientX: r.left + it.px, clientY: r.top + it.py, bubbles: true })); k += PM.vs ? 1 : 0; } return k; });
  console.log('tokens of this game clicked, each with pills:', n); await p.click('#pmOnly'); await p.waitForTimeout(300);
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  const h1 = await hash();
  console.log('state hash', h0, h1, h0 === h1 ? 'unchanged' : 'CHANGED'); console.log('page errors', errs.length, errs.slice(0, 3).join(' / '));
  await b.close(); process.exit(h0 === h1 && !errs.length ? 0 : 1);
})();
