---
paths:
  - ".claude/skills/**"
  - ".agents/**"
  - "skills-lock.json"
  - "scripts/check-skills-symlinks.mjs"
---

## Skill wiring

Vendored skills live in `.agents/skills/` (tracked in `skills-lock.json`, updated by the skills CLI) and
are exposed to Claude Code through symlinks in `.claude/skills/`. Adding a vendored skill means adding
the symlink too, or it will not load — silently, with no error. Skills written for this repo live
directly in `.claude/skills/`.

`pnpm check:skills` (also run by `pnpm lint`) enforces that wiring: every vendored skill has a resolving
symlink, none is a real directory or dangling, `skills-lock.json` matches disk, and no two skills declare
the same frontmatter `name`. Re-running the skills CLI can undo it, so let the check tell you.
