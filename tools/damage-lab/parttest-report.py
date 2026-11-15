# node parttest.js output(s) -> each part in levels (all / L0-1 / L2-3 / L4). python3 parttest-report.py a.json b.json ...
import json,sys,math,collections
import os
lv=json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'lineup-tuned.json')))['lv']
J=sys.argv.index('--json') if '--json' in sys.argv else None
files=[f for i,f in enumerate(sys.argv[1:],1) if not f.startswith('--') and i!=(J or -9)+1]
rows=sum([json.load(open(f)) for f in files],[])
lg=lambda p: math.log(max(.02,min(.98,p))/(1-max(.02,min(.98,p)))); step=lg(0.64)
grp=lambda n:'L0-1' if lv[n]<=1 else 'L2-3' if lv[n]<=3 else 'L4'
W=collections.defaultdict(lambda:[0,0])
for n,k,o,w in rows:
    for g in ('all',grp(n)): x=W[(k,g)]; x[0]+=w; x[1]+=1
out={}
for k in sorted({r[1] for r in rows if r[1]}):
    out[k]={}
    for g in ('all','L0-1','L2-3','L4'):
        w,n=W[(k,g)]; b,bn=W[(None,g)]
        if n and bn: out[k][g]=round((lg(w/n)-lg(b/bn))/step,2)
    out[k]['win']=round(100*W[(k,'all')][0]/W[(k,'all')][1])
print('no part:',{g:round(100*W[(None,g)][0]/max(1,W[(None,g)][1])) for g in ('all','L0-1','L2-3','L4')})
for k,v in sorted(out.items(),key=lambda x:-x[1]['all']): print(f"{k:10s} win {v['win']}%  all {v['all']:+.2f}  L0-1 {v.get('L0-1',0):+.2f}  L2-3 {v.get('L2-3',0):+.2f}  L4 {v.get('L4',0):+.2f}")
if '--json' in sys.argv: json.dump(out,open(sys.argv[sys.argv.index('--json')+1],'w'))
