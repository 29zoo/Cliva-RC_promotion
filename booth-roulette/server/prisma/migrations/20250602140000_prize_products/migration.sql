-- CreateTable
CREATE TABLE "PrizeProduct" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '🎁',
    "color" TEXT NOT NULL DEFAULT '#60a5fa',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "wheelSlots" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "PrizeProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoothSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "BoothSetting_pkey" PRIMARY KEY ("key")
);

-- Seed default prizes (matches legacy 6-segment wheel)
INSERT INTO "PrizeProduct" ("id", "name", "emoji", "color", "sortOrder", "wheelSlots") VALUES
  ('brush', '칫솔', '🪥', '#60a5fa', 0, 3),
  ('battery', '보조배터리', '🔋', '#f59e0b', 1, 1),
  ('fan', '부채', '🪭', '#10b981', 2, 1),
  ('ecobag', '에코백', '🛍️', '#ec4899', 3, 1);

INSERT INTO "BoothSetting" ("key", "value") VALUES ('wheelSegmentCount', '6');

-- Ensure stock rows exist for default products (no-op if already present)
INSERT INTO "BoothStock" ("productId", "count") VALUES
  ('brush', 1000),
  ('battery', 100),
  ('fan', 100),
  ('ecobag', 100)
ON CONFLICT ("productId") DO NOTHING;
