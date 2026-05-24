import { PrismaPg } from "@prisma/adapter-pg"
import { createServerOnlyFn } from "@tanstack/react-start"
import { PrismaClient } from "#/generated/prisma/client";
export const getConnectionString = createServerOnlyFn(() => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set")
  }
  return connectionString
})
const connectionString = getConnectionString()
const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

export { prisma }
