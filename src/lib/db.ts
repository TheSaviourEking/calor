// Prisma database client - Phase 2 models updated
import { PrismaClient } from '@prisma/client'

// In development, always create a new client to pick up schema changes
// In production, use the singleton pattern
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const db = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
})

if (process.env.NODE_ENV === 'production') {
  globalForPrisma.prisma = db
}
