import { prisma } from "../src/lib/prisma.js";
import { DEFAULT_PRIZES, DEFAULT_WHEEL_SEGMENT_COUNT } from "../src/lib/products.js";

async function main() {
  const prizeCount = await prisma.prizeProduct.count();
  if (prizeCount === 0) {
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
    console.log("기본 선물 목록 시드 완료");
  }

  const stockCount = await prisma.boothStock.count();
  if (stockCount === 0) {
    await prisma.boothStock.createMany({
      data: DEFAULT_PRIZES.map((p) => ({ productId: p.id, count: p.stock })),
    });
    console.log("기본 재고 시드 완료");
  }

  await prisma.boothSetting.upsert({
    where: { key: "wheelSegmentCount" },
    create: { key: "wheelSegmentCount", value: String(DEFAULT_WHEEL_SEGMENT_COUNT) },
    update: {},
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
