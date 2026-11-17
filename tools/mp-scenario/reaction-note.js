// The reaction window in the yellow note (T2, 17 Nov), on one screen (solo: you against three AI teams). An AI team plays
// Smash and Grab on you while you hold answers; the note shows the scheme, the count and one button per answer and Let it happen.
//   1. one answer card: the note flashes red (YOUR MOVE), a click on Firewall shows ✓ and blocks: your credits stay, the card is spent;
//   2. three answer cards + a Security Bot: all fit in the note (at 1600x900 and 1280x720), Let it happen lets it happen: credits go;
//   3. two answer cards, nobody clicks: the window closes by itself and the scheme lands (the default answer), the cards stay.
//   4. no card in a solo game: no window and no wait (as before T2).
// The online side (a joined client, a player with no card and OK, everyone clicked) is in reaction.js.
//   node tools/mp-scenario/reaction-note.js [screenshotFolder]
const path = require('path'), fs = require('fs');
(async () => {
  const shots = process.argv[2]; if (shots) fs.mkdirSync(shots, { recursive: true });
  const b = await require('./launch.js')(require('playwright'));
  const PLK = require('../planck-local.js'), PL = PLK.find();
  const bad = [], errs = [];
  const shot = (p, n) => shots ? p.screenshot({ path: path.join(shots, n) }) : null;
  const noteShot = (p, n) => shots ? p.locator('#promptBar').screenshot({ path: path.join(shots, n) }) : null;
  async function open(w, h) {
    const p = await b.newPage({ viewport: { width: w, height: h } }); p.on('pageerror', e => errs.push(w + 'x' + h + ': ' + e.message));
    await PLK.route(p, PL);
    await p.goto(require('url').pathToFileURL(path.resolve('prototypes/tabletop-2.html')).href + '?seed=11'); await p.waitForTimeout(800);
    await p.evaluate(() => { window.__noSlide = true; window.__noAuto = true; });
    await p.click('#pAct2'); await p.waitForTimeout(1500);
    return p;
  }
  // Smash and Grab by team 1 on you; hands as given (the AI teams hold nothing, so only you can answer)
  const play = (p, hand, bots) => p.evaluate(([hand, bots]) => { const D = window.ROBOCUS_DEBUG, G = D.G;
    G.teams.forEach((t, i) => { t.credits = 12; t.fame = 8; t.hand = i === 0 ? hand.slice() : i === 1 ? ['smash_and_grab'] : []; t.secBots = i === 0 ? bots : 0; t.exSec = 0; });
    D.updateHud(); window.__done = null; D.playScheme(G.teams[1], 'smash_and_grab', G.teams[0]).then(() => { window.__done = Date.now(); }); }, [hand, bots || 0]);
  const note = p => p.evaluate(() => { const el = document.getElementById('promptBar'), r = el.getBoundingClientRect();
    const bs = [...el.querySelectorAll('[data-rk]')].map(x => { const q = x.getBoundingClientRect(); return { t: x.textContent.trim(), cut: q.bottom > r.bottom - 1 || q.top < r.top || q.right > r.right + 1, done: x.classList.contains('done') }; });
    return { rx: el.classList.contains('rxmode'), move: !el.classList.contains('idle'), flash: el.classList.contains('flash'), tight: el.classList.contains('tight'), sec: (el.querySelector('.rx-sec') || {}).textContent, text: (el.querySelector('.rx-txt') || {}).textContent, bs, h: Math.round(r.height), old: !!document.querySelector('#reactWin:not([hidden])') }; });
  const state = p => p.evaluate(() => { const G = window.ROBOCUS_DEBUG.G; return { me: G.teams[0].credits, f: G.teams[1].credits, hand: G.teams[0].hand.join(','), bots: G.teams[0].secBots, done: !!window.__done }; });
  const waitDone = async (p, ms) => { for (let t = 0; t < ms; t += 250) { if ((await state(p)).done) return true; await p.waitForTimeout(250); } return false; };
  const waitRx = async p => { for (let t = 0; t < 8000; t += 100) { if (await p.evaluate(() => document.getElementById('promptBar').matches('.rxmode:not(.qmode)'))) return true; await p.waitForTimeout(100); } return false; };
  const click = (p, re) => p.evaluate(src => { const bt = [...document.querySelectorAll('#promptBar [data-rk]')].find(x => new RegExp(src).test(x.textContent)); if (bt) bt.click(); return !!bt; }, re.source);

  for (const [w, h] of [[1600, 900], [1280, 720]]) {
    const p = await open(w, h), tag = w + 'x' + h;
    // 1. one card: flash, click Firewall
    let s0 = await state(p); await play(p, ['firewall']); await waitRx(p); await p.waitForTimeout(250);
    let n = await note(p); await shot(p, tag + '-1card-flash.png'); await noteShot(p, tag + '-1card-note.png');
    console.log(tag + ' one card: ' + JSON.stringify({ move: n.move, flash: n.flash, sec: n.sec, h: n.h, btns: n.bs.map(x => x.t) }));
    if (!n.rx || !n.move || !n.flash) bad.push(tag + ': one card: the note is not a flashing YOUR MOVE reaction window');
    if (n.old) bad.push(tag + ': the old box over the pit is still there');
    if (!(n.bs.length === 2 && /Firewall/.test(n.bs[0].t) && n.bs[1].t === 'Let it happen')) bad.push(tag + ': one card: buttons are ' + n.bs.map(x => x.t).join(' | '));
    if (!/plays.*Smash and Grab.*on/.test(n.text || '')) bad.push(tag + ': the note does not say who plays what on whom');
    await click(p, /Firewall/); await p.waitForTimeout(30);
    const nk = await note(p); if (!nk.bs.some(x => x.done && /✓/.test(x.t))) bad.push(tag + ': no ✓ right after the click'); await noteShot(p, tag + '-1card-clicked.png');
    await waitDone(p, 8000); let s1 = await state(p);
    console.log(tag + ' clicked Firewall: credits ' + s0.me + ' → ' + s1.me + ' (team 1: ' + s1.f + '), hand [' + s1.hand + '], done ' + s1.done);
    if (!s1.done || s1.me !== 12 || s1.hand !== '' || s1.f !== 12) bad.push(tag + ': Firewall from the note did not block (' + JSON.stringify(s1) + ')');
    await p.waitForTimeout(600); n = await note(p); if (n.rx) bad.push(tag + ': the note still shows the window after it ended');
    // 2. three cards + a bot: fit, then Let it happen
    await play(p, ['firewall', 'paid_off', 'pr_spin'], 1); await waitRx(p); await p.waitForTimeout(300);
    n = await note(p); await shot(p, tag + '-3cards.png'); await noteShot(p, tag + '-3cards-note.png');
    console.log(tag + ' three cards: ' + JSON.stringify({ tight: n.tight, h: n.h, btns: n.bs.map(x => x.t + (x.cut ? ' (CUT)' : '')) }));
    if (n.bs.some(x => x.cut)) bad.push(tag + ': a button is cut off with three cards');
    if (n.bs.length < 4) bad.push(tag + ': three cards: only ' + n.bs.length + ' buttons');
    const tp = Date.now(); await click(p, /^Let it happen$/); await waitDone(p, 8000); s1 = await state(p);
    console.log(tag + ' Let it happen: the window ended ' + ((Date.now() - tp) / 1000).toFixed(1) + ' s after the click');
    if (Date.now() - tp > 4000) bad.push(tag + ': Let it happen (the only person) did not end the window early');
    console.log(tag + ' passed: my credits 12 → ' + s1.me + ', team 1 12 → ' + s1.f + ', hand [' + s1.hand + ']');
    if (!s1.done || s1.me >= 12 || s1.f <= 12 || s1.hand !== 'firewall,paid_off,pr_spin') bad.push(tag + ': Let it happen did not let it happen (' + JSON.stringify(s1) + ')');
    // 3. two cards, nobody clicks: the time runs out
    await p.waitForTimeout(500);
    const t0 = Date.now(); await play(p, ['firewall', 'paid_off']); await waitRx(p); await p.waitForTimeout(300);
    n = await note(p); await noteShot(p, tag + '-2cards-note.png');
    console.log(tag + ' two cards: ' + JSON.stringify({ tight: n.tight, h: n.h, btns: n.bs.map(x => x.t + (x.cut ? ' (CUT)' : '')) }));
    if (n.bs.some(x => x.cut)) bad.push(tag + ': a button is cut off with two cards');
    await p.waitForTimeout(4000); await noteShot(p, tag + '-2cards-later.png');
    await waitDone(p, 20000); s1 = await state(p);
    console.log(tag + ' nobody clicked: over after ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s, my credits ' + s1.me + ', hand [' + s1.hand + ']');
    if (!s1.done || s1.me >= 12 || s1.hand !== 'firewall,paid_off') bad.push(tag + ': timeout did not give the default (let it happen) (' + JSON.stringify(s1) + ')');
    if (Date.now() - t0 < 9000) bad.push(tag + ': the window closed before its time');
    // 4. solo, no card: no window at all (as before T2: in a game with one person only those who hold an answer are asked);
    //    the ~4-5 s are the card's play animation, which comes before any window (with a window: ~15 s)
    await p.waitForTimeout(500);
    const t4 = Date.now(); await play(p, []); let seen = false;
    for (let k = 0; k < 40 && !(await state(p)).done; k++) { if ((await note(p)).rx) seen = true; await p.waitForTimeout(100); }
    s1 = await state(p);
    console.log(tag + ' solo, no card: window shown ' + seen + ', scheme over after ' + ((Date.now() - t4) / 1000).toFixed(1) + ' s');
    if (seen || !s1.done || Date.now() - t4 > 7000) bad.push(tag + ': solo without a card: a window or a wait');
    await p.close();
  }
  if (errs.length) bad.push(errs.length + ' page errors: ' + errs[0]);
  console.log(bad.length ? 'FAIL: ' + bad.join('; ') : 'OK');
  await b.close(); process.exit(bad.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
