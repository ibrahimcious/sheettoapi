import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import { dbMiddleware } from "#/shared/middleware/db.middleware"
import { ConnectSheetSchema, DeleteSheetSchema } from "./sheets.schema"
import { auth } from "#/modules/auth/auth.utils"
import type { PrismaClient } from "#/generated/prisma/client"
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
    const { db } = context
    const headers = getRequestHeaders()

    const session = await auth.api.getSession({ headers })
    if (!session) throw new Error("Unauthorized")

    const accessToken = await getValidGoogleAccessToken(db, session.user.id)

    const response = await fetch(
      "https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.spreadsheet'&pageSize=10&orderBy=modifiedTime desc&fields=files(id,name)",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )

    const data = await response.json()
    if (data.error) throw new Error(data.error.message)

    return data.files as { id: string; name: string }[]
  })

export const getSheetTabsFn = createServerFn({ method: "GET" })
  .middleware([dbMiddleware])
  .inputValidator(z.object({ sheetId: z.string() }))
  .handler(async ({ context, data }) => {
    const { db } = context
    const headers = getRequestHeaders()

    const session = await auth.api.getSession({ headers })
    if (!session) throw new Error("Unauthorized")

    const accessToken = await getValidGoogleAccessToken(db, session.user.id)

    const metaResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${data.sheetId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    const meta = await metaResponse.json()
    if (!meta.sheets) return []
    return meta.sheets.map((s: { properties: { title: string } }) => s.properties.title) as string[]
  })

// Refreshes the Google access token if expired, returns a valid token
async function getValidGoogleAccessToken(db: PrismaClient, userId: string): Promise<string> {
  const account = await db.account.findFirst({
    where: { userId, providerId: "google" },
  })

  if (!account?.accessToken) throw new Error("No Google account connected")

  const isExpired = account.accessTokenExpiresAt
    ? account.accessTokenExpiresAt.getTime() < Date.now() + 60_000
    : false

  if (!isExpired) return account.accessToken

  if (!account.refreshToken) throw new Error("Session expired — please sign in again")

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: account.refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  })

  const tokens = await response.json()
  if (tokens.error) throw new Error(`Token refresh failed: ${tokens.error_description}`)

  await db.account.update({
    where: { id: account.id },
    data: {
      accessToken: tokens.access_token,
      accessTokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
    },
  })

  return tokens.access_token as string
}

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
