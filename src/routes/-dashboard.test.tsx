import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react'
import React from 'react'

const {
  mockInvalidate,
  mockUseLoaderData,
  mockUseRouteContext,
  mockDeleteSheet,
  mockConnectSheet,
  mockGetSheetTabs,
  mockRotateApiKey,
  mockTogglePublic,
} = vi.hoisted(() => ({
  mockInvalidate: vi.fn(),
  mockUseLoaderData: vi.fn(),
  mockUseRouteContext: vi.fn(),
  mockDeleteSheet: vi.fn(),
  mockConnectSheet: vi.fn(),
  mockGetSheetTabs: vi.fn(),
  mockRotateApiKey: vi.fn(),
  mockTogglePublic: vi.fn(),
}))

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: (_path: string) => (config: { component: React.ComponentType }) => ({
    useLoaderData: mockUseLoaderData,
    useRouteContext: mockUseRouteContext,
    component: config.component,
  }),
  redirect: vi.fn(),
  useRouter: () => ({ invalidate: mockInvalidate }),
  Link: ({ children }: any) => children,
}))

vi.mock('@tanstack/react-start', () => ({
  useServerFn: (fn: (...args: unknown[]) => unknown) => fn,
}))

vi.mock('#/modules/auth/auth.api', () => ({
  logoutFn: vi.fn(),
  getSessionFn: vi.fn(),
}))

vi.mock('#/modules/sheets/sheets.api', () => ({
  connectSheetFn: mockConnectSheet,
  getMySheetsFn: vi.fn(),
  deleteSheetFn: mockDeleteSheet,
  getUserSheetsFn: vi.fn(),
  getSheetTabsFn: mockGetSheetTabs,
  rotateApiKeyFn: mockRotateApiKey,
  togglePublicFn: mockTogglePublic,
}))

import { RouteComponent } from './dashboard'

// --- Fixtures ---
// Drive list and connected sheets use distinct names to avoid selector ambiguity
const mockSession = { user: { id: 'u1', name: 'Ibrahim', email: 'test@test.com' } }

const makeSheet = (overrides = {}) => ({
  id: 'sheet-1',
  sheetName: 'Budget 2026',
  slug: 'budget-2026-abc',
  apiKey: 'key-abc-123',
  tabName: 'Summary',
  lastUsedAt: null as Date | null,
  userId: 'u1',
  sheetId: 'gid-budget',
  createdAt: new Date(),
  isPublic: false,
  logs: [] as { id: string; method: string; status: number; createdAt: Date }[],
  _count: { logs: 0 },
  ...overrides,
})

const driveSheets = [
  { id: 'gid-content', name: 'Content Calendar' },
  { id: 'gid-inventory', name: 'Inventory' },
]

const defaultLoaderData = {
  sheets: [makeSheet()],
  userSheets: driveSheets,
  baseUrl: 'https://sheettoapi.net',
}

function setup(loaderData = defaultLoaderData) {
  mockUseLoaderData.mockReturnValue(loaderData)
  mockUseRouteContext.mockReturnValue(mockSession)
  return render(<RouteComponent />)
}

describe('RouteComponent (dashboard)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    })
    mockDeleteSheet.mockResolvedValue(undefined)
    mockConnectSheet.mockResolvedValue(undefined)
    mockGetSheetTabs.mockResolvedValue(['Sheet1', 'Sheet2', 'Data'])
    mockRotateApiKey.mockResolvedValue(undefined)
    mockTogglePublic.mockResolvedValue(undefined)
    mockInvalidate.mockReset()
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  describe('sheet list', () => {
    it('renders the connected sheet name', () => {
      setup()
      // "Budget 2026" only appears in "My Sheets", not in the drive list
      expect(screen.getByText('Budget 2026')).toBeDefined()
    })

    it('shows the tab name', () => {
      setup()
      // Text is split across nodes: use regex to match textContent
      expect(screen.getByText(/Tab:.*Summary/)).toBeDefined()
    })

    it('shows "First tab" when tabName is empty string', () => {
      setup({ ...defaultLoaderData, sheets: [makeSheet({ tabName: '' })] })
      expect(screen.getByText(/Tab:.*First tab/)).toBeDefined()
    })

    it('shows the endpoint URL', () => {
      setup()
      expect(screen.getByText(/budget-2026-abc/)).toBeDefined()
    })

    it('shows the API key', () => {
      setup()
      expect(screen.getByText(/key-abc-123/)).toBeDefined()
    })

    it('shows 0 total requests when no logs', () => {
      setup()
      expect(screen.getByText(/0 total requests/)).toBeDefined()
    })

    it('shows last used date when lastUsedAt is set', () => {
      const sheet = makeSheet({ lastUsedAt: new Date('2026-05-20T10:30:00Z') })
      setup({ ...defaultLoaderData, sheets: [sheet] })
      expect(screen.getByText(/Last used/)).toBeDefined()
    })

    it('shows empty state when no sheets connected', () => {
      setup({ ...defaultLoaderData, sheets: [] })
      expect(screen.getByText('No sheets connected yet.')).toBeDefined()
    })
  })

  describe('copy button', () => {
    it('shows "✓ Copied" after clicking the endpoint copy button', async () => {
      setup()
      const [endpointCopy] = screen.getAllByText('Copy')
      await act(async () => { fireEvent.click(endpointCopy) })
      expect(screen.getByText('✓ Copied')).toBeDefined()
    })

    it('reverts to "Copy" after 2 seconds', async () => {
      setup()
      const [endpointCopy] = screen.getAllByText('Copy')
      await act(async () => { fireEvent.click(endpointCopy) })
      act(() => { vi.advanceTimersByTime(2000) })
      expect(screen.queryByText('✓ Copied')).toBeNull()
    })

    it('writes the endpoint URL to clipboard', async () => {
      setup()
      const [endpointCopy] = screen.getAllByText('Copy')
      await act(async () => { fireEvent.click(endpointCopy) })
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'https://sheettoapi.net/api/sheet/budget-2026-abc'
      )
    })

    it('writes the API key to clipboard', async () => {
      setup()
      const copyButtons = screen.getAllByText('Copy')
      await act(async () => { fireEvent.click(copyButtons[1]) })
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('key-abc-123')
    })
  })

  describe('delete', () => {
    it('shows a confirmation dialog before deleting', () => {
      const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
      setup()
      fireEvent.click(screen.getByText('Delete'))
      expect(confirm).toHaveBeenCalledWith('Delete this sheet connection? This cannot be undone.')
    })

    it('does not call deleteSheetFn when user cancels confirmation', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false)
      setup()
      fireEvent.click(screen.getByText('Delete'))
      expect(mockDeleteSheet).not.toHaveBeenCalled()
    })

    it('calls deleteSheetFn and refreshes router when confirmed', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true)
      setup()
      await act(async () => { fireEvent.click(screen.getByText('Delete')) })
      expect(mockDeleteSheet).toHaveBeenCalledWith({ data: { id: 'sheet-1' } })
      expect(mockInvalidate).toHaveBeenCalled()
    })
  })

  describe('connect sheet flow', () => {
    it('connect button is disabled when no sheet is selected', () => {
      setup()
      const btn = screen.getByText('Connect sheet') as HTMLButtonElement
      expect(btn.disabled).toBe(true)
    })

    it('shows the available Google Drive sheets', () => {
      setup()
      expect(screen.getByText('Content Calendar')).toBeDefined()
      expect(screen.getByText('Inventory')).toBeDefined()
    })

    it('loads and shows tabs when a drive sheet is selected', async () => {
      setup()
      await act(async () => { fireEvent.click(screen.getByText('Inventory')) })
      expect(mockGetSheetTabs).toHaveBeenCalledWith({ data: { sheetId: 'gid-inventory' } })
      expect(screen.getByText('Sheet2')).toBeDefined()
    })

    it('enables connect button after selecting a drive sheet', async () => {
      setup()
      await act(async () => { fireEvent.click(screen.getByText('Inventory')) })
      const btn = screen.getByText('Connect sheet') as HTMLButtonElement
      expect(btn.disabled).toBe(false)
    })

    it('calls connectSheetFn with the selected sheet and tab', async () => {
      setup()
      await act(async () => { fireEvent.click(screen.getByText('Inventory')) })
      fireEvent.click(screen.getByText('Sheet2'))
      await act(async () => { fireEvent.click(screen.getByText('Connect sheet')) })

      expect(mockConnectSheet).toHaveBeenCalledWith({
        data: {
          sheetUrl: 'https://docs.google.com/spreadsheets/d/gid-inventory',
          sheetName: 'Inventory',
          tabName: 'Sheet2',
        },
      })
    })

    it('calls connectSheetFn without tabName when no tab is selected', async () => {
      setup()
      await act(async () => { fireEvent.click(screen.getByText('Inventory')) })
      await act(async () => { fireEvent.click(screen.getByText('Connect sheet')) })

      expect(mockConnectSheet).toHaveBeenCalledWith({
        data: {
          sheetUrl: 'https://docs.google.com/spreadsheets/d/gid-inventory',
          sheetName: 'Inventory',
          tabName: undefined,
        },
      })
    })

    it('shows an error message when connect fails', async () => {
      mockConnectSheet.mockRejectedValueOnce(new Error('Network error'))
      setup()
      await act(async () => { fireEvent.click(screen.getByText('Inventory')) })
      await act(async () => { fireEvent.click(screen.getByText('Connect sheet')) })
      expect(screen.getByText('Failed to connect sheet. Please try again.')).toBeDefined()
    })

    it('invalidates router after successful connect', async () => {
      setup()
      await act(async () => { fireEvent.click(screen.getByText('Inventory')) })
      await act(async () => { fireEvent.click(screen.getByText('Connect sheet')) })
      expect(mockInvalidate).toHaveBeenCalled()
    })
  })

  describe('rotate API key', () => {
    it('shows a confirmation dialog before rotating', () => {
      const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
      setup()
      fireEvent.click(screen.getByText('Rotate'))
      expect(confirm).toHaveBeenCalledWith('Regenerate API key? The current key will stop working immediately.')
    })

    it('does not call rotateApiKeyFn when user cancels', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false)
      setup()
      fireEvent.click(screen.getByText('Rotate'))
      expect(mockRotateApiKey).not.toHaveBeenCalled()
    })

    it('calls rotateApiKeyFn and refreshes router when confirmed', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true)
      setup()
      await act(async () => { fireEvent.click(screen.getByText('Rotate')) })
      expect(mockRotateApiKey).toHaveBeenCalledWith({ data: { id: 'sheet-1' } })
      expect(mockInvalidate).toHaveBeenCalled()
    })
  })

})
