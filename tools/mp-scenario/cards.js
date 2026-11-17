// Every Intrigue card, played by DRAGGING it from the hand, once on the host's screen and once on a joined player's screen,
// from the same prepared table (14 Nov, after the Friday playtest: the host could do more than the joined players).
// For each card the two plays must go the same way: the same result (landed / blocked / not played and why) and the same
// questions on the same seats. Anything else is printed as a DIFFERENCE between host and joined.
//   node tools/mp-scenario/cards.js [seed=7] [only=card_id,card_id]
// The table for every play: all teams 12 Cr, 8 fame (target 7), the same sponsor, no Security Bots, empty hands, fresh crew and robots;
// the player holds only that card (fame = what the card needs, 9 at most: a higher gate goes through backing, which the
// others accept). Every question is answered by clicking: the player takes the first choice, the others accept or let it through.
const { setup } = require('./lib.js');
const seed = +(process.argv[2] || 7), only = process.argv[3] ? process.argv[3].split(',') : null;
const modalOf = () => { { const pb = document.getElementById('promptBar'), bs = pb && pb.classList.contains('rxmode') ? [...pb.querySelectorAll('[data-rk]:not(:disabled)')] : [];   // T2: the reaction window is in the note
    if (bs.length) return { id: pb.classList.contains('qmode') ? 'question' : 'reactWin', title: ((pb.querySelector('.rx-head b') || pb.querySelector('.q-t') || {}).textContent || '').replace(/\s+/g, ' ').trim(), btns: bs.map(b => { const r = b.getBoundingClientRect(); return { label: b.textContent.replace(/\s+/g, ' ').trim(), k: b.dataset.rk, primary: !b.classList.contains('secondary'), x: r.left + r.width / 2, y: r.top + r.height / 2 }; }) }; }
  for (const id of ['ivModal', 'dealModal']) { const m = document.getElementById(id); if (m && !m.hidden) { const h = m.querySelector('h3') || m.querySelector('.rw-head span'); return { id, title: (h ? h.textContent : '').replace(/\s+/g, ' ').trim(), btns: [...m.querySelectorAll('button')].filter(b => !b.disabled).map(b => { const r = b.getBoundingClientRect(); return { label: b.textContent.replace(/\s+/g, ' ').trim(), k: b.dataset.k || '', primary: b.classList.contains('primary'), x: r.left + r.width / 2, y: r.top + r.height / 2 }; }) }; } } return null; };
(async () => {
  const { b, host, errs, seatOf } = await setup(seed, () => { const G = window.ROBOCUS_GAME && window.ROBOCUS_GAME.G; return !!(G && G.phase === 'intrigue' && G.round >= 1 && G.intrigueTurn >= 0 && !G.ivBusy); });
  for (let s = 0; s < 4; s++) await seatOf[s].evaluate(() => { const pin = document.getElementById('handPin'); if (pin && /keep open/.test(pin.textContent)) pin.click(); });
  const ROBOT_PICK = ['Secret Upgrade', 'Overclock', 'We Have Your Number', 'Sugar in the Tank', 'Smudged Lens', 'Loose Bolts', 'Rogue Firmware'];
  const cards = await host.evaluate(() => { const C = window.ROBOCUS_DEBUG.CARDS; return Object.keys(C).filter(id => C[id].phase !== 'fight' && !C[id].auction).map(id => ({ id, name: C[id].name, target: C[id].target, phase: C[id].phase, need: C[id].need || 0 })); });
  const base = await host.evaluate(() => JSON.stringify(window.ROBOCUS_DEBUG.G.teams)), turn0 = await host.evaluate(() => window.ROBOCUS_DEBUG.G.intrigueTurn);
  const names = await host.evaluate(() => window.ROBOCUS_DEBUG.G.teams.map(t => t.name));
  const prep = (actor, id, TARGET, o) => host.evaluate(([actor, id, base, TARGET, o]) => {
    const D = window.ROBOCUS_DEBUG, G = D.G, c = D.CARDS[id], B = JSON.parse(base);
    G.teams.forEach((t, i) => { for (const k of Object.keys(t)) delete t[k]; Object.assign(t, B[i]); t.credits = 12; t.fame = i === TARGET ? 7 : 8; t.secBots = 0; t.exSec = 0; t.exMechs = 0; t.rep = { used: {}, free: 0 }; t.hand = i === actor ? [id] : i === TARGET ? (o.tHand || []) : []; t.sponsor = 'aegis'; if (i === TARGET && o.tSec) t.secBots = o.tSec; t.robots.forEach(r => { r.exhausted = false; r.tamper = {}; r.faceDown = []; }); });
    G.teams[actor].fame = o.fameA != null ? o.fameA : Math.min(9, Math.max(8, c.need || 0)); if (o.fameT != null) G.teams[TARGET].fame = o.fameT;
    G.intrigueTurn = actor; G.cashMode = false; G.nextEvent = null; G.arenaEvent = null; G.over = false; D.updateHud();
    return D.PT.game.events.length;
  }, [actor, id, base, TARGET, o]);
  const norm = (txt, actor, TARGET) => String(txt || '').split(names[actor]).join('PLAYER').split(names[TARGET]).join('TARGET').replace(new RegExp(names.filter((_, i) => i !== actor && i !== TARGET).map(n => n.replace(/[^\w ]/g, '.')).join('|'), 'g'), 'OTHER').replace(/\d+/g, '#');
  async function playOnce(actor, c, o = {}) {
    const TARGET = o.target != null ? o.target : 2, react = o.react ? new RegExp(o.react) : null;
    const mark = await prep(actor, c.id, TARGET, o), p = seatOf[actor], e0 = errs.length;
    const mark2 = await p.evaluate(() => window.ROBOCUS_DEBUG.PT.game.events.length);   // the player's own log: a warning only shows on its own screen
    await host.waitForTimeout(450);
    let geo = null;
    for (let k = 0; k < 12 && (!geo || geo.err); k++) { if (k) await host.waitForTimeout(250);   // the card reaches a joined screen with the next snapshot
    geo = await p.evaluate(([TARGET, self, robotPick, target]) => {
      const D = window.ROBOCUS_DEBUG, card = document.querySelector('#handStage .hs-card'); if (!card) return { err: 'the card is not in the hand on this screen' };
      const r = card.getBoundingClientRect(), mid = k => { const s = D.worldToScreen(k.x + k.w / 2, k.y + k.h / 2); return { x: s.x, y: s.y }; };
      const to = target === 'rival' || target === 'any' ? TARGET : self, H = D.hitRegions;
      const reg = (robotPick && H.find(k => k.kind === 'bay' && k.team === to && k.robot)) || H.find(k => k.kind === 'garage' && k.team === to);
      return reg ? { from: { x: r.left + r.width / 2, y: r.top + Math.min(40, r.height / 2) }, to: mid(reg), on: reg.kind } : { err: 'no place on this screen to drop the card on (team ' + to + ')' };
    }, [TARGET, actor, ROBOT_PICK.includes(c.name), c.target]); }
    const asked = [];
    if (!geo.err) {
      await p.mouse.move(geo.from.x, geo.from.y); await p.mouse.down(); await p.mouse.move((geo.from.x + geo.to.x) / 2, (geo.from.y + geo.to.y) / 2, { steps: 4 }); await p.mouse.move(geo.to.x, geo.to.y, { steps: 4 }); await p.mouse.up();
      for (let k = 0, quiet = 0; k < 60 && quiet < 3; k++) {   // answer every question by clicking, until the table is quiet again
        await host.waitForTimeout(220);
        let any = false;
        for (let s = 0; s < 4; s++) {
          const m = await seatOf[s].evaluate(modalOf); if (!m) continue; any = true;
          const who = s === actor ? 'PLAYER' : s === TARGET ? 'TARGET' : 'OTHER', tag = who + ': ' + norm(m.title, actor, TARGET); if (!asked.includes(tag)) asked.push(tag);
          const bt = m.id === 'dealModal' ? m.btns.find(x => x.k === 'lock') : s === TARGET && react && m.btns.find(x => react.test(x.label)) ? m.btns.find(x => react.test(x.label)) : s === actor ? (m.btns.find(x => x.primary) || m.btns[0]) : (m.btns.find(x => /Accept|Team up/.test(x.label)) || m.btns.find(x => /^Let it happen|^OK$|No bot|Let it through|^No$|Stay out|Refuse/.test(x.label)) || m.btns[0]);
          if (bt) { await seatOf[s].mouse.move(bt.x, bt.y); await seatOf[s].mouse.down(); await seatOf[s].mouse.up(); }
        }
        const busy = await host.evaluate(() => !!window.ROBOCUS_DEBUG.G.ivBusy);
        quiet = any || busy ? 0 : quiet + 1;
      }
    }
    const out = await host.evaluate(([mark, actor, id]) => { const D = window.ROBOCUS_DEBUG, ev = D.PT.game.events.slice(mark), pl = ev.filter(e => e.k === 'play'), warn = [];
      return { plays: pl.map(e => ({ text: e.text, result: e.result, steps: e.steps || [] })), warn, inHand: D.G.teams[actor].hand.includes(id), sec: D.G.teams[actor].secBots || 0, stuck: !!D.G.ivBusy, over: !!D.G.over }; }, [mark, actor, c.id]);
    out.warn = await p.evaluate(m => window.ROBOCUS_DEBUG.PT.game.events.slice(m).filter(e => e.k === 'msg' && /⚠️/.test(e.text)).map(e => e.text), mark2);
    if (out.stuck) {   // a question nobody could answer by clicking: close everything so the next card starts clean
      for (let s = 0; s < 4; s++) await seatOf[s].evaluate(() => { const R = window.ROBOCUS_DEBUG && window.ROBOCUS_DEBUG.RX; if (R && R.cur && !R.cur.over) R.cur.cancel(); if (R && R.q && !R.q.over) R.q.cancel(); for (const id of ['dealModal', 'ivModal']) { const m = document.getElementById(id); if (m && !m.hidden && m._finish) m._finish(); } });
      await host.evaluate(() => { for (let s = 1; s < 4; s++) window.ROBOCUS_NET.cancelSeat(s); }); await host.waitForTimeout(800);
    }
    const what = geo.err ? 'NOT PLAYED: ' + geo.err : out.stuck ? 'STUCK: the play never finished' : out.plays.length ? out.plays.map(x => x.result).join('+') : out.sec ? 'installed' : out.warn.length ? 'refused: ' + norm(out.warn[0], actor, TARGET).replace(/^⚠️ /, '') : out.inHand ? 'NOTHING HAPPENED (card still in hand, no message)' : 'played (no log entry)';
    asked.sort();   // windows open on several screens at once: the order they were seen in means nothing
    return { what, asked, text: out.plays.map(x => norm(x.text, actor, TARGET)).join(' / '), steps: out.plays.flatMap(x => x.steps).map(x => norm(x, actor, TARGET)), errs: errs.slice(e0) };
  }
  const rows = [], diffs = [];
  for (const c of cards) {
    if (only && !only.includes(c.id)) continue;
    const h = await playOnce(0, c), j = await playOnce(1, c);
    const same = h.what === j.what && h.asked.join('|') === j.asked.join('|') && h.text === j.text;
    rows.push({ c, h, j, same });
    console.log((same ? '  same  ' : '  DIFF  ') + c.name.padEnd(26) + ' host: ' + h.what + (same ? '' : '   |   joined: ' + j.what) + (h.asked.length ? '   [asks: ' + h.asked.join('; ') + ']' : ''));
    if (!same) { diffs.push(c.name); console.log('          host   : ' + h.text + ' · asks: ' + (h.asked.join('; ') || 'none') + '\n          joined : ' + j.text + ' · asks: ' + (j.asked.join('; ') || 'none')); }
    for (const e of h.errs.concat(j.errs)) console.log('          PAGE ERROR ' + e);
  }
  /* Part 2: the answers to a scheme. A joined player (seat 3) drags Smash and Grab on a target that holds one answer: once
   * the HOST is the target, once a JOINED player is. The target clicks its answer in the window it gets. Both must go the same way. */
  const rows2 = [], diffs2 = [];
  if (!only) {
    const sng = cards.find(c => c.name === 'Smash and Grab'), id = n => (cards.find(c => c.name === n) || {}).id, need = n => (cards.find(c => c.name === n) || {}).need || 0;
    const answers = [
      { name: 'Security Bot (in the garage)', roll: true, o: { tSec: 1, react: 'Roll a Security Bot' } },   // roll: a die decides the result, so only the questions are compared
      { name: 'Security Bot (in the hand)', roll: true, o: { tHand: ['security_bot'], react: 'Discard a Security Bot' } },
      ...['Paid Off', 'Fall Guy', 'Firewall', 'PR Spin', 'Not My Robot', "Sponsor's Lawyers", 'Under the Radar', 'Overreach'].map(n => ({ name: n, o: { tHand: [id(n)], react: n.replace(/[^\w ]/g, '.'), fameT: Math.max(7, need(n)), fameA: n === 'Overreach' ? Math.max(7, need(n)) - 1 : Math.max(7, need(n)) + 1 } })),
    ];
    console.log('\nAnswers to a scheme (Smash and Grab from a joined player), the target being the host or a joined player:');
    for (const a of answers) {
      const h = await playOnce(3, sng, Object.assign({ target: 0 }, a.o)), j = await playOnce(3, sng, Object.assign({ target: 1 }, a.o));
      const used = x => x.asked.some(t => /^TARGET/.test(t)), mine = x => x.asked.filter(t => /^TARGET/.test(t)).join('|');   // the others' windows close the moment the target clicks: whether the test saw them is luck
      const same = (a.roll || h.what === j.what) && mine(h) === mine(j);
      rows2.push({ a, h, j, same });
      console.log((same ? '  same  ' : '  DIFF  ') + a.name.padEnd(30) + ' host is target: ' + h.what + (same ? '' : '   |   joined is target: ' + j.what) + '   [asks: ' + (h.asked.join('; ') || 'none') + ']' + (used(h) && used(j) ? '' : '   <- THE TARGET GOT NO WINDOW'));
      if (!same) { diffs2.push(a.name); console.log('          joined is target asks: ' + (j.asked.join('; ') || 'none') + '\n          host steps  : ' + h.steps.join(' / ') + '\n          joined steps: ' + j.steps.join(' / ')); }
      if (!(used(h) && used(j))) diffs2.push(a.name + ' (no window)');
      for (const e of h.errs.concat(j.errs)) console.log('          PAGE ERROR ' + e);
    }
  }
  await host.evaluate(t => { window.ROBOCUS_DEBUG.G.intrigueTurn = t; }, turn0);
  const odd = rows.concat(rows2).filter(r => /STUCK|NOT PLAYED/.test(r.h.what + r.j.what)).map(r => (r.c || r.a).name);
  const notNow = rows.filter(r => /NOTHING HAPPENED/.test(r.h.what + r.j.what)).map(r => r.c.name);
  console.log('\n' + rows.length + ' cards, each dragged on the host screen and on a joined screen: ' + rows.filter(r => r.same).length + ' go the same way, ' + diffs.length + ' differ' + (diffs.length ? ' (' + diffs.join(', ') + ')' : '') + '.');
  if (notNow.length) console.log('Not playable from the hand in an Intrigue turn, on either screen (reaction, Host-step and Bets-step cards): ' + notNow.join(', '));
  if (rows2.length) console.log(rows2.length + ' answers to a scheme, the target being the host or a joined player: ' + rows2.filter(r => r.same).length + ' go the same way' + (diffs2.length ? ', trouble with: ' + diffs2.join(', ') : '') + '.');
  if (odd.length) console.log('Stuck or impossible on at least one screen: ' + odd.join(', '));
  const bad = [diffs.length && diffs.length + ' cards differ between host and joined', diffs2.length && diffs2.length + ' answers differ or got no window', odd.length && odd.length + ' plays got stuck', errs.length && errs.length + ' page errors'].filter(Boolean);
  console.log(bad.length ? 'FAIL: ' + bad.join('; ') : 'OK');
  await b.close(); process.exit(bad.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
