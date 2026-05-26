import { getSessionServerFn, logoutServerFn } from '#/modules/auth/auth.api'
import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { connectSheetFn, getMySheetsFn, deleteSheetFn, getUserSheetsFn, getSheetTabsFn } from '#/modules/sheets/sheets.api'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/dashboard')({
  component: RouteComponent,

  // Protect the route — redirect to login if user is not authenticated
  beforeLoad: async () => {
    const session = await getSessionServerFn()
    if (!session) {
      throw redirect({ to: "/login" })
    }
    return session
  },

  // Load data in parallel before rendering the component
  loader: async () => {
    const [sheets, userSheets] = await Promise.all([
      getMySheetsFn(),      // fetch user's connected sheets from DB
      getUserSheetsFn()     // fetch user's 10 latest sheets from Google Drive
    ])
    return { sheets, userSheets }
  }
})

function RouteComponent() {
  // Server functions wrapped for client-side use
  const logoutServerFnHandler = useServerFn(logoutServerFn)
  const connectSheet = useServerFn(connectSheetFn)
  const deleteSheet = useServerFn(deleteSheetFn)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState('')


  // Data from loader
  const { sheets, userSheets } = Route.useLoaderData()

  // Session from beforeLoad return value
  const session = Route.useRouteContext()

  const router = useRouter()

  // Track which sheet tab the user select
  const getSheetTabs = useServerFn(getSheetTabsFn)
  const [tabs, setTabs] = useState<string[]>([])
  const [selectedTab, setSelectedTab] = useState('')

  // Track which sheet the user has selected from the list
  const [selectedSheetId, setSelectedSheetId] = useState('')
  const [selectedSheetName, setSelectedSheetName] = useState('')

  async function handleLogout() {
    await logoutServerFnHandler()
  }

  // Set selected sheet when user clicks on a sheet from the list
  async function handleSelectSheet(id: string, name: string) {
    setSelectedSheetId(id)
    setSelectedSheetName(name)
    setSelectedTab('')

    // Fetch tabs for selected sheet
    const sheetTabs = await getSheetTabs({ data: { sheetId: id } })
    setTabs(sheetTabs)
  }

  // Connect the selected sheet — creates a SheetConnection in DB
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
  // Delete a sheet connection from DB
  async function handleDelete(id: string) {
    await deleteSheet({ data: { id } })
    router.invalidate()
  }

  // Copy text to clipboard and notify user
  async function handleCopy(text: string) {
    await navigator.clipboard.writeText(text)
    alert('Copied!')
  }

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      router.invalidate()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div>
      {/* Header with user info and logout */}
      <header className='flex justify-between p-4 bg-gray-50 border-b border-gray-200'>
        <div>Sheet to API</div>
        <div className='flex gap-2 items-center'>
          {/* Avatar — first letter of user's name */}
          <div className='size-6 bg-blue-600 text-white rounded-full flex justify-center items-center'>
            {session?.user.name.charAt(0)}
          </div>
          <div>{session?.user.name}</div>
          <button type='button' onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <main className='p-8'>
        {/* Section 1: Connect a new sheet */}
        <h2 className='text-xl font-bold mb-4'>Connect a Sheet</h2>

        <div className='flex flex-col gap-2 mb-8'>
          <p className='text-sm text-gray-500'>Select from your Google Sheets:</p>

          {/* List of user's Google Sheets fetched from Drive API */}
          <div className='flex flex-col gap-2'>
            {userSheets.map((sheet) => (
              <div
                key={sheet.id}
                onClick={() => handleSelectSheet(sheet.id, sheet.name)}
                // Highlight selected sheet
                className={`border p-3 rounded cursor-pointer hover:bg-gray-50 ${selectedSheetId === sheet.id ? 'border-blue-600 bg-blue-50' : ''}`}
              >
                {sheet.name}
              </div>
            ))}
          </div>

          {/* Tab selector — shown after user selects a sheet */}
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

          {/* Disabled until a sheet is selected */}
          <button
            type='button'
            onClick={handleConnect}
            disabled={!selectedSheetId || isConnecting}
            className='bg-blue-600 text-white px-4 py-2 w-fit disabled:opacity-50'
          >
            {isConnecting ? 'Connecting...' : 'Connect Selected Sheet'}
          </button>
          {/* Error message */}
          {error && (
            <p className='text-red-500 text-sm'>{error}</p>
          )}
        </div>

        {/* Section 2: List of connected sheets with their endpoints */}
        <h2 className='text-xl font-bold mb-4'>My Sheets</h2>
        <div className='flex flex-col gap-4'>
          {sheets.map(sheet => (
            <div key={sheet.id} className='border p-4 rounded'>
              <p className='font-bold'>{sheet.sheetName}</p>

              {/* Show which tab is being used */}
              <p className='text-sm text-gray-400'>
                Tab: {sheet.tabName ?? 'First tab'}
              </p>

              {/* Public API endpoint URL with copy button */}
              <div className='flex items-center gap-2 mt-2'>
                <p className='text-sm text-gray-500'>
                  Endpoint: https://sheettoapi.net/api/sheet/{sheet.slug}
                </p>
                <button
                  type='button'
                  onClick={() => handleCopy(`https://sheettoapi.net/api/sheet/${sheet.slug}`)}
                  className='text-blue-600 text-xs'
                >
                  Copy
                </button>
              </div>

              {/* Last used timestamp */}
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

              {/* API key for authentication with copy button */}
              <div className='flex items-center gap-2 mt-1'>
                <p className='text-sm text-gray-500'>
                  API Key: {sheet.apiKey}
                </p>
                <button
                  type='button'
                  onClick={() => handleCopy(sheet.apiKey)}
                  className='text-blue-600 text-xs'
                >
                  Copy
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

          {/* Empty state */}
          {sheets.length === 0 && (
            <p className='text-gray-400'>No sheets connected yet.</p>
          )}
        </div>
      </main>
    </div>
  )
}
