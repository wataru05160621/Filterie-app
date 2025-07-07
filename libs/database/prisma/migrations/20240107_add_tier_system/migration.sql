-- 情報源Tier管理テーブル
CREATE TABLE "SourceTier" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "tier" INTEGER NOT NULL CHECK ("tier" BETWEEN 1 AND 4),
    "confidence" DOUBLE PRECISION NOT NULL CHECK ("confidence" BETWEEN 0 AND 1),
    "verificationStatus" TEXT NOT NULL,
    "reasoning" JSONB DEFAULT '[]',
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SourceTier_pkey" PRIMARY KEY ("id")
);

-- 信頼ドメインマスタ
CREATE TABLE "TrustedDomain" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "organization" TEXT NOT NULL,
    "tier" INTEGER NOT NULL CHECK ("tier" BETWEEN 1 AND 4),
    "category" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrustedDomain_pkey" PRIMARY KEY ("id")
);

-- 認証済みアカウントマスタ
CREATE TABLE "VerifiedAccount" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "personName" TEXT,
    "title" TEXT,
    "organization" TEXT,
    "tier" INTEGER NOT NULL CHECK ("tier" BETWEEN 1 AND 4),
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerifiedAccount_pkey" PRIMARY KEY ("id")
);

-- 情報源信頼性履歴
CREATE TABLE "SourceReliabilityHistory" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "accuracyScore" DOUBLE PRECISION,
    "correctionCount" INTEGER NOT NULL DEFAULT 0,
    "falseInfoCount" INTEGER NOT NULL DEFAULT 0,
    "evaluationPeriodStart" TIMESTAMP(3),
    "evaluationPeriodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SourceReliabilityHistory_pkey" PRIMARY KEY ("id")
);

-- Unique constraints
CREATE UNIQUE INDEX "SourceTier_sourceId_key" ON "SourceTier"("sourceId");
CREATE UNIQUE INDEX "TrustedDomain_domain_key" ON "TrustedDomain"("domain");
CREATE UNIQUE INDEX "VerifiedAccount_platform_accountId_key" ON "VerifiedAccount"("platform", "accountId");

-- Indexes
CREATE INDEX "SourceTier_tier_idx" ON "SourceTier"("tier");
CREATE INDEX "SourceTier_sourceId_idx" ON "SourceTier"("sourceId");
CREATE INDEX "TrustedDomain_domain_idx" ON "TrustedDomain"("domain");
CREATE INDEX "VerifiedAccount_platform_accountId_idx" ON "VerifiedAccount"("platform", "accountId");

-- Foreign keys
ALTER TABLE "SourceTier" ADD CONSTRAINT "SourceTier_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SourceReliabilityHistory" ADD CONSTRAINT "SourceReliabilityHistory_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;