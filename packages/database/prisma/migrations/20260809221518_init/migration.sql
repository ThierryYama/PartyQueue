-- CreateEnum
CREATE TYPE "ExternalProvider" AS ENUM ('STEAM');

-- CreateEnum
CREATE TYPE "LibrarySyncStatus" AS ENUM ('NOT_CONNECTED', 'SYNC_PENDING', 'SYNCING', 'SYNCED', 'PRIVATE', 'FAILED', 'STALE');

-- CreateEnum
CREATE TYPE "MetadataStatus" AS ENUM ('PENDING', 'COMPLETE', 'PARTIAL', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_accounts" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "provider" "ExternalProvider" NOT NULL,
    "externalId" TEXT NOT NULL,
    "username" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "librarySyncStatus" "LibrarySyncStatus" NOT NULL DEFAULT 'NOT_CONNECTED',
    "librarySyncedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "external_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "games" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "coverUrl" TEXT,
    "releaseDate" DATE,
    "metadataStatus" "MetadataStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_external_mappings" (
    "id" UUID NOT NULL,
    "gameId" UUID NOT NULL,
    "platform" "ExternalProvider" NOT NULL,
    "externalGameId" TEXT NOT NULL,

    CONSTRAINT "game_external_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_metadata" (
    "gameId" UUID NOT NULL,
    "genres" TEXT[],
    "categories" TEXT[],
    "supportsOnlineCoop" BOOLEAN,
    "supportsLocalCoop" BOOLEAN,
    "supportsPvp" BOOLEAN,
    "minPlayers" INTEGER,
    "maxPlayers" INTEGER,
    "estimatedSessionMin" INTEGER,
    "difficultyScore" DECIMAL(3,2),
    "confidenceScore" DECIMAL(3,2),
    "raw" JSONB NOT NULL DEFAULT '{}',
    "sourceUpdatedAt" TIMESTAMPTZ(3),
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "game_metadata_pkey" PRIMARY KEY ("gameId")
);

-- CreateTable
CREATE TABLE "user_games" (
    "userId" UUID NOT NULL,
    "gameId" UUID NOT NULL,
    "platform" "ExternalProvider" NOT NULL,
    "owned" BOOLEAN NOT NULL DEFAULT true,
    "playtimeMinutes" INTEGER NOT NULL DEFAULT 0,
    "lastPlayedAt" TIMESTAMPTZ(3),
    "syncedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "user_games_pkey" PRIMARY KEY ("userId","gameId","platform")
);

-- CreateIndex
CREATE INDEX "external_accounts_userId_idx" ON "external_accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "external_accounts_provider_externalId_key" ON "external_accounts"("provider", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "games_slug_key" ON "games"("slug");

-- CreateIndex
CREATE INDEX "game_external_mappings_gameId_idx" ON "game_external_mappings"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "game_external_mappings_platform_externalGameId_key" ON "game_external_mappings"("platform", "externalGameId");

-- CreateIndex
CREATE INDEX "user_games_gameId_idx" ON "user_games"("gameId");

-- AddForeignKey
ALTER TABLE "external_accounts" ADD CONSTRAINT "external_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_external_mappings" ADD CONSTRAINT "game_external_mappings_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_metadata" ADD CONSTRAINT "game_metadata_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_games" ADD CONSTRAINT "user_games_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_games" ADD CONSTRAINT "user_games_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;
