"""ROBOCUS economy / game-length simulation (rulebook draft v0.1, 5 Nov 2026).

Run: python tools/economy-sim.py [games]   (default 1000; prints rounds, minutes, fame sources)

Abstract model: fights are resolved with a win probability from robot strength
(logit of the sandbox duel win rate), everything else follows the rulebook.
Bots play simple, greedy-but-sensible policies. Output: rounds to win, minutes,
fame sources, events, tie-breaks.
"""
import json, math, random, statistics, sys, collections, os

# card data exported from the card table artifact (https://claude.ai/artifact/K9LYoL1ny8V4jQhBXd37nh)
D = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'economy-cards.json'), encoding='utf-8'))

def logit(p): p = min(max(p, 0.03), 0.97); return math.log(p / (1 - p))
def sig(x): return 1 / (1 + math.exp(-x))

# ---------------- market deck ----------------
def market_cards():
    cards = []
    for c in D['market']:
        cat = c['cat']
        lo = 2
        if c.get('c'):
            try: lo = int(str(c['c']).split('–')[0])
            except: lo = 2
        if cat.startswith('Robots'):
            win = c['win'] if c['win'] is not None else 40
            cards.append(dict(kind='robot', n=c['n'], str=logit(win / 100), val=c['v'] or 2))
        elif cat == 'Crew':
            cards.append(dict(kind='crew', n=c['n'], val=max(1, lo - 1), price=lo))
        elif cat == 'Legendary':
            cards.append(dict(kind='part', slot='legend', n=c['n'], gain=0.6, strain=int(c['s'] or 2), val=c['v'] or 4, price=lo))
        else:
            slot = {'Weapons': 'weapon', 'Armour': 'armour', 'Modules': 'module', 'Helpers': 'helper', 'Stat upgrades': 'stat'}[cat]
            gain = {'weapon': 0.25, 'armour': 0.3, 'module': 0.35, 'helper': 0.45, 'stat': 0.2}[slot]
            st = str(c['s'] or '0').replace('+', '')
            cards.append(dict(kind='part', slot=slot, n=c['n'], gain=gain, strain=int(st or 0), val=max(1, lo - 1), price=lo))
    return cards

SCRAP_BOT = logit(0.25)

# ---------------- intrigue deck ----------------
# effect kinds the bots understand; everything else is only cashed in
FX = {
 'Overtime Shift': ('cred_crew', 1), 'Smash and Grab': ('steal', 3), 'Crunch Week': ('cred', 2),
 'Scrapyard Salvage': ('cred', 3), 'Consulting Gig': ('cred_crew', 2), 'Industry Insider': ('draw', 2),
 'Scrap Deal': ('cred', 5), 'Joint Venture': ('jv', 7),
 'Fan Meet': ('fame_if_robots', (1, 2)), 'Roadshow': ('fame_if_robots', (2, 3)), 'Public Demo': ('fame_pay', (1, 3)),
 'Launch Party': ('fame_pay', (1, 6)), 'Team-Building Day': ('fame', 1), 'Underdog Story': ('underdog', 2),
 'Press Tour': ('fame', 1), 'Museum Donation': ('fame_discard', 1), 'Celebrity Endorsement': ('fame', 1),
 'Hype Reel': ('fan', 1), 'Prime-Time Interview': ('fame', 1), 'Viral Moment': ('fame', 1), 'Co-Branding Deal': ('fame', 1),
 'Bribe Scandal': ('smear_pay', (1, 3)), 'Inside Leak': ('smear', 1), 'Paparazzi': ('smear_pay', (1, 3)),
 'Rival Sponsor': ('smear', 1), 'Smear Campaign': ('smear', 2), 'Rigged Ratings': ('smear', 2),
 'Poached Mechanic': ('poach', 1), 'EMP the Garage': ('sab', 0.5), 'Sugar in the Tank': ('sab', 0.4),
 'Smudged Lens': ('sab', 0.4), 'Loose Bolts': ('dmg', 0.3), 'Rogue Firmware': ('sitout', 0.3), 'Tax Audit': ('tax', 5),
 'Coolant Leak': ('sitout', 0), 'Secret Upgrade': ('boost', 0.4), 'Overclock': ('boost', 0.5),
 'Grand Final': ('event_gf', 0), 'Tag Team Licence': ('event_tt', 0), 'Mirror': ('event_mirror', 0),
 'Grand Melee': ('event_melee', 0), 'Unleash the House Robot': ('event_house', 0),
 'Remote Trigger': ('live', 0.15), 'Pilot Waypoint': ('live', 0.1), 'Target Overclock': ('live', 0.2),
 'Field Engineer': ('live', 0.15), 'Oil Canister': ('live', 0.15), 'EMP Grenade': ('live', 0.2),
 'Security Bot': ('guard', 4), 'Paid Off': ('block', 0), 'Fall Guy': ('block', 0), 'Firewall': ('block', 0),
 'PR Spin': ('block', 0), "Sponsor's Lawyers": ('block', 0), 'Under the Radar': ('block', 0), 'Overreach': ('block', 0),
}

def intrigue_deck():
    deck = []
    for c in D['intrigue']:
        g = c['gate']
        gate = g if isinstance(g, int) else 0
        cash = c['cash'] if isinstance(c['cash'], int) else 1
        for _ in range(c['copies']):
            deck.append(dict(n=c['n'], gate=gate, cash=cash, fx=FX.get(c['n'], ('none', 0)), t=c['t']))
    return deck

def hand_limit(fame): return 4 if fame <= 4 else 5 if fame <= 8 else 6

# ---------------- teams ----------------
class Team:
    def __init__(s, i, rng):
        s.i = i; s.fame = 4; s.cred = 8; s.mech = 3; s.crew = []
        s.robots = [dict(str=SCRAP_BOT, dmg=0.0, fan=0, parts=[], quirk=False, name='Scrap Bot') for _ in range(2)]
        s.guards = 1; s.hand = []; s.src = collections.Counter(); s.boost = 0.0; s.sitout = None
        s.sponsor = rng.choice(['Aegis', 'Blackwire', 'Sovereign', 'Apex', 'Lucky', 'Vulture'])
        if s.sponsor == 'Sovereign': s.mech = 4
    def rstr(s, r):
        strain = sum(p['strain'] for p in r['parts'])
        return r['str'] + sum(p['gain'] for p in r['parts']) - 0.9 * r['dmg'] - 0.03 * strain
    def best(s, exclude=()):
        ok = [r for r in s.robots if r is not s.sitout and id(r) not in exclude]
        return max(ok, key=s.rstr) if ok else None
    def helpers(s): return sum(1 for r in s.robots for p in r['parts'] if p['slot'] == 'helper')

class Game:
    def __init__(s, seed, start_fame=4, win=12, cfg=None):
        s.rng = random.Random(seed); r = s.rng
        s.cfg = cfg or {}
        s.T = [Team(i, r) for i in range(4)]
        for t in s.T: t.fame = start_fame
        s.win = win
        s.ideck = intrigue_deck(); r.shuffle(s.ideck); s.idisc = []
        s.mdeck = market_cards(); r.shuffle(s.mdeck)
        s.host = r.randrange(4); s.round = 0
        s.events = 0; s.tiebreak = False; s.minutes = 0.0; s.log = collections.Counter()
        s.pending_events = []

    # --- helpers
    def draw(s, t, n):
        for _ in range(n):
            if not s.ideck:
                s.ideck, s.idisc = s.idisc, []; s.rng.shuffle(s.ideck)
                if not s.ideck: return
            t.hand.append(s.ideck.pop())
    def fame(s, t, d, why):
        old = t.fame; t.fame = max(1, min(12, t.fame + d)); t.src[why] += t.fame - old
    def leader(s, excl=None):
        cand = [t for t in s.T if t is not excl]
        return max(cand, key=lambda t: (t.fame, s.rng.random()))
    def check_win(s):
        top = [t for t in s.T if t.fame >= s.win]
        if not top: return None
        if len(top) == 1: return top[0]
        s.tiebreak = True
        while len(top) > 1:
            a, b = sorted(top, key=lambda t: sum(r['str'] for r in t.robots))[:2]
            ra, rb = a.best(), b.best()
            pa = sig(a.rstr(ra) - b.rstr(rb)) if ra and rb else (1.0 if ra else 0.0)
            loser = b if s.rng.random() < pa else a
            top.remove(loser)
            s.minutes += 2.5
        return top[0]

    def blocked(s, target, attacker):
        # Security Bots / blocking reactions held by the target
        r = s.rng
        for c in list(target.hand):
            if c['fx'][0] == 'block':
                target.hand.remove(c); s.idisc.append(c); return True
        while target.guards > 0:
            target.guards -= 1
            if r.random() < (0.5 if 'Security Chief' not in target.crew else 0.667): return True
        for c in list(target.hand):
            if c['fx'][0] == 'guard':
                target.hand.remove(c); s.idisc.append(c)
                if r.random() < (0.5 if 'Security Chief' not in target.crew else 0.667): return True
        return False

    def backing(s, t, gate, target):
        # other non-target teams back if the target is the leader (or a deal is made 40% of the time)
        need = gate - t.fame
        if need <= 0: return True
        fx = 2 if 'Fixer' in t.crew else 0
        need -= fx
        if need <= 0: return True
        got = 0
        for o in sorted(s.T, key=lambda o: -o.fame):
            if o is t or o is target: continue
            lead = s.leader()
            if (target is not None and target is lead and o is not lead) or s.rng.random() < s.cfg.get('p_back', 0.25):
                got += o.fame; s.minutes += 0.4
                if got >= need: return True
        return False

    # --- phases
    def upkeep(s):
        for t in s.T:
            t.sitout = None if t.sitout == 'next' else t.sitout
            # repairs: repair if damaged and affordable, keep 3 credits reserve
            for r in t.robots:
                if t.sponsor == 'Aegis': r['dmg'] = max(0, r['dmg'] - 0.2)
                while r['dmg'] > 0.05 and t.cred >= 4:
                    t.cred -= 1; r['dmg'] = max(0, r['dmg'] - (0.34 if 'Repair Tech' in t.crew else 0.17))  # 20 dmg of ~120 hp
            inc = t.mech
            bill = len(t.robots) + t.helpers() // 2
            if 'Accountant' in t.crew: bill -= max(0, len(t.robots) - 1)
            t.cred += inc - bill
            while t.cred < 0 and t.robots:
                weakest = min(t.robots, key=t.rstr); t.robots.remove(weakest); t.cred += 1; s.log['scrapped_unpaid'] += 1
            t.cred = int(max(t.cred, 0))
        s.minutes += s.cfg.get('t_upkeep', 0.5)

    def intrigue(s):
        r = s.rng
        for t in s.T: s.draw(t, 3 + (1 if t.sponsor == 'Blackwire' else 0))
        order = [(s.host + k) % 4 for k in range(4)]
        for ti in order:
            t = s.T[ti]
            s.minutes += s.cfg.get('t_turn', 0.6)
            played = 0
            for c in sorted(list(t.hand), key=lambda c: -c['gate']):
                if c not in t.hand: continue
                kind, v = c['fx']
                gate = max(0, c['gate'] - (2 if t.sponsor == 'Blackwire' else 0))
                lead = s.leader(excl=t)
                ok = None
                if kind == 'fame' and s.backing(t, gate, None): ok = lambda: s.fame(t, v, 'publicity')
                elif kind == 'fame_if_robots' and len([x for x in t.robots]) >= v[1] and gate <= t.fame: ok = lambda: s.fame(t, v[0], 'publicity')
                elif kind == 'fame_pay' and t.cred >= v[1] + 2 and gate <= t.fame:
                    def ok(v=v): t.cred -= v[1]; s.fame(t, v[0], 'publicity')
                elif kind == 'underdog' and min(s.T, key=lambda o: o.fame) is t and sorted(o.fame for o in s.T)[1] > t.fame: ok = lambda: s.fame(t, 2, 'publicity')
                elif kind == 'fame_discard' and gate <= t.fame and t.mech >= 4:
                    def ok(): t.mech -= 1; s.fame(t, 1, 'publicity')
                elif kind == 'fan' and gate <= t.fame:
                    def ok():
                        b = t.best();
                        if b: s.add_fan(t, b)
                elif kind in ('smear', 'smear_pay') and lead.fame >= t.fame and s.backing(t, gate, lead):
                    amt = v if kind == 'smear' else v[0]
                    if kind == 'smear_pay' and t.cred < v[1] + 1: continue
                    def ok(amt=amt, kind=kind, v=v, lead=lead):
                        if kind == 'smear_pay': t.cred -= v[1]; lead.cred += v[1]
                        if not s.blocked(lead, t): s.fame(lead, -amt, 'smeared')
                elif kind in ('cred', 'cred_crew') and gate <= t.fame:
                    amt = v if kind == 'cred' else v * (t.mech + len(t.crew))
                    def ok(amt=amt): t.cred += amt
                elif kind == 'steal' and gate <= t.fame:
                    rich = max((o for o in s.T if o is not t), key=lambda o: o.cred)
                    def ok(rich=rich):
                        if not s.blocked(rich, t):
                            g = min(3, rich.cred); rich.cred -= g; t.cred += g
                elif kind == 'tax' and gate <= t.fame:
                    def ok(lead=lead):
                        if not s.blocked(lead, t): lead.cred = max(0, lead.cred - 5)
                elif kind == 'poach' and gate <= t.fame and lead.mech > 1:
                    def ok(lead=lead):
                        if not s.blocked(lead, t): lead.mech -= 1
                elif kind in ('sab', 'dmg', 'sitout') and gate <= t.fame:
                    def ok(lead=lead, kind=kind, v=v):
                        if s.blocked(lead, t): return
                        b = lead.best()
                        if not b: return
                        if kind == 'sab': lead.boost -= v
                        elif kind == 'dmg': b['dmg'] = min(1, b['dmg'] + v)
                        else: lead.sitout = b; b['dmg'] = min(1, b['dmg'] + v)
                elif kind == 'boost' and gate <= t.fame:
                    def ok(v=v): t.boost += v
                elif kind == 'draw' and gate <= t.fame:
                    def ok(v=v): s.draw(t, v)
                elif kind == 'jv' and s.backing(t, gate, None):
                    def ok():
                        if s.rng.random() < 0.6: t.cred += 7
                elif kind.startswith('event') and gate <= t.fame and (kind != 'event_gf' or t.fame >= 10):
                    if kind in ('event_mirror', 'event_house') and s.host != t.i: continue
                    def ok(kind=kind): s.pending_events.append((kind, t))
                if ok is None: continue
                t.hand.remove(c); s.idisc.append(c); played += 1
                if kind in ('fame', 'fame_if_robots', 'fame_pay', 'underdog', 'fame_discard', 'jv') and s.cfg.get('opp_block', True):
                    others_max = max(o.fame for o in s.T if o is not t)
                    if t.fame >= others_max or t.fame >= 8:
                        stopper = None
                        for o in s.T:
                            if o is t: continue
                            blk = [x for x in o.hand if x['fx'][0] == 'block']
                            if blk and s.rng.random() < 0.8:
                                o.hand.remove(blk[0]); s.idisc.append(blk[0]); stopper = o; break
                        if stopper: s.log['opp_block'] += 1; s.minutes += 0.2; continue
                s.minutes += s.cfg.get('t_scheme', 0.35)
                ok()
                w = s.check_win()
                if w: return w
            # cash in: keep live/guard/block cards, cash the rest down to the hand limit or when broke
            lim = hand_limit(t.fame)
            keep_kinds = ('live', 'guard', 'block')
            cashable = sorted([c for c in t.hand if c['fx'][0] not in keep_kinds], key=lambda c: -c['cash'])
            while len(t.hand) > lim and cashable:
                c = cashable.pop(0); t.hand.remove(c); s.idisc.append(c); t.cred += c['cash']
            while len(t.hand) > lim:
                c = t.hand.pop(); s.idisc.append(c); t.cred += c['cash']
            # install guards from hand as garage assets (keep 1 in hand)
        return s.check_win()

    def add_fan(s, t, rob):
        rob['fan'] += 1
        need = 2 if t.sponsor == 'Apex' else 3
        if rob['fan'] == need: s.fame(t, 1, 'fan_favourite')

    def value_of(s, t, card):
        """credits a bot is willing to pay"""
        if card['kind'] == 'robot':
            worst = min(t.robots, key=t.rstr) if t.robots else None
            gain = card['str'] - (t.rstr(worst) if worst and len(t.robots) >= 3 else SCRAP_BOT - 0.4)
            return max(0, 2 + 2.2 * gain)
        if card['kind'] == 'crew':
            base = {'Mechanic': 4, 'Accountant': 3.5, 'Chief Engineer': 2.5, 'Repair Tech': 2.5, 'Hacker': 2, 'Market Analyst': 1.5, 'Fixer': 3, 'Security Chief': 2}
            return base.get(card['n'], 2) if card['n'] not in t.crew or card['n'] == 'Mechanic' else 1
        return card['gain'] * 9 + (2 if card['slot'] == 'legend' else 0)

    def market(s):
        r = s.rng
        s.minutes += s.cfg.get('t_open', 1.0)
        lots = [s.mdeck.pop() for _ in range(4) if s.mdeck]
        for card in lots:
            bids = {}
            for t in s.T:
                v = s.value_of(t, card) * r.uniform(0.6, 1.2)
                reserve = 3
                bids[t.i] = int(max(0, min(t.cred - reserve, v)))
            s.minutes += s.cfg.get('t_lot', 0.4)
            mx = max(bids.values())
            if mx == 0: s.log['failed_lot'] += 1; continue
            tied = [i for i, b in bids.items() if b == mx]
            if len(tied) > 1:
                s.log['rebid'] += 1; s.minutes += s.cfg.get('t_rebid', 0.3)
                if any(s.T[i].sponsor == 'Sovereign' for i in tied):
                    tied = [i for i in tied if s.T[i].sponsor == 'Sovereign'][:1]
                else:
                    adds = {i: (r.randint(0, max(0, s.T[i].cred - mx - 2)) if s.T[i].cred - mx > 2 else 0) for i in tied}
                    m2 = max(adds.values())
                    tied2 = [i for i in tied if adds[i] == m2]
                    if len(tied2) > 1: tied2 = [min(tied2, key=lambda i: s.T[i].fame)]
                    mx += m2; tied = tied2
            w = s.T[tied[0]]
            w.cred -= mx
            s.give(w, card)
        # host bid
        hb = {}
        for t in s.T:
            v = 1.6 + (1.5 if t.best() and t.rstr(t.best()) > 0 else 0) + (1 if t.fame >= 9 else 0)
            hb[t.i] = int(max(0, min(t.cred - 2, v * r.uniform(0.5, 1.3))))
        mx = max(hb.values())
        s.minutes += s.cfg.get('t_lot', 0.4)
        if mx == 0: s.host = r.randrange(4)
        else:
            tied = [i for i, b in hb.items() if b == mx]
            s.host = r.choice(tied); s.T[s.host].cred -= mx
        # robot-count wager: the host asks for more robots when it has the deeper garage
        h = s.T[s.host]
        others_depth = statistics.mean(len(o.robots) for o in s.T if o is not h)
        s.count = 1
        if len(h.robots) >= 3 and len(h.robots) > others_depth and r.random() < s.cfg.get('p_wager', 0.35): s.count = 2
        return s.check_win()

    def give(s, t, card):
        if card['kind'] == 'robot':
            t.robots.append(dict(str=card['str'], dmg=0.0, fan=0, parts=[], quirk=True, name=card['n'], val=card['val']))
            if len(t.robots) > 3:
                worst = min(t.robots, key=t.rstr); t.robots.remove(worst); t.cred += 1
        elif card['kind'] == 'crew':
            if card['n'] == 'Mechanic': t.mech += 1
            else: t.crew.append(card['n'])
        else:
            rob = t.best()
            if not rob: return
            slot = card['slot']
            same = [p for p in rob['parts'] if p['slot'] == slot]
            if slot == 'helper' and len(same) >= 3: rob = min(t.robots, key=lambda x: len(x['parts']))
            elif slot not in ('helper', 'stat') and same: rob['parts'].remove(same[0])
            rob['parts'].append(card)

    def arena(s):
        r = s.rng
        h = s.T[s.host]
        s.fame(h, 1, 'host')
        evs = [e for e in s.pending_events]; s.pending_events = []
        kinds = [k for k, _ in evs]
        is_event = s.count > 1 or bool(kinds)
        if is_event: s.events += 1
        double = 'event_gf' in kinds
        teamfight = s.count > 1 or 'event_tt' in kinds or 'event_gf' in kinds or 'event_melee' in kinds
        if 'event_melee' in kinds: s.fame(h, 1, 'host')
        s.minutes += s.cfg.get('t_invite', 0.7)
        # invitations: host invites itself if it has a decent robot, else the strongest teams
        cands = sorted(s.T, key=lambda t: -(t.rstr(t.best()) if t.best() else -9))
        sides = []
        invited = [h] if h.best() and h.rstr(h.best()) > SCRAP_BOT else []
        for t in cands:
            if len(invited) >= 2: break
            if t in invited or not t.best(): continue
            # decline if hopeless and fame isn't the problem
            if invited and t.best() and invited[0].best():
                p = sig(t.rstr(t.best()) - invited[0].rstr(invited[0].best()))
                if p < 0.15 and t.fame > 2 and r.random() < 0.7:
                    s.fame(t, -1, 'declined'); continue
            invited.append(t)
        if len(invited) < 2:
            s.log['no_fight'] += 1; return s.check_win()
        a, b = invited[:2]
        for t in (a, b):
            ro = t.best(); t.cred += 2 + 2 * min(ro['fan'], 3) + (2 if ro['fan'] >= 3 else 0)
        if teamfight:
            # 2v2: pair with the two other teams (or second robots)
            others = [t for t in s.T if t not in (a, b)]
            sideA = [(a, a.best())] + ([(others[0], others[0].best())] if 'event_tt' in kinds or 'event_gf' in kinds else [(a, a.best(exclude={id(a.best())}))])
            sideB = [(b, b.best())] + ([(others[1], others[1].best())] if 'event_tt' in kinds or 'event_gf' in kinds else [(b, b.best(exclude={id(b.best())}))])
            sideA = [(t, x) for t, x in sideA if x]; sideB = [(t, x) for t, x in sideB if x]
        else:
            sideA = [(a, a.best())]; sideB = [(b, b.best())]
        def sstr(side):
            if not side: return -9
            v = [t.rstr(x) + t.boost for t, x in side]
            return max(v) + 0.6 * (len(v) - 1) + 0.15 * (sum(v) - max(v))
        # live cards: each player may play one
        live = 0
        for t in s.T:
            for c in t.hand:
                if c['fx'][0] == 'live':
                    t.hand.remove(c); s.idisc.append(c)
                    mine = any(t is x for x, _ in sideA)
                    live += c['fx'][1] if mine else (-c['fx'][1] if any(t is x for x, _ in sideB) else r.choice([1, -1]) * c['fx'][1])
                    break
        pA = sig(sstr(sideA) - sstr(sideB) + live)
        # bets: everyone bets on the side the bookie favours more often
        for t in s.T:
            stake = min(2, t.cred // 4)
            if stake <= 0: continue
            pick_A = r.random() < pA
            band_p = pA if pick_A else 1 - pA
            mult = 3 if band_p < .25 else 2 if band_p < .42 else 1 if band_p < .58 else .5 if band_p < .75 else 1 / 3
            wonA = None
            t._bet = (pick_A, stake, mult)
        winA = r.random() < pA
        s.minutes += s.cfg.get('t_bets', 0.6) + s.cfg.get('t_fight', 0.6) + s.cfg.get('t_after', 0.6)
        for t in s.T:
            if hasattr(t, '_bet'):
                pick_A, stake, mult = t._bet; del t._bet
                if pick_A == winA: t.cred += int(round(stake * mult))
                else: t.cred -= stake
        win_side, lose_side = (sideA, sideB) if winA else (sideB, sideA)
        got = set()
        for t, x in win_side:
            if t.i in got: continue
            got.add(t.i)
            s.fame(t, 2 if double else 1, 'fight_win')
            s.add_fan(t, x)
            x['dmg'] = min(1, x['dmg'] + r.uniform(0.1, 0.6))
        for t, x in lose_side:
            x['dmg'] = 0.5
            # host decides: scrap the leader's robot if it has no fans, else spare
            lead = s.leader()
            if t is lead and t is not h and x['fan'] == 0 and len(t.robots) > 1 and r.random() < 0.5:
                t.robots.remove(x); s.log['scrapped'] += 1
                if h.sponsor == 'Vulture': h.cred += 2
            else:
                # Scrap Crate
                if r.random() < 0.6: x['str'] += 0.15
                else: x['dmg'] = max(0, x['dmg'] - 0.25)
        for t in s.T: t.boost = 0.0
        return s.check_win()

    def play(s, max_rounds=40):
        while s.round < max_rounds:
            s.round += 1
            s.upkeep()
            w = s.intrigue() or s.market() or s.arena()
            if w: return w
        return None

def run(n=2000, **kw):
    rounds, mins, events, tb, src = [], [], [], 0, collections.Counter()
    lead5 = 0; lead5n = 0; spread = []
    for seed in range(n):
        g = Game(seed, **kw)
        # track leader after round 5
        w = None; leader5 = None
        while g.round < 40:
            g.round += 1; g.upkeep()
            w = g.intrigue() or g.market() or g.arena()
            if g.round == 5: leader5 = max(g.T, key=lambda t: t.fame)
            if w: break
        if not w: continue
        rounds.append(g.round); mins.append(g.minutes); events.append(g.events); tb += g.tiebreak
        for t in g.T: src.update(t.src)
        if leader5 is not None and g.round > 5: lead5n += 1; lead5 += (leader5 is w)
        spread.append(sorted((t.fame for t in g.T), reverse=True))
    q = statistics.quantiles(rounds, n=10)
    return dict(n=len(rounds), rounds_med=statistics.median(rounds), rounds_p10=q[0], rounds_p90=q[-1],
                mins_med=statistics.median(mins), mins_p10=statistics.quantiles(mins, n=10)[0], mins_p90=statistics.quantiles(mins, n=10)[-1],
                events_per_game=statistics.mean(events), events_per_round=sum(events) / sum(rounds), tiebreak=tb / len(rounds),
                leader5_wins=lead5 / max(1, lead5n), src=dict(src), runner_up=statistics.mean(s[1] for s in spread),
                last=statistics.mean(s[3] for s in spread), hist=collections.Counter(rounds))

if __name__ == '__main__':
    out = run(int(sys.argv[1]) if len(sys.argv) > 1 else 1000)
    print(json.dumps({k: v for k, v in out.items() if k != 'hist'}, indent=1))
    print(sorted(out['hist'].items()))
