// app/api/analytics/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/db";
import { getSession } from "@/src/lib/auth";

// Força dados sempre frescos - sem cache
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
    try {
        // Obter sessão do usuário logado para filtrar analytics por canal
        const session = await getSession();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized - Login required for analytics", { status: 401 });
        }

        const loggedUserId = session.user.id;
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

        // Limitar aos últimos 10 primeiros palpites
        const recentFirstGuessers = firstGuessers
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 10);

        // 10. Distribuição de placares por popularidade (top 6 para pizza)
        const scoresByPopularity = topScores.slice(0, 6).map((item, index) => ({
            name: item.score,
            value: item.count,
            color: [
                '#FCD34D', '#10B981', '#EF4444', '#8B5CF6', '#F59E0B', '#3B82F6'
            ][index] || '#6B7280'
        }));

        // 11. NOVO: Distribuição de palpites por tipo de resultado (vitória casa/visitante/empate)
        let guessHomeWins = 0, guessAwayWins = 0, guessDraws = 0;

        for (const guess of allGuesses) {
            if (guess.goalsHome > guess.goalsAway) {
                guessHomeWins++;
            } else if (guess.goalsAway > guess.goalsHome) {
                guessAwayWins++;
            } else {
                guessDraws++;
            }
        }

        const totalBets = guessHomeWins + guessAwayWins + guessDraws || 1;

        const betDistribution = [
            {
                name: 'Vitória Casa',
                value: guessHomeWins,
                percentage: ((guessHomeWins / totalBets) * 100).toFixed(1),
                color: '#10B981'
            },
            {
                name: 'Vitória Visitante',
                value: guessAwayWins,
                percentage: ((guessAwayWins / totalBets) * 100).toFixed(1),
                color: '#EF4444'
            },
            {
                name: 'Empate',
                value: guessDraws,
                percentage: ((guessDraws / totalBets) * 100).toFixed(1),
                color: '#F59E0B'
            }
        ];

        // 12. NOVO: Partidas organizadas por rodada (baseado em palpites existentes)
        const matchesWithGuesses = matches.filter(match => match.guesses.length > 0);
        const allRoundMatches = matchesWithGuesses
            .map(match => {
                const matchGuesses = match.guesses;
                let homeWinBets = 0, awayWinBets = 0, drawBets = 0;

                // Contar palpites por tipo de resultado para esta partida específica
                for (const guess of matchGuesses) {
                    if (guess.goalsHome > guess.goalsAway) {
                        homeWinBets++;
                    } else if (guess.goalsAway > guess.goalsHome) {
                        awayWinBets++;
                    } else {
                        drawBets++;
                    }
                }

                const totalMatchBets = homeWinBets + awayWinBets + drawBets || 1;

                return {
                    id: match.id,
                    round: match.round,
                    homeTeam: match.home.name,
                    awayTeam: match.away.name,
                    homeTeamCode: match.home.code,
                    awayTeamCode: match.away.code,
                    status: match.status,
                    date: match.startsAt.toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                    }),
                    totalBets: totalMatchBets,
                    betDistribution: [
                        {
                            name: match.home.name,
                            type: 'home',
                            value: homeWinBets,
                            percentage: ((homeWinBets / totalMatchBets) * 100).toFixed(1),
                            color: '#10B981'
                        },
                        {
                            name: match.away.name,
                            type: 'away',
                            value: awayWinBets,
                            percentage: ((awayWinBets / totalMatchBets) * 100).toFixed(1),
                            color: '#EF4444'
                        },
                        {
                            name: 'Empate',
                            type: 'draw',
                            value: drawBets,
                            percentage: ((drawBets / totalMatchBets) * 100).toFixed(1),
                            color: '#F59E0B'
                        }
                    ],
                    result: match.result ? {
                        goalsHome: match.result.goalsHome,
                        goalsAway: match.result.goalsAway
                    } : null
                };
            })
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Agrupar partidas por rodada
        const roundsMap: Record<string, {
            round: number;
            matches: any[];
            totalMatches: number;
            openMatches: number;
            finishedMatches: number;
        }> = {};

        for (const match of allRoundMatches) {
            const roundKey = `rodada_${match.round}`;

            if (!roundsMap[roundKey]) {
                roundsMap[roundKey] = {
                    round: match.round,
                    matches: [],
                    totalMatches: 0,
                    openMatches: 0,
                    finishedMatches: 0
                };
            }

            roundsMap[roundKey].matches.push(match);
            roundsMap[roundKey].totalMatches++;

            if (match.status === 'OPEN') {
                roundsMap[roundKey].openMatches++;
            }
            if (match.status === 'FINISHED') {
                roundsMap[roundKey].finishedMatches++;
            }
        }

        // Usar o roundsMap criado anteriormente como currentRoundMatches
        const currentRoundMatches = roundsMap;

        // 13. NOVO: Todos os palpites recentes (últimos 50) para exibição em tempo real
        const recentGuesses = await prisma.guess.findMany({
            where: {
                streamerUserId: loggedUserId // Filtrar palpites recentes apenas do canal logado
            },
            include: {
                match: {
                    include: {
                        home: true,
                        away: true,
                        result: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        const guessesData = recentGuesses.map(guess => ({
            id: guess.id,
            user: guess.twitchDisplay || guess.twitchLogin,
            score: `${guess.goalsHome}x${guess.goalsAway}`,
            match: `${guess.match.home.name} vs ${guess.match.away.name}`,
            channel: guess.channelLogin,
            points: guess.pointsAwarded,
            isCorrect: guess.match.result ?
                (guess.goalsHome === guess.match.result.goalsHome &&
                    guess.goalsAway === guess.match.result.goalsAway) : null,
            date: guess.createdAt.toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }),
            timestamp: guess.createdAt.getTime()
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
            scoresByPopularity,
            betDistribution, // NOVO: distribuição de apostas por tipo
            currentRoundMatches, // NOVO: partidas organizadas por rodada com palpites
            recentGuesses: guessesData,
            totalGuesses: allGuesses.length,
            lastUpdated: new Date().toISOString()
        };

        // Retorna dados com cabeçalhos que impedem cache
        const response = NextResponse.json(analyticsData);
        response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
        response.headers.set('Pragma', 'no-cache');
        response.headers.set('Expires', '0');
        return response;

    } catch (error) {
        console.error('Analytics API Error:', error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}