import json,glob,math,sys,collections
import os; D=os.environ.get('OUT','tag-tuned'); LN=json.load(open(os.environ.get('LINEUP','lineup-tuned.json'))); lv=LN['lv']; names=list(lv)
def load(sec):
    if sec in ('arena','body','ffa','tv') and glob.glob(f'{D}/more/{sec}_*.json.done'): return sum([json.load(open(f)) for f in sorted(glob.glob(f'{D}/more/{sec}_*.json'))],[])
    return sum([json.load(open(f)) for f in sorted(glob.glob(f'{D}/{sec}_*.json')) if not f.endswith('.done')],[])
lg=lambda x: math.log(max(0.02,min(0.98,x))/(1-max(0.02,min(0.98,x))))
out={'tags':{n:[] for n in names},'stat':{n:{} for n in names}}
def tag(n,t,why): out['tags'][n].append([t,why])
duel=load('duel')
# ratings
W={n:0.5 for n in names}; G={n:collections.Counter() for n in names}
for r in duel:
    if r['win'] is None: W[r['a']]+=.5; W[r['b']]+=.5
    else: W[r['win']]+=1
    G[r['a']][r['b']]+=1; G[r['b']][r['a']]+=1
p={n:1.0 for n in names}
for _ in range(400):
    q={i:W[i]/(1/(p[i]+1)+sum(N/(p[i]+p[j]) for j,N in G[i].items())) for i in names}
    gm=math.exp(sum(math.log(v) for v in q.values())/len(q)); p={n:q[n]/gm for n in names}
elo={n:400*math.log10(p[n]) for n in names}
# pair win rates and level-gap expectations
pair=collections.defaultdict(lambda:[0,0])
for r in duel:
    a,b=r['a'],r['b']; w=1 if r['win']==a else 0.5 if r['win'] is None else 0
    pair[(a,b)][0]+=w; pair[(a,b)][1]+=1; pair[(b,a)][0]+=1-w; pair[(b,a)][1]+=1
gap=collections.defaultdict(list)
for (a,b),(w,n) in pair.items(): gap[lv[a]-lv[b]].append(w/n)
EXP={d:sum(v)/len(v) for d,v in gap.items()}
out['levels']={f'L{k} vs L{k-1}':round(100*EXP[1 if True else 0]) for k in []}
lvw={}
for k in range(1,5):
    w=n=0
    for (a,b),(x,m) in pair.items():
        if lv[a]==k and lv[b]==k-1: w+=x; n+=m
    lvw[f'L{k} vs L{k-1}']=round(100*w/n)
out['levels']=lvw; out['exp']={str(d):round(100*v) for d,v in sorted(EXP.items())}
base=sum(elo[n] for n in names if lv[n]==0)/9
for n in names: out['stat'][n]['elo']=round(elo[n]); out['stat'][n]['dev']=round(elo[n]-(base+115*lv[n]))
# style: giant killer (vs higher levels, against the level-gap expectation), coin-flip, quick, grind; hard hitter vs own level average
lossLv=collections.defaultdict(list)
for r in duel:
    if r['win']: lossLv[lv[r['b'] if r['win']==r['a'] else r['a']]].append(1-r['keep'])
avgLossLv={k:sum(v)/len(v) for k,v in lossLv.items()}
for n in names:
    mine=[r for r in duel if n in (r['a'],r['b'])]
    upw=upe=upn=0
    for (a,b),(w,m) in pair.items():
        if a==n and lv[b]>lv[a]: upw+=w; upe+=EXP[lv[a]-lv[b]]*m; upn+=m
    blow=sum(1 for r in mine if r['win'] and r['keep']>=0.85)/len(mine); tm=sum(r['t'] for r in mine)/len(mine)
    lost=[r for r in mine if r['win'] and r['win']!=n]; hit=sum(1-r['keep'] for r in lost)/max(1,len(lost))
    s=out['stat'][n]; s.update(blow=round(100*blow),t=round(tm),hit=round(100*hit),hitLv=round(100*avgLossLv[lv[n]]))
    if upn: s['up']=[round(100*upw/upn),round(100*upe/upn),upn]
    if upn>=24 and upw/upn>=1.25*upe/upn and (upw-upe)/upn>=0.06: tag(n,'🗡️ Giant killer',f'beats higher-level robots {round(100*upw/upn)}% (a robot of its level: {round(100*upe/upn)}%)')
    elif blow>=0.5: tag(n,'🎲 Coin-flip brawler',f'{round(100*blow)}% of its fights are blowouts')
    elif tm<=40: tag(n,'⏱️ Quick finisher',f'fights last {round(tm)} s')
    elif tm>=70: tag(n,'🧱 Grinder',f'fights last {round(tm)} s')
    if len(lost)>=10 and hit-avgLossLv[lv[n]]>=0.045: tag(n,'🔨 Hard hitter',f'when it loses, the winner loses {round(100*hit)}% health (its level: {round(100*avgLossLv[lv[n]])}%)')
# counters (per matchup, shown in a duel)
cnt=[]
for (a,b),(w,m) in pair.items():
    e=EXP[lv[a]-lv[b]]; d=w/m-e
    if m>=12 and d>=0.25: cnt.append([a,b,round(100*w/m),round(100*e),m])
out['counters']=sorted(cnt,key=lambda x:-(x[2]-x[3]))
# free-for-all
ffa=load('ffa')
if ffa:
    rows=[]
    for f in ffa:
        s=[p[n] for n in f['p']]; t=sum(s)
        for i,n in enumerate(f['p']): rows.append((n,s[i]/t,(1/len(f['win']) if n in f['win'] else 0)))
    mx=sum(r[1] for r in rows)/len(rows); my=sum(r[2] for r in rows)/len(rows)
    b=sum((r[1]-mx)*(r[2]-my) for r in rows)/sum((r[1]-mx)**2 for r in rows); a0=my-b*mx; out['ffaFit']=[round(a0,2),round(b,2)]
    for n in names:
        m=[r for r in rows if r[0]==n]
        if len(m)<20: continue
        res=100*sum(r[2]-(a0+b*r[1]) for r in m)/len(m); out['stat'][n]['ffa']=[round(res),len(m)]
        if res>=10: tag(n,'🌀 Brawl master',f'+{round(res)} points in free-for-alls ({len(m)} fights)')
        if res<=-10: tag(n,'🌀 Lost in a melee',f'{round(res)} points in free-for-alls ({len(m)} fights)')
tv=load('tv')
if tv:
    for n in names:
        m=[f for f in tv if n in f['p'] and f['win'] is not None]
        if len(m)<20: continue
        res=0
        for f in m:
            i=f['p'].index(n); t=0 if i<2 else 1; A=f['p'][:2] if t==0 else f['p'][2:]; B=f['p'][2:] if t==0 else f['p'][:2]
            e=lambda x: sum(elo[k] for k in x)/2; pr=1/(1+10**((e(B)-e(A))/400)); res+=(1 if f['win']==t else 0)-pr
        res=100*res/len(m); out['stat'][n]['tv']=[round(res),len(m)]
        if res<=-10: tag(n,'🤝 Lone wolf',f'its 2v2 team wins {round(-res)} points less than the duel strengths say ({len(m)} fights)')
        if res>=10: tag(n,'🤝 Team player',f'its 2v2 team wins {round(res)} points more ({len(m)} fights)')
ar=load('arena')
if ar:
    AT={'saws':['🪚 Saw specialist','🪚 Hates saws'],'killbox':['☠️ Killbox natural','☠️ Hates the Killbox'],'cage':['🔒 Cage fighter','🔒 Hates the Cage'],'ice':['🧊 Ice skater','🧊 Slips on ice']}
    lg2=lambda x: math.log((x+0.5)/(1-x+0.5))
    for n in names:
        o=[r['win'] for r in ar if r['n']==n and r['ar']=='open']
        for k in AT:
            a=[r['win'] for r in ar if r['n']==n and r['ar']==k]
            if len(a)<6: continue
            wo=sum(o)/len(o); wa=sum(a)/len(a); f=0.5*(lg2(wa)-lg2(wo)); out['stat'][n].setdefault('ar',{})[k]=round(f,2)
            if abs(f)>=0.45: tag(n,AT[k][0] if f>0 else AT[k][1],f'{round(100*wa)}% there against {round(100*wo)}% on the open floor ({len(a)} fights)')
body=load('body')
if body:
    for n in names:
        m=[r for r in body if r['n']==n]
        if len(m)<16: continue
        f=sum(r['full'] for r in m)/len(m); bb=sum(r['bare'] for r in m)/len(m); c=lg(f)-lg(bb); out['stat'][n]['body']=[round(100*f),round(100*bb),round(c,2)]
        if c>=1.0: tag(n,'🩹 Needs its armour',f'with its armour gone it wins {round(100*bb)}% instead of {round(100*f)}% (shown when its Body is broken)')
        elif c<=0.0 and f>=0.15: tag(n,'🩹 Shrugs it off',f'with its armour gone it still wins {round(100*bb)}% ({round(100*f)}% with it) (shown when its Body is broken)')
json.dump(out,open(f'{D}/report.json','w'),indent=1)
print('levels',out['levels'],'exp by gap',out['exp'])
for n in sorted(names,key=lambda n:(-lv[n],-elo[n])): print(f"L{lv[n]} {n:12s} {out['stat'][n]['elo']:5d} dev {out['stat'][n]['dev']:+4d} |", ', '.join(t[0] for t in out['tags'][n]) or '-')
print('counters',len(out['counters']), out['counters'][:12])
