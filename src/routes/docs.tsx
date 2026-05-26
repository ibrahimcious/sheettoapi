import { createFileRoute, Link } from '@tanstack/react-router'

const BASE_URL = 'https://sheettoapi.net'

export const Route = createFileRoute('/docs')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <nav className="flex items-center justify-between px-8 h-14 border-b border-hairline shrink-0">
        <Link to="/" className="text-ink text-[14px] font-medium tracking-[-0.14px]">
          SheetToAPI
        </Link>
        <Link
          to="/dashboard"
          className="text-[14px] font-medium leading-none px-[15px] py-[10px] rounded-full bg-surface-1 text-ink hover:bg-surface-2 transition-colors"
        >
          Landing Page
        </Link>
      </nav>

      <main className="flex-1 max-w-3xl mx-auto w-full px-8 py-12">
        <h1
          className="text-ink font-semibold mb-2 tracking-[-0.05em]"
          style={{ fontSize: '62px', lineHeight: '1.00' }}
        >
          API Docs
        </h1>
        <p
          className="text-ink-muted tracking-[-0.01em] mb-12"
          style={{ fontSize: '18px', lineHeight: '1.30' }}
        >
          Learn how to use SheetToAPI endpoints.
        </p>

        {/* Base URL */}
        <section className="mb-10">
          <h2
            className="text-ink font-semibold mb-3 tracking-[-0.05em]"
            style={{ fontSize: '22px', lineHeight: '1.20' }}
          >
            Base URL
          </h2>
          <code className="block bg-surface-1 border border-hairline text-ink text-[13px] px-4 py-3 rounded-[10px]">
            {BASE_URL}/api/sheet
          </code>
        </section>

        {/* Authentication */}
        <section className="mb-10">
          <h2
            className="text-ink font-semibold mb-3 tracking-[-0.05em]"
            style={{ fontSize: '22px', lineHeight: '1.20' }}
          >
            Authentication
          </h2>
          <p className="text-ink-muted text-[15px] tracking-[-0.15px] mb-3" style={{ lineHeight: '1.30' }}>
            Include your API key in every request header.
          </p>
          <code className="block bg-surface-1 border border-hairline text-ink text-[13px] px-4 py-3 rounded-[10px]">
            X-API-Key: your-api-key
          </code>
        </section>

        {/* Get all rows */}
        <section className="mb-10">
          <h2
            className="text-ink font-semibold mb-3 tracking-[-0.05em]"
            style={{ fontSize: '22px', lineHeight: '1.20' }}
          >
            Get all rows
          </h2>
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-success/10 text-success text-[12px] font-medium px-2 py-1 rounded-[6px] leading-none">GET</span>
            <code className="text-ink text-[14px]">/api/sheet/{'{slug}'}</code>
          </div>
          <p className="text-ink-muted text-[15px] tracking-[-0.15px] mb-4" style={{ lineHeight: '1.30' }}>
            Returns all rows from the connected sheet as a JSON array.
          </p>

          <p className="text-ink text-[13px] font-medium tracking-[-0.13px] mb-2">Example request:</p>
          <pre className="bg-surface-1 border border-hairline text-ink text-[13px] px-4 py-3 rounded-[10px] mb-4 overflow-x-auto">
            {`curl ${BASE_URL}/api/sheet/my-slug \\
  -H "X-API-Key: your-api-key"`}
          </pre>

          <p className="text-ink text-[13px] font-medium tracking-[-0.13px] mb-2">Example response:</p>
          <pre className="bg-surface-1 border border-hairline text-ink text-[13px] px-4 py-3 rounded-[10px] overflow-x-auto">
            {`[
  { "id": "1", "name": "Tom", "age": "15" },
  { "id": "2", "name": "Alex", "age": "24" }
]`}
          </pre>
        </section>

        {/* Tab parameter */}
        <section className="mb-10">
          <h2
            className="text-ink font-semibold mb-3 tracking-[-0.05em]"
            style={{ fontSize: '22px', lineHeight: '1.20' }}
          >
            Select a specific tab
          </h2>
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-success/10 text-success text-[12px] font-medium px-2 py-1 rounded-[6px] leading-none">GET</span>
            <code className="text-ink text-[14px]">/api/sheet/{'{slug}'}?tab=SheetName</code>
          </div>
          <p className="text-ink-muted text-[15px] tracking-[-0.15px] mb-4" style={{ lineHeight: '1.30' }}>
            Use the{' '}
            <code className="bg-surface-1 border border-hairline-soft text-ink px-1.5 py-0.5 rounded-[4px] text-[13px]">tab</code>
            {' '}query parameter to fetch data from a specific sheet tab.
          </p>
          <pre className="bg-surface-1 border border-hairline text-ink text-[13px] px-4 py-3 rounded-[10px] overflow-x-auto">
            {`curl "${BASE_URL}/api/sheet/my-slug?tab=Sheet2" \\
  -H "X-API-Key: your-api-key"`}
          </pre>
        </section>

        {/* Error responses */}
        <section className="mb-12">
          <h2
            className="text-ink font-semibold mb-4 tracking-[-0.05em]"
            style={{ fontSize: '22px', lineHeight: '1.20' }}
          >
            Error responses
          </h2>
          <div className="flex flex-col gap-3">
            <div className="bg-surface-1 border border-hairline rounded-[10px] p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-[#ff5577]/10 text-[#ff5577] text-[12px] font-medium px-2 py-1 rounded-[6px] leading-none">401</span>
                <code className="text-ink text-[14px]">Invalid API key</code>
              </div>
              <p className="text-ink-muted text-[14px] tracking-[-0.14px]">API key is missing or incorrect.</p>
            </div>
            <div className="bg-surface-1 border border-hairline rounded-[10px] p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-[#ff5577]/10 text-[#ff5577] text-[12px] font-medium px-2 py-1 rounded-[6px] leading-none">404</span>
                <code className="text-ink text-[14px]">Endpoint not found</code>
              </div>
              <p className="text-ink-muted text-[14px] tracking-[-0.14px]">The slug does not exist.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
