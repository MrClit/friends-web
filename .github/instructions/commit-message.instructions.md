---
description: 'Use when the user asks for a commit message. Produce accurate Conventional Commit messages based on the actual git diff.'
name: 'Commit Message Convention'
applyTo: '**'
---

# Commit Message Convention

- Activation boundary: apply these rules only when generating, improving, or reviewing a Git commit message (for example, from the VS Code Source Control commit message generator).
- Ignore this instruction for implementation tasks such as writing code, refactoring, tests, debugging, architecture, or documentation edits.
- Apply this guidance when the user asks to generate, improve, or review commit messages.
- Use the Conventional Commits format: `type(scope): summary`.
- Keep the subject line in imperative mood and under 72 characters.
- Match the message to the real staged or unstaged diff. Do not invent changes.

## Allowed Types

- `feat`: New user-facing capability or behavior.
- `fix`: Bug fix or behavior correction.
- `docs`: Documentation-only changes.
- `style`: Formatting or non-functional style changes.
- `refactor`: Internal code change without behavior change.
- `test`: Tests added or modified.
- `chore`: Tooling, dependencies, scripts, or maintenance.

## Scope Rules (Friends Monorepo)

- Use `frontend` for changes under `apps/frontend/`.
- Use `backend` for changes under `apps/backend/`.
- Use `shared-types` for changes under `packages/shared-types/`.
- Use `ci` for CI/CD, automation, release, workflow, or repo-level tooling.
- If multiple scopes are changed, prefer:
  - one commit message per logical commit, or
  - the dominant scope for a single combined commit.

## Subject Line Rules

- Start with a verb in imperative form: `add`, `fix`, `refactor`, `update`, `remove`.
- Be specific about intent and impacted behavior.
- Avoid vague subjects such as `update stuff` or `minor changes`.
- Avoid trailing punctuation.

## Optional Body

Add a body only when useful. Keep it concise.

- Explain why the change was needed.
- Summarize key implementation details.
- Mention side effects or migration notes when relevant.

## Breaking Changes

- If a breaking change exists, use `!` after type/scope: `feat(backend)!: ...`.
- Add a `BREAKING CHANGE:` footer describing migration impact.

## Output Style

When proposing messages:

1. Provide 1 recommended commit message first.
2. If ambiguity exists, provide up to 2 alternatives.
3. Briefly state why the recommended option is the best fit.

## Examples

- `feat(frontend): add event filters to home page`
- `fix(backend): validate participant ownership on transaction create`
- `refactor(shared-types): normalize event participant union types`
- `chore(ci): improve release workflow retry strategy`
