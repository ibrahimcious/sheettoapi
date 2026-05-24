/*
  Warnings:

  - You are about to drop the `Todo` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Todo";

-- CreateTable
CREATE TABLE "SheetConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sheetId" TEXT NOT NULL,
    "sheetName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "SheetConnection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SheetConnection_slug_key" ON "SheetConnection"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "SheetConnection_apiKey_key" ON "SheetConnection"("apiKey");

-- CreateIndex
CREATE UNIQUE INDEX "SheetConnection_userId_sheetId_key" ON "SheetConnection"("userId", "sheetId");

-- AddForeignKey
ALTER TABLE "SheetConnection" ADD CONSTRAINT "SheetConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
