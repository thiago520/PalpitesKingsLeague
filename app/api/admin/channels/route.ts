import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/db";
import { requireAuth } from "@/src/lib/auth";

export async function GET() {
  // exige login (se quiser, restrinja a um admin específico depois)
  await requireAuth();

  // lista única por streamer, ordenada pelo último uso
  const rows = await prisma.capture.findMany({
    distinct: ["streamerUserId"],
    orderBy: [{ startedAt: "desc" }],
    select: {
      streamerUserId: true,
      channelLogin: true,
      streamer: { select: { displayName: true, login: true, avatarUrl: true } },
    },
  });

  return NextResponse.json(
    rows.map(r => ({
      streamerUserId: r.streamerUserId,
      channelLogin: r.channelLogin,
      displayName: r.streamer.displayName,
      avatarUrl: r.streamer.avatarUrl,
    }))
  );
}
