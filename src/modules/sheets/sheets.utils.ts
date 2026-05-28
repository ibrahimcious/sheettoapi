import { prisma } from '#/shared/lib/prisma'

const rateLimitMap = new Map<string, number[]>()
const RATE_LIMIT_REQUESTS = 60
const RATE_LIMIT_WINDOW_MS = 60_000

export function checkRateLimit(apiKey: string): { allowed: boolean; limit: number; remaining: number; reset: number } {
  const now = Date.now()
  const timestamps = (rateLimitMap.get(apiKey) ?? []).filter(t => now - t < RATE_LIMIT_WINDOW_MS)
  const allowed = timestamps.length < RATE_LIMIT_REQUESTS
  if (allowed) {
    timestamps.push(now)
    rateLimitMap.set(apiKey, timestamps)
  }
  const remaining = Math.max(0, RATE_LIMIT_REQUESTS - timestamps.length)
  const reset = timestamps.length > 0
    ? Math.ceil((timestamps[0] + RATE_LIMIT_WINDOW_MS) / 1000)
    : Math.ceil((now + RATE_LIMIT_WINDOW_MS) / 1000)
  return { allowed, limit: RATE_LIMIT_REQUESTS, remaining, reset }
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "X-API-Key, Content-Type",
}

export function json(body: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders, ...extraHeaders },
  })
}

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

export async function logRequest(sheetConnectionId: string, method: string, status: number): Promise<void> {
  await prisma.requestLog.create({ data: { sheetConnectionId, method, status } })
  const toDelete = await prisma.requestLog.findMany({
    where: { sheetConnectionId },
    orderBy: { createdAt: 'desc' },
    skip: 100,
    select: { id: true },
  })
  if (toDelete.length > 0) {
    await prisma.requestLog.deleteMany({ where: { id: { in: toDelete.map(l => l.id) } } })
  }
}

export async function resolveSheet(slug: string, apiKey: string | null) {
  const sheet = await prisma.sheetConnection.findUnique({ where: { slug } })
  if (!sheet) return { ok: false as const, response: json({ error: "Endpoint not found" }, 404) }
  if (!apiKey || apiKey !== sheet.apiKey) return { ok: false as const, response: json({ error: "Invalid API key" }, 401) }
  return { ok: true as const, sheet }
}
