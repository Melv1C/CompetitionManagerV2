-- CreateTable
CREATE TABLE "organization_creation_idempotency" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_creation_idempotency_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organization_creation_idempotency_adminUserId_idempotencyKey_key" ON "organization_creation_idempotency"("adminUserId", "idempotencyKey");
CREATE INDEX "organization_creation_idempotency_organizationId_idx" ON "organization_creation_idempotency"("organizationId");

-- AddForeignKey
ALTER TABLE "organization_creation_idempotency" ADD CONSTRAINT "organization_creation_idempotency_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "organization_creation_idempotency" ADD CONSTRAINT "organization_creation_idempotency_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
