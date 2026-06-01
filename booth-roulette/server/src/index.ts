import "./load-env.js";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import fastifyStatic from "@fastify/static";
import { boothRoutes } from "./routes/booth.js";
import { prisma } from "./lib/prisma.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT ?? 4000);
const host = process.env.HOST ?? "0.0.0.0";

const app = Fastify({ logger: true });

await app.register(helmet, {
  global: true,
  contentSecurityPolicy: false,
});

await app.register(cors, {
  origin: true,
  credentials: true,
});

app.get("/api/health", async () => ({ ok: true, service: "booth-roulette" }));

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
