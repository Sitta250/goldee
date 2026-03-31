import { PrismaClient } from '@prisma/client'

// ─── Prisma singleton ─────────────────────────────────────────────────────────
// Prevents multiple PrismaClient instances during Next.js hot-reload in dev.
// See: https://www.prisma.io/docs/guides/performance-and-optimization/connection-management

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}
