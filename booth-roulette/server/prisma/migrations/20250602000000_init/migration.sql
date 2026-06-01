-- CreateTable
CREATE TABLE "BoothStock" (
    "productId" TEXT NOT NULL PRIMARY KEY,
    "count" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "VipEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nameKr" TEXT NOT NULL DEFAULT '',
    "nameEn" TEXT NOT NULL DEFAULT '',
    "affiliation" TEXT NOT NULL DEFAULT ''
);

-- CreateTable
CREATE TABLE "Participant" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ts" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "affiliation" TEXT NOT NULL DEFAULT '',
    "prize" TEXT NOT NULL,
    "isVip" BOOLEAN NOT NULL DEFAULT false
);
