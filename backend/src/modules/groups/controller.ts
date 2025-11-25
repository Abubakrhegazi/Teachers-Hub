import { Request, Response } from "express";
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

export async function listGroups(req: Request, res: Response) {
  requireAdmin(req);
  const groups = await prisma.group.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      color: true,
      createdAt: true,
      updatedAt: true,
      members: {
        select: {
          user: { select: { id: true, name: true, email: true, type: true } },
          role: true
        }
      }
    }
  });
  const items = groups.map(group => ({
    id: group.id,
    name: group.name,
    color: group.color,
    createdAt: group.createdAt,
    updatedAt: group.updatedAt,
    members: group.members.map(member => ({
      id: member.user.id,
      name: member.user.name,
      email: member.user.email,
      type: member.user.type,
      role: member.role
    }))
  }));
  res.json({ items });
}

export async function createGroup(req: Request, res: Response) {
  requireAdmin(req);
  const { name, color } = req.body || {};
  if (!name || !color) return res.status(422).json({ error: "name and color required" });
  const group = await prisma.group.create({ data: { name, color } });
  res.status(201).json(group);
}

export async function updateGroup(req: Request, res: Response) {
  requireAdmin(req);
  const { name, color } = req.body || {};
  const group = await prisma.group.update({
    where: { id: req.params.id },
    data: {
      ...(name ? { name } : {}),
      ...(color ? { color } : {})
    }
  });
  res.json(group);
}

export async function deleteGroup(req: Request, res: Response) {
  requireAdmin(req);
  await prisma.group.delete({ where: { id: req.params.id } });
  res.status(204).send();
}

export async function assignUserToGroup(req: Request, res: Response) {
  requireAdmin(req);
  const { userId, role } = req.body || {};
  if (!userId) return res.status(422).json({ error: "userId required" });
  const membership = await prisma.groupMembership.upsert({
    where: {
      groupId_userId: {
        groupId: req.params.id,
        userId
      }
    },
    update: { role: role ?? "Member" },
    create: { groupId: req.params.id, userId, role: role ?? "Member" }
  });
  res.status(201).json(membership);
}

export async function removeUserFromGroup(req: Request, res: Response) {
  requireAdmin(req);
  const { userId } = req.body || {};
  if (!userId) return res.status(422).json({ error: "userId required" });
  try {
    await prisma.groupMembership.delete({
      where: {
        groupId_userId: {
          groupId: req.params.id,
          userId
        }
      }
    });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return res.status(404).json({ error: "Membership not found" });
    }
    throw error;
  }
  res.status(204).send();
}
