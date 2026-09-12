-- CreateTable
CREATE TABLE "club" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "club_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "club_membership" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'manager',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "club_membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "club_creation_idempotency" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "club_creation_idempotency_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "club_membership_clubId_userId_key" ON "club_membership"("clubId", "userId");
CREATE INDEX "club_membership_userId_idx" ON "club_membership"("userId");
CREATE UNIQUE INDEX "club_creation_idempotency_userId_idempotencyKey_key" ON "club_creation_idempotency"("userId", "idempotencyKey");
CREATE INDEX "club_creation_idempotency_clubId_idx" ON "club_creation_idempotency"("clubId");

-- AddForeignKey
ALTER TABLE "club_membership" ADD CONSTRAINT "club_membership_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "club"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "club_membership" ADD CONSTRAINT "club_membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "club_creation_idempotency" ADD CONSTRAINT "club_creation_idempotency_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "club"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "club_creation_idempotency" ADD CONSTRAINT "club_creation_idempotency_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
