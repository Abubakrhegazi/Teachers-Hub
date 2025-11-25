import { Router } from "express";
import { createChapter, deleteChapter, listChapters, updateChapter } from "./controller";
import { requireRole } from "../../middleware/auth";

export const chaptersRouter = Router();
chaptersRouter.get("/", listChapters);
chaptersRouter.post("/", requireRole("Admin"), createChapter);
chaptersRouter.put("/:id", requireRole("Admin"), updateChapter);
chaptersRouter.delete("/:id", requireRole("Admin"), deleteChapter);
