node test.js ${1:-open} 2>/dev/null > rr.txt
grep -o "wins by KO: [A-Za-z]* [a-z ]*\|Time" rr.txt | sed 's/wins by KO: [A-Za-z]* //' | sort | uniq -c | sort -rn
awk -F': ' '{print $2}' rr.txt | awk '{print $1+0}' | sort -n | awk '{a[NR]=$1}END{print "min",a[1],"q1",a[int(NR/4)],"median",a[int(NR/2)],"q3",a[int(NR*3/4)],"max",a[NR]}'
node -e "
const L=require('./engine.js');const n=Object.keys(L.PRESETS);const w={};n.forEach(x=>w[x]=0);
const lines=require('fs').readFileSync('rr.txt','utf8').trim().split('\n').filter(l=>l.includes(' v '));
for(const l of lines){const m=l.match(/^(\w+) v (\w+) s\d+: \d+s (?:Time! Judges pick (\w+)|(\w+) wins)/); if(m) w[m[3]||m[4]]++;}
console.log(JSON.stringify(w))"
