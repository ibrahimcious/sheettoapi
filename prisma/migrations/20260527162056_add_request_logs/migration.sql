-- CreateTable
CREATE TABLE "RequestLog" (
    "id" TEXT NOT NULL,
    "sheetConnectionId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "status" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequestLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RequestLog_sheetConnectionId_createdAt_idx" ON "RequestLog"("sheetConnectionId", "createdAt");

-- AddForeignKey
ALTER TABLE "RequestLog" ADD CONSTRAINT "RequestLog_sheetConnectionId_fkey" FOREIGN KEY ("sheetConnectionId") REFERENCES "SheetConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
