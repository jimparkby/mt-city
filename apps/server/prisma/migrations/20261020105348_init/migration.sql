-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mobyUserId" TEXT,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "mode" TEXT NOT NULL,
    "bankLevel" INTEGER NOT NULL DEFAULT 1,
    "knowledge" INTEGER NOT NULL DEFAULT 0,
    "energy" INTEGER NOT NULL DEFAULT 100,
    "health" INTEGER NOT NULL DEFAULT 100,
    "creditScore" INTEGER NOT NULL DEFAULT 600,
    "insured" BOOLEAN NOT NULL DEFAULT false,
    "onboardedAt" DATETIME,
    "lastTickAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 10000,
    "walletCap" INTEGER NOT NULL DEFAULT 50000,
    CONSTRAINT "Account_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Deposit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "principal" INTEGER NOT NULL,
    "rateBp" INTEGER NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" DATETIME,
    "closedAt" DATETIME,
    CONSTRAINT "Deposit_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Loan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerId" TEXT NOT NULL,
    "principal" INTEGER NOT NULL,
    "rateBp" INTEGER NOT NULL,
    "periods" INTEGER NOT NULL,
    "payment" INTEGER NOT NULL,
    "paidPeriods" INTEGER NOT NULL DEFAULT 0,
    "nextDueAt" DATETIME NOT NULL,
    "overdue" INTEGER NOT NULL DEFAULT 0,
    "purpose" TEXT NOT NULL,
    CONSTRAINT "Loan_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Business" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalForm" TEXT,
    "price" INTEGER NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "prodQty" INTEGER NOT NULL DEFAULT 0,
    "prodEndsAt" DATETIME,
    CONSTRAINT "Business_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Shop" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "district" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "bulkMinQty" INTEGER,
    "bulkPrice" INTEGER,
    "shelfLife" INTEGER,
    "demandBase" INTEGER NOT NULL DEFAULT 20,
    "refPrice" INTEGER,
    CONSTRAINT "Product_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "unitCost" INTEGER NOT NULL,
    "expiresAt" DATETIME,
    CONSTRAINT "InventoryItem_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlayerBuilding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerId" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "upgradeEndsAt" DATETIME,
    CONSTRAINT "PlayerBuilding_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LessonProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "score" INTEGER,
    CONSTRAINT "LessonProgress_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "meta" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Transaction_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ParentTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "rewardByn" INTEGER NOT NULL,
    "rewardCoin" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ParentTask_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Player_mobyUserId_key" ON "Player"("mobyUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_playerId_key" ON "Account"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "Business_playerId_key" ON "Business"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_shopId_sku_key" ON "Product"("shopId", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerBuilding_playerId_buildingId_key" ON "PlayerBuilding"("playerId", "buildingId");

-- CreateIndex
CREATE UNIQUE INDEX "LessonProgress_playerId_lessonId_key" ON "LessonProgress"("playerId", "lessonId");

-- CreateIndex
CREATE INDEX "Transaction_playerId_createdAt_idx" ON "Transaction"("playerId", "createdAt");
