/*
  Warnings:

  - Made the column `title` on table `Summary` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Summary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "articleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "summaryHtml" TEXT NOT NULL,
    "modelUsed" TEXT NOT NULL,
    "promptTokens" INTEGER NOT NULL DEFAULT 0,
    "responseTokens" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "errorMsg" TEXT,
    "estimatedCost" REAL NOT NULL DEFAULT 0.0,
    "modelSelectionReason" TEXT NOT NULL DEFAULT '',
    "wasTruncated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Summary" ("articleId", "createdAt", "errorMsg", "id", "language", "modelUsed", "promptTokens", "responseTokens", "status", "summaryHtml", "title", "updatedAt") SELECT "articleId", "createdAt", "errorMsg", "id", "language", "modelUsed", "promptTokens", "responseTokens", "status", "summaryHtml", "title", "updatedAt" FROM "Summary";
DROP TABLE "Summary";
ALTER TABLE "new_Summary" RENAME TO "Summary";
CREATE UNIQUE INDEX "Summary_articleId_key" ON "Summary"("articleId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
