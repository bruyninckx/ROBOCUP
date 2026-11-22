// Scenario tests for online play (13 Nov, after the Friday playtest): one host + 3 client tabs over the local transport,
// like tools/mp-test.js, but the bots only play until a chosen moment. Then they are frozen (window.__noBot) and the test
// plays one seat's screen by hand: it presses the real buttons of a JOINED player, which the bots never do (they call
// act() directly; that is how "clients can't repair" and "clients can't make a deal" got through mp-test).
//   node tools/mp-scenario/backing.js [seed]
const { chromium } = require('playwright');
const fs = require('fs');
exports.setup = async (seed, until, o = {}) => {
  const b = await require('./launch.js')(require('playwright'));
  const ctx = await b.newContext({ viewport: { width: 1500, height: 900 } });
  const errs = [];
  const PLK = require('../planck-local.js'), PL = PLK.find(); await PLK.route(ctx, PL);   // a local planck when there is one (PLANCK=, node_modules, vendor/)
  const base = require('url').pathToFileURL(require('path').resolve('prototypes/tabletop-2.html')).href + '?net=local&room=S' + seed + '&bot=1' + (o.watch ? '&watch=1' : '');   // watch: fights run in real time on every screen
  const open = async (q, tag) => { const p = await ctx.newPage(); p.on('pageerror', e => errs.push(tag + ': ' + e.message)); await p.goto(base + q); return p; };
  const host = await open('&host=1&name=Host&autostart=3&seed=' + seed + (o.bal ? '&bal=' + encodeURIComponent(JSON.stringify(o.bal)) : ''), 'host');   // o.bal: the host's settings (joined screens get them with the snapshot)
  await PLK.check(host, PL);
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
      // a question that opened while the bots were frozen has missed its bot answer: answer it now, as the bot would
      for (const p of all) await p.evaluate(() => { { const bs = [...document.querySelectorAll('#promptBar.rxmode [data-rk]:not(:disabled)')]; if (bs.length) bs[Math.floor(Math.random() * bs.length)].click(); }   // T2: the reaction window is in the note
        for (const id of ['ivModal']) { const m = document.getElementById(id); if (m && !m.hidden) { const bs = [...m.querySelectorAll('button[data-k]')]; if (bs.length) bs[Math.floor(Math.random() * bs.length)].click(); } } const d = document.getElementById('dealModal'); if (d && !d.hidden) { const no = d.querySelector('[data-k="no"]'); if (no) no.click(); } });
    }
    await host.evaluate(() => { const v = document.getElementById('fightView'); if (v && !v.hidden) { const s = v.querySelector('.fv-skip:not([hidden])'); if (s) s.click(); const d = v.querySelector('.fv-done:not([hidden])'); if (d) d.click(); } });
    if (Date.now() - t0 > 240000) throw new Error('setup timeout');
    await host.waitForTimeout(100);
  }
  const seatOf = {}; for (const p of all) seatOf[await p.evaluate(() => window.ROBOCUS_GAME.HS)] = p;
  return { b, host, cl, all, errs, seatOf };
};
// the open question or deal panel on a screen, as text ('-' = none)
// (T2, 17 Nov: the reaction window is drawn in the note, #promptBar.rxmode, while it is open on that screen)
// (T20, 17 Nov: a question to one player is drawn in the note too, #promptBar.qmode, RX.q)
exports.modal = p => p.evaluate(() => { const R = window.ROBOCUS_DEBUG && window.ROBOCUS_DEBUG.RX, pb = document.getElementById('promptBar');
  return [R && R.cur && !R.cur.over && pb && pb.classList.contains('rxmode') ? 'reaction: ' + pb.innerText.replace(/\s+/g, ' ').slice(0, 300) : null,
    R && R.q && !R.q.over ? 'question: ' + (pb && pb.classList.contains('qmode') ? pb.innerText : R.q.title).replace(/\s+/g, ' ').slice(0, 300) : null].concat(['ivModal', 'dealModal'].map(id => { const el = document.getElementById(id); return el && !el.hidden ? id + ': ' + el.innerText.replace(/\s+/g, ' ').slice(0, 300) : null; })).filter(Boolean).join(' || ') || '-'; });
// press the first button whose text matches, in the open question (ivModal) or deal panel (dealModal)
// (T20: a question asked in the note counts as 'ivModal': its buttons are in #promptBar.qmode)
// (T20: a question's buttons are inactive for 0.8 s after it appears: while the matching button is there but inactive, press waits)
exports.press = async (p, box, re) => { for (let t = 0; t < 3000; t += 150) { const r = await press1(p, box, re); if (r !== 'wait') return r; await p.waitForTimeout(150); } return false; };
const press1 = (p, box, re) => p.evaluate(([box, src]) => { const m = x => new RegExp(src).test(x.textContent.trim()), go = bt => bt.disabled ? 'wait' : (bt.click(), true);
  if (box === 'ivModal') { const bt = [...document.querySelectorAll('#promptBar.qmode [data-rk]')].find(m); if (bt && !bt.classList.contains('done')) return go(bt); }
  const el = document.getElementById(box); if (!el || el.hidden) return false; const bt = [...el.querySelectorAll('button')].find(m); return bt ? go(bt) : false; }, [box, re.source]);
exports.hostLog = (host, n) => host.evaluate(n => window.ROBOCUS_DEBUG.PT.game.events.filter(e => e.k === 'msg').slice(-n).map(e => e.text), n);
