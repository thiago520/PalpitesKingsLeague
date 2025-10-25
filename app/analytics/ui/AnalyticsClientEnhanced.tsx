'use client';

import { useState } from 'react';
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
}

interface Props {
    data: AnalyticsData;
}

// Função para gerar dados aleatórios aprimorada
const generateFakeData = (): AnalyticsData => {
    // Gerar nomes de usuários aleatórios
    const fakeUsers = [
        'PalpiteMaster', 'GoalHunter', 'ScoreWizard', 'MatchPredictor', 'LeagueExpert',
        'FootballFan', 'BetKing', 'PredictorPro', 'GoalGetter', 'MatchMaker',
        'ScoreGenius', 'MatchSage', 'PredictKing', 'GoalOracle', 'BetWizard'
    ];

    // Placares mais comuns no futebol
    const commonScores = [
        '1x0', '2x1', '1x1', '2x0', '0x1', '3x1', '2x2', '0x0', '3x0', '1x2',
        '4x1', '0x2', '3x2', '4x0', '2x3', '1x3', '5x1', '0x3', '4x2', '5x0'
    ];

    // Times fictícios
    const fakeTeams = [
        'Porcinos FC', 'Rayo de Barcelona', 'Saiyans FC', 'Pio FC', 'Xbuyer Team',
        'Los Troncos FC', 'Jijantes FC', 'Kunisports', '1K FC', 'Aniquiladores FC',
        'El Barrio', 'Spartans'
    ];

    // Gerar distribuição de resultados
    const homeWins = Math.floor(Math.random() * 100) + 50;
    const awayWins = Math.floor(Math.random() * 80) + 40;
    const draws = Math.floor(Math.random() * 30) + 20;

    const outcomeDistribution = [
        { name: 'Vitória Casa', value: homeWins, color: '#10B981' },
        { name: 'Vitória Visitante', value: awayWins, color: '#EF4444' },
        { name: 'Empate', value: draws, color: '#F59E0B' }
    ];

    // Gerar taxa de acerto
    const correctGuesses = Math.floor(Math.random() * 150) + 100;
    const incorrectGuesses = Math.floor(Math.random() * 200) + 150;

    const accuracyRate = [
        { name: 'Acertos', value: correctGuesses, color: '#10B981' },
        { name: 'Erros', value: incorrectGuesses, color: '#EF4444' }
    ];

    // Gerar top usuários
    const topUsers = fakeUsers.slice(0, 8).map(name => ({
        name,
        points: Math.floor(Math.random() * 500) + 50,
        guesses: Math.floor(Math.random() * 100) + 20
    })).sort((a, b) => b.points - a.points);

    // Gerar partidas por região
    const regions = ['BR', 'ES', 'MX', 'IT', 'FR', 'DE', 'MENA'];
    const matchesByRegion = regions.map(region => ({
        region,
        count: Math.floor(Math.random() * 50) + 10
    }));

    // Gerar dados temporais (últimos 10 dias)
    const guessesOverTime = Array.from({ length: 10 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (9 - i));
        return {
            date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            count: Math.floor(Math.random() * 50) + 10
        };
    });

    // Gerar status das partidas
    const matchStatus = [
        { name: 'Rascunho', value: Math.floor(Math.random() * 20) + 5, color: '#6B7280' },
        { name: 'Aberta', value: Math.floor(Math.random() * 15) + 8, color: '#10B981' },
        { name: 'Travada', value: Math.floor(Math.random() * 10) + 3, color: '#F59E0B' },
        { name: 'Finalizada', value: Math.floor(Math.random() * 80) + 40, color: '#3B82F6' }
    ];

    // NOVO: Gerar ranking de placares mais usados
    const topScores = commonScores.slice(0, 10).map(score => {
        const count = Math.floor(Math.random() * 100) + 20;
        const total = 500; // Total fictício de palpites
        return {
            score,
            count,
            percentage: ((count / total) * 100)
        };
    }).sort((a, b) => b.count - a.count);

    // NOVO: Gerar primeiros palpiteiros por ordem cronológica
    const firstGuessers = Array.from({ length: 8 }, (_, i) => {
        const date = new Date();
        date.setHours(date.getHours() - (Math.random() * 48)); // Últimas 48h
        const homeTeam = fakeTeams[Math.floor(Math.random() * fakeTeams.length)];
        const awayTeam = fakeTeams[Math.floor(Math.random() * fakeTeams.length)];

        return {
            user: fakeUsers[Math.floor(Math.random() * fakeUsers.length)],
            date: date.toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            }),
            score: commonScores[Math.floor(Math.random() * 10)],
            match: `${homeTeam} vs ${awayTeam}`
        };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // NOVO: Distribuição de placares por popularidade (para gráfico de pizza)
    const scoresByPopularity = topScores.slice(0, 6).map((item, index) => ({
        name: item.score,
        value: item.count,
        color: [
            '#FCD34D', '#10B981', '#EF4444', '#8B5CF6', '#F59E0B', '#3B82F6'
        ][index] || '#6B7280'
    }));

    return {
        outcomeDistribution,
        accuracyRate,
        topUsers,
        matchesByRegion,
        guessesOverTime,
        matchStatus,
        topScores,
        firstGuessers,
        scoresByPopularity
    };
};

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
    scoresByPopularity: []
};

export default function AnalyticsClientEnhanced({ data: initialData }: Props) {
    const [selectedChart, setSelectedChart] = useState('overview');
    const [data, setData] = useState<AnalyticsData>(initialData);

    const chartTabs = [
        { id: 'overview', label: '📊 Visão Geral' },
        { id: 'users', label: '👥 Usuários' },
        { id: 'scores', label: '⚽ Placares', new: true }, // NOVA ABA
        { id: 'timeline', label: '⏰ Timeline', new: true }, // NOVA ABA
        { id: 'matches', label: '🏆 Partidas' },
        { id: 'trends', label: '📈 Tendências' }
    ];

    const handleGenerateFakeData = () => {
        const fakeData = generateFakeData();
        setData(fakeData);
    };

    const handleClearData = () => {
        setData(emptyData);
    };

    return (
        <div className="space-y-6">
            {/* Botões de controle */}
            <div className="flex gap-3 p-4 rounded-2xl border border-amber-400/20 bg-zinc-900/60 shadow-[0_0_0_1px_rgba(255,196,28,0.08)]">
                <button
                    onClick={handleGenerateFakeData}
                    className="px-4 py-2 rounded-xl bg-amber-400 text-black font-semibold hover:bg-amber-300 active:translate-y-px transition"
                >
                    🎲 Gerar Dados Fake
                </button>
                <button
                    onClick={handleClearData}
                    className="px-4 py-2 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-500/10 transition"
                >
                    🗑️ Limpar Dados
                </button>
                <div className="flex-1" />
                <div className="text-sm text-zinc-400 flex items-center">
                    💡 Dados salvos apenas em memória | ✨ Novas funcionalidades: Ranking de Placares e Timeline
                </div>
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
                        {tab.new && (
                            <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-1 rounded-full">
                                NEW
                            </span>
                        )}
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
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-80 flex items-center justify-center text-zinc-500">
                                Nenhum dado disponível. Clique em "Gerar Dados Fake" para testar.
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
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-80 flex items-center justify-center text-zinc-500">
                                Nenhum dado disponível. Clique em "Gerar Dados Fake" para testar.
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
                                Nenhum dado disponível. Clique em "Gerar Dados Fake" para testar.
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
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-80 flex items-center justify-center text-zinc-500">
                                Nenhum dado disponível. Clique em "Gerar Dados Fake" para testar.
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
                                Nenhum dado disponível. Clique em "Gerar Dados Fake" para testar.
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
                                Nenhum dado disponível. Clique em "Gerar Dados Fake" para testar.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Matches Tab */}
            {selectedChart === 'matches' && (
                <div className="grid grid-cols-1 gap-6">
                    <div className="rounded-2xl border border-amber-400/20 bg-zinc-900/60 p-6 shadow-[0_0_0_1px_rgba(255,196,28,0.08)]">
                        <h3 className="text-xl font-semibold mb-4 text-amber-300">
                            🌍 Partidas por Região
                        </h3>
                        {data.matchesByRegion.length > 0 ? (
                            <div className="h-96">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data.matchesByRegion} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                        <XAxis
                                            dataKey="region"
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
                                        <Bar dataKey="count" fill="#8B5CF6" name="Partidas" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-96 flex items-center justify-center text-zinc-500">
                                Nenhum dado disponível. Clique em "Gerar Dados Fake" para testar.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Trends Tab */}
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
                                Nenhum dado disponível. Clique em "Gerar Dados Fake" para testar.
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