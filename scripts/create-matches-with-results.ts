#!/usr/bin/env tsx
// scripts/create-matches-with-results.ts
import { PrismaClient, MatchRegion, MatchStatus } from "@prisma/client";

const prisma = new PrismaClient();

// Mapeamento dos códigos dos times para busca dinâmica (baseado na consulta SQL da base)
const TEAM_CODES = {
    CAPIM: "CAP",        // Capim FC
    DENDELE: "DDL",      // Dendele FC  
    DESIMPEDIDOS: "DSM", // Desimpedidos
    REAL_ELITE: "ELT",   // FC Real Elite
    FLUXO: "FLX",        // Fluxo FC
    FUNKBOL: "FNK",      // Funkbol Clube
    FURIA: "FUR",        // Furia FC
    G3X: "G3X",          // G3X FC
    LOUD: "LSC",         // LOUD SC
    NYVELADOS: "NYV"     // Nyvelados FC
};

// Mapeamento dos IDs antigos (do sistema anterior) para códigos dos times
const CODE_MAPPING: Record<number, string> = {
    49: TEAM_CODES.G3X,           // G3X FC
    50: TEAM_CODES.FURIA,         // Furia FC
    160: TEAM_CODES.FLUXO,        // Fluxo FC
    161: TEAM_CODES.DENDELE,      // Dendele FC
    162: TEAM_CODES.LOUD,         // LOUD SC
    163: TEAM_CODES.NYVELADOS,    // Nyvelados FC
    164: TEAM_CODES.FUNKBOL,      // Funkbol Clube
    166: TEAM_CODES.REAL_ELITE,   // FC Real Elite
    167: TEAM_CODES.CAPIM,        // Capim FC
    168: TEAM_CODES.DESIMPEDIDOS  // Desimpedidos
};

// Função para buscar IDs dos times dinamicamente
async function getTeamIds(): Promise<Record<string, string>> {
    console.log("🔍 Buscando IDs dos times na base de dados...");

    const teams = await prisma.team.findMany({
        where: {
            region: "BR",
            code: {
                in: Object.values(TEAM_CODES)
            }
        },
        select: {
            id: true,
            code: true,
            name: true
        }
    });

    const teamIds: Record<string, string> = {};

    teams.forEach(team => {
        teamIds[team.code] = team.id;
        console.log(`✅ ${team.name} (${team.code}): ${team.id}`);
    });

    // Verificar se todos os times foram encontrados
    const missingCodes = Object.values(TEAM_CODES).filter(code => !teamIds[code]);
    if (missingCodes.length > 0) {
        console.error(`❌ Times não encontrados: ${missingCodes.join(', ')}`);
        throw new Error(`Times com códigos ${missingCodes.join(', ')} não foram encontrados na base`);
    }

    console.log(`✅ Todos os ${teams.length} times encontrados!`);
    return teamIds;
}

interface MatchWithResult {
    round: number;
    homeTeamId: number;
    awayTeamId: number;
    date: string;
    status: MatchStatus;
    homeScore?: number;
    awayScore?: number;
    ended: boolean;
}

// Todas as partidas com resultados baseados nos dados fornecidos
const ALL_MATCHES: MatchWithResult[] = [
    // RODADA 1 - FINALIZADAS
    {
        round: 1,
        homeTeamId: 160, // Fluxo FC
        awayTeamId: 164, // Funkbol Clube
        date: "2025-10-17T20:00:00.000Z",
        status: "FINISHED",
        homeScore: 3,
        awayScore: 8,
        ended: true
    },
    {
        round: 1,
        homeTeamId: 162, // LOUD SC
        awayTeamId: 166, // FC Real Elite
        date: "2025-10-17T21:00:00.000Z",
        status: "FINISHED",
        homeScore: 7,
        awayScore: 1,
        ended: true
    },
    {
        round: 1,
        homeTeamId: 50,  // Furia FC
        awayTeamId: 168, // Desimpedidos
        date: "2025-10-17T22:00:00.000Z",
        status: "FINISHED",
        homeScore: 6,
        awayScore: 1,
        ended: true
    },
    {
        round: 1,
        homeTeamId: 163, // Nyvelados FC
        awayTeamId: 161, // Dendele FC
        date: "2025-10-17T23:00:00.000Z",
        status: "FINISHED",
        homeScore: 4,
        awayScore: 4, // Empate resolvido nos pênaltis (4-3 para Nyvelados)
        ended: true
    },
    {
        round: 1,
        homeTeamId: 49,  // G3X FC
        awayTeamId: 167, // Capim FC
        date: "2025-10-18T00:00:00.000Z",
        status: "FINISHED",
        homeScore: 4,
        awayScore: 2,
        ended: true
    },

    // RODADA 2 - FINALIZADAS
    {
        round: 2,
        homeTeamId: 168, // Desimpedidos
        awayTeamId: 166, // FC Real Elite
        date: "2025-10-20T20:00:00.000Z",
        status: "FINISHED",
        homeScore: 4,
        awayScore: 3,
        ended: true
    },
    {
        round: 2,
        homeTeamId: 163, // Nyvelados FC
        awayTeamId: 164, // Funkbol Clube
        date: "2025-10-20T21:00:00.000Z",
        status: "FINISHED",
        homeScore: 3,
        awayScore: 4,
        ended: true
    },
    {
        round: 2,
        homeTeamId: 49,  // G3X FC
        awayTeamId: 162, // LOUD SC
        date: "2025-10-20T22:00:00.000Z",
        status: "FINISHED",
        homeScore: 2,
        awayScore: 8,
        ended: true
    },
    {
        round: 2,
        homeTeamId: 167, // Capim FC
        awayTeamId: 160, // Fluxo FC
        date: "2025-10-20T23:00:00.000Z",
        status: "FINISHED",
        homeScore: 1,
        awayScore: 1, // Empate resolvido nos pênaltis (2-3 para Fluxo)
        ended: true
    },
    {
        round: 2,
        homeTeamId: 50,  // Furia FC
        awayTeamId: 161, // Dendele FC
        date: "2025-10-21T00:00:00.000Z",
        status: "FINISHED",
        homeScore: 7,
        awayScore: 4,
        ended: true
    },

    // RODADA 3 - FINALIZADAS
    {
        round: 3,
        homeTeamId: 49,  // G3X FC
        awayTeamId: 166, // FC Real Elite
        date: "2025-10-24T20:00:00.000Z",
        status: "FINISHED",
        homeScore: 8,
        awayScore: 5,
        ended: true
    },
    {
        round: 3,
        homeTeamId: 164, // Funkbol Clube
        awayTeamId: 167, // Capim FC
        date: "2025-10-24T21:00:00.000Z",
        status: "FINISHED",
        homeScore: 6,
        awayScore: 3,
        ended: true
    },
    {
        round: 3,
        homeTeamId: 161, // Dendele FC
        awayTeamId: 160, // Fluxo FC
        date: "2025-10-24T22:00:00.000Z",
        status: "FINISHED",
        homeScore: 2,
        awayScore: 4,
        ended: true
    },
    {
        round: 3,
        homeTeamId: 162, // LOUD SC
        awayTeamId: 50,  // Furia FC
        date: "2025-10-24T23:00:00.000Z",
        status: "FINISHED",
        homeScore: 4,
        awayScore: 4, // Empate resolvido nos pênaltis (1-3 para Furia)
        ended: true
    },
    {
        round: 3,
        homeTeamId: 168, // Desimpedidos
        awayTeamId: 163, // Nyvelados FC
        date: "2025-10-25T00:00:00.000Z",
        status: "FINISHED",
        homeScore: 3,
        awayScore: 4,
        ended: true
    },

    // RODADA 4 - FINALIZADAS (já aconteceram)
    {
        round: 4,
        homeTeamId: 163, // Nyvelados FC
        awayTeamId: 167, // Capim FC
        date: "2025-10-27T20:00:00.000Z",
        status: "FINISHED",
        homeScore: 3,
        awayScore: 4,
        ended: true
    },
    {
        round: 4,
        homeTeamId: 161, // Dendele FC
        awayTeamId: 164, // Funkbol Clube
        date: "2025-10-27T21:00:00.000Z",
        status: "FINISHED",
        homeScore: 4,
        awayScore: 4, // Empate resolvido nos pênaltis
        ended: true
    },
    {
        round: 4,
        homeTeamId: 50,  // Furia FC
        awayTeamId: 166, // FC Real Elite
        date: "2025-10-27T22:00:00.000Z",
        status: "FINISHED",
        homeScore: 2,
        awayScore: 2, // Empate resolvido nos pênaltis
        ended: true
    },
    {
        round: 4,
        homeTeamId: 168, // Desimpedidos
        awayTeamId: 49,  // G3X FC
        date: "2025-10-27T23:00:00.000Z",
        status: "FINISHED",
        homeScore: 6,
        awayScore: 9,
        ended: true
    },
    {
        round: 4,
        homeTeamId: 162, // LOUD SC
        awayTeamId: 160, // Fluxo FC
        date: "2025-10-28T00:00:00.000Z",
        status: "FINISHED",
        homeScore: 4,
        awayScore: 3,
        ended: true
    },

    // RODADA 5 
    {
        round: 5,
        homeTeamId: 50,  // Furia FC
        awayTeamId: 49,  // G3X FC
        date: "2025-11-03T20:00:00.000Z",
        status: "DRAFT",
        ended: false
    },
    {
        round: 5,
        homeTeamId: 168, // Desimpedidos
        awayTeamId: 162, // LOUD SC
        date: "2025-11-03T21:00:00.000Z",
        status: "DRAFT",
        ended: false
    },
    {
        round: 5,
        homeTeamId: 161, // Dendele FC
        awayTeamId: 167, // Capim FC
        date: "2025-11-03T22:00:00.000Z",
        status: "DRAFT",
        ended: false
    },
    {
        round: 5,
        homeTeamId: 160, // Fluxo FC
        awayTeamId: 163, // Nyvelados FC
        date: "2025-11-03T23:00:00.000Z",
        status: "DRAFT",
        ended: false
    },
    {
        round: 5,
        homeTeamId: 166, // FC Real Elite
        awayTeamId: 164, // Funkbol Clube
        date: "2025-11-04T00:00:00.000Z",
        status: "DRAFT",
        ended: false
    }
];

async function resetAndCreateMatchesWithResults() {
    console.log("🏆 Resetando e criando partidas com resultados...");

    // 1. Buscar IDs dos times dinamicamente
    const teamIds = await getTeamIds();

    // 2. Limpar todas as partidas da região BR
    console.log("🗑️  Limpando partidas existentes...");

    // Primeiro, remover guesses
    await prisma.guess.deleteMany({
        where: {
            match: {
                region: "BR"
            }
        }
    });

    // Depois, remover capturas
    await prisma.capture.deleteMany({
        where: {
            match: {
                region: "BR"
            }
        }
    });

    // Então, remover resultados
    await prisma.result.deleteMany({
        where: {
            match: {
                region: "BR"
            }
        }
    });

    // Finalmente, remover partidas
    await prisma.match.deleteMany({
        where: {
            region: "BR"
        }
    });
    console.log("✅ Partidas antigas removidas");

    // 3. Criar todas as partidas
    let createdCount = 0;

    for (const matchData of ALL_MATCHES) {
        // Buscar os códigos dos times e depois os IDs
        const homeTeamCode = CODE_MAPPING[matchData.homeTeamId];
        const awayTeamCode = CODE_MAPPING[matchData.awayTeamId];

        if (!homeTeamCode || !awayTeamCode) {
            console.error(`❌ Código do time não encontrado: ${matchData.homeTeamId} vs ${matchData.awayTeamId}`);
            continue;
        }

        const homeTeamId = teamIds[homeTeamCode];
        const awayTeamId = teamIds[awayTeamCode];

        if (!homeTeamId || !awayTeamId) {
            console.error(`❌ ID do time não encontrado: ${homeTeamCode} vs ${awayTeamCode}`);
            continue;
        }

        try {
            // Criar a partida
            const createdMatch = await prisma.match.create({
                data: {
                    round: matchData.round,
                    region: "BR" as MatchRegion,
                    startsAt: new Date(matchData.date),
                    status: matchData.status,
                    homeId: homeTeamId,
                    awayId: awayTeamId,
                },
                include: {
                    home: true,
                    away: true,
                },
            });

            // Se tem resultado, criar o resultado
            if (matchData.ended && matchData.homeScore !== undefined && matchData.awayScore !== undefined) {
                await prisma.result.create({
                    data: {
                        matchId: createdMatch.id,
                        goalsHome: matchData.homeScore,
                        goalsAway: matchData.awayScore,
                        decidedAt: new Date(matchData.date)
                    }
                });

                console.log(`✅ Rodada ${matchData.round}: ${createdMatch.home.name} ${matchData.homeScore} x ${matchData.awayScore} ${createdMatch.away.name} (FINALIZADA)`);
            } else {
                console.log(`✅ Rodada ${matchData.round}: ${createdMatch.home.name} vs ${createdMatch.away.name} (FUTURA)`);
            }

            createdCount++;

        } catch (error) {
            console.error(`❌ Erro ao criar partida:`, error);
        }
    }

    console.log(`\n🎉 ${createdCount} partidas criadas com sucesso!`);
}

async function main() {
    try {
        await resetAndCreateMatchesWithResults();

        // Mostrar resumo
        const allMatches = await prisma.match.findMany({
            where: { region: "BR" },
            include: {
                home: true,
                away: true,
                result: true
            },
            orderBy: [{ round: 'asc' }, { startsAt: 'asc' }]
        });

        console.log(`\n📊 Resumo Final:`);
        console.log(`Total de partidas: ${allMatches.length}`);

        const finishedMatches = allMatches.filter(m => m.status === "FINISHED");
        const futureMatches = allMatches.filter(m => m.status === "DRAFT");

        console.log(`Partidas finalizadas: ${finishedMatches.length}`);
        console.log(`Partidas futuras: ${futureMatches.length}`);

        const byRound = allMatches.reduce((acc, match) => {
            acc[match.round] = (acc[match.round] || 0) + 1;
            return acc;
        }, {} as Record<number, number>);

        console.log("Partidas por rodada:", byRound);

    } catch (error) {
        console.error("❌ Erro:", error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();