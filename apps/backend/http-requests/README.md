# HTTP Requests - Security Setup

## 🔒 Security Notice

The `.http` files in this directory may contain sensitive information like JWT tokens and should **NOT** be committed to version control.

## 📝 Setup Instructions

### Quick Start (Recommended)

**1. Copy Example Files:**

```bash
cd apps/backend/http-requests
cp auth.http.example auth.http
cp admin-users.http.example admin-users.http
cp events.http.example events.http
cp transactions.http.example transactions.http
cp users.http.example users.http
```

**2. Get Your JWT Token:**

```bash
# Start backend
pnpm dev:backend

# Visit http://localhost:3000/api/auth/google
# Complete login and copy the JWT token
```

**3. Update Variables in .http Files:**

Edit each `.http` file and replace the `@token` variable at the top:

```http
@baseUrl = http://localhost:3000/api
@token = YOUR_ACTUAL_JWT_TOKEN_HERE  # ← Replace this
@eventId = YOUR_ACTUAL_EVENT_ID_HERE
```

**4. Send Requests:**

Click "Send Request" above any HTTP request in VS Code.

---

### Alternative: VS Code Settings (Optional)

If you prefer centralized configuration, edit `.vscode/settings.json`:

```json
{
  "rest-client.environmentVariables": {
    "development": {
      "baseUrl": "http://localhost:3000/api",
      "token": "YOUR_ACTUAL_JWT_TOKEN_HERE",
      "eventId": "YOUR_ACTUAL_EVENT_ID_HERE"
    }
  }
}
```

Then select "development" environment:

- `Cmd+Shift+P` → `REST Client: Switch Environment` → `development`

**Note:** `.vscode/settings.json` is gitignored to protect credentials.

- Click "Send Request" above each request
- Or use `Cmd+Alt+R` (Mac) / `Ctrl+Alt+R` (Windows/Linux)

The variables like `{{baseUrl}}` and `{{token}}` will be automatically replaced from your settings.

## 🔐 Security Best Practices

- ✅ **DO:** Keep `.http` files local (already in `.gitignore`)
- ✅ **DO:** Use variables for sensitive data
- ✅ **DO:** Commit `.http.example` files as templates
- ❌ **DON'T:** Commit real tokens or credentials
- ❌ **DON'T:** Share your `.http` files with real data
- ❌ **DON'T:** Include production tokens in development files

## 🔄 Updating Example Files

When adding new endpoints, update the `.http.example` files:

```bash
# Edit the example file (no real tokens)
vim auth.http.example

# Commit the changes
git add apps/backend/http-requests/auth.http.example
git commit -m "docs(backend): add new auth endpoint example"
```

## 📦 Files in This Directory

- `*.http` - Your local files with real tokens (gitignored)
- `*.http.example` - Template files without sensitive data (committed)
- `admin-users.http.example` - Admin user management endpoints (`/api/admin/users`)
- `_common.http` - Shared variables and health check (safe to commit)
- `README.md` - This file (committed)
