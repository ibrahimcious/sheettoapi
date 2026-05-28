import { createFileRoute } from "@tanstack/react-router"
import { getValidAccessToken, getFirstSheetTab, resolveSheet, json, corsHeaders, logRequest, checkRateLimit } from "#/modules/sheets/sheets.utils"

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY

export const Route = createFileRoute("/api/sheet/$slug/$row")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, {
        status: 204,
        headers: { ...corsHeaders, "Access-Control-Max-Age": "86400" },
      }),

      PUT: async ({ request, params }) => {
        const { slug, row } = params
        const rowNumber = parseInt(row)

        if (isNaN(rowNumber) || rowNumber < 1) return json({ error: "Invalid row number" }, 400)

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
          void logRequest(sheet.id, 'PUT', status).catch(() => {})
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

        // Row 1 in user terms = row 2 in sheet (row 1 is header)
        const sheetRow = rowNumber + 1
        const range = `${tab}!A${sheetRow}`

        const updateRes = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${sheet.sheetId}/values/${range}?valueInputOption=USER_ENTERED`,
          {
            method: 'PUT',
            headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ values: [rowValues] }),
          }
        )
        const updateData = await updateRes.json()
        if (updateData.error) return respond({ error: "Failed to update row", detail: updateData.error.message }, 502)

        return respond({ success: true, row: rowNumber, data: body })
      },

      DELETE: async ({ request, params }) => {
        const { slug, row } = params
        const rowNumber = parseInt(row)

        if (isNaN(rowNumber) || rowNumber < 1) return json({ error: "Invalid row number" }, 400)

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
          void logRequest(sheet.id, 'DELETE', status).catch(() => {})
          return json(body, status, { ...rlHeaders, ...extra })
        }

        if (!rateLimit.allowed) return respond({ error: "Rate limit exceeded" }, 429, { 'Retry-After': '60' })

        const accessToken = await getValidAccessToken(sheet.userId)

        const metaRes = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${sheet.sheetId}?key=${GOOGLE_API_KEY}`
        )
        if (!metaRes.ok) return respond({ error: "Failed to fetch sheet metadata" }, 502)

        const meta = await metaRes.json()
        if (meta.error) return respond({ error: "Failed to fetch sheet metadata" }, 502)

        const tabName = sheet.tabName || meta.sheets[0].properties.title
        const sheetTab = meta.sheets.find(
          (s: { properties: { title: string; sheetId: number } }) => s.properties.title === tabName
        )

        if (!sheetTab) return respond({ error: "Sheet tab not found" }, 404)

        const sheetId = sheetTab.properties.sheetId

        // +1 for header offset, -1 for 0-based index = rowNumber unchanged
        const startIndex = rowNumber
        const endIndex = startIndex + 1

        const deleteRes = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${sheet.sheetId}:batchUpdate`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              requests: [{ deleteDimension: { range: { sheetId, dimension: 'ROWS', startIndex, endIndex } } }]
            }),
          }
        )
        const deleteData = await deleteRes.json()
        if (deleteData.error) return respond({ error: "Failed to delete row", detail: deleteData.error.message }, 502)

        return respond({ success: true, row: rowNumber })
      },
    },
  },
})
