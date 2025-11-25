import { Request, Response } from "express";
import multer from "multer";
import { s3, S3_BUCKET } from "../../config/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
}); // 10MB

export const uploadAudioMiddleware = upload.single("file");

export async function uploadAudio(req: Request, res: Response) {
  const user = (req as any).user as { id: string, role: string };
  if (!["Student","Teacher"].includes(user.role)) return res.status(403).json({ error: "Forbidden" });
  if (!req.file) return res.status(400).json({ error: "file required" });
  const ext = (req.file.originalname.split(".").pop() || "webm").toLowerCase();
  const key = `audio/${user.id}/${Date.now()}-${randomUUID()}.${ext}`;
  await s3.send(new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    Body: req.file.buffer,
    ContentType: req.file.mimetype,
    ACL: "public-read"
  }));
  const url = `https://${S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  res.status(201).json({ url });
}

export async function presignAudio(req: Request, res: Response) {
  const user = (req as any).user as { id: string, role: string };
  if (!["Student","Teacher"].includes(user.role)) return res.status(403).json({ error: "Forbidden" });
  const ext = (req.query.ext as string) || "webm";
  const contentType = ({
    webm: "audio/webm",
    mp3: "audio/mpeg",
    m4a: "audio/mp4",
    wav: "audio/wav"
  } as any)[ext] || "application/octet-stream";
  const key = `audio/${user.id}/${Date.now()}-${randomUUID()}.${ext}`;
  const cmd = new PutObjectCommand({ Bucket: S3_BUCKET, Key: key, ContentType: contentType });
  const url = await getSignedUrl(s3, cmd, { expiresIn: 60 * 5 }); // 5 min
  res.json({ uploadUrl: url, key, publicUrl: `https://${S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}` });
}
