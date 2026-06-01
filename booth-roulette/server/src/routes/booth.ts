import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import {
  ALLOWED_PROMO_MIMES,
  deletePromoVideo,
  getPromoVideoInfo,
  savePromoVideoFromUpload,
} from "../lib/promo-video.js";
import { DEFAULT_PRIZES, DEFAULT_WHEEL_SEGMENT_COUNT } from "../lib/products.js";
import { findVipMatch } from "../lib/vip.js";

export type PrizeDto = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  sortOrder: number;
  wheelSlots: number;
  stock: number;
};

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
  wheelSegmentCount: number;
  prizes: PrizeDto[];
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

async function getWheelSegmentCount(): Promise<number> {
  const row = await prisma.boothSetting.findUnique({ where: { key: "wheelSegmentCount" } });
  const n = row ? Number.parseInt(row.value, 10) : NaN;
  return Number.isFinite(n) && n >= 2 ? n : DEFAULT_WHEEL_SEGMENT_COUNT;
}

async function ensureDefaultPrizes() {
  const count = await prisma.prizeProduct.count();
  if (count > 0) return;

  await prisma.prizeProduct.createMany({
    data: DEFAULT_PRIZES.map(({ id, name, emoji, color, sortOrder, wheelSlots }) => ({
      id,
      name,
      emoji,
      color,
      sortOrder,
      wheelSlots,
    })),
  });

  const stockCount = await prisma.boothStock.count();
  if (stockCount === 0) {
    await prisma.boothStock.createMany({
      data: DEFAULT_PRIZES.map((p) => ({ productId: p.id, count: p.stock })),
    });
  } else {
    for (const p of DEFAULT_PRIZES) {
      await prisma.boothStock.upsert({
        where: { productId: p.id },
        create: { productId: p.id, count: p.stock },
        update: {},
      });
    }
  }

  await prisma.boothSetting.upsert({
    where: { key: "wheelSegmentCount" },
    create: { key: "wheelSegmentCount", value: String(DEFAULT_WHEEL_SEGMENT_COUNT) },
    update: {},
  });
}

export async function getBoothState(): Promise<BoothStateDto> {
  await ensureDefaultPrizes();

  const [prizeRows, stockRows, vipList, participants, wheelSegmentCount] = await Promise.all([
    prisma.prizeProduct.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.boothStock.findMany(),
    prisma.vipEntry.findMany({ orderBy: { id: "asc" } }),
    prisma.participant.findMany({ orderBy: { ts: "asc" } }),
    getWheelSegmentCount(),
  ]);

  const stockMap = new Map(stockRows.map((r) => [r.productId, r.count]));

  const prizes: PrizeDto[] = prizeRows.map((p) => ({
    id: p.id,
    name: p.name,
    emoji: p.emoji,
    color: p.color,
    sortOrder: p.sortOrder,
    wheelSlots: p.wheelSlots,
    stock: stockMap.get(p.id) ?? 0,
  }));

  return {
    wheelSegmentCount,
    prizes,
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

function validatePrizeConfig(
  wheelSegmentCount: unknown,
  prizes: unknown,
): { ok: true; wheelSegmentCount: number; prizes: PrizeDto[] } | { ok: false; message: string } {
  const segCount = Number(wheelSegmentCount);
  if (!Number.isFinite(segCount) || segCount < 2 || segCount > 36) {
    return { ok: false, message: "룰렛 등분 수는 2~36 사이여야 합니다." };
  }
  if (!Array.isArray(prizes) || prizes.length === 0) {
    return { ok: false, message: "선물을 1개 이상 등록해주세요." };
  }

  const ids = new Set<string>();
  let slotSum = 0;
  const normalized: PrizeDto[] = [];

  for (let i = 0; i < prizes.length; i++) {
    const raw = prizes[i] as Partial<PrizeDto>;
    const id = String(raw.id ?? "").trim();
    const name = String(raw.name ?? "").trim();
    const emoji = String(raw.emoji ?? "🎁").trim() || "🎁";
    const color = String(raw.color ?? "#60a5fa").trim() || "#60a5fa";
    const sortOrder = Number.isFinite(Number(raw.sortOrder)) ? Number(raw.sortOrder) : i;
    const wheelSlots = Number.parseInt(String(raw.wheelSlots ?? 1), 10);
    const stock = Number.parseInt(String(raw.stock ?? 0), 10);

    if (!id) return { ok: false, message: `${i + 1}번째 선물 ID가 비어 있습니다.` };
    if (ids.has(id)) return { ok: false, message: `중복된 선물 ID: ${id}` };
    ids.add(id);
    if (!name) return { ok: false, message: "선물 이름을 입력해주세요." };
    if (!Number.isFinite(wheelSlots) || wheelSlots < 1) {
      return { ok: false, message: `「${name}」 룰렛 칸 수는 1 이상이어야 합니다.` };
    }
    if (!Number.isFinite(stock) || stock < 0) {
      return { ok: false, message: `「${name}」 재고는 0 이상이어야 합니다.` };
    }

    slotSum += wheelSlots;
    normalized.push({ id, name, emoji, color, sortOrder, wheelSlots, stock });
  }

  if (slotSum !== segCount) {
    return {
      ok: false,
      message: `룰렛 칸 합(${slotSum})이 등분 수(${segCount})와 일치해야 합니다.`,
    };
  }

  return { ok: true, wheelSegmentCount: segCount, prizes: normalized };
}

export async function boothRoutes(app: FastifyInstance) {
  app.get("/api/booth/promo-video", async () => {
    const info = getPromoVideoInfo();
    if (!info) return { url: null };
    return info;
  });

  app.post("/api/booth/promo-video", async (request, reply) => {
    const data = await request.file();
    if (!data) {
      return reply.status(400).send({ error: "NO_FILE", message: "영상 파일을 선택해주세요." });
    }

    if (!ALLOWED_PROMO_MIMES.has(data.mimetype)) {
      return reply.status(400).send({
        error: "INVALID_TYPE",
        message: "MP4, WebM, MOV 형식만 업로드할 수 있습니다.",
      });
    }

    try {
      const info = await savePromoVideoFromUpload(data.file, data.mimetype, data.filename);
      return info;
    } catch (err) {
      request.log.error(err);
      return reply.status(500).send({ error: "UPLOAD_FAILED", message: "영상 업로드에 실패했습니다." });
    }
  });

  app.delete("/api/booth/promo-video", async () => {
    deletePromoVideo();
    return { ok: true };
  });

  app.get("/api/booth/state", async () => getBoothState());

  app.put<{ Body: Partial<BoothStateDto> }>("/api/booth/state", async (request, reply) => {
    const body = request.body ?? {};

    if (body.wheelSegmentCount !== undefined || body.prizes !== undefined) {
      const current = await getBoothState();
      const validated = validatePrizeConfig(
        body.wheelSegmentCount ?? current.wheelSegmentCount,
        body.prizes ?? current.prizes,
      );
      if (!validated.ok) {
        return reply.status(400).send({ error: "INVALID_PRIZES", message: validated.message });
      }

      const incomingIds = new Set(validated.prizes.map((p) => p.id));
      const existing = await prisma.prizeProduct.findMany();
      const toDelete = existing.filter((p) => !incomingIds.has(p.id)).map((p) => p.id);

      if (toDelete.length > 0) {
        await prisma.boothStock.deleteMany({ where: { productId: { in: toDelete } } });
        await prisma.prizeProduct.deleteMany({ where: { id: { in: toDelete } } });
      }

      for (const p of validated.prizes) {
        await prisma.prizeProduct.upsert({
          where: { id: p.id },
          create: {
            id: p.id,
            name: p.name,
            emoji: p.emoji,
            color: p.color,
            sortOrder: p.sortOrder,
            wheelSlots: p.wheelSlots,
          },
          update: {
            name: p.name,
            emoji: p.emoji,
            color: p.color,
            sortOrder: p.sortOrder,
            wheelSlots: p.wheelSlots,
          },
        });
        await prisma.boothStock.upsert({
          where: { productId: p.id },
          create: { productId: p.id, count: p.stock },
          update: { count: p.stock },
        });
      }

      await prisma.boothSetting.upsert({
        where: { key: "wheelSegmentCount" },
        create: { key: "wheelSegmentCount", value: String(validated.wheelSegmentCount) },
        update: { value: String(validated.wheelSegmentCount) },
      });
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
