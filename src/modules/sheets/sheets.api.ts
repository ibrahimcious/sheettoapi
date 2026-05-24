import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import { dbMiddleware } from "#/shared/middleware/db.middleware"
import { ConnectSheetSchema, DeleteSheetSchema } from "./sheets.schema"
import { auth } from "#/modules/auth/auth.utils"

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
    const { db } = context
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })
    if (!session) throw new Error("Unauthorized")

    const account = await db.account.findFirst({
      where: { userId: session.user.id, providerId: "google" }
    })

    if (!account?.accessToken) throw new Error("No access token found")

    const response = await fetch(
      "https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.spreadsheet'&pageSize=10&orderBy=modifiedTime desc&fields=files(id,name)",
      { headers: { Authorization: `Bearer ${account.accessToken}` } }
    )

    const data = await response.json()

    if (data.error) throw new Error(data.error.message)

    return data.files as { id: string; name: string }[]
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
