# Shoe Shop — Admin Dashboard

A production-grade admin dashboard for a shoe shop e-commerce platform.
Built with **Next.js (App Router)**, **Supabase**, and **shadcn/ui**, following a server-first architecture and multi-layer security model.

→ [Front store repo](https://github.com/faisalmh4045/shoe-shop-ecommerce-frontstore) · [Live demo](https://shoe-shop-admin-dashboard.vercel.app/login)

---

## Features

- **Role Based Access** — `super_admin` (full access), `test_admin` (read-only)
- **Three-layer authentication system** for defense-in-depth
- **AI assistant** — chat interface with tool-calling for real-time data
- **Product management** — simple & configurable products with variant groups
- **Order lifecycle** — automated status updates via database triggers
- **Customer management** — storefront users and order history

---

## Tech Stack

| Concern            | Library                                   |
| ------------------ | ----------------------------------------- |
| Framework          | Next.js 16 (App Router), React 19         |
| Language           | TypeScript 5 (strict mode)                |
| Styling & UI       | Tailwind CSS v4, shadcn/ui                |
| Backend            | Supabase (Postgres, Auth, Edge Functions) |
| Image storeage     | next-cloudinary                           |
| Data fetching      | TanStack Query v5 (client only)           |
| Forms & Validation | React Hook Form + Zod 3                   |
| AI Integration     | Vercel AI SDK + OpenRouter                |

---

## Project Structure

```
src/
├── app/
│   ├── (admin)/      # protected routes
│   ├── (auth)/       # login
│   └── api/chat/     # AI route
├── dal/              # data access layer (server-only)
├── actions/          # server actions (mutations)
├── components/
├── context/          # AdminContext
├── hooks/            # useAdmin, usePermissions
├── lib/
│   ├── ai/           # model, tools, system prompt
│   └── supabase/     # client/server setup
├── types/
└── validations/      # Zod schemas (shared with forms + actions)
```

---

## Key Design Decisions

- **Server-first data fetching** using React Server Components
- **DAL (Data Access Layer)** to isolate database logic from UI
- **Multi-layer auth** to prevent privilege escalation
- **Database triggers** for consistency (order status, payment status)
- **AI tools mapped to DAL**, not direct database queries
- **Minimal client state**, using TanStack Query only where necessary

---

## Architecture

### Authentication — Three Independent Layers

Each layer is self-contained and does not trust the one above it.

```
Layer 1 — proxy.ts (Edge)
  - Runs on every request
  - Refreshes Supabase session
  - Performs optimistic cookie check (no DB call)
  - Redirects unauthenticated users

Layer 2 — Server Components (RSC)
  - Calls requireAdmin()
  - Verifies user via DB (admins table lookup)
  - Signs out and redirects unauthorized users

Layer 3 — Server Actions
  - Calls requireAdmin() (cached)
  - Mutations require requireSuperAdmin()
  - Enforces role-based restrictions
```

**Note:** Auth is intentionally not placed in layout due to Next.js layout caching behavior.

### Role behaviour

| Role          | Read | Mutate |
| ------------- | ---- | ------ |
| `super_admin` | ✓    | ✓      |
| `test_admin`  | ✓    | ✗      |

`test_admin` restrictions are enforced at both the server (action returns early) and the UI (`usePermissions().can('mutate')` disables buttons).

### Data fetching

Pages are React Server Components — data is fetched by calling DAL functions directly, with no client-side fetching on initial load. TanStack Query is used only for client-side interactions that shouldn't trigger a full page reload (e.g. the dashboard chart period toggle).

---

## Database

This dashboard shares a Supabase database with the front store.
Full schema, triggers, RPC functions, and edge functions are documented in [`docs/database/`](./docs/database/).

To regenerate TypeScript types after a schema change:

```bash
npx supabase gen types typescript --project-id YOUR_ID > src/types/database.types.ts
```

---

## Getting Started

### Prerequisites

- Node.js 20.9+
- pnpm
- Supabase project with schema applied

### Installation

```bash
git clone https://github.com/faisalmh4045/shoe-shop-admin-dashboard.git
cd shoe-shop-admin-dashboard
pnpm install
cp .env.example .env.local
```

### Environment Variables

| Variable                               | Description          |
| -------------------------------------- | -------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key    |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`    | Cloudinary cloud     |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Upload preset        |
| `OPENROUTER_API_KEY`                   | AI API key           |

### Seed Admin

```sql
INSERT INTO admins (user_id, role, full_name)
VALUES ('<auth-user-uuid>', 'super_admin', 'Your Name');
```

### Run

```bash
pnpm run dev
```
