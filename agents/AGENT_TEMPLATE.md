# Agent template and roster

A base for defining agents (focused helpers, each with one job). Not active yet: on the free
Claude plan nothing runs automatically. For now an agent is a **role file**: paste it (or ask
Claude to read it) at the start of a chat and Claude acts in that role. Later, if we move to a
setup that can run agents, the same files can be reused (the header below follows the common
`name / description / tools` format).

## How to create a new agent
1. Copy the template block below into `agents/<agent-name>.md`.
2. Fill every field. Keep it short: one job, clear inputs and outputs.
3. Add a row to the roster table.
4. Test it on one small real task, then tighten the rules.

## Roster (planned from the user's idea)
| Agent | Job | Status |
|---|---|---|
| modeler | Designs the game model: rules, stats, enemies, items, balance numbers (data, not code) | planned |
| model-to-code | Turns the modeler's data/spec into config files and typed data structures | planned |
| coder | Writes and edits game code (scenes, systems, UI) from the spec | planned |
| monitor | Checks results: tracks bugs, scope creep, token/usage cost, and what is done vs next | planned |

Suggested order of work for one feature: modeler -> model-to-code -> coder -> monitor.
Early on, one Claude chat can play all four roles in turn; split them only when it helps.

## Template (copy from here)

```markdown
---
name: <agent-name>
description: <one sentence: when to use this agent>
tools: <what it may use, e.g. read files, write code; or "none" for pure planning>
---

# <Agent name>

## Role
<One or two sentences: what this agent is responsible for.>

## Goal
<What a good result looks like for this agent.>

## Inputs
- <What it receives, and from which file or agent>

## Outputs
- <What it produces, the file path, and the format>

## Rules and limits
- <What it must do every time>
- <What it must NOT do (e.g. not change files outside its job)>
- Keep the scope tiny: one feature or one milestone at a time.

## Definition of done
- <Checklist the agent verifies before handing back>

## Handoff
Hands result to: <next agent or the user>
Handoff note format: <what changed / what is left / open questions, max 10 lines>
```
