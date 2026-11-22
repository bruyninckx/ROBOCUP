// T66 (22 Nov 2026): first-time tips that point at things (Kev: "some tutorial box that people can click and then it can point out
// certain things like where to find the bookie stats, where to find the part rarity stats etc, once they clicked it once it doesnt
// appear again"). Display only. This test:
//   1. a fresh browser (solo, 1280x720, ?tips=1 because a test browser has tips off): the first tip ("The yellow note") shows on its
//      anchor (ring on #promptBar, box on screen, not over the anchor); Got it closes it; a reload does not show it again;
//   2. Quick-Start → Upkeep: a timed question opened while the next tip is pending keeps its countdown, stays clickable and answers;
//      the tip waits until it is answered, then "Upkeep: your garage" comes, on the pit's title;
//   3. at most one new tip per phase; Esc closes a tip;
//   4. the 💡 tips list: "Show the tips again" brings them back; "No more tips" stops them (also after a reload);
//   5. bot runs (?bot=1) and a test browser without ?tips=1 show none;
//   6. the bookie, rarity and trading floor tips on their anchors (the test bot plays to Bets / the Market): screenshots;
//   7. online (host + 3 joined, local transport): the joined seat P1 gets its own tip, the host none; P1's tip sends nothing to the
//      host (no act / ans / shown message) and the host's state hash is the same before and after.
//   node tools/mp-scenario/tips.js [outDir=/home/claude/out] [parts=1234567]
const path = require('path'), fs = require('fs');
(async () => {
  const out = process.argv[2] || '/home/claude/out'; fs.mkdirSync(out, { recursive: true });
  const parts = process.argv[3] || '1234567';
  const b = await require('./launch.js')(require('playwright'));
  const PLK = require('../planck-local.js'), PL = PLK.find();
  const bad = [], errs = [], say = (...a) => console.log(...a);
  const want = (c, m) => { if (!c) { bad.push(m); say('  FAIL ' + m); } else say('  ok   ' + m); };
  const URL0 = require('url').pathToFileURL(path.resolve('prototypes/tabletop-2.html')).href;
  const until = async (p, f, ms = 10000, arg) => { for (let t = 0; t < ms; t += 200) { try { if (await p.evaluate(f, arg)) return true; } catch (e) {} await p.waitForTimeout(200); } return false; };
  async function ctxNew(w = 1280, h = 720, seen) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } }); await PLK.route(ctx, PL);
    if (seen) await ctx.addInitScript(s => { try { if (!sessionStorage.getItem('t66init')) { localStorage.setItem('robocus.tips', s); sessionStorage.setItem('t66init', '1'); } } catch (e) {} }, JSON.stringify(seen));
    return ctx;
  }
  async function open(ctx, q, tag) { const p = await ctx.newPage(); p.on('pageerror', e => errs.push(tag + ': ' + e.message)); await p.goto(URL0 + q); await p.waitForTimeout(600); await p.evaluate(() => { window.__noSlide = true; }); return p; }
  const cur = p => p.evaluate(() => window.ROBOCUS_DEBUG.tips.cur());
  const phase = p => p.evaluate(() => { const G = window.ROBOCUS_DEBUG.G; return G.round + ':' + G.phase; });
  const stored = p => p.evaluate(() => { try { return JSON.parse(localStorage.getItem('robocus.tips') || '{}'); } catch (e) { return null; } });
  // where the tip is: box, ring and its anchor; on screen, the box not over the anchor, the ring on the anchor
  const geo = p => p.evaluate(() => { const D = window.ROBOCUS_DEBUG, id = D.tips.cur(), el = document.getElementById('tipBox'), rg = document.getElementById('tipRing');
    if (!id || !el || el.hidden) return null;
    const r = x => { const q = x.getBoundingClientRect(); return { x: q.left, y: q.top, w: q.width, h: q.height }; };
    return { id, box: r(el), ring: r(rg), anchor: D.tips.at(id), W: innerWidth, H: innerHeight, text: el.innerText.replace(/\s+/g, ' ') }; });
  const geoOk = (g, tag) => {
    if (!g) { want(false, tag + ': no tip on screen'); return; }
    const B = g.box, A = g.anchor, R = g.ring;
    want(B.x >= 0 && B.y >= 0 && B.x + B.w <= g.W && B.y + B.h <= g.H, tag + ': box on screen ' + JSON.stringify(B));
    const ov = Math.max(0, Math.min(B.x + B.w, A.x + A.w) - Math.max(B.x, A.x)) * Math.max(0, Math.min(B.y + B.h, A.y + A.h) - Math.max(B.y, A.y));
    want(ov === 0, tag + ': box not over its anchor (overlap ' + Math.round(ov) + ' px²)');
    want(Math.abs(R.x + 5 - A.x) < 3 && Math.abs(R.y + 5 - A.y) < 3 && Math.abs(R.w - 10 - A.w) < 3, tag + ': ring on the anchor');
  };
  const shotTip = async (p, name) => { await p.waitForTimeout(250); await p.screenshot({ path: path.join(out, name) }); say('  shot ' + path.join(out, name)); };
  const ALL = ['note', 'garage', 'hand', 'rarity', 'lotodds', 'floor', 'bookie', 'wait', 'pmap', 'value', 'log', 'files'];

  if (parts.includes('1') || parts.includes('2') || parts.includes('3') || parts.includes('4')) {
    say('1. a fresh browser: the first tip, Got it, a reload');
    const ctx = await ctxNew(); let p = await open(ctx, '?seed=13&tips=1', 'solo');
    want(await until(p, () => window.ROBOCUS_DEBUG.tips.cur() === 'note', 8000), 'first tip "note" shows in setup');
    let g = await geo(p); geoOk(g, 'note'); want(g && /The yellow note/.test(g.text) && /Got it/.test(g.text), 'note: title and Got it');
    await shotTip(p, 't66-tip-note.png');
    await p.click('#tipBox .tp-ok'); await p.waitForTimeout(300);
    want(!(await cur(p)) && await p.evaluate(() => document.getElementById('tipBox').hidden), 'Got it closes it');
    want(!!(await stored(p)).seen.note, 'stored in robocus.tips');
    const log = await p.evaluate(() => window.ROBOCUS_DEBUG.PT.game.events.filter(e => e.k === 'tip').map(e => e.act + ':' + (e.id || '')));
    want(log.includes('shown:note') && log.includes('closed:note'), 'playtest log: ' + log.join(', '));
    await p.reload(); await p.waitForTimeout(600); await p.evaluate(() => { window.__noSlide = true; });
    await p.waitForTimeout(4000);
    want(!(await cur(p)) && (await phase(p)) === '1:setup', 'after a reload: no tip in setup (' + await cur(p) + ')');

    say('2. Upkeep: a timed question with a tip pending');
    await p.click('#pAct2');   // Quick-Start
    want(await until(p, () => window.ROBOCUS_DEBUG.G.phase === 'upkeep', 8000), 'Quick-Start → Upkeep');
    // a 20 s question in the note, opened before the tip's 1.5 s wait is over
    await p.evaluate(() => { window.__t66q = 'open'; window.ROBOCUS_DEBUG.askBox('🧪 Test question', 'A timed test question.', [{ label: 'Answer A', value: () => 'A' }, { label: 'Answer B', value: () => 'B' }], 20000, 'late').then(v => { window.__t66q = v; }); });
    await p.waitForTimeout(300);
    const left = () => p.evaluate(() => { const q = window.ROBOCUS_DEBUG.RX.q; return q && !q.over ? q.ms - (performance.now() - q.t0) : null; });
    const l0 = await left(); let seenTip = false;
    for (let k = 0; k < 15; k++) { await p.waitForTimeout(200); if (await cur(p)) seenTip = true; }
    const l1 = await left();
    say('  countdown ' + Math.round(l0) + ' → ' + Math.round(l1) + ' ms; tip pending: ' + await p.evaluate(() => window.ROBOCUS_DEBUG.tips.busy()));
    want(l0 != null && l1 != null && l0 - l1 > 2500 && l0 - l1 < 3800, 'the question keeps counting down (' + Math.round(l0 - l1) + ' ms in 3 s)');
    want(!seenTip, 'no tip while the question is open');
    await p.mouse.move(640, 700); await p.waitForTimeout(600);   // the 0.8 s click guard (and the pointer-over guard) are over
    const btn = p.locator('#promptBar [data-rk]:not(:disabled)', { hasText: 'Answer A' });
    want(await btn.count() === 1, 'the answer button is clickable');
    await btn.click({ timeout: 5000 }).catch(e => bad.push('click: ' + e.message.split('\n')[0]));
    want(await until(p, () => window.__t66q === 'A', 3000), 'the click answered it (' + await p.evaluate(() => window.__t66q) + ')');
    want(await until(p, () => window.ROBOCUS_DEBUG.tips.cur() === 'garage', 6000), 'then the Upkeep tip comes: ' + await cur(p));
    g = await geo(p); geoOk(g, 'garage'); await shotTip(p, 't66-tip-garage.png');

    say('3. one new tip per phase; Esc');
    await p.keyboard.press('Escape'); await p.waitForTimeout(300);
    want(!(await cur(p)) && !!(await stored(p)).seen.garage, 'Esc closes it for good');
    await p.waitForTimeout(3500);
    want(!(await cur(p)), 'no second new tip in the same phase (' + await cur(p) + ')');

    say('4. the tips list: Show the tips again; No more tips');
    await p.click('#tipsBtn'); await p.waitForTimeout(300);
    const lst = await p.evaluate(() => ({ open: !document.getElementById('tipsBox').hidden, rows: document.querySelectorAll('#tipsBody .ts-row').length, txt: document.getElementById('tipsBody').innerText.slice(0, 200) }));
    want(lst.open && lst.rows === 12, 'the list: ' + lst.rows + ' tips (' + lst.txt.replace(/\s+/g, ' ').slice(0, 90) + ')');
    await shotTip(p, 't66-tips-list.png');
    await p.click('#tipsAgain'); await p.waitForTimeout(200);
    want(Object.keys((await stored(p)).seen || {}).length === 0, 'Show the tips again clears them');
    await p.click('#tipsX'); await p.waitForTimeout(200);
    want(await until(p, () => !!window.ROBOCUS_DEBUG.tips.cur(), 6000), 'a tip comes back: ' + await cur(p));
    await p.click('#tipBox .tp-no'); await p.waitForTimeout(300);
    want(!(await cur(p)) && (await stored(p)).off === true, 'No more tips: closed, stored off');
    await p.click('#pAct1').catch(() => {}); await p.waitForTimeout(3500);   // Done → Intrigue: a new phase
    want(!(await cur(p)), 'no tip in the next phase (' + await phase(p) + ')');
    await p.reload(); await p.waitForTimeout(4000);
    want(!(await cur(p)), 'none after a reload either');
    await ctx.close();
  }

  if (parts.includes('5')) {
    say('5. bot runs and test browsers: no tips');
    for (const q of ['?seed=21&bot=1', '?seed=21']) {
      const ctx = await ctxNew(); const p = await open(ctx, q, 'none');
      if (q === '?seed=21') await p.click('#pAct2').catch(() => {});
      let n = 0; for (let k = 0; k < 40; k++) { await p.waitForTimeout(250); if (await p.evaluate(() => { const el = document.getElementById('tipBox'); return !!(el && !el.hidden); })) n++; }
      want(n === 0 && !(await p.evaluate(() => window.ROBOCUS_DEBUG.tips.on())), q + ': no tip in 10 s (' + await phase(p) + ')');
      await ctx.close();
    }
  }

  if (parts.includes('6')) {
    say('6. bookie, rarity and trading floor on their anchors (the bot plays seat 0 until the phase, then waits)');
    for (const [id, ph, shot] of [['bookie', 'bets', 't66-tip-bookie.png'], ['rarity', 'market', 't66-tip-rarity.png'], ['floor', 'market', 't66-tip-floor.png']]) {
      const seen = {}; ALL.filter(x => x !== id).forEach(x => { seen[x] = 1; });
      const ctx = await ctxNew(1280, 720, { seen }); const p = await open(ctx, '?seed=13&bot=1&tips=1' + (id === 'bookie' ? '&watch=1' : ''), id);   // watch: the bot game has a Bets step (fights in real time)
      let ok = false;
      for (let t = 0; t < 300000 && !ok; t += 250) {
        const s = await p.evaluate(([ph, id]) => { const D = window.ROBOCUS_DEBUG, G = D.G;
          // our seat stops answering once the tip's thing is on screen: the step waits for us (the host bid step of the Market has no floor)
          if (G.phase === ph && !window.__noBot && D.tips.at(id)) window.__noBot = true;
          const v = document.getElementById('fightView'); if (v && !v.hidden) { const s = v.querySelector('.fv-skip:not([hidden])'); if (s) s.click(); const d = v.querySelector('.fv-done:not([hidden])'); if (d) d.click(); }
          return { cur: D.tips.cur(), ph: G.phase, busy: D.tips.busy(), over: G.over }; }, [ph, id]);
        if (s.cur === id) ok = true;
        else if ((s.ph !== ph || !(await p.evaluate(id => !!window.ROBOCUS_DEBUG.tips.at(id), id))) && await p.evaluate(() => window.__noBot)) await p.evaluate(() => { window.__noBot = false; });
        else if (s.ph === ph && t % 5000 === 0) say('  ' + id + ': in ' + s.ph + ', busy: ' + s.busy);
        if (s.ph === ph && s.busy === 'question') await p.evaluate(() => { const bs = [...document.querySelectorAll('#promptBar [data-rk]:not(:disabled)')]; if (bs.length) bs[bs.length - 1].click(); });
        if (s.over) break;
        await p.waitForTimeout(250);
      }
      want(ok, id + ' tip shows in ' + ph);
      if (ok) { const g = await geo(p); geoOk(g, id); say('  ' + id + ': ' + (g && g.text.slice(0, 120))); await shotTip(p, shot); }
      await ctx.close();
    }
  }

  if (parts.includes('7')) {
    say('7. online: the joined seat gets its own tips, the host\'s state does not change');
    const L = require('./lib.js');
    const S = await L.setup(5, () => { const G = window.ROBOCUS_GAME.G; return G.phase === 'upkeep' && G.round >= 1; });
    const host = S.host, P1 = S.cl[0];
    const hash = () => host.evaluate(() => { const s = JSON.stringify(window.ROBOCUS_GAME.G); let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return (h >>> 0).toString(16) + ':' + s.length; });
    const h0 = await hash(); await host.waitForTimeout(2500); const h1 = await hash();
    say('  host hash, quiet: ' + h0 + ' → ' + h1);
    await P1.evaluate(() => { window.__t66msg = []; const pm = BroadcastChannel.prototype.postMessage; BroadcastChannel.prototype.postMessage = function (m) { try { if (m && m.d && m.d.t) window.__t66msg.push(m.d.t); } catch (e) {} return pm.call(this, m); };
      window.ROBOCUS_DEBUG.tips.force(true); });
    want(await until(P1, () => !!window.ROBOCUS_DEBUG.tips.cur(), 8000), 'P1 (joined) gets a tip: ' + await cur(P1));
    const g = await geo(P1); if (g) geoOk(g, 'P1 ' + g.id);
    const others = await Promise.all([host, S.cl[1], S.cl[2]].map(cur));
    want(others.every(x => !x), 'host and the other screens: no tip (' + others.join(',') + ')');
    await shotTip(P1, 't66-tip-online-p1.png');
    await P1.click('#tipBox .tp-ok'); await P1.waitForTimeout(1500);
    const h2 = await hash(), msgs = await P1.evaluate(() => window.__t66msg);
    say('  P1 sent: ' + (msgs.join(',') || 'nothing') + '; host hash ' + h1 + ' → ' + h2);
    want(!msgs.some(t => /^(act|ans|dealans|shown)$/.test(t)), 'P1\'s tip sent no game message');
    want(h0 === h1 ? h2 === h1 : true, 'host state hash unchanged by the joined seat\'s tip' + (h0 === h1 ? '' : ' (host not quiet: not judged)'));
    if (h0 !== h1) bad.push('host state was not quiet, hash not judged');
    await S.b.close(); errs.push(...S.errs);
  }

  await b.close();
  say(errs.length ? 'PAGE ERRORS:\n  ' + errs.join('\n  ') : '0 page errors');
  say(bad.length || errs.length ? 'FAIL (' + bad.length + ')' : 'OK');
  process.exit(bad.length || errs.length ? 1 : 0);
})().catch(e => { console.log('FAIL ' + (e && e.stack || e)); process.exit(1); });
