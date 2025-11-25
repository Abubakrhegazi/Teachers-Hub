import { Router } from "express";
import { getDashboard } from "./controller";
export const dashboardRouter = Router();
dashboardRouter.get("/", getDashboard);
