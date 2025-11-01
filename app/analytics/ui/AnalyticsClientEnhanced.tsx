'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    LineChart,
    Line,
    ResponsiveContainer
} from 'recharts';

interface AnalyticsData {
    outcomeDistribution: Array<{ name: string; value: number; color: string }>;
    accuracyRate: Array<{ name: string; value: number; color: string }>;
    topUsers: Array<{ name: string; points: number; guesses: number }>;
    matchesByRegion: Array<{ region: string; count: number }>;
    guessesOverTime: Array<{ date: string; count: number }>;
    matchStatus: Array<{ name: string; value: number; color: string }>;
    // NOVOS DADOS
    topScores: Array<{ score: string; count: number; percentage: number }>;
    firstGuessers: Array<{ user: string; date: string; score: string; match: string }>;
    scoresByPopularity: Array<{ name: string; value: number; color: string }>;
    // DISTRIBUIÇÃO DE APOSTAS POR TIPO
    betDistribution: Array<{ name: string; value: number; percentage: string; color: string }>;
    // PARTIDAS ORGANIZADAS POR RODADA
    currentRoundMatches: Record<string, {
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
    }>;
    // PALPITES EM TEMPO REAL
    recentGuesses?: Array<{
        id: string;
        user: string;
        score: string;
        match: string;
        channel: string;
        points: number;
        isCorrect: boolean | null;
        date: string;
        timestamp: number
    }>;
    totalGuesses?: number;
    lastUpdated?: string;
}

interface Props {
    data: AnalyticsData;
}


// Dados vazios
const emptyData: AnalyticsData = {
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
    currentRoundMatches: {},
    recentGuesses: [],
    totalGuesses: 0,
    lastUpdated: ''
};

export default function AnalyticsClientEnhanced({ data: initialData }: Props) {
    const [selectedChart, setSelectedChart] = useState('overview');
    const [data, setData] = useState<AnalyticsData>(initialData);
    const [isLoading, setIsLoading] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
    const [selectedRound, setSelectedRound] = useState<number>(1);
    const [hasUserSelectedRound, setHasUserSelectedRound] = useState(false);

    // Selecionar automaticamente a rodada mais alta APENAS no carregamento inicial
    useEffect(() => {
        if (!hasUserSelectedRound && data && data.currentRoundMatches && Object.keys(data.currentRoundMatches).length > 0) {
            const rounds = Object.values(data.currentRoundMatches).map(r => r.round);
            if (rounds.length > 0) {
                const highestRound = Math.max(...rounds);
                setSelectedRound(highestRound);
            }
        }
    }, [data.currentRoundMatches, hasUserSelectedRound]);

    // Função para buscar dados atualizados
    const fetchLatestData = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/analytics', {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache'
                }
            });

            if (response.ok) {
                const newData = await response.json();
                setData(newData);
                setLastUpdate(new Date());
            } else if (response.status === 401) {
                console.error('Usuário não autenticado - redirecionando para login');
                window.location.href = '/login';
            }
        } catch (error) {
            console.error('Erro ao atualizar dados:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);    // Atualização automática para partidas e palpites em tempo real
    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        if (selectedChart === 'matches' || selectedChart === 'guesses') {
            // Atualização automática a cada 5 segundos para dados em tempo real
            intervalId = setInterval(() => {
                fetchLatestData();
            }, 5000);
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [selectedChart, fetchLatestData]); const chartTabs = [
        { id: 'overview', label: '📊 Visão Geral' },
        { id: 'users', label: '👥 Usuários' },
        { id: 'scores', label: '⚽ Placares' },
        { id: 'guesses', label: '🎯 Palpites' },
        { id: 'timeline', label: '⏰ Timeline' },
        { id: 'matches', label: '🏆 Partidas' },
        { id: 'trends', label: '📈 Tendências' }
    ];

    return (
        <div className="space-y-6">
            {/* Info Header */}
            <div className="flex gap-3 p-4 rounded-2xl border border-green-400/20 bg-green-900/20 shadow-[0_0_0_1px_rgba(34,197,94,0.08)]">
                <div className="text-sm text-green-400 flex items-center">
                    ✨ Analytics do seu Canal | 📊 Dados em tempo real dos palpites da sua comunidade
                </div>
            </div>

            {/* Status Tempo Real - Abaixo do título principal */}
            <div className="rounded-2xl border border-green-400/20 bg-green-900/20 p-6 shadow-[0_0_0_1px_rgba(34,197,94,0.08)]">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-semibold text-green-300">
                        🔥 Partidas por Rodada - Palpites da Sua Comunidade
                    </h3>
                    <div className="flex items-center gap-3">
                        {isLoading ? (
                            <div className="flex items-center gap-2 text-amber-400">
                                <div className="w-3 h-3 rounded-full bg-amber-400 animate-pulse"></div>
                                <span className="text-sm">Atualizando...</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-green-400">
                                <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
                                <span className="text-sm">AO VIVO</span>
                            </div>
                        )}
                        <button
                            onClick={fetchLatestData}
                            disabled={isLoading}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-green-800 rounded text-xs text-white transition"
                        >
                            🔄 Atualizar
                        </button>
                        <span className="text-xs text-zinc-400">
                            {lastUpdate.toLocaleTimeString('pt-BR')}
                        </span>
                    </div>
                </div>
                <p className="text-green-400 text-sm">
                    🔄 Atualização automática a cada 5 segundos • Dados filtrados pelos palpites do seu canal
                </p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-amber-400/20">
                {chartTabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setSelectedChart(tab.id)}
                        className={`px-4 py-2 rounded-t-lg font-semibold transition relative ${selectedChart === tab.id
                            ? 'bg-amber-400 text-black border-b-2 border-amber-400'
                            : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {selectedChart === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Taxa de Acerto */}
                    <div className="rounded-2xl border border-amber-400/20 bg-zinc-900/60 p-6 shadow-[0_0_0_1px_rgba(255,196,28,0.08)]">
                        <h3 className="text-xl font-semibold mb-4 text-amber-300">
                            🎯 Taxa de Acerto
                        </h3>
                        {data.accuracyRate.length > 0 ? (
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={data.accuracyRate}
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={80}
                                            dataKey="value"
                                        >
                                            {data.accuracyRate.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#18181B',
                                                border: '1px solid rgba(251, 191, 36, 0.2)',
                                                borderRadius: '8px',
                                                color: '#FFFFFF',
                                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                                            }}
                                            labelStyle={{
                                                color: '#FFFFFF',
                                                fontWeight: 'bold'
                                            }}
                                            itemStyle={{
                                                color: '#FFFFFF'
                                            }}
                                        />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-80 flex items-center justify-center text-zinc-500">
                                Nenhum dado disponível no momento.
                            </div>
                        )}
                    </div>

                    {/* Distribuição de Resultados */}
                    <div className="rounded-2xl border border-amber-400/20 bg-zinc-900/60 p-6 shadow-[0_0_0_1px_rgba(255,196,28,0.08)]">
                        <h3 className="text-xl font-semibold mb-4 text-amber-300">
                            🏆 Distribuição de Palpites
                        </h3>
                        {data.outcomeDistribution.length > 0 ? (
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={data.outcomeDistribution}
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={80}
                                            dataKey="value"
                                        >
                                            {data.outcomeDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#18181B',
                                                border: '1px solid rgba(251, 191, 36, 0.2)',
                                                borderRadius: '8px',
                                                color: '#FFFFFF',
                                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                                            }}
                                            labelStyle={{
                                                color: '#FFFFFF',
                                                fontWeight: 'bold'
                                            }}
                                            itemStyle={{
                                                color: '#FFFFFF'
                                            }}
                                        />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-80 flex items-center justify-center text-zinc-500">
                                Nenhum dado disponível no momento.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* NOVA ABA: Placares */}
            {selectedChart === 'scores' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Ranking de Placares Mais Usados */}
                    <div className="rounded-2xl border border-amber-400/20 bg-zinc-900/60 p-6 shadow-[0_0_0_1px_rgba(255,196,28,0.08)]">
                        <h3 className="text-xl font-semibold mb-4 text-amber-300">
                            🥅 Top 10 Placares Mais Apostados
                        </h3>
                        {data.topScores.length > 0 ? (
                            <div className="h-96">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data.topScores} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                        <XAxis
                                            dataKey="score"
                                            tick={{ fill: '#D1D5DB', fontSize: 12 }}
                                        />
                                        <YAxis tick={{ fill: '#D1D5DB' }} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#18181B',
                                                border: '1px solid rgba(251, 191, 36, 0.2)',
                                                borderRadius: '8px',
                                                color: '#F3F4F6'
                                            }}
                                            formatter={(value, name) => [
                                                name === 'count' ? `${value} palpites` : `${value}%`,
                                                name === 'count' ? 'Quantidade' : 'Percentual'
                                            ]}
                                        />
                                        <Legend />
                                        <Bar dataKey="count" fill="#FCD34D" name="Palpites" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-96 flex items-center justify-center text-zinc-500">
                                Nenhum dado disponível no momento.
                            </div>
                        )}
                    </div>

                    {/* Distribuição de Placares por Popularidade (Pizza) */}
                    <div className="rounded-2xl border border-amber-400/20 bg-zinc-900/60 p-6 shadow-[0_0_0_1px_rgba(255,196,28,0.08)]">
                        <h3 className="text-xl font-semibold mb-4 text-amber-300">
                            📊 Distribuição dos Top 6 Placares
                        </h3>
                        {data.scoresByPopularity.length > 0 ? (
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={data.scoresByPopularity}
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={80}
                                            dataKey="value"
                                        >
                                            {data.scoresByPopularity.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#18181B',
                                                border: '1px solid rgba(251, 191, 36, 0.2)',
                                                borderRadius: '8px',
                                                color: '#FFFFFF',
                                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                                            }}
                                            labelStyle={{
                                                color: '#FFFFFF',
                                                fontWeight: 'bold'
                                            }}
                                            itemStyle={{
                                                color: '#FFFFFF'
                                            }}
                                        />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-80 flex items-center justify-center text-zinc-500">
                                Nenhum dado disponível no momento.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* NOVA ABA: Timeline */}
            {selectedChart === 'timeline' && (
                <div className="grid grid-cols-1 gap-6">
                    {/* Timeline dos Primeiros Palpites */}
                    <div className="rounded-2xl border border-amber-400/20 bg-zinc-900/60 p-6 shadow-[0_0_0_1px_rgba(255,196,28,0.08)]">
                        <h3 className="text-xl font-semibold mb-4 text-amber-300">
                            ⏰ Primeiros Palpiteiros (Ordem Cronológica)
                        </h3>
                        {data.firstGuessers.length > 0 ? (
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {data.firstGuessers.map((guess, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-4 rounded-xl border border-zinc-700 bg-zinc-800/40 hover:bg-zinc-800/60 transition"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-8 h-8 rounded-full bg-amber-400 text-black font-bold flex items-center justify-center text-sm">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-amber-200">
                                                    {guess.user}
                                                </div>
                                                <div className="text-sm text-zinc-400">
                                                    {guess.match}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-lg text-green-400">
                                                {guess.score}
                                            </div>
                                            <div className="text-xs text-zinc-500">
                                                {guess.date}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-96 flex items-center justify-center text-zinc-500">
                                Nenhum dado disponível no momento.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Users Tab */}
            {selectedChart === 'users' && (
                <div className="grid grid-cols-1 gap-6">
                    <div className="rounded-2xl border border-amber-400/20 bg-zinc-900/60 p-6 shadow-[0_0_0_1px_rgba(255,196,28,0.08)]">
                        <h3 className="text-xl font-semibold mb-4 text-amber-300">
                            🏅 Top Usuários por Pontuação
                        </h3>
                        {data.topUsers.length > 0 ? (
                            <div className="h-96">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data.topUsers} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                        <XAxis
                                            dataKey="name"
                                            angle={-45}
                                            textAnchor="end"
                                            height={100}
                                            interval={0}
                                            tick={{ fill: '#D1D5DB', fontSize: 12 }}
                                        />
                                        <YAxis tick={{ fill: '#D1D5DB' }} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#18181B',
                                                border: '1px solid rgba(251, 191, 36, 0.2)',
                                                borderRadius: '8px',
                                                color: '#F3F4F6'
                                            }}
                                        />
                                        <Legend />
                                        <Bar dataKey="points" fill="#FCD34D" name="Pontos" />
                                        <Bar dataKey="guesses" fill="#10B981" name="Palpites" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-96 flex items-center justify-center text-zinc-500">
                                Nenhum dado disponível no momento.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Matches Tab - NOVO: Partidas Organizadas por Rodada */}
            {selectedChart === 'matches' && (
                <div className="space-y-6">
                    {/* Abas das Rodadas */}
                    {data && data.currentRoundMatches && Object.keys(data.currentRoundMatches).length > 0 ? (
                        <div className="space-y-4">
                            {/* Navigation das Rodadas */}
                            <div className="flex flex-wrap gap-2 border-b border-zinc-700 pb-4">
                                {Object.entries(data.currentRoundMatches)
                                    .sort(([, a], [, b]) => a.round - b.round)
                                    .map(([key, roundData]) => (
                                        <button
                                            key={key}
                                            onClick={() => {
                                                setSelectedRound(roundData.round);
                                                setHasUserSelectedRound(true);
                                            }}
                                            className={`px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2 ${selectedRound === roundData.round
                                                ? 'bg-amber-400 text-black'
                                                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                                                }`}
                                        >
                                            <span>🏆 Rodada {roundData.round}</span>
                                            <span className={`text-xs ${roundData.openMatches > 0 ? 'text-green-400 font-semibold' : 'opacity-75'}`}>
                                                ({roundData.openMatches > 0 ? `🔴 ${roundData.openMatches} abertas` : `📊 ${roundData.totalMatches} partidas`})
                                            </span>
                                        </button>
                                    ))}
                            </div>

                            {/* Partidas da Rodada Selecionada */}
                            {(() => {
                                const roundKey = `rodada_${selectedRound}`;
                                const roundData = data && data.currentRoundMatches ? data.currentRoundMatches[roundKey] : null;

                                if (!roundData) {
                                    return (
                                        <div className="rounded-2xl border border-zinc-700 bg-zinc-900/60 p-12 text-center">
                                            <div className="text-4xl mb-4">🏆</div>
                                            <div className="text-xl text-zinc-400 mb-2">Rodada {selectedRound} não encontrada</div>
                                            <div className="text-zinc-500">Selecione uma rodada disponível</div>
                                        </div>
                                    );
                                }

                                return (
                                    <div className="space-y-4">
                                        {/* Info da Rodada */}
                                        <div className="rounded-xl border border-amber-400/20 bg-amber-900/10 p-4">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-lg font-semibold text-amber-300">
                                                    🏆 Rodada {roundData.round}
                                                </h4>
                                                <div className="flex items-center gap-4 text-sm text-amber-400">
                                                    <span>📊 {roundData.totalMatches} partidas</span>
                                                    <span>🔴 {roundData.openMatches} abertas</span>
                                                    <span>✅ {roundData.finishedMatches} finalizadas</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Grid das Partidas */}
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {roundData.matches.map((match) => (
                                                <div
                                                    key={match.id}
                                                    className={`rounded-2xl border border-amber-400/20 bg-zinc-900/60 p-6 shadow-[0_0_0_1px_rgba(255,196,28,0.08)] transition-all ${isLoading ? 'opacity-75 scale-[0.98]' : 'opacity-100 scale-100'
                                                        }`}
                                                >
                                                    {/* Cabeçalho da Partida */}
                                                    <div className="mb-4">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <h5 className="text-lg font-semibold text-amber-300">
                                                                {match.homeTeam} vs {match.awayTeam}
                                                            </h5>
                                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${match.status === 'OPEN'
                                                                ? 'bg-green-500/20 text-green-300'
                                                                : match.status === 'FINISHED'
                                                                    ? 'bg-blue-500/20 text-blue-300'
                                                                    : 'bg-orange-500/20 text-orange-300'
                                                                }`}>
                                                                {match.status === 'OPEN' ? '🔴 ABERTA' :
                                                                    match.status === 'FINISHED' ? '✅ FINALIZADA' : '🔒 TRAVADA'}
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center justify-between text-sm text-zinc-400">
                                                            <span>📅 {match.date}</span>
                                                            <div className="flex items-center gap-2">
                                                                <span>🎯 {match.totalBets} palpites</span>
                                                                {match.status === 'OPEN' && (
                                                                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" title="Recebendo palpites"></div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {match.result && (
                                                            <div className="mt-2 p-2 bg-blue-500/10 rounded text-center">
                                                                <span className="text-blue-300 font-semibold">
                                                                    Resultado: {match.result.goalsHome} x {match.result.goalsAway}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Gráfico de Pizza */}
                                                    {match.totalBets > 0 ? (
                                                        <div className={`h-64 transition-all duration-300 ${isLoading ? 'blur-sm' : 'blur-0'}`}>
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                <PieChart>
                                                                    <Pie
                                                                        data={match.betDistribution}
                                                                        cx="50%"
                                                                        cy="50%"
                                                                        outerRadius={70}
                                                                        dataKey="value"
                                                                        label={({ percentage }) => `${percentage}%`}
                                                                        labelLine={false}
                                                                        animationBegin={0}
                                                                        animationDuration={800}
                                                                    >
                                                                        {match.betDistribution.map((entry, index) => (
                                                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                                                        ))}
                                                                    </Pie>
                                                                    <Tooltip
                                                                        formatter={(value: number, name: string, props: any) => [
                                                                            `${value} apostas (${props.payload.percentage}%)`,
                                                                            name
                                                                        ]}
                                                                        contentStyle={{
                                                                            backgroundColor: '#18181B',
                                                                            border: '1px solid rgba(251, 191, 36, 0.2)',
                                                                            borderRadius: '8px',
                                                                            color: '#FFFFFF',
                                                                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                                                                        }}
                                                                        labelStyle={{
                                                                            color: '#FFFFFF',
                                                                            fontWeight: 'bold'
                                                                        }}
                                                                        itemStyle={{
                                                                            color: '#FFFFFF'
                                                                        }}
                                                                    />
                                                                    <Legend />
                                                                </PieChart>
                                                            </ResponsiveContainer>
                                                        </div>
                                                    ) : (
                                                        <div className="h-64 flex items-center justify-center text-zinc-500">
                                                            <div className="text-center">
                                                                <div className="text-3xl mb-2">🎯</div>
                                                                <div>Nenhum palpite ainda</div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Estatísticas Detalhadas */}
                                                    <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                                                        {match.betDistribution.map((bet) => (
                                                            <div key={bet.type} className="text-center p-2 rounded bg-zinc-800/50">
                                                                <div className="font-semibold" style={{ color: bet.color }}>
                                                                    {bet.value}
                                                                </div>
                                                                <div className="text-zinc-400 truncate">
                                                                    {bet.name}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-zinc-700 bg-zinc-900/60 p-12 text-center">
                            <div className="text-4xl mb-4">⏰</div>
                            <div className="text-xl text-zinc-400 mb-2">Nenhuma partida encontrada</div>
                            <div className="text-zinc-500">As partidas aparecerão aqui organizadas por rodada</div>
                        </div>
                    )}
                </div>
            )}            {/* Trends Tab */}
            {selectedChart === 'trends' && (
                <div className="grid grid-cols-1 gap-6">
                    <div className="rounded-2xl border border-amber-400/20 bg-zinc-900/60 p-6 shadow-[0_0_0_1px_rgba(255,196,28,0.08)]">
                        <h3 className="text-xl font-semibold mb-4 text-amber-300">
                            📈 Evolução Temporal
                        </h3>
                        {data.guessesOverTime.length > 0 ? (
                            <div className="h-96">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={data.guessesOverTime} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                        <XAxis
                                            dataKey="date"
                                            tick={{ fill: '#D1D5DB' }}
                                        />
                                        <YAxis tick={{ fill: '#D1D5DB' }} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#18181B',
                                                border: '1px solid rgba(251, 191, 36, 0.2)',
                                                borderRadius: '8px',
                                                color: '#F3F4F6'
                                            }}
                                        />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="count"
                                            stroke="#FCD34D"
                                            strokeWidth={3}
                                            name="Palpites"
                                            dot={{ fill: '#FCD34D', strokeWidth: 2, r: 4 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-96 flex items-center justify-center text-zinc-500">
                                Nenhum dado disponível no momento.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Guesses Tab - NOVO: Palpites em Tempo Real */}
            {selectedChart === 'guesses' && (
                <div className="grid grid-cols-1 gap-6">
                    {/* Header com informações */}
                    <div className="rounded-2xl border border-green-400/20 bg-green-900/20 p-6 shadow-[0_0_0_1px_rgba(34,197,94,0.08)]">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-semibold text-green-300">
                                🎯 Palpites em Tempo Real
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-green-400">
                                <span>Total: {data.totalGuesses || 0}</span>
                                {data.lastUpdated && (
                                    <span>Atualizado: {new Date(data.lastUpdated).toLocaleTimeString('pt-BR')}</span>
                                )}
                            </div>
                        </div>

                        {data.recentGuesses && data.recentGuesses.length > 0 ? (
                            <div className="space-y-4">
                                {/* Lista de palpites */}
                                <div className="max-h-96 overflow-y-auto space-y-2">
                                    {data.recentGuesses.map((guess) => (
                                        <div
                                            key={guess.id}
                                            className={`flex items-center justify-between p-3 rounded-lg border transition-all ${guess.isCorrect === true
                                                ? 'border-green-500/30 bg-green-900/20'
                                                : guess.isCorrect === false
                                                    ? 'border-red-500/30 bg-red-900/20'
                                                    : 'border-amber-500/30 bg-amber-900/20'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${guess.isCorrect === true
                                                    ? 'bg-green-400'
                                                    : guess.isCorrect === false
                                                        ? 'bg-red-400'
                                                        : 'bg-amber-400'
                                                    }`} />

                                                <div>
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <span className="font-semibold text-white">
                                                            {guess.user}
                                                        </span>
                                                        <span className="text-zinc-400">•</span>
                                                        <span className="text-zinc-400 text-xs">
                                                            {guess.channel}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-zinc-500 mt-1">
                                                        {guess.match}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <div className={`text-lg font-bold ${guess.isCorrect === true
                                                        ? 'text-green-300'
                                                        : guess.isCorrect === false
                                                            ? 'text-red-300'
                                                            : 'text-amber-300'
                                                        }`}>
                                                        {guess.score}
                                                    </div>
                                                    <div className="text-xs text-zinc-500">
                                                        {guess.points} pts
                                                    </div>
                                                </div>

                                                <div className="text-xs text-zinc-500 min-w-[60px] text-right">
                                                    {guess.date.split(' ')[1]} {/* Mostra apenas a hora */}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Status de carregamento automático */}
                                <div className="text-center text-xs text-zinc-500 pt-2 border-t border-zinc-700">
                                    🔄 Atualizando automaticamente a cada acesso à página
                                </div>
                            </div>
                        ) : (
                            <div className="h-96 flex flex-col items-center justify-center text-zinc-500">
                                <div className="text-4xl mb-4">🎯</div>
                                <div className="text-lg">Nenhum palpite encontrado</div>
                                <div className="text-sm mt-2">Os palpites aparecerão aqui em tempo real</div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Summary Cards - ATUALIZADO com novos dados */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="rounded-xl border border-amber-400/20 bg-gradient-to-r from-amber-400/10 to-amber-500/10 p-6 text-zinc-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-amber-200">Total de Palpites</p>
                            <p className="text-2xl font-bold text-amber-300">
                                {data.outcomeDistribution.reduce((sum, item) => sum + item.value, 0)}
                            </p>
                        </div>
                        <div className="text-3xl opacity-80">🎯</div>
                    </div>
                </div>

                <div className="rounded-xl border border-amber-400/20 bg-gradient-to-r from-green-500/10 to-green-600/10 p-6 text-zinc-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-200">Placar Mais Usado</p>
                            <p className="text-2xl font-bold text-green-300">
                                {data.topScores.length > 0 ? data.topScores[0].score : 'N/A'}
                            </p>
                        </div>
                        <div className="text-3xl opacity-80">⚽</div>
                    </div>
                </div>

                <div className="rounded-xl border border-amber-400/20 bg-gradient-to-r from-purple-500/10 to-purple-600/10 p-6 text-zinc-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-200">Primeiro Palpiteiro</p>
                            <p className="text-2xl font-bold text-purple-300">
                                {data.firstGuessers.length > 0 ? data.firstGuessers[0].user.slice(0, 10) : 'N/A'}
                            </p>
                        </div>
                        <div className="text-3xl opacity-80">🥇</div>
                    </div>
                </div>

                <div className="rounded-xl border border-amber-400/20 bg-gradient-to-r from-blue-500/10 to-blue-600/10 p-6 text-zinc-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-200">Taxa de Acerto</p>
                            <p className="text-2xl font-bold text-blue-300">
                                {data.accuracyRate.length > 0
                                    ? `${((data.accuracyRate[0]?.value || 0) / (data.accuracyRate.reduce((sum, item) => sum + item.value, 0) || 1) * 100).toFixed(1)}%`
                                    : '0%'
                                }
                            </p>
                        </div>
                        <div className="text-3xl opacity-80">✅</div>
                    </div>
                </div>
            </div>
        </div>
    );
}