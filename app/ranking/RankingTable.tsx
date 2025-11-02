// app/ranking/RankingTable.tsx
'use client';

import { useState } from 'react';
import UserDetailsModal from '@/src/components/UserDetailsModal';

type Row = {
    twitchUserId: string;
    twitchLogin: string | null;
    twitchDisplay: string | null;
    points: number;
    hits: number;
};

interface RankingTableProps {
    rows: Row[];
    channel: string;
}

function Medal({ pos }: { pos: number }) {
    if (pos === 1)
        return (
            <span title="1º" className="mr-2">
                🏆
            </span>
        );
    if (pos === 2)
        return (
            <span title="2º" className="mr-2">
                🥈
            </span>
        );
    if (pos === 3)
        return (
            <span title="3º" className="mr-2">
                🥉
            </span>
        );
    return <span className="w-5 inline-block" />;
}

export default function RankingTable({ rows, channel }: RankingTableProps) {
    const [selectedUser, setSelectedUser] = useState<{
        userId: string;
        userName: string;
    } | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleUserClick = (userId: string, userName: string) => {
        setSelectedUser({ userId, userName });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedUser(null);
    };

    const hasRows = rows.length > 0;

    return (
        <>
            <div className="rounded-2xl border border-amber-400/25 overflow-hidden">
                <div className="bg-zinc-950/60 px-5 py-4 border-b border-amber-400/20">
                    <h2 className="text-xl font-semibold">Classificação Geral</h2>
                    <p className="text-sm text-zinc-400 mt-1">
                        📊 Clique em um participante para ver de onde vêm os pontos
                    </p>
                </div>

                {!hasRows ? (
                    <div className="p-6 text-zinc-400">
                        {channel
                            ? `Ainda não há pontos no ranking para @${channel}.`
                            : `Informe um canal para ver o ranking.`}
                    </div>
                ) : (
                    <div className="divide-y divide-zinc-800">
                        <div className="grid grid-cols-[80px_1fr_120px_120px] px-5 py-3 text-sm text-zinc-400">
                            <div>Posição</div>
                            <div>Participante</div>
                            <div className="text-right">Acertos</div>
                            <div className="text-right">Pontos</div>
                        </div>

                        {rows.map((r, i) => {
                            const pos = i + 1;
                            const isOdd = i % 2 === 0;
                            const top3 = pos <= 3;
                            const userName = r.twitchDisplay || r.twitchLogin || "—";

                            return (
                                <button
                                    key={r.twitchUserId}
                                    onClick={() => handleUserClick(r.twitchUserId, userName)}
                                    className={[
                                        "grid grid-cols-[80px_1fr_120px_120px] items-center px-5 py-3 w-full text-left",
                                        isOdd ? "bg-zinc-950/40" : "bg-zinc-950/20",
                                        top3 ? "bg-amber-400/10" : "",
                                        "hover:bg-zinc-900/60 hover:border-amber-400/30 transition-all duration-200",
                                        "cursor-pointer border border-transparent hover:shadow-lg",
                                    ].join(" ")}
                                >
                                    <div className="font-semibold">
                                        <Medal pos={pos} />
                                        <span className="tabular-nums">{pos}º</span>
                                    </div>
                                    <div className="truncate">
                                        <span className="font-medium">
                                            {userName}
                                        </span>
                                        {r.twitchLogin && (
                                            <span className="ml-2 text-xs text-zinc-500">
                                                @{r.twitchLogin}
                                            </span>
                                        )}
                                        <div className="text-xs text-amber-400/70 mt-1">
                                            📊 Clique para ver detalhes dos pontos
                                        </div>
                                    </div>
                                    <div className="text-right tabular-nums">{r.hits}</div>
                                    <div className="text-right tabular-nums font-semibold text-amber-300">
                                        {r.points}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal de detalhes do usuário */}
            {selectedUser && (
                <UserDetailsModal
                    isOpen={isModalOpen}
                    onClose={closeModal}
                    userId={selectedUser.userId}
                    userName={selectedUser.userName}
                    channel={channel}
                />
            )}
        </>
    );
}