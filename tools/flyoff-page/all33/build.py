import json
a=open('app.js').read()
def rp(x,y):
    global a
    assert a.count(x)==1,(a.count(x),x); a=a.replace(x,y)
rp("var LS = 'robocus.flyoff.draft', SS = 'robocus.flyoff.scroll';","var LS = 'robocus.flyoff33.draft', SS = 'robocus.flyoff33.scroll';")
rp("var RV = [['build','Build it'],['maybe','Maybe'],['skip','Skip']], YV = [['yes','Yes'],['unsure','Not sure'],['no','No']];","var RV = [['build','Keep'],['maybe','Change'],['skip','Drop']];")
i=a.index("  var html = '<div class=\"wrap\"><header>"); j=a.index("  DATA.robots.forEach(function(r){")
a=a[:i]+'''  var html = '<div class="wrap"><header><div class="eyebrow">ROBOCUS \\u00b7 next generation \\u00b7 test phase</div><h1>Parts that fly off: all 33</h1>'
    + '<p class="lede">Every robot now loses <b>its own piece</b> in the next-gen copy. These are the real pictures from the fight engine: on the left the robot as it comes, on the right <b>without its piece</b>.</p>'
    + '<p class="lede">Vote on each one, write what you would change, and press <b>Save</b>. To watch one fight, run play-nextgen and pick the robot in the lab.</p></header>'
    + '<h2>The 33 robots</h2><p class="sub">Keep = good as it is. Change = right idea, needs a change (say which). Drop = give this robot a different piece.</p><div class="grid">';
'''+a[j:]
i=a.index("    html += '<section class=\"card\" id=\"c-'+r.k+'\">"); j=a.index("      + votes(r.k, RV)")
a=a[:i]+'''    html += '<section class="card" id="c-'+r.k+'"><div class="name">'+r.n+'</div>'
      + '<div class="pair"><figure><img src="'+r.a+'" alt="'+r.n+' as it comes" width="220" height="220"><figcaption>As it comes</figcaption></figure><figure><img src="'+r.b+'" alt="'+r.n+' without its piece" width="220" height="220"><figcaption>Without the piece</figcaption></figure></div>'
      + '<dl><div><dt>Comes off</dt><dd>'+h(r.off)+'</dd></div><div><dt>You see</dt><dd>'+h(r.shows)+'</dd></div><div><dt>In the fight</dt><dd>'+h(r.fight)+'</dd></div></dl>'
      + '<p class="nums">Comes off in <b>'+r.pct+'</b> of 100 fights \\u00b7 wins of 100: <b>'+r.w0+'</b> today \\u2192 <b>'+r.w1+'</b> next gen <span>('+r.nf+' test fights each)</span></p>'
'''+a[j:]
rp("votes(r.k, YV)","votes(r.k, r.o)")
rp("Three rules for all of them","Three questions for all of them")
rp("These would hold for every robot, also the 18 that are not on this page yet.","These set the direction for the next round of tuning.")
rp("Feedback on this rule","Feedback on this question")
rp("Other robots you want first, pieces I missed, things you would hate to see.","Favourites, pieces that feel wrong, things you would hate to see.")
rp("</b> build ","</b> keep ")
rp("</b> maybe ","</b> change ")
rp("</b> skip'","</b> drop'")
open('app.js','w').write(a)
c=open('page.css').read()+'''.pair{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.pair figure{margin:0}
.pair img{display:block;width:100%;height:auto;border:2px solid var(--ink);border-radius:6px;background:#E4DCCB}
.pair figcaption{font:600 11px/1 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--mute);margin-top:6px}
.card .name{margin:0}
.nums{margin:0;font:500 13px/1.4 var(--mono);color:var(--mute);border-top:1.5px dashed var(--rule);padding-top:10px}
.nums b{color:var(--ink)}.nums span{white-space:nowrap}
.votes button[data-v=more][aria-pressed=true],.votes button[data-v=keep][aria-pressed=true]{background:var(--go)}
.votes button[data-v=fine][aria-pressed=true]{background:var(--steel)}
.votes button[data-v=less][aria-pressed=true],.votes button[data-v=drop][aria-pressed=true]{background:var(--ink)}
.rule .votes button{font-size:14px;padding:11px 2px}
'''
open('page.css','w').write(c)
assert '</script' not in a and '</style' not in c
HEAD=('<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ROBOCUS: parts that fly off, all 33</title>'
 '<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;800&family=IBM+Plex+Mono:wght@500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet">')
html=('<!doctype html><html lang="en"><head>'+HEAD+'<style id="css">'+c+'</style></head><body><div id="root"></div>'
 '<script id="state" type="application/json">{}</script><script id="data" type="application/json">'+open('data.json').read()+'</script><script id="app">'+a+'</script></body></html>')
open('index.html','w').write(html); print(len(html))
