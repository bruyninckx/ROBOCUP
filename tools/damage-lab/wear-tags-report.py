# T41: the bookie's tags and part levels from the big run on Kev's PC (tools/wear-tables.cmd, wear on, retuned robots).
# python3 wear-tags-report.py <results dir (unpacked wear-tables-results.json.gz)>  -> prints the tables and writes <dir>/wear-tags.json
# Rules as on 15 Nov (tag-tuned-report.py, tag-tuned-final.py, parttest-report.py); run tag-tuned-cand.py with OUT=<dir>/tags first
# (parts-sum.json). Ratings for the 2v2 tags come from the open-floor matchup fights (matrix-open-all-*.json), not a separate duel run.
import json,glob,math,collections,sys,os
D=sys.argv[1]; T=D+'/tags'; LN=json.load(open(D+'/lineup.json')); lv=LN['lv']; p=LN['p']; names=list(lv)
ld=lambda sec: sum([json.load(open(f)) for f in sorted(glob.glob(f'{T}/{sec}_*.json')) if not f.endswith('.done')],[])
lg=lambda x: math.log(max(.02,min(.98,x))/(1-max(.02,min(.98,x))))
out={}
# ---- part levels (parttest-report.py): levels a part adds vs a level up, all / L0-1 / L2-3 / L4 ----
rows=ld('parts'); step=lg(0.64); grp=lambda n:'L0-1' if lv[n]<=1 else 'L2-3' if lv[n]<=3 else 'L4'
W=collections.defaultdict(lambda:[0,0])
for r in rows:
    w=0.5 if r['win'] is None else r['win']
    for g in ('all',grp(r['n'])): x=W[(r['k'],g)]; x[0]+=w; x[1]+=1
PL={}
for k in sorted({r['k'] for r in rows if r['k']}):
    PL[k]=[round((lg(W[(k,g)][0]/W[(k,g)][1])-lg(W[(None,g)][0]/W[(None,g)][1]))/step,2) if W[(k,g)][1] else 0 for g in ('all','L0-1','L2-3','L4')]
out['partLv']=PL; out['partFights']=len(rows)
# ---- great / poor fits, epic combos (tag-tuned-final.py), from the 58 candidates of 15 Nov re-tested with and without the part ----
PS=json.load(open(T+'/parts-sum.json')); pa=PS['pa']
g=collections.defaultdict(lambda:[0,0,0])
for r in ld('confirm'): x=g[r['id']]; x[0]+=r['with']; x[1]+=r['without']; x[2]+=1
fits={}; epic={}; conf={}
for id,(w,wo,n) in g.items():
    nm,k=id.split('|'); d=(w-wo)/n; first=PS['fit'].get(id,0); conf[id]=[round(100*wo/n),round(100*w/n),n,round(100*pa[k]),round(100*first)]
    if d-pa[k]>=0.15 and first>0: fits.setdefault(nm,{})[k]=[1,round(100*d)]
    if d-pa[k]<=-0.15 and first<0: fits.setdefault(nm,{})[k]=[-1,round(100*d)]
    if d>=0.30 and d-pa[k]>=0.20 and first>0: epic[id]=[round(100*wo/n),round(100*w/n),n]
out['fits']=fits; out['epic']=epic; out['confirm']=conf
# ---- free-for-all (Brawl master / Lost in a melee) ----
ffa=ld('ffa'); rows=[]
for f in ffa:
    s=[p[n] for n in f['p']]; t=sum(s)
    for i,n in enumerate(f['p']): rows.append((n,s[i]/t,(1/len(f['win']) if n in f['win'] else 0)))
mx=sum(r[1] for r in rows)/len(rows); my=sum(r[2] for r in rows)/len(rows)
b=sum((r[1]-mx)*(r[2]-my) for r in rows)/sum((r[1]-mx)**2 for r in rows); a0=my-b*mx
FF={}
for n in names:
    m=[r for r in rows if r[0]==n]
    if len(m)<20: continue
    res=100*sum(r[2]-(a0+b*r[1]) for r in m)/len(m)
    if abs(res)>=10: FF[n]=round(res)
out['ffaFit']=FF; out['ffaFights']=len(ffa)
# ---- 2v2 (Lone wolf / Team player): ratings from the open-floor matchup fights ----
Wn={n:0.5 for n in names}; G={n:collections.Counter() for n in names}
for f in glob.glob(D+'/matrix/matrix-open-all-*.json'):
    for k,fs in json.load(open(f)).items():
        a,bb=k.split('|')
        for x in fs: Wn[a if x[0] else bb]+=1; G[a][bb]+=1; G[bb][a]+=1
pp={n:1.0 for n in names}
for _ in range(400):
    q={i:Wn[i]/(1/(pp[i]+1)+sum(N/(pp[i]+pp[j]) for j,N in G[i].items())) for i in names}
    gm=math.exp(sum(math.log(v) for v in q.values())/len(q)); pp={n:q[n]/gm for n in names}
elo={n:400*math.log10(pp[n]) for n in names}
tv=ld('tv'); TF={}
for n in names:
    m=[f for f in tv if n in f['p'] and f['win'] is not None]
    if len(m)<20: continue
    res=0
    for f in m:
        i=f['p'].index(n); t=0 if i<2 else 1; A=f['p'][:2] if t==0 else f['p'][2:]; B=f['p'][2:] if t==0 else f['p'][:2]
        e=lambda x: sum(elo[k] for k in x)/2; pr=1/(1+10**((e(B)-e(A))/400)); res+=(1 if f['win']==t else 0)-pr
    res=100*res/len(m)
    if abs(res)>=10: TF[n]=round(res)
out['teamFit']=TF; out['tvFights']=len(tv); out['elo']={n:round(v) for n,v in elo.items()}
json.dump(out,open(D+'/wear-tags.json','w'),indent=1)
print('part levels (all / L0-1 / L2-3 / L4), %d fights:'%out['partFights']); [print(' ',k,v) for k,v in sorted(PL.items(),key=lambda x:-x[1][0])]
print('fits',fits); print('epic',epic); print('FFA_FIT',FF,'(%d FFAs)'%len(ffa)); print('TEAM_FIT',TF,'(%d 2v2)'%len(tv))
