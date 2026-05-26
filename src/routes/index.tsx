import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <nav className="flex items-center justify-between px-8 h-14 border-b border-hairline shrink-0">
        <span className="text-ink text-[14px] font-medium tracking-[-0.14px]">SheetToAPI</span>
        <Link
          to="/login"
          className="text-[14px] font-medium text-ink-muted hover:text-ink transition-colors"
        >
          Sign in
        </Link>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-8 py-24 text-center">
        <p className="text-ink-muted text-[13px] font-medium tracking-[-0.13px] mb-6">
          Google Sheets → REST API
        </p>
        <h1
          className="text-ink font-semibold mb-6 tracking-[-0.05em]"
          style={{ fontSize: 'clamp(40px, 7vw, 85px)', lineHeight: 0.95 }}
        >
          Turn sheets into<br />live API endpoints
        </h1>
        <p
          className="text-ink-muted max-w-md mb-10 tracking-[-0.01em]"
          style={{ fontSize: '18px', lineHeight: '1.30' }}
        >
          Connect your Google Sheets and get a REST API endpoint in seconds. No backend required.
        </p>
        <Link
          to="/login"
          className="text-[14px] font-medium leading-none px-[15px] py-[10px] rounded-full bg-white text-black hover:opacity-90 transition-opacity"
        >
          Get started for free
        </Link>

      </main>
    </div>
  )
}
