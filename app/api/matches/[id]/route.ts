import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/db";
import { getSession } from "@/src/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  const userId = session?.user.id ?? null;

  const m = await prisma.match.findUnique({
    where: { id: params.id },
    include: { home: true, away: true, result: true },
  });
  if (!m) return new NextResponse("Not found", { status: 404 });

  let myCapture: { status: "OPEN" | "LOCKED"; channelLogin: string } | null = null;
  if (userId) {
    const cap = await prisma.capture.findUnique({
      where: { matchId_streamerUserId: { matchId: m.id, streamerUserId: userId } },
      select: { status: true, channelLogin: true },
    });
    if (cap) myCapture = cap;
  }

  return NextResponse.json({
    id: m.id,
    round: m.round,
    region: m.region,
    startsAt: m.startsAt,
    status: m.status, // global
    home: { name: m.home.name, code: m.home.code },
    away: { name: m.away.name, code: m.away.code },
    homeBadgeFile: m.home.badgeFile,
    awayBadgeFile: m.away.badgeFile,
    result: m.result,
    myCapture,
  });
}
