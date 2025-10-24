-- CreateEnum
CREATE TYPE "MatchRegion" AS ENUM ('ES', 'MX', 'IT', 'BR', 'FR', 'DE', 'MENA');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('DRAFT', 'OPEN', 'LOCKED', 'FINISHED');

-- CreateEnum
CREATE TYPE "CaptureStatus" AS ENUM ('OPEN', 'LOCKED');

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "region" "MatchRegion" NOT NULL,
    "badgeFile" TEXT,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamAlias" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "alias" TEXT NOT NULL,

    CONSTRAINT "TeamAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "region" "MatchRegion" NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'DRAFT',
    "homeId" TEXT NOT NULL,
    "awayId" TEXT NOT NULL,
    "notesHome" TEXT,
    "notesAway" TEXT,
    "lineupHome" JSONB,
    "lineupAway" JSONB,
    "captureChannelLogin" TEXT,
    "captureStartedByUserId" TEXT,
    "captureStartedAt" TIMESTAMP(3),

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Capture" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "streamerUserId" TEXT NOT NULL,
    "channelLogin" TEXT NOT NULL,
    "status" "CaptureStatus" NOT NULL DEFAULT 'OPEN',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stoppedAt" TIMESTAMP(3),

    CONSTRAINT "Capture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "twitchUserId" TEXT NOT NULL,
    "login" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "accessTokenExp" TIMESTAMP(3) NOT NULL,
    "scopes" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guess" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "matchId" TEXT NOT NULL,
    "streamerUserId" TEXT NOT NULL,
    "channelLogin" TEXT NOT NULL,
    "twitchUserId" TEXT NOT NULL,
    "twitchLogin" TEXT NOT NULL,
    "twitchDisplay" TEXT NOT NULL,
    "goalsHome" INTEGER NOT NULL,
    "goalsAway" INTEGER NOT NULL,
    "pointsAwarded" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Guess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Result" (
    "matchId" TEXT NOT NULL,
    "goalsHome" INTEGER NOT NULL,
    "goalsAway" INTEGER NOT NULL,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Result_pkey" PRIMARY KEY ("matchId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Team_name_key" ON "Team"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Team_code_key" ON "Team"("code");

-- CreateIndex
CREATE INDEX "Team_region_idx" ON "Team"("region");

-- CreateIndex
CREATE INDEX "TeamAlias_alias_idx" ON "TeamAlias"("alias");

-- CreateIndex
CREATE UNIQUE INDEX "TeamAlias_teamId_alias_key" ON "TeamAlias"("teamId", "alias");

-- CreateIndex
CREATE INDEX "Capture_streamerUserId_idx" ON "Capture"("streamerUserId");

-- CreateIndex
CREATE INDEX "Capture_matchId_status_idx" ON "Capture"("matchId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Capture_matchId_streamerUserId_key" ON "Capture"("matchId", "streamerUserId");

-- CreateIndex
CREATE UNIQUE INDEX "User_twitchUserId_key" ON "User"("twitchUserId");

-- CreateIndex
CREATE UNIQUE INDEX "User_login_key" ON "User"("login");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Guess_twitchLogin_idx" ON "Guess"("twitchLogin");

-- CreateIndex
CREATE INDEX "Guess_streamerUserId_idx" ON "Guess"("streamerUserId");

-- CreateIndex
CREATE INDEX "Guess_channelLogin_idx" ON "Guess"("channelLogin");

-- CreateIndex
CREATE UNIQUE INDEX "Guess_matchId_streamerUserId_twitchUserId_key" ON "Guess"("matchId", "streamerUserId", "twitchUserId");

-- AddForeignKey
ALTER TABLE "TeamAlias" ADD CONSTRAINT "TeamAlias_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_awayId_fkey" FOREIGN KEY ("awayId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_captureStartedByUserId_fkey" FOREIGN KEY ("captureStartedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Capture" ADD CONSTRAINT "Capture_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Capture" ADD CONSTRAINT "Capture_streamerUserId_fkey" FOREIGN KEY ("streamerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guess" ADD CONSTRAINT "Guess_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guess" ADD CONSTRAINT "Guess_streamerUserId_fkey" FOREIGN KEY ("streamerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
