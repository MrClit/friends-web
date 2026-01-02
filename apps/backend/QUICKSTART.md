# Backend Quick Start Guide

## 🚀 Start Developing in 3 Steps

### 1️⃣ Start the Database

```bash
docker compose up -d
```

> **Note:** Use `docker compose` (without hyphen) if you have Docker Desktop. If that doesn't work, try `docker-compose` for older installations.

This will start PostgreSQL in a Docker container. The database will be available at `localhost:5432`.

### 2️⃣ Start the Backend Server

From the **monorepo root**:

```bash
pnpm --filter @friends/backend start:dev
```

Or from **this directory**:

```bash
pnpm start:dev
```

### 3️⃣ Verify It's Working

The server should start on port **3000** and you should see:

```
🚀 Application is running on: http://localhost:3000/api
🌐 CORS enabled for: http://localhost:5173
```

Test the default endpoint:

```bash
curl http://localhost:3000/api
```

---

## 🛑 Stop Everything

```bash
# Stop the backend server
# Press Ctrl+C in the terminal where it's running

# Stop the database
docker compose down
```

---

## 🔧 Useful Commands

```bash
# View database logs
docker compose logs -f

# Connect to PostgreSQL
docker exec -it friends-postgres psql -U postgres -d friends_db

# Restart database (fresh start)
docker compose down -v && docker compose up -d

# View backend logs (in dev mode they appear in the terminal)
```

---

## 📝 Environment Variables

All configuration is in `.env` file. Default values work with Docker setup:

```env
PORT=3000
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=friends_db
CORS_ORIGIN=http://localhost:5173
```

---

## ✅ Phase 1 Complete!

You now have:

- ✅ NestJS backend running
- ✅ PostgreSQL database
- ✅ TypeORM configured
- ✅ CORS enabled for frontend
- ✅ Global validation
- ✅ Exception handling

**Next:** Implement Phase 2 - Events Module
