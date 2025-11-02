'use client';

import { useState } from 'react';

type GuessDetail = {
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
};

type UserDetails = {
    userId: string;
    totalPoints: number;
    totalGuesses: number;
    correctGuesses: number;
    guessDetails: GuessDetail[];
};

interface UserDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    userName: string;
    channel: string;
}

export default function UserDetailsModal({
    isOpen,
    onClose,
    userId,
    userName,
    channel
}: UserDetailsModalProps) {
    const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Buscar detalhes quando o modal abre
    React.useEffect(() => {
        if (isOpen && userId && channel) {
            fetchUserDetails();
        }
    }, [isOpen, userId, channel]);

    const fetchUserDetails = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/user-details?userId=${userId}&channel=${encodeURIComponent(channel)}`);

            if (!response.ok) {
                throw new Error('Erro ao buscar detalhes do usuário');
            }

            const data = await response.json();
            setUserDetails(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro desconhecido');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'FINISHED': return 'text-blue-400';
            case 'OPEN': return 'text-green-400';
            case 'LOCKED': return 'text-yellow-400';
            default: return 'text-gray-400';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'FINISHED': return 'Finalizada';
            case 'OPEN': return 'Aberta';
            case 'LOCKED': return 'Travada';
            default: return status;
        }
    };

    const getPointsColor = (points: number) => {
        if (points > 0) return 'text-green-400';
        return 'text-gray-400';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-zinc-900 rounded-2xl border border-zinc-700 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-zinc-700">
                    <div>
                        <h2 className="text-2xl font-bold text-zinc-100">
                            📊 Detalhes dos Pontos
                        </h2>
                        <p className="text-zinc-400 mt-1">
                            {userName} no canal @{channel}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                        <span className="text-xl">✕</span>
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
                    {isLoading && (
                        <div className="flex items-center justify-center p-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400"></div>
                            <span className="ml-3 text-zinc-400">Carregando detalhes...</span>
                        </div>
                    )}

                    {error && (
                        <div className="p-6 text-center">
                            <p className="text-red-400">❌ {error}</p>
                            <button
                                onClick={fetchUserDetails}
                                className="mt-4 px-4 py-2 bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors"
                            >
                                Tentar novamente
                            </button>
                        </div>
                    )}

                    {userDetails && (
                        <div className="p-6 space-y-6">
                            {/* Estatísticas */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="bg-zinc-800/50 rounded-lg p-4 text-center">
                                    <div className="text-3xl mb-2">🏆</div>
                                    <div className="text-2xl font-bold text-amber-400">
                                        {userDetails.totalPoints}
                                    </div>
                                    <div className="text-sm text-zinc-400">Pontos Totais</div>
                                </div>

                                <div className="bg-zinc-800/50 rounded-lg p-4 text-center">
                                    <div className="text-3xl mb-2">🎯</div>
                                    <div className="text-2xl font-bold text-green-400">
                                        {userDetails.correctGuesses}
                                    </div>
                                    <div className="text-sm text-zinc-400">Acertos</div>
                                </div>

                                <div className="bg-zinc-800/50 rounded-lg p-4 text-center">
                                    <div className="text-3xl mb-2">📊</div>
                                    <div className="text-2xl font-bold text-blue-400">
                                        {userDetails.totalGuesses}
                                    </div>
                                    <div className="text-sm text-zinc-400">Palpites Totais</div>
                                </div>

                                <div className="bg-zinc-800/50 rounded-lg p-4 text-center">
                                    <div className="text-3xl mb-2">📈</div>
                                    <div className="text-2xl font-bold text-purple-400">
                                        {userDetails.totalGuesses > 0 ?
                                            Math.round((userDetails.correctGuesses / userDetails.totalGuesses) * 100) : 0}%
                                    </div>
                                    <div className="text-sm text-zinc-400">Taxa de Acerto</div>
                                </div>
                            </div>

                            {/* Lista de Palpites */}
                            <div>
                                <h3 className="text-xl font-semibold text-zinc-100 mb-4">
                                    🎯 Histórico de Palpites
                                </h3>

                                {userDetails.guessDetails.length === 0 ? (
                                    <div className="text-center py-8 text-zinc-400">
                                        Nenhum palpite encontrado
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {userDetails.guessDetails.map((guess, index) => (
                                            <div
                                                key={`${guess.matchId}-${index}`}
                                                className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-700/50"
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-sm font-medium text-zinc-300">
                                                            🏆 Rodada {guess.round} • {guess.region}
                                                        </span>
                                                        <span className={`text-xs px-2 py-1 rounded ${getStatusColor(guess.matchStatus)} bg-current/10`}>
                                                            {getStatusLabel(guess.matchStatus)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-zinc-500">🕐</span>
                                                        <span className="text-xs text-zinc-500">
                                                            {guess.createdAt}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <div className="font-medium text-zinc-200 mb-1">
                                                            {guess.homeTeam} vs {guess.awayTeam}
                                                        </div>
                                                        <div className="text-sm text-zinc-400">
                                                            📅 {guess.matchDate}
                                                        </div>
                                                    </div>

                                                    <div className="text-center px-4">
                                                        <div className="text-lg font-bold text-amber-300">
                                                            {guess.userGuess}
                                                        </div>
                                                        <div className="text-xs text-zinc-500">Seu palpite</div>
                                                    </div>

                                                    {guess.actualResult && (
                                                        <div className="text-center px-4">
                                                            <div className={`text-lg font-bold ${guess.isCorrect ? 'text-green-400' : 'text-red-400'
                                                                }`}>
                                                                {guess.actualResult}
                                                            </div>
                                                            <div className="text-xs text-zinc-500">Resultado</div>
                                                        </div>
                                                    )}

                                                    <div className="text-center">
                                                        <div className={`text-xl font-bold ${getPointsColor(guess.pointsEarned)}`}>
                                                            {guess.pointsEarned > 0 ? `+${guess.pointsEarned}` : guess.pointsEarned}
                                                        </div>
                                                        <div className="text-xs text-zinc-500">Pontos</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Adicionar React import
import React from 'react';