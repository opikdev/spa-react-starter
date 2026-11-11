# Agent guide

| Path | Purpose |
|---|---|
| [docs/architecture.md](docs/architecture.md) | How this project fits together |
| [docs/decisions/](docs/decisions/) | Why it's built this way |
| `.agents/skills/` | Step-by-step guides for recurring tasks |
| `.mcp.json` | MCP servers for this project |

## Commands

List the commands to set up, run, and test this project here, so agents don't have to guess.

## Rules

- Run `.agents/check.sh` before calling work done. The pre-commit hook and CI run it too.
- If the check blocks you, fix the cause. Never edit `.agents/check.sh`, `.githooks/`, or the harness workflow to get past it, and never use `--no-verify`. If the request can't be done without that, stop and ask.
- After cloning, run `git config core.hooksPath .githooks` once to turn on the hook.
- Keep this file a short map, and put detail in `docs/`.
- Fix any doc your change makes wrong, in the same change.
- Record significant decisions with the `record-decision` skill.
- Back important rules with a lint rule, hook, or CI check.
