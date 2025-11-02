// app/ranking/page.tsx
import Link from "next/link";
import { headers } from "next/headers"; // <-- importe isso
import RankingTable from "./RankingTable";

type Row = {
  twitchUserId: string;
  twitchLogin: string | null;
  twitchDisplay: string | null;
  points: number;
  hits: number;
};

function Medal({ pos }: { pos: number }) {
  if (pos === 1)
    return (
      <span title="1º" className="mr-2">
        🏆
      </span>
    );
  if (pos === 2)
    return (
      <span title="2º" className="mr-2">
        🥈
      </span>
    );
  if (pos === 3)
    return (
      <span title="3º" className="mr-2">
        🥉
      </span>
    );
  return <span className="w-5 inline-block" />;
}

// helper para montar a base absoluta com fallback
function getBaseUrl() {
  const h = headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host");
  return (
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (host ? `${proto}://${host}` : "http://localhost:3000")
  );
}

export default async function RankingPage({
  searchParams,
}: {
  searchParams?: { channel?: string };
}) {
  const channel = (searchParams?.channel || "").replace(/^@/, "").toLowerCase();
  const basePoints = Number(process.env.BASE_POINTS || "2");

  let rows: Row[] = [];
  if (channel) {
    const base = getBaseUrl();
    const res = await fetch(
      `${base}/api/leaderboard?channel=${encodeURIComponent(channel)}`,
      {
        next: { revalidate: 30 },
      }
    );
    if (res.ok) rows = await res.json();
  }

  const hasRows = rows.length > 0;

  return (
    <main className="min-h-screen bg-[#0b0b0b] text-zinc-100">
      {/* Header */}{" "}
      <header className="sticky top-0 z-20 border-b border-amber-400/20 bg-black/60 backdrop-blur-md">
        {" "}
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          {" "}
          <Link
            href="/matches"
            className="text-lg md:text-xl font-bold hover:text-amber-300 transition"
          >
            {" "}
            <span className="text-amber-300">Kings League</span> - Palpites{" "}
          </Link>{" "}
          <nav className="flex items-center gap-2">
            {" "}
            <Link
              href="/matches"
              className="rounded-lg px-3 py-1.5 border border-amber-400/60 bg-zinc-900 text-amber-200"
            >
              {" "}
              🔰 Partidas{" "}
            </Link>{" "}
            <Link
              href="/analytics"
              className="rounded-lg px-3 py-1.5 border border-green-400/30 hover:bg-zinc-900"
            >
              {" "}
              📊 Analytics{" "}
            </Link>{" "}
            <Link
              href="/ranking"
              className="rounded-lg px-3 py-1.5 border border-amber-400/60 bg-zinc-900 text-amber-200"
            >
              {" "}
              🏆 Ranking{" "}
            </Link>{" "}
            <form action="/api/auth/logout" method="POST">
              {" "}
              <button
                className="rounded-lg px-3 py-1.5 border border-red-500/40 hover:bg-red-500/10"
                type="submit"
              >
                {" "}
                ⇦ Sair{" "}
              </button>{" "}
            </form>{" "}
          </nav>{" "}
        </div>{" "}
      </header>
      <section className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        <h1 className="text-3xl font-extrabold">
          <span className="mr-2">🏆</span> Ranking de Palpites{" "}
          {channel ? `– @${channel}` : ""}
        </h1>

        {!channel && (
          <div className="rounded-xl border border-amber-400/20 bg-zinc-900/60 p-4 text-sm">
            Informe o canal: abra <code className="px-1 bg-black/40">@app</code>{" "}
            em{" "}
            <code className="px-1 bg-black/40">
              /ranking?channel=@seu_canal
            </code>
            .
          </div>
        )}

        {/* Tabela de Ranking Interativa */}
        <RankingTable rows={rows} channel={channel} />
      </section>
    </main>
  );
}
