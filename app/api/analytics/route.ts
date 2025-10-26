// app/api/analytics/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/db";
import { getSession } from "@/src/lib/auth";

export async function GET() {
    // Analytics público - removido verificação de autenticação para dashboard

    try {
        // 1. Buscar todas as partidas com resultados
        const matches = await prisma.match.findMany({
            include: {
                home: true,
                away: true,
                result: true,
                guesses: {
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
            { name: 'Vitória Casa', value: homeWins, color: '#10B981' },
            { name: 'Vitória Visitante', value: awayWins, color: '#EF4444' },
            { name: 'Empate', value: draws, color: '#F59E0B' }
        ];

        // 3. Calcular taxa de acerto dos palpites
        const allGuesses = matches.flatMap(m => m.guesses);
        let correctGuesses = 0, incorrectGuesses = 0;

        for (const guess of allGuesses) {
            const match = matches.find(m => m.id === guess.matchId);
            if (match?.result) {
                if (guess.goalsHome === match.result.goalsHome &&
                    guess.goalsAway === match.result.goalsAway) {
                    correctGuesses++;
                } else {
                    incorrectGuesses++;
                }
            }
        }

        const accuracyRate = [
            { name: 'Acertos', value: correctGuesses, color: '#10B981' },
            { name: 'Erros', value: incorrectGuesses, color: '#EF4444' }
        ];

        // 4. Top usuários por pontos
        const userStats = new Map<string, { name: string; points: number; guesses: number }>();

        for (const guess of allGuesses) {
            const key = guess.twitchLogin;
            if (!userStats.has(key)) {
                userStats.set(key, {
                    name: guess.twitchDisplay || guess.twitchLogin,
                    points: 0,
                    guesses: 0
                });
            }

            const user = userStats.get(key)!;
            user.guesses++;
            user.points += guess.pointsAwarded;
        }

        const topUsers = Array.from(userStats.values())
            .sort((a, b) => b.points - a.points)
            .slice(0, 10);

        // 5. Partidas por região
        const regionCount = new Map<string, number>();
        for (const match of matches) {
            const current = regionCount.get(match.region) || 0;
            regionCount.set(match.region, current + 1);
        }

        const matchesByRegion = Array.from(regionCount.entries()).map(([region, count]) => ({
            region,
            count
        }));

        // 6. Palpites ao longo do tempo (últimos 10 dias)
        const now = new Date();
        const guessesOverTime = [];

        for (let i = 9; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

            const dayStart = new Date(date);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(date);
            dayEnd.setHours(23, 59, 59, 999);

            const count = allGuesses.filter(g => {
                const guessDate = new Date(g.createdAt);
                return guessDate >= dayStart && guessDate <= dayEnd;
            }).length;

            guessesOverTime.push({ date: dateStr, count });
        }

        // 7. Status das partidas
        const statusCount = new Map<string, number>();
        for (const match of matches) {
            const current = statusCount.get(match.status) || 0;
            statusCount.set(match.status, current + 1);
        }

        const statusLabels = {
            'DRAFT': 'Rascunho',
            'OPEN': 'Aberta',
            'LOCKED': 'Travada',
            'FINISHED': 'Finalizada'
        };

        const statusColors = {
            'DRAFT': '#6B7280',
            'OPEN': '#10B981',
            'LOCKED': '#F59E0B',
            'FINISHED': '#3B82F6'
        };

        const matchStatus = Array.from(statusCount.entries()).map(([status, count]) => ({
            name: statusLabels[status as keyof typeof statusLabels] || status,
            value: count,
            color: statusColors[status as keyof typeof statusColors] || '#6B7280'
        }));

        // 8. Top placares mais usados
        const scoreCount = new Map<string, number>();
        for (const guess of allGuesses) {
            const score = `${guess.goalsHome}x${guess.goalsAway}`;
            const current = scoreCount.get(score) || 0;
            scoreCount.set(score, current + 1);
        }

        const totalGuesses = allGuesses.length || 1;
        const topScores = Array.from(scoreCount.entries())
            .map(([score, count]) => ({
                score,
                count,
                percentage: (count / totalGuesses) * 100
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // 9. Primeiros palpiteiros (por partida)
        const firstGuessers: Array<{ user: string; date: string; score: string; match: string }> = [];

        for (const match of matches) {
            if (match.guesses.length > 0) {
                const sortedGuesses = match.guesses.sort((a, b) =>
                    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                );

                const firstGuess = sortedGuesses[0];
                firstGuessers.push({
                    user: firstGuess.twitchDisplay || firstGuess.twitchLogin,
                    date: new Date(firstGuess.createdAt).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                    }),
                    score: `${firstGuess.goalsHome}x${firstGuess.goalsAway}`,
                    match: `${match.home.name} vs ${match.away.name}`
                });
            }
        }

        // Limitar aos últimos 8 primeiros palpites
        const recentFirstGuessers = firstGuessers
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 8);

        // 10. Distribuição de placares por popularidade (top 6 para pizza)
        const scoresByPopularity = topScores.slice(0, 6).map((item, index) => ({
            name: item.score,
            value: item.count,
            color: [
                '#FCD34D', '#10B981', '#EF4444', '#8B5CF6', '#F59E0B', '#3B82F6'
            ][index] || '#6B7280'
        }));

        const analyticsData = {
            outcomeDistribution,
            accuracyRate,
            topUsers,
            matchesByRegion,
            guessesOverTime,
            matchStatus,
            topScores,
            firstGuessers: recentFirstGuessers,
            scoresByPopularity
        };

        return NextResponse.json(analyticsData);

    } catch (error) {
        console.error('Analytics API Error:', error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}