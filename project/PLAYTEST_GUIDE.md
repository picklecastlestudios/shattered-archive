# THE SHATTERED ARCHIVE — Playtesting Guide
*A Pickle Castle Game Studio production · Build v0.16.1*

Thank you for playtesting. You're helping us find the rough edges before launch. This guide works two ways: hand it to a friend as a friendly "here's how to help," or run it yourself as a pre-release QA pass. You don't need to do everything — even one session is valuable.

**Play here:** https://castlesauce-blip.github.io/shattered-archive/
Works on **desktop and iPhone** straight from that link. (On a phone, add it to your Home Screen for a cleaner, full-screen experience.)

---

## What we're actually testing

The game has three promises. Judge it against these, not against "is it bug-free":

1. **Is it fun?** Does "answer under pressure, spend Insight wisely" feel good? Do you *want* the next fight?
2. **Does it teach?** It's secretly a course on the Claude ecosystem. Did you learn things — and were they explained clearly and *correctly*?
3. **Does it respect you?** Failure should teach, never punish or confuse. Nothing should feel unfair or unreadable.

Plus the baseline: **is it stable and readable** on your device?

The single most useful thing you can tell us is a specific moment: *"At the third zone's boss, I had no idea what Doubt Shield meant and lost because of it."* That beats "the game is hard."

---

## Controls (quick reference)

**Touch:** tap or hold-and-drag to walk · tap people/objects/doors to interact · tap answer choices and menu buttons.

**Keyboard:** arrows or WASD to walk · **E** or **Space** to interact · number keys **1–8** to pick answers and techniques in combat · **arrows / Tab + Enter** to navigate menus · **Esc** returns to the map from a zone.

**The ⚙ gear (top-right corner, always there):** opens save + diagnostics tools. **⚙ Options** (from the title screen or map) opens Sound / Motion / Text Size settings.

---

## Session scripts

Pick any of these. Each takes 10–30 minutes. Note anything that made you stop, squint, sigh, or smile.

### Session 1 — First Contact *(best done by someone brand-new)*
Start a **New Game**, choose Castle or Pickles, and just play the first zone naturally: talk to the mentor, open the chest, break the seal, fight the first boss.
- Did the pop-up tips teach you how combat works *without* you having to guess or ask?
- Did you understand **Insight (◆)**, and the difference between Tome Strike / Insight Lance / Focus?
- Was the first fight winnable and satisfying? Where (if anywhere) were you confused?

### Session 2 — The Full Climb
Play toward clearing several zones (ideally all 8).
- **Pacing:** any stretch that dragged, or spiked in difficulty out of nowhere?
- **Questions:** were they clear, fair, and — importantly — *correct and current*? (See "Content accuracy" below.)
- Does it stay fun across a longer sitting, or wear thin? When?

### Session 3 — Combat Lab
Deliberately exercise the whole kit in one fight or a few:
- Use **Tome Strike, Insight Lance, Focus, and Clarity Mend** at least once each.
- Build a 3-streak to arm **Insight Surge**, then discharge it.
- **Focus** on purpose to feel the guard-drop graze; then answer a previously-missed question for the **redemption heal**.
- In zones 6–8, break through a **Doubt Shield** (small hits glance off — you need a heavy hit or the Lance).
- Beat a boss to **purify its technique**, then use that new technique in a later fight.
- Long shot: try to answer *every* question a boss can ask to trigger **TOTAL RECALL**.
- Did any technique feel useless, overpowered, or unexplained? Did the right tutorial fire the first time each thing came up?

### Session 4 — The Living Archive *(systems)*
- **Journal (✎, on the map):** miss a question in a fight, find it logged, then mend it — in battle or via the Journal's practice. Does the loop make sense?
- **Companions (♥, on the map):** after freeing a pet by beating its boss, equip it as your companion. Does it trot beside you in the halls, and step in when you **Delegate** in battle?
- **Echo Wanderers:** the drifting lavender wisps in cleared zones — commune with one for a practice duel. Useful? Fun?
- **The Celebration** (after all 8 zones) and **outfit unlocks** — do they land as a payoff?

### Session 5 — The Echo *(endgame / prestige)*
Restore the Archive, then begin an **Echo Cycle**.
- Meet **Doubt Coils** (telegraphed crits), **Full Guard** (Focus at max Insight), harder answer choices, and cross-zone questions.
- Is "harder" still *fun and fair*, or does it tip into frustrating? Is every threat clearly telegraphed before it hits you?

### Session 6 — Access For All *(accessibility)*
In **⚙ Options**, try each and then play a bit:
- **Motion: Reduced** — screen flashes/shakes should be gone, but you should still clearly tell when you're hit, when a boss coils, and when a shield goes up (via text, icons, and sound).
- **Text Size: Large** — everything readable, nothing clipped or overlapping?
- **Keyboard-only** — can you complete a whole fight and navigate every menu without a mouse/touch? (Tab/arrows to move focus, Enter to select, number keys in combat.)
- **Mute**, and a quick **color-blind sanity check**: can you tell right from wrong answers, and read shields/coils, *without relying on color alone*?

### Session 7 — Persistence *(save & resume)*
- Close the tab mid-run and reopen the link — did your progress survive?
- **⚙ → Copy save code** on one device, then **⚙ → Load save code** on another — did your run carry across?
- **New Game** — does it wipe cleanly and send you back through character select?

### Session 8 — Break It *(be a menace)*
- Mash taps/keys and answer as fast as possible — anything double-fire or freeze?
- Rotate your phone mid-fight; background the app and come back; resize the desktop window.
- Open the ⚙ panel in the middle of a fight.
- Watch for: freezes, doubled actions, lost progress, text running off-screen, or anything visually broken.

---

## Content accuracy (this one's special)

Because the game teaches real material, a *wrong or outdated* question is our worst kind of bug. If any question seems **incorrect, out of date, ambiguous, or has a debatable "right" answer**, flag it with:
- the **zone name**,
- the **question text** (or a screenshot), and
- **why** it seems off.

These reports are gold — send them even if everything else is perfect.

---

## How to report

### Severity — tag each finding
- **Blocker** — can't play / lost progress / crash.
- **Major** — a system is broken, unfair, or badly confusing.
- **Minor** — a small bug or rough edge that didn't stop you.
- **Polish** — a "feels off" / would-be-nicer note. (These matter too!)

### Getting a diagnostics dump (for any real bug)
The game keeps its own error log. To hand us a complete state snapshot:
1. Tap the **⚙ gear** (top-right corner).
2. Click **"Copy error log for Claude."**
3. The dump appears in the box (and is copied) — **paste it into your report.** It bundles the recent error log, a snapshot of your save, and the exact build/content versions, so we can reproduce precisely.

*Save issues specifically?* Use **"Copy save code"** in that same panel so we get your exact run.
*Game won't load at all?* You'll see a red **BOOT ERROR** screen — **screenshot it** and send that.

### Bug / feedback report template
Copy this block per finding:

```
Build: v0.16.1
Device / browser: (e.g., iPhone 14 / Safari, or Windows / Chrome)
Severity: Blocker / Major / Minor / Polish
What I was doing:
What I expected:
What actually happened:
Steps to reproduce (1, 2, 3…):
Diagnostics code (⚙ → Copy error log for Claude):
Screenshot / clip:
```

**Send reports to:** Reply directly in whatever thread, message, or channel sent you this guide — that's the fastest way back to us.

---

## Known issues & out of scope *(please don't re-report these)*

- **Black bars on phones (portrait):** the game is landscape, so a portrait phone letterboxes it. **Rotate to landscape** for a bigger picture — this is expected, not a bug.
- **Opening the `.html` file inside a chat/app preview shows a black screen.** Some in-app previews don't run the game's code. **Always use the live link** above.
- **After we push an update,** you may need to **hard-refresh / clear cache** to see it.
- **No screen-reader (ARIA) support** — a known limitation of the game's rendering engine; keyboard, reduced-motion, large-text, and color-safe cues are the accessibility paths we do support.
- **"Just spam Tome Strike"** works in the early zones by design; later zones and Echo Cycles add **Doubt Shields** specifically to reward the fuller kit. If it still feels too spammable late-game, though, *do* tell us.

---

## 5-minute smoke test *(fastest possible sanity pass)*
1. Open the link — studio splash → title, no errors.
2. New Game → pick a character → land in Zone 1.
3. Walk, talk to the mentor, open the chest.
4. Break the seal, answer one question right and one wrong (see the reteach), win or flee.
5. Open **⚙ Options**, toggle each setting once, and confirm the ⚙ gear's diagnostics panel opens.

If all five work, the build is healthy. Anything that doesn't → that's your first report. Thank you for helping restore the Archive. 🏰
