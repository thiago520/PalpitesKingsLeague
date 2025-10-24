import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/db";

export async function GET() {
  // quem já abriu captura ao menos uma vez (histórico)
  const caps = await prisma.capture.findMany({
    distinct: ["streamerUserId"],
    orderBy: { startedAt: "desc" },
    select: {
      streamerUserId: true,
      channelLogin: true,
      streamer: { select: { id: true, login: true, displayName: true, avatarUrl: true } },
    },
  });

  // dedup por streamerUserId (distinct + orderBy já ajuda)
  const seen = new Set<string>();
  const out = [];
  for (const c of caps) {
    if (seen.has(c.streamerUserId)) continue;
    seen.add(c.streamerUserId);
    out.push({
      id: c.streamer.id,
      login: c.streamer.login,
      displayName: c.streamer.displayName,
      avatarUrl: c.streamer.avatarUrl,
    });
  }

  return NextResponse.json(out);
}
