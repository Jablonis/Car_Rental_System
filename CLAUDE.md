# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Auto salon web application (Express.js + TypeScript + MySQL) for browsing and managing car inventory. Supports user authentication, admin panel for user management, and CRUD operations for car listings.

## Commands

```bash
npm run dev      # Start development server with hot reload (tsx watch)
npm run build    # Compile TypeScript to dist/
npm run start    # Run production server (node dist/index.js)
```

## Architecture

**Stack:** Express.js 5, TypeScript (NodeNext modules), EJS templates, MySQL (via mysql2/promise), express-session for auth, Zod for validation.

**Structure:**
- `src/routes/` - Route definitions (public, auth, admin, car)
- `src/controllers/` - Request handlers
- `src/services/` - Business logic (admin-user.service, car.service)
- `src/models/` - Database models (User, Car) with active record pattern
- `src/middleware/` - Auth guards (checkAuthStatus, checkAdmin, protectRoutes)
- `src/validators/` - Zod schemas for user/car input validation
- `src/data/db.ts` - MySQL connection pool
- `src/views/` - EJS templates (auth, admin, public, cars)
- `public/assets` - Static assets (served automatically on Vercel)

**Authentication:** Session-based with scrypt-hashed passwords. User object stored in `req.session.user` with `id`, `name`, `email`, `isAdmin`.

**Key patterns:**
- All routes mounted at root (`/`) in `index.ts`
- `checkAuthStatus` middleware runs globally, populates `res.locals.isAuthenticated`, `res.locals.user`, `res.locals.isAdmin`
- `protectRoutes` redirects unauthenticated users to `/login`
- `checkAdmin` returns 403 for non-admin users
- Models use active record pattern with `save()`, static finders, and `deleteById()`

## Environment Variables

Copy `.env.example` and configure:
- `PORT` - Server port (default: 3000)
- `SESSION_SECRET` - Session signing secret
- `DB_HOST` / `MYSQLHOST` - Database host
- `DB_PORT` / `MYSQLPORT` - Database port (default: 3306)
- `DB_USER` / `MYSQLUSER` - Database user
- `DB_PASSWORD` / `MYSQLPASSWORD` - Database password
- `DB_NAME` / `MYSQLDATABASE` - Database name (default: autosalon_db)

## Deployment

Configured for Vercel. When `VERCEL` env var is set, the app exports `app` as handler instead of calling `listen()`. Static assets in `public/` are served automatically by Vercel.
