import { HeroAnimation } from '#/components/HeroAnimation'
import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: Home })

const features = [
  {
    title: 'Full CRUD',
    description: 'GET, POST, PUT, and DELETE. Read rows, append new entries, update by row number, or delete permanently.',
  },
  {
    title: 'Filter, search & sort',
    description: 'Exact match, partial contains, and global search across all columns. Sort by any field, ascending or descending.',
  },
  {
    title: 'Public endpoints',
    description: 'Mark any sheet as public to allow read-only access without an API key — perfect for open data or static sites.',
  },
  {
    title: 'Rate limiting',
    description: 'Every key is capped at 60 requests per minute. Remaining quota and reset time are exposed as response headers.',
  },
  {
    title: 'API key rotation',
    description: 'Regenerate your API key any time from the dashboard. The old key stops working immediately.',
  },
  {
    title: 'No backend needed',
    description: 'Connect your sheet and get a live endpoint instantly — no server, no code, no config.',
  },
]

function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
      <nav className="flex items-center justify-between px-8 h-14 border-b border-white/7 shrink-0">
        <span className="text-white text-sm font-medium">SheetToAPI</span>
        <Link to="/login" className="text-sm font-medium text-white/50 hover:text-white transition-colors">
          Sign in
        </Link>
      </nav>
      <main className="flex-1 flex flex-col items-center justify-center px-8 py-24">
        <HeroAnimation />
      </main>
      <section className="border-t border-white/7 px-8 py-16">
        <div className="max-w-3xl mx-auto">
          <p className="font-mono text-xs text-white/25 uppercase tracking-widest mb-10 text-center">How it works</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Connect your sheet', desc: 'Sign in with Google and select any spreadsheet from your Drive.' },
              { step: '02', title: 'Get your endpoint', desc: 'Copy the generated URL and API key from your dashboard. Ready instantly.' },
              { step: '03', title: 'Start building', desc: 'Make GET, POST, PUT, and DELETE requests from any app, script, or browser.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex flex-col gap-3">
                <span className="font-mono text-2xl font-bold text-white/10">{step}</span>
                <h3 className="text-white font-semibold text-sm">{title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/7 px-8 py-16">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-10 gap-y-12">
          {features.map(f => (
            <div key={f.title} className="flex flex-col gap-3">
              <div className="w-8 h-0.5 bg-green-400" />
              <h3 className="text-white font-semibold text-sm">{f.title}</h3>
              <p className="text-white/40 text-sm leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
