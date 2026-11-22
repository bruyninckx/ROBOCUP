// T64 (22 Nov 2026, playtest-ready): a friend's first minute, from the web address. tools/serve.js stands in for GitHub Pages.
// At each screen size (default 1280x720 and 1920x1080; Kev: "smallest res should be 1280"):
//   1. index.html: the link to the game is there and opens tabletop-2.html; rules.html links to it too;
//   2. the host opens the game, 🌐 Online, Host a game (local test room), copies the invite link;
//   3. the friend opens the invite link fresh, types a name, Join, I'm ready; the host starts;
//   4. round 1 on the friend's screen (the test bot plays it; the test freezes it at every new step to look): screenshots, and a
//      layout check at each step: buttons and the note's text inside the screen, the trading floor / garage / note not cut off,
//      no button with text cut off (wider text than the button), no box overlapping the yellow note.
//   node tools/mp-scenario/first-minute.js [outDir=/tmp/first-minute] [sizes=1280x720,1920x1080]
const path = require('path'), fs = require('fs'), { spawn } = require('child_process');
(async () => {
  const out = process.argv[2] || '/tmp/first-minute'; fs.mkdirSync(out, { recursive: true });
  const sizes = (process.argv[3] || '1280x720,1920x1080').split(',').map(s => s.split('x').map(Number));
  const port = 8790 + Math.floor(Math.random() * 50);
  const srv = spawn(process.execPath, [path.join(__dirname, '..', 'serve.js'), '--port=' + port], { stdio: ['ignore', 'pipe', 'pipe'] });
  let srvOut = ''; srv.stdout.on('data', d => { srvOut += d; });
  for (let t = 0; t < 50 && !/http:\/\/127\.0\.0\.1:\d+/.test(srvOut); t++) await new Promise(r => setTimeout(r, 200));
  const m = /http:\/\/127\.0\.0\.1:(\d+)/.exec(srvOut); if (!m) { console.log('FAIL: serve.js did not start: ' + srvOut); process.exit(2); }
  const BASE = 'http://127.0.0.1:' + m[1] + '/';
  const b = await require('./launch.js')(require('playwright'));
  const PLK = require('../planck-local.js'), PL = PLK.find();
  const bad = [], notes = [], say = (...a) => console.log(...a);
  const until = async (p, f, ms = 10000, arg) => { for (let t = 0; t < ms; t += 250) { try { if (await p.evaluate(f, arg)) return true; } catch (e) {} await new Promise(r => setTimeout(r, 250)); } return false; };
  // the layout check: what a person can't use on this screen
  const layout = p => p.evaluate(() => {
    const W = innerWidth, H = innerHeight, res = [];
    const vis = el => { if (!el || el.hidden) return false; const s = getComputedStyle(el); if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) return false; const r = el.getBoundingClientRect(); return r.width > 2 && r.height > 2; };
    const name = el => (el.id ? '#' + el.id : el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : '')) + ' "' + (el.innerText || el.value || '').replace(/\s+/g, ' ').trim().slice(0, 40) + '"';
    for (const el of document.querySelectorAll('button, select, input[type=text], [data-rk], [data-rep]')) {
      if (!vis(el)) continue; const r = el.getBoundingClientRect();
      // inside a scrolled list, outside its box is fine (it can be scrolled to)
      let sc = el.parentElement, scrolled = false; while (sc && sc !== document.body) { const cs = getComputedStyle(sc); if (/(auto|scroll)/.test(cs.overflowY + cs.overflowX) && (sc.scrollHeight > sc.clientHeight + 2 || sc.scrollWidth > sc.clientWidth + 2)) { scrolled = true; break; } sc = sc.parentElement; }
      if (!scrolled && (r.right > W + 1 || r.bottom > H + 1 || r.left < -1 || r.top < -1)) res.push('off screen: ' + name(el) + ' at ' + [r.left, r.top, r.right, r.bottom].map(Math.round));
      if (el.tagName === 'BUTTON' && el.scrollWidth > el.clientWidth + 3 && getComputedStyle(el).overflow !== 'visible' && getComputedStyle(el).whiteSpace === 'nowrap') res.push('text cut off: ' + name(el));
    }
    for (const id of ['promptBar', 'tradeFloor', 'netWait', 'netPause', 'ivModal', 'dealModal', 'waitRail']) {
      const el = document.getElementById(id); if (!vis(el)) continue; const r = el.getBoundingClientRect();
      if (r.right > W + 1 || r.bottom > H + 1 || r.left < -1 || r.top < -1) res.push('box partly off screen: #' + id + ' ' + [r.left, r.top, r.right, r.bottom].map(Math.round));
    }
    const pb = document.getElementById('promptBar');
    if (vis(pb)) { const a = pb.getBoundingClientRect();
      for (const id of ['tradeFloor', 'netWait', 'waitRail']) { const el = document.getElementById(id); if (!vis(el)) continue; const r = el.getBoundingClientRect();
        const ov = Math.max(0, Math.min(a.right, r.right) - Math.max(a.left, r.left)) * Math.max(0, Math.min(a.bottom, r.bottom) - Math.max(a.top, r.top));
        if (ov > 400) res.push('#' + id + ' overlaps the note (' + Math.round(ov) + ' px²)'); } }
    return res; });
  for (const [w, h] of sizes) {
    const tag = w + 'x' + h, ctx = await b.newContext({ viewport: { width: w, height: h } }); await PLK.route(ctx, PL);
    const errs = []; const pg = async (u, t) => { const p = await ctx.newPage(); p.on('pageerror', e => errs.push(t + ': ' + e.message)); if (u) await p.goto(u); return p; };
    const shot = async (p, n) => p.screenshot({ path: path.join(out, 't64-' + tag + '-' + n + '.png') });
    // 1. index and rules
    const ix = await pg(BASE + 'index.html', 'index'); await shot(ix, '01-index');
    const links = await ix.evaluate(() => [...document.querySelectorAll('a')].map(a => a.textContent.trim() + ' -> ' + a.getAttribute('href')));
    const first = links[0] || ''; say(tag + ' index first link: ' + first);
    if (!/tabletop-2\.html/.test(first)) bad.push(tag + ': the first link on index.html is not the game: ' + first);
    const ru = await pg(BASE + 'rules.html', 'rules'); const rl = await ru.evaluate(() => [...document.querySelectorAll('a')].filter(a => /tabletop-2/.test(a.href)).length); if (!rl) bad.push(tag + ': rules.html has no link to the game'); await ru.close(); await ix.close();
    // 2. the host: the game, 🌐 Online, Host a game (local test room)
    const host = await pg(BASE + 'prototypes/tabletop-2.html?bot=1', 'host');
    await until(host, () => !!document.getElementById('netBadge') || [...document.querySelectorAll('button,div')].some(x => /🌐 Online/.test(x.textContent)), 15000);
    await shot(host, '02-game-fresh');
    const stampTxt = await host.evaluate(() => { const el = [...document.querySelectorAll('div,span')].find(x => /^files [0-9a-f]{8}/.test(x.textContent.trim())); return el ? el.textContent.trim() : ''; });
    say(tag + ' files stamp shown: ' + (stampTxt || 'NONE')); if (!stampTxt) bad.push(tag + ': no files stamp bottom left');
    await host.evaluate(() => { const el = [...document.querySelectorAll('*')].find(x => x.children.length === 0 && /🌐 Online/.test(x.textContent)); if (el) el.click(); });
    await until(host, () => !!document.getElementById('nlHost'), 5000); await shot(host, '03-online-menu');
    await host.evaluate(() => { document.getElementById('nlLocal').checked = true; document.getElementById('nlHost').click(); });
    await until(host, () => !!document.getElementById('nlLink'), 15000); await host.waitForTimeout(800);
    const link = await host.evaluate(() => document.getElementById('nlLink').value); say(tag + ' invite link: ' + link);
    // the host's own seat is played by the test bot (Host a game drops the page's ?bot=1): the same room again with &bot=1
    await host.goto(await host.evaluate(() => location.href) + '&bot=1'); await until(host, () => !!document.getElementById('nlLink'), 15000); await host.waitForTimeout(500);
    await shot(host, '04-host-lobby');
    // 3. the friend: the link, a name, Join, I'm ready
    const fr = await pg(null, 'friend'); await fr.addInitScript(() => { try { localStorage.removeItem('robocus.name'); } catch (e) {} });
    await fr.goto(link.replace(/^https?:\/\/[^/]+\/(ROBOCUP\/)?/, BASE) + (/bot=1/.test(link) ? '' : '&bot=1'));
    await until(fr, () => !!document.getElementById('nlName'), 15000); await shot(fr, '05-friend-join');
    const jl = await layout(fr); jl.forEach(x => bad.push(tag + ' join screen: ' + x));
    // the bot would join by itself only with &name=; type the name like a person
    await fr.fill('#nlName', 'Friend'); await fr.click('#nlJoin');
    await until(fr, () => !!document.getElementById('nlReady') || !!(window.ROBOCUS_GAME && window.ROBOCUS_GAME.role === 'client'), 15000); await fr.waitForTimeout(800);
    await shot(fr, '06-friend-lobby');
    await until(host, () => /1 player/.test(document.body.innerText) && !!document.querySelector('#nlStart:not([disabled])'), 15000);
    await host.evaluate(() => document.getElementById('nlStart').click());
    if (!await until(fr, () => !!(window.ROBOCUS_GAME && window.ROBOCUS_GAME.G && window.ROBOCUS_GAME.G.teams && window.ROBOCUS_GAME.role === 'client'), 20000)) bad.push(tag + ': the friend never got into the game');
    // 4. round 1 (and into round 2) on the friend's screen: freeze at every new step, look, go on
    const seen = new Set(), t0 = Date.now();
    while (Date.now() - t0 < 360000) {
      const st = await fr.evaluate(() => { const G = window.ROBOCUS_GAME.G; if (!G) return null; const R = window.ROBOCUS_DEBUG.RX, q = R && R.q && !R.q.over ? 'q' : '', fl = document.getElementById('tradeFloor'); return G.round + ':' + G.phase + ':' + (G.setupStep || G.marketStage || '') + ':' + q + (fl && !fl.hidden ? ':floor' : '') + (G.standIn ? ':standin' : ''); }).catch(() => null);
      if (st && /^([2-9]|1\d):intrigue/.test(st)) break;
      if (st && !seen.has(st)) { seen.add(st);
        await fr.evaluate(() => { window.__noBot = true; }); await fr.waitForTimeout(1200);
        const n = String(seen.size).padStart(2, '0'); await shot(fr, '1' + n + '-' + st.replace(/:/g, '_'));
        const L = await layout(fr); const note = await fr.evaluate(() => { const el = document.getElementById('promptBar'); return el ? el.innerText.replace(/\s+/g, ' ').slice(0, 140) : ''; });
        notes.push(tag + ' ' + st + ': ' + note); L.forEach(x => bad.push(tag + ' ' + st + ': ' + x));
        await fr.evaluate(() => { window.__noBot = false; }); }
      await host.evaluate(() => { const v = document.getElementById('fightView'); if (v && !v.hidden) { const s = v.querySelector('.fv-skip:not([hidden])'); if (s) s.click(); const d = v.querySelector('.fv-done:not([hidden])'); if (d) d.click(); } });
      await fr.waitForTimeout(300);
    }
    say(tag + ' steps looked at: ' + seen.size);
    if (errs.length) bad.push(tag + ': ' + errs.length + ' page errors: ' + errs.slice(0, 3).join(' | '));
    await ctx.close();
  }
  await b.close(); srv.kill();
  notes.forEach(x => say('  ' + x));
  console.log(bad.length ? 'FAIL (' + bad.length + ')\n  ' + [...new Set(bad)].join('\n  ') : 'OK');
  process.exit(bad.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
