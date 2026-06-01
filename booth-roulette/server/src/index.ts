import "./load-env.js";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import { boothRoutes } from "./routes/booth.js";
import { loadCorsConfig, logLevel, trustProxyEnabled } from "./lib/env.js";
import { ensurePromoDir, PROMO_DIR } from "./lib/promo-video.js";
import { prisma } from "./lib/prisma.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT ?? 4001);
const host = process.env.HOST ?? "0.0.0.0";
const corsConfig = loadCorsConfig();

const app = Fastify({
  logger: { level: logLevel() },
  trustProxy: trustProxyEnabled(),
});

await app.register(helmet, {
  global: true,
  contentSecurityPolicy: false,
});

await app.register(cors, {
  origin: (origin, callback) => {
    if (corsConfig.mode === "reflect") {
      callback(null, true);
      return;
    }
    if (!origin) {
      callback(null, true);
      return;
    }
    const ok = corsConfig.origins.includes(origin);
    callback(null, ok);
  },
  credentials: true,
});

app.get("/api/health", async () => ({ ok: true, service: "booth-roulette" }));

ensurePromoDir();

await app.register(multipart, {
  limits: { fileSize: 500 * 1024 * 1024 },
});

await app.register(fastifyStatic, {
  root: PROMO_DIR,
  prefix: "/uploads/promo/",
  decorateReply: false,
});

await boothRoutes(app);

const clientDist = path.join(__dirname, "../../client/dist");
if (existsSync(clientDist)) {
  await app.register(fastifyStatic, {
    root: clientDist,
    prefix: "/",
    wildcard: false,
  });

  app.setNotFoundHandler(async (request, reply) => {
    if (request.url.startsWith("/api/")) {
      return reply.status(404).send({ error: "NOT_FOUND" });
    }
    return reply.sendFile("index.html");
  });
}

try {
  await app.listen({ port, host });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  await app.close();
  process.exit(0);
});
