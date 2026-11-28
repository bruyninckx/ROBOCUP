(function(){
  var DATA = JSON.parse(document.getElementById('data').textContent);
  var S = JSON.parse(document.getElementById('state').textContent || '{}');
  S.v = S.v || {}; S.n = S.n || {}; S.all = S.all || ''; S.rev = S.rev || 0;
  var dirty = false, saving = false, art = null, bumped = false;
  var LS = 'robocus.flyoff.draft', SS = 'robocus.flyoff.scroll';
  try { var dr = JSON.parse(localStorage.getItem(LS) || 'null'); if (dr && dr.rev === S.rev) { S.v = dr.v || {}; S.n = dr.n || {}; S.all = dr.all || ''; dirty = true; } else localStorage.removeItem(LS); } catch (e) {}
  function draft(){ try { localStorage.setItem(LS, JSON.stringify({rev:S.rev, v:S.v, n:S.n, all:S.all})); } catch (e) {} }
  function h(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;'); }
  function votes(k, opts){
    return '<div class="votes" role="group" aria-label="Your vote">' + opts.map(function(o){
      return '<button type="button" data-k="'+k+'" data-v="'+o[0]+'" aria-pressed="'+(S.v[k]===o[0])+'">'+o[1]+'</button>'; }).join('') + '</div>';
  }
  var RV = [['build','Build it'],['maybe','Maybe'],['skip','Skip']], YV = [['yes','Yes'],['unsure','Not sure'],['no','No']];
  var html = '<div class="wrap"><header><div class="eyebrow">ROBOCUS · idea for a next version</div><h1>Parts that fly off</h1>'
    + '<p class="lede">Today a robot mostly gets dents and loses its weapon. The idea: <b>each robot loses its own special piece</b>, and what is underneath looks and fights differently. Here are the first 15.</p>'
    + '<p class="lede">The small picture is the robot as it is in the game now. The big drawing is a rough sketch of it <b>after the piece came off</b>. Vote on each one, write what you would change, and press <b>Save</b>.</p></header>'
    + '<h2>The 15 robots</h2><p class="sub">Build it = I want this. Maybe = nice idea, needs a change (say which). Skip = leave this robot as it is.</p><div class="grid">';
  DATA.robots.forEach(function(r){
    html += '<section class="card" id="c-'+r.k+'"><div class="top"><img src="'+r.img+'" alt="'+r.n+' as it is now" width="72" height="72"><div><div class="now">Now</div><div class="name">'+r.n+'</div><span class="kind">'+r.kind+'</span></div></div>'
      + '<div><div class="now aft">After the piece came off</div><div class="draw">'+r.svg+'</div></div>'
      + '<dl><div><dt>Comes off</dt><dd>'+h(r.off)+'</dd></div><div><dt>You see</dt><dd>'+h(r.shows)+'</dd></div><div><dt>In the fight</dt><dd>'+h(r.fight)+'</dd></div></dl>'
      + votes(r.k, RV) + '<textarea data-n="'+r.k+'" aria-label="Feedback on '+r.n+'" placeholder="What would you change for '+r.n+'?"></textarea></section>';
  });
  html += '</div><h2>Three rules for all of them</h2><p class="sub">These would hold for every robot, also the 18 that are not on this page yet.</p><div class="rules">';
  DATA.rules.forEach(function(r){
    html += '<section class="card rule" id="c-'+r.k+'"><h3>'+h(r.t)+'</h3><p>'+h(r.d)+'</p>'+votes(r.k, YV)+'<textarea data-n="'+r.k+'" aria-label="Feedback on this rule" placeholder="Anything to add?"></textarea></section>';
  });
  html += '</div><h2>Anything else</h2><p class="sub">Other robots you want first, pieces I missed, things you would hate to see.</p><div class="big"><textarea data-n="__all" aria-label="General feedback" placeholder="Write anything here."></textarea></div>'
    + '<div class="fallback" id="fb"><p class="sub">Saving did not work here. Copy this text and paste it in the chat with Claude instead:</p><textarea id="fbt" readonly aria-label="Your votes as text"></textarea></div></div>'
    + '<div class="bar"><div class="wrap"><div class="tally"><span id="tally"></span><span class="status" id="status" role="status"></span></div><button type="button" class="save" id="save">Save</button></div></div>';
  var root = document.getElementById('root'); root.innerHTML = html;
  Array.prototype.forEach.call(root.querySelectorAll('textarea[data-n]'), function(t){ var k = t.getAttribute('data-n'); t.value = k === '__all' ? S.all : (S.n[k] || ''); });

  function paint(){
    var c = {build:0, maybe:0, skip:0};
    DATA.robots.forEach(function(r){ var v = S.v[r.k]; if (v) c[v]++; var el = document.getElementById('c-'+r.k); el.className = 'card' + (v ? ' v-'+v : ''); });
    Array.prototype.forEach.call(root.querySelectorAll('.votes button'), function(b){ b.setAttribute('aria-pressed', String(S.v[b.getAttribute('data-k')] === b.getAttribute('data-v'))); });
    var left = DATA.robots.length - c.build - c.maybe - c.skip;
    document.getElementById('tally').innerHTML = '<b>'+c.build+'</b> build · <b>'+c.maybe+'</b> maybe · <b>'+c.skip+'</b> skip' + (left ? ' · '+left+' to go' : '');
    var st = document.getElementById('status');
    if (saving) st.textContent = 'Saving…';
    else if (dirty) st.textContent = 'Not saved yet: press Save';
    else st.textContent = S.at ? 'Saved ' + S.at : 'Nothing saved yet';
    document.getElementById('save').disabled = saving || !dirty;
  }
  function touch(){ dirty = true; draft(); paint(); }
  function asText(){
    var out = [];
    DATA.robots.concat(DATA.rules.map(function(r){ return {k:r.k, n:r.t}; })).forEach(function(r){ out.push(r.n + ': ' + (S.v[r.k] || '-') + (S.n[r.k] ? ' — ' + S.n[r.k] : '')); });
    if (S.all) out.push('Anything else: ' + S.all);
    return out.join('\n');
  }
  function doc(){
    var d = new Date(), p = function(n){ return (n < 10 ? '0' : '') + n; };
    S.rev = (S.rev || 0) + 1; bumped = true; S.at = p(d.getDate()) + '/' + p(d.getMonth()+1) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
    var st = JSON.stringify(S).replace(/</g, '\\u003c');
    var o = '<', sc = o + '/script>';
    var links = Array.prototype.map.call(document.head.querySelectorAll('link[rel=preconnect],link[rel=stylesheet]'), function(l){ return l.outerHTML; }).join('');
    return o+'!doctype html>'+o+'html lang="en">'+o+'head>'+o+'meta charset="utf-8">'+o+'meta name="viewport" content="width=device-width,initial-scale=1">'+o+'title>'+h(document.title)+o+'/title>'+links
      + o+'style id="css">'+document.getElementById('css').textContent+o+'/style>'+o+'/head>'+o+'body>'+o+'div id="root">'+o+'/div>'
      + o+'script id="state" type="application/json">'+st+sc + o+'script id="data" type="application/json">'+document.getElementById('data').textContent+sc
      + o+'script id="app">'+document.getElementById('app').textContent+sc + o+'/body>'+o+'/html>';
  }
  function fail(){
    saving = false; if (bumped) { S.rev -= 1; bumped = false; } draft(); paint();
    document.getElementById('status').textContent = 'Could not save here: see the box at the bottom';
    document.getElementById('fbt').value = asText(); document.getElementById('fb').className = 'fallback on';
  }
  function save(){
    if (saving || !dirty) return;
    saving = true; paint();
    try { sessionStorage.setItem(SS, String(window.scrollY)); } catch (e) {}
    var get = art ? Promise.resolve(art) : (window.claude && window.claude.use ? window.claude.use('artifact') : Promise.resolve(null));
    Promise.resolve(get).then(function(a){
      if (!a) return fail();
      art = a;
      return Promise.resolve(a.publish(doc())).then(function(res){
        if (res && res.ok === false) return fail();
        saving = false; dirty = false; paint();
      });
    }).catch(fail);
  }
  root.addEventListener('click', function(e){
    var b = e.target.closest ? e.target.closest('button') : null; if (!b) return;
    if (b.id === 'save') return save();
    var k = b.getAttribute('data-k'); if (!k) return;
    var v = b.getAttribute('data-v'); if (S.v[k] === v) delete S.v[k]; else S.v[k] = v;
    touch();
  });
  root.addEventListener('input', function(e){
    var t = e.target, k = t.getAttribute && t.getAttribute('data-n'); if (!k) return;
    if (k === '__all') S.all = t.value; else if (t.value) S.n[k] = t.value; else delete S.n[k];
    touch();
  });
  paint();
  try { var y = sessionStorage.getItem(SS); if (y !== null) { sessionStorage.removeItem(SS); window.scrollTo(0, +y); } } catch (e) {}
})();
