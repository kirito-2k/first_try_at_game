# START HERE (Claude: read this file first, and only this one, to resume)

Purpose: a tiny state file so a new chat can continue without re-reading the whole project.
Keep it under ~50 lines. Update the **State** block at the end of every work session.

## How to resume (token-saving rules)
1. Read this file. Do not read other files yet.
2. Ask the user what they want to do next (or follow **Next step** below).
3. Open other files only when the task needs them:
   - `PROJECT_NOTES.md`: concept, decisions, milestone log, bugs.
   - `src/scenes/*.ts`: only the scene being changed.
   - `agents/AGENT_TEMPLATE.md`: only when creating or using an agent.
4. Never re-explain the whole plan; the user already knows it.
5. Talk in plain, simple words. The user is a developer but new to web/game tooling.

## Who / how we work
- User = game director + playtester, handles accounts and legal steps, no PC (web + phone only).
- Claude = writes code and docs. Free plan: no browser/computer control, no scheduled tasks.
- Small milestones, each ending in something playable on the phone.

## Stack (fixed)
Phaser 3 + TypeScript + Vite. Deploys to GitHub Pages via `.github/workflows/deploy.yml`.
Later: Capacitor (Android), AdMob. Repo: `kirito-2k/first_try_at_game`, branch `main`.

## State (update this block)
- Last updated: 2026-11-21
- Game idea: Haunted Wood (lone mage, ghost waves, pick 1 upgrade per wave). See CONCEPT.md
- Live URL: https://kirito-2k.github.io/first_try_at_game/ (repo is public, Pages on)
- Milestone: M2.2 pushed (title screen, pause menu, save/continue per cleared wave)
- Waiting on: playtest of M2.2; user's choice for the hidden link host; upgrades discussion (M3)
- Known bugs: none reported yet

## Next step
After playtest feedback, build M3: upgrade choice after each wave (3 random cards, pick 1),
upgrades kept as a data list so new ones are one-line additions.

## File map
- `index.html`, `src/main.ts`: page and game setup
- `src/scenes/GameScene.ts`: the whole game so far (tuning constants at the top)
- `src/art.ts`: generates every texture in code (game size 720x1280)
- `src/scenes/MenuScene.ts`: title screen. `src/save.ts`: localStorage saves. `src/ui.ts`: buttons/text style
- `CONCEPT.md`: game design one-pager
- `.github/workflows/deploy.yml`: auto-publish to GitHub Pages
- `PROJECT_NOTES.md`: full notes. `agents/AGENT_TEMPLATE.md`: base for future agents.

## Commands the user may say
- "save progress": write a full handoff note now, and refresh the State block above.
- "continue": follow the resume rules at the top.
