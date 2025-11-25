# IGCSE Teacher's Hub — Fullstack (Backend + Your Frontend)

This bundle includes:
- **backend/** — Express + Prisma (PostgreSQL) + JWT + S3 uploads
- **frontend/** — Your uploaded front-end code (as provided)

## Extras Implemented
- Pagination & filtering on admin lists (`/api/users` with `?limit=&cursor=&q=&role=`)
- Soft deletes (`deletedAt` on User/Chapter/Report/Homework) + `AuditLog`
- Classes/Enrollments to scope Teachers to specific Students
- Pre-signed S3 uploads at `GET /api/upload/presign/audio`
- Password reset (`/api/auth/request-reset`, `/api/auth/reset`) and Admin invites (`/api/auth/invite`, `/api/auth/accept-invite`)

---

## Backend — How to Run

Requirements:
- Node.js 18+
- PostgreSQL running (default URL in `.env.example`)
- AWS S3 bucket (or mock S3 like LocalStack/MinIO) if you want uploads

1) Copy env:
```bash
cd backend
cp .env.example .env
# Edit .env with your DB & S3 credentials
```

2) Install deps & set up DB:
```bash
npm i
npx prisma generate
npm run prisma:migrate
npm run db:seed
```

3) Start dev server:
```bash
npm run dev
```

### Key Endpoints
- `POST /api/auth/login` → returns JWT
- `GET /api/dashboard` → role-aware dashboard
- Admin: `GET/POST/PUT/DELETE /api/users`, `GET/POST/PUT/DELETE /api/chapters`
- Student: `POST /api/homework`
- Teacher: `POST /api/reports`, `PUT /api/homework/:id/comment`, `DELETE /api/homework/:id`, `DELETE /api/reports/:id`
- Uploads:
  - `POST /api/upload/audio` (multipart form-data, field `file`)
  - `GET /api/upload/presign/audio?ext=webm|mp3|m4a|wav`

### Auth Helper
- JWT payload: `{ sub: userId, role }`
- Add `Authorization: Bearer <token>` to protected endpoints

### Password Reset & Invites
- `POST /api/auth/request-reset` `{ email }` → in dev responds with `devToken`
- `POST /api/auth/reset` `{ token, password }`
- `POST /api/auth/invite` (Admin) `{ email, role }` → in dev returns `devToken`
- `POST /api/auth/accept-invite` `{ token, name, password }`

---

## Frontend — How to Run

The **frontend/** folder contains your uploaded source. Typical steps:
```bash
cd frontend
npm i
npm run dev
```
- Point your front-end `.env` to the backend (e.g., `VITE_API_ORIGIN=http://localhost:3000`)
- Replace any temporary blob URLs for audio with the returned URLs or presigned upload flow.

---

## Seeding with Your Real mockData.ts

If your original front-end has `data/mockData.ts`, copy it into `backend/prisma/mockData.ts`
and ensure it exports arrays named `users`, `chapters`, `reports`, `homework` (or adjust `seed.ts`).
Then rerun:
```bash
cd backend
npm run db:seed
```

## Notes
- Soft deleted rows are filtered in controllers (`deletedAt: null`).
- Teacher scoping uses `Class`, `Enrollment`, and `TeacherClass` tables.
- For production, switch S3 objects to **private** and serve via **signed URLs** or CloudFront.
