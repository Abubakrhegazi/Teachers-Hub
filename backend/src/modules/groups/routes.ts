import { Router } from "express";
import { assignUserToGroup, createGroup, deleteGroup, listGroups, removeUserFromGroup, updateGroup } from "./controller";

export const groupsRouter = Router();

groupsRouter.get("/", listGroups);
groupsRouter.post("/", createGroup);
groupsRouter.put("/:id", updateGroup);
groupsRouter.delete("/:id", deleteGroup);
groupsRouter.post("/:id/members", assignUserToGroup);
groupsRouter.delete("/:id/members", removeUserFromGroup);
