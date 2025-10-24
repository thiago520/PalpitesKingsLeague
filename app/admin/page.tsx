// app/admin/page.tsx
import { prisma } from "@/src/lib/db";
import { getSession } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import AdminClient from "./ui/AdminClient";

type Region = "ES" | "MX" | "IT" | "BR" | "FR" | "DE" | "MENA";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/");

  // TIMES com region
  const teams = await prisma.team.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      code: true,
      region: true,         // <- IMPORTANTE
      badgeFile: true,      // se existir no schema
    },
  });

  // PARTIDAS (inclui home/away e result). Region pode estar no Match
  const matchesRaw = await prisma.match.findMany({
    orderBy: { startsAt: "asc" },
    include: {
      home: { select: { id: true, name: true, code: true, region: true } },
      away: { select: { id: true, name: true, code: true, region: true } },
      result: { select: { goalsHome: true, goalsAway: true } },
    },
  });

  // Normaliza para o AdminClient (usa Match.region, senão region do mandante)
  const matches = matchesRaw.map((m) => ({
    id: m.id,
    round: m.round,
    region: (m as any).region ?? (m.home as any).region as Region,
    startsAt: m.startsAt.toISOString(),
    home: { id: m.home.id, name: m.home.name, code: m.home.code },
    away: { id: m.away.id, name: m.away.name, code: m.away.code },
    result: m.result ? { goalsHome: m.result.goalsHome, goalsAway: m.result.goalsAway } : null,
  }));

  const initialTeams = teams.map((t) => ({
    id: t.id,
    name: t.name,
    code: t.code,
    region: (t as any).region as Region, // garante tipagem
    badgeFile: (t as any).badgeFile ?? null,
  }));

  return <AdminClient initialTeams={initialTeams} initialMatches={matches} />;
}
