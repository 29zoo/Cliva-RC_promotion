import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, "..");

function readServerPort(): number {
  const envPath = path.join(workspaceRoot, "server", ".env");
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

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5180,
    proxy: {
      "/api": {
        target: `http://127.0.0.1:${readServerPort()}`,
        changeOrigin: true,
      },
      "/uploads": {
        target: `http://127.0.0.1:${readServerPort()}`,
        changeOrigin: true,
      },
    },
  },
});
