import { prisma } from '#/shared/lib/prisma'

// Get a valid Google OAuth access token for a user
// Automatically refreshes the token if it has expired
export async function getValidAccessToken(userId: string): Promise<string> {
  const account = await prisma.account.findFirst({
    where: { userId, providerId: 'google' }
  })

  if (!account?.accessToken) throw new Error('No access token found')

  const isExpired = account.accessTokenExpiresAt
    ? new Date() > new Date(account.accessTokenExpiresAt)
    : false

  if (isExpired && account.refreshToken) {
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

    if (data.access_token) {
      await prisma.account.update({
        where: { id: account.id },
        data: {
          accessToken: data.access_token,
          accessTokenExpiresAt: new Date(Date.now() + data.expires_in * 1000),
        },
      })
      return data.access_token
    }
  }

  return account.accessToken
}
