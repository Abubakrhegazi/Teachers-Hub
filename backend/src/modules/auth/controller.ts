import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 12);
const OTP_EXPIRY_MINUTES = Number(process.env.REGISTER_OTP_EXPIRY_MINUTES || 10);

async function resolveUserGroups(userId: string) {
  try {
    const memberships = await prisma.groupMembership.findMany({
      where: { userId },
      include: { group: true }
    });
    return (memberships ?? [])
      .filter((m: any) => m?.group)
      .map((m: any) => ({
        id: m.group.id,
        name: m.group.name,
        color: m.group.color ?? "#2563eb",
        role: m.role ?? "Member"
      }));
  } catch (error) {
    console.warn("Failed to resolve groups for user", userId, error);
    return [];
  }
}

function sign(user: { id: string; type: string }) {
  const secret = process.env.JWT_SECRET as string;
  const exp = process.env.JWT_EXPIRES_IN;
  // jsonwebtoken v9 has stricter types for expiresIn; cast to accepted union
  const options = exp ? ({ expiresIn: exp } as jwt.SignOptions) : undefined;
  return jwt.sign({ sub: user.id, role: user.type }, secret, options);
}

let loginTelemetrySupport: boolean | null = null;
let loginTelemetrySupportPromise: Promise<boolean> | null = null;

async function supportsLoginTelemetry(): Promise<boolean> {
  if (loginTelemetrySupport !== null) return loginTelemetrySupport;
  if (!loginTelemetrySupportPromise) {
    loginTelemetrySupportPromise = prisma.$queryRaw<{ column_name: string }[]>`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = 'User'
        AND column_name IN ('lastLoginAt', 'loginCount', 'failedLoginAttempts')
    `.then(rows => {
      const columns = new Set(rows?.map(row => row.column_name) ?? []);
      const supported =
        columns.has("lastLoginAt") && columns.has("loginCount") && columns.has("failedLoginAttempts");
      loginTelemetrySupport = supported;
      return supported;
    }).catch(error => {
      console.warn("Unable to detect login telemetry support; falling back to legacy login flow", error);
      loginTelemetrySupport = false;
      return false;
    });
  }
  return loginTelemetrySupportPromise;
}

function isMissingColumnError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2022";
}

type LoginHandlerArgs = {
  req: Request;
  res: Response;
  normalizedEmail: string;
  password: string;
};

async function loginWithTelemetry({ req, res, normalizedEmail, password }: LoginHandlerArgs) {
  const user = await prisma.user.findFirst({
    where: { email: normalizedEmail, deletedAt: null }
  });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    const failedAttemptUpdate: Record<string, unknown> = {
      failedLoginAttempts: { increment: 1 }
    };
    await Promise.allSettled([
      prisma.user.update({
        where: { id: user.id },
        data: failedAttemptUpdate as any
      }),
      prisma.auditLog.create({
        data: {
          actorUserId: user.id,
          action: "login_failed",
          entity: "User",
          entityId: user.id
        }
      })
    ]);
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const telemetryReset: Record<string, unknown> = {
    lastLoginAt: new Date(),
    loginCount: { increment: 1 },
    failedLoginAttempts: 0
  };
  await prisma.user.update({
    where: { id: user.id },
    data: telemetryReset as any
  });

  const updatedUserRaw = await prisma.user.findUnique({ where: { id: user.id } });
  if (!updatedUserRaw) {
    return res.status(500).json({ error: "Unable to finalize login" });
  }
  const updatedUser = updatedUserRaw as typeof updatedUserRaw & {
    lastLoginAt?: Date | null;
    loginCount?: number | null;
    failedLoginAttempts?: number | null;
  };

  await prisma.auditLog.create({
    data: {
      actorUserId: updatedUser.id,
      action: "login",
      entity: "User",
      entityId: updatedUser.id,
      changes: { ip: req.ip ?? null }
    }
  });

  const groups = await resolveUserGroups(updatedUser.id);
  return res.json({
    token: sign(updatedUser),
    user: {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone ?? null,
      type: updatedUser.type,
      studentId: updatedUser.studentId,
      lastLoginAt: updatedUser.lastLoginAt ?? null,
      loginCount: updatedUser.loginCount ?? null,
      failedLoginAttempts: updatedUser.failedLoginAttempts ?? null,
      groups
    }
  });
}

async function loginLegacy({ req, res, normalizedEmail, password }: LoginHandlerArgs) {
  const user = await prisma.user.findFirst({
    where: { email: normalizedEmail, deletedAt: null },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      type: true,
      studentId: true,
      password: true
    }
  });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    await prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        action: "login_failed",
        entity: "User",
        entityId: user.id
      }
    });
    return res.status(401).json({ error: "Invalid credentials" });
  }

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: "login",
      entity: "User",
      entityId: user.id,
      changes: { ip: req.ip ?? null }
    }
  });

  const groups = await resolveUserGroups(user.id);
  return res.json({
    token: sign({ id: user.id, type: user.type }),
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone ?? null,
      type: user.type,
      studentId: user.studentId,
      lastLoginAt: null,
      loginCount: null,
      failedLoginAttempts: null,
      groups
    }
  });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(422).json({ error: "email and password required" });
  const normalizedEmail = String(email).trim().toLowerCase();
  const payload = { req, res, normalizedEmail, password };
  try {
    const telemetrySupported = await supportsLoginTelemetry();
    if (telemetrySupported) {
      return await loginWithTelemetry(payload);
    }
    return await loginLegacy(payload);
  } catch (error) {
    if (isMissingColumnError(error)) {
      console.warn("Detected missing telemetry columns; downgrading to legacy login flow");
      loginTelemetrySupport = false;
      return await loginLegacy(payload);
    }
    throw error;
  }
}

// Password reset request: creates a token and (in dev) returns it; in prod, you'd send email
export async function requestReset(req: Request, res: Response) {
  const { email } = req.body || {};
  if (!email) return res.status(422).json({ error: "email required" });
  const user = await prisma.user.findFirst({ where: { email } });
  if (!user) return res.json({ ok: true }); // avoid user enumeration
  const raw = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(raw).digest("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 min
  await prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash, expiresAt } });
  if (process.env.NODE_ENV !== "production") {
    return res.json({ ok: true, devToken: raw });
  }
  return res.json({ ok: true });
}

export async function resetPassword(req: Request, res: Response) {
  const { token, password } = req.body || {};
  if (!token || !password) return res.status(422).json({ error: "token and password required" });
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const rec = await prisma.passwordResetToken.findFirst({ where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } } });
  if (!rec) return res.status(400).json({ error: "Invalid or expired token" });
  const hashed = await bcrypt.hash(password, Number(process.env.BCRYPT_ROUNDS || 12));
  await prisma.$transaction([
    prisma.user.update({ where: { id: rec.userId }, data: { password: hashed } }),
    prisma.passwordResetToken.update({ where: { id: rec.id }, data: { usedAt: new Date() } })
  ]);
  return res.json({ ok: true });
}

// Admin invite flow
export async function inviteUser(req: Request, res: Response) {
  const { email, role } = req.body || {};
  if (!email || !role) return res.status(422).json({ error: "email and role required" });
  const raw = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(raw).digest("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days
  const inv = await prisma.invite.create({
    data: { email, role, tokenHash, expiresAt, inviterUserId: (req as any).user?.id ?? null }
  });
  if (process.env.NODE_ENV !== "production") {
    return res.status(201).json({ id: inv.id, email: inv.email, role: inv.role, devToken: raw });
  }
  return res.status(201).json({ id: inv.id, email: inv.email, role: inv.role });
}

export async function acceptInvite(req: Request, res: Response) {
  const { token, name, password } = req.body || {};
  if (!token || !name || !password) return res.status(422).json({ error: "token, name, password required" });
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const inv = await prisma.invite.findFirst({ where: { tokenHash, acceptedAt: null, expiresAt: { gt: new Date() } } });
  if (!inv) return res.status(400).json({ error: "Invalid or expired token" });
  const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await prisma.user.create({ data: { name, email: inv.email, password: hashed, type: inv.role } });
  await prisma.invite.update({ where: { id: inv.id }, data: { acceptedAt: new Date() } });
  return res.status(201).json({ token: sign(user), user: { id: user.id, name: user.name, email: user.email, type: user.type } });
}

function generateOtp() {
  return String(crypto.randomInt(100000, 999999));
}

export async function registerRequest(req: Request, res: Response) {
  const { email, name, phone, password, type, groupIds, studentEmail } = req.body || {};
  if (!email || !name || !password || !type) {
    return res.status(422).json({ error: "email, name, password, type required" });
  }
  const normalizedEmail = String(email).trim().toLowerCase();
  const existing = await prisma.user.findFirst({ where: { email: normalizedEmail, deletedAt: null } });
  if (existing) return res.status(409).json({ error: "User already exists" });

  const normalizedType = String(type);
  if (!["Student", "Teacher", "Parent"].includes(normalizedType)) {
    return res.status(422).json({ error: "Invalid user type" });
  }

  const hashedPassword = await bcrypt.hash(String(password), BCRYPT_ROUNDS);
  const otp = generateOtp();
  const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Remove existing pending tokens for this email
  const verificationDelegate =
    (prisma as any).verificationToken ?? (prisma as any).verification ?? null;
  if (!verificationDelegate) {
    return res.status(500).json({ error: "Email verification not configured" });
  }
  await verificationDelegate.deleteMany({ where: { email: normalizedEmail, consumedAt: null } });

  const groupIdsArray: string[] = Array.isArray(groupIds) ? Array.from(new Set(groupIds.map((g: any) => String(g)))) : [];
  if (groupIdsArray.length) {
    const groupDelegate = (prisma as any).group;
    if (!groupDelegate?.findMany) {
      return res.status(500).json({ error: "Group support not configured" });
    }
    const foundGroups = await groupDelegate.findMany({
      where: { id: { in: groupIdsArray } },
      select: { id: true }
    });
    if ((foundGroups ?? []).length !== groupIdsArray.length) {
      return res.status(404).json({ error: "One or more groups not found" });
    }
  }

  const token = await verificationDelegate.create({
    data: {
      email: normalizedEmail,
      otpHash,
      expiresAt,
      payload: {
        name,
        phone: phone ?? null,
        type: normalizedType,
        hashedPassword,
        groupIds: groupIdsArray,
        studentEmail: studentEmail ?? null
      }
    }
  });

  res.status(201).json({
    tokenId: token.id,
    expiresAt: token.expiresAt,
    ...(process.env.NODE_ENV !== "production" ? { devOtp: otp } : {})
  });
}

export async function registerVerify(req: Request, res: Response) {
  const { tokenId, otp } = req.body || {};
  if (!tokenId || !otp) return res.status(422).json({ error: "tokenId and otp required" });

  const verificationDelegate =
    (prisma as any).verificationToken ?? (prisma as any).verification ?? null;
  if (!verificationDelegate) {
    return res.status(500).json({ error: "Email verification not configured" });
  }
  const token = await verificationDelegate.findUnique({ where: { id: tokenId } });
  if (!token || token.consumedAt || token.expiresAt <= new Date()) {
    return res.status(400).json({ error: "Invalid or expired verification token" });
  }
  const expectedHash = token.otpHash;
  const actualHash = crypto.createHash("sha256").update(String(otp)).digest("hex");
  if (expectedHash !== actualHash) return res.status(400).json({ error: "Invalid OTP" });

  const payload = (token.payload ?? {}) as any;
  const normalizedEmail = token.email;

  const existing = await prisma.user.findFirst({ where: { email: normalizedEmail, deletedAt: null } });
  if (existing) return res.status(409).json({ error: "User already exists" });

  let studentId: string | null = null;
  if (payload.type === "Parent") {
    const studentLookupEmail = payload.studentEmail ? String(payload.studentEmail).trim().toLowerCase() : null;
    if (!studentLookupEmail) {
      return res.status(422).json({ error: "Parent accounts require a student email" });
    }
    const student = await prisma.user.findFirst({
      where: { email: studentLookupEmail, type: "Student", deletedAt: null },
      select: { id: true }
    });
    if (!student) return res.status(404).json({ error: "Student not found for parent" });
    studentId = student.id;
  }

  const createdUser = await prisma.user.create({
    data: {
      name: payload.name,
      email: normalizedEmail,
      password: payload.hashedPassword,
      type: payload.type,
      studentId
    },
    select: {
      id: true,
      name: true,
      email: true,
      type: true
    }
  });

  const groupIds: string[] = Array.isArray(payload.groupIds) ? payload.groupIds : [];
  if (groupIds.length) {
    await prisma.groupMembership.createMany({
      data: Array.from(new Set(groupIds)).map(groupId => ({ userId: createdUser.id, groupId }))
    });
  }

  await verificationDelegate.update({
    where: { id: tokenId },
    data: { consumedAt: new Date() }
  });

  const fullUser = await prisma.user.findUnique({
    where: { id: createdUser.id }
  });

  if (!fullUser) {
    return res.status(500).json({ error: "Unable to finalize registration" });
  }

  const groups = await resolveUserGroups(fullUser.id);
  return res.status(201).json({
    token: sign(fullUser),
    user: {
      id: fullUser.id,
      name: fullUser.name,
      email: fullUser.email,
      phone: payload.phone ?? null,
      type: fullUser.type,
      groups
    }
  });
}
