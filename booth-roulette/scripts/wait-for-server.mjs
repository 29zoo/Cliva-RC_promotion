import { existsSync, readFileSync } from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const envPath = path.join(root, "server", ".env");

const TIMEOUT_MS = Number(process.env.WAIT_FOR_SERVER_MS ?? 180_000);
const INTERVAL_MS = 500;
const REQUEST_MS = 3000;

function readPortFromServerEnv() {
  if (!existsSync(envPath)) return 4000;
  const text = readFileSync(envPath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const m = /^PORT\s*=\s*"?(\d+)"?\s*$/i.exec(t);
    if (m) return Number(m[1]);
  }
  return 4000;
}

const port = readPortFromServerEnv();

function pingOnce() {
  return new Promise((resolve) => {
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port,
        path: "/api/health",
        method: "GET",
        timeout: REQUEST_MS,
        agent: false,
      },
      (res) => {
        const ok = res.statusCode !== undefined && res.statusCode >= 200 && res.statusCode < 300;
        res.resume();
        res.on("end", () => resolve(ok));
        res.on("error", () => resolve(false));
      },
    );
    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
    req.end();
  });
}

function exitLater(code) {
  setImmediate(() => process.exit(code));
}

const start = Date.now();
const url = `http://127.0.0.1:${port}/api/health`;
process.stderr.write(`[wait-for-server] ${url} 응답 대기 중…\n`);

async function main() {
  for (;;) {
    if (await pingOnce()) {
      process.stderr.write(`[wait-for-server] 준비됨 (${Date.now() - start}ms)\n`);
      exitLater(0);
      return;
    }
    if (Date.now() - start >= TIMEOUT_MS) {
      process.stderr.write(`[wait-for-server] 타임아웃: ${url}\n`);
      exitLater(1);
      return;
    }
    await new Promise((r) => setTimeout(r, INTERVAL_MS));
  }
}

main().catch((e) => {
  process.stderr.write(String(e) + "\n");
  exitLater(1);
});
