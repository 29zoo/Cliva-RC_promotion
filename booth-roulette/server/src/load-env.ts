/**
 * 반드시 `index.ts` 최상단에서 가장 먼저 import.
 * cwd와 무관하게 `server/.env`를 읽음 (KOIHA-NTRH load-env.ts 와 동일 패턴).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";

function resolveServerRoot(): string {
  let d = path.dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(d, "prisma", "schema.prisma"))) return d;
    const parent = path.dirname(d);
    if (parent === d) break;
    d = parent;
  }
  return path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
}

const envPath = path.join(resolveServerRoot(), ".env");
if (!fs.existsSync(envPath)) {
  console.warn(
    `[load-env] ${envPath} 가 없습니다. server/.env.example 을 복사해 DATABASE_URL·CORS_ORIGIN 등을 넣은 뒤 다시 실행하세요.`,
  );
}
dotenv.config({ path: envPath });
