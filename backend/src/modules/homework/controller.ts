import { Request, Response } from "express";
import { prisma } from "../../config/prisma";

export async function submitHomework(req: Request, res: Response) {
  const user = (req as any).user as { id: string, role: string };
  if (user.role !== "Student") return res.status(403).json({ error: "Forbidden" });
  const { chapter, content, submissionDate } = req.body || {};
  if (!chapter || !content) return res.status(422).json({ error: "chapter and content required" });
  const hw = await prisma.homework.create({
    data: { studentId: user.id, chapter, content, submissionDate: submissionDate ? new Date(submissionDate) : new Date() }
  });
  await prisma.auditLog.create({ data: { actorUserId: user.id, action: "create", entity: "Homework", entityId: hw.id } });
  res.status(201).json(hw);
}

export async function commentHomework(req: Request, res: Response) {
  const user = (req as any).user as { id: string, role: string };
  if (user.role !== "Teacher") return res.status(403).json({ error: "Forbidden" });
  const id = req.params.id;
  const { comment_type, comment_content } = req.body || {};
  const hw = await prisma.homework.update({ where: { id }, data: { comment_type, comment_content, comment_teacherId: user.id } });
  await prisma.auditLog.create({ data: { actorUserId: user.id, action: "comment", entity: "Homework", entityId: hw.id } });
  res.json(hw);
}

export async function deleteHomework(req: Request, res: Response) {
  const user = (req as any).user as { id: string, role: string };
  if (user.role !== "Teacher") return res.status(403).json({ error: "Forbidden" });
  const id = req.params.id;
  await prisma.homework.update({ where: { id }, data: { deletedAt: new Date() } });
  await prisma.auditLog.create({ data: { actorUserId: user.id, action: "soft_delete", entity: "Homework", entityId: id } });
  res.status(204).send();
}
