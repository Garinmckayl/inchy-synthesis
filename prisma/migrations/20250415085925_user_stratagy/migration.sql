-- CreateTable
CREATE TABLE "UserStrategy" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "protocol" TEXT NOT NULL,
    "asset" TEXT NOT NULL,
    "apy" DOUBLE PRECISION NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserStrategy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserStrategy_userId_key" ON "UserStrategy"("userId");

-- AddForeignKey
ALTER TABLE "UserStrategy" ADD CONSTRAINT "UserStrategy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
