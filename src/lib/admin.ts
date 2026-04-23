import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function toAuditJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

type CreateAuditLogInput = {
  actorId?: string;
  action: string;
  entityType: string;
  entityId: string;
  summary?: string;
  details?: Prisma.InputJsonValue;
  tx?: Prisma.TransactionClient;
};

export async function createAuditLog({
  actorId,
  action,
  entityType,
  entityId,
  summary,
  details,
  tx,
}: CreateAuditLogInput) {
  const client = tx ?? prisma;

  await client.auditLog.create({
    data: {
      actorId,
      action,
      entityType,
      entityId,
      summary,
      details,
    },
  });
}
