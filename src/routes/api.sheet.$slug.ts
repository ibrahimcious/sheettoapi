import { createFileRoute } from "@tanstack/react-router"
import { prisma } from "#/shared/lib/prisma"
import { getValidAccessToken } from "#/modules/sheets/sheets.utils"

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY

async function getSheetTab(sheetId: string, tab?: string): Promise<string> {
  if (tab) return tab
  const metaResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?key=${GOOGLE_API_KEY}`
  )
  const meta = await metaResponse.json()
  if (!meta.sheets) {
    console.log("meta error:", meta)
    return "Sheet1"
  }
  return meta.sheets[0].properties.title
}

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
      GET: async ({ request, params }) => {
        const { slug } = params
        const url = new URL(request.url)
        const tabParam = url.searchParams.get("tab") ?? undefined

        // Pagination params — default page 1, limit 10
        const page = parseInt(url.searchParams.get("page") ?? "1")
        const limit = parseInt(url.searchParams.get("limit") ?? "10")

        // Extract filter params — anything that isn't a reserved param
        const reservedParams = ['page', 'limit', 'tab']
        const filters: Record<string, string> = {}
        url.searchParams.forEach((value, key) => {
          if (!reservedParams.includes(key)) {
            filters[key] = value
          }
        })

        const sheet = await prisma.sheetConnection.findUnique({ where: { slug } })
        if (!sheet) {
          return new Response(
            JSON.stringify({ error: "Endpoint not found" }),
            { status: 404, headers: { "Content-Type": "application/json" } }
          )
        }

        const apiKey = request.headers.get("X-API-Key")
        if (!apiKey || apiKey !== sheet.apiKey) {
          return new Response(
            JSON.stringify({ error: "Invalid API key" }),
            { status: 401, headers: { "Content-Type": "application/json" } }
          )
        }

        await prisma.sheetConnection.update({
          where: { slug },
          data: { lastUsedAt: new Date() },
        })

        const tab = tabParam ?? (sheet.tabName || null) ?? await getSheetTab(sheet.sheetId, undefined)
        const response = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${sheet.sheetId}/values/${tab}?key=${GOOGLE_API_KEY}`
        )
        const data = await response.json()

        if (data.error) {
          return new Response(
            JSON.stringify({ error: "Failed to fetch sheet data", detail: data.error.message }),
            { status: 502, headers: { "Content-Type": "application/json" } }
          )
        }

        const allRows = rowsToJson(data.values ?? [])

        // Apply filters — case insensitive match
        const filteredRows = Object.keys(filters).length > 0
          ? allRows.filter(row =>
            Object.entries(filters).every(([key, value]) =>
              row[key]?.toLowerCase() === value.toLowerCase()
            )
          )
          : allRows

        // Paginate filtered results
        const total = filteredRows.length
        const totalPages = Math.ceil(total / limit)
        const start = (page - 1) * limit
        const paginatedRows = filteredRows.slice(start, start + limit)

        return new Response(
          JSON.stringify({
            data: paginatedRows,
            pagination: {
              page,
              limit,
              total,
              totalPages,
              hasNext: page < totalPages,
              hasPrev: page > 1,
            }
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      },

      POST: async ({ request, params }) => {
        const { slug } = params
        const sheet = await prisma.sheetConnection.findUnique({ where: { slug } })
        if (!sheet) {
          return new Response(
            JSON.stringify({ error: "Endpoint not found" }),
            { status: 404, headers: { "Content-Type": "application/json" } }
          )
        }
        const apiKey = request.headers.get("X-API-Key")
        if (!apiKey || apiKey !== sheet.apiKey) {
          return new Response(
            JSON.stringify({ error: "Invalid API key" }),
            { status: 401, headers: { "Content-Type": "application/json" } }
          )
        }
        const body = await request.json()
        const accessToken = await getValidAccessToken(sheet.userId)
        const tab = sheet.tabName || await getSheetTab(sheet.sheetId, undefined)
        const metaRes = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${sheet.sheetId}/values/${tab}?key=${GOOGLE_API_KEY}`
        )
        const meta = await metaRes.json()
        const headers: string[] = meta.values?.[0] ?? []
        const rowValues = headers.map((h: string) => body[h] ?? '')
        const appendRes = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${sheet.sheetId}/values/${tab}:append?valueInputOption=USER_ENTERED`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ values: [rowValues] }),
          }
        )
        const appendData = await appendRes.json()
        if (appendData.error) {
          return new Response(
            JSON.stringify({ error: "Failed to append row", detail: appendData.error.message }),
            { status: 502, headers: { "Content-Type": "application/json" } }
          )
        }
        return new Response(
          JSON.stringify({ success: true, data: body }),
          { status: 201, headers: { "Content-Type": "application/json" } }
        )
      },
    },
  },
})
