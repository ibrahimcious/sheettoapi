import { prisma } from '#/shared/lib/prisma'

export async function getValidAccessToken(userId: string): Promise<string> {
  const account = await prisma.account.findFirst({
    where: { userId, providerId: 'google' }
  })

  if (!account?.accessToken) throw new Error('No Google account connected')

  const isExpired = account.accessTokenExpiresAt
    ? new Date() > new Date(account.accessTokenExpiresAt)
    : false

  if (!isExpired) return account.accessToken

  if (!account.refreshToken) throw new Error('Session expired — please sign in again')

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: account.refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  const data = await res.json()

  if (!data.access_token) throw new Error(`Token refresh failed: ${data.error_description ?? 'unknown error'}`)

  await prisma.account.update({
    where: { id: account.id },
    data: {
      accessToken: data.access_token,
      accessTokenExpiresAt: new Date(Date.now() + data.expires_in * 1000),
    },
  })

  return data.access_token as string
}

export async function getFirstSheetTab(sheetId: string): Promise<string> {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?key=${process.env.GOOGLE_API_KEY}`
  )
  if (!res.ok) return 'Sheet1'
  const meta = await res.json()
  return meta.sheets?.[0]?.properties?.title ?? 'Sheet1'
}

export async function resolveSheet(slug: string, apiKey: string | null) {
  const sheet = await prisma.sheetConnection.findUnique({ where: { slug } })
  if (!sheet) {
    return { ok: false as const, response: new Response(
      JSON.stringify({ error: "Endpoint not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    )}
  }
  if (!apiKey || apiKey !== sheet.apiKey) {
    return { ok: false as const, response: new Response(
      JSON.stringify({ error: "Invalid API key" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    )}
  }
  return { ok: true as const, sheet }
}
