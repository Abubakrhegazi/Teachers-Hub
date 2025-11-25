import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import pino from "pino";

import { authenticateJWT, requireRole } from "./middleware/auth";
import { errorHandler } from "./middleware/error";

import { authRouter } from "./modules/auth/routes";
import { usersRouter } from "./modules/users/routes";
import { chaptersRouter } from "./modules/chapters/routes";
import { homeworkRouter } from "./modules/homework/routes";
import { reportsRouter } from "./modules/reports/routes";
import { dashboardRouter } from "./modules/dashboard/routes";
import { uploadRouter } from "./modules/upload/routes";
import { groupsRouter } from "./modules/groups/routes";
import { adminRouter } from "./modules/admin/routes";

const app = express();
const logger = pino({ transport: { target: "pino-pretty" } });

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

// Public
app.use("/api/auth", authRouter);

// Protected
app.use("/api", authenticateJWT);
app.use("/api/users", usersRouter);
app.use("/api/chapters", chaptersRouter);
app.use("/api/homework", homeworkRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/groups", groupsRouter);
app.use("/api/admin", adminRouter);

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use(errorHandler);

const port = process.env.PORT || 4000;
app.listen(port, () => logger.info(`API running on :${port}`));
