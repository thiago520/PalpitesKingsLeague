// app/api/leaderboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/db";
import { getSession } from "@/src/lib/auth";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const channelParam = url.searchParams.get("channel");     // ex.: "@meucanal" ou "meucanal"
  const streamerIdParam = url.searchParams.get("streamerId");

  const where: any = {};

  if (streamerIdParam) {
    where.streamerUserId = streamerIdParam;
  } else if (channelParam) {
    where.channelLogin = channelParam.replace(/^@/, "").toLowerCase();
  } else {
    // fallback: tenta usar o streamer logado
    const session = await getSession();
    if (session?.user?.id) {
      where.streamerUserId = session.user.id;
    } else {
      // sem filtro → devolve vazio (200) para não quebrar a página
      return NextResponse.json([]);
    }
  }

  const rows = await prisma.guess.groupBy({
    by: ["twitchUserId", "twitchLogin", "twitchDisplay"],
    where,
    _sum: { pointsAwarded: true },
    orderBy: { _sum: { pointsAwarded: "desc" } },
  });

  const data = rows.map(r => ({
    twitchUserId: r.twitchUserId,
    twitchLogin: r.twitchLogin,
    twitchDisplay: r.twitchDisplay,
    points: r._sum.pointsAwarded ?? 0,
  }));

  return NextResponse.json(data);
}
