# HTTP Requests - Security Setup

## 🔒 Security Notice

The `.http` files in this directory may contain sensitive information like JWT tokens and should **NOT** be committed to version control.

## 📝 Setup Instructions

### 1. Copy Example Files

Copy the `.http.example` files to create your local `.http` files:

```bash
cd apps/backend/http-requests
cp auth.http.example auth.http
cp events.http.example events.http
cp transactions.http.example transactions.http
cp users.http.example users.http
```

### 2. Configure VS Code Settings

Edit `.vscode/settings.json` in the project root and add your tokens:

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

**Important:** `.vscode/settings.json` is gitignored to protect your credentials.

### 3. Get Your JWT Token

1. Start the backend server: `pnpm dev:backend`
2. Navigate to `http://localhost:3000/api/auth/google`
3. Complete the Google OAuth login
4. Copy the JWT token from the response
5. Paste it in `.vscode/settings.json` under `token`

### 4. Use the HTTP Files

Open any `.http` file and use the REST Client extension:
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
- `_common.http` - Shared variables and health check (safe to commit)
- `README.md` - This file (committed)
