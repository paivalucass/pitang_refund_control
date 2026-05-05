import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import { AppError } from "../lib/AppError.ts";

export const uploadsDir = path.resolve(process.cwd(), "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

const allowedMimeTypes = new Set(["application/pdf", "image/jpeg", "image/png"]);

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      cb(new AppError("Tipo de arquivo inválido. Use PDF, JPG ou PNG.", 400));
      return;
    }

    cb(null, true);
  },
});
