# Doubt Shield tuning MC: does the shield make Lance strictly correct without
# wrecking fight length or Echo finisher rates?
import random

def fight(acc, cycle, shield_chance, shield_reduce=8, shield_break=20, strategy='spam', pool=16):
    hp, bhp = 60, int(160 * (1.10 ** min(cycle, 5)))
    bdmg, graze = 15 + min(cycle, 5), 6 + min(cycle, 2)
    coil_c = 0 if cycle == 0 else min(0.40, 0.25 + 0.02 * (cycle - 1))
    redeem = 10 + 2 * cycle
    ins = streak = 0; surge = False
    q = list(range(pool)); missed = set(); turns = 0
    shield = 0  # remaining shield turns
    while q and hp > 0 and bhp > 0 and turns < 400:
        turns += 1
        coiled = random.random() < coil_c
        if not coiled and shield == 0 and random.random() < shield_chance: shield = 4
        cur = q.pop(0)
        if random.random() < acc:
            streak += 1; ins = min(5, ins + 1)
            if streak >= 3: surge = True
            if cur in missed: missed.discard(cur); hp = min(60, hp + redeem)
            # tech choice
            if strategy == 'spam':
                use = 'strike' if ins >= 1 else 'focus'
            else:  # adaptive: lance the shield, strike otherwise, bank toward lance if shielded
                if shield and ins >= 3: use = 'lance'
                elif shield and ins < 3: use = 'focus'
                else: use = 'strike' if ins >= 1 else 'focus'
            if use in ('strike', 'lance'):
                dmg = (14 + 3 * streak) if use == 'strike' else (30 + 5 * streak)
                ins -= 1 if use == 'strike' else 3
                if surge: dmg *= 2; surge = False
                if shield:
                    if dmg >= shield_break: shield = 0  # shattered — full damage lands
                    else: dmg = max(1, dmg - shield_reduce)
                bhp -= dmg
            else:  # focus/graze
                full_guard = cycle >= 1 and ins >= 5
                if coiled: hp -= (graze + 1) // 2 if full_guard else graze * 2
                elif not full_guard: hp -= graze
        else:
            missed.add(cur); streak = 0; surge = False
            q.insert(min(2, len(q)), cur)
            hp -= bdmg
        if shield: shield -= 1
    return ('win' if bhp <= 0 else 'finisher' if not q and hp > 0 else 'loss', turns)

random.seed(7)
N = 4000
print(f"{'scenario':38} {'spam-win%':>9} {'spam-turns':>10} {'adapt-win%':>10} {'adapt-turns':>11} {'adapt-fin%':>10}")
for label, acc, cyc, sc in [
    ('base z6-8 85% sc=0.18', 0.85, 0, 0.18),
    ('base z6-8 95% sc=0.18', 0.95, 0, 0.18),
    ('echo1 85% sc=0.22', 0.85, 1, 0.22),
    ('echo1 95% sc=0.22', 0.95, 1, 0.22),
    ('echo3 90% sc=0.26', 0.90, 3, 0.26),
    ('echo1 95% NO SHIELD (control)', 0.95, 1, 0.0),
]:
    r_spam = [fight(acc, cyc, sc, strategy='spam') for _ in range(N)]
    r_ad = [fight(acc, cyc, sc, strategy='adaptive') for _ in range(N)]
    sw = sum(1 for o, _ in r_spam if o != 'loss') / N * 100
    st = sum(t for o, t in r_spam if o != 'loss') / max(1, sum(1 for o, _ in r_spam if o != 'loss'))
    aw = sum(1 for o, _ in r_ad if o != 'loss') / N * 100
    at = sum(t for o, t in r_ad if o != 'loss') / max(1, sum(1 for o, _ in r_ad if o != 'loss'))
    af = sum(1 for o, _ in r_ad if o == 'finisher') / N * 100
    print(f"{label:38} {sw:9.1f} {st:10.1f} {aw:10.1f} {at:11.1f} {af:10.1f}")
