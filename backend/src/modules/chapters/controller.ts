import { Request, Response } from "express";
import { prisma } from "../../config/prisma";

export async function listChapters(req: Request, res: Response) {
  const items = await prisma.chapter.findMany({ where: { deletedAt: null }, orderBy: { orderIndex: "asc" } });
  res.json(items);
}
export async function createChapter(req: Request, res: Response) {
  const { title, description, status, orderIndex } = req.body || {};
  if (!title) return res.status(422).json({ error: "title required" });
  const normalizedStatus = typeof status === "string" ? status.replace("-", "_") : undefined;
  const ch = await prisma.chapter.create({
    data: {
      title,
      description: description ?? "",
      status: (normalizedStatus ?? "pending") as any,
      orderIndex: orderIndex ?? 0
    }
  });
  res.status(201).json(ch);
}
export async function updateChapter(req: Request, res: Response) {
  const id = req.params.id;
  const data: any = { ...req.body };
  if (typeof data.status === "string") data.status = data.status.replace("-", "_");
  const ch = await prisma.chapter.update({ where: { id }, data });
  res.json(ch);
}
export async function deleteChapter(req: Request, res: Response) {
  const id = req.params.id;
  await prisma.chapter.update({ where: { id }, data: { deletedAt: new Date() } });
  res.status(204).send();
}
