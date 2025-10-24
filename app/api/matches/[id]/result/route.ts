import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/db";
import { getBasePoints } from "@/src/lib/auth";
import { cmpOutcome } from "@/src/lib/utils";
import { requireAuth } from "@/src/lib/auth";


export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
await requireAuth();


const { goalsHome, goalsAway } = await req.json();
const matchId = params.id;


const result = await prisma.result.upsert({
where: { matchId },
create: { matchId, goalsHome, goalsAway },
update: { goalsHome, goalsAway, decidedAt: new Date() },
});


const base = getBasePoints();


const guesses = await prisma.guess.findMany({ where: { matchId } });
for (const g of guesses) {
let pts = 0;
if (cmpOutcome(g.goalsHome, g.goalsAway, goalsHome, goalsAway)) pts += base;
if (g.goalsHome === goalsHome && g.goalsAway === goalsAway) pts += base;
await prisma.guess.update({ where: { id: g.id }, data: { pointsAwarded: pts } });
}


await prisma.match.update({ where: { id: matchId }, data: { status: "FINISHED" } });


return NextResponse.json({ ok: true, result });
}