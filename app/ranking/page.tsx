// app/ranking/page.tsx
import Link from "next/link";
import { prisma } from "@/src/lib/db";
import { getSession } from "@/src/lib/auth";

type Row = {
  twitchUserId: string;
  twitchLogin: string | null;
  twitchDisplay: string | null;
  points: number;
  hits: number; // quantidade de palpites com pointsAwarded > 0
};

function Medal({ pos }: { pos: number }) {
  if (pos === 1) return <span title="1º" className="mr-2">🏆</span>;
  if (pos === 2) return <span title="2º" className="mr-2">🥈</span>;
  if (pos === 3) return <span title="3º" className="mr-2">🥉</span>;
  return <span className="w-5 inline-block" />;
}

export default async function RankingPage({
  searchParams,
}: {
  searchParams?: { channel?: string };
}) {
  // contexto do canal:
  // - se vier ?channel=@login usa esse canal
  // - senão tenta o streamer logado (streamerUserId)
  // - se nada disso existir, retorna ranking vazio
  const channel = (searchParams?.channel || "")
    .replace(/^@/, "")
    .toLowerCase();

  let where: Record<string, any> | null = null;

  if (channel) {
    where = { channelLogin: channel };
  } else {
    const session = await getSession();
    if (session?.user?.id) {
      where = { streamerUserId: session.user.id };
    } else {
      where = null; // sem contexto → lista vazia
    }
  }

  let rows: Row[] = [];
  if (where) {
    // soma de pontos por viewer (somente no canal/contexto atual)
    const pointsAgg = await prisma.guess.groupBy({
      by: ["twitchUserId", "twitchLogin", "twitchDisplay"],
      where,
      _sum: { pointsAwarded: true },
    });

    // contagem de acertos (pontuação > 0) no mesmo contexto
    const hitsAgg = await prisma.guess.groupBy({
      where: { ...where, pointsAwarded: { gt: 0 } },
      by: ["twitchUserId"],
      _count: { _all: true },
    });

    const hitsMap = new Map(hitsAgg.map((h) => [h.twitchUserId, h._count._all]));
    rows = pointsAgg.map((p) => ({
      twitchUserId: p.twitchUserId,
      twitchLogin: p.twitchLogin,
      twitchDisplay: p.twitchDisplay,
      points: p._sum.pointsAwarded ?? 0,
      hits: hitsMap.get(p.twitchUserId) ?? 0,
    }));
  }

  rows.sort((a, b) => b.points - a.points || b.hits - a.hits);

  const basePoints = Number(process.env.BASE_POINTS || "2"); // usado só para texto do card
  const hasRows = rows.length > 0;

  return (
    <main className="min-h-screen bg-[#0b0b0b] text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-amber-400/20 bg-black/60 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Link href="/matches" className="text-lg md:text-xl font-bold hover:text-amber-300 transition">
            <span className="text-amber-300">Kings League</span> - Palpites
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              href="/matches"
              className="rounded-lg px-3 py-1.5 border border-amber-400/60 bg-zinc-900 text-amber-200"
            >
              🔰 Partidas
            </Link>
            <Link
              href="/analytics"
              className="rounded-lg px-3 py-1.5 border border-green-400/30 hover:bg-zinc-900"
            >
              📊 Analytics
            </Link>
            <Link
              href="/ranking"
              className="rounded-lg px-3 py-1.5 border border-amber-400/60 bg-zinc-900 text-amber-200"
            >
              🏆 Ranking
            </Link>
            <form action="/api/auth/logout" method="POST">
              <button className="rounded-lg px-3 py-1.5 border border-red-500/40 hover:bg-red-500/10" type="submit">
                ⇦ Sair
              </button>
            </form>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        <h1 className="text-3xl font-extrabold">
          <span className="mr-2">🏆</span> Ranking de Palpites
        </h1>

        {/* Card com regras de pontuação */}
        <div className="rounded-xl border border-amber-400/20 bg-zinc-900/60 p-4 text-sm text-zinc-300 shadow-[0_0_0_1px_rgba(255,196,28,0.06)]">
          <div className="font-semibold text-amber-200 mb-1">Como funciona a pontuação</div>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Acertou <strong>vencedor/empate</strong>: <span className="text-amber-300">+{basePoints}</span> pts
            </li>
            <li>
              Acertou <strong>placar exato</strong>: <span className="text-amber-300">+{basePoints}</span> pts adicionais
              <span className="opacity-80"> (total {basePoints * 2})</span>
            </li>
          </ul>
        </div>

        {/* Tabela de ranking */}
        <div className="rounded-2xl border border-amber-400/25 overflow-hidden">
          <div className="bg-zinc-950/60 px-5 py-4 border-b border-amber-400/20">
            <h2 className="text-xl font-semibold">Classificação Geral</h2>
          </div>

          {!hasRows ? (
            <div className="p-6 text-zinc-400">
              Ainda não há pontos no ranking{channel ? ` para @${channel}` : ""}.
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {/* Cabeçalho */}
              <div className="grid grid-cols-[80px_1fr_120px_120px] px-5 py-3 text-sm text-zinc-400">
                <div>Posição</div>
                <div>Participante</div>
                <div className="text-right">Acertos</div>
                <div className="text-right">Pontos</div>
              </div>

              {/* Linhas */}
              {rows.map((r, i) => {
                const pos = i + 1;
                const isOdd = i % 2 === 0;
                const top3 = pos <= 3;
                return (
                  <div
                    key={r.twitchUserId}
                    className={[
                      "grid grid-cols-[80px_1fr_120px_120px] items-center px-5 py-3",
                      isOdd ? "bg-zinc-950/40" : "bg-zinc-950/20",
                      top3 && pos === 1 ? "bg-amber-400/10" : "",
                      top3 && pos === 3 ? "bg-amber-400/10" : "",
                      "hover:bg-zinc-900/60 transition",
                    ].join(" ")}
                  >
                    {/* posição */}
                    <div className="font-semibold">
                      <Medal pos={pos} />
                      <span className="tabular-nums">{pos}º</span>
                    </div>

                    {/* participante */}
                    <div className="truncate">
                      <span className="font-medium">{r.twitchDisplay || r.twitchLogin || "—"}</span>
                      {r.twitchLogin && (
                        <span className="ml-2 text-xs text-zinc-500">@{r.twitchLogin}</span>
                      )}
                    </div>

                    {/* acertos */}
                    <div className="text-right tabular-nums">{r.hits}</div>

                    {/* pontos */}
                    <div className="text-right tabular-nums font-semibold text-amber-300">{r.points}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
