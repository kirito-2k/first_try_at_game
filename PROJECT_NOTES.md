# PROJECT NOTES

Full project log. Updated at the end of every milestone and committed with the code.
For a quick resume, read `START_HERE.md` first; open this file only when you need detail.

## Goal
Small roguelike mobile game, published on Google Play, aiming for passive income
(rewarded ads + one-time "remove ads" purchase). First game = learning project, tiny scope.

## People and roles
- **User**: embedded developer, avid gamer. Game director and playtester. Handles accounts,
  builds and legal steps. No good PC: everything is done on the web, playtested on a phone browser.
- **Claude**: writes code and docs. Free Claude plan: no browser control, no computer control,
  no scheduled tasks. Claude can push to this repo when GitHub access is granted in the session.

## Concept
**Haunted Wood** (working title): a lone mage in a haunted forest, ghosts swarm in waves,
the mage auto-casts, the player only moves, and picks one upgrade after each wave.
Full details in `CONCEPT.md`.
Scope target: one character, 3-5 enemies, one theme, ~10 minute runs.

## Tech decisions
| Area | Decision |
|---|---|
| Engine | Phaser 3 (TypeScript), built with Vite |
| Dev environment | GitHub web / Codespaces / StackBlitz (no local PC needed) |
| Playtesting | GitHub Pages link, opened on the phone browser |
| Android packaging | Capacitor, signed .aab built by GitHub Actions (later) |
| Monetization | AdMob rewarded ads + one-time remove-ads purchase (later) |
| Assets | Free / commercial-licensed packs: Kenney.nl, itch.io, OpenGameArt |

Live game URL (after Pages is enabled): `https://kirito-2k.github.io/first_try_at_game/`

## Play Store notes
- $25 one-time developer fee.
- New personal accounts (created after Nov 13, 2023) need a closed test with 12+ testers
  opted in continuously for 14 days before applying for production. Recruit 15-25 testers early.
- Privacy policy required (host on GitHub Pages).

## Roadmap
0. Decide idea and scope
1. Browser prototype: move, fight, die, restart, touch controls  *(M1 below is the first slice)*
2. Full loop: room generation, upgrades, meta-progression, saves, menus, sound
3. Package for Android (Capacitor + GitHub Actions), add AdMob
4. Closed test (14 days), then production access
5. Post-launch updates and marketing

Estimate: 3-4 months.

## Milestone log

### M1: Playable skeleton (done, playtested)
- Vite + Phaser 3 + TypeScript project, touch joystick, GitHub Pages deploy.
- Playtest result (user, phone): works, movement "a bit slow" -> speed raised 160 -> 210 in M2.
- Repo had to be made public (free GitHub plan only allows Pages on public repos).

### M2: Mage vs ghosts (built, awaiting playtest)
- Blue square mage auto-fires a bolt at the nearest ghost in range.
- Ghost squares chase the mage. Wave 1 = 5 ghosts, +2 per wave.
- 5 HP, short invulnerability after a hit, screen shake, hearts in the HUD.
- Wave cleared banner, short break, next wave.
- Death screen (wave, kills, best wave saved in localStorage), tap or Space to restart.
- All tuning numbers are constants at the top of `src/scenes/GameScene.ts`.

### M2.1: Visual polish (built, awaiting playtest)
- Requested by user: joystick more transparent, better quality for every component.
- Game size raised to 720x1280 (sharper on phones). Tuning numbers doubled to match.
- `src/art.ts`: all art is generated in code (canvas), no downloaded assets yet:
  forest background with trees, mage, ghost, glowing bolt, hearts, fog, vignette, shadows.
- Particles (bolt trail, hit/kill bursts), ghost wobble, mage bob and lean, white hit flash.
- HUD: heart icons, wave and kills text. Animated wave banners. Death panel with NEW BEST.
- Joystick is nearly invisible: change JOY_BASE_ALPHA / JOY_LINE_ALPHA / JOY_KNOB_ALPHA.
- Generated art is a stand-in: swap for a licensed pack (Kenney etc.) near release.

## Next
1. User playtests M2.1 on the phone: is it too easy/hard, does auto-fire feel right, is it fun?
2. M3: upgrade choice after each wave (3 random cards, pick 1), upgrades as a data list.
3. M4: more enemy types (wisp, brute). M5: spitter + boss. M6: meta-progression and saves.

## Known bugs / open questions
- None reported yet for M2.

## Working rules
- Small milestones, each ending in something playable.
- Update this file at the end of every milestone.
- When the user says "save progress", produce a full handoff note immediately.
