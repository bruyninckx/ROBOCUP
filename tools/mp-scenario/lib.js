// Scenario tests for online play (13 Nov, after the Friday playtest): one host + 3 client tabs over the local transport,
// like tools/mp-test.js, but the bots only play until a chosen moment. Then they are frozen (window.__noBot) and the test
// plays one seat's screen by hand: it presses the real buttons of a JOINED player, which the bots never do (they call
// act() directly; that is how "clients can't repair" and "clients can't make a deal" got through mp-test).
//   node tools/mp-scenario/backing.js [seed]
const { chromium } = require('playwright');
const fs = require('fs');
exports.setup = async (seed, until) => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1500, height: 900 } });
  const errs = [];
  if (fs.existsSync('vendor/planck-1.4.3.min.js')) await ctx.route(/^https?:/, r => r.abort());   // offline: only with the local physics copy
  const base = 'file://' + process.cwd().replace(/\\/g, '/') + '/prototypes/tabletop-2.html?net=local&room=S' + seed + '&bot=1';
  const open = async (q, tag) => { const p = await ctx.newPage(); p.on('pageerror', e => errs.push(tag + ': ' + e.message)); await p.goto(base + q); return p; };
  const host = await open('&host=1&name=Host&autostart=3&seed=' + seed, 'host');
  const cl = []; for (let k = 1; k <= 3; k++) cl.push(await open('&name=P' + k, 'P' + k));
  const all = [host, ...cl], t0 = Date.now();
  const freeze = on => Promise.all(all.map(p => p.evaluate(v => { window.__noBot = v; }, on)));
  for (;;) {
    if (await host.evaluate(until)) {
      // freeze the bots, let what was under way finish, and check the table is quiet (no question open anywhere); else play on
      await freeze(true); await host.waitForTimeout(1500);
      const quiet = (await host.evaluate(until)) && (await Promise.all(all.map(exports.modal))).every(m => m === '-');
      if (quiet) break;
      await freeze(false);
    }
    await host.evaluate(() => { const v = document.getElementById('fightView'); if (v && !v.hidden) { const s = v.querySelector('.fv-skip:not([hidden])'); if (s) s.click(); const d = v.querySelector('.fv-done:not([hidden])'); if (d) d.click(); } });
    if (Date.now() - t0 > 240000) throw new Error('setup timeout');
    await host.waitForTimeout(100);
  }
  const seatOf = {}; for (const p of all) seatOf[await p.evaluate(() => window.ROBOCUS_GAME.HS)] = p;
  return { b, host, cl, all, errs, seatOf };
};
// the open question or deal panel on a screen, as text ('-' = none)
exports.modal = p => p.evaluate(() => ['ivModal', 'dealModal'].map(id => { const el = document.getElementById(id); return el && !el.hidden ? id + ': ' + el.innerText.replace(/\s+/g, ' ').slice(0, 300) : null; }).filter(Boolean).join(' || ') || '-');
// press the first button whose text matches, in the open question (ivModal) or deal panel (dealModal)
exports.press = (p, box, re) => p.evaluate(([box, src]) => { const el = document.getElementById(box); if (!el || el.hidden) return false; const bt = [...el.querySelectorAll('button')].find(x => new RegExp(src).test(x.textContent.trim())); if (bt) bt.click(); return !!bt; }, [box, re.source]);
exports.hostLog = (host, n) => host.evaluate(n => window.ROBOCUS_DEBUG.PT.game.events.filter(e => e.k === 'msg').slice(-n).map(e => e.text), n);
