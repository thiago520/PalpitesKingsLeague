import { prisma } from "./db";
import { refreshAccessToken } from "./twitch";

export async function getBotRecord() {
  return prisma.twitchBot.findUnique({ where: { key: "main" } });
}

export async function ensureValidBotAccess(options?: { forceRefresh?: boolean }) {
  const bot = await getBotRecord();
  if (!bot) throw new Error("Bot não configurado no banco. Autorize em /api/auth/twitch/bot/login");

  const now = Date.now();
  const expMs = bot.accessTokenExp.getTime();

  if (!options?.forceRefresh && expMs - now > 60_000) {
    return bot.accessToken;
  }

  const refreshed = await refreshAccessToken(bot.refreshToken);
  const exp = new Date(Date.now() + refreshed.expires_in * 1000);

  const updated = await prisma.twitchBot.update({
    where: { key: "main" },
    data: {
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token ?? bot.refreshToken,
      accessTokenExp: exp,
      scopes: refreshed.scope.join(" "),
    },
  });

  return updated.accessToken;
}
