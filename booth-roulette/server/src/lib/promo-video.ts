import {
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import type { Readable } from "node:stream";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const PROMO_DIR = path.join(__dirname, "../../uploads/promo");
const META_FILE = path.join(PROMO_DIR, "meta.json");

export const ALLOWED_PROMO_MIMES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

export type PromoVideoMeta = {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
};

export type PromoVideoInfo = PromoVideoMeta & {
  url: string;
};

function extFromMime(mimeType: string): string | null {
  if (mimeType === "video/mp4") return ".mp4";
  if (mimeType === "video/webm") return ".webm";
  if (mimeType === "video/quicktime") return ".mov";
  return null;
}

function extFromName(name: string): string | null {
  const lower = name.toLowerCase();
  if (lower.endsWith(".mp4")) return ".mp4";
  if (lower.endsWith(".webm")) return ".webm";
  if (lower.endsWith(".mov")) return ".mov";
  return null;
}

export function ensurePromoDir() {
  if (!existsSync(PROMO_DIR)) {
    mkdirSync(PROMO_DIR, { recursive: true });
  }
}

export function readPromoVideoMeta(): PromoVideoMeta | null {
  ensurePromoDir();
  if (!existsSync(META_FILE)) return null;
  try {
    return JSON.parse(readFileSync(META_FILE, "utf8")) as PromoVideoMeta;
  } catch {
    return null;
  }
}

export function getPromoVideoInfo(): PromoVideoInfo | null {
  const meta = readPromoVideoMeta();
  if (!meta) return null;

  const filePath = path.join(PROMO_DIR, meta.filename);
  if (!existsSync(filePath)) return null;

  const v = new Date(meta.uploadedAt).getTime();
  return {
    ...meta,
    url: `/uploads/promo/${meta.filename}?v=${v}`,
  };
}

function removeStoredFile(filename: string) {
  const filePath = path.join(PROMO_DIR, filename);
  if (existsSync(filePath)) unlinkSync(filePath);
}

export function deletePromoVideo() {
  ensurePromoDir();
  const meta = readPromoVideoMeta();
  if (meta) removeStoredFile(meta.filename);
  if (existsSync(META_FILE)) unlinkSync(META_FILE);
}

export async function savePromoVideoFromUpload(
  fileStream: Readable,
  mimeType: string,
  originalName: string,
): Promise<PromoVideoInfo> {
  ensurePromoDir();

  const ext = extFromMime(mimeType) ?? extFromName(originalName) ?? ".mp4";
  const previous = readPromoVideoMeta();
  if (previous) removeStoredFile(previous.filename);

  const filename = `current${ext}`;
  const dest = path.join(PROMO_DIR, filename);

  await pipeline(fileStream, createWriteStream(dest));

  const size = statSync(dest).size;
  const meta: PromoVideoMeta = {
    filename,
    originalName,
    mimeType,
    size,
    uploadedAt: new Date().toISOString(),
  };
  writeFileSync(META_FILE, JSON.stringify(meta, null, 2));

  const v = new Date(meta.uploadedAt).getTime();
  return { ...meta, url: `/uploads/promo/${filename}?v=${v}` };
}
