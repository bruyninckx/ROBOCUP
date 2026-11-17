// The clicker (15 Nov): what the click tests share. `collect` runs in the page and lists what can be clicked there right
// now; `choose` picks one thing and clicks or drags it with the real mouse; `liveCards` plays a live fight card.
// Used by click-game.js (four tabs on one PC) and remote.js (two PCs over the internet).
const rnd = () => Math.random(), pick = a => a[Math.floor(rnd() * a.length)];
const click = async (p, it) => { if (!it) return; await p.mouse.move(it.x, it.y); await p.mouse.down(); await p.mouse.up(); };
const drag = async (p, a, z) => { if (!a || !z) return; await p.mouse.move(a.x, a.y); await p.mouse.down(); await p.mouse.move((a.x + z.x) / 2, (a.y + z.y) / 2, { steps: 3 }); await p.mouse.move(z.x, z.y, { steps: 3 }); await p.mouse.up(); };
const collect = () => {
  const D = window.ROBOCUS_DEBUG, out = { modal: null, items: [], cards: [], drops: [] };
  const at = el => { const r = el.getBoundingClientRect(); if (r.width < 4 || r.height < 4) return null; const x = r.left + r.width / 2, y = r.top + r.height / 2; if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) return null; const top = document.elementFromPoint(x, y); return top && (top === el || el.contains(top) || top.contains(el)) ? { x, y } : null; };
  const lab = el => (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 28);
  { const pb = document.getElementById('promptBar'), bs = pb && pb.classList.contains('rxmode') ? [...pb.querySelectorAll('[data-rk]:not(:disabled)')] : [];   // T2: the reaction window is in the note
    if (bs.length) { out.modal = 'reactWin'; out.title = lab(pb.querySelector('.rx-head b') || pb); bs.forEach(b => { const p = at(b); if (p) out.items.push(Object.assign({ type: 'btn', label: lab(b), primary: !b.classList.contains('secondary'), k: b.dataset.rk }, p)); }); return out; } }
  for (const id of ['ivModal', 'dealModal']) {   // a question (it opens on top of a deal panel)
    const m = document.getElementById(id);
    if (m && !m.hidden) {
      out.modal = id; out.title = lab(m.querySelector('h3') || m.querySelector('.rw-head span') || m);
      m.querySelectorAll('button, input[type=checkbox], .dl-chip').forEach(b => { const p = b.disabled ? null : at(b); if (p) out.items.push(Object.assign({ type: b.tagName === 'BUTTON' ? 'btn' : 'in', label: lab(b) || b.type, primary: b.classList.contains('primary'), k: b.dataset.k || '' }, p)); });
      return out;
    }
  }
  const skip = '#netLobby, #netWait, #netPause, #fightView, #logPanel, #topBar, .hand-bar, #awards, .aw-btns';
  document.querySelectorAll('button').forEach(b => { if (b.disabled || b.hidden || b.closest(skip)) return; const p = at(b); if (p) out.items.push(Object.assign({ type: 'btn', label: lab(b), id: b.id || '', bar: !!b.closest('#promptBar') }, p)); });
  const cv = document.getElementById('worldCv');
  for (const r of D.hitRegions) {
    const s = D.worldToScreen(r.x + r.w / 2, r.y + r.h / 2);
    if (s.x < 2 || s.y < 2 || s.x > innerWidth - 2 || s.y > innerHeight - 2 || document.elementFromPoint(s.x, s.y) !== cv) continue;
    const it = { type: 'hit', kind: r.kind, label: r.kind + (r.idx != null ? ' ' + r.idx : '') + (r.team != null ? ' team ' + r.team : '') + (r.zone ? ' ' + r.zone : ''), x: s.x, y: s.y, team: r.team };
    if (r.kind === 'garage' || r.kind === 'bay' || r.kind === 'arena') out.drops.push(it);
    if (r.kind !== 'arena' && r.kind !== 'odds') out.items.push(it);
  }
  document.querySelectorAll('#handStage .hs-card').forEach(c => { const r = c.getBoundingClientRect(); if (r.width > 4) out.cards.push({ x: r.left + r.width / 2, y: r.top + Math.min(40, r.height / 2), label: lab(c.querySelector('.hs-title') || c) }); });
  return out;
};
// one move for a seat that the game is waiting for. C = collect() of its page, label = what it waits for, key = label + the
// step it is in, m = this seat's memory ({ tries, pressed, at, n }; tries is kept by the caller)
async function choose(p, C, label, key, m) {
    const press = re => C.items.find(i => i.type === 'btn' && re.test(i.label));
    if (C.modal === 'dealModal') { const plus = C.items.filter(i => i.label === '+'); if (plus.length && rnd() < 0.4) await click(p, pick(plus)); else await click(p, C.items.find(i => i.k === (rnd() < 0.7 ? 'lock' : 'no')) || pick(C.items)); return; }
    if (C.modal) { const bs = C.items.filter(i => i.type === 'btn'), ins = C.items.filter(i => i.type === 'in'); if (ins.length && rnd() < 0.3) await click(p, pick(ins)); else if (bs.length) await click(p, rnd() < 0.7 ? (bs.find(i => i.primary) || pick(bs)) : pick(bs)); return; }
    if (label === 'intrigue turn') {
      const end = press(/End turn/);
      if (C.cards.length && C.drops.length && m.tries <= 4 && rnd() < 0.7) { await drag(p, pick(C.cards), pick(C.drops)); return; }
      if (m.tries <= 2 && rnd() < 0.3) { const cash = press(/Cash-in/); if (cash && C.cards.length) { await click(p, cash); await p.waitForTimeout(150); const C2 = await p.evaluate(collect); if (C2.cards.length) await click(p, pick(C2.cards)); const done = (await p.evaluate(collect)).items.find(i => /Done cashing/.test(i.label)); if (done) await click(p, done); return; } }
      if (end) await click(p, end);
      return;
    }
    const bar = C.items.filter(i => i.bar), hits = C.items.filter(i => i.type === 'hit' && !/garage|bay$/.test(i.kind)), bays = C.items.filter(i => /garage|bay/.test(i.kind || '')), other = C.items.filter(i => i.type === 'btn' && !i.bar);
    // a dropdown in the note (the host's arena): now and then pick another option, with the real control
    if (rnd() < 0.12) { try { const sel = p.locator('#promptBar select'), n = await sel.count(); if (n) { const one = sel.nth(Math.floor(rnd() * n)), opts = await one.locator('option:not([disabled])').count(); if (opts > 1) { await one.selectOption({ index: Math.floor(rnd() * opts) }, { timeout: 1500 }); return; } } } catch (e) {} }
    const pool = [];
    // the button that ends the step (Lock, Done, Continue, Start…). Once a seat pressed it, it leaves the table alone like a
    // person would: four seats that keep changing bets undo each other's lock for ever. It only presses it again now and then.
    const go = bar.filter(i => /→|Lock|Done|Continue|Start the auction|Next round/.test(i.label));
    // (three presses that change nothing: the button is not ready yet, e.g. "Invite Fighters" with one team picked. Back to the table.)
    if (m.pressed === key) { if (!go.length || m.n >= 3) { m.pressed = null; } else { if (Date.now() - m.at > 2500) { m.at = Date.now(); m.n++; await click(p, pick(go)); } return; } }
    if (go.length && rnd() < 0.15 + 0.1 * (m.tries % 12)) { m.pressed = key; m.at = Date.now(); m.n = 0; await click(p, pick(go)); return; }
    if (bar.length && rnd() < 0.25) pool.push(pick(bar));
    else { if (hits.length) pool.push(pick(hits), pick(hits)); if (bays.length) pool.push(pick(bays)); if (other.length) pool.push(pick(other)); if (!pool.length && bar.length) pool.push(pick(bar)); }
    if (pool.length) await click(p, pick(pool));
}
// a watched fight: click one of this screen's live cards, then a robot or a spot in the arena. Returns { tried, played }
async function liveCards(p) {
  const g = await p.evaluate(() => { const v = document.getElementById('fightView'); if (!v || v.hidden) return null; const VW = window.RobocusView, S = VW.state; if (!S || S.over || S.countdown > 0) return null;
    const cs = [...v.querySelectorAll('.fv-card:not([disabled])')]; if (!cs.length) return null; const c = cs[Math.floor(Math.random() * cs.length)], r = c.getBoundingClientRect();
    return { n: cs.length, card: { x: r.left + r.width / 2, y: r.top + r.height / 2 }, bots: S.robots.filter(R => R.alive).map(R => { const q = R.body.getPosition(), xy = VW.clientOf(q.x, q.y); return { x: xy[0], y: xy[1] }; }), spot: (() => { const xy = VW.clientOf((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4); return { x: xy[0], y: xy[1] }; })() }; });
  if (!g) return { tried: 0, played: 0 };
  await click(p, g.card);
  for (const pt of g.bots.sort(() => rnd() - 0.5).concat([g.spot, g.spot])) { await click(p, pt); await p.waitForTimeout(60); const left = await p.evaluate(() => document.querySelectorAll('#fightView .fv-card').length); if (left < g.n) return { tried: 1, played: 1 }; }
  return { tried: 1, played: 0 };
}
module.exports = { collect, choose, liveCards, click, drag, rnd, pick };
