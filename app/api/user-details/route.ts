// app/api/user-details/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 30;

export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    const channelParam = url.searchParams.get("channel");
    const streamerIdParam = url.searchParams.get("streamerId");

    if (!userId) {
        return NextResponse.json({ error: "missing_userId" }, { status: 400 });
    }

    if (!channelParam && !streamerIdParam) {
        return NextResponse.json({ error: "missing_channel" }, { status: 400 });
    }

    const where: any = { twitchUserId: userId };
    if (streamerIdParam) where.streamerUserId = streamerIdParam;
    if (channelParam) where.channelLogin = channelParam.replace(/^@/, "").toLowerCase();

    // Buscar todos os palpites do usuário com detalhes das partidas
    const guesses = await prisma.guess.findMany({
        where,
        include: {
            match: {
                include: {
                    home: true,
                    away: true,
                    result: true
                }
            }
        },
        orderBy: [
            { match: { status: "desc" } }, // FINISHED primeiro, depois outros status
            { match: { startsAt: "desc" } } // Mais recentes primeiro
        ]
    });

    // Organizar os dados para mostrar de onde vêm os pontos
    const userDetails = {
        userId,
        totalPoints: 0,
        totalGuesses: guesses.length,
        correctGuesses: 0,
        guessDetails: [] as Array<{
            matchId: string;
            homeTeam: string;
            awayTeam: string;
            homeTeamCode: string;
            awayTeamCode: string;
            round: number;
            region: string;
            matchDate: string;
            userGuess: string;
            actualResult: string | null;
            pointsEarned: number;
            isCorrect: boolean | null;
            matchStatus: string;
            createdAt: string;
        }>
    };

    for (const guess of guesses) {
        const match = guess.match;
        const points = guess.pointsAwarded;

        userDetails.totalPoints += points;
        if (points > 0) userDetails.correctGuesses++;

        let actualResult = null;
        let isCorrect = null;

        if (match.result && match.status === "FINISHED") {
            actualResult = `${match.result.goalsHome}x${match.result.goalsAway}`;
            isCorrect = (guess.goalsHome === match.result.goalsHome &&
                guess.goalsAway === match.result.goalsAway);
        }

        userDetails.guessDetails.push({
            matchId: match.id,
            homeTeam: match.home.name,
            awayTeam: match.away.name,
            homeTeamCode: match.home.code,
            awayTeamCode: match.away.code,
            round: match.round,
            region: match.region,
            matchDate: match.startsAt.toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }),
            userGuess: `${guess.goalsHome}x${guess.goalsAway}`,
            actualResult,
            pointsEarned: points,
            isCorrect,
            matchStatus: match.status,
            createdAt: guess.createdAt.toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        });
    }

    return NextResponse.json(userDetails);
}