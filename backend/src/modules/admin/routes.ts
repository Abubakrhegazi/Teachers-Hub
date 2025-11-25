import { Router } from "express";
import { requireRole } from "../../middleware/auth";
import { getUserMonitorOverview, listAuditLogs } from "./controller";

export const adminRouter = Router();

adminRouter.use(requireRole("Admin"));
adminRouter.get("/audit-logs", listAuditLogs);
adminRouter.get("/monitor/users", getUserMonitorOverview);

