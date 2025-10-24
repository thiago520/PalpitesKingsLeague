import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/db";
import { requireAuth } from "@/src/lib/auth";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAuth();

  // não abrir se já FINALIZADO globalmente
  const match = await prisma.match.findUnique({ where: { id: params.id }, select: { status: true } });
  if (!match) return new NextResponse("Match not found", { status: 404 });
  if (match.status === "FINISHED") return new NextResponse("Match already finished", { status: 400 });

  const cap = await prisma.capture.upsert({
    where: { matchId_streamerUserId: { matchId: params.id, streamerUserId: user.id } },
    update: { status: "OPEN", channelLogin: user.login, stoppedAt: null },
    create: {
      matchId: params.id,
      streamerUserId: user.id,
      channelLogin: user.login,
      status: "OPEN",
    },
    select: { status: true, channelLogin: true },
  });

  return NextResponse.json({ ok: true, myCapture: cap });
}
