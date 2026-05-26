import { loginWithGoogleFn } from '#/modules/auth/auth.api'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'

export const Route = createFileRoute('/login')({
  component: RouteComponent,
})

function RouteComponent() {
  const loginWithGoogle = useServerFn(loginWithGoogleFn)

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <nav className="flex items-center px-8 h-14 border-b border-hairline shrink-0">
        <Link to="/" className="text-ink text-[14px] font-medium tracking-[-0.14px]">
          SheetToAPI
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center px-8 py-16">
        <div className="text-center w-full max-w-sm bg-surface-1 rounded-[20px] p-8 border border-hairline">

          <h1
            className="text-ink font-semibold mb-2 tracking-[-0.05em]"
            style={{ fontSize: '32px', lineHeight: '1.13' }}
          >
            Welcome back
          </h1>
          <p
            className="text-ink-muted text-[15px] tracking-[-0.15px] mb-8"
            style={{ lineHeight: '1.30' }}
          >
            Sign in to manage your Sheet API endpoints
          </p>
          <button
            type="button"
            onClick={() => loginWithGoogle()}
            className="w-full flex items-center justify-center gap-3 border border-hairline rounded-full px-[15px] py-[10px] bg-surface-2 text-ink hover:bg-surface-2/80 transition-colors text-[14px] font-medium leading-none"
          >
            <img
              src="https://www.google.com/favicon.ico"
              alt="Google"
              className="w-4 h-4"
            />
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  )
}
