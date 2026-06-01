-- CreateTable
CREATE TABLE "BoothStock" (
    "productId" TEXT NOT NULL,
    "count" INTEGER NOT NULL,

    CONSTRAINT "BoothStock_pkey" PRIMARY KEY ("productId")
);

-- CreateTable
CREATE TABLE "VipEntry" (
    "id" SERIAL NOT NULL,
    "nameKr" TEXT NOT NULL DEFAULT '',
    "nameEn" TEXT NOT NULL DEFAULT '',
    "affiliation" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "VipEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Participant" (
    "id" SERIAL NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "affiliation" TEXT NOT NULL DEFAULT '',
    "jobType" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "prize" TEXT NOT NULL DEFAULT '',
    "isVip" BOOLEAN NOT NULL DEFAULT false,
    "quizQuestionId" INTEGER,
    "quizCorrect" BOOLEAN,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);
