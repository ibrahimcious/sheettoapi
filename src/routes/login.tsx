import { loginWithGoogleFn } from '#/modules/auth/auth.api'
import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'

export const Route = createFileRoute('/login')({
  component: RouteComponent,
})

function RouteComponent() {
  const loginWithGoogle = useServerFn(loginWithGoogleFn)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-sm w-full text-center">
        <div className="text-4xl mb-4">📊</div>
        <h1 className="text-2xl font-medium mb-2">Welcome back</h1>
        <p className="text-gray-500 mb-8 text-sm">
          Sign in to manage your Sheet API endpoints
        </p>
        <button
          type="button"
          onClick={() => loginWithGoogle()}
          className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-lg px-4 py-2.5 hover:bg-gray-50 transition-colors"
        >
          <img
            src="https://www.google.com/favicon.ico"
            alt="Google"
            className="w-4 h-4"
          />
          <span className="font-medium text-sm">Continue with Google</span>
        </button>
      </div>
    </div>
  )
}
