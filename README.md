# SheetToAPI

Turn any Google Sheet into a REST API in seconds. No backend required.

## Features

- **Full CRUD** — GET, POST, PUT, DELETE on any sheet tab
- **Filter & search** — exact match, contains, sort, pagination
- **Field selection** — return only the columns you need (`?fields=name,email`)
- **Public endpoints** — share read-only APIs without an API key
- **Rate limiting** — 60 requests/min per API key with standard headers
- **API key rotation** — regenerate keys without losing your endpoint URL
- **Request logs** — per-sheet activity log with method and status tracking

## Tech Stack

- [TanStack Start](https://tanstack.com/start) — SSR React framework
- [Prisma](https://www.prisma.io/) + PostgreSQL — database ORM
- [Better Auth](https://better-auth.com/) — Google OAuth
- [Tailwind CSS](https://tailwindcss.com/) — styling
- [Vitest](https://vitest.dev/) — testing

## Local Development

### Prerequisites

- Node.js 20+
- pnpm 9
- PostgreSQL database
- Google OAuth credentials (Client ID + Secret) with Sheets and Drive scopes

### Setup

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env
# Fill in your values (see Environment Variables below)

# Run database migrations
pnpm prisma migrate dev

# Generate Prisma client
pnpm prisma generate

# Start dev server
pnpm dev
```

App runs at `http://localhost:3000`.

### Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Random secret for session signing (min 32 chars) |
| `BETTER_AUTH_URL` | Base URL of the app (e.g. `http://localhost:3000`) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |

Google OAuth must have these scopes enabled:
- `https://www.googleapis.com/auth/spreadsheets`
- `https://www.googleapis.com/auth/drive.readonly`

### Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm test         # Run tests
pnpm lint         # Lint with Biome
pnpm format       # Format with Biome
pnpm check        # Lint + format check
```

## API Usage

Each connected sheet gets a unique endpoint:

```
https://yourdomain.com/api/sheet/{slug}
```

### Authentication

Pass your API key as a header:

```
X-API-Key: your-api-key
```

Public endpoints (read-only, toggled per sheet) skip authentication on GET requests.

### GET — List rows

```bash
curl https://yourdomain.com/api/sheet/{slug} \
  -H "X-API-Key: your-api-key"
```

Query params:

| Param | Description | Default |
|---|---|---|
| `page` | Page number | `1` |
| `limit` | Rows per page (max 100) | `50` |
| `sort` | Column to sort by | — |
| `order` | `asc` or `desc` | `asc` |
| `tab` | Sheet tab name | first tab |
| `search` | Search across all columns | — |
| `fields` | Comma-separated columns to return | all |
| `[column]` | Exact match filter | — |
| `[column][contains]` | Contains filter | — |

### POST — Add a row

```bash
curl -X POST https://yourdomain.com/api/sheet/{slug} \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice", "email": "alice@example.com"}'
```

### PUT — Update a row

```bash
curl -X PUT https://yourdomain.com/api/sheet/{slug}/{row} \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice Updated"}'
```

### DELETE — Delete a row

```bash
curl -X DELETE https://yourdomain.com/api/sheet/{slug}/{row} \
  -H "X-API-Key: your-api-key"
```

### Rate Limit Headers

Every response includes:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1234567890
```

## Deployment

### Docker

```bash
docker build -t sheettoapi .
docker run -p 3000:3000 --env-file .env sheettoapi
```

The container automatically runs `prisma migrate deploy` on startup before serving traffic.

### Docker Compose

```bash
docker compose up -d
```

Make sure your `.env` file is present with all required variables.

## Testing

```bash
pnpm test
```

Tests use Vitest with mocked server functions. The dashboard test suite covers sheet connection, API key display, public toggle, rate limit display, and request log rendering.

## License

MIT
