// app/api/admin/matches/route.ts (POST)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/db";
import { requireAdmin } from "@/src/lib/auth";

export async function POST(req: NextRequest) {
  await requireAdmin();
  const body = await req.json();

  if (
    !body.homeId ||
    !body.awayId ||
    !body.startsAt ||
    !body.round ||
    !body.region
  ) {
    return new NextResponse("Dados incompletos", { status: 400 });
  }
  if (body.homeId === body.awayId) {
    return new NextResponse("Times não podem ser iguais", { status: 400 });
  }

  const m = await prisma.match.create({
    data: {
      round: Number(body.round),
      region: body.region,
      startsAt: new Date(body.startsAt),
      status: "DRAFT",
      homeId: body.homeId,
      awayId: body.awayId,
    },
    include: { home: true, away: true },
  });

  return NextResponse.json(m);
}
