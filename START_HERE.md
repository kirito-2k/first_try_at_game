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
- Last updated: 2026-11-20
- Game idea: NOT chosen yet
- Milestone: M1 skeleton pushed (moving square + touch joystick + Pages deploy)
- Waiting on: user enables Pages, playtests on phone, shares 1-2 game ideas
- Known bugs: none reported yet

## Next step
Get the game idea, write the concept into `PROJECT_NOTES.md`, then build M2
(enemy, attack, death, restart).

## File map
- `index.html`, `src/main.ts`: page and game setup
- `src/scenes/GameScene.ts`: current scene (square + joystick)
- `.github/workflows/deploy.yml`: auto-publish to GitHub Pages
- `PROJECT_NOTES.md`: full notes. `agents/AGENT_TEMPLATE.md`: base for future agents.

## Commands the user may say
- "save progress": write a full handoff note now, and refresh the State block above.
- "continue": follow the resume rules at the top.
