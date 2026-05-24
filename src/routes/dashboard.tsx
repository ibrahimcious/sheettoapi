import { getSessionServerFn, logoutServerFn } from '#/modules/auth/auth.api'
import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { connectSheetFn, getMySheetsFn, deleteSheetFn } from '#/modules/sheets/sheets.api'
import { useState } from 'react'


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
  },
  loader: async () => {
    const sheets = await getMySheetsFn()
    return { sheets }
  }
})

function RouteComponent() {
  const logoutServerFnHandler = useServerFn(logoutServerFn)
  const connectSheet = useServerFn(connectSheetFn)
  const deleteSheet = useServerFn(deleteSheetFn)
  const { sheets } = Route.useLoaderData()
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [name, setName] = useState('')

  const session = Route.useRouteContext()
  async function handleLogout() {
    await logoutServerFnHandler()
  }
  async function handleConnect() {
    await connectSheet({ data: { sheetUrl: url, sheetName: name } })
    setUrl('')
    setName('')
    router.invalidate()
  }
  async function handleDelete(id: string) {
    await deleteSheet({ data: { id } })
    router.invalidate()
  }
  return (
    <div>
      <header className='flex justify-between p-4 bg-gray-50 border-b border-gray-200'>
        <div>Sheet to API</div>
        <div className='flex gap-2 items-center'>
          <div className='size-6 bg-blue-600 text-white rounded-full flex justify-center items-center'>
            {session?.user.name.charAt(0)}
          </div>
          <div>{session?.user.name}</div>
          <button type='button' onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <main className='p-8'>
        <h2 className='text-xl font-bold mb-4'>Connect a Sheet</h2>
        <div className='flex gap-2 mb-8'>
          <input
            placeholder='Google Sheet URL'
            value={url}
            onChange={e => setUrl(e.target.value)}
            className='border p-2 w-96'
          />
          <input
            placeholder='Sheet name'
            value={name}
            onChange={e => setName(e.target.value)}
            className='border p-2'
          />
          <button
            type='button'
            onClick={handleConnect}
            className='bg-blue-600 text-white px-4 py-2'
          >
            Connect
          </button>
        </div>

        <h2 className='text-xl font-bold mb-4'>My Sheets</h2>
        <div className='flex flex-col gap-4'>
          {sheets.map(sheet => (
            <div key={sheet.id} className='border p-4 rounded'>
              <p className='font-bold'>{sheet.sheetName}</p>
              <p className='text-sm text-gray-500'>
                Endpoint: https://sheettoapi.net/api/{sheet.slug}
              </p>
              <p className='text-sm text-gray-500'>
                API Key: {sheet.apiKey}
              </p>
              <button
                type='button'
                onClick={() => handleDelete(sheet.id)}
                className='text-red-500 text-sm mt-2'
              >
                Delete
              </button>
            </div>
          ))}
          {sheets.length === 0 && (
            <p className='text-gray-400'>No sheets connected yet.</p>
          )}
        </div>
      </main>
    </div>
  )
}
