import { createFileRoute } from "@tanstack/react-router"
import { prisma } from "#/shared/lib/prisma"
import { getValidAccessToken } from "#/modules/sheets/sheets.utils"

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY

export const Route = createFileRoute("/api/sheet/$slug/$row")({
  server: {
    handlers: {
      PUT: async ({ request, params }) => {
        const { slug, row } = params
        const rowNumber = parseInt(row)

        if (isNaN(rowNumber) || rowNumber < 1) {
          return new Response(
            JSON.stringify({ error: "Invalid row number" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          )
        }

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

        // Get headers from sheet
        const tab = sheet.tabName || "Sheet1"
        const metaRes = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${sheet.sheetId}/values/${tab}?key=${GOOGLE_API_KEY}`
        )
        const meta = await metaRes.json()
        const headers: string[] = meta.values?.[0] ?? []

        // Map body to row values based on headers
        const rowValues = headers.map((h: string) => body[h] ?? '')

        // Row 1 in user terms = row 2 in sheet (row 1 is header)
        // So user row 1 = sheet row 2
        const sheetRow = rowNumber + 1
        const range = `${tab}!A${sheetRow}`

        const updateRes = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${sheet.sheetId}/values/${range}?valueInputOption=USER_ENTERED`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ values: [rowValues] }),
          }
        )

        const updateData = await updateRes.json()

        if (updateData.error) {
          return new Response(
            JSON.stringify({ error: "Failed to update row", detail: updateData.error.message }),
            { status: 502, headers: { "Content-Type": "application/json" } }
          )
        }

        return new Response(
          JSON.stringify({ success: true, row: rowNumber, data: body }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      },
      DELETE: async ({ request, params }) => {
        const { slug, row } = params
        const rowNumber = parseInt(row)

        if (isNaN(rowNumber) || rowNumber < 1) {
          return new Response(
            JSON.stringify({ error: "Invalid row number" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          )
        }

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

        const accessToken = await getValidAccessToken(sheet.userId)

        // Get sheet metadata to find the sheet tab index
        const metaRes = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${sheet.sheetId}?key=${GOOGLE_API_KEY}`
        )
        const meta = await metaRes.json()

        if (meta.error) {
          return new Response(
            JSON.stringify({ error: "Failed to fetch sheet metadata" }),
            { status: 502, headers: { "Content-Type": "application/json" } }
          )
        }

        // Find the sheet tab index by tab name
        const tabName = sheet.tabName || meta.sheets[0].properties.title
        const sheetTab = meta.sheets.find(
          (s: any) => s.properties.title === tabName
        )

        if (!sheetTab) {
          return new Response(
            JSON.stringify({ error: "Sheet tab not found" }),
            { status: 404, headers: { "Content-Type": "application/json" } }
          )
        }

        const sheetId = sheetTab.properties.sheetId

        // Row 1 in user terms = row 2 in sheet (row 1 is header)
        // Google Sheets API uses 0-based index for deleteDimension
        const startIndex = rowNumber // +1 for header, -1 for 0-based = stays the same
        const endIndex = startIndex + 1

        const deleteRes = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${sheet.sheetId}:batchUpdate`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              requests: [{
                deleteDimension: {
                  range: {
                    sheetId,
                    dimension: 'ROWS',
                    startIndex,
                    endIndex,
                  }
                }
              }]
            }),
          }
        )

        const deleteData = await deleteRes.json()

        if (deleteData.error) {
          return new Response(
            JSON.stringify({ error: "Failed to delete row", detail: deleteData.error.message }),
            { status: 502, headers: { "Content-Type": "application/json" } }
          )
        }

        return new Response(
          JSON.stringify({ success: true, row: rowNumber }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      },
    },
  },
})
