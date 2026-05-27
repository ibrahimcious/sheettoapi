import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import { dbMiddleware } from "#/shared/middleware/db.middleware"
import { ConnectSheetSchema, DeleteSheetSchema } from "./sheets.schema"
import { auth } from "#/modules/auth/auth.utils"
import { getValidAccessToken } from "./sheets.utils"
import z from "zod"

export const connectSheetFn = createServerFn({ method: "POST" })
  .middleware([dbMiddleware])
  .inputValidator(ConnectSheetSchema)
  .handler(async ({ context, data }) => {
    const { db } = context
    const headers = getRequestHeaders()

    const session = await auth.api.getSession({ headers })
    if (!session) throw new Error("Unauthorized")

    const sheetId = extractSheetId(data.sheetUrl)
    const slug = generateSlug(data.sheetName)

    return db.sheetConnection.create({
      data: {
        userId: session.user.id,
        sheetId,
        sheetName: data.sheetName,
        slug,
        tabName: data.tabName ?? "",
      },
    })
  })

export const getMySheetsFn = createServerFn({ method: "GET" })
  .middleware([dbMiddleware])
  .handler(async ({ context }) => {
    const { db } = context
    const headers = getRequestHeaders()

    const session = await auth.api.getSession({ headers })
    if (!session) throw new Error("Unauthorized")

    return db.sheetConnection.findMany({
      where: { userId: session.user.id },
    })
  })

export const deleteSheetFn = createServerFn({ method: "POST" })
  .middleware([dbMiddleware])
  .inputValidator(DeleteSheetSchema)
  .handler(async ({ context, data }) => {
    const { db } = context
    const headers = getRequestHeaders()

    const session = await auth.api.getSession({ headers })
    if (!session) throw new Error("Unauthorized")

    return db.sheetConnection.delete({
      where: { id: data.id, userId: session.user.id },
    })
  })

export const getUserSheetsFn = createServerFn({ method: "GET" })
  .middleware([dbMiddleware])
  .handler(async ({ context }) => {
    const headers = getRequestHeaders()

    const session = await auth.api.getSession({ headers })
    if (!session) throw new Error("Unauthorized")

    const accessToken = await getValidAccessToken(session.user.id)

    const response = await fetch(
      "https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.spreadsheet'&pageSize=10&orderBy=modifiedTime desc&fields=files(id,name)",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )

    if (!response.ok) throw new Error(`Google Drive request failed: ${response.status}`)

    const data = await response.json()
    if (data.error) throw new Error(data.error.message)

    return data.files as { id: string; name: string }[]
  })

export const getSheetTabsFn = createServerFn({ method: "GET" })
  .middleware([dbMiddleware])
  .inputValidator(z.object({ sheetId: z.string() }))
  .handler(async ({ context, data }) => {
    const headers = getRequestHeaders()

    const session = await auth.api.getSession({ headers })
    if (!session) throw new Error("Unauthorized")

    const accessToken = await getValidAccessToken(session.user.id)

    const metaResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${data.sheetId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )

    if (!metaResponse.ok) throw new Error(`Google Sheets request failed: ${metaResponse.status}`)

    const meta = await metaResponse.json()
    if (!meta.sheets) return []
    return meta.sheets.map((s: { properties: { title: string } }) => s.properties.title) as string[]
  })

function extractSheetId(url: string): string {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  if (!match) throw new Error("Invalid Google Sheets URL")
  return match[1]
}

function generateSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "") +
    "-" +
    crypto.randomUUID().slice(0, 6)
  )
}
