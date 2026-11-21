# UPGRADES design (M3), decided with the user on 2026-11-21

Status: **designed and approved, not built yet.** Build this next (M3).

## Decisions (made by the user)
- Upgrades last **this run only** (lost on death). Permanent boosts may come later via a separate shop (M6).
- Style: **mix** of simple stat boosts and flashy spell changes.
- Clearing a wave **heals 1 heart** (never above max hearts).
- Upgrade list approved as written below, no changes.
- Ghosts get **a bit tougher as waves go on** (see Ghost HP scaling), so upgrades stay meaningful.

## The upgrades (first batch of 8)
| id | Name | Effect | Max picks | Type |
|---|---|---|---|---|
| quickcast | Quick Cast | Fire interval -15% per pick | 5 | simple |
| power | Arcane Power | Bolt damage +1 per pick | 2 | simple |
| boots | Swift Boots | Move speed +12% per pick | 4 | simple |
| reach | Long Reach | Longer range and faster bolts per pick | 3 | simple |
| heart | Heart Crystal | +1 max heart and heal 1 | 3 | simple |
| twin | Twin Bolts | Each cast fires +1 extra bolt at another ghost | 3 | flashy |
| pierce | Piercing | Bolts pass through +1 more ghost | 3 | flashy |
| orbs | Orbiting Orbs | A glowing orb circles the mage and burns ghosts it touches; +1 orb per pick | 4 | flashy |

Second batch ideas (not now): Chain Lightning, Frost Slow, Soul Magnet, Shield.

## Flow
1. Wave cleared -> heal 1 heart -> game pauses and shows **3 random upgrade cards**.
2. Rules for the offer: no duplicate cards in one offer; a card that reached its max picks is not offered.
   If fewer than 3 upgrades remain available, show fewer cards.
3. Player taps one card -> upgrade applied -> **save** (includes the upgrade list) -> next wave starts.
4. Closing the game while cards are showing: Continue replays the wave that was just cleared and offers cards again
   (save happens on pick, not on clear. Kept simple on purpose).
5. Death erases the run and its upgrades.
6. Later (M8): a rewarded ad can reroll the 3 cards.

## Implementation notes
- Upgrades live in a data list (`src/upgrades.ts`): id, name, description, maxPicks, `apply(stats)`.
  Adding an upgrade = adding one entry. No new systems for simple stat upgrades.
- The scene keeps `stats` (fireInterval, damage, speed, range, boltSpeed, maxHp, extraBolts, pierce, orbs)
  computed from the picked list; recompute from the list on resume (the save stores picked ids in
  `RunSave.upgrades`, already present in `src/save.ts`).
- Card UI: a pause-like overlay with 3 tappable cards (name, one-line description, "level n/max").
  Uses the pausable game clock so everything freezes while choosing.
- Twin Bolts targets the next nearest ghost (or the same one with a small angle spread if only one ghost).
- Piercing: bolt keeps a `pierceLeft` counter; it must not hit the same ghost twice.
- Orbs: sprites rotating around the mage at a fixed radius; damage on contact with a short per-ghost cooldown.

## Ghost HP scaling (proposed by Claude, accepted as default, tune after playtest)
- Ghost HP = `2 + floor((wave - 1) / 3)`: waves 1-3 have 2 HP, waves 4-6 have 3, waves 7-9 have 4, wave 10 has 5.
- Reason: with Arcane Power (+1 damage) ghosts would die in one hit at all times; scaling keeps damage upgrades worth taking.
- Count per wave stays `3 + wave * 2`. Ghost speed stays fixed for now (faster enemies come as new types in M4).
- Watch while playtesting: if runs end too early, slow the HP growth; if too easy, speed it up. Constants live at the top of `GameScene.ts`.
