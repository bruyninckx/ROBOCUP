// A whole online game played with REAL MOUSE CLICKS on every screen (14 Nov, after the Friday playtest).
// One host + 3 joined tabs (local transport). The test bots only get everyone through the lobby; after that each seat is
// played by clicking what is on its own screen: the buttons, the canvas hit regions, dragging cards from the hand, the
// questions and deal panels. The host tells what the game is waiting for from each seat (seatBusyWith); when a seat can't
// get past a step by clicking, that step is reported as STUCK (with a screenshot) and the seat is skipped so the game goes on.
//   node tools/mp-scenario/click-game.js [seed=5] [maxMinutes=12] [shots=playtests/click-shots]
//   --watch (or WATCH=1): fights run in real time on every screen (4× speed) and every seat plays its live fight cards by clicking
//              the card and then a robot or a spot in the arena; without it fights are skipped at once.
//   --rain (or RAIN=1): at the start of every step each seat is dealt the cards that can be played in it (Host-step, Bets-step and
//             market-time cards, answers, a few schemes), so the rare card moments happen every round on every seat.
//   JSON=file …: also writes the findings as JSON (tools/mp-scenario/click-many.js adds several runs up).
// Output: per step, how often clicks got each kind of seat (host / joined) past it, every stuck step, page errors,
// fight mismatches, and whether every screen ends on the host's fame. While it plays it also checks (14 Nov, round 2):
//   - the host's game state for nonsense (negative or broken numbers, unknown cards, a fight with a missing robot…),
//   - every new log line for "undefined", "NaN", "null", "[object",
//   - that each joined screen shows the same table as the host (fame, credits, robots, crew, bots, hand sizes, its own hand).
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const ARGS = process.argv.slice(2).filter(a => !a.startsWith('--')), FLAG = f => process.argv.includes('--' + f);   // --watch and --rain do the same as WATCH=1 and RAIN=1
const seed = +(ARGS[0] || 5), maxMin = +(ARGS[1] || 12), shotDir = ARGS[2] || 'playtests/click-shots';
const rnd = () => Math.random(), pick = a => a[Math.floor(rnd() * a.length)];
const WATCH = process.env.WATCH === '1' || FLAG('watch'), RAIN = process.env.RAIN === '1' || FLAG('rain');
// what can be clicked on this screen right now
const collect = () => {
  const D = window.ROBOCUS_DEBUG, out = { modal: null, items: [], cards: [], drops: [] };
  const at = el => { const r = el.getBoundingClientRect(); if (r.width < 4 || r.height < 4) return null; const x = r.left + r.width / 2, y = r.top + r.height / 2; if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) return null; const top = document.elementFromPoint(x, y); return top && (top === el || el.contains(top) || top.contains(el)) ? { x, y } : null; };
  const lab = el => (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 28);
  for (const id of ['reactWin', 'ivModal', 'dealModal']) {   // the small reaction window first, then a question (it opens on top of a deal panel)
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
(async () => {
  const b = await chromium.launch();
  setTimeout(() => { console.log('HARD STOP: the run did not end by itself'); b.close().catch(() => {}).then(() => process.exit(3)); setTimeout(() => process.exit(3), 5000); }, (maxMin + 2) * 60000).unref();   // never leave browsers behind overnight
  const ctx = await b.newContext({ viewport: { width: 1600, height: 900 } });
  if (fs.existsSync('vendor/planck-1.4.3.min.js')) await ctx.route(/^https?:/, r => r.abort());
  const errs = [];
  const base = require('url').pathToFileURL(path.resolve('prototypes/tabletop-2.html')).href + '?net=local&room=C' + seed + '&bot=1' + (WATCH ? '&watch=1' : '');
  const warns = [];
  const open = async (q, tag) => { const p = await ctx.newPage(); p.on('console', m => { if (/desync/i.test(m.text())) warns.push(tag + ': ' + m.text()); }); p.on('pageerror', e => errs.push(tag + ': ' + e.message + ' @ ' + String(e.stack || '').split('\n').slice(1, 3).map(x => x.trim().replace(/\(file:.*?html[^:]*:/, '(:')).join(' < '))); await p.goto(base + q); return p; };
  const host = await open('&host=1&name=Host&autostart=3&seed=' + seed, 'host');
  const pages = [host]; for (let k = 1; k <= 3; k++) pages.push(await open('&name=P' + k, 'P' + k));
  await host.waitForFunction(() => window.ROBOCUS_GAME && window.ROBOCUS_GAME.role === 'host' && window.ROBOCUS_GAME.G, null, { timeout: 30000 });
  await host.waitForTimeout(800);
  for (const p of pages) await p.evaluate(() => { window.__noBot = true; const pin = document.getElementById('handPin'); if (pin && !/✓|on/i.test(pin.className)) pin.click(); });
  const seatOf = {}; for (const p of pages) seatOf[await p.evaluate(() => window.ROBOCUS_GAME.HS)] = p;
  const kind = s => s === 0 ? 'host' : 'joined';
  const stat = {}, stuck = [], tries = {}, t0 = Date.now(); let lastKey = {}, since = {}, shots = 0, firstErr = null, rainKey = '', logN = 0, lastSync = 0, fightAt = 0, fightKey = '';
  const pressed = {}, pressedAt = {}, pressedN = {}, lastDiff = {}, notes = [], seenNote = {}, liveTried = { host: 0, joined: 0 }, livePlayed = { host: 0, joined: 0 };
  const note = (kind, text, st) => { const k = kind + '|' + text.replace(/\d+/g, '#'); if (seenNote[k]) return; seenNote[k] = 1; notes.push({ kind, text, round: st.round, phase: st.phase }); console.log(kind.toUpperCase() + ' · round ' + st.round + ' ' + st.phase + ' · ' + text); };
  const bump = (label, s, what) => { const k = label + ' | ' + kind(s); stat[k] = stat[k] || { ok: 0, stuck: 0 }; stat[k][what]++; };
  const click = async (p, it) => { if (!it) return; await p.mouse.move(it.x, it.y); await p.mouse.down(); await p.mouse.up(); };
  const drag = async (p, a, z) => { if (!a || !z) return; await p.mouse.move(a.x, a.y); await p.mouse.down(); await p.mouse.move((a.x + z.x) / 2, (a.y + z.y) / 2, { steps: 3 }); await p.mouse.move(z.x, z.y, { steps: 3 }); await p.mouse.up(); };
  for (;;) {
    const st = await host.evaluate(() => { const GM = window.ROBOCUS_GAME, G = GM.G; if (G.over) return null; return { round: G.round, phase: G.phase, stage: G.marketStage || '', busy: [0, 1, 2, 3].map(s => GM.seatBusyWith(s)) }; });
    if (!st) break;
    // ---- RAIN: deal every seat the cards of this step (once per step), so the rare card moments are played all the time
    if (RAIN && st.round + st.phase + st.stage !== rainKey) { rainKey = st.round + st.phase + st.stage;
      await host.evaluate(([phase, stage]) => { const D = window.ROBOCUS_DEBUG, G = D.G, C = D.CARDS, id = n => Object.keys(C).find(k => C[k].name === n);
        const give = (t, names) => { for (const n of names) { const k = id(n); if (k && !t.hand.includes(k) && t.hand.length < 9) t.hand.push(k); } };
        const schemes = Object.keys(C).filter(k => C[k].phase === 'intrigue' && !C[k].auction), answers = ['Paid Off', 'Fall Guy', 'Firewall', 'PR Spin', 'Not My Robot', "Sponsor's Lawyers", 'Under the Radar', 'Overreach', 'Override', 'Security Bot'];
        const some = (list, n) => list.slice().sort(() => Math.random() - 0.5).slice(0, n);
        for (const t of G.teams) {
          if (phase === 'intrigue') { for (const k of some(schemes, 2)) if (!t.hand.includes(k) && t.hand.length < 9) t.hand.push(k); give(t, some(answers, 2)); }
          if (phase === 'market' && stage === 'lots') give(t, ['Botched Install', 'Pile-On', 'Board Seat', 'Override']);
          if (phase === 'market' && stage === 'host') give(t, ['Grand Melee', 'Mirror', 'Unleash the House Robot']);
          if (phase === 'arena') give(t, ['Grand Melee', 'Mirror', 'Unleash the House Robot', 'Blaze of Glory']);
          if (phase === 'bets') give(t, ['Hedge Bet', "Bookie's Friend", 'Blaze of Glory']);
        }
        D.updateHud(); }, [st.phase, st.stage]); }
    // ---- checks on the host's game: nonsense in the state, nonsense in the log
    { const r = await host.evaluate(n0 => { const D = window.ROBOCUS_DEBUG, G = D.G, bad = [], num = (v, what) => { if (typeof v !== 'number' || !isFinite(v)) bad.push(what + ' is ' + v); else if (v < 0) bad.push(what + ' is negative (' + v + ')'); };
        for (const t of G.teams) { const w = t.name;
          num(t.credits, w + ' credits'); num(t.fame, w + ' fame'); num(t.secBots || 0, w + ' Security Bots');
          if (!Number.isInteger(t.credits)) bad.push(w + ' credits is not a whole number (' + t.credits + ')');
          if (t.robots.length > 3) bad.push(w + ' has ' + t.robots.length + ' robots');
          for (const id of t.hand) if (!D.CARDS[id]) bad.push(w + ' holds an unknown card (' + id + ')');
          for (const r of t.robots) { if (!r || !r.name) bad.push(w + ' has a broken robot'); else { if (typeof r.wins !== 'number' || r.wins < 0) bad.push(w + ' ' + r.name + ' Fan tokens: ' + r.wins); if ((r.parts || []).some(x => !x)) bad.push(w + ' ' + r.name + ' has an empty part'); } }
          if (!Array.isArray(t.crew) || t.crew.some(c => !c || !c.kind)) bad.push(w + ' has a broken crew member'); }
        const F = G.fight; if (F && (G.phase === 'bets' || G.phase === 'fight') && (F.robots || []).some(r => !r)) bad.push('a fight with a missing robot (' + G.phase + ')');
        if (F && F.p && F.p.some(p => !(p >= 0 && p <= 1))) bad.push('fight odds are broken: ' + JSON.stringify(F.p));
        const ev = D.PT.game.events, lines = []; for (let i = n0; i < ev.length; i++) if (ev[i].k === 'msg' && /undefined|NaN|\bnull\b|\[object/.test(ev[i].text)) lines.push(ev[i].text.slice(0, 160));
        return { bad, lines, n: ev.length }; }, logN);
      logN = r.n;
      for (const x of r.bad) note('state', x, st); for (const x of r.lines) note('log', x, st); }
    // ---- every joined screen must show the host's table (checked when the table is quiet, twice in a row before it counts)
    if (Date.now() - lastSync > 2500) { lastSync = Date.now();
      const proj = `(() => { const G = window.ROBOCUS_GAME.G, me = window.ROBOCUS_GAME.HS; return { busy: !!G.ivBusy, key: G.round + G.phase, me, teams: G.teams.map(t => ({ fame: t.fame, credits: t.credits, bots: t.secBots || 0, hand: t.hand.length, crew: t.crew.map(c => c.kind).sort().join(','), robots: t.robots.map(r => r.name + (r.exhausted ? ' (resting)' : '') + ' ★' + r.wins + ' [' + (r.parts || []).map(x => x.id || x).join(',') + ']').join(' | ') })), hands: G.teams.map(t => t.hand.slice().sort().join(',')) }; })()`;
      const hs = await host.evaluate(proj);
      if (!hs.busy) for (let s = 1; s < 4; s++) { const c = await seatOf[s].evaluate(proj); const d = [];
        if (c.key !== hs.key) d.push('phase: host ' + hs.key + ', joined ' + c.key);
        else { hs.teams.forEach((t, i) => { for (const k of Object.keys(t)) if (t[k] !== c.teams[i][k]) d.push(k + ' of team ' + i + ': host "' + t[k] + '", joined "' + c.teams[i][k] + '"'); }); if (hs.hands[s] !== c.hands[s]) d.push('its own hand: host "' + hs.hands[s] + '", joined "' + c.hands[s] + '"'); }
        const sig = d.map(x => x.split(':')[0]).join(';');
        if (d.length && sig === lastDiff[s]) { for (const x of d.slice(0, 3)) note('sync', 'seat ' + s + ' shows another ' + x, st); lastDiff[s] = ''; } else lastDiff[s] = sig; } }
    if (errs.length && !firstErr) {   // the moment of the first page error: what the host's game looked like
      firstErr = await host.evaluate(() => { const G = window.ROBOCUS_GAME.G, F = G.fight, ev = window.ROBOCUS_DEBUG.PT.game.events;
        return { round: G.round, phase: G.phase, fight: F ? { format: F.format, teams: F.teams, sides: F.sides, robots: (F.robots || []).map(r => r ? r.name : null), event: F.event && F.event.kind } : null, log: ev.filter(e => e.k === 'msg' || e.k === 'act').slice(-14).map(e => e.k === 'act' ? 'act seat ' + e.seat + ' ' + e.name : e.text.slice(0, 110)) }; });
      console.log('FIRST PAGE ERROR: ' + errs[0] + '\n' + JSON.stringify(firstErr.fight) + ' round ' + firstErr.round + ' ' + firstErr.phase + '\n  ' + firstErr.log.join('\n  '));
    }
    if (Date.now() - t0 > maxMin * 60000) { console.log('TIME UP in round', st.round, st.phase); break; }
    for (let s = 0; s < 4; s++) {
      const p = seatOf[s], C = await p.evaluate(collect);
      const label = C.modal ? (C.modal === 'dealModal' ? 'deal panel' : C.modal === 'reactWin' ? 'reaction window' : 'question') + ': ' + C.title.replace(/[^A-Za-z ?]/g, '').trim().split(' ').slice(0, 4).join(' ') : st.busy[s];
      const key = label ? label + '@' + st.round + st.phase + st.stage : null;
      if (key !== lastKey[s]) { if (lastKey[s] && !lastKey[s].startsWith('!')) bump(lastKey[s].split('@')[0], s, 'ok'); lastKey[s] = key; since[s] = Date.now(); tries[s] = 0; }
      if (!label) continue;
      if (lastKey[s].startsWith('!')) continue;
      tries[s]++;
      if (tries[s] > 80 || Date.now() - since[s] > 120000) {   // clicking doesn't get this seat past the step
        const file = path.join(shotDir, 'stuck-' + (++shots) + '-' + kind(s) + '-' + label.replace(/[^a-z0-9]+/gi, '_').slice(0, 40) + '.png');
        try { fs.mkdirSync(shotDir, { recursive: true }); await p.screenshot({ path: file }); } catch (e) {}
        stuck.push({ seat: s, kind: kind(s), label, round: st.round, phase: st.phase + (st.stage ? '/' + st.stage : ''), canClick: [...new Set(C.items.map(i => i.label))].slice(0, 14), cards: C.cards.length, shot: file });
        bump(label, s, 'stuck'); console.log('STUCK', kind(s), 'seat', s, '·', label, '· round', st.round, st.phase, st.stage);
        lastKey[s] = '!' + key;
        // let the game go on: close its questions, play the step with the test bot's own actions, then skip the seat
        await p.evaluate(() => { for (const id of ['dealModal', 'ivModal', 'reactWin']) { const m = document.getElementById(id); if (m && !m.hidden && m._finish) m._finish(); } window.__noBot = false; });
        await p.waitForTimeout(1200); await p.evaluate(() => { window.__noBot = true; });
        await host.evaluate(s => window.ROBOCUS_GAME.skipSeat(s), s);
        continue;
      }
      // choose something to click
      const press = re => C.items.find(i => i.type === 'btn' && re.test(i.label));
      if (C.modal === 'dealModal') { const plus = C.items.filter(i => i.label === '+'); if (plus.length && rnd() < 0.4) await click(p, pick(plus)); else await click(p, C.items.find(i => i.k === (rnd() < 0.7 ? 'lock' : 'no')) || pick(C.items)); continue; }
      if (C.modal) { const bs = C.items.filter(i => i.type === 'btn'), ins = C.items.filter(i => i.type === 'in'); if (ins.length && rnd() < 0.3) await click(p, pick(ins)); else if (bs.length) await click(p, rnd() < 0.7 ? (bs.find(i => i.primary) || pick(bs)) : pick(bs)); continue; }
      if (label === 'intrigue turn') {
        const end = press(/End turn/);
        if (C.cards.length && C.drops.length && tries[s] <= 4 && rnd() < 0.7) { await drag(p, pick(C.cards), pick(C.drops)); continue; }
        if (tries[s] <= 2 && rnd() < 0.3) { const cash = press(/Cash-in/); if (cash && C.cards.length) { await click(p, cash); await p.waitForTimeout(150); const C2 = await p.evaluate(collect); if (C2.cards.length) await click(p, pick(C2.cards)); const done = (await p.evaluate(collect)).items.find(i => /Done cashing/.test(i.label)); if (done) await click(p, done); continue; } }
        if (end) await click(p, end);
        continue;
      }
      const bar = C.items.filter(i => i.bar), hits = C.items.filter(i => i.type === 'hit' && !/garage|bay$/.test(i.kind)), bays = C.items.filter(i => /garage|bay/.test(i.kind || '')), other = C.items.filter(i => i.type === 'btn' && !i.bar);
      const pool = [];
      // the button that ends the step (Lock, Done, Continue, Start…). Once a seat pressed it, it leaves the table alone like a
      // person would: four seats that keep changing bets undo each other's lock for ever. It only presses it again now and then.
      const go = bar.filter(i => /→|Lock|Done|Continue|Start the auction|Next round/.test(i.label));
      // (three presses that change nothing: the button is not ready yet, e.g. "Invite Fighters" with one team picked. Back to the table.)
      if (pressed[s] === key) { if (!go.length || pressedN[s] >= 3) { pressed[s] = null; } else { if (Date.now() - pressedAt[s] > 2500) { pressedAt[s] = Date.now(); pressedN[s]++; await click(p, pick(go)); } continue; } }
      if (go.length && rnd() < 0.15 + 0.1 * (tries[s] % 12)) { pressed[s] = key; pressedAt[s] = Date.now(); pressedN[s] = 0; await click(p, pick(go)); continue; }
      if (bar.length && rnd() < 0.25) pool.push(pick(bar));
      else { if (hits.length) pool.push(pick(hits), pick(hits)); if (bays.length) pool.push(pick(bays)); if (other.length) pool.push(pick(other)); if (!pool.length && bar.length) pool.push(pick(bar)); }
      if (pool.length) await click(p, pick(pool));
    }
    // the fight screen. Watched: every seat plays its live cards by clicking (the card, then a robot or a spot), the host runs it
    // at 4× and skips after 25 s; else the host skips at once. Then the host closes it.
    if (st.phase === 'fight') {
      const fk = st.round + ':' + st.phase; if (fk !== fightKey) { fightKey = fk; fightAt = Date.now(); }
      if (WATCH && Date.now() - fightAt < 25000) {
        await host.evaluate(() => { const b = document.querySelector('#fightView:not([hidden]) [data-sp="4"]'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); });
        for (let s = 0; s < 4; s++) {
          const p = seatOf[s], g = await p.evaluate(() => { const v = document.getElementById('fightView'); if (!v || v.hidden) return null; const VW = window.RobocusView, S = VW.state; if (!S || S.over || S.countdown > 0) return null;
            const cs = [...v.querySelectorAll('.fv-card:not([disabled])')]; if (!cs.length) return null; const c = cs[Math.floor(Math.random() * cs.length)], r = c.getBoundingClientRect();
            return { n: cs.length, card: { x: r.left + r.width / 2, y: r.top + r.height / 2 }, bots: S.robots.filter(R => R.alive).map(R => { const q = R.body.getPosition(), xy = VW.clientOf(q.x, q.y); return { x: xy[0], y: xy[1] }; }), spot: (() => { const xy = VW.clientOf((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4); return { x: xy[0], y: xy[1] }; })() }; });
          if (!g) continue;
          liveTried[s === 0 ? 'host' : 'joined']++;
          await click(p, g.card);
          for (const pt of g.bots.sort(() => rnd() - 0.5).concat([g.spot, g.spot])) { await click(p, pt); await p.waitForTimeout(60); const left = await p.evaluate(() => document.querySelectorAll('#fightView .fv-card').length); if (left < g.n) { livePlayed[s === 0 ? 'host' : 'joined']++; break; } }
        }
      } else await host.evaluate(() => { const v = document.getElementById('fightView'); if (v && !v.hidden) { const sk = v.querySelector('.fv-skip:not([hidden])'); if (sk) sk.click(); } });
      await host.evaluate(() => { const v = document.getElementById('fightView'); if (v && !v.hidden) { const d = v.querySelector('.fv-done:not([hidden])'); if (d) d.click(); } });
    }
    await host.waitForTimeout(60);
  }
  await host.waitForTimeout(1500);
  const H = await host.evaluate(() => { const G = window.ROBOCUS_GAME.G, ev = window.ROBOCUS_DEBUG.PT.game.events, acts = {}; for (const e of ev) if (e.k === 'act' && e.remote) acts[e.name] = (acts[e.name] || 0) + 1; return { over: !!G.over, round: G.round, fame: G.teams.map(t => t.fame), acts, clientTrouble: ev.filter(e => /^client_(desync|error)/.test(e.k)).map(e => e.k + ' seat ' + e.seat + ' ' + (e.msg || e.fid || '')), errs: ev.filter(e => e.k === 'error').map(e => e.msg) }; });
  const cl = []; for (let s = 1; s < 4; s++) cl.push(await seatOf[s].evaluate(() => ({ seat: window.ROBOCUS_GAME.HS, fame: window.ROBOCUS_GAME.G.teams.map(t => t.fame), desyncs: window.ROBOCUS_GAME.desyncs })));
  console.log('\n=== click game, seed ' + seed + ': ' + (H.over ? 'finished' : 'not finished') + ' in round ' + H.round + ', ' + ((Date.now() - t0) / 60000).toFixed(1) + ' min ===');
  console.log('step | seat kind                         clicks got past it   stuck');
  for (const k of Object.keys(stat).sort()) console.log('  ' + k.padEnd(52) + String(stat[k].ok).padStart(4) + String(stat[k].stuck).padStart(10));
  console.log('actions joined players sent by clicking: ' + Object.keys(H.acts).sort().map(k => k + ' ' + H.acts[k]).join(', '));
  if (stuck.length) { console.log('\nSTUCK steps:'); const seen = {}; for (const x of stuck) { const k = x.kind + x.label; seen[k] = (seen[k] || 0) + 1; if (seen[k] > 1) continue; console.log('  ' + x.kind + ' · ' + x.label + ' · round ' + x.round + ' ' + x.phase + ' · could click: ' + (x.canClick.join(', ') || 'nothing') + ' · cards in hand ' + x.cards + ' · ' + x.shot); } }
  const live = await host.evaluate(() => { const h = { host: 0, joined: 0, refused: {} }; for (const e of window.ROBOCUS_DEBUG.PT.game.events) { if (e.k === 'live_card') h[e.team === 0 ? 'host' : 'joined']++; if (e.k === 'live_reject') { const k = String(e.why).replace(/\d+/g, '#'); h.refused[k] = (h.refused[k] || 0) + 1; } } return h; });
  // what came of it, host seat against joined seats (from the host's log): a bug that makes something silently fail for joined
  // players (Friday: every deal panel) shows here as "joined 0" next to a host that manages it
  const outcomes = await host.evaluate(() => { const G = window.ROBOCUS_GAME.G, ev = window.ROBOCUS_DEBUG.PT.game.events, kind = n => n === G.teams[0].name ? 'host' : G.teams.some(t => t.name === n) ? 'joined' : null;
    const o = {}, add = (what, k) => { if (!k) return; o[what] = o[what] || { host: 0, joined: 0 }; o[what][k]++; }, who = txt => { const m = G.teams.map(t => t.name).sort((a, b) => b.length - a.length).find(n => txt.includes(n)); return kind(m); };
    for (const e of ev) {
      if (e.k === 'play') { const k = who(e.text); add('cards played', k); add('cards ' + e.result, k); if ((e.steps || []).some(x => /asks for backing/.test(x))) { add('backing asked', k); if ((e.steps || []).some(x => / backs /.test(x))) add('backing got', k); } }
      if (e.k === 'msg') { let m;
        if ((m = /pays the host/.exec(e.text))) add('paid the host (spare, scrap, invite)', who(e.text));
        if ((m = /^🤝 Trade: /.exec(e.text))) { for (const t of G.teams) if (e.text.includes(t.name)) add('in a trade that went through', kind(t.name)); }
        if (/Offers to the host/.test(e.text)) for (const t of G.teams) if (e.text.includes(t.name)) add('made an offer on spare or scrap', kind(t.name)); }
    }
    return o; });
  console.log('what came of it (host seat · the 3 joined seats together):'); for (const k of Object.keys(outcomes).sort()) console.log('  ' + k.padEnd(40) + String(outcomes[k].host).padStart(4) + ' ·' + String(outcomes[k].joined).padStart(4));
  if (WATCH) console.log('live fight cards: host clicked ' + liveTried.host + ', played ' + live.host + ' · joined clicked ' + liveTried.joined + ', played ' + live.joined + (Object.keys(live.refused).length ? ' · the host refused from joined players: ' + JSON.stringify(live.refused) : ''));
  if (notes.length) { console.log('\nFINDINGS while playing:'); for (const x of notes) console.log('  ' + x.kind + ' · round ' + x.round + ' ' + x.phase + ' · ' + x.text); }
  const bad = [];
  if (notes.length) bad.push(notes.length + ' findings (state, log or screens out of step)');
  if (warns.length) bad.push(warns.length + ' fight mismatch warnings');
  if (stuck.length) bad.push(stuck.length + ' stuck steps');
  if (errs.length || H.errs.length) bad.push((errs.length + H.errs.length) + ' page errors');
  if (H.clientTrouble.length) bad.push('joined screens reported: ' + [...new Set(H.clientTrouble)].slice(0, 5).join('; '));
  cl.forEach(c => { if (JSON.stringify(c.fame) !== JSON.stringify(H.fame)) bad.push('seat ' + c.seat + ' shows other fame than the host'); if (c.desyncs) bad.push('seat ' + c.seat + ': ' + c.desyncs + ' fights ended differently'); });
  [...new Set(errs.concat(H.errs))].slice(0, 10).forEach(e => console.log('ERROR ' + e));
  if (process.env.JSON) fs.writeFileSync(process.env.JSON, JSON.stringify({ seed, watch: WATCH, rain: RAIN, over: H.over, round: H.round, minutes: (Date.now() - t0) / 60000, stat, outcomes, stuck, notes, errors: [...new Set(errs.concat(H.errs))], firstErr, warns, clientTrouble: H.clientTrouble, acts: H.acts, live: { tried: liveTried, played: live }, fame: { host: H.fame, clients: cl } }, null, 1));
  console.log(bad.length ? 'FAIL: ' + bad.join('; ') : 'OK');
  await b.close(); process.exit(bad.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
