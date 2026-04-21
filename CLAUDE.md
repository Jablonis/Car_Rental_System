# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Auto salon web application (Express.js + TypeScript + PostgreSQL) for browsing and managing car inventory. Supports user authentication, admin panel for user management, and CRUD operations for car listings. Deployed on Vercel with Supabase PostgreSQL.

## Commands

```bash
npm run dev      # Start development server with hot reload (tsx watch)
npm run build    # Compile TypeScript to dist/
npm run start    # Run production server (node dist/index.js)
```

## Architecture

**Stack:** Express.js 5, TypeScript (NodeNext modules), EJS templates, PostgreSQL (via pg), express-session with PostgreSQL store, Zod for validation.

**Structure:**
```
src/
├── @types/              # TypeScript type extensions
│   ├── express.d.ts     # Express Locals interface
│   └── session.d.ts     # express-session SessionData extension
├── controllers/         # Request handlers (HTTP logic)
│   ├── admin.controller.ts
│   ├── auth.controller.ts
│   ├── car.controller.ts
│   └── public.controller.ts
├── data/
│   └── db.ts            # PostgreSQL connection pool
├── middleware/
│   ├── check-admin.middleware.ts      # Admin role check (403 for non-admin)
│   ├── check-auth.middleware.ts       # Populates res.locals with user state
│   └── protect-routes.middleware.ts   # Redirects unauthenticated to /login
├── models/              # Active record pattern ORM
│   ├── car.model.ts
│   └── user.model.ts
├── routes/              # Route definitions
│   ├── admin.route.ts   # /admin/users/*
│   ├── auth.route.ts    # /signup, /login, /logout
│   ├── car.route.ts     # /cars/*, /my-cars
│   └── public.route.ts  # /, /about, /contact
├── services/            # Business logic layer
│   ├── admin-user.service.ts
│   └── car.service.js
├── validators/          # Zod schemas
│   ├── car.validator.ts
│   └── user.validator.ts
└── views/               # EJS templates
    ├── admin/           # Admin user management
    ├── auth/            # Login/signup forms
    ├── cars/            # Car listing and forms
    ├── components/      # header.ejs, footer.ejs
    └── public/          # Landing pages
```

**Request Flow:**
1. `src/index.ts` - App initialization, session middleware, global `checkAuthStatus` middleware, route mounting
2. Routes define URL patterns and call controller functions
3. Controllers handle HTTP (req/res), validate input with Zod, call services
4. Services contain business logic, authorization checks, call models
5. Models handle database queries using active record pattern

**Authentication:** Session-based with scrypt-hashed passwords stored in PostgreSQL `session` table. User object stored in `req.session.user` with `id`, `name`, `email`, `isAdmin`.

**Authorization:**
- `checkAuthStatus` runs globally, populates `res.locals.isAuthenticated`, `res.locals.user`, `res.locals.isAdmin`
- `protectRoutes` middleware redirects unauthenticated users to `/login`
- `checkAdmin` returns 403 for non-admin users
- Car ownership enforced in services (users can only edit/delete their own cars)

**Key patterns:**
- All routes mounted at root (`/`) in `index.ts`
- Controllers handle HTTP, services handle business logic
- Models use active record pattern with `save()`, static finders, and `deleteById()`
- Zod validation with `safeParse()` returns errors to forms with preserved `formData`

## Database Schema

**users table:**
- `user_id` (serial primary key)
- `name`, `email`, `password` (scrypt hash: `salt:derivedKey`)
- `is_admin` (boolean)

**cars table:**
- `car_id` (serial primary key)
- `title`, `brand`, `model`, `year`, `price`, `mileage`
- `fuel`, `transmission`, `description`, `image`
- `user_id` (foreign key to users)
- `created_at` (timestamp)

**session table:** (for express-session store)

## Environment Variables

```bash
PORT=3000
SESSION_SECRET=your-secret-key
DATABASE_URL=postgresql://user:pass@host:port/dbname  # Supabase connection string
```

## Deployment

Configured for Vercel with `@vercel/node`. When `VERCEL` env var is set, the app exports `app` as handler instead of calling `listen()`. Static assets in `public/` are served automatically by Vercel.

## Key Business Rules

1. **Password hashing:** scrypt with random 16-byte salt, stored as `salt:derivedKey`
2. **Last admin protection:** Cannot delete last admin or remove last admin's role
3. **Self-deletion prevention:** Admin cannot delete themselves
4. **Car ownership:** Users can only edit/delete their own cars (admins can edit all)
5. **Email uniqueness:** Checked with optional exclusion for updates
