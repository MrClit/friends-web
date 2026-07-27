# Security Policy

This repository is public. Keep all production secrets outside source control and follow this lightweight runbook.

## 1. Secret Inventory

Backend critical secrets:

- `JWT_SECRET`
- `GOOGLE_CLIENT_SECRET`
- `MICROSOFT_CLIENT_SECRET`
- `DATABASE_PASSWORD`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_API_KEY`

Reference inventory source: `apps/backend/.env.example`.

## 2. Where Secrets Are Stored

- Local development: `apps/backend/.env.development` (never committed).
- CI/CD: GitHub Actions repository secrets.
- Production runtime: hosting provider environment variables (Render).
- OAuth provider values: Google and Microsoft app consoles.

## 3. Secret Generation Rules

- `JWT_SECRET` must be high entropy and at least 32 characters.
- Prefer cryptographically secure generation.

Example:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 4. Rotation Policy (Pragmatic)

Rotate secrets:

- At least once per year.
- Immediately after suspected leakage.
- Immediately after offboarding anyone who had access.

After rotating `JWT_SECRET`, force user re-authentication and verify refresh token behavior.

## 5. 30-Minute Leakage Playbook

1. Contain: identify leaked secret and remove exposure source.
2. Rotate: generate new value and update provider/runtime env vars.
3. Restart/redeploy backend to apply new values.
4. Verify: login, callback URLs, API auth, and key flows.
5. Log incident details in repository issue or ops notes.

## 6. Out of Scope for Now

Not implemented in this phase:

- AWS Secrets Manager / Vault / 1Password automation
- Automatic rotation jobs
- Enterprise audit workflows

This policy intentionally optimizes for a solo-maintained public project while reducing operational risk.
