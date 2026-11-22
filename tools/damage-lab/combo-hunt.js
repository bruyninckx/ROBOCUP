// T58 combo hunt (Kev, 22 Nov 2026: "can we do a recheck on epic and ultimate combos, see if we find some new or different things
// with the new damage models etc, make a gigantic program to run on my pc to find combos that work really well").
// Started by tools\combo-hunt.cmd (double-click). docs/robocus-combo-hunt.md says what it does and why.
//
//   node tools/damage-lab/combo-hunt.js [--hours=3] [--workers=N] [--out=combo-results] [--robots=A,B,..] [--depth=0-8]
//                                       [--screen=4] [--report]
//
// An adaptive, staged search with today's engine (wear on), the tuned lineup (33 robots), every part card and the rarity tiers as
// the game builds them (Lineup.build, the game's part strengths), open floor:
//   1  screen    every part on every robot vs 4 robots a level up and 2 of its own level, paired with the bare robot (same seeds)
//   2  confirm   the promising and the surprising (both ends) on fresh seeds vs every robot a level up, in rounds; clearly
//                average ones are dropped early, the rest sampled until sure (or the round limit)
//   2v verify    everything stage 2 calls epic / great / poor, and every entry of the game's own PART_FIT / EPIC tables, once more
//                on fresh seeds: only what holds on both is "found" (guards against the winner's curse)
//   3a pairs     per robot: its best single parts paired up, plus random pairs (to catch synergy nobody would guess)
//   3y synergy   the most (and least) synergetic pairs re-fought on fresh seeds with each half alone and the bare robot
//   3b builds    per robot: full builds (2 parts + a legendary, the game's slot rules) by successive halving vs a level and two up
//   3w verify    each robot's best build on fresh seeds vs every robot one and two levels up (level 0-2: every level 3-4 robot),
//                bare and kitted with their own best build
//   4  tiers     rarity tiers (Race-spec, Masterwork, ...) only on the combos that are promising with a standard copy
// Every fight has a fixed seed from (seed set, robot, opponent, fight index), the same with and without the parts (paired), sides
// alternate. One line per fight is appended to <out>/fights.jsonl; the plan is a pure function of the results, so a restart
// replays it, skips every fight already on file and goes on (stop it any time). --hours sets how deep stages 2-4 go: stage 1 is
// timed and the depth that fits the hours is chosen once and kept in <out>/state.json.
// At the end: <out>/report.md (plain English), <out>/combo-results.json (what the game tables need; tools/damage-lab/combo-apply.js
// turns it into table text) and ONE file to send back: <out>/combo-hunt-results.json.gz.
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), crypto = require('crypto'), zlib = require('zlib'), { fork } = require('child_process');
const DL = __dirname, ROOT = path.join(DL, '..', '..');

// ---------- shared: seeds, keys, builds ----------
const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const seedOf = (set, n, o, f) => 1 + ((hash(set + '|' + n + '|' + o) + f * 7919) % 2000000000);
const K = (set, n, b, o, ob, f) => [set, n, b, o, ob, f].join('~');
const parseBuild = b => { const parts = [], rar = {}; if (b) for (const x of b.split(',')) { const [k, t] = x.split('@'); parts.push(k); if (t) rar[k] = +t; } return { parts, rar: Object.keys(rar).length ? rar : null }; };
function mkRng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

function fight(L, LU, key) {
  const [set, n, b, o, ob, fs_] = key.split('~'), f = +fs_, A = parseBuild(b), B = parseBuild(ob), sw = f % 2 === 1;
  const a = LU.build(n, A.parts, A.rar), bb = LU.build(o, B.parts, B.rar);
  const S = L.create({ a: sw ? bb : a, b: sw ? a : bb, seed: seedOf(set, n, o, f), arena: 'open' });
  while (!S.over && S.t < 200) { L.step(S); S.fx.length = 0; }
  const w = S.result && S.result.winner;
  return [key, w == null ? 0.5 : ((w === 0) !== sw ? 1 : 0), Math.round(S.t * 10) / 10, (S.result && S.result.how) || '?'];
}

if (process.argv[2] === '--worker') {
  if (!process.env.COMBO_NORMAL_PRIORITY) try { os.setPriority(os.constants.priority.PRIORITY_LOW); } catch (e) { /* not allowed: fine */ }   // low priority: the PC stays usable (COMBO_NORMAL_PRIORITY=1: not)
  const L = require('./engine.js'), LU = require('./lineup.js'); LU.usePK();
  process.on('message', m => { if (m === 'bye') process.exit(0); process.send({ id: m.id, res: m.keys.map(k => fight(L, LU, k)) }); });
  return;
}

// ---------- the lineup, the parts, the game's slot rules ----------
const L = require('./engine.js'), LU = require('./lineup.js'); LU.usePK();
const ALL = Object.assign({}, LU.ROBOTS, LU.ROBOTS4), NAMES = Object.keys(ALL), lv = n => ALL[n][0];
const PARTS = Object.keys(LU.PARTS), kind = k => LU.PARTS[k].kind;
const LEGS = PARTS.filter(k => kind(k) === 'legendary'), SLOT = PARTS.filter(k => kind(k) !== 'legendary');
const canon = parts => { const p = parts.map(x => x.split('@')); const s = p.filter(([k]) => kind(k) !== 'legendary').sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0), l = p.filter(([k]) => kind(k) === 'legendary'); return s.concat(l).map(x => x.join('@')).join(','); };
const helpers = (n, parts) => (L.normSpec(LU.build(n, parts)).helpers || []).length;
// the game's canFit (prototypes/tabletop-2.html), part by part in install order (slot parts, then the legendary): 2 part slots
// (a tuning chip takes one: BAL.chips.slot is false), one chip, at most 3 drones, one legendary. Two rules of ours on top: a second
// module would replace the first (pointless), and a part with one card in the deck can't be on a robot twice. A Field hospital whose
// drone would not fit (3 drones already) only adds HP: left out.
function fitsBuild(n, b) {
  const parts = parseBuild(b).parts, cur = []; let leg = null;
  for (const k of parts) { const P = LU.PARTS[k]; if (!P) return false;
    if (P.kind === 'legendary') { if (leg) return false; leg = k; continue; }
    if (cur.length >= 2) return false;
    if (P.kind === 'drone' && helpers(n, cur) >= 3) return false;
    if (P.kind === 'chip' && cur.some(x => kind(x) === 'chip')) return false;
    if (P.kind === 'module' && cur.some(x => kind(x) === 'module')) return false;
    if (cur.includes(k) && (P.copies || 1) < 2) return false;
    cur.push(k); }
  if (leg === 'hospital' && !(L.normSpec(LU.build(n, parts)).helpers || []).includes('fieldmedic')) return false;
  return true;
}
// the game's own tables today (to say what holds and what is gone)
function oldTables() {
  const H = fs.readFileSync(path.join(ROOT, 'prototypes', 'tabletop-2.html'), 'utf8'), O = { fit: {}, epic: {}, triple: {} };
  try { O.fit = JSON.parse(H.match(/const PART_FIT = (\{.*?\});/)[1]); } catch (e) {}
  const eb = H.slice(H.indexOf('const EPIC = {'), H.indexOf('};', H.indexOf('const EPIC = {')));
  for (const m of eb.matchAll(/'([A-Za-z]+\|[a-z]+)':\s*\['([^']+)',\s*(\d+),\s*(\d+)/g)) O.epic[m[1]] = [m[2], +m[3], +m[4]];
  const tb = H.slice(H.indexOf('const TRIPLE = {'), H.indexOf('};', H.indexOf('const TRIPLE = {')));
  for (const m of tb.matchAll(/(\w+):\s*\[\[([^\]]*)\],\s*(\d+),\s*(\d+),\s*(\d+)\]/g)) O.triple[m[1]] = [m[2].replace(/['\s]/g, '').split(','), +m[3], +m[4], +m[5]];
  return O;
}

// ---------- statistics ----------
const Z = 1.96;
function stat(a) { const n = a.length; if (!n) return { m: 0, lo: 0, hi: 0, n: 0 }; const m = a.reduce((x, y) => x + y, 0) / n;
  const v = n > 1 ? a.reduce((x, y) => x + (y - m) * (y - m), 0) / (n - 1) : 0.25, se = Math.max(Math.sqrt(v / n), 0.25 / Math.sqrt(n));
  return { m, lo: m - Z * se, hi: m + Z * se, n }; }
const r3 = x => Math.round(x * 1000) / 1000;
const st3 = s => ({ m: r3(s.m), lo: r3(s.lo), hi: r3(s.hi), n: s.n });
const lg = (p, n) => { const e = 0.5 / Math.max(1, n); return Math.log((p + e) / (1 - p + e)); };

// ---------- depth presets (--hours picks one after stage 1 is timed) ----------
// cap: most candidates in stage 2; r2: its rounds (2 fights a round vs each robot a level up); fv: verify fights a pair; top/rnd:
// best singles paired up / random extra pairs a robot; synV/fvy: pairs re-fought for synergy and fights a pair; P: best pairs taken
// on to full builds (x each legendary); hr: halving rounds; fw: build-verify fights a pair; tiers + ft: tiers tested, fights a pair.
const DEPTH = {
  0: { cap: 24, r2: 2, fv: 4, top: 3, rnd: 2, synV: 4, fvy: 4, P: 2, hr: 2, fw: 2, tiers: [2], ft: 2 },   // the build box's small slice
  1: { cap: 100, r2: 4, fv: 6, top: 4, rnd: 4, synV: 10, fvy: 6, P: 3, hr: 3, fw: 2, tiers: [2], ft: 4 },
  2: { cap: 160, r2: 6, fv: 8, top: 5, rnd: 6, synV: 16, fvy: 8, P: 4, hr: 4, fw: 4, tiers: [2, 4], ft: 4 },
  3: { cap: 240, r2: 8, fv: 12, top: 6, rnd: 10, synV: 24, fvy: 10, P: 5, hr: 4, fw: 8, tiers: [1, 2, 4], ft: 6 },
  4: { cap: 320, r2: 10, fv: 16, top: 7, rnd: 16, synV: 32, fvy: 12, P: 6, hr: 5, fw: 12, tiers: [1, 2, 3, 4], ft: 8 },
  5: { cap: 400, r2: 12, fv: 20, top: 8, rnd: 24, synV: 40, fvy: 16, P: 7, hr: 5, fw: 16, tiers: [1, 2, 3, 4], ft: 12 },
  6: { cap: 500, r2: 16, fv: 24, top: 9, rnd: 32, synV: 48, fvy: 20, P: 8, hr: 5, fw: 24, tiers: [1, 2, 3, 4], ft: 16 },
  7: { cap: 600, r2: 20, fv: 32, top: 10, rnd: 48, synV: 64, fvy: 24, P: 9, hr: 5, fw: 32, tiers: [1, 2, 3, 4], ft: 24 },
  8: { cap: 700, r2: 24, fv: 48, top: 11, rnd: 64, synV: 80, fvy: 32, P: 10, hr: 5, fw: 48, tiers: [1, 2, 3, 4], ft: 32 },
};
const HALV = [2, 2, 4, 8, 16];   // fights a pair added in each halving round
function estCost(c, nR, nCand) {   // rough fight count of stages 2-4 (for the depth choice and the time left)
  const nc = Math.min(c.cap, nCand), op = 6.5;
  const s2 = nc * op * 2 * c.r2 * 0.6 + nR * op * 2 * c.r2, sv = (0.5 * nc + 25) * op * c.fv + nR * op * c.fv;
  const s3a = nR * (c.top * (c.top - 1) / 2 * 0.85 + c.rnd) * 16, s3y = c.synV * op * c.fvy * 3;
  const nB = c.P * 3 + 3; let s3b = 0; for (let r = 0; r < c.hr; r++) s3b += Math.max(2, nB / Math.pow(2, r)) * 6 * HALV[r]; s3b *= nR;
  const s3w = nR * 14 * 3 * c.fw, s4 = nR * 1.5 * (c.tiers.length + 1) * op * c.ft;
  return Math.round(s2 + sv + s3a + s3y + s3b + s3w + s4);
}

// ---------- main ----------
const args = process.argv.slice(2), opt = (k, d) => { const a = args.find(x => x === '--' + k || x.startsWith('--' + k + '=')); return a ? (a.includes('=') ? a.split('=').slice(1).join('=') : true) : d; };
const OUT = path.resolve(ROOT, String(opt('out', 'combo-results')));
const NW = Math.max(1, +opt('workers', Math.max(1, os.cpus().length - 1)));
const HOURS = Math.max(0.25, +String(opt('hours', 3)).replace(',', '.') || 3), F1 = +opt('screen', 4), REPORT_ONLY = !!opt('report');
const SUBJ = opt('robots') ? String(opt('robots')).split(',').filter(n => ALL[n]) : NAMES.slice();
fs.mkdirSync(OUT, { recursive: true });
const FP = crypto.createHash('md5').update(fs.readFileSync(path.join(DL, 'engine.js'))).update(fs.readFileSync(path.join(DL, 'lineup.js'))).digest('hex').slice(0, 8);
const STATE_F = path.join(OUT, 'state.json'), FIGHTS_F = path.join(OUT, 'fights.jsonl');
let state = fs.existsSync(STATE_F) ? JSON.parse(fs.readFileSync(STATE_F, 'utf8')) : {};
if (state.fp && state.fp !== FP) { console.log(`The engine changed since the fights in ${OUT} were run (${state.fp} -> ${FP}): starting a fresh folder.`);
  fs.renameSync(OUT, OUT + '-old-' + state.fp); fs.mkdirSync(OUT, { recursive: true }); state = {}; }
if (state.robots && state.robots.join() !== SUBJ.join() && !opt('robots')) SUBJ.splice(0, SUBJ.length, ...state.robots);
if (state.screen) { if (opt('screen') && +opt('screen') !== state.screen) console.log('(keeping the screen size of the earlier run: ' + state.screen + ')'); }
const SCREEN = state.screen || F1;
Object.assign(state, { fp: FP, robots: SUBJ, screen: SCREEN, hours: state.hours || HOURS });
const saveState = () => fs.writeFileSync(STATE_F, JSON.stringify(state, null, 1));
saveState();

const R = new Map();   // key -> score (1 / 0.5 / 0)
const T = new Map();   // key -> [fight length, how]
if (fs.existsSync(FIGHTS_F)) for (const ln of fs.readFileSync(FIGHTS_F, 'utf8').split('\n')) { if (!ln) continue; try { const a = JSON.parse(ln); R.set(a[0], a[1]); T.set(a[0], [a[2], a[3]]); } catch (e) { /* a line cut by a stop */ } }
const loaded = R.size;

// ---------- the worker pool ----------
const t0 = Date.now(); let ranNow = 0, stageTxt = '', stageDone = 0, stageAll = 0, forecast = 0, lastShow = 0;
const fmt = s => { s = Math.max(0, Math.round(s)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return h ? `${h} h ${String(m).padStart(2, '0')} min` : m ? `${m} min` : `${s} s`; };
function show(force) {
  if (!force && Date.now() - lastShow < 2000) return; lastShow = Date.now();
  const el = (Date.now() - t0) / 1000, rate = ranNow / Math.max(1, el), left = Math.max(0, forecast - R.size);
  const eta = rate > 0 && ranNow >= 50 ? `about ${fmt(left / rate)} left (rough)` : 'measuring speed...';
  process.stdout.write(`\r  ${stageTxt}: ${stageDone}/${stageAll} | all ${R.size} fights, ${rate.toFixed(1)}/s | ${eta}        `);
}
let pool = null;
function mkPool() {
  const W = [], q = []; let id = 0; const wait = new Map(); const out = fs.openSync(FIGHTS_F, 'a');
  const give = w => { if (!q.length) { w.busy = false; return; } const job = q.shift(); w.busy = true; wait.set(job.id, job); w.p.send({ id: job.id, keys: job.keys }); };
  const add = () => { const p = fork(__filename, ['--worker'], { stdio: ['ignore', 'inherit', 'inherit', 'ipc'] }), w = { p, busy: false };
    p.on('message', m => { const job = wait.get(m.id); wait.delete(m.id);
      fs.writeSync(out, m.res.map(a => JSON.stringify(a)).join('\n') + '\n');
      for (const a of m.res) { R.set(a[0], a[1]); T.set(a[0], [a[2], a[3]]); } ranNow += m.res.length; stageDone += m.res.length; show();
      job.done(); give(w); });
    p.on('exit', code => { if (code) { console.error('\nA worker stopped (code ' + code + '). Start the program again: it goes on where it stopped.'); process.exit(1); } });
    W.push(w); };
  for (let i = 0; i < NW; i++) add();
  return { run(keys) { const CH = 4; const ps = []; for (let i = 0; i < keys.length; i += CH) ps.push(new Promise(res => q.push({ id: ++id, keys: keys.slice(i, i + CH), done: res })));
      for (const w of W) if (!w.busy) give(w); return Promise.all(ps); },
    close() { for (const w of W) { w.p.removeAllListeners('exit'); w.p.send('bye'); } fs.closeSync(out); } };
}
async function need(keys, label) {
  const miss = [...new Set(keys)].filter(k => !R.has(k));
  stageTxt = label; stageAll = miss.length; stageDone = 0;
  if (!miss.length) return;
  if (REPORT_ONLY) throw new Error('--report: ' + miss.length + ' fights of "' + label + '" are not on file yet');
  // spread the long jobs: sort so that each chunk mixes robots (keeps the workers evenly loaded)
  miss.sort((a, b) => hash(a) - hash(b));
  if (!pool) pool = mkPool();
  show(true); await pool.run(miss); show(true);
}
const sc = k => R.has(k) ? R.get(k) : null;

// ---------- opponents ----------
const lvOf = l => NAMES.filter(m => lv(m) === l);
function pick(list, k, salt) { const r = mkRng(hash(salt)), p = list.slice(), o = []; while (o.length < k && p.length) o.push(p.splice(Math.floor(r() * p.length), 1)[0]); return o; }
const upL = n => Math.min(4, lv(n) + 1), up2L = n => Math.min(4, lv(n) + 2);
const allUp = n => lvOf(upL(n)).filter(m => m !== n);
const screenUp = n => pick(allUp(n), 4, 'up|' + n);
const screenSame = n => { const u = screenUp(n); return pick(lvOf(lv(n)).filter(m => m !== n && !u.includes(m)), 2, 'same|' + n); };
const halvPanel = n => { const a = pick(allUp(n), 3, 'h1|' + n); return a.concat(pick(lvOf(up2L(n)).filter(m => m !== n && !a.includes(m)), 3, 'h2|' + n)); };
const verifyOpps = n => { const ls = new Set(); if (lv(n) === 4) ls.add(4); else { for (let l = upL(n); l <= up2L(n); l++) ls.add(l); if (lv(n) <= 2) { ls.add(3); ls.add(4); } }
  return NAMES.filter(m => m !== n && ls.has(lv(m))); };

// paired fights: keys and the per-fight differences (with - without) on the same seeds
function pairKeys(set, n, b, opps, f0, f1, ob = '', b0 = '') { const ks = []; for (const o of opps) for (let f = f0; f < f1; f++) { ks.push(K(set, n, b, o, ob, f), K(set, n, b0, o, ob, f)); } return ks; }
function paired(set, n, b, opps, f0, f1, ob = '', b0 = '') { const d = [], w = [], wo = [];
  for (const o of opps) for (let f = f0; f < f1; f++) { const a = sc(K(set, n, b, o, ob, f)), z = sc(K(set, n, b0, o, ob, f)); if (a == null || z == null) continue; d.push(a - z); w.push(a); wo.push(z); }
  const s = stat(d); return Object.assign(st3(s), { w: r3(stat(w).m), wo: r3(stat(wo).m) }); }
function rate(set, n, b, opps, f0, f1, ob = '') { const a = []; for (const o of opps) for (let f = f0; f < f1; f++) { const x = sc(K(set, n, b, o, typeof ob === 'function' ? ob(o) : ob, f)); if (x != null) a.push(x); } const s = st3(stat(a)); s.lo = Math.max(0, s.lo); s.hi = Math.min(1, s.hi); return s; }

// the old rules (docs/robocus-tuned-lineup-tags.md; tools/damage-lab/tag-tuned-final.py): x = gain - the part's average gain
//   great fit: x >= +15 points (and the screen agrees: fit residual > 0); poor fit: x <= -15 (screen < 0); epic: gain >= 30 and x >= 20
const RULE = { great: 0.15, poor: -0.15, epicGain: 0.30, epicOver: 0.20 };
const cat = (d, x, s1) => (d >= RULE.epicGain && x >= RULE.epicOver && s1 > 0) ? 'epic' : (x >= RULE.great && s1 > 0) ? 'great' : (x <= RULE.poor && s1 < 0) ? 'poor' : '';
const rank = { epic: 2, great: 1, '': 0, poor: -1 };

async function plan() {
  const A = { meta: { robots: SUBJ, screen: SCREEN, fp: FP, rule: RULE }, old: oldTables() };
  const subj = SUBJ;
  if (opt('depth') != null && opt('depth') !== true) { state.depth = +opt('depth'); saveState(); }
  // ===== stage 1: screen =====
  const single = {};   // n -> [parts that fit alone]
  for (const n of subj) single[n] = PARTS.filter(k => fitsBuild(n, k));
  { const ks = []; for (const n of subj) { const opp = screenUp(n).concat(screenSame(n)); for (const k of [''].concat(single[n])) for (const o of opp) for (let f = 0; f < SCREEN; f++) ks.push(K('S', n, k, o, '', f)); }
    forecast = ks.length + (state.depth != null ? estCost(DEPTH[state.depth], subj.length, 60) : 0);
    const before = ranNow, tS = Date.now(); await need(ks, 'stage 1 of 4 (screen: every part on every robot)');
    if (state.rate == null && ranNow - before >= 50) { state.rate = r3((ranNow - before) / ((Date.now() - tS) / 1000)); saveState(); } }
  const s1 = {}, pa = {}, paS = {}, ra = {};
  for (const n of subj) for (const k of single[n]) s1[n + '|' + k] = { up: paired('S', n, k, screenUp(n), 0, SCREEN), same: paired('S', n, k, screenSame(n), 0, SCREEN) };
  for (const k of PARTS) { const g = subj.filter(n => s1[n + '|' + k]); if (g.length) { pa[k] = r3(g.reduce((a, n) => a + s1[n + '|' + k].up.m, 0) / g.length); paS[k] = r3(g.reduce((a, n) => a + s1[n + '|' + k].same.m, 0) / g.length); } }
  for (const n of subj) ra[n] = r3(single[n].reduce((a, k) => a + s1[n + '|' + k].up.m, 0) / Math.max(1, single[n].length));
  const gm = Object.values(pa).reduce((a, x) => a + x, 0) / Math.max(1, Object.keys(pa).length);
  for (const id in s1) { const [n, k] = id.split('|'); s1[id].fit = r3(s1[id].up.m - pa[k] - ra[n] + gm); s1[id].x = r3(s1[id].up.m - pa[k]); }
  A.s1 = s1; A.pa = pa; A.paSame = paS; A.ra = ra; A.gm = r3(gm);
  A.bare = {}; for (const n of subj) A.bare[n] = { up: rate('S', n, '', screenUp(n), 0, SCREEN), same: rate('S', n, '', screenSame(n), 0, SCREEN) };

  // ===== depth: from the hours and the speed of stage 1 (chosen once, kept) =====
  const forced = new Set(); for (const id of Object.keys(A.old.epic).concat(Object.entries(A.old.fit).flatMap(([n, o]) => Object.keys(o).map(k => n + '|' + k)))) if (s1[id]) forced.add(id);
  const scoreC = id => Math.max(Math.abs(s1[id].fit), Math.abs(s1[id].x));
  const pool1 = Object.keys(s1).filter(id => scoreC(id) >= 0.15 && !forced.has(id)).sort((a, b) => scoreC(b) - scoreC(a) || (a < b ? -1 : 1));
  if (state.depth == null) {
    const r = state.rate || 10, left = state.hours * 3600 * r - R.size; let d = 1;
    for (const x of [1, 2, 3, 4, 5, 6, 7, 8]) if (estCost(DEPTH[x], subj.length, pool1.length + forced.size) <= 0.85 * left) d = x;   // 15% spare: the estimate is rough
    state.depth = d; saveState();
    console.log(`\n  Speed here: ${r.toFixed(1)} fights a second. For ${state.hours} h the search goes to depth ${d} of 8 (about ${estCost(DEPTH[d], subj.length, pool1.length + forced.size)} more fights).`);
  }
  const C = DEPTH[state.depth]; A.meta.depth = state.depth; A.meta.cfg = C; A.meta.hours = state.hours;
  forecast = R.size + estCost(C, subj.length, pool1.length + forced.size);

  // ===== stage 2: confirm, sequential =====
  const cand = pool1.slice(0, Math.max(0, C.cap - forced.size)).concat([...forced].sort());
  A.cand = cand; A.forced = [...forced].sort();
  const s2 = {}; const active = new Set(cand);
  for (let r = 0; r < C.r2 && active.size; r++) {
    const ks = []; for (const id of active) { const [n, k] = id.split('|'); ks.push(...pairKeys('C', n, k, allUp(n), 2 * r, 2 * r + 2)); }
    await need(ks, `stage 2 of 4 (confirm: ${active.size} candidates, round ${r + 1} of ${C.r2})`);
    for (const id of [...active]) { const [n, k] = id.split('|'), s = paired('C', n, k, allUp(n), 0, 2 * r + 2), x = { m: r3(s.m - pa[k]), lo: r3(s.lo - pa[k]), hi: r3(s.hi - pa[k]) };
      s2[id] = { d: s, x, rounds: r + 1, why: 'round limit' };
      if (r >= 1) { let why = '';
        if (x.hi < RULE.great && x.lo > RULE.poor) why = 'clearly average';
        else if (x.lo >= RULE.epicOver && s.lo >= RULE.epicGain) why = 'surely epic';
        else if (x.hi <= RULE.poor) why = 'surely poor';
        else if (x.lo >= RULE.great && s.hi < RULE.epicGain) why = 'surely great, not epic';
        if (why && !(forced.has(id) && why === 'clearly average' && r < 2)) { s2[id].why = why; active.delete(id); } } }
  }
  for (const id in s2) s2[id].cat = cat(s2[id].d.m, s2[id].x.m, s1[id].fit);
  A.s2 = s2;

  // ===== stage 2v: verify on fresh seeds =====
  const toV = Object.keys(s2).filter(id => s2[id].cat || forced.has(id)).sort();
  { const ks = []; for (const id of toV) { const [n, k] = id.split('|'); ks.push(...pairKeys('V', n, k, allUp(n), 0, C.fv)); }
    await need(ks, `stage 2 of 4 (verify: ${toV.length} combos on fresh seeds)`); }
  A.v = {};
  for (const id of toV) { const [n, k] = id.split('|'), v = paired('V', n, k, allUp(n), 0, C.fv), xv = r3(v.m - pa[k]), cv = cat(v.m, xv, s1[id].fit), c2 = s2[id].cat;
    // found = the same verdict on the sorting fights and on the fresh ones (the weaker of the two)
    let fin = ''; if (rank[c2] > 0 && rank[cv] > 0) fin = rank[c2] >= 2 && rank[cv] >= 2 ? 'epic' : 'great'; else if (c2 === 'poor' && cv === 'poor') fin = 'poor';
    const pool = paired('C', n, k, allUp(n), 0, 2 * s2[id].rounds); const allD = { m: r3((pool.m * pool.n + v.m * v.n) / Math.max(1, pool.n + v.n)), n: pool.n + v.n,
      w: r3((pool.w * pool.n + v.w * v.n) / Math.max(1, pool.n + v.n)), wo: r3((pool.wo * pool.n + v.wo * v.n) / Math.max(1, pool.n + v.n)) };
    A.v[id] = { v, x: xv, catV: cv, cat2: c2, final: fin, all: allD, borderline: !fin && (rank[c2] !== 0 || rank[cv] !== 0) }; }

  // ===== stage 3a: pairs (2 slot parts) on the screen seeds =====
  const gainOf = id => s1[id] ? s1[id].up.m : -1;
  A.pairs = {};
  { const ks = [], P = {};
    for (const n of subj) { const sl = single[n].filter(k => kind(k) !== 'legendary').sort((a, b) => gainOf(n + '|' + b) - gainOf(n + '|' + a) || (a < b ? -1 : 1)), top = sl.slice(0, C.top), L2 = new Map();
      for (let i = 0; i < top.length; i++) for (let j = i + 1; j < top.length; j++) { const b = canon([top[i], top[j]]); if (fitsBuild(n, b)) L2.set(b, 'top'); }
      for (const k of top) if ((LU.PARTS[k].copies || 1) >= 2 && fitsBuild(n, canon([k, k]))) L2.set(canon([k, k]), 'top');
      const rest = []; for (let i = 0; i < sl.length; i++) for (let j = i + 1; j < sl.length; j++) { const b = canon([sl[i], sl[j]]); if (!L2.has(b) && fitsBuild(n, b)) rest.push(b); }
      for (const b of pick(rest, C.rnd, 'rnd|' + n)) L2.set(b, 'random');
      P[n] = [...L2.entries()];
      for (const [b] of P[n]) ks.push(...pairKeys('S', n, b, screenUp(n), 0, SCREEN)); }
    await need(ks, 'stage 3 of 4 (pairs of parts, ' + ks.length / 2 / SCREEN / 4 + ' pairs)');
    for (const n of subj) A.pairs[n] = P[n].map(([b, why]) => { const [a, c] = parseBuild(b).parts, g = paired('S', n, b, screenUp(n), 0, SCREEN), ga = gainOf(n + '|' + a), gc = gainOf(n + '|' + c), w0 = A.bare[n].up.m, nn = g.n;
      const synL = lg(g.w, nn) - lg(w0, nn) - (lg(w0 + ga, nn) - lg(w0, nn)) - (lg(w0 + gc, nn) - lg(w0, nn));
      return { b, why, g, ga, gc, syn: r3(g.m - ga - gc), synL: r3(synL) }; }).sort((x, y) => y.g.m - x.g.m || (x.b < y.b ? -1 : 1)); }

  // ===== stage 3y: synergy re-fought on fresh seeds (pair, each half alone, bare) =====
  { const all = subj.flatMap(n => A.pairs[n].map(p => Object.assign({ n }, p))).filter(p => p.g.n);
    const up = all.slice().sort((a, b) => b.synL - a.synL || (a.n + a.b < b.n + b.b ? -1 : 1)).slice(0, Math.ceil(C.synV * 2 / 3));
    const dn = all.slice().sort((a, b) => a.synL - b.synL || (a.n + a.b < b.n + b.b ? -1 : 1)).filter(p => !up.includes(p)).slice(0, Math.floor(C.synV / 3));
    const ks = []; for (const p of up.concat(dn)) { const [a, c] = parseBuild(p.b).parts; for (const o of allUp(p.n)) for (let f = 0; f < C.fvy; f++) for (const b of [p.b, a, c, '']) ks.push(K('Y', p.n, b, o, '', f)); }
    await need(ks, `stage 3 of 4 (synergy check: ${up.length + dn.length} pairs on fresh seeds)`);
    A.syn = up.concat(dn).map(p => { const [a, c] = parseBuild(p.b).parts, d = [], w = [], wa = [], wc = [], w0 = [];
      for (const o of allUp(p.n)) for (let f = 0; f < C.fvy; f++) { const s = [p.b, a, c, ''].map(b => sc(K('Y', p.n, b, o, '', f))); if (s.some(x => x == null)) continue; d.push(s[0] - s[1] - s[2] + s[3]); w.push(s[0]); wa.push(s[1]); wc.push(s[2]); w0.push(s[3]); }
      const m = a => stat(a).m, nn = d.length, synL = lg(m(w), nn) - lg(m(wa), nn) - lg(m(wc), nn) + lg(m(w0), nn);
      return { n: p.n, b: p.b, picked: up.includes(p) ? 'high' : 'low', screen: { syn: p.syn, synL: p.synL }, syn: st3(stat(d)), synL: r3(synL), w: r3(m(w)), wa: r3(m(wa)), wc: r3(m(wc)), w0: r3(m(w0)), n2: nn }; }); }

  // ===== stage 3b: full builds (2 parts + a legendary) by successive halving =====
  A.builds = {};
  { const BC = {};
    for (const n of subj) { const pr = A.pairs[n].slice(0, C.P).map(p => p.b), syn = (A.syn.find(s => s.n === n && s.picked === 'high' && s.synL > 0) || {}).b; if (syn && !pr.includes(syn)) pr.push(syn);
      const set = new Set(); for (const p of pr) for (const l of LEGS) { const b = canon(parseBuild(p).parts.concat([l])); if (fitsBuild(n, b)) set.add(b); }
      const old = A.old.triple[n]; if (old) { const b = canon(old[0]); if (fitsBuild(n, b)) set.add(b); }
      BC[n] = { alive: [...set].sort(), hist: {} }; }
    let f0 = 0;
    for (let r = 0; r < C.hr; r++) { const m = HALV[r], ks = [];
      for (const n of subj) if (BC[n].alive.length > 1 || r === 0) for (const b of BC[n].alive) for (const o of halvPanel(n)) for (let f = f0; f < f0 + m; f++) ks.push(K('H', n, b, o, '', f));
      await need(ks, `stage 3 of 4 (full builds, halving round ${r + 1} of ${C.hr})`);
      for (const n of subj) { const B = BC[n]; if (B.alive.length <= 1 && r > 0) continue;
        const s = B.alive.map(b => ({ b, w: rate('H', n, b, halvPanel(n), 0, f0 + m) })); for (const x of s) B.hist[x.b] = { w: x.w, rounds: r + 1 };
        s.sort((a, b) => b.w.m - a.w.m || (a.b < b.b ? -1 : 1));
        if (r < C.hr - 1) B.alive = s.slice(0, Math.max(1, Math.ceil(s.length / 2))).map(x => x.b).sort(); else B.alive = s.map(x => x.b); }
      f0 += m; }
    for (const n of subj) { const B = BC[n], s = Object.entries(B.hist).sort((a, b) => b[1].rounds - a[1].rounds || b[1].w.m - a[1].w.m || (a[0] < b[0] ? -1 : 1));
      A.builds[n] = { best: s[0] ? s[0][0] : null, tried: s.map(([b, h]) => ({ b, w: h.w, rounds: h.rounds })) }; } }

  // ===== stage 3w: each robot's best build on fresh seeds, vs bare and kitted robots one and two levels up =====
  const kitOf = o => (A.builds[o] && A.builds[o].best) || canon(['weapon', 'hull', 'core']);   // robots outside this run: the old test kit
  A.bv = {};
  { const ks = [], jobs = [];
    for (const n of subj) { const bs = [A.builds[n].best].filter(Boolean); const old = A.old.triple[n]; if (old && fitsBuild(n, canon(old[0])) && !bs.includes(canon(old[0]))) bs.push(canon(old[0]));
      for (const b of bs) { jobs.push([n, b]); for (const o of verifyOpps(n)) for (let f = 0; f < C.fw; f++) ks.push(K('W', n, b, o, '', f), K('W', n, '', o, '', f), K('W', n, b, o, kitOf(o), f)); } }
    await need(ks, `stage 3 of 4 (best builds on fresh seeds: ${jobs.length} builds)`);
    for (const [n, b] of jobs) { const g = l => verifyOpps(n).filter(o => l(lv(o))), grp = { up1: g(l => l === upL(n)), up2: lv(n) <= 2 ? g(l => l === up2L(n)) : [], l34: lv(n) <= 2 ? g(l => l >= 3) : [] };
      const o = { b, old: !!(A.old.triple[n] && canon(A.old.triple[n][0]) === b && A.builds[n].best !== b) };
      for (const [gk, os] of Object.entries(grp)) if (os.length) o[gk] = { asIs: rate('W', n, '', os, 0, C.fw), bare: rate('W', n, b, os, 0, C.fw), kit: rate('W', n, b, os, 0, C.fw, kitOf), opps: os.length };
      (A.bv[n] = A.bv[n] || []).push(o); } }

  // ===== stage 4: rarity tiers on the promising combos =====
  { const list = new Set();
    for (const id in A.v) if (A.v[id].final === 'epic' || A.v[id].final === 'great') list.add(id);
    for (const n of subj) { const best = single[n].slice().sort((a, b) => gainOf(n + '|' + b) - gainOf(n + '|' + a) || (a < b ? -1 : 1)).filter(k => kind(k) !== 'chip')[0]; if (best) list.add(n + '|' + best); }
    const L4 = [...list].filter(id => kind(id.split('|')[1]) !== 'chip').sort(), ks = [];
    for (const id of L4) { const [n, k] = id.split('|'); for (const o of allUp(n)) for (let f = 0; f < C.ft; f++) { ks.push(K('T', n, '', o, '', f), K('T', n, k, o, '', f)); for (const t of C.tiers) ks.push(K('T', n, k + '@' + t, o, '', f)); } }
    await need(ks, `stage 4 of 4 (rarity tiers on ${L4.length} combos)`);
    A.tiers = L4.map(id => { const [n, k] = id.split('|'), o = { id, std: paired('T', n, k, allUp(n), 0, C.ft), t: {} };
      for (const t of C.tiers) o.t[t] = { gain: paired('T', n, k + '@' + t, allUp(n), 0, C.ft), over: paired('T', n, k + '@' + t, allUp(n), 0, C.ft, '', k) }; return o; }); }

  A.meta.fights = R.size; A.meta.rate = state.rate; A.meta.workers = NW; A.meta.cores = os.cpus().length;
  return A;
}

(async () => {
  console.log(`ROBOCUS combo hunt: ${SUBJ.length} robots, ${PARTS.length} part cards, ${NW} workers. Results: ${OUT}`);
  if (loaded) console.log(`  (going on from an earlier run: ${loaded} fights on file)`);
  let A;
  try { A = await plan(); } finally { if (pool) pool.close(); }
  show(true); console.log('');
  const rev = (() => { try { return fs.readFileSync(path.join(ROOT, 'combo-results-rev.txt'), 'utf8').trim(); } catch (e) { return ''; } })();
  A.meta.rev = rev;
  fs.writeFileSync(path.join(OUT, 'analysis.json'), JSON.stringify(A));
  const REP = require('./combo-report.js'), { md, results } = REP.render(A);
  fs.writeFileSync(path.join(OUT, 'report.md'), md);
  fs.writeFileSync(path.join(OUT, 'combo-results.json'), JSON.stringify(results, null, 1));
  const pack = { made: new Date().toISOString(), rev, fp: FP, cores: os.cpus().length, workers: NW, state, report: md, results, analysis: A, fights: fs.readFileSync(FIGHTS_F, 'utf8') };
  const outF = path.join(OUT, 'combo-hunt-results.json.gz'); fs.writeFileSync(outF, zlib.gzipSync(JSON.stringify(pack)));
  console.log(`\nDONE: ${R.size} fights. The report to read: ${path.join(OUT, 'report.md')}\nSend this ONE file back to Claude:\n\n  ${outF}\n`);
})().catch(e => { console.error('\n' + (e && e.stack || e)); process.exit(1); });

module.exports = { hash, seedOf, K, parseBuild, canon, fitsBuild, stat, DEPTH, estCost };
