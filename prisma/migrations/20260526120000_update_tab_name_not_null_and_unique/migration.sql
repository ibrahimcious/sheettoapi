-- Backfill NULL tabName to empty string before making it NOT NULL
UPDATE "SheetConnection" SET "tabName" = '' WHERE "tabName" IS NULL;

-- Make tabName NOT NULL with default ''
ALTER TABLE "SheetConnection" ALTER COLUMN "tabName" SET DEFAULT '';
ALTER TABLE "SheetConnection" ALTER COLUMN "tabName" SET NOT NULL;

-- Drop old unique index (userId, sheetId)
DROP INDEX "SheetConnection_userId_sheetId_key";

-- Add new unique index (userId, sheetId, tabName)
CREATE UNIQUE INDEX "SheetConnection_userId_sheetId_tabName_key" ON "SheetConnection"("userId", "sheetId", "tabName");
