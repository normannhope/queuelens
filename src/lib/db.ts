import { PrismaClient } from "@prisma/client";

// Standard Next.js-in-dev pattern: reuse one Prisma client across hot reloads
// instead of opening a new connection pool on every file change.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
