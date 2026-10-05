# StudyByte

A full-stack grade-based study platform. Students pick their grade (Class) once and get a
locked, focused **Notes** view of that grade's exercise questions (short/long answer) with model
answers. Admins manage the content hierarchy (Classes -> Subjects -> Chapters -> Questions),
including MCQ/True-False/Fill-in-the-Blank/Short/Long Answer question types and CSV bulk import.
A **Superadmin** role has full admin rights and can switch into the student view to preview any
grade's content.

## Stack

- **Backend**: Node.js, Express, TypeScript, Prisma, PostgreSQL, argon2, JWT, Zod, Vitest
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, TanStack Query, React Hook Form, Zod
- **Monorepo**: npm workspaces (`frontend`, `backend`)

## Roles

| Role       | Access                                                                 |
|------------|-------------------------------------------------------------------------|
| SUPERADMIN | Everything ADMIN has, plus can switch into the student Notes view at will, unscoped by grade |
| ADMIN      | Manage Classes, Subjects, Chapters, Questions (incl. CSV import); dashboard stats |
| STUDENT    | Locked to one grade on signup; browses that grade's Notes               |

## Local development

### Prerequisites

- Node.js >= 18.18
- A PostgreSQL 16+ instance - either `docker compose up -d` (uses `docker-compose.yml`, Postgres
  on port 5432) or your own local/remote instance

### Quick start

```bash
# 1. Start Postgres (skip if you're pointing at your own instance)
docker compose up -d

# 2. Install everything (root workspaces install both frontend + backend)
npm install

# 3. Configure environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# edit backend/.env: set DATABASE_URL, and generate real JWT secrets (see below)

# 4. Set up the database
cd backend
npx prisma migrate dev
npx prisma db seed
cd ..

# 5. Run both apps (in two terminals)
npm run dev:backend    # http://localhost:4000
npm run dev:frontend   # http://localhost:5173
```

Generate strong JWT secrets instead of using the placeholders in `.env.example`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Seeded accounts (see `backend/prisma/seed.ts`):

| Role       | Email                      | Password    | Notes                                  |
|------------|-----------------------------|-------------|-----------------------------------------|
| SUPERADMIN | ali.khaliq50@gmail.com     | laptop321   | Full access + student-view switcher     |
| ADMIN      | admin@computer.local       | Admin@123   |                                          |
| STUDENT    | student@computer.local     | Student@123 | No grade set - hits the grade picker first login |

## Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `DATABASE_URL` | backend | Postgres connection string |
| `PORT` | backend | Port the API listens on (Render sets this automatically) |
| `NODE_ENV` | backend | `development` / `test` / `production` - also toggles secure cookies |
| `FRONTEND_URL` | backend | Allowed CORS origin + base URL for password-reset links |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | backend | Token signing secrets - must be unique per environment, never reused |
| `JWT_ACCESS_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` | backend | Token lifetimes |
| `PASSWORD_RESET_TOKEN_TTL_MIN` | backend | Reset-link validity window |
| `VITE_API_URL` | frontend | Base URL the frontend calls, e.g. `https://your-api.onrender.com/api/v1` |

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for hosting on Vercel (frontend) + Render (backend + Postgres).

## Project layout

Both sides follow a strict layering: backend is `routes -> controller -> service -> repository`
(Prisma only ever touched by the repository layer), frontend is `pages -> features -> lib`
(TanStack Query hooks in `features/`, nothing talks to the API directly from a component).

## Testing

Backend tests run against a dedicated `computer_test` database (see `backend/.env.test`) so they
never touch dev data. Run them with `npm run test --workspace backend`.
