# Filo, SaaS Cloud File Storage Platform

Filo is a production-ready SaaS file storage platform with tiered subscription plans, folder nesting, multipart uploads to Cloudflare R2, and shareable links. Built with a **Bun + Express + Prisma** backend and a **Next.js 16 + Tailwind CSS** frontend.

Filo follows a classic SaaS model — Free, Silver, Gold, and Diamond plans enforce real limits (storage quotas, folder counts, nesting depth, file type restrictions, and per-folder file caps) all validated server-side so they can't be bypassed.
It's missing a payment integration (like Stripe) to be fully commercial, but the entire subscription and plan enforcement architecture is in place; plugging in a payment provider like Stripe would be straightforward.

---

## Project Structure

```
filo/
├── filo_backend/   # REST API (Bun, Express, Prisma, R2)
└── filo_frontend/  # Web app (Next.js 16, React 19, Tailwind CSS 4)
```

---

## Backend (`filo_backend`)

### Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Bun 1.3 |
| Framework | Express 5 |
| ORM | Prisma 7 (PostgreSQL) |
| Object Storage | Cloudflare R2 (S3-compatible) |
| Auth | JWT (access + refresh token rotation) |
| Validation | Zod |
| Email | Nodemailer (SMTP or console fallback) |

### Prerequisites

- [Bun](https://bun.sh/) ≥ 1.3
- PostgreSQL 16
- A Cloudflare R2 bucket (or any S3-compatible store)

### Setup

```bash
cd filo_backend

# Install dependencies
bun install

# Copy environment file and fill in values
cp .env.example .env

# Push schema to database
bun run db:push

# Seed default admin + subscription packages
bun run db:seed

# Start development server (watch mode)
bun run dev
```

The API will be available at `http://localhost:8080`.

### Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `PORT` | Server port (default `8080`) |
| `NODE_ENV` | `development` or `production` |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins |
| `ACCESS_TOKEN_SECRET` | JWT secret for access tokens |
| `REFRESH_TOKEN_SECRET` | JWT secret for refresh tokens |
| `ACCESS_TOKEN_SECRET_EXPIRES_IN` | Access token TTL (default `15m`) |
| `REFRESH_TOKEN_SECRET_EXPIRES_IN` | Refresh token TTL (default `30d`) |
| `UPLOAD_DIR` | Local temp upload directory |
| `TEMP_UPLOAD_DIR` | Temp directory for in-progress uploads |
| `MAX_FILE_SIZE_BYTES` | Global upload size cap (default 500 MB) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | SMTP credentials (leave blank for console fallback) |
| `SMTP_FROM` | Sender address for emails |
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | R2 access key |
| `R2_SECRET_ACCESS_KEY` | R2 secret key |
| `R2_BUCKET_NAME` | R2 bucket name |
| `APP_URL` | Public frontend URL (used in email links) |

### Available Scripts

```bash
bun run dev          # Watch mode
bun run start        # Production start
bun run db:generate  # Regenerate Prisma client
bun run db:push      # Push schema (no migration file)
bun run db:migrate   # Create and apply a named migration
bun run db:seed      # Seed admin + packages
bun run db:studio    # Open Prisma Studio
```

### API Overview

| Prefix | Description |
|---|---|
| `POST /api/v1/auth/*` | User registration, login, token refresh, password reset |
| `GET/POST /api/v1/admin/*` | Admin login and package/user management |
| `GET/POST/PATCH/DELETE /api/v1/folders/*` | Folder CRUD + move + breadcrumbs |
| `GET/POST/PATCH/DELETE /api/v1/files/*` | File CRUD + download (presigned URL) + move/copy |
| `POST /api/v1/upload/presign` | Simple presigned PUT (≤ 100 MB) |
| `POST /api/v1/upload/confirm` | Register file after simple upload |
| `POST /api/v1/upload/multipart/*` | Multipart init / confirm part / complete / abort / resume |
| `GET/POST/DELETE /api/v1/share/*` | Create and manage share links |
| `GET /api/v1/public/share/:token` | Public share access (no auth) |
| `GET /api/v1/stats/storage` | Storage usage breakdown |
| `GET/POST /api/v1/packages` | List packages |
| `GET/POST /api/v1/subscriptions` | User subscription management |
| `GET /health` | Health check |

### Docker

```bash
# Start PostgreSQL only
docker compose up -d db

# Build and run the full API image
docker build -t filo-backend .
docker run --env-file .env -p 8080:8080 filo-backend
```

---

## Frontend (`filo_frontend`)

### Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI Library | React 19 |
| Styling | Tailwind CSS 4 |
| Forms | React Hook Form + Zod |
| Icons | Lucide React |
| Fonts | DM Sans · Syne · JetBrains Mono (Google Fonts) |

### Prerequisites

- Node.js ≥ 20 (or Bun)

### Setup

```bash
cd filo_frontend

npm install   # or bun install

# Copy and configure environment variables
cp .env.example .env.local

npm run dev
```

The app will be available at `http://localhost:3000`.

### Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL (e.g. `http://localhost:8080`) |
| `NEXT_PUBLIC_APP_URL` | Frontend base URL (e.g. `http://localhost:3000`) |
| `API_URL` | Server-side API URL (used in Server Actions) |

### Available Scripts

```bash
npm run dev    # Development server
npm run build  # Production build
npm run start  # Serve production build
npm run lint   # ESLint
```

### Key Features

- **Intercepting route modals** — Login and signup open as modals when navigated to from within the app, and as full pages when accessed directly.
- **Drag-and-drop upload** — Drop files onto the top bar to upload to the current folder.
- **Multipart upload** — Files over 100 MB are split into 10 MB chunks uploaded in parallel. Progress, speed, and ETA are shown in a floating drawer.
- **Resumable uploads** — Interrupted multipart uploads can be resumed from the sidebar.
- **Share links** — Generate expiring share links for files and folders; recipients see a public view with download access.
- **Subscription plans** — Free, Silver, Gold, and Diamond plans with different quotas enforced server-side.
- **Storage insights** — Breakdown of usage by file type with a stacked bar chart.
- **Admin dashboard** — Manage subscription packages and view all users.

### CSS Anchor Positioning

Context menus (right-click on folders and files) are positioned using the native **CSS Anchor Positioning** API, replacing the traditional JavaScript `getBoundingClientRect` + absolute-position pattern entirely.

Each trigger button registers itself as an anchor via `anchor-name`, and the popover queries that anchor via `positionAnchor` to place itself automatically:

```tsx
// Trigger declares itself as a named anchor
<button style={{ anchorName: `--folder-menu-${folder.id}` } as React.CSSProperties}>
  <MoreVerticalIcon />
</button>

// Popover positions itself relative to that anchor
<div
  popover="manual"
  style={{
    positionAnchor: `--folder-menu-${folder.id}`,
    inset: "unset",
    positionArea: "bottom span-right",
    positionTryFallbacks: "flip-block, flip-inline, flip-block flip-inline",
  } as React.CSSProperties}
/>
```

For right-click menus, a zero-size phantom `div` is placed at the cursor coordinates and used as the anchor instead, so the menu opens exactly where the user clicked:

```tsx
// Phantom anchor tracks the cursor position
<div
  style={{
    position: "fixed",
    top: ctxPos.y,
    left: ctxPos.x,
    width: 0,
    height: 0,
    anchorName: "--ctx-mouse-anchor",
  } as React.CSSProperties}
/>
```

`positionTryFallbacks` takes care of viewport overflow — the browser tries `flip-block`, `flip-inline`, and both together before rendering, so the menu always stays on screen without a single line of collision-detection JavaScript.

---

## Default Credentials (after seeding)

| Role | Email | Password |
|---|---|---|
| Admin | `admin@filo.com` | `admin#123` |

---

## Subscription Plans (defaults)

| Plan | Storage | Folders | Nesting | Max File |
|---|---|---|---|---|
| Free | 500 MB | 5 | 2 | 5 MB |
| Silver | 2 GB | 20 | 3 | 25 MB |
| Gold | 5 GB | 50 | 5 | 100 MB |
| Diamond | 10 GB | 200 | 10 | 500 MB |

Plans can be created, edited, and deleted through the admin dashboard.

---

## License

MIT
