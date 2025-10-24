// app/api/admin/matches/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/db";
import { z } from "zod";

const BodySchema = z.object({
  round: z.number().int().min(1).optional(),
  region: z.enum(["ES", "MX", "IT", "BR", "FR", "DE", "MENA"]).optional(),
  startsAt: z.string().optional(), // ISO string
  homeId: z.string().optional(),
  awayId: z.string().optional(),
  status: z.enum(["DRAFT", "OPEN", "LOCKED", "FINISHED"]).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const json = await req.json();
  const body = BodySchema.parse(json);

  const data: any = {};
  if (body.round !== undefined) data.round = body.round;
  if (body.region !== undefined) data.region = body.region;
  if (body.startsAt !== undefined) data.startsAt = new Date(body.startsAt);
  if (body.homeId !== undefined) data.homeId = body.homeId;
  if (body.awayId !== undefined) data.awayId = body.awayId;
  if (body.status !== undefined) data.status = body.status;

  const m = await prisma.match.update({
    where: { id: params.id },
    data,
    include: { home: true, away: true, result: true },
  });

  // OBS: os badges vêm de Team.badgeFile (m.home.badgeFile / m.away.badgeFile)
  return NextResponse.json(m);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.match.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
