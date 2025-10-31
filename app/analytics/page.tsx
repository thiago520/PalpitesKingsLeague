// app/analytics/page.tsx
import Link from "next/link";
import Image from "next/image";
import { getSession } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/src/lib/db";
import AnalyticsClientEnhanced from "./ui/AnalyticsClientEnhanced";

// Força a página a ser dinâmica - sempre busca dados frescos
export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getAnalyticsData(loggedUserId: string) {
    try {
        // 1. Buscar partidas com palpites filtrados por canal do usuário logado
        const matches = await prisma.match.findMany({
            include: {
                home: true,
                away: true,
                result: true,
                guesses: {
                    where: {
                        streamerUserId: loggedUserId // Filtrar apenas palpites do canal logado
                    },
                    include: {
                        streamer: true
                    }
                }
            }
        });

        // 2. Calcular distribuição de resultados das partidas finalizadas
        const finishedMatches = matches.filter(m => m.status === "FINISHED" && m.result);
        let homeWins = 0, awayWins = 0, draws = 0;

        for (const match of finishedMatches) {
            if (match.result!.goalsHome > match.result!.goalsAway) {
                homeWins++;
            } else if (match.result!.goalsAway > match.result!.goalsHome) {
                awayWins++;
            } else {
                draws++;
            }
        }

        const outcomeDistribution = [
            { name: "Vitória Casa", value: homeWins, color: "#22c55e" },
            { name: "Vitória Fora", value: awayWins, color: "#ef4444" },
            { name: "Empate", value: draws, color: "#f59e0b" }
        ];

        // 3. Calcular taxa de acerto dos palpites
        let correctGuesses = 0;
        let totalFinishedGuesses = 0;

        for (const match of finishedMatches) {
            for (const guess of match.guesses) {
                totalFinishedGuesses++;
                const actualResult = match.result!;

                // Verificar se o palpite está correto
                if (guess.goalsHome === actualResult.goalsHome && guess.goalsAway === actualResult.goalsAway) {
                    correctGuesses++;
                }
            }
        }

        const accuracyRateValue = totalFinishedGuesses > 0 ? ((correctGuesses / totalFinishedGuesses) * 100) : 0;
        const accuracyRate = [
            { name: "Taxa de Acerto", value: accuracyRateValue, color: "#3b82f6" }
        ];

        // 4. Top usuários por quantidade de palpites
        const userGuessCount: { [key: string]: { count: number; display: string; } } = {};

        for (const match of matches) {
            for (const guess of match.guesses) {
                const key = guess.twitchUserId;
                if (!userGuessCount[key]) {
                    userGuessCount[key] = { count: 0, display: guess.twitchDisplay || guess.twitchLogin };
                }
                userGuessCount[key].count++;
            }
        }

        const topUsers = Object.entries(userGuessCount)
            .map(([userId, data]) => ({
                name: data.display,
                points: 0, // Pode ser calculado posteriormente
                guesses: data.count
            }))
            .sort((a, b) => b.guesses - a.guesses)
            .slice(0, 10);

        // 5. Partidas por região
        const regionCount: { [key: string]: number } = {};
        for (const match of matches) {
            const region = match.region || "BR";
            regionCount[region] = (regionCount[region] || 0) + 1;
        }

        const matchesByRegion = Object.entries(regionCount).map(([region, count]) => ({
            region,
            count
        }));

        // 6. Palpites ao longo do tempo (últimos 30 dias)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentGuesses = await prisma.guess.findMany({
            where: {
                streamerUserId: loggedUserId,
                createdAt: {
                    gte: thirtyDaysAgo
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 100
        });

        const guessesOverTime = recentGuesses.reduce((acc: { [key: string]: number }, guess) => {
            const date = guess.createdAt.toISOString().split('T')[0];
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {});

        const guessesData = Object.entries(guessesOverTime)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date));

        // 7. Status das partidas
        const statusCount: { [key: string]: number } = {};
        for (const match of matches) {
            statusCount[match.status] = (statusCount[match.status] || 0) + 1;
        }

        const statusColors: { [key: string]: string } = {
            'OPEN': '#22c55e',
            'FINISHED': '#3b82f6',
            'LOCKED': '#f59e0b',
            'CANCELLED': '#ef4444'
        };

        const matchStatus = Object.entries(statusCount).map(([status, count]) => ({
            name: status,
            value: count,
            color: statusColors[status] || '#6b7280'
        }));

        // 8. Organizar partidas por rodada para navegação
        const roundsMap: Record<string, {
            round: number;
            matches: Array<{
                id: string;
                round: number;
                homeTeam: string;
                awayTeam: string;
                homeTeamCode: string;
                awayTeamCode: string;
                status: string;
                date: string;
                totalBets: number;
                betDistribution: Array<{
                    name: string;
                    type: string;
                    value: number;
                    percentage: string;
                    color: string;
                }>;
                result?: {
                    goalsHome: number;
                    goalsAway: number;
                } | null;
            }>;
            totalMatches: number;
            openMatches: number;
            finishedMatches: number;
        }> = {};

        for (const match of matches) {
            const round = match.round;
            const roundKey = round.toString();

            if (!roundsMap[roundKey]) {
                roundsMap[roundKey] = {
                    round: round,
                    matches: [],
                    totalMatches: 0,
                    openMatches: 0,
                    finishedMatches: 0
                };
            }

            // Calcular distribuição de palpites para esta partida
            const guessDistribution: { [key: string]: number } = {};
            for (const guess of match.guesses) {
                const key = `${guess.goalsHome}-${guess.goalsAway}`;
                guessDistribution[key] = (guessDistribution[key] || 0) + 1;
            }

            const betDistribution = Object.entries(guessDistribution)
                .map(([score, count]) => ({
                    name: score,
                    type: 'score',
                    value: count,
                    percentage: match.guesses.length > 0 ? ((count / match.guesses.length) * 100).toFixed(1) : "0",
                    color: '#3b82f6'
                }))
                .slice(0, 10); // Top 10 palpites mais populares

            roundsMap[roundKey].matches.push({
                id: match.id,
                round: match.round,
                homeTeam: match.home.name,
                awayTeam: match.away.name,
                homeTeamCode: match.home.code,
                awayTeamCode: match.away.code,
                status: match.status,
                date: match.startsAt.toISOString(),
                totalBets: match.guesses.length,
                betDistribution,
                result: match.result ? {
                    goalsHome: match.result.goalsHome,
                    goalsAway: match.result.goalsAway
                } : null
            });

            roundsMap[roundKey].totalMatches++;
            if (match.status === 'OPEN') roundsMap[roundKey].openMatches++;
            if (match.status === 'FINISHED') roundsMap[roundKey].finishedMatches++;
        }        // 9. Buscar palpites mais recentes para a seção de atividade
        const allGuesses = await prisma.guess.findMany({
            where: {
                streamerUserId: loggedUserId
            },
            include: {
                match: {
                    include: {
                        home: true,
                        away: true
                    }
                },
                streamer: true
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 50
        });

        const recentGuessesFormatted = allGuesses.map(guess => ({
            id: guess.id,
            user: guess.twitchDisplay || guess.twitchLogin,
            score: `${guess.goalsHome}-${guess.goalsAway}`,
            match: `${guess.match.home.name} x ${guess.match.away.name}`,
            channel: guess.streamer.login,
            points: 0, // Pode ser calculado posteriormente
            isCorrect: null, // Pode ser calculado posteriormente
            date: guess.createdAt.toISOString(),
            timestamp: guess.createdAt.getTime()
        }));

        return {
            outcomeDistribution,
            accuracyRate,
            topUsers,
            matchesByRegion,
            guessesOverTime: guessesData,
            matchStatus,
            topScores: [], // Pode ser implementado posteriormente
            firstGuessers: [], // Pode ser implementado posteriormente
            scoresByPopularity: [], // Pode ser implementado posteriormente
            betDistribution: [], // Pode ser implementado posteriormente
            recentGuesses: recentGuessesFormatted,
            totalGuesses: allGuesses.length,
            lastUpdated: new Date().toISOString(),
            currentRoundMatches: roundsMap
        };
    } catch (error) {
        console.error('Error fetching analytics data:', error);
        // Dados vazios em caso de erro
        return {
            outcomeDistribution: [],
            accuracyRate: [],
            topUsers: [],
            matchesByRegion: [],
            guessesOverTime: [],
            matchStatus: [],
            topScores: [],
            firstGuessers: [],
            scoresByPopularity: [],
            betDistribution: [],
            recentGuesses: [],
            totalGuesses: 0,
            lastUpdated: new Date().toISOString(),
            currentRoundMatches: {}
        };
    }
}

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

    // Buscar dados reais do banco de dados
    const initialData = await getAnalyticsData(session.user.id);    // Mostrar a imagem apenas para o login "andreachinii"
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
                    <p className="text-zinc-400 mb-2">
                        Visualização de dados dos palpites{channel ? ` do canal @${channel}` : ''} (Modo Teste)
                    </p>
                    <div className="flex items-center gap-2 text-sm text-green-400">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span>Dados atualizados em tempo real - Atualizada em: {new Date().toLocaleString('pt-BR')}</span>
                    </div>
                </div>

                <AnalyticsClientEnhanced
                    data={initialData}
                />
            </section>
        </main>
    );
}