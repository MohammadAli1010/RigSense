import { PrismaClient } from "@prisma/client";

import { isDevelopment, isProduction } from "@/lib/env";

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isDevelopment ? ["warn", "error"] : ["error"],
  });

if (!isProduction) {
  globalForPrisma.prisma = prisma;
}
