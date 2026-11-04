#!/usr/bin/env node
/*
  ROBOCUS combo watchdog
  ----------------------
  Simulates thousands of random, complete robots (stats + weapon + module + helpers) against each
  other with the CURRENT battle simulator from prototypes/arena-sandbox.html, and reports:
    1. Too strong   - builds or single options that beat nearly everything
    2. Dead options - choices that are almost never worth taking
    3. Too lopsided - how many matchups are 90/10 or worse (decided at build time)
    4. Upset rate   - how often the favourite of a matchup loses (target 25-35%)
    5. Stacking     - how much helpers / modules add on top of a robot
    6. Synergies    - pairs of choices that are much stronger together than apart (the fun surprises)

  Usage:  node tools/watchdog.js [--quick] [--builds 300] [--opponents 30] [--seed 1]
                                 [--helpers 1|0|2|3|random] [--module yes|no|random] [--out docs/watchdog-report.md]
                                 [--mode duel|team|squad] [--size 4]
     team  = random robots thrown into size-vs-size battles
     squad = squadron leader cards (Lone Wolf / Duo / Trio / Swarm) against each other
  Default loadout is equal for everyone (1 module + 1 helper), because helpers and modules are still free;
  use --helpers random --module random to see how much stacking them adds.
  Full run takes a few minutes on a normal PC (--quick about 1-2 min). Deterministic for a given seed.
*/
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const os = require('os');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

const ROOT = path.resolve(__dirname, '..');
const SANDBOX = path.join(ROOT, 'prototypes', 'arena-sandbox.html');

// ---- load Sim straight out of the sandbox HTML, so we always test what Kev plays ----
function loadSim(file) {
  const html = fs.readFileSync(file, 'utf8');
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  const code = scripts.find(s => s.includes('Robot auto-battle core'));
  if (!code) throw new Error('Could not find the Sim script in ' + file);
  const ctx = { Math, JSON, Object, Array, Set, Map, Number, String, Infinity, NaN, console };
  vm.createContext(ctx);
  vm.runInContext(code, ctx);
  if (!ctx.Sim) throw new Error('Sim did not load');
  return { Sim: ctx.Sim, hash: require('crypto').createHash('sha1').update(code).digest('hex').slice(0, 8) };
}

function fightScore(Sim, a, b, seed, dt) {
  // returns score for a: 1 win, 0.5 draw, 0 loss
  const B = Sim.fight(a, b, seed, dt);
  return B.winner === 0 ? 1 : B.winner === -1 ? 0.5 : 0;
}

// ---------------- worker ----------------
if (!isMainThread) {
  const { Sim } = loadSim(workerData.file);
  parentPort.on('message', ({ jobs, id }) => {
    const out = jobs.map(job => {
      if (job.team) {
        // job.team = [teamA builds, teamB builds]; returns team A's score over n fights (sides swapped every other fight)
        let s = 0;
        for (let k = 0; k < job.n; k++) {
          const sw = k % 2, A = sw ? job.team[1] : job.team[0], Bt = sw ? job.team[0] : job.team[1];
          const all = A.concat(Bt);
          const Bt_ = Sim.newBattle(all, job.seed + k * 977, { teams: all.map((_, i) => i < A.length ? 0 : 1) });
          while (!Bt_.over) Sim.step(Bt_, 1 / 30);
          const w = Bt_.winner === -1 ? 0.5 : Bt_.winner === 0 ? 1 : 0;
          s += sw ? 1 - w : w;
        }
        return s / job.n;
      }
      const [a, b, seed, n] = job;
      let s = 0;
      for (let k = 0; k < n; k++) {
        // alternate sides so spawn position doesn't matter
        s += k % 2 ? 1 - fightScore(Sim, b, a, seed + k * 977, 1 / 30) : fightScore(Sim, a, b, seed + k * 977, 1 / 30);
      }
      return s / n;
    });
    parentPort.postMessage({ id, out });
  });
  return;
}

// ---------------- main ----------------
const args = process.argv.slice(2);
const arg = (name, def) => { const i = args.indexOf('--' + name); return i >= 0 ? args[i + 1] : def; };
const QUICK = args.includes('--quick');
const NB = +arg('builds', QUICK ? 120 : 300);
const NOPP = +arg('opponents', QUICK ? 16 : 30);
const SEED = +arg('seed', 1);
const OUT = path.resolve(ROOT, arg('out', 'docs/watchdog-report.md'));
const HELPERS_N = arg('helpers', '1');
const MODULE_MODE = arg('module', 'yes');
const MODE = arg('mode', 'duel');
const SIZE = Math.max(2, Math.min(4, +arg('size', 4)));

const { Sim, hash } = loadSim(SANDBOX);
const STATS = Sim.STATS, MODS = Object.keys(Sim.MODS || {}), HELP = Object.keys(Sim.HELPERS || {});
const WEAPONS = Sim.WEAPONS || ['gun', 'laser', 'mortar', 'saw'];
const CALS = Object.keys(Sim.CAL || { medium: 1 });
const RANGES = Object.keys(Sim.RANGES || { mid: 1 });
const DRIVES = Object.keys(Sim.DRIVES || { wheels: 1 }), PROCS = Object.keys(Sim.PROCS || { standard: 1 });
const BUDGET = 14;
const rng = Sim.mkRng(SEED * 7919 + 13);
const pick = a => a[Math.floor(rng() * a.length)];

function randomBuild() {
  const lv = {}; STATS.forEach(k => lv[k] = 0);
  let left = BUDGET;
  while (left > 0) { const k = pick(STATS); if (lv[k] < 4) { lv[k]++; left--; } }
  const weapon = pick(WEAPONS);
  const nh = HELPERS_N === 'random' ? Math.floor(rng() * 4) : Math.max(0, Math.min(3, +HELPERS_N || 0));
  return {
    lv, weapon, cal: weapon === 'gun' ? pick(CALS) : 'medium', range: pick(RANGES),
    mod: MODULE_MODE === 'no' ? null : MODULE_MODE === 'random' ? (rng() < 0.5 ? null : pick(MODS)) : pick(MODS),
    helpers: [...Array(nh)].map(() => pick(HELP)),
    focus: pick(['main', 'medics', 'helpers']),
    drive: pick(DRIVES), proc: pick(PROCS),
  };
}
const label = b => (b.weapon === 'gun' ? b.cal + ' gun' : b.weapon) + ', ' + b.range + ' range, ' +
  STATS.map(k => k.slice(0, 2).toUpperCase() + b.lv[k]).join(' ') +
  (b.mod ? ', module ' + Sim.MODS[b.mod].name : '') + ((b.helpers || []).length ? ', helpers ' + b.helpers.map(h => Sim.HELPERS[h].name).join('+') : '') +
  (b.drive && b.drive !== 'wheels' ? ', ' + Sim.DRIVES[b.drive].name : '') + (b.proc && b.proc !== 'standard' ? ', ' + Sim.PROCS[b.proc].name : '');

// worker pool
const NW = Math.max(1, Math.min(8, os.cpus().length));
const workers = [...Array(NW)].map(() => new Worker(__filename, { workerData: { file: SANDBOX } }));
let jid = 0;
function run(jobs) {
  const chunks = workers.map(() => []);
  jobs.forEach((j, k) => chunks[k % NW].push(j));
  return Promise.all(workers.map((w, wi) => new Promise(res => {
    const id = jid++;
    const h = m => { if (m.id === id) { w.off('message', h); res(m.out); } };
    w.on('message', h); w.postMessage({ jobs: chunks[wi], id });
  }))).then(parts => { const out = new Array(jobs.length); parts.forEach((p, wi) => p.forEach((v, k) => out[k * NW + wi] = v)); return out; });
}
const pct = x => Math.round(x * 100) + '%';
const mean = a => a.reduce((s, x) => s + x, 0) / (a.length || 1);

// ---------------- squadron cards ----------------
async function squadMode(t0) {
  const SQ = Sim.SQUADS; if (!SQ) throw new Error('This Sim has no squadron cards');
  const ids = Object.keys(SQ), NPC = QUICK ? 50 : 90;
  const robot = c => { const lv = {}; STATS.forEach(k => lv[k] = 0); let l = c.points; while (l > 0) { const k = pick(STATS); if (lv[k] < c.cap) { lv[k]++; l--; } } const weapon = pick(WEAPONS); return { lv, weapon, cal: weapon === 'gun' ? pick(CALS) : 'medium', range: pick(RANGES), size: c.size }; };
  const all = ids.flatMap(id => [...Array(NPC)].map(() => ({ id, q: [...Array(SQ[id].slots)].map(() => robot(SQ[id])) })));
  const jobs = [], who = [];
  all.forEach((x, i) => { for (let k = 0; k < 8; k++) { const o = all[Math.floor(rng() * all.length)]; jobs.push({ team: [x.q, o.q], seed: 100 + i * 37 + k, n: 2 }); who.push(i); } });
  const r = await run(jobs);
  const sc = new Array(all.length).fill(0); r.forEach((v, k) => sc[who[k]] += v / 8);
  const comp = {};
  ids.forEach(id => { const idx = all.map((x, i) => x.id === id ? i : -1).filter(i => i >= 0).sort((a, b) => sc[b] - sc[a]); comp[id] = idx.slice(0, Math.max(5, Math.round(idx.length * 0.35))).map(i => all[i].q); });
  const pairs = []; ids.forEach(a => ids.forEach(b => { if (a < b) pairs.push([a, b]); }));
  const mj = [], mw = [];
  pairs.forEach(([a, b]) => { for (let k = 0; k < (QUICK ? 24 : 40); k++) { mj.push({ team: [pick(comp[a]), pick(comp[b])], seed: 9000 + mj.length * 3, n: 2 }); mw.push(a + '|' + b); } });
  const mr = await run(mj);
  const M = {}; ids.forEach(a => M[a] = {});
  pairs.forEach(([a, b]) => { const v = mr.filter((_, k) => mw[k] === a + '|' + b); const m = mean(v); M[a][b] = m; M[b][a] = 1 - m; });
  const avg = id => mean(ids.filter(b => b !== id).map(b => M[id][b]));
  const flags = [];
  ids.forEach(id => { const a = avg(id); if (a > 0.6) flags.push(SQ[id].name + ' looks too strong overall (' + pct(a) + ').'); if (a < (id === 'lone' ? 0.33 : 0.4)) flags.push(SQ[id].name + ' looks too weak overall (' + pct(a) + ').'); });
  ids.forEach(a => ids.forEach(b => { if (a !== b && M[a][b] >= 0.8) flags.push(SQ[a].name + ' beats ' + SQ[b].name + ' ' + pct(M[a][b]) + ' of the time.'); }));
  const L = [];
  L.push('# ROBOCUS watchdog report: squadron cards', '');
  L.push('Generated ' + new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC by `node tools/watchdog.js --mode squad` (seed ' + SEED + ', sim ' + hash + ', ' + NPC + ' random squads per card, best 35% kept as "competitive", ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s). Stats and weapons only (no modules or helpers). Results move about ±10% between seeds; re-run with another --seed before acting on a single number.', '');
  L.push('Cards: ' + ids.map(id => SQ[id].name + ' = ' + SQ[id].slots + ' × ' + SQ[id].points + ' points, stats up to ' + SQ[id].cap).join('; ') + '.', '');
  L.push('## Card against card (row beats column)', '', '| | ' + ids.map(i => SQ[i].name).join(' | ') + ' | average |', '|---|' + ids.map(() => '---|').join('') + '---|');
  ids.forEach(a => L.push('| **' + SQ[a].name + '** | ' + ids.map(b => a === b ? '–' : pct(M[a][b])).join(' | ') + ' | ' + pct(avg(a)) + ' |'));
  L.push('', 'Target: every card averages 40–60%; the Lone Wolf may sit lower (it is meant to be the underdog, roughly 1 win in 3 against bigger squads).', '');
  L.push(flags.length ? '**Flags**\n\n' + flags.map(f => '- ' + f).join('\n') : '**No flags.**', '');
  L.push('## Example competitive squads', '');
  ids.forEach(id => L.push('- ' + SQ[id].name + ': ' + comp[id][0].map(label).join(' | ')));
  L.push('');
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, L.join('\n'));
  process.stdout.write('\n' + L.slice(0, 16).join('\n') + '\n\nFull report: ' + path.relative(ROOT, OUT) + '\n');
  workers.forEach(w => w.terminate());
}

// ---------------- team battles ----------------
async function teamMode(builds, t0) {
  const NM = QUICK ? 160 : 420, RUNS = 6;
  const matches = [];
  for (let m = 0; m < NM; m++) {
    const idx = [];
    while (idx.length < SIZE * 2) { const i = Math.floor(rng() * builds.length); if (!idx.includes(i)) idx.push(i); }
    matches.push({ A: idx.slice(0, SIZE), B: idx.slice(SIZE) });
  }
  const res = await run(matches.map((m, k) => ({ team: [m.A.map(i => builds[i]), m.B.map(i => builds[i])], seed: 3000 + k * 53, n: RUNS })));
  const score = new Array(builds.length).fill(0), cnt = new Array(builds.length).fill(0);
  res.forEach((p, k) => { for (const i of matches[k].A) { score[i] += p; cnt[i]++; } for (const i of matches[k].B) { score[i] += 1 - p; cnt[i]++; } });
  const used = builds.map((_, i) => i).filter(i => cnt[i] > 0);
  const wr = builds.map((_, i) => cnt[i] ? score[i] / cnt[i] : 0.5);
  const overall = mean(used.map(i => wr[i]));
  const hard = res.filter(p => p >= 0.9 || p <= 0.1).length / res.length;
  const soft = res.filter(p => p >= 0.35 && p <= 0.65).length / res.length;
  const upset = mean(res.map(p => Math.min(p, 1 - p)));
  const order = used.slice().sort((a, b) => wr[b] - wr[a]);
  const compSet = new Set(order.slice(0, Math.round(used.length * 0.4)));
  const rows = (opts, has) => opts.map(o => {
    const idx = used.filter(i => has(builds[i], o));
    const inC = idx.filter(i => compSet.has(i)).length;
    return { o, n: idx.length, w: mean(idx.map(i => wr[i])), meta: idx.length ? (inC / compSet.size) / (idx.length / used.length) : 0 };
  });
  const G = [
    ['Weapon', rows(WEAPONS, (b, o) => b.weapon === o), o => ({ saw: 'saw blades', spinner: 'spinner blade', flame: 'flamethrower' })[o] || o],
    ['Gun calibre (gun builds only)', rows(CALS, (b, o) => b.weapon === 'gun' && b.cal === o), o => o],
    ['Preferred range', rows(RANGES, (b, o) => b.range === o), o => o],
    ['Module', rows(MODS, (b, o) => b.mod === o), o => Sim.MODS[o].name],
    ['Helper', rows(HELP, (b, o) => b.helpers.includes(o)), o => Sim.HELPERS[o].name],
    ['Drive', rows(DRIVES, (b, o) => (b.drive || 'wheels') === o), o => Sim.DRIVES ? Sim.DRIVES[o].name : o],
    ['Processor', rows(PROCS, (b, o) => (b.proc || 'standard') === o), o => Sim.PROCS ? Sim.PROCS[o].name : o],
  ];
  for (const k of STATS) G.push(['Stat: ' + k + ' level', rows([0, 1, 2, 3, 4], (b, o) => b.lv[k] === o), o => String(o)]);
  const flags = [];
  if (hard > 0.35) flags.push(pct(hard) + ' of team battles are 90/10 or worse (target under 35%).');
  if (upset < 0.2) flags.push('Upset rate is ' + pct(upset) + ' (target 25–35%).');
  for (const [name, rs, nm] of G) for (const r of rs) {
    if (r.n < 10 || name.startsWith('Stat')) continue;
    if (r.meta >= 1.6) flags.push('Too strong? ' + name + ' = ' + nm(r.o) + ' shows up ' + r.meta.toFixed(1) + '× as often in winning robots (win rate ' + pct(r.w) + ').');
    if (r.meta <= 0.4) flags.push('Dead option? ' + name + ' = ' + nm(r.o) + ' shows up only ' + r.meta.toFixed(1) + '× as often in winning robots (win rate ' + pct(r.w) + ').');
  }
  const L = [];
  L.push('# ROBOCUS watchdog report: ' + SIZE + ' vs ' + SIZE + ' team battles', '');
  L.push('Generated ' + new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC by `node tools/watchdog.js --mode team` (seed ' + SEED + ', sim ' + hash + ', ' + NM + ' battles of ' + SIZE + 'v' + SIZE + ' with random robots, ' + RUNS + ' runs each, ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s).');
  L.push('A robot\'s win rate = how often the team it was in won. Same loadout rule as the duel report.', '');
  L.push('## Health check', '', '| Check | Result | Target |', '|---|---|---|');
  L.push('| Battles 90/10 or worse | ' + pct(hard) + ' | under 35% |');
  L.push('| Battles between 35/65 and 65/35 | ' + pct(soft) + ' | the more the better |');
  L.push('| Upset rate (favourite team loses) | ' + pct(upset) + ' | 25–35% |', '');
  L.push(flags.length ? '**Flags**\n\n' + flags.map(f => '- ' + f).join('\n') : '**No flags.**', '');
  L.push('## Strongest robots in team battles', '');
  order.slice(0, 6).forEach(i => L.push('- ' + pct(wr[i]) + ' (' + cnt[i] + ' battles): ' + label(builds[i])));
  L.push('', '## Option strength (team win rate of robots that have it; in brackets how often it shows up among the best 40%)', '');
  for (const [name, rs, nm] of G) L.push('**' + name + ':** ' + rs.filter(r => r.n > 0).map(r => nm(r.o) + ' ' + pct(r.w) + ' (' + r.meta.toFixed(1) + '×)').join(' · '), '');
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, L.join('\n'));
  process.stdout.write('\n' + L.slice(0, 18).join('\n') + '\n\nFull report: ' + path.relative(ROOT, OUT) + '\n');
  workers.forEach(w => w.terminate());
}

(async () => {
  const t0 = Date.now();
  process.stdout.write('ROBOCUS watchdog: sim ' + hash + ', mode ' + MODE + (MODE === 'team' ? ' ' + SIZE + 'v' + SIZE : '') + (MODE === 'squad' ? '' : ', ' + NB + ' random builds') + ', ' + NW + ' worker(s)\n');

  const builds = [...Array(NB)].map(randomBuild);
  if (MODE === 'team') return teamMode(builds, t0);
  if (MODE === 'squad') return squadMode(t0);
  // 1. every build vs random opponents (2 fights each, sides swapped)
  const jobs = [], who = [];
  builds.forEach((b, i) => {
    for (let k = 0; k < NOPP; k++) {
      let j = Math.floor(rng() * NB); if (j === i) j = (j + 1) % NB;
      jobs.push([b, builds[j], 1000 + i * 131 + k * 17, 2]); who.push(i);
    }
  });
  const res = await run(jobs);
  const score = new Array(NB).fill(0), cnt = new Array(NB).fill(0);
  res.forEach((v, k) => { score[who[k]] += v; cnt[who[k]]++; });
  const wr = score.map((s, i) => s / cnt[i]);
  const overall = mean(wr);
  process.stdout.write('  field done (' + ((Date.now() - t0) / 1000).toFixed(0) + ' s)\n');

  // 2. option strength (average win rate of builds that have the option)
  const groups = [];
  const compSet = new Set([...Array(NB).keys()].sort((a, b) => wr[b] - wr[a]).slice(0, Math.round(NB * 0.4)));
  const addGroup = (name, opts, has) => groups.push({ name, rows: opts.map(o => {
    const idx = builds.map((b, i) => has(b, o) ? i : -1).filter(i => i >= 0);
    const inComp = idx.filter(i => compSet.has(i)).length;
    // meta: share of this option among competitive builds divided by its share overall (1.0 = normal)
    return { o, n: idx.length, w: mean(idx.map(i => wr[i])), meta: idx.length ? (inComp / compSet.size) / (idx.length / NB) : 0 };
  }) });
  addGroup('Weapon', WEAPONS, (b, o) => b.weapon === o);
  addGroup('Gun calibre (gun builds only)', CALS, (b, o) => b.weapon === 'gun' && b.cal === o);
  addGroup('Preferred range', RANGES, (b, o) => b.range === o);
  addGroup('Module', ['(none)'].concat(MODS), (b, o) => o === '(none)' ? !b.mod : b.mod === o);
  addGroup('Helper', HELP, (b, o) => b.helpers.includes(o));
  if (HELPERS_N === 'random') addGroup('Number of helpers', [0, 1, 2, 3], (b, o) => b.helpers.length === o);
  addGroup('Targeting order', ['main', 'medics', 'helpers'], (b, o) => b.focus === o);
  addGroup('Drive', DRIVES, (b, o) => (b.drive || 'wheels') === o);
  addGroup('Processor', PROCS, (b, o) => (b.proc || 'standard') === o);
  for (const k of STATS) addGroup('Stat: ' + k + ' level', [0, 1, 2, 3, 4], (b, o) => b.lv[k] === o);
  const optName = (g, o) => g.name === 'Module' && o !== '(none)' ? Sim.MODS[o].name : g.name === 'Helper' ? Sim.HELPERS[o].name : g.name === 'Drive' ? Sim.DRIVES[o].name : g.name === 'Processor' ? Sim.PROCS[o].name : String(o);

  // 3. competitive pool: players don't build junk, so balance is judged among the best 40% of random builds
  const order = [...Array(NB).keys()].sort((a, b) => wr[b] - wr[a]);
  const comp = order.slice(0, Math.round(NB * 0.4));
  const top = order.slice(0, 8);
  const fresh = comp.filter(i => !top.includes(i)).map(i => builds[i]);
  const tjobs = [];
  top.forEach((i, ti) => fresh.forEach((f, k) => tjobs.push([builds[i], f, 50000 + ti * 1000 + k, 4])));
  const tres = await run(tjobs);
  const topInfo = top.map((i, ti) => ({ i, field: mean(tres.slice(ti * fresh.length, (ti + 1) * fresh.length)) }));
  // counter search for the strongest: best of ALL builds against it (6 fights each)
  const champ = topInfo.slice().sort((a, b) => b.field - a.field)[0];
  const cjobs = builds.map((b, j) => [b, builds[champ.i], 90000 + j, 6]);
  const cres = await run(cjobs);
  let ci = -1, cv = -1; cres.forEach((v, j) => { if (j !== champ.i && v > cv) { cv = v; ci = j; } });
  const beaters = cres.filter((v, j) => j !== champ.i && v >= 0.6).length;
  process.stdout.write('  top builds + counter search done (' + ((Date.now() - t0) / 1000).toFixed(0) + ' s)\n');

  // 4. matchup hardness + upset rate: 70 builds, all pairs, 8 fights each
  const NS = QUICK ? 36 : 50;
  const S = comp.filter((_, k) => k % Math.max(1, Math.floor(comp.length / NS)) === 0).slice(0, NS);
  const pjobs = [];
  for (let a = 0; a < S.length; a++) for (let b = a + 1; b < S.length; b++) pjobs.push([builds[S[a]], builds[S[b]], 70000 + a * 97 + b, 6]);
  const pres = await run(pjobs);
  // with 6 fights, 6-0 or 0-6 is our "90/10 or worse"
  const hard = pres.filter(p => p >= 0.9 || p <= 0.1).length / pres.length;
  const soft = pres.filter(p => p >= 0.35 && p <= 0.65).length / pres.length;
  const upset = mean(pres.map(p => Math.min(p, 1 - p)));
  process.stdout.write('  matchups done (' + ((Date.now() - t0) / 1000).toFixed(0) + ' s)\n');

  // 5. synergies: pairs of choices that do better together than you'd expect from each alone
  const feats = b => {
    const f = ['weapon:' + b.weapon, 'range:' + b.range];
    if (b.mod) f.push('module:' + b.mod);
    for (const h of new Set(b.helpers)) f.push('helper:' + h);
    if (b.weapon === 'gun') f.push('calibre:' + b.cal);
    if (b.drive) f.push('drive:' + b.drive);
    if (b.proc) f.push('processor:' + b.proc);
    return f;
  };
  const F = builds.map(feats);
  const single = {};
  F.forEach((fs_, i) => fs_.forEach(f => { (single[f] = single[f] || []).push(wr[i]); }));
  const pairs = {};
  F.forEach((fs_, i) => { for (let a = 0; a < fs_.length; a++) for (let b = a + 1; b < fs_.length; b++) { const k = [fs_[a], fs_[b]].sort().join(' + '); (pairs[k] = pairs[k] || []).push(wr[i]); } });
  const syn = Object.entries(pairs).filter(([k, v]) => v.length >= 6 && !k.startsWith('range') && !(k.includes('weapon:') && k.includes('calibre:'))).map(([k, v]) => {
    const [a, b] = k.split(' + ');
    return { k, n: v.length, w: mean(v), lift: mean(v) - mean(single[a]) - mean(single[b]) + overall };
  });
  syn.sort((a, b) => b.lift - a.lift);
  const WNAME = { saw: 'saw blades', spinner: 'spinner blade', flame: 'flamethrower' };
  const pretty = f => { const [t, v] = f.split(':'); return t === 'module' ? Sim.MODS[v].name : t === 'helper' ? Sim.HELPERS[v].name : t === 'weapon' ? (WNAME[v] || v) : t === 'calibre' ? v + ' calibre' : t === 'drive' ? Sim.DRIVES[v].name : t === 'processor' ? Sim.PROCS[v].name : v + ' range'; };

  // ---------------- report ----------------
  const flags = [];
  const L = [];
  L.push('# ROBOCUS watchdog report', '');
  L.push('Generated ' + new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC by `node tools/watchdog.js` (seed ' + SEED + ', sim ' + hash + ', ' + NB + ' random builds, ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s).');
  const loadout = (MODULE_MODE === 'yes' ? '1 random module' : MODULE_MODE === 'no' ? 'no module' : '50% chance of a module') + ', ' + (HELPERS_N === 'random' ? '0–3 random helpers' : HELPERS_N + ' random helper(s)');
  L.push('Every robot: 14 random stat points, random weapon / calibre / range / targeting order / drive / processor, 1 engineer, ' + loadout + '. Duels only.', '');

  L.push('## Health check', '');
  const champLine = champ.field;
  if (champLine >= 0.8) flags.push('A single build wins ' + pct(champLine) + ' against the other competitive builds (limit 80%).');
  if (cv < 0.6) flags.push('No build found that reliably beats the strongest build (best counter only ' + pct(cv) + ').');
  if (hard > 0.35) flags.push(pct(hard) + ' of matchups are 90/10 or worse (target under 35%).');
  if (upset < 0.2) flags.push('Upset rate is ' + pct(upset) + ' (target 25–35%): fights are too predictable.');
  for (const g of groups) for (const r of g.rows) {
    if (r.n < 8 || g.name.startsWith('Number of helpers') || g.name.startsWith('Stat')) continue;
    if (r.meta >= 1.6) flags.push('Too strong? ' + g.name + ' = ' + optName(g, r.o) + ' shows up ' + r.meta.toFixed(1) + '× as often among competitive builds (win rate ' + pct(r.w) + ').');
    if (r.meta <= 0.4) flags.push('Dead option? ' + g.name + ' = ' + optName(g, r.o) + ' shows up only ' + r.meta.toFixed(1) + '× as often among competitive builds (win rate ' + pct(r.w) + ').');
  }
  L.push('| Check | Result | Target |', '|---|---|---|');
  L.push('| Strongest build vs other competitive builds | ' + pct(champ.field) + ' | under 80% |');
  L.push('| Best counter to it | ' + pct(cv) + ' (' + beaters + ' builds beat it 60%+) | at least 60% |');
  L.push('| Matchups 90/10 or worse (competitive builds) | ' + pct(hard) + ' | under 35% |');
  L.push('| Matchups between 35/65 and 65/35 | ' + pct(soft) + ' | the more the better |');
  L.push('| Upset rate (favourite loses, competitive builds) | ' + pct(upset) + ' | 25–35% |', '');
  L.push('"Competitive builds" = the best 40% of ' + NB + ' random robots (players don\'t build junk).', '');
  L.push(flags.length ? '**Flags**\n\n' + flags.map(f => '- ' + f).join('\n') : '**No flags.** Nothing dominant, no dead options.', '');

  L.push('## Strongest builds (re-tested against ' + fresh.length + ' other competitive robots, 4 fights each)', '');
  topInfo.sort((a, b) => b.field - a.field).forEach(t => L.push('- ' + pct(t.field) + ': ' + label(builds[t.i])));
  L.push('', 'Best counter to the strongest (' + pct(cv) + ' against it): ' + label(builds[ci]), '');

  L.push('## Option strength', '');
  L.push('Per option: average win rate of random builds that have it, and in brackets how often it shows up among competitive builds compared to normal (1.0 = normal, 2.0 = twice as often, 0.3 = rarely good).', '');
  for (const g of groups) {
    L.push('**' + g.name + ':** ' + g.rows.filter(r => r.n > 0).map(r => optName(g, r.o) + ' ' + pct(r.w) + ' (' + r.meta.toFixed(1) + '×' + (r.n < 8 ? ', few samples' : '') + ')').join(' · '), '');
  }

  L.push('## Synergies (combos that do better together than apart)', '');
  L.push('Lift = how much better the pair does than you would expect from each part on its own. These are the surprise combos worth showing off; check them if one gets out of hand.', '');
  syn.slice(0, 10).forEach(s => L.push('- ' + s.k.split(' + ').map(pretty).join(' + ') + ': ' + pct(s.w) + ' win rate, lift +' + Math.round(s.lift * 100) + ' (' + s.n + ' builds)'));
  L.push('', 'Worst pairings (anti-synergy):', '');
  syn.slice(-5).reverse().forEach(s => L.push('- ' + s.k.split(' + ').map(pretty).join(' + ') + ': ' + pct(s.w) + ', lift ' + Math.round(s.lift * 100) + ' (' + s.n + ' builds)'));
  L.push('');

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, L.join('\n'));
  process.stdout.write('\n' + L.slice(0, 20).join('\n') + '\n\nFull report: ' + path.relative(ROOT, OUT) + '\n');
  workers.forEach(w => w.terminate());
})();
