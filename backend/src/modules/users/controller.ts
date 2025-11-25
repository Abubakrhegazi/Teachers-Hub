import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../../config/prisma";
import { parsePagination } from "../../utils/pagination";
import { AuthUser } from "../../middleware/auth";

const baseSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  type: true,
  studentId: true,
  lastLoginAt: true,
  loginCount: true,
  failedLoginAttempts: true
};

async function fetchGroupsForUsers(userIds: string[]) {
  if (!userIds.length) return {};
  try {
    const rows = await prisma.groupMembership.findMany({
      where: { userId: { in: userIds } },
      include: { group: true }
    }) as any[];
    const result: Record<string, any[]> = {};
    for (const row of rows ?? []) {
      if (!row?.group) continue;
      const list = result[row.userId] ?? (result[row.userId] = []);
      list.push({
        id: row.group.id,
        name: row.group.name,
        color: row.group.color ?? "#2563eb",
        role: row.role ?? "Member"
      });
    }
    return result;
  } catch (error) {
    console.warn("Failed to fetch group memberships", error);
    return {};
  }
}

const toClientUser = (user: any, groupsByUser: Record<string, any[]> = {}) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone ?? null,
  type: user.type,
  studentId: user.studentId ?? null,
  lastLoginAt: user.lastLoginAt ?? null,
  loginCount: user.loginCount ?? 0,
  failedLoginAttempts: user.failedLoginAttempts ?? 0,
  groups: groupsByUser[user.id] ?? user.groups ?? []
});

const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 12);

export async function listUsers(req: Request, res: Response) {
  const viewer = (req as any).user as AuthUser | undefined;
  if (!viewer) return res.status(401).json({ error: "Unauthorized" });

  const viewerGroupIds = await prisma.groupMembership.findMany({
    where: { userId: viewer.id },
    select: { groupId: true }
  }).then(results => results.map(record => record.groupId));

  if (viewer.role === "Admin") {
    const { limit, cursor } = parsePagination(req.query);
    const where: any = { deletedAt: null };
    if (req.query.role) where.type = String(req.query.role);
    if (req.query.q) {
      const q = String(req.query.q);
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } }
      ];
    }

    const records = await prisma.user.findMany({
      where,
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { createdAt: "desc" },
      select: baseSelect
    });

    const hasMore = records.length > limit;
    const items = hasMore ? records.slice(0, -1) : records;
    const nextCursor = hasMore ? records[limit].id : null;
    const groups = await fetchGroupsForUsers(items.map((user: any) => user.id));
    return res.json({ items: items.map(user => toClientUser(user, groups)), nextCursor });
  }

  if (viewer.role === "Teacher") {
    const allowedUserIds = viewerGroupIds.length
      ? await prisma.groupMembership.findMany({
          where: { groupId: { in: viewerGroupIds } },
          select: { userId: true }
        }).then(results => Array.from(new Set(results.map(record => record.userId))))
      : [viewer.id];

    const users = await prisma.user.findMany({
      where: { id: { in: allowedUserIds }, deletedAt: null },
      select: baseSelect
    });

    const groups = await fetchGroupsForUsers(users.map(user => user.id));
    const items = users.map(user => toClientUser(user, groups));
    return res.json({ items });
  }

  if (viewer.role === "Parent") {
    const parent = await prisma.user.findUnique({
      where: { id: viewer.id, deletedAt: null },
      select: baseSelect
    });
    if (!parent) return res.json({ items: [] });
    if (!parent.studentId) {
      const groups = await fetchGroupsForUsers([parent.id]);
      return res.json({ items: [toClientUser(parent, groups)] });
    }

    const student = await prisma.user.findUnique({
      where: { id: parent.studentId, deletedAt: null },
      select: baseSelect
    });
    const items = student ? [parent, student] : [parent];
    const groups = await fetchGroupsForUsers(items.map(user => user.id));
    return res.json({ items: items.map(user => toClientUser(user, groups)) });
  }

  if (viewer.role === "Student") {
    const student = await prisma.user.findUnique({
      where: { id: viewer.id, deletedAt: null },
      select: baseSelect
    });
    if (!student) return res.json({ items: [] });
    const groups = await fetchGroupsForUsers([student.id]);
    return res.json({ items: [toClientUser(student, groups)] });
  }

  return res.status(403).json({ error: "Forbidden" });
}

export async function createUser(req: Request, res: Response) {
  try {
    const { name, email, phone, password, type, studentId, studentEmail, groupIds } = req.body;
    if (!name || !email || !password || !type) {
      return res.status(422).json({ error: "name, email, password, type required" });
    }

    let resolvedStudentId = studentId ?? null;
    if (type === "Parent") {
      const lookupEmail = studentEmail ?? null;
      if (!resolvedStudentId && !lookupEmail) {
        return res.status(422).json({ error: "Parent users require associated student email" });
      }
      if (!resolvedStudentId && lookupEmail) {
        const student = await prisma.user.findFirst({
          where: { email: lookupEmail.trim().toLowerCase(), type: "Student", deletedAt: null },
          select: { id: true }
        });
        if (!student) return res.status(404).json({ error: "Student not found for parent" });
        resolvedStudentId = student.id;
      }
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) return res.status(409).json({ error: "User already exists" });

    const hashed = await bcrypt.hash(String(password), BCRYPT_ROUNDS);
    const createData: any = {
      name,
      email: normalizedEmail,
      password: hashed,
      type,
      studentId: resolvedStudentId
    };
    if (phone) createData.phone = String(phone);
    const user = await prisma.user.create({
      data: createData,
      select: baseSelect
    });

    if (Array.isArray(groupIds) && groupIds.length) {
      const uniqueGroupIds = Array.from(new Set(groupIds.map((g: string) => String(g))));
      await prisma.groupMembership.createMany({
        data: uniqueGroupIds.map(groupId => ({ userId: user.id, groupId }))
      });
    }

    const groups = await fetchGroupsForUsers([user.id]);
    return res.status(201).json(toClientUser(user, groups));
  } catch (error) {
    console.error("createUser error", error);
    return res.status(500).json({ error: "Failed to create user" });
  }
}

export async function updateUser(req: Request, res: Response) {
  const id = req.params.id;
  const data: any = {};
  const mutableFields = ["name", "email", "phone", "type", "studentId"] as const;
  for (const field of mutableFields) {
    if (field in req.body) {
      const value = (req.body as any)[field];
      data[field] = field === "email" ? String(value).trim().toLowerCase() : value ?? null;
    }
  }
  if (data.type === "Parent" && data.studentId == null && req.body.studentEmail) {
    const student = await prisma.user.findFirst({
      where: { email: String(req.body.studentEmail).trim().toLowerCase(), type: "Student", deletedAt: null },
      select: { id: true }
    });
    if (!student) return res.status(404).json({ error: "Student not found for parent" });
    data.studentId = student.id;
  }
  if (req.body.password) {
    data.password = await bcrypt.hash(String(req.body.password), BCRYPT_ROUNDS);
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    select: baseSelect
  });

  const groups = await fetchGroupsForUsers([user.id]);
  res.json(toClientUser(user, groups));
}

export async function deleteUser(req: Request, res: Response) {
  const id = req.params.id;
  await prisma.user.update({ where: { id }, data: { deletedAt: new Date() } });
  res.status(204).send();
}
