import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/db";

export const dynamic = "force-dynamic"; // evita cache chato em dev/prod
export const revalidate = 30;

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const channelParam = url.searchParams.get("channel");
  const streamerIdParam = url.searchParams.get("streamerId");

  if (!channelParam && !streamerIdParam) {
    return NextResponse.json({ error: "missing_channel" }, { status: 400 });
  }

  const where: any = {};
  if (streamerIdParam) where.streamerUserId = streamerIdParam;
  if (channelParam) where.channelLogin = channelParam.replace(/^@/, "").toLowerCase();

  // soma de pontos
  const pointsAgg = await prisma.guess.groupBy({
    by: ["twitchUserId", "twitchLogin", "twitchDisplay"],
    where,
    _sum: { pointsAwarded: true },
    orderBy: { _sum: { pointsAwarded: "desc" } },
    take: 100,
  });

  // contagem de acertos (pontuação > 0) no mesmo contexto
  const hitsAgg = await prisma.guess.groupBy({
    by: ["twitchUserId"],
    where: { ...where, pointsAwarded: { gt: 0 } },
    _count: { _all: true },
  });
  const hitsMap = new Map(hitsAgg.map(h => [h.twitchUserId, h._count._all]));

  return NextResponse.json(pointsAgg.map(p => ({
    twitchUserId: p.twitchUserId,
    twitchLogin: p.twitchLogin,
    twitchDisplay: p.twitchDisplay,
    points: p._sum.pointsAwarded ?? 0,
    hits: hitsMap.get(p.twitchUserId) ?? 0,
  })));
}
