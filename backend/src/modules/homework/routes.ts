import { Router } from "express";
import { submitHomework, commentHomework, deleteHomework } from "./controller";
import { requireRole } from "../../middleware/auth";
export const homeworkRouter = Router();
homeworkRouter.post("/", requireRole("Student"), submitHomework);
homeworkRouter.put("/:id/comment", requireRole("Teacher"), commentHomework);
homeworkRouter.delete("/:id", requireRole("Teacher"), deleteHomework);
