// app/analytics/page.tsx
import Link from "next/link";
import Image from "next/image";
import { getSession } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import AnalyticsClientEnhanced from "./ui/AnalyticsClientEnhanced";

export default async function AnalyticsPage({
    searchParams,
}: {
    searchParams?: { channel?: string };
}) {
    const session = await getSession();
    if (!session) redirect("/");

    const channel = (searchParams?.channel || "")
        .replace(/^@/, "")
        .toLowerCase();

    // Dados vazios iniciais - será preenchido com dados fake via botão
    const initialData = {
        outcomeDistribution: [],
        accuracyRate: [],
        topUsers: [],
        matchesByRegion: [],
        guessesOverTime: [],
        matchStatus: [],
        // Novos dados
        topScores: [],
        firstGuessers: [],
        scoresByPopularity: []
    };    // Mostrar a imagem apenas para o login "andreachinii"
    const showChini = (session.user.login || "").toLowerCase() === "andreachinii";

    return (
        <main className="relative min-h-screen bg-[#0b0b0b] text-zinc-100">
            {/* Imagem decorativa à esquerda – só para @andreachinii */}
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
                        <span className="text-amber-300">Kings League</span> - Analytics
                    </h1>
                    <nav className="flex items-center gap-2">
                        <Link
                            className="rounded-lg px-3 py-1.5 border border-amber-400/30 hover:bg-zinc-900"
                            href="/matches"
                        >
                            🔰 Partidas
                        </Link>
                        <Link
                            className="rounded-lg px-3 py-1.5 border border-amber-400/30 hover:bg-zinc-900"
                            href="/ranking"
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

            <section className="relative z-10 mx-auto max-w-6xl px-4 py-6">
                <div className="mb-6">
                    <h2 className="text-3xl font-extrabold text-amber-300 mb-2">
                        📊 Dashboard Analytics
                    </h2>
                    <p className="text-zinc-400">
                        Visualização de dados dos palpites{channel ? ` do canal @${channel}` : ''} (Modo Teste)
                    </p>
                </div>

                <AnalyticsClientEnhanced
                    data={initialData}
                />
            </section>
        </main>
    );
}