# T49: kitextra.js results -> levels gained (all / L0-1 / L2-3 / L4, paired with "none" on the same fights, with ±), how the
# fights end, fight length, per-robot gains.  python3 kitextra-report.py kit-extra/*.jsonl [--vs kit] [--robots VARIANT] [--md]
import json, sys, math, collections, os, glob
sys.path = [p for p in sys.path if p not in ('', '.')]
args = sys.argv[1:]
VS = args[args.index('--vs') + 1] if '--vs' in args else 'none'
ROB = args[args.index('--robots') + 1] if '--robots' in args else None
files = [a for i, a in enumerate(args) if not a.startswith('--') and (i == 0 or args[i - 1] not in ('--vs', '--robots'))]
LV = {'Buzzkill': 0, 'Forklift': 0, 'Hornet': 0, 'Mincer': 0, 'Popcorn': 0, 'Scythe': 0, 'Snapjaw': 0, 'Thumper': 0, 'Wrecker': 0,
      'Blacksmith': 1, 'Corkscrew': 1, 'Mauler': 1, 'Thwacker': 1, 'Vertigo': 1, 'Angler': 2, 'Gyro': 2, 'Pincher': 2, 'Whaler': 2, 'Yoyo': 2,
      'Gaucho': 3, 'Grandmaster': 3, 'Hydra': 3, 'Scavenger': 3, 'Slingshot': 3, 'Tarantula': 3}
for n in ['Bricklayer', 'Jukebox', 'Lodestone', 'Orbiter', 'Pogo', 'Railgun', 'Rotisserie', 'Trebuchet']: LV[n] = 4
R = collections.defaultdict(dict)   # variant -> (robot, opp, f) -> row
for f in files:
    for ln in open(f):
        if ln.strip(): r = json.loads(ln); R[r[1]][(r[0], r[2], r[3])] = r
lg = lambda p: math.log(max(.02, min(.98, p)) / (1 - max(.02, min(.98, p)))); STEP = lg(0.64)
grp = lambda n: 'L0-1' if LV[n] <= 1 else 'L2-3' if LV[n] <= 3 else 'L4'
G = ('all', 'L0-1', 'L2-3', 'L4')
def levels(v, base):
    out = {}
    for g in G:
        keys = [k for k in R[v] if k in R[base] and (g == 'all' or grp(k[0]) == g)]
        if not keys: continue
        a = [R[v][k][4] for k in keys]; b = [R[base][k][4] for k in keys]; n = len(keys)
        pa, pb = sum(a) / n, sum(b) / n; d = [x - y for x, y in zip(a, b)]; md = sum(d) / n
        sd = math.sqrt(sum((x - md) ** 2 for x in d) / max(1, n - 1)); se = sd / math.sqrt(n)
        pm = max(0.05, min(0.95, (pa + pb) / 2)); lv = (lg(pa) - lg(pb)) / STEP; pmse = 1.96 * se / (pm * (1 - pm)) / STEP
        out[g] = (lv, pmse, n, pa, pb)
    return out
def ends(v):
    rows = list(R[v].values()); n = len(rows); c = collections.Counter()
    for r in rows:
        if r[5] == 'KO': c[('won KO' if r[6][0] == '-' else 'lost KO') + ' ' + r[6][1:]] += 1
        else: c['time-out ' + ('won' if r[4] == 1 else 'lost' if r[4] == 0 else 'draw')] += 1
    t = sum(r[7] for r in rows) / n; to = sum(1 for r in rows if r[5] != 'KO') / n; h = sum(r[8] for r in rows) / n
    return n, c, t, to, h
md = '--md' in args
vs = sorted(R, key=lambda v: (v != 'none', v != 'kit', v))
print(f'levels vs "{VS}" (paired, same fights), 95% ±')
print('| Variant | Fights | Win % (base) | All | L0-1 | L2-3 | L4 | Time-outs | Fight s | Kit HP repaired |')
print('|---|---|---|---|---|---|---|---|---|---|')
for v in vs:
    if v == VS: continue
    L = levels(v, VS); n, c, t, to, h = ends(v)
    if 'all' not in L: continue
    cell = lambda g: f"{L[g][0]:+.2f} ± {L[g][1]:.2f}" if g in L else '-'
    print(f"| {v} | {L['all'][2]} | {100*L['all'][3]:.0f}% ({100*L['all'][4]:.0f}%) | {cell('all')} | {cell('L0-1')} | {cell('L2-3')} | {cell('L4')} | {100*to:.0f}% | {t:.1f} | {h:.0f} |")
print('\nhow the fights end (share of all fights of the variant)')
keys = sorted({k for v in vs for k in ends(v)[1]})
print('| Variant | ' + ' | '.join(keys) + ' |'); print('|---' * (len(keys) + 1) + '|')
for v in vs:
    n, c, *_ = ends(v); print(f'| {v} | ' + ' | '.join(f'{100*c[k]/n:.1f}' for k in keys) + ' |')
if ROB:
    print(f'\nper robot: {ROB} vs {VS} (win % base -> with, fights)')
    pr = collections.defaultdict(lambda: [0, 0, 0])
    for k in R[ROB]:
        if k in R[VS]: x = pr[k[0]]; x[0] += R[VS][k][4]; x[1] += R[ROB][k][4]; x[2] += 1
    for n, (b, a, m) in sorted(pr.items(), key=lambda x: -(x[1][1] - x[1][0]) / x[1][2]):
        print(f'{n:12s} L{LV[n]} {100*b/m:5.0f} -> {100*a/m:3.0f}%  ({m})  {((lg(a/m)-lg(b/m))/STEP):+.2f} lv')
