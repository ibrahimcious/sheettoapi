import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { connectSheetFn, getMySheetsFn, deleteSheetFn, getUserSheetsFn, getSheetTabsFn } from '#/modules/sheets/sheets.api'
import { useEffect, useState } from 'react'
import { getSessionFn, logoutFn } from '#/modules/auth/auth.api'

export const Route = createFileRoute('/dashboard')({
  component: RouteComponent,

  beforeLoad: async () => {
    const session = await getSessionFn()
    if (!session) throw redirect({ to: "/login" })
    return session
  },

  loader: async () => {
    const [sheets, userSheets] = await Promise.all([
      getMySheetsFn(),
      getUserSheetsFn(),
    ])
    const baseUrl = process.env.APP_URL ?? 'https://sheettoapi.net'
    return { sheets, userSheets, baseUrl }
  }
})

export function RouteComponent() {
  const logout = useServerFn(logoutFn)
  const connectSheet = useServerFn(connectSheetFn)
  const deleteSheet = useServerFn(deleteSheetFn)
  const getSheetTabs = useServerFn(getSheetTabsFn)

  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState('')
  const [tabs, setTabs] = useState<string[]>([])
  const [selectedTab, setSelectedTab] = useState('')
  const [selectedSheetId, setSelectedSheetId] = useState('')
  const [selectedSheetName, setSelectedSheetName] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  const { sheets, userSheets, baseUrl } = Route.useLoaderData()
  const session = Route.useRouteContext()
  const router = useRouter()

  async function handleSelectSheet(id: string, name: string) {
    setSelectedSheetId(id)
    setSelectedSheetName(name)
    setSelectedTab('')
    const sheetTabs = await getSheetTabs({ data: { sheetId: id } })
    setTabs(sheetTabs)
  }

  async function handleConnect() {
    if (!selectedSheetId) return
    setIsConnecting(true)
    setError('')
    try {
      const sheetUrl = `https://docs.google.com/spreadsheets/d/${selectedSheetId}`
      await connectSheet({ data: { sheetUrl, sheetName: selectedSheetName, tabName: selectedTab || undefined } })
      setSelectedSheetId('')
      setSelectedSheetName('')
      setSelectedTab('')
      setTabs([])
      router.invalidate()
    } catch (e) {
      setError('Failed to connect sheet. Please try again.')
    } finally {
      setIsConnecting(false)
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this sheet connection? This cannot be undone.')) return
    await deleteSheet({ data: { id } })
    router.invalidate()
  }

  async function handleCopy(text: string, key: string) {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  useEffect(() => {
    const interval = setInterval(() => router.invalidate(), 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div>
      <header className='flex justify-between p-4 bg-gray-50 border-b border-gray-200'>
        <div>Sheet to API</div>
        <div className='flex gap-2 items-center'>
          <div className='size-6 bg-blue-600 text-white rounded-full flex justify-center items-center'>
            {session?.user.name.charAt(0)}
          </div>
          <div>{session?.user.name}</div>
          <button type='button' onClick={() => logout()}>Logout</button>
        </div>
      </header>

      <main className='p-8'>
        <h2 className='text-xl font-bold mb-4'>Connect a Sheet</h2>

        <div className='flex flex-col gap-2 mb-8'>
          <p className='text-sm text-gray-500'>Select from your Google Sheets:</p>

          <div className='flex flex-col gap-2'>
            {userSheets.map((sheet) => (
              <div
                key={sheet.id}
                onClick={() => handleSelectSheet(sheet.id, sheet.name)}
                className={`border p-3 rounded cursor-pointer hover:bg-gray-50 ${selectedSheetId === sheet.id ? 'border-blue-600 bg-blue-50' : ''}`}
              >
                {sheet.name}
              </div>
            ))}
          </div>

          {tabs.length > 0 && (
            <div className='flex flex-col gap-2'>
              <p className='text-sm text-gray-500'>Select tab:</p>
              <div className='flex gap-2 flex-wrap'>
                {tabs.map(tab => (
                  <button
                    key={tab}
                    type='button'
                    onClick={() => setSelectedTab(tab)}
                    className={`border px-3 py-1.5 rounded text-sm ${selectedTab === tab ? 'border-blue-600 bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type='button'
            onClick={handleConnect}
            disabled={!selectedSheetId || isConnecting}
            className='bg-blue-600 text-white px-4 py-2 w-fit disabled:opacity-50'
          >
            {isConnecting ? 'Connecting...' : 'Connect Selected Sheet'}
          </button>

          {error && <p className='text-red-500 text-sm'>{error}</p>}
        </div>

        <h2 className='text-xl font-bold mb-4'>My Sheets</h2>
        <div className='flex flex-col gap-4'>
          {sheets.map(sheet => (
            <div key={sheet.id} className='border p-4 rounded'>
              <p className='font-bold'>{sheet.sheetName}</p>

              <p className='text-sm text-gray-400'>
                Tab: {sheet.tabName || 'First tab'}
              </p>

              <div className='flex items-center gap-2 mt-2'>
                <p className='text-sm text-gray-500'>
                  Endpoint: {baseUrl}/api/sheet/{sheet.slug}
                </p>
                <button
                  type='button'
                  onClick={() => handleCopy(`${baseUrl}/api/sheet/${sheet.slug}`, `${sheet.id}-endpoint`)}
                  className='text-blue-600 text-xs'
                >
                  {copied === `${sheet.id}-endpoint` ? 'Copied!' : 'Copy'}
                </button>
              </div>

              <p className='text-sm text-gray-500 mt-1'>
                Last used: {sheet.lastUsedAt
                  ? new Date(sheet.lastUsedAt).toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                  : 'Never'}
              </p>

              <div className='flex items-center gap-2 mt-1'>
                <p className='text-sm text-gray-500'>
                  API Key: {sheet.apiKey}
                </p>
                <button
                  type='button'
                  onClick={() => handleCopy(sheet.apiKey, `${sheet.id}-apikey`)}
                  className='text-blue-600 text-xs'
                >
                  {copied === `${sheet.id}-apikey` ? 'Copied!' : 'Copy'}
                </button>
              </div>

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
