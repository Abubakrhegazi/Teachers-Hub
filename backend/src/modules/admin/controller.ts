import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";

function requireAdmin(req: Request) {
  const viewer = (req as any).user as { id: string; role: string } | undefined;
  if (!viewer || viewer.role !== "Admin") {
    const err = new Error("Forbidden");
    (err as any).status = 403;
    throw err;
  }
  return viewer;
}

const MAX_PAGE_SIZE = 100;

const parseDate = (value: string | undefined): Date | null => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export async function listAuditLogs(req: Request, res: Response) {
  requireAdmin(req);
  const {
    limit: rawLimit,
    cursor,
    actorId,
    entity,
    action,
    entityId,
    from,
    to,
    search
  } = req.query as Record<string, string | undefined>;

  const limit = Math.min(Math.max(Number(rawLimit) || 50, 1), MAX_PAGE_SIZE);
  const filter: Prisma.AuditLogWhereInput[] = [];

  if (actorId) filter.push({ actorUserId: actorId });
  if (entity) filter.push({ entity });
  if (action) filter.push({ action });
  if (entityId) filter.push({ entityId });

  const fromDate = parseDate(from);
  const toDate = parseDate(to);
  if (fromDate || toDate) {
    filter.push({
      createdAt: {
        ...(fromDate ? { gte: fromDate } : {}),
        ...(toDate ? { lte: toDate } : {})
      }
    });
  }

  if (search) {
    filter.push({
      OR: [
        { action: { contains: search, mode: "insensitive" } },
        { entity: { contains: search, mode: "insensitive" } },
        { entityId: { contains: search } }
      ]
    });
  }

  const where = filter.length ? { AND: filter } : undefined;

  const items = await prisma.auditLog.findMany({
    where,
    take: limit + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      actorUserId: true,
      action: true,
      entity: true,
      entityId: true,
      changes: true,
      createdAt: true,
      actor: {
        select: {
          id: true,
          name: true,
          email: true,
          type: true
        }
      }
    }
  });

  const hasMore = items.length > limit;
  const trimmed = hasMore ? items.slice(0, -1) : items;
  const nextCursor = hasMore ? items[limit].id : null;

  const payload = trimmed.map(item => ({
    id: item.id,
    action: item.action,
    entity: item.entity,
    entityId: item.entityId,
    changes: item.changes,
    createdAt: item.createdAt,
    actor: item.actorUserId
      ? item.actor
      : null
  }));

  res.json({ items: payload, nextCursor });
}

export async function getUserMonitorOverview(req: Request, res: Response) {
  requireAdmin(req);
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    activeUsers,
    loginsLast24h,
    averageLoginResult,
    roleCounts,
    recentLogins,
    highRiskUsers,
    auditLogsLast24h,
    auditActionGroups
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({
      where: { deletedAt: null, lastLoginAt: { gte: dayAgo } }
    }),
    prisma.user.aggregate({
      where: { deletedAt: null },
      _avg: { loginCount: true }
    }),
    prisma.user.groupBy({
      where: { deletedAt: null },
      by: ["type"],
      _count: { _all: true }
    }),
    prisma.user.findMany({
      where: { deletedAt: null, lastLoginAt: { not: null } },
      orderBy: { lastLoginAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        type: true,
        lastLoginAt: true,
        loginCount: true,
        failedLoginAttempts: true
      },
      take: 15
    }),
    prisma.user.findMany({
      where: { deletedAt: null, failedLoginAttempts: { gte: 3 } },
      orderBy: { failedLoginAttempts: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        type: true,
        lastLoginAt: true,
        loginCount: true,
        failedLoginAttempts: true
      },
      take: 15
    }),
    prisma.auditLog.count({
      where: { createdAt: { gte: dayAgo } }
    }),
    prisma.auditLog.findMany({
      where: { createdAt: { gte: dayAgo } },
      select: { action: true }
    })
  ]);

  const roleBreakdown = roleCounts.reduce<Record<string, number>>((acc, entry) => {
    acc[entry.type] = entry._count._all;
    return acc;
  }, {});

  const auditActions = auditActionGroups.reduce<Record<string, number>>((acc, entry) => {
    const key = entry.action ?? "unknown";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const sortedAuditActions = Object.entries(auditActions)
    .sort((a, b) => b[1] - a[1])
    .reduce<Record<string, number>>((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});

  res.json({
    stats: {
      totalUsers,
      activeUsers,
      loginsLast24h,
      auditLogsLast24h,
      avgLoginsPerUser: Number(averageLoginResult._avg.loginCount ?? 0),
      roleBreakdown
    },
    recentLogins: recentLogins.map(entry => ({
      id: entry.id,
      name: entry.name,
      email: entry.email,
      type: entry.type,
      lastLoginAt: entry.lastLoginAt,
      loginCount: entry.loginCount,
      failedLoginAttempts: entry.failedLoginAttempts
    })),
    highRiskUsers: highRiskUsers.map(entry => ({
      id: entry.id,
      name: entry.name,
      email: entry.email,
      type: entry.type,
      lastLoginAt: entry.lastLoginAt,
      loginCount: entry.loginCount,
      failedLoginAttempts: entry.failedLoginAttempts
    })),
    auditActionsLast24h: sortedAuditActions
  });
}
