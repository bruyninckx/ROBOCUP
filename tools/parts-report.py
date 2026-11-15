# Whole games (game-sim runs): do robots with parts win as often as the bookie says? python3 tools/parts-report.py <tag> [<tag> ...]
import json,sys,collections
for tag in sys.argv[1:]:
    D=json.load(open(f'sims/{tag}.json')); FX=[f for g in D['res'] if g for f in (g.get('v2') or g).get('fightsX',[])]
    B=collections.defaultdict(lambda:[0,0,0])   # parts difference (mine - theirs): [n, odds sum, wins]
    for f in FX:
        x=[e for e in (f.get('x2') or []) if e]
        if f.get('win') is None or f.get('house') or len(x)!=2 or x[0]['side']==x[1]['side'] or not f.get('p'): continue
        for a,b in ((x[0],x[1]),(x[1],x[0])):
            d=max(-2,min(2,a['parts']-b['parts'])); r=B[d]; r[0]+=1; r[1]+=f['p'][a['side']]; r[2]+=1 if f['win']==a['side'] else 0
    print(tag+':', ' · '.join(f"parts {d:+d}: odds {round(100*v[1]/v[0])}% won {round(100*v[2]/v[0])}% ({v[0]})" for d,v in sorted(B.items()) if d>=0))
