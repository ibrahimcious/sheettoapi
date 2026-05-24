-- CreateTable
CREATE TABLE "Todo" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Todo_pkey" PRIMARY KEY ("id")
);
