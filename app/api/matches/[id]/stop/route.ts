import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/db";
import { requireAuth } from "@/src/lib/auth";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAuth();

  const cap = await prisma.capture.update({
    where: { matchId_streamerUserId: { matchId: params.id, streamerUserId: user.id } },
    data: { status: "LOCKED", stoppedAt: new Date() },
    select: { status: true, channelLogin: true },
  }).catch(() => null);

  if (!cap) return new NextResponse("No open capture for this user", { status: 404 });
  return NextResponse.json({ ok: true, myCapture: cap });
}
