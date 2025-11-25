import { Router } from "express";
import { login, requestReset, resetPassword, inviteUser, acceptInvite, registerRequest, registerVerify } from "./controller";
import { requireRole } from "../../middleware/auth";

export const authRouter = Router();
authRouter.post("/login", login);
authRouter.post("/register/request", registerRequest);
authRouter.post("/register/verify", registerVerify);
authRouter.post("/request-reset", requestReset);
authRouter.post("/reset", resetPassword);
authRouter.post("/invite", requireRole("Admin"), inviteUser);
authRouter.post("/accept-invite", acceptInvite);
