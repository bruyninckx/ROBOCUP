import json,glob,collections,math
import os; D=os.environ.get('OUT','tag-tuned'); LN=json.load(open(os.environ.get('LINEUP','lineup-tuned.json'))); lv=LN['lv']; R=json.load(open(f'{D}/report.json'))
ld=lambda sec: sum([json.load(open(f)) for f in sorted(glob.glob(f'{D}/{sec}_*.json'))],[])
NAME={'medic':'Medic drone','gunner':'Gun drone','laser':'Laser drone','booster':'Booster drone','waller':'Waller drone','bodyguard':'Bodyguard drone','spotter':'Spotter drone','jammer':'Jammer drone','blocker':'Blocker drone','shield':'Energy shield','emp':'EMP burst','mines':'Mine layer','popper':'Pop-up flipper','tow':'Tow cable','jam':'Sensor scrambler','overdrive':'Overdrive','repair':'Repair kit','weapon':'Weapon overhaul','hull':'Reinforced hull','powerkit':'Power kit','armourkit':'Armour kit','core':'Prototype core','hospital':'Field hospital','quantum':'Quantum shield','matador':'Matador chip','bait':'Wall Bait chip','pester':'Pester chip'}
tags=R['tags']; F={}
# counters: 12 first-run fights + 16 fresh; keep if both agree
pr=ld('pairs'); fresh=collections.defaultdict(list)
for r in pr: fresh[(r['a'],r['b'])].append(r['win'])
cnt=[]
for a,b,w,e,m in R['counters']:
    f=fresh.get((a,b))
    if not f: continue
    wf=sum(f)/len(f); wc=(w/100*m+sum(f))/(m+len(f))
    if wf-e/100>=0.15 and wc-e/100>=0.25: cnt.append({'a':a,'b':b,'first':w,'fresh':round(100*wf),'all':round(100*wc),'exp':e,'n':m+len(f)})
F['counters']=cnt
# fits
PS=json.load(open(f'{D}/parts-sum.json')); pa=PS['pa']
co=ld('confirm'); g=collections.defaultdict(lambda:[0,0,0])
for r in co: x=g[r['id']]; x[0]+=r['with']; x[1]+=r['without']; x[2]+=1
fits={}; epic={}
for id,(w,wo,n) in g.items():
    nm,k=id.split('|'); d=(w-wo)/n; first=PS['fit'][id]
    if (d-pa[k]>=0.15 and first>0): fits.setdefault(nm,{})[k]=[1,round(100*d)]
    if (d-pa[k]<=-0.15 and first<0): fits.setdefault(nm,{})[k]=[-1,round(100*d)]
    if d>=0.30 and d-pa[k]>=0.20 and first>0: epic[id]=[round(100*wo/n),round(100*w/n),n]
F['fits']=fits; F['epic']=epic; F['confirm']={id:[round(100*v[1]/v[2]),round(100*v[0]/v[2]),v[2],round(100*pa[id.split('|')[1]])] for id,v in g.items()}
# slayer
sl=ld('slayer'); h=collections.defaultdict(lambda:[0,0,0])
for r in sl: x=h[r['n']+'|'+'+'.join(r['parts'])]; x[0]+=r['with']; x[1]+=r['without']; x[2]+=1
F['slayer']={id:[round(100*v[1]/v[2]),round(100*v[0]/v[2]),v[2]] for id,v in sorted(h.items(),key=lambda x:-x[1][0]/x[1][2])}
# chips on light robots: level 0-1 vs level 2+ average chip gain (parts test, vs a level up)
gain=PS['gain']; ch=['matador','bait','pester']
for grp,cond in (('L0-1',lambda n:lv[n]<=1),('L2+',lambda n:lv[n]>=2)):
    v=[gain[f'{n}|{k}'] for n in lv if cond(n) for k in ch if f'{n}|{k}' in gain]; F.setdefault('chip',{})[grp]=round(100*sum(v)/len(v))
# body cost numbers (armour gone), shrunk half way to the default 0.8 for noise
F['bodyCost']={n:round(max(0,min(2,R['stat'][n]['body'][2])),1) for n in lv if 'body' in R['stat'][n]}
json.dump(F,open(f'{D}/final.json','w'),indent=1)
print('counters',len(cnt)); [print(' ',c) for c in cnt]
print('fits',fits); print('epic',epic); print('slayer',list(F['slayer'].items())[:8]); print('chip',F['chip'])
