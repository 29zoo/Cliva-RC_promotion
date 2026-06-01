import { prisma } from "../src/lib/prisma.js";
import { DEFAULT_STOCK } from "../src/lib/products.js";

async function main() {
  const count = await prisma.boothStock.count();
  if (count === 0) {
    await prisma.boothStock.createMany({
      data: Object.entries(DEFAULT_STOCK).map(([productId, count]) => ({
        productId,
        count,
      })),
    });
    console.log("기본 재고 시드 완료");
  } else {
    console.log("재고 데이터가 이미 존재합니다 — 시드 건너뜀");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
