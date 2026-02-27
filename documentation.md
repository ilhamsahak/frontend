# Magic Chess Automanaged Tournament — Documentation

> Last updated: 2026-02-28

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Setup & Running](#4-setup--running)
5. [Database Schema](#5-database-schema)
6. [API Reference](#6-api-reference)
7. [Frontend Pages](#7-frontend-pages)
8. [Security](#8-security)
9. [Changelog](#9-changelog)

---

## 1. Project Overview

**Magic Chess Automanaged Tournament** is a full-stack web application for managing a Magic Chess tournament. It supports:

- Team registration (captain + 4–10 members)
- Username or email login
- Captain dashboard (view team, players, payment status, group, bracket)
- Admin dashboard (manage teams/players, toggle registration, view stats)
- Payment submission with receipt reference
- Group assignment (A–D) by admin

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (Turbopack), React 19, CSS Modules |
| Backend | FastAPI (Python), Uvicorn |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (JWT via service role) |
| Storage | Supabase Storage (`team-assets` bucket) |
| Icons | Lucide React |
| Fonts | Inter via `next/font/google` |

---

## Git Repositories

| Part | Repo | Branch |
|---|---|---|
| Frontend | `https://github.com/ilhamsahak/frontend.git` | `master` |
| Backend | *(local — push to GitHub when ready)* | `master` |

### Push Backend to GitHub

1. Create a new repo on GitHub (e.g. `tour-logic-backend`)
2. Run:

```bash
cd backend
git remote add origin https://github.com/ilhamsahak/tour-logic-backend.git
git push -u origin master
```

> ✅ `.env` is in `.gitignore` — credentials will not be pushed.

---

## 3. Project Structure

```
tour-logic-beta/
├── backend/
│   ├── main.py                  # FastAPI app entry point
│   ├── db.py                    # Supabase client initialisation
│   ├── database.py              # (legacy reference)
│   ├── .env                     # Supabase URL, service key, JWT secret
│   ├── requirements.txt
│   ├── core/
│   │   └── security.py          # JWT auth, get_current_user, require_admin
│   ├── routers/
│   │   ├── auth.py              # /auth — register, login, upload-logo, dashboard/team
│   │   ├── teams.py             # /teams — create team
│   │   ├── players.py           # /players — add/remove player
│   │   ├── payments.py          # /payments — submit payment
│   │   └── admin.py             # /admin — manage teams/players, toggle registration
│   └── services/
│       └── grouping.py          # Group assignment logic (A–D)
│
└── frontend/
    ├── next.config.mjs          # Next.js config (empty — defaults)
    ├── package.json
    └── app/
        ├── layout.js            # Root layout with Inter font
        ├── globals.css          # Global CSS reset + design tokens
        ├── page.js              # Homepage (/)
        ├── login/               # /login
        ├── register/            # /register (3-step wizard)
        ├── dashboard/           # /dashboard (captain view)
        └── admin/               # /admin (admin panel)
```

---

## 4. Setup & Running

### Prerequisites

- Python 3.11+
- Node.js 18+
- Supabase project (URL + service role key)
- Tesseract OCR installed at `C:\Program Files\Tesseract-OCR\tesseract.exe`

### Backend

```bash
cd backend

# Create virtual environment (first time only)
python -m venv venv

# Install dependencies
pip install -r requirements.txt

# Run dev server (uses system Python if venv script fails on Windows)
python -m uvicorn main:app --reload
```

Backend runs at: `http://localhost:8000`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:3000`

### Environment Variables (`backend/.env`)

```env
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_KEY=<service_role_key>
SUPABASE_JWT_SECRET=<jwt_secret>
```

---

## 5. Database Schema

All tables live in the `public` schema on Supabase.

### `profiles`
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | References `auth.users(id)` |
| username | TEXT (UNIQUE) | Display name / login identifier |
| email | TEXT | Captain email |
| created_at | TIMESTAMPTZ | Default NOW() |

### `teams`
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | Auto-generated |
| team_name | TEXT | |
| captain_id | UUID (FK) | References `profiles(id)` |
| logo_url | TEXT | Supabase Storage public URL |
| payment_status | TEXT | `unpaid` \| `paid` |
| group_assigned | TEXT | `A` \| `B` \| `C` \| `D` |
| created_at | TIMESTAMPTZ | |

### `players`
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| team_id | UUID (FK) | References `teams(id)` |
| real_name | TEXT | |
| ign | TEXT | In-game name |
| ingame_id | TEXT | Numeric game ID |
| is_captain | BOOLEAN | First member = captain |
| status | TEXT | `active` \| `inactive` |
| created_at | TIMESTAMPTZ | |

### `payments`
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| team_id | UUID (FK) | References `teams(id)` |
| amount | NUMERIC | RM 50 |
| payment_reference | TEXT | Receipt/transaction ref |
| status | TEXT | `paid` |
| created_at | TIMESTAMPTZ | |

### `settings`
| Column | Type | Notes |
|---|---|---|
| key | TEXT (PK) | e.g. `registration_open` |
| value | TEXT | `true` \| `false` |

> **RLS**: All tables have RLS enabled. `teams`, `players`, `payments`, `profiles` are service-role only (backend bypasses RLS). `settings` has RLS disabled (public config flag).

### Initial Seed

```sql
INSERT INTO public.settings (key, value)
VALUES ('registration_open', 'true')
ON CONFLICT (key) DO NOTHING;
```

---

## 6. API Reference

Base URL: `http://localhost:8000`

### Auth — `/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | None | Register captain + team + players |
| POST | `/auth/login` | None | Login with email or username |
| POST | `/auth/upload-logo` | None | Upload team logo to Supabase Storage |
| GET | `/auth/dashboard/team` | Bearer token | Get captain's team + players |

#### Register Request Body
```json
{
  "email": "captain@email.com",
  "username": "captainName",
  "password": "min8chars",
  "team_name": "Team Alpha",
  "logo_url": null,
  "members": [
    { "real_name": "Name", "ign": "IGN", "ingame_id": "123456" }
  ]
}
```

#### Login Request Body
```json
{ "identifier": "email@example.com OR username", "password": "..." }
```

#### Login Response
```json
{
  "access_token": "...",
  "captain_id": "uuid",
  "team_id": "uuid",
  "is_admin": false
}
```

---

### Teams — `/teams`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/teams/` | Bearer token | Create a team (used internally by register) |

---

### Players — `/players`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/players/` | Bearer token (captain) | Add player to team (max 10) |
| DELETE | `/players/{id}` | Bearer token (captain) | Soft delete player (status → inactive) |

---

### Payments — `/payments`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/payments/` | Bearer token (captain) | Submit payment record |

---

### Admin — `/admin`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/admin/teams` | Admin token | List all teams with players |
| PATCH | `/admin/teams/{id}` | Admin token | Edit team name or payment status |
| DELETE | `/admin/teams/{id}` | Admin token | Delete team + players |
| PATCH | `/admin/players/{id}` | Admin token | Edit player details |
| DELETE | `/admin/players/{id}` | Admin token | Remove player |
| GET | `/admin/registration-status` | **Public** | Get registration open/closed status |
| POST | `/admin/toggle-registration` | Admin token | Flip registration status |
| POST | `/admin/generate-groups` | Admin token | Assign paid teams to groups A–D |

> **Admin role**: Set via Supabase Dashboard → `auth.users` → `app_metadata` → `{ "role": "admin" }`

---

## 7. Frontend Pages

### `/` — Homepage
Static landing page. Shows tournament info, stats, CTA buttons to Register and Login.

### `/register` — Team Registration (3-step wizard)
1. **Step 1**: Captain account (email, username, password)
2. **Step 2**: Team name + member roster (4–10 players)
3. **Step 3**: Team logo upload + registration summary

Checks registration status from backend before rendering. Shows "Registration Closed" screen if closed.

### `/login` — Captain Login
Accepts **email or username** + password. On success:
- Stores `access_token`, `team_id`, `captain_id` in `localStorage`
- Redirects admin → `/admin`, captain → `/dashboard`

### `/dashboard` — Captain Dashboard
Protected (redirects to `/login` if no token). Sections:
- **Overview**: Team stats (players, group, matches, payment)
- **My Team**: Full roster table
- **Matches**: Placeholder (no match table yet)
- **Group**: Group standings placeholder
- **Bracket**: Tournament bracket placeholder

### `/admin` — Admin Panel
Protected by admin role check. Sections:
- **Overview**: Total teams, paid, unpaid, total players
- **Teams**: Full team+player management (edit/delete)
- **Registration**: Toggle open/closed with live status indicator
- **Results**: Placeholder

---

## 8. Security

| Protection | Implementation |
|---|---|
| JWT verification | `supabase.auth.get_user(token)` — server-side validation |
| Admin guard | `app_metadata.role === "admin"` checked on every admin endpoint |
| CORS | Restricted to `http://localhost:3000` only |
| RLS | Enabled on all sensitive tables; service role bypasses |
| Sensitive exposure | No JWT secret exposed to client; service key backend-only |

### Security Test Results (2026-02-28)

| Endpoint | Test | Result |
|---|---|---|
| `GET /` | Health check | ✅ 200 OK |
| `GET /auth/dashboard/team` (no token) | Auth guard | ✅ 401 Blocked |
| `GET /admin/teams` (no token) | Admin guard | ✅ 401 Blocked |
| `GET /admin/teams` (fake token) | Token validation | ✅ 401 Rejected |
| `GET /admin/registration-status` | Public endpoint | ✅ 200 OK |
| `POST /admin/toggle-registration` (no token) | Admin guard | ✅ 401 Blocked |

---

## 9. Changelog

### 2026-02-28

#### Backend
- Added try/except fallback to `/admin/registration-status` — returns `registration_open: true` by default if `settings` table is unavailable
- Removed unused dead imports (`jwt`, `JWTError`, `base64`, `ALGORITHM`) from `core/security.py` — auth is handled via `supabase.auth.get_user()`

#### Frontend
- Removed `reactCompiler: true` from `next.config.mjs` — was causing HMR infinite refresh loop with Turbopack
- Replaced `@import` Google Fonts in `globals.css` with `next/font/google` in `layout.js` — eliminates external HTTP request that caused Turbopack to recompile non-stop
- Installed `lucide-react` — replaced all emoji icons (⊞ 👥 ⚔️ 🏅 🏆 📋 ✏️ 🗑 🔒 etc.) with minimalist SVG icons across `/dashboard` and `/admin`

#### Database (Supabase)
- Created `settings` table with `registration_open = true` seed row
- Enabled RLS on all tables (`teams`, `players`, `payments`, `profiles`)
- `settings` table has RLS disabled (non-sensitive config data)
- All tables policy: service role only (backend bypasses RLS automatically)
