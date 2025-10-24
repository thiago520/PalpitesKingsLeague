import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/db";
import { getSession } from "@/src/lib/auth";

export async function GET() {
  const session = await getSession();
  const userId = session?.user.id ?? null;

  const list = await prisma.match.findMany({
    orderBy: { startsAt: "asc" },
    include: { home: true, away: true, result: true },
  });

  // se logado, traga capturas do usuário em lote
  let caps: Record<string, { status: "OPEN"|"LOCKED"; channelLogin: string }> = {};
  if (userId) {
    const rows = await prisma.capture.findMany({
      where: { streamerUserId: userId },
      select: { matchId: true, status: true, channelLogin: true },
    });
    for (const c of rows) caps[c.matchId] = { status: c.status, channelLogin: c.channelLogin };
  }

  return NextResponse.json(
    list.map(m => ({
      id: m.id,
      round: m.round,
      region: m.region,
      startsAt: m.startsAt,
      status: m.status,
      home: { name: m.home.name, code: m.home.code },
      away: { name: m.away.name, code: m.away.code },
      homeBadgeFile: m.home.badgeFile,
      awayBadgeFile: m.away.badgeFile,
      result: m.result,
      myCapture: userId ? (caps[m.id] ?? null) : null,
    }))
  );
}
