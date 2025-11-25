import { Router } from "express";
import { createReport, deleteReport } from "./controller";
import { requireRole } from "../../middleware/auth";
export const reportsRouter = Router();
reportsRouter.post("/", requireRole("Teacher"), createReport);
reportsRouter.delete("/:id", requireRole("Teacher"), deleteReport);
