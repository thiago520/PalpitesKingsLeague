// app/api/admin/matches/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/db";
import { requireAdmin } from "@/src/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  await requireAdmin();
  const body = await req.json();

  const m = await prisma.match.update({
    where: { id: params.id },
    data: {
      round: body.round !== undefined ? Number(body.round) : undefined,
      region: body.region,
      startsAt: body.startsAt ? new Date(body.startsAt) : undefined,
      homeId: body.homeId,
      awayId: body.awayId,
      homeBadgeFile: body.homeBadgeFile ?? undefined,
      awayBadgeFile: body.awayBadgeFile ?? undefined,
      status: body.status, // opcional (DRAFT/OPEN/LOCKED/FINISHED)
    },
    include: { home: true, away: true },
  });

  return NextResponse.json(m);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await requireAdmin();
  await prisma.match.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
