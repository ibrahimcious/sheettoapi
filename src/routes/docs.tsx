import { createFileRoute, Link } from '@tanstack/react-router'
import { Navbar } from '#/components/Navbar'

const BASE_URL = 'https://sheettoapi.net'

export const Route = createFileRoute('/docs')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <Navbar
        right={
          <Link
            to="/dashboard"
            className="text-sm font-medium text-white/50 hover:text-white transition-colors"
          >
            Dashboard →
          </Link>
        }
      />

      <main className="flex-1 max-w-3xl mx-auto w-full px-8 py-12">
        <h1 className="text-white font-bold text-5xl tracking-tight mb-2">
          API Docs
        </h1>
        <p className="text-white/40 text-sm mb-12">
          Learn how to use SheetToAPI endpoints.
        </p>

        {/* Base URL */}
        <section className="mb-10">
          <h2 className="text-white font-semibold text-xl tracking-tight mb-3">
            Base URL
          </h2>
          <code className="block bg-white/5 border border-white/10 font-mono text-white/70 text-xs px-4 py-3 rounded-lg">
            {BASE_URL}/api/sheet
          </code>
        </section>

        {/* Authentication */}
        <section className="mb-10">
          <h2 className="text-white font-semibold text-xl tracking-tight mb-3">
            Authentication
          </h2>
          <p className="text-white/40 text-sm mb-3">
            Include your API key in every request header.
          </p>
          <code className="block bg-white/5 border border-white/10 font-mono text-white/70 text-xs px-4 py-3 rounded-lg">
            X-API-Key: your-api-key
          </code>
        </section>

        {/* Get all rows */}
        <section className="mb-10">
          <h2 className="text-white font-semibold text-xl tracking-tight mb-3">
            Get all rows
          </h2>
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-green-500/10 text-green-400 font-mono text-xs font-medium px-2 py-1 rounded-md">GET</span>
            <code className="font-mono text-white/70 text-sm">/api/sheet/{'{slug}'}</code>
          </div>
          <p className="text-white/40 text-sm mb-4">
            Returns all rows from the connected sheet as a JSON array.
          </p>

          <p className="text-white/60 text-xs font-medium mb-2">Example request:</p>
          <pre className="bg-white/5 border border-white/10 font-mono text-white/70 text-xs px-4 py-3 rounded-lg mb-4 overflow-x-auto">
            {`curl ${BASE_URL}/api/sheet/my-slug \\
  -H "X-API-Key: your-api-key"`}
          </pre>

          <p className="text-white/60 text-xs font-medium mb-2">Example response:</p>
          <pre className="bg-white/5 border border-white/10 font-mono text-white/70 text-xs px-4 py-3 rounded-lg overflow-x-auto">
            {`[
  { "id": "1", "name": "Tom", "age": "15" },
  { "id": "2", "name": "Alex", "age": "24" }
]`}
          </pre>
        </section>

        {/* Tab parameter */}
        <section className="mb-10">
          <h2 className="text-white font-semibold text-xl tracking-tight mb-3">
            Select a specific tab
          </h2>
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-green-500/10 text-green-400 font-mono text-xs font-medium px-2 py-1 rounded-md">GET</span>
            <code className="font-mono text-white/70 text-sm">/api/sheet/{'{slug}'}?tab=SheetName</code>
          </div>
          <p className="text-white/40 text-sm mb-4">
            Use the{' '}
            <code className="bg-white/5 border border-white/10 font-mono text-white/70 px-1.5 py-0.5 rounded text-xs">tab</code>
            {' '}query parameter to fetch data from a specific sheet tab.
          </p>
          <pre className="bg-white/5 border border-white/10 font-mono text-white/70 text-xs px-4 py-3 rounded-lg overflow-x-auto">
            {`curl "${BASE_URL}/api/sheet/my-slug?tab=Sheet2" \\
  -H "X-API-Key: your-api-key"`}
          </pre>
        </section>

        {/* Error responses */}
        <section className="mb-12">
          <h2 className="text-white font-semibold text-xl tracking-tight mb-4">
            Error responses
          </h2>
          <div className="flex flex-col gap-3">
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-[#ff5577]/10 text-[#ff5577] font-mono text-xs font-medium px-2 py-1 rounded-md">401</span>
                <code className="font-mono text-white/70 text-sm">Invalid API key</code>
              </div>
              <p className="text-white/40 text-sm">API key is missing or incorrect.</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-[#ff5577]/10 text-[#ff5577] font-mono text-xs font-medium px-2 py-1 rounded-md">404</span>
                <code className="font-mono text-white/70 text-sm">Endpoint not found</code>
              </div>
              <p className="text-white/40 text-sm">The slug does not exist.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
