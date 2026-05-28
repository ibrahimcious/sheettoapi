import { HeadContent, Scripts, createRootRoute, Link } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'
import { PostHogPageView } from '#/components/PostHogPageView'

import appCss from '../styles.css?url'

const DevTools = import.meta.env.DEV
  ? lazy(() =>
      Promise.all([
        import('@tanstack/react-devtools'),
        import('@tanstack/react-router-devtools'),
      ]).then(([{ TanStackDevtools }, { TanStackRouterDevtoolsPanel }]) => ({
        default: function DevToolsInner() {
          return (
            <TanStackDevtools
              config={{ position: 'bottom-right' }}
              plugins={[{ name: 'Tanstack Router', render: <TanStackRouterDevtoolsPanel /> }]}
            />
          )
        },
      }))
    )
  : null

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'SheetToAPI — Turn Google Sheets into REST APIs' },
      { name: 'description', content: 'Turn any Google Sheet into a REST API in seconds. Full CRUD, filtering, sorting, pagination, and rate limiting — no backend needed.' },
      { property: 'og:title', content: 'SheetToAPI — Turn Google Sheets into REST APIs' },
      { property: 'og:description', content: 'Turn any Google Sheet into a REST API in seconds. Full CRUD, filtering, sorting, pagination, and rate limiting — no backend needed.' },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: 'https://sheettoapi.net' },
      { name: 'twitter:card', content: 'summary' },
      { name: 'twitter:title', content: 'SheetToAPI — Turn Google Sheets into REST APIs' },
      { name: 'twitter:description', content: 'Turn any Google Sheet into a REST API in seconds. Full CRUD, filtering, sorting, pagination, and rate limiting — no backend needed.' },
    ],
    links: [
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
      },
      { rel: 'stylesheet', href: appCss },
    ],
  }),
  shellComponent: RootDocument,
  errorComponent: ErrorPage,
  notFoundComponent: NotFoundPage,
})

function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center px-8 text-center">
      <p className="font-mono text-xs text-white/20 mb-4">500</p>
      <h1 className="text-white font-bold text-2xl tracking-tight mb-2">Something went wrong</h1>
      <p className="text-white/40 text-sm mb-8 max-w-sm">
        {error?.message ?? 'An unexpected error occurred.'}
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="font-mono text-sm font-semibold px-5 py-2.5 rounded-lg bg-green-400 text-black hover:bg-green-300 transition-colors"
        >
          Try again
        </button>
        <Link
          to="/"
          className="font-mono text-sm font-medium px-5 py-2.5 rounded-lg border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-colors"
        >
          Go home
        </Link>
      </div>
    </div>
  )
}

function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center px-8 text-center">
      <p className="font-mono text-xs text-white/20 mb-4">404</p>
      <h1 className="text-white font-bold text-2xl tracking-tight mb-2">Page not found</h1>
      <p className="text-white/40 text-sm mb-8">The page you're looking for doesn't exist.</p>
      <Link
        to="/"
        className="font-mono text-sm font-semibold px-5 py-2.5 rounded-lg bg-green-400 text-black hover:bg-green-300 transition-colors"
      >
        Go home
      </Link>
    </div>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <PostHogPageView />
        {DevTools && (
          <Suspense fallback={null}>
            <DevTools />
          </Suspense>
        )}
        <Scripts />
      </body>
    </html>
  )
}
