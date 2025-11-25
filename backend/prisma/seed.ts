import { PrismaClient, UserType, ChapterStatus, ReportType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 12);

async function main() {
  // If you have your front-end mockData.ts, copy it here or change the import path:
  const data = await import(`${__dirname}/mockData.js`);
  const { users, chapters, reports, homework, groups = [] } = data as any;

  const userIdByEmail: Record<string, string> = {};
  const groupIdByName: Record<string, string> = {};

  // Groups
  for (const g of groups as any[]) {
    const existing = await prisma.group.findFirst({ where: { name: g.name } });
    const record = existing
      ? await prisma.group.update({ where: { id: existing.id }, data: { name: g.name, color: g.color ?? existing.color } })
      : await prisma.group.create({ data: { name: g.name, color: g.color ?? "#2563eb" } });
    groupIdByName[g.name] = record.id;
  }

  // Users
  for (const u of users as any[]) {
    const hashed = await bcrypt.hash(u.password ?? "password123", BCRYPT_ROUNDS);
    const created = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        // Keep seed idempotent but ensure known password for dev
        password: hashed,
        type: u.type as UserType,
        name: u.name,
        phone: u.phone ?? null,
        studentId: u.studentId ?? null
      },
      create: {
        name: u.name,
        email: u.email,
        phone: u.phone ?? null,
        password: hashed,
        type: u.type as UserType,
        studentId: u.studentId ?? null
      }
    });
    userIdByEmail[u.email] = created.id;

    if (Array.isArray(u.groups)) {
      for (const groupName of u.groups) {
        const groupId = groupIdByName[groupName];
        if (!groupId) continue;
        await prisma.groupMembership.upsert({
          where: {
            groupId_userId: {
              groupId,
              userId: created.id
            }
          },
          update: {},
          create: { groupId, userId: created.id }
        });
      }
    }
  }

  // Make a demo class and enroll the student, link teacher
  const teacherId = Object.entries(userIdByEmail).find(([e]) => e.includes("teacher"))?.[1];
  const studentId = Object.entries(userIdByEmail).find(([e]) => e.includes("student"))?.[1];
  const klass = await prisma.class.create({ data: { name: "IGCSE Mathematics" } });
  if (studentId) await prisma.enrollment.create({ data: { classId: klass.id, studentId } });
  if (teacherId) await prisma.teacherClass.create({ data: { classId: klass.id, teacherId } });

  // Chapters
  for (const [i, c] of (chapters as any[]).entries()) {
    await prisma.chapter.create({
      data: {
        title: c.title,
        description: c.description ?? "",
        status: ((c.status ?? "pending") as string).replace("-", "_") as ChapterStatus,
        orderIndex: typeof c.orderIndex === "number" ? c.orderIndex : i
      }
    });
  }

  // Reports
  for (const r of reports as any[]) {
    const sId = r.studentId || studentId;
    const tId = r.teacherId || teacherId;
    if (!sId || !tId) continue;
    await prisma.report.create({
      data: {
        studentId: sId,
        teacherId: tId,
        date: new Date(r.date),
        type: r.type as ReportType,
        content: r.content
      }
    });
  }

  // Homework
  for (const h of homework as any[]) {
    const sId = h.studentId || studentId;
    if (!sId) continue;
    await prisma.homework.create({
      data: {
        studentId: sId,
        chapter: h.chapter,
        content: h.content,
        submissionDate: new Date(h.submissionDate)
      }
    });
  }

  console.log("Seed completed.");
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
