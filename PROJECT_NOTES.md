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
**Not chosen yet.** Needs 1-2 hook ideas from the user (a sentence or two each).
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

### M1: Playable skeleton (done, awaiting first playtest)
- Vite + Phaser 3 + TypeScript project.
- Green square moves with a touch joystick (appears where the finger lands) or arrows / WASD.
- GitHub Actions workflow deploys to GitHub Pages on every push to `main`.
- Not yet run by Claude (no network in its workspace): the first real build happens on GitHub.

## Next
1. User enables Pages (Settings > Pages > Source: GitHub Actions) and opens the link on the phone.
2. User reports whether the square moves smoothly with the touch joystick.
3. User shares 1-2 game ideas; Claude picks one and writes the concept section above.
4. M2: enemy, attack, death and restart for the chosen idea.

## Known bugs / open questions
- None yet (first build not tested).

## Working rules
- Small milestones, each ending in something playable.
- Update this file at the end of every milestone.
- When the user says "save progress", produce a full handoff note immediately.
