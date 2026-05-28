# SheetToAPI — Codebase Reference

## What is SheetToAPI?

SheetToAPI turns any Google Sheet into a fully-featured REST API. A user signs in with Google, selects a spreadsheet from their Drive, and instantly gets a live endpoint they can call from any app, script, or browser — no backend, no server, no code to write.

Each connected sheet gets its own URL and API key. The API supports reading, writing, updating, and deleting rows, with filtering, search, sort, pagination, and field selection built in.

---

## Product Features

| Feature | Detail |
|---|---|
| **Full CRUD** | GET (list rows), POST (append row), PUT (update row by number), DELETE (delete row by number) |
| **Pagination** | `?page=1&limit=10` — limit capped at 100 |
| **Sorting** | `?sort=column&order=asc\|desc` — numeric-aware locale sort |
| **Exact filter** | `?column=value` — case-insensitive exact match on any column |
| **Contains filter** | `?column[contains]=value` — partial match on any column |
| **Global search** | `?search=term` — substring match across all column values |
| **Field selection** | `?fields=name,email` — return only specific columns |
| **Tab selection** | `?tab=Sheet2` — query a specific sheet tab |
| **Public endpoints** | Toggle read-only unauthenticated GET access per sheet |
| **API key auth** | Every request requires `X-API-Key` header (except public endpoints) |
| **API key rotation** | Regenerate key from dashboard; old key stops working immediately |
| **Rate limiting** | 60 requests/min per API key, sliding window, with `X-RateLimit-*` headers |
| **CORS** | `Access-Control-Allow-Origin: *` on all API routes, OPTIONS preflight support |
| **Request logs** | Last 100 requests per sheet stored; dashboard shows last 5 with method, status, time |
| **Free tier limit** | 3 sheet connections per user |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | TanStack Start (SSR React, file-based routing) |
| Router | TanStack Router |
| Database | PostgreSQL via Prisma ORM (v7) |
| Auth | Better Auth with Google OAuth |
| Styling | Tailwind CSS v4 |
| Testing | Vitest + React Testing Library |
| Analytics | PostHog |
| Package manager | pnpm v9 |
| Deployment | Docker + GitHub Actions CI/CD |

---

## Project Structure

```
sheettoapi/
├── prisma/
│   ├── schema.prisma           # Database models
│   └── migrations/             # SQL migration files
├── public/
│   ├── og.png                  # og:image for social sharing (1200×630)
│   ├── og.svg                  # Source SVG for og:image
│   └── favicon.ico
├── scripts/
│   └── generate-og.mjs         # Script to regenerate og.png from og.svg
├── src/
│   ├── components/
│   │   ├── HeroAnimation.tsx   # Animated demo on the landing page
│   │   ├── Navbar.tsx          # Shared top navigation bar
│   │   └── PostHogPageView.tsx # PostHog page tracking
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.api.ts     # Server functions: login, logout, getSession
│   │   │   ├── auth.schema.ts  # (empty — no email/password forms)
│   │   │   └── auth.utils.ts   # Better Auth instance configuration
│   │   └── sheets/
│   │       ├── sheets.api.ts   # Server functions: connect, list, delete, rotate, toggle public
│   │       ├── sheets.schema.ts # Zod schemas for sheet server functions
│   │       └── sheets.utils.ts # Shared utilities: json(), CORS, rate limiter, resolveSheet, logRequest
│   ├── routes/
│   │   ├── __root.tsx          # Root layout, meta tags, error boundary, 404 page
│   │   ├── index.tsx           # Landing page
│   │   ├── login.tsx           # Login page (Google OAuth only)
│   │   ├── dashboard.tsx       # Main user dashboard
│   │   ├── docs.tsx            # API documentation page
│   │   ├── api.auth.$.ts       # Passes all /api/auth/* requests to Better Auth
│   │   ├── api.sheet.$slug.ts  # Public API: GET (list) + POST (append)
│   │   ├── api.sheet.$slug.$row.ts  # Public API: PUT (update) + DELETE (delete)
│   │   └── -dashboard.test.tsx # Dashboard component tests
│   ├── shared/
│   │   ├── lib/prisma.ts       # Prisma client singleton
│   │   └── middleware/db.middleware.ts  # TanStack Start middleware: injects db into context
│   ├── router.tsx              # TanStack Router configuration
│   ├── routeTree.gen.ts        # Auto-generated route tree (do not edit)
│   └── styles.css              # Global Tailwind styles
├── Dockerfile
└── package.json
```

---

## Database Schema

### `SheetConnection`
The core model. One row per connected sheet per user.

| Field | Type | Notes |
|---|---|---|
| `id` | String (cuid) | Primary key |
| `userId` | String | FK to User |
| `sheetId` | String | Google Sheets file ID extracted from the URL |
| `sheetName` | String | Display name (from Google Drive) |
| `slug` | String (unique) | URL-safe identifier, e.g. `budget-2026-a1b2c3` |
| `apiKey` | String (unique) | UUID, used in `X-API-Key` header |
| `tabName` | String | Sheet tab to query; empty string = use first tab |
| `isPublic` | Boolean | If true, GET requests skip API key check |
| `lastUsedAt` | DateTime? | Updated on every GET request |
| `createdAt` | DateTime | Auto |

Unique constraint: `(userId, sheetId, tabName)` — one connection per sheet+tab combo per user.

### `RequestLog`
Stores the last 100 API requests per sheet connection.

| Field | Type | Notes |
|---|---|---|
| `id` | String (cuid) | Primary key |
| `sheetConnectionId` | String | FK to SheetConnection (cascade delete) |
| `method` | String | GET, POST, PUT, DELETE |
| `status` | Int | HTTP status code |
| `createdAt` | DateTime | Auto |

Index on `(sheetConnectionId, createdAt)` for efficient per-sheet log queries.

### Auth models
`User`, `Session`, `Account`, `Verification` — managed entirely by Better Auth. Not touched directly except `Account` for reading/refreshing Google OAuth tokens.

---

## Module Breakdown

### `src/shared/lib/prisma.ts`
Creates the Prisma client singleton using `@prisma/adapter-pg` (the native PostgreSQL driver adapter). Wrapped in `createServerOnlyFn` so it never leaks to the client bundle. Reads `DATABASE_URL` from the environment.

### `src/shared/middleware/db.middleware.ts`
A TanStack Start middleware that injects the Prisma client into the server function context as `context.db`. Used by all server functions that need database access via `connectSheetFn`, `getMySheetsFn`, `deleteSheetFn`, etc.

---

### `src/modules/auth/auth.utils.ts`
Configures the Better Auth instance with:
- PostgreSQL via Prisma adapter
- Google OAuth provider requesting `spreadsheets` and `drive.readonly` scopes with `access_type: offline` (gets a refresh token)
- `tanstackStartCookies()` plugin for SSR cookie handling

### `src/modules/auth/auth.api.ts`
Three server functions:
- `loginWithGoogleFn` — initiates Google OAuth, redirects to `/dashboard` on success
- `logoutFn` — signs out and redirects to `/`
- `getSessionFn` — returns the current session or null; used in route `beforeLoad` guards

### `src/routes/api.auth.$.ts`
Catch-all route at `/api/auth/*`. Passes every GET and POST request directly to `auth.handler(request)`. Better Auth handles all the OAuth callback logic internally.

---

### `src/modules/sheets/sheets.utils.ts`
The shared utility layer for all API handlers. Contains:

**`corsHeaders`** — the CORS header object applied to every API response.

**`json(body, status, extraHeaders?)`** — constructs a `Response` with `Content-Type: application/json`, CORS headers, and optional extra headers.

**`checkRateLimit(apiKey)`** — in-memory sliding window rate limiter. Stores an array of timestamps per API key in a module-level `Map`. On each call, filters timestamps older than 60 seconds, checks against the 60-request limit, and returns `{ allowed, limit, remaining, reset }`. The `reset` value is the Unix timestamp when the oldest request in the window expires.

**`resolveSheet(slug, apiKey, allowPublic?)`** — the auth + lookup layer used by every API handler. Finds the sheet by slug, returns a 404 if not found. If `allowPublic` is true and `sheet.isPublic` is true, skips the API key check (used only in GET handlers). Otherwise validates the API key and returns 401 on mismatch.

**`logRequest(sheetConnectionId, method, status)`** — fire-and-forget logging. Inserts a `RequestLog` row, then deletes all but the 100 most recent logs for that sheet. Called via `void logRequest(...).catch(() => {})` so it never blocks the response.

**`getValidAccessToken(userId)`** — reads the user's Google OAuth `accessToken` from the `Account` table. If expired, refreshes it using the `refreshToken` against Google's token endpoint, updates the stored token, and returns the new one. Throws if no account is connected or if refresh fails.

**`getFirstSheetTab(sheetId)`** — fetches the spreadsheet metadata from Google Sheets API and returns the title of the first tab. Falls back to `'Sheet1'` on error.

### `src/modules/sheets/sheets.api.ts`
Server functions called from the dashboard UI:

**`FREE_TIER_SHEET_LIMIT = 3`** — exported constant used by both the server check and the dashboard UI counter.

**`connectSheetFn`** — validates the user is under the free tier limit, extracts the Google Sheets file ID from the URL, generates a slug (`name-lowercased-XXXXXX`), creates a `SheetConnection` row.

**`getMySheetsFn`** — returns the user's connected sheets including the last 5 `RequestLog` entries and `_count.logs` for each. Used to populate the dashboard sheet cards.

**`deleteSheetFn`** — deletes a `SheetConnection` by ID, scoped to the current user.

**`rotateApiKeyFn`** — updates `apiKey` to a new `crypto.randomUUID()`, scoped to the current user.

**`togglePublicFn`** — sets `isPublic` to the provided boolean, scoped to the current user.

**`getUserSheetsFn`** — calls Google Drive API to list the user's Google Sheets files (up to 10, ordered by `modifiedTime desc`). Used to populate the sheet picker in the dashboard.

**`getSheetTabsFn`** — calls Google Sheets API to list all tab names for a given sheet ID. Used when selecting a tab before connecting.

---

### `src/routes/api.sheet.$slug.ts`
The main public API route at `/api/sheet/:slug`.

**OPTIONS** — returns 204 with CORS preflight headers including `Access-Control-Max-Age: 86400`.

**GET** — the read endpoint. Flow:
1. Parse query params: `page`, `limit`, `sort`, `order`, `tab`, `search`, `fields`, plus exact and `[contains]` filters
2. `resolveSheet(slug, apiKey, true)` — public sheets skip auth
3. Build rate limit headers and `respond` closure (logs every response fire-and-forget)
4. Check rate limit — return 429 with `Retry-After: 60` if exceeded
5. Update `lastUsedAt` on the sheet connection
6. Fetch sheet data from Google Sheets API
7. `rowsToJson()` — converts the 2D array response to an array of `{ _row, ...columns }` objects. The header row is detected as the row with the most columns.
8. Apply filters, search, sort
9. Paginate
10. Apply field selection if `?fields=` is present (`_row` is always included)
11. Return `{ data, pagination }`

**POST** — append a row. Reads sheet headers, maps request body keys to column order, calls `values/{tab}:append` on the Google Sheets API.

### `src/routes/api.sheet.$slug.$row.ts`
Row-level operations at `/api/sheet/:slug/:row`. The `:row` param is the `_row` value from the GET response (1-based, not counting the header row).

**OPTIONS** — same as above.

**PUT** — update a row. Reads headers to get column order, maps request body to a row array, writes to `values/{tab}!A{rowNumber+1}` (the +1 accounts for the header row).

**DELETE** — delete a row. Fetches sheet metadata to get the internal numeric `sheetId` of the tab, then calls `spreadsheets/{sheetId}:batchUpdate` with a `deleteDimension` request. The `startIndex` equals `rowNumber` (the +1 header offset and the -1 0-based conversion cancel out).

Both handlers use the same `respond` closure + rate limiting pattern as the GET handler.

---

### `src/routes/dashboard.tsx`
The main authenticated UI. Protected by a `beforeLoad` guard that redirects to `/login` if no session exists.

**Loader** — fetches `getMySheetsFn()` and `getUserSheetsFn()` in parallel. Returns `{ sheets, userSheets, baseUrl }`.

**`DashboardSkeleton`** — shown via `pendingComponent` while the loader runs. Uses `pendingMs: 300` to avoid flashing on fast connections. Renders animated pulse placeholders matching the real layout.

**Sheet picker** — lists the user's Google Drive sheets. Clicking one calls `getSheetTabsFn` to load available tabs. After selecting a sheet (and optionally a tab), "Connect sheet" calls `connectSheetFn`.

**Sheet cards** — each connected sheet shows:
- Sheet name, tab name, Public badge (if `isPublic`)
- Endpoint URL with copy button
- API key with copy + Rotate buttons
- Make public / Make private toggle
- Request stats: total hit count, last used date, last 5 requests with method badge (color-coded), status code, relative time

**`timeAgo(date)`** — converts a date to a human-readable relative string (e.g. `5m ago`, `2h ago`).

---

### `src/routes/__root.tsx`
The root layout, wraps every page.

- Sets `<html lang="en">`, loads fonts, global CSS
- Injects `<PostHogPageView />` for analytics
- Loads TanStack DevTools in dev mode only (lazy loaded)
- **`errorComponent: ErrorPage`** — catches any unhandled render or loader error. Shows the error message, a "Try again" button that calls `reset()`, and a "Go home" link.
- **`notFoundComponent: NotFoundPage`** — styled 404 page with a "Go home" CTA.
- Meta tags: `description`, `og:title`, `og:description`, `og:type`, `og:url`, `og:image` (PNG, 1200×630), `og:image:type`, `twitter:card: summary_large_image`, `twitter:title`, `twitter:description`, `twitter:image`.

### `src/components/PostHogPageView.tsx`
Initializes PostHog once (module-level `initialized` flag to prevent double-init on SSR). Fires `posthog.capture('$pageview')` on every pathname change using `useRouterState`. Reads `VITE_POSTHOG_KEY` from the environment; does nothing if the key is absent.

### `src/components/HeroAnimation.tsx`
The animated live demo on the landing page. Shows a Google Sheet panel on the left and a JSON response panel on the right. Animates row highlighting in the sheet in sync with JSON lines appearing in the response panel, cycling every ~3.5 seconds. Respects `prefers-reduced-motion`.

---

## API Response Shape

### GET `/api/sheet/:slug`
```json
{
  "data": [
    { "_row": "1", "Name": "Ali", "Status": "Published" }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Rate limit headers (on every response)
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 47
X-RateLimit-Reset: 1748390460
```

### Error shape
```json
{ "error": "Invalid API key" }
{ "error": "Rate limit exceeded" }
{ "error": "Endpoint not found" }
```

---

## Authentication Flow

1. User clicks "Continue with Google" on `/login`
2. `loginWithGoogleFn` calls `auth.api.signInSocial({ provider: 'google', callbackURL: '/dashboard' })`
3. Better Auth redirects to Google's OAuth consent screen
4. Google redirects back to `/api/auth/callback/google` (handled by `api.auth.$.ts`)
5. Better Auth stores the user, session, and Google `accessToken` + `refreshToken` in the `Account` table
6. User is redirected to `/dashboard`

The `accessToken` is used for all Google Sheets and Drive API calls. When it expires, `getValidAccessToken()` automatically refreshes it and updates the stored token.

---

## Rate Limiting Implementation

Uses an in-memory sliding window stored in a `Map<apiKey, number[]>` (array of request timestamps). On each request:

1. Filter out timestamps older than 60 seconds
2. If count ≥ 60, return `{ allowed: false, remaining: 0, reset: ... }`
3. Otherwise push the current timestamp and return `{ allowed: true, remaining: 59 - count, reset: ... }`

The `reset` value is derived from the oldest timestamp in the window: `Math.ceil((timestamps[0] + 60000) / 1000)`.

This resets on server restart (acceptable for the current single-server deployment). A Redis-backed implementation would be needed for multi-instance deployments.

---

## Deployment

### Docker
The `Dockerfile` uses `node:lts-alpine` with pnpm v9:
1. Install dependencies with `--frozen-lockfile`
2. `prisma generate` — regenerates the Prisma client from schema
3. `pnpm run build` — runs `vite build`, outputs to `.output/`
4. `CMD` runs `prisma migrate deploy` before starting the server — ensures all pending migrations are applied on every deploy

### CI/CD
GitHub Actions builds and pushes a Docker image to `ghcr.io` on every push to `main`. The VPS pulls the new image and restarts the container with `docker compose up -d`.

### Environment Variables
| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth app client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth app client secret |
| `GOOGLE_API_KEY` | Yes | Google API key for public Sheets reads |
| `APP_URL` | Yes | Base URL (e.g. `https://sheettoapi.net`) |
| `BETTER_AUTH_SECRET` | Yes | Secret for Better Auth session signing |
| `VITE_POSTHOG_KEY` | Optional | PostHog project API key |

---

## Testing

Tests live in `src/routes/-dashboard.test.tsx` (the `-` prefix prevents TanStack Router from treating it as a route). Uses Vitest + React Testing Library.

The test file mocks:
- `@tanstack/react-router` — stubs `createFileRoute`, `useRouter`, `Link`, `redirect`
- `@tanstack/react-start` — stubs `useServerFn` to return functions directly
- `#/modules/auth/auth.api` — stubs session/logout functions
- `#/modules/sheets/sheets.api` — stubs all server functions including `FREE_TIER_SHEET_LIMIT: 3`

26 tests covering: sheet list rendering, copy buttons, delete confirmation, connect sheet flow (tab selection, error handling, router invalidation), API key rotation, and public toggle.
