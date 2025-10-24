import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mapeamento correto dos IDs dos times da Kings League para os nomes no banco
const TEAM_MAPPING: Record<number, string> = {
    // Brasil
    49: 'G3X FC',          // homeTeamId: 49 = G3X
    50: 'Furia FC',        // homeTeamId: 50 = FURIA
    160: 'Fluxo FC',       // homeTeamId: 160 = FLUXO
    161: 'Dendele FC',     // awayTeamId: 161 = DENDELE
    162: 'LOUD SC',        // homeTeamId: 162 = LOUD
    163: 'Nyvelados FC',   // homeTeamId: 163 = NYVELADOS
    164: 'Funkbol Clube',  // awayTeamId: 164 = FUNKBOL
    166: 'FC Real Elite',  // awayTeamId: 166 = REAL ELITE
    167: 'Capim FC',       // awayTeamId: 167 = CAPIM
    168: 'Desimpedidos',   // awayTeamId: 168 = DESENPEDIDOS
    // Espanha - usando nomes exatos do banco
    2: 'Porcinos FC',      // PORCINOS
    3: 'Saiyans FC',       // SAIYANS
    4: 'Jijantes FC',      // JFC
    5: 'Rayo de Barcelona',// RDB
    6: 'Los Troncos FC',   // TRONCOS
    7: 'Ultimate Móstoles',// ULT
    8: 'xBuyer Team',      // XBU
    9: 'El Barrio',        // EL BARRIO
    10: 'PIO FC',          // PIO
    12: '1K FC',           // 1K
    179: 'La Capital CF',  // LA CAPITAL
    210: 'Skull FC'        // SKULL FC
};// Dados das partidas da Kings League
const KINGS_LEAGUE_DATA = [
    {
        "id": 394,
        "turnName": "Rodada 3",
        "matches": [
            {
                "id": 2057,
                "date": "2025-10-24T20:00:00.000Z",
                "participants": { "homeTeamId": 49, "awayTeamId": 166 },
                "status": null
            },
            {
                "id": 2059,
                "date": "2025-10-24T21:00:00.000Z",
                "participants": { "homeTeamId": 164, "awayTeamId": 167 },
                "status": null
            },
            {
                "id": 2061,
                "date": "2025-10-24T22:00:00.000Z",
                "participants": { "homeTeamId": 161, "awayTeamId": 160 },
                "status": null
            },
            {
                "id": 2058,
                "date": "2025-10-24T23:00:00.000Z",
                "participants": { "homeTeamId": 162, "awayTeamId": 50 },
                "status": null
            },
            {
                "id": 2062,
                "date": "2025-10-25T00:00:00.000Z",
                "participants": { "homeTeamId": 168, "awayTeamId": 163 },
                "status": null
            }
        ]
    },
    {
        "id": 395,
        "turnName": "Rodada 4",
        "matches": [
            {
                "id": 2065,
                "date": "2025-10-27T20:00:00.000Z",
                "participants": { "homeTeamId": 163, "awayTeamId": 167 },
                "status": null
            },
            {
                "id": 2066,
                "date": "2025-10-27T21:00:00.000Z",
                "participants": { "homeTeamId": 161, "awayTeamId": 164 },
                "status": null
            },
            {
                "id": 2063,
                "date": "2025-10-27T22:00:00.000Z",
                "participants": { "homeTeamId": 50, "awayTeamId": 166 },
                "status": null
            },
            {
                "id": 2064,
                "date": "2025-10-27T23:00:00.000Z",
                "participants": { "homeTeamId": 168, "awayTeamId": 49 },
                "status": null
            },
            {
                "id": 2067,
                "date": "2025-10-28T00:00:00.000Z",
                "participants": { "homeTeamId": 162, "awayTeamId": 160 },
                "status": null
            },
        ]
    },
    {
        "id": 396,
        "turnName": "Rodada 5",
        "matches": [
            {
                "id": 2068,
                "date": "2025-11-03T20:00:00.000Z",
                "participants": { "homeTeamId": 50, "awayTeamId": 49 },
                "status": null
            },
            {
                "id": 2069,
                "date": "2025-11-03T21:00:00.000Z",
                "participants": { "homeTeamId": 168, "awayTeamId": 162 },
                "status": null
            },
            {
                "id": 2070,
                "date": "2025-11-03T22:00:00.000Z",
                "participants": { "homeTeamId": 161, "awayTeamId": 167 },
                "status": null
            },
            {
                "id": 2071,
                "date": "2025-11-03T23:00:00.000Z",
                "participants": { "homeTeamId": 160, "awayTeamId": 163 },
                "status": null
            },
            {
                "id": 2072,
                "date": "2025-11-04T00:00:00.000Z",
                "participants": { "homeTeamId": 166, "awayTeamId": 164 },
                "status": null
            }
        ]
    },
    // ESPANHA - Rodadas 1-5
    {
        "id": 431,
        "turnName": "Rodada 1",
        "matches": [
            {
                "id": 1928,
                "date": "2025-10-19T13:00:00.000Z",
                "participants": { "homeTeamId": 12, "awayTeamId": 9 },
                "status": "ended"
            },
            {
                "id": 1929,
                "date": "2025-10-19T14:00:00.000Z",
                "participants": { "homeTeamId": 179, "awayTeamId": 7 },
                "status": "ended"
            },
            {
                "id": 1930,
                "date": "2025-10-19T15:00:00.000Z",
                "participants": { "homeTeamId": 8, "awayTeamId": 5 },
                "status": "ended"
            },
            {
                "id": 1931,
                "date": "2025-10-19T16:00:00.000Z",
                "participants": { "homeTeamId": 210, "awayTeamId": 10 },
                "status": "ended"
            },
            {
                "id": 1932,
                "date": "2025-10-19T17:00:00.000Z",
                "participants": { "homeTeamId": 3, "awayTeamId": 4 },
                "status": "ended"
            },
            {
                "id": 1933,
                "date": "2025-10-19T18:00:00.000Z",
                "participants": { "homeTeamId": 2, "awayTeamId": 6 },
                "status": "ended"
            }
        ]
    },
    {
        "id": 432,
        "turnName": "Rodada 2",
        "matches": [
            {
                "id": 1957,
                "date": "2025-10-24T17:00:00.000Z",
                "participants": { "homeTeamId": 3, "awayTeamId": 8 },
                "status": "ended"
            },
            {
                "id": 1954,
                "date": "2025-10-24T18:00:00.000Z",
                "participants": { "homeTeamId": 9, "awayTeamId": 6 },
                "status": "inPlay2H"
            },
            {
                "id": 1952,
                "date": "2025-10-24T19:00:00.000Z",
                "participants": { "homeTeamId": 179, "awayTeamId": 2 },
                "status": null
            },
            {
                "id": 1953,
                "date": "2025-10-24T20:00:00.000Z",
                "participants": { "homeTeamId": 12, "awayTeamId": 7 },
                "status": null
            },
            {
                "id": 1955,
                "date": "2025-10-24T21:00:00.000Z",
                "participants": { "homeTeamId": 210, "awayTeamId": 4 },
                "status": null
            },
            {
                "id": 1956,
                "date": "2025-10-24T22:00:00.000Z",
                "participants": { "homeTeamId": 10, "awayTeamId": 5 },
                "status": null
            }
        ]
    },
    {
        "id": 433,
        "turnName": "Rodada 3",
        "matches": [
            {
                "id": 1958,
                "date": "2025-10-29T23:01:00.000Z",
                "participants": { "homeTeamId": 179, "awayTeamId": 12 },
                "status": null
            },
            {
                "id": 1959,
                "date": "2025-10-29T23:01:00.000Z",
                "participants": { "homeTeamId": 9, "awayTeamId": 2 },
                "status": null
            },
            {
                "id": 1960,
                "date": "2025-10-29T23:01:00.000Z",
                "participants": { "homeTeamId": 6, "awayTeamId": 7 },
                "status": null
            },
            {
                "id": 1961,
                "date": "2025-10-29T23:01:00.000Z",
                "participants": { "homeTeamId": 10, "awayTeamId": 3 },
                "status": null
            },
            {
                "id": 1962,
                "date": "2025-10-29T23:01:00.000Z",
                "participants": { "homeTeamId": 4, "awayTeamId": 8 },
                "status": null
            },
            {
                "id": 1963,
                "date": "2025-10-29T23:01:00.000Z",
                "participants": { "homeTeamId": 5, "awayTeamId": 210 },
                "status": null
            }
        ]
    },
    {
        "id": 434,
        "turnName": "Rodada 4",
        "matches": [
            {
                "id": 1964,
                "date": "2025-11-01T23:01:00.000Z",
                "participants": { "homeTeamId": 179, "awayTeamId": 9 },
                "status": null
            },
            {
                "id": 1965,
                "date": "2025-11-01T23:01:00.000Z",
                "participants": { "homeTeamId": 6, "awayTeamId": 12 },
                "status": null
            },
            {
                "id": 1966,
                "date": "2025-11-01T23:01:00.000Z",
                "participants": { "homeTeamId": 7, "awayTeamId": 2 },
                "status": null
            },
            {
                "id": 1967,
                "date": "2025-11-01T23:01:00.000Z",
                "participants": { "homeTeamId": 10, "awayTeamId": 4 },
                "status": null
            },
            {
                "id": 1968,
                "date": "2025-11-01T23:01:00.000Z",
                "participants": { "homeTeamId": 5, "awayTeamId": 3 },
                "status": null
            },
            {
                "id": 1969,
                "date": "2025-11-01T23:01:00.000Z",
                "participants": { "homeTeamId": 210, "awayTeamId": 8 },
                "status": null
            }
        ]
    },
    {
        "id": 435,
        "turnName": "Rodada 5",
        "matches": [
            {
                "id": 1970,
                "date": "2025-11-08T23:01:00.000Z",
                "participants": { "homeTeamId": 179, "awayTeamId": 6 },
                "status": null
            },
            {
                "id": 1971,
                "date": "2025-11-08T23:01:00.000Z",
                "participants": { "homeTeamId": 7, "awayTeamId": 9 },
                "status": null
            },
            {
                "id": 1972,
                "date": "2025-11-08T23:01:00.000Z",
                "participants": { "homeTeamId": 2, "awayTeamId": 12 },
                "status": null
            },
            {
                "id": 1973,
                "date": "2025-11-08T23:01:00.000Z",
                "participants": { "homeTeamId": 10, "awayTeamId": 8 },
                "status": null
            },
            {
                "id": 1974,
                "date": "2025-11-08T23:01:00.000Z",
                "participants": { "homeTeamId": 4, "awayTeamId": 5 },
                "status": null
            },
            {
                "id": 1975,
                "date": "2025-11-08T23:01:00.000Z",
                "participants": { "homeTeamId": 3, "awayTeamId": 210 },
                "status": null
            }
        ]
    }
];

async function createKingsLeagueMatches() {
    try {
        console.log('🎮 Criando partidas da Kings League no banco...');

        // Limpar partidas existentes para recriar com o mapeamento correto
        console.log('🧹 Limpando partidas existentes...');
        await prisma.match.deleteMany({
            where: {
                OR: [
                    { region: 'BR' },
                    { region: 'ES' }
                ]
            }
        });
        console.log('✅ Partidas antigas removidas');

        // Buscar times disponíveis no banco (Brasil e Espanha)
        const teams = await prisma.team.findMany({
            where: {
                OR: [
                    { region: 'BR' },
                    { region: 'ES' }
                ]
            },
            include: { aliases: true }
        });

        console.log(`📊 Times disponíveis no banco: ${teams.length}`);
        teams.forEach(team => {
            console.log(`  - ${team.name} (${team.code})`);
        });

        let totalMatches = 0;
        let createdMatches = 0;
        let skippedMatches = 0;

        // Processar cada rodada
        for (const turn of KINGS_LEAGUE_DATA) {
            console.log(`\n🎯 Processando ${turn.turnName}...`);

            for (const match of turn.matches) {
                totalMatches++;

                const homeTeamName = TEAM_MAPPING[match.participants.homeTeamId];
                const awayTeamName = TEAM_MAPPING[match.participants.awayTeamId];

                if (!homeTeamName || !awayTeamName) {
                    console.log(`⚠️  Times não mapeados: ${match.participants.homeTeamId} vs ${match.participants.awayTeamId}`);
                    skippedMatches++;
                    continue;
                }

                // Buscar times no banco (por nome ou alias)
                const homeTeam = teams.find(t =>
                    t.name === homeTeamName ||
                    t.aliases.some(a => a.alias === homeTeamName)
                );

                const awayTeam = teams.find(t =>
                    t.name === awayTeamName ||
                    t.aliases.some(a => a.alias === awayTeamName)
                );

                if (!homeTeam || !awayTeam) {
                    console.log(`⚠️  Times não encontrados no banco: ${homeTeamName} vs ${awayTeamName}`);
                    skippedMatches++;
                    continue;
                }

                // Verificar se já existe
                const existing = await prisma.match.findFirst({
                    where: {
                        homeId: homeTeam.id,
                        awayId: awayTeam.id,
                        startsAt: new Date(match.date)
                    }
                });

                if (existing) {
                    console.log(`⏭️  Já existe: ${homeTeamName} vs ${awayTeamName}`);
                    skippedMatches++;
                    continue;
                }

                try {
                    // Determinar região e rodada baseado no ID do turno
                    let region: 'BR' | 'ES';
                    let round: number;

                    if ([394, 395, 396].includes(turn.id)) {
                        // Brasil - Rodadas 3, 4, 5
                        region = 'BR';
                        round = turn.id === 394 ? 3 : (turn.id === 395 ? 4 : 5);
                    } else if ([431, 432, 433, 434, 435].includes(turn.id)) {
                        // Espanha - Rodadas 1, 2, 3, 4, 5
                        region = 'ES';
                        round = turn.id === 431 ? 1 :
                            turn.id === 432 ? 2 :
                                turn.id === 433 ? 3 :
                                    turn.id === 434 ? 4 : 5;
                    } else {
                        console.log(`⚠️  ID de turno desconhecido: ${turn.id}`);
                        skippedMatches++;
                        continue;
                    }

                    // Criar a partida
                    const newMatch = await prisma.match.create({
                        data: {
                            round: round,
                            region: region,
                            startsAt: new Date(match.date),
                            homeId: homeTeam.id,
                            awayId: awayTeam.id,
                            status: 'OPEN' // Liberada para palpites
                        },
                        include: {
                            home: true,
                            away: true
                        }
                    });

                    createdMatches++;
                    const dateStr = new Date(match.date).toLocaleString('pt-BR');
                    console.log(`✅ ${newMatch.home.name} vs ${newMatch.away.name} - ${dateStr} (${region})`);

                } catch (error: any) {
                    console.log(`❌ Erro ao criar ${homeTeamName} vs ${awayTeamName}: ${error.message}`);
                    skippedMatches++;
                }
            }
        }

        console.log(`\n🎉 Importação concluída!`);
        console.log(`- Total de partidas: ${totalMatches}`);
        console.log(`- Criadas: ${createdMatches}`);
        console.log(`- Puladas: ${skippedMatches}`);

        // Listar todas as partidas no banco
        const allMatches = await prisma.match.findMany({
            include: { home: true, away: true },
            orderBy: { startsAt: 'asc' }
        });

        console.log(`\n📋 Partidas no banco (${allMatches.length} total):`);
        allMatches.forEach(match => {
            const dateStr = match.startsAt.toLocaleString('pt-BR');
            console.log(`  ${match.home.name} vs ${match.away.name} - ${dateStr} (${match.status})`);
        });

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createKingsLeagueMatches();