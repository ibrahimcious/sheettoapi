import { createFileRoute, redirect, useRouter, Link } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { connectSheetFn, getMySheetsFn, deleteSheetFn, getUserSheetsFn, getSheetTabsFn, rotateApiKeyFn } from '#/modules/sheets/sheets.api'
import { useState, useEffect } from 'react'
import posthog from 'posthog-js'
import { getSessionFn, logoutFn } from '#/modules/auth/auth.api'
import { Navbar } from '#/components/Navbar'

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

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export function RouteComponent() {
  const logout = useServerFn(logoutFn)
  const connectSheet = useServerFn(connectSheetFn)
  const deleteSheet = useServerFn(deleteSheetFn)
  const getSheetTabs = useServerFn(getSheetTabsFn)
  const rotateApiKey = useServerFn(rotateApiKeyFn)

  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState('')
  const [tabs, setTabs] = useState<string[]>([])
  const [selectedTab, setSelectedTab] = useState('')
  const [selectedSheetId, setSelectedSheetId] = useState('')
  const [selectedSheetName, setSelectedSheetName] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [rotatingId, setRotatingId] = useState<string | null>(null)

  const { sheets, userSheets, baseUrl } = Route.useLoaderData()
  const session = Route.useRouteContext()
  const router = useRouter()

  useEffect(() => {
    if (session?.user) {
      posthog.identify(session.user.id, {
        email: session.user.email,
        name: session.user.name,
      })
    }
  }, [session?.user?.id])

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

  async function handleRotate(id: string) {
    if (!window.confirm('Regenerate API key? The current key will stop working immediately.')) return
    setRotatingId(id)
    try {
      await rotateApiKey({ data: { id } })
      router.invalidate()
    } finally {
      setRotatingId(null)
    }
  }

  async function handleCopy(text: string, key: string) {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }


  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <Navbar
        right={
          <>
            <Link
              to="/docs"
              className="text-sm font-medium text-white/50 hover:text-white transition-colors"
            >
              Docs
            </Link>
            <div className="flex items-center gap-2">
              <div className="size-7 bg-white/10 text-white rounded-full flex items-center justify-center text-xs font-medium border border-white/10 shrink-0">
                {session?.user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-white/50 text-sm">
                {session?.user.name}
              </span>
            </div>
            <button
              type="button"
              onClick={() => logout()}
              className="text-sm font-medium text-white/50 hover:text-white transition-colors"
            >
              Log out
            </button>
          </>
        }
      />

      <main className="flex-1 max-w-3xl mx-auto w-full px-8 py-12">
        {/* Connect a Sheet */}
        <section className="mb-12">
          <h2 className="text-white font-bold text-3xl tracking-tight mb-2">
            Connect a Sheet
          </h2>
          <p className="text-white/40 text-sm mb-6">
            Select a Google Sheet to create an API endpoint.
          </p>

          {/* Sheet picker */}
          <div className="flex flex-col gap-2 mb-4">
            {userSheets.map((sheet) => (
              <button
                key={sheet.id}
                type="button"
                onClick={() => handleSelectSheet(sheet.id, sheet.name)}
                className={`text-left border rounded-lg px-4 py-3 text-sm transition-all ${
                  selectedSheetId === sheet.id
                    ? 'border-green-500/40 bg-green-500/5 text-white shadow-[0_0_0_1px_rgba(74,222,128,0.15)]'
                    : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                {sheet.name}
              </button>
            ))}
            {userSheets.length === 0 && (
              <p className="text-white/40 text-sm">No Google Sheets found.</p>
            )}
          </div>

          {/* Tab selector */}
          {tabs.length > 0 && (
            <div className="mb-6">
              <p className="text-white/40 text-xs font-medium mb-3">Select tab:</p>
              <div className="flex gap-2 flex-wrap">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setSelectedTab(tab)}
                    className={`text-sm font-medium leading-none px-3.5 py-2 rounded-lg transition-colors ${
                      selectedTab === tab
                        ? 'bg-white/10 text-white'
                        : 'border border-white/10 text-white/40 hover:bg-white/5 hover:text-white/70'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleConnect}
            disabled={!selectedSheetId || isConnecting}
            className="font-mono text-sm font-semibold px-5 py-2.5 rounded-lg bg-green-400 text-black hover:bg-green-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isConnecting ? 'Connecting...' : 'Connect sheet'}
          </button>

          {error && (
            <p className="text-[#ff5577] text-sm mt-3">{error}</p>
          )}
        </section>

        {/* My Sheets */}
        <section>
          <h2 className="text-white font-bold text-3xl tracking-tight mb-6">
            My Sheets
          </h2>

          {sheets.length === 0 ? (
            <p className="text-white/40 text-sm">No sheets connected yet.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {sheets.map((sheet) => (
                <div
                  key={sheet.id}
                  className="bg-white/5 border border-white/10 rounded-xl p-6"
                >
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="text-white font-semibold text-xl tracking-tight">
                      {sheet.sheetName}
                    </h3>
                    <button
                      type="button"
                      onClick={() => handleDelete(sheet.id)}
                      className="text-sm text-white/30 hover:text-[#ff5577] transition-colors shrink-0 ml-4"
                    >
                      Delete
                    </button>
                  </div>

                  <p className="text-white/40 text-xs mb-4">
                    Tab: {sheet.tabName || 'First tab'}
                  </p>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-white/40 text-xs shrink-0 w-16">Endpoint</span>
                      <code className="font-mono text-xs text-white/70 bg-white/[0.07] border border-white/10 rounded-lg px-2 py-1 flex-1 min-w-0 truncate">
                        {baseUrl}/api/sheet/{sheet.slug}
                      </code>
                      <button
                        type="button"
                        onClick={() => handleCopy(`${baseUrl}/api/sheet/${sheet.slug}`, `${sheet.id}-endpoint`)}
                        className="text-xs font-medium text-green-400 hover:text-green-300 transition-colors shrink-0"
                      >
                        {copied === `${sheet.id}-endpoint` ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-white/40 text-xs shrink-0 w-16">API Key</span>
                      <code className="font-mono text-xs text-white/70 bg-white/[0.07] border border-white/10 rounded-lg px-2 py-1 flex-1 min-w-0 truncate">
                        {sheet.apiKey}
                      </code>
                      <button
                        type="button"
                        onClick={() => handleCopy(sheet.apiKey, `${sheet.id}-apikey`)}
                        className="text-xs font-medium text-green-400 hover:text-green-300 transition-colors shrink-0"
                      >
                        {copied === `${sheet.id}-apikey` ? '✓ Copied' : 'Copy'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRotate(sheet.id)}
                        disabled={rotatingId === sheet.id}
                        className="text-xs font-medium text-white/30 hover:text-white/60 transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {rotatingId === sheet.id ? 'Rotating...' : 'Rotate'}
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/[0.06]">
                    <p className="text-white/30 text-xs mb-2">
                      {sheet._count.logs} total request{sheet._count.logs !== 1 ? 's' : ''}
                      {sheet.lastUsedAt && (
                        <> · Last used {new Date(sheet.lastUsedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</>
                      )}
                    </p>
                    {sheet.logs.length > 0 && (
                      <div className="flex flex-col gap-1">
                        {sheet.logs.map((log) => (
                          <div key={log.id} className="flex items-center gap-2 text-xs">
                            <span className={`font-mono font-semibold w-12 shrink-0 ${
                              log.method === 'GET' ? 'text-blue-400' :
                              log.method === 'POST' ? 'text-green-400' :
                              log.method === 'PUT' ? 'text-yellow-400' :
                              'text-red-400'
                            }`}>{log.method}</span>
                            <span className={`font-mono ${log.status < 300 ? 'text-white/40' : 'text-[#ff5577]/70'}`}>{log.status}</span>
                            <span className="text-white/20">{timeAgo(new Date(log.createdAt))}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
