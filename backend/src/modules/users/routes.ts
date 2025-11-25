import { Router } from "express";
import { listUsers, createUser, updateUser, deleteUser } from "./controller";
import { requireRole } from "../../middleware/auth";

export const usersRouter = Router();
usersRouter.get("/", listUsers);
usersRouter.post("/", requireRole("Admin"), createUser);
usersRouter.put("/:id", requireRole("Admin"), updateUser);
usersRouter.delete("/:id", requireRole("Admin"), deleteUser);
