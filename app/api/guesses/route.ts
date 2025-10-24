import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/db";
import { requireAuth } from "@/src/lib/auth";

export async function GET(req: NextRequest) {
  const user = await requireAuth(); // precisamos saber qual canal está vendo
  const matchId = new URL(req.url).searchParams.get("matchId");
  if (!matchId) return new NextResponse("Missing matchId", { status: 400 });

  const guesses = await prisma.guess.findMany({
    where: { matchId, streamerUserId: user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, twitchDisplay: true, goalsHome: true, goalsAway: true },
  });

  return NextResponse.json(guesses);
}
