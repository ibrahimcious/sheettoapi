import { getSessionServerFn, logoutServerFn } from '#/modules/auth/auth.api'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'

export const Route = createFileRoute('/dashboard')({
  component: RouteComponent,
  beforeLoad: async () => {
    const session = await getSessionServerFn()
    if (!session) {
      throw redirect({
        to: "/login"
      })
    }
    return session
  }
})

function RouteComponent() {
  const logoutServerFnHandler = useServerFn(logoutServerFn)
  const session = Route.useRouteContext()
  async function handleLogout() {
    await logoutServerFnHandler()
  }
  return (
    <div>

      <header className='flex justify-between p-4 bg-gray-50 border-b border-gray-200'>
        <div>Sheet to API</div>
        <div className='flex gap-2 items-center'>
          <div className='size-6 bg-blue-600 text-white rounded-full flex justify-center items-center'>{session?.user.name.charAt(0)}</div>
          <div>{session?.user.name}</div>
          <button type='button' onClick={handleLogout}>Logout</button>
        </div>
      </header>
    </div>
  )
}
