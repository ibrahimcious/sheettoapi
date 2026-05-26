import { createFileRoute } from "@tanstack/react-router"
import { prisma } from "#/shared/lib/prisma"

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

  // Find header by picking the row with the most columns — handles empty leading rows
  const headerRowIndex = rows.reduce(
    (maxIdx: number, row: string[], idx: number, arr: string[][]) =>
      row.length > arr[maxIdx].length ? idx : maxIdx,
    0
  )

  const headers = rows[headerRowIndex]

  return rows
    .slice(headerRowIndex + 1)
    .filter((row: string[]) => row.some((cell: string) => cell !== ""))
    .map((row: string[]) =>
      headers.reduce((obj: Record<string, string>, header: string, i: number) => {
        obj[header] = row[i] ?? ""
        return obj
      }, {})
    )
}

export const Route = createFileRoute("/api/sheet/$slug")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { slug } = params
        const url = new URL(request.url)
        const tabParam = url.searchParams.get("tab") ?? undefined

        const sheet = await prisma.sheetConnection.findUnique({ where: { slug } })

        if (!sheet) {
          return new Response(
            JSON.stringify({ error: "Endpoint not found" }),
            { status: 404, headers: { "Content-Type": "application/json" } }
          )
        }

        // Validate API key before any side effects
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

        const result = rowsToJson(data.values ?? [])

        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      },
    },
  },
})
