-- CreateTable
CREATE TABLE "TwitchBot" (
  "key" TEXT NOT NULL,
  "twitchUserId" TEXT NOT NULL,
  "login" TEXT NOT NULL,
  "displayName" TEXT,
  "avatarUrl" TEXT,
  "accessToken" TEXT NOT NULL,
  "refreshToken" TEXT NOT NULL,
  "accessTokenExp" TIMESTAMP(3) NOT NULL,
  "scopes" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TwitchBot_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "TwitchBot_login_idx" ON "TwitchBot"("login");
