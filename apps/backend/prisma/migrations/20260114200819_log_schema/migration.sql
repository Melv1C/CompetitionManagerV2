-- CreateEnum
CREATE TYPE "LogType" AS ENUM ('APP', 'REQUEST');

-- CreateTable
CREATE TABLE "log" (
    "id" SERIAL NOT NULL,
    "type" "LogType" NOT NULL,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "userId" TEXT,
    "method" TEXT,
    "path" TEXT,
    "statusCode" INTEGER,
    "durationMs" INTEGER,
    "steps" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "log_type_idx" ON "log"("type");

-- CreateIndex
CREATE INDEX "log_level_idx" ON "log"("level");

-- CreateIndex
CREATE INDEX "log_userId_idx" ON "log"("userId");

-- CreateIndex
CREATE INDEX "log_createdAt_idx" ON "log"("createdAt");
