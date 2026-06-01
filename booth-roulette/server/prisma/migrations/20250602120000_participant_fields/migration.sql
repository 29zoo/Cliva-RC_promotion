-- AlterTable
ALTER TABLE "Participant" ADD COLUMN "jobType" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Participant" ADD COLUMN "phone" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Participant" ADD COLUMN "quizQuestionId" INTEGER;
ALTER TABLE "Participant" ADD COLUMN "quizCorrect" BOOLEAN;
ALTER TABLE "Participant" ADD COLUMN "completedAt" DATETIME;
