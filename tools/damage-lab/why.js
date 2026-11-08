const L=require('./engine.js');const c=JSON.parse(require('fs').readFileSync(process.argv[2]));Object.assign(L.TUNE,c.tune);const r=c.robots;
const [a,b]=process.argv.slice(3);const agg={};let wins=0,n=0;const ko={};
for (let seed=1001;seed<1013;seed++) for (const ar of ['open','pit']) {const S=L.run({a:Object.assign({name:a},r[a]),b:Object.assign({name:b},r[b]),seed,arena:ar});
n++;if(S.result.winner===0)wins++;const lo=S.robots[1-S.result.winner];const k=(S.robots[S.result.winner].name)+': '+(lo.ko||'time').replace(/ \(.*/,'');ko[k]=(ko[k]||0)+1;
S.robots.forEach(R=>{for(const[k,v]of Object.entries(R.stats.dealtBy)){agg[R.name+'.'+k]=(agg[R.name+'.'+k]||0)+v/24}});
S.robots.forEach(R=>{agg[R.name+'.aggr s']=(agg[R.name+'.aggr s']||0)+(R.stats.aggr||0)/24});}
console.log(a,'wins',wins+'/'+n);console.log(ko);console.log(Object.fromEntries(Object.entries(agg).map(([k,v])=>[k,Math.round(v)])));
