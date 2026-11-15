# from parts_*.json: robot+part fit residuals -> CAND files for confirm (fits) and slayer (top-3 builds on L0-2)
import json,glob,collections
import os; D=os.environ.get('OUT','tag-tuned'); lv=json.load(open(os.environ.get('LINEUP','lineup-tuned.json')))['lv']
rows=sum([json.load(open(f)) for f in glob.glob(f'{D}/parts_*.json')],[])
v=lambda x:0.5 if x is None else x
base=collections.defaultdict(list); w=collections.defaultdict(list)
for r in rows:
    (base[r['n']] if r['k'] is None else w[(r['n'],r['k'])]).append(v(r['win']))
B={n:sum(x)/len(x) for n,x in base.items()}
gain={(n,k):sum(x)/len(x)-B[n] for (n,k),x in w.items()}
parts=sorted({k for _,k in gain}); names=sorted(B)
pa={k:sum(gain[(n,k)] for n in names if (n,k) in gain)/len(names) for k in parts}
ra={n:sum(gain[(n,k)] for k in parts if (n,k) in gain)/len(parts) for n in names}
gm=sum(pa.values())/len(pa)
fit={nk:g-pa[nk[1]]-ra[nk[0]]+gm for nk,g in gain.items()}
json.dump({'B':B,'pa':pa,'ra':ra,'gain':{f'{n}|{k}':g for (n,k),g in gain.items()},'fit':{f'{n}|{k}':f for (n,k),f in fit.items()}},open(f'{D}/parts-sum.json','w'),indent=0)
c=[{'id':f'{n}|{k}','n':n,'parts':[k]} for (n,k),f in sorted(fit.items(),key=lambda x:-abs(x[1])) if abs(f)>=0.22]
json.dump(c,open(f'{D}/cand-fit.json','w'))
print('part avg gain', {k:round(100*x) for k,x in sorted(pa.items(),key=lambda x:-x[1])})
print(len(c),'fit candidates', [(x['id'],round(100*fit[(x['n'],x['parts'][0])])) for x in c][:40])
s=[]
for n in names:
    if lv[n]>2: continue
    top=sorted([k for k in parts if (n,k) in gain],key=lambda k:-gain[(n,k)])[:3]; s.append({'id':n+'|'+'+'.join(top),'n':n,'parts':top})
json.dump(s,open(f'{D}/cand-slayer.json','w')); print('slayer builds',[x['id'] for x in s])
