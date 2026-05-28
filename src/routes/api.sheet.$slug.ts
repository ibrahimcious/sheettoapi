import { createFileRoute } from "@tanstack/react-router"
import { prisma } from "#/shared/lib/prisma"
import { getValidAccessToken, getFirstSheetTab, resolveSheet, json, corsHeaders, logRequest, checkRateLimit } from "#/modules/sheets/sheets.utils"

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY

function rowsToJson(rows: string[][]): Record<string, string>[] {
  if (!rows || rows.length === 0) return []
  const headerRowIndex = rows.reduce(
    (maxIdx: number, row: string[], idx: number, arr: string[][]) =>
      row.length > arr[maxIdx].length ? idx : maxIdx,
    0
  )
  const headers = rows[headerRowIndex]
  return rows
    .slice(headerRowIndex + 1)
    .filter((row: string[]) => row.some((cell: string) => cell !== ""))
    .map((row: string[], i: number) =>
      headers.reduce((obj: Record<string, string>, header: string, idx: number) => {
        obj[header] = row[idx] ?? ""
        return obj
      }, { _row: String(i + 1) } as Record<string, string>)
    )
}

export const Route = createFileRoute("/api/sheet/$slug")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, {
        status: 204,
        headers: { ...corsHeaders, "Access-Control-Max-Age": "86400" },
      }),

      GET: async ({ request, params }) => {
        const { slug } = params
        const url = new URL(request.url)
        const tabParam = url.searchParams.get("tab") ?? undefined

        const page = Math.max(1, Number(url.searchParams.get("page") ?? "1") || 1)
        const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? "10") || 10))
        const sortBy = url.searchParams.get("sort") ?? undefined
        const order = url.searchParams.get("order") === "desc" ? "desc" : "asc"

        const reservedParams = ['page', 'limit', 'tab', 'sort', 'order', 'search']
        const exactFilters: Record<string, string> = {}
        const containsFilters: Record<string, string> = {}
        const globalSearch = url.searchParams.get("search") ?? undefined
        url.searchParams.forEach((value, key) => {
          if (reservedParams.includes(key)) return
          const containsKey = key.match(/^(.+)\[contains\]$/)
          if (containsKey) containsFilters[containsKey[1]] = value
          else exactFilters[key] = value
        })

        const result = await resolveSheet(slug, request.headers.get("X-API-Key"), true)
        if (!result.ok) return result.response
        const { sheet } = result

        const rateLimit = checkRateLimit(sheet.apiKey)
        const rlHeaders = {
          'X-RateLimit-Limit': String(rateLimit.limit),
          'X-RateLimit-Remaining': String(rateLimit.remaining),
          'X-RateLimit-Reset': String(rateLimit.reset),
        }
        const respond = (body: unknown, status = 200, extra: Record<string, string> = {}) => {
          void logRequest(sheet.id, 'GET', status).catch(() => {})
          return json(body, status, { ...rlHeaders, ...extra })
        }

        if (!rateLimit.allowed) return respond({ error: "Rate limit exceeded" }, 429, { 'Retry-After': '60' })

        await prisma.sheetConnection.update({
          where: { slug },
          data: { lastUsedAt: new Date() },
        })

        const tab = tabParam ?? (sheet.tabName || await getFirstSheetTab(sheet.sheetId))
        const response = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${sheet.sheetId}/values/${tab}?key=${GOOGLE_API_KEY}`
        )

        if (!response.ok) return respond({ error: "Failed to fetch sheet data" }, 502)

        const data = await response.json()
        if (data.error) return respond({ error: "Failed to fetch sheet data", detail: data.error.message }, 502)

        const allRows = rowsToJson(data.values ?? [])

        const filteredRows = allRows.filter(row => {
          if (globalSearch) {
            const term = globalSearch.toLowerCase()
            if (!Object.values(row).some(v => v.toLowerCase().includes(term))) return false
          }
          for (const [key, value] of Object.entries(exactFilters)) {
            if (row[key]?.toLowerCase() !== value.toLowerCase()) return false
          }
          for (const [key, value] of Object.entries(containsFilters)) {
            if (!row[key]?.toLowerCase().includes(value.toLowerCase())) return false
          }
          return true
        })

        const sortedRows = sortBy
          ? [...filteredRows].sort((a, b) => {
              const cmp = (a[sortBy] ?? "").localeCompare(b[sortBy] ?? "", undefined, { numeric: true, sensitivity: 'base' })
              return order === "desc" ? -cmp : cmp
            })
          : filteredRows

        const total = sortedRows.length
        const totalPages = Math.ceil(total / limit)
        const start = (page - 1) * limit
        const paginatedRows = sortedRows.slice(start, start + limit)

        return respond({
          data: paginatedRows,
          pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
        })
      },

      POST: async ({ request, params }) => {
        const { slug } = params

        const result = await resolveSheet(slug, request.headers.get("X-API-Key"))
        if (!result.ok) return result.response
        const { sheet } = result

        const rateLimit = checkRateLimit(sheet.apiKey)
        const rlHeaders = {
          'X-RateLimit-Limit': String(rateLimit.limit),
          'X-RateLimit-Remaining': String(rateLimit.remaining),
          'X-RateLimit-Reset': String(rateLimit.reset),
        }
        const respond = (body: unknown, status = 200, extra: Record<string, string> = {}) => {
          void logRequest(sheet.id, 'POST', status).catch(() => {})
          return json(body, status, { ...rlHeaders, ...extra })
        }

        if (!rateLimit.allowed) return respond({ error: "Rate limit exceeded" }, 429, { 'Retry-After': '60' })

        const body = await request.json()
        const accessToken = await getValidAccessToken(sheet.userId)
        const tab = sheet.tabName || await getFirstSheetTab(sheet.sheetId)

        const metaRes = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${sheet.sheetId}/values/${tab}?key=${GOOGLE_API_KEY}`
        )
        if (!metaRes.ok) return respond({ error: "Failed to read sheet headers" }, 502)

        const meta = await metaRes.json()
        const headers: string[] = meta.values?.[0] ?? []
        const rowValues = headers.map((h: string) => body[h] ?? '')

        const appendRes = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${sheet.sheetId}/values/${tab}:append?valueInputOption=USER_ENTERED`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ values: [rowValues] }),
          }
        )
        const appendData = await appendRes.json()
        if (appendData.error) return respond({ error: "Failed to append row", detail: appendData.error.message }, 502)

        return respond({ success: true, data: body }, 201)
      },
    },
  },
})
