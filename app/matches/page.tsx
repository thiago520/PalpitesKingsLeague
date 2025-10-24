// app/matches/page.tsx
import Link from "next/link";
import Image from "next/image";
import { getSession } from "@/src/lib/auth";
import { redirect } from "next/navigation";

// Regiões/paises da liga (batendo com enum MatchRegion do Prisma)
type Region = "ES" | "MX" | "IT" | "BR" | "FR" | "DE" | "MENA";

type Match = {
  id: string;
  round: number;
  startsAt: string;
  status: "DRAFT" | "OPEN" | "LOCKED" | "FINISHED";
  region: Region;
  home: { name: string };
  away: { name: string };
  homeBadgeFile?: string | null;
  awayBadgeFile?: string | null;
};

const REGION_LABELS: Record<Region, string> = {
  ES: "Espanha",
  MX: "México",
  IT: "Itália",
  BR: "Brasil",
  FR: "França",
  DE: "Alemanha",
  MENA: "MENA",
};

async function getMatches(): Promise<Match[]> {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  const res = await fetch(`${base}/api/matches`, { cache: "no-store" });
  if (!res.ok) throw new Error("Falha ao carregar partidas");
  return res.json();
}

function Tabs({ current }: { current: Region }) {
  const order: Region[] = ["BR", "ES", "MX", "IT", "FR", "DE", "MENA"];
  return (
    <div className="flex flex-wrap gap-2">
      {order.map((key) => {
        const active = key === current;
        return (
          <Link
            key={key}
            href={`/matches?region=${key}`}
            className={[
              "rounded-full px-4 py-2 text-sm font-semibold border transition",
              active
                ? "bg-amber-400 text-black border-amber-400"
                : "bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700",
            ].join(" ")}
          >
            {REGION_LABELS[key]}
          </Link>
        );
      })}
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" className="inline-block align-[-2px]" fill="currentColor">
      <path d="M7 2h2v2h6V2h2v2h3v18H4V4h3V2Zm13 8H6v10h14V10Z" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" className="inline-block align-[-2px]" fill="currentColor">
      <path d="M12 1a11 11 0 1 1 0 22A11 11 0 0 1 12 1Zm1 6h-2v6l5 3 1-1.73-4-2.27V7Z" />
    </svg>
  );
}

function formatDate(s: string) {
  try {
    return new Date(s).toLocaleDateString("pt-BR");
  } catch {
    return s;
  }
}
function formatTime(s: string) {
  try {
    return new Date(s).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function Crest({ file, alt }: { file?: string | null; alt: string }) {
  const src = file ? `/img/${file}` : "/img/placeholder-ball.png";
  return (
    <div className="h-10 w-10 md:h-12 md:w-12 rounded-full grid place-items-center bg-zinc-800/60 border border-zinc-700 overflow-hidden">
      <Image src={src} alt={alt} width={48} height={48} className="object-contain" />
    </div>
  );
}

function MatchCard({ m }: { m: Match }) {
  return (
    <div className="rounded-2xl border border-amber-400/20 bg-zinc-900/60 p-5 shadow-[0_0_0_1px_rgba(255,196,28,0.08),0_18px_50px_-20px_rgba(0,0,0,.8)]">
      {/* Linha superior: escudo - VS - escudo */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col items-center gap-2 w-1/3">
          <Crest file={m.homeBadgeFile} alt={m.home.name} />
          <div className="text-sm font-semibold text-zinc-100 text-center">{m.home.name}</div>
        </div>

        <div className="w-1/3 text-center font-extrabold text-amber-400 text-xl">VS</div>

        <div className="flex flex-col items-center gap-2 w-1/3">
          <Crest file={m.awayBadgeFile} alt={m.away.name} />
          <div className="text-sm font-semibold text-zinc-100 text-center">{m.away.name}</div>
        </div>
      </div>

      {/* Data/hora */}
      <div className="mt-4 space-y-1 text-zinc-300 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-zinc-400">
            <CalendarIcon />
          </span>
          <span>{formatDate(m.startsAt)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-zinc-400">
            <ClockIcon />
          </span>
          <span>{formatTime(m.startsAt)}</span>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-5">
        <Link
          href={`/matches/${m.id}`}
          className="block w-full text-center rounded-xl bg-amber-400 text-black font-semibold py-3 hover:bg-amber-300 active:translate-y-px transition"
        >
          Fazer Palpite
        </Link>
      </div>
    </div>
  );
}

function groupByRound(matches: Match[]) {
  const map = new Map<number, Match[]>();
  for (const m of matches) {
    const arr = map.get(m.round) ?? [];
    arr.push(m);
    map.set(m.round, arr);
  }
  return Array.from(map.entries()).sort((a, b) => a[0] - b[0]); // [ [round, Match[]], ... ]
}

export default async function MatchesPage({
  searchParams,
}: {
  searchParams?: { region?: string };
}) {
  const session = await getSession();
  if (!session) redirect("/"); // exige login

  const ALL: Region[] = ["ES", "MX", "IT", "BR", "FR", "DE", "MENA"];
  const raw = (searchParams?.region || "").toUpperCase() as Region;
  const region: Region = ALL.includes(raw) ? raw : "BR";

  const matchesAll = await getMatches();
  const matches = matchesAll.filter((m) => (m.region || "BR") === region);

  const grouped = groupByRound(matches);

  // Mostrar a imagem apenas para o login "andreachinii"
  const showChini = (session.user.login || "").toLowerCase() === "andreachinii";

  return (
    <main className="relative min-h-screen bg-[#0b0b0b] text-zinc-100">
      {/* Imagem decorativa à esquerda – só para @andreachinii, escondida em telas pequenas */}
      {showChini && (
        <div
          aria-hidden
          className="pointer-events-none select-none hidden xl:block fixed left-6 bottom-10 z-0"
        >
          <Image
            src="/img/chini.png"
            alt=""
            width={260}
            height={260}
            priority
            className="opacity-85 drop-shadow-[0_20px_40px_rgba(255,196,28,.15)]"
          />
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-amber-400/20 bg-black/60 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg md:text-xl font-bold">
            <span className="text-amber-300">Kings League</span> - Palpites
          </h1>
          <nav className="flex items-center gap-2">
            <Link className="rounded-lg px-3 py-1.5 border border-amber-400/30 hover:bg-zinc-900" href="/ranking">
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

      <section className="relative z-10 mx-auto max-w-6xl px-4 py-6">
        <h2 className="text-3xl font-extrabold text-amber-300">Próxima Rodada</h2>
        <p className="text-zinc-400 mt-1">Faça seus palpites nas partidas da semana</p>

        {/* Tabs */}
        <div className="mt-4">
          <Tabs current={region} />
        </div>

        {/* Grupos por rodada com borda */}
        <div className="mt-6 space-y-6">
          {grouped.map(([round, items]) => (
            <section
              key={round}
              className="rounded-2xl border border-zinc-800 bg-zinc-950/50 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                <h3 className="text-xl font-bold">
                  Rodada <span className="text-amber-300">{round}</span>
                </h3>
                <span className="text-xs uppercase tracking-wider text-zinc-400">
                  {items.length} {items.length === 1 ? "partida" : "partidas"}
                </span>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((m) => (
                  <MatchCard key={m.id} m={m} />
                ))}
              </div>
            </section>
          ))}
        </div>

        {matches.length === 0 && (
          <div className="mt-10 rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-zinc-300">
            Nenhuma partida cadastrada nessa região.
          </div>
        )}
      </section>
    </main>
  );
}
