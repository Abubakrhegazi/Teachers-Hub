import { Request, Response } from "express";
import { prisma } from "../../config/prisma";

export async function getDashboard(req: Request, res: Response) {
  const authUser = (req as any).user as { id: string; role: string };
  const baseUserRaw = await prisma.user.findFirst({
    where: { id: authUser.id, deletedAt: null },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      type: true,
      studentId: true,
      groups: {
        select: {
          role: true,
          group: {
            select: {
              id: true,
              name: true,
              color: true
            }
          }
        }
      }
    }
  });
  if (!baseUserRaw) return res.status(404).json({ error: "User not found" });

  const baseUserGroups = (baseUserRaw.groups ?? []).reduce<Array<{ id: string; name: string; color: string; role: string }>>(
    (acc, membership) => {
      if (!membership.group) return acc;
      acc.push({
        id: membership.group.id,
        name: membership.group.name,
        color: membership.group.color,
        role: membership.role
      });
      return acc;
    },
    []
  );

  const baseUser = {
    id: baseUserRaw.id,
    name: baseUserRaw.name,
    email: baseUserRaw.email,
    phone: baseUserRaw.phone,
    type: baseUserRaw.type,
    studentId: baseUserRaw.studentId,
    groups: baseUserGroups
  };

  const now = new Date().toISOString();

  if (authUser.role === "Student") {
    const [chapters, reports, homework] = await Promise.all([
      prisma.chapter.findMany({ where: { deletedAt: null }, orderBy: { orderIndex: "asc" } }),
      prisma.report.findMany({ where: { studentId: authUser.id, deletedAt: null }, orderBy: { date: "desc" } }),
      prisma.homework.findMany({ where: { studentId: authUser.id, deletedAt: null }, orderBy: { submissionDate: "desc" } }),
    ]);
    return res.json({ user: baseUser, chapters, reports, homework, meta: { generatedAt: now } });
  }
  if (authUser.role === "Parent") {
    const studentId = baseUser.studentId;
    if (!studentId) return res.json({ user: baseUser, chapters: [], reports: [], homework: [], meta: { generatedAt: now } });
    const [chapters, reports, homework] = await Promise.all([
      prisma.chapter.findMany({ where: { deletedAt: null }, orderBy: { orderIndex: "asc" } }),
      prisma.report.findMany({ where: { studentId, deletedAt: null }, orderBy: { date: "desc" } }),
      prisma.homework.findMany({ where: { studentId, deletedAt: null }, orderBy: { submissionDate: "desc" } }),
    ]);
    return res.json({ user: baseUser, chapters, reports, homework, meta: { generatedAt: now } });
  }
  if (authUser.role === "Teacher") {
    const groupIds = baseUser.groups.map(g => g.id);
    const groupMembers = groupIds.length
      ? await prisma.groupMembership.findMany({
          where: { groupId: { in: groupIds } },
          include: { user: { select: { id: true, type: true } } }
        })
      : [];
    const studentIds = groupMembers
      .filter(member => member.user.type === "Student")
      .map(member => member.user.id);
    const [reportsAuthored, recentHomework] = await Promise.all([
      prisma.report.findMany({ where: { teacherId: authUser.id, deletedAt: null }, orderBy: { date: "desc" } }),
      prisma.homework.findMany({ where: { studentId: { in: studentIds }, deletedAt: null }, orderBy: { submissionDate: "desc" }, take: 50 }),
    ]);
    return res.json({ user: baseUser, reportsAuthored, recentHomework, meta: { generatedAt: now } });
  }
  // Admin: overview
  const [uCount, hCount, rCount, chapters] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.homework.count({ where: { deletedAt: null } }),
    prisma.report.count({ where: { deletedAt: null } }),
    prisma.chapter.findMany({ where: { deletedAt: null }, orderBy: { orderIndex: "asc" } }),
  ]);
  return res.json({ user: baseUser, stats: { users: uCount, homework: hCount, reports: rCount }, chapters, meta: { generatedAt: now } });
}
