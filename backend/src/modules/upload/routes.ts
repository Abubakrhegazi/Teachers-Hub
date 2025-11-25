import { Router } from "express";
import { uploadAudio, uploadAudioMiddleware, presignAudio } from "./controller";
export const uploadRouter = Router();
uploadRouter.post("/audio", uploadAudioMiddleware, uploadAudio);
uploadRouter.get("/presign/audio", presignAudio);
