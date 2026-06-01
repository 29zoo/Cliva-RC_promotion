import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { DEFAULT_STOCK } from "../lib/products.js";
import { findVipMatch } from "../lib/vip.js";

export type ParticipantDto = {
  id: number;
  ts: string;
  name: string;
  affiliation: string;
  jobType: string;
  phone: string;
  prize: string;
  isVip: boolean;
  quizQuestionId: number | null;
  quizCorrect: boolean | null;
  completedAt: string | null;
};

export type BoothStateDto = {
  stock: Record<string, number>;
  vipList: { nameKr: string; nameEn: string; affiliation: string }[];
  participants: ParticipantDto[];
};

function toParticipantDto(p: {
  id: number;
  ts: Date;
  name: string;
  affiliation: string;
  jobType: string;
  phone: string;
  prize: string;
  isVip: boolean;
  quizQuestionId: number | null;
  quizCorrect: boolean | null;
  completedAt: Date | null;
}): ParticipantDto {
  return {
    id: p.id,
    ts: p.ts.toISOString(),
    name: p.name,
    affiliation: p.affiliation,
    jobType: p.jobType,
    phone: p.phone,
    prize: p.prize,
    isVip: p.isVip,
    quizQuestionId: p.quizQuestionId,
    quizCorrect: p.quizCorrect,
    completedAt: p.completedAt?.toISOString() ?? null,
  };
}

async function ensureDefaultStock() {
  const count = await prisma.boothStock.count();
  if (count > 0) return;
  await prisma.boothStock.createMany({
    data: Object.entries(DEFAULT_STOCK).map(([productId, count]) => ({
      productId,
      count,
    })),
  });
}

export async function getBoothState(): Promise<BoothStateDto> {
  await ensureDefaultStock();
  const [stockRows, vipList, participants] = await Promise.all([
    prisma.boothStock.findMany(),
    prisma.vipEntry.findMany({ orderBy: { id: "asc" } }),
    prisma.participant.findMany({ orderBy: { ts: "asc" } }),
  ]);

  const stock: Record<string, number> = { ...DEFAULT_STOCK };
  for (const row of stockRows) {
    stock[row.productId] = row.count;
  }

  return {
    stock,
    vipList: vipList.map((v) => ({
      nameKr: v.nameKr,
      nameEn: v.nameEn,
      affiliation: v.affiliation,
    })),
    participants: participants.map(toParticipantDto),
  };
}

const JOB_TYPES = new Set(["doctor", "nurse", "paramedic", "therapist", "admin", "student", "other"]);

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export async function boothRoutes(app: FastifyInstance) {
  app.get("/api/booth/state", async () => getBoothState());

  app.put<{ Body: Partial<BoothStateDto> }>("/api/booth/state", async (request) => {
    const body = request.body ?? {};

    if (body.stock) {
      for (const [productId, count] of Object.entries(body.stock)) {
        if (typeof count !== "number" || count < 0) continue;
        await prisma.boothStock.upsert({
          where: { productId },
          create: { productId, count },
          update: { count },
        });
      }
    }

    if (body.vipList) {
      await prisma.vipEntry.deleteMany();
      if (body.vipList.length > 0) {
        await prisma.vipEntry.createMany({
          data: body.vipList.map((v) => ({
            nameKr: v.nameKr ?? "",
            nameEn: v.nameEn ?? "",
            affiliation: v.affiliation ?? "",
          })),
        });
      }
    }

    if (body.participants) {
      await prisma.participant.deleteMany();
      if (body.participants.length > 0) {
        await prisma.participant.createMany({
          data: body.participants.map((p) => ({
            ts: new Date(p.ts),
            name: p.name,
            affiliation: p.affiliation ?? "",
            jobType: p.jobType ?? "",
            phone: p.phone ?? "",
            prize: p.prize ?? "",
            isVip: !!p.isVip,
            quizQuestionId: p.quizQuestionId ?? null,
            quizCorrect: p.quizCorrect ?? null,
            completedAt: p.completedAt ? new Date(p.completedAt) : null,
          })),
        });
      }
    }

    return getBoothState();
  });

  /** 1단계: 인적정보 등록 + VIP 매칭 */
  app.post<{
    Body: { name?: string; affiliation?: string; jobType?: string; phone?: string };
  }>("/api/booth/register", async (request, reply) => {
    const name = request.body?.name?.trim() ?? "";
    const affiliation = request.body?.affiliation?.trim() ?? "";
    const jobType = request.body?.jobType?.trim() ?? "";
    const phone = request.body?.phone?.trim() ?? "";

    if (!name) {
      return reply.status(400).send({ error: "INVALID_NAME", message: "이름을 입력해주세요." });
    }
    if (!jobType || !JOB_TYPES.has(jobType)) {
      return reply.status(400).send({ error: "INVALID_JOB", message: "직종을 선택해주세요." });
    }
    if (!phone || normalizePhone(phone).length < 9) {
      return reply.status(400).send({ error: "INVALID_PHONE", message: "올바른 전화번호를 입력해주세요." });
    }

    const normalizedPhone = normalizePhone(phone);
    const existing = await prisma.participant.findFirst({
      where: {
        phone: normalizedPhone,
        completedAt: { not: null },
      },
    });
    if (existing) {
      return reply.status(409).send({
        error: "DUPLICATE",
        message: "이미 참여하신 전화번호입니다. 1인 1회만 참여 가능합니다.",
      });
    }

    const vipList = await prisma.vipEntry.findMany();
    const vipMatch = findVipMatch(
      vipList.map((v) => ({ nameKr: v.nameKr, nameEn: v.nameEn, affiliation: v.affiliation })),
      name,
      affiliation,
    );

    const participant = await prisma.participant.create({
      data: {
        name: vipMatch?.nameKr || name,
        affiliation: vipMatch?.affiliation || affiliation,
        jobType,
        phone: normalizedPhone,
        isVip: !!vipMatch,
      },
    });

    return {
      participant: toParticipantDto(participant),
      isVip: !!vipMatch,
      vipMatch: vipMatch
        ? { nameKr: vipMatch.nameKr, nameEn: vipMatch.nameEn, affiliation: vipMatch.affiliation }
        : null,
    };
  });

  /** 3단계: 퀴즈 결과 저장 */
  app.patch<{
    Params: { id: string };
    Body: { quizQuestionId?: number; quizCorrect?: boolean };
  }>("/api/booth/participants/:id/quiz", async (request, reply) => {
    const id = Number(request.params.id);
    if (!Number.isFinite(id)) {
      return reply.status(400).send({ error: "INVALID_ID" });
    }

    const participant = await prisma.participant.findUnique({ where: { id } });
    if (!participant) {
      return reply.status(404).send({ error: "NOT_FOUND", message: "참가자를 찾을 수 없습니다." });
    }

    const updated = await prisma.participant.update({
      where: { id },
      data: {
        quizQuestionId: request.body?.quizQuestionId ?? null,
        quizCorrect: request.body?.quizCorrect ?? null,
      },
    });

    return { participant: toParticipantDto(updated) };
  });

  /** 4단계: 룰렛 당첨 저장 + 재고 차감 */
  app.patch<{
    Params: { id: string };
    Body: { prize?: string; productId?: string };
  }>("/api/booth/participants/:id/prize", async (request, reply) => {
    const id = Number(request.params.id);
    const prize = request.body?.prize?.trim() ?? "";
    const productId = request.body?.productId?.trim() ?? "";

    if (!Number.isFinite(id) || !prize) {
      return reply.status(400).send({ error: "INVALID_BODY" });
    }

    const participant = await prisma.participant.findUnique({ where: { id } });
    if (!participant) {
      return reply.status(404).send({ error: "NOT_FOUND" });
    }

    if (productId) {
      const stockRow = await prisma.boothStock.findUnique({ where: { productId } });
      if (!stockRow || stockRow.count <= 0) {
        return reply.status(409).send({ error: "OUT_OF_STOCK", message: "해당 경품 재고가 없습니다." });
      }
      await prisma.boothStock.update({
        where: { productId },
        data: { count: stockRow.count - 1 },
      });
    }

    const updated = await prisma.participant.update({
      where: { id },
      data: { prize, completedAt: new Date() },
    });

    return { participant: toParticipantDto(updated), state: await getBoothState() };
  });
}
