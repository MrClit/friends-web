# API Contract: Auth (Google OAuth2)

This document describes the backend auth endpoints, request/response shapes, and error cases to integrate the frontend with Google OAuth2 authentication.

## Endpoints

### 1) GET /api/auth/google

- Description: Starts Google OAuth2 flow. Redirects the user to Google's consent screen.
- Response: HTTP 302 redirect to Google (no JSON body).

### 2) GET /api/auth/google/callback

- Description: Google redirects back to this endpoint after user consents. Server validates the Google profile, checks the email against the `users` table, persists `name` and `avatar` on first login, and issues a JWT.
- Success response (HTTP 200):

```json
{
  "data": {
    "token": "<jwt>",
    "user": {
      "id": "...",
      "email": "...",
      "name": "...",
      "avatar": "...",
      "role": "user"
    }
  }
}
```

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
    "role": "user"
  }
}
```

### 4) POST /api/auth/logout

- Description: Optional; clears server-side cookie or performs logout actions. Implementation-specific.

## Token handling (frontend guidance)

- Preferred: return token in JSON response and let frontend store it (e.g., in memory + localStorage with care).
- Alternatively: set `HttpOnly` secure cookie from backend for session management.

Example frontend flow (recommended):

1. User clicks `Login with Google` button which navigates to `/api/auth/google`.
2. After Google redirects back, the backend returns a JSON payload with `token` and `user`.
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
// After receiving response
const { token, user } = await response.json();
localStorage.setItem('token', token);
// Attach token to future requests
fetch('/api/events', { headers: { Authorization: `Bearer ${token}` } });
```

## Next steps

- Add `api/auth` routes to frontend `auth` feature and implement `useAuth` hook.
- Add E2E tests to simulate OAuth flow with a mock provider for CI.
