// app/api/admin/matches/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/db";
import { z } from "zod";

const BodySchema = z.object({
  round: z.number().int().min(1).optional(),
  region: z.enum(["ES", "MX", "IT", "BR", "FR", "DE", "MENA","QL_ES","QL_MX"]).optional(),
  startsAt: z.string().optional(), // ISO string
  homeId: z.string().optional(),
  awayId: z.string().optional(),
  status: z.enum(["DRAFT", "OPEN", "LOCKED", "FINISHED"]).optional(),
});

function wallclockToUTCDate(isoLocal: string): Date {
  const [d, t = "00:00"] = isoLocal.split("T");
  const [y, m, day] = d.split("-").map(Number);
  const [hh, mm = "0", ss = "0"] = t.split(":");
  return new Date(Date.UTC(y, m - 1, day, Number(hh), Number(mm), Number(ss)));
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const json = await req.json();
  const body = BodySchema.parse(json);

  const data: any = {};
  if (body.round !== undefined) data.round = body.round;
  if (body.region !== undefined) data.region = body.region;  
  if (body.homeId !== undefined) data.homeId = body.homeId;
  if (body.awayId !== undefined) data.awayId = body.awayId;
  if (body.status !== undefined) data.status = body.status;

  if (body.startsAt !== undefined) {
    // GRAVA EXATAMENTE O QUE FOI DIGITADO
    data.startsAt = wallclockToUTCDate(body.startsAt);
  }

  const m = await prisma.match.update({
    where: { id: params.id },
    data,
    include: { home: true, away: true, result: true },
  });

  // OBS: os badges vêm de Team.badgeFile (m.home.badgeFile / m.away.badgeFile)
  return NextResponse.json(m);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.match.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
