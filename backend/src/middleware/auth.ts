import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthUser { id: string; role: string; }

export function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer ")) return res.status(401).json({ error: "Missing token" });
  try {
    const payload = jwt.verify(h.slice(7), process.env.JWT_SECRET!) as { sub: string, role: string };
    (req as any).user = { id: payload.sub, role: payload.role };
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

export const requireRole = (...roles: string[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    const role = (req as any).user?.role;
    if (!role || !roles.includes(role)) return res.status(403).json({ error: "Forbidden" });
    next();
  };
