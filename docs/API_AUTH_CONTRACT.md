# API Contract: Auth (Google OAuth2)

This document describes the backend auth endpoints, request/response shapes, and error cases to integrate the frontend with Google OAuth2 authentication.

## Endpoints

### 1) GET /api/auth/google

- Description: Starts Google OAuth2 flow. Redirects the user to Google's consent screen.
- Response: HTTP 302 redirect to Google (no JSON body).

### 2) GET /api/auth/google/callback

- Description: Google redirects back to this endpoint after user consent. Server validates the Google profile, checks the email against the `users` table, preserves user-customized names, updates avatar in Cloudinary when needed, issues a JWT, and redirects to the frontend callback route.
- Success response: HTTP 302 redirect to frontend callback with query params (`token`, `id`, `email`, `name`, `avatar`, `role`).

- Failure cases:
  - Email not allowed -> HTTP 401
  - Invalid Google token/profile -> HTTP 400 or 401

Failure example (HTTP 401):

```json
{
  "data": null,
  "error": {
    "statusCode": 401,
    "message": "Unauthorized"
  }
}
```

### 3) GET /api/auth/me

- Description: Returns authenticated user's profile. Requires `Authorization: Bearer <jwt>` header.
- Success response (HTTP 200):

```json
{
  "data": {
    "id": "...",
    "email": "...",
    "name": "...",
    "avatar": "...",
    "role": "user",
    "createdAt": "2026-03-19T12:00:00.000Z",
    "updatedAt": "2026-03-19T12:00:00.000Z"
  }
}
```

### 4) PATCH /api/users/me

- Description: Updates the authenticated user profile (name and/or avatar). Requires `Authorization: Bearer <jwt>` header.
- Content-Type: `multipart/form-data`
- Body fields:
  - `name` (optional, string, max 255)
  - `avatar` (optional, image file up to 5 MB)
- Success response (HTTP 200):

```json
{
  "data": {
    "id": "...",
    "email": "...",
    "name": "...",
    "avatar": "https://res.cloudinary.com/...",
    "role": "user",
    "createdAt": "2026-03-19T12:00:00.000Z",
    "updatedAt": "2026-03-19T12:10:00.000Z"
  }
}
```

### 5) POST /api/auth/logout

- Description: Optional; clears server-side cookie or performs logout actions. Implementation-specific.

## Token handling (frontend guidance)

- Current flow: backend callback redirects to frontend with query params including `token`, and frontend stores the token for subsequent requests.
- Alternative for future hardening: use `HttpOnly` secure cookies for session management.

Example frontend flow (recommended):

1. User clicks `Login with Google` button which navigates to `/api/auth/google`.
2. After Google redirects back, frontend callback reads `token` from query params.
3. Frontend stores the token (in `localStorage` or memory) and sets `Authorization: Bearer <token>` header for subsequent requests.

## Errors and status codes

- `401 Unauthorized`: email not allowed, invalid/expired token
- `403 Forbidden`: user authenticated but lacks required role
- `400 Bad Request`: malformed request or missing data
- `500 Internal Server Error`: unexpected server errors

## Security notes

- Do not store secrets in the frontend.
- Use HTTPS in production and `HttpOnly` cookies where possible.
- Short token expirations are recommended; consider refresh tokens for long sessions.

## Example integration snippet (frontend)

```ts
// In frontend callback route
const params = new URLSearchParams(window.location.search);
const token = params.get('token');

if (token) {
  localStorage.setItem('token', token);
  fetch('/api/events', { headers: { Authorization: `Bearer ${token}` } });
}
```

## Next steps

- Add `api/auth` routes to frontend `auth` feature and implement `useAuth` hook.
- Add E2E tests to simulate OAuth flow with a mock provider for CI.
