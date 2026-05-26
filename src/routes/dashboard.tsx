import { createFileRoute, redirect, useRouter, Link } from '@tanstack/react-router'
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
    <div className="min-h-screen bg-canvas flex flex-col">
      {/* Nav */}
      <header className="flex items-center justify-between px-8 h-14 border-b border-hairline shrink-0">
        <Link to="/" className="text-ink text-[14px] font-medium tracking-[-0.14px]">
          SheetToAPI
        </Link>
        <div className="flex items-center gap-3">
          <Link
            to="/docs"
            className="text-ink-muted text-[14px] font-medium tracking-[-0.14px] hover:text-ink transition-colors"
          >
            Docs
          </Link>
          <div className="flex items-center gap-2">
            <div className="size-7 bg-surface-2 text-ink rounded-full flex items-center justify-center text-[12px] font-medium border border-hairline shrink-0">
              {session?.user.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-ink-muted text-[13px] tracking-[-0.13px]">
              {session?.user.name}
            </span>
          </div>
          <button
            type="button"
            onClick={() => logout()}
            className="text-[14px] font-medium leading-none px-[15px] py-[10px] rounded-full bg-surface-1 text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-8 py-12">
        {/* Connect a Sheet */}
        <section className="mb-12">
          <h2
            className="text-ink font-semibold mb-2 tracking-[-0.05em]"
            style={{ fontSize: '32px', lineHeight: '1.13' }}
          >
            Connect a Sheet
          </h2>
          <p className="text-ink-muted text-[15px] tracking-[-0.15px] mb-6" style={{ lineHeight: '1.30' }}>
            Select a Google Sheet to create an API endpoint.
          </p>

          {/* Sheet picker */}
          <div className="flex flex-col gap-2 mb-4">
            {userSheets.map((sheet) => (
              <button
                key={sheet.id}
                type="button"
                onClick={() => handleSelectSheet(sheet.id, sheet.name)}
                className={`text-left border rounded-[10px] px-4 py-3 text-[15px] tracking-[-0.15px] transition-all ${
                  selectedSheetId === sheet.id
                    ? 'border-[#0099ff]/40 bg-[#0099ff]/5 text-ink shadow-[0_0_0_1px_rgba(0,153,255,0.15)]'
                    : 'border-hairline bg-surface-1 text-ink hover:bg-surface-2'
                }`}
              >
                {sheet.name}
              </button>
            ))}
            {userSheets.length === 0 && (
              <p className="text-ink-muted text-[14px] tracking-[-0.14px]">No Google Sheets found.</p>
            )}
          </div>

          {/* Tab selector */}
          {tabs.length > 0 && (
            <div className="mb-6">
              <p className="text-ink-muted text-[13px] font-medium tracking-[-0.13px] mb-3">Select tab:</p>
              <div className="flex gap-2 flex-wrap">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setSelectedTab(tab)}
                    className={`text-[14px] font-medium leading-none px-[14px] py-[8px] rounded-full transition-colors ${
                      selectedTab === tab
                        ? 'bg-surface-2 text-ink'
                        : 'bg-canvas border border-hairline text-ink-muted hover:bg-surface-1 hover:text-ink'
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
            className="text-[14px] font-medium leading-none px-[15px] py-[10px] rounded-full bg-white text-black hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isConnecting ? 'Connecting...' : 'Connect sheet'}
          </button>

          {error && (
            <p className="text-[#ff5577] text-[13px] tracking-[-0.13px] mt-3">{error}</p>
          )}
        </section>

        {/* My Sheets */}
        <section>
          <h2
            className="text-ink font-semibold mb-6 tracking-[-0.05em]"
            style={{ fontSize: '32px', lineHeight: '1.13' }}
          >
            My Sheets
          </h2>

          {sheets.length === 0 ? (
            <p className="text-ink-muted text-[15px] tracking-[-0.15px]">No sheets connected yet.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {sheets.map((sheet) => (
                <div
                  key={sheet.id}
                  className="bg-surface-1 border border-hairline rounded-[20px] p-6"
                >
                  <div className="flex items-start justify-between mb-1">
                    <h3
                      className="text-ink font-semibold tracking-[-0.05em]"
                      style={{ fontSize: '22px', lineHeight: '1.20' }}
                    >
                      {sheet.sheetName}
                    </h3>
                    <button
                      type="button"
                      onClick={() => handleDelete(sheet.id)}
                      className="text-[13px] text-ink-muted hover:text-[#ff5577] transition-colors tracking-[-0.13px] shrink-0 ml-4"
                    >
                      Delete
                    </button>
                  </div>

                  <p className="text-ink-muted text-[13px] tracking-[-0.13px] mb-4">
                    Tab: {sheet.tabName || 'First tab'}
                  </p>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-ink-muted text-[13px] tracking-[-0.13px] shrink-0 w-16">Endpoint</span>
                      <code className="text-ink text-[13px] bg-surface-2 border border-hairline-soft rounded-[6px] px-2 py-1 flex-1 min-w-0 truncate">
                        {baseUrl}/api/sheet/{sheet.slug}
                      </code>
                      <button
                        type="button"
                        onClick={() => handleCopy(`${baseUrl}/api/sheet/${sheet.slug}`, `${sheet.id}-endpoint`)}
                        className="text-[13px] font-medium text-accent hover:opacity-70 transition-opacity shrink-0"
                      >
                        {copied === `${sheet.id}-endpoint` ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-ink-muted text-[13px] tracking-[-0.13px] shrink-0 w-16">API Key</span>
                      <code className="text-ink text-[13px] bg-surface-2 border border-hairline-soft rounded-[6px] px-2 py-1 flex-1 min-w-0 truncate">
                        {sheet.apiKey}
                      </code>
                      <button
                        type="button"
                        onClick={() => handleCopy(sheet.apiKey, `${sheet.id}-apikey`)}
                        className="text-[13px] font-medium text-accent hover:opacity-70 transition-opacity shrink-0"
                      >
                        {copied === `${sheet.id}-apikey` ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <p className="text-ink-muted text-[12px] tracking-[-0.12px] mt-4">
                    Last used:{' '}
                    {sheet.lastUsedAt
                      ? new Date(sheet.lastUsedAt).toLocaleDateString('en-US', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Never'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
