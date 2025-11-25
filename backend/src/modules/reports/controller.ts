import { Request, Response } from "express";
import { prisma } from "../../config/prisma";

export async function createReport(req: Request, res: Response) {
  const user = (req as any).user as { id: string, role: string };
  if (user.role !== "Teacher") return res.status(403).json({ error: "Forbidden" });
  const { studentId, date, type, content } = req.body || {};
  if (!studentId || !type || !content) return res.status(422).json({ error: "studentId, type, content required" });
  // Optional: verify teacher is scoped to student's classes
  const links = await prisma.teacherClass.findMany({ where: { teacherId: user.id } });
  const classIds = links.map(l => l.classId);
  const e = await prisma.enrollment.findFirst({ where: { classId: { in: classIds }, studentId } });
  if (!e) return res.status(403).json({ error: "Student not in your classes" });
  const rep = await prisma.report.create({ data: { studentId, teacherId: user.id, date: date ? new Date(date) : new Date(), type, content } });
  await prisma.auditLog.create({ data: { actorUserId: user.id, action: "create", entity: "Report", entityId: rep.id } });
  res.status(201).json(rep);
}

export async function deleteReport(req: Request, res: Response) {
  const user = (req as any).user as { id: string, role: string };
  if (user.role !== "Teacher") return res.status(403).json({ error: "Forbidden" });
  const id = req.params.id;
  // only author can delete
  const rep = await prisma.report.findUnique({ where: { id } });
  if (!rep || rep.teacherId !== user.id) return res.status(403).json({ error: "Forbidden" });
  await prisma.report.update({ where: { id }, data: { deletedAt: new Date() } });
  await prisma.auditLog.create({ data: { actorUserId: user.id, action: "soft_delete", entity: "Report", entityId: id } });
  res.status(204).send();
}
