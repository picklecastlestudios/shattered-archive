import random, math

def run_fight(p_acc, cycle, policy, cfg, trials=4000, seed=7):
    rng = random.Random(seed)
    wins = deaths = exhausted = 0
    qs_used_total = 0
    for _ in range(trials):
        boss_max = round(cfg['bossHP0'] * (cfg['hpGrowth'] ** min(cycle, cfg.get('hpCapCycle', 99))))
        boss = boss_max
        bdmg  = cfg['bossDmg0'] + cfg['dmgPer'] * min(cycle, cfg.get('dmgCap', 99))
        graze = cfg['graze0']  + cfg['grazePer'] * min(cycle, cfg.get('grazeCap', 99))
        heal  = cfg['heal0']   + cfg.get('healPer', 0) * cycle
        hp, streak, surge, ins = 60, 0, False, 0
        pool = list(range(18)); missed = set(); seen_missed = set()
        queue = pool[:]; qs = 0
        result = None
        while True:
            if not queue:
                result = 'exhausted'; break
            q = queue.pop(0); qs += 1
            p = min(0.97, p_acc + 0.15) if q in seen_missed else p_acc
            if rng.random() < p:
                streak += 1; ins = min(5, ins + 1)
                if streak >= 3: surge = True
                if q in missed:
                    missed.discard(q); hp = min(60, hp + heal)
                # policy
                if policy == 'strike':
                    tech = 'strike'
                else:  # tactical
                    if ins >= 3: tech = 'lance'
                    elif hp > graze + bdmg + 5: tech = 'focus'
                    else: tech = 'strike'
                if tech == 'strike':
                    ins -= 1; d = 14 + 3 * streak
                elif tech == 'lance':
                    ins -= 3; d = 30 + 5 * streak
                else:
                    d = 0; hp -= graze
                    if hp <= 0: result = 'death'; break
                if d and surge: d *= 2; surge = False
                boss -= d
                if boss <= 0: result = 'win'; break
            else:
                missed.add(q); seen_missed.add(q)
                streak = 0; surge = False
                queue.insert(min(2, len(queue)), q)
                hp -= bdmg
                if hp <= 0: result = 'death'; break
        if result == 'win': wins += 1
        elif result == 'death': deaths += 1
        else: exhausted += 1
        qs_used_total += qs
    return wins/trials, exhausted/trials, qs_used_total/trials

CURRENT = dict(bossHP0=160, hpGrowth=1.15, bossDmg0=15, dmgPer=2, graze0=6, grazePer=1, heal0=10)
TUNED   = dict(bossHP0=160, hpGrowth=1.10, hpCapCycle=5, bossDmg0=15, dmgPer=1, dmgCap=5,
               graze0=6, grazePer=0.5, grazeCap=8, heal0=10, healPer=2)
# grazePer 0.5 -> +1 every 2 cycles: implement via int()
def fix(cfg, cycle):
    c = dict(cfg); return c

for name, cfg in [('CURRENT', CURRENT), ('TUNED', TUNED)]:
    print(f"\n=== {name}: winrate% (tactical | strike-only), exhaust% tactical, avg questions ===")
    print("acc\\cyc " + "".join(f"{c:>16}" for c in range(7)))
    for acc in (0.7, 0.8, 0.9, 0.95):
        row = f"{acc:.2f}   "
        for cyc in range(7):
            cfg2 = dict(cfg)
            if name == 'TUNED':
                cfg2['grazePer'] = 1; cfg2['grazeCap'] = 2  # +1 per cycle but capped at +2 total
                cyc_g = min(cyc, 2)
            w1, ex, qn = run_fight(acc, cyc, 'tactical', cfg2)
            w2, _, _  = run_fight(acc, cyc, 'strike', cfg2)
            row += f"  {w1*100:3.0f}|{w2*100:3.0f} e{ex*100:2.0f} q{qn:4.1f}"
        print(row)
