import { prisma } from './db'

export async function audit(
  userId:   string | null,
  action:   string,
  entityId?: string,
  details?:  string,
) {
  try {
    await prisma.auditLog.create({ data: { userId, action, entityId, details } })
  } catch { /* audit logging is non-fatal */ }
}
