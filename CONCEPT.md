# CONCEPT: Haunted Wood (working title)

## Hook
You are a lone mage in a haunted forest. Ghosts swarm you in waves. Your spells fire on their
own; you only move. After every wave you pick **one upgrade** from a few choices, and the build
you assemble decides how far you get.

## Why this fits a first game
- One input only (drag to move), so it feels good on a phone and is simple to build.
- Short runs, easy to replay: good for rewarded ads and a "just one more run" loop.
- Tiny scope: one character, a handful of enemy types, one forest, upgrades as data.

## Core loop (one run, target ~10 minutes)
1. A wave of ghosts spawns around the edges and chases the mage.
2. The mage auto-casts at the nearest ghost. The player kites and dodges by moving.
3. When the wave is cleared, three random upgrades are offered; pick one.
4. Waves get bigger and tougher. Every few waves: a stronger enemy or a boss.
5. Die (or beat the last wave): see wave reached, best wave, kills. Tap to start again.

## Player: the mage
- 5 HP, short invulnerability after being hit.
- Starting spell: a magic bolt that targets the nearest enemy in range.
- Moves with a floating touch joystick (keyboard on desktop).

## Enemies (plan: 3-5 types total)
| Enemy | Behaviour | Planned in |
|---|---|---|
| Ghost | Slowly chases the mage | M2 (done) |
| Fast wisp | Weak but quick | M4 |
| Brute | Slow, lots of HP | M4 |
| Spitter | Keeps distance, shoots | M5 |
| Boss | Wave 10 of the run | M5 |

## Upgrades (picked after each wave, all data-driven)
Examples to start with: faster fire rate, more damage, extra bolt, piercing bolts, bigger range,
move speed, +max HP, heal, orbiting orb, lightning chain. Rule: every upgrade is a small entry
in a data list, so adding one never needs new systems.

## Meta-progression (later, M6)
Spend "soul shards" earned each run on permanent small boosts or on unlocking new starting
spells. Saved on the device.

## Monetization hooks (later, M8)
- Rewarded ad: revive once per run.
- Rewarded ad: reroll the three upgrade choices.
- One-time purchase: remove ads (keeps the optional rewarded buttons).
- No ads in the middle of play.

## Look and sound
Start with plain shapes (done in M2) so we can judge the fun first. Then swap in a
free, commercially licensed pack (Kenney.nl, itch.io, OpenGameArt). Dark forest palette,
simple sound effects and one music loop at the end.

## Scope guard (not in the first release)
Multiplayer, many characters, story, online leaderboards, in-app currency shop,
procedural maps. Add only after launch if the game earns it.
