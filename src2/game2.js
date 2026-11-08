// ROBOCUS 2.0 tabletop prototype: game layer (work in progress, 8 Nov 2026).
// First playable slice of 2.0: four teams, robots from the 2.0 lineup, the physics fights in the full-screen view,
// damage that stays on the robots between fights, and crew who repair it (Kev, 8 Nov: "option 2, much fun").
// The 1.0 game (prototypes/tabletop-prototype.html, src/sim.js) is not touched; auctions, Intrigue, bets and live
// cards come over in the next steps. Game randomness comes from a seeded RNG (L.mkRng); fights use their own seeds.
(function () {
  'use strict';
  const L = window.DamageLab, LU = window.Lineup, VW = window.RobocusView;
  LU.usePK();
  const $ = id => document.getElementById(id);
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const PALS = [
    { name: 'Steel', col: '#3F78A8', dark: '#2C5679', light: '#79A4CB' }, { name: 'Rust', col: '#C8642B', dark: '#8E431B', light: '#E59866' },
    { name: 'Moss', col: '#4C8A3F', dark: '#35612C', light: '#8BC07A' }, { name: 'Violet', col: '#8B6BB1', dark: '#5E4580', light: '#B79AD8' }];
  // crew: repair actions per Upkeep. Using any of a crew member's actions exhausts it for the round.
  const CREW = { mech: { label: 'Mechanic', acts: 1 }, chief: { label: 'Chief Engineer', acts: 2 }, tech: { label: 'Repair Tech', acts: 3 } };
  const ACTION_CR = 2;   // an extra repair action bought with credits
  const FAME_GOAL = 5;   // this slice: first to 5 fame wins
  const OK = 0.95;       // a part above 95% counts as fine (scratches)

  let G = null, rng = null;
  const pick = a => a[Math.floor(rng() * a.length)];
  const byLevel = n => Object.keys(LU.ROBOTS).filter(k => LU.ROBOTS[k][0] === n);

  function newGame(seed) {
    seed = seed || 1 + Math.floor(Math.random() * 999999); rng = L.mkRng(seed);
    const starters = byLevel(0).slice(), l1 = byLevel(1).slice();
    const draw = list => list.splice(Math.floor(rng() * list.length), 1)[0];
    G = { seed, round: 1, phase: 'repair', log: [], uid: 1, over: null, teams: PALS.map((pal, t) => ({
      t, pal, name: t ? pal.name : pal.name + ' (you)', ai: t > 0, fame: 0, cr: 8,
      crew: [{ type: 'mech' }, { type: 'mech' }, { type: 'mech' }, { type: 'chief' }].map(c => Object.assign(c, { used: 0 })),
      robots: [] })) };
    for (const T of G.teams) for (const nm of [draw(starters), draw(l1)]) T.robots.push({ uid: G.uid++, name: nm, level: LU.ROBOTS[nm][0], wear: null, fights: 0, wins: 0 });
    say(`New game (seed ${seed}). Every team has a starter and a level 1 robot, 3 Mechanics and a Chief Engineer. First to ${FAME_GOAL} fame wins.`);
    upkeep(true);
  }
  function say(t, cls) { G.log.unshift({ r: G.round, t, cls }); }

  // ---------- robots and their damage ----------
  function specOf(rob, T) { return Object.assign(LU.build(rob.name, rob.parts || []), { name: rob.name, wear: rob.wear, pal: T ? T.pal : undefined, teamName: T ? T.pal.name : '', level: rob.level }); }
  function probe(rob, T) { return L.create({ a: specOf(rob, T), b: LU.build(rob.name), seed: 1 }).robots[0]; } // the robot as it stands now
  const fr = q => Math.max(0, q.hp) / q.maxHp;
  // what can be repaired: one item = one thing a crew action fixes
  function repairItems(rob) {
    const R = probe(rob), w = rob.wear || {}, items = [];
    const add = (id, label, broken, f, cost, fix, weight) => { if (broken || f < OK) items.push({ id, label, state: broken ? 'broken' : 'worn', f: broken ? 0 : f, cost: broken ? cost : 1, fix, weight }); };
    const drop = labels => { for (const lb of labels) { if (w.parts) delete w.parts[lb]; if (w.ints) delete w.ints[lb]; if (w.dents) delete w.dents[lb]; if (w.lost) w.lost = w.lost.filter(x => x !== lb); } };
    add('chassis', 'Chassis', false, fr(R.chassis), 1, () => drop(['Chassis']), 2);
    for (const s of R.slots) { const wh = s.wheel || R.parts.find(p => p.slot === s), lb = wh.label; add(lb, lb + (s.motor.hp <= 0 ? ' + motor' : ''), !wh.attached || s.motor.hp <= 0, Math.min(fr(wh), fr(s.motor)), 1, () => drop([lb, s.motor.label]), 1); }
    for (const p of R.parts.filter(q => q.kind === 'armour')) add(p.label, p.label, !p.attached, fr(p), 1, () => drop([p.label]), 0.6);
    const wp = R.parts.filter(q => q.kind === 'weapon'), wi = [R.wmotor, R.turret, R.arm].filter(Boolean);
    if (wp.length || wi.length) {
      const broken = wp.some(q => !q.attached) || wi.some(q => q.hp <= 0), f = Math.min(...wp.map(fr), ...wi.map(fr));
      add('weapon', 'Weapon (' + L.WEAPONS[R.spec.weapon].label.toLowerCase() + ')', broken, f, 2, () => drop(wp.map(q => q.label).concat(wi.map(q => q.label))), 3);
    }
    add('lid', 'Top plate', !R.lid.attached, fr(R.lid), 1, () => { delete w.lid; if (w.dents) delete w.dents['Top plate']; }, 0.6);
    for (const q of R.internals) if (['battery', 'radio', 'chip', 'module', 'thruster'].includes(q.key)) add(q.label, q.label, q.hp <= 0, fr(q), 1, () => drop([q.label]), q.key === 'battery' || q.key === 'radio' ? 1 : 0.6);
    (R.spec.helpers || []).forEach((k, i) => { const d = w.drones && w.drones[i]; if (d == null) return; add('drone' + i, L.HELPERS[k].label, d <= 0, d, 2, () => { w.drones[i] = 1; }, 1); });
    return { R, items };
  }
  function condition(rob) { // 0..1, weighted by how much each item matters
    if (!rob.wear) return 1; const { R, items } = repairItems(rob); let tot = 0, lost = 0;
    const base = 2 + R.slots.length + R.parts.filter(q => q.kind === 'armour').length * 0.6 + 3 + 0.6 + 2 + 1.8 + (R.spec.helpers || []).length;
    for (const it of items) lost += it.weight * (1 - it.f); tot = base; return Math.max(0, 1 - lost / tot);
  }
  // free in every Upkeep: chassis, battery and radio come back to at least half
  function floorVitals(rob) { const w = rob.wear; if (!w) return; w.parts = w.parts || {}; w.ints = w.ints || {}; if (w.parts.Chassis != null) w.parts.Chassis = Math.max(0.5, w.parts.Chassis); for (const k of ['Battery', 'Radio receiver']) if (w.ints[k] != null) w.ints[k] = Math.max(0.5, w.ints[k]); }

  // ---------- crew ----------
  const actsLeft = T => T.crew.reduce((a, c) => a + CREW[c.type].acts - c.used, 0);
  function canPay(T, cost) { const c = actsLeft(T); return c >= cost || T.cr >= (cost - c) * ACTION_CR; }
  function payLabel(T, cost) { const c = actsLeft(T); return c >= cost ? `${cost} action${cost > 1 ? 's' : ''}` : c > 0 ? `${c} + ${(cost - c) * ACTION_CR} Cr` : `${cost * ACTION_CR} Cr`; }
  function pay(T, cost) {
    if (!canPay(T, cost)) return false; let need = cost;
    while (need > 0) {
      const left = c => CREW[c.type].acts - c.used, open = T.crew.filter(c => left(c) > 0);
      if (!open.length) { T.cr -= need * ACTION_CR; break; }
      const c = open.find(c => c.used > 0) || open.filter(c => left(c) >= need).sort((a, b) => left(a) - left(b))[0] || open.sort((a, b) => left(b) - left(a))[0];
      const take = Math.min(need, left(c)); c.used += take; need -= take;
    }
    return true;
  }
  function aiRepairs(T) {
    for (const rob of T.robots) {
      let guard = 20;
      while (guard--) {
        const { items } = repairItems(rob); if (!items.length) break;
        items.sort((a, b) => (b.state === 'broken') - (a.state === 'broken') || b.weight * (1 - b.f) / b.cost - a.weight * (1 - a.f) / a.cost);
        const it = items.find(i => actsLeft(T) >= i.cost || ((i.state === 'broken' || i.f < 0.6) && T.cr >= 4 + (i.cost - actsLeft(T)) * ACTION_CR)); // keeps 4 Cr in reserve
        if (!it || !pay(T, it.cost)) break; it.fix();
      }
    }
  }

  // ---------- round ----------
  function upkeep(first) {
    for (const T of G.teams) {
      for (const c of T.crew) c.used = 0;
      if (!first) { const mech = T.crew.filter(c => c.type === 'mech').length; T.cr += mech - T.robots.length; T.cr = Math.max(0, T.cr); }
      for (const rob of T.robots) floorVitals(rob);
      if (T.ai) aiRepairs(T);
    }
    if (!first) say(`Round ${G.round}: Upkeep. Crew ready, +1 credit per Mechanic, −1 per robot. Chassis, battery and radio come back to at least half for free.`);
    G.phase = 'repair'; render();
  }
  const rivalOf = r => 1 + ((r - 1) % 3);
  function toArena() { G.phase = 'pick'; render(); }
  function startFight(myUid) {
    const me = G.teams[0], foe = G.teams[rivalOf(G.round)], mine = me.robots.find(r => r.uid === myUid);
    const theirs = foe.robots.slice().sort((a, b) => (b.level + condition(b) * 1.5) - (a.level + condition(a) * 1.5))[0];
    const seed = 1 + Math.floor(rng() * 999999);
    const S = L.create({ a: specOf(mine, me), b: specOf(theirs, foe), seed, countdown: 2.99 });
    VW.play(S, { title: `Round ${G.round}: ${mine.name} vs ${theirs.name}`, onEnd: S2 => { afterFight(S2, [[me, mine], [foe, theirs]]); otherFight(); nextRound(); } });
  }
  function afterFight(S, sides) {
    const w = S.result.winner;
    sides.forEach(([T, rob], i) => { rob.wear = L.wearOf(S.robots[i]); rob.fights++; T.cr += 2; if (i === w) { rob.wins++; T.fame++; } });
    const [A, B] = sides, win = sides[w];
    const lostTxt = (i) => { const n = S.robots[i].stats.lost.length; return n ? `${n} part${n > 1 ? 's' : ''} lost` : 'nothing lost'; };
    say(`${A[0].pal.name} ${A[1].name} vs ${B[0].pal.name} ${B[1].name}: ${win[1].name} wins (${S.result.how === 'KO' ? 'KO' : 'judges'}, ${Math.round(S.result.t)} s). ${A[1].name}: ${lostTxt(0)}; ${B[1].name}: ${lostTxt(1)}. ${win[0].pal.name} +1 fame, both +2 Cr.`, sides[0][0].t === 0 ? 'me' : '');
  }
  function otherFight() { // the two rivals not facing you fight off-screen
    const ids = [1, 2, 3].filter(t => t !== rivalOf(G.round)), [T1, T2] = ids.map(t => G.teams[t]);
    const best = T => T.robots.slice().sort((a, b) => (b.level + condition(b) * 1.5) - (a.level + condition(a) * 1.5))[0];
    const a = best(T1), b = best(T2), S = L.run({ a: specOf(a, T1), b: specOf(b, T2), seed: 1 + Math.floor(rng() * 999999) }, 200);
    afterFight(S, [[T1, a], [T2, b]]);
  }
  function nextRound() {
    const champ = G.teams.find(T => T.fame >= FAME_GOAL);
    if (champ) { G.over = champ; say(`${champ.name} reaches ${FAME_GOAL} fame and wins the game!`, 'me'); G.phase = 'over'; render(); return; }
    G.round++; upkeep(false);
  }

  // ---------- screen ----------
  const stars = n => n ? `<span class="stars" title="Level ${n}">${'★'.repeat(n)}</span>` : '<span class="small">starter</span>';
  const condBar = c => `<div class="cond" title="Condition ${Math.round(c * 100)}%"><i style="width:${Math.round(c * 100)}%;background:${c > 0.75 ? 'var(--good)' : c > 0.45 ? 'var(--warn)' : 'var(--bad)'}"></i></div>`;
  function crewHtml(T) { return `<div class="crew">${T.crew.map(c => { const a = CREW[c.type].acts; return `<span class="crewc${c.used ? ' used' : ''}" title="${CREW[c.type].label}: ${a} repair action${a > 1 ? 's' : ''}${c.used ? ', busy this round' : ''}">${CREW[c.type].label} ${Array.from({ length: a }, (_, k) => `<i class="pip${k >= c.used ? ' on' : ''}"></i>`).join('')}</span>`; }).join('')}</div>`; }
  function render() {
    const el = $('game'), me = G.teams[0], todo = [];
    let phase = '';
    if (G.phase === 'repair') {
      phase = `<section class="card"><div class="thead"><h2>Upkeep: repairs</h2><span class="stat"><span>${me.cr} Cr</span><span>${actsLeft(me)} crew action${actsLeft(me) === 1 ? '' : 's'} left</span></span></div>
        <p class="small">Each crew member gives repair actions (Mechanic 1, Chief Engineer 2). One action fixes one part completely or puts a lost one back; a broken weapon or a shot-down drone takes 2. Out of crew? An action costs ${ACTION_CR} Cr. Crew you use is busy for the rest of the round.</p>
        ${crewHtml(me)}
        <div class="repair">${me.robots.map(rob => { const { items } = repairItems(rob), c = condition(rob); todo.push(rob); return `<div class="card rcard"><canvas data-diag="${rob.uid}" aria-label="Damage of ${esc(rob.name)}"></canvas><div class="items"><div class="thead"><h3>${esc(rob.name)}</h3>${stars(rob.level)}</div><div class="small">Condition ${Math.round(c * 100)}% · ${rob.fights} fights, ${rob.wins} wins</div>${condBar(c)}
          ${items.length ? items.map(it => `<div class="item"><span>${esc(it.label)} <em class="${it.state === 'broken' ? 'bad' : ''}">${it.state === 'broken' ? (it.id === 'lid' ? 'flew off' : it.id.startsWith('drone') ? 'shot down' : 'broken') : Math.round(it.f * 100) + '%'}</em></span><button type="button" data-fix="${rob.uid}|${esc(it.id)}"${canPay(me, it.cost) ? '' : ' disabled'}>Repair · ${payLabel(me, it.cost)}</button></div>`).join('') : '<div class="small">All good, nothing to repair.</div>'}</div></div>`; }).join('')}</div>
        <div class="bar"><button class="go" type="button" id="toArena">To the arena</button><span class="small">Rivals have done their repairs.</span></div></section>`;
    } else if (G.phase === 'pick') {
      const foe = G.teams[rivalOf(G.round)], others = [1, 2, 3].filter(t => t !== rivalOf(G.round)).map(t => G.teams[t].pal.name);
      phase = `<section class="card fightpick"><div class="thead"><h2>Round ${G.round}: you fight ${esc(foe.pal.name)}</h2><span class="small">${others.join(' and ')} fight each other off-screen.</span></div>
        <p class="small">${esc(foe.pal.name)} sends its best robot in shape. Damage from this fight stays on your robot.</p>
        <div class="bar">${me.robots.map(rob => `<button type="button" data-send="${rob.uid}">Send ${esc(rob.name)} ${'★'.repeat(rob.level)} · ${Math.round(condition(rob) * 100)}%</button>`).join('')}</div></section>`;
    } else if (G.phase === 'over') {
      phase = `<section class="card"><h2>${esc(G.over.name)} wins the game</h2><div class="bar"><button class="go" type="button" id="again">New game</button></div></section>`;
    }
    el.innerHTML = `<div class="bar" style="justify-content:space-between;margin-bottom:12px"><h2>Round ${G.round}</h2><span class="bar"><span class="small">Seed ${G.seed}</span><button type="button" id="newGame">New game</button></span></div>
      ${phase}
      <section style="margin-top:16px"><div class="teams">${G.teams.map(T => `<div class="card team${T.t ? '' : ' you'}" style="--tc:${T.pal.col}"><div class="thead"><h2>${esc(T.name)}</h2><span class="stat"><span>${T.fame} fame</span><span>${T.cr} Cr</span></span></div>${crewHtml(T)}
        <div class="robots">${T.robots.map(rob => { const c = condition(rob); todo.push(rob); return `<div class="rob"><canvas data-diag="${rob.uid}" aria-label="Damage of ${esc(rob.name)}"></canvas><div><div class="nm">${esc(rob.name)} ${stars(rob.level)}</div><div class="small">${esc(L.WEAPONS[L.PRESETS[rob.name].weapon].label)} · ${rob.fights} fights, ${rob.wins} wins</div>${condBar(c)}<div class="small">Condition ${Math.round(c * 100)}%</div></div></div>`; }).join('')}</div></div>`).join('')}</div></section>
      <section class="card" style="margin-top:16px"><h2>Log</h2><ol class="log">${G.log.map(e => `<li${e.cls === 'me' ? ' style="font-weight:600"' : ''}>R${e.r}: ${esc(e.t)}</li>`).join('')}</ol></section>`;
    const find = uid => { for (const T of G.teams) { const r = T.robots.find(q => q.uid === uid); if (r) return [T, r]; } };
    el.querySelectorAll('canvas[data-diag]').forEach(c => { const [T, rob] = find(+c.dataset.diag); VW.drawDiagram(c, probe(rob, T)); });
    el.querySelectorAll('[data-fix]').forEach(b => b.onclick = () => { const [uid, id] = b.dataset.fix.split('|'), [, rob] = find(+uid), it = repairItems(rob).items.find(i => i.id === id); if (it && pay(me, it.cost)) { it.fix(); render(); } });
    el.querySelectorAll('[data-send]').forEach(b => b.onclick = () => startFight(+b.dataset.send));
    const ta = $('toArena'); if (ta) ta.onclick = toArena;
    $('newGame').onclick = () => newGame(); const ag = $('again'); if (ag) ag.onclick = () => newGame();
  }

  VW.mount($('fightView'));
  window.ROBOCUS2 = { get G() { return G; }, newGame, repairItems, condition, startFight };
  const q = new URLSearchParams(location.search);
  newGame(+q.get('seed') || 0);
})();
