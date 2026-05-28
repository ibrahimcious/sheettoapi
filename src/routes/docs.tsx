import { createFileRoute, Link } from '@tanstack/react-router'

const BASE_URL = import.meta.env.VITE_APP_URL ?? 'https://sheettoapi.net'

export const Route = createFileRoute('/docs')({
  component: DocsPage,
})

function DocsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">

      {/* Header */}
      <nav className="flex items-center justify-between px-8 h-14 border-b border-white/7">
        <Link to="/" className="text-white text-[14px] font-medium">SheetToAPI</Link>
        <Link to="/dashboard" className="text-[14px] font-medium text-white/50 hover:text-white transition-colors">
          Dashboard
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-8 py-12">
        <h1 className="text-3xl font-bold mb-2">API Documentation</h1>
        <p className="text-white/50 text-sm font-mono mb-10">
          Full CRUD access to your Google Sheets via REST API
        </p>

        {/* Base URL */}
        <Section title="Base URL">
          <Code>{BASE_URL}/api/sheet</Code>
        </Section>

        {/* Authentication */}
        <Section title="Authentication">
          <p className="text-white/60 text-sm mb-3">
            Every request must include your API key in the request header.
            Find your API key on the dashboard after connecting a sheet.
          </p>
          <Code>X-API-Key: your-api-key</Code>
        </Section>

        {/* Public endpoints */}
        <Section title="Public endpoints">
          <p className="text-white/60 text-sm mb-3">
            By default, every request requires an <span className="text-white font-mono">X-API-Key</span> header.
            You can mark any sheet as <span className="text-white">public</span> from the dashboard to allow
            unauthenticated <span className="text-white font-mono">GET</span> requests — no API key needed.
          </p>
          <p className="text-white/60 text-sm mb-3">
            Write operations (POST, PUT, DELETE) always require the API key, even on public sheets.
          </p>
          <div className="mt-3 p-3 bg-green-500/5 border border-green-500/15 rounded-lg">
            <p className="text-green-400 text-xs font-mono">
              To enable: open the dashboard, find your sheet, and click <span className="text-white">Make public</span>.
            </p>
          </div>
          <p className="text-white/40 text-xs font-mono mt-4 mb-2">Example — public sheet, no API key:</p>
          <Code>{`curl "${BASE_URL}/api/sheet/my-slug"`}</Code>
        </Section>

        {/* Rate Limiting */}
        <Section title="Rate limiting">
          <p className="text-white/60 text-sm mb-3">
            Each API key is limited to <span className="text-white font-mono">60 requests per minute</span>.
            Every response includes headers so you can track usage proactively.
          </p>
          <ParamTable
            title="Response headers"
            params={[
              { name: 'X-RateLimit-Limit', type: 'number', default: '60', desc: 'Max requests allowed per minute' },
              { name: 'X-RateLimit-Remaining', type: 'number', default: '—', desc: 'Requests remaining in the current window' },
              { name: 'X-RateLimit-Reset', type: 'number', default: '—', desc: 'Unix timestamp when the window resets' },
              { name: 'Retry-After', type: 'number', default: '—', desc: 'Seconds to wait before retrying (429 only)' },
            ]}
          />
        </Section>

        {/* GET */}
        <Section title="Get all rows">
          <EndpointBadge method="GET" path="/api/sheet/{slug}" />
          <p className="text-white/60 text-sm my-3">
            Returns rows from the connected sheet as a JSON array.
            Supports pagination, sorting, and filtering.
          </p>

          <ParamTable
            title="Query parameters"
            params={[
              { name: 'page', type: 'number', default: '1', desc: 'Page number' },
              { name: 'limit', type: 'number', default: '10', desc: 'Rows per page (max 100)' },
              { name: 'sort', type: 'string', default: '—', desc: 'Column name to sort by' },
              { name: 'order', type: 'string', default: 'asc', desc: 'Sort direction: asc or desc' },
              { name: 'tab', type: 'string', default: 'first tab', desc: 'Sheet tab name' },
              { name: 'search', type: 'string', default: '—', desc: 'Search across all column values (contains)' },
              { name: '[column]', type: 'string', default: '—', desc: 'Exact match filter on a column' },
              { name: '[column][contains]', type: 'string', default: '—', desc: 'Partial match filter on a column' },
              { name: 'fields', type: 'string', default: '—', desc: 'Comma-separated columns to return, e.g. name,email' },
            ]}
          />

          <p className="text-white/40 text-xs font-mono mt-4 mb-2">Example request:</p>
          <Code>{`curl "${BASE_URL}/api/sheet/my-slug?page=1&limit=5&Status=Published" \\
  -H "X-API-Key: your-api-key"

# Partial match on a column
curl "${BASE_URL}/api/sheet/my-slug?Name[contains]=ali" \\
  -H "X-API-Key: your-api-key"

# Search across all columns
curl "${BASE_URL}/api/sheet/my-slug?search=instagram" \\
  -H "X-API-Key: your-api-key"`}</Code>

          <p className="text-white/40 text-xs font-mono mt-4 mb-2">Example response:</p>
          <Code>{`{
  "data": [
    { "_row": "1", "Name": "Ali", "Platform": "Instagram", "Status": "Published" },
    { "_row": "2", "Name": "Budi", "Platform": "TikTok", "Status": "Published" }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 2,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}`}</Code>

          <div className="mt-3 p-3 bg-blue-500/5 border border-blue-500/15 rounded-lg">
            <p className="text-blue-400 text-xs font-mono">
              💡 The <span className="text-white">_row</span> field indicates the row number — use it for PUT and DELETE requests.
            </p>
          </div>
        </Section>

        {/* POST */}
        <Section title="Add a row">
          <EndpointBadge method="POST" path="/api/sheet/{slug}" />
          <p className="text-white/60 text-sm my-3">
            Appends a new row to the sheet. Request body keys must match the sheet column headers.
          </p>

          <p className="text-white/40 text-xs font-mono mt-4 mb-2">Example request:</p>
          <Code>{`curl -X POST ${BASE_URL}/api/sheet/my-slug \\
  -H "X-API-Key: your-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{"Name": "Eko", "Platform": "YouTube", "Status": "Ideation"}'`}</Code>

          <p className="text-white/40 text-xs font-mono mt-4 mb-2">Example response:</p>
          <Code>{`{
  "success": true,
  "data": {
    "Name": "Eko",
    "Platform": "YouTube",
    "Status": "Ideation"
  }
}`}</Code>
        </Section>

        {/* PUT */}
        <Section title="Update a row">
          <EndpointBadge method="PUT" path="/api/sheet/{slug}/{row}" />
          <p className="text-white/60 text-sm my-3">
            Updates a specific row by row number. Use the <span className="text-white font-mono">_row</span> value
            from the GET response to identify which row to update.
          </p>

          <p className="text-white/40 text-xs font-mono mt-4 mb-2">Example request:</p>
          <Code>{`curl -X PUT ${BASE_URL}/api/sheet/my-slug/2 \\
  -H "X-API-Key: your-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{"Name": "Budi Updated", "Platform": "TikTok", "Status": "Done"}'`}</Code>

          <p className="text-white/40 text-xs font-mono mt-4 mb-2">Example response:</p>
          <Code>{`{
  "success": true,
  "row": 2,
  "data": {
    "Name": "Budi Updated",
    "Platform": "TikTok",
    "Status": "Done"
  }
}`}</Code>
        </Section>

        {/* DELETE */}
        <Section title="Delete a row">
          <EndpointBadge method="DELETE" path="/api/sheet/{slug}/{row}" />
          <p className="text-white/60 text-sm my-3">
            Permanently deletes a row from the sheet. Rows below the deleted row shift up automatically.
          </p>

          <p className="text-white/40 text-xs font-mono mt-4 mb-2">Example request:</p>
          <Code>{`curl -X DELETE ${BASE_URL}/api/sheet/my-slug/2 \\
  -H "X-API-Key: your-api-key"`}</Code>

          <p className="text-white/40 text-xs font-mono mt-4 mb-2">Example response:</p>
          <Code>{`{
  "success": true,
  "row": 2
}`}</Code>
        </Section>

        {/* Error responses */}
        <Section title="Error responses">
          <div className="flex flex-col gap-2">
            <ErrorRow status="400" message="Invalid row number" desc="Row param is not a valid number" />
            <ErrorRow status="401" message="Invalid API key" desc="API key is missing or incorrect" />
            <ErrorRow status="404" message="Endpoint not found" desc="The slug does not exist" />
            <ErrorRow status="429" message="Rate limit exceeded" desc="60 requests/min limit reached — check Retry-After header" />
            <ErrorRow status="502" message="Failed to fetch sheet data" desc="Google Sheets API returned an error" />
          </div>
        </Section>

      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h2 className="text-lg font-semibold mb-4 pb-3 border-b border-white/7">{title}</h2>
      {children}
    </div>
  )
}

function EndpointBadge({ method, path }: { method: string; path: string }) {
  const colors: Record<string, string> = {
    GET: 'bg-green-500/10 text-green-400 border-green-500/20',
    POST: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    PUT: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    DELETE: 'bg-red-500/10 text-red-400 border-red-500/20',
  }
  return (
    <div className="flex items-center gap-2">
      <span className={`font-mono text-xs font-bold px-2 py-1 rounded border ${colors[method]}`}>
        {method}
      </span>
      <code className="font-mono text-sm text-white/70">{path}</code>
    </div>
  )
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <pre className="bg-white/[0.03] border border-white/7 rounded-lg p-4 font-mono text-xs text-white/70 overflow-x-auto leading-relaxed">
      {children}
    </pre>
  )
}

function ParamTable({ title, params }: {
  title: string
  params: { name: string; type: string; default: string; desc: string }[]
}) {
  return (
    <div className="mt-3">
      <p className="text-white/40 text-xs font-mono mb-2">{title}:</p>
      <div className="border border-white/7 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/7 bg-white/[0.02]">
              <th className="font-mono text-[0.65rem] text-white/30 px-3 py-2 text-left">Param</th>
              <th className="font-mono text-[0.65rem] text-white/30 px-3 py-2 text-left">Type</th>
              <th className="font-mono text-[0.65rem] text-white/30 px-3 py-2 text-left">Default</th>
              <th className="font-mono text-[0.65rem] text-white/30 px-3 py-2 text-left">Description</th>
            </tr>
          </thead>
          <tbody>
            {params.map((p, i) => (
              <tr key={i} className="border-b border-white/7 last:border-0">
                <td className="font-mono text-xs text-green-400 px-3 py-2">{p.name}</td>
                <td className="font-mono text-xs text-blue-400 px-3 py-2">{p.type}</td>
                <td className="font-mono text-xs text-white/30 px-3 py-2">{p.default}</td>
                <td className="font-mono text-xs text-white/60 px-3 py-2">{p.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ErrorRow({ status, message, desc }: { status: string; message: string; desc: string }) {
  const code = parseInt(status)
  const color = code >= 500 ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
    : code === 429 ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
    : 'bg-red-500/10 text-red-400 border-red-500/20'
  return (
    <div className="flex items-start gap-3 p-3 border border-white/7 rounded-lg">
      <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded border flex-shrink-0 ${color}`}>
        {status}
      </span>
      <div>
        <p className="font-mono text-xs text-white/80">{message}</p>
        <p className="font-mono text-xs text-white/40 mt-0.5">{desc}</p>
      </div>
    </div>
  )
}
