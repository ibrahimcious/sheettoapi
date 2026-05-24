import { createFileRoute } from "@tanstack/react-router"
import { prisma } from "#/shared/lib/prisma"

// Read Google API key from environment variables
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY

// Determine which sheet tab to fetch data from
// If user passes ?tab=SheetName, use that
// Otherwise, fetch sheet metadata and use the first tab name automatically
async function getSheetTab(sheetId: string, tab?: string): Promise<string> {
  if (tab) return tab

  // Call Google Sheets metadata API to get list of tabs
  const metaResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?key=${GOOGLE_API_KEY}`
  )
  const meta = await metaResponse.json()

  // If metadata fetch fails, fallback to Sheet1
  if (!meta.sheets) {
    console.log("meta error:", meta)
    return "Sheet1"
  }

  // Return the first tab name
  return meta.sheets[0].properties.title
}

// Convert raw Google Sheets data (array of arrays) into JSON array of objects
// Google Sheets API returns rows as arrays: [["Name", "Age"], ["Ali", "25"], ...]
// This function transforms it to: [{ "Name": "Ali", "Age": "25" }, ...]
function rowsToJson(rows: string[][]): Record<string, string>[] {
  if (!rows || rows.length === 0) return []

  // Find the header row by picking the row with the most columns
  // This handles sheets that have empty rows at the top
  const headerRowIndex = rows.reduce(
    (maxIdx: number, row: string[], idx: number, arr: string[][]) =>
      row.length > arr[maxIdx].length ? idx : maxIdx,
    0
  )

  const headers = rows[headerRowIndex]

  return rows
    .slice(headerRowIndex + 1)       // skip header row and rows above it
    .filter((row: string[]) => row.some((cell: string) => cell !== "")) // skip empty rows
    .map((row: string[]) =>
      // Map each row to an object using header as keys
      headers.reduce((obj: Record<string, string>, header: string, i: number) => {
        obj[header] = row[i] ?? ""   // use empty string if cell is missing
        return obj
      }, {})
    )
}

// Public API endpoint: GET /api/sheet/:slug
// Third-party apps call this endpoint to get sheet data as JSON
export const Route = createFileRoute("/api/sheet/$slug")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { slug } = params

        // Check if user passed ?tab=SheetName query param
        const url = new URL(request.url)
        const tabParam = url.searchParams.get("tab") ?? undefined

        // Look up the sheet connection in DB using the slug
        const sheet = await prisma.sheetConnection.findUnique({
          where: { slug },
        })

        // Return 404 if slug doesn't exist
        if (!sheet) {
          return new Response(
            JSON.stringify({ error: "Endpoint not found" }),
            { status: 404, headers: { "Content-Type": "application/json" } }
          )
        }

        // Determine which tab to fetch — from query param or first tab
        const tab = await getSheetTab(sheet.sheetId, tabParam)

        // Fetch sheet data from Google Sheets API
        const response = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${sheet.sheetId}/values/${tab}?key=${GOOGLE_API_KEY}`
        )

        const data = await response.json()

        // Transform raw rows into JSON array of objects
        const result = rowsToJson(data.values)

        // Return JSON response
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      },
    },
  },
})
